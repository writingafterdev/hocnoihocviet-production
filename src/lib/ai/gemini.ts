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
  'gemini-4-hydrogen', 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3-flash-preview',
  'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite',
  'gemma-4-31b-it',
];

const list = (x?: string) => (x || '').split(',').map((s) => s.trim()).filter(Boolean);
export const geminiKeys = (e: CloudflareEnv) => list(e.GEMINI_API_KEYS || e.GEMINI_API_KEY);
export const geminiModels = (e: CloudflareEnv) => (list(e.GEMINI_MODELS).length ? list(e.GEMINI_MODELS) : DEFAULT_MODELS);

/** model|key-index → time (ms) until which it is skipped. */
const skip = new Map<string, number>();
/** Next midnight in California, when the free tier's daily allowance resets (approximately: UTC−8). */
const nextReset = () => { const d = new Date(Date.now() - 8 * 3600_000); d.setUTCHours(24, 0, 0, 0); return d.getTime() + 8 * 3600_000; };

/**
 * Per model and day: answered, used up (429), failed, tokens and total time. The admin panel's "Mô hình AI" card reads
 * it. The table is created on first use (no migration needed); writing is best effort and never breaks a call.
 */
let tableReady: Promise<unknown> | null = null;
const USE_TABLE = 'create table if not exists ai_model_use (day text not null, model text not null, ok integer not null default 0, limited integer not null default 0, failed integer not null default 0, inputTokens integer not null default 0, outputTokens integer not null default 0, ms integer not null default 0, lastStatus text, lastAt integer, primary key (day, model))';
const vnToday = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
export async function logModelUse(e: CloudflareEnv, model: string, outcome: 'ok' | 'limited' | 'failed', o: { input?: number; output?: number; ms?: number; status?: string } = {}) {
  try {
    if (!e.DB) return;
    tableReady = tableReady || e.DB.prepare(USE_TABLE).run();
    await tableReady;
    await e.DB.prepare('insert into ai_model_use (day, model, ok, limited, failed, inputTokens, outputTokens, ms, lastStatus, lastAt) values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10) on conflict (day, model) do update set ok = ok + ?3, limited = limited + ?4, failed = failed + ?5, inputTokens = inputTokens + ?6, outputTokens = outputTokens + ?7, ms = ms + ?8, lastStatus = ?9, lastAt = ?10')
      .bind(vnToday(), model, outcome === 'ok' ? 1 : 0, outcome === 'limited' ? 1 : 0, outcome === 'failed' ? 1 : 0, o.input || 0, o.output || 0, o.ms || 0, o.status || outcome, Date.now()).run();
  } catch { tableReady = null; }
}
export async function modelUse(e: CloudflareEnv, fromDay: string) {
  tableReady = tableReady || e.DB.prepare(USE_TABLE).run();
  await tableReady;
  return (await e.DB.prepare('select * from ai_model_use where day >= ? order by day').bind(fromDay).all<{ day: string; model: string; ok: number; limited: number; failed: number; inputTokens: number; outputTokens: number; ms: number; lastStatus: string | null; lastAt: number | null }>()).results;
}

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
      const t0 = Date.now();
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
        await logModelUse(e, model, 'failed', { ms: Date.now() - t0, status: timedOut ? 'timeout' : 'network' });
        if (timedOut) throw new GeminiError('timeout', model);
        last = model + ':network';
        continue;
      }
      if (res.ok) {
        const data = await res.json() as { choices?: { message?: { content?: string }; finish_reason?: string }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
        const c = data.choices?.[0];
        const text = c?.message?.content || '';
        if (!text) { last = model + ':empty'; skip.set(id, Date.now() + 60_000); await logModelUse(e, model, 'failed', { ms: Date.now() - t0, status: 'empty' }); continue; }
        await logModelUse(e, model, 'ok', { input: data.usage?.prompt_tokens, output: data.usage?.completion_tokens, ms: Date.now() - t0, status: '200' });
        return { text, stop: c?.finish_reason === 'length' ? 'max_tokens' : 'end_turn', input: data.usage?.prompt_tokens || 0, output: data.usage?.completion_tokens || 0, model };
      }
      const detail = (await res.text().catch(() => '')).slice(0, 400);
      last = model + ':' + res.status;
      console.warn('gemini_skip', model, k, res.status, detail.slice(0, 200));
      // Keep Google's own message with the status, so the admin card can say why (bad key, unknown model, used up…).
      const why = (detail.match(/"message"\s*:\s*"([^"]+)/)?.[1] || '').slice(0, 140);
      await logModelUse(e, model, res.status === 429 ? 'limited' : 'failed', { ms: Date.now() - t0, status: res.status + (why ? ': ' + why : '') });
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

/**
 * Admin "Kiểm tra từng mô hình": one tiny request per model with the first key, to see which ids work and which are used
 * up right now. Each takes one request from that model's free allowance. Never sends student data.
 */
export async function probeModels(e: CloudflareEnv): Promise<{ model: string; status: string; ms: number; note: string }[]> {
  const key = geminiKeys(e)[0];
  if (!key) return [];
  return Promise.all(geminiModels(e).map(async (model) => {
    const t0 = Date.now();
    try {
      const res = await fetch(URL_CHAT, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Reply with the single word OK.' }], max_tokens: 20 }),
        signal: AbortSignal.timeout(30_000),
      });
      const body = (await res.text().catch(() => '')).slice(0, 300);
      const note = res.ok ? '' : (body.match(/"message"\s*:\s*"([^"]+)/)?.[1] || body).slice(0, 160);
      return { model, status: res.ok ? 'ok' : String(res.status), ms: Date.now() - t0, note };
    } catch (err) {
      return { model, status: 'error', ms: Date.now() - t0, note: err instanceof Error ? err.message.slice(0, 160) : 'error' };
    }
  }));
}
