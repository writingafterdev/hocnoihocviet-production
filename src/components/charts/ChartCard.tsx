import type { ReactNode } from 'react';
import { Illustration } from '@/components/brand/Illustration';
import { cn } from '@/lib/utils';

/**
 * The frame every chart sits in. `tint` is a brand tint class (bg-blue-soft, bg-tomato-soft...) for a coloured card;
 * without it the card is white with a ring. `art` is a brand drawing shown in a small white tile beside the title.
 * Header: a small grey eyebrow, a bold title (with an optional big number and change) and a switcher on the right.
 */
export function ChartCard({ eyebrow, title, value, delta, right, art, tint, tone = 'white', children, className, bodyClassName }: {
  tone?: 'white' | 'grey'; eyebrow?: string; title: string; value?: ReactNode; delta?: { text: string; up?: boolean; note?: string };
  right?: ReactNode; art?: string; tint?: string; children: ReactNode; className?: string; bodyClassName?: string;
}) {
  return (
    <section className={cn('flex min-w-0 flex-col rounded-xl', tint ? tint + ' shadow-ring' : tone === 'grey' ? 'rounded-2xl bg-[#F7F7F7]' : 'bg-white shadow-ring', className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-6 pb-4 pt-5">
        <div className="flex min-w-0 items-center gap-4">
          {art && <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-white/80"><Illustration name={art} className="h-14 w-auto" /></div>}
          <div className="min-w-0">
            {eyebrow && <p className="m-0 text-[13px] font-medium leading-5 text-ink-soft">{eyebrow}</p>}
            <h3 className="m-0 truncate text-xl font-semibold leading-7 tracking-[-0.01em] text-ink">{title}</h3>
            {value !== undefined && (
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                <span className="text-[32px] font-semibold leading-10 tracking-[-0.02em] text-ink tabular-nums">{value}</span>
                {delta && <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[14px] font-medium', delta.up === false ? 'bg-tomato-soft text-tomato-deep' : 'bg-leaf-soft text-leaf')}>{delta.up === false ? '−' : '+'}{delta.text}</span>}
                {delta?.note && <span className="text-[13px] text-ink-soft">{delta.note}</span>}
              </div>
            )}
          </div>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </header>
      <div className={cn('min-h-0 flex-1 px-6 pb-6', bodyClassName)}>{children}</div>
    </section>
  );
}
