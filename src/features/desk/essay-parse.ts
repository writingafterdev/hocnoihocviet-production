/**
 * Turns the AI's essay-review replies into the review shown on the Writing Desk. Runs in the browser:
 * the replies are streamed straight through the server (see lib/ai/essay-review.ts).
 */
import type { Chain, ReviewItem } from '../chainlab/types';
import { bandOf, CRITERIA, type EssayReview } from './scoring';

export interface SectionIn { id: string; label: string; text: string }
interface Comment { criterion: string; sectionId: string; quote: string; label?: string; text: string; fix: string; chainId: string }
type Criteria = Record<'tr' | 'cc' | 'lr' | 'gra', { score: number; why: string; gap?: string; next: string }>;

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

const clampBand = (x: number) => Math.max(1, Math.min(9, Math.round((Number(x) || 0) * 2) / 2));

/** The "scores" reply: bands (rounded to 0.5), why / gap / next per criterion, and the summary. */
export function toScores(out: { criteria?: Criteria; summary?: string }): Pick<EssayReview, 'scores' | 'summary' | 'criteria'> {
  const cr = out.criteria || ({} as Criteria);
  const tr = clampBand(cr.tr?.score), cc = clampBand(cr.cc?.score), lr = clampBand(cr.lr?.score), gra = clampBand(cr.gra?.score);
  const txt = (x: unknown) => (typeof x === 'string' ? x.trim() : '');
  return {
    summary: txt(out.summary),
    criteria: Object.fromEntries(CRITERIA.map(([id]) => [id, { why: txt(cr[id as 'tr']?.why), gap: txt(cr[id as 'tr']?.gap), next: txt(cr[id as 'tr']?.next) }])),
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
    const label = typeof c.label === 'string' ? c.label.trim().slice(0, 60) : '';
    items.push({
      key: criterion + items.length,
      sectionId: hit.id,
      where: s.label + (k >= 0 ? ' · Mạch ' + (k + 1) : ''),
      ...(k >= 0 ? { chainId: chains[k].id } : {}),
      word: hit.text,
      quote: hit.text,
      ...(label ? { label } : {}),
      ...(fix && fix !== hit.text ? { fix } : {}),
      snap: s.text,
      text,
    });
  }
  return items;
}
