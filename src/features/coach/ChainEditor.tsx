'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CL } from '../chainlab/constants';
import { ClIcon, ClLabel } from '../chainlab/ui/primitives';
import { NOTE_STYLE, type BankPhrase, type Hint, type PlacedNote } from './useCoach';
import { ProBeam } from '@/components/ui/pro-beam';

const DOT = 17;
/** Where the dot's centre sits in each kind of row, so the dot lines up with the row's main text line. */
const CENTER = { end: 34, step: 20, add: 22, sugg: 21 };

export interface ChainEditorProps {
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
  steps: string[];
  setSteps: (steps: string[]) => void;
  /** Notes from the latest check, only while the chain hasn't changed since. */
  notes: PlacedNote[];
  active: number | null;
  onPick: (k: number | null) => void;
  hint: Hint | null;
  asking: boolean;
  onHint: () => void;
  onCloseHint: () => void;
  /** Grey line in the add row: what to do now. */
  helper?: ReactNode;
  /** Custom start / end rows (e.g. editable ends in ① Dựng mạch). */
  startNode?: ReactNode;
  endNode?: ReactNode;
  /** "Kiểm tra" is running: a light runs down the line until the result arrives. */
  checking?: boolean;
  /** The latest check found nothing to fix (and the chain hasn't changed since): the line turns green. */
  clean?: boolean;
  /** English phrases for the whole chain (drill only): tapping one adds it to the step being edited. */
  bank?: BankPhrase[];
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Notes appear one after another. */
export const noteDelay = (k: number) => (0.1 + k * 0.2).toFixed(2) + 's';

/** The line and dot to the left of a row. */
function Rail({ center, first, last, dot, jump, track = true, ok }: { center: number; first?: boolean; last?: boolean; dot: ReactNode; jump?: string | null; track?: boolean; ok?: boolean }) {
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: DOT, flexShrink: 0 }}>
      <span className="co-line" style={{ position: 'absolute', left: DOT / 2 - 0.5, width: 1, background: CL.ink2, transformOrigin: 'top', top: first ? center : 0, ...(last ? { height: center } : { bottom: 0 }) }} />
      {jump != null && <span className="co-jump" title="Chỗ này đang nhảy bước" style={{ position: 'absolute', left: DOT / 2 - 1.5, width: 3, borderRadius: 2, background: CL.red, top: center, bottom: -14, zIndex: 1, ['--d' as string]: jump }} />}
      <span className={'co-dot' + (ok ? ' co-ok' : '')} data-dot={track ? '' : undefined} style={{ position: 'absolute', top: center - DOT / 2, left: 0, width: DOT, height: DOT, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>{dot}</span>
    </div>
  );
}

const plainDot = (bg: string) => <span style={{ width: DOT, height: DOT, borderRadius: 999, border: '4px solid #fff', background: bg }} />;

/**
 * A chain as a vertical line: starting point, the student's steps, the add / hint row, the hint card, the
 * ending point. Steps carrying a note from "Kiểm tra" are tinted and numbered; a jump draws a red bar.
 */
export function ChainEditor(p: ChainEditorProps) {
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const focusAt = useRef<number | null>(null);
  const lastStep = useRef(0);
  const listRef = useRef<HTMLOListElement>(null);
  /** Steps added since the last render get the entrance (line grows, dot pops, text rises). */
  const entering = useRef<Set<number>>(new Set());
  const [green, setGreen] = useState(false);
  useEffect(() => {
    entering.current.clear();
    if (focusAt.current == null) return;
    refs.current[focusAt.current]?.focus();
    focusAt.current = null;
  });

  /** Dot centres, relative to the list. */
  const dotYs = () => {
    const ol = listRef.current;
    if (!ol) return { ol: null, dots: [] as HTMLElement[], ys: [] as number[] };
    const box = ol.getBoundingClientRect();
    const dots = [...ol.querySelectorAll<HTMLElement>('[data-dot]')];
    return { ol, dots, ys: dots.map((d) => { const r = d.getBoundingClientRect(); return r.top + r.height / 2 - box.top; }) };
  };

  // While checking: a light runs down the line, again and again, touching each dot, until the result arrives.
  useEffect(() => {
    if (!p.checking || reduced()) return;
    const { ol, dots, ys } = dotYs();
    if (!ol || ys.length < 2) return;
    const dur = 450 + ys.length * 240;
    const scan = document.createElement('span'); scan.className = 'co-scan';
    const trail = document.createElement('span'); trail.className = 'co-trail';
    trail.style.top = ys[0] + 'px'; trail.style.height = ys[ys.length - 1] - ys[0] + 'px';
    ol.append(trail, scan);
    const a1 = scan.animate([{ transform: 'translateY(' + (ys[0] - 7.5) + 'px)', opacity: 1 }, { transform: 'translateY(' + (ys[ys.length - 1] - 7.5) + 'px)', opacity: 1, offset: 0.92 }, { transform: 'translateY(' + (ys[ys.length - 1] - 7.5) + 'px)', opacity: 0 }], { duration: dur, easing: 'cubic-bezier(.45,0,.25,1)', iterations: Infinity });
    const a2 = trail.animate([{ transform: 'scaleY(0)', opacity: 1 }, { transform: 'scaleY(1)', opacity: 1, offset: 0.85 }, { transform: 'scaleY(1)', opacity: 0 }], { duration: dur, easing: 'cubic-bezier(.45,0,.25,1)', iterations: Infinity });
    const timers: number[] = [];
    const pings = () => dots.forEach((d, k) => timers.push(window.setTimeout(() => { d.classList.remove('co-ping'); void d.offsetWidth; d.classList.add('co-ping'); }, (k / (dots.length - 1)) * dur * 0.9)));
    pings();
    const loop = window.setInterval(pings, dur);
    return () => { a1.cancel(); a2.cancel(); scan.remove(); trail.remove(); clearInterval(loop); timers.forEach(clearTimeout); dots.forEach((d) => d.classList.remove('co-ping')); };
  }, [p.checking]); // eslint-disable-line react-hooks/exhaustive-deps

  // A clean chain: the line turns green from start to end, the dots follow, then "Mạch đi liền".
  useEffect(() => {
    if (!p.clean) { setGreen(false); return; }
    if (reduced()) { setGreen(true); return; }
    const { ol, dots, ys } = dotYs();
    if (!ol || ys.length < 2) { setGreen(true); return; }
    const dur = 950;
    const line = document.createElement('span'); line.className = 'co-sweep';
    line.style.top = ys[0] + 'px'; line.style.height = ys[ys.length - 1] - ys[0] + 'px';
    ol.append(line);
    const a = line.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: dur, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
    const timers = dots.map((d, k) => window.setTimeout(() => d.classList.add('co-ok'), (k / (dots.length - 1)) * dur * 0.8));
    timers.push(window.setTimeout(() => setGreen(true), dur));
    return () => { a.cancel(); line.remove(); timers.forEach(clearTimeout); dots.forEach((d) => d.classList.remove('co-ok')); };
  }, [p.clean]); // eslint-disable-line react-hooks/exhaustive-deps

  const notesOn = (i: number) => p.notes.map((n, k) => ({ n, k })).filter(({ n }) => n.step === i);
  const edit = (i: number, v: string) => p.setSteps(p.steps.map((s, j) => (j === i ? v : s)));
  const insertAfter = (i: number) => { const next = [...p.steps]; next.splice(i + 1, 0, ''); focusAt.current = i + 1; entering.current.add(i + 1); p.setSteps(next); };
  const remove = (i: number) => {
    if (p.steps.length <= 1) { p.setSteps(['']); focusAt.current = 0; return; }
    focusAt.current = Math.max(0, i - 1);
    p.setSteps(p.steps.filter((_, j) => j !== i));
  };
  const addStep = () => {
    const last = p.steps.length - 1;
    if (last >= 0 && !p.steps[last].trim()) { focusAt.current = last; refs.current[last]?.focus(); return; }
    insertAfter(last);
  };
  const tint = (i: number) => {
    const on = notesOn(i);
    if (!on.length) return { background: 'transparent' };
    const pick = on.find(({ k }) => k === p.active) || on[0];
    return { background: NOTE_STYLE[pick.n.type].bg, ['--d' as string]: noteDelay(pick.k) };
  };
  const tinted = (i: number) => (notesOn(i).length ? ' co-noted' : '');
  const jumpAt = (i: number) => { const k = p.notes.findIndex((n) => n.type === 'jump' && n.step === i); return k >= 0 ? noteDelay(k) : null; };
  const marks = (i: number) => notesOn(i).map(({ n, k }) => (
    <button key={k} type="button" className="cl-btn co-badge" onClick={() => p.onPick(p.active === k ? null : k)} aria-label={'Nhận xét ' + (k + 1)} aria-pressed={p.active === k}
      style={{ flexShrink: 0, marginTop: 2, minWidth: 22, height: 20, padding: '0 6px', borderRadius: 5, border: '1px solid ' + NOTE_STYLE[n.type].fg, background: p.active === k ? NOTE_STYLE[n.type].fg : '#fff', color: p.active === k ? '#fff' : NOTE_STYLE[n.type].fg, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, ['--d' as string]: noteDelay(k) }}>{k + 1}</button>
  ));
  const n = p.steps.length;
  const all = p.steps.join(' ').toLowerCase();
  const addPhrase = (en: string) => {
    const i = Math.min(lastStep.current, p.steps.length - 1);
    const cur = p.steps[i].replace(/\s+$/, '');
    focusAt.current = i;
    p.setSteps(p.steps.map((s, j) => (j === i ? (cur ? cur + ' ' : '') + en : s)));
  };

  return (
    <>
    <ol ref={listRef} style={{ position: 'relative', listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
      <li style={{ display: 'flex', gap: 18 }}>
        <Rail first center={CENTER.end} jump={jumpAt(-1)} dot={plainDot(CL.green)} ok={green} />
        <div className={tinted(-1).trim()} style={{ flex: 1, minWidth: 0, padding: '6px 10px 10px', borderRadius: 10, ...tint(-1), display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <ClLabel color={CL.greenText}>{p.startLabel}</ClLabel>
            {p.startNode ?? <span style={{ fontFamily: CL.sans, fontSize: 15, fontWeight: 600, lineHeight: 1.5, color: CL.ink }}>{p.start}</span>}
          </div>
          {marks(-1)}
        </div>
      </li>

      {p.steps.map((s, i) => (
        <li key={i} className={'cl-node' + (entering.current.has(i) ? ' co-enter' : '')} style={{ display: 'flex', gap: 18, minHeight: 46 }}>
          <Rail center={CENTER.step} jump={jumpAt(i)} dot={plainDot(s.trim() ? CL.ink3 : CL.ink2)} track={!!s.trim()} ok={green} />
          <div className={'co-content' + tinted(i)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 10px', margin: '2px 0', borderRadius: 10, ...tint(i), transition: 'background-color .3s' }}>
            <textarea ref={(el) => { refs.current[i] = el; }} className="co-ta" value={s} rows={1} aria-label={'Bước ' + (i + 1)}
              placeholder={i === 0 ? 'Bước đầu tiên: điểm đầu chạm tới ai, ra sao?' : 'Bước tiếp theo…'}
              onFocus={() => { lastStep.current = i; }}
              onChange={(e) => edit(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (s.trim()) insertAfter(i); }
                else if (e.key === 'Backspace' && !s && n > 1) { e.preventDefault(); remove(i); }
              }}
              style={{ flex: 1, minWidth: 0, minHeight: 24, resize: 'none', border: 'none', outline: 'none', background: 'transparent', padding: 0, fontFamily: CL.serif, fontSize: 15, lineHeight: 1.55, color: CL.ink8 }} />
            {marks(i)}
            <button type="button" className="cl-btn cl-del cl-reveal" onClick={() => remove(i)} aria-label={'Xoá bước ' + (i + 1)} style={{ flexShrink: 0, width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: CL.ink3 }}><ClIcon name="trash" size={13} /></button>
          </div>
        </li>
      ))}

      <li style={{ display: 'flex', gap: 18, minHeight: 44 }}>
        <Rail center={CENTER.add} track={false} dot={<span style={{ width: DOT, height: DOT, borderRadius: 999, border: '1.5px solid ' + CL.ink2, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: CL.ink4 }}><ClIcon name="plus" size={9} /></span>} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, padding: '6px 0' }}>
          <ProBeam><button type="button" className="cl-btn" onClick={p.onHint} disabled={p.asking} style={{ ...miniBtn, border: 'none', boxShadow: 'none', background: '#EEF3FC', color: '#2F62C4', opacity: p.asking ? 0.6 : 1 }}>{p.asking ? 'Đang nghĩ…' : 'Bí? Gợi ý'}</button></ProBeam>
          {p.helper && <span style={{ marginLeft: 6, fontFamily: CL.sans, fontSize: 11.5, lineHeight: 1.4, color: CL.ink4 }}>{p.helper}</span>}
        </div>
      </li>

      {p.hint && (
        <li key={p.hint.q} style={{ display: 'flex', gap: 18, paddingBottom: 8 }}>
          <Rail center={CENTER.sugg} track={false} dot={<span style={{ width: DOT, height: DOT, borderRadius: 999, border: '2px dashed #B5B5AE', background: '#fff' }} />} />
          <div className="co-unfold" style={{ flex: 1, minWidth: 0, borderRadius: 12, border: '1.5px dashed #77A1DD', background: '#FFFCF0', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 700, lineHeight: 1.45, color: '#B33A1A' }}>{p.hint.q}</span>
            {p.hint.why && <span style={{ fontFamily: CL.sans, fontSize: 11.5, lineHeight: 1.45, color: CL.ink4 }}>{p.hint.why}</span>}
            <span style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <button type="button" className="cl-btn cl-add" onClick={() => { addStep(); p.onCloseHint(); }} style={{ ...miniBtn, borderColor: '#EBDDA8', color: CL.yellowText }}>Trả lời ở bước mới</button>
              <button type="button" className="cl-btn cl-add" onClick={p.onHint} disabled={p.asking} style={miniBtn}>{p.asking ? 'Đang nghĩ…' : 'Hỏi cách khác'}</button>
              <button type="button" className="cl-btn cl-link" onClick={p.onCloseHint} style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: CL.ink4 }}>Ẩn</button>
            </span>
          </div>
        </li>
      )}

      <li style={{ display: 'flex', gap: 18 }}>
        <Rail last center={CENTER.end} ok={green} dot={<span style={{ width: 9, height: 9, borderRadius: 2, background: '#B8862B', boxShadow: '0 0 0 4px #fff' }} />} />
        <div style={{ flex: 1, minWidth: 0, padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ClLabel>{p.endLabel}</ClLabel>
          {p.endNode ?? <span style={{ fontFamily: CL.sans, fontSize: 15, fontWeight: 600, lineHeight: 1.5, color: CL.ink }}>{p.end}</span>}
          {green && (
            <span className="co-pop" style={{ alignSelf: 'flex-start', marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8, background: CL.mintSoft, color: CL.greenText, padding: '4px 12px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path className="co-tick" d="M5 12l5 5 9-10" /></svg>Mạch đi liền
            </span>
          )}
        </div>
      </li>
    </ol>
    {p.bank && p.bank.length > 0 && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18, paddingTop: 16, borderTop: '1px solid ' + CL.ink1 }}>
        <span style={{ fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: CL.ink }}>Từ vựng cho chuỗi này</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {p.bank.map((b) => {
            const used = all.includes(b.en);
            return (
              <button key={b.en} type="button" className="cl-btn" onClick={() => addPhrase(b.en)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, padding: '7px 11px', borderRadius: 8, border: 'none', background: used ? '#EEF3FC' : '#F5F5F5', cursor: 'pointer', textAlign: 'left', transition: 'background-color .2s' }}>
                <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 500, color: used ? '#2F62C4' : CL.ink }}>{b.en}</span>
                <span style={{ fontFamily: CL.sans, fontSize: 11, color: '#8A8A8A' }}>{b.vi}</span>
              </button>
            );
          })}
        </div>
      </div>
    )}
    </>
  );
}

export const miniBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, borderRadius: 8, border: 'none', boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)', background: '#fff', color: CL.ink7, fontFamily: CL.sans, fontSize: 13, fontWeight: 500, padding: '0 10px', cursor: 'pointer', whiteSpace: 'nowrap' };
