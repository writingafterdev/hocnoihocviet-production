import Anthropic from '@anthropic-ai/sdk';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { METHOD } from './method';

export const MODEL = 'claude-opus-5-5';

export type AiErrorCode = 'not_configured' | 'limit' | 'refused' | 'bad_output' | 'upstream';
export class AiError extends Error {
  constructor(public code: AiErrorCode, message?: string) { super(message || code); }
}

export interface Usage { input: number; output: number }

/** Daily limits per student (Vietnam calendar day). */
export const DAILY_LIMIT = { chain: 10, essay: 5, translate: 60 } as const;
export type AiKind = keyof typeof DAILY_LIMIT;

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
    const client = new Anthropic({ apiKey: e.ANTHROPIC_API_KEY, ...(e.AI_GATEWAY_URL ? { baseURL: e.AI_GATEWAY_URL } : {}), maxRetries: 2 });
    // Streaming keeps the connection busy during long thinking; we only need the final message.
    const msg = await client.beta.messages.stream({
      model: MODEL,
      max_tokens: maxTokens,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: { effort, ...(schema ? { format: { type: 'json_schema', schema } } : {}) },
      // The method text is identical for every request, so it is cached; the task text follows it.
      system: grounded
        ? [{ type: 'text', text: METHOD, cache_control: { type: 'ephemeral' } }, { type: 'text', text: task }]
        : [{ type: 'text', text: task }],
      messages: [{ role: 'user', content: input }],
    }).finalMessage();
    await quota.record({ input: (msg.usage.input_tokens || 0) + (msg.usage.cache_read_input_tokens || 0) + (msg.usage.cache_creation_input_tokens || 0), output: msg.usage.output_tokens || 0 }).catch(() => {});
    if (msg.stop_reason === 'refusal') throw new AiError('refused');
    if (msg.stop_reason === 'max_tokens') throw new AiError('bad_output', 'max_tokens');
    const text = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
    if (!schema) return text.trim() as T;
    try { return JSON.parse(text) as T; } catch { throw new AiError('bad_output', 'invalid_json'); }
  } catch (err) {
    await quota.refund().catch(() => {});
    if (err instanceof AiError) throw err;
    console.error('claude_call_failed', kind, err instanceof Anthropic.APIError ? (err.status ?? 'network') + ' ' + err.message : err);
    throw new AiError('upstream');
  }
}

const STATUS: Record<AiErrorCode, number> = { not_configured: 503, limit: 429, refused: 422, bad_output: 502, upstream: 502 };

/** JSON error response for a failed AI route. */
export function aiErrorResponse(err: unknown) {
  const code: AiErrorCode = err instanceof AiError ? err.code : 'upstream';
  if (!(err instanceof AiError)) console.error('ai_route_failed', err);
  return Response.json({ error: code }, { status: STATUS[code], headers: { 'Cache-Control': 'no-store' } });
}
