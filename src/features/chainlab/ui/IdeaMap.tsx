'use client';

import { useState } from 'react';
import { CL } from '../constants';
import { cellChains, cellPair, type CellCmp, cmpKey, DRV, driverOf, gridFor, isCompare, isWritten, type MapExtras, type MapRow, VERDICT_WORDS, verdictKind } from '../ideamap';
import { filledSteps, levelOf, upstreamSteps } from '../model';
import { useSpec } from '../SpecContext';
import type { Chain, Question } from '../types';
import { ClIcon, ClLabel } from './primitives';

const MS = '.3s';

interface IdeaMapProps {
  q: Question;
  chains: Chain[];
  extras?: MapExtras;
  setExtras: (e: MapExtras) => void;
  /** "Best" / "only" prompts: the student renamed the rival B (empty puts the suggestion back). */
  onRival?: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  /** Inside another box (the rope's): no border or margin of its own. */
  bare?: boolean;
  /** The selected cell, kept by the screen so the chain panel and the review can move it. */
  sel: { r: string; c: string } | null;
  onSel: (s: { r: string; c: string } | null) => void;
}

/**
 * The idea map of one question: rows × columns of cells. A cell only selects; its question and chain live in the
 * middle panel. The body folds smoothly; the header line stays.
 */
export function IdeaMap({ q, chains, extras, setExtras, onRival, open, setOpen, bare, sel, onSel: setSel }: IdeaMapProps) {
  const spec = useSpec();
  const [adding, setAdding] = useState<'row' | 'col' | null>(null);
  const [draft, setDraft] = useState('');
  const [rivalDraft, setRivalDraft] = useState<string | null>(null);
  const g = gridFor(spec, q, chains, extras);
  const ex = extras || { rows: [], cols: [] };
  const hiddenRows = (ex.hiddenRows || []).filter((h) => (spec.stakeholders || []).includes(h));

  const cmpMode = isCompare(spec, q);
  const total = g.rows.length * g.cols.length;
  const made = (r: string, c: string) => cellChains(chains, q.n, r, c);
  const filled = g.rows.reduce((n, r) => n + g.cols.filter((c) => made(r.key, c).length).length, 0);
  const cmpOf = (r: string, c: string) => (ex.cmp || {})[cmpKey(r, c)];
  const compared = cmpMode ? g.rows.reduce((n, r) => n + g.cols.filter((c) => { const v = cmpOf(r.key, c); return !!v && !!v.win; }).length, 0) : 0;
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

  const gridCols = cmpMode ? 'minmax(96px, 150px) repeat(' + g.cols.length + ', minmax(66px, 1fr))' : 'minmax(110px, 170px) repeat(' + g.cols.length + ', minmax(96px, 1fr))';
  const link: React.CSSProperties = { background: 'none', border: 'none', padding: '6px 2px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: CL.ink5, cursor: 'pointer' };
  const adder = (kind: 'row' | 'col', word: string) => (adding === kind ? (
    <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={addExtra} onKeyDown={(e) => { if (e.key === 'Enter') addExtra(); if (e.key === 'Escape') { setAdding(null); setDraft(''); } }} aria-label={'Tên ' + word} placeholder={'Tên ' + word + '…'} style={{ width: 150, height: 30, borderRadius: 8, border: '1px solid ' + CL.ink3, padding: '0 10px', fontFamily: CL.sans, fontSize: 12.5, outline: 'none' }} />
  ) : <button type="button" className="cl-btn cl-link" onClick={() => { setAdding(kind); setDraft(''); }} style={link}>+ {word[0].toUpperCase() + word.slice(1)}</button>);

  const head = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: open ? 14 : 0, transition: 'margin ' + MS + ' ease' }}>
      <ClLabel color={CL.ink}>Bản đồ ý</ClLabel>
      <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>
        {open ? (cmpMode ? 'Mỗi ô có mạch A và mạch B, rồi so sánh ngay trong ô' : 'Chọn một ô, rồi viết mạch cho ô đó') : filled + ' / ' + total + ' ô' + (cmpMode ? ' · ' + compared + ' đã so sánh' : '') + (untouched.length && untouched.length < g.cols.length ? ' · chưa chạm: ' + untouched.join(', ') : '')}
      </span>
      {open && <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 12, color: CL.ink6 }}><b style={{ fontWeight: 700, color: CL.ink }}>{filled}</b> / {total} ô{cmpMode && <> · <b style={{ fontWeight: 700, color: CL.ink }}>{compared}</b> đã so sánh</>}</span>}
      <button type="button" className="cl-btn cl-link" onClick={() => setOpen(!open)} aria-expanded={open} style={{ ...link, marginLeft: open ? 0 : 'auto' }}>{open ? 'Thu gọn' : 'Mở bản đồ'}</button>
    </div>
  );

  return (
    <section aria-label="Bản đồ ý" style={bare ? undefined : { borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', padding: '16px 22px', marginBottom: 16 }}>
      {head}
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0, visibility: open ? 'visible' : 'hidden', transition: 'grid-template-rows ' + MS + ' ease, opacity ' + MS + ' ease, visibility 0s linear ' + (open ? '0s' : MS) }}>
        <div style={{ minHeight: 0, overflow: open ? 'visible' : 'hidden' }}>
          {cmpMode && spec.claim && (
            <div style={{ borderRadius: 14, background: CL.panel, border: '1px solid ' + CL.ink1, padding: '12px 14px', margin: '0 0 12px', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink6 }}>
              <span style={{ borderRadius: 6, background: CL.ink, color: '#fff', padding: '3px 9px', marginRight: 8, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{spec.claim === 'only' ? 'The only way' : 'The best way'}</span>
              {spec.claim === 'only'
                ? <>Đề nói A là cách <b>duy nhất</b>. Chỉ cần một cách khác hiệu quả là đề không còn đúng: tìm một cách B thật sự hiệu quả và chứng minh nó ở một ô là đủ.</>
                : <>Đề nói A là cách <b>tốt nhất</b>, nên A phải hơn các cách khác. Chọn đối thủ mạnh nhất của A; đề chỉ đúng nếu A thắng B ở phần lớn ô, nhất là những ô quan trọng nhất.</>}
            </div>
          )}
          {cmpMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 12px' }}>
              {(['A', 'B'] as const).map((k) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.4 }}>
                  <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: DRV[k].solid, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>{k}</span>
                  {k === 'B' && spec.claim && onRival ? (
                    rivalDraft === null ? (
                      <button type="button" className="cl-btn" onClick={() => setRivalDraft(driverOf(spec, 'B'))} title="Đổi sang đối thủ bạn thấy mạnh nhất" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', borderRadius: 10, border: '1.5px dashed #D9BE66', background: '#FFFCF0', padding: '6px 10px', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 700, lineHeight: 1.4, color: DRV.B.text }}>
                        <span style={{ flex: 1, minWidth: 0 }}>{driverOf(spec, 'B')}</span><ClIcon name="edit" size={13} color={DRV.B.text} />
                      </button>
                    ) : (
                      <input autoFocus value={rivalDraft} maxLength={120} onChange={(e) => setRivalDraft(e.target.value)} aria-label="Đối thủ B" placeholder="Cách khác bạn thấy mạnh nhất…"
                        onBlur={() => { onRival(rivalDraft); setRivalDraft(null); }} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setRivalDraft(null); }}
                        style={{ flex: 1, minWidth: 0, height: 32, borderRadius: 10, border: '1.5px solid ' + DRV.B.solid, padding: '0 10px', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 700, color: DRV.B.text, outline: 'none' }} />
                    )
                  ) : <span style={{ minWidth: 0, fontWeight: 700, color: DRV[k].text }}>{driverOf(spec, k)}</span>}
                  {spec.claim && <span style={{ flexShrink: 0, fontSize: 11, color: CL.ink4 }}>{k === 'A' ? 'cách đề nêu' : (ex.rival ? 'bạn chọn' : 'gợi ý, bấm để đổi')}</span>}
                </div>
              ))}
            </div>
          )}
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
                <RowCells key={r.key} q={q} row={r} cols={g.cols} made={made} sel={sel} onSel={setSel} onRemove={g.rowsAddable ? () => removeRow(r) : undefined} compare={cmpMode} chains={chains} cmpOf={cmpOf} />
              ))}
              {cmpMode && (
                <>
                  <div style={{ paddingTop: 8, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: CL.ink4 }}>Tổng</div>
                  {g.cols.map((c) => {
                    const w = { A: 0, B: 0, '=': 0 };
                    g.rows.forEach((r) => { const v = cmpOf(r.key, c); if (v && v.win) w[v.win] += 1; });
                    const n = w.A + w.B + w['='];
                    return (
                      <div key={c} style={{ paddingTop: 8 }}>
                        <div aria-hidden="true" style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: '#F1F1EE', gap: 1 }}>
                          {w.A > 0 && <span style={{ flex: w.A, background: DRV.A.solid }} />}
                          {w['='] > 0 && <span style={{ flex: w['='], background: CL.ink4 }} />}
                          {w.B > 0 && <span style={{ flex: w.B, background: DRV.B.solid }} />}
                        </div>
                        <div style={{ marginTop: 4, textAlign: 'center', fontFamily: CL.sans, fontSize: 10.5, color: n ? CL.ink6 : CL.ink4 }}>{n ? (verdictKind(spec) === 'only' ? [w.A && 'chỉ A ' + w.A, w['='] && 'một phần ' + w['='], w.B && 'B ' + w.B] : [w.A && 'A ' + w.A, w['='] && 'ngang ' + w['='], w.B && 'B ' + w.B]).filter(Boolean).join(' · ') : 'chưa có'}</div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {q.shape === 'cause' && (() => {
            const written = chains.filter((c) => (c.q || 1) === q.n && filledSteps(c) > 0);
            if (!written.length) return null;
            const deep = written.filter((c) => levelOf(c) === 'Hệ thống').length;
            return (
              <div style={{ marginTop: 10, borderRadius: 12, padding: '10px 14px', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, background: deep ? '#F2FBF7' : '#FDF3F1', border: '1px solid ' + (deep ? '#BFE6D7' : '#F1D3CF'), color: deep ? '#17664F' : '#5E2B27' }}>
                {deep
                  ? <><b>{deep} mạch chạm tới hệ thống</b>{written.length - deep > 0 ? ', ' + (written.length - deep) + ' mạch mới dừng ở cá nhân' : ''}. Đề cần cả hai, vậy là đủ.</>
                  : <><b style={{ color: '#8B3A35' }}>Chưa có mạch nào chạm tới hệ thống.</b> Đề cần cả nguyên nhân ở phía cá nhân lẫn phía hệ thống đứng sau họ.</>}
              </div>
            );
          })()}
          <div style={{ display: 'flex', gap: 14, marginTop: 6, minHeight: 30, alignItems: 'center', flexWrap: 'wrap' }}>
            {g.rowsAddable && adder('row', g.rowWord)}
            {g.colsAddable && adder('col', g.colWord)}
            {g.rowsAddable && hiddenRows.length > 0 && <button type="button" className="cl-btn cl-link" onClick={() => setExtras({ ...ex, hiddenRows: [] })} style={{ ...link, color: CL.ink4 }}>Hiện lại {hiddenRows.length} bên đã xoá</button>}
          </div>

        </div>
      </div>
    </section>
  );
}

function RowCells({ q, row, cols, made, sel, onSel, onRemove, compare, chains, cmpOf }: { q: Question; row: MapRow; cols: string[]; made: (r: string, c: string) => Chain[]; sel: { r: string; c: string } | null; onSel: (s: { r: string; c: string } | null) => void; onRemove?: () => void; compare?: boolean; chains: Chain[]; cmpOf: (r: string, c: string) => CellCmp | undefined }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontFamily: CL.sans, fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: CL.ink, padding: '8px 6px 0 0' }}>
        <span style={{ flex: 1, minWidth: 0 }}>{row.label}</span>
        {onRemove && <button type="button" className="cl-btn cl-del" onClick={onRemove} aria-label={'Xoá ' + row.label} title="Xoá bên này khỏi bản đồ" style={{ flexShrink: 0, width: 22, height: 22, display: 'grid', placeItems: 'center', color: CL.ink3 }}><ClIcon name="x" size={12} /></button>}
      </div>
      {cols.map((c) => compare
        ? <PairCell key={c} q={q} row={row} col={c} chains={chains} cmp={cmpOf(row.key, c)} on={!!sel && sel.r === row.key && sel.c === c} onSel={onSel} />
        : <Cell key={c} cause={q.shape === 'cause'} row={row} col={c} chain={made(row.key, c)[0]} on={!!sel && sel.r === row.key && sel.c === c} onSel={onSel} />)}
    </>
  );
}

/** One cell: it only selects. Once a chain is written there it shows the chain's name on mint; cause cells say how deep the chain goes. */
function Cell({ cause, row, col, chain, on, onSel }: { cause?: boolean; row: MapRow; col: string; chain?: Chain; on: boolean; onSel: (s: { r: string; c: string } | null) => void }) {
  const mine = chain ? chain.steps.slice(cause ? upstreamSteps(chain).length : 1).filter((x) => x.trim()) : [];
  const name = chain ? chain.title.trim() || (cause ? mine[0] : chain.steps.filter((x) => x.trim())[1]) || '' : '';
  const lv = cause && chain ? levelOf(chain) : null;
  return (
    <button type="button" className="cl-btn" onClick={() => onSel({ r: row.key, c: col })} aria-pressed={on} aria-label={row.label + ', ' + col + (chain ? ' (đã có mạch' + (lv ? ', ' + lv : '') + ')' : '')}
      style={{ position: 'relative', display: 'block', width: '100%', height: '100%', minHeight: 58, boxSizing: 'border-box', textAlign: 'left', borderRadius: 10, border: on ? '1.5px solid ' + CL.ink : '1px solid ' + (chain ? '#BFE6D7' : CL.ink2), background: chain ? CL.mintSoft : '#fff', padding: '8px 22px 8px 10px', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.4, color: CL.greenText, fontWeight: 600, transition: 'border-color .15s, background-color .2s' }}>
      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{name}</span>
      {chain && <span style={{ position: 'absolute', top: 7, right: 7, pointerEvents: 'none' }}><ClIcon name="check" size={12} color={CL.green} /></span>}
      {lv && <span style={{ position: 'absolute', right: 5, bottom: 5, borderRadius: 5, padding: '2px 5px', background: lv === 'Hệ thống' ? '#7B4D10' : '#1F6E8C', color: '#fff', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em' }}>{lv === 'Hệ thống' ? 'HT' : 'CN'}</span>}
    </button>
  );
}

/** One cell of a two-driver map: a square for each driver (filled once its chain is written) and the verdict. */
function PairCell({ q, row, col, chains, cmp, on, onSel }: { q: Question; row: MapRow; col: string; chains: Chain[]; cmp?: CellCmp; on: boolean; onSel: (s: { r: string; c: string } | null) => void }) {
  const spec = useSpec();
  const pair = cellPair(chains, q.n, row.key, col);
  const both = isWritten(pair.A) && isWritten(pair.B);
  const win = cmp && cmp.win;
  const only = verdictKind(spec) === 'only';
  const word = win ? VERDICT_WORDS[only ? 'only' : 'cmp'][win] : both ? 'Chưa so sánh' : '';
  const color = only ? (win === 'B' ? CL.greenText : win === '=' ? CL.yellowText : win ? CL.ink6 : '#B4483D') : (win === 'A' ? DRV.A.text : win === 'B' ? DRV.B.text : win ? CL.ink6 : '#B4483D');
  const sq = (k: 'A' | 'B') => {
    const c = pair[k];
    return <span style={{ width: 22, height: 22, boxSizing: 'border-box', borderRadius: 7, display: 'grid', placeItems: 'center', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, background: c ? DRV[k].solid : '#fff', color: c ? '#fff' : CL.ink4, border: c ? 'none' : '1.5px dashed ' + CL.ink2, opacity: c && !isWritten(c) ? 0.55 : 1 }}>{k}</span>;
  };
  return (
    <button type="button" className="cl-btn" onClick={() => onSel({ r: row.key, c: col })} aria-pressed={on} aria-label={row.label + ', ' + col + ': ' + (pair.A ? 'có mạch A' : 'chưa có mạch A') + ', ' + (pair.B ? 'có mạch B' : 'chưa có mạch B') + (word ? ', ' + word : '')}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minHeight: 58, padding: on ? '5.5px 5.5px 4.5px' : '6px 6px 5px', borderRadius: 11, border: on ? '1.5px solid ' + CL.ink : '1px solid ' + CL.ink2, background: '#fff', transition: 'border-color .15s' }}>
      <span style={{ display: 'flex', gap: 5 }}>{sq('A')}{sq('B')}</span>
      {word && <span style={{ fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, lineHeight: 1, letterSpacing: '0.02em', color }}>{word}</span>}
    </button>
  );
}
