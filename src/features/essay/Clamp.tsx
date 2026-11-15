'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CL } from '../chainlab/constants';

/**
 * Long feedback, folded: shows the first `lines` lines of text (or the first `height` px of a block, with a fade), and
 * "Xem thêm" / "Thu gọn" only when there is more to see. Clicks on the toggle don't reach the card underneath.
 */
export function Clamp({ children, lines, height, style }: { children: ReactNode; lines?: number; height?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const check = () => setMore(el.scrollHeight > el.clientHeight + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, children]);
  const folded: CSSProperties = open ? {} : lines
    ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lines, overflow: 'hidden' }
    : { maxHeight: height, overflow: 'hidden', ...(more ? { WebkitMaskImage: 'linear-gradient(#000 65%, transparent)', maskImage: 'linear-gradient(#000 65%, transparent)' } : {}) };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minWidth: 0 }}>
      <div ref={ref} style={{ ...style, ...folded, width: '100%' }}>{children}</div>
      {(more || open) && (
        <button type="button" className="cl-btn" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          style={{ border: 'none', background: 'none', padding: 0, fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: CL.ink5, cursor: 'pointer' }}>
          {open ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
}
