import { CL, CL_ABBR, CL_ALL_LENS_KINDS, CL_LENSES, CL_LENS_Q, CL_LEVEL_LENSES, CL_SHAPE_LENSES } from './constants';
import type { Chain, Level, Lens, PromptSpec, RopeUnit, Shape } from './types';

export const shapeOf = (spec: PromptSpec, c: Chain): Shape =>
  (spec.questions.find((q) => q.n === (c.q || 1)) || { shape: 'verdict' as Shape }).shape;

export const hasVerdict = (spec: PromptSpec) => spec.questions.some((q) => q.shape === 'verdict');

function lensObj(shape: Shape, kind: string): Lens {
  const l = [...CL_LENSES, ...CL_LEVEL_LENSES].find((x) => x.kind === kind);
  const q = (CL_LENS_Q[shape] || {})[kind];
  return q ? { ...l, q } : l;
}

/** Default lens chips for this chain's question type. */
export function lensesFor(spec: PromptSpec, chain: Chain): Lens[] {
  const sh = shapeOf(spec, chain);
  return (CL_SHAPE_LENSES[sh] || CL_SHAPE_LENSES.verdict).map((k) => lensObj(sh, k));
}

/** Lenses hidden behind "+ Thêm góc nhìn". */
export function extraLensesFor(spec: PromptSpec, chain: Chain): Lens[] {
  const sh = shapeOf(spec, chain);
  // A cause chain is already Cá nhân or Hệ thống; the only lens is the optional Scope.
  if (sh === 'cause') return [];
  const main = CL_SHAPE_LENSES[sh] || CL_SHAPE_LENSES.verdict;
  return CL_ALL_LENS_KINDS.filter((k) => !main.includes(k)).map((k) => lensObj(sh, k));
}

/** Rope end labels from the verdict question. */
export function sidesOf(spec: PromptSpec): [string, string] {
  const v = spec.questions.find((q) => q.shape === 'verdict');
  return (v && v.sides) || ['Phản đối', 'Đồng ý'];
}

/** Chips placed on the rope: one per verdict chain (or per Scope branch), plus one per finding. */
export function ropeUnits(spec: PromptSpec, chains: Chain[]): RopeUnit[] {
  const u: RopeUnit[] = [];
  chains.forEach((c, i) => {
    if (shapeOf(spec, c) !== 'verdict') return;
    const n = i + 1, name = c.title || ('Mạch ' + n);
    const fsFor = (k: number | null) => c.findings.filter((f) => !f.empty && (k == null || f.target === 'all' || f.target === k));
    if (c.split) c.split.branches.forEach((b, k) => u.push({ findings: fsFor(k), sub: b.label, key: c.id + '-' + k, label: n + String.fromCharCode(97 + k), kind: 'unit', chainId: c.id, ref: { type: 'branch', k }, side: b.side || null, tone: c.tone, title: name + (b.label ? ' · ' + b.label : '') }));
    else u.push({ findings: fsFor(null), key: c.id, label: String(n), kind: 'unit', chainId: c.id, ref: { type: 'chain' }, side: c.side || null, tone: c.tone, title: name });
    c.findings.forEach((f) => {
      if (f.empty) return;
      const pre = f.target === 'all' || !c.split ? String(n) : n + String.fromCharCode(97 + (f.target as number));
      u.push({ text: f.text, chainName: name, key: f.id, label: pre + ' · ' + (CL_ABBR[f.kind] || f.kind), kind: 'finding', lens: f.kind, chainId: c.id, ref: { type: 'finding', id: f.id }, side: f.side || null, tone: c.tone, title: f.kind + ': ' + f.text });
    });
  });
  return u;
}

export interface StatusChip { label: string; bg: string; fg: string }

/** Verdict chain status: untested, holds its side, or depends on a condition. */
export function verdictStatus(chain: Chain): StatusChip {
  const bases = chain.split ? chain.split.branches.map((b) => b.side || null) : [chain.side || null];
  const fs = chain.findings.filter((f) => !f.empty && f.side);
  if (!fs.length && !(chain.split && bases.some(Boolean))) return { label: 'Chưa thử', bg: '#F1F1EE', fg: CL.ink5 };
  const clash = fs.some((f) => (f.target === 'all' || !chain.split ? bases : [bases[f.target as number]]).some((s) => s && s !== f.side)) || (chain.split && new Set(bases.filter(Boolean)).size > 1);
  return clash ? { label: 'Phụ thuộc "nếu"', bg: CL.yellowSoft, fg: CL.yellowText } : { label: 'Giữ hướng', bg: CL.mintSoft, fg: CL.greenText };
}

export const filledSteps = (c: Chain) => c.steps.filter((s) => s.trim()).length;

export function chainStatus(spec: PromptSpec, chain: Chain): StatusChip {
  const sh = shapeOf(spec, chain);
  if (sh === 'verdict') return verdictStatus(chain);
  if (sh === 'cause') {
    const n = filledSteps(chain);
    return n >= 2 ? { label: 'Đã xong', bg: CL.mintSoft, fg: CL.greenText } : n === 1 ? { label: 'Đang viết', bg: CL.yellowSoft, fg: CL.yellowText } : { label: 'Chưa viết', bg: CL.redSoft, fg: CL.redText };
  }
  return chain.findings.length || chain.split ? { label: 'Đã thử', bg: CL.mintSoft, fg: CL.greenText } : { label: 'Chưa thử', bg: '#F1F1EE', fg: CL.ink5 };
}

/** Review flags on a chain that the student has not fixed or dismissed yet. */
export function openIssues(chain: Chain) {
  const c = chain.check;
  if (!c) return { flags: [], vague: [] };
  const dis = c.dismissed || [];
  return {
    flags: c.flags.filter((f, k) => !dis.includes('f' + k) && chain.steps[f.at] + '||' + chain.steps[f.at + 1] === f.snap).map((f) => ({ ...f, key: 'f' + c.flags.indexOf(f) })),
    vague: c.vague.filter((v, k) => !dis.includes('v' + k) && chain.steps[v.step] === v.snap).map((v) => ({ ...v, key: 'v' + c.vague.indexOf(v) })),
  };
}

export const newChain = (q = 1, level: Level | null = null): Chain => ({ id: 'c' + Math.random().toString(36).slice(2, 10), q, title: '', tone: 'benefit', pos: 50, area: '', level, steps: [''], split: null, findings: [], fixes: null });

/** Starting point for a new attempt: no chains; each question's idea map is where they start. */
export const initialChains = (_spec: PromptSpec): Chain[] => [];

/** Cause questions that still lack a written chain of one of the two types: [question number, type]. */
export function missingLevels(spec: PromptSpec, chains: Chain[]): [number, Level][] {
  return spec.questions.filter((q) => q.shape === 'cause').flatMap((q) => (['Cá nhân', 'Hệ thống'] as Level[]).filter((l) => !chains.some((c) => (c.q || 1) === q.n && c.level === l && filledSteps(c) > 0)).map((l) => [q.n, l] as [number, Level]));
}
