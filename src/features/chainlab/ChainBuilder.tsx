'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AI_ERROR_TEXT, AiRequestError } from '../ai/request';
import { Translator } from '../ai/Translator';
import { CL, CL_CIRC, CL_FIXABLE, CL_SHAPE_LABEL } from './constants';
import { causeLabel, cellQuestion, driverOf, gridFor, isCompare, type MapExtras, type MapRow } from './ideamap';
import { filledSteps, newChain, shapeOf } from './model';
import { requestChainReview, reviewChains, reviewKey, type ChainReview } from './review';
import { SpecProvider, useSpec } from './SpecContext';
import type { Chain, Question, ReviewItem } from './types';
import { CausePair } from './ui/CausePair';
import { CellCompare } from './ui/CellCompare';
import { CellSlot } from './ui/CellSlot';
import { ChainCard } from './ui/ChainCard';
import { ChainsLayout } from './ui/ChainsLayout';
import { ContextRail } from './ui/ContextRail';
import { IdeaMap } from './ui/IdeaMap';
import { backLinkStyle, ClIcon, ClLabel, toolbarBtn } from './ui/primitives';
import { ReviewPanel, ReviewSummary } from './ui/ReviewPanel';
import { useReorder } from './ui/useReorder';

/** The one easing of this screen's slides: the same gentle ease-in-out as the map, with no sudden start. */
const SMOOTH = '.35s cubic-bezier(.4, 0, .2, 1)';

export interface ChainBuilderProps {
  chains: Chain[];
  setChains: (fn: Chain[] | ((cs: Chain[]) => Chain[])) => void;
  /** Rows and columns the student added to the idea maps, by question number. */
  extras?: Record<string, MapExtras>;
  setExtras: (e: Record<string, MapExtras>) => void;
  /** The position, written on screen ②; the review still reads it. */
  stance: string;
  /** Last "Soát toàn bài" result, kept on the attempt so it survives reloads. */
  review: ChainReview | null;
  setReview: (r: ChainReview | null) => void;
  onBack: () => void;
  /** Go on to screen ② "Cân". */
  onNext: () => void;
  /** The ① ② ③ step bar, shown in the toolbar. */
  nav?: React.ReactNode;
}

/**
 * Screen ① of "Viết tự do", in three panels: the idea maps · the selected chain (with the translator under it)
 * · the review. Picking a cell or a review comment selects its chain, so nothing needs scrolling to. The rope and the
 * position live on screen ② "Cân".
 */
export function ChainBuilder({ chains, setChains, extras, setExtras, stance, review, setReview, onBack, onNext, nav }: ChainBuilderProps) {
  const base = useSpec();
  /** "Best" / "only" prompts: the rival the student chose replaces the suggested second driver everywhere below. */
  const rival = (extras && base.questions.map((x) => extras[x.n]?.rival).find(Boolean)) || '';
  const spec = useMemo(() => (rival && base.claim ? { ...base, driver2: rival } : base), [base, rival]);
  const bind = useReorder(chains, (n) => setChains(n));
  const [help, setHelp] = useState(false);
  const [ctxOpen, setCtxOpen] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cellSel, setCellSel] = useState<{ q: number; r: string; c: string } | null>(null);
  const [mapOpen, setMapOpen] = useState<Record<number, boolean>>({});
  const leftRef = useRef<HTMLElement>(null);

  const verdictQ = spec.questions.find((q) => q.shape === 'verdict');
  const multiQ = spec.questions.length > 1;
  const active = chains.find((c) => c.id === activeId) || chains[0] || null;
  const update = (c: Chain) => setChains((cs) => cs.map((x) => (x.id === c.id ? c : x)));
  const stale = review && review.key !== reviewKey(chains, stance);

  /** Cause + solution prompts: solutions are written under their cause, in the cause map's panel. */
  const causeQ = spec.questions.find((x) => x.shape === 'cause');
  const solQ = causeQ ? spec.questions.find((x) => x.shape === 'solution') : null;
  /** Shows a chain in the middle panel and its cell on the map (a solution shows its cause's cell). */
  const selectChain = (id: string) => {
    let c = chains.find((x) => x.id === id);
    setActiveId(id);
    if (c && solQ && (c.q || 1) === solQ.n && c.fixes) c = chains.find((x) => x.id === c.fixes) || c;
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
    if (it.target === 'stance') { onNext(); return; }
    if (!it.chainId) { leftRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    selectChain(it.chainId);
  };

  const add = (q = 1) => { const c = newChain(q); setChains([...chains, c]); setActiveId(c.id); setCellSel(null); };
  /** A cell of the idea map as a chain: the driver first (where there is one), then the student's own steps. */
  const chainFor = (q: Question, row: MapRow, col: string, question: string, title = '', drv: 'A' | 'B' | null = null): Chain => {
    const cause = q.shape === 'cause', solution = q.shape === 'solution';
    return {
      ...newChain(q.n),
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
  const cmpQ = cellSel ? spec.questions.find((x) => x.n === cellSel.q) : null;
  const compareCell = cellSel && cmpQ && isCompare(spec, cmpQ) ? { ...cellSel, q: cmpQ } : null;
  /** A selected cell of a cause map whose prompt also asks for solutions: cause on top, its solutions under it. */
  const pairCell = cellSel && solQ && !compareCell && cellSel.q === causeQ.n ? (() => {
    const row = gridFor(spec, causeQ, chains, extras?.[causeQ.n]).rows.find((r) => r.key === cellSel.r);
    return row ? { row, col: cellSel.c, cause: inCell(causeQ, row, cellSel.c) } : null;
  })() : null;
  /** A selected cell of a single-driver map: the row it stands for, so its question can be asked before any chain exists. */
  const slotQ = cellSel && !compareCell && !pairCell ? spec.questions.find((x) => x.n === cellSel.q) : null;
  const slotRow = slotQ ? gridFor(spec, slotQ, chains, extras?.[slotQ.n]).rows.find((r) => r.key === cellSel.r) : null;
  const slotChain = slotQ && slotRow ? inCell(slotQ, slotRow, cellSel.c) : null;
  const slot = slotQ && slotRow && !slotChain ? { q: slotQ, row: slotRow, col: cellSel.c } : null;
  const shown = slotChain || active;
  const onRival = (v: string) => {
    const vq = spec.questions.find((x) => isCompare(spec, x));
    if (!vq) return;
    const next = v.replace(/\s+/g, ' ').trim().slice(0, 120);
    const old = driverOf(spec, 'B'), neu = next || base.driver2 || '';
    const ex = (extras && extras[vq.n]) || { rows: [], cols: [] };
    setExtras({ ...(extras || {}), [vq.n]: { ...ex, rival: next || undefined } });
    if (neu !== old) setChains((cs) => cs.map((c) => (c.drv === 'B' && (c.q || 1) === vq.n && c.steps[0] === old ? { ...c, steps: [neu, ...c.steps.slice(1)], cell: c.cell ? { ...c.cell, q: c.cell.q.split(old).join(neu) } : c.cell } : c)));
  };
  const mapOf = (q: Question) => (
    <IdeaMap bare q={q} chains={chains} extras={extras?.[q.n]} onRival={spec.claim ? onRival : undefined} setExtras={(e) => setExtras({ ...(extras || {}), [q.n]: e })} open={isOpen(q.n)} setOpen={(v) => setMapOpen((m) => ({ ...m, [q.n]: v }))}
      sel={cellSel && cellSel.q === q.n ? { r: cellSel.r, c: cellSel.c } : null} onSel={onCell(q)}
      fixCount={solQ && q === causeQ ? (id) => chains.filter((x) => (x.q || 1) === solQ.n && x.fixes === id).length : undefined} />
  );
  /** Cause + solution prompts: the solution question lists each cause and its solutions instead of a second map. */
  const solutionList = (q: Question) => {
    const causes = chains.filter((c) => (c.q || 1) === causeQ.n && filledSteps(c) > 0);
    const orphans = chains.filter((c) => (c.q || 1) === q.n && !causes.some((x) => x.id === c.fixes));
    const row: React.CSSProperties = { width: '100%', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', borderRadius: 10, border: '1px solid ' + CL.ink2, background: '#fff', padding: '9px 12px', fontFamily: CL.sans, fontSize: 12.5 };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ margin: '0 2px 4px', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink5 }}>Giải pháp được viết ngay dưới nguyên nhân của nó: chọn một ô ở bản đồ {CL_CIRC[causeQ.n - 1]}, hoặc một nguyên nhân dưới đây.</p>
        {causes.map((c) => {
          const n = chains.filter((x) => (x.q || 1) === q.n && x.fixes === c.id).length;
          return (
            <button key={c.id} type="button" className="cl-btn" onClick={() => selectChain(c.id)} style={row}>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 600, color: CL.ink }}>{causeLabel(c)}</span>
              <span style={{ flexShrink: 0, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: n ? CL.mintSoft : '#F1F1EE', color: n ? CL.greenText : CL.ink5 }}>{n ? n + ' giải pháp' : 'Chưa có giải pháp'}</span>
            </button>
          );
        })}
        {orphans.map((c) => (
          <button key={c.id} type="button" className="cl-btn" onClick={() => selectChain(c.id)} style={{ ...row, borderStyle: 'dashed' }}>
            <span style={{ flex: 1, minWidth: 0, fontWeight: 600, color: CL.ink7 }}>{c.title.trim() || 'Giải pháp chưa đặt tên'}</span>
            <span style={{ flexShrink: 0, fontSize: 11, color: CL.ink5 }}>chưa gắn nguyên nhân</span>
          </button>
        ))}
        {!causes.length && !orphans.length && <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>Chưa có nguyên nhân nào.</span>}
      </div>
    );
  };
  const actors = solQ ? gridFor(spec, solQ, chains, extras?.[solQ.n]).cols : [];

  const fixTargets = chains.map((c, i) => ({ c, i })).filter(({ c }) => CL_FIXABLE.includes(shapeOf(spec, c))).map(({ c, i }) => ({ id: c.id, label: 'Mạch ' + (i + 1) + (c.title ? ' · ' + c.title : '') }));

  /** The body of one question's section: its map, or for solutions under causes, the list of causes. */
  const bodyOf = (q: Question) => (solQ && q === solQ ? solutionList(q) : mapOf(q));

  const label = (c: Chain, i: number) => (c.drv ? c.drv + ' · ' : '') + (c.cell ? (c.title.trim() || (shapeOf(spec, c) === 'solution' ? c.cell.c : c.cell.r + ' · ' + c.cell.c)) : c.title.trim() || 'Mạch ' + (i + 1));

  const leftBody = !multiQ ? (
    bodyOf(spec.questions[0])
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
        {bodyOf(q)}
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
        <CellCompare key={compareCell.r + '|' + compareCell.c} q={compareCell.q} row={compareCell.r} col={compareCell.c} chains={chains}
          onCreate={(drv) => fromCell(compareCell.q, { key: compareCell.r, label: compareCell.r }, compareCell.c, cellQuestion(compareCell.q, { key: compareCell.r, label: compareCell.r }, compareCell.c, driverOf(spec, drv)), drv)}
          onChange={update} onDelete={(c) => { setChains(chains.filter((x) => x.id !== c.id)); setActiveId(null); }}
          bind={bind} numOf={(c) => chains.indexOf(c) + 1} targets={fixTargets} onNext={onNext} />
      ) : pairCell ? (
        <CausePair key={pairCell.row.key + '|' + pairCell.col} causeQ={causeQ} solQ={solQ} row={pairCell.row} col={pairCell.col} hint={gridFor(spec, causeQ, chains, extras?.[causeQ.n]).hint(pairCell.col)} cause={pairCell.cause} chains={chains} actors={actors} driver={spec.driver}
          onCreateCause={() => fromCell(causeQ, pairCell.row, pairCell.col, cellQuestion(causeQ, pairCell.row, pairCell.col, spec.driver))}
          onCreateSolution={(cause, who) => { const r = { key: cause.id, label: causeLabel(cause) }; fromCell(solQ, r, who, cellQuestion(solQ, r, who)); }}
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
    <SpecProvider value={spec}>
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1710, margin: '0 auto', padding: '12px 40px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 42, paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <button type="button" className="cl-btn cl-link" onClick={onBack} style={backLinkStyle}><ClIcon name="left" size={14} />Thư viện đề</button>
          {nav}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {error && <span role="alert" style={{ fontFamily: CL.sans, fontSize: 12, color: '#8B3A35', marginRight: 4 }}>{error}</span>}
          <button type="button" className="cl-btn" onClick={() => { setCtxOpen(!ctxOpen); leftRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-pressed={ctxOpen} style={toolbarBtn(ctxOpen)}>Đề bài</button>
          <button type="button" className="cl-btn" onClick={runAudit} disabled={running} style={{ ...toolbarBtn(false), color: CL.ink, padding: '8px 14px', opacity: running ? 0.6 : 1 }}>{running ? 'Đang soát…' : review ? 'Soát lại' : 'Soát toàn bài'}</button>
          <button type="button" className="cl-btn" onClick={() => setHelp(!help)} aria-pressed={help} style={toolbarBtn(help)}>Dịch</button>
          <button type="button" className="cl-btn cl-primary" onClick={onNext} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 5, background: CL.ink, color: '#fff', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 14px' }}>{verdictQ ? 'Cân' : 'Dàn bài'}<ClIcon name="right" size={13} /></button>
        </div>
      </div>
      <ChainsLayout left={left} middle={middle} bottom={<Translator onClose={() => setHelp(false)} />} bottomOpen={help} right={right} rightOpen={!!review} />
    </div>
    </SpecProvider>
  );
}
