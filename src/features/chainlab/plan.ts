/**
 * Screen ② "Cân": weigh the chains area by area, decide the position, then lay the chains out as paragraphs.
 * Pure helpers; the screen keeps the student's choices in `Plan` on the attempt.
 */
import { CL_IMPACT_AREAS, CL_SHAPE_LABEL } from './constants';
import { causeLabel, gridFor, isCompare, isWritten, type MapExtras } from './ideamap';
import { filledSteps, shapeOf, sidesOf, verdictStatus } from './model';
import type { Chain, PromptSpec, Side } from './types';

/** Which side is heavier in one area. */
export type Win = 'left' | 'right' | '=';
export interface AreaWeigh { win: Win | null; crit: string[]; why: string }
/** How far the position leans: fully / mostly to one side, or balanced. */
export type Lean = 'L2' | 'L1' | '0' | 'R1' | 'R2';
export type Layout = 'concede' | 'reasons' | 'views' | 'questions';
export interface OutlinePara { id: string; job: string; chains: string[] }

export interface Plan {
  /** Contested areas: the student's weighing, by area name. */
  areas?: Record<string, AreaWeigh>;
  /** Areas the student left out of the weighing (and the essay). */
  dropped?: string[];
  /** "Không, một vùng nặng hơn cả": the area that decides, and why. */
  override?: { area: string; why: string } | null;
  lean?: Lean | null;
  main?: string[];
  concession?: string | null;
  scope?: string;
  layout?: Layout;
  paras?: OutlinePara[];
}

export interface AreaGroup {
  area: string;
  left: Chain[];
  right: Chain[];
  /** Chains whose Scope cases fall on both sides: they hold only under a condition. */
  mixed: Chain[];
  /** Chains not placed on the rope yet. */
  loose: Chain[];
  /** Comparison prompts: the area's result comes from the map's cell verdicts. */
  fromMap?: { right: number; left: number; eq: number };
}

/** Comparison prompts: driver A is the first view (right end), B the second (left end). */
export const drvSide = (c: Chain): Side => (c.drv === 'B' ? 'left' : 'right');

/** Where a verdict chain sits on the rope; a chain whose cases fall on both sides is 'mixed'. */
export function chainSide(spec: PromptSpec, c: Chain): Side | 'mixed' {
  if (c.split) {
    const s = new Set(c.split.branches.map((b) => b.side || null));
    if (s.size === 1) return [...s][0];
    return s.has(null) ? null : 'mixed';
  }
  if (c.side) return c.side;
  return isCompareSpec(spec) ? drvSide(c) : null;
}

const verdictQ = (spec: PromptSpec) => spec.questions.find((q) => q.shape === 'verdict');
const isCompareSpec = (spec: PromptSpec) => { const v = verdictQ(spec); return !!v && isCompare(spec, v); };
export const areaOf = (c: Chain) => c.area || (c.cell && c.cell.c) || 'Khác';
const ORDER = CL_IMPACT_AREAS.map(([a]) => a);

/** Written verdict chains. */
export const verdictChains = (spec: PromptSpec, chains: Chain[]) => chains.filter((c) => shapeOf(spec, c) === 'verdict' && isWritten(c));

/** The verdict chains grouped by area, in the map's column order. */
export function areaGroups(spec: PromptSpec, chains: Chain[], extras?: MapExtras): AreaGroup[] {
  const m = new Map<string, AreaGroup>();
  verdictChains(spec, chains).forEach((c) => {
    const a = areaOf(c);
    if (!m.has(a)) m.set(a, { area: a, left: [], right: [], mixed: [], loose: [] });
    const g = m.get(a), s = chainSide(spec, c);
    (s === 'left' ? g.left : s === 'right' ? g.right : s === 'mixed' ? g.mixed : g.loose).push(c);
  });
  const vq = verdictQ(spec);
  if (vq && isCompare(spec, vq)) {
    const grid = gridFor(spec, vq, chains, extras);
    m.forEach((g) => {
      const t = { right: 0, left: 0, eq: 0 };
      grid.rows.forEach((r) => { const v = (extras?.cmp || {})[r.key + '|' + g.area]; if (v && v.win) { if (v.win === 'A') t.right += 1; else if (v.win === 'B') t.left += 1; else t.eq += 1; } });
      g.fromMap = t;
    });
  }
  return [...m.values()].sort((a, b) => (ORDER.indexOf(a.area) + 1 || 99) - (ORDER.indexOf(b.area) + 1 || 99));
}

export const contested = (g: AreaGroup) => !g.fromMap && g.left.length > 0 && g.right.length > 0;

/** An area's result: one-sided areas decide themselves, contested ones need the student, comparison prompts read the map. */
export function areaWin(g: AreaGroup, plan: Plan): Win | null {
  if (g.fromMap) { const t = g.fromMap; return t.right + t.left + t.eq === 0 ? null : t.right > t.left ? 'right' : t.left > t.right ? 'left' : '='; }
  if (g.left.length && !g.right.length) return 'left';
  if (g.right.length && !g.left.length) return 'right';
  if (!g.left.length && !g.right.length) return null;
  return plan.areas?.[g.area]?.win || null;
}

export interface Tally { right: number; left: number; eq: number; open: string[]; done: string[] }
export function tally(groups: AreaGroup[], plan: Plan): Tally {
  const t: Tally = { right: 0, left: 0, eq: 0, open: [], done: [] };
  groups.forEach((g) => {
    if ((plan.dropped || []).includes(g.area)) return;
    const w = areaWin(g, plan);
    if (w === null) { if (g.left.length || g.right.length) t.open.push(g.area); return; }
    t.done.push(g.area);
    if (w === 'right') t.right += 1; else if (w === 'left') t.left += 1; else t.eq += 1;
  });
  return t;
}

/** The side the weighing points to, before or after the student's override. */
export function suggestedSide(t: Tally): Win | null {
  if (!t.done.length) return null;
  return t.right > t.left ? 'right' : t.left > t.right ? 'left' : '=';
}
export function finalSide(groups: AreaGroup[], plan: Plan): Win | null {
  if (plan.override && plan.override.area) {
    const g = groups.find((x) => x.area === plan.override.area);
    const w = g ? areaWin(g, plan) : null;
    if (w) return w;
  }
  return suggestedSide(tally(groups, plan));
}

export function suggestedLean(groups: AreaGroup[], plan: Plan): Lean | null {
  const side = finalSide(groups, plan), t = tally(groups, plan);
  if (!side) return null;
  if (side === '=') return '0';
  const mine = side === 'right' ? t.right : t.left, theirs = side === 'right' ? t.left : t.right;
  const k = side === 'right' ? 'R' : 'L';
  // "Fully" only once every area is weighed and none went the other way or tied.
  return (theirs === 0 && t.eq === 0 && !t.open.length && mine > 1 ? k + '2' : k + '1') as Lean;
}

export const leanSide = (l: Lean | null | undefined): 'left' | 'right' | null => (!l || l === '0' ? null : l[0] === 'R' ? 'right' : 'left');

export function leanLabel(spec: PromptSpec, l: Lean): string {
  const [L, R] = sidesOf(spec);
  return l === '0' ? 'Cân bằng' : (l[1] === '2' ? 'Hoàn toàn ' : 'Phần lớn ') + (l[0] === 'R' ? R : L).toLowerCase();
}

/** Chains on one side, strongest-looking first: holds its side, then depends on "if", then untested. */
export function sideChains(spec: PromptSpec, chains: Chain[], side: 'left' | 'right', groups: AreaGroup[], plan: Plan): Chain[] {
  const rank = (c: Chain) => { const l = verdictStatus(c).label; return l === 'Giữ hướng' ? 0 : l === 'Chưa thử' ? 2 : 1; };
  const wonArea = (c: Chain) => { const g = groups.find((x) => x.area === areaOf(c)); return g && areaWin(g, plan) === side ? 0 : 1; };
  return verdictChains(spec, chains).filter((c) => chainSide(spec, c) === side && !(plan.dropped || []).includes(areaOf(c)))
    .sort((a, b) => wonArea(a) - wonArea(b) || rank(a) - rank(b));
}

export interface ScopeHint { text: string; from: string }
/** Conditions the student already found: Scope findings, Scope cases, and findings that point the other way. */
export function scopeHints(spec: PromptSpec, chains: Chain[]): ScopeHint[] {
  const out: ScopeHint[] = [];
  verdictChains(spec, chains).forEach((c) => {
    const name = chainName(c);
    c.findings.forEach((f) => { if (!f.empty && f.text.trim() && (f.kind === 'Scope' || (f.side && c.side && f.side !== c.side))) out.push({ text: f.text.trim(), from: name + ' · ' + f.kind }); });
    if (c.split) c.split.branches.forEach((b) => { if (b.label.trim()) out.push({ text: (c.split.noun ? c.split.noun + ': ' : '') + b.label.trim(), from: name + ' · Scope' }); });
  });
  const seen = new Set<string>();
  return out.filter((h) => (seen.has(h.text) ? false : (seen.add(h.text), true))).slice(0, 6);
}

export const chainName = (c: Chain) => (c.drv ? c.drv + ' · ' : '') + causeLabel(c);

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

/** The paragraphs a layout suggests, filled from the weighing and the position. */
export function buildOutline(spec: PromptSpec, chains: Chain[], groups: AreaGroup[], plan: Plan, layout: Layout): OutlinePara[] {
  const [L, R] = sidesOf(spec);
  const my: 'left' | 'right' = leanSide(plan.lean) || (finalSide(groups, plan) === 'left' ? 'left' : 'right');
  const other = my === 'right' ? 'left' : 'right';
  const ok = (id: string | null | undefined) => !!id && chains.some((c) => c.id === id);
  const mine = sideChains(spec, chains, my, groups, plan).map((c) => c.id);
  const theirs = sideChains(spec, chains, other, groups, plan).map((c) => c.id);
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

