'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { CL } from '../chainlab/constants';
import { ClIcon, ClLabel } from '../chainlab/ui/primitives';
import { NOTE_STYLE, type Hint, type PlacedNote } from './useCoach';

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
}

/** The line and dot to the left of a row. */
function Rail({ center, first, last, dot, jump }: { center: number; first?: boolean; last?: boolean; dot: ReactNode; jump?: boolean }) {
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: DOT, flexShrink: 0 }}>
      <span style={{ position: 'absolute', left: DOT / 2 - 0.5, width: 1, background: CL.ink2, top: first ? center : 0, ...(last ? { height: center } : { bottom: 0 }) }} />
      {jump && <span title="Chỗ này đang nhảy bước" style={{ position: 'absolute', left: DOT / 2 - 1.5, width: 3, borderRadius: 2, background: CL.red, top: center, bottom: -14, zIndex: 1 }} />}
      <span style={{ position: 'absolute', top: center - DOT / 2, left: 0, width: DOT, height: DOT, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>{dot}</span>
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
  useEffect(() => {
    if (focusAt.current == null) return;
    refs.current[focusAt.current]?.focus();
    focusAt.current = null;
  });

  const notesOn = (i: number) => p.notes.map((n, k) => ({ n, k })).filter(({ n }) => n.step === i);
  const jumpFrom = (i: number) => p.notes.some((n) => n.type === 'jump' && n.step === i);
  const edit = (i: number, v: string) => p.setSteps(p.steps.map((s, j) => (j === i ? v : s)));
  const insertAfter = (i: number) => { const next = [...p.steps]; next.splice(i + 1, 0, ''); focusAt.current = i + 1; p.setSteps(next); };
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
    if (!on.length) return 'transparent';
    const pick = on.find(({ k }) => k === p.active) || on[0];
    return NOTE_STYLE[pick.n.type].bg;
  };
  const marks = (i: number) => notesOn(i).map(({ n, k }) => (
    <button key={k} type="button" className="cl-btn" onClick={() => p.onPick(p.active === k ? null : k)} aria-label={'Nhận xét ' + (k + 1)} aria-pressed={p.active === k}
      style={{ flexShrink: 0, marginTop: 2, minWidth: 22, height: 20, padding: '0 6px', borderRadius: 5, border: '1px solid ' + NOTE_STYLE[n.type].fg, background: p.active === k ? NOTE_STYLE[n.type].fg : '#fff', color: p.active === k ? '#fff' : NOTE_STYLE[n.type].fg, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700 }}>{k + 1}</button>
  ));
  const n = p.steps.length;

  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
      <li style={{ display: 'flex', gap: 18 }}>
        <Rail first center={CENTER.end} jump={jumpFrom(-1)} dot={plainDot(CL.green)} />
        <div style={{ flex: 1, minWidth: 0, padding: '6px 10px 10px', borderRadius: 10, background: tint(-1), display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <ClLabel color={CL.greenText}>{p.startLabel}</ClLabel>
            {p.startNode ?? <span style={{ fontFamily: CL.serif, fontSize: 15, lineHeight: 1.55, color: CL.ink8 }}>{p.start}</span>}
          </div>
          {marks(-1)}
        </div>
      </li>

      {p.steps.map((s, i) => (
        <li key={i} className="cl-node" style={{ display: 'flex', gap: 18, minHeight: 46 }}>
          <Rail center={CENTER.step} jump={jumpFrom(i)} dot={plainDot(s.trim() ? CL.ink3 : CL.ink2)} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 10px', margin: '2px 0', borderRadius: 10, background: tint(i), transition: 'background-color .2s' }}>
            <textarea ref={(el) => { refs.current[i] = el; }} className="co-ta" value={s} rows={1} aria-label={'Bước ' + (i + 1)}
              placeholder={i === 0 ? 'Bước đầu tiên: điểm đầu chạm tới ai, ra sao?' : 'Bước tiếp theo…'}
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
        <Rail center={CENTER.add} dot={<span style={{ width: DOT, height: DOT, borderRadius: 999, border: '1.5px dashed ' + CL.ink3, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: CL.ink4 }}><ClIcon name="plus" size={9} /></span>} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, padding: '6px 0' }}>
          <button type="button" className="cl-btn cl-add" onClick={addStep} style={miniBtn}><ClIcon name="plus" size={11} />Thêm bước</button>
          <button type="button" className="cl-btn" onClick={p.onHint} disabled={p.asking} style={{ ...miniBtn, border: '1px dashed #D9BE66', background: CL.yellowSoft, color: CL.yellowText, opacity: p.asking ? 0.6 : 1 }}>{p.asking ? 'Đang nghĩ…' : 'Bí? Gợi ý'}</button>
          {p.helper && <span style={{ marginLeft: 6, fontFamily: CL.sans, fontSize: 11.5, lineHeight: 1.4, color: CL.ink4 }}>{p.helper}</span>}
        </div>
      </li>

      {p.hint && (
        <li className="cl-rise" style={{ display: 'flex', gap: 18, paddingBottom: 8 }}>
          <Rail center={CENTER.sugg} dot={<span style={{ width: DOT, height: DOT, borderRadius: 999, border: '2px dashed #B5B5AE', background: '#fff' }} />} />
          <div style={{ flex: 1, minWidth: 0, borderRadius: 12, border: '1.5px dashed #D9BE66', background: '#FFFCF0', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 700, lineHeight: 1.45, color: '#7B4D10' }}>{p.hint.q}</span>
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
        <Rail last center={CENTER.end} dot={<span style={{ width: 9, height: 9, borderRadius: 2, background: '#B8862B', boxShadow: '0 0 0 4px #fff' }} />} />
        <div style={{ flex: 1, minWidth: 0, padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ClLabel>{p.endLabel}</ClLabel>
          {p.endNode ?? <span style={{ fontFamily: CL.sans, fontSize: 15, fontWeight: 600, lineHeight: 1.5, color: '#8A5A12' }}>{p.end}</span>}
        </div>
      </li>
    </ol>
  );
}

export const miniBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 5, border: '1px solid ' + CL.ink2, background: '#fff', color: CL.ink6, fontFamily: CL.sans, fontSize: 11, fontWeight: 600, padding: '5px 10px' };
