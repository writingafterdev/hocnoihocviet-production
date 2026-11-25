'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { T1Prompt } from '@/content/task1';
import { CL } from '../chainlab/constants';
import { hintsOf, judge, type Row } from './engine';

/**
 * The first visit to ① So sánh: one finding done together, on the prompt's own chart. The finding is the first simple
 * Gợi ý answer (one line "cao nhất"/"thấp nhất", or "Tất cả" + a trend); a chart with neither (sports) compares two
 * numbers instead ("pair": one bar, "cao hơn", the other bar), so every prompt has one without extra content.
 */
export interface TourPlan {
  first: { kind: 'item'; group: string; id: string; name: string; shape: 'line' | 'bars' | 'pies' | 'table' } | { kind: 'all'; group: string }
    | { kind: 'pair'; group: string; a: string; b: string; nameA: string; nameB: string; at: string; shape: 'line' | 'bars' | 'pies' | 'table' };
  tip: string; why: string;
}

const SEEN_KEY = 'hnhv.t1tour';
export const tourSeen = () => { try { return localStorage.getItem(SEEN_KEY) === 'done'; } catch { return true; } };
export const markTourSeen = () => { try { localStorage.setItem(SEEN_KEY, 'done'); } catch { /* private window */ } };

const sameRow = (a: Row, b: Row) => a.length === b.length && a.every((e, i) => e.k === b[i].k && e.id === b[i].id);

export function tourPlanOf(prompt: T1Prompt, found: { row: Row }[]): TourPlan | null {
  for (const h of hintsOf(prompt)) {
    const p = prompt.parts.find((x) => x.id === h.part);
    if (!p) continue;
    let plan: TourPlan | null = null;
    if (h.feat.all) plan = { first: { kind: 'all', group: p.id }, tip: h.feat.tip, why: 'Tất cả đều ' + h.feat.tip + ' từ đầu đến cuối.' };
    else if ((h.feat.tip === 'cao nhất' || h.feat.tip === 'thấp nhất') && h.feat.items.length === 1 && !/trừ/.test(h.feat.label)) {
      const it = p.items.find((x) => x.name === h.feat.items[0]);
      const every = (h.text.match(/ở mọi ([^\s.,]+)/) || [])[1];
      const shape = p.kind, top = h.feat.tip === 'cao nhất';
      const sees = shape === 'table' ? (p.rowsAreAxis ? 'Cột ' : 'Hàng ') + it?.name + ' luôn ' + (top ? 'cao' : 'thấp') + ' nhất' : shape === 'bars' ? 'Cột ' + it?.name + ' luôn ' + (top ? 'cao' : 'thấp') + ' hơn các cột khác' : shape === 'pies' ? 'Phần ' + it?.name + ' luôn ' + (top ? 'lớn' : 'nhỏ') + ' nhất' : 'Đường ' + it?.name + ' nằm ' + (top ? 'trên cùng' : 'dưới cùng');
      if (it) plan = { first: { kind: 'item', group: p.id + '>item:' + it.id, id: it.id, name: it.name, shape }, tip: h.feat.tip, why: sees + (every ? ' ở mọi ' + every : '') + '.' };
    }
    if (!plan) continue;
    const row: Row = [{ k: 'group', id: plan.first.group }, { k: 'tip', id: plan.tip }];
    if (!found.some((f) => sameRow(f.row, row))) return plan;
  }
  // No simple finding: two numbers compared. First a "cao hơn"/"thấp hơn" hint between two cells of one column, then the
  // biggest and smallest number of a column; only a pair the checks pass (a hint's two numbers can be its exception).
  const unit = (shape: string) => (shape === 'bars' ? 'cột' : shape === 'pies' ? 'phần' : shape === 'table' ? 'ô' : 'điểm');
  const pairPlan = (p: T1Prompt['parts'][number], a: string, b: string, tip: string): TourPlan | null => {
    const ca = a.split('.'), cb = b.split('.');
    if (ca[2] !== cb[2]) return null;
    const row: Row = [{ k: 'val', id: a }, { k: 'tip', id: tip }, { k: 'val', id: b }];
    if (found.some((f) => sameRow(f.row, row)) || !judge(prompt, row).ok) return null;
    const name = (id: string) => p.items.find((x) => x.id === id)?.name || id, at = p.axis.labels[+ca[2]] || '', u = unit(p.kind);
    return { first: { kind: 'pair', group: p.id, a, b, nameA: name(ca[1]), nameB: name(cb[1]), at, shape: p.kind }, tip,
      why: (at ? 'Ở ' + at + ', ' : '') + u + ' ' + name(ca[1]) + (tip === 'cao hơn' ? ' lớn hơn hẳn ' : ' nhỏ hơn hẳn ') + u + ' ' + name(cb[1]) + '.' };
  };
  for (const h of hintsOf(prompt)) {
    const p = prompt.parts.find((x) => x.id === h.part);
    if (!p || h.ids.length !== 2 || (h.feat.tip !== 'cao hơn' && h.feat.tip !== 'thấp hơn')) continue;
    const plan = pairPlan(p, h.ids[0], h.ids[1], h.feat.tip);
    if (plan) return plan;
  }
  for (const p of prompt.parts) {
    for (let ai = 0; ai < p.axis.labels.length; ai++) {
      const vals = p.items.map((it) => ({ id: p.id + '.' + it.id + '.' + ai, v: p.data[it.id][ai] })).filter((x): x is { id: string; v: number } => x.v !== null).sort((x, y) => y.v - x.v);
      if (vals.length < 2) continue;
      const plan = pairPlan(p, vals[0].id, vals[vals.length - 1].id, 'cao hơn');
      if (plan) return plan;
    }
  }
  return null;
}

/**
 * Which step the student is on, read from what is in the box, so undoing a move steps back: 1 the first thing on the chart,
 * 2 the comparison, 3 the second number (pair only), 4 Kiểm tra, 5 done.
 */
export type TourStage = 1 | 2 | 3 | 4 | 5;
export function tourStage(plan: TourPlan, row: Row, foundNow: number, foundAtStart: number): TourStage {
  if (foundNow > foundAtStart) return 5;
  const f = plan.first;
  if (f.kind === 'pair') {
    if (!row.some((e) => e.k === 'val' && e.id === f.a)) return 1;
    if (!row.some((e) => e.k === 'tip' && e.id === plan.tip)) return 2;
    if (!row.some((e) => e.k === 'val' && e.id === f.b)) return 3;
    return 4;
  }
  if (!row.some((e) => e.k === 'group' && e.id === f.group)) return 1;
  if (!row.some((e) => e.k === 'tip' && e.id === plan.tip)) return 2;
  return 4;
}

type Rect = { x: number; y: number; w: number; h: number };
const rectOf = (sel: string): Rect | null => {
  const el = document.querySelector<HTMLElement>('[data-tour="' + sel + '"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width || r.height ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
};
const hole = (r: Rect, pad = 6, rad = 10) => {
  const x = r.x - pad, y = r.y - pad, w = r.w + pad * 2, h = r.h + pad * 2, k = Math.min(rad, w / 2, h / 2);
  return `M${x + k} ${y}H${x + w - k}A${k} ${k} 0 0 1 ${x + w} ${y + k}V${y + h - k}A${k} ${k} 0 0 1 ${x + w - k} ${y + h}H${x + k}A${k} ${k} 0 0 1 ${x} ${y + h - k}V${y + k}A${k} ${k} 0 0 1 ${x + k} ${y}Z`;
};

const CARD_W = 300;

/** The dim layer with gaps over `holes` (clicks pass through the gaps only), a ring on `anchor`, and the card beside it. */
export function TourLayer({ step, holes, anchor, side, dim, title, children, action }: {
  step: number; holes: string[]; anchor: string; side: 'above' | 'below'; dim: boolean; title: string; children: ReactNode; action: ReactNode;
}) {
  const [rects, setRects] = useState<{ holes: Rect[]; anchor: Rect | null; vw: number; vh: number; menu: boolean } | null>(null);
  const last = useRef('');
  useEffect(() => {
    let raf = 0;
    // Measured every frame: chips joining the box, the panel scrolling and the window resizing all move the targets.
    const tick = () => {
      // A tip's variants menu open: the card steps aside so the menu is the thing to read.
      // A gap inside another gap (a table's row name inside the table) is dropped: two gaps on top of each other cancel out
      // in the even-odd fill, which would dim the very thing to press and block the click.
      const found = holes.map(rectOf).filter((r): r is Rect => !!r);
      const inside = (a: Rect, b: Rect) => a !== b && a.x >= b.x - 1 && a.y >= b.y - 1 && a.x + a.w <= b.x + b.w + 1 && a.y + a.h <= b.y + b.h + 1;
      const next = { holes: found.filter((r) => !found.some((o) => inside(r, o))), anchor: rectOf(anchor), vw: window.innerWidth, vh: window.innerHeight, menu: !!document.querySelector('[role="menu"]') };
      const key = JSON.stringify(next);
      if (key !== last.current) { last.current = key; setRects(next); }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [holes.join('|'), anchor]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!rects || !rects.anchor) return null;
  const a = rects.anchor, cx = a.x + a.w / 2;
  const left = Math.max(12, Math.min(rects.vw - CARD_W - 12, cx - CARD_W / 2));
  const above = side === 'above';
  return createPortal(
    <>
      <style>{`@keyframes t1TourIn{from{opacity:0;transform:translateY(${above ? 'calc(-100% + 6px)' : '6px'})}to{opacity:1;transform:translateY(${above ? '-100%' : '0'})}}@keyframes t1TourRing{0%{box-shadow:0 0 0 3px #FFC73C,0 0 0 3px rgba(255,199,60,.5)}100%{box-shadow:0 0 0 3px #FFC73C,0 0 0 12px rgba(255,199,60,0)}}`}</style>
      {dim && (
        <svg aria-hidden="true" width={rects.vw} height={rects.vh} style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none' }}>
          <path d={`M0 0H${rects.vw}V${rects.vh}H0Z ` + rects.holes.map((r) => hole(r)).join(' ')} fillRule="evenodd" fill="rgba(20,20,19,.42)" style={{ pointerEvents: 'auto' }} />
        </svg>
      )}
      {!rects.menu && <div aria-hidden="true" style={{ position: 'fixed', left: a.x - 4, top: a.y - 4, width: a.w + 8, height: a.h + 8, borderRadius: 10, zIndex: 41, pointerEvents: 'none', animation: 't1TourRing 1.4s ease-out infinite' }} />}
      {!rects.menu && <div key={step} role="dialog" aria-label={title} style={{ position: 'fixed', left, top: above ? a.y - 16 : a.y + a.h + 16, transform: above ? 'translateY(-100%)' : 'none', width: CARD_W, boxSizing: 'border-box', zIndex: 45, padding: '16px 18px 14px', borderRadius: 12, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,.06), 0 16px 40px -12px rgba(0,0,0,.35)', display: 'flex', flexDirection: 'column', gap: 10, animation: 't1TourIn .22s cubic-bezier(.2,.8,.2,1)' }}>
        <span aria-hidden="true" style={{ position: 'absolute', left: Math.max(16, Math.min(CARD_W - 28, cx - left - 6)), ...(above ? { bottom: -6 } : { top: -6 }), width: 12, height: 12, background: '#fff', transform: 'rotate(45deg)', boxShadow: above ? '3px 3px 4px -2px rgba(0,0,0,.12)' : '-3px -3px 4px -2px rgba(0,0,0,.08)' }} />
        <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, color: CL.ink }}>{title}</span>
        <span style={{ fontSize: 13.5, lineHeight: 1.55, color: '#404040' }}>{children}</span>
        {action}
      </div>}
    </>,
    document.body,
  );
}
