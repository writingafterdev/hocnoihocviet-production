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

/** `fixed`: keys (noteKey) of the notes the student has since fixed, each confirmed by a quick check on Enter. */
export interface CheckResult extends ChainCheckOut { snap: string; placed: PlacedNote[]; fixed?: string[] }

/** A note's identity within one check result. */
export const noteKey = (n: ChainNote) => n.type + '|' + n.at + '|' + n.text;
export interface Hint { q: string; why: string }

const snapOf = (c: ChainIn) => JSON.stringify([c.start, c.end, c.steps.map((s) => s.trim()).filter(Boolean)]);

/** The filled steps a check read (from its snapshot). */
export function checkedSteps(snap: string): string[] | null {
  try { const s = JSON.parse(snap)[2]; return Array.isArray(s) ? s : null; } catch { return null; }
}

const words = (t: string) => new Set(t.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
const overlap = (a: string, b: string) => { const A = words(a), B = words(b); let n = 0; A.forEach((w) => { if (B.has(w)) n++; }); return n / Math.max(1, Math.min(A.size, B.size)); };

/** Pairs each item of `few` with one of `many` (few.length <= many.length), in order, picking the most similar. */
function pairInOrder(few: string[], many: string[]): number[] {
  const out: number[] = [];
  let from = 0;
  few.forEach((t, k) => {
    const last = many.length - (few.length - k); // leave room for the rest
    let best = from, score = -1;
    for (let j = from; j <= last; j++) { const sc = overlap(t, many[j]); if (sc > score) { score = sc; best = j; } }
    out.push(best); from = best + 1;
  });
  return out;
}

/**
 * For each step the check read, its index in `steps` now (-1 = deleted). Steps still word for word the same are
 * matched first (longest common run); the ones between them pair up in order by the words they share, so a step
 * the student is rewriting keeps its notes and a newly typed step (e.g. at a jump) takes none.
 */
export function align(old: string[], steps: string[]): number[] {
  const cur = steps.map((s, i) => [s.trim(), i] as const).filter(([s]) => s);
  const m = old.length, n = cur.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let a = m - 1; a >= 0; a--) for (let b = n - 1; b >= 0; b--) dp[a][b] = old[a].trim() === cur[b][0] ? dp[a + 1][b + 1] + 1 : Math.max(dp[a + 1][b], dp[a][b + 1]);
  const anchors: [number, number][] = [];
  for (let a = 0, b = 0; a < m && b < n;) {
    if (old[a].trim() === cur[b][0]) { anchors.push([a, b]); a++; b++; } else if (dp[a + 1][b] >= dp[a][b + 1]) a++; else b++;
  }
  const map = new Array<number>(m).fill(-1);
  let pa = 0, pb = 0;
  [...anchors, [m, n] as [number, number]].forEach(([a, b]) => {
    const oa = old.slice(pa, a), cb = cur.slice(pb, b).map(([t]) => t);
    if (oa.length && cb.length) {
      if (oa.length <= cb.length) pairInOrder(oa, cb).forEach((j, k) => { map[pa + k] = cur[pb + j][1]; });
      else pairInOrder(cb, oa).forEach((k, j) => { map[pa + k] = cur[pb + j][1]; });
    }
    if (a < m) map[a] = cur[b][1];
    pa = a + 1; pb = b + 1;
  });
  return map;
}

/**
 * Maps the AI's positions (0 = start, 1…n = the filled steps it read, n+1 = end) to indexes in `steps` as they are
 * now. With `checked` (the steps the check read) notes follow their own step through edits and inserted steps;
 * a note whose step was deleted is dropped. Without it, positions count the filled steps now.
 */
export function place(steps: string[], notes: ChainNote[], checked?: string[] | null): PlacedNote[] {
  const filled = steps.map((s, i) => [s, i] as const).filter(([s]) => s.trim()).map(([, i]) => i);
  const map = checked ? align(checked, steps) : filled;
  const n = checked ? checked.length : filled.length;
  const num = (i: number) => filled.indexOf(i) + 1;
  // Down the chain in order; on the same step, what to add to the step itself comes before the missing step after it.
  const ordered = [...notes].sort((a, b) => a.at - b.at || (a.type === 'jump' ? 1 : 0) - (b.type === 'jump' ? 1 : 0));
  return ordered.flatMap((x) => {
    const step = x.at === 0 ? -1 : map[x.at - 1] ?? -1;
    if (x.at > 0 && step < 0) return [];
    if (x.type === 'jump') {
      const from = step < 0 ? 'Điểm đầu' : 'Bước ' + num(step);
      const toEnd = x.at >= n;
      return [{ ...x, step, toEnd, where: from + ' → ' + (toEnd ? 'điểm cuối' : 'bước ' + ((step < 0 ? 0 : num(step)) + 1)) }];
    }
    return [{ ...x, step, where: 'Bước ' + num(step) }];
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
  /** Notes being re-checked after Enter, and what is still missing on the ones that weren't fixed yet. */
  const [noteBusy, setNoteBusy] = useState<string[]>([]);
  const [noteMiss, setNoteMiss] = useState<Record<string, string>>({});

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
      // "Kiểm tra lại" after an edit: send what the last check said, so the server only judges those notes (fast).
      // Notes already fixed on Enter are left out: only the open ones need judging again.
      let prev: { steps: string[]; notes: ChainNote[] } | undefined;
      const open = result ? result.notes.filter((n) => !(result.fixed || []).includes(noteKey(n))) : [];
      if (result && open.length && result.snap !== snap) {
        try { prev = { steps: JSON.parse(result.snap)[2] as string[], notes: open.map(({ type, at, text, fix }) => ({ type, at, text, fix })) }; } catch { prev = undefined; }
      }
      const r = await postAi<ChainCheckOut>('chain-check', { promptId, chain, ...(prev ? { prev } : {}) });
      setResult({ ...r, snap, placed: place(chain.steps, r.notes), fixed: [] });
      setNoteMiss({});
      setHint(null);
    } catch (e) { setError(errText(e)); }
    setChecking(false);
  };

  const fixed = result?.fixed || [];
  /** Every note of the last check has been fixed since: the chain counts as clean. */
  const allFixed = !!result && result.notes.length > 0 && result.notes.every((n) => fixed.includes(noteKey(n)));

  /**
   * Enter on step `i` after a check: the open notes on that step, and a missing step right before it (the step opened
   * at a gap), are each checked quickly. A fixed note is marked fixed (its card folds and is crossed off); one that
   * isn't says what is still missing.
   */
  const checkStep = async (i: number, steps: string[]) => {
    if (!result || !steps[i]?.trim()) return;
    const live = place(steps, result.notes, checkedSteps(result.snap));
    const todo = live.filter((n) => !fixed.includes(noteKey(n)) && !noteBusy.includes(noteKey(n)) && (n.step === i || (n.type === 'jump' && n.step === i - 1)));
    if (!todo.length) return;
    const now: ChainIn = { ...chain, steps };
    await Promise.all(todo.map(async (n) => {
      const key = noteKey(n);
      setNoteBusy((b) => [...b, key]);
      setNoteMiss((m) => { const x = { ...m }; delete x[key]; return x; });
      try {
        const v = await postAi<{ fixed: boolean; why: string }>('note-check', { promptId, chain: now, note: { type: n.type, at: n.at, text: n.text, fix: n.fix || '' } });
        if (v.fixed) {
          setResultState((r) => {
            if (!r || (r.fixed || []).includes(key)) return r;
            const next = { ...r, fixed: [...(r.fixed || []), key] };
            onCheck?.(next);
            return next;
          });
        } else setNoteMiss((m) => ({ ...m, [key]: v.why || 'Chưa đủ, làm đúng theo cách sửa ở trên.' }));
      } catch (e) { setError(errText(e)); }
      setNoteBusy((b) => b.filter((x) => x !== key));
    }));
  };

  /** Clears everything when the chain is replaced (next statement, another body paragraph). */
  const reset = () => { setHint(null); setAsked([]); setResult(null); setError(''); setNoteBusy([]); setNoteMiss({}); };

  return { hint, asking, askHint, closeHint: () => setHint(null), checking, runCheck, result, fresh, filled, error, reset, allFixed, checkStep, noteBusy, noteMiss };
}

export const NOTE_STYLE: Record<ChainNote['type'], { label: string; bg: string; fg: string }> = {
  jump: { label: 'Nhảy bước', bg: '#FFF0EB', fg: '#B33A1A' },
  trait: { label: 'Thêm đặc điểm', bg: '#E4F5FA', fg: '#17667A' },
  detail: { label: 'Thêm chi tiết', bg: '#EEF3FC', fg: '#2F62C4' },
};

export interface BankPhrase { en: string; vi: string }
const bankCache = new Map<string, BankPhrase[]>();

/** English phrases for a whole chain, asked only when the student presses the suggestion (once per start/end pair, then cached). */
export async function askVocabBank(promptId: string, chain: ChainIn): Promise<BankPhrase[]> {
  const key = promptId + '|' + chain.kind + '|' + chain.start + '|' + chain.end;
  const cached = bankCache.get(key);
  if (cached) return cached;
  const r = await postAi<{ phrases: BankPhrase[] }>('vocab-bank', { promptId, chain: { ...chain, steps: [] } });
  bankCache.set(key, r.phrases);
  return r.phrases;
}
