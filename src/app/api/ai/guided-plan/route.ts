import { aiErrorResponse, AiError } from '@/lib/ai/claude';
import { aiGuidedPlan } from '@/lib/ai/guided-essay';
import { readAiRequest } from '@/lib/ai/http';
import type { Chain } from '@/features/chainlab/types';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** "Viết có hướng dẫn": the sample essay from the student's chains, sentence by sentence. One "fix" use. */
export async function POST(request: Request) {
  const r = await readAiRequest<{ promptId: string; chains: Chain[]; stance: string }>(request);
  if (r instanceof Response) return r;
  if (!r.body.chains.length || r.body.chains.length > 6) return json({ error: 'invalid' }, 400);
  try {
    return json({ sentences: await aiGuidedPlan(r.userId, r.prompt, r.body.chains) });
  } catch (err) {
    return aiErrorResponse(err instanceof Error ? err : new AiError('upstream'), { route: 'guided-plan', userId: r.userId });
  }
}
