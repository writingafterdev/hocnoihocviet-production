import { aiStepVocab } from '@/lib/ai/chain-coach';
import { aiErrorResponse } from '@/lib/ai/claude';
import { readCoachRequest } from '@/lib/ai/coach-http';

/** Quick drill, "Gợi ý từ vựng" on one step. */
export async function POST(request: Request) {
  const r = await readCoachRequest(request);
  if (r instanceof Response) return r;
  const index = Math.max(0, Math.min(11, Math.round(Number(r.body.index) || 0)));
  const question = typeof r.body.question === 'string' ? r.body.question.slice(0, 300) : '';
  try {
    return Response.json(await aiStepVocab(r.userId, r.prompt, r.chain, index, question), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err, { route: 'step-vocab', userId: r.userId });
  }
}
