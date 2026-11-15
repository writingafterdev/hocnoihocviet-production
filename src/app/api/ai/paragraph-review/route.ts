import { aiErrorResponse, AiError } from '@/lib/ai/claude';
import { readAiRequest } from '@/lib/ai/http';
import { aiParagraphReview } from '@/lib/ai/paragraph-review';
import type { Chain } from '@/features/chainlab/types';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** "Nhận xét đoạn văn" in the drill: idea and flow comments on the paragraph, as fix tasks. No score. One "fix" use. */
export async function POST(request: Request) {
  const r = await readAiRequest<{ promptId: string; chains: Chain[]; stance: string; sentence: string; text: string }>(request);
  if (r instanceof Response) return r;
  const { chains, sentence, text } = r.body;
  if (chains.length !== 1 || typeof sentence !== 'string' || sentence.length > 600 || typeof text !== 'string' || !text.trim() || text.length > 4000) return json({ error: 'invalid' }, 400);
  try {
    return json({ tasks: await aiParagraphReview(r.userId, r.prompt, chains[0], sentence, text) });
  } catch (err) {
    return aiErrorResponse(err instanceof Error ? err : new AiError('upstream'), { route: 'paragraph-review', userId: r.userId });
  }
}
