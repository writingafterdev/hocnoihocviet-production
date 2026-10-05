import { parseReply } from './json';
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
    record: (u: Usage) => recordTokens(DB, userId, kind, u, day),
  };
}

function recordTokens(DB: D1Database, userId: string, kind: AiKind, u: Usage, day = today()) {
  return DB.prepare('update ai_usage set inputTokens = inputTokens + ?, outputTokens = outputTokens + ? where userId = ? and day = ? and kind = ?').bind(u.input, u.output, userId, day, kind).run();
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
  /** false = don't take a use from the allowance: the caller already did, via `startTicket` (one essay = several calls). */
  counted?: boolean;
}

const TICKET_MS = 15 * 60_000;

/**
 * Takes one use of the allowance for a request the browser sends in parts (each part is its own Worker
 * request, so each gets its own CPU budget). Returns a ticket; each part can be claimed with it once.
 */
export async function startTicket(userId: string, kind: AiKind) {
  const { DB, ANTHROPIC_API_KEY } = await env();
  if (!ANTHROPIC_API_KEY) throw new AiError('not_configured');
  await reserve(userId, kind);
  const id = crypto.randomUUID();
  await DB.batch([
    DB.prepare('delete from ai_ticket where created < ?').bind(Date.now() - 24 * 3600_000),
    DB.prepare('insert into ai_ticket (id, userId, day, kind, created) values (?, ?, ?, ?, ?)').bind(id, userId, today(), kind, Date.now()),
  ]);
  return id;
}

/**
 * Claims one part of a ticket; false if the ticket is unknown, someone else's, expired, or the part was
 * already claimed twice (a part may be retried once, e.g. after a failed criterion).
 */
export async function claimTicket(userId: string, ticket: string, part: string) {
  const { DB } = await env();
  const tag = '|' + part + ';';
  const res = await DB.prepare("update ai_ticket set used = used || ?1 where id = ?2 and userId = ?3 and created > ?4 and (length(used) - length(replace(used, ?1, ''))) < 2 * length(?1)")
    .bind(tag, ticket, userId, Date.now() - TICKET_MS).run();
  return !!res.meta.changes;
}

/** Gives the ticket's use back (once), e.g. when the essay could not be scored. */
export async function refundTicket(userId: string, ticket: string) {
  const { DB } = await env();
  const row = await DB.prepare("update ai_ticket set used = used || '|refunded' where id = ? and userId = ? and instr(used, '|refunded') = 0 returning day, kind")
    .bind(ticket, userId).first<{ day: string; kind: string }>();
  if (row) await DB.prepare('update ai_usage set count = count - 1 where userId = ? and day = ? and kind = ? and count > 0').bind(userId, row.day, row.kind).run();
}

/**
 * One Claude call grounded in the book. With `schema`, returns the parsed JSON; otherwise the text.
 * Counts against the student's daily allowance (refunded if the call fails).
 */
export async function ask<T = string>({ userId, kind, task, input, schema, effort = 'medium', maxTokens = 16000, grounded = true, counted = true }: Ask): Promise<T> {
  const e = await env();
  if (!e.ANTHROPIC_API_KEY) throw new AiError('not_configured');
  const quota = counted ? await reserve(userId, kind) : null;
  const { DB } = e;
  try {
    const model = e.AI_MODEL || MODEL;
    const claude = model.startsWith('claude-');
    const started = Date.now();
    // One plain request, no streaming: the reply arrives as one JSON document, which costs the Worker far less
    // CPU than parsing hundreds of stream events (Workers Free allows 10 ms of CPU per request; waiting is free).
    const msg = await callMessages(e, kind, messagesBody(model, { task, input, schema, effort, maxTokens, grounded }), claude ? BETA : '');
    console.log('ai_call', kind, model, (Date.now() - started) + 'ms', 'in=' + (msg.usage.input_tokens || 0), 'out=' + (msg.usage.output_tokens || 0), msg.stop_reason);
    const used = { input: (msg.usage.input_tokens || 0) + (msg.usage.cache_read_input_tokens || 0) + (msg.usage.cache_creation_input_tokens || 0), output: msg.usage.output_tokens || 0 };
    await (quota ? quota.record(used) : recordTokens(DB, userId, kind, used)).catch(() => {});
    if (msg.stop_reason === 'refusal') throw new AiError('refused');
    const text = (msg.content as { type: string; text?: string }[]).map((b) => (b.type === 'text' ? b.text : '')).join('');
    const bad = (why: string) => { console.error('ai_bad_output', kind, model, why, msg.stop_reason, 'out=' + (msg.usage.output_tokens || 0), JSON.stringify(text.slice(0, 300))); return new AiError('bad_output', why); };
    if (!schema) {
      if (msg.stop_reason === 'max_tokens') throw bad('max_tokens');
      return text.trim() as T;
    }
    if (msg.stop_reason === 'max_tokens' && claude) throw bad('max_tokens');
    try {
      const out = parseReply<T>(text, msg.stop_reason, (schema.required as string[]) || []);
      // Non-Claude models cap output lower; a long reply can run out near the end and is kept if complete enough.
      if (msg.stop_reason === 'max_tokens') console.warn('ai_truncated_kept', kind, model, 'out=' + (msg.usage.output_tokens || 0));
      return out;
    } catch (err) { throw bad(err instanceof Error ? err.message : 'invalid_json'); }
  } catch (err) {
    if (quota) await quota.refund().catch(() => {});
    if (err instanceof AiError) throw err;
    console.error('ai_call_failed', kind, err);
    throw new AiError('upstream');
  }
}

const BETA = 'server-side-fallback-2026-07-01';

/** The Messages API request: the book's method (cached) + the task as system prompt, the student's work as input. */
function messagesBody(model: string, { task, input, schema, effort = 'medium', maxTokens = 16000, grounded = true }: Pick<Ask, 'task' | 'input' | 'schema' | 'effort' | 'maxTokens' | 'grounded'>): Record<string, unknown> {
  const system = (extra: string) => grounded
    ? [{ type: 'text', text: METHOD, cache_control: { type: 'ephemeral' } }, { type: 'text', text: task + extra }]
    : [{ type: 'text', text: task + extra }];
  const messages = [{ role: 'user', content: input }];
  return model.startsWith('claude-')
    ? {
      model, max_tokens: maxTokens, messages, system: system(''),
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: { effort, ...(schema ? { format: { type: 'json_schema', schema } } : {}) },
    }
    // Other models behind an Anthropic-compatible API (e.g. Model Studio for testing): plain Messages API only,
    // so the JSON shape is asked for in the prompt instead of enforced.
    : {
      model, max_tokens: Math.min(maxTokens, 8192), messages,
      system: system(schema ? '\n\nOUTPUT FORMAT: reply with ONE JSON object and nothing else (no markdown, no code fences, no text before or after). Inside string values never use the straight double quote character; write quotations with “ ” instead. It must match this JSON Schema exactly:\n' + JSON.stringify(schema) : ''),
    };
}

/**
 * A streamed call whose stream goes to the browser untouched: the Worker only waits for the response to
 * start (no CPU while it streams), and the browser reads the events and parses the JSON. Used for long
 * replies, which must stream: without bytes for about 100 s the provider's gateway drops the request (524).
 * The allowance is taken by the caller (ticket). Token counts aren't recorded: the Worker never reads the reply.
 */
export async function askStream({ kind, task, input, schema, effort = 'medium', maxTokens = 16000, grounded = true }: Omit<Ask, 'userId' | 'counted'>): Promise<Response> {
  const e = await env();
  if (!e.ANTHROPIC_API_KEY) throw new AiError('not_configured');
  const model = e.AI_MODEL || MODEL;
  const url = (e.AI_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '') + '/v1/messages';
  const headers: Record<string, string> = { 'content-type': 'application/json', 'x-api-key': e.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', ...(model.startsWith('claude-') ? { 'anthropic-beta': BETA } : {}) };
  const payload = JSON.stringify({ ...messagesBody(model, { task, input, schema, effort, maxTokens, grounded }), stream: true });
  for (let attempt = 0; ; attempt++) {
    // The time limit covers the start of the response only; once it streams, the browser decides how long to wait.
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 60_000);
    let res: Response;
    try {
      res = await fetch(url, { method: 'POST', headers, body: payload, signal: ctl.signal });
    } catch (err) {
      if (attempt < 1 && !ctl.signal.aborted) continue;
      console.error(ctl.signal.aborted ? 'ai_stream_timeout' : 'ai_stream_failed', kind, err instanceof Error ? err.message : err);
      throw new AiError(ctl.signal.aborted ? 'timeout' : 'upstream');
    } finally {
      clearTimeout(timer);
    }
    if (res.ok && res.body) {
      console.log('ai_stream', kind, model);
      return new Response(res.body, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store' } });
    }
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    if (attempt < 1 && (res.status === 429 || res.status >= 500)) { await new Promise((r) => setTimeout(r, 1000)); continue; }
    console.error('ai_stream_failed', kind, res.status, detail);
    throw new AiError('upstream', 'http_' + res.status);
  }
}

interface Message {
  content: { type: string; text?: string }[];
  stop_reason: string;
  usage: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number };
}

/** POST /v1/messages with a time limit per attempt and one retry on network errors, 429 and 5xx. */
async function callMessages(e: CloudflareEnv, kind: AiKind, body: Record<string, unknown>, beta: string): Promise<Message> {
  const url = (e.AI_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '') + '/v1/messages';
  const headers: Record<string, string> = { 'content-type': 'application/json', 'x-api-key': e.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', ...(beta ? { 'anthropic-beta': beta } : {}) };
  const payload = JSON.stringify(body);
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { method: 'POST', headers, body: payload, signal: AbortSignal.timeout(TIMEOUT_MS[kind]) });
    } catch (err) {
      const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
      if (attempt < 1 && !timedOut) continue;
      console.error(timedOut ? 'ai_call_timeout' : 'ai_call_failed', kind, err instanceof Error ? err.message : err);
      throw new AiError(timedOut ? 'timeout' : 'upstream');
    }
    if (res.ok) return (await res.json()) as Message;
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    if (attempt < 1 && (res.status === 429 || res.status >= 500)) { await new Promise((r) => setTimeout(r, 1000)); continue; }
    console.error('ai_call_failed', kind, res.status, detail);
    throw new AiError('upstream', 'http_' + res.status);
  }
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
