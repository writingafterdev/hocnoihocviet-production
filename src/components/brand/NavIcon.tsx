import { cn } from '@/lib/utils';

/**
 * The sidebar's icons: Icons8 "Plumpy" (one pack for the whole app, see icons8.json), recoloured to the brand
 * palette (blue, tomato, sun, leaf, blush) and shown at 20px from 64px files in /public/icons. Each stands for a page: home, the quick drill (lightning), writing (pencil),
 * vocabulary (book) and the student's own essays (document).
 */
export type NavIconName = 'home' | 'drill' | 'write' | 'vocab' | 'essays' | 'progress';

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={name === 'progress' ? '/icons/filters/bar-chart.png' : `/icons/${name}.png`} width={20} height={20} alt="" aria-hidden="true" draggable={false} className={cn('shrink-0', className)} />;
}
