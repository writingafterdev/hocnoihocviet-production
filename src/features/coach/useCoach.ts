'use client';

import { useState } from 'react';
import type { ChainCheckOut, ChainIn, ChainNote } from '@/lib/ai/chain-coach';
import { SignedOutError } from '../attempts/store';
import { AI_ERROR_TEXT, AiRequestError, postAi } from '../ai/request';

export type { ChainNote, ChainIn };

/** A note placed on the chain the student sees: positions mapped back to indexes in `steps` (empty steps skipped). */
export interface PlacedNote extends ChainNote {
  /** Index in `steps` of the step the note is on (trait, detail), or of the step before the arrow (jump); -1 = the starting point. */
  step: number;
  /** Jump into the ending point. */
  toEnd?: boolean;
  where: string;
}

export interface CheckResult extends ChainCheckOut { snap: string; placed: PlacedNote[] }
export interface Hint { q: string; why: string }

const snapOf = (c: ChainIn) => JSON.stringify([c.start, c.end, c.steps.map((s) => s.trim()).filter(Boolean)]);

/** Maps the AI's positions (0 = start, 1…n = filled steps, n+1 = end) to indexes in `steps`. */
function place(steps: string[], notes: ChainNote[]): PlacedNote[] {
  const filled = steps.map((s, i) => [s, i] as const).filter(([s]) => s.trim()).map(([, i]) => i);
  const n = filled.length;
  return notes.map((x) => {
    const step = x.at === 0 ? -1 : filled[x.at - 1] ?? -1;
    if (x.type === 'jump') {
      const from = x.at === 0 ? 'Điểm đầu' : 'Bước ' + x.at;
      const to = x.at >= n ? 'điểm cuối' : 'bước ' + (x.at + 1);
      return { ...x, step, toEnd: x.at >= n, where: from + ' → ' + to };
    }
    return { ...x, step, where: 'Bước ' + x.at };
  });
}

const errText = (e: unknown) => {
  if (e instanceof SignedOutError) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return ''; }
  return e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network;
};

/**
 * "Bí? Gợi ý" and "Kiểm tra" for one chain. The check result keeps a snapshot of the chain it read, so the
 * screen can tell when the student has edited since (highlights go away, "Kiểm tra lại" lights up).
 */
export function useCoach(promptId: string, chain: ChainIn, initial?: CheckResult | null, onCheck?: (r: CheckResult | null) => void) {
  const [hint, setHint] = useState<Hint | null>(null);
  const [asked, setAsked] = useState<string[]>([]);
  const [asking, setAsking] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResultState] = useState<CheckResult | null>(initial || null);
  const [error, setError] = useState('');

  const setResult = (r: CheckResult | null) => { setResultState(r); onCheck?.(r); };
  const snap = snapOf(chain);
  const fresh = !!result && result.snap === snap;
  const filled = chain.steps.filter((s) => s.trim()).length;

  const askHint = async () => {
    if (asking) return;
    setAsking(true); setError('');
    try {
      const h = await postAi<Hint>('chain-hint', { promptId, chain, asked });
      setHint(h); setAsked((a) => [...a, h.q].slice(-6));
    } catch (e) { setError(errText(e)); }
    setAsking(false);
  };

  const runCheck = async () => {
    if (checking) return;
    setChecking(true); setError('');
    try {
      const r = await postAi<ChainCheckOut>('chain-check', { promptId, chain });
      setResult({ ...r, snap, placed: place(chain.steps, r.notes) });
      setHint(null);
    } catch (e) { setError(errText(e)); }
    setChecking(false);
  };

  /** Clears everything when the chain is replaced (next statement, another body paragraph). */
  const reset = () => { setHint(null); setAsked([]); setResult(null); setError(''); };

  return { hint, asking, askHint, closeHint: () => setHint(null), checking, runCheck, result, fresh, filled, error, reset };
}

export const NOTE_STYLE: Record<ChainNote['type'], { label: string; bg: string; fg: string }> = {
  jump: { label: 'Nhảy bước', bg: '#FBE4E0', fg: '#8B3A35' },
  trait: { label: 'Thêm đặc điểm', bg: '#E4F5FA', fg: '#17667A' },
  detail: { label: 'Thêm chi tiết', bg: '#FFF6DA', fg: '#765A00' },
};
