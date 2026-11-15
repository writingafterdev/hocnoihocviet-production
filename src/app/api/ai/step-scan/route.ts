import { aiStepScan } from '@/lib/ai/chain-coach';
import { aiErrorResponse } from '@/lib/ai/claude';
import { readCoachRequest } from '@/lib/ai/coach-http';

/** Quick drill, after Enter on a step: phrases used, better wording, the next question. */
export async function POST(request: Request) {
  const r = await readCoachRequest(request);
  if (r instanceof Response) return r;
  const index = Math.max(0, Math.min(11, Math.round(Number(r.body.index) || 0)));
  const step = typeof r.body.step === 'string' ? r.body.step.slice(0, 600).trim() : '';
  if (!step) return Response.json({ error: 'invalid' }, { status: 400 });
  const suggested = Array.isArray(r.body.suggested) ? r.body.suggested.filter((x): x is string => typeof x === 'string' && x.length <= 80).slice(0, 6) : [];
  try {
    return Response.json(await aiStepScan(r.userId, r.prompt, r.chain, index, step, suggested), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err, { route: 'step-scan', userId: r.userId });
  }
}
