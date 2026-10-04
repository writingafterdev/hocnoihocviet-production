import type { CSSProperties, ReactNode } from 'react';
import { CL, CL_KIND_STYLE } from '../constants';

const ICON_PATHS: Record<string, ReactNode> = {
  chev: <path d="M6 9l6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  left: <path d="M19 12H5M11 6l-6 6 6 6" />,
  right: <path d="M5 12h14M13 6l6 6-6 6" />,
  fork: <path d="M6 3v6a6 6 0 006 6h0a6 6 0 006-6V3M12 15v6" />,
  check: <path d="M5 12l5 5 9-10" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
};

export type IconName = 'grip' | keyof typeof ICON_PATHS;

/** Workbench icon set (matches the prototype's hand-tuned paths). */
export function ClIcon({ name, size = 14, color = 'currentColor' }: { name: IconName; size?: number; color?: string }) {
  const p = name === 'grip'
    ? <g fill={color} stroke="none"><circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" /><circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" /><circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" /></g>
    : ICON_PATHS[name];
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">{p}</svg>;
}

/** Small uppercase tracked label. */
export function ClLabel({ children, color = CL.ink5, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return <span style={{ fontFamily: CL.sans, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color, ...style }}>{children}</span>;
}

/** Lens chip (With/Without, Scope, Khả thi…). */
export function ClTag({ kind }: { kind: string }) {
  const s = CL_KIND_STYLE[kind] || CL_KIND_STYLE['Khả thi'];
  return <span style={{ borderRadius: 5, padding: '4px 8px', background: s.bg, color: s.fg, fontFamily: CL.sans, fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{kind}</span>;
}

/** Shared uppercase button style for workspace toolbars. */
export const toolbarBtn = (on: boolean): CSSProperties => ({
  borderRadius: 5, border: '1px solid ' + (on ? CL.ink : CL.ink2), background: '#fff', color: on ? CL.ink : CL.ink6,
  fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 12px',
});

export const backLinkStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.11em', color: CL.ink5,
};
