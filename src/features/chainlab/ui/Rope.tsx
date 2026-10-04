'use client';

import { Fragment, useRef, useState } from 'react';
import { CL, CL_ABBR, CL_KIND_STYLE } from '../constants';
import { sidesOf } from '../model';
import { useSpec } from '../SpecContext';
import type { RopeUnit, Side } from '../types';
import { ClLabel, ClTag } from './primitives';

interface DragState { key: string; x0: number; y0: number; dx: number; dy: number; over: Side }

/**
 * The two-sided rope: every verdict chain (or Scope case) and every finding is a chip
 * the student drags to the left or right pole. Read-only when `onSide` is omitted.
 */
export function Rope({ units, onSide, selected, onSelect, compact }: { units: RopeUnit[]; onSide?: (u: RopeUnit, side: Side) => void; selected: string | null; onSelect?: (u: RopeUnit) => void; compact?: boolean }) {
  const spec = useSpec();
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hov, setHov] = useState<string | null>(null);
  const [hovKey, setHovKey] = useState<string | null>(null);
  const [LS, RS] = sidesOf(spec);
  const sideTxt = (s: Side) => (s === 'left' ? LS : s === 'right' ? RS : 'Chưa xếp');

  const pop = (u: RopeUnit) => (
    <span style={{ position: 'absolute', top: 'calc(100% + 8px)', ...(u.side === 'right' ? { right: 0 } : u.side === 'left' ? { left: 0 } : { left: '50%', transform: 'translateX(-50%)' }), zIndex: 30, width: 280, maxWidth: 'calc(100vw - 48px)', display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', boxShadow: '0 10px 28px rgba(20,20,19,.12)', textAlign: 'left', pointerEvents: 'none', whiteSpace: 'normal' }}>
      {u.kind === 'finding' ? (
        <Fragment>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ClTag kind={u.lens} /><span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: CL.ink5 }}>{sideTxt(u.side)}</span></span>
          <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink5 }}>{u.chainName}</span>
          <span style={{ fontFamily: CL.serif, fontSize: 13.5, lineHeight: 1.55, color: CL.ink8 }}>{u.text}</span>
        </Fragment>
      ) : (
        <Fragment>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: CL.ink }}>{u.title}</span><span style={{ marginLeft: 'auto', whiteSpace: 'nowrap', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: CL.ink5 }}>{sideTxt(u.side)}</span></span>
          {u.findings && u.findings.length ? u.findings.map((f) => (
            <span key={f.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ width: 8, height: 8, marginTop: 5, borderRadius: 2, flexShrink: 0, background: (CL_KIND_STYLE[f.kind] || { fg: CL.ink4 }).fg }} />
              <span style={{ flex: 1, fontFamily: CL.sans, fontSize: 12, lineHeight: 1.5, color: CL.ink7 }}><b style={{ fontWeight: 600, color: CL.ink }}>{CL_ABBR[f.kind] || f.kind}</b> · {f.text}</span>
              <span style={{ whiteSpace: 'nowrap', fontFamily: CL.sans, fontSize: 10, fontWeight: 600, color: f.side ? (f.side === u.side ? CL.greenText : CL.yellowText) : CL.ink4 }}>{f.side ? (f.side === u.side ? 'Cùng phía' : 'Ngược phía') : 'Chưa xếp'}</span>
            </span>
          )) : <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>Chưa có phát hiện nào.</span>}
        </Fragment>
      )}
    </span>
  );

  const sideAt = (x: number): Side => { const r = ref.current.getBoundingClientRect(); return x < r.left + r.width / 2 ? 'left' : 'right'; };

  const chip = (u: RopeUnit) => {
    const d = drag && drag.key === u.key;
    const unit = u.kind === 'unit';
    const on = selected === u.key || selected === u.chainId;
    const sib = hov === u.chainId;
    const ks = CL_KIND_STYLE[u.lens];
    return (
      <span key={u.key} style={{ position: 'relative', display: 'inline-flex', zIndex: hovKey === u.key || d ? 10 : 1 }} onMouseEnter={() => { setHov(u.chainId); setHovKey(u.key); }} onMouseLeave={() => { setHov(null); setHovKey(null); }}>
        <button
          type="button"
          className="cl-btn"
          onPointerDown={(e) => { if (!onSide) { onSelect && onSelect(u); return; } e.currentTarget.setPointerCapture(e.pointerId); setDrag({ key: u.key, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, over: null }); }}
          onPointerMove={(e) => { if (!d) return; const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0; setDrag({ ...drag, dx, dy, over: Math.abs(dx) + Math.abs(dy) > 4 ? sideAt(e.clientX) : null }); }}
          onPointerUp={(e) => { if (!d) return; const moved = Math.abs(drag.dx) + Math.abs(drag.dy) > 4; setDrag(null); if (moved) onSide(u, sideAt(e.clientX)); else onSelect && onSelect(u); }}
          onPointerCancel={() => setDrag(null)}
          onKeyDown={(e) => { if (!onSide) return; if (e.key === 'ArrowLeft') { e.preventDefault(); onSide(u, 'left'); } if (e.key === 'ArrowRight') { e.preventDefault(); onSide(u, 'right'); } }}
          aria-label={u.title + ' · ' + sideTxt(u.side) + (onSide ? ' (← → để đổi phía)' : '')}
          style={{ position: 'relative', zIndex: d ? 10 : 1, transform: d ? 'translate(' + drag.dx + 'px,' + drag.dy + 'px)' : 'none', transition: d ? 'none' : 'background .15s, border-color .15s', display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 7, border: '1px solid ' + (on || d ? CL.ink : unit ? CL.ink3 : CL.ink2), background: sib && !d ? '#F4F4F1' : '#fff', boxShadow: d ? '0 8px 20px rgba(20,20,19,.14)' : 'none', fontFamily: CL.sans, fontSize: 12, fontWeight: unit ? 700 : 500, color: unit ? CL.ink : CL.ink7, cursor: onSide ? (d ? 'grabbing' : 'grab') : 'pointer', touchAction: 'none', whiteSpace: 'nowrap' }}
        >
          {unit ? <span style={{ width: 7, height: 7, borderRadius: 999, background: u.tone === 'benefit' ? CL.mint : CL.red }} /> : <span style={{ width: 8, height: 8, borderRadius: 2, background: ks ? ks.fg : CL.ink4 }} />}
          {u.label}
        </button>
        {hovKey === u.key && !drag && pop(u)}
      </span>
    );
  };

  const tray = units.filter((u) => !u.side);
  const bins: [Side, string, RopeUnit[]][] = [['left', LS, units.filter((u) => u.side === 'left')], ['right', RS, units.filter((u) => u.side === 'right')]];
  return (
    <div ref={ref}>
      {tray.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12, padding: '8px 10px', borderRadius: 12, border: '1px dashed ' + CL.ink3 }}>
          <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink5, marginRight: 4 }}>{onSide ? 'Kéo sang một phía' : 'Chưa xếp'}</span>
          {tray.map(chip)}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
        {bins.map(([s, l, list]) => {
          const left = s === 'left', over = drag && drag.over === s;
          return (
            <div key={s} style={{ padding: left ? '0 14px 0 0' : '0 0 0 14px', borderLeft: left ? 'none' : '1px solid ' + CL.ink2 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: left ? 'flex-start' : 'flex-end', marginBottom: 8 }}>
                <ClLabel color={CL.ink5} style={{ fontSize: 9.5 }}>{l}</ClLabel>
                <span style={{ fontFamily: CL.sans, fontSize: 10.5, color: CL.ink4 }}>{list.length}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: left ? 'flex-start' : 'flex-end', minHeight: compact ? 32 : 40, margin: -6, padding: 6, borderRadius: 10, background: over ? CL.panel : 'transparent', outline: over ? '1px dashed ' + CL.ink3 : 'none', transition: 'background .15s' }}>
                {list.map(chip)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
