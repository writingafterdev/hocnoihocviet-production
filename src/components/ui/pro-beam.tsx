'use client';

import type { CSSProperties, ReactNode } from 'react';
import { usePro } from '@/lib/pro';

/**
 * Pro-only buttons get a vivid rainbow ring that travels around them, with a soft glow behind, when the visitor is
 * Pro. The button sits in a thin white frame so the ring reads clearly against any button colour. Everyone else gets
 * the plain button. The look is in `.pro-ring` (globals.css): speed, colours and glow strength are all there.
 */
export function ProBeam({ children, className, radius = 10 }: { children: ReactNode; className?: string; radius?: number }) {
  const pro = usePro();
  if (!pro) return <>{children}</>;
  return (
    <span className={'pro-ring' + (className ? ' ' + className : '')} style={{ ['--pro-r' as string]: radius + 4 + 'px' } as CSSProperties}>
      <span className="pro-ring-in">{children}</span>
    </span>
  );
}
