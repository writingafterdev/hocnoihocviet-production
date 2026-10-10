'use client';

import { useMemo, useState } from 'react';
import { CL, CL_CIRC, CL_SHAPE_LABEL } from './constants';
import { CMP_CRITERIA_ONLY, DRV, normCrit, VERDICT_WORDS, type CellCmp, type MapExtras } from './ideamap';
import { chainStatus, ropeUnits, shapeOf, sidesOf } from './model';
import {
  buildOutline, chainName, cleanParas, defaultLayout, duelsOf, itemFrame, itemLead, itemPoints, LAYOUT_LABEL, layoutsFor, leanLabel, leftOutChains, leftOutItems, livePairs,
  modeOf, pairFrame, pairId, pairQuestion, pairTally, pointsOf, REASONS, relOf, REL_LABEL, scopeHints, sideItems, suggestedLean, suggestPairs, TUY_NGUOI, verdictQ,
  type Board, type Layout, type Lean, type OutlinePara, type Pair, type Plan, type Point, type Win,
} from './plan';
import { SpecProvider, useSpec } from './SpecContext';
import type { Chain, RopeUnit, Side } from './types';
import { CardRope } from './ui/CardRope';
import { PromptBlock } from './ui/ContextRail';
import { backLinkStyle, ClIcon, ClLabel } from './ui/primitives';

export interface WeighScreenProps {
  chains: Chain[];
  setChains: (fn: Chain[] | ((cs: Chain[]) => Chain[])) => void;
  extras?: Record<string, MapExtras>;
  /** Two-driver prompts: the match-up of each cell is kept with the map. */
  setExtras?: (e: Record<string, MapExtras>) => void;
  stance: string;
  setStance: (s: string) => void;
  plan: Plan;
  setPlan: (p: Plan) => void;
  onBack: () => void;
  /** Go on to writing, with the paragraphs of the outline. */
  onWrite: (paras: OutlinePara[]) => void;
  nav?: React.ReactNode;
}

const LEANS: Lean[] = ['L2', 'L1', '0', 'R1', 'R2'];
const card: React.CSSProperties = { borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', padding: '18px 22px 20px' };
const muted: React.CSSProperties = { fontFamily: CL.sans, fontSize: 12, color: CL.ink5 };
const pillBtn = (on: boolean, extra?: React.CSSProperties): React.CSSProperties => ({ minHeight: 34, borderRadius: 999, border: '1px solid ' + (on ? CL.ink : CL.ink2), background: on ? CL.ink : '#fff', color: on ? '#fff' : CL.ink7, padding: '5px 13px', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, ...extra });
const cellPill: React.CSSProperties = { borderRadius: 999, background: CL.ink, color: '#fff', padding: '3px 10px', fontFamily: CL.sans, fontSize: 11.5, fontWeight: 600 };
const input: React.CSSProperties = { height: 38, borderRadius: 10, border: '1px solid ' + CL.ink2, padding: '0 12px', fontFamily: CL.sans, fontSize: 13, color: CL.ink, outline: 'none', background: '#fff' };

/**
 * Screen ② "Cân" of "Viết tự do". Two-driver prompts first settle each map cell that has both A and B. Then ideas
 * of the two sides are paired (only ideas that meet: same people or same outcome) and each pair answers one question.
 * The pair results suggest the position, and the outline is built from the pairs. "Only" prompts check instead, cell
 * by cell, whether the alternative works without A.
 */
export function WeighScreen(props: WeighScreenProps) {
  const base = useSpec();
  const { extras } = props;
  const rival = (extras && base.questions.map((x) => extras[x.n]?.rival).find(Boolean)) || '';
  const spec = useMemo(() => (rival && base.claim ? { ...base, driver2: rival } : base), [base, rival]);
  return <SpecProvider value={spec}><Weigh {...props} /></SpecProvider>;
}

function Weigh({ chains, setChains, extras, setExtras, stance, setStance, plan, setPlan, onBack, onWrite, nav }: WeighScreenProps) {
  const spec = useSpec();
  const vq = verdictQ(spec);
  const mode = modeOf(spec);
  const compare = mode === 'two' || mode === 'only';
  const [L, R] = sidesOf(spec);
  const sideName = (s: Side | Win) => (s === 'right' ? R : s === 'left' ? L : 'Ngang');
  const set = (p: Partial<Plan>) => setPlan({ ...plan, ...p });
  const ex = vq ? extras?.[vq.n] : undefined;
  const points = useMemo(() => pointsOf(spec, chains, ex), [spec, chains, ex]);
  const pairs = livePairs(plan, points);
  const board: Board = { mode, points, pairs };
  const P = (k: string) => points.find((p) => p.key === k);
  const t = pairTally(mode, points, pairs);
  const sLean = suggestedLean(t);
  const lean = plan.lean ?? sLean;
  const layout: Layout = plan.layout && layoutsFor(spec).includes(plan.layout) ? plan.layout : defaultLayout(spec, lean);
  // Outlines saved before pairs existed hold chains only: rebuild those.
  const saved = plan.paras && (!vq || plan.paras.every((p) => p.items)) ? plan.paras : null;
  const paras = cleanParas(spec, saved || buildOutline(spec, chains, board, lean, layout), chains, board);
  const tone = (s: Side | Win | null) => (s === 'right' ? (compare ? DRV.A : { soft: CL.mintSoft, text: CL.greenText, solid: CL.green }) : s === 'left' ? (compare ? DRV.B : { soft: '#F1F1EE', text: '#3D3D3A', solid: CL.ink5 }) : { soft: '#F7F7F4', text: CL.ink6, solid: CL.ink4 });
  const pairNo = (k: string) => pairs.map((p, i) => (p.l === k || p.r === k ? i + 1 : 0)).filter(Boolean);

  const savePairs = (next: Pair[]) => set({ pairs: next, paras: undefined });
  const editPair = (id: string, patch: Partial<Pair>) => {
    const next = pairs.map((p) => (p.id === id ? { ...p, ...patch } : p));
    // A new result can move the pair to another paragraph; a new reason only changes its sentence.
    if ('win' in patch) savePairs(next); else set({ pairs: next });
  };
  const setCmp = (key: string, v: CellCmp) => {
    if (!vq || !setExtras) return;
    const e = ex || { rows: [], cols: [] };
    setExtras({ ...(extras || {}), [vq.n]: { ...e, cmp: { ...(e.cmp || {}), [key]: v } } });
    if (plan.paras) set({ paras: undefined });
  };

  // ---- left: the prompt and the two piles ------------------------------------------------------------------
  const units = ropeUnits(spec, chains);
  const moveUnit = (u: RopeUnit, s: Side) => setChains((cs) => cs.map((c) => {
    if (c.id !== u.chainId) return c;
    const r = u.ref;
    if (r.type === 'branch') return { ...c, split: { ...c.split, branches: c.split.branches.map((b, j) => (j === r.k ? { ...b, side: s } : b)) } };
    return { ...c, side: s };
  }));
  const moveFinding = (chainId: string, fid: string, s: Side) => setChains((cs) => cs.map((c) => (c.id === chainId ? { ...c, findings: c.findings.map((f) => (f.id === fid ? { ...f, side: s } : f)) } : c)));
  const movePoint = (pt: Point, s: 'left' | 'right') => setChains((cs) => cs.map((c) => (c.id === pt.chains[0] ? { ...c, side: s } : c)));

  const pointCard = (pt: Point) => {
    const tags = pairNo(pt.key);
    const single = mode === 'two' && !pt.duel;
    const move = (to: 'left' | 'right') => (
      <button type="button" className="cl-btn" onClick={() => movePoint(pt, to)} aria-label={'Chuyển sang ' + sideName(to)} title={'Chuyển sang ' + sideName(to)} style={{ flexShrink: 0, width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 8, color: CL.ink5 }}>
        <ClIcon name={to === 'left' ? 'left' : 'right'} size={13} />
      </button>
    );
    const w = pt.duel?.cmp?.win;
    const badge = !pt.duel ? null : mode === 'only' ? (w ? VERDICT_WORDS.only[w] : 'chưa xét') : w ? VERDICT_WORDS.cmp[w] : 'chưa đấu';
    return (
      <div key={pt.key} draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', pt.key); e.dataTransfer.effectAllowed = 'copy'; }}
        style={{ display: 'flex', flexDirection: 'column', gap: 6, borderRadius: 12, border: '1px solid ' + CL.ink2, background: '#fff', padding: '9px 8px 9px 12px', cursor: 'grab' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
          {single && pt.side === 'right' && move('left')}
          <span style={{ flex: 1, minWidth: 0, paddingTop: 4, fontFamily: CL.sans, fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: CL.ink }}>{pt.name}</span>
          {single && pt.side === 'left' && move('right')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontFamily: CL.sans, fontSize: 11, color: CL.ink5 }}>
          {pt.who && <span>{pt.who} · {pt.what}</span>}
          {badge && <span style={{ borderRadius: 6, padding: '1px 7px', background: w ? tone(pt.side).soft : '#F1F1EE', color: w ? tone(pt.side).text : CL.ink5, fontWeight: 700 }}>{pt.duel.a && pt.duel.b && mode === 'two' ? 'A vs B · ' : ''}{badge}</span>}
          {tags.length > 0 && <span style={{ marginLeft: 'auto', fontWeight: 600, color: CL.ink6 }}>cặp {tags.join(', ')}</span>}
        </div>
      </div>
    );
  };
  const piles = (() => {
    const tray = points.filter((p) => !p.side);
    const col = (s: 'left' | 'right') => {
      const list = points.filter((p) => p.side === s);
      return (
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: 10, background: s === 'right' ? DRV.A.soft + '66' : DRV.B.soft + '66', borderLeft: s === 'right' ? '1px solid ' + CL.ink1 : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: s === 'right' ? 'flex-end' : 'flex-start' }}>
            <span style={{ fontFamily: CL.sans, fontSize: 12, fontWeight: 700, color: tone(s).text }}>{sideName(s)}</span>
            <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>{list.length}</span>
          </div>
          {list.map(pointCard)}
          {!list.length && <span style={{ borderRadius: 10, border: '1.5px dashed ' + CL.ink2, padding: '12px 10px', textAlign: 'center', fontFamily: CL.sans, fontSize: 11.5, color: CL.ink5 }}>Chưa có ý nào</span>}
        </div>
      );
    };
    if (!points.length) return <p style={{ margin: 0, ...muted, fontSize: 12.5 }}>Chưa có mạch nào viết xong ở bước ①.</p>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tray.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderRadius: 14, border: '1px dashed ' + CL.ink3, padding: 10 }}>
            <ClLabel color={CL.ink6}>{mode === 'only' ? 'Chưa xét' : 'Chưa phân thắng thua'} · trả lời ở bên phải</ClLabel>
            {tray.map(pointCard)}
          </div>
        )}
        <div style={{ display: 'flex', borderRadius: 14, border: '1px solid ' + CL.ink1, overflow: 'hidden' }}>{col('left')}{col('right')}</div>
      </div>
    );
  })();

  const left = (
    <section style={{ ...card, padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Đề bài và các ý">
      <PromptBlock bare />
      <div style={{ height: 1, background: CL.ink1 }} />
      {vq ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <ClLabel color={CL.ink}>Hai phía</ClLabel>
            <span style={muted}>{points.length} ý</span>
          </div>
          {mode === 'one' ? (
            <>
              <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 12, lineHeight: 1.5, color: CL.ink5 }}>Xếp mỗi mạch về phía nó ủng hộ. Kéo một mạch vào ô «Thêm cặp» để tự ghép cặp. Bấm nhãn của một phát hiện để nói nó cùng phía hay ngược phía.</p>
              <CardRope units={units} chains={chains} onSide={moveUnit} onFinding={moveFinding} />
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 12, lineHeight: 1.5, color: CL.ink5 }}>{mode === 'only' ? 'Mỗi ô A giải quyết là một ý. Ý về phía nào tùy câu trả lời: cách khác có làm được mà không cần A không.' : 'Ô có cả A và B: bên thắng trong ô mang ý đó về phía mình. Ô chỉ có một bên: ý tự về phía bên đó.'}</p>
              {piles}
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ClLabel color={CL.ink}>Các mạch</ClLabel>
          {spec.questions.map((q) => {
            const mineQ = chains.filter((c) => (c.q || 1) === q.n);
            return (
              <div key={q.n} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ ...muted, fontWeight: 600, color: CL.ink7, marginTop: 6 }}>{CL_CIRC[q.n - 1]} {CL_SHAPE_LABEL[q.shape]} · {mineQ.length} mạch</span>
                {mineQ.map((c) => <ChainLine key={c.id} chain={c} />)}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  // ---- 0 · two drivers: the match-up in each cell ---------------------------------------------------------
  const duels = mode === 'two' ? duelsOf(points) : [];
  const byChain = (id?: string) => chains.find((c) => c.id === id);
  const seg = (opts: { v: string; label: string; s: Side | Win }[], cur: string | null | undefined, onPick: (v: string | null) => void, aria: string) => (
    <span role="group" aria-label={aria} style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(' + opts.length + ', minmax(0, 1fr))', minWidth: 280, border: '1px solid ' + CL.ink2, borderRadius: 11, overflow: 'hidden' }}>
      {opts.map((o, j) => {
        const on = cur === o.v, tn = tone(o.s);
        return <button key={o.v} type="button" className="cl-btn" aria-pressed={on} onClick={() => onPick(on ? null : o.v)}
          style={{ minHeight: 38, padding: '4px 10px', borderLeft: j ? '1px solid ' + CL.ink2 : 'none', background: on ? tn.soft : '#fff', color: on ? tn.text : CL.ink7, fontFamily: CL.sans, fontSize: 12.5, fontWeight: on ? 700 : 600 }}>{o.label}</button>;
      })}
    </span>
  );
  const reasonPills = (list: string[], cur: string | undefined, onPick: (v: string | undefined) => void) => (
    <div role="group" aria-label="Vì sao" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ ...muted, fontWeight: 600 }}>vì</span>
      {list.map((r) => <button key={r} type="button" className="cl-btn" aria-pressed={cur === r} onClick={() => onPick(cur === r ? undefined : r)} style={pillBtn(cur === r, { minHeight: 32, fontSize: 12 })}>{r}</button>)}
    </div>
  );
  const cellHead = (pt: Point) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={cellPill}>{pt.who}</span><span style={muted}>×</span><span style={cellPill}>{pt.what}</span>
    </div>
  );
  const drvLine = (k: 'A' | 'B', id?: string) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: DRV[k].solid, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700 }}>{k}</span>
      <span style={{ fontFamily: CL.serif, fontSize: 14.5, lineHeight: 1.45, color: id ? CL.ink : CL.ink4 }}>{id ? chainName(spec, byChain(id)).replace(/^[AB] · /, '') : k === 'B' ? 'Chưa có mạch B ở ô này' : ''}</span>
    </div>
  );
  const singles = mode === 'two' ? points.filter((p) => !p.duel && p.who).length : 0;
  const duelCard = mode === 'two' && duels.length > 0 && (
    <section style={card} aria-label="Đấu trong từng ô">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <ClLabel color={CL.ink}>0 · Đấu trong từng ô</ClLabel>
        <span style={muted}>Ô có cả mạch A và mạch B: cùng người, cùng vùng, nên cân thẳng được.{singles ? ' ' + singles + ' ô chỉ có một bên: ý tự về phía bên đó.' : ''}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {duels.map((pt) => {
          const k = pt.key.slice(5), v = pt.duel.cmp || { win: null, crit: [], why: '' };
          const why = normCrit(v.crit || [])[0];
          return (
            <div key={pt.key} style={{ borderRadius: 14, border: '1px solid ' + CL.ink2, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cellHead(pt)}
              {drvLine('A', pt.duel.a)}
              {drvLine('B', pt.duel.b)}
              <span style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: CL.ink }}>Với {pt.who}, về {pt.what.toLowerCase()}: bên nào nặng hơn?</span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {seg([{ v: 'A', label: VERDICT_WORDS.cmp.A, s: 'right' }, { v: '=', label: VERDICT_WORDS.cmp['='], s: '=' }, { v: 'B', label: VERDICT_WORDS.cmp.B, s: 'left' }], v.win, (w) => setCmp(k, { ...v, win: w as CellCmp['win'] }), 'Bên thắng ở ' + pt.who + ' × ' + pt.what)}
                {v.win && v.win !== '=' && reasonPills(REASONS.same, why, (r) => setCmp(k, { ...v, crit: r ? [r] : [] }))}
              </div>
              {v.win === '=' && <span style={muted}>Ngang nhau: ô này không về phía nào. Nó có thể thành câu «phạm vi» ở bước 2.</span>}
            </div>
          );
        })}
      </div>
    </section>
  );

  // ---- 1 · "only": does the alternative work without A? ----------------------------------------------------
  const cover = mode === 'only' ? points : [];
  const onlyCard = mode === 'only' && (
    <section style={card} aria-label="Cách khác có làm được không">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <ClLabel color={CL.ink}>1 · Cách khác có làm được không?</ClLabel>
        <span style={muted}>Với mỗi ô A giải quyết, hỏi: B có làm được mà không cần A? Chỉ cần một ô B đứng vững, «duy nhất» đã không còn đúng hoàn toàn.</span>
      </div>
      {!cover.length && <p style={{ margin: 0, ...muted, lineHeight: 1.5 }}>Viết ít nhất một mạch A ở bước ① để xét.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cover.map((pt) => {
          const k = pt.key.slice(5), v = pt.duel.cmp || { win: null, crit: [], why: '' };
          return (
            <div key={pt.key} style={{ borderRadius: 14, border: '1px solid ' + CL.ink2, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cellHead(pt)}
              {drvLine('A', pt.duel.a)}
              {drvLine('B', pt.duel.b)}
              <span style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: CL.ink }}>B có làm được việc này mà không cần A không?</span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {seg([{ v: 'B', label: VERDICT_WORDS.only.B, s: 'left' }, { v: '=', label: VERDICT_WORDS.only['='], s: 'left' }, { v: 'A', label: VERDICT_WORDS.only.A, s: 'right' }], v.win, (w) => setCmp(k, { ...v, win: w as CellCmp['win'] }), 'Cách khác ở ' + pt.who + ' × ' + pt.what)}
                {v.win && reasonPills(CMP_CRITERIA_ONLY, normCrit(v.crit || [])[0], (r) => setCmp(k, { ...v, crit: r ? [r] : [] }))}
              </div>
            </div>
          );
        })}
      </div>
      {cover.length > 0 && (
        <div style={{ marginTop: 12, borderRadius: 12, background: CL.panel, padding: '10px 14px', fontFamily: CL.sans, fontSize: 13, lineHeight: 1.5, color: CL.ink7 }}>
          B đứng vững ở <b>{cover.filter((p) => p.duel.cmp?.win === 'B').length}</b> ô, làm được một phần ở <b>{cover.filter((p) => p.duel.cmp?.win === '=').length}</b> ô, chỉ A xử lý được ở <b>{cover.filter((p) => p.duel.cmp?.win === 'A').length}</b> ô{cover.some((p) => !p.duel.cmp?.win) ? ', còn ' + cover.filter((p) => !p.duel.cmp?.win).length + ' ô chưa xét' : ''}.
        </div>
      )}
    </section>
  );

  // ---- 1 · pairs ----------------------------------------------------------------------------------------------
  const lefts = points.filter((p) => p.side === 'left'), rights = points.filter((p) => p.side === 'right');
  const [draft, setDraft] = useState<{ l?: string; r?: string }>({});
  const [dropOver, setDropOver] = useState<string | null>(null);
  const addPair = (l: string, r: string) => {
    if (pairs.some((p) => p.id === pairId(l, r))) { setDraft({}); return; }
    savePairs([...pairs, { id: pairId(l, r), l, r, win: null }]);
    setDraft({});
  };
  const putDraft = (s: 'l' | 'r', key: string) => {
    const pt = P(key);
    if (!pt || pt.side !== (s === 'l' ? 'left' : 'right')) return;
    const next = { ...draft, [s]: key };
    if (next.l && next.r) addPair(next.l, next.r); else setDraft(next);
  };
  const evidence = (pt: Point) => {
    const c = byChain(pt.chains[0]);
    const fs = (c?.findings || []).filter((f) => !f.empty && f.text.trim()).slice(0, 2);
    return fs.map((f) => <span key={f.id} style={{ fontFamily: CL.sans, fontSize: 11.5, lineHeight: 1.4, color: CL.ink6 }}><b style={{ fontWeight: 700 }}>{f.kind}:</b> {f.text.trim()}</span>);
  };
  const pairCard = (p: Pair, i: number) => {
    const l = P(p.l), r = P(p.r);
    if (!l || !r) return null;
    const rel = relOf(l, r);
    const box = (pt: Point, s: 'left' | 'right') => (
      <div style={{ flex: '1 1 200px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, borderRadius: 12, background: tone(s).soft, padding: '9px 12px' }}>
        <span style={{ fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: tone(s).text }}>{sideName(s)}</span>
        <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: CL.ink }}>{pt.name}</span>
        {pt.who && <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink5 }}>{pt.who} · {pt.what}</span>}
        {evidence(pt)}
      </div>
    );
    const frame = pairFrame(p, points);
    return (
      <div key={p.id} style={{ borderRadius: 14, border: '1px solid ' + (rel === 'none' ? '#E8D9A8' : CL.ink2), padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 700, color: CL.ink }}>Cặp {i + 1}</span>
          <span style={{ borderRadius: 6, padding: '2px 8px', background: rel === 'none' ? CL.yellowSoft : '#F1F1EE', color: rel === 'none' ? CL.yellowText : CL.ink7, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700 }}>{REL_LABEL[rel]}</span>
          <button type="button" className="cl-btn cl-del" onClick={() => savePairs(pairs.filter((x) => x.id !== p.id))} aria-label={'Bỏ cặp ' + (i + 1)} title="Bỏ cặp này" style={{ marginLeft: 'auto', width: 28, height: 28, display: 'grid', placeItems: 'center', color: CL.ink4 }}><ClIcon name="x" size={13} /></button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{box(l, 'left')}{box(r, 'right')}</div>
        {rel === 'none' && (
          <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 12, lineHeight: 1.5, color: CL.yellowText }}>
            Hai ý này khác người và khác vùng, nên khó cân thẳng. {r.who ? 'Ở ①, viết một mạch phía ' + L + ' ở ô «' + r.who + ' × ' + r.what + '» để gặp «' + r.name + '»' : 'Ở ①, viết thêm một mạch cùng người hoặc cùng vùng'}, hoặc bỏ cặp này.
          </p>
        )}
        <span style={{ fontFamily: CL.serif, fontSize: 15, lineHeight: 1.45, color: CL.ink }}>{pairQuestion(l, r)}</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {seg([{ v: 'left', label: L, s: 'left' }, { v: '=', label: 'Ngang', s: '=' }, { v: 'right', label: R, s: 'right' }], p.win, (w) => editPair(p.id, { win: w as Win | null }), 'Bên nặng hơn ở cặp ' + (i + 1))}
          {p.win && reasonPills(REASONS[rel], p.why, (why) => editPair(p.id, { why }))}
        </div>
        {p.why === TUY_NGUOI && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={p.who?.r || ''} onChange={(e) => editPair(p.id, { who: { ...(p.who || {}), r: e.target.value.slice(0, 80) } })} aria-label={'Ai cần «' + r.name + '» hơn?'} placeholder={'Ai cần «' + r.name + '» hơn?'} style={{ ...input, flex: '1 1 220px' }} />
            <input value={p.who?.l || ''} onChange={(e) => editPair(p.id, { who: { ...(p.who || {}), l: e.target.value.slice(0, 80) } })} aria-label={'Ai cần «' + l.name + '» hơn?'} placeholder={'Ai cần «' + l.name + '» hơn?'} style={{ ...input, flex: '1 1 220px' }} />
          </div>
        )}
        {p.win && <span style={{ ...muted, lineHeight: 1.5 }}>Khung: {frame}</span>}
      </div>
    );
  };
  const draftSlot = (s: 'l' | 'r') => {
    const list = s === 'l' ? lefts : rights, id = 'draft-' + s;
    return (
      <div onDragOver={(e) => { e.preventDefault(); setDropOver(id); }} onDragLeave={() => setDropOver((d) => (d === id ? null : d))}
        onDrop={(e) => { e.preventDefault(); setDropOver(null); const k = e.dataTransfer.getData('text/plain'); if (k) putDraft(s, k); }}
        style={{ flex: '1 1 220px', minWidth: 0, borderRadius: 12, border: '1.5px dashed ' + (dropOver === id ? CL.ink : CL.ink2), background: dropOver === id ? CL.panel : '#fff', padding: 6 }}>
        <select value={draft[s] || ''} onChange={(e) => e.target.value && putDraft(s, e.target.value)} aria-label={'Ý phía ' + sideName(s === 'l' ? 'left' : 'right')} style={{ ...input, width: '100%', border: 'none' }}>
          <option value="">{'Chọn hoặc kéo một ý phía ' + sideName(s === 'l' ? 'left' : 'right')}</option>
          {list.map((pt) => <option key={pt.key} value={pt.key}>{pt.name}{pt.who ? ' (' + pt.who + ' · ' + pt.what + ')' : ''}</option>)}
        </select>
      </div>
    );
  };
  const pairsCard = (mode === 'one' || mode === 'two') && (
    <section style={card} aria-label="Ghép cặp">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <ClLabel color={CL.ink}>1 · Ghép cặp</ClLabel>
        <span style={muted}>Mỗi cặp là hai ý gặp nhau: cùng người hoặc cùng vùng. Trả lời câu hỏi của từng cặp. Một ý có thể ở nhiều cặp.</span>
        {plan.pairs && <button type="button" className="cl-btn cl-link" onClick={() => set({ pairs: undefined, paras: undefined })} style={{ marginLeft: 'auto', ...muted, fontWeight: 600 }}>Ghép lại theo gợi ý</button>}
      </div>
      {!lefts.length || !rights.length ? (
        <p style={{ margin: 0, ...muted, lineHeight: 1.5 }}>
          {!lefts.length && !rights.length ? 'Chưa có ý nào ở hai phía.' : 'Chỉ có ý ở phía ' + sideName(lefts.length ? 'left' : 'right') + ', nên chưa có gì để ghép cặp. Dàn bài sẽ dùng thẳng các ý này. Muốn có nhượng bộ, viết thêm một mạch phía ' + sideName(lefts.length ? 'right' : 'left') + ' ở ①.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pairs.map(pairCard)}
          {!pairs.length && <p style={{ margin: 0, ...muted, lineHeight: 1.5 }}>Không có hai ý nào cùng người hay cùng vùng. Tự ghép ở dưới, hoặc viết thêm mạch ở ①.</p>}
          {plan.pairs && suggestPairs(points).some((s) => !pairs.some((p) => p.id === s.id)) && <span style={muted}>Có cặp gợi ý bạn chưa dùng: bấm «Ghép lại theo gợi ý» để xem.</span>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderRadius: 14, background: '#FAFAF8', padding: '10px 12px' }}>
            <span style={{ fontFamily: CL.sans, fontSize: 12.5, fontWeight: 700, color: CL.ink7 }}>Thêm cặp</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>{draftSlot('l')}<span style={muted}>với</span>{draftSlot('r')}</div>
          </div>
        </div>
      )}
    </section>
  );

  // ---- 2 · the position ------------------------------------------------------------------------------------
  const hints = vq ? scopeHints(spec, chains, points, pairs) : [];
  const ready = t.left + t.right + t.eq > 0;
  const si = sideItems(board, lean);
  const frame = [
    si.theirs[0] && lean !== 'L2' && lean !== 'R2' && 'Mặc dù «' + itemLead(si.theirs[0], board) + '»',
    lean && (lean === '0' ? 'tôi thấy hai phía cân bằng' : 'tôi ' + leanLabel(spec, lean).toLowerCase()),
    si.mine[0] && 'vì «' + si.mine.slice(0, 2).map((it) => itemLead(it, board)).join('» và «') + '»',
    plan.scope && plan.scope.trim() && 'với điều kiện ' + plan.scope.trim(),
  ].filter(Boolean).join(', ');
  const tallyText = t.byPairs
    ? R + ' thắng ' + t.right + ' ý, ' + L + ' thắng ' + t.left + ' ý' + (t.eq ? ', ' + t.eq + ' cặp ngang' : '') + (t.open ? ', ' + t.open + ' chỗ chưa cân' : '') + '.'
    : R + ': ' + t.right + ' ý, ' + L + ': ' + t.left + ' ý' + (t.open ? ', ' + t.open + ' ý chưa xét' : '') + '.';

  const positionCard = vq && (
    <section style={{ ...card, opacity: ready ? 1 : 0.6 }} aria-label="Lập trường">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <ClLabel color={CL.ink}>2 · Lập trường</ClLabel>
        <span style={muted}>{ready ? (mode === 'only' ? 'Mỗi ô là một ý' : 'Mỗi ý chỉ tính một lần, dù ở nhiều cặp') : mode === 'only' ? 'Mở khi có ít nhất một ô đã xét' : 'Mở khi có ít nhất một cặp đã cân'}</span>
      </div>
      {ready && (
        <>
          <div style={{ margin: '4px 0 6px', borderRadius: 12, background: CL.panel, padding: '10px 14px', fontFamily: CL.sans, fontSize: 13, lineHeight: 1.5, color: CL.ink7 }}>{tallyText}</div>
          <Slot label="Nghiêng về">
            {LEANS.map((l) => <button key={l} type="button" className="cl-btn" aria-pressed={lean === l} onClick={() => set({ lean: l, paras: undefined, layout: undefined })} style={pillBtn(lean === l)}>{leanLabel(spec, l)}{l === sLean && lean !== l ? ' · gợi ý' : ''}</button>)}
          </Slot>
          <Slot label="Phạm vi" note="điều kiện để lập trường đúng">
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hints.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {hints.map((h) => <button key={h.text} type="button" className="cl-btn" aria-pressed={plan.scope === h.text} title={'Từ ' + h.from} onClick={() => set({ scope: plan.scope === h.text ? '' : h.text })} style={pillBtn(plan.scope === h.text, { textAlign: 'left' })}>{h.text}</button>)}
                </div>
              )}
              <input value={plan.scope || ''} onChange={(e) => set({ scope: e.target.value.slice(0, 200) })} aria-label="Phạm vi" placeholder={hints.length ? 'Hoặc tự viết điều kiện khác…' : 'Đúng khi… / trừ khi… (gợi ý hiện khi có cặp «tùy người» hoặc phát hiện Scope)'} style={input} />
            </div>
          </Slot>
          <div style={{ marginTop: 6, paddingTop: 14, borderTop: '1px solid ' + CL.ink1 }}>
            <label htmlFor="cl-stance" style={{ display: 'block', marginBottom: 4 }}><ClLabel color={CL.ink}>Câu lập trường</ClLabel></label>
            {frame && <p style={{ margin: '0 0 8px', fontFamily: CL.sans, fontSize: 12, lineHeight: 1.5, color: CL.ink5 }}>Khung: {frame}.</p>}
            <textarea id="cl-stance" className="cl-ta" value={stance} onChange={(e) => setStance(e.target.value)} rows={2} placeholder="Viết câu lập trường bằng tiếng Anh theo khung trên. Câu này mở và kết bài."
              style={{ display: 'block', width: '100%', minHeight: 60, boxSizing: 'border-box', resize: 'none', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', padding: '12px 16px', fontFamily: CL.serif, fontSize: 16, lineHeight: 1.55, color: CL.ink, outline: 'none', fieldSizing: 'content' } as React.CSSProperties} />
          </div>
        </>
      )}
    </section>
  );

  // ---- 3 · the outline -------------------------------------------------------------------------------------
  const [moving, setMoving] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  /** Moves an item (or, `c:` + id, a chain of another question) to a paragraph or out of the essay. */
  const place = (id: string, to: string) => {
    const chain = id.startsWith('c:') ? id.slice(2) : null;
    const next = paras.map((p) => (chain ? { ...p, chains: p.chains.filter((x) => x !== chain) } : { ...p, items: (p.items || []).filter((x) => x !== id) }));
    const k = next.findIndex((p) => p.id === to);
    if (k >= 0) next[k] = chain ? { ...next[k], chains: [...next[k].chains, chain] } : { ...next[k], items: [...(next[k].items || []), id] };
    set({ paras: next.map((p) => ({ ...p, items: p.items || [] })), layout });
    setMoving(null);
  };
  const addPara = () => { const n = paras.length + 1; set({ paras: [...paras.map((p) => ({ ...p, items: p.items || [] })), { id: 'body' + Date.now().toString(36), job: 'Đoạn ' + n, chains: [], items: [] }], layout }); };
  const removePara = (id: string) => set({ paras: paras.filter((p) => p.id !== id).map((p) => ({ ...p, items: p.items || [] })), layout });
  const chipShell = (id: string, where: string, labelText: string, body: React.ReactNode) => {
    const on = moving === id;
    return (
      <span key={id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <button type="button" className="cl-btn" draggable onDragStart={(e) => { e.dataTransfer.setData('application/x-item', id); e.dataTransfer.effectAllowed = 'move'; setMoving(id); }} onDragEnd={() => { setMoving(null); setDragOver(null); }}
          onClick={() => setMoving(on ? null : id)} aria-pressed={on} aria-label={labelText + ' · bấm để chuyển sang đoạn khác'}
          style={{ flex: 1, minWidth: 0, minHeight: 40, display: 'flex', alignItems: 'flex-start', gap: 8, textAlign: 'left', borderRadius: 10, border: '1px solid ' + (on ? CL.ink : CL.ink2), background: on ? '#F4F4F1' : '#fff', padding: '8px 12px', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: CL.ink, cursor: 'grab' }}>
          <span aria-hidden="true" style={{ color: CL.ink4, paddingTop: 2 }}><ClIcon name="grip" size={13} /></span>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>{body}</span>
        </button>
        {where !== 'out' && <button type="button" className="cl-btn cl-del" onClick={() => place(id, 'out')} aria-label={'Để ' + labelText + ' ngoài bài'} title="Để ngoài bài" style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', color: CL.ink4 }}><ClIcon name="x" size={13} /></button>}
      </span>
    );
  };
  const itemChip = (it: string, where: string) => {
    const pr = pairs.find((p) => p.id === it);
    const pts = itemPoints(it, board);
    const text = pr ? (pr.win === '=' || !pr.win ? '«' + (P(pr.r)?.name || '') + '» ⇄ «' + (P(pr.l)?.name || '') + '»' : '«' + itemLead(it, board) + '» thắng') : pts[0]?.name || '';
    const tag = pr ? 'Cặp ' + (pairs.indexOf(pr) + 1) + (pr.win ? '' : ' · chưa cân') : pts[0]?.side ? sideName(pts[0].side) : 'chưa xét';
    return chipShell(it, where, text, (
      <>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}><span>{text}</span><span style={{ fontSize: 10.5, fontWeight: 700, color: CL.ink5 }}>{tag}</span></span>
        <span style={{ fontWeight: 500, fontSize: 11.5, lineHeight: 1.4, color: CL.ink6 }}>{itemFrame(spec, it, board)}</span>
      </>
    ));
  };
  const chainChip = (c: Chain, where: string) => {
    const st = chainStatus(spec, c);
    return chipShell('c:' + c.id, where, chainName(spec, c), (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ flex: 1, minWidth: 0 }}>{chainName(spec, c)}</span><span style={{ flexShrink: 0, borderRadius: 6, padding: '2px 8px', background: st.bg, color: st.fg, fontSize: 10.5, fontWeight: 700 }}>{st.label}</span></span>
    ));
  };
  const dropZone = (id: string) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (dragOver !== id) setDragOver(id); },
    onDragLeave: () => setDragOver((d) => (d === id ? null : d)),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); const it = e.dataTransfer.getData('application/x-item'); setDragOver(null); if (it) place(it, id); },
  });
  const putHere = (id: string, has: boolean) => moving && !has && (
    <button type="button" className="cl-btn" onClick={() => place(moving, id)} style={{ minHeight: 38, borderRadius: 10, border: '1.5px dashed ' + CL.ink, background: '#fff', padding: '8px 12px', textAlign: 'left', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: CL.ink }}>Đặt vào đây</button>
  );
  const scopeTxt = plan.scope && plan.scope.trim();
  const outItems = vq ? leftOutItems(board, paras) : [];
  const outChains = leftOutChains(spec, chains, paras);
  const ownChains = (p: OutlinePara) => p.chains.filter((id) => { const c = byChain(id); return c && shapeOf(spec, c) !== 'verdict'; }).map(byChain);

  const outlineCard = (
    <section style={card} aria-label="Dàn bài">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <ClLabel color={CL.ink}>{vq ? '3 · ' : ''}Dàn bài</ClLabel>
        <span style={muted}>Cặp bạn thắng thành lý do, cặp bên kia thắng thành nhượng bộ · kéo, hoặc bấm rồi bấm «Đặt vào đây»</span>
        {plan.paras && <button type="button" className="cl-btn cl-link" onClick={() => set({ paras: undefined })} style={{ marginLeft: 'auto', ...muted, fontWeight: 600 }}>Xếp lại theo gợi ý</button>}
      </div>
      {layoutsFor(spec).length > 1 && (
        <div role="group" aria-label="Kiểu bài" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ ...muted, marginRight: 4 }}>Kiểu bài</span>
          {layoutsFor(spec).map((l) => <button key={l} type="button" className="cl-btn" aria-pressed={layout === l} onClick={() => set({ layout: l, paras: undefined })} style={pillBtn(layout === l)}>{LAYOUT_LABEL[l]}</button>)}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AutoPara title="Mở bài" note={vq ? 'tự điền từ câu lập trường' : 'giới thiệu đề và các ý sẽ bàn'} text={vq ? (stance.trim() ? 'Viết lại đề + “' + stance.trim() + '”' : 'Viết lại đề + câu lập trường (chưa viết).') : 'Viết lại đề + nói bài sẽ bàn ' + spec.questions.map((q) => CL_SHAPE_LABEL[q.shape].toLowerCase()).join(' và ') + '.'} />
        {paras.map((p, i) => {
          const items = p.items || [], own = ownChains(p);
          const n = items.length + own.length;
          const over = dragOver === p.id;
          return (
            <div key={p.id} {...dropZone(p.id)} style={{ borderRadius: 14, border: (over ? '1.5px dashed ' : '1px solid ') + (over ? CL.ink : CL.border), background: over ? CL.panel : '#fff', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, transition: 'background .15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 700, color: CL.ink }}>Thân {i + 1}</span>
                <span style={{ borderRadius: 6, padding: '2px 8px', background: '#F1F1EE', color: CL.ink7, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.job}</span>
                {items.length > 2 && <span style={{ fontFamily: CL.sans, fontSize: 11.5, color: CL.yellowText }}>{items.length} mục: đoạn 90 từ chỉ nên có 1–2</span>}
                {paras.length > 1 && !n && <button type="button" className="cl-btn cl-del" onClick={() => removePara(p.id)} aria-label={'Xoá Thân ' + (i + 1)} style={{ marginLeft: 'auto', width: 28, height: 28, display: 'grid', placeItems: 'center', color: CL.ink4 }}><ClIcon name="trash" size={13} /></button>}
              </div>
              {items.map((it) => itemChip(it, p.id))}
              {own.map((c) => chainChip(c, p.id))}
              {!n && !moving && <span style={{ borderRadius: 10, border: '1.5px dashed ' + CL.ink2, padding: '9px 12px', fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>{vq ? 'Kéo một cặp hoặc một ý vào đây' : 'Kéo một mạch vào đây'}</span>}
              {putHere(p.id, items.includes(moving) || own.some((c) => 'c:' + c.id === moving))}
            </div>
          );
        })}
        <button type="button" className="cl-btn cl-link" onClick={addPara} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, ...muted, fontWeight: 600 }}><ClIcon name="plus" size={12} />Thêm đoạn thân bài</button>
        <AutoPara title="Kết bài" note="tự điền" text={vq ? 'Nhắc lại lập trường' + (scopeTxt ? ' + phạm vi: “' + scopeTxt + '”.' : '.') : 'Tóm lại các ý chính, không thêm ý mới.'} />
      </div>

      <div {...dropZone('out')} style={{ marginTop: 16, borderRadius: 14, border: (dragOver === 'out' ? '1.5px dashed ' + CL.ink : '1px dashed ' + CL.ink3), background: dragOver === 'out' ? CL.panel : '#FCFCFB', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <ClLabel color={CL.ink}>Để ngoài bài</ClLabel>
          <span style={muted}>Bài 250 chữ chỉ chứa được 3–4 ý. Bỏ bớt là bình thường: chúng đã giúp bạn nghĩ.</span>
        </div>
        {outItems.map((it) => itemChip(it, 'out'))}
        {outChains.map((c) => chainChip(c, 'out'))}
        {!outItems.length && !outChains.length && !moving && <span style={muted}>Không có gì bị để ngoài.</span>}
        {putHere('out', outItems.includes(moving) || outChains.some((c) => 'c:' + c.id === moving))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
        <span style={muted}>Sang bước Viết, mỗi khung thành một đoạn, mạch và câu khung của nó nằm sẵn bên cạnh.</span>
        <button type="button" className="cl-btn cl-primary" onClick={() => onWrite(paras)} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, borderRadius: 12, background: CL.ink, color: '#fff', padding: '0 18px', fontFamily: CL.sans, fontSize: 13, fontWeight: 600 }}>Sang ③ Viết<ClIcon name="right" size={13} /></button>
      </div>
    </section>
  );

  return (
    <div className="cl-scroll" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1710, margin: '0 auto', padding: '12px 40px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 42, paddingBottom: 12, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <button type="button" className="cl-btn cl-link" onClick={onBack} style={backLinkStyle}><ClIcon name="left" size={14} />Các mạch</button>
            {nav}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
          <div className="cl-scroll" style={{ flex: '1 1 400px', minWidth: 0, maxWidth: 640, position: 'sticky', top: 0, maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>{left}</div>
          <div style={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {duelCard}
            {onlyCard}
            {pairsCard}
            {positionCard}
            {outlineCard}
          </div>
        </div>
      </div>
    </div>
  );
}

function Slot({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: '1px solid ' + CL.ink1, flexWrap: 'wrap' }}>
      <div style={{ flex: '0 0 120px', display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 7 }}>
        <span style={{ fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: CL.ink7 }}>{label}</span>
        {note && <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>{note}</span>}
      </div>
      <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
    </div>
  );
}

function AutoPara({ title, note, text }: { title: string; note: string; text: string }) {
  return (
    <div style={{ borderRadius: 14, border: '1px dashed ' + CL.ink3, background: '#FAFAF8', padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 700, color: CL.ink }}>{title}</span>
        <span style={{ fontFamily: CL.sans, fontSize: 11.5, color: CL.ink5 }}>{note}</span>
      </div>
      <div style={{ fontFamily: CL.serif, fontSize: 14.5, lineHeight: 1.55, color: CL.ink7 }}>{text}</div>
    </div>
  );
}

/** A chain in the left list of a prompt without a verdict question. */
function ChainLine({ chain }: { chain: Chain }) {
  const spec = useSpec();
  const st = chainStatus(spec, chain);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10, border: '1px solid ' + CL.ink2, padding: '8px 12px' }}>
      <span style={{ flex: 1, minWidth: 0, fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: CL.ink }}>{chainName(spec, chain)}</span>
      <span style={{ flexShrink: 0, borderRadius: 6, padding: '2px 8px', background: st.bg, color: st.fg, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700 }}>{st.label}</span>
    </div>
  );
}
