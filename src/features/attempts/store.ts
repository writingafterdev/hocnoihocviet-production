/**
 * Attempts: one student's work on one prompt (chains, stance, essay, feedback).
 * Saved per signed-in user in D1 through /api/attempts; the screens only talk to `AttemptStore`.
 */
import type { Chain } from '../chainlab/types';
import type { CheckResult } from '../coach/useCoach';
import type { EssayReview } from '../desk/scoring';
import type { CheckOut } from '../essay/fix-api';
import type { GuidedSentence } from '@/lib/ai/guided-essay';

export type WritingMode = 'free' | 'guided';

export interface EssayState {
  /** Ids of body paragraphs, in order. Each body paragraph is one chain: its id is the chain's id. */
  bodies: string[];
  /** Section id (intro, body…, conclusion) → text. */
  drafts: Record<string, string>;
  /** Time spent on the Writing Desk. */
  seconds: number;
  review: EssayReview | null;
  /** "Sửa bài": scores hidden, the student fixes each commented error, then submits again. */
  fixing?: boolean;
  /** Keys of the comments the student ticked "Đã sửa" in "Sửa bài". Their own to-do list; nothing is detected. */
  ticked?: string[];
  /**
   * The fix round after a review ("Sửa bài"): each comment that quotes the essay is fixed inside its card on the assessment
   * screen. `before` is the drafts when the round started; `edits` holds the rewrite typed for each comment key, shown after its
   * struck words and put in place of them at "Nộp lại"; `solved` holds the keys that passed "Kiểm tra" and `checks` the latest
   * verdict per key. (`view` and `step` are left from the old one-task-at-a-time screen.)
   */
  fix?: { view: 'fix' | 'diff' | 'paused'; step: number; solved: string[]; before: Record<string, string>; checks?: Record<string, CheckOut>; edits?: Record<string, string> } | null;
  /**
   * "Viết có hướng dẫn": the sample essay from the chains, sentence by sentence (null while it is being made).
   * `at` is the sentence being written; each finished sentence is appended to its section's draft. `done` hands
   * the essay back to plain editing ("Tự viết phần còn lại", or after the last sentence).
   */
  guided?: { plan: GuidedSentence[] | null; at: number; level: 'frame' | 'detail'; done?: boolean } | null;
  /** How the student chose to write after building the chains ("Tự viết" or "Viết có hướng dẫn"); opens ② Viết bài. */
  mode?: 'free' | 'guided';
  /** Tự viết: the student's own notes beside the essay (anything: ideas, an outline, Vietnamese). */
  notes?: string;
  /** Scores of the review before the latest one, to show how much a resubmission moved them. */
  prevScores?: EssayReview['scores'] | null;
}

export interface Attempt {
  id: string;
  promptId: string;
  /** Tự viết (no chains: straight to the essay) or Viết có hướng dẫn (chains first, then guided writing). */
  mode: WritingMode;
  createdAt: number;
  updatedAt: number;
  /** One chain per body paragraph, in essay order (see features/essay/model). */
  chains: Chain[];
  /** Not asked for any more; kept empty for the essay review's input. */
  stance: string;
  /** Latest "Kiểm tra mạch" per chain id. */
  checks?: Record<string, CheckResult>;
  essay: EssayState;
}

export interface AttemptStore {
  get(id: string): Promise<Attempt | null>;
  save(attempt: Attempt): Promise<void>;
  /** Most recent first. */
  listForPrompt(promptId: string): Promise<Attempt[]>;
  /** All of the student's attempts, most recent first. */
  list(): Promise<Attempt[]>;
}

export const newId = (prefix = '') => prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Tự viết attempts have no chains; older attempts were all built on chains, whatever their label. */
export const modeOf = (a: Attempt): WritingMode => (a.chains.length ? 'guided' : 'free');

export function createAttempt(promptId: string, chains: Chain[], mode: WritingMode = 'guided'): Attempt {
  const now = Date.now();
  return {
    id: newId(), promptId, mode, createdAt: now, updatedAt: now,
    chains, stance: '', checks: {},
    essay: { bodies: chains.map((c) => c.id), drafts: {}, seconds: 0, review: null },
  };
}

/** Thrown when the session has expired; the caller should send the student to /login. */
export class SignedOutError extends Error {}

async function call<T>(url: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' });
  if (res.status === 401) throw new SignedOutError();
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('save_failed_' + res.status);
  return (await res.json()) as T;
}

class RemoteAttemptStore implements AttemptStore {
  async get(id: string) {
    const r = await call<{ attempt: Attempt }>('/api/attempts/' + encodeURIComponent(id));
    return r ? r.attempt : null;
  }
  async save(a: Attempt) {
    const body = JSON.stringify(a);
    // keepalive lets the last save finish while the tab closes; browsers cap it at 64 KB.
    const r = await call<{ ok: true }>('/api/attempts/' + encodeURIComponent(a.id), { method: 'PUT', body, keepalive: body.length < 60000 });
    if (!r) throw new Error('save_failed_404');
  }
  async listForPrompt(promptId: string) {
    const r = await call<{ attempts: Attempt[] }>('/api/attempts?promptId=' + encodeURIComponent(promptId));
    return r ? r.attempts : [];
  }
  async list() {
    const r = await call<{ attempts: Attempt[] }>('/api/attempts');
    return r ? r.attempts : [];
  }
}

export const attemptStore = new RemoteAttemptStore();
