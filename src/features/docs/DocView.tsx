'use client';

import Link from 'next/link';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { DocBlock, DocCell, DocLine, DocMacro, DocPart, DocPrompt, DocTable } from '@/content/missbacxiu';
import { HistoryHeader } from '@/features/attempts/HistoryUI';


export interface TocMacro { id: DocMacro['id']; name: string; parts: { id: string; title: string }[] }

const EASE = 'cubic-bezier(.22,1,.36,1)';
/** Prompts this student has done in Nghĩ ý: ✓ beside their button. */
const DoneCtx = createContext<Set<string>>(new Set());
const MACRO_TINT: Record<DocMacro['id'], { bg: string; fg: string }> = {
  A: { bg: '#FFF0EB', fg: '#B33A1A' },
  B: { bg: '#EEF3FC', fg: '#2F62C4' },
  C: { bg: '#EDF7EA', fg: '#2D6E1E' },
};

const Letter = ({ id }: { id: DocMacro['id'] }) => (
  <span style={{ borderRadius: 4, padding: '2px 6px', background: MACRO_TINT[id].bg, color: MACRO_TINT[id].fg, fontSize: 11.5, fontWeight: 700 }}>{id}</span>
);

/**
 * The Tài liệu page: her doc, one part at a time. Text lines and tables are drawn straight from the data (merged cells
 * kept); a cell of prompts becomes a slideshow so a long list doesn't stretch its row.
 */
export function DocView({ macro, part, intro, toc, next }: { macro: Pick<DocMacro, 'id' | 'name' | 'title'>; part: DocPart; intro: DocBlock[]; toc: TocMacro[]; next: { id: string; title: string } | null }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    fetch('/api/drill/done', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null)).then((d: { ids?: string[] } | null) => { if (d?.ids) setDone(new Set(d.ids)); }).catch(() => {});
  }, []);
  return (
    <DoneCtx.Provider value={done}>
    <main style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 32px 64px', fontFamily: 'var(--font-sans)', color: '#171717' }}>
      <HistoryHeader img="woman-with-paper-document-thinking" tint="#FFF6DE" title="Tài liệu missbacxiu" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Letter id={macro.id} /><span style={{ fontSize: 13, fontWeight: 600, color: '#737373' }}>{macro.title}</span></span>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>{part.title}</h2>
            {part.note && <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: '#404040' }}>{part.note}</p>}
          </div>
          <Contents toc={toc} current={part.id} />
        </div>
        {intro.length > 0 && <Blocks blocks={intro} />}
        <Blocks blocks={part.blocks} />
        {next && (
          <Link href={'/tai-lieu?p=' + next.id} style={{ alignSelf: 'flex-end', marginTop: 8, height: 40, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 16px', borderRadius: 10, border: '1px solid #E5E5E5', color: '#171717', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
            {next.title}
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4l4 4-4 4" fill="none" stroke="#404040" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        )}
      </div>
    </main>
    </DoneCtx.Provider>
  );
}

/** "Mục lục": a button that opens the list of macros and their parts. */
function Contents({ toc, current }: { toc: TocMacro[]; current: string }) {
  const [open, setOpen] = useState(false);
  // On a phone the button wraps to the left edge; then the menu opens rightwards so it stays on screen.
  const [fromLeft, setFromLeft] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toggle = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setFromLeft(r.right < 320);
    setOpen((o) => !o);
  };
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button type="button" onClick={toggle} aria-expanded={open} style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 12px', borderRadius: 8, border: '1px solid #E5E5E5', background: '#fff', color: '#171717', fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4h10M3 8h10M3 12h6" fill="none" stroke="#404040" strokeWidth="1.6" strokeLinecap="round" /></svg>
        Mục lục
      </button>
      <div style={{ position: 'absolute', ...(fromLeft ? { left: 0 } : { right: 0 }), top: 44, zIndex: 20, width: 'min(300px, calc(100vw - 32px))', maxHeight: 'min(620px, 70vh)', overflow: 'auto', padding: '14px 8px', boxSizing: 'border-box', borderRadius: 12, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 16, opacity: open ? 1 : 0, transform: open ? 'none' : 'translateY(-4px)', pointerEvents: open ? 'auto' : 'none', visibility: open ? 'visible' : 'hidden', transition: `opacity .18s ease, transform .22s ${EASE}, visibility .22s` }}>
        {toc.map((m) => (
          <nav key={m.id} aria-label={m.name} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px 6px' }}><Letter id={m.id} /><span style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</span></span>
            {m.parts.map((pt) => {
              const on = pt.id === current;
              return (
                <Link key={pt.id} href={'/tai-lieu?p=' + pt.id} onClick={() => setOpen(false)} aria-current={on ? 'page' : undefined} style={{ padding: '6px 8px 6px 34px', borderRadius: 8, textDecoration: 'none', fontSize: 13.5, lineHeight: 1.4, color: on ? '#171717' : '#404040', background: on ? '#F2F2F2' : 'transparent', fontWeight: on ? 600 : 400 }}>{pt.title}</Link>
              );
            })}
          </nav>
        ))}
      </div>
    </div>
  );
}

// ---- text ----------------------------------------------------------------------------------------------------------

/** A line's text, a link when the doc had one. */
function LineText({ l, labelBold }: { l: DocLine; labelBold?: boolean }) {
  let body: ReactNode = l.t;
  // In vocab cells "Nghèo đói: live in poverty ~ deprivation": the Vietnamese label leads in bold.
  const m = labelBold ? /^([^:]{2,48}):\s+(.+)$/.exec(l.t) : null;
  if (m) body = <><strong style={{ fontWeight: 600 }}>{m[1]}:</strong> {m[2]}</>;
  if (l.href) body = <a href={l.href} target="_blank" rel="noopener noreferrer" style={{ color: '#2F62C4', overflowWrap: 'anywhere' }}>{body}</a>;
  if (l.key) body = <>{body} <span style={{ display: 'inline-block', verticalAlign: '1px', borderRadius: 4, padding: '1px 7px', background: '#FFF6DE', color: '#8A5A00', fontSize: 12, fontWeight: 600, lineHeight: 1.6 }}>Quan trọng</span></>;
  return <>{body}</>;
}

function Line({ l, size, labelBold }: { l: DocLine; size: number; labelBold?: boolean }) {
  if (l.h) return <p style={{ margin: '4px 0 0', fontSize: size + 0.5, fontWeight: 600, lineHeight: 1.45 }}><LineText l={l} /></p>;
  if (l.li !== undefined) {
    return (
      <span style={{ display: 'flex', gap: 10, paddingLeft: l.li * 16, fontSize: size, lineHeight: 1.6 }}>
        <span aria-hidden style={{ width: 4, height: 4, marginTop: size * 0.8 - 2, borderRadius: 99, background: l.li ? '#A3A3A3' : '#171717', flexShrink: 0 }} />
        <span style={{ minWidth: 0 }}><LineText l={l} labelBold={labelBold} /></span>
      </span>
    );
  }
  return <p style={{ margin: 0, fontSize: size, lineHeight: 1.6 }}><LineText l={l} labelBold={labelBold} /></p>;
}

function Blocks({ blocks }: { blocks: DocBlock[] }) {
  // Runs of text lines read as one prose block; tables stand on their own.
  const groups: (DocLine[] | DocTable)[] = [];
  for (const b of blocks) {
    if (b.kind === 'table') groups.push(b);
    else {
      const last = groups[groups.length - 1];
      if (Array.isArray(last)) last.push(b);
      else groups.push([b]);
    }
  }
  return (
    <>
      {groups.map((g, i) => Array.isArray(g)
        ? <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, color: '#262626' }}>{g.map((l, j) => <Line key={j} l={l} size={15} />)}</div>
        : <Table key={g.id} t={g} />)}
    </>
  );
}

// ---- tables --------------------------------------------------------------------------------------------------------

const isPromptCol = (h: string) => /^Đề (áp dụng|luyện)/.test(h);
const isVocabCol = (h: string) => /^Từ vựng/.test(h);

const th: CSSProperties = { textAlign: 'left', padding: '10px 16px', fontSize: 12.5, fontWeight: 600, color: '#737373', borderBottom: '1px solid #EBEBEB', background: '#FAFAFA', verticalAlign: 'bottom' };
const td: CSSProperties = { padding: '14px 16px', borderTop: '1px solid #EBEBEB', verticalAlign: 'top' };

/**
 * A row with prompts is as tall as its slideshow: the other cells are cut to that height and open with "Xem thêm"
 * (the whole row opens, "Thu gọn" closes it). A merged cell is cut to the rows it covers.
 */
function Table({ t }: { t: DocTable }) {
  const n = t.head.length;
  // The first column names the idea; a prompt column needs room for one prompt at a time.
  const wide = n >= 6;
  const widths = t.head.map((h, i) => (i === 0 ? (wide ? 180 : 210) : isPromptCol(h) ? (wide ? 320 : 380) : null));
  /** Each prompt row's slideshow height, and the rows opened with "Xem thêm". */
  const [hs, setHs] = useState<Record<number, number>>({});
  const [open, setOpen] = useState<Set<number>>(new Set());
  const measure = useCallback((ri: number, h: number) => setHs((m) => (m[ri] === h ? m : { ...m, [ri]: h })), []);
  const toggle = (from: number, rs: number) => setOpen((o) => {
    const next = new Set(o);
    const on = !o.has(from);
    for (let r = from; r < from + rs; r++) { if (on) next.add(r); else next.delete(r); }
    return next;
  });
  /** The height a cell starting at row `ri` and covering `rs` rows may take while closed (null: no limit). */
  const limitOf = (ri: number, rs: number) => {
    let h = 0;
    for (let r = ri; r < ri + rs; r++) {
      if (hs[r] === undefined) return null;
      h += hs[r] + (r > ri ? 29 : 0); // the rows between: their padding and border
    }
    return h;
  };
  return (
    <div style={{ borderRadius: 12, boxShadow: '0 0 0 1px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: Math.max(720, n * 170), borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 13.5, lineHeight: 1.6 }}>
        <colgroup>{widths.map((w, i) => <col key={i} style={w ? { width: w } : undefined} />)}</colgroup>
        <thead><tr>{t.head.map((h, i) => <th key={i} scope="col" style={{ ...th, borderLeft: i ? '1px solid #EBEBEB' : undefined }}>{h}</th>)}</tr></thead>
        <tbody>
          {t.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((c, ci) => {
                if (c.span) return null;
                const bg = ci === 0 ? '#FCFCFC' : '#fff';
                const style: CSSProperties = { ...td, borderLeft: ci ? '1px solid #EBEBEB' : undefined, background: ci === 0 ? bg : undefined };
                const rs = c.rs ?? 1;
                return (
                  <td key={ci} rowSpan={c.rs} colSpan={c.cs} style={c.prompts ? { ...style, height: 1 } : style}>
                    <Cell c={c} head={t.head[ci] ?? ''} first={ci === 0} bg={bg} open={open.has(ri)} onToggle={() => toggle(ri, rs)} limit={c.prompts ? null : limitOf(ri, rs)} onMeasure={c.prompts ? (h) => measure(ri, h) : undefined} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const moreBtn: CSSProperties = { marginTop: 8, height: 22, padding: 0, border: 'none', background: 'none', color: '#2F62C4', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' };
const MORE_H = 30;

/** Content cut to `limit` px (leaving room for its button) with a fade, opened and closed by the row's toggle. */
function Clamp({ limit, open, onToggle, bg, children }: { limit: number | null; open: boolean; onToggle: () => void; bg: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setFull(el.offsetHeight);
    const ro = new ResizeObserver(() => setFull(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const over = limit !== null && full > limit + 2;
  const cut = over ? Math.max(48, limit - MORE_H) : undefined;
  return (
    <>
      <div style={{ position: 'relative', overflow: 'hidden', maxHeight: over ? (open ? full : cut) : undefined, transition: `max-height .34s ${EASE}` }}>
        <div ref={ref}>{children}</div>
        {over && <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 40, background: `linear-gradient(rgba(255,255,255,0), ${bg})`, opacity: open ? 0 : 1, transition: 'opacity .2s ease', pointerEvents: 'none' }} />}
      </div>
      {over && <button type="button" onClick={onToggle} aria-expanded={open} style={moreBtn}>{open ? 'Thu gọn' : 'Xem thêm'}</button>}
    </>
  );
}

function Cell({ c, head, first, bg, open, onToggle, limit, onMeasure }: { c: DocCell; head: string; first: boolean; bg: string; open: boolean; onToggle: () => void; limit: number | null; onMeasure?: (h: number) => void }) {
  if (c.blank) return <span aria-hidden style={{ display: 'block', height: 44, borderRadius: 8, border: '1px dashed #E0E0E0' }} />;
  const lines = c.lines ?? [];
  const text = lines.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#262626' }}>
      {lines.map((l, i) => (first && i === 0 && l.li === undefined
        ? <p key={i} style={{ margin: 0, fontSize: 14.5, fontWeight: 600, lineHeight: 1.45, color: '#171717' }}><LineText l={l} /></p>
        : <Line key={i} l={l} size={13.5} labelBold={isVocabCol(head)} />))}
    </div>
  );
  if (!c.prompts) return text ? <Clamp limit={limit} open={open} onToggle={onToggle} bg={bg}>{text}</Clamp> : null;
  // Her notes under the prompts stay folded with the row; their button counts in the row's height.
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Slides prompts={c.prompts} onSize={(h) => onMeasure?.(h + (text ? MORE_H : 0))} />
      {text && (
        <>
          {open && <div className="co-rise" style={{ marginTop: 14, borderRadius: 8, background: '#FAFAFA', padding: '10px 12px' }}>{text}</div>}
          <button type="button" onClick={onToggle} aria-expanded={open} style={{ ...moreBtn, alignSelf: 'flex-start' }}>{open ? 'Thu gọn' : 'Xem thêm'}</button>
        </>
      )}
    </div>
  );
}

// ---- prompt slideshow ----------------------------------------------------------------------------------------------

/** One prompt at a time, with her hint and exam date; dots, a counter and arrows sit at the bottom of the cell. */
function Slides({ prompts, onSize }: { prompts: DocPrompt[]; onSize?: (h: number) => void }) {
  const [at, setAt] = useState(0);
  // Its natural height (the tallest prompt plus the controls), which sets the row's height while the row is closed.
  const viewRef = useRef<HTMLDivElement>(null);
  const pagerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef(onSize);
  sizeRef.current = onSize;
  useLayoutEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    const report = () => sizeRef.current?.(v.offsetHeight + (pagerRef.current ? 12 + pagerRef.current.offsetHeight : 0));
    report();
    const ro = new ResizeObserver(report);
    ro.observe(v);
    if (pagerRef.current) ro.observe(pagerRef.current);
    return () => ro.disconnect();
  }, []);
  const done = useContext(DoneCtx);
  const n = prompts.length;
  const go = (i: number) => setAt(Math.max(0, Math.min(n - 1, i)));
  const arrow = (dir: -1 | 1) => {
    const off = dir < 0 ? at === 0 : at === n - 1;
    return (
      <button type="button" onClick={() => go(at + dir)} disabled={off} aria-label={dir < 0 ? 'Đề trước' : 'Đề sau'} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 8, border: '1px solid #E5E5E5', background: '#fff', cursor: off ? 'default' : 'pointer', opacity: off ? 0.4 : 1, padding: 0 }}>
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d={dir < 0 ? 'M10 4l-4 4 4 4' : 'M6 4l4 4-4 4'} fill="none" stroke="#404040" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    );
  };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
      <div ref={viewRef} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', transform: `translateX(-${at * 100}%)`, transition: `transform .38s ${EASE}` }}>
          {prompts.map((p, i) => (
            <div key={i} inert={i !== at} aria-hidden={i !== at} style={{ flex: '0 0 100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, opacity: i === at ? 1 : 0, transition: 'opacity .3s ease' }}>
              {(p.label || p.date) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {p.label && <span style={{ fontSize: 12.5, fontWeight: 600, color: '#737373' }}>{p.label}</span>}
                  {p.date && <span style={{ borderRadius: 4, padding: '2px 7px', background: '#FFF6DE', color: '#8A5A00', fontSize: 12, fontWeight: 600 }}>Đề thi {p.date}</span>}
                </span>
              )}
              <span style={{ fontSize: 14, lineHeight: 1.6, color: '#171717' }}>{p.text}</span>
              {p.hint && <span style={{ fontSize: 13, lineHeight: 1.55, color: '#737373' }}>{p.hint}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                <span className="pro-fill">
                  <Link href={'/nghi-y?q=' + p.id} style={{ height: 34, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 14px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>
                    Nghĩ ý
                    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4l4 4-4 4" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </Link>
                </span>
                {done.has(p.id) && <svg width="16" height="16" viewBox="0 0 16 16" aria-label="Đã luyện" role="img"><path d="M3.5 8.4l3.1 2.9 5.9-6.4" fill="none" stroke="#2D881A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </span>
            </div>
          ))}
        </div>
      </div>
      {n > 1 && (
        <div ref={pagerRef} style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid #F0F0F0' }}>
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            {prompts.map((_, i) => (
              <button key={i} type="button" onClick={() => go(i)} aria-label={`Đề ${i + 1}`} aria-current={i === at ? 'true' : undefined} style={{ width: i === at ? 16 : 6, height: 6, padding: 0, border: 'none', borderRadius: 3, background: i === at ? '#2F62C4' : '#E0E0E0', cursor: 'pointer', transition: `width .3s ${EASE}, background .3s ease` }} />
            ))}
          </span>
          <span style={{ fontSize: 12.5, color: '#737373', fontVariantNumeric: 'tabular-nums' }}>{at + 1} / {n}</span>
          {arrow(-1)}
          {arrow(1)}
        </div>
      )}
    </div>
  );
}
