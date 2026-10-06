'use client';

import { useEffect, useRef, useState } from 'react';
import { AI_ERROR_TEXT, AiRequestError } from '../ai/request';
import { Translator } from '../ai/Translator';
import { CL, CL_CIRC, CL_FIXABLE, CL_SHAPE_LABEL } from './constants';
import { cellQuestion, driverOf, gridFor, isCompare, type CellCmp, type MapExtras, type MapRow } from './ideamap';
import { newChain, ropeUnits, shapeOf } from './model';
import { requestChainReview, reviewChains, reviewKey, type ChainReview } from './review';
import { useSpec } from './SpecContext';
import type { Chain, Question, ReviewItem, RopeUnit, Side } from './types';
import { CellCompare } from './ui/CellCompare';
import { CellSlot } from './ui/CellSlot';
import { ChainCard } from './ui/ChainCard';
import { ChainsLayout } from './ui/ChainsLayout';
import { ContextRail } from './ui/ContextRail';
import { IdeaMap } from './ui/IdeaMap';
import { backLinkStyle, ClIcon, ClLabel, toolbarBtn } from './ui/primitives';
import { ReviewPanel, ReviewSummary } from './ui/ReviewPanel';
import { Rope } from './ui/Rope';
import { useReorder } from './ui/useReorder';

/** The one easing of this screen's slides: the same gentle ease-in-out as the map, with no sudden start. */
const SMOOTH = '.35s cubic-bezier(.4, 0, .2, 1)';

export interface ChainBuilderProps {
  chains: Chain[];
  setChains: (fn: Chain[] | ((cs: Chain[]) => Chain[])) => void;
  /** Rows and columns the student added to the idea maps, by question number. */
  extras?: Record<string, MapExtras>;
  setExtras: (e: Record<string, MapExtras>) => void;
  stance: string;
  setStance: (s: string) => void;
  /** Last "Soát toàn bài" result, kept on the attempt so it survives reloads. */
  review: ChainReview | null;
  setReview: (r: ChainReview | null) => void;
  onBack: () => void;
  onWrite: () => void;
}

/**
 * Screen 1 of "Viết tự do", in three panels: the rope and idea map · the selected chain (with the translator under it)
 * · the review. Picking a cell, a rope chip or a review comment selects its chain, so nothing needs scrolling to.
 */
export function ChainBuilder({ chains, setChains, extras, setExtras, stance, setStance, review, setReview, onBack, onWrite }: ChainBuilderProps) {
  const spec = useSpec();
  const bind = useReorder(chains, (n) => setChains(n));
  const [help, setHelp] = useState(false);
  const [ctxOpen, setCtxOpen] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cellSel, setCellSel] = useState<{ q: number; r: string; c: string } | null>(null);
  const [mapOpen, setMapOpen] = useState<Record<number, boolean>>({});
  const leftRef = useRef<HTMLElement>(null);
  const stanceRef = useRef<HTMLTextAreaElement>(null);

  const verdictQ = spec.questions.find((q) => q.shape === 'verdict');
  const multiQ = spec.questions.length > 1;
  const active = chains.find((c) => c.id === activeId) || chains[0] || null;
  const update = (c: Chain) => setChains((cs) => cs.map((x) => (x.id === c.id ? c : x)));
  const patch = (id: string, fn: (c: Chain) => Chain) => setChains((cs) => cs.map((x) => (x.id === id ? fn(x) : x)));
  const moveUnit = (u: RopeUnit, side: Side) => patch(u.chainId, (c) => {
    const r = u.ref;
    if (r.type === 'finding') return { ...c, findings: c.findings.map((f) => (f.id === r.id ? { ...f, side } : f)) };
    if (r.type === 'branch') return { ...c, split: { ...c.split, branches: c.split.branches.map((b, j) => (j === r.k ? { ...b, side } : b)) } };
    return { ...c, side };
  });
  const units = ropeUnits(spec, chains);
  const stale = review && review.key !== reviewKey(chains, stance);

  /** Shows a chain in the middle panel and its cell on the map. */
  const selectChain = (id: string) => {
    const c = chains.find((x) => x.id === id);
    setActiveId(id);
    setCellSel(c && c.cell ? { q: c.q || 1, r: c.cell.r, c: c.cell.c } : null);
  };
  const isOpen = (n: number) => mapOpen[n] ?? true;

  const runAudit = async () => {
    setRunning(true); setError(null);
    try {
      const r = await requestChainReview(spec, chains, stance);
      setChains((cs) => cs.map((c) => ({ ...c, check: r.checks[c.id] })));
      setReview(r); setSeen([]);
    } catch (e) {
      // A signed-out error is handled by the workspace's next save; show the rest here.
      setError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network);
    }
    setRunning(false);
  };
  const closeReview = () => setReview(null);
  const go = (it: ReviewItem) => {
    setSeen((s) => (s.includes(it.key) ? s : [...s, it.key]));
    if (it.target === 'stance' || !it.chainId) {
      const m = leftRef.current;
      if (m) m.scrollTo({ top: it.target === 'stance' && stanceRef.current ? Math.max(0, stanceRef.current.offsetTop - 120) : 0, behavior: 'smooth' });
      if (it.target === 'stance' && stanceRef.current) stanceRef.current.focus({ preventScroll: true });
      return;
    }
    selectChain(it.chainId);
  };

  const add = (q = 1) => { const c = newChain(q); setChains([...chains, c]); setActiveId(c.id); setCellSel(null); };
  /** A cell of the idea map as a chain: the driver first (where there is one), then the student's own steps. */
  const chainFor = (q: Question, row: MapRow, col: string, question: string, title = '', drv: 'A' | 'B' | null = null): Chain => {
    const cause = q.shape === 'cause', solution = q.shape === 'solution';
    return {
      ...newChain(q.n, cause && (row.key === 'Cá nhân' || row.key === 'Hệ thống') ? row.key : null),
      title,
      area: solution ? '' : col,
      steps: cause || solution ? [''] : [(drv ? driverOf(spec, drv) : spec.driver) || '', ''],
      drv,
      fixes: solution ? row.key : null,
      cell: { r: cause || solution ? row.key : row.label, c: col, q: question, ...(solution ? { label: row.label } : {}) },
    };
  };
  const inCell = (q: Question, row: MapRow, col: string) => chains.find((c) => (c.q || 1) === q.n && c.cell && c.cell.r === (q.shape === 'cause' || q.shape === 'solution' ? row.key : row.label) && c.cell.c === col);
  const fromCell = (q: Question, row: MapRow, col: string, question: string, drv: 'A' | 'B' | null = null) => {
    const chain = chainFor(q, row, col, question, '', drv);
    setChains([...chains, chain]);
    setActiveId(chain.id);
  };
  const onCell = (q: Question) => (s: { r: string; c: string } | null) => {
    setCellSel(s ? { q: q.n, ...s } : null);
    const ch = s && chains.find((c) => (c.q || 1) === q.n && c.cell && c.cell.r === s.r && c.cell.c === s.c);
    if (ch) setActiveId(ch.id);
  };
  /** The comparison of one cell of a two-driver map lives with the map's other extras. */
  const setCmp = (q: Question, r: string, c: string, v: CellCmp) => {
    const ex = (extras && extras[q.n]) || { rows: [], cols: [] };
    setExtras({ ...(extras || {}), [q.n]: { ...ex, cmp: { ...(ex.cmp || {}), [r + '|' + c]: v } } });
  };
  const cmpQ = cellSel ? spec.questions.find((x) => x.n === cellSel.q) : null;
  const compareCell = cellSel && cmpQ && isCompare(spec, cmpQ) ? { ...cellSel, q: cmpQ } : null;
  /** A selected cell of a single-driver map: the row it stands for, so its question can be asked before any chain exists. */
  const slotQ = cellSel && !compareCell ? spec.questions.find((x) => x.n === cellSel.q) : null;
  const slotRow = slotQ ? gridFor(spec, slotQ, chains, extras?.[slotQ.n]).rows.find((r) => r.key === cellSel.r) : null;
  const slotChain = slotQ && slotRow ? inCell(slotQ, slotRow, cellSel.c) : null;
  const slot = slotQ && slotRow && !slotChain ? { q: slotQ, row: slotRow, col: cellSel.c } : null;
  const shown = slotChain || active;
  const mapOf = (q: Question) => (
    <IdeaMap bare q={q} chains={chains} extras={extras?.[q.n]} setExtras={(e) => setExtras({ ...(extras || {}), [q.n]: e })} open={isOpen(q.n)} setOpen={(v) => setMapOpen((m) => ({ ...m, [q.n]: v }))}
      sel={cellSel && cellSel.q === q.n ? { r: cellSel.r, c: cellSel.c } : null} onSel={onCell(q)} />
  );
  const fixTargets = chains.map((c, i) => ({ c, i })).filter(({ c }) => CL_FIXABLE.includes(shapeOf(spec, c))).map(({ c, i }) => ({ id: c.id, label: 'Mạch ' + (i + 1) + (c.title ? ' · ' + c.title : '') }));

  /** The rope, the stance and (below them) the verdict question's map. */
  const ropeBlock = verdictQ && (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <ClLabel color={CL.ink}>Lập trường</ClLabel>
        <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>Kéo từng ý về phía nó ủng hộ</span>
      </div>
      <Rope units={units} onSide={moveUnit} selected={sel} onSelect={(u) => { setSel(u.key); selectChain(u.chainId); }} />
      <div style={{ height: 1, background: CL.ink1, margin: '16px 0 12px' }} />
      <textarea ref={stanceRef} className="cl-ta" value={stance} onChange={(e) => setStance(e.target.value)} rows={1} aria-label="Lập trường" placeholder="Sau khi thử các mạch, bạn nghiêng về phía nào, và với điều kiện gì?" style={{ display: 'block', width: '100%', minHeight: 30, resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontFamily: CL.serif, fontSize: 17, lineHeight: 1.55, color: CL.ink, padding: 0, fieldSizing: 'content' } as React.CSSProperties} />
      {(spec.stakeholders || []).length > 0 && <><div style={{ height: 1, background: CL.ink1, margin: '16px 0 14px' }} />{mapOf(verdictQ)}</>}
    </div>
  );

  const label = (c: Chain, i: number) => (c.drv ? c.drv + ' · ' : '') + (c.cell ? (c.title.trim() || (shapeOf(spec, c) === 'cause' || shapeOf(spec, c) === 'solution' ? c.cell.c : c.cell.r + ' · ' + c.cell.c)) : c.title.trim() || 'Mạch ' + (i + 1));

  const leftBody = !multiQ ? (
    spec.questions[0] === verdictQ ? ropeBlock : mapOf(spec.questions[0])
  ) : spec.questions.map((q, k) => {
    const n = chains.filter((c) => (c.q || 1) === q.n).length;
    return (
      <section key={q.n} id={'cl-q-' + q.n} style={{ paddingTop: k ? 20 : 0, borderTop: k ? '1px solid ' + CL.ink2 : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '2px 2px 14px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: CL.sans, fontSize: 18, lineHeight: 1, color: CL.ink }}>{CL_CIRC[q.n - 1]}</span>
          <ClLabel color={CL.ink}>{CL_SHAPE_LABEL[q.shape]}</ClLabel>
          {q.q && <span style={{ minWidth: 0, fontFamily: CL.sans, fontSize: 12.5, color: CL.ink6 }}>{q.q}</span>}
          <span style={{ marginLeft: 'auto', flexShrink: 0, fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>{n} mạch</span>
        </div>
        {q === verdictQ ? ropeBlock : mapOf(q)}
      </section>
    );
  });

  const left = (
    <section ref={leftRef} className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', padding: '16px 22px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <button type="button" className="cl-btn" onClick={() => setCtxOpen(!ctxOpen)} aria-expanded={ctxOpen} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', borderRadius: 10, background: CL.panel, padding: '10px 14px' }}>
          <ClLabel color={CL.ink}>Đề bài</ClLabel>
          <span aria-hidden="true" style={{ display: 'inline-flex', color: CL.ink4, transform: ctxOpen ? 'none' : 'rotate(-90deg)', transition: 'transform ' + SMOOTH }}><ClIcon name="chev" size={13} /></span>
          <span style={{ minWidth: 0, flex: 1, fontFamily: CL.sans, fontSize: 12, color: CL.ink6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: ctxOpen ? 0 : 1, transition: 'opacity ' + SMOOTH }}>{spec.text}</span>
        </button>
        {/* Always mounted, so opening and closing it is one smooth slide instead of a jump. */}
        <div style={{ display: 'grid', gridTemplateRows: ctxOpen ? '1fr' : '0fr', opacity: ctxOpen ? 1 : 0, visibility: ctxOpen ? 'visible' : 'hidden', transition: 'grid-template-rows ' + SMOOTH + ', opacity ' + SMOOTH + ', visibility 0s linear ' + (ctxOpen ? '0s' : '.35s') }}>
          <div style={{ minHeight: 0, overflow: 'hidden' }}><div style={{ paddingTop: 10 }}><ContextRail bare /></div></div>
        </div>
      </div>
      <div>{leftBody}</div>
    </section>
  );

  const middle = (
    <section className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: 2 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {chains.map((c, i) => (
          <button key={c.id} type="button" className="cl-btn" onClick={() => selectChain(c.id)} aria-pressed={active ? active.id === c.id : false} title={c.title || undefined}
            style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderRadius: 999, border: '1px solid ' + (active && active.id === c.id ? CL.ink : CL.ink2), background: active && active.id === c.id ? CL.ink : '#fff', color: active && active.id === c.id ? '#fff' : CL.ink6, padding: '5px 12px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600, transition: 'background-color .22s ease, color .22s ease, border-color .22s ease' }}>
            {multiQ && <span style={{ marginRight: 5 }}>{CL_CIRC[(c.q || 1) - 1]}</span>}{label(c, i)}
          </button>
        ))}
        <button type="button" className="cl-btn cl-link" onClick={() => add(active ? active.q || 1 : spec.questions[0].n)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: CL.ink5, padding: '5px 6px' }}><ClIcon name="plus" size={12} />Mạch trống</button>
      </div>
      {compareCell ? (
        <CellCompare key={compareCell.r + '|' + compareCell.c} q={compareCell.q} row={compareCell.r} col={compareCell.c} chains={chains} cmp={((extras && extras[compareCell.q.n]) || { cmp: {} }).cmp?.[compareCell.r + '|' + compareCell.c]}
          onCmp={(v) => setCmp(compareCell.q, compareCell.r, compareCell.c, v)}
          onCreate={(drv) => fromCell(compareCell.q, { key: compareCell.r, label: compareCell.r }, compareCell.c, cellQuestion(compareCell.q, { key: compareCell.r, label: compareCell.r }, compareCell.c, driverOf(spec, drv)), drv)}
          onChange={update} onDelete={(c) => { setChains(chains.filter((x) => x.id !== c.id)); setActiveId(null); }}
          bind={bind} numOf={(c) => chains.indexOf(c) + 1} targets={fixTargets} />
      ) : slot ? (
        <CellSlot key={slot.row.key + '|' + slot.col} row={slot.row.label} col={slot.col} hint={gridFor(spec, slot.q, chains, extras?.[slot.q.n]).hint(slot.col)} solution={slot.q.shape === 'solution'} question={cellQuestion(slot.q, slot.row, slot.col, spec.driver)} onCreate={() => fromCell(slot.q, slot.row, slot.col, cellQuestion(slot.q, slot.row, slot.col, spec.driver))} />
      ) : shown ? (
        <ol key={shown.id} className="cl-rise" style={{ margin: 0, padding: 0 }}>
          <ChainCard single num={chains.indexOf(shown) + 1} chain={shown} onChange={update} onDelete={() => { setChains(chains.filter((x) => x.id !== shown.id)); setActiveId(null); if (!shown.cell) setCellSel(null); }} drag={bind(shown.id)} focused={false} targets={fixTargets} />
        </ol>
      ) : (
        <div className="cl-rise" style={{ borderRadius: 18, border: '1px dashed ' + CL.ink3, padding: '48px 28px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 6px', fontFamily: CL.sans, fontSize: 15, fontWeight: 600, color: CL.ink }}>Chưa có mạch nào</p>
          <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 13, lineHeight: 1.6, color: CL.ink5 }}>Chọn một ô trên bản đồ, rồi bấm "Viết mạch từ ô này". Mạch hiện ở đây.</p>
        </div>
      )}
    </section>
  );

  const right = review && (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <ReviewPanel review={review} live={stale && review.source !== 'ai' ? reviewChains(spec, chains, stance) : review} chains={chains} stance={stance} top={review.summary && <ReviewSummary text={review.summary} />} stale={stale} running={running} onRerun={runAudit} onClose={closeReview} onGo={go} seen={seen} />
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1710, margin: '0 auto', padding: '12px 40px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 42, paddingBottom: 12 }}>
        <button type="button" className="cl-btn cl-link" onClick={onBack} style={backLinkStyle}><ClIcon name="left" size={14} />Thư viện đề</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {error && <span role="alert" style={{ fontFamily: CL.sans, fontSize: 12, color: '#8B3A35', marginRight: 4 }}>{error}</span>}
          <button type="button" className="cl-btn" onClick={() => { setCtxOpen(!ctxOpen); leftRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-pressed={ctxOpen} style={toolbarBtn(ctxOpen)}>Đề bài</button>
          <button type="button" className="cl-btn" onClick={runAudit} disabled={running} style={{ ...toolbarBtn(false), color: CL.ink, padding: '8px 14px', opacity: running ? 0.6 : 1 }}>{running ? 'Đang soát…' : review ? 'Soát lại' : 'Soát toàn bài'}</button>
          <button type="button" className="cl-btn" onClick={() => setHelp(!help)} aria-pressed={help} style={toolbarBtn(help)}>Dịch</button>
          <button type="button" className="cl-btn cl-primary" onClick={onWrite} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 5, background: CL.ink, color: '#fff', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 14px' }}>Viết bài<ClIcon name="right" size={13} /></button>
        </div>
      </div>
      <ChainsLayout left={left} middle={middle} bottom={<Translator onClose={() => setHelp(false)} />} bottomOpen={help} right={right} rightOpen={!!review} />
    </div>
  );
}
