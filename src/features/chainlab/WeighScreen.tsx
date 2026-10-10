'use client';

import { useMemo, useState } from 'react';
import { CL, CL_CIRC, CL_KIND_STYLE, CL_SHAPE_LABEL } from './constants';
import { CMP_CRITERIA, DRV, isCompare, type MapExtras } from './ideamap';
import { chainStatus, ropeUnits, shapeOf, sidesOf, verdictStatus } from './model';
import {
  areaGroups, areaOf, areaWin, buildOutline, chainName, cleanParas, contested, defaultLayout, finalSide, LAYOUT_LABEL, layoutsFor, leanLabel, leanSide, leftOut,
  sideChains, scopeHints, suggestedLean, suggestedSide, tally, type AreaGroup, type AreaWeigh, type Layout, type Lean, type OutlinePara, type Plan, type Win,
} from './plan';
import { SpecProvider, useSpec } from './SpecContext';
import type { Chain, RopeUnit, Side } from './types';
import { PromptBlock } from './ui/ContextRail';
import { backLinkStyle, ClIcon, ClLabel } from './ui/primitives';
import { Rope } from './ui/Rope';

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
 * Screen ② "Cân" of "Viết tự do": the rope; the weighing area by area (contested areas only, the rest decide
 * themselves); the position, picked from what was weighed; and the outline, one box per paragraph.
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
  const [sel, setSel] = useState<string | null>(null);
  const set = (p: Partial<Plan>) => setPlan({ ...plan, ...p });

  const groups = vq ? areaGroups(spec, chains, vq ? extras?.[vq.n] : undefined) : [];
  const t = tally(groups, plan);
  const sugg = suggestedSide(t);
  const side = finalSide(groups, plan);
  const lean = plan.lean ?? suggestedLean(groups, plan);
  const my: 'left' | 'right' = leanSide(lean) || (side === 'left' ? 'left' : 'right');
  const other = my === 'right' ? 'left' : 'right';
  const mine = vq ? sideChains(spec, chains, my, groups, plan) : [];
  const theirs = vq ? sideChains(spec, chains, other, groups, plan) : [];
  const main = (plan.main || []).filter((id) => mine.some((c) => c.id === id));
  const effMain = main.length ? main : mine.slice(0, 1).map((c) => c.id);
  const conc = plan.concession && theirs.some((c) => c.id === plan.concession) ? plan.concession : theirs[0]?.id || null;
  const eff: Plan = { ...plan, lean, main: effMain, concession: conc };
  const layout: Layout = plan.layout && layoutsFor(spec).includes(plan.layout) ? plan.layout : defaultLayout(spec, lean);
  const paras = plan.paras ? cleanParas(plan.paras, chains) : buildOutline(spec, chains, groups, eff, layout);
  const out = leftOut(spec, chains, paras);
  const byId = (id: string) => chains.find((c) => c.id === id);

  // ---- the rope (moved here from screen ①) --------------------------------------------------------------
  const units = ropeUnits(spec, chains);
  const moveUnit = (u: RopeUnit, s: Side) => setChains((cs) => cs.map((c) => {
    if (c.id !== u.chainId) return c;
    const r = u.ref;
    if (r.type === 'finding') return { ...c, findings: c.findings.map((f) => (f.id === r.id ? { ...f, side: s } : f)) };
    if (r.type === 'branch') return { ...c, split: { ...c.split, branches: c.split.branches.map((b, j) => (j === r.k ? { ...b, side: s } : b)) } };
    return { ...c, side: s };
  }));
  const selChain = sel ? byId(units.find((u) => u.key === sel)?.chainId || sel) : null;

  const left = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PromptBlock />
      {vq ? (
        <section style={card} aria-label="Dây kéo">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <ClLabel color={CL.ink}>Dây kéo</ClLabel>
            <span style={muted}>Kéo mạch và phát hiện về phía chúng ủng hộ</span>
          </div>
          <p style={{ margin: '0 0 14px', fontFamily: CL.sans, fontSize: 12, lineHeight: 1.5, color: CL.ink5 }}>
            Mỗi mạch tự có nhãn từ các phát hiện của nó: <Status label="Giữ hướng" /> <Status label={'Phụ thuộc "nếu"'} /> <Status label="Chưa thử" />. Phát hiện không bị cân riêng.
          </p>
          <Rope units={units} onSide={moveUnit} selected={sel} onSelect={(u) => setSel(sel === u.key ? null : u.key)} />
          {selChain && <ChainPeek chain={selChain} onClose={() => setSel(null)} />}
        </section>
      ) : (
        <section style={card} aria-label="Các mạch">
          <ClLabel color={CL.ink}>Các mạch</ClLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
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
        </section>
      )}
    </div>
  );

  // ---- ① weigh each area ---------------------------------------------------------------------------------
  const setArea = (area: string, v: AreaWeigh) => set({ areas: { ...(plan.areas || {}), [area]: v } });
  const dropped = plan.dropped || [];
  const loose = groups.reduce((n, g) => n + g.loose.length, 0);
  const decided = groups.filter((g) => !contested(g) && !dropped.includes(g.area) && !g.fromMap);
  const open = groups.filter((g) => contested(g) && !dropped.includes(g.area));
  const tone = (s: Win | null) => (s === 'right' ? (compare ? DRV.A : { soft: CL.mintSoft, text: CL.greenText, solid: CL.green }) : s === 'left' ? (compare ? DRV.B : { soft: '#F1F1EE', text: '#3D3D3A', solid: CL.ink5 }) : { soft: '#F7F7F4', text: CL.ink6, solid: CL.ink4 });

  const weighCard = vq && (
    <section style={card} aria-label="Cân từng vùng">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <ClLabel color={CL.ink}>1 · Cân từng vùng</ClLabel>
        <span style={muted}>{compare ? 'Kết quả lấy từ phần so sánh trên bản đồ' : 'Chỉ cân vùng có mạch của cả hai phía'}</span>
      </div>
      {!groups.length && <p style={{ margin: 0, ...muted, lineHeight: 1.5 }}>Chưa có mạch nào viết xong. <button type="button" className="cl-btn cl-link" onClick={onBack} style={{ fontWeight: 600, color: CL.ink, textDecoration: 'underline' }}>Viết mạch ở bước ①</button></p>}
      {loose > 0 && !compare && <p style={{ margin: '0 0 12px', borderRadius: 12, background: CL.yellowSoft, padding: '10px 14px', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.yellowText }}><b>{loose} mạch chưa xếp lên dây kéo.</b> Kéo chúng về một phía để được tính.</p>}

      {compare ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {groups.map((g) => {
            const w = areaWin(g, plan), f = g.fromMap;
            return (
              <div key={g.area} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderRadius: 12, border: '1px solid ' + CL.ink2, padding: '9px 12px' }}>
                <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 700, color: CL.ink, minWidth: 110 }}>{g.area}</span>
                <span style={muted}>A hơn {f.right} ô · ngang {f.eq} · B hơn {f.left}</span>
                <span style={{ marginLeft: 'auto', borderRadius: 7, padding: '3px 10px', background: tone(w).soft, color: tone(w).text, fontFamily: CL.sans, fontSize: 11.5, fontWeight: 700 }}>{w ? (w === 'right' ? 'A' : w === 'left' ? 'B' : 'Ngang') : 'Chưa so sánh'}</span>
              </div>
            );
          })}
          <button type="button" className="cl-btn cl-link" onClick={onBack} style={{ alignSelf: 'flex-start', marginTop: 4, ...muted, fontWeight: 600, color: CL.ink6 }}>Mở lại bản đồ để so sánh thêm</button>
        </div>
      ) : (
        <>
          {(decided.length > 0 || dropped.length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: open.length ? 14 : 0 }}>
              {decided.map((g) => {
                const w = areaWin(g, plan);
                return <span key={g.area} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: '1px solid ' + CL.ink2, background: '#FAFAF8', padding: '6px 12px', fontFamily: CL.sans, fontSize: 12, color: CL.ink7 }}><b style={{ fontWeight: 700, color: CL.ink }}>{g.area}</b>→ <span style={{ color: tone(w).text, fontWeight: 700 }}>{sideName(w)}</span><span style={{ color: CL.ink4 }}>{g.mixed.length && !g.left.length && !g.right.length ? 'tuỳ điều kiện' : 'chỉ một phía'}</span></span>;
              })}
              {dropped.map((a) => (
                <button key={a} type="button" className="cl-btn" onClick={() => set({ dropped: dropped.filter((x) => x !== a) })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: '1px dashed ' + CL.ink3, padding: '6px 12px', fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}><s>{a}</s> đã bỏ · <span style={{ fontWeight: 600, color: CL.ink }}>Đưa lại</span></button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {open.map((g) => <AreaCard key={g.area} g={g} v={plan.areas?.[g.area]} onChange={(v) => setArea(g.area, v)} onDrop={() => set({ dropped: [...dropped, g.area] })} onBack={onBack} sideName={sideName} tone={tone} />)}
          </div>
        </>
      )}

      {groups.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid ' + CL.ink1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {groups.filter((g) => !dropped.includes(g.area)).map((g) => {
              const w = areaWin(g, plan);
              return <span key={g.area} style={{ borderRadius: 8, padding: '6px 10px', background: w ? tone(w).soft : '#fff', border: w ? 'none' : '1.5px dashed ' + CL.ink2, fontFamily: CL.sans, fontSize: 11.5, fontWeight: 700, color: w ? tone(w).text : CL.ink5 }}>{g.area}: {w ? sideName(w) : 'chưa cân'}</span>;
            })}
          </div>
          <div style={{ fontFamily: CL.sans, fontSize: 13, color: CL.ink7 }}>
            <b style={{ color: CL.ink }}>Tổng{t.open.length ? ' tạm' : ''}:</b> {R} {t.right} vùng · {L} {t.left} vùng{t.eq ? ' · ngang ' + t.eq : ''}{t.open.length ? ' · ' + t.open.length + ' vùng chưa cân' : ''}
          </div>
          {sugg && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ borderRadius: 12, background: tone(sugg).soft, padding: '11px 14px', fontFamily: CL.sans, fontSize: 13.5, lineHeight: 1.5, color: tone(sugg).text }}><b>{sugg === '=' ? 'Hai phía đang ngang nhau.' : 'Kết quả nghiêng về ' + sideName(sugg) + '.'}</b> Cả bài có nghiêng như vậy không?</div>
              <div role="group" aria-label="Cân cuối" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="cl-btn" aria-pressed={!plan.override} onClick={() => set({ override: null })} style={pillBtn(!plan.override)}>Giữ theo kết quả</button>
                <button type="button" className="cl-btn" aria-pressed={!!plan.override} onClick={() => set({ override: plan.override || { area: '', why: '' } })} style={pillBtn(!!plan.override)}>Không, một vùng nặng hơn cả</button>
              </div>
              {plan.override && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ ...muted, fontWeight: 600, color: CL.ink6 }}>Vùng nào quyết định?</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {groups.filter((g) => areaWin(g, plan) && areaWin(g, plan) !== '=' && !dropped.includes(g.area)).map((g) => (
                      <button key={g.area} type="button" className="cl-btn" aria-pressed={plan.override.area === g.area} onClick={() => set({ override: { ...plan.override, area: g.area } })} style={pillBtn(plan.override.area === g.area)}>{g.area} → {sideName(areaWin(g, plan))}</button>
                    ))}
                  </div>
                  <textarea value={plan.override.why} onChange={(e) => set({ override: { ...plan.override, why: e.target.value.slice(0, 600) } })} rows={2} aria-label="Vì sao vùng này nặng nhất" placeholder="Vùng này nặng hơn tất cả vì…" style={areaText} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );

  // ---- ② the position ------------------------------------------------------------------------------------
  const hints = vq ? scopeHints(spec, chains) : [];
  const sLean = suggestedLean(groups, plan);
  const ready = !!side;
  const toggleMain = (id: string) => {
    const cur = effMain;
    set({ main: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-2), paras: undefined });
  };
  const frame = [
    conc && 'Mặc dù «' + chainName(byId(conc)) + '»',
    lean && (lean === '0' ? 'tôi thấy hai phía cân bằng' : 'tôi ' + leanLabel(spec, lean).toLowerCase()),
    effMain.length && 'vì «' + effMain.map((id) => chainName(byId(id))).join('» và «') + '»',
    plan.scope && plan.scope.trim() && 'với điều kiện ' + plan.scope.trim(),
  ].filter(Boolean).join(', ');

  const positionCard = vq && (
    <section style={{ ...card, opacity: ready ? 1 : 0.6 }} aria-label="Lập trường">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <ClLabel color={CL.ink}>2 · Lập trường</ClLabel>
        <span style={muted}>{ready ? 'Chọn từ gợi ý, không viết từ đầu' : 'Mở khi đã cân xong ít nhất một vùng'}</span>
      </div>
      {ready && (
        <>
          <Slot label="Nghiêng về">
            {LEANS.map((l) => <button key={l} type="button" className="cl-btn" aria-pressed={lean === l} onClick={() => set({ lean: l, paras: undefined, layout: undefined })} style={pillBtn(lean === l)}>{leanLabel(spec, l)}{l === sLean && lean !== l ? ' · gợi ý' : ''}</button>)}
          </Slot>
          <Slot label="Lý do chính" note={'phía ' + sideName(my) + ' · tối đa 2'}>
            {mine.length ? mine.map((c) => <button key={c.id} type="button" className="cl-btn" aria-pressed={effMain.includes(c.id)} onClick={() => toggleMain(c.id)} style={pillBtn(effMain.includes(c.id))}>{chainName(c)}</button>) : <span style={muted}>Chưa có mạch nào ở phía {sideName(my)}.</span>}
          </Slot>
          <Slot label="Nhượng bộ" note={'phía ' + sideName(other)}>
            {theirs.length ? theirs.map((c) => <button key={c.id} type="button" className="cl-btn" aria-pressed={conc === c.id} onClick={() => set({ concession: c.id, paras: undefined })} style={pillBtn(conc === c.id)}>{chainName(c)}<span style={{ marginLeft: 6, opacity: 0.75, fontWeight: 500 }}>{verdictStatus(c).label}</span></button>) : <span style={muted}>Phía {sideName(other)} chưa có mạch nào: bài sẽ thiếu nhượng bộ.</span>}
          </Slot>
          <Slot label="Phạm vi" note="điều kiện để lập trường đúng">
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hints.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {hints.map((h) => <button key={h.text} type="button" className="cl-btn" aria-pressed={plan.scope === h.text} title={'Từ ' + h.from} onClick={() => set({ scope: plan.scope === h.text ? '' : h.text })} style={pillBtn(plan.scope === h.text, { textAlign: 'left' })}>{h.text}</button>)}
                </div>
              )}
              <input value={plan.scope || ''} onChange={(e) => set({ scope: e.target.value.slice(0, 200) })} aria-label="Phạm vi" placeholder={hints.length ? 'Hoặc tự viết điều kiện khác…' : 'Với điều kiện… (chưa có phát hiện Scope nào để gợi ý)'}
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
          onClick={() => setMoving(on ? null : c.id)} aria-pressed={on} aria-label={chainName(c) + ' · bấm để chuyển sang đoạn khác'}
          style={{ flex: 1, minWidth: 0, minHeight: 40, display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', borderRadius: 10, border: '1px solid ' + (on ? CL.ink : CL.ink2), background: on ? '#F4F4F1' : '#fff', padding: '8px 12px', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: CL.ink, cursor: 'grab' }}>
          <span aria-hidden="true" style={{ color: CL.ink4 }}><ClIcon name="grip" size={13} /></span>
          <span style={{ flex: 1, minWidth: 0 }}>{chainName(c)}</span>
          {shapeOf(spec, c) === 'verdict' && <span style={{ flexShrink: 0, fontSize: 11, color: CL.ink5, fontWeight: 500 }}>{areaOf(c)}</span>}
          <span style={{ flexShrink: 0, borderRadius: 6, padding: '2px 8px', background: st.bg, color: st.fg, fontSize: 10.5, fontWeight: 700 }}>{st.label}</span>
        </button>
        {where !== 'out' && <button type="button" className="cl-btn cl-del" onClick={() => place(c.id, 'out')} aria-label={'Để ' + chainName(c) + ' ngoài bài'} title="Để ngoài bài" style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', color: CL.ink4 }}><ClIcon name="x" size={13} /></button>}
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
          <div style={{ flex: '1 1 380px', minWidth: 0, maxWidth: 620, position: 'sticky', top: 0 }}>{left}</div>
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
      <span style={{ flex: 1, minWidth: 0, fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: CL.ink }}>{chainName(chain)}</span>
      <span style={{ flexShrink: 0, borderRadius: 6, padding: '2px 8px', background: st.bg, color: st.fg, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700 }}>{st.label}</span>
    </div>
  );
}

/** The chain behind a rope chip: its steps and findings, so the student can weigh what it actually says. */
function ChainPeek({ chain, onClose }: { chain: Chain; onClose: () => void }) {
  const st = verdictStatus(chain);
  return (
    <div className="cl-rise" style={{ marginTop: 14, borderRadius: 14, background: CL.panel, border: '1px solid ' + CL.ink1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0, fontFamily: CL.sans, fontSize: 13, fontWeight: 700, color: CL.ink }}>{chainName(chain)}</span>
        <Status label={st.label} />
        <button type="button" className="cl-btn cl-del" onClick={onClose} aria-label="Đóng" style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', color: CL.ink4 }}><ClIcon name="x" size={13} /></button>
      </div>
      <div style={{ fontFamily: CL.serif, fontSize: 14, lineHeight: 1.55, color: CL.ink7 }}>{chain.steps.filter((s) => s.trim()).join(' → ')}</div>
      {chain.findings.filter((f) => !f.empty && f.text.trim()).map((f) => {
        const k = CL_KIND_STYLE[f.kind] || CL_KIND_STYLE['Khả thi'];
        return <div key={f.id} style={{ display: 'flex', gap: 8, fontFamily: CL.sans, fontSize: 12, lineHeight: 1.5, color: CL.ink7 }}><span style={{ flexShrink: 0, borderRadius: 5, padding: '1px 6px', background: k.bg, color: k.fg, fontSize: 10, fontWeight: 700 }}>{f.kind}</span>{f.text}</div>;
      })}
    </div>
  );
}

/** One contested area: the chains of each side, the grounds, who is heavier, and why. */
function AreaCard({ g, v, onChange, onDrop, onBack, sideName, tone }: { g: AreaGroup; v?: AreaWeigh; onChange: (v: AreaWeigh) => void; onDrop: () => void; onBack: () => void; sideName: (s: Win) => string; tone: (s: Win | null) => { soft: string; text: string; solid: string } }) {
  const cur = v || { win: null, crit: [], why: '' };
  const set = (p: Partial<AreaWeigh>) => onChange({ ...cur, ...p });
  const untested = [...g.left, ...g.right].every((c) => verdictStatus(c).label === 'Chưa thử');
  const col = (s: 'left' | 'right', list: Chain[]) => (
    <div style={{ flex: '1 1 220px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, borderRadius: 12, background: tone(s).soft, padding: '10px 12px' }}>
      <span style={{ fontFamily: CL.sans, fontSize: 11.5, fontWeight: 700, color: tone(s).text }}>{sideName(s)}</span>
      {list.map((c) => (
        <span key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 9, background: '#fff', padding: '7px 10px' }}>
          <span style={{ flex: 1, minWidth: 0, fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: CL.ink }}>{chainName(c)}</span>
          <Status label={verdictStatus(c).label} />
        </span>
      ))}
    </div>
  );
  return (
    <div style={{ borderRadius: 14, border: '1px solid ' + (cur.win ? CL.border : CL.ink), padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: CL.sans, fontSize: 14, fontWeight: 700, color: CL.ink }}>{g.area}</span>
        <span style={{ fontFamily: CL.sans, fontSize: 11.5, color: CL.ink5 }}>{g.right.length} mạch {sideName('right')} · {g.left.length} mạch {sideName('left')}</span>
        {!cur.win && <span style={{ marginLeft: 'auto', borderRadius: 6, padding: '2px 8px', background: '#F1F1EE', color: CL.ink6, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700 }}>Chưa cân</span>}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{col('right', g.right)}{col('left', g.left)}</div>
      {untested && (
        <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink6 }}>
          Các mạch ở đây chưa thử, cân bây giờ sẽ là cảm tính.{' '}
          <button type="button" className="cl-btn cl-link" onClick={onBack} style={{ fontWeight: 600, color: CL.ink, textDecoration: 'underline' }}>Thử ở bước ①</button> hoặc{' '}
          <button type="button" className="cl-btn cl-link" onClick={onDrop} style={{ fontWeight: 600, color: CL.ink, textDecoration: 'underline' }}>bỏ vùng này khỏi bài</button>.
        </p>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink6, marginRight: 4 }}>Cân theo</span>
        {CMP_CRITERIA.map((c) => { const on = cur.crit.includes(c); return <button key={c} type="button" className="cl-btn" aria-pressed={on} onClick={() => set({ crit: on ? cur.crit.filter((x) => x !== c) : [...cur.crit, c] })} style={pillBtn(on, { minHeight: 30, fontSize: 12, padding: '4px 11px' })}>{c}</button>; })}
      </div>
      <div role="group" aria-label={'Phía nào nặng hơn ở ' + g.area} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(['right', '=', 'left'] as Win[]).map((w) => {
          const on = cur.win === w, tn = tone(w);
          return <button key={w} type="button" className="cl-btn" aria-pressed={on} onClick={() => set({ win: on ? null : w })} style={{ height: 38, padding: '0 16px', borderRadius: 11, border: on ? '1.5px solid ' + tn.solid : '1px solid ' + CL.ink2, background: on ? tn.soft : '#fff', color: tn.text, fontFamily: CL.sans, fontSize: 13, fontWeight: on ? 700 : 600 }}>{w === '=' ? 'Ngang nhau' : sideName(w) + ' nặng hơn'}</button>;
        })}
      </div>
      {cur.win && <textarea value={cur.why} onChange={(e) => set({ why: e.target.value.slice(0, 600) })} rows={2} aria-label="Vì sao" placeholder="Phía đó nặng hơn vì…" style={areaText} />}
    </div>
  );
}
