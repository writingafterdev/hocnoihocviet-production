/** Word matching for Chép mẫu: how much of the target sentence the student has typed correctly. */

import RANK_LIST from './word-rank.json';

export const norm = (w: string) => w.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'/-]/g, '');
export const words = (t: string) => t.split(/\s+/).filter(Boolean);

/** First letter only: "equip," → "e****,". */
export const mask = (w: string) => {
  const m = w.match(/^([^A-Za-z0-9]*)([A-Za-z0-9])([A-Za-z0-9'’/-]*)([^A-Za-z0-9]*)$/);
  return m ? m[1] + m[2] + '*'.repeat(m[3].length) + m[4] : w;
};

/** Reveal the first `n` letters of a word that is right so far. */
export const partial = (w: string, n: number) => { let k = 0; return w.replace(/[A-Za-z0-9'’/-]/g, (c) => (k++ < Math.max(1, n) ? c : '*')); };

export type WordState = { s: 'ok' | 'part' | 'bad' | null; n: number };

/**
 * Per-word state while typing: 'ok' (whole word right), 'part' (right so far), 'bad' (wrong, shown red),
 * or null (not reached yet). A skipped word does not throw off the rest.
 */
export function wordStates(target: string, typed: string): WordState[] {
  const T = words(target).map(norm), U = words(typed).map(norm).filter(Boolean);
  const open = typed.length && !/\s$/.test(typed);
  const st: WordState[] = T.map(() => ({ s: null, n: 0 }));
  let i = 0, j = 0;
  while (i < T.length && j < U.length) {
    const u = U[j], last = open && j === U.length - 1;
    if (u === T[i]) { st[i] = { s: 'ok', n: 0 }; i++; j++; }
    else if (last && T[i].startsWith(u)) { st[i] = { s: 'part', n: u.length }; i++; j++; }
    else if (!last && T[i + 1] === u) { i++; } // a word was left out: leave it hidden and line up with the next one
    else { st[i] = { s: 'bad', n: 0 }; i++; j++; }
  }
  return st;
}


/**
 * How many letters to show for a word that is still hidden: one for everyday words, two for less common ones, three for rare ones,
 * so a rare word does not stop the student mid-sentence. Rank comes from a spoken-English frequency list (the 12,000 most common words);
 * anything outside it that is long enough counts as rare.
 */
const RANK = new Map<string, number>((RANK_LIST as string[]).map((w, i) => [w, i]));
export function hintLetters(word: string): number {
  const w = norm(word).replace(/[^a-z]/g, '');
  if (w.length < 5) return 1;
  const r = RANK.get(w);
  if (r !== undefined && r < 5000) return 1;
  if (r !== undefined) return 2;
  return w.length >= 6 ? 3 : 2;
}

/** The hint for a hidden word, with more letters for rarer words. */
export const hint = (w: string) => partial(w, hintLetters(w));
