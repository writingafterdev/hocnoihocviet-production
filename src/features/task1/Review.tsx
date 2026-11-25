'use client';

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CL } from '../chainlab/constants';
import { ClLabel } from '../chainlab/ui/primitives';
import { bandText, CRITERION_STYLE } from '../desk/scoring';
import { Clamp } from '../essay/Clamp';
import type { Task1Comment, Task1Crit, Task1Review } from './store';

/** Task 1 grades Task Achievement where Task 2 grades Task Response; same colours otherwise. */
const STYLE = (c: Task1Crit) => (c === 'ta' ? { ...CRITERION_STYLE.tr, short: 'TA' } : CRITERION_STYLE[c]);
const CRITS: Task1Crit[] = ['ta', 'cc', 'lr', 'gra'];
const mark = (c: Task1Crit, on: boolean): React.CSSProperties => ({ color: 'inherit', padding: '1px 0', borderRadius: 3, cursor: 'pointer', background: on ? STYLE(c).soft : 'color-mix(in srgb, ' + STYLE(c).soft + ' 55%, transparent)', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' });

/** One paragraph with the comments' quoted words highlighted; picking one selects its comment. */
function Marked({ text, notes, active, onPick }: { text: string; notes: Task1Comment[]; active: Task1Comment | null; onPick: (n: Task1Comment) => void }) {
  const spans = useMemo(() => {
    const found: { at: number; end: number; n: Task1Comment }[] = [];
    notes.forEach((n) => { const q = n.quote; if (!q) return; const at = text.indexOf(q); if (at < 0 || found.some((f) => at < f.end && at + q.length > f.at)) return; found.push({ at, end: at + q.length, n }); });
    return found.sort((a, b) => a.at - b.at);
  }, [text, notes]);
  const out: ReactNode[] = []; let last = 0;
  spans.forEach((s, k) => {
    if (s.at > last) out.push(<span key={'t' + k}>{text.slice(last, s.at)}</span>);
    out.push(<mark key={'m' + k} ref={active === s.n ? (el) => el?.scrollIntoView({ block: 'center', behavior: 'smooth' }) : undefined} onClick={() => onPick(s.n)} style={mark(s.n.crit, active === s.n)}>{text.slice(s.at, s.end)}</mark>);
    last = s.end;
  });
  if (last < text.length) out.push(<span key="end">{text.slice(last)}</span>);
  return <>{out}</>;
}

/** After Nộp bài: the report as graded, paragraph by paragraph, with the comments' words marked (as in Task 2). */
export function GradedEssay({ review, labels, active, setActive, tab }: { review: Task1Review; labels: string[]; active: Task1Comment | null; setActive: (n: Task1Comment | null) => void; tab: Task1Crit }) {
  const total = review.paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return (
    <section style={{ borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 50, padding: '0 20px', borderBottom: '1px solid ' + CL.ink1, background: CL.panel }}>
        <ClLabel color={CL.ink}>Bài viết</ClLabel>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: CL.ink5 }}>Số từ: <b style={{ color: total >= 150 ? CL.green : CL.ink }}>{total}</b> / 150</span>
      </div>
      <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {review.paragraphs.map((text, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ClLabel>{labels[i] || 'Đoạn ' + (i + 1)}</ClLabel>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: CL.serif, fontSize: 15, lineHeight: 1.75, color: CL.ink8 }}>
              <Marked text={text} notes={review.comments.filter((c) => c.section === i + 1 && c.crit === tab)} active={active} onPick={(n) => setActive(active === n ? null : n)} />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The band, the summary, a tab per criterion with its analysis, then that criterion's comments (Task 2's feedback panel). */
export function ReviewPanel({ review, labels, active, setActive, tab, setTab }: { review: Task1Review; labels: string[]; active: Task1Comment | null; setActive: (n: Task1Comment | null) => void; tab: Task1Crit; setTab: (t: Task1Crit) => void }) {
  const s = review.scores, c = review.criteria?.[tab], plain = (x?: string) => (x || '').replace(/\*\*/g, '');
  const notes = (review.comments || []).filter((n) => n.crit === tab);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => { const el = tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]'); if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth }); }, [tab]);
  const quote = { fontFamily: CL.serif, fontSize: 13, fontStyle: 'italic', color: CL.ink6 } as const;
  return (
    <aside className="cl-scroll" style={{ minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, padding: '2px 2px 4px' }}>
      <section style={{ flexShrink: 0, borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px' }}>
          <span className="pro-text" style={{ flexShrink: 0, fontFamily: CL.serif, fontSize: 42, fontWeight: 600, lineHeight: 1.1 }}>{bandText(s.band, true)}</span>
          {review.summary && (
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.5, color: CL.ink6 }}>
              <Clamp lines={2} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span>{plain(review.summary)}</span>
                {review.praise && <span style={{ color: CL.greenText }}>{plain(review.praise)}</span>}
              </Clamp>
            </span>
          )}
        </div>
        <div ref={tabsRef} role="tablist" aria-label="Tiêu chí" style={{ position: 'relative', display: 'flex', gap: 2, padding: '6px 6px 0', background: '#F5F5F5', borderTop: '1px solid ' + CL.ink1 }}>
          {ind && <span aria-hidden="true" className="t-tabs-slide" style={{ position: 'absolute', top: 6, bottom: 0, left: ind.left, width: ind.width, background: '#fff', borderRadius: '12px 12px 0 0' }} />}
          {CRITS.map((id) => {
            const st = STYLE(id), on = tab === id;
            return (
              <button key={id} type="button" role="tab" aria-selected={on} className="cl-btn" onClick={() => { setTab(id); setActive(null); }}
                style={{ position: 'relative', zIndex: 1, flex: 1, borderRadius: '12px 12px 0 0', background: 'transparent', padding: '10px 4px 11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: on ? 700 : 500, color: on ? CL.ink : CL.ink6 }}>
                {st.short}
                <span style={{ borderRadius: 6, background: st.soft, padding: '2px 9px', fontSize: 12.5, fontWeight: 700, color: st.fg, fontVariantNumeric: 'tabular-nums' }}>{bandText(s[id])}</span>
              </button>
            );
          })}
        </div>
        {c && c.why && (
          <div style={{ padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, lineHeight: 1.55 }}>
            {c.next && <span style={{ color: CL.ink, fontWeight: 600 }}>→ {plain(c.next)}</span>}
            <Clamp key={tab} height={112} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.bandQuote && <span style={quote}>Band {s[tab]}: “{c.bandQuote}”</span>}
              <span style={{ color: CL.ink7 }}>{plain(c.why)}</span>
              {c.nextQuote && s[tab] < 9 && <span style={quote}>Band {s[tab] + 1}: “{c.nextQuote}”</span>}
              {c.gap && <span style={{ color: CL.ink7 }}>{plain(c.gap)}</span>}
            </Clamp>
          </div>
        )}
      </section>
      <ClLabel>{notes.length ? notes.length + ' nhận xét' : 'Không có nhận xét'}</ClLabel>
      {notes.map((n, k) => {
        const on = active === n, st = STYLE(n.crit);
        return (
          <div key={k} role="button" tabIndex={0} aria-pressed={on} className="cl-btn" onClick={() => setActive(on ? null : n)} onKeyDown={(e) => { if (e.key === 'Enter') setActive(on ? null : n); }}
            style={{ flexShrink: 0, textAlign: 'left', cursor: 'pointer', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, borderRadius: 12, border: '1px solid ' + CL.ink1, background: on ? CL.panel : '#fff' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 3, height: 13, borderRadius: 2, background: st.line }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: CL.ink }}>{n.label || st.short}</span>
              <span style={{ marginLeft: 'auto', fontSize: 10.5, color: CL.ink5 }}>{labels[n.section - 1] || 'Đoạn ' + n.section}</span>
            </span>
            <Clamp lines={3} style={{ fontSize: 12.5, lineHeight: 1.5, color: CL.ink7 }}>{plain(n.text)}</Clamp>
            {n.fix && <span style={{ fontSize: 12.5, lineHeight: 1.5, color: CL.greenText }}>Sửa: <i style={{ fontFamily: CL.serif }}>{n.fix}</i></span>}
          </div>
        );
      })}
    </aside>
  );
}

/** Left column after grading: the key features the checks found (covered or not), then "Khung bài của bạn". */
export function GradedOutline({ review, labels }: { review: Task1Review; labels: string[] }) {
  const sk = review.skeleton && !Array.isArray(review.skeleton) ? review.skeleton : null;
  const row = (label: string, text?: string) => (
    <div style={{ flexShrink: 0, borderRadius: 10, border: '1px dashed ' + CL.ink2, padding: '9px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 12, color: CL.ink4 }}>{label}</span>
      {text && <span style={{ fontSize: 13, lineHeight: 1.5, color: CL.ink7 }}>{text}</span>}
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <ClLabel>Điểm chính của đề</ClLabel>
      {(review.features || []).map((f) => (
        <span key={f.label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.5 }}>
          <span aria-hidden="true" style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1, borderRadius: 99, background: f.covered ? CL.mintSoft : CL.redSoft, color: f.covered ? CL.greenText : CL.redText, fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{f.covered ? '✓' : '!'}</span>
          <span>{f.label}{f.note && <span style={{ display: 'block', fontSize: 12, color: CL.ink5 }}>{f.note}</span>}</span>
        </span>
      ))}
      {sk && <>
        <ClLabel style={{ marginTop: 8 }}>Khung bài của bạn</ClLabel>
        {row('Mở bài', sk.intro)}
        {row('Tổng quan', sk.overview || 'Bài chưa có tổng quan.')}
        {sk.bodies.map((b, k) => (
          <div key={k} style={{ flexShrink: 0, borderRadius: 12, border: '1px solid ' + (b.weak ? '#F5C7B8' : CL.ink2), background: b.weak ? CL.redSoft : '#fff', overflow: 'hidden' }}>
            <span style={{ display: 'block', padding: '10px 14px', borderBottom: '1px solid ' + (b.weak ? '#F5C7B8' : CL.ink1), fontSize: 13, fontWeight: 600, color: CL.ink }}>{labels[b.section - 1] || 'Thân bài'}</span>
            <ol style={{ listStyle: 'none', margin: 0, padding: '10px 10px 12px', display: 'flex', flexDirection: 'column' }}>
              {b.points.map((t, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, padding: '4px 6px' }}>
                  <span aria-hidden="true" style={{ position: 'relative', width: 9, flexShrink: 0 }}>
                    {i < b.points.length - 1 && <span style={{ position: 'absolute', left: 4, top: 15, bottom: -15, width: 1, background: CL.ink3 }} />}
                    <span style={{ position: 'absolute', top: 6, left: 0, width: 9, height: 9, borderRadius: 99, background: '#D4D4D4' }} />
                  </span>
                  <span style={{ fontSize: 13, lineHeight: 1.5, color: CL.ink7 }}>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </>}
    </div>
  );
}
