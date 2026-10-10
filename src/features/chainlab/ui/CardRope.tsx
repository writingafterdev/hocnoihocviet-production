'use client';

import { useState } from 'react';
import { CL, CL_ABBR, CL_KIND_STYLE } from '../constants';
import { sidesOf, verdictStatus } from '../model';
import { areaOf, chainName } from '../plan';
import { useSpec } from '../SpecContext';
import type { Chain, Finding, RopeUnit, Side } from '../types';
import { ClIcon, ClLabel } from './primitives';

interface CardRopeProps {
  units: RopeUnit[];
  chains: Chain[];
  onSide: (u: RopeUnit, side: Side) => void;
  /** A finding's side: with its chain, against it, or not placed. */
  onFinding: (chainId: string, findingId: string, side: Side) => void;
  /** Tap-to-place (for touch and keyboard): the chain picked to drop into a table row. */
  picked?: string | null;
  onPick?: (chainId: string | null) => void;
}

/**
 * The rope of screen ②: each chain (or Scope case) is a card in the column of the side it supports, with its
 * status, its area and its findings inside it. Drag a card across, or use its arrow; tap a finding to say whether
 * it backs the chain's side or turns against it.
 */
export function CardRope({ units, chains, onSide, onFinding, picked, onPick }: CardRopeProps) {
  const spec = useSpec();
  const [L, R] = sidesOf(spec);
  const [over, setOver] = useState<Side | 'tray' | null>(null);
  const cards = units.filter((u) => u.kind === 'unit');
  const byKey = (k: string) => cards.find((u) => u.key === k);

  const zone = (s: Side) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(s || 'tray'); },
    onDragLeave: () => setOver(null),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setOver(null); const u = byKey(e.dataTransfer.getData('text/plain')); if (u) onSide(u, s); },
  });

  const card = (u: RopeUnit) => {
    const c = chains.find((x) => x.id === u.chainId);
    if (!c) return null;
    const st = verdictStatus(c);
    const k = u.ref.type === 'branch' ? u.ref.k : null;
    const fs = c.findings.filter((f) => !f.empty && f.text.trim() && (k === null || f.target === 'all' || f.target === k));
    const s = u.side;
    const area = areaOf(c);
    const move = (to: Side) => (
      <button type="button" className="cl-btn" onClick={() => onSide(u, to)} aria-label={'Chuyển sang ' + (to === 'left' ? L : R)} title={'Chuyển sang ' + (to === 'left' ? L : R)}
        style={{ flexShrink: 0, width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 8, color: CL.ink5 }}>
        <ClIcon name={to === 'left' ? 'left' : 'right'} size={13} />
      </button>
    );
    return (
      <div key={u.key} draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', u.key); e.dataTransfer.setData('application/x-chain', u.chainId); e.dataTransfer.effectAllowed = 'copyMove'; }}
        style={{ display: 'flex', flexDirection: 'column', gap: 6, borderRadius: 12, border: picked === c.id ? '1.5px solid ' + CL.ink : '1px solid ' + (s === 'right' ? '#BFE6D7' : CL.ink2), background: picked === c.id ? '#F4F4F1' : '#fff', padding: '9px 8px 9px 12px', cursor: 'grab' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
          {s !== 'left' && move('left')}
          {onPick && s ? (
            <button type="button" className="cl-btn" onClick={() => onPick(picked === c.id ? null : c.id)} aria-pressed={picked === c.id} title="Bấm để chọn, rồi bấm một hàng của bảng để đặt mạch vào"
              style={{ flex: 1, minWidth: 0, paddingTop: 4, textAlign: 'left', fontFamily: CL.sans, fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: CL.ink }}>{chainName(spec, c)}{u.sub ? <span style={{ fontWeight: 500, color: CL.ink6 }}> · {u.sub}</span> : null}</button>
          ) : <span style={{ flex: 1, minWidth: 0, paddingTop: 4, fontFamily: CL.sans, fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: CL.ink }}>{chainName(spec, c)}{u.sub ? <span style={{ fontWeight: 500, color: CL.ink6 }}> · {u.sub}</span> : null}</span>}
          {s !== 'right' && move('right')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ borderRadius: 6, padding: '2px 8px', background: st.bg, color: st.fg, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700 }}>{st.label}</span>
          {area && <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink5 }}>{area}</span>}
        </div>
        {fs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 6, borderTop: '1px solid ' + CL.ink1 }}>
            {fs.map((f) => <FindingRow key={f.id} f={f} side={s} onSet={(v) => onFinding(c.id, f.id, v)} />)}
          </div>
        )}
      </div>
    );
  };

  const tray = cards.filter((u) => !u.side);
  const col = (s: 'left' | 'right') => {
    const list = cards.filter((u) => u.side === s);
    const on = over === s;
    return (
      <div {...zone(s)} style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: 10, background: on ? (s === 'right' ? '#E6F7F0' : '#F1F1EE') : (s === 'right' ? '#F2FBF7' : '#FAFAF8'), borderLeft: s === 'right' ? '1px solid ' + CL.ink1 : 'none', transition: 'background .15s' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: s === 'right' ? 'flex-end' : 'flex-start' }}>
          <span style={{ fontFamily: CL.sans, fontSize: 12, fontWeight: 700, color: s === 'right' ? CL.greenText : CL.ink7 }}>{s === 'right' ? R : L}</span>
          <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>{list.length}</span>
        </div>
        {list.map(card)}
        {!list.length && <span style={{ borderRadius: 10, border: '1.5px dashed ' + CL.ink2, padding: '12px 10px', textAlign: 'center', fontFamily: CL.sans, fontSize: 11.5, color: CL.ink5 }}>Kéo mạch vào đây</span>}
      </div>
    );
  };

  if (!cards.length) return <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5 }}>Chưa có mạch nào viết xong ở bước ①.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {tray.length > 0 && (
        <div {...zone(null)} style={{ display: 'flex', flexDirection: 'column', gap: 8, borderRadius: 14, border: '1px dashed ' + (over === 'tray' ? CL.ink : CL.ink3), padding: 10 }}>
          <ClLabel color={CL.ink6}>Chưa xếp · bấm mũi tên hoặc kéo sang một phía</ClLabel>
          {tray.map(card)}
        </div>
      )}
      <div style={{ display: 'flex', borderRadius: 14, border: '1px solid ' + CL.ink1, overflow: 'hidden' }}>
        {col('left')}
        {col('right')}
      </div>
    </div>
  );
}

/** A finding inside a card: its lens, its text, and whether it backs the chain or turns against it (tap to change). */
function FindingRow({ f, side, onSet }: { f: Finding; side: Side; onSet: (s: Side) => void }) {
  const k = CL_KIND_STYLE[f.kind] || CL_KIND_STYLE['Khả thi'];
  const other: Side = side === 'right' ? 'left' : side === 'left' ? 'right' : null;
  const state = !f.side ? 'none' : side && f.side === side ? 'with' : 'against';
  const next: Side = !side ? null : state === 'none' ? side : state === 'with' ? other : null;
  const word = state === 'with' ? 'ủng hộ' : state === 'against' ? 'ngược phía' : 'chưa xếp';
  const tone = state === 'with' ? { bg: CL.mintSoft, fg: CL.greenText } : state === 'against' ? { bg: CL.yellowSoft, fg: CL.yellowText } : { bg: '#F1F1EE', fg: CL.ink5 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ flexShrink: 0, borderRadius: 5, padding: '1px 6px', background: k.bg, color: k.fg, fontFamily: CL.sans, fontSize: 9.5, fontWeight: 700 }}>{CL_ABBR[f.kind] || f.kind}</span>
      <button type="button" className="cl-btn" disabled={!side} onClick={() => onSet(next)} title={side ? 'Bấm để đổi: ủng hộ mạch → ngược phía → chưa xếp' : 'Xếp mạch sang một phía trước'}
        style={{ flexShrink: 0, minHeight: 24, borderRadius: 6, padding: '2px 7px', background: tone.bg, color: tone.fg, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 'auto' }}>{word}</button>
      </div>
      <span style={{ fontFamily: CL.sans, fontSize: 11.5, lineHeight: 1.4, color: CL.ink7 }}>{f.text}</span>
    </div>
  );
}
