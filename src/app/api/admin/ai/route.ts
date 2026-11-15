import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getAdmin, notFound } from '@/lib/admin';
import { vnDay } from '@/lib/ai/claude';
import { geminiKeys, geminiModels, modelUse, probeModels } from '@/lib/ai/gemini';

const json = (body: unknown) => Response.json(body, { headers: { 'Cache-Control': 'no-store' } });

/**
 * Admin "Mô hình AI": which provider is on, the Gemini models in rotation order, and per model today and over 7 days how
 * many calls it answered, how many times it was used up, how many failed, tokens and average time.
 */
export async function GET(request: Request) {
  if (!(await getAdmin(request))) return notFound();
  const { env } = await getCloudflareContext({ async: true });
  const gemini = geminiKeys(env).length > 0;
  const today = vnDay(0);
  const rows = gemini ? await modelUse(env, vnDay(6)).catch(() => []) : [];
  const models = geminiModels(env).map((model) => {
    const mine = rows.filter((r) => r.model === model), t = mine.find((r) => r.day === today);
    const week = mine.reduce((a, r) => ({ ok: a.ok + r.ok, limited: a.limited + r.limited, failed: a.failed + r.failed }), { ok: 0, limited: 0, failed: 0 });
    return {
      model,
      today: { ok: t?.ok || 0, limited: t?.limited || 0, failed: t?.failed || 0, tokens: (t?.inputTokens || 0) + (t?.outputTokens || 0), avgMs: t && t.ok ? Math.round(t.ms / Math.max(1, t.ok + t.failed + t.limited)) : null },
      week,
      last: t?.lastStatus ? { status: t.lastStatus, at: t.lastAt } : null,
    };
  });
  return json({
    provider: gemini ? 'gemini' : env.ANTHROPIC_API_KEY ? 'anthropic' : 'none',
    keys: geminiKeys(env).length,
    custom: !!env.GEMINI_MODELS,
    fallback: env.ANTHROPIC_API_KEY ? (env.AI_MODEL || 'claude') + ' · ' + (env.AI_BASE_URL ? new URL(env.AI_BASE_URL).host : 'api.anthropic.com') : null,
    models: gemini ? models : [],
  });
}

/** "Kiểm tra từng mô hình": one tiny request per model (uses one request of each model's free allowance). */
export async function POST(request: Request) {
  if (!(await getAdmin(request))) return notFound();
  const { env } = await getCloudflareContext({ async: true });
  return json({ results: await probeModels(env) });
}
