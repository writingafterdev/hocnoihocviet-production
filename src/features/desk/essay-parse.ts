/**
 * Turns the AI's essay-review replies into the review shown on the Writing Desk. Runs in the browser:
 * the replies are streamed straight through the server (see lib/ai/essay-review.ts).
 */
import type { Chain, ReviewItem } from '../chainlab/types';
import { bandOf, CRITERIA, type EssayReview } from './scoring';

export interface SectionIn { id: string; label: string; text: string }
interface Comment { criterion: string; sectionId: string; quote: string; label?: string; text: string; fix: string; vi?: string; ask?: string[]; how?: string; example?: string; chainId: string; step?: number }
type Criteria = Record<'tr' | 'cc' | 'lr' | 'gra', { score: number; why: string; gap?: string; next: string; band_quote?: string; next_quote?: string }>;

const norm = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').toLowerCase();

/** Finds the quote in the essay (ignoring case, curly quotes and spacing) and returns the exact text there. */
function locate(sections: SectionIn[], prefer: string, quote: string): { id: string; text: string } | null {
  const q = norm(quote.trim().replace(/^["“]|["”]$/g, ''));
  if (!q) return null;
  const order = [...sections.filter((s) => s.id === prefer), ...sections.filter((s) => s.id !== prefer)];
  for (const s of order) {
    // Map positions in the normalised text back to the original.
    const map: number[] = [];
    let flat = '';
    for (let i = 0; i < s.text.length; i++) {
      const ch = s.text[i];
      if (/\s/.test(ch)) { if (flat.endsWith(' ')) continue; flat += ' '; } else flat += norm(ch);
      map.push(i);
    }
    const at = flat.indexOf(q);
    if (at < 0) continue;
    const start = map[at], end = map[at + q.length - 1] + 1;
    return { id: s.id, text: s.text.slice(start, end) };
  }
  return null;
}

/** Each criterion gets a whole band (the overall band can still end in .5). */
const clampBand = (x: number) => Math.max(1, Math.min(9, Math.round(Number(x) || 0)));

/** The "scores" reply: whole bands per criterion, descriptor quotes and why / gap / next per criterion, the summary and the praise. */
type SkeletonOut = { thesis?: string; bodies?: { sectionId?: string; steps?: unknown[]; weak?: boolean }[]; conclusion?: string };

/** Tự viết: the skeleton from the scores reply, kept only for bodies that exist in the essay. */
function toSkeleton(sk: SkeletonOut | undefined, sectionIds?: string[]): EssayReview['skeleton'] | undefined {
  if (!sk || typeof sk !== 'object' || !Array.isArray(sk.bodies)) return undefined;
  const txt = (x: unknown, n = 300) => (typeof x === 'string' ? x.trim().slice(0, n) : '');
  const bodies = sk.bodies
    .map((b) => ({ sectionId: txt(b?.sectionId, 40), steps: (Array.isArray(b?.steps) ? b.steps : []).map((x) => txt(x, 200)).filter(Boolean).slice(0, 8), weak: b?.weak === true }))
    .filter((b) => b.steps.length && (!sectionIds || sectionIds.includes(b.sectionId)));
  return bodies.length ? { thesis: txt(sk.thesis), bodies, conclusion: txt(sk.conclusion) } : undefined;
}

export function toScores(out: { criteria?: Criteria; summary?: string; praise?: string; skeleton?: SkeletonOut }, sectionIds?: string[]): Pick<EssayReview, 'scores' | 'summary' | 'criteria' | 'praise' | 'skeleton'> {
  const cr = out.criteria || ({} as Criteria);
  const tr = clampBand(cr.tr?.score), cc = clampBand(cr.cc?.score), lr = clampBand(cr.lr?.score), gra = clampBand(cr.gra?.score);
  const txt = (x: unknown) => (typeof x === 'string' ? x.trim() : '');
  const skeleton = toSkeleton(out.skeleton, sectionIds);
  return {
    ...(skeleton ? { skeleton } : {}),
    summary: txt(out.summary),
    praise: txt(out.praise),
    criteria: Object.fromEntries(CRITERIA.map(([id]) => {
      const c = cr[id as 'tr'];
      return [id, { why: txt(c?.why), gap: txt(c?.gap), next: txt(c?.next), bandQuote: txt(c?.band_quote), nextQuote: txt(c?.next_quote) }];
    })),
    scores: { tr, cc, lr, gra, band: bandOf(tr, cc, lr, gra) },
  };
}

/** One criterion's reply: comments whose quote is found in the essay, each pointing at those exact words. */
export function toItems(criterion: string, out: { comments?: Comment[] }, sections: SectionIn[], chains: Chain[]): ReviewItem[] {
  const items: ReviewItem[] = [];
  const taken = new Set<string>();
  for (const c of Array.isArray(out.comments) ? out.comments : []) {
    const text = typeof c?.text === 'string' ? c.text.trim() : '';
    const hit = text && typeof c.quote === 'string' && locate(sections, String(c.sectionId || ''), c.quote);
    if (!hit) continue; // every comment must point at the essay
    if (taken.has(hit.id + '|' + hit.text)) continue;
    taken.add(hit.id + '|' + hit.text);
    const s = sections.find((x) => x.id === hit.id);
    const k = chains.findIndex((x) => x.id === c.chainId);
    const fix = typeof c.fix === 'string' ? c.fix.trim() : '';
    const example = typeof c.example === 'string' ? c.example.trim() : '';
    const label = typeof c.label === 'string' ? c.label.trim().slice(0, 60) : '';
    const vi = typeof c.vi === 'string' ? c.vi.trim().slice(0, 1200) : '';
    const ask = (Array.isArray(c.ask) ? c.ask : []).map((q) => (typeof q === 'string' ? q.trim().slice(0, 400) : '')).filter(Boolean).slice(0, 2);
    const how = typeof c.how === 'string' ? c.how.trim().slice(0, 500) : '';
    items.push({
      key: criterion + items.length,
      sectionId: hit.id,
      where: s.label + (k >= 0 ? ' · Mạch ý ' + (k + 1) : ''),
      ...(k >= 0 ? { chainId: chains[k].id } : {}),
      // The model counts steps from 1 (step 1 = the starting point).
      ...(k >= 0 && Number.isInteger(c.step) && c.step >= 1 && c.step <= chains[k].steps.length ? { at: c.step - 1 } : {}),
      word: hit.text,
      quote: hit.text,
      ...(label ? { label } : {}),
      ...(fix && fix !== hit.text ? { fix, ...(vi ? { vi } : {}) } : {}),
      ...(ask.length ? { ask } : {}),
      ...(how ? { how } : {}),
      ...(example && example !== fix ? { example } : {}),
      snap: s.text,
      text,
    });
  }
  return items;
}
