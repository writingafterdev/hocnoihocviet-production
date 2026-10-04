import { getCloudflareContext } from '@opennextjs/cloudflare';
import { findPrompt } from '@/content/prompts';
import type { Attempt } from '@/features/attempts/store';

const MAX_BYTES = 512 * 1024;

type Row = { data: string };

export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

async function db() {
  return (await getCloudflareContext({ async: true })).env.DB;
}

export async function getAttempt(userId: string, id: string): Promise<Attempt | null> {
  const row = await (await db()).prepare('select data from attempt where id = ? and userId = ?').bind(id, userId).first<Row>();
  return row ? (JSON.parse(row.data) as Attempt) : null;
}

export async function listAttempts(userId: string, promptId?: string, limit = 50): Promise<Attempt[]> {
  const d = await db();
  const stmt = promptId
    ? d.prepare('select data from attempt where userId = ? and promptId = ? order by updatedAt desc limit ?').bind(userId, promptId, limit)
    : d.prepare('select data from attempt where userId = ? order by updatedAt desc limit ?').bind(userId, limit);
  const { results } = await stmt.all<Row>();
  return results.map((r) => JSON.parse(r.data) as Attempt);
}

/** Insert or update; never touches another user's attempt. Returns an error message, or null when saved. */
export async function saveAttempt(userId: string, id: string, body: string): Promise<string | null> {
  if (body.length > MAX_BYTES) return 'too_large';
  let a: Attempt;
  try { a = JSON.parse(body); } catch { return 'invalid_json'; }
  if (!a || a.id !== id || typeof a.promptId !== 'string' || !findPrompt(a.promptId) || !Array.isArray(a.chains) || typeof a.essay !== 'object') return 'invalid_attempt';
  const now = Date.now();
  const createdAt = Number(a.createdAt) || now;
  const updatedAt = Number(a.updatedAt) || now;
  const res = await (await db())
    .prepare('insert into attempt (id, userId, promptId, data, createdAt, updatedAt) values (?, ?, ?, ?, ?, ?) on conflict(id) do update set data = excluded.data, updatedAt = excluded.updatedAt where attempt.userId = excluded.userId')
    .bind(id, userId, a.promptId, body, createdAt, updatedAt)
    .run();
  return res.meta.changes ? null : 'not_found';
}
