import { aiErrorResponse } from '@/lib/ai/claude';
import { aiEssayReview, type SectionIn } from '@/lib/ai/essay-review';
import { readAiRequest } from '@/lib/ai/http';
import type { Chain } from '@/features/chainlab/types';

const validSections = (s: unknown): s is SectionIn[] =>
  Array.isArray(s) && s.length >= 1 && s.length <= 12 && s.every((x) => x && typeof x.id === 'string' && typeof x.label === 'string' && typeof x.text === 'string' && x.text.length <= 8000);

export async function POST(request: Request) {
  const r = await readAiRequest<{ promptId: string; chains: Chain[]; stance: string; sections: SectionIn[] }>(request);
  if (r instanceof Response) return r;
  const { sections, chains, stance } = r.body;
  if (!validSections(sections)) return Response.json({ error: 'invalid' }, { status: 400 });
  if (!sections.some((s) => s.text.trim())) return Response.json({ error: 'invalid' }, { status: 400 });
  try {
    return Response.json(await aiEssayReview(r.userId, r.prompt, sections, chains, stance), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
