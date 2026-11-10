import { cn } from '@/lib/utils';

/**
 * The sidebar's icons: Icons8 "Cute Color" (one pack for the whole app, see icons8.json), shown at 20px from
 * 64px files in /public/icons. Each stands for a page: home, the quick drill (lightning), writing (pencil),
 * vocabulary (book) and the student's own essays (document).
 */
export type NavIconName = 'home' | 'drill' | 'write' | 'vocab' | 'essays';

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/icons/${name}.png`} width={20} height={20} alt="" aria-hidden="true" draggable={false} className={cn('shrink-0', className)} />;
}
