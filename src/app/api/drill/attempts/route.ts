import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getUser } from '@/lib/auth';
import { findStatement } from '@/content/statements';
import type { DrillAttempt, DrillErr } from '@/features/prove/drill-attempts';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const db = async () => (await getCloudflareContext({ async: true })).env.DB;


const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const errsOf = (v: unknown): DrillErr[] => (Array.isArray(v) ? v.slice(0, 24).map((e) => ({ where: str(e?.where, 40), label: str(e?.label, 80), quote: str(e?.quote, 600), fix: str(e?.fix, 600) })).filter((e) => e.label) : []);
const parse = <T,>(s: string | null, fallback: T): T => { try { return s ? (JSON.parse(s) as T) : fallback; } catch { return fallback; } };

/** The student's attempts, newest first. */
export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const rows = (await (await db()).prepare('select "id", "statementId", "createdAt", "errs", "paragraph", "paraErrs" from "drill_attempt" where "userId" = ? order by "createdAt" desc limit 500').bind(user.id)
    .all<{ id: string; statementId: string; createdAt: number; errs: string; paragraph: string | null; paraErrs: string | null }>()).results;
  const list: DrillAttempt[] = rows.map((r) => ({ id: r.id, statementId: r.statementId, createdAt: r.createdAt, errs: parse(r.errs, []), paragraph: r.paragraph, paraErrs: parse(r.paraErrs, []) }));
  return json({ list });
}

/** { statementId, steps, errs } → a new attempt (its mạch ý just passed Kiểm tra); returns its id. */
export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  let body: { statementId?: unknown; steps?: unknown; errs?: unknown };
  try { body = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  const sid = str(body.statementId, 80);
  if (!findStatement(sid)) return json({ error: 'invalid' }, 400);
  const steps = Array.isArray(body.steps) ? body.steps.slice(0, 12).map((x) => str(x, 600)).filter(Boolean) : [];
  const id = crypto.randomUUID();
  await (await db()).prepare('insert into "drill_attempt" ("id", "userId", "statementId", "createdAt", "steps", "errs") values (?, ?, ?, ?, ?, ?)')
    .bind(id, user.id, sid, Date.now(), JSON.stringify(steps), JSON.stringify(errsOf(body.errs))).run();
  return json({ id });
}

/** { id, paragraph, paraErrs } → the paragraph written from that mạch ý and its review's comments (the first review only). */
export async function PATCH(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  let body: { id?: unknown; paragraph?: unknown; paraErrs?: unknown };
  try { body = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  const id = str(body.id, 60), paragraph = str(body.paragraph, 6000);
  if (!id || !paragraph.trim()) return json({ error: 'invalid' }, 400);
  await (await db()).prepare('update "drill_attempt" set "paragraph" = ?, "paraErrs" = ? where "id" = ? and "userId" = ? and "paragraph" is null')
    .bind(paragraph, JSON.stringify(errsOf(body.paraErrs)), id, user.id).run();
  return json({ ok: true });
}
