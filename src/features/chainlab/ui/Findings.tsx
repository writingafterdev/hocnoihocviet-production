'use client';

import { useState } from 'react';
import { CL, CL_ABBR } from '../constants';
import type { Finding, Lens, Split } from '../types';
import { ClIcon, ClTag } from './primitives';

type NewFinding = Pick<Finding, 'kind' | 'text' | 'target' | 'empty'>;

/** Write down what a lens turned up, optionally for one Scope case. */
export function FindingComposer({ lens, split, num, onSave, onCancel, verdict = true }: { lens: Lens; split: Split | null; num: number; onSave: (f: NewFinding) => void; onCancel: () => void; verdict?: boolean }) {
  const [text, setText] = useState('');
  const [target, setTarget] = useState<'all' | number>(split ? 0 : 'all');
  const tag = (k: number) => num + String.fromCharCode(97 + k);
  const targets = split ? split.branches.map((b, k) => [k, tag(k) + (b.label ? ' · ' + b.label : '')] as const) : null;
  const chip = target === 'all' ? String(num) : tag(target);
  return (
    <div style={{ borderRadius: 5, border: '1px solid ' + CL.ink2, background: '#fff', padding: '14px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <ClTag kind={lens.kind} />
        <p style={{ margin: 0, flex: 1, fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink7 }}>{lens.q}</p>
      </div>
      {targets && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 12 }}>
          <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink5, marginRight: 4 }}>Thử cho</span>
          {targets.map(([v, l]) => <button key={v} type="button" className="cl-btn" onClick={() => setTarget(v)} style={{ borderRadius: 5, border: '1px solid ' + (target === v ? CL.ink : CL.ink2), background: '#fff', color: target === v ? CL.ink : CL.ink5, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, padding: '4px 8px' }}>{l}</button>)}
        </div>
      )}
      <textarea className="cl-ta" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={lens.ph} rows={2} style={{ display: 'block', width: '100%', marginTop: 12, resize: 'none', borderRadius: 5, border: '1px solid ' + CL.ink2, background: '#FDFDFC', outline: 'none', padding: '9px 11px', fontFamily: CL.serif, fontSize: 14, lineHeight: 1.55, color: CL.ink8, fieldSizing: 'content' } as React.CSSProperties} />
      {verdict && <p style={{ margin: '10px 0 0', fontFamily: CL.sans, fontSize: 11, color: CL.ink5 }}>Lưu xong, xếp chip <b style={{ color: CL.ink, fontWeight: 600 }}>{chip} · {CL_ABBR[lens.kind] || lens.kind}</b> sang một phía trên sợi dây.</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button type="button" className="cl-btn" disabled={!text.trim()} onClick={() => onSave({ kind: lens.kind, text: text.trim(), target })} style={{ borderRadius: 5, background: CL.ink, color: '#fff', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 14px', opacity: !text.trim() ? 0.35 : 1 }}>Lưu</button>
        <button type="button" className="cl-btn" onClick={() => onSave({ kind: lens.kind, text: '', target, empty: true })} style={{ borderRadius: 5, border: '1px solid ' + CL.ink2, background: '#fff', color: CL.ink6, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, padding: '7px 12px' }}>Không có gì đáng giữ</button>
        <button type="button" className="cl-btn cl-link" onClick={onCancel} style={{ fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: CL.ink4, marginLeft: 'auto' }}>Huỷ</button>
      </div>
    </div>
  );
}

/** A saved finding: lens tag, text (click to expand), branch and placement state. */
export function FindingRow({ f, split, onDelete, verdict = true }: { f: Finding; split: Split | null; onDelete: () => void; verdict?: boolean }) {
  const [open, setOpen] = useState(false);
  const tgt = f.target !== 'all' && split && split.branches[f.target] ? 'Nhánh ' + String.fromCharCode(65 + f.target) : null;
  return (
    <div style={{ borderRadius: 5, border: '1px solid #E5E6E8', background: '#fff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 48, padding: '7px 8px 7px 15px' }}>
        <ClTag kind={f.kind} />
        <button type="button" className="cl-btn" onClick={() => !f.empty && setOpen(!open)} style={{ flex: 1, minWidth: 0, textAlign: 'left', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 500, color: f.empty ? CL.ink4 : CL.ink7, fontStyle: f.empty ? 'italic' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: open ? 'normal' : 'nowrap', lineHeight: 1.5 }}>{f.empty ? 'Đã thử, không có gì đáng giữ' : f.text}</button>
        {tgt && <span style={{ fontFamily: CL.sans, fontSize: 10, fontWeight: 600, color: CL.ink4, whiteSpace: 'nowrap' }}>{tgt}</span>}
        {verdict && !f.empty && !f.side && <span style={{ borderRadius: 5, padding: '3px 7px', background: CL.ink1, color: CL.ink6, fontFamily: CL.sans, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>Chưa xếp</span>}
        <button type="button" className="cl-btn cl-del" onClick={onDelete} aria-label="Xoá" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CL.ink3 }}><ClIcon name="trash" size={13} /></button>
      </div>
    </div>
  );
}
