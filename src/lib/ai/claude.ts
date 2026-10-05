import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { METHOD } from './method';

export const MODEL = 'claude-opus-5-5';

export type AiErrorCode = 'not_configured' | 'limit' | 'refused' | 'bad_output' | 'upstream' | 'timeout';
export class AiError extends Error {
  constructor(public code: AiErrorCode, message?: string) { super(message || code); }
}

export interface Usage { input: number; output: number }

/** Daily limits per student (Vietnam calendar day). */
export const DAILY_LIMIT = { chain: 10, essay: 5, translate: 60, vocab: 30 } as const;
export type AiKind = keyof typeof DAILY_LIMIT;

/** Per-attempt time limit for each kind of call (ms). The browser gives up a little after two attempts. */
const TIMEOUT_MS: Record<AiKind, number> = { chain: 120_000, essay: 150_000, translate: 30_000, vocab: 45_000 };

const today = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

async function env() {
  return (await getCloudflareContext({ async: true })).env;
}

/** Takes one use from today's allowance, or throws AiError('limit'). Returns a refund for failed calls. */
async function reserve(userId: string, kind: AiKind) {
  const { DB } = await env();
  const day = today();
  const res = await DB.prepare('insert into ai_usage (userId, day, kind, count) values (?, ?, ?, 1) on conflict (userId, day, kind) do update set count = count + 1 where ai_usage.count < ?')
    .bind(userId, day, kind, DAILY_LIMIT[kind]).run();
  if (!res.meta.changes) throw new AiError('limit');
  return {
    refund: () => DB.prepare('update ai_usage set count = count - 1 where userId = ? and day = ? and kind = ? and count > 0').bind(userId, day, kind).run(),
    record: (u: Usage) => DB.prepare('update ai_usage set inputTokens = inputTokens + ?, outputTokens = outputTokens + ? where userId = ? and day = ? and kind = ?').bind(u.input, u.output, userId, day, kind).run(),
  };
}

/** How many uses are left today, per kind. */
export async function remaining(userId: string): Promise<Record<AiKind, number>> {
  const { DB } = await env();
  const { results } = await DB.prepare('select kind, count from ai_usage where userId = ? and day = ?').bind(userId, today()).all<{ kind: AiKind; count: number }>();
  const left = { ...DAILY_LIMIT } as Record<AiKind, number>;
  results.forEach((r) => { if (r.kind in left) left[r.kind] = Math.max(0, DAILY_LIMIT[r.kind] - r.count); });
  return left;
}

export async function aiConfigured() {
  return !!(await env()).ANTHROPIC_API_KEY;
}

interface Ask {
  userId: string;
  kind: AiKind;
  /** Role and output rules for this task; appended after the shared method text. */
  task: string;
  /** The student's work, already serialised. */
  input: string;
  schema?: Record<string, unknown>;
  effort?: 'low' | 'medium' | 'high';
  maxTokens?: number;
  /** false = send only `task` as the system prompt, without the book's method (e.g. the translator). */
  grounded?: boolean;
}

/**
 * One Claude call grounded in the book. With `schema`, returns the parsed JSON; otherwise the text.
 * Counts against the student's daily allowance (refunded if the call fails).
 */
export async function ask<T = string>({ userId, kind, task, input, schema, effort = 'medium', maxTokens = 16000, grounded = true }: Ask): Promise<T> {
  const e = await env();
  if (!e.ANTHROPIC_API_KEY) throw new AiError('not_configured');
  const quota = await reserve(userId, kind);
  try {
    const model = e.AI_MODEL || MODEL;
    const claude = model.startsWith('claude-');
    // Hard ceiling per attempt, one retry: a stuck provider must fail fast enough for the browser to show an error.
    const client = new Anthropic({ apiKey: e.ANTHROPIC_API_KEY, ...(e.AI_BASE_URL ? { baseURL: e.AI_BASE_URL } : {}), maxRetries: 1, timeout: TIMEOUT_MS[kind] });
    const started = Date.now();
    // The method text is identical for every request, so it is cached; the task text follows it.
    const system = (extra: string) => grounded
      ? [{ type: 'text' as const, text: METHOD, cache_control: { type: 'ephemeral' as const } }, { type: 'text' as const, text: task + extra }]
      : [{ type: 'text' as const, text: task + extra }];
    const messages = [{ role: 'user' as const, content: input }];
    // Streaming keeps the connection busy during long thinking; we only need the final message.
    const msg = claude
      ? await client.beta.messages.stream({
        model, max_tokens: maxTokens, messages, system: system(''),
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        thinking: { type: 'adaptive' },
        output_config: { effort, ...(schema ? { format: { type: 'json_schema', schema } } : {}) },
      }).finalMessage()
      // Other models behind an Anthropic-compatible API (e.g. ModelScope for testing): plain Messages API only,
      // so the JSON shape is asked for in the prompt instead of enforced.
      : await client.messages.stream({
        model, max_tokens: Math.min(maxTokens, 8192), messages,
        system: system(schema ? '\n\nOUTPUT FORMAT: reply with ONE JSON object and nothing else (no markdown, no code fences, no text before or after). Inside string values never use the straight double quote character; write quotations with “ ” instead. It must match this JSON Schema exactly:\n' + JSON.stringify(schema) : ''),
      }).finalMessage();
    console.log('ai_call', kind, model, (Date.now() - started) + 'ms', 'in=' + (msg.usage.input_tokens || 0), 'out=' + (msg.usage.output_tokens || 0), msg.stop_reason);
    await quota.record({ input: (msg.usage.input_tokens || 0) + (msg.usage.cache_read_input_tokens || 0) + (msg.usage.cache_creation_input_tokens || 0), output: msg.usage.output_tokens || 0 }).catch(() => {});
    if (msg.stop_reason === 'refusal') throw new AiError('refused');
    const text = (msg.content as { type: string; text?: string }[]).map((b) => (b.type === 'text' ? b.text : '')).join('');
    const bad = (why: string) => { console.error('ai_bad_output', kind, model, why, msg.stop_reason, 'out=' + (msg.usage.output_tokens || 0), JSON.stringify(text.slice(0, 300))); return new AiError('bad_output', why); };
    if (msg.stop_reason === 'max_tokens') {
      // Non-Claude models cap output lower; a long review can run out near the end. Close the JSON and keep
      // what arrived if every top-level field is there (only the last few comments are lost).
      const kept = !claude && schema ? salvage(text, schema) : null;
      if (!kept) throw bad('max_tokens');
      console.warn('ai_truncated_kept', kind, model, 'out=' + (msg.usage.output_tokens || 0));
      return kept as T;
    }
    if (!schema) return text.trim() as T;
    try { return JSON.parse(claude ? text : jsonPart(text)) as T; } catch { /* try a repair below */ }
    // Models without enforced JSON (e.g. Qwen) sometimes leave quotes unescaped or add trailing commas.
    try { return JSON.parse(jsonrepair(jsonPart(text))) as T; } catch { throw bad('invalid_json'); }
  } catch (err) {
    await quota.refund().catch(() => {});
    if (err instanceof AiError) throw err;
    if (err instanceof Anthropic.APIConnectionTimeoutError) { console.error('ai_call_timeout', kind); throw new AiError('timeout'); }
    console.error('ai_call_failed', kind, err instanceof Anthropic.APIError ? (err.status ?? 'network') + ' ' + err.message : err);
    throw new AiError('upstream');
  }
}

/** Repairs a reply cut off mid-JSON; null unless every required top-level field survived. */
function salvage(text: string, schema: Record<string, unknown>): unknown {
  const a = text.indexOf('{');
  if (a < 0) return null;
  try {
    const out = JSON.parse(jsonrepair(text.slice(a).replace(/```\s*$/, '')));
    const req = (schema.required as string[]) || [];
    if (!out || typeof out !== 'object' || !req.every((k) => k in out)) return null;
    // The item that was being written when the reply stopped is incomplete: drop it.
    const last = Object.keys(out).pop();
    if (Array.isArray(out[last])) out[last].pop();
    return out;
  } catch { return null; }
}

/** The JSON object inside a reply that may carry code fences or stray text (non-Claude models). */
function jsonPart(text: string) {
  const t = text.replace(/```(?:json)?/gi, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  return a >= 0 && b > a ? t.slice(a, b + 1) : t;
}

const STATUS: Record<AiErrorCode, number> = { not_configured: 503, limit: 429, refused: 422, bad_output: 502, upstream: 502, timeout: 504 };

/** JSON error response for a failed AI route. */
export function aiErrorResponse(err: unknown) {
  const code: AiErrorCode = err instanceof AiError ? err.code : 'upstream';
  if (!(err instanceof AiError)) console.error('ai_route_failed', err);
  // `detail` (e.g. max_tokens, invalid_json) shows up in the browser's network tab, for debugging.
  const detail = err instanceof AiError && err.message !== code ? err.message : undefined;
  return Response.json({ error: code, ...(detail ? { detail } : {}) }, { status: STATUS[code], headers: { 'Cache-Control': 'no-store' } });
}
