'use client';

import { useMemo, useState } from 'react';
import { CL, CL_CIRC, CL_SHAPE_LABEL } from './constants';
import { DRV, isCompare, type MapExtras } from './ideamap';
import { chainStatus, ropeUnits, shapeOf, sidesOf, verdictStatus } from './model';
import {
  areaOf, buildOutline, chainName, chainSide, cleanParas, critChains, CRIT_Q, CRITERIA, decisive, defaultLayout, finalSide, LAYOUT_LABEL, layoutsFor, leanLabel, leanSide, leftOut,
  mapTally, sideChains, scopeHints, suggestedLean, suggestedSide, tally, type CritWeigh, type Layout, type Lean, type OutlinePara, type Plan, type Win,
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

/**
 * Screen ② "Cân" of "Viết tự do": the prompt and the rope in one box; a table that compares the two sides criterion
 * by criterion (any area against any area); the position, picked from what the table shows; and the outline, one
 * box per paragraph.
 */
export function WeighScreen(props: WeighScreenProps) {
  const base = useSpec();
  const { extras } = props;
  const rival = (extras && base.questions.map((x) => extras[x.n]?.rival).find(Boolean)) || '';
  const spec = useMemo(() => (rival && base.claim ? { ...base, driver2: rival } : base), [base, rival]);
  return <SpecProvider value={spec}><Weigh {...props} /></SpecProvider>;
}

function Weigh({ chains, setChains, extras, stance, setStance, plan, setPlan, onBack, onWrite, nav }: WeighScreenProps) {
  const spec = useSpec();
  const vq = spec.questions.find((q) => q.shape === 'verdict');
  const compare = !!vq && isCompare(spec, vq);
  const [L, R] = sidesOf(spec);
  const sideName = (s: Side | Win) => (s === 'right' ? R : s === 'left' ? L : 'Ngang nhau');
  const set = (p: Partial<Plan>) => setPlan({ ...plan, ...p });
  const byId = (id: string) => chains.find((c) => c.id === id);
  const name = (c: Chain) => chainName(spec, c);

  const t = tally(plan);
  const sugg = suggestedSide(tally(plan, decisive(plan)));
  const [picked, setPicked] = useState<string | null>(null);
  const [dragRow, setDragRow] = useState<string | null>(null);
  const [rowMsg, setRowMsg] = useState<{ k: string; text: string } | null>(null);
  const side = finalSide(plan);
  const lean = plan.lean ?? suggestedLean(plan);
  const my: 'left' | 'right' = leanSide(lean) || (side === 'left' ? 'left' : 'right');
  const other = my === 'right' ? 'left' : 'right';
  const mine = vq ? sideChains(spec, chains, my, plan) : [];
  const theirs = vq ? sideChains(spec, chains, other, plan) : [];
  const main = (plan.main || []).filter((id) => mine.some((c) => c.id === id));
  const effMain = main.length ? main : mine.slice(0, 1).map((c) => c.id);
  const conc = plan.concession && theirs.some((c) => c.id === plan.concession) ? plan.concession : theirs[0]?.id || null;
  const eff: Plan = { ...plan, lean, main: effMain, concession: conc };
  const layout: Layout = plan.layout && layoutsFor(spec).includes(plan.layout) ? plan.layout : defaultLayout(spec, lean);
  const paras = plan.paras ? cleanParas(plan.paras, chains) : buildOutline(spec, chains, eff, layout);
  const out = leftOut(spec, chains, paras);
  const tone = (s: Win | null) => (s === 'right' ? (compare ? DRV.A : { soft: CL.mintSoft, text: CL.greenText, solid: CL.green }) : s === 'left' ? (compare ? DRV.B : { soft: '#F1F1EE', text: '#3D3D3A', solid: CL.ink5 }) : { soft: '#F7F7F4', text: CL.ink6, solid: CL.ink4 });
  // ---- the prompt and the rope, in one box ----------------------------------------------------------------
  const units = ropeUnits(spec, chains);
  const moveUnit = (u: RopeUnit, s: Side) => setChains((cs) => cs.map((c) => {
    if (c.id !== u.chainId) return c;
    const r = u.ref;
    if (r.type === 'branch') return { ...c, split: { ...c.split, branches: c.split.branches.map((b, j) => (j === r.k ? { ...b, side: s } : b)) } };
    return { ...c, side: s };
  }));
  const moveFinding = (chainId: string, fid: string, s: Side) => setChains((cs) => cs.map((c) => (c.id === chainId ? { ...c, findings: c.findings.map((f) => (f.id === fid ? { ...f, side: s } : f)) } : c)));
  const placed = vq ? chains.filter((c) => shapeOf(spec, c) === 'verdict' && chainSide(c)) : [];
  const areas = new Set(placed.map(areaOf).filter(Boolean));

  const left = (
    <section style={{ ...card, padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Đề bài và dây kéo">
      <PromptBlock bare />
      <div style={{ height: 1, background: CL.ink1 }} />
      {vq ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <ClLabel color={CL.ink}>Dây kéo</ClLabel>
            <span style={muted}>{placed.length} mạch{areas.size ? ', ' + areas.size + ' vùng' : ''}</span>
          </div>
          <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 12, lineHeight: 1.5, color: CL.ink5 }}>Xếp mỗi mạch về phía nó ủng hộ. Bấm vào nhãn của một phát hiện để nói nó ủng hộ mạch hay ngược phía: nhãn <Status label="Giữ hướng" /> hay <Status label={'Phụ thuộc "nếu"'} /> của mạch tính từ đó.</p>
          <CardRope units={units} chains={chains} onSide={moveUnit} onFinding={moveFinding} picked={picked} onPick={setPicked} />
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

  // ---- 1 · the criterion table ------------------------------------------------------------------------------
  const setCrit = (k: string, v: CritWeigh) => set({ crit: { ...(plan.crit || {}), [k]: { win: v.win, chains: critChains(v) } } });
  const mt = vq ? mapTally(spec, chains, extras?.[vq.n]) : null;
  const dec = decisive(plan);
  const dt = tally(plan, dec);
  const wonBy = (s: 'left' | 'right', keys: string[]) => keys.filter((k) => plan.crit?.[k]?.win === s).map((k) => k.toLowerCase());
  const nPlaced = vq ? sideChains(spec, chains, 'left', plan).length + sideChains(spec, chains, 'right', plan).length : 0;
  const filled = CRITERIA.filter((k) => plan.crit?.[k]?.win);
  const picking = !!picked;
  /** Puts a chain into a row; an empty row takes the chain's side, a row of the other side refuses it. */
  const drop = (k: string, chainId: string) => {
    const c = byId(chainId), cs = c ? chainSide(c) : null;
    setPicked(null);
    if (!c || (cs !== 'left' && cs !== 'right')) { setRowMsg({ k, text: 'Xếp mạch này lên dây kéo trước.' }); return; }
    const v = plan.crit?.[k] || { win: null };
    if (v.win && v.win !== '=' && v.win !== cs) { setRowMsg({ k, text: 'Mạch này ở phía ' + sideName(cs) + ', hàng này đang chọn ' + sideName(v.win) + '.' }); return; }
    const list = critChains(v);
    setRowMsg(null);
    if (!list.includes(chainId)) setCrit(k, { win: v.win || cs, chains: [...list, chainId] });
  };

  const weighCard = vq && (
    <section style={card} aria-label="So sánh theo tiêu chí">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <ClLabel color={CL.ink}>1 · So sánh theo tiêu chí</ClLabel>
        <span style={muted}>Chọn phía mạnh hơn, rồi kéo mạch từ dây kéo vào hàng đó (hoặc bấm tên mạch, rồi bấm hàng). Một hàng có thể có nhiều mạch.</span>
      </div>
      {mt && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '6px 0 4px', borderRadius: 12, background: CL.panel, padding: '9px 12px', fontFamily: CL.sans, fontSize: 12.5, color: CL.ink7 }}>
          <span style={{ fontWeight: 600, color: CL.ink }}>Từ bản đồ:</span>
          <span style={{ color: DRV.A.text, fontWeight: 700 }}>A hơn {mt.a} ô</span>·<span>ngang {mt.eq}</span>·<span style={{ color: DRV.B.text, fontWeight: 700 }}>B hơn {mt.b} ô</span>
          <button type="button" className="cl-btn cl-link" onClick={onBack} style={{ marginLeft: 'auto', ...muted, fontWeight: 600 }}>Mở lại bản đồ</button>
        </div>
      )}
      {nPlaced === 0 ? (
        <p style={{ margin: '10px 0 0', ...muted, lineHeight: 1.5 }}>Xếp ít nhất một mạch lên dây kéo để so sánh.</p>
      ) : (
        <div role="table" aria-label="Bảng so sánh" style={{ marginTop: 6 }}>
          <div role="row" style={critRow}>
            <span role="columnheader" style={{ ...muted, fontWeight: 600 }}>Tiêu chí</span>
            <span role="columnheader" style={{ ...muted, fontWeight: 600 }}>Phía mạnh hơn</span>
            <span role="columnheader" style={{ ...muted, fontWeight: 600 }}>Nhờ mạch</span>
          </div>
          {CRITERIA.map((k) => {
            const v = plan.crit?.[k] || { win: null };
            const list = critChains(v).map(byId).filter(Boolean);
            const over = dragRow === k;
            const msg = rowMsg && rowMsg.k === k ? rowMsg.text : '';
            return (
              <div key={k} role="row" style={{ ...critRow, borderTop: '1px solid ' + CL.ink1 }}>
                <span role="cell" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 700, color: CL.ink }}>{k}</span>
                  <span style={{ fontFamily: CL.sans, fontSize: 11.5, lineHeight: 1.35, color: CL.ink5 }}>{CRIT_Q[k]}</span>
                </span>
                <span role="cell">
                  <span role="group" aria-label={k} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', border: '1px solid ' + CL.ink2, borderRadius: 11, overflow: 'hidden' }}>
                    {(['right', '=', 'left'] as Win[]).map((w, j) => {
                      const on = v.win === w, tn = tone(w);
                      // Changing the side keeps only the chains that still fit it.
                      const keep = (x: string) => { const c = byId(x); return w === '=' || (c && chainSide(c) === w); };
                      return <button key={w} type="button" className="cl-btn" aria-pressed={on} onClick={() => { setRowMsg(null); setCrit(k, on ? { win: null, chains: [] } : { win: w, chains: critChains(v).filter(keep) }); }}
                        style={{ minHeight: 38, padding: '4px 6px', borderLeft: j ? '1px solid ' + CL.ink2 : 'none', background: on ? tn.soft : '#fff', color: on ? tn.text : CL.ink7, fontFamily: CL.sans, fontSize: 12.5, fontWeight: on ? 700 : 600 }}>{w === '=' ? 'Ngang' : sideName(w)}</button>;
                    })}
                  </span>
                </span>
                <span role="cell"
                  onDragOver={(e) => { e.preventDefault(); if (dragRow !== k) setDragRow(k); }}
                  onDragLeave={() => setDragRow((d) => (d === k ? null : d))}
                  onDrop={(e) => { e.preventDefault(); setDragRow(null); const id = e.dataTransfer.getData('application/x-chain'); if (id) drop(k, id); }}
                  style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, minHeight: 40, boxSizing: 'border-box', borderRadius: 10, border: (list.length && !over ? '1px solid ' : '1.5px dashed ') + (over || picking ? CL.ink : CL.ink2), background: over ? CL.panel : '#fff', padding: 4 }}>
                  {list.map((c) => (
                    <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, maxWidth: '100%', borderRadius: 8, background: tone(chainSide(c) as Win).soft, color: tone(chainSide(c) as Win).text, padding: '4px 4px 4px 10px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600 }}>
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name(c)}</span>
                      <button type="button" className="cl-btn cl-del" onClick={() => setCrit(k, { win: v.win, chains: critChains(v).filter((x) => x !== c.id) })} aria-label={'Bỏ ' + name(c) + ' khỏi ' + k} style={{ width: 22, height: 22, display: 'grid', placeItems: 'center' }}><ClIcon name="x" size={11} /></button>
                    </span>
                  ))}
                  {picking ? (
                    <button type="button" className="cl-btn" onClick={() => drop(k, picked)} style={{ flex: '1 1 auto', minHeight: 30, borderRadius: 8, padding: '4px 10px', textAlign: 'left', fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: CL.ink }}>Đặt «{name(byId(picked))}» vào đây</button>
                  ) : !list.length && <span style={{ padding: '0 8px', fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>Kéo mạch vào đây</span>}
                  {msg && <span role="status" style={{ flexBasis: '100%', padding: '2px 8px', fontFamily: CL.sans, fontSize: 11.5, color: CL.redText }}>{msg}</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {filled.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 14, borderTop: '1px solid ' + CL.ink1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 700, color: CL.ink }}>Tiêu chí nào quyết định lập trường của bạn?</span>
            <span style={muted}>Chọn một hoặc vài tiêu chí. Chưa chọn thì tính cả bảng.</span>
          </div>
          <div role="group" aria-label="Tiêu chí quyết định" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {filled.map((k) => {
              const on = (plan.decide || []).includes(k), w = plan.crit[k].win;
              return <button key={k} type="button" className="cl-btn" aria-pressed={on} onClick={() => set({ decide: on ? (plan.decide || []).filter((x) => x !== k) : [...(plan.decide || []), k], paras: undefined })} style={pillBtn(on)}>{k} → {w === '=' ? 'ngang' : sideName(w)}</button>;
            })}
          </div>
          {sugg && (
            <div style={{ borderRadius: 12, background: tone(sugg).soft, padding: '11px 14px', fontFamily: CL.sans, fontSize: 13.5, lineHeight: 1.5, color: tone(sugg).text }}>
              <span style={{ fontWeight: 500 }}>{(plan.decide || []).some((k) => filled.includes(k)) ? 'Theo ' + dec.length + ' tiêu chí bạn chọn: ' : 'Theo cả bảng (' + dec.length + ' tiêu chí): '}</span>
              {sugg === '=' ? <b>hai phía ngang nhau.</b> : <><b>nghiêng về {sideName(sugg)}</b>{wonBy(sugg, dec).length ? ', mạnh hơn ở ' + wonBy(sugg, dec).join(', ') : ''}.{wonBy(sugg === 'right' ? 'left' : 'right', dec).length ? ' ' + sideName(sugg === 'right' ? 'left' : 'right') + ' hơn ở ' + wonBy(sugg === 'right' ? 'left' : 'right', dec).join(', ') + '.' : ''}</>}
              {dt.eq > 0 && ' Ngang ở ' + dt.eq + ' tiêu chí.'}
            </div>
          )}
          {(plan.decide || []).some((k) => filled.includes(k)) && (
            <textarea value={plan.why || ''} onChange={(e) => set({ why: e.target.value.slice(0, 600) })} rows={2} aria-label="Vì sao những tiêu chí này quyết định" placeholder="Những tiêu chí này quan trọng hơn phần còn lại vì…" style={areaText} />
          )}
        </div>
      )}
    </section>
  );

  // ---- ② the position ------------------------------------------------------------------------------------
  const hints = vq ? scopeHints(spec, chains) : [];
  const sLean = suggestedLean(plan);
  const ready = !!side;
  const toggleMain = (id: string) => {
    const cur = effMain;
    set({ main: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-2), paras: undefined });
  };
  const frame = [
    conc && 'Mặc dù «' + name(byId(conc)) + '»',
    lean && (lean === '0' ? 'tôi thấy hai phía cân bằng' : 'tôi ' + leanLabel(spec, lean).toLowerCase()),
    effMain.length && 'vì «' + effMain.map((id) => name(byId(id))).join('» và «') + '»',
    plan.scope && plan.scope.trim() && 'với điều kiện ' + plan.scope.trim(),
  ].filter(Boolean).join(', ');

  const positionCard = vq && (
    <section style={{ ...card, opacity: ready ? 1 : 0.6 }} aria-label="Lập trường">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <ClLabel color={CL.ink}>2 · Lập trường</ClLabel>
        <span style={muted}>{ready ? 'Chọn từ gợi ý, không viết từ đầu' : 'Mở khi bảng có ít nhất một tiêu chí'}</span>
      </div>
      {ready && (
        <>
          <Slot label="Nghiêng về">
            {LEANS.map((l) => <button key={l} type="button" className="cl-btn" aria-pressed={lean === l} onClick={() => set({ lean: l, paras: undefined, layout: undefined })} style={pillBtn(lean === l)}>{leanLabel(spec, l)}{l === sLean && lean !== l ? ' · gợi ý' : ''}</button>)}
          </Slot>
          <Slot label="Lý do chính" note={'phía ' + sideName(my) + ' · tối đa 2'}>
            {mine.length ? mine.map((c) => <button key={c.id} type="button" className="cl-btn" aria-pressed={effMain.includes(c.id)} onClick={() => toggleMain(c.id)} style={pillBtn(effMain.includes(c.id))}>{name(c)}</button>) : <span style={muted}>Chưa có mạch nào ở phía {sideName(my)}.</span>}
          </Slot>
          <Slot label="Nhượng bộ" note={'phía ' + sideName(other)}>
            {theirs.length ? theirs.map((c) => <button key={c.id} type="button" className="cl-btn" aria-pressed={conc === c.id} onClick={() => set({ concession: c.id, paras: undefined })} style={pillBtn(conc === c.id)}>{name(c)}<span style={{ marginLeft: 6, opacity: 0.75, fontWeight: 500 }}>{verdictStatus(c).label}</span></button>) : <span style={muted}>Phía {sideName(other)} chưa có mạch nào: bài sẽ thiếu nhượng bộ.</span>}
          </Slot>
          <Slot label="Phạm vi" note="điều kiện để lập trường đúng">
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hints.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {hints.map((h) => <button key={h.text} type="button" className="cl-btn" aria-pressed={plan.scope === h.text} title={'Từ ' + h.from} onClick={() => set({ scope: plan.scope === h.text ? '' : h.text })} style={pillBtn(plan.scope === h.text, { textAlign: 'left' })}>{h.text}</button>)}
                </div>
              )}
              <input value={plan.scope || ''} onChange={(e) => set({ scope: e.target.value.slice(0, 200) })} aria-label="Phạm vi" placeholder={hints.length ? 'Hoặc tự viết điều kiện khác…' : 'Đúng khi… / trừ khi… (gợi ý sẽ hiện khi có phát hiện Scope, trường hợp Scope, hoặc phát hiện ngược phía)'}
                style={{ height: 38, borderRadius: 10, border: '1px solid ' + CL.ink2, padding: '0 12px', fontFamily: CL.sans, fontSize: 13, color: CL.ink, outline: 'none' }} />
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

  // ---- ③ the outline ---------------------------------------------------------------------------------------
  const [moving, setMoving] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const place = (id: string, to: string) => {
    const next = paras.map((p) => ({ ...p, chains: p.chains.filter((x) => x !== id) }));
    const k = next.findIndex((p) => p.id === to);
    if (k >= 0) next[k] = { ...next[k], chains: [...next[k].chains, id] };
    set({ paras: next, layout });
    setMoving(null);
  };
  const addPara = () => { const n = paras.length + 1; set({ paras: [...paras, { id: 'body' + Date.now().toString(36), job: 'Đoạn ' + n, chains: [] }], layout }); };
  const removePara = (id: string) => set({ paras: paras.filter((p) => p.id !== id), layout });
  const chip = (c: Chain, where: string) => {
    const st = shapeOf(spec, c) === 'verdict' ? verdictStatus(c) : chainStatus(spec, c);
    const on = moving === c.id;
    return (
      <span key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" className="cl-btn" draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', c.id); e.dataTransfer.effectAllowed = 'move'; setMoving(c.id); }} onDragEnd={() => { setMoving(null); setDragOver(null); }}
          onClick={() => setMoving(on ? null : c.id)} aria-pressed={on} aria-label={name(c) + ' · bấm để chuyển sang đoạn khác'}
          style={{ flex: 1, minWidth: 0, minHeight: 40, display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', borderRadius: 10, border: '1px solid ' + (on ? CL.ink : CL.ink2), background: on ? '#F4F4F1' : '#fff', padding: '8px 12px', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: CL.ink, cursor: 'grab' }}>
          <span aria-hidden="true" style={{ color: CL.ink4 }}><ClIcon name="grip" size={13} /></span>
          <span style={{ flex: 1, minWidth: 0 }}>{name(c)}</span>
          {shapeOf(spec, c) === 'verdict' && <span style={{ flexShrink: 0, fontSize: 11, color: CL.ink5, fontWeight: 500 }}>{areaOf(c)}</span>}
          <span style={{ flexShrink: 0, borderRadius: 6, padding: '2px 8px', background: st.bg, color: st.fg, fontSize: 10.5, fontWeight: 700 }}>{st.label}</span>
        </button>
        {where !== 'out' && <button type="button" className="cl-btn cl-del" onClick={() => place(c.id, 'out')} aria-label={'Để ' + name(c) + ' ngoài bài'} title="Để ngoài bài" style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', color: CL.ink4 }}><ClIcon name="x" size={13} /></button>}
      </span>
    );
  };
  const dropZone = (id: string) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (dragOver !== id) setDragOver(id); },
    onDragLeave: () => setDragOver((d) => (d === id ? null : d)),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); const cid = e.dataTransfer.getData('text/plain'); setDragOver(null); if (cid) place(cid, id); },
  });
  const putHere = (id: string, has: boolean) => moving && !has && (
    <button type="button" className="cl-btn" onClick={() => place(moving, id)} style={{ minHeight: 38, borderRadius: 10, border: '1.5px dashed ' + CL.ink, background: '#fff', padding: '8px 12px', textAlign: 'left', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: CL.ink }}>Đặt vào đây</button>
  );
  const scopeTxt = plan.scope && plan.scope.trim();

  const outlineCard = (
    <section style={card} aria-label="Dàn bài">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <ClLabel color={CL.ink}>{vq ? '3 · ' : ''}Dàn bài</ClLabel>
        <span style={muted}>Mỗi khung là một đoạn · kéo mạch, hoặc bấm mạch rồi bấm "Đặt vào đây"</span>
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
          const list = p.chains.map(byId).filter(Boolean);
          const over = dragOver === p.id;
          return (
            <div key={p.id} {...dropZone(p.id)} style={{ borderRadius: 14, border: (over ? '1.5px dashed ' : '1px solid ') + (over ? CL.ink : CL.border), background: over ? CL.panel : '#fff', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, transition: 'background .15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 700, color: CL.ink }}>Thân {i + 1}</span>
                <span style={{ borderRadius: 6, padding: '2px 8px', background: '#F1F1EE', color: CL.ink7, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{p.job}</span>
                {list.length > 2 && <span style={{ fontFamily: CL.sans, fontSize: 11.5, color: CL.yellowText }}>{list.length} mạch: đoạn 90 từ chỉ nên có 1–2</span>}
                {paras.length > 1 && !list.length && <button type="button" className="cl-btn cl-del" onClick={() => removePara(p.id)} aria-label={'Xoá Thân ' + (i + 1)} style={{ marginLeft: 'auto', width: 28, height: 28, display: 'grid', placeItems: 'center', color: CL.ink4 }}><ClIcon name="trash" size={13} /></button>}
              </div>
              {list.map((c) => chip(c, p.id))}
              {!list.length && !moving && <span style={{ borderRadius: 10, border: '1.5px dashed ' + CL.ink2, padding: '9px 12px', fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>Kéo một mạch vào đây</span>}
              {putHere(p.id, list.some((c) => c.id === moving))}
            </div>
          );
        })}
        <button type="button" className="cl-btn cl-link" onClick={addPara} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, ...muted, fontWeight: 600 }}><ClIcon name="plus" size={12} />Thêm đoạn thân bài</button>
        <AutoPara title="Kết bài" note="tự điền" text={vq ? 'Nhắc lại lập trường' + (scopeTxt ? ' + phạm vi: “' + scopeTxt + '”.' : '.') : 'Tóm lại các ý chính, không thêm ý mới.'} />
      </div>

      <div {...dropZone('out')} style={{ marginTop: 16, borderRadius: 14, border: (dragOver === 'out' ? '1.5px dashed ' + CL.ink : '1px dashed ' + CL.ink3), background: dragOver === 'out' ? CL.panel : '#FCFCFB', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <ClLabel color={CL.ink}>Để ngoài bài</ClLabel>
          <span style={muted}>Bài 250 chữ chỉ chứa được 3–4 mạch. Bỏ bớt là bình thường: mạch đã giúp bạn nghĩ.</span>
        </div>
        {out.map((c) => chip(c, 'out'))}
        {!out.length && !moving && <span style={muted}>Không có mạch nào bị để ngoài.</span>}
        {putHere('out', out.some((c) => c.id === moving))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
        <span style={muted}>Sang bước Viết, mỗi khung thành một đoạn, mạch của nó nằm sẵn bên cạnh.</span>
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
            {weighCard}
            {positionCard}
            {outlineCard}
          </div>
        </div>
      </div>
    </div>
  );
}

const critRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(150px, 190px) minmax(220px, 300px) minmax(0, 1fr)', gap: 14, alignItems: 'center', padding: '10px 0' };
const areaText: React.CSSProperties = { display: 'block', width: '100%', minHeight: 48, boxSizing: 'border-box', resize: 'none', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', padding: '10px 14px', fontFamily: CL.serif, fontSize: 14.5, lineHeight: 1.55, color: CL.ink, outline: 'none', fieldSizing: 'content' } as React.CSSProperties;

function Status({ label }: { label: string }) {
  const s = label === 'Giữ hướng' ? { bg: CL.mintSoft, fg: CL.greenText } : label === 'Chưa thử' ? { bg: '#F1F1EE', fg: CL.ink5 } : { bg: CL.yellowSoft, fg: CL.yellowText };
  return <span style={{ display: 'inline-block', borderRadius: 6, padding: '1px 7px', background: s.bg, color: s.fg, fontSize: 10.5, fontWeight: 700 }}>{label}</span>;
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
