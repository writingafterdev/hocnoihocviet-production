'use client';

import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { CL } from '../constants';
import { chainSnap } from '../review';
import type { Chain, ReviewGroup, ReviewItem } from '../types';
import { ClIcon, ClLabel } from './primitives';

export interface ReviewPanelProps {
  review: { groups: ReviewGroup[] };
  /** A fresh run on the current input, used to mark items that no longer apply as fixed. */
  live?: { groups: ReviewGroup[] };
  chains?: Chain[];
  /** Current stance, for comments on the stance. */
  stance?: string;
  stale: boolean;
  running: boolean;
  onRerun: () => void;
  onClose: () => void;
  onGo: (it: ReviewItem) => void;
  seen: string[];
  fixedFn?: (g: ReviewGroup, it: ReviewItem) => boolean;
  top?: ReactNode;
  title?: string;
  rerunLabel?: string;
  /** The item picked from a highlight in the essay; shown selected and scrolled into view. */
  active?: string | null;
  /** Accent per group id (essay criteria), used for the quote bar and the group dot. */
  accents?: Record<string, { line: string; soft: string }>;
  /** false = only `top` is shown (counts still cover every group). */
  list?: boolean;
  /** Show the "Ổn" box for groups without items. */
  showOk?: boolean;
  /** Shown when there are no items; null hides it. */
  emptyText?: string | null;
  /** Essay feedback: each item is its own card (error name, comment, "Sửa lại"), without group headers. */
  cards?: boolean;
  /** false = no title row (title, count, close); `top` then carries its own close button. */
  header?: boolean;
  /** "Sửa bài": each card's fix is hidden behind "Xem gợi ý". */
  hideFix?: boolean;
  /** Cards get an "Đã sửa" tick the student controls (it.fixed = ticked); nothing is detected automatically. */
  onTick?: (it: ReviewItem) => void;
  /** Order of the cards (default: by criterion). */
  sortItems?: (a: ReviewItem, b: ReviewItem) => number;
}

/** Text with **bold** spans, as the AI writes key terms. */
export function Rich({ text }: { text: string }) {
  return <>{text.split(/\*\*(.+?)\*\*/g).map((t, k) => (k % 2 ? <b key={k} style={{ fontWeight: 700, color: CL.ink }}>{t}</b> : <Fragment key={k}>{t}</Fragment>))}</>;
}

const fixedBadgeOf = (ticked: boolean) => <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 5, background: CL.mintSoft, padding: '2px 7px', fontFamily: CL.sans, fontSize: 10, fontWeight: 600, color: CL.greenText, whiteSpace: 'nowrap' }}><ClIcon name="check" size={10} color={CL.green} />{ticked ? 'Đã sửa' : 'Đã sửa?'}</span>;

/** One essay comment as a card: the error's name, what is wrong, and the fix. */
function CommentCard({ it, on, dim, accent, onGo, hideFix, onTick }: { it: ReviewItem; on: boolean; dim: boolean; accent?: { line: string; soft: string }; onGo: (it: ReviewItem) => void; hideFix?: boolean; onTick?: (it: ReviewItem) => void }) {
  const [peek, setPeek] = useState(false);
  const reveal = (e: React.SyntheticEvent) => { e.stopPropagation(); setPeek(!peek); };
  return (
    <button id={'rv-' + it.key} type="button" className="cl-btn cl-rv" onClick={() => onGo(it)} aria-pressed={on} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8, width: '100%', flexShrink: 0, textAlign: 'left', borderRadius: 16, border: '1px solid ' + CL.border, background: '#fff', padding: '15px 18px 16px', opacity: dim ? 0.55 : 1, transition: 'opacity .25s' }}>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        {accent && <span style={{ alignSelf: 'center', width: 8, height: 8, borderRadius: 999, background: accent.line, flexShrink: 0 }} />}
        <span style={{ fontFamily: CL.sans, fontSize: 15, fontWeight: 600, color: CL.ink, textDecoration: it.fixed ? 'line-through' : 'none', textDecorationColor: CL.ink3 }}>{it.label || it.where}</span>
        {it.fixed && !onTick ? fixedBadgeOf(false) : it.label && <span style={{ marginLeft: 'auto', flexShrink: 0, fontFamily: CL.sans, fontSize: 11, color: CL.ink4, whiteSpace: 'nowrap' }}>{it.where}</span>}
      </span>
      {hideFix && it.word && <span title={it.word} style={{ borderLeft: '3px solid ' + (accent ? accent.line : CL.ink3), paddingLeft: 10, fontFamily: CL.serif, fontSize: 13.5, lineHeight: 1.5, fontStyle: 'italic', color: CL.ink5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{it.word}</span>}
      <span style={{ fontFamily: CL.sans, fontSize: 13.5, lineHeight: 1.6, color: CL.ink8, textWrap: 'pretty' }}><Rich text={it.text} /></span>
      {it.fix && (!hideFix || peek) && <span style={{ fontFamily: CL.sans, fontSize: 13.5, lineHeight: 1.55, textWrap: 'pretty' }}><span style={{ color: CL.ink4 }}>Sửa lại: </span><b style={{ fontWeight: 700, color: CL.green }}>{it.fix}</b></span>}
      {(onTick || (it.fix && hideFix)) && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {it.fix && hideFix && !it.fixed && <span role="button" tabIndex={0} className="cl-link" onClick={reveal} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') reveal(e); }} style={{ alignSelf: 'flex-start', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: '#2B6BE8', cursor: 'pointer' }}>{peek ? 'Ẩn gợi ý' : 'Xem gợi ý'}</span>}
          {onTick && <span role="checkbox" aria-checked={!!it.fixed} tabIndex={0} className="cl-link" onClick={(e) => { e.stopPropagation(); onTick(it); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onTick(it); } }} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: it.fixed ? CL.greenText : CL.ink5 }}>
            <span style={{ width: 18, height: 18, borderRadius: 6, border: '1.5px solid ' + (it.fixed ? CL.green : CL.ink3), background: it.fixed ? CL.green : '#fff', display: 'grid', placeItems: 'center' }}>{it.fixed && <ClIcon name="check" size={11} color="#fff" />}</span>Đã sửa
          </span>}
        </span>
      )}
    </button>
  );
}

/** Right-hand feedback panel: grouped questions, "Đã sửa?" once an item no longer applies. */
export function ReviewPanel({ review, live, chains = [], stance, stale, running, onRerun, onClose, onGo, seen, fixedFn, top, title = 'Nhận xét', rerunLabel = 'Soát lại', active, accents, list = true, showOk = true, emptyText = 'Không thấy vấn đề nào. Sẵn sàng viết.', cards = false, header = true, hideFix = false, onTick, sortItems }: ReviewPanelProps) {
  useEffect(() => {
    const el = active && document.getElementById('rv-' + active);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [active]);
  const liveSet = new Set((live || review).groups.flatMap((g) => g.items.map((it) => g.id + '|' + it.text)));
  const isFixed = fixedFn || ((g: ReviewGroup, it: ReviewItem) => {
    if (it.snapKind === 'stance') return (stance || '') !== it.snap;
    if (it.snapKind) {
      const c = chains.find((x) => x.id === it.chainId);
      if (!c) return true;
      const cur = it.snapKind === 'flag' ? c.steps[it.at] + '||' + c.steps[it.at + 1] : it.snapKind === 'chain' ? chainSnap(c) : c.steps[it.at];
      return cur !== it.snap;
    }
    return !liveSet.has(g.id + '|' + it.text);
  });
  const groups = review.groups.map((g) => ({ ...g, items: g.items.map((it) => ({ ...it, fixed: isFixed(g, it) })) }));
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const left = groups.reduce((n, g) => n + g.items.filter((it) => !it.fixed).length, 0);
  const ok = groups.filter((g) => !g.items.length);
  return (
    <aside style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {header && <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 42, padding: '0 4px 12px 6px' }}>
        <ClLabel color={CL.ink}>{title}</ClLabel>
        <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>{left === total ? total + ' câu hỏi' : 'Còn ' + left + ' / ' + total}</span>
        {stale && <button type="button" className="cl-btn" onClick={onRerun} disabled={running} style={{ marginLeft: 'auto', borderRadius: 7, border: '1px solid ' + CL.ink2, background: '#fff', padding: '5px 10px', fontFamily: CL.sans, fontSize: 11, fontWeight: 600, color: CL.ink }}>{running ? 'Đang chấm…' : rerunLabel}</button>}
        <button type="button" className="cl-btn" onClick={onClose} aria-label="Đóng" style={{ marginLeft: stale ? 0 : 'auto', width: 32, height: 32, display: 'grid', placeItems: 'center', color: CL.ink5 }}><ClIcon name="x" size={15} /></button>
      </div>}
      <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, padding: '2px 2px 20px' }}>
        {top}
        {list && cards && groups.flatMap((g) => g.items.map((it) => ({ it, accent: accents && accents[g.id] })))
          .sort(sortItems ? (a, b) => sortItems(a.it, b.it) : () => 0)
          .map(({ it, accent }) => (
            <CommentCard key={it.key} it={it} on={active === it.key} dim={active !== it.key && (it.fixed || (!onTick && seen.includes(it.key)))} accent={accent} onGo={onGo} hideFix={hideFix} onTick={onTick} />
          ))}
        {list && !cards && groups.filter((g) => g.items.length).map((g) => {
          const open = g.items.filter((it) => !it.fixed).length;
          return (
            <section key={g.id} style={{ overflow: 'hidden', borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 50, padding: '0 18px', background: CL.panel, borderBottom: '1px solid ' + CL.ink2 }}>
                {accents && accents[g.id] && <span style={{ width: 9, height: 9, borderRadius: 3, background: accents[g.id].line, flexShrink: 0 }} />}
                <span style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: CL.ink }}>{g.title}</span>
                <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11, fontWeight: 600, color: open ? CL.ink5 : CL.greenText }}>{open ? open + ' chỗ' : 'Đã sửa hết'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {g.items.map((it, k) => {
                  const on = active === it.key;
                  const dim = !on && (it.fixed || seen.includes(it.key));
                  const accent = accents && accents[g.id];
                  return (
                    <button key={it.key} id={'rv-' + it.key} type="button" className="cl-btn cl-rv" onClick={() => onGo(it)} aria-pressed={on} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5, width: '100%', textAlign: 'left', padding: '13px 18px', borderTop: k ? '1px solid ' + CL.ink1 : 'none', background: on ? (accent ? accent.soft : CL.panel) : undefined, boxShadow: on ? 'inset 3px 0 0 ' + (accent ? accent.line : CL.ink) : 'none', opacity: dim ? 0.5 : 1, transition: 'background .15s, opacity .25s' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                        <span style={{ fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: CL.ink5 }}>{it.where}</span>
                        {it.fixed && fixedBadgeOf(false)}
                      </span>
                      {it.quote && <span style={{ borderLeft: '2px solid ' + (accent ? accent.line : CL.ink2), paddingLeft: 9, fontFamily: CL.serif, fontSize: 13, lineHeight: 1.5, fontStyle: 'italic', color: CL.ink6, textWrap: 'pretty' }}>“{it.quote}”</span>}
                      <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.55, color: CL.ink8, textWrap: 'pretty', textDecoration: it.fixed ? 'line-through' : 'none', textDecorationColor: CL.ink3 }}>{it.text}</span>
                      {it.fix && <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, fontFamily: CL.serif, fontSize: 13, lineHeight: 1.5, color: CL.greenText }}><span style={{ fontFamily: CL.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: CL.green }}>Sửa</span>{it.fix}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
        {list && showOk && ok.length > 0 && (
          <section style={{ borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', padding: '14px 18px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <ClIcon name="check" size={12} color={CL.green} />
              <span style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: CL.ink }}>Ổn</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ok.map((g) => <span key={g.id} style={{ borderRadius: 6, background: CL.ink1, padding: '3px 8px', fontFamily: CL.sans, fontSize: 11, color: CL.ink6 }}>{g.title}</span>)}
            </div>
          </section>
        )}
        {list && total === 0 && emptyText && <p style={{ margin: '8px 6px', fontFamily: CL.sans, fontSize: 13, color: CL.ink6 }}>{emptyText}</p>}
      </div>
    </aside>
  );
}

/** Short overall comment above the grouped questions. */
export function ReviewSummary({ title = 'Nhận xét chung', text }: { title?: string; text: string }) {
  return (
    <section style={{ borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', padding: '14px 18px', flexShrink: 0 }}>
      <span style={{ display: 'block', marginBottom: 6, fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: CL.ink }}>{title}</span>
      <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.6, color: CL.ink7, textWrap: 'pretty' }}>{text}</p>
    </section>
  );
}
