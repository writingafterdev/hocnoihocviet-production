import { aiErrorResponse, AiError } from '@/lib/ai/claude';
import { aiGuidedPlan } from '@/lib/ai/guided-essay';
import { readAiRequest } from '@/lib/ai/http';
import type { Chain } from '@/features/chainlab/types';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** "Viết có hướng dẫn": the sample essay (or the drill's paragraph) from the student's chains, sentence by sentence. One "fix" use. */
export async function POST(request: Request) {
  const r = await readAiRequest<{ promptId: string; chains: Chain[]; stance: string; sentence?: string }>(request);
  if (r instanceof Response) return r;
  if (!r.body.chains.length || r.body.chains.length > 6) return json({ error: 'invalid' }, 400);
  try {
    // `sentence`: the drill's statement; the plan is then one paragraph from its single chain.
    const sentence = typeof r.body.sentence === 'string' ? r.body.sentence.slice(0, 600) : '';
    return json({ sentences: await aiGuidedPlan(r.userId, r.prompt, sentence ? r.body.chains.slice(0, 1) : r.body.chains, sentence || undefined) });
  } catch (err) {
    return aiErrorResponse(err instanceof Error ? err : new AiError('upstream'), { route: 'guided-plan', userId: r.userId });
  }
}
