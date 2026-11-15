'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CL } from '../chainlab/constants';

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Long feedback, folded: shows the first `lines` lines of text (or the first `height` px of a block) with a soft fade,
 * and "Xem thêm" / "Thu gọn" only when there is more to see. Opening and closing slide the height smoothly (none with
 * reduced motion). Clicks on the toggle don't reach the card underneath.
 */
export function Clamp({ children, lines, height, style }: { children: ReactNode; lines?: number; height?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  /** Folded height and full height, in px (measured). */
  const [box, setBox] = useState<{ folded: number; full: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 20;
      setBox({ folded: lines ? Math.round(lines * lh) : height || 120, full: el.scrollHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, lines, height]);
  const more = !!box && box.full > box.folded + 2;
  const ease = reduced() ? 'none' : 'max-height .38s cubic-bezier(.22,1,.36,1), -webkit-mask-size .38s ease, mask-size .38s ease';
  // The fade is a mask that grows to full size (no fade) when open, so it eases away instead of vanishing.
  const mask = 'linear-gradient(#000 calc(100% - 1.6em), transparent)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minWidth: 0 }}>
      <div ref={ref} style={{
        ...style, width: '100%', overflow: 'hidden',
        maxHeight: !box ? (lines ? lines * 1.5 + 'em' : height) : open || !more ? box.full : box.folded,
        transition: ease,
        ...(more ? { WebkitMaskImage: mask, maskImage: mask, WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskSize: open ? '100% 200%' : '100% 100%', maskSize: open ? '100% 200%' : '100% 100%' } : {}),
      }}>{children}</div>
      {more && (
        <button type="button" className="cl-btn" aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          style={{ border: 'none', background: 'none', padding: 0, fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: CL.ink5, cursor: 'pointer' }}>
          {open ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
}
