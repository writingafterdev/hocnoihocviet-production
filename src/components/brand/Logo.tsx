import { cn } from '@/lib/utils';

/** The mark: a brand drawing (a student walking with an idea) in a small soft tile. With `word`, the wordmark beside it. */
export function Logo({ word = true, className }: { word?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span aria-hidden="true" className="grid size-8 place-items-center overflow-hidden rounded-lg bg-blue-soft">
        <img src="/illustrations/student-walking-with-thought-bubble-backpack.svg" alt="" draggable={false} className="h-7 w-7 object-contain mix-blend-multiply" />
      </span>
      {word && <span className="font-ui text-[15px] font-semibold tracking-[-0.015em] text-ink">hocnoihocviet</span>}
    </span>
  );
}
