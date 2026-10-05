'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { EASE } from '../constants';

/** Below this workspace width, three columns leave the middle too narrow: the rail becomes a drawer instead. */
const THREE_MIN = 1020;
const RAIL = 432, RIGHT = 406, SIDE_MIN = 320, GAP = 26;

/** Width of the workspace (or the window, before the first measure). */
function useWidth(ref: React.RefObject<HTMLElement>) {
  const [w, setW] = useState(1600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/** Whether the workspace fits three columns at this window size (same rule as WorkspaceGrid). */
export function useThreePanels() {
  const [three, setThree] = useState(true);
  useEffect(() => {
    const on = () => setThree(Math.min(window.innerWidth, 1710) - 80 >= THREE_MIN);
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return three;
}

const clamp = (x: number, lo: number, hi: number) => Math.round(Math.max(lo, Math.min(hi, x)));

/**
 * Three-column workspace shared by ChainLab and the Writing Desk: prompt rail · main · right column.
 * The right column holds the feedback panel and/or the translator, stacked when both are open.
 * Opening a column resizes the others with the same slide; the main column gives up most of the space.
 * On narrow screens the rail can't sit beside an open right column, so it comes back as a drawer.
 */
export function WorkspaceGrid({ rail, railOpen, reviewOpen, main, panel, side, sideOpen = false }: { rail: ReactNode; railOpen: boolean; reviewOpen: boolean; main: ReactNode; panel: ReactNode; side?: ReactNode; sideOpen?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref);
  const three = w >= THREE_MIN;
  const rightOpen = reviewOpen || sideOpen;
  const showRail = railOpen && (three || !rightOpen);
  const drawer = !three && railOpen && rightOpen;
  // Both sides open: each gives up some width so the main column keeps at least about half.
  const both = showRail && rightOpen;
  const railW = both ? clamp(w * 0.25, SIDE_MIN, RAIL) : RAIL;
  const rightW = both ? clamp(w * 0.24, SIDE_MIN, RIGHT) : RIGHT;
  // Keep the last width while a column slides shut, so its content doesn't jump.
  const lastRight = useRef(rightW);
  if (rightOpen) lastRight.current = rightW;
  const lastRail = useRef(railW);
  if (showRail) lastRail.current = railW;
  const stack = (open: boolean, grow: number): React.CSSProperties => ({ flex: open ? grow + ' 1 0px' : '0 0 0px', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: open ? 1 : 0, transition: 'flex .5s ' + EASE + ', opacity .35s' });

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: (showRail ? railW : 0) + 'px minmax(0,1fr) ' + (rightOpen ? rightW : 0) + 'px', transition: 'grid-template-columns .5s ' + EASE }}>
      <div style={{ minWidth: 0, minHeight: 0, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: lastRail.current, flexShrink: 0, height: '100%', paddingRight: GAP, display: 'flex', flexDirection: 'column', opacity: showRail ? 1 : 0, transform: showRail ? 'none' : 'translateX(-24px)', transition: 'width .5s ' + EASE + ', opacity .35s, transform .5s ' + EASE }}>{!drawer && rail}</div>
      </div>
      {!three && rightOpen && (
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 20, width: RIGHT, maxWidth: 'calc(100% - 40px)', display: 'flex', flexDirection: 'column', borderRadius: 18, boxShadow: drawer ? '0 18px 48px rgba(20,20,19,.16)' : 'none', opacity: drawer ? 1 : 0, transform: drawer ? 'none' : 'translateX(-24px)', pointerEvents: drawer ? 'auto' : 'none', transition: 'opacity .3s, transform .45s ' + EASE + ', box-shadow .3s' }}>{drawer && rail}</div>
      )}
      {main}
      <div style={{ minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        <div style={{ width: lastRight.current, height: '100%', paddingLeft: GAP, display: 'flex', flexDirection: 'column', gap: reviewOpen && sideOpen ? 16 : 0, opacity: rightOpen ? 1 : 0, transform: rightOpen ? 'none' : 'translateX(24px)', transition: 'width .5s ' + EASE + ', gap .5s ' + EASE + ', opacity .35s, transform .5s ' + EASE }}>
          <div style={stack(reviewOpen, 3)}>{reviewOpen && panel}</div>
          <div style={stack(sideOpen, 2)}>{sideOpen && side}</div>
        </div>
      </div>
    </div>
  );
}
