/**
 * Attempts: one student's work on one prompt (chains, stance, essay, feedback).
 *
 * TEMPORARY: stored in this browser's localStorage. When sign-in + D1 land, implement `AttemptStore`
 * against an API route and swap `attemptStore` below; the screens only talk to this interface.
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

const KEY = 'hnhv:attempt:';
const INDEX = 'hnhv:attempts';

function readIndex(): { id: string; promptId: string; updatedAt: number }[] {
  try { return JSON.parse(localStorage.getItem(INDEX) || '[]'); } catch { return []; }
}

class LocalAttemptStore implements AttemptStore {
  async get(id: string) {
    try { const raw = localStorage.getItem(KEY + id); return raw ? (JSON.parse(raw) as Attempt) : null; } catch { return null; }
  }
  async save(a: Attempt) {
    try {
      localStorage.setItem(KEY + a.id, JSON.stringify(a));
      const idx = readIndex().filter((x) => x.id !== a.id);
      idx.unshift({ id: a.id, promptId: a.promptId, updatedAt: a.updatedAt });
      localStorage.setItem(INDEX, JSON.stringify(idx));
    } catch { /* storage full or blocked: work stays in memory for this tab */ }
  }
  async listForPrompt(promptId: string) {
    const ids = readIndex().filter((x) => x.promptId === promptId).map((x) => x.id);
    const all = await Promise.all(ids.map((id) => this.get(id)));
    return all.filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

export const attemptStore: AttemptStore = new LocalAttemptStore();
