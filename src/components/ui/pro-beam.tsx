'use client';

import type { CSSProperties, ReactNode } from 'react';
import { usePro } from '@/lib/pro';

/**
 * Pro-only buttons, when the visitor is Pro: the button face becomes a slow-moving gradient with a fine white grain
 * (`.pro-fill` in globals.css). `kind="avatar"` (the account picture, which has no face to fill) gets a thin ring in the
 * same colours instead (`.pro-ring`). Everyone else gets the plain button.
 */
export function ProBeam({ children, className, radius = 10, kind = 'button' }: { children: ReactNode; className?: string; radius?: number; kind?: 'button' | 'avatar' }) {
  const pro = usePro();
  if (!pro) return <>{children}</>;
  if (kind === 'button') return <span className={'pro-fill' + (className ? ' ' + className : '')}>{children}</span>;
  return (
    <span className={'pro-ring' + (className ? ' ' + className : '')} style={{ ['--pro-r' as string]: radius + 4 + 'px' } as CSSProperties}>
      <span className="pro-ring-in">{children}</span>
    </span>
  );
}
