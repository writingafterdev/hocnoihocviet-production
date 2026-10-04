'use client';

import { useEffect, useRef, useState } from 'react';
import { CL, CL_CIRC, CL_SHAPE_LABEL } from '../chainlab/constants';
import { chainStatus, ropeUnits, shapeOf } from '../chainlab/model';
import { useSpec } from '../chainlab/SpecContext';
import { DESK_ACTIONS, DESK_REPLIES } from '../chainlab/tutor';
import type { Chain, ReviewGroup, ReviewItem } from '../chainlab/types';
import { Assistant } from '../chainlab/ui/Assistant';
import { PromptBlock, RailTop } from '../chainlab/ui/ContextRail';
import { backLinkStyle, ClIcon, ClLabel, ClTag, toolbarBtn } from '../chainlab/ui/primitives';
import { ReviewPanel } from '../chainlab/ui/ReviewPanel';
import { Rope } from '../chainlab/ui/Rope';
import { WorkspaceGrid } from '../chainlab/ui/WorkspaceGrid';
import type { EssayState } from '../attempts/store';
import { draftsKey, requestEssayReview, reviewEssay, wordCount, type BandScores, type EssayReview, type EssaySection } from './scoring';

/** A chain in the Desk's plan rail: title + status, expandable to steps, cases and findings. */
function OutlineItem({ chain, index, open, onToggle, chains }: { chain: Chain; index: number; open: boolean; onToggle: () => void; chains: Chain[] }) {
  const spec = useSpec();
  const shape = shapeOf(spec, chain), verdict = shape === 'verdict';
  const status = chainStatus(spec, chain);
  const fixIdx = shape === 'solution' && chain.fixes ? chains.findIndex((c) => c.id === chain.fixes) : -1;
  const fixed = fixIdx >= 0 ? chains[fixIdx] : null;
  return (
    <div id={'desk-chain-' + chain.id} style={{ borderRadius: 10, border: '1px solid ' + (open ? CL.ink3 : CL.ink1), background: '#fff', overflow: 'hidden' }}>
      <button type="button" className="cl-btn" onClick={onToggle} aria-expanded={open} style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 12px', textAlign: 'left' }}>
        <span style={{ fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, color: CL.ink4, paddingTop: 2, width: 18 }}>{String(index + 1).padStart(2, '0')}</span>
        {verdict && <span style={{ marginTop: 6, width: 8, height: 8, borderRadius: 999, background: chain.tone === 'benefit' ? CL.mint : CL.red, flexShrink: 0 }} />}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontFamily: CL.serif, fontSize: 14, lineHeight: 1.4, color: CL.ink8 }}>{chain.title || 'Mạch chưa đặt tên'}</span>
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {!verdict && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 5, border: '1px solid ' + CL.ink2, padding: '1px 6px', fontFamily: CL.sans, fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: CL.ink7 }}><span style={{ width: 6, height: 6, borderRadius: 2, background: CL.ink5 }} />{CL_SHAPE_LABEL[shape]}</span>}
            <span style={{ borderRadius: 5, padding: '2px 7px', background: status.bg, color: status.fg, fontFamily: CL.sans, fontSize: 10, fontWeight: 600 }}>{status.label}</span>
          </span>
        </span>
        <span style={{ color: CL.ink4, paddingTop: 2, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><ClIcon name="chev" size={14} /></span>
      </button>
      {open && (
        <div style={{ borderTop: '1px solid ' + CL.ink1, padding: '12px 14px 14px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shape === 'solution' && (
            <span style={{ fontFamily: CL.sans, fontSize: 11.5, color: CL.ink5 }}>Xử lý: <b style={{ color: fixed ? CL.ink : CL.ink4, fontWeight: 600 }}>{fixed ? 'Mạch ' + (fixIdx + 1) + (fixed.title ? ' · ' + fixed.title : '') : 'chưa chọn'}</b></span>
          )}
          <ol style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {chain.steps.filter(Boolean).map((s, i) => <li key={i} style={{ fontFamily: CL.serif, fontSize: 12.5, lineHeight: 1.5, color: CL.ink6 }}>{s}</li>)}
          </ol>
          {chain.split && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink5 }}>Tách theo <b style={{ color: CL.ink, fontWeight: 600 }}>{chain.split.noun}</b></span>
              {chain.split.branches.map((b, k) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: CL.sans, fontSize: 10, fontWeight: 700, color: CL.ink4 }}>{String.fromCharCode(65 + k)}</span>
                    <span style={{ flex: 1, fontFamily: CL.sans, fontSize: 11.5, fontWeight: 600, color: CL.ink7 }}>{b.label || '—'}</span>
                  </span>
                  {b.steps.filter(Boolean).length > 0 && <span style={{ paddingLeft: 16, fontFamily: CL.serif, fontSize: 12, lineHeight: 1.5, color: CL.ink6 }}>{b.steps.filter(Boolean).join(' → ')}</span>}
                </div>
              ))}
            </div>
          )}
          {chain.findings.filter((f) => !f.empty).map((f) => (
            <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><ClTag kind={f.kind} /></div>
              <span style={{ fontFamily: CL.sans, fontSize: 11.5, lineHeight: 1.5, color: CL.ink6 }}>{f.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Dotted underline over a vague word inside an essay paragraph. */
function DeskMark({ text, word }: { text: string; word: string }) {
  const i = text.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) return null;
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', padding: '14px 18px', border: '1px solid transparent', fontFamily: 'var(--font-serif)', fontSize: 15.5, lineHeight: 1.7, color: 'transparent', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
      {text.slice(0, i)}<span style={{ borderBottom: '2px dotted #D5452E' }}>{text.slice(i, i + word.length)}</span>{text.slice(i + word.length)}
    </div>
  );
}

/** Estimated band + TR / CC / LR / GRA boxes, at the top of the feedback panel. */
function DeskScores({ s }: { s: BandScores }) {
  const box = (label: string, v: number, main?: boolean) => (
    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderRadius: 12, padding: '12px 4px', background: main ? CL.mint : '#fff', border: '1px solid ' + (main ? CL.mint : CL.ink2) }}>
      <span style={{ fontFamily: CL.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: main ? CL.greenText : CL.ink5 }}>{label}</span>
      <span style={{ fontFamily: CL.sans, fontSize: main ? 24 : 20, fontWeight: 700, color: CL.ink, fontVariantNumeric: 'tabular-nums' }}>{v.toFixed(1)}</span>
    </div>
  );
  return (
    <section style={{ overflow: 'hidden', borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 50, padding: '0 18px', background: CL.panel, borderBottom: '1px solid ' + CL.ink2 }}>
        <span style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: CL.ink }}>Điểm</span>
        <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11, color: CL.ink5 }}>Ước tính</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr repeat(4, minmax(0,1fr))', gap: 6, padding: 12 }}>
        {box('Band', s.band, true)}{box('TR', s.tr)}{box('CC', s.cc)}{box('LR', s.lr)}{box('GRA', s.gra)}
      </div>
    </section>
  );
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Screen 2 of "Viết tự do": write the essay beside the plan, then submit for TR / CC / LR / GRA feedback. */
export function ChainDesk({ chains, stance, essay, setEssay, onBack }: { chains: Chain[]; stance: string; essay: EssayState; setEssay: (fn: (e: EssayState) => EssayState) => void; onBack: () => void }) {
  const spec = useSpec();
  const verdictQ = spec.questions.find((q) => q.shape === 'verdict'), multiQ = spec.questions.length > 1;
  const [openIds, setOpenIds] = useState<string[]>(chains[0] ? [chains[0].id] : []);
  const { bodies, drafts, review, seconds: secs } = essay;
  const setBodies = (b: string[]) => setEssay((e) => ({ ...e, bodies: b }));
  const setReview = (r: EssayReview | null) => setEssay((e) => ({ ...e, review: r }));
  const [help, setHelp] = useState(false);
  const [activeId, setActiveId] = useState('intro');
  const [running, setRunning] = useState(false);
  const [railOpen, setRailOpen] = useState(!essay.review);
  const [seen, setSeen] = useState<string[]>([]);
  const [focusSec, setFocusSec] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const focusTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => { const t = setInterval(() => setEssay((e) => ({ ...e, seconds: e.seconds + 1 })), 1000); return () => clearInterval(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const clock = [Math.floor(secs / 3600), Math.floor(secs / 60) % 60, secs % 60].map((n) => String(n).padStart(2, '0')).join(':');
  const toggleOpen = (id: string) => setOpenIds((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const showChain = (id: string) => {
    setOpenIds((o) => (o.includes(id) ? o : [...o, id]));
    setTimeout(() => { const el = document.getElementById('desk-chain-' + id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 30);
  };
  const words = Object.values(drafts).reduce((n, t) => n + wordCount(t), 0);
  const sections: EssaySection[] = [
    { id: 'intro', label: 'Mở bài', guide: '40–55 từ', placeholder: verdictQ ? 'Giới thiệu vấn đề và nêu lập trường.' : 'Giới thiệu vấn đề và nói bài sẽ bàn những gì.' },
    ...bodies.map((id, i) => ({ id, label: 'Thân bài ' + (i + 1), guide: '85–100 từ', placeholder: multiQ ? 'Phát triển các mạch của một câu hỏi' + (spec.questions[i] ? ', vd: câu ' + CL_CIRC[spec.questions[i].n - 1] + ' (' + CL_SHAPE_LABEL[spec.questions[i].shape].toLowerCase() + ').' : '.') : 'Phát triển một hoặc vài mạch theo thứ tự bên trái.' })),
    { id: 'conclusion', label: 'Kết bài', guide: '30–45 từ', placeholder: verdictQ ? 'Quay lại lập trường, không thêm ý mới.' : 'Tóm lại các ý chính, không thêm ý mới.' },
  ];
  const activeLabel = (sections.find((x) => x.id === activeId) || sections[0]).label;
  const stale = review && review.key !== draftsKey(drafts);
  const submit = async () => {
    setRunning(true);
    const r = await requestEssayReview(spec, sections, drafts, chains, stance);
    setReview(r); setSeen([]); setRunning(false); setRailOpen(false);
  };
  const closeReview = () => { setReview(null); setRailOpen(true); };
  const live = review && stale ? reviewEssay(spec, sections, drafts, chains, stance) : review;
  const liveSet = new Set(live ? live.groups.flatMap((g) => g.items.map((it) => g.id + '|' + it.sectionId + '|' + it.text)) : []);
  const fixedFn = (_g: ReviewGroup | null, it: ReviewItem) => {
    if (it.word) return !new RegExp('\\b' + escapeRe(it.word) + '\\b', 'i').test(drafts[it.sectionId] || '');
    const gid = it.key.replace(/\d+$/, '');
    if (gid === 'length') return !live.groups.find((x) => x.id === 'length').items.some((x) => x.sectionId === it.sectionId);
    return !liveSet.has(gid + '|' + it.sectionId + '|' + it.text);
  };
  const open = review ? review.groups.flatMap((g) => g.items).filter((it) => !fixedFn(null, it)) : [];
  const go = (it: ReviewItem) => {
    setSeen((s) => (s.includes(it.key) ? s : [...s, it.key]));
    const el = document.getElementById('desk-sec-' + it.sectionId), m = mainRef.current;
    if (el && m) m.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' });
    setFocusSec(it.sectionId);
    clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => setFocusSec(null), 2000);
  };
  const addBody = () => setBodies([...bodies, 'body' + Date.now()]);
  const removeBody = (id: string) => setEssay((e) => { const d = { ...e.drafts }; delete d[id]; return { ...e, bodies: e.bodies.filter((b) => b !== id), drafts: d }; });
  const bodyCount = bodies.length;

  const rail = (
    <aside style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff' }}>
      <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '26px 26px 30px' }}>
        <RailTop />
        <PromptBlock />
        {spec.questions.map((q) => {
          const mine = chains.map((c, i) => ({ c, i })).filter(({ c }) => (c.q || 1) === q.n);
          return (
            <section key={q.n} style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid ' + CL.ink1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                {multiQ && <span style={{ fontFamily: CL.sans, fontSize: 15, lineHeight: 1, color: CL.ink }}>{CL_CIRC[q.n - 1]}</span>}
                <ClLabel color={CL.ink}>{multiQ ? CL_SHAPE_LABEL[q.shape] : 'Các mạch'}</ClLabel>
                <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>{mine.length} mạch</span>
              </div>
              {q.shape === 'verdict' && (
                <div style={{ marginBottom: 16, borderRadius: 12, border: '1px solid ' + CL.ink2, padding: '14px 14px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                    <ClLabel style={{ fontSize: 9.5 }}>Lập trường</ClLabel>
                    <button type="button" className="cl-btn cl-link" onClick={onBack} style={{ fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: CL.ink4 }}>Sửa</button>
                  </div>
                  <p style={{ margin: '0 0 14px', fontFamily: CL.serif, fontSize: 14.5, lineHeight: 1.55, color: stance ? CL.ink : CL.ink4, fontStyle: stance ? 'normal' : 'italic' }}>{stance || 'Chưa có lập trường.'}</p>
                  <Rope compact units={ropeUnits(spec, chains)} selected={null} onSelect={(u) => showChain(u.chainId)} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mine.length
                  ? mine.map(({ c, i }) => <OutlineItem key={c.id} chain={c} index={i} chains={chains} open={openIds.includes(c.id)} onToggle={() => toggleOpen(c.id)} />)
                  : <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>Chưa có mạch nào cho câu này.</span>}
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );

  const main = (
    <main ref={mainRef} className="cl-scroll" style={{ position: 'relative', minHeight: 0, minWidth: 0, overflowY: 'auto', padding: 2 }}>
      <div style={{ overflow: 'hidden', borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 58, padding: '0 22px', background: CL.panel, borderBottom: '1px solid ' + CL.ink2 }}>
          <ClLabel color={CL.ink}>Bài viết</ClLabel>
          <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap', fontFamily: CL.sans, fontSize: 13, color: CL.ink7 }}>Số từ: <b style={{ fontWeight: 600, color: words >= 250 ? CL.greenText : CL.ink }}>{words}</b><span style={{ color: CL.ink4 }}> / 250</span></span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, padding: '24px 22px 8px' }}>
          {sections.map((s) => {
            const w = wordCount(drafts[s.id]);
            const isBody = s.id.startsWith('body');
            const nums = String(s.guide || '').match(/\d+/g) || [];
            const lo = +nums[0] || 0, hi = +(nums[1] || nums[0]) || 1;
            const inRange = w >= lo && w <= hi;
            return (
              <section key={s.id} id={'desk-sec-' + s.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {open.some((it) => it.sectionId === s.id && it.para) && <span title="Có nhận xét cho đoạn này" style={{ position: 'absolute', left: -12, top: 36, bottom: 0, width: 3, borderRadius: 2, background: CL.red }} />}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: CL.sans, fontSize: 15, fontWeight: 600, color: CL.ink }}>{s.label}</span>
                  <span style={{ fontFamily: CL.sans, fontSize: 11.5, color: CL.ink4 }}>{s.guide}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11.5, fontWeight: 600, color: inRange ? CL.greenText : CL.ink4 }}>{w} từ</span>
                  {isBody && bodyCount > 1 && <button type="button" className="cl-btn cl-del" onClick={() => removeBody(s.id)} aria-label="Xoá đoạn" style={{ alignSelf: 'center', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CL.ink3 }}><ClIcon name="trash" size={13} /></button>}
                </div>
                <div style={{ position: 'relative' }}>
                  {open.filter((it) => it.sectionId === s.id && it.word).map((it) => <DeskMark key={it.key} text={drafts[s.id] || ''} word={it.word} />)}
                  <textarea className="cl-ta cl-field" value={drafts[s.id] || ''} onFocus={() => setActiveId(s.id)} onChange={(e) => { const v = e.target.value; setEssay((x) => ({ ...x, drafts: { ...x.drafts, [s.id]: v } })); }} placeholder={s.placeholder} aria-label={s.label} rows={isBody ? 5 : 3} style={{ display: 'block', width: '100%', minHeight: isBody ? 150 : 96, resize: 'none', borderRadius: 12, border: '1px solid ' + (focusSec === s.id ? CL.ink : activeId === s.id ? CL.ink4 : CL.ink2), boxShadow: focusSec === s.id ? '0 0 0 4px ' + CL.ink1 : 'none', outline: 'none', background: 'transparent', position: 'relative', fontFamily: CL.serif, fontSize: 15.5, lineHeight: 1.7, color: CL.ink8, padding: '14px 18px', fieldSizing: 'content', transition: 'border-color .15s, box-shadow .3s' } as React.CSSProperties} />
                </div>
              </section>
            );
          })}
          <button type="button" className="cl-btn cl-link" onClick={addBody} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: -12, fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: CL.ink5 }}><ClIcon name="plus" size={13} />Thêm đoạn thân bài</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: '22px 22px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>Thời gian</span>
            <span style={{ fontFamily: CL.sans, fontSize: 16, fontWeight: 600, color: CL.ink, fontVariantNumeric: 'tabular-nums' }}>{clock}</span>
          </div>
          <button type="button" className="cl-btn" onClick={() => setHelp(!help)} aria-pressed={help} style={{ marginLeft: 'auto', height: 40, borderRadius: 12, border: '1px solid ' + (help ? CL.ink : CL.ink2), background: '#fff', color: CL.ink, fontFamily: CL.sans, fontSize: 13, fontWeight: 600, padding: '0 18px' }}>Hỏi</button>
          <button type="button" className="cl-btn cl-primary" onClick={submit} disabled={running || (review && !stale)} style={{ height: 40, borderRadius: 12, background: CL.ink, color: '#fff', fontFamily: CL.sans, fontSize: 13, fontWeight: 600, padding: '0 20px', opacity: running || (review && !stale) ? 0.4 : 1 }}>{running ? 'Đang chấm…' : review ? (stale ? 'Nộp lại' : 'Đã nộp') : 'Nộp bài'}</button>
        </div>
      </div>
    </main>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1710, margin: '0 auto', padding: '12px 40px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 42, paddingBottom: 12 }}>
        <button type="button" className="cl-btn cl-link" onClick={onBack} style={backLinkStyle}><ClIcon name="left" size={14} />Quay lại các mạch</button>
        {review && <button type="button" className="cl-btn" onClick={() => setRailOpen(!railOpen)} aria-pressed={railOpen} style={toolbarBtn(railOpen)}>Đề bài</button>}
      </div>
      <WorkspaceGrid
        rail={rail}
        railOpen={railOpen}
        reviewOpen={!!review}
        main={main}
        panel={review && <ReviewPanel title="Kết quả" review={review} stale={stale} running={running} onRerun={submit} rerunLabel="Nộp lại" onClose={closeReview} onGo={go} seen={seen} fixedFn={fixedFn} top={<DeskScores s={review.scores} />} />}
        overlay={help && <Assistant onClose={() => setHelp(false)} contextLabel={activeLabel} contextMeta={wordCount(drafts[activeId]) + ' từ'} intro="Mình đọc đoạn bạn đang viết cùng với các mạch bên trái. Bắt đầu từ một trong những việc này:" placeholder="Hỏi về đoạn này…" actions={DESK_ACTIONS} replies={DESK_REPLIES} />}
      />
    </div>
  );
}
