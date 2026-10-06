'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { AI_ERROR_TEXT, AiRequestError } from '../ai/request';
import { Translator } from '../ai/Translator';
import { CL, CL_CIRC, CL_FIXABLE, CL_SHAPE_LABEL } from './constants';
import type { MapExtras, MapRow } from './ideamap';
import { newChain, ropeUnits, shapeOf } from './model';
import { requestChainReview, reviewChains, reviewKey, type ChainReview } from './review';
import { useSpec } from './SpecContext';
import type { Chain, Question, ReviewItem, RopeUnit, Side } from './types';
import { ChainCard } from './ui/ChainCard';
import { ContextRail } from './ui/ContextRail';
import { IdeaMap } from './ui/IdeaMap';
import { backLinkStyle, ClIcon, ClLabel, toolbarBtn } from './ui/primitives';
import { ReviewPanel, ReviewSummary } from './ui/ReviewPanel';
import { Rope } from './ui/Rope';
import { useReorder } from './ui/useReorder';
import { useThreePanels, WorkspaceGrid } from './ui/WorkspaceGrid';

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

/** Screen 1 of "Viết tự do": build chains per question, test them with lenses, sort them on the rope, write a stance. */
export function ChainBuilder({ chains, setChains, extras, setExtras, stance, setStance, review, setReview, onBack, onWrite }: ChainBuilderProps) {
  const spec = useSpec();
  const bind = useReorder(chains, (n) => setChains(n));
  const [help, setHelp] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const three = useThreePanels();
  const [railOpen, setRailOpen] = useState(true);
  // Narrow screen: the rail would cover the work as a drawer, so start it closed while a side panel is open.
  useEffect(() => { if (!three && (review || help)) setRailOpen(false); }, [three]); // eslint-disable-line react-hooks/exhaustive-deps
  const [focusId, setFocusId] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const mainRef = useRef<HTMLElement>(null);
  const stanceRef = useRef<HTMLTextAreaElement>(null);
  const ropeRef = useRef<HTMLDivElement>(null);
  const focusTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const verdictQ = spec.questions.find((q) => q.shape === 'verdict');
  const multiQ = spec.questions.length > 1;
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

  const runAudit = async () => {
    setRunning(true); setError(null);
    try {
      const r = await requestChainReview(spec, chains, stance);
      setChains((cs) => cs.map((c) => ({ ...c, check: r.checks[c.id] })));
      setReview(r); setSeen([]); if (!three) setRailOpen(false);
    } catch (e) {
      // A signed-out error is handled by the workspace's next save; show the rest here.
      setError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network);
    }
    setRunning(false);
  };
  const closeReview = () => { setReview(null); setRailOpen(true); setFocusId(null); };
  const go = (it: ReviewItem) => {
    setSeen((s) => (s.includes(it.key) ? s : [...s, it.key]));
    const m = mainRef.current; if (!m) return;
    const vSec = verdictQ && multiQ ? document.getElementById('cl-q-' + verdictQ.n) : null;
    if (it.target === 'stance' || !it.chainId) {
      m.scrollTo({ top: it.target === 'stance' && vSec ? vSec.offsetTop : 0, behavior: 'smooth' });
      if (it.target === 'stance' && stanceRef.current) stanceRef.current.focus({ preventScroll: true });
      setFocusId(null);
      return;
    }
    const el = document.getElementById('cl-chain-' + it.chainId);
    const tc = chains.find((x) => x.id === it.chainId);
    const sticky = ropeRef.current && tc && shapeOf(spec, tc) === 'verdict' ? ropeRef.current.offsetHeight : 0;
    const parent = el && (el.offsetParent as HTMLElement);
    const secTop = parent && parent !== m ? parent.offsetTop : 0;
    if (el) m.scrollTo({ top: secTop + el.offsetTop - sticky - 8, behavior: 'smooth' });
    setFocusId(it.chainId);
    clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => setFocusId(null), 2200);
  };
  const add = (q = 1) => setChains([...chains, newChain(q)]);
  // The idea map of a question is open until it has a chain; "Thu gọn" / "Mở bản đồ" override that.
  const [mapOpen, setMapOpen] = useState<Record<number, boolean>>({});
  const isOpen = (n: number) => mapOpen[n] ?? !chains.some((c) => (c.q || 1) === n);
  const reveal = (id: string) => {
    setFocusId(id);
    clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => setFocusId(null), 2200);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.getElementById('cl-chain-' + id), m = mainRef.current;
      if (el && m) m.scrollTo({ top: el.getBoundingClientRect().top - m.getBoundingClientRect().top + m.scrollTop - 90, behavior: 'smooth' });
    }));
  };
  /** A cell of the idea map becomes a chain: the driver first (where there is one), then the student's own steps. */
  const fromCell = (q: Question, row: MapRow, col: string, question: string) => {
    const cause = q.shape === 'cause', solution = q.shape === 'solution';
    const chain: Chain = {
      ...newChain(q.n, cause && (row.key === 'Cá nhân' || row.key === 'Hệ thống') ? row.key : null),
      area: solution ? '' : col,
      steps: cause || solution ? [''] : [spec.driver || '', ''],
      fixes: solution ? row.key : null,
      cell: { r: cause || solution ? row.key : row.label, c: col, q: question, ...(solution ? { label: row.label } : {}) },
    };
    setChains([...chains, chain]);
    setMapOpen((m) => ({ ...m, [q.n]: false }));
    reveal(chain.id);
  };
  const mapOf = (q: Question) => (
    <IdeaMap q={q} chains={chains} extras={extras?.[q.n]} setExtras={(e) => setExtras({ ...(extras || {}), [q.n]: e })} open={isOpen(q.n)} setOpen={(v) => setMapOpen((m) => ({ ...m, [q.n]: v }))} onCreate={(r, c, qu) => fromCell(q, r, c, qu)} onGoto={reveal} />
  );
  const fixTargets = chains.map((c, i) => ({ c, i })).filter(({ c }) => CL_FIXABLE.includes(shapeOf(spec, c))).map(({ c, i }) => ({ id: c.id, label: 'Mạch ' + (i + 1) + (c.title ? ' · ' + c.title : '') }));

  const ropeBox = verdictQ && (
    <div ref={ropeRef} style={{ position: 'sticky', top: -2, zIndex: 5, margin: '-2px 0 16px', paddingTop: 2, background: '#fff' }}>
      <div style={{ borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', padding: '16px 22px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <ClLabel color={CL.ink}>Lập trường</ClLabel>
          <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>Kéo từng ý về phía nó ủng hộ</span>
        </div>
        <Rope units={units} onSide={moveUnit} selected={sel} onSelect={(u) => setSel(u.key)} />
        <div style={{ height: 1, background: CL.ink1, margin: '16px 0 12px' }} />
        <textarea ref={stanceRef} className="cl-ta" value={stance} onChange={(e) => setStance(e.target.value)} rows={1} aria-label="Lập trường" placeholder="Sau khi thử các mạch, bạn nghiêng về phía nào, và với điều kiện gì?" style={{ display: 'block', width: '100%', minHeight: 30, resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontFamily: CL.serif, fontSize: 17, lineHeight: 1.55, color: CL.ink, padding: 0, fieldSizing: 'content' } as React.CSSProperties} />
      </div>
    </div>
  );
  const card = (c: Chain) => {
    const i = chains.indexOf(c);
    return <ChainCard key={c.id} num={i + 1} chain={c} onChange={update} onDelete={() => setChains(chains.filter((x) => x.id !== c.id))} drag={bind(c.id)} focused={focusId === c.id} targets={fixTargets} />;
  };
  const addBtn = (q: Question, label: string) => (
    <button key={q.n} type="button" className="cl-btn cl-add" onClick={() => add(q.n)} style={{ flex: 1, minWidth: 0, minHeight: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, border: '1px dashed ' + CL.ink3, fontFamily: CL.sans, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: CL.ink5 }}><ClIcon name="plus" size={16} />{label}</button>
  );

  const body = !multiQ ? (
    <Fragment>
      {ropeBox}
      {mapOf(spec.questions[0])}
      <ol style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>{chains.map(card)}</ol>
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>{addBtn(spec.questions[0], 'Thêm mạch trống')}</div>
    </Fragment>
  ) : spec.questions.map((q, k) => {
    const mine = chains.filter((c) => (c.q || 1) === q.n);
    return (
      <section key={q.n} id={'cl-q-' + q.n} style={{ position: 'relative', paddingTop: k ? 30 : 0, marginTop: k ? 30 : 0, borderTop: k ? '1px solid ' + CL.ink2 : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '2px 4px 14px' }}>
          <span style={{ fontFamily: CL.sans, fontSize: 18, lineHeight: 1, color: CL.ink }}>{CL_CIRC[q.n - 1]}</span>
          <ClLabel color={CL.ink}>{CL_SHAPE_LABEL[q.shape]}</ClLabel>
          {q.q && <span style={{ minWidth: 0, fontFamily: CL.sans, fontSize: 12.5, color: CL.ink6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.q}</span>}
          <span style={{ marginLeft: 'auto', flexShrink: 0, fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>{mine.length} mạch</span>
        </div>
        {q.shape === 'verdict' && ropeBox}
        {mapOf(q)}
        {mine.length > 0 && <ol style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>{mine.map(card)}</ol>}
        <div style={{ display: 'flex', gap: 12, marginTop: mine.length ? 16 : 0 }}>{addBtn(q, 'Thêm mạch trống · câu ' + CL_CIRC[q.n - 1])}</div>
      </section>
    );
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1710, margin: '0 auto', padding: '12px 40px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 42, paddingBottom: 12 }}>
        <button type="button" className="cl-btn cl-link" onClick={onBack} style={backLinkStyle}><ClIcon name="left" size={14} />Thư viện đề</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {error && <span role="alert" style={{ fontFamily: CL.sans, fontSize: 12, color: '#8B3A35', marginRight: 4 }}>{error}</span>}
          <button type="button" className="cl-btn" onClick={() => setRailOpen(!railOpen)} aria-pressed={railOpen} style={toolbarBtn(railOpen)}>Đề bài</button>
          <button type="button" className="cl-btn" onClick={runAudit} disabled={running} style={{ ...toolbarBtn(false), color: CL.ink, padding: '8px 14px', opacity: running ? 0.6 : 1 }}>{running ? 'Đang soát…' : review ? 'Soát lại' : 'Soát toàn bài'}</button>
          <button type="button" className="cl-btn" onClick={() => { if (!help && !three) setRailOpen(false); setHelp(!help); }} aria-pressed={help} style={toolbarBtn(help)}>Dịch</button>
          <button type="button" className="cl-btn cl-primary" onClick={onWrite} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 5, background: CL.ink, color: '#fff', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 14px' }}>Viết bài<ClIcon name="right" size={13} /></button>
        </div>
      </div>
      <WorkspaceGrid
        rail={<ContextRail />}
        railOpen={railOpen}
        reviewOpen={!!review}
        main={<main ref={mainRef} className="cl-scroll" style={{ position: 'relative', minHeight: 0, minWidth: 0, overflowY: 'auto', padding: 2 }}>{body}</main>}
        panel={review && <ReviewPanel review={review} live={stale && review.source !== 'ai' ? reviewChains(spec, chains, stance) : review} chains={chains} stance={stance} top={review.summary && <ReviewSummary text={review.summary} />} stale={stale} running={running} onRerun={runAudit} onClose={closeReview} onGo={go} seen={seen} />}
        side={<Translator onClose={() => setHelp(false)} />}
        sideOpen={help}
      />
    </div>
  );
}
