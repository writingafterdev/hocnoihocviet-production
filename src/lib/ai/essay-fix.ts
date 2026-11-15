/**
 * The fix round after a review: "Kiểm tra" judges one idea/flow fix on the edited paragraph (each comment brings its
 * own fix and questions from the grading), and "Nộp lại" re-scores the essay against the last grading (scores and a few
 * one-line notes, no new comments). `PlanTask` is the shape of one fix, shared with the drill paragraph's comments.
 */
import type { Prompt } from '@/content/prompts';
import type { Chain } from '@/features/chainlab/types';
import { ask } from './claude';
import { describePrompt } from './describe';
import type { SectionIn } from './essay-review';
import { FIXCHECK_TASK, RESCORE_TASK } from './prompts';

export interface PlanTask { sectionId: string; criterion: 'tr' | 'cc'; quote: string; title: string; ask: string[]; starter: string; aim: string; model?: string; vi?: string }
export interface CheckOut { solved: boolean; reply: string; ask: string }
export interface RescoreTask { title: string; criterion: string; aim: string; solved: boolean }
export interface Scores { tr: number; cc: number; lr: number; gra: number }
export interface RescoreOut { scores: Scores; notes: { criterion: string; text: string }[] }

const str = { type: 'string' } as const;
const CHECK_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['solved', 'reply', 'ask'],
  properties: { solved: { type: 'boolean' }, reply: str, ask: str },
};
const RESCORE_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['scores', 'notes'],
  properties: {
    scores: { type: 'object', additionalProperties: false, required: ['tr', 'cc', 'lr', 'gra'], properties: Object.fromEntries(['tr', 'cc', 'lr', 'gra'].map((k) => [k, { type: 'number' }])) },
    notes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['criterion', 'text'], properties: { criterion: { type: 'string', enum: ['tr', 'cc', 'lr', 'gra'] }, text: str } } },
  },
};

const essayText = (sections: SectionIn[]) => sections.map((s) => `<section id="${s.id}" label="${s.label}">\n${s.text.trim() || '(trống)'}\n</section>`).join('\n');
const clip = (x: unknown, max: number) => (typeof x === 'string' ? x.trim().slice(0, max) : '');
const band = (x: unknown) => Math.max(1, Math.min(9, Math.round(Number(x) || 0)));

export async function aiFixCheck(userId: string, prompt: Prompt, chain: Chain | null, task: PlanTask, before: string, after: string): Promise<CheckOut> {
  const steps = chain ? '\n\nCÁC BƯỚC CỦA ĐOẠN\n' + chain.steps.map((s, k) => `  bước ${k + 1}: ${s.trim() || '(trống)'}`).join('\n') : '';
  const input = describePrompt(prompt) + steps + '\n\nVIỆC CẦN SỬA\n' + JSON.stringify({ ...task, model: undefined, vi: undefined }, null, 1)
    + '\n\nĐOẠN TRƯỚC KHI SỬA\n' + (before.trim() || '(trống)') + '\n\nĐOẠN SAU KHI SỬA\n' + (after.trim() || '(trống)');
  const out = await ask<CheckOut>({ userId, kind: 'fix', task: FIXCHECK_TASK, schema: CHECK_SCHEMA, effort: 'low', maxTokens: 2000, input });
  return { solved: !!out.solved, reply: clip(out.reply, 400), ask: out.solved ? '' : clip(out.ask, 400) };
}

export async function aiRescore(userId: string, prompt: Prompt, prev: Scores, why: Record<string, string>, tasks: RescoreTask[], before: SectionIn[], after: SectionIn[]): Promise<RescoreOut> {
  const lines = ['ĐIỂM LẦN TRƯỚC'];
  (['tr', 'cc', 'lr', 'gra'] as const).forEach((k) => lines.push(`  ${k.toUpperCase()} ${prev[k]}: ${why[k] || ''}`));
  const input = describePrompt(prompt) + '\n\n' + lines.join('\n') + '\n\nCÁC VIỆC SỬA\n' + JSON.stringify(tasks, null, 1)
    + '\n\nBÀI TRƯỚC VÒNG SỬA\n' + essayText(before) + '\n\nBÀI SAU VÒNG SỬA\n' + essayText(after);
  const out = await ask<RescoreOut>({ userId, kind: 'fix', task: RESCORE_TASK, schema: RESCORE_SCHEMA, effort: 'medium', maxTokens: 3000, input });
  const s = out.scores || ({} as Scores);
  // Anchored: a criterion moves at most one band from the last grading.
  const near = (k: keyof Scores) => Math.max(prev[k] - 1, Math.min(prev[k] + 1, band(s[k] ?? prev[k])));
  const scores = { tr: near('tr'), cc: near('cc'), lr: near('lr'), gra: near('gra') };
  const notes = (Array.isArray(out.notes) ? out.notes : [])
    .filter((n) => n && ['tr', 'cc', 'lr', 'gra'].includes(n.criterion) && clip(n.text, 300))
    .map((n) => ({ criterion: n.criterion, text: clip(n.text, 300) }))
    .slice(0, 4);
  return { scores, notes };
}
