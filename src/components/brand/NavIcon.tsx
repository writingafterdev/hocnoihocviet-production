import { cn } from '@/lib/utils';

/**
 * The sidebar's icons, copied from the Cloudflare dashboard's icon sprite (16px, filled outline, drawn in the
 * current text colour). Each one stands for a page: home, the quick drill (Cloudflare's "AI"), writing (edit),
 * vocabulary (list) and the student's own essays (file).
 */
const ICONS = {
  home: [
    { d: 'M14.172 7.878 8 2.52 1.828 7.878l-.656-.756 6.5-5.641h.656l6.5 5.641-.656.756Z' },
    { d: 'M4 8.101V13h2.125V9.759l.5-.5h2.75l.5.5V13H12V8.101h1V13.5l-.5.5h-9l-.5-.5V8.101h1ZM8.875 13h-1.75v-2.741h1.75V13Z', evenodd: true },
  ],
  drill: [
    { d: 'M10.72 1.5H9.265v3.198l1.455.004V1.5ZM7.36 3.347l1.516 1.517-1.032 1.025-1.513-1.513 1.03-1.029ZM4.485 6.28h3.202l-.005 1.455H4.485V6.28Zm1.848 3.36 1.515-1.516 1.026 1.032-1.512 1.512-1.03-1.029Zm2.932 2.875V9.313l1.455.005v3.197H9.265Zm3.36-1.845-1.517-1.517 1.032-1.026 1.514 1.514-1.03 1.029ZM15.5 7.735h-3.202l.005-1.455H15.5v1.455Zm-1.847-3.359-1.516 1.516-1.025-1.032 1.513-1.513 1.028 1.03ZM2 1.829v.82h-.822v1.315H2v.821h1.314v-.82h.821V2.65h-.821v-.821H2Zm0 12.842v-1.5H.5v-1.314H2v-1.499h1.314v1.499h1.5v1.314h-1.5v1.5H2Z' },
  ],
  write: [
    { d: 'M5.685 11.864l.254-.136 7.105-7.085v-.707l-2.48-2.48h-.707L2.753 8.54l-.138.258-.605 3.105.59.586 3.085-.625zM3.567 9.14l6.643-6.625 1.773 1.773-6.644 6.625-2.205.447.433-2.22zM14 13.5H2v1h12v-1z' },
  ],
  vocab: [
    { d: 'M13 1.5H3l-.5.5v11.945l.5.5h10l.5-.5V2l-.5-.5zm-.5 11.945h-9V2.5h9v10.945z' },
    { d: 'M11.366 3.665h-4.75v1h4.75v-1zM11.366 5.761h-4.75v1h4.75v-1zM11.366 7.858h-4.75v1h4.75v-1zM5.634 3.672h-1v1h1v-1zM5.634 5.761h-1v1h1v-1zM5.634 7.851h-1v1h1v-1z' },
  ],
  essays: [
    { d: 'M13 1.5H3l-.5.5v11.95l.5.5h10l.5-.5V2l-.5-.5zm-.5 11.95h-9V2.5h9v10.95z' },
    { d: 'M7.965 3.678H4.63v1h3.335v-1zM11.342 5.768H4.63v1h6.712v-1zM11.342 7.857H4.63v1h6.712v-1z' },
  ],
} as const;

export type NavIconName = keyof typeof ICONS;

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false" className={cn('shrink-0', className)}>
      {ICONS[name].map((p, k) => <path key={k} d={p.d} {...('evenodd' in p ? { fillRule: 'evenodd' as const } : {})} />)}
    </svg>
  );
}
