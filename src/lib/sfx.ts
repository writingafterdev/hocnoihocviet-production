/**
 * Small interface sounds, made with the Web Audio API (no audio files): a soft pop, a tick, a note and a chime.
 * They are quiet on purpose, only play after the student has done something, and can be muted (remembered).
 */
const KEY = 'hnhv-sfx';
let ctx: AudioContext | null = null;

export const sfxEnabled = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } };
export const setSfxEnabled = (on: boolean) => { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* private mode */ } };

function audio() {
  if (typeof window === 'undefined' || !sfxEnabled()) return null;
  try {
    ctx = ctx || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

/** One short note: a sine (or triangle) that fades in and out, optionally gliding to another pitch. */
function tone(c: AudioContext, at: number, freq: number, dur: number, opts: { gain?: number; type?: OscillatorType; to?: number } = {}) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = opts.type || 'sine';
  o.frequency.setValueAtTime(freq, at);
  if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.05, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(c.destination);
  o.start(at); o.stop(at + dur + 0.02);
}

const play = (fn: (c: AudioContext, t: number) => void) => { const c = audio(); if (c) fn(c, c.currentTime + 0.01); };

export const sfx = {
  /** A step added, a new statement landing: a soft bubble. */
  pop: () => play((c, t) => tone(c, t, 520, 0.09, { to: 880, gain: 0.055 })),
  /** A hint appearing. */
  tick: () => play((c, t) => tone(c, t, 1200, 0.04, { type: 'triangle', gain: 0.035 })),
  /** The check found something to look at: two gentle falling notes. */
  note: () => play((c, t) => { tone(c, t, 660, 0.13, { gain: 0.045 }); tone(c, t + 0.1, 495, 0.2, { gain: 0.04 }); }),
  /** The chain holds together: a rising three-note chime. */
  success: () => play((c, t) => { [523.25, 659.25, 783.99].forEach((f, k) => tone(c, t + k * 0.09, f, 0.32, { gain: 0.05, type: 'triangle' })); }),
  /** "Đổi câu" / "Câu tiếp": ticks that slow down with the reel, over `ms`. */
  roll: (ms: number) => play((c, t) => {
    let at = 0, gap = 0.045;
    while (at < ms / 1000 * 0.9) { tone(c, t + at, 900 + Math.random() * 140, 0.03, { type: 'triangle', gain: 0.03 }); at += gap; gap *= 1.11; }
  }),
};
