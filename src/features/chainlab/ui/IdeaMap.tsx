'use client';

import { useEffect, useState } from 'react';
import { CL } from '../constants';
import { cellChains, cellQuestion, gridFor, type MapExtras, type MapRow } from '../ideamap';
import { useSpec } from '../SpecContext';
import type { Chain, Question } from '../types';
import { ClIcon, ClLabel } from './primitives';

const MS = '.3s';

interface IdeaMapProps {
  q: Question;
  chains: Chain[];
  extras?: MapExtras;
  setExtras: (e: MapExtras) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  /** The student wrote a chain from this cell (opens it). */
  onCreate: (row: MapRow, col: string, question: string) => void;
  /** The student typed a rough idea straight into a cell. */
  onNote: (row: MapRow, col: string, question: string, text: string) => void;
  onGoto: (chainId: string) => void;
  /** Inside another box (the rope's): no border or margin of its own. */
  bare?: boolean;
  /** The selected cell, kept by the screen so the chain panel and the review can move it. */
  sel: { r: string; c: string } | null;
  onSel: (s: { r: string; c: string } | null) => void;
}

/**
 * The idea map of one question: rows × columns of cells. Type a rough idea straight into a cell, or select it
 * to see its question and write the whole chain. The body folds smoothly; the header line stays.
 */
export function IdeaMap({ q, chains, extras, setExtras, open, setOpen, onCreate, onNote, onGoto, bare, sel, onSel: setSel }: IdeaMapProps) {
  const spec = useSpec();
  const [adding, setAdding] = useState<'row' | 'col' | null>(null);
  const [draft, setDraft] = useState('');
  const g = gridFor(spec, q, chains, extras);
  const ex = extras || { rows: [], cols: [] };
  const hiddenRows = (ex.hiddenRows || []).filter((h) => (spec.stakeholders || []).includes(h));

  const total = g.rows.length * g.cols.length;
  const made = (r: string, c: string) => cellChains(chains, q.n, r, c);
  const filled = g.rows.reduce((n, r) => n + g.cols.filter((c) => made(r.key, c).length).length, 0);
  const untouched = g.cols.filter((c) => !g.rows.some((r) => made(r.key, c).length));

  const addExtra = () => {
    const v = draft.replace(/\s+/g, ' ').trim().slice(0, 40);
    if (v && adding === 'col' && !g.cols.some((c) => c.toLowerCase() === v.toLowerCase())) setExtras({ ...ex, cols: [...ex.cols, v] });
    if (v && adding === 'row' && !g.rows.some((r) => r.label.toLowerCase() === v.toLowerCase())) setExtras({ ...ex, rows: [...ex.rows, v], hiddenRows: (ex.hiddenRows || []).filter((h) => h.toLowerCase() !== v.toLowerCase()) });
    setAdding(null); setDraft('');
  };
  const removeRow = (r: MapRow) => {
    if (sel && sel.r === r.key) setSel(null);
    if (ex.rows.includes(r.key)) setExtras({ ...ex, rows: ex.rows.filter((x) => x !== r.key) });
    else setExtras({ ...ex, hiddenRows: [...(ex.hiddenRows || []), r.key] });
  };
  const removeCol = (c: string) => {
    if (sel && sel.c === c) setSel(null);
    setExtras({ ...ex, cols: ex.cols.filter((x) => x !== c) });
  };

  if (!g.rows.length && q.shape === 'solution') {
    return <p style={{ margin: '0 4px 14px', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink5 }}>Viết trước một mạch nguyên nhân hoặc vấn đề, rồi nó sẽ hiện thành một hàng ở đây để bạn tìm giải pháp.</p>;
  }

  const selRow = sel && g.rows.find((r) => r.key === sel.r);
  const selChains = sel ? made(sel.r, sel.c) : [];
  const gridCols = 'minmax(110px, 170px) repeat(' + g.cols.length + ', minmax(96px, 1fr))';
  const link: React.CSSProperties = { background: 'none', border: 'none', padding: '6px 2px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: CL.ink5, cursor: 'pointer' };
  const adder = (kind: 'row' | 'col', word: string) => (adding === kind ? (
    <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={addExtra} onKeyDown={(e) => { if (e.key === 'Enter') addExtra(); if (e.key === 'Escape') { setAdding(null); setDraft(''); } }} aria-label={'Tên ' + word} placeholder={'Tên ' + word + '…'} style={{ width: 150, height: 30, borderRadius: 8, border: '1px solid ' + CL.ink3, padding: '0 10px', fontFamily: CL.sans, fontSize: 12.5, outline: 'none' }} />
  ) : <button type="button" className="cl-btn cl-link" onClick={() => { setAdding(kind); setDraft(''); }} style={link}>+ {word[0].toUpperCase() + word.slice(1)}</button>);

  const head = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: open ? 14 : 0, transition: 'margin ' + MS + ' ease' }}>
      <ClLabel color={CL.ink}>Bản đồ ý</ClLabel>
      <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>
        {open ? 'Gõ ý thô vào ô, hoặc chọn ô để viết cả mạch' : filled + ' / ' + total + ' ô' + (untouched.length && untouched.length < g.cols.length ? ' · chưa chạm: ' + untouched.join(', ') : '')}
      </span>
      {open && <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 12, color: CL.ink6 }}><b style={{ fontWeight: 700, color: CL.ink }}>{filled}</b> / {total} ô</span>}
      <button type="button" className="cl-btn cl-link" onClick={() => setOpen(!open)} aria-expanded={open} style={{ ...link, marginLeft: open ? 0 : 'auto' }}>{open ? 'Thu gọn' : 'Mở bản đồ'}</button>
    </div>
  );

  return (
    <section aria-label="Bản đồ ý" style={bare ? undefined : { borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', padding: '16px 22px', marginBottom: 16 }}>
      {head}
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0, visibility: open ? 'visible' : 'hidden', transition: 'grid-template-rows ' + MS + ' ease, opacity ' + MS + ' ease, visibility 0s linear ' + (open ? '0s' : MS) }}>
        <div style={{ minHeight: 0, overflow: open ? 'visible' : 'hidden' }}>
          <div className="cl-scroll" style={{ overflowX: 'auto', paddingBottom: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 8, alignItems: 'stretch', minWidth: 'min-content' }}>
              <div />
              {g.cols.map((c) => (
                <div key={c} style={{ position: 'relative', padding: '0 2px 2px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: CL.ink7 }}>
                  {c}
                  {ex.cols.includes(c) && <button type="button" className="cl-btn cl-del" onClick={() => removeCol(c)} aria-label={'Xoá cột ' + c} style={{ marginLeft: 4, color: CL.ink4, verticalAlign: 'middle' }}><ClIcon name="x" size={11} /></button>}
                </div>
              ))}
              {g.rows.map((r) => (
                <RowCells key={r.key} q={q} row={r} cols={g.cols} made={made} sel={sel} onSel={setSel} onNote={onNote} onRemove={g.rowsAddable ? () => removeRow(r) : undefined} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, marginTop: 6, minHeight: 30, alignItems: 'center', flexWrap: 'wrap' }}>
            {g.rowsAddable && adder('row', g.rowWord)}
            {g.colsAddable && adder('col', g.colWord)}
            {g.rowsAddable && hiddenRows.length > 0 && <button type="button" className="cl-btn cl-link" onClick={() => setExtras({ ...ex, hiddenRows: [] })} style={{ ...link, color: CL.ink4 }}>Hiện lại {hiddenRows.length} bên đã xoá</button>}
          </div>

          {sel && selRow && (
            <div style={{ position: 'sticky', bottom: 0, zIndex: 3, marginTop: 12, borderRadius: 14, background: CL.panel, border: '1px solid ' + CL.ink2, boxShadow: '0 -10px 18px #fff', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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
        </div>
      </div>
    </section>
  );
}

function RowCells({ q, row, cols, made, sel, onSel, onNote, onRemove }: { q: Question; row: MapRow; cols: string[]; made: (r: string, c: string) => Chain[]; sel: { r: string; c: string } | null; onSel: (s: { r: string; c: string } | null) => void; onNote: IdeaMapProps['onNote']; onRemove?: () => void }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontFamily: CL.sans, fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: CL.ink, padding: '8px 6px 0 0' }}>
        <span style={{ flex: 1, minWidth: 0 }}>{row.label}</span>
        {onRemove && <button type="button" className="cl-btn cl-del" onClick={onRemove} aria-label={'Xoá ' + row.label} title="Xoá bên này khỏi bản đồ" style={{ flexShrink: 0, width: 22, height: 22, display: 'grid', placeItems: 'center', color: CL.ink3 }}><ClIcon name="x" size={12} /></button>}
      </div>
      {cols.map((c) => <Cell key={c} q={q} row={row} col={c} chain={made(row.key, c)[0]} on={!!sel && sel.r === row.key && sel.c === c} onSel={onSel} onNote={onNote} />)}
    </>
  );
}

/** One cell: a small note field. Selecting it shows its question below the map. */
function Cell({ q, row, col, chain, on, onSel, onNote }: { q: Question; row: MapRow; col: string; chain?: Chain; on: boolean; onSel: (s: { r: string; c: string } | null) => void; onNote: IdeaMapProps['onNote'] }) {
  const title = chain ? chain.title : '';
  const [text, setText] = useState(title);
  useEffect(() => { setText(title); }, [title]);
  const has = !!chain;
  const commit = () => { if (text.trim() !== title.trim()) onNote(row, col, cellQuestion(q, row, col), text); };
  return (
    <div style={{ position: 'relative' }}>
      <textarea value={text} rows={2} aria-label={row.label + ', ' + col + (has ? ' (đã có mạch)' : '')} onFocus={() => onSel({ r: row.key, c: col })} onChange={(e) => setText(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
        style={{ display: 'block', width: '100%', height: '100%', minHeight: 58, boxSizing: 'border-box', resize: 'none', borderRadius: 10, border: on ? '1.5px solid ' + CL.ink : '1px solid ' + (has ? '#BFE6D7' : CL.ink2), background: has ? CL.mintSoft : '#fff', padding: '8px 22px 8px 10px', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.4, color: has ? CL.greenText : CL.ink, fontWeight: has ? 600 : 400, outline: 'none', transition: 'border-color .15s, background-color .2s' }} />
      {has && <span style={{ position: 'absolute', top: 7, right: 7, pointerEvents: 'none' }}><ClIcon name="check" size={12} color={CL.green} /></span>}
    </div>
  );
}
