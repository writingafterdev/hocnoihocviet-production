import { aiChainCheck } from '@/lib/ai/chain-coach';
import { aiErrorResponse } from '@/lib/ai/claude';
import { readCoachRequest } from '@/lib/ai/coach-http';

/** "Kiểm tra": logical jumps, and where a stakeholder trait or a detail would help, linked to positions in the chain. */
export async function POST(request: Request) {
  const r = await readCoachRequest(request);
  if (r instanceof Response) return r;
  try {
    return Response.json(await aiChainCheck(r.userId, r.prompt, r.chain), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err, { route: 'chain-check', userId: r.userId });
  }
}
