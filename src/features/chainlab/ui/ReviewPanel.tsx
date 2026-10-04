'use client';

import type { ReactNode } from 'react';
import { CL } from '../constants';
import type { Chain, ReviewGroup, ReviewItem } from '../types';
import { ClIcon, ClLabel } from './primitives';

export interface ReviewPanelProps {
  review: { groups: ReviewGroup[] };
  /** A fresh run on the current input, used to mark items that no longer apply as fixed. */
  live?: { groups: ReviewGroup[] };
  chains?: Chain[];
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
}

/** Right-hand feedback panel: grouped questions, "Đã sửa?" once an item no longer applies. */
export function ReviewPanel({ review, live, chains = [], stale, running, onRerun, onClose, onGo, seen, fixedFn, top, title = 'Nhận xét', rerunLabel = 'Soát lại' }: ReviewPanelProps) {
  const liveSet = new Set((live || review).groups.flatMap((g) => g.items.map((it) => g.id + '|' + it.text)));
  const isFixed = fixedFn || ((g: ReviewGroup, it: ReviewItem) => {
    if (it.snapKind) {
      const c = chains.find((x) => x.id === it.chainId);
      if (!c) return true;
      const cur = it.snapKind === 'flag' ? c.steps[it.at] + '||' + c.steps[it.at + 1] : c.steps[it.at];
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 42, padding: '0 4px 12px 6px' }}>
        <ClLabel color={CL.ink}>{title}</ClLabel>
        <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>{left === total ? total + ' câu hỏi' : 'Còn ' + left + ' / ' + total}</span>
        {stale && <button type="button" className="cl-btn" onClick={onRerun} disabled={running} style={{ marginLeft: 'auto', borderRadius: 7, border: '1px solid ' + CL.ink2, background: '#fff', padding: '5px 10px', fontFamily: CL.sans, fontSize: 11, fontWeight: 600, color: CL.ink }}>{running ? 'Đang chấm…' : rerunLabel}</button>}
        <button type="button" className="cl-btn" onClick={onClose} aria-label="Đóng" style={{ marginLeft: stale ? 0 : 'auto', width: 32, height: 32, display: 'grid', placeItems: 'center', color: CL.ink5 }}><ClIcon name="x" size={15} /></button>
      </div>
      <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, padding: '2px 2px 20px' }}>
        {top}
        {groups.filter((g) => g.items.length).map((g) => {
          const open = g.items.filter((it) => !it.fixed).length;
          return (
            <section key={g.id} style={{ overflow: 'hidden', borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 50, padding: '0 18px', background: CL.panel, borderBottom: '1px solid ' + CL.ink2 }}>
                <span style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: CL.ink }}>{g.title}</span>
                <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11, fontWeight: 600, color: open ? CL.ink5 : CL.greenText }}>{open ? open + ' chỗ' : 'Đã sửa hết'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {g.items.map((it, k) => {
                  const dim = it.fixed || seen.includes(it.key);
                  return (
                    <button key={it.key} type="button" className="cl-btn cl-rv" onClick={() => onGo(it)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5, width: '100%', textAlign: 'left', padding: '13px 18px', borderTop: k ? '1px solid ' + CL.ink1 : 'none', opacity: dim ? 0.5 : 1, transition: 'background .15s, opacity .25s' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                        <span style={{ fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: CL.ink5 }}>{it.where}</span>
                        {it.fixed && <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 5, background: CL.mintSoft, padding: '2px 7px', fontFamily: CL.sans, fontSize: 10, fontWeight: 600, color: CL.greenText, whiteSpace: 'nowrap' }}><ClIcon name="check" size={10} color={CL.green} />Đã sửa?</span>}
                      </span>
                      <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.55, color: CL.ink8, textWrap: 'pretty', textDecoration: it.fixed ? 'line-through' : 'none', textDecorationColor: CL.ink3 }}>{it.text}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
        {ok.length > 0 && (
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
        {total === 0 && <p style={{ margin: '8px 6px', fontFamily: CL.sans, fontSize: 13, color: CL.ink6 }}>Không thấy vấn đề nào. Sẵn sàng viết.</p>}
      </div>
    </aside>
  );
}
