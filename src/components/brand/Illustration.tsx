import { cn } from '@/lib/utils';

/**
 * One of the brand illustrations (public/illustrations, hand-drawn comic style). The drawings have white fills,
 * so on a tinted panel they are multiplied into it rather than sitting in a white box.
 */
export function Illustration({ name, className, alt = '' }: { name: string; className?: string; alt?: string }) {
  return <img src={`/illustrations/${name}.svg`} alt={alt} draggable={false} className={cn('pointer-events-none select-none object-contain mix-blend-multiply', className)} />;
}
