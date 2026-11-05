/**
 * "Tự viết" in two screens: ① Dựng mạch (one chain per body paragraph) → ② Viết bài.
 *
 * A body chain is a `Chain` whose `steps` hold the whole line: steps[0] is the starting point, the last step
 * is the ending point, the ones between are the middle. Until it is `built`, the chain shows as two boxes:
 * the end the prompt suggests, and the end the student writes (`mine`).
 */
import type { Prompt } from '@/content/prompts';
import type { Statement } from '@/content/statements';
import type { ChainIn } from '@/lib/ai/chain-coach';
import type { Chain, Question, Shape, Tone } from '../chainlab/types';
import { newId } from '../attempts/store';

export type BodyKind = 'cause' | 'impact' | 'solution';

export const kindOfShape = (s: Shape): BodyKind => (s === 'cause' ? 'cause' : s === 'solution' ? 'solution' : 'impact');
/** Cause and solution questions give the ending point (the trend, the problem): the student writes the start. Impact questions give the start. */
export const mineOf = (k: BodyKind): 'start' | 'end' => (k === 'impact' ? 'end' : 'start');

export const KIND_ASK: Record<BodyKind, { ask: string; ph: string; chip: string }> = {
  cause: { ask: 'Vì sao lại có chuyện này? Viết một nguyên nhân.', ph: 'Nguyên nhân của bạn là gì?', chip: 'Nguyên nhân' },
  impact: { ask: 'Điều này tác động thế nào, lên ai?', ph: 'Tác động lên ai, ra sao?', chip: 'Tác động' },
  solution: { ask: 'Làm gì để giải quyết? Viết một biện pháp.', ph: 'Biện pháp của bạn là gì?', chip: 'Giải pháp' },
};

export const questionOf = (p: Prompt, c: Chain): Question => p.questions.find((q) => q.n === (c.q || 1)) || p.questions[0];
export const kindOf = (p: Prompt, c: Chain): BodyKind => kindOfShape(questionOf(p, c).shape);
/** Verdict and problem questions: a chain has a side (benefit or cost). */
export const hasTone = (p: Prompt, c: Chain) => questionOf(p, c).shape === 'verdict';

export const startOf = (c: Chain) => c.steps[0] || '';
export const endOf = (c: Chain) => (c.steps.length > 1 ? c.steps[c.steps.length - 1] : '');
export const middleOf = (c: Chain) => c.steps.slice(1, -1);
export const withEnds = (c: Chain, start: string, end: string): Chain => ({ ...c, steps: [start, ...middleOf(c), end] });
export const withMiddle = (c: Chain, middle: string[]): Chain => ({ ...c, steps: [startOf(c), ...middle, endOf(c)] });

/** What the prompt suggests for the end the student doesn't write. */
export function givenEnd(p: Prompt, q: Question): string {
  const k = kindOfShape(q.shape);
  if (k === 'impact') return p.driver;
  if (k === 'cause') return p.driver;
  // Solutions: the problem the cause / problem question is about, solved.
  return 'Giải quyết được: ' + p.driver.charAt(0).toLowerCase() + p.driver.slice(1);
}

function blank(p: Prompt, q: Question, tone: Tone): Chain {
  const k = kindOfShape(q.shape), mine = mineOf(k), given = givenEnd(p, q);
  return {
    id: newId('b'), q: q.n, title: '', tone, area: '', split: null, findings: [],
    steps: mine === 'start' ? ['', given] : [given, ''], mine, built: false,
  };
}

/** A new chain for question `q` (tone alternates on verdict questions). */
export function newBody(p: Prompt, q: Question, existing: Chain[]): Chain {
  const same = existing.filter((c) => (c.q || 1) === q.n);
  const tone: Tone = q.shape === 'verdict' ? (same.filter((c) => c.tone === 'benefit').length <= same.filter((c) => c.tone === 'cost').length ? 'benefit' : 'cost') : q.shape === 'problem' || q.shape === 'planproblem' ? 'cost' : null;
  return blank(p, q, tone);
}

/** Two body paragraphs to start: one per question, or two for a one-question prompt (benefit + cost when it asks for a side). */
export function initialBodies(p: Prompt): Chain[] {
  const out: Chain[] = [];
  const qs = p.questions.length >= 2 ? p.questions.slice(0, 3) : [p.questions[0], p.questions[0]];
  qs.forEach((q) => out.push(newBody(p, q, out)));
  return out;
}

/** The drill's chain, carried over as body paragraph 1 (built, with the student's middle). */
export function bodyFromStatement(p: Prompt, s: Statement, middle: string[]): Chain[] {
  const want: Shape[] = s.kind === 'cause' ? ['cause'] : s.kind === 'solution' ? ['solution'] : ['verdict', 'effect', 'problem', 'planproblem'];
  const q = p.questions.find((x) => want.includes(x.shape)) || p.questions[0];
  const first: Chain = {
    id: newId('b'), q: q.n, title: '', tone: s.tone || (q.shape === 'verdict' ? 'benefit' : null), area: '', split: null, findings: [],
    steps: [s.start, ...middle.filter((x) => x.trim()), s.end], mine: mineOf(kindOfShape(q.shape)), built: true,
  };
  // The other questions keep a blank chain each; a one-question prompt gets a second one (the other side).
  const rest = initialBodies(p).filter((c) => c.q !== first.q || p.questions.length === 1).slice(0, p.questions.length === 1 ? 1 : undefined);
  if (p.questions.length === 1 && rest[0] && rest[0].tone === first.tone && first.tone) rest[0] = { ...rest[0], tone: first.tone === 'cost' ? 'benefit' : 'cost' };
  // Body paragraphs follow the prompt's questions (causes before solutions).
  return [first, ...rest].sort((a, b) => (a.q || 1) - (b.q || 1));
}

/** The chain as the coach reads it. */
export function chainIn(p: Prompt, c: Chain): ChainIn {
  return { kind: kindOf(p, c), tone: hasTone(p, c) ? c.tone : null, start: startOf(c), end: endOf(c), steps: middleOf(c) };
}
