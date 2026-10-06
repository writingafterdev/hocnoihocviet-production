'use client';

import { Fragment, useState } from 'react';
import { CL } from '../constants';
import { ClIcon } from './primitives';

/** Dotted underline over a vague word, drawn on a transparent copy of the textarea text. */
function VagueMark({ text, word, right = 0 }: { text: string; word: string; right?: number }) {
  const i = text.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) return null;
  return (
    <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right, pointerEvents: 'none', padding: 0, fontFamily: CL.serif, fontSize: 15, lineHeight: 1.55, color: 'transparent', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
      {text.slice(0, i)}<span style={{ borderBottom: '2px dotted ' + CL.red }}>{text.slice(i, i + word.length)}</span>{text.slice(i + word.length)}
    </div>
  );
}

export interface StepListProps {
  steps: string[];
  /** `sys` is how many leading steps are upstream (system) causes; passed only when `upstream` is on. */
  onChange: (steps: string[], sys?: number) => void;
  /** Cause chains: the first `sys` steps are upstream causes, with a dashed node to add the first one. */
  upstream?: boolean;
  sys?: number;
  firstIsDriver?: boolean;
  splitMode?: boolean;
  onSplitAt?: (i: number, noun: string) => void;
  idPrefix: string;
  /** Step indexes whose arrow to the next step is flagged as a logical jump. */
  jumps?: number[];
  vague?: { step: number; word: string; key: string }[];
  /** A fixed last node the student does not edit, e.g. the Driver a cause chain leads to. */
  end?: { label: string; text: string } | null;
  /** Placeholder of the steps after the first (default: "Điều gì xảy ra tiếp theo?"). */
  placeholder?: string;
}

/** The vertical chain of steps, with hover add/remove and Scope split picking. */
export function StepList({ steps, onChange, upstream = false, sys = 0, firstIsDriver, splitMode, onSplitAt, idPrefix, jumps = [], vague = [], end = null, placeholder }: StepListProps) {
  const [picker, setPicker] = useState<number | null>(null);
  const nSys = upstream ? Math.max(0, Math.min(sys, steps.length - 1)) : 0;
  const emit = (s: string[], n: number) => onChange(s, upstream ? n : undefined);
  const set = (i: number, v: string) => emit(steps.map((s, j) => (j === i ? v : s)), nSys);
  /** Adding after a system step adds another system step; after an individual one, an individual step. */
  const addAfter = (i: number) => { const n = [...steps]; n.splice(i + 1, 0, ''); emit(n, i < nSys ? nSys + 1 : nSys); };
  const remove = (i: number) => {
    if (steps.length === 1) { emit([''], 0); return; }
    const n = steps.filter((_, j) => j !== i);
    let ns = i < nSys ? nSys - 1 : nSys;
    if (ns >= n.length) ns = Math.max(0, n.length - 1);
    emit(n, ns);
  };
  const startUpstream = () => emit(['', ...steps], 1);
  const groupTag = (label: string, bg: string, fg: string) => (
    <li aria-hidden="true" style={{ listStyle: 'none', position: 'relative', paddingLeft: 35, margin: '2px 0 2px' }}>
      <span style={{ display: 'inline-block', borderRadius: 5, background: bg, color: fg, padding: '2px 8px', fontFamily: CL.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
    </li>
  );
  return (
    <ol style={{ position: 'relative', listStyle: 'none', margin: 0, padding: 0 }}>
      <span style={{ position: 'absolute', left: 8, top: 12, bottom: 12, width: 1, background: CL.ink2 }} />
      {upstream && nSys === 0 && !splitMode && (
        <li style={{ position: 'relative', display: 'flex', gap: 18, minHeight: 50, paddingBottom: 6 }}>
          <span style={{ position: 'relative', zIndex: 1, marginTop: 7, width: 17, height: 17, borderRadius: 999, border: '2px dashed #B5B5AE', background: '#fff', flexShrink: 0, boxSizing: 'border-box' }} />
          <button type="button" className="cl-btn" onClick={startUpstream} style={{ flex: 1, minWidth: 0, textAlign: 'left', borderRadius: 12, border: '1.5px dashed #D9BE66', background: '#FFFCF0', padding: '10px 14px' }}>
            <span style={{ display: 'block', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 700, color: '#7B4D10' }}>+ Điều gì ở phía hệ thống khiến họ làm vậy?</span>
            <span style={{ display: 'block', marginTop: 2, fontFamily: CL.sans, fontSize: 11.5, lineHeight: 1.4, color: CL.ink4 }}>Tuỳ chọn. Thêm một nguyên nhân thượng nguồn thì mạch này thành Hệ thống.</span>
          </button>
        </li>
      )}
      {steps.map((s, i) => (
        <Fragment key={idPrefix + '-' + i}>
        {nSys > 0 && i === 0 && groupTag('Hệ thống · thượng nguồn', '#FFEEDA', '#7B4D10')}
        {nSys > 0 && i === nSys && groupTag('Cá nhân', '#E4F5FA', '#1F6E8C')}
        <li className="cl-node" style={{ position: 'relative', display: 'flex', gap: 18, minHeight: 50 }}>
          {jumps.includes(i) && i < steps.length - 1 && <span title="Mũi tên đang nhảy" style={{ position: 'absolute', left: 7, top: 16, bottom: -16, width: 3, borderRadius: 2, background: CL.red, zIndex: 0 }} />}
          <span style={{ position: 'relative', zIndex: 1, marginTop: 7, width: 17, height: 17, borderRadius: 999, border: '4px solid #fff', background: i < nSys ? '#7B4D10' : i === nSys && firstIsDriver ? CL.green : CL.ink3, flexShrink: 0 }} />
          <div style={{ position: 'relative', flex: 1, minWidth: 0, paddingBottom: 8, paddingRight: splitMode ? 0 : 40 }}>
            {vague.filter((v) => v.step === i).map((v) => <VagueMark key={v.key} text={s} word={v.word} right={splitMode ? 0 : 40} />)}
            <textarea
              className="cl-ta"
              value={s}
              rows={1}
              onChange={(e) => set(i, e.target.value)}
              placeholder={i < nSys ? 'Điều gì ở phía hệ thống đứng sau?' : i === nSys && firstIsDriver ? 'Điểm bắt đầu…' : placeholder || 'Điều gì xảy ra tiếp theo?'}
              aria-label={'Bước ' + (i + 1)}
              style={{ display: 'block', width: '100%', minHeight: 32, resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontFamily: CL.serif, fontSize: 15, lineHeight: 1.55, color: CL.ink8, padding: 0, fieldSizing: 'content' } as React.CSSProperties}
            />
            {splitMode && picker !== i && s.trim() && (
              <button type="button" className="cl-btn" onClick={() => setPicker(i)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, borderRadius: 5, border: '1px dashed #D9BE66', background: CL.yellowSoft, color: CL.yellowText, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, padding: '4px 9px' }}><ClIcon name="fork" size={12} />Tách nhánh ở bước này</button>
            )}
            {splitMode && picker === i && (
              <div style={{ marginTop: 6, borderRadius: 5, border: '1px solid #EBDDA8', background: '#FFFCF0', padding: '10px 12px' }}>
                <p style={{ margin: '0 0 8px', fontFamily: CL.sans, fontSize: 11.5, color: CL.ink6 }}>Danh từ nào sẽ được đổi điều kiện?</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {s.split(/\s+/).filter((w) => w.replace(/[^A-Za-zÀ-ỹ]/g, '').length > 2).map((w, k) => {
                    const word = w.replace(/[^A-Za-zÀ-ỹ'-]/g, '');
                    return <button key={k} type="button" className="cl-btn cl-word" onClick={() => { setPicker(null); onSplitAt(i, word); }} style={{ borderRadius: 5, border: '1px solid ' + CL.ink2, background: '#fff', fontFamily: CL.serif, fontSize: 13, color: CL.ink8, padding: '3px 8px' }}>{word}</button>;
                  })}
                  <button type="button" className="cl-btn" onClick={() => setPicker(null)} style={{ fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: CL.ink4, padding: '3px 6px' }}>Huỷ</button>
                </div>
              </div>
            )}
          </div>
          {!splitMode && (
            <Fragment>
              <button type="button" className="cl-btn cl-reveal" onClick={() => addAfter(i)} aria-label="Thêm bước" style={{ position: 'absolute', left: -12, bottom: -9, zIndex: 2, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="cl-plus" style={{ width: 18, height: 18, borderRadius: 999, border: '1px solid ' + CL.ink3, background: '#fff', color: CL.ink5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClIcon name="plus" size={10} /></span>
              </button>
              <button type="button" className="cl-btn cl-reveal cl-del" onClick={() => remove(i)} aria-label="Xoá bước" style={{ position: 'absolute', right: 0, top: 0, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CL.ink3 }}><ClIcon name="trash" size={14} /></button>
            </Fragment>
          )}
        </li>
        {nSys > 0 && i === nSys - 1 && !splitMode && (
          <li style={{ listStyle: 'none', paddingLeft: 35, margin: '-2px 0 4px' }}>
            <button type="button" className="cl-btn cl-link" onClick={() => addAfter(i)} style={{ fontFamily: CL.sans, fontSize: 11.5, fontWeight: 600, color: CL.ink5, padding: '2px 0' }}>+ Thêm bước thượng nguồn</button>
          </li>
        )}
        </Fragment>
      ))}
      {end && (
        <li style={{ position: 'relative', display: 'flex', gap: 18, minHeight: 50 }}>
          <span style={{ position: 'relative', zIndex: 1, marginTop: 7, width: 17, height: 17, borderRadius: 5, border: '4px solid #fff', background: '#A8780A', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 8 }}>
            <div style={{ fontFamily: CL.sans, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: CL.ink4, marginBottom: 2 }}>{end.label}</div>
            <div style={{ fontFamily: CL.sans, fontSize: 15, fontWeight: 700, lineHeight: 1.45, color: '#A8780A' }}>{end.text}</div>
          </div>
        </li>
      )}
    </ol>
  );
}
