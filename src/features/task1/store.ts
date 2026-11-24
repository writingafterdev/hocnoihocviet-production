/**
 * Task 1 attempts: one student's work on one chart prompt — the findings (① So sánh), where they go (② Chia đoạn) and the
 * essay (③ Viết bài). Saved per signed-in user in D1 through /api/task1/attempts, apart from Task 2 attempts.
 */
import type { GuidedSentence } from '@/lib/ai/guided-essay';
import { newId, SignedOutError, type EssayState } from '../attempts/store';
import type { Row } from './engine';

export type Task1Step = 'compare' | 'plan' | 'write';

export type Task1Crit = 'ta' | 'cc' | 'lr' | 'gra';
/** One comment on the report: the criterion, a short name, which paragraph (1-based), the exact words, why, and a fix. */
export interface Task1Comment { crit: Task1Crit; label: string; section: number; quote: string; text: string; fix: string }

/** The AI's assessment of a Task 1 report, shaped like Task 2's: band, summary, per-criterion analysis, comments that quote the essay. */
export interface Task1Review {
  scores: { band: number; ta: number; cc: number; lr: number; gra: number };
  summary: string;
  praise: string;
  /** Per criterion: why this band, what is missing, the next step, and the descriptor phrases for this band and the next. */
  criteria: Record<Task1Crit, { why: string; gap: string; next: string; bandQuote: string; nextQuote: string }>;
  comments: Task1Comment[];
  /** The prompt's key features (from the checks) and whether the report covers each one. */
  features: { label: string; covered: boolean; note: string }[];
  /** "Khung bài của bạn": what the introduction and overview say, and each body paragraph's points (weak when thin or only listing numbers). */
  skeleton: { intro: string; overview: string; bodies: { section: number; points: string[]; weak: boolean }[] };
  /** The paragraphs that were graded, so highlights match what was read. */
  paragraphs: string[];
}

export interface Task1Attempt {
  id: string;
  promptId: string;
  createdAt: number;
  updatedAt: number;
  step: Task1Step;
  /** ① So sánh: every finding the checks passed, in the order found. */
  found: { row: Row }[];
  /** ② Chia đoạn: finding index → body paragraph key (b1, b2, b3); Tổng quan keeps copies in `ov`. */
  place: Record<number, string>;
  ov: number[];
  /** Paragraph order chosen by the student (overview, b1, b2, b3). */
  order: string[] | null;
  /** ③ Viết bài: how the student writes (null until chosen) and the essay itself (drafts by section, guided round, notes). */
  mode: 'guided' | 'free' | null;
  essay: EssayState;
  review: Task1Review | null;
}

export function createTask1Attempt(promptId: string): Task1Attempt {
  const now = Date.now();
  return {
    id: newId('t1'), promptId, createdAt: now, updatedAt: now, step: 'compare',
    found: [], place: {}, ov: [], order: null, mode: null,
    essay: { bodies: [], drafts: {}, seconds: 0, review: null }, review: null,
  };
}

/** The guided round's sentences live in essay.guided.plan, typed for GuidedWriter. */
export type Task1Sentence = GuidedSentence;

async function call<T>(url: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' });
  if (res.status === 401) throw new SignedOutError();
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('save_failed_' + res.status);
  return (await res.json()) as T;
}

export const task1Store = {
  async get(id: string) {
    const r = await call<{ attempt: Task1Attempt }>('/api/task1/attempts/' + encodeURIComponent(id));
    return r ? r.attempt : null;
  },
  async save(a: Task1Attempt) {
    const body = JSON.stringify(a);
    const r = await call<{ ok: true }>('/api/task1/attempts/' + encodeURIComponent(a.id), { method: 'PUT', body, keepalive: body.length < 60000 });
    if (!r) throw new Error('save_failed_404');
  },
  async list(promptId?: string) {
    const r = await call<{ attempts: Task1Attempt[] }>('/api/task1/attempts' + (promptId ? '?promptId=' + encodeURIComponent(promptId) : ''));
    return r ? r.attempts : [];
  },
  /** True when Task 1 is open to this user (admins, while it is being built). */
  async access() {
    try { const r = await fetch('/api/task1/access', { credentials: 'same-origin' }); return r.ok; } catch { return false; }
  },
};
