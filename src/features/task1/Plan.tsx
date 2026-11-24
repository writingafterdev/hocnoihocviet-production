'use client';

import { useRef, useState } from 'react';
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
  const drag = useRef<{ kind: 'row'; i: number; fromOv?: boolean } | { kind: 'box'; key: string } | null>(null);
  const order = state.order || DEFAULT_ORDER, boxes = boxesOf(state.order);

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
  const dropOn = (key: string) => (e: React.DragEvent) => {
    e.preventDefault(); const d = drag.current; drag.current = null; if (!d) return;
    if (d.kind === 'row') {
      if (d.fromOv && key !== 'overview') { const place = { ...state.place, [d.i]: key }; set({ ov: state.ov.filter((x) => x !== d.i), place }); }
      else if (!(key === 'overview' && state.ov.includes(d.i))) put(d.i, key);
    } else if (d.key !== key) move(d.key, order.indexOf(key));
  };
  const start = (what: NonNullable<typeof drag.current>) => (e: React.DragEvent) => { drag.current = what; try { e.dataTransfer.setData('text/plain', 'x'); e.dataTransfer.effectAllowed = 'move'; } catch { /* ignore */ } };
  const pool = state.found.map((f, i) => ({ f, i })).filter((x) => !state.place[x.i]);
  const ready = planReady(state);

  return (
    <aside style={{ minHeight: 0, overflowY: 'auto', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 50, padding: '0 20px', borderBottom: '1px solid ' + CL.ink1 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>Chia đoạn</span><span style={{ marginLeft: 'auto', fontSize: 12, color: CL.ink5 }}>Kéo để xếp, hoặc bấm nút đặt vào</span>
      </div>
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const d = drag.current; drag.current = null; if (d && d.kind === 'row') { if (d.fromOv) set({ ov: state.ov.filter((x) => x !== d.i) }); else put(d.i, null); } }}
          style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, padding: 2 }}>
          {pool.map(({ f, i }) => (
            <div key={i} draggable onDragStart={start({ kind: 'row', i })} title="Kéo vào một đoạn" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '7px 8px', borderRadius: 10, background: '#F5F5F5', cursor: 'grab' }}>
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
          return (
            <div key={b.key} onDragOver={(e) => e.preventDefault()} onDrop={dropOn(b.key)} style={{ borderRadius: 12, border: '1px solid ' + (why && why.warn ? '#F5C7B8' : CL.border), background: why && why.warn ? CL.redSoft : '#fff', padding: '8px 10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div draggable onDragStart={start({ kind: 'box', key: b.key })} title="Kéo để đổi thứ tự đoạn" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'grab' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill={CL.ink4} aria-hidden="true"><circle cx="8" cy="6" r="2" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="8" cy="18" r="2" /><circle cx="16" cy="18" r="2" /></svg>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{b.name}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: CL.ink5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{items.join(' · ')}</span>
                <button type="button" className="cl-btn" disabled={k === 0} aria-label={'Đưa ' + b.name + ' lên'} onClick={() => move(b.key, k - 1)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid ' + CL.border, background: '#fff', cursor: 'pointer', opacity: k === 0 ? 0.4 : 1 }}>↑</button>
                <button type="button" className="cl-btn" disabled={k === boxes.length - 1} aria-label={'Đưa ' + b.name + ' xuống'} onClick={() => move(b.key, k + 1)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid ' + CL.border, background: '#fff', cursor: 'pointer', opacity: k === boxes.length - 1 ? 0.4 : 1 }}>↓</button>
              </div>
              <div style={{ minHeight: 40, borderRadius: 10, border: '1px dashed ' + CL.ink2, background: '#FAFAFA', padding: 5, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {idx.map((i) => (
                  <button key={i} type="button" draggable onDragStart={start({ kind: 'row', i, fromOv: isOv })} onClick={() => (isOv ? set({ ov: state.ov.filter((x) => x !== i) }) : put(i, null))} title="Kéo sang đoạn khác, hoặc bấm để bỏ ra"
                    style={{ display: 'flex', padding: 5, borderRadius: 8, border: 'none', background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,.06)', cursor: 'pointer', textAlign: 'left' }}>
                    <MiniChips prompt={prompt} row={state.found[i].row} noNums={isOv} white />
                  </button>
                ))}
                {!idx.length && <span style={{ fontSize: 12.5, color: CL.ink4, padding: '4px 6px' }}>{b.empty}</span>}
              </div>
              {why && <span style={{ fontSize: 12.5, lineHeight: 1.5, color: why.warn ? CL.redText : CL.greenText }}>{why.text}</span>}
            </div>
          );
        })}
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: ready ? CL.greenText : CL.ink5 }}>{ready ? 'Dàn ý xong: có tổng quan, và mỗi đoạn có so sánh của nó.' : 'Cần ít nhất một ý trong Tổng quan, Đoạn 1 và Đoạn 2.'}</span>
      </div>
    </aside>
  );
}
