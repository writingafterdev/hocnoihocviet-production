import type { ReactNode } from 'react';

/** The small dark tooltip every chart shares (rounded, white text, a bold second line). */
export function TipBox({ title, children }: { title?: ReactNode; children?: ReactNode }) {
  return (
    <div className="pointer-events-none rounded-lg bg-ink px-3 py-2 text-center text-white shadow-lg">
      {title && <div className="text-[12px] leading-4 text-white/70">{title}</div>}
      {children && <div className="text-[15px] font-semibold leading-5">{children}</div>}
    </div>
  );
}
