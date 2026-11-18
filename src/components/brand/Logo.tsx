import { cn } from '@/lib/utils';

/**
 * The brand: the hand-lettered "Học Nói Học Viết" wordmark. Without `word` (the collapsed sidebar) only its mark: the H
 * being placed by a hand, on its peach tile (the same picture as the favicon).
 */
export function Logo({ word = true, className }: { word?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      {word
        ? <img src="/assets/brand/wordmark.svg" alt="Học Nói Học Viết" draggable={false} className="h-[50px] w-auto select-none" />
        : <img src="/assets/brand/logo-mark.svg" alt="" aria-hidden="true" draggable={false} className="size-8 select-none" />}
    </span>
  );
}
