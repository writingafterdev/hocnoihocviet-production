import { cn } from '@/lib/utils';

/** The mark: an ink circle with an italic serif "h", like a pen stamp. With `word`, the lowercase wordmark beside it. */
export function Logo({ word = true, className }: { word?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-ink pb-0.5 font-display text-[21px] italic leading-none text-paper">h.</span>
      {word && <span className="font-ui text-[17px] font-semibold tracking-[-0.01em] text-ink">hocnoihocviet</span>}
    </span>
  );
}
