/**
 * Viết có hướng dẫn · ① Chọn hướng bài. Only a verdict question gets a choice: at most three directions (each side, and
 * Cân bằng), each built one of two ways. A way is two mạch ý (two moves) and where the essay lands. The routes are fixed
 * here; what each move says for a prompt, in its own words and without giving ideas, comes from the AI (lib/ai/direction).
 */
import type { Prompt } from '@/content/prompts';
import type { Chain, Question, Side, Tone } from '../chainlab/types';
import { newId } from '../attempts/store';
import { givenEnd, newBody } from './model';

export type RouteId = 'left' | 'right' | 'balanced';
export type WayId = 'other' | 'own' | 'depends' | 'combine';
export type MoveId = 'concede' | 'rebut' | 'reason' | 'reason2' | 'holds' | 'fails' | 'strong' | 'gap';

export interface Direction { route: RouteId; way: WayId }

/** Each move: its tag, its dot and text colour, and the side of the prompt it argues. */
export const MOVE: Record<MoveId | 'end', { tag: string; dot: string; fg: string; soft: string }> = {
  concede: { tag: 'Công nhận', dot: '#A3A3A3', fg: '#525252', soft: '#F5F5F5' },
  rebut: { tag: 'Phản bác', dot: '#2F62C4', fg: '#2F62C4', soft: '#EEF3FC' },
  reason: { tag: 'Lý do', dot: '#2F62C4', fg: '#2F62C4', soft: '#EEF3FC' },
  reason2: { tag: 'Lý do nữa', dot: '#2F62C4', fg: '#2F62C4', soft: '#EEF3FC' },
  holds: { tag: 'Đúng khi', dot: '#2D881A', fg: '#2D6E1E', soft: '#EDF7EA' },
  fails: { tag: 'Không đúng khi', dot: '#D2401B', fg: '#B33A1A', soft: '#FFF0EB' },
  strong: { tag: 'Làm được', dot: '#2D881A', fg: '#2D6E1E', soft: '#EDF7EA' },
  gap: { tag: 'Bù vào', dot: '#2F62C4', fg: '#2F62C4', soft: '#EEF3FC' },
  end: { tag: 'Kết luận', dot: '#B8862B', fg: '#8A5A00', soft: '#FFF7E0' },
};

export const WAYS: Record<RouteId, { id: WayId; name: string; moves: [MoveId, MoveId] }[]> = {
  left: [{ id: 'other', name: 'Có nhắc phe đối lập', moves: ['concede', 'rebut'] }, { id: 'own', name: 'Chỉ phe mình', moves: ['reason', 'reason2'] }],
  right: [{ id: 'other', name: 'Có nhắc phe đối lập', moves: ['concede', 'rebut'] }, { id: 'own', name: 'Chỉ phe mình', moves: ['reason', 'reason2'] }],
  balanced: [{ id: 'depends', name: 'Tuỳ trường hợp', moves: ['holds', 'fails'] }, { id: 'combine', name: 'Kết hợp cả hai', moves: ['strong', 'gap'] }],
};

/** The question that gets a direction: the prompt's verdict question, if it has one. */
export const directionQuestion = (p: Prompt): Question | null => p.questions.find((q) => q.shape === 'verdict') || null;

/** The card names: each side in the prompt's own labels, then Cân bằng. */
export function routeNames(p: Prompt, q: Question): Record<RouteId, string> {
  const [l, r] = q.sides || ['Phản đối', 'Đồng ý'];
  const left = p.claim === 'only' && l === 'Phản đối' ? 'Không phải cách duy nhất'
    : p.claim === 'best' && l === 'Phản đối' ? 'Không phải cách tốt nhất'
    : l === 'Nhược điểm' ? 'Nhược điểm lớn hơn' : l;
  const right = r === 'Ưu điểm' ? 'Ưu điểm lớn hơn' : r;
  return { left, right, balanced: 'Cân bằng' };
}

/** Per route and way: what the two mạch ý do and where the essay lands, for this prompt. */
export type MoveWording = { b1: string; b2: string; end: string };
export type DirectionWording = { left: { other: MoveWording; own: MoveWording }; right: { other: MoveWording; own: MoveWording }; balanced: { depends: MoveWording; combine: MoveWording } };

export const wordingOf = (w: DirectionWording, d: Direction): MoveWording => (w[d.route] as Record<string, MoveWording>)[d.way];

/** Which side of the prompt a move argues: the chosen side, the other one, or (Cân bằng) right then left. */
function sideOf(d: Direction, k: 0 | 1): Exclude<Side, null> {
  if (d.route === 'balanced') return k === 0 ? 'right' : 'left';
  const other = d.route === 'left' ? 'right' : 'left';
  return d.way === 'other' && k === 0 ? other : d.route;
}
const toneOf = (s: Exclude<Side, null>): Tone => (s === 'right' ? 'benefit' : 'cost');

/** The key the chains were built for, so a changed direction can rebuild them. */
export const directionKey = (d: Direction) => d.route + ':' + d.way;

/**
 * The bodies for a direction, in the prompt's question order: the verdict question gets the way's two mạch ý (each with its
 * job as its role); every other question is placed automatically, one mạch ý each. Each verdict mạch ý starts from the prompt
 * and the student writes where it lands.
 */
export function chainsFor(p: Prompt, d: Direction, w: MoveWording): Chain[] {
  const vq = directionQuestion(p)!;
  const way = WAYS[d.route].find((x) => x.id === d.way)!;
  const out: Chain[] = [];
  for (const q of p.questions) {
    if (q.n !== vq.n) { out.push(newBody(p, q, out)); continue; }
    way.moves.forEach((m, k) => {
      const side = sideOf(d, k as 0 | 1);
      out.push({
        id: newId('b'), q: q.n, title: '', tone: toneOf(side), side, area: '', split: null, findings: [],
        steps: [givenEnd(p, q), ''], mine: 'end', built: false,
        role: { id: m, tag: MOVE[m].tag, text: k === 0 ? w.b1 : w.b2 },
      });
    });
  }
  return out;
}

/** What the essay argues, for the reviewers and the guided writer: where it lands and how it gets there. */
export function stanceOf(p: Prompt, d: Direction, w: MoveWording): string {
  const q = directionQuestion(p);
  if (!q) return '';
  const way = WAYS[d.route].find((x) => x.id === d.way)!;
  return `${w.end} (hướng bài: ${routeNames(p, q)[d.route]} · ${way.name})`;
}
