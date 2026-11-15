/**
 * Google AI Studio (Gemini API) as the AI provider, through its OpenAI-compatible endpoint.
 *
 * The free tier gives each model its own small allowance (requests per minute and per day), so a call walks a list of
 * models, and of API keys when several are set: a model that answers 429 (used up), 404 (unknown id) or a server error
 * is skipped for a while and the next one is tried. The skip list lives in this Worker instance only; a fresh instance
 * starts again from the top, which costs at most one refused request per used-up model.
 */

export interface GeminiReply { text: string; stop: 'end_turn' | 'max_tokens'; input: number; output: number; model: string }

const URL_CHAT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

/**
 * Tried in this order: Gemini 4 Hydrogen and the stronger Flash models first (about 20 requests a day each on the free tier), then the Flash
 * Lite models (about 500 a day), then Gemma (about 14,400 a day). Ids as listed in Google's Gemini API docs (Nov 2026).
 * Override with GEMINI_MODELS (comma-separated ids).
 */
export const DEFAULT_MODELS = [
  'gemini-4-hydrogen', 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash',
  'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite',
  'gemma-4-31b-it',
];

const list = (x?: string) => (x || '').split(',').map((s) => s.trim()).filter(Boolean);
export const geminiKeys = (e: CloudflareEnv) => list(e.GEMINI_API_KEYS || e.GEMINI_API_KEY);
export const geminiModels = (e: CloudflareEnv) => (list(e.GEMINI_MODELS).length ? list(e.GEMINI_MODELS) : DEFAULT_MODELS);

/** model|key-index → time (ms) until which it is skipped. */
const skip = new Map<string, number>();
/** Next midnight in California, when the free tier's daily allowance resets (approximately: UTC−8). */
const nextReset = () => { const d = new Date(Date.now() - 8 * 3600_000); d.setUTCHours(24, 0, 0, 0); return d.getTime() + 8 * 3600_000; };

export class GeminiError extends Error {
  code: 'timeout' | 'upstream';
  constructor(code: 'timeout' | 'upstream', message: string) { super(message); this.code = code; }
}

/**
 * One chat call, rotating through models and keys until one answers. `system` is the full system prompt (Gemma takes it
 * inside the user message, since it has no system role). Throws GeminiError when every model and key failed.
 */
export async function callGemini(e: CloudflareEnv, { system, input, maxTokens, timeoutMs }: { system: string; input: string; maxTokens: number; timeoutMs: number }): Promise<GeminiReply> {
  const keys = geminiKeys(e), models = geminiModels(e);
  const deadline = Date.now() + timeoutMs;
  let last = 'no_model';
  for (const model of models) {
    for (let k = 0; k < keys.length; k++) {
      const id = model + '|' + k;
      if ((skip.get(id) || 0) > Date.now()) continue;
      const left = deadline - Date.now();
      if (left < 3000) throw new GeminiError('timeout', last);
      const gemma = model.startsWith('gemma');
      const messages = gemma ? [{ role: 'user', content: system + '\n\n---\n\n' + input }] : [{ role: 'system', content: system }, { role: 'user', content: input }];
      let res: Response;
      try {
        res = await fetch(URL_CHAT, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: 'Bearer ' + keys[k] },
          body: JSON.stringify({ model, messages, max_tokens: Math.min(maxTokens, gemma ? 8192 : 32768) }),
          signal: AbortSignal.timeout(left),
        });
      } catch (err) {
        const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
        console.error('gemini_failed', model, k, timedOut ? 'timeout' : err instanceof Error ? err.message : err);
        if (timedOut) throw new GeminiError('timeout', model);
        last = model + ':network';
        continue;
      }
      if (res.ok) {
        const data = await res.json() as { choices?: { message?: { content?: string }; finish_reason?: string }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
        const c = data.choices?.[0];
        const text = c?.message?.content || '';
        if (!text) { last = model + ':empty'; skip.set(id, Date.now() + 60_000); continue; }
        return { text, stop: c?.finish_reason === 'length' ? 'max_tokens' : 'end_turn', input: data.usage?.prompt_tokens || 0, output: data.usage?.completion_tokens || 0, model };
      }
      const detail = (await res.text().catch(() => '')).slice(0, 400);
      last = model + ':' + res.status;
      console.warn('gemini_skip', model, k, res.status, detail.slice(0, 200));
      if (res.status === 429) skip.set(id, /per.?day|PerDay|daily/i.test(detail) ? nextReset() : Date.now() + 60_000);
      else if (res.status === 404 || res.status === 400) skip.set(id, Date.now() + 6 * 3600_000); // unknown or unsupported model id
      else if (res.status === 401 || res.status === 403) { for (const m of models) skip.set(m + '|' + k, Date.now() + 6 * 3600_000); } // bad key
      else skip.set(id, Date.now() + 30_000); // 5xx: busy, try the next one
    }
  }
  throw new GeminiError('upstream', 'all_models_failed:' + last);
}

/**
 * A long call (essay grading) as the event stream the browser already reads (Anthropic's format): the response starts
 * at once and sends a keep-alive comment every 15 s while Gemini works, then the whole reply as one text delta.
 */
export function streamGemini(e: CloudflareEnv, args: { system: string; input: string; maxTokens: number; timeoutMs: number }): Response {
  const enc = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const w = writable.getWriter();
  const send = (ev: unknown) => w.write(enc.encode('data: ' + JSON.stringify(ev) + '\n\n'));
  const ping = setInterval(() => { w.write(enc.encode(': ping\n\n')).catch(() => {}); }, 15_000);
  (async () => {
    try {
      const r = await callGemini(e, args);
      console.log('ai_stream', 'gemini', r.model, 'in=' + r.input, 'out=' + r.output);
      await send({ type: 'content_block_delta', delta: { type: 'text_delta', text: r.text } });
      await send({ type: 'message_delta', delta: { stop_reason: r.stop } });
    } catch (err) {
      console.error('ai_stream_failed', 'gemini', err instanceof Error ? err.message : err);
      await send({ type: 'error' }).catch(() => {});
    } finally {
      clearInterval(ping);
      await w.close().catch(() => {});
    }
  })();
  return new Response(readable, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store' } });
}
