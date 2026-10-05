import { aiChainReview } from '@/lib/ai/chain-review';
import { aiErrorResponse } from '@/lib/ai/claude';
import { readAiRequest } from '@/lib/ai/http';
import type { Chain } from '@/features/chainlab/types';

export async function POST(request: Request) {
  const r = await readAiRequest<{ promptId: string; chains: Chain[]; stance: string }>(request);
  if (r instanceof Response) return r;
  try {
    return Response.json(await aiChainReview(r.userId, r.prompt, r.body.chains, r.body.stance), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err, { route: 'chain-review', userId: r.userId });
  }
}
