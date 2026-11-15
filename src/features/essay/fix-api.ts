/** Browser side of the fix round: check one fix, re-score after the round (see /api/ai/essay-fix). */
import type { Prompt } from '@/content/prompts';
import { postAi } from '../ai/request';
import type { Chain } from '../chainlab/types';
import { bandOf, type BandScores, type EssayReview, type EssaySection } from '../desk/scoring';

export interface PlanTask { sectionId: string; criterion: 'tr' | 'cc'; quote: string; title: string; ask: string[]; starter: string; aim: string; model?: string; vi?: string }
export interface CheckOut { solved: boolean; reply: string; ask: string }

const base = (prompt: Prompt, chains: Chain[]) => ({ promptId: prompt.id, chains: chains.map(({ check, ...c }) => c), stance: '' });
const sectionsIn = (sections: EssaySection[], drafts: Record<string, string>) => sections.map((s) => ({ id: s.id, label: s.label, text: drafts[s.id] || '' }));

export function checkFix(prompt: Prompt, chains: Chain[], task: PlanTask, before: string, after: string): Promise<CheckOut> {
  return postAi<CheckOut>('essay-fix', { ...base(prompt, chains), action: 'check', task, before, after });
}

/** "Nộp lại" after the round: the scores against the last grading, and a line per criterion that moved or held. */
export async function rescore(prompt: Prompt, chains: Chain[], sections: EssaySection[], before: Record<string, string>, drafts: Record<string, string>, review: EssayReview, tasks: { title: string; criterion: string; aim: string; solved: boolean }[]): Promise<{ scores: BandScores; notes: { criterion: string; text: string }[] }> {
  const prev = review.scores;
  const why = Object.fromEntries(['tr', 'cc', 'lr', 'gra'].map((k) => [k, [review.criteria?.[k]?.why, review.criteria?.[k]?.gap].filter(Boolean).join(' ').replace(/\*\*/g, '')]));
  const out = await postAi<{ scores: Omit<BandScores, 'band'>; notes: { criterion: string; text: string }[] }>('essay-fix', {
    ...base(prompt, chains), action: 'rescore',
    prev: { tr: prev.tr, cc: prev.cc, lr: prev.lr, gra: prev.gra }, why, tasks,
    before: sectionsIn(sections, before), after: sectionsIn(sections, drafts),
  });
  const s = out.scores;
  return { scores: { ...s, band: bandOf(s.tr, s.cc, s.lr, s.gra) }, notes: out.notes || [] };
}
