'use client';

import { useRef, useState } from 'react';
import { useFlip, usePointerDrag } from './drag';
import type { T1Prompt } from '@/content/task1';
import { CL } from '../chainlab/constants';
import { bigPicture, reasonOf, rowItems, type Row } from './engine';
import { MiniChips } from './Compare';

export interface PlanState { found: { row: Row }[]; place: Record<number, string>; ov: number[]; order: string[] | null }
export const DEFAULT_ORDER = ['overview', 'b1', 'b2', 'b3'];

/** Paragraph names by position: Tổng quan, then Đoạn 1, 2, 3 in the order the student chose. */
export function boxesOf(order: string[] | null) {
  let n = 0;
  return (order || DEFAULT_ORDER).map((k) => (k === 'overview' ? { key: k, name: 'Tổng quan', empty: 'Một hoặc hai điều lớn nhất, không cần số. Ý đặt ở đây vẫn dùng được cho các đoạn khác.' } : { key: k, name: 'Đoạn ' + ++n, empty: k === 'b3' ? 'Không bắt buộc' : 'Những so sánh kể cùng một chuyện' }));
}
export const indexesIn = (s: PlanState, key: string) => (key === 'overview' ? s.ov.slice() : s.found.map((_, i) => i).filter((i) => s.place[i] === key));
/** Tổng quan, Đoạn 1 and Đoạn 2 each hold at least one finding. */
export const planReady = (s: PlanState) => s.ov.length > 0 && ['b1', 'b2'].every((k) => indexesIn(s, k).length > 0);

/** ② Chia đoạn: findings go into Tổng quan (as copies, without numbers, big picture only) and the body paragraphs. */
export function PlanPanel({ prompt, state, set }: { prompt: T1Prompt; state: PlanState; set: (patch: Partial<PlanState>) => void }) {
  const [msg, setMsg] = useState('');
  const order = state.order || DEFAULT_ORDER;

  const put = (i: number, key: string | null) => {
    if (key === 'overview') {
      if (state.ov.includes(i)) { set({ ov: state.ov.filter((x) => x !== i) }); setMsg(''); return; }
      if (!bigPicture(state.found[i].row)) { setMsg('Tổng quan nói điều lớn nhất, không cần số. Ý này là một số liệu cụ thể, hợp với thân bài hơn.'); return; }
      set({ ov: [...state.ov, i] }); setMsg(''); return;
    }
    const place = { ...state.place }; if (key) place[i] = key; else delete place[i];
    set({ place }); setMsg('');
  };
  const move = (k: string, to: number) => { const o = order.filter((x) => x !== k); o.splice(Math.max(0, Math.min(o.length, to)), 0, k); set({ order: o }); };
  type Payload = { kind: 'row'; i: number; fromOv?: boolean } | { kind: 'box'; key: string };
  const rootRef = useRef<HTMLDivElement>(null);
  // While dragging: the paragraph (or the pool) under the cursor, or where a dragged paragraph would go.
  const [over, setOver] = useState<string | null>(null);
  const [boxAt, setBoxAt] = useState<number | null>(null);
  const dropAt = (x: number, y: number) => {
    for (const el of Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-drop]') || [])) { const r = el.getBoundingClientRect(); if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el.dataset.drop!; }
    return null;
  };
  const slotAt = (key: string, y: number) => {
    const els = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-box]') || []).filter((el) => el.dataset.box !== key);
    const k = els.findIndex((el) => { const r = el.getBoundingClientRect(); return y < r.top + r.height / 2; });
    return k < 0 ? els.length : k;
  };
  const dropRow = (d: { i: number; fromOv?: boolean }, key: string | null) => {
    if (key === 'pool' || key === null) { if (key === 'pool') { if (d.fromOv) set({ ov: state.ov.filter((x) => x !== d.i) }); else put(d.i, null); } return; }
    if (d.fromOv && key !== 'overview') { const place = { ...state.place, [d.i]: key }; set({ ov: state.ov.filter((x) => x !== d.i), place }); }
    else if (!(key === 'overview' && state.ov.includes(d.i))) put(d.i, key);
  };
  const { drag, start, swallowClick } = usePointerDrag<Payload>({
    onMove: (p, x, y) => { if (p.kind === 'row') setOver(dropAt(x, y)); else setBoxAt(slotAt(p.key, y)); },
    onDrop: (p, x, y) => { if (p.kind === 'row') dropRow(p, dropAt(x, y)); else { const o = order.filter((k) => k !== p.key); o.splice(slotAt(p.key, y), 0, p.key); set({ order: o }); } },
    onEnd: () => { setOver(null); setBoxAt(null); },
  });
  useFlip(rootRef, true);
  const dragRow = drag && drag.p.kind === 'row' ? drag.p : null, dragBox = drag && drag.p.kind === 'box' ? drag.p.key : null;
  // A dragged paragraph takes its new place in the list as it moves.
  const shownOrder = dragBox && boxAt !== null ? (() => { const o = order.filter((k) => k !== dragBox); o.splice(boxAt, 0, dragBox); return o; })() : order;
  const boxes = boxesOf(shownOrder);
  /** Would this paragraph take the dragged finding? (Tổng quan only takes the big picture.) */
  const takes = (key: string) => !dragRow || key !== 'overview' || (!state.ov.includes(dragRow.i) && bigPicture(state.found[dragRow.i].row));
  const srcOf = (i: number, fromOv: boolean) => !!dragRow && dragRow.i === i && !!dragRow.fromOv === fromOv;
  const pool = state.found.map((f, i) => ({ f, i })).filter((x) => !state.place[x.i]);
  const ready = planReady(state);

  return (
    <aside onClickCapture={swallowClick} style={{ minHeight: 0, overflowY: 'auto', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 50, padding: '0 20px', borderBottom: '1px solid ' + CL.ink1 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>Chia đoạn</span><span style={{ marginLeft: 'auto', fontSize: 12, color: CL.ink5 }}>Kéo để xếp, hoặc bấm nút đặt vào</span>
      </div>
      <div ref={rootRef} style={{ position: 'relative', padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div data-drop="pool"
          style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, padding: 2, borderRadius: 12, outline: dragRow && over === 'pool' && state.place[dragRow.i] ? '2px dashed #77A1DD' : 'none', outlineOffset: 2 }}>
          {pool.map(({ f, i }) => (
            <div key={i} data-flip={'p' + i} onPointerDown={(e) => start(e, { kind: 'row', i })} title="Kéo vào một đoạn" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '7px 8px', borderRadius: 10, background: '#F5F5F5', cursor: drag ? 'grabbing' : 'grab', touchAction: 'none', opacity: srcOf(i, false) ? 0.35 : 1 }}>
              <MiniChips prompt={prompt} row={f.row} white />
              <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {boxes.map((b) => { const on = b.key === 'overview' && state.ov.includes(i); return (
                  <button key={b.key} type="button" className="cl-btn" onClick={() => put(i, b.key)} style={{ height: 26, borderRadius: 7, border: '1px solid ' + (on ? '#DCE7F7' : 'rgba(0,0,0,.12)'), background: on ? '#EEF3FC' : '#fff', padding: '0 9px', fontSize: 12, fontWeight: 500, color: on ? '#2F62C4' : CL.ink7, cursor: 'pointer' }}>{b.name}</button>
                ); })}
              </span>
            </div>
          ))}
          {!pool.length && <span style={{ fontSize: 12.5, color: CL.ink4 }}>Đã xếp hết.</span>}
        </div>
        {msg && <span role="status" style={{ fontSize: 12.5, lineHeight: 1.5, color: CL.redText }}>{msg}</span>}
        {boxes.map((b, k) => {
          const isOv = b.key === 'overview', idx = indexesIn(state, b.key), rows = idx.map((i) => state.found[i].row), why = isOv ? null : reasonOf(prompt, rows);
          const items = Array.from(new Set(rows.flatMap((r) => rowItems(prompt, r))));
          const hot = !!dragRow && over === b.key && !(isOv ? dragRow.fromOv : state.place[dragRow.i] === b.key && !dragRow.fromOv), ok = takes(b.key);
          return (
            <div key={b.key} data-box={b.key} data-drop={b.key} data-flip={'b' + b.key} style={{ borderRadius: 12, border: '1px ' + (dragBox === b.key ? 'dashed #77A1DD' : 'solid ' + (hot ? (ok ? '#77A1DD' : '#F5C7B8') : why && why.warn ? '#F5C7B8' : CL.border)), boxShadow: hot ? '0 0 0 3px ' + (ok ? '#DCE7F7' : '#FBE3DB') : 'none', background: dragBox === b.key ? '#F7F9FD' : why && why.warn ? CL.redSoft : '#fff', padding: '8px 10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8, transition: 'box-shadow .15s, border-color .15s' }}>
              <div onPointerDown={(e) => start(e, { kind: 'box', key: b.key })} title="Kéo để đổi thứ tự đoạn" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: drag ? 'grabbing' : 'grab', touchAction: 'none', opacity: dragBox === b.key ? 0.4 : 1 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill={CL.ink4} aria-hidden="true"><circle cx="8" cy="6" r="2" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="8" cy="18" r="2" /><circle cx="16" cy="18" r="2" /></svg>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{b.name}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: CL.ink5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{items.join(' · ')}</span>
                <button type="button" className="cl-btn" disabled={k === 0} aria-label={'Đưa ' + b.name + ' lên'} onClick={() => move(b.key, k - 1)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid ' + CL.border, background: '#fff', cursor: 'pointer', opacity: k === 0 ? 0.4 : 1 }}>↑</button>
                <button type="button" className="cl-btn" disabled={k === boxes.length - 1} aria-label={'Đưa ' + b.name + ' xuống'} onClick={() => move(b.key, k + 1)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid ' + CL.border, background: '#fff', cursor: 'pointer', opacity: k === boxes.length - 1 ? 0.4 : 1 }}>↓</button>
              </div>
              <div style={{ minHeight: 40, borderRadius: 10, border: '1px dashed ' + CL.ink2, background: '#FAFAFA', padding: 5, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {idx.map((i) => (
                  <button key={i} data-flip={(isOv ? 'o' : 'r') + i} type="button" onPointerDown={(e) => start(e, { kind: 'row', i, fromOv: isOv })} onClick={() => (isOv ? set({ ov: state.ov.filter((x) => x !== i) }) : put(i, null))} title="Kéo sang đoạn khác, hoặc bấm để bỏ ra"
                    style={{ display: 'flex', padding: 5, borderRadius: 8, border: 'none', background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,.06)', cursor: drag ? 'grabbing' : 'grab', touchAction: 'none', textAlign: 'left', opacity: srcOf(i, isOv) ? 0.35 : 1 }}>
                    <MiniChips prompt={prompt} row={state.found[i].row} noNums={isOv} white />
                  </button>
                ))}
                {hot && ok && <div style={{ height: Math.min(drag!.h, 44), borderRadius: 8, border: '1.5px dashed #77A1DD', background: '#F7F9FD' }} />}
                {!idx.length && !(hot && ok) && <span style={{ fontSize: 12.5, color: CL.ink4, padding: '4px 6px' }}>{b.empty}</span>}
              </div>
              {why && <span style={{ fontSize: 12.5, lineHeight: 1.5, color: why.warn ? CL.redText : CL.greenText }}>{why.text}</span>}
            </div>
          );
        })}
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: ready ? CL.greenText : CL.ink5 }}>{ready ? 'Dàn ý xong: có tổng quan, và mỗi đoạn có so sánh của nó.' : 'Cần ít nhất một ý trong Tổng quan, Đoạn 1 và Đoạn 2.'}</span>
      </div>
      {drag && (
        <div aria-hidden="true" style={{ position: 'fixed', left: drag.x - drag.offX, top: drag.y - drag.offY, width: drag.w, zIndex: 60, pointerEvents: 'none', transform: 'rotate(-1.2deg)' }}>
          {drag.p.kind === 'row' ? (
            <div style={{ display: 'flex', padding: 7, borderRadius: 10, background: '#fff', boxShadow: '0 14px 30px -10px rgba(0,0,0,.35), 0 0 0 1px rgba(0,0,0,.06)' }}>
              <MiniChips prompt={prompt} row={state.found[drag.p.i].row} noNums={!!drag.p.fromOv} white />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, background: '#fff', boxShadow: '0 14px 30px -10px rgba(0,0,0,.35), 0 0 0 1px rgba(0,0,0,.06)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill={CL.ink4} aria-hidden="true"><circle cx="8" cy="6" r="2" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="8" cy="18" r="2" /><circle cx="16" cy="18" r="2" /></svg>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{boxes.find((b) => b.key === (drag.p as { key: string }).key)?.name}</span>
              <span style={{ fontSize: 12, color: CL.ink5 }}>{indexesIn(state, drag.p.key).length} ý</span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
