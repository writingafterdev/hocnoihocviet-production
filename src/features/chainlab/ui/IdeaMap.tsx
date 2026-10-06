'use client';

import { useState } from 'react';
import { CL } from '../constants';
import { cellChains, cellQuestion, gridFor, type MapExtras, type MapRow } from '../ideamap';
import { useSpec } from '../SpecContext';
import type { Chain, Question } from '../types';
import { ClIcon, ClLabel } from './primitives';

const CELL = 40;

interface IdeaMapProps {
  q: Question;
  chains: Chain[];
  extras?: MapExtras;
  setExtras: (e: MapExtras) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  /** The student wrote a chain from this cell. */
  onCreate: (row: MapRow, col: string, question: string) => void;
  onGoto: (chainId: string) => void;
  /** Inside another box (the rope's): no border or margin of its own. */
  bare?: boolean;
}

/**
 * The idea map of one question: rows × columns of small cells, each a question to answer with a chain.
 * Folds into one line once a chain is open, so the map and the chains are never both full on screen.
 */
export function IdeaMap({ q, chains, extras, setExtras, open, setOpen, onCreate, onGoto, bare }: IdeaMapProps) {
  const spec = useSpec();
  const [sel, setSel] = useState<{ r: string; c: string } | null>(null);
  const [adding, setAdding] = useState<'row' | 'col' | null>(null);
  const [draft, setDraft] = useState('');
  const g = gridFor(spec, q, chains, extras);
  const ex = extras || { rows: [], cols: [] };

  const total = g.rows.length * g.cols.length;
  const made = (r: string, c: string) => cellChains(chains, q.n, r, c);
  const filled = g.rows.reduce((n, r) => n + g.cols.filter((c) => made(r.key, c).length).length, 0);
  const untouched = g.cols.filter((c) => !g.rows.some((r) => made(r.key, c).length));

  const addExtra = () => {
    const v = draft.replace(/\s+/g, ' ').trim().slice(0, 40);
    if (v && adding === 'col' && !g.cols.some((c) => c.toLowerCase() === v.toLowerCase())) setExtras({ ...ex, cols: [...ex.cols, v] });
    if (v && adding === 'row' && !g.rows.some((r) => r.label.toLowerCase() === v.toLowerCase())) setExtras({ ...ex, rows: [...ex.rows, v] });
    setAdding(null); setDraft('');
  };

  if (!g.rows.length) {
    return q.shape === 'solution' ? (
      <p style={{ margin: '0 4px 14px', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink5 }}>Viết trước một mạch nguyên nhân hoặc vấn đề, rồi nó sẽ hiện thành một hàng ở đây để bạn tìm giải pháp.</p>
    ) : null;
  }

  if (!open) {
    return (
      <button type="button" className="cl-btn cl-add" onClick={() => setOpen(true)} aria-expanded="false" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', borderRadius: 14, border: bare ? 'none' : '1px solid ' + CL.border, background: '#fff', padding: bare ? '0' : '12px 18px', marginBottom: bare ? 0 : 16 }}>
        <ClLabel color={CL.ink}>Bản đồ ý</ClLabel>
        <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink6 }}>{filled} / {total} ô{untouched.length && untouched.length < g.cols.length ? ' · chưa chạm: ' + untouched.join(', ') : ''}</span>
        <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: CL.ink5 }}>Mở bản đồ</span>
      </button>
    );
  }

  const selRow = sel && g.rows.find((r) => r.key === sel.r);
  const selChains = sel ? made(sel.r, sel.c) : [];
  const gridCols = 'minmax(120px, 190px) repeat(' + g.cols.length + ', minmax(64px, 104px))';
  const link: React.CSSProperties = { background: 'none', border: 'none', padding: '6px 2px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: CL.ink5, cursor: 'pointer' };
  const adder = (kind: 'row' | 'col', word: string) => (adding === kind ? (
    <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={addExtra} onKeyDown={(e) => { if (e.key === 'Enter') addExtra(); if (e.key === 'Escape') { setAdding(null); setDraft(''); } }} aria-label={'Tên ' + word} placeholder={'Tên ' + word + '…'} style={{ width: 150, height: 30, borderRadius: 8, border: '1px solid ' + CL.ink3, padding: '0 10px', fontFamily: CL.sans, fontSize: 12.5, outline: 'none' }} />
  ) : <button type="button" className="cl-btn cl-link" onClick={() => { setAdding(kind); setDraft(''); }} style={link}>+ {word[0].toUpperCase() + word.slice(1)}</button>);

  return (
    <section aria-label="Bản đồ ý" style={bare ? undefined : { borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', padding: '18px 22px 18px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <ClLabel color={CL.ink}>Bản đồ ý</ClLabel>
        <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>Bấm một ô để bắt đầu mạch từ câu hỏi của nó</span>
        <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 12, color: CL.ink6 }}><b style={{ fontWeight: 700, color: CL.ink }}>{filled}</b> / {total} ô</span>
        {chains.some((c) => (c.q || 1) === q.n) && <button type="button" className="cl-btn cl-link" onClick={() => setOpen(false)} style={link}>Thu gọn</button>}
      </div>

      <div className="cl-scroll" style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 6, alignItems: 'center', width: 'max-content', minWidth: '100%' }}>
          <div />
          {g.cols.map((c) => <div key={c} style={{ padding: '0 2px 4px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: CL.ink7 }}>{c}</div>)}
          {g.rows.map((r) => (
            <RowCells key={r.key} row={r} cols={g.cols} made={made} sel={sel} onSel={setSel} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 6, minHeight: 30, alignItems: 'center' }}>
        {g.rowsAddable && adder('row', g.rowWord)}
        {g.colsAddable && adder('col', g.colWord)}
      </div>

      {sel && selRow && (
        <div style={{ marginTop: 12, borderRadius: 14, background: CL.panel, border: '1px solid ' + CL.ink1, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 340px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6, fontFamily: CL.sans, fontSize: 12 }}>
              <span style={{ borderRadius: 999, background: CL.ink, color: '#fff', padding: '2px 10px', fontWeight: 600 }}>{selRow.label}</span>
              <span style={{ color: CL.ink5 }}>{q.shape === 'solution' ? 'nhờ' : '×'}</span>
              <span style={{ borderRadius: 999, background: CL.ink, color: '#fff', padding: '2px 10px', fontWeight: 600 }}>{sel.c}</span>
              {g.hint(sel.c) && <span style={{ color: CL.ink4 }}>{g.hint(sel.c)}</span>}
            </div>
            <div style={{ fontFamily: CL.serif, fontSize: 16.5, lineHeight: 1.5, color: CL.ink }}>{cellQuestion(q, selRow, sel.c)}</div>
          </div>
          {selChains.length > 0
            ? <button type="button" className="cl-btn" onClick={() => onGoto(selChains[0].id)} style={{ height: 40, padding: '0 18px', borderRadius: 12, border: '1px solid ' + CL.ink2, background: '#fff', color: CL.ink, fontFamily: CL.sans, fontSize: 13, fontWeight: 600 }}>Đến mạch này</button>
            : <button type="button" className="cl-btn cl-primary" onClick={() => onCreate(selRow, sel.c, cellQuestion(q, selRow, sel.c))} style={{ height: 40, padding: '0 20px', borderRadius: 12, background: CL.ink, color: '#fff', fontFamily: CL.sans, fontSize: 13, fontWeight: 600 }}>{q.shape === 'solution' ? 'Viết giải pháp từ ô này' : 'Viết mạch từ ô này'}</button>}
        </div>
      )}
    </section>
  );
}

function RowCells({ row, cols, made, sel, onSel }: { row: MapRow; cols: string[]; made: (r: string, c: string) => Chain[]; sel: { r: string; c: string } | null; onSel: (s: { r: string; c: string } | null) => void }) {
  return (
    <>
      <div style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: CL.ink, paddingRight: 6 }}>{row.label}</div>
      {cols.map((c) => {
        const mine = made(row.key, c), on = !!sel && sel.r === row.key && sel.c === c, has = mine.length > 0;
        return (
          <button key={c} type="button" className="cl-btn" onClick={() => onSel(on ? null : { r: row.key, c })} aria-pressed={on} title={has ? (mine[0].title || 'Đã có mạch') : undefined} aria-label={row.label + ', ' + c + (has ? ': đã có mạch' : '')}
            style={{ height: CELL, borderRadius: 10, border: (on ? '1.5px solid ' + CL.ink : '1px solid ' + (has ? '#BFE6D7' : CL.ink2)), background: has ? CL.mintSoft : '#fff', display: 'grid', placeItems: 'center' }}>
            {has && <ClIcon name="check" size={13} color={CL.green} />}
            {!has && on && <ClIcon name="plus" size={14} color={CL.ink} />}
          </button>
        );
      })}
    </>
  );
}
