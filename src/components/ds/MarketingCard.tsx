import type { ReactNode } from 'react';

const VARIANTS = {
  sage: { bg: 'var(--card-sage)' },
  blush: { bg: 'var(--card-blush)' },
  sand: { bg: 'var(--card-sand)' },
};

export interface MarketingCardProps {
  variant?: keyof typeof VARIANTS;
  badge?: string;
  label?: string;
  title: string;
  children?: ReactNode;
  cta?: string;
}

/** MarketingCard — the landing page's "3 products" pitch card. */
export function MarketingCard({ variant = 'sage', badge, label, title, children, cta }: MarketingCardProps) {
  return (
    <article style={{
      background: (VARIANTS[variant] || VARIANTS.sage).bg, borderRadius: 22,
      padding: '32px 28px 28px', display: 'flex', flexDirection: 'column', minHeight: 320,
      color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
    }}>
      {badge && (
        <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 12px', borderRadius: 4, marginBottom: 18, background: 'var(--gray-900)', color: 'var(--gray-50)' }}>{badge}</span>
      )}
      {label && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(20,20,19,0.5)', marginBottom: 14 }}>{label}</div>}
      <hr style={{ border: 'none', borderTop: '1px solid rgba(20,20,19,0.16)', margin: '0 0 18px' }} />
      <h3 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.25, margin: '0 0 14px' }}>{title}</h3>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.6, flex: 1 }}>{children}</div>
      {cta && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(20,20,19,0.16)', margin: '18px 0' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>{cta} →</span>
        </>
      )}
    </article>
  );
}
