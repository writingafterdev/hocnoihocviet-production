import { getCloudflareContext } from '@opennextjs/cloudflare';
import { CATEGORIES_TASK2, PROMPTS } from '@/content/prompts';
import { SAMPLE_IDS } from '@/content/samples';
import { getAdmin, notFound } from '@/lib/admin';
import { DAILY_LIMIT, MODEL, vnDay, type AiKind } from '@/lib/ai/claude';

const KINDS = Object.keys(DAILY_LIMIT) as AiKind[];
const json = (body: unknown) => Response.json(body, { headers: { 'Cache-Control': 'no-store' } });

/** Everything on the admin overview: numbers, daily AI use, features, health, errors, content. */
export async function GET(request: Request) {
  if (!(await getAdmin(request))) return notFound();
  const { env } = await getCloudflareContext({ async: true });
  const DB = env.DB;
  const now = Date.now();
  const days = Math.min(30, Math.max(7, Number(new URL(request.url).searchParams.get('days')) || 14));
  const today = vnDay(0), from = vnDay(days - 1), week = vnDay(6);

  const [users, newUsers, active, daily, todayRows, errs24, errGroups, saved, loopRows, migrations] = await Promise.all([
    DB.prepare('select count(*) as n from "user"').first<{ n: number }>(),
    DB.prepare('select count(*) as n from "user" where createdAt > ?').bind(new Date(now - 7 * 86_400_000).toISOString()).first<{ n: number }>(),
    DB.prepare('select count(*) as n from (select userId from attempt where updatedAt > ? union select userId from ai_usage where day >= ?)').bind(now - 7 * 86_400_000, week).first<{ n: number }>(),
    DB.prepare('select day, kind, sum(count) as n from ai_usage where day >= ? group by day, kind').bind(from).all<{ day: string; kind: AiKind; n: number }>(),
    DB.prepare('select userId, kind, count, inputTokens, outputTokens from ai_usage where day = ?').bind(today).all<{ userId: string; kind: AiKind; count: number; inputTokens: number; outputTokens: number }>(),
    DB.prepare('select code, count(*) as n from ai_error where at > ? group by code').bind(now - 86_400_000).all<{ code: string; n: number }>(),
    DB.prepare('select code, route, count(*) as n, max(at) as last, (select detail from ai_error e2 where e2.code = e.code and e2.route is e.route order by at desc limit 1) as detail from ai_error e where at > ? group by code, route order by last desc limit 6').bind(now - 7 * 86_400_000).all<{ code: string; route: string | null; n: number; last: number; detail: string | null }>(),
    DB.prepare('select topic, count(*) as n from vocab_custom group by topic order by n desc limit 6').all<{ topic: string; n: number }>(),
    DB.prepare("select data from attempt where data like '%\"prevScores\":{%' order by updatedAt desc limit 300").all<{ data: string }>(),
    DB.prepare('select count(*) as n from d1_migrations').first<{ n: number }>().catch(() => null),
  ]);

  // Daily uses per kind, oldest first, with zero-filled days.
  const byDay = new Map<string, Record<string, number>>();
  daily.results.forEach((r) => { const d = byDay.get(r.day) || {}; d[r.kind] = r.n; byDay.set(r.day, d); });
  const series = Array.from({ length: days }, (_, i) => {
    const day = vnDay(days - 1 - i), d = byDay.get(day) || {};
    return { day, total: KINDS.reduce((s, k) => s + (d[k] || 0), 0), ...Object.fromEntries(KINDS.map((k) => [k, d[k] || 0])) };
  });

  // Today per feature: uses, tokens, and how many students reached the day's limit.
  const features = KINDS.map((kind) => {
    const rows = todayRows.results.filter((r) => r.kind === kind);
    return {
      kind, limit: DAILY_LIMIT[kind],
      uses: rows.reduce((s, r) => s + r.count, 0),
      students: rows.length,
      atLimit: rows.filter((r) => r.count >= DAILY_LIMIT[kind]).length,
      tokensIn: rows.reduce((s, r) => s + r.inputTokens, 0),
      tokensOut: rows.reduce((s, r) => s + r.outputTokens, 0),
    };
  });
  const errorsByCode = Object.fromEntries(errs24.results.map((r) => [r.code, r.n]));

  // "Sửa bài" loop: resubmitted essays and how the band moved.
  const deltas: number[] = [];
  loopRows.results.forEach((r) => {
    try {
      const a = JSON.parse(r.data);
      const now2 = a?.essay?.review?.scores?.band, was = a?.essay?.prevScores?.band;
      if (typeof now2 === 'number' && typeof was === 'number') deltas.push(now2 - was);
    } catch { /* skip unreadable attempts */ }
  });

  const decisionOn = !!env.ANTHROPIC_API_KEY && (!!env.DECISION_URL || (!!env.AI_BASE_URL && /\.maas\.aliyuncs\.com$/.test(new URL(env.AI_BASE_URL).host)));
  return json({
    generatedAt: now,
    students: { total: users?.n || 0, newThisWeek: newUsers?.n || 0, active7d: active?.n || 0 },
    today: {
      essays: features.find((f) => f.kind === 'essay').uses,
      essayAtLimit: features.find((f) => f.kind === 'essay').atLimit,
      uses: features.reduce((s, f) => s + f.uses, 0),
      tokens: features.reduce((s, f) => s + f.tokensIn + f.tokensOut, 0),
      activeStudents: new Set(todayRows.results.map((r) => r.userId)).size,
    },
    series, features,
    errors: { total24h: errs24.results.reduce((s, r) => s + r.n, 0), byCode: errorsByCode, recent: errGroups.results },
    health: {
      apiKey: !!env.ANTHROPIC_API_KEY,
      model: env.AI_MODEL || MODEL,
      endpoint: env.AI_BASE_URL ? new URL(env.AI_BASE_URL).host : 'api.anthropic.com',
      decisionModel: decisionOn,
      migrations: migrations?.n ?? null,
    },
    content: {
      samplesHave: SAMPLE_IDS.size, promptsTotal: PROMPTS.length,
      byCategory: CATEGORIES_TASK2.map((c) => ({ category: c, total: PROMPTS.filter((p) => p.category === c).length, have: PROMPTS.filter((p) => p.category === c && SAMPLE_IDS.has(p.id)).length })),
    },
    loop: { resubmitted: deltas.length, avgBandChange: deltas.length ? Math.round((deltas.reduce((s, d) => s + d, 0) / deltas.length) * 10) / 10 : null },
    savedTopics: saved.results,
  });
}
