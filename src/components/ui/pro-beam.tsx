'use client';

import { BorderBeam } from 'border-beam';
import type { ReactNode } from 'react';
import { usePro } from '@/lib/pro';

/**
 * Wraps a Pro-only button in the travelling rainbow border (border-beam, MIT) when the visitor is Pro, so Pro
 * features look special. Everyone else gets the plain button.
 */
export function ProBeam({ children, className, size = 'sm', radius = 10 }: { children: ReactNode; className?: string; size?: 'sm' | 'md'; radius?: number }) {
  const pro = usePro();
  if (!pro) return <>{children}</>;
  return (
    <BorderBeam size={size} theme="dark" colorVariant="colorful" strength={1} brightness={1.5} saturation={1.4} borderRadius={radius} className={className} style={{ display: 'inline-flex', flexShrink: 0 }}>
      {children}
    </BorderBeam>
  );
}
