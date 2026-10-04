import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

const BASE: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  border: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'background var(--duration-default) var(--ease-default), color var(--duration-default) var(--ease-default)',
  textDecoration: 'none',
};

const VARIANTS: Record<string, CSSProperties> = {
  primary: { background: 'var(--gray-900)', color: 'var(--gray-50)', borderRadius: 'var(--radius-md)' },
  ghost: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--surface-strong)', borderRadius: 'var(--radius-full)' },
  pill: { background: 'var(--gray-900)', color: 'var(--gray-50)', border: '1px solid var(--gray-900)', borderRadius: 'var(--radius-md)' },
  icon: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-full)', padding: 0 },
};

const SIZES: Record<string, CSSProperties> = {
  sm: { fontSize: 12, padding: '8px 16px' },
  md: { fontSize: 13, padding: '12px 24px' },
  lg: { fontSize: 14, padding: '16px 36px' },
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'pill' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconOnly?: boolean;
}

/** Button — primary / ghost / pill / icon, from landing.html's button classes. */
export function Button({ variant = 'primary', size = 'md', disabled, children, icon, iconOnly, style, ...props }: ButtonProps) {
  const sizeStyle = iconOnly ? { width: 44, height: 44, padding: 0 } : SIZES[size] || SIZES.md;
  return (
    <button
      {...props}
      disabled={disabled}
      style={{ ...BASE, ...(VARIANTS[variant] || VARIANTS.primary), ...sizeStyle, opacity: disabled ? 0.35 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
    >
      {icon}
      {!iconOnly && children}
    </button>
  );
}
