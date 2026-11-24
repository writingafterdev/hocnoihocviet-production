'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { T1Prompt } from '@/content/task1';
import { CL } from '../chainlab/constants';
import { cellById, expandRow, groupLabel, groupType, hintsOf, judge, partById, partOfRow, POINT, RATIO, rowKey, TREND, uv, type Entry, type Hint, type Row, type Verdict } from './engine';
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

/** Gợi ý starts with a question; the second press shows the answer. */
function askOf(h: Hint): string {
  const t = h.feat.tip;
  if (h.feat.all) return 'Nhìn cả biểu đồ: có điều gì đúng với tất cả các mục không?';
  if (h.cross) return 'Có hai đường nào cắt nhau không? Đường nào vượt lên?';
  if (h.opp) return 'Có hai đường nào cứ đường này lên thì đường kia xuống không?';
  if (h.colPair) return 'Đặt hai cột cạnh nhau: cột nào luôn cao hơn?';
  if (t === 'tăng' || t === 'giảm') return 'Phần lớn các mục đi cùng một hướng. Có mục nào đi ngược lại không?';
  if (t === 'cao hơn') return 'Đặt hai mục cạnh nhau ở mọi mốc: bên nào cao hơn? Có chỗ nào ngoại lệ không?';
  if (t === 'đạt đỉnh') return 'Đường nào thay đổi nhiều nhất? Điểm cao nhất của nó nằm ở đâu?';
  if (t === 'tăng nhiều nhất') return 'Ngoài số lớn nhất, cái gì tăng nhanh nhất?';
  if (t === 'phần lớn' || t === 'gần một nửa') return 'Phần nào lớn nhất, và nó chiếm khoảng bao nhiêu?';
  if ((t === 'cao nhất' || t === 'thấp nhất') && h.text.includes(' ở mọi ')) return 'Có mục nào lúc nào cũng đứng ' + (t === 'cao nhất' ? 'đầu' : 'cuối') + ' không?';
  if (t === 'cao nhất' || t === 'thấp nhất') return 'Trong cột số này, số nào cao nhất, số nào thấp nhất?';
  return 'Điều gì nổi bật nhất trên biểu đồ?';
}

/** A tip's other ways of saying it, as a menu under its button (like a model picker): one row each, a radio dot on the current one.
 *  It grows in from its button and fades out when closed; pressing the button again closes it. */
function TipMenu({ at, anchor, open, tips, current, onPick, onClose, onGone }: { at: DOMRect; anchor: HTMLElement; open: boolean; tips: string[]; current?: string; onPick: (t: string) => void; onClose: () => void; onGone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const W = 230, left = Math.min(at.left, window.innerWidth - W - 12), below = at.bottom + 6 + tips.length * 38 + 12 < window.innerHeight;
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { const t = e.target as Node; if (ref.current?.contains(t) || anchor.contains(t)) return; onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const scroll = (e: Event) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    document.addEventListener('pointerdown', down, true); document.addEventListener('keydown', key); window.addEventListener('scroll', scroll, true);
    return () => { document.removeEventListener('pointerdown', down, true); document.removeEventListener('keydown', key); window.removeEventListener('scroll', scroll, true); };
  }, [open, anchor, onClose]);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const shut = { opacity: 0, transform: `translateY(${below ? -6 : 6}px) scale(.96)` }, shown = { opacity: 1, transform: 'none' };
    if (open) el.animate([shut, shown], { duration: 170, easing: 'cubic-bezier(.2,.9,.25,1)' });
    else { const a = el.animate([shown, shut], { duration: 120, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }); a.onfinish = onGone; return () => { a.onfinish = null; }; }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={ref} role="menu" style={{ position: 'fixed', left, ...(below ? { top: at.bottom + 6 } : { bottom: window.innerHeight - at.top + 6 }), transformOrigin: below ? 'top left' : 'bottom left', pointerEvents: open ? 'auto' : 'none', zIndex: 50, width: W, padding: 6, borderRadius: 12, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,.08), 0 12px 32px -12px rgba(0,0,0,.28)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {tips.map((t) => { const on = t === current; return (
        <button key={t} type="button" role="menuitemradio" aria-checked={on} className="t1-row" title={TIP_HINT[t] || ''} onClick={() => onPick(t)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, height: 36, padding: '0 10px 0 8px', border: 'none', borderRadius: 8, background: on ? '#EEF3FC' : 'none', fontSize: 13.5, fontWeight: 500, color: on ? '#1F4FA8' : CL.ink, cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap' }}>
          <Glyph shapes={GLYPH[t] || []} />
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</span>
          {current !== undefined && <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: 99, boxSizing: 'border-box', border: on ? '5px solid #2F62C4' : '1.5px solid ' + CL.ink3, background: '#fff', flexShrink: 0 }} />}
        </button>
      ); })}
    </div>
  );
}

const Chevron = ({ up }: { up?: boolean }) => <svg style={{ transition: 'transform .18s cubic-bezier(.2,.8,.2,1)', transform: up ? 'rotate(180deg)' : 'none' }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>;
/** Stable keys for chips, so they can slide to their new place while one is dragged. */
const ENTRY_KEY = new WeakMap<object, number>(); let entrySeq = 0;
const keyOf = (e: Entry) => { let k = ENTRY_KEY.get(e); if (k === undefined) { k = ++entrySeq; ENTRY_KEY.set(e, k); } return 'e' + k; };
const chipBox = (c: ChipView): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', height: 32, boxSizing: 'border-box', padding: c.dot ? '0 3px 0 5px' : '0 3px 0 6px', borderRadius: 8, border: '1px ' + (c.dashed ? 'dashed ' + CL.ink4 : 'solid ' + (c.tip ? '#DCE7F7' : '#EBEBEB')), background: c.tip ? '#EEF3FC' : c.dashed ? '#FAFAFA' : '#F5F5F5', color: c.tip ? '#2F62C4' : CL.ink, fontSize: 13, fontWeight: 500 });
const Dot = ({ c }: { c: ChipView }) => <span aria-hidden="true" style={{ width: 20, height: 20, marginRight: 3, borderRadius: 99, background: c.color, color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{c.initial}</span>;

const btn: React.CSSProperties = { height: 34, borderRadius: 10, fontSize: 13.5, fontWeight: 500, padding: '0 12px', cursor: 'pointer' };

/** ① So sánh: build a finding from the chart and the tips, check it, keep it. */
export function ComparePanel({ prompt, row, setRow, found, setFound, hint, setHint }: {
  prompt: T1Prompt; row: Row; setRow: (r: Row) => void; found: { row: Row }[]; setFound: (f: { row: Row }[]) => void; hint: Hint | null; setHint: (h: Hint | null) => void;
}) {
  const [msg, setMsg] = useState<Verdict | null>(null);
  const [menu, setMenu] = useState<{ id: number; at: DOMRect; el: HTMLElement; tips: string[]; slot: number | null; open: boolean } | null>(null);
  const closeMenu = useCallback(() => setMenu((m) => (m && m.open ? { ...m, open: false } : m)), []);
  const [hintN, setHintN] = useState(0);
  const [ask, setAsk] = useState<Hint | null>(null);
  // Dragging a chip: it follows the cursor, and the others make room for it as it moves.
  const boxRef = useRef<HTMLDivElement>(null);
  const press = useRef<{ ents: Entry[]; sx: number; sy: number; offX: number; offY: number; on: boolean } | null>(null);
  const [dv, setDv] = useState<{ ents: Entry[]; at: number; x: number; y: number; offX: number; offY: number } | null>(null);
  const dvRef = useRef<typeof dv>(null);
  const justDragged = useRef(false);
  const rowRef = useRef(row); rowRef.current = row;
  const single = prompt.parts.length === 1;
  const rowPart = partOfRow(row);
  const { avail, boxes } = panelOf(tipsFor(rowPart ? [partById(prompt, rowPart)] : prompt.parts, single));
  const hints = hintsOf(prompt);

  const put = (r: Row) => { setRow(r); setMsg(null); closeMenu(); };
  const addTip = (t: string) => {
    if (t === 'Tất cả') { put([...row, { k: 'group', id: prompt.parts[0].id }]); return; }
    put([...row, { k: 'tip' as const, id: t }]);
  };
  const restOf = (ents: Entry[]) => rowRef.current.filter((e) => !ents.includes(e));
  const previewOf = (d: { ents: Entry[]; at: number }) => { const rest = restOf(d.ents); return [...rest.slice(0, d.at), ...d.ents, ...rest.slice(d.at)]; };
  /** Where the dragged chip would go: before the first chip the cursor is above, or left of the middle of. */
  const slotAt = (x: number, y: number, ents: Entry[]) => {
    const box = boxRef.current; if (!box) return 0;
    const br = box.getBoundingClientRect(), rest = restOf(ents);
    for (const el of Array.from(box.querySelectorAll<HTMLElement>('[data-rest]'))) {
      const l = br.left + el.offsetLeft, t = br.top + el.offsetTop, b = t + el.offsetHeight;
      if (y < t || (y <= b && x < l + el.offsetWidth / 2)) return Number(el.dataset.rest);
    }
    return rest.length;
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = press.current; if (!d) return;
      if (!d.on) { if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return; d.on = true; setMenu(null); document.body.style.cursor = 'grabbing'; }
      e.preventDefault();
      const v = { ents: d.ents, at: slotAt(e.clientX, e.clientY, d.ents), x: e.clientX, y: e.clientY, offX: d.offX, offY: d.offY };
      dvRef.current = v; setDv(v);
    };
    const up = () => {
      const d = press.current; press.current = null; if (!d || !d.on) return;
      document.body.style.cursor = '';
      justDragged.current = true; setTimeout(() => { justDragged.current = false; }, 0);
      const v = dvRef.current; dvRef.current = null; setDv(null);
      if (v) { setRow(previewOf(v)); setMsg(null); }
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // The other chips slide to their new place instead of jumping.
  const lastPos = useRef(new Map<string, { x: number; y: number }>());
  useLayoutEffect(() => {
    const box = boxRef.current; if (!box) return;
    const next = new Map<string, { x: number; y: number }>();
    box.querySelectorAll<HTMLElement>('[data-key]').forEach((el) => {
      const k = el.dataset.key!, p = { x: el.offsetLeft, y: el.offsetTop }, was = lastPos.current.get(k); next.set(k, p);
      if (dv && was && (was.x !== p.x || was.y !== p.y)) el.animate([{ transform: `translate(${was.x - p.x}px, ${was.y - p.y}px)` }, { transform: 'none' }], { duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
    lastPos.current = next;
  });
  const check = () => {
    if (!row.length) return;
    if (found.some((f) => rowKey(f.row) === rowKey(row))) { setMsg({ ok: false, text: 'Ý này đã có trong danh sách rồi.' }); return; }
    const j = judge(prompt, row);
    setMsg(j);
    if (j.ok) { setFound([...found, { row }]); setRow([]); setHint(null); setAsk(null); closeMenu(); }
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
  const shown = dv ? previewOf(dv) : row, restNow = dv ? restOf(dv.ents) : row;
  const chips = chipsOf(prompt, shown);
  const openMenu = (e: React.MouseEvent, tips: string[], slot: number | null) => { const el = e.currentTarget as HTMLElement; if (menu && menu.open && menu.el === el) { closeMenu(); return; } setMenu({ id: performance.now(), at: el.getBoundingClientRect(), el, tips, slot, open: true }); };
  const menuOn = (slot: number | null, base?: string) => !!menu && menu.open && menu.slot === slot && (base === undefined || menu.tips[0] === base);

  return (
    <aside style={{ minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <section style={{ borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 50, padding: '0 20px', borderBottom: '1px solid ' + CL.ink1 }}><span style={{ fontSize: 14.5, fontWeight: 600 }}>Tìm điểm nổi bật</span></div>
        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div ref={boxRef} onClickCapture={(e) => { if (justDragged.current) { e.stopPropagation(); e.preventDefault(); } }}
            style={{ position: 'relative', userSelect: 'none', minHeight: 52, boxSizing: 'border-box', borderRadius: 10, border: '1px solid ' + (msg && !msg.ok ? '#F5C7B8' : CL.ink2), boxShadow: 'inset 0 1px 2px rgba(0,0,0,.04)', padding: '9px 10px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {chips.map((c) => {
              const first = shown[c.idx[0]], moving = !!dv && c.idx.some((i) => dv.ents.includes(shown[i]));
              const famC = c.tip ? familyOf(first.id, avail) : null;
              return (
                <span key={keyOf(first)} data-key={keyOf(first)} data-rest={moving ? undefined : restNow.indexOf(first)} title="Giữ và kéo để đổi chỗ"
                  onPointerDown={(e) => { if (e.button !== 0 || dv) return; const r = e.currentTarget.getBoundingClientRect(); press.current = { ents: c.idx.map((i) => row[i]), sx: e.clientX, sy: e.clientY, offX: e.clientX - r.left, offY: e.clientY - r.top, on: false }; }}
                  style={{ ...chipBox(c), cursor: dv ? 'grabbing' : 'grab', touchAction: 'none', opacity: moving ? 0.3 : 1, ...(moving ? { background: '#fff', borderStyle: 'dashed', borderColor: '#77A1DD' } : {}) }}>
                  {c.dot && <Dot c={c} />}
                  {c.run ? (
                    <button type="button" className="t1-seg" title={'Nói chung cho cả ' + c.label + ' (bỏ các số)'} onClick={() => { const r = row.filter((_, i) => !c.idx.includes(i)); r.splice(c.idx[0], 0, { k: 'group', id: c.run!.part + '>item:' + c.run!.item }); put(r); }}
                      style={{ height: 24, padding: '0 5px', border: 'none', borderRadius: 6, background: 'none', fontSize: 13, fontWeight: 500, color: 'inherit', cursor: 'pointer' }}>{c.label}</button>
                  ) : <span style={{ padding: '0 5px' }}>{c.label}</span>}
                  {famC && famC.length > 1 && (
                    <button type="button" className="t1-seg" aria-label="Đổi sang cách nói khác" title="Đổi sang cách nói khác" onClick={(e) => openMenu(e, famC, c.idx[0])} style={{ width: 22, height: 24, display: 'grid', placeItems: 'center', border: 'none', borderRadius: 6, background: menuOn(c.idx[0]) ? '#DCE7F7' : 'none', color: '#2F62C4', cursor: 'pointer', padding: 0 }}>
                      <Chevron up={menuOn(c.idx[0])} />
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
            {canChain && !dv && (
              <button type="button" className="cl-btn" title="Kể tiếp chặng sau của cùng đường này" onClick={() => put([...row, { k: 'tip', id: 'rồi' }])} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, borderRadius: 8, border: '1px dashed #77A1DD', background: '#F7F9FD', color: '#2F62C4', fontSize: 13, fontWeight: 600, padding: '0 11px', cursor: 'pointer' }}>
                rồi<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            )}
          </div>
          {dv && (
            <div aria-hidden="true" style={{ position: 'fixed', left: dv.x - dv.offX, top: dv.y - dv.offY, zIndex: 60, pointerEvents: 'none', display: 'flex', gap: 6, cursor: 'grabbing' }}>
              {chipsOf(prompt, dv.ents).map((c) => (
                <span key={c.key} style={{ ...chipBox(c), padding: c.dot ? '0 10px 0 5px' : '0 10px', background: c.tip ? '#EEF3FC' : '#fff', boxShadow: '0 10px 24px -8px rgba(0,0,0,.3), 0 0 0 1px rgba(0,0,0,.04)', transform: 'rotate(-1.5deg)' }}>
                  {c.dot && <Dot c={c} />}<span style={{ padding: '0 4px' }}>{c.label}</span>
                  {c.vals.map((v) => <span key={v.i} style={{ height: 24, marginLeft: 3, padding: '0 7px', display: 'inline-flex', alignItems: 'center', borderRadius: 6, background: CL.mintSoft, color: CL.greenText, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{v.t}</span>)}
                </span>
              ))}
            </div>
          )}
          {menu && <TipMenu key={menu.id} at={menu.at} anchor={menu.el} open={menu.open} tips={menu.tips} current={menu.slot === null ? undefined : row[menu.slot]?.id}
            onClose={closeMenu} onGone={() => setMenu((m) => (m && !m.open ? null : m))}
            onPick={(t) => { if (menu.slot === null) addTip(t); else { const r = row.slice(); r[menu.slot] = { k: 'tip', id: t }; put(r); } }} />}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {boxes.map((b, k) => (
              <div key={k} style={{ borderRadius: 10, border: '1px solid #DCE7F7', background: '#F7F9FD', padding: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {b.map((t) => { const fam = familyOf(t, avail); return (
                  <button key={t} type="button" className="cl-btn" title={TIP_HINT[t] || ''} onClick={(e) => (fam && fam.length > 1 ? openMenu(e, fam, null) : addTip(t))} aria-haspopup={fam && fam.length > 1 ? 'menu' : undefined}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, borderRadius: 8, border: '1px solid ' + (menuOn(null, t) ? '#77A1DD' : '#DCE7F7'), background: menuOn(null, t) ? '#EEF3FC' : '#fff', color: '#1F4FA8', fontSize: 13, fontWeight: 500, padding: fam && fam.length > 1 ? '0 8px 0 7px' : '0 10px 0 7px', cursor: 'pointer' }}>
                    <Glyph shapes={GLYPH[t] || []} />{t}{fam && fam.length > 1 && <Chevron up={menuOn(null, t)} />}
                  </button>
                ); })}
              </div>
            ))}
          </div>

          {msg && msg.text && <span role="status" style={{ fontSize: 13, lineHeight: 1.5, color: msg.ok ? CL.greenText : CL.redText }}>{msg.text}</span>}
          {msg && msg.note && <span style={{ fontSize: 12.5, lineHeight: 1.5, color: msg.note.warn ? '#8A5A00' : CL.ink5 }}>{msg.note.text}</span>}
          {ask && !hint && <span style={{ fontSize: 13, lineHeight: 1.5, color: '#8A5A00' }}>{askOf(ask)}</span>}
          {hint && <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={{ fontSize: 13, lineHeight: 1.5, color: '#8A5A00' }}>Gợi ý: {hint.text}.</span><span style={{ fontSize: 12.5, lineHeight: 1.5, color: CL.ink5 }}>Lần sau: {hint.next}.</span></span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="cl-btn" onClick={() => put([])} style={{ ...btn, border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: CL.ink }}>Xoá</button>
            <span className="pro-fill"><button type="button" className="cl-btn" onClick={() => {
              if (!hints.length) return; setMsg(null);
              if (ask && !hint) { setHint(ask); return; }
              setHint(null); setAsk(hints[hintN % hints.length]); setHintN(hintN + 1);
            }} style={{ ...btn, border: 'none', color: '#fff' }}>{ask && !hint ? 'Xem gợi ý' : 'Gợi ý'}</button></span>
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

