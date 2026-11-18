import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getUser } from '@/lib/auth';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** Chứng minh nhanh: the ids of the statements the student has finished (at least one attempt passed), for the library's ✓. */
export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const db = (await getCloudflareContext({ async: true })).env.DB;
  const rows = (await db.prepare('select distinct "statementId" from "drill_attempt" where "userId" = ?').bind(user.id).all<{ statementId: string }>()).results;
  return json({ ids: rows.map((r) => r.statementId) });
}
