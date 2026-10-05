import { aiErrorResponse, AiError, claimTicket, refundTicket, startTicket } from '@/lib/ai/claude';
import { essayComments, essayScores, type SectionIn } from '@/lib/ai/essay-review';
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
 * Separate requests keep each one inside the Worker's CPU limit.
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
    if (part !== 'scores') return json({ items: await essayComments(r.userId, part, r.prompt, sections, chains, stance) });
    try {
      return json(await essayScores(r.userId, r.prompt, sections, chains, stance));
    } catch (err) {
      // Without scores there is no review: give the use back.
      await refundTicket(r.userId, ticket).catch(() => {});
      throw err;
    }
  } catch (err) {
    return aiErrorResponse(err instanceof Error ? err : new AiError('upstream'));
  }
}
