/**
 * Screen ② "Cân": compare the two sides criterion by criterion, decide the position, then lay the chains out as
 * paragraphs. Pure helpers; the screen keeps the student's choices in `Plan` on the attempt.
 */
import { CL_SHAPE_LABEL } from './constants';
import { causeLabel, CMP_CRITERIA, gridFor, isCompare, isWritten, claimTally, type ClaimTally, type MapExtras } from './ideamap';
import { filledSteps, shapeOf, sidesOf, verdictStatus } from './model';
import type { Chain, PromptSpec, Side } from './types';

/** Which side is stronger on one criterion. */
export type Win = 'left' | 'right' | '=';
/** One row of the criterion table: who is stronger, and the chain that makes them so. */
export interface CritWeigh { win: Win | null; chain?: string | null }
/** How far the position leans: fully / mostly to one side, or balanced. */
export type Lean = 'L2' | 'L1' | '0' | 'R1' | 'R2';
export type Layout = 'concede' | 'reasons' | 'views' | 'questions';
export interface OutlinePara { id: string; job: string; chains: string[] }

export interface Plan {
  /** The criterion table, by criterion name. */
  crit?: Record<string, CritWeigh>;
  /** "Không, một tiêu chí nặng hơn cả": the criterion that decides, and why. */
  override?: { crit: string; why: string } | null;
  lean?: Lean | null;
  main?: string[];
  concession?: string | null;
  scope?: string;
  layout?: Layout;
  paras?: OutlinePara[];
}

/** Comparison prompts: driver A is the first view (right end), B the second (left end). */
export const drvSide = (c: Chain): Side => (c.drv === 'B' ? 'left' : 'right');

const verdictQ = (spec: PromptSpec) => spec.questions.find((q) => q.shape === 'verdict');
export const areaOf = (c: Chain) => c.area || (c.cell && c.cell.c) || '';

/** Where a verdict chain sits on the rope; a chain whose cases fall on both sides is 'mixed'. */
export function chainSide(c: Chain): Side | 'mixed' {
  if (c.split) {
    const s = new Set(c.split.branches.map((b) => b.side || null));
    if (s.size === 1) return [...s][0];
    return s.has(null) ? null : 'mixed';
  }
  return c.side || null;
}

/** Written verdict chains. */
export const verdictChains = (spec: PromptSpec, chains: Chain[]) => chains.filter((c) => shapeOf(spec, c) === 'verdict' && isWritten(c));

/** A chain's name: its title, else its first own step (a verdict chain's first step is the prompt's driver). */
export function chainName(spec: PromptSpec, c: Chain): string {
  if (!c) return '';
  const drivers = [spec.driver, spec.driver2].filter(Boolean).map((d) => d.trim().toLowerCase());
  const steps = c.steps.filter((s) => s.trim() && !drivers.includes(s.trim().toLowerCase()));
  const base = c.title.trim() ? causeLabel(c) : causeLabel({ ...c, steps: steps.length ? steps : c.steps });
  return (c.drv ? c.drv + ' · ' : '') + base;
}

// ---- The criterion table -----------------------------------------------------------------------------------

/** The criterion table's rows: the comparison grounds, each with the question it asks. */
export const CRIT_Q: Record<string, string> = {
  'Độ lớn': 'Thay đổi nhiều hay ít trong đời họ?',
  'Số người': 'Chạm tới bao nhiêu người?',
  'Độ dài': 'Vài tuần hay nhiều năm?',
  'Không thay thế được': 'Nếu bỏ đi, có cách khác bù vào không?',
  'Độ vững': 'Đổi điều kiện, có còn đúng không?',
};
export const CRITERIA = CMP_CRITERIA;

export interface Tally { right: number; left: number; eq: number; open: string[]; done: string[] }
export function tally(plan: Plan): Tally {
  const t: Tally = { right: 0, left: 0, eq: 0, open: [], done: [] };
  CRITERIA.forEach((k) => {
    const w = plan.crit?.[k]?.win;
    if (!w) { t.open.push(k); return; }
    t.done.push(k);
    if (w === 'right') t.right += 1; else if (w === 'left') t.left += 1; else t.eq += 1;
  });
  return t;
}

/** The side the table points to. */
export function suggestedSide(t: Tally): Win | null {
  if (!t.done.length) return null;
  return t.right > t.left ? 'right' : t.left > t.right ? 'left' : '=';
}
/** The side after the student's override ("one criterion outweighs the rest"). */
export function finalSide(plan: Plan): Win | null {
  const o = plan.override && plan.override.crit && plan.crit?.[plan.override.crit]?.win;
  return o || suggestedSide(tally(plan));
}

export function suggestedLean(plan: Plan): Lean | null {
  const side = finalSide(plan), t = tally(plan);
  if (!side) return null;
  if (side === '=') return '0';
  const theirs = side === 'right' ? t.left : t.right;
  const k = side === 'right' ? 'R' : 'L';
  // "Fully" only once every row is filled and none went the other way or tied.
  return (theirs === 0 && t.eq === 0 && !t.open.length ? k + '2' : k + '1') as Lean;
}

export const leanSide = (l: Lean | null | undefined): 'left' | 'right' | null => (!l || l === '0' ? null : l[0] === 'R' ? 'right' : 'left');

export function leanLabel(spec: PromptSpec, l: Lean): string {
  const [L, R] = sidesOf(spec);
  return l === '0' ? 'Cân bằng' : (l[1] === '2' ? 'Hoàn toàn ' : 'Phần lớn ') + (l[0] === 'R' ? R : L).toLowerCase();
}

/** Comparison prompts: the map's cell verdicts, shown above the table as evidence. */
export function mapTally(spec: PromptSpec, chains: Chain[], extras?: MapExtras): ClaimTally | null {
  const vq = verdictQ(spec);
  if (!vq || !isCompare(spec, vq)) return null;
  const g = gridFor(spec, vq, chains, extras);
  return claimTally(g.rows, g.cols, extras?.cmp);
}

/** Chains on one side: those the table cites for that side first, then the ones that hold, then the rest. */
export function sideChains(spec: PromptSpec, chains: Chain[], side: 'left' | 'right', plan: Plan): Chain[] {
  const cited = new Set(CRITERIA.filter((k) => plan.crit?.[k]?.win === side).map((k) => plan.crit[k].chain).filter(Boolean));
  const rank = (c: Chain) => { const l = verdictStatus(c).label; return l === 'Giữ hướng' ? 0 : l === 'Chưa thử' ? 2 : 1; };
  return verdictChains(spec, chains).filter((c) => chainSide(c) === side)
    .sort((a, b) => (cited.has(a.id) ? 0 : 1) - (cited.has(b.id) ? 0 : 1) || rank(a) - rank(b));
}

export interface ScopeHint { text: string; from: string }
/** Conditions the student already found: Scope findings, Scope cases, and findings that point the other way. */
export function scopeHints(spec: PromptSpec, chains: Chain[]): ScopeHint[] {
  const out: ScopeHint[] = [];
  verdictChains(spec, chains).forEach((c) => {
    const name = chainName(spec, c);
    c.findings.forEach((f) => { if (!f.empty && f.text.trim() && (f.kind === 'Scope' || (f.side && c.side && f.side !== c.side))) out.push({ text: f.text.trim(), from: name + ' · ' + f.kind }); });
    if (c.split) c.split.branches.forEach((b) => { if (b.label.trim()) out.push({ text: (c.split.noun ? c.split.noun + ': ' : '') + b.label.trim(), from: name + ' · Scope' }); });
  });
  const seen = new Set<string>();
  return out.filter((h) => (seen.has(h.text) ? false : (seen.add(h.text), true))).slice(0, 6);
}

// ---- Outline ------------------------------------------------------------------

export const LAYOUT_LABEL: Record<Layout, string> = {
  concede: 'Nhượng bộ trước, lý do sau',
  reasons: 'Hai lý do, nhượng bộ một câu',
  views: 'Mỗi đoạn một quan điểm',
  questions: 'Mỗi đoạn một câu hỏi',
};

export const hasVerdictOnly = (spec: PromptSpec) => spec.questions.length === 1 && spec.questions[0].shape === 'verdict';

export function layoutsFor(spec: PromptSpec): Layout[] {
  return hasVerdictOnly(spec) ? ['concede', 'reasons', 'views'] : ['questions'];
}

export function defaultLayout(spec: PromptSpec, lean: Lean | null | undefined): Layout {
  if (!hasVerdictOnly(spec)) return 'questions';
  if ((spec as { category?: string }).category === 'Discussion' || !lean || lean === '0') return 'views';
  return lean[1] === '2' ? 'reasons' : 'concede';
}

/** Written chains of any question, in the order of the questions. */
export const usableChains = (spec: PromptSpec, chains: Chain[]) => chains.filter((c) => (shapeOf(spec, c) === 'verdict' ? isWritten(c) : filledSteps(c) > 0));

/** The paragraphs a layout suggests, filled from the table and the position. */
export function buildOutline(spec: PromptSpec, chains: Chain[], plan: Plan, layout: Layout): OutlinePara[] {
  const [L, R] = sidesOf(spec);
  const my: 'left' | 'right' = leanSide(plan.lean) || (finalSide(plan) === 'left' ? 'left' : 'right');
  const other = my === 'right' ? 'left' : 'right';
  const ok = (id: string | null | undefined) => !!id && chains.some((c) => c.id === id);
  const mine = sideChains(spec, chains, my, plan).map((c) => c.id);
  const theirs = sideChains(spec, chains, other, plan).map((c) => c.id);
  const main = [...(plan.main || []).filter(ok), ...mine].filter((x, i, a) => a.indexOf(x) === i);
  const conc = ok(plan.concession) ? plan.concession : theirs[0] || null;
  const para = (i: number, job: string, ids: (string | null)[]): OutlinePara => ({ id: 'body' + (i + 1), job, chains: ids.filter(Boolean).filter((x, k, a) => a.indexOf(x) === k) });

  if (layout === 'questions') {
    return spec.questions.map((q, i) => {
      let ids = usableChains(spec, chains).filter((c) => (c.q || 1) === q.n);
      if (q.shape === 'solution') {
        const causeOrder = chains.map((c) => c.id);
        ids = [...ids].sort((a, b) => causeOrder.indexOf(a.fixes || '') - causeOrder.indexOf(b.fixes || ''));
      }
      if (q.shape === 'verdict') return para(i, CL_SHAPE_LABEL.verdict, [...main.slice(0, 2), conc]);
      return para(i, CL_SHAPE_LABEL[q.shape], ids.map((c) => c.id));
    });
  }
  if (layout === 'reasons') return [para(0, 'Lý do 1', [main[0]]), para(1, 'Lý do 2 + một câu nhượng bộ', [main[1], conc])];
  if (layout === 'views') {
    const t = [conc, ...theirs].filter((x, i, a) => x && a.indexOf(x) === i);
    return [para(0, 'Quan điểm: ' + (other === 'right' ? R : L), t.slice(0, 2)), para(1, 'Quan điểm: ' + (my === 'right' ? R : L) + ' (phía bạn)', main.slice(0, 2))];
  }
  return [para(0, 'Nhượng bộ', [conc]), para(1, 'Lý do chính', main.slice(0, 2))];
}

/** Chains not placed in any paragraph. */
export const leftOut = (spec: PromptSpec, chains: Chain[], paras: OutlinePara[]) => {
  const used = new Set(paras.flatMap((p) => p.chains));
  return usableChains(spec, chains).filter((c) => !used.has(c.id));
};

/** Paragraph ids that still point at chains that exist. */
export const cleanParas = (paras: OutlinePara[], chains: Chain[]) => paras.map((p) => ({ ...p, chains: p.chains.filter((id) => chains.some((c) => c.id === id)) }));
