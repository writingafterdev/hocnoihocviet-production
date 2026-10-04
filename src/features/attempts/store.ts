/**
 * Attempts: one student's work on one prompt (chains, stance, essay, feedback).
 * Saved per signed-in user in D1 through /api/attempts; the screens only talk to `AttemptStore`.
 */
import type { ChainReview } from '../chainlab/review';
import type { Chain } from '../chainlab/types';
import type { EssayReview } from '../desk/scoring';

export interface EssayState {
  /** Ids of body paragraphs, in order. */
  bodies: string[];
  /** Section id (intro, body…, conclusion) → text. */
  drafts: Record<string, string>;
  /** Time spent on the Writing Desk. */
  seconds: number;
  review: EssayReview | null;
}

export interface Attempt {
  id: string;
  promptId: string;
  mode: 'free';
  createdAt: number;
  updatedAt: number;
  chains: Chain[];
  stance: string;
  chainReview: ChainReview | null;
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

export function createAttempt(promptId: string, chains: Chain[]): Attempt {
  const now = Date.now();
  return {
    id: newId(), promptId, mode: 'free', createdAt: now, updatedAt: now,
    chains, stance: '', chainReview: null,
    essay: { bodies: ['body1', 'body2'], drafts: {}, seconds: 0, review: null },
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
