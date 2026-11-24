'use client';

import { useRef, useState } from 'react';
import type { T1Prompt } from '@/content/task1';
import { CL } from '../chainlab/constants';
import { cellById, expandRow, groupLabel, groupType, hintsOf, judge, partById, partOfRow, POINT, RATIO, rowKey, TREND, uv, type Hint, type Row, type Verdict } from './engine';
import { familyOf, GLYPH, panelOf, TIP_HINT, tipsFor } from './tips';
import { Glyph } from './Chart';

export interface ChipView { key: string; dot: boolean; color: string; initial: string; label: string; dashed: boolean; tip: boolean; vals: { t: string; i: number }[]; idx: number[]; run?: { part: string; item: string } }

/** A run of numbers of one item shows as one chip (Women  2006 · 35%  2007 · 31%). */
export function chipsOf(pr: T1Prompt, row: Row, noNums = false): ChipView[] {
  const out: ChipView[] = [];
  row.forEach((e, i) => {
    if (e.k === 'val') {
      const c = cellById(pr, e.id), p = partById(pr, c.part), last = out[out.length - 1];
      const t = (c.col && p.axis.labels.length > 1 ? c.col + ' · ' : '') + uv(p, c.v);
      if (last && last.run && last.run.part === c.part && last.run.item === c.item && last.idx[last.idx.length - 1] === i - 1) { last.vals.push({ t, i }); last.idx.push(i); return; }
      out.push({ key: 'v' + i, dot: true, color: c.color, initial: c.initial, label: c.name, dashed: false, tip: false, vals: [{ t, i }], idx: [i], run: { part: c.part, item: c.item } });
    } else if (e.k === 'group') {
      const gl = groupLabel(pr, e.id);
      out.push({ key: 'g' + i, dot: true, color: CL.ink5, initial: groupType(e.id) === 'part' ? '∗' : gl.charAt(0), label: gl, dashed: true, tip: false, vals: [], idx: [i] });
    } else out.push({ key: 't' + i, dot: false, color: '', initial: '', label: e.id, dashed: false, tip: true, vals: [], idx: [i] });
  });
  return noNums ? out.map((c) => ({ ...c, vals: [] })) : out;
}

/** A finding shown small (findings list, paragraphs, the guided card). */
export function MiniChips({ prompt, row, noNums, white }: { prompt: T1Prompt; row: Row; noNums?: boolean; white?: boolean }) {
  return (
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
      {chipsOf(prompt, row, noNums).map((c) => (
        <span key={c.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, boxSizing: 'border-box', padding: c.dot ? '0 8px 0 4px' : '0 8px', borderRadius: 7, border: '1px ' + (c.dashed ? 'dashed ' + CL.ink4 : 'solid ' + (c.tip ? '#DCE7F7' : '#EBEBEB')), background: c.tip ? '#EEF3FC' : white ? '#fff' : c.dashed ? '#FAFAFA' : '#F5F5F5', color: c.tip ? '#2F62C4' : CL.ink, fontSize: 12, fontWeight: 500 }}>
          {c.dot && <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: 99, background: c.color, color: '#fff', fontSize: 9, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{c.initial}</span>}
          {c.label}
          {c.vals.map((v) => <span key={v.i} style={{ marginLeft: 2, padding: '0 6px', height: 20, display: 'inline-flex', alignItems: 'center', borderRadius: 5, background: CL.mintSoft, color: CL.greenText, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{v.t}</span>)}
        </span>
      ))}
    </span>
  );
}

const btn: React.CSSProperties = { height: 34, borderRadius: 10, fontSize: 13.5, fontWeight: 500, padding: '0 12px', cursor: 'pointer' };

/** ① So sánh: build a finding from the chart and the tips, check it, keep it. */
export function ComparePanel({ prompt, row, setRow, found, setFound, hint, setHint }: {
  prompt: T1Prompt; row: Row; setRow: (r: Row) => void; found: { row: Row }[]; setFound: (f: { row: Row }[]) => void; hint: Hint | null; setHint: (h: Hint | null) => void;
}) {
  const [msg, setMsg] = useState<Verdict | null>(null);
  const [varAt, setVarAt] = useState<number | null>(null);
  const [hintN, setHintN] = useState(0);
  const drag = useRef<{ idx: number[]; moved: boolean } | null>(null);
  const [dragView, setDragView] = useState<{ src: number; over: number } | null>(null);
  const single = prompt.parts.length === 1;
  const rowPart = partOfRow(row);
  const { avail, boxes } = panelOf(tipsFor(rowPart ? [partById(prompt, rowPart)] : prompt.parts, single));
  const hints = hintsOf(prompt);

  const put = (r: Row, v: number | null = null) => { setRow(r); setMsg(null); setVarAt(v); };
  const addTip = (t: string) => {
    if (t === 'Tất cả') { put([...row, { k: 'group', id: prompt.parts[0].id }]); return; }
    const r = [...row, { k: 'tip' as const, id: t }], fam = familyOf(t, avail);
    put(r, fam && fam.length > 1 ? r.length - 1 : null);
  };
  const moveChip = (from: number[], before: number | null) => {
    if (from.includes(before as number)) return;
    const moving = from.map((i) => row[i]), rest = row.filter((_, i) => !from.includes(i));
    let at = before === null ? rest.length : rest.indexOf(row[before]); if (at < 0) at = rest.length;
    put([...rest.slice(0, at), ...moving, ...rest.slice(at)]);
  };
  const check = () => {
    if (!row.length) return;
    if (found.some((f) => rowKey(f.row) === rowKey(row))) { setMsg({ ok: false, text: 'Ý này đã có trong danh sách rồi.' }); return; }
    const j = judge(prompt, row);
    setMsg(j);
    if (j.ok) { setFound([...found, { row }]); setRow([]); setHint(null); setVarAt(null); }
  };
  const canChain = (() => {
    if (!rowPart || !partById(prompt, rowPart).axis.ordered) return false;
    const last = row[row.length - 1];
    if (last.k === 'tip' && (last.id === 'rồi' || last.id === 'trừ')) return false;
    // A chain goes along one line's points: only after numbers and a movement (tăng, giảm, đạt đỉnh, vượt qua…).
    if (!row.some((e) => e.k === 'val')) return false;
    const moves = [...TREND, ...POINT, ...RATIO, 'vượt qua'];
    return expandRow(row).some((e) => e.k === 'tip' && moves.includes(e.id));
  })();
  const vFam = varAt !== null && row[varAt] && row[varAt].k === 'tip' ? familyOf(row[varAt].id, avail) : null;
  const chips = chipsOf(prompt, row);

  return (
    <aside style={{ minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <section style={{ borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 50, padding: '0 20px', borderBottom: '1px solid ' + CL.ink1 }}><span style={{ fontSize: 14.5, fontWeight: 600 }}>Tìm điểm nổi bật</span></div>
        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div onMouseUp={() => { if (drag.current?.moved) moveChip(drag.current.idx, null); drag.current = null; setDragView(null); }} onMouseLeave={() => { drag.current = null; setDragView(null); }}
            style={{ userSelect: 'none', minHeight: 52, boxSizing: 'border-box', borderRadius: 10, border: '1px solid ' + (msg && !msg.ok ? '#F5C7B8' : CL.ink2), boxShadow: 'inset 0 1px 2px rgba(0,0,0,.04)', padding: '9px 10px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {chips.map((c) => {
              const src = dragView && c.idx.includes(dragView.src), over = dragView && dragView.over === c.idx[0] && !src;
              const famC = c.tip ? familyOf(row[c.idx[0]].id) : null;
              return (
                <span key={c.key} title="Giữ và kéo để đổi chỗ"
                  onMouseDown={(e) => { if (e.button === 0) drag.current = { idx: c.idx, moved: false }; }}
                  onMouseEnter={() => { if (drag.current && !drag.current.idx.includes(c.idx[0])) { drag.current.moved = true; setDragView({ src: drag.current.idx[0], over: c.idx[0] }); } }}
                  onMouseUp={(e) => { if (drag.current?.moved && !drag.current.idx.includes(c.idx[0])) { e.stopPropagation(); moveChip(drag.current.idx, c.idx[0]); drag.current = null; setDragView(null); } }}
                  style={{ cursor: dragView ? 'grabbing' : 'grab', opacity: src ? 0.45 : 1, boxShadow: over ? 'inset 3px 0 0 #2F62C4' : 'none', display: 'inline-flex', alignItems: 'center', height: 32, boxSizing: 'border-box', padding: c.dot ? '0 3px 0 5px' : '0 3px 0 6px', borderRadius: 8, border: '1px ' + (c.dashed ? 'dashed ' + CL.ink4 : 'solid ' + (c.tip ? '#DCE7F7' : '#EBEBEB')), background: c.tip ? '#EEF3FC' : c.dashed ? '#FAFAFA' : '#F5F5F5', color: c.tip ? '#2F62C4' : CL.ink, fontSize: 13, fontWeight: 500 }}>
                  {c.dot && <span aria-hidden="true" style={{ width: 20, height: 20, marginRight: 3, borderRadius: 99, background: c.color, color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{c.initial}</span>}
                  {c.run ? (
                    <button type="button" className="t1-seg" title={'Nói chung cho cả ' + c.label + ' (bỏ các số)'} onClick={() => { const r = row.filter((_, i) => !c.idx.includes(i)); r.splice(c.idx[0], 0, { k: 'group', id: c.run!.part + '>item:' + c.run!.item }); put(r); }}
                      style={{ height: 24, padding: '0 5px', border: 'none', borderRadius: 6, background: 'none', fontSize: 13, fontWeight: 500, color: 'inherit', cursor: 'pointer' }}>{c.label}</button>
                  ) : <span style={{ padding: '0 5px' }}>{c.label}</span>}
                  {famC && famC.length > 1 && (
                    <button type="button" className="t1-seg" aria-label="Đổi sang cách nói khác" title="Đổi sang cách nói khác" onClick={() => setVarAt(varAt === c.idx[0] ? null : c.idx[0])} style={{ width: 22, height: 24, display: 'grid', placeItems: 'center', border: 'none', borderRadius: 6, background: 'none', color: '#2F62C4', cursor: 'pointer', padding: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                    </button>
                  )}
                  {c.vals.map((v) => <button key={v.i} type="button" className="t1-val" title="Bỏ số này" onClick={() => put(row.filter((_, i) => i !== v.i))} style={{ height: 24, marginLeft: 3, padding: '0 7px', border: 'none', borderRadius: 6, background: CL.mintSoft, color: CL.greenText, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{v.t}</button>)}
                  <button type="button" className="t1-seg" aria-label={'Bỏ ' + c.label} title="Bỏ chip này" onClick={() => put(row.filter((_, i) => !c.idx.includes(i)))} style={{ width: 24, height: 24, marginLeft: 2, display: 'grid', placeItems: 'center', border: 'none', borderRadius: 6, background: 'none', color: CL.ink5, cursor: 'pointer', padding: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                  </button>
                </span>
              );
            })}
            {!row.length && <span style={{ fontSize: 13, color: CL.ink4, padding: '0 4px' }}>Bấm một điểm, tên một đường hoặc một năm trên biểu đồ, rồi chọn một ý so sánh.</span>}
            {canChain && (
              <button type="button" className="cl-btn" title="Kể tiếp chặng sau của cùng đường này" onClick={() => put([...row, { k: 'tip', id: 'rồi' }])} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, borderRadius: 8, border: '1px dashed #77A1DD', background: '#F7F9FD', color: '#2F62C4', fontSize: 13, fontWeight: 600, padding: '0 11px', cursor: 'pointer' }}>
                rồi<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            )}
          </div>

          {vFam && vFam.length > 1 && (
            <div style={{ marginTop: -4, borderRadius: 10, border: '1px solid #77A1DD', background: '#fff', boxShadow: '0 4px 14px -8px rgba(47,98,196,.45)', padding: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {vFam.map((t) => { const on = row[varAt!].id === t; return (
                <button key={t} type="button" className="cl-btn" title={TIP_HINT[t] || ''} onClick={() => { const r = row.slice(); r[varAt!] = { k: 'tip', id: t }; setRow(r); setMsg(null); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, borderRadius: 8, border: '1px solid ' + (on ? '#2F62C4' : '#DCE7F7'), background: on ? '#2F62C4' : '#fff', color: on ? '#fff' : '#1F4FA8', fontSize: 13, fontWeight: 500, padding: '0 10px 0 7px', cursor: 'pointer' }}>
                  <Glyph shapes={GLYPH[t] || []} />{t}
                </button>
              ); })}
              <button type="button" className="cl-btn" aria-label="Đóng" onClick={() => setVarAt(null)} style={{ marginLeft: 'auto', width: 26, height: 26, border: 'none', borderRadius: 6, background: 'none', color: CL.ink5, cursor: 'pointer' }}>×</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {boxes.map((b, k) => (
              <div key={k} style={{ borderRadius: 10, border: '1px solid #DCE7F7', background: '#F7F9FD', padding: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {b.map((t) => { const fam = familyOf(t, avail); return (
                  <button key={t} type="button" className="cl-btn" title={TIP_HINT[t] || ''} onClick={() => addTip(t)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, borderRadius: 8, border: '1px solid #DCE7F7', background: '#fff', color: '#1F4FA8', fontSize: 13, fontWeight: 500, padding: '0 10px 0 7px', cursor: 'pointer' }}>
                    <Glyph shapes={GLYPH[t] || []} />{t + (fam && fam.length > 1 ? ' ▾' : '')}
                  </button>
                ); })}
              </div>
            ))}
          </div>

          {msg && msg.text && <span role="status" style={{ fontSize: 13, lineHeight: 1.5, color: msg.ok ? CL.greenText : CL.redText }}>{msg.text}</span>}
          {msg && msg.note && <span style={{ fontSize: 12.5, lineHeight: 1.5, color: msg.note.warn ? '#8A5A00' : CL.ink5 }}>{msg.note.text}</span>}
          {hint && <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={{ fontSize: 13, lineHeight: 1.5, color: '#8A5A00' }}>Gợi ý: {hint.text}.</span><span style={{ fontSize: 12.5, lineHeight: 1.5, color: CL.ink5 }}>Lần sau: {hint.next}.</span></span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="cl-btn" onClick={() => put([])} style={{ ...btn, border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: CL.ink }}>Xoá</button>
            <span className="pro-fill"><button type="button" className="cl-btn" onClick={() => { if (!hints.length) return; setHint(hints[hintN % hints.length]); setHintN(hintN + 1); setMsg(null); }} style={{ ...btn, border: 'none', color: '#fff' }}>Gợi ý</button></span>
            <button type="button" className="cl-btn cl-primary" onClick={check} disabled={!row.length} style={{ ...btn, marginLeft: 'auto', border: 'none', color: '#fff', padding: '0 14px', opacity: row.length ? 1 : 0.4 }}>Kiểm tra</button>
          </div>
        </div>
      </section>

      <section style={{ borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: CL.ink5, paddingBottom: 4 }}>Điểm nổi bật đã tìm · {found.length}</span>
        {found.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 0', borderTop: '1px solid ' + CL.ink1 }}>
            <span aria-hidden="true" style={{ width: 18, height: 18, flexShrink: 0, borderRadius: 99, background: CL.mintSoft, color: CL.greenText, fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center' }}>✓</span>
            <MiniChips prompt={prompt} row={f.row} />
            <button type="button" className="cl-btn" title="Bỏ ý này" aria-label="Bỏ ý này" onClick={() => setFound(found.filter((_, k) => k !== i))} style={{ marginLeft: 'auto', width: 24, height: 24, border: 'none', background: 'none', color: CL.ink4, cursor: 'pointer' }}>×</button>
          </div>
        ))}
        {!found.length && <span style={{ fontSize: 12.5, color: CL.ink4 }}>Mỗi so sánh đúng với số liệu sẽ nằm ở đây.</span>}
      </section>
    </aside>
  );
}

