import { aiChainHint } from '@/lib/ai/chain-coach';
import { aiErrorResponse } from '@/lib/ai/claude';
import { readCoachRequest } from '@/lib/ai/coach-http';

/** "Bí? Gợi ý": one open question towards the next step. */
export async function POST(request: Request) {
  const r = await readCoachRequest(request);
  if (r instanceof Response) return r;
  const asked = Array.isArray(r.body.asked) ? r.body.asked.filter((a): a is string => typeof a === 'string' && a.length <= 300).slice(-6) : [];
  try {
    return Response.json(await aiChainHint(r.userId, r.prompt, r.chain, asked), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err, { route: 'chain-hint', userId: r.userId });
  }
}
