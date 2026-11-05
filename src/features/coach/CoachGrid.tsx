'use client';

import { useRef, type ReactNode } from 'react';

/**
 * Main column + right column. The right column slides open and shut like the old writing screens: the grid
 * track eases, while the panel inside keeps its width and fades and drifts (see .co-grid in globals.css).
 */
export function CoachGrid({ main, side, open }: { main: ReactNode; side: ReactNode; open: boolean }) {
  return (
    <div className={'co-grid' + (open ? '' : ' shut')}>
      {main}
      <aside className="co-side" aria-hidden={!open || undefined} inert={!open || undefined}>
        <div className="co-side-in">{side}</div>
      </aside>
    </div>
  );
}

/** One panel in the right column. Panels share the height; one that turns off folds away with the same ease. */
export function SidePanel({ on, grow = 1, top = false, children }: { on: boolean; grow?: number; top?: boolean; children: ReactNode }) {
  return <div className={'co-stack' + (on ? '' : ' off')} style={{ flex: grow + ' 1 0px', marginTop: top ? 14 : 0 }}>{children}</div>;
}

/** The last non-null value, so a panel keeps its content while it slides shut. */
export function useLast<T>(value: T | null | undefined): T | null {
  const ref = useRef<T | null>(null);
  if (value != null) ref.current = value;
  return value ?? ref.current;
}
