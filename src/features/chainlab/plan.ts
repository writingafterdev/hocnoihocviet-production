/**
 * Screen ② "Cân": the ideas of the two sides are paired (only ideas that meet: same people or same outcome), each pair
 * asks one question, the pair results suggest the position, and the outline is built from the pairs. Pure helpers; the
 * screen keeps the student's choices in `Plan` on the attempt.
 */
import { CL_SHAPE_LABEL, CL_SHAPE_LENSES } from './constants';
import { causeLabel, isCompare, isWritten, type CellCmp, type MapExtras } from './ideamap';
import { filledSteps, ropeUnits, shapeOf, sidesOf } from './model';
import type { Chain, PromptSpec, RopeUnit, Side } from './types';

/** Which side is stronger in a pair. */
export type Win = 'left' | 'right' | '=';
/** How far the position leans: fully / mostly to one side, or balanced. */
export type Lean = 'L2' | 'L1' | '0' | 'R1' | 'R2';
export type Layout = 'concede' | 'reasons' | 'views' | 'questions';
/** One body paragraph: its job, its items (pair ids, or `pt:` + point key) and the chains they bring. */
export interface OutlinePara { id: string; job: string; chains: string[]; items?: string[]; frames?: string[] }

/** Two ideas weighed against each other: `l` on the left side, `r` on the right (point keys). */
export interface Pair {
  id: string;
  l: string;
  r: string;
  win?: Win | null;
  /** Lens by lens: who is stronger, and what the student wrote where a side has no chip. */
  lens?: Lens;
  /** The student picked `win` themselves; otherwise it follows the lens table. */
  set?: boolean;
  /** Older plans: the reason picked from a fixed set. */
  why?: string;
  who?: { l?: string; r?: string };
}

/** One lens row of a comparison: who is stronger on it; `l` / `r` = a short note where that side has no chip. */
export interface LensRow { win?: Win | null; l?: string; r?: string }
/** Rows in the order the student settled them: the first is the lead reason. */
export type Lens = Record<string, LensRow>;

export interface Plan {
  /** The pairs, once the student changed the suggested ones. */
  pairs?: Pair[];
  lean?: Lean | null;
  scope?: string;
  layout?: Layout;
  paras?: OutlinePara[];
  /** Older plans: the criterion table. Kept so saved attempts still load. */
  crit?: unknown;
  decide?: string[];
  why?: string;
  main?: string[];
  concession?: string | null;
}

/** Comparison prompts: driver A is the first view (right end), B the second (left end). */
export const drvSide = (c: Chain): Side => (c.drv === 'B' ? 'left' : 'right');

export const verdictQ = (spec: PromptSpec) => spec.questions.find((q) => q.shape === 'verdict');
export const areaOf = (c: Chain) => (c.cell && c.cell.c) || c.area || '';

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

// ---- Points: what gets paired --------------------------------------------------------------------------------

/** One driver: benefit vs harm. Two drivers: A vs B, after a match-up in each cell. Only: does B stand without A? */
export type Mode = 'one' | 'two' | 'only';
export function modeOf(spec: PromptSpec): Mode | null {
  const vq = verdictQ(spec);
  if (!vq) return null;
  if (!isCompare(spec, vq)) return 'one';
  return spec.claim === 'only' ? 'only' : 'two';
}

/** A cell of a two-driver map with its A and B chains and the student's match-up. */
export interface Duel { r: string; c: string; a?: string; b?: string; cmp?: CellCmp }

/** An idea on one side: a chain (or Scope case), or a two-driver cell after its match-up. */
export interface Point {
  key: string;
  side: 'left' | 'right' | null;
  /** The people (map row) and the outcome (map column) it is about; '' when the chain came from no cell. */
  who: string;
  what: string;
  name: string;
  /** Its chains, the one that carries it first. */
  chains: string[];
  duel?: Duel;
  unit?: RopeUnit;
}

const cellSide = (mode: Mode, win?: CellCmp['win']): 'left' | 'right' | null =>
  mode === 'only' ? (win === 'A' ? 'right' : win === 'B' || win === '=' ? 'left' : null) : win === 'A' ? 'right' : win === 'B' ? 'left' : null;

export function pointsOf(spec: PromptSpec, chains: Chain[], extras?: MapExtras): Point[] {
  const mode = modeOf(spec);
  if (!mode) return [];
  const name = (c: Chain) => chainName(spec, c);
  if (mode === 'one') {
    return ropeUnits(spec, chains).filter((u) => u.kind === 'unit').flatMap((u) => {
      const c = chains.find((x) => x.id === u.chainId);
      if (!c || !isWritten(c)) return [];
      return [{ key: u.key, side: u.side === 'left' || u.side === 'right' ? u.side : null, who: c.cell?.r || '', what: areaOf(c), name: name(c) + (u.sub ? ' · ' + u.sub : ''), chains: [c.id], unit: u }];
    });
  }
  const written = verdictChains(spec, chains);
  const cells = new Map<string, Duel>();
  const out: Point[] = [];
  written.forEach((c) => {
    if (!c.cell) {
      if (mode === 'two') out.push({ key: c.id, side: c.side === 'left' || c.side === 'right' ? c.side : drvSide(c), who: '', what: areaOf(c), name: name(c), chains: [c.id] });
      return;
    }
    const k = c.cell.r + '|' + c.cell.c;
    const d = cells.get(k) || { r: c.cell.r, c: c.cell.c };
    if (c.drv === 'B') d.b = d.b || c.id; else d.a = d.a || c.id;
    cells.set(k, d);
  });
  cells.forEach((d, k) => {
    d.cmp = extras?.cmp?.[k];
    const A = chains.find((x) => x.id === d.a), B = chains.find((x) => x.id === d.b);
    if (mode === 'only') {
      if (!A) return; // B alone is outside what A claims to solve.
      const win = d.cmp?.win || null;
      // Where the alternative works, the idea is B's; elsewhere it is A's.
      const first = B && (win === 'B' || win === '=') ? B : A;
      out.push({ key: 'cell:' + k, side: cellSide(mode, win), who: d.r, what: d.c, name: name(first), chains: [first.id, (first === A ? B : A)?.id].filter(Boolean), duel: d });
      return;
    }
    if (A && B) {
      const win = d.cmp?.win || null;
      const first = win === 'B' ? B : A;
      out.push({ key: 'cell:' + k, side: cellSide(mode, win), who: d.r, what: d.c, name: name(first), chains: [first.id, (first === A ? B : A).id], duel: d });
      return;
    }
    const c = A || B;
    out.push({ key: c.id, side: c.side === 'left' || c.side === 'right' ? c.side : drvSide(c), who: d.r, what: d.c, name: name(c), chains: [c.id] });
  });
  return out;
}

/** Two-driver cells with both A and B: the match-ups of step 0. */
export const duelsOf = (points: Point[]) => points.filter((p) => p.duel && p.duel.a && p.duel.b);

// ---- Pairs ---------------------------------------------------------------------------------------------------

/** How two ideas meet: same people and outcome, same people, same outcome, or not at all. */
export type Rel = 'same' | 'who' | 'what' | 'none';
const norm = (s: string) => s.trim().toLowerCase();
export function relOf(a: Point, b: Point): Rel {
  const w = !!a.who && !!b.who && norm(a.who) === norm(b.who);
  const t = !!a.what && !!b.what && norm(a.what) === norm(b.what);
  return w && t ? 'same' : w ? 'who' : t ? 'what' : 'none';
}
export const REL_LABEL: Record<Rel, string> = { same: 'Cùng ô', who: 'Cùng người', what: 'Cùng vùng', none: 'Chưa gặp nhau' };
export const REASONS: Record<Rel, string[]> = {
  same: ['lớn hơn', 'lâu hơn', 'không bù được'],
  who: ['cấp thiết hơn', 'cái này dẫn tới cái kia', 'tùy người'],
  what: ['nhiều người hơn', 'yếu thế hơn', 'không tự lo được'],
  none: ['lớn hơn', 'nhiều người hơn', 'lâu hơn'],
};
export const TUY_NGUOI = 'tùy người';

/** The one question a pair asks. */
export function pairQuestion(a: Point, b: Point): string {
  const rel = relOf(a, b);
  if (rel === 'same') return 'Với ' + a.who + ', về ' + a.what.toLowerCase() + ': bên nào nặng hơn?';
  if (rel === 'who') return a.who + ' cần cái nào hơn: ' + a.what.toLowerCase() + ' hay ' + b.what.toLowerCase() + '?';
  if (rel === 'what') return a.what + ' của ai cần được giữ hơn: ' + a.who + ' hay ' + b.who + '?';
  return 'Bên nào nặng hơn?';
}

const SCORE: Record<Rel, number> = { same: 3, who: 2, what: 1, none: 0 };
export const pairId = (l: string, r: string) => l + '~' + r;

/** Suggested pairs: those that meet best first, each idea once; then every idea left over joins its best partner. */
export function suggestPairs(points: Point[]): Pair[] {
  const Ls = points.filter((p) => p.side === 'left'), Rs = points.filter((p) => p.side === 'right');
  // Two Scope cases of one chain are its own condition (Phạm vi), not two ideas to weigh.
  const own = (l: Point, r: Point) => l.chains.some((c) => r.chains.includes(c));
  const all = Ls.flatMap((l, i) => Rs.map((r, j) => ({ l, r, s: SCORE[relOf(l, r)], o: i * 1000 + j }))).filter((x) => x.s > 0 && !own(x.l, x.r));
  // Among equally good pairs, take first the ideas with fewer partners, so more ideas get a pair of their own.
  const deg = (k: string) => all.filter((x) => x.l.key === k || x.r.key === k).length;
  const cands = all.sort((x, y) => y.s - x.s || (deg(x.l.key) + deg(x.r.key)) - (deg(y.l.key) + deg(y.r.key)) || x.o - y.o);
  const used = new Set<string>(), out: Pair[] = [];
  cands.forEach((x) => {
    if (used.has(x.l.key) || used.has(x.r.key)) return;
    used.add(x.l.key); used.add(x.r.key);
    out.push({ id: pairId(x.l.key, x.r.key), l: x.l.key, r: x.r.key, win: null });
  });
  [...Ls, ...Rs].forEach((p) => {
    if (used.has(p.key)) return;
    const best = cands.find((x) => x.l.key === p.key || x.r.key === p.key);
    if (!best) return;
    used.add(p.key);
    if (!out.some((q) => q.id === pairId(best.l.key, best.r.key))) out.push({ id: pairId(best.l.key, best.r.key), l: best.l.key, r: best.r.key, win: null });
  });
  return out;
}

/** The pairs in play: the student's, minus any whose ideas are gone or changed side; else the suggested ones. */
export function livePairs(plan: Plan, points: Point[]): Pair[] {
  const side = (k: string) => points.find((p) => p.key === k)?.side;
  if (!plan.pairs) return suggestPairs(points);
  return plan.pairs.filter((p) => side(p.l) === 'left' && side(p.r) === 'right');
}

export const winnerOf = (p: Pair) => (p.win === 'left' ? p.l : p.win === 'right' ? p.r : null);

// ---- The position --------------------------------------------------------------------------------------------

export interface PairTally { left: number; right: number; eq: number; open: number; byPairs: boolean }
/** Ideas that won at least one pair, per side (each idea counted once). Without pairs: the ideas on each side. */
export function pairTally(mode: Mode | null, points: Point[], pairs: Pair[]): PairTally {
  const openDuels = mode === 'two' ? duelsOf(points).filter((p) => !p.side).length : 0;
  if (mode === 'only' || !pairs.length) {
    return { left: points.filter((p) => p.side === 'left').length, right: points.filter((p) => p.side === 'right').length, eq: 0, open: points.filter((p) => !p.side && (mode !== 'one')).length, byPairs: false };
  }
  const won = { left: new Set<string>(), right: new Set<string>() };
  pairs.forEach((p) => { if (p.win === 'left') won.left.add(p.l); if (p.win === 'right') won.right.add(p.r); });
  return { left: won.left.size, right: won.right.size, eq: pairs.filter((p) => p.win === '=').length, open: pairs.filter((p) => !p.win).length + openDuels, byPairs: true };
}

export function suggestedLean(t: PairTally): Lean | null {
  if (!t.left && !t.right) return t.eq ? '0' : null;
  if (t.left === t.right) return '0';
  const k = t.right > t.left ? 'R' : 'L';
  const theirs = k === 'R' ? t.left : t.right;
  // "Fully" only when the other side won nothing and nothing is tied or still open.
  return (theirs === 0 && !t.eq && !t.open ? k + '2' : k + '1') as Lean;
}

export const leanSide = (l: Lean | null | undefined): 'left' | 'right' | null => (!l || l === '0' ? null : l[0] === 'R' ? 'right' : 'left');

export function leanLabel(spec: PromptSpec, l: Lean): string {
  const [L, R] = sidesOf(spec);
  return l === '0' ? 'Cân bằng' : (l[1] === '2' ? 'Hoàn toàn ' : 'Phần lớn ') + (l[0] === 'R' ? R : L).toLowerCase();
}

export interface ScopeHint { text: string; from: string }
/** Conditions the student already found: "tùy người" pairs, cells only A reaches, Scope findings and cases. */
export function scopeHints(spec: PromptSpec, chains: Chain[], points: Point[], pairs: Pair[]): ScopeHint[] {
  const out: ScopeHint[] = [];
  const P = (k: string) => points.find((p) => p.key === k);
  pairs.forEach((p) => {
    if (p.why !== TUY_NGUOI) return;
    const l = P(p.l), r = P(p.r), wl = p.who?.l?.trim(), wr = p.who?.r?.trim();
    if (l && r && (wl || wr)) out.push({ text: [wr && '«' + r.name + '» với ' + wr, wl && '«' + l.name + '» với ' + wl].filter(Boolean).join('; '), from: 'Cặp «tùy người»' });
  });
  if (modeOf(spec) === 'only') {
    const onlyA = points.filter((p) => p.duel?.cmp?.win === 'A').map((p) => p.who + ' (' + p.what.toLowerCase() + ')');
    if (onlyA.length && points.some((p) => p.side === 'left')) out.push({ text: 'không phải cách duy nhất, nhưng là cách duy nhất cho ' + onlyA.slice(0, 2).join(', '), from: 'Ô chỉ A xử lý được' });
  }
  verdictChains(spec, chains).forEach((c) => {
    const name = chainName(spec, c);
    c.findings.forEach((f) => { if (!f.empty && f.text.trim() && (f.kind === 'Scope' || (f.side && c.side && f.side !== c.side))) out.push({ text: f.text.trim(), from: name + ' · ' + f.kind }); });
    if (c.split) c.split.branches.forEach((b) => { if (b.label.trim()) out.push({ text: (c.split.noun ? c.split.noun + ': ' : '') + b.label.trim(), from: name + ' · Scope' }); });
  });
  const seen = new Set<string>();
  return out.filter((h) => (seen.has(h.text) ? false : (seen.add(h.text), true))).slice(0, 6);
}

// ---- Frames: one sentence plan per item ------------------------------------------------------------------------

const PHRASE: Record<string, string> = {
  'lớn hơn': 'tác động lớn hơn',
  'lâu hơn': 'kéo dài lâu hơn',
  'không bù được': 'mất đi thì không gì bù lại được',
  'cấp thiết hơn': 'họ cần nó gấp hơn',
  'cái này dẫn tới cái kia': 'có nó thì mới có cái kia',
  'nhiều người hơn': 'chạm tới nhiều người hơn',
  'yếu thế hơn': 'người chịu tác động yếu thế hơn',
  'không tự lo được': 'họ không tự lo được phần này',
};

// ---- Lenses: the chips of ① decide each comparison ------------------------------------------------------------

/** The lenses a verdict chain can be tested with on ①. */
export const LENSES = CL_SHAPE_LENSES.verdict;
/** How each lens opens a clause of the explanation. */
const LENS_AT: Record<string, string> = { 'Dài hạn': 'về lâu dài', 'Khả thi': 'về tính khả thi', 'Quy mô': 'về quy mô', 'With/Without': 'khi có và không có nó', Scope: 'về phạm vi' };
export const lensAt = (k: string) => LENS_AT[k] || 'về ' + k.toLowerCase();

/** A chain's chips by lens (a Scope case: chips for the whole chain or for that case). */
export function chainChips(c: Chain | undefined, branch?: number | null): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  (c?.findings || []).forEach((f) => {
    if (f.empty || !f.text.trim()) return;
    if (branch != null && f.target !== 'all' && f.target !== branch) return;
    (out[f.kind] = out[f.kind] || []).push(f.text.trim());
  });
  return out;
}
export const pointChips = (pt: Point | undefined, chains: Chain[]) =>
  pt ? chainChips(chains.find((c) => c.id === pt.chains[0]), pt.unit?.ref.type === 'branch' ? pt.unit.ref.k : null) : {};

/** Who the lens table favours: more rows won; null when no row is settled. */
export function lensLean(lens?: Lens): Win | null {
  const rows = Object.values(lens || {}).filter((v) => v.win);
  if (!rows.length) return null;
  const l = rows.filter((v) => v.win === 'left').length, r = rows.filter((v) => v.win === 'right').length;
  return l > r ? 'left' : r > l ? 'right' : '=';
}

/** A side's text on one lens: its chip, else the student's note. */
const lensText = (chips: Record<string, string[]>, k: string, note?: string) => (chips[k] && chips[k][0]) || (note || '').trim();
const q = (t: string) => (t ? '«' + t + '»' : '…');

/**
 * The explanation a lens table gives: "W nặng hơn: về lâu dài, «…» trong khi «…»; hơn nữa, về quy mô, «…». Dù về
 * tính khả thi, «…»." Empty when no row is settled.
 */
export function lensReason(lens: Lens | undefined, win: Win, W: { name: string; chips: Record<string, string[]>; s: 'l' | 'r' }, Lo: { name: string; chips: Record<string, string[]>; s: 'l' | 'r' }, ctx = ''): string {
  const rows = Object.entries(lens || {}).filter(([, v]) => v.win);
  if (!rows.length) return '';
  const txt = (side: typeof W, k: string, v: LensRow) => lensText(side.chips, k, v[side.s]);
  if (win === '=') {
    const by = (s: 'l' | 'r') => rows.filter(([, v]) => v.win === (s === 'l' ? 'left' : 'right')).map(([k]) => lensAt(k));
    const a = W.s === 'l' ? by('l') : by('r'), b = W.s === 'l' ? by('r') : by('l');
    return '«' + W.name + '» và «' + Lo.name + '» nặng ngang nhau' + ctx + (a.length || b.length ? ': ' + [a.length && '«' + W.name + '» hơn ' + a.join(', '), b.length && '«' + Lo.name + '» hơn ' + b.join(', ')].filter(Boolean).join(', còn ') : '') + '.';
  }
  const won = rows.filter(([, v]) => v.win === win), lost = rows.filter(([, v]) => v.win && v.win !== '=' && v.win !== win);
  const parts = won.map(([k, v], i) => {
    const lo = txt(Lo, k, v);
    return (i === 0 ? '' : i === 1 ? 'hơn nữa, ' : 'thêm nữa, ') + lensAt(k) + ', ' + q(txt(W, k, v)) + (i === 0 && lo ? ' trong khi ' + q(lo) : '');
  });
  const head = '«' + W.name + '» nặng hơn' + ctx + (parts.length ? ': ' + parts.join('; ') : '') + '.';
  const tail = lost.length ? ' Dù ' + lost.map(([k, v]) => lensAt(k) + ', ' + q(txt(Lo, k, v))).join('; ') + '.' : '';
  return head + tail;
}

export function pairFrame(p: Pair, points: Point[], chains: Chain[] = []): string {
  const l = points.find((x) => x.key === p.l), r = points.find((x) => x.key === p.r);
  if (!l || !r) return '';
  if (!p.win) return 'Chưa cân: «' + l.name + '» với «' + r.name + '».';
  const rel = relOf(l, r);
  const ctx = rel === 'same' ? ' với ' + l.who + ' (' + l.what.toLowerCase() + ')' : rel === 'who' ? ' với ' + l.who : rel === 'what' ? ' về ' + l.what.toLowerCase() : '';
  const side = (pt: Point, s: 'l' | 'r') => ({ name: pt.name, chips: pointChips(pt, chains), s });
  const byLens = p.win === 'left' ? lensReason(p.lens, p.win, side(l, 'l'), side(r, 'r'), ctx) : lensReason(p.lens, p.win, side(r, 'r'), side(l, 'l'), ctx);
  if (byLens) return byLens;
  if (p.win === '=') {
    const wl = p.who?.l?.trim(), wr = p.who?.r?.trim();
    if (p.why === TUY_NGUOI && (wl || wr)) return '«' + r.name + '» quan trọng hơn với ' + (wr || '…') + ', còn «' + l.name + '» với ' + (wl || '…') + '.';
    return '«' + l.name + '» và «' + r.name + '» nặng ngang nhau.';
  }
  const W = p.win === 'left' ? l : r, Lo = p.win === 'left' ? r : l;
  const why = p.why === TUY_NGUOI ? '' : p.why ? ' vì ' + (PHRASE[p.why] || p.why) : '';
  return 'Dù «' + Lo.name + '», «' + W.name + '» nặng hơn' + ctx + why + '.';
}

export function pointFrame(spec: PromptSpec, pt: Point, chains: Chain[] = []): string {
  const at = pt.who ? ' (' + pt.who + ' · ' + pt.what.toLowerCase() + ')' : '';
  const mode = modeOf(spec);
  if (mode === 'only' && pt.duel) {
    const w = pt.duel.cmp?.win;
    const b = pt.duel.b ? '«' + pt.name + '»' : 'cách khác';
    return w === 'B' ? 'Ở ' + pt.who + ' · ' + pt.what.toLowerCase() + ', ' + b + ' làm được mà không cần A.' : w === '=' ? 'Ở ' + pt.who + ' · ' + pt.what.toLowerCase() + ', ' + b + ' làm được một phần.' : w === 'A' ? 'Ở ' + pt.who + ' · ' + pt.what.toLowerCase() + ', chỉ A làm được: «' + pt.name + '».' : '«' + pt.name + '»' + at + ': chưa xét.';
  }
  // A two-driver cell: its match-up, explained by its lens table (A on the right, B on the left).
  const cmp = pt.duel?.cmp;
  if (mode === 'two' && cmp?.win && cmp.lens) {
    const C = (id?: string) => chains.find((c) => c.id === id);
    const A = { name: chainName(spec, C(pt.duel.a)), chips: chainChips(C(pt.duel.a)), s: 'r' as const }, B = { name: chainName(spec, C(pt.duel.b)), chips: chainChips(C(pt.duel.b)), s: 'l' as const };
    const win: Win = cmp.win === 'A' ? 'right' : cmp.win === 'B' ? 'left' : '=';
    const t = win === 'left' ? lensReason(cmp.lens, win, B, A, at) : lensReason(cmp.lens, win, A, B, at);
    if (t) return t;
  }
  return '«' + pt.name + '»' + at + '.';
}

// ---- Outline ---------------------------------------------------------------------------------------------------

export const LAYOUT_LABEL: Record<Layout, string> = {
  concede: 'Nhượng bộ trước, lý do sau',
  reasons: 'Chỉ lý do, phản bác bên kia',
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

/** What the outline works with: the points and pairs of the verdict question. */
export interface Board { mode: Mode | null; points: Point[]; pairs: Pair[]; chains?: Chain[] }

export const ptItem = (k: string) => 'pt:' + k;
/** The ideas an item brings: a pair's two, or one. */
export function itemPoints(item: string, b: Board): Point[] {
  if (item.startsWith('pt:')) return b.points.filter((p) => p.key === item.slice(3));
  const pr = b.pairs.find((p) => p.id === item);
  return pr ? b.points.filter((p) => p.key === pr.l || p.key === pr.r) : [];
}
export function itemChains(item: string, b: Board): string[] {
  const pr = b.pairs.find((p) => p.id === item);
  const P = (k: string) => b.points.find((p) => p.key === k);
  // A pair's winner leads.
  const pts = pr ? (pr.win === 'left' ? [P(pr.l), P(pr.r)] : [P(pr.r), P(pr.l)]).filter(Boolean) : itemPoints(item, b);
  return pts.flatMap((p) => p.chains).filter((x, i, a) => a.indexOf(x) === i);
}
export const itemFrame = (spec: PromptSpec, item: string, b: Board) => {
  const pr = b.pairs.find((p) => p.id === item);
  if (pr) return pairFrame(pr, b.points, b.chains);
  const pt = itemPoints(item, b)[0];
  return pt ? pointFrame(spec, pt, b.chains) : '';
};
export const itemValid = (item: string, b: Board) => (item.startsWith('pt:') ? b.points.some((p) => p.key === item.slice(3)) : b.pairs.some((p) => p.id === item));

/** Items that belong together: pairs that share an idea, then items with the same people or outcome; at most 2 per paragraph. */
function groupItems(items: string[], b: Board): string[][] {
  const keys = (it: string) => itemPoints(it, b).map((p) => p.key);
  const groups: string[][] = [];
  items.forEach((it) => {
    const g = groups.find((x) => x.length < 2 && x.some((y) => keys(y).some((k) => keys(it).includes(k))));
    if (g) g.push(it); else groups.push([it]);
  });
  const meet = (x: string[], y: string[]) => {
    const a = x.flatMap((i) => itemPoints(i, b)), c = y.flatMap((i) => itemPoints(i, b));
    return a.some((p) => c.some((q) => (p.who && norm(p.who) === norm(q.who)) || (p.what && norm(p.what) === norm(q.what))));
  };
  const out: string[][] = [];
  groups.forEach((g) => {
    const host = g.length === 1 && out.find((x) => x.length === 1 && meet(x, g));
    if (host) host.push(...g); else out.push([...g]);
  });
  return out;
}

/** My side and the items each side wins: pairs won (ties count for the other side), or the ideas themselves when nothing is paired. */
export function sideItems(b: Board, lean: Lean | null | undefined) {
  const t = pairTally(b.mode, b.points, b.pairs);
  const my: 'left' | 'right' = leanSide(lean) || (t.left > t.right ? 'left' : 'right');
  const other: 'left' | 'right' = my === 'right' ? 'left' : 'right';
  const byPairs = b.mode !== 'only' && b.pairs.length > 0;
  const mine = byPairs ? b.pairs.filter((p) => p.win === my).map((p) => p.id) : b.points.filter((p) => p.side === my).map((p) => ptItem(p.key));
  const theirs = byPairs ? [...b.pairs.filter((p) => p.win === other), ...b.pairs.filter((p) => p.win === '=')].map((p) => p.id) : b.points.filter((p) => p.side === other).map((p) => ptItem(p.key));
  return { my, other, mine, theirs };
}

/** The idea an item stands for in one phrase: a pair's winner (or both when tied), or the idea itself. */
export function itemLead(item: string, b: Board): string {
  const pr = b.pairs.find((p) => p.id === item);
  const P = (k: string) => b.points.find((p) => p.key === k);
  if (!pr) return itemPoints(item, b)[0]?.name || '';
  const w = winnerOf(pr);
  return w ? P(w)?.name || '' : (P(pr.r)?.name || '') + ' / ' + (P(pr.l)?.name || '');
}

/** The paragraphs a layout suggests, built from the pairs and the position. */
export function buildOutline(spec: PromptSpec, chains: Chain[], b: Board, lean: Lean | null | undefined, layout: Layout): OutlinePara[] {
  const [L, R] = sidesOf(spec);
  const para = (i: number, job: string, items: string[], ids?: string[]): OutlinePara => ({ id: 'body' + (i + 1), job, items, chains: ids || items.flatMap((it) => itemChains(it, b)).filter((x, k, a) => a.indexOf(x) === k) });

  const { my, other, mine: mineItems, theirs: theirItems } = sideItems(b, lean);
  const mine = groupItems(mineItems, b), theirs = groupItems(theirItems, b);

  if (layout === 'questions') {
    return spec.questions.map((q, i) => {
      if (q.shape === 'verdict') return para(i, CL_SHAPE_LABEL.verdict, [...(mine[0] || []), ...(theirs[0] || []).slice(0, 1)]);
      let ids = usableChains(spec, chains).filter((c) => (c.q || 1) === q.n);
      if (q.shape === 'solution') {
        const causeOrder = chains.map((c) => c.id);
        ids = [...ids].sort((a, c) => causeOrder.indexOf(a.fixes || '') - causeOrder.indexOf(c.fixes || ''));
      }
      return para(i, CL_SHAPE_LABEL[q.shape], [], ids.map((c) => c.id));
    });
  }
  const sideName = (s: 'left' | 'right') => (s === 'right' ? R : L);
  if (layout === 'views') return [para(0, 'Quan điểm: ' + sideName(other), theirs[0] || []), para(1, 'Quan điểm: ' + sideName(my) + ' (phía bạn)', mine[0] || [])];
  if (layout === 'reasons') {
    const out = [para(0, 'Lý do 1', mine[0] || []), para(1, 'Lý do 2', mine[1] || [])];
    if (theirs[0]) out[1] = para(1, out[1].items.length ? 'Lý do 2 + phản bác' : 'Phản bác', [...out[1].items, theirs[0][0]]);
    return out;
  }
  const out = [para(0, 'Nhượng bộ', theirs[0] || []), para(1, 'Lý do chính', mine[0] || [])];
  if (mine[1]) out.push(para(2, 'Lý do thêm', mine[1]));
  return out;
}

/** Every item the outline could hold: the pairs, plus ideas in no pair (and every idea when nothing is paired). */
export function allItems(b: Board): string[] {
  if (b.mode === 'only' || !b.pairs.length) return b.points.map((p) => ptItem(p.key));
  const inPair = new Set(b.pairs.flatMap((p) => [p.l, p.r]));
  return [...b.pairs.map((p) => p.id), ...b.points.filter((p) => !inPair.has(p.key)).map((p) => ptItem(p.key))];
}

/** Items not placed in any paragraph (non-verdict chains for prompts without pairs). */
export const leftOutItems = (b: Board, paras: OutlinePara[]) => {
  const used = new Set(paras.flatMap((p) => p.items || []));
  return allItems(b).filter((it) => !used.has(it));
};
export const leftOutChains = (spec: PromptSpec, chains: Chain[], paras: OutlinePara[]) => {
  const used = new Set(paras.flatMap((p) => p.chains));
  return usableChains(spec, chains).filter((c) => shapeOf(spec, c) !== 'verdict' && !used.has(c.id));
};

/** Paragraphs that only point at items and chains that still exist, with their chains and frames worked out. */
export function cleanParas(spec: PromptSpec, paras: OutlinePara[], chains: Chain[], b: Board): OutlinePara[] {
  return paras.map((p) => {
    if (!p.items) return { ...p, chains: p.chains.filter((id) => chains.some((c) => c.id === id)) };
    const items = p.items.filter((it) => itemValid(it, b));
    const own = p.chains.filter((id) => chains.some((c) => c.id === id && shapeOf(spec, c) !== 'verdict'));
    const ids = [...items.flatMap((it) => itemChains(it, b)), ...own].filter((x, k, a) => a.indexOf(x) === k);
    return { ...p, items, chains: ids, frames: items.map((it) => itemFrame(spec, it, b)).filter(Boolean) };
  });
}
