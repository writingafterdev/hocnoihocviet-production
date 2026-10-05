import { aiErrorResponse, AiError, askStream, claimTicket, refundTicket, startTicket } from '@/lib/ai/claude';
import { essayCall, type SectionIn } from '@/lib/ai/essay-review';
import { readAiRequest } from '@/lib/ai/http';
import { CRITERIA } from '@/features/desk/scoring';
import type { Chain } from '@/features/chainlab/types';

const validSections = (s: unknown): s is SectionIn[] =>
  Array.isArray(s) && s.length >= 1 && s.length <= 12 && s.every((x) => x && typeof x.id === 'string' && typeof x.label === 'string' && typeof x.text === 'string' && x.text.length <= 8000);

const PARTS = ['scores', ...CRITERIA.map(([id]) => id)];
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * "Nộp bài", in parts: part "start" takes one use of the allowance and returns a ticket; then "scores" and
 * one part per criterion ("tr", "cc", "lr", "gra") are sent in parallel with that ticket, each claimable once.
 * Each part returns the AI's raw event stream; the browser assembles the review.
 */
export async function POST(request: Request) {
  const r = await readAiRequest<{ promptId: string; chains: Chain[]; stance: string; sections: SectionIn[]; part?: string; ticket?: string }>(request);
  if (r instanceof Response) return r;
  const { sections, chains, stance, part, ticket } = r.body;
  if (!validSections(sections) || !sections.some((s) => s.text.trim())) return json({ error: 'invalid' }, 400);
  try {
    if (part === 'start') return json({ ticket: await startTicket(r.userId, 'essay') });
    if (!PARTS.includes(part) || typeof ticket !== 'string') return json({ error: 'invalid' }, 400);
    if (!(await claimTicket(r.userId, ticket, part))) return json({ error: 'invalid' }, 403);
    // The reply is streamed to the browser as it is written (a long reply must stream, or the provider's
    // gateway drops it after about 100 s); the browser parses it.
    try {
      return await askStream(essayCall(part, r.prompt, sections, chains, stance));
    } catch (err) {
      // Without scores there is no review: give the use back. (A stream that breaks later can't be seen here.)
      if (part === 'scores') await refundTicket(r.userId, ticket).catch(() => {});
      throw err;
    }
  } catch (err) {
    return aiErrorResponse(err instanceof Error ? err : new AiError('upstream'), { route: 'essay-review/' + String(part), userId: r.userId });
  }
}
