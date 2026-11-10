import { cn } from '@/lib/utils';

/** The mark: a small blue tile with a lowercase "h". With `word`, the lowercase wordmark beside it. */
export function Logo({ word = true, className }: { word?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span aria-hidden="true" className="grid size-7 place-items-center rounded-[7px] bg-primary pb-px font-ui text-[15px] font-semibold leading-none text-white">h</span>
      {word && <span className="font-ui text-[15px] font-semibold tracking-[-0.015em] text-ink">hocnoihocviet</span>}
    </span>
  );
}
