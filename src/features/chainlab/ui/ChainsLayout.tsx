'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { EASE } from '../constants';

/** Below these widths the three panels no longer fit: two columns, then one stacked column. */
const THREE_MIN = 1180, TWO_MIN = 860, GAP = 20;

/**
 * The chains screen: [map + rope] [chain editor, with the translator under it] [review].
 * The review column only exists while a review is open. On narrower windows it takes the place of the chain panel,
 * and on phones everything stacks.
 */
export function ChainsLayout({ left, middle, bottom, bottomOpen, right, rightOpen }: { left: ReactNode; middle: ReactNode; bottom: ReactNode; bottomOpen: boolean; right: ReactNode; rightOpen: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(1600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (w < TWO_MIN) {
    return (
      <div ref={ref} className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ flexShrink: 0, height: 640 }}>{left}</div>
        <div style={{ flexShrink: 0, height: 640 }}>{middle}</div>
        {bottomOpen && <div style={{ flexShrink: 0, height: 460 }}>{bottom}</div>}
        {rightOpen && <div style={{ flexShrink: 0, height: 560 }}>{right}</div>}
      </div>
    );
  }

  const wide = w >= THREE_MIN;
  // Two columns: the review replaces the chain panel while it is open.
  const showMiddle = wide || !rightOpen;
  const cols = wide
    ? 'minmax(0,1.1fr) minmax(0,1fr) ' + (rightOpen ? 'minmax(0,0.8fr)' : '0fr')
    : 'minmax(0,1.1fr) minmax(0,1fr)';
  return (
    <div ref={ref} style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: cols, columnGap: 0, transition: 'grid-template-columns .45s ' + EASE }}>
      <div style={{ minWidth: 0, minHeight: 0, paddingRight: GAP, display: 'flex', flexDirection: 'column' }}>{left}</div>
      <div style={{ minWidth: 0, minHeight: 0, paddingRight: wide && rightOpen ? GAP : 0, display: 'flex', flexDirection: 'column', transition: 'padding .45s ' + EASE }}>
        {showMiddle ? (
          <>
            <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column' }}>{middle}</div>
            <div style={{ flex: bottomOpen ? '0 0 40%' : '0 0 0px', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingTop: bottomOpen ? 16 : 0, opacity: bottomOpen ? 1 : 0, transition: 'flex .45s ' + EASE + ', padding .45s ' + EASE + ', opacity .3s' }}>{bottomOpen && bottom}</div>
          </>
        ) : right}
      </div>
      {wide && <div style={{ minWidth: 0, minHeight: 0, overflow: 'hidden', opacity: rightOpen ? 1 : 0, transition: 'opacity .3s' }}><div style={{ minWidth: 300, height: '100%', display: 'flex', flexDirection: 'column' }}>{rightOpen && right}</div></div>}
    </div>
  );
}
