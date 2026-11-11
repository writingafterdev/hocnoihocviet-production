import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The frame every chart sits in: a small grey eyebrow, a bold title (with an optional big number and a change),
 * a switcher on the right, a hairline, then the chart. Layout follows the BRIX chart kit (Figma Community).
 */
export function ChartCard({ eyebrow, title, value, delta, right, children, className, bodyClassName }: {
  eyebrow?: string; title: string; value?: ReactNode; delta?: { text: string; up?: boolean; note?: string };
  right?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string;
}) {
  return (
    <section className={cn('flex min-w-0 flex-col rounded-xl bg-white shadow-ring', className)}>
      <header className="flex items-start justify-between gap-4 px-6 pb-4 pt-5">
        <div className="min-w-0">
          {eyebrow && <p className="m-0 text-[15px] leading-5 text-ink-soft">{eyebrow}</p>}
          <h3 className="m-0 truncate text-xl font-semibold leading-7 tracking-[-0.01em] text-ink">{title}</h3>
          {value !== undefined && (
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className="text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink tabular-nums">{value}</span>
              {delta && <span className={cn('text-[13px] font-semibold', delta.up === false ? 'text-tomato-deep' : 'text-leaf')}>{delta.up === false ? '▼' : '▲'} {delta.text}{delta.note && <span className="ml-1 font-medium uppercase tracking-wide text-ink-soft">{delta.note}</span>}</span>}
            </div>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </header>
      <div className="mx-6 border-t border-line" />
      <div className={cn('min-h-0 flex-1 px-6 pb-5 pt-4', bodyClassName)}>{children}</div>
    </section>
  );
}
