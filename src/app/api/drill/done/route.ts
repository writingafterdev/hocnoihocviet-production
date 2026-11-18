import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getUser } from '@/lib/auth';
import { findStatement } from '@/content/statements';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const db = async () => (await getCloudflareContext({ async: true })).env.DB;

/** Chứng minh nhanh: the ids of the statements the student has finished. */
export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const rows = (await (await db()).prepare('select "statementId" from "drill_done" where "userId" = ?').bind(user.id).all<{ statementId: string }>()).results;
  return json({ ids: rows.map((r) => r.statementId) });
}

/** { statementId } → marks it finished (its mạch ý passed Kiểm tra). Only the app's own statements are accepted. */
export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  let body: { statementId?: unknown };
  try { body = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  const id = typeof body.statementId === 'string' ? body.statementId : '';
  if (!findStatement(id)) return json({ error: 'invalid' }, 400);
  await (await db()).prepare('insert into "drill_done" ("userId", "statementId", "doneAt") values (?, ?, ?) on conflict ("userId", "statementId") do nothing').bind(user.id, id, Date.now()).run();
  return json({ ok: true });
}
