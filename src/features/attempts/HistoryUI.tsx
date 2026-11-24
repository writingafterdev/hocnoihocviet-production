'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/base/skeleton/skeleton';

/** Pieces shared by "Bài đã viết" and "Mạch ý đã chứng minh": the page header, the chips and the card that opens in place. */

export function HistoryHeader({ img, tint, title }: { img: string; tint: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
      <div style={{ width: 96, height: 96, borderRadius: 12, background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={'/illustrations/' + img + '.svg'} style={{ width: 84, height: 84, objectFit: 'contain', mixBlendMode: 'multiply' }} alt="" />
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>{title}</h1>
    </div>
  );
}

export const Chip = ({ bg, fg, children }: { bg: string; fg: string; children: ReactNode }) => (
  <span style={{ borderRadius: 4, background: bg, padding: '3px 8px', fontSize: 12, fontWeight: 600, color: fg }}>{children}</span>
);

export const SectionTitle = ({ children }: { children: ReactNode }) => <h2 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 600 }}>{children}</h2>;

const pad = (n: number) => String(n).padStart(2, '0');
export const dayMonth = (t: number) => { const d = new Date(t); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); };

/** A small bordered link button (8px corners, like the app's other secondary buttons). */
export const smallLink: React.CSSProperties = { flexShrink: 0, height: 32, display: 'inline-flex', alignItems: 'center', padding: '0 12px', borderRadius: 8, border: '1px solid #E5E5E5', background: '#fff', color: '#171717', fontSize: 13, fontWeight: 500 };
export const primaryLink: React.CSSProperties = { alignSelf: 'flex-start', height: 34, display: 'inline-flex', alignItems: 'center', padding: '0 14px', borderRadius: 8, border: 'none', background: '#2F62C4', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };

const EASE = 'cubic-bezier(.22,1,.36,1)';

/**
 * One card per prompt or statement: picture, chips, text and a right-hand slot; the whole head is the button that opens
 * the attempts below it. Opening slides the panel down and fades its content in (grid rows 0fr → 1fr), and back.
 */
export function HistoryCard({ img, chips, title, meta, right, open, onToggle, children }: { img: string | ReactNode; chips: ReactNode; title: ReactNode; meta: ReactNode; right?: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div style={{ borderRadius: 12, background: '#fff', overflow: 'hidden', boxShadow: '0 0 0 1px ' + (open ? '#DCE7F7' : 'rgba(0,0,0,0.1)') + ', 0 1px 2px rgba(0,0,0,0.05)', transition: 'box-shadow .3s ease' }}>
      <button type="button" onClick={onToggle} aria-expanded={open} style={{ all: 'unset', boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px 10px 10px', cursor: 'pointer', fontFamily: 'var(--font-sans)', color: '#171717' }}>
        <span style={{ width: 120, height: 96, flexShrink: 0, borderRadius: 8, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {typeof img === 'string' ? <img src={'/illustrations/' + img + '.svg'} alt="" style={{ width: 84, height: 84, objectFit: 'contain', mixBlendMode: 'multiply' }} /> : img}
        </span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{chips}</span>
          <span style={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</span>
          <span style={{ fontSize: 12, color: '#737373' }}>{meta}</span>
        </span>
        {right}
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .3s ' + EASE }}><path d="M4 6l4 4 4-4" fill="none" stroke="#737373" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .34s ' + EASE }}>
        {/* Closed: out of the tab order and hidden from screen readers, though still there to animate. */}
        <div inert={!open} aria-hidden={!open} style={{ minHeight: 0, overflow: 'hidden', opacity: open ? 1 : 0, transition: 'opacity .26s ease' }}>
          <div style={{ borderTop: '1px solid #F0F0F0', background: '#FAFAFA', padding: '12px 20px 16px 146px', display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Filters in a left column beside the list (they stack above it on a narrow screen). */
export function HistoryLayout({ filters, children }: { filters: ReactNode; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
      <aside aria-label="Lọc" style={{ flex: '1 1 220px', maxWidth: 260 }}>{filters}</aside>
      <section style={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>{children}</section>
    </div>
  );
}

/** While the list loads: the filter column and three cards in their shape. */
export function HistoryBone() {
  const bone = (w: number | string, h: number) => <Skeleton shape="text" style={{ width: w, height: h }} />;
  return (
    <div aria-hidden className="co-skel-in" style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
      <div style={{ flex: '1 1 220px', maxWidth: 260, display: 'flex', flexDirection: 'column', gap: 16 }}>{bone(90, 18)}{bone(140, 14)}{bone(120, 14)}{bone(150, 14)}</div>
      <div style={{ flex: '999 1 560px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: 10, borderRadius: 12, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }}>
            {bone(120, 96)}
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6 }}>{bone(180, 14)}{bone('80%', 14)}{bone(120, 11)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
