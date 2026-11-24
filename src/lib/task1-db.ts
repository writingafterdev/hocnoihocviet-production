import { getCloudflareContext } from '@opennextjs/cloudflare';
import { findTask1Prompt } from '@/content/task1';
import type { Task1Attempt } from '@/features/task1/store';

const MAX_BYTES = 512 * 1024;
type Row = { data: string };

async function db() {
  return (await getCloudflareContext({ async: true })).env.DB;
}

export async function getTask1Attempt(userId: string, id: string): Promise<Task1Attempt | null> {
  const row = await (await db()).prepare('select data from task1_attempt where id = ? and userId = ?').bind(id, userId).first<Row>();
  return row ? (JSON.parse(row.data) as Task1Attempt) : null;
}

export async function listTask1Attempts(userId: string, promptId?: string, limit = 50): Promise<Task1Attempt[]> {
  const d = await db();
  const stmt = promptId
    ? d.prepare('select data from task1_attempt where userId = ? and promptId = ? order by updatedAt desc limit ?').bind(userId, promptId, limit)
    : d.prepare('select data from task1_attempt where userId = ? order by updatedAt desc limit ?').bind(userId, limit);
  const { results } = await stmt.all<Row>();
  return results.map((r) => JSON.parse(r.data) as Task1Attempt);
}

/** Insert or update; never touches another user's attempt. Returns an error message, or null when saved. */
export async function saveTask1Attempt(userId: string, id: string, body: string): Promise<string | null> {
  if (body.length > MAX_BYTES) return 'too_large';
  let a: Task1Attempt;
  try { a = JSON.parse(body); } catch { return 'invalid_json'; }
  if (!a || a.id !== id || typeof a.promptId !== 'string' || !findTask1Prompt(a.promptId) || !Array.isArray(a.found)) return 'invalid_attempt';
  const now = Date.now();
  const res = await (await db())
    .prepare('insert into task1_attempt (id, userId, promptId, data, createdAt, updatedAt) values (?, ?, ?, ?, ?, ?) on conflict(id) do update set data = excluded.data, updatedAt = excluded.updatedAt where task1_attempt.userId = excluded.userId')
    .bind(id, userId, a.promptId, body, Number(a.createdAt) || now, Number(a.updatedAt) || now)
    .run();
  return res.meta.changes ? null : 'not_found';
}
