import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getAdmin, maskEmail, notFound } from '@/lib/admin';
import { DAILY_LIMIT, vnDay } from '@/lib/ai/claude';

const json = (body: unknown) => Response.json(body, { headers: { 'Cache-Control': 'no-store' } });

interface Row { id: string; name: string; email: string; createdAt: string; lastAttempt: number | null; lastSession: string | null; essays: number; chains: number; vocab: number; usedToday: number; usedWeek: number }

/** ?q=&filter=all|active|limit|idle&offset=&limit= → one page of students with their activity. Emails are masked. */
export async function GET(request: Request) {
  if (!(await getAdmin(request))) return notFound();
  const { env } = await getCloudflareContext({ async: true });
  const sp = new URL(request.url).searchParams;
  const q = (sp.get('q') || '').trim().slice(0, 60).replace(/[\\%_]/g, (c) => '\\' + c);
  const filter = ['active', 'limit', 'idle'].includes(sp.get('filter') || '') ? sp.get('filter') : 'all';
  const limit = Math.min(50, Math.max(1, Number(sp.get('limit')) || 10));
  const offset = Math.max(0, Number(sp.get('offset')) || 0);
  const now = Date.now(), today = vnDay(0), week = vnDay(6);

  // One row per student; the filters work on those columns.
  const base = `select * from (
    select u.id, u.name, u.email, u.createdAt,
      (select max(updatedAt) from attempt a where a.userId = u.id) as lastAttempt,
      (select max(updatedAt) from session s where s.userId = u.id) as lastSession,
      (select coalesce(sum(count), 0) from ai_usage x where x.userId = u.id and x.kind = 'essay') as essays,
      (select coalesce(sum(count), 0) from ai_usage x where x.userId = u.id and x.kind = 'chain') as chains,
      (select count(*) from vocab_custom v where v.userId = u.id) as vocab,
      (select coalesce(sum(count), 0) from ai_usage x where x.userId = u.id and x.kind = 'essay' and x.day = ?1) as usedToday,
      (select coalesce(sum(count), 0) from ai_usage x where x.userId = u.id and x.day >= ?2) as usedWeek
    from "user" u where (u.name like ?3 escape '\\' or u.email like ?3 escape '\\')
  ) where ${filter === 'active' ? '(usedWeek > 0 or coalesce(lastAttempt, 0) > ?4)' : filter === 'limit' ? 'usedToday >= ?4' : filter === 'idle' ? 'essays + chains = 0 and usedWeek = 0' : '?4 is not null'}`;
  const arg4 = filter === 'active' ? now - 7 * 86_400_000 : filter === 'limit' ? DAILY_LIMIT.essay : 0;
  const like = '%' + q + '%';
  const total = await env.DB.prepare(`select count(*) as n from (${base})`).bind(today, week, like, arg4).first<{ n: number }>();
  const { results } = await env.DB.prepare(`${base} order by max(coalesce(lastAttempt, 0), coalesce(strftime('%s', lastSession) * 1000, 0)) desc, createdAt desc limit ?5 offset ?6`).bind(today, week, like, arg4, limit, offset).all<Row>();

  return json({
    total: total?.n || 0, limit: DAILY_LIMIT.essay,
    items: results.map((r) => ({
      id: r.id, name: r.name || '(chưa đặt tên)', email: maskEmail(r.email), joined: r.createdAt,
      lastActive: Math.max(r.lastAttempt || 0, r.lastSession ? Date.parse(r.lastSession) || 0 : 0) || null,
      essays: r.essays, chains: r.chains, vocab: r.vocab, usedToday: r.usedToday,
    })),
  });
}
