import { ArrowRight } from 'lucide-react';

const PILLARS = {
  reading: { bg: 'var(--brand-mint)' },
  writing: { bg: 'var(--brand-yellow)' },
  speaking: { bg: 'var(--brand-sky)' },
  /** Neutral "core resource" tile — docs/guides, not a product pillar. */
  engine: { bg: 'var(--gray-300)' },
};

export type Pillar = keyof typeof PILLARS;

export interface ProductCardProps {
  pillar?: Pillar;
  badge?: string;
  eyebrow?: string;
  title: string;
  description: string;
  meta?: string;
  illustration?: string;
  onClick?: () => void;
}

/** ProductCard — the Dashboard's hero tile, one per product pillar. */
export function ProductCard({ pillar = 'reading', badge, eyebrow, title, description, meta, illustration, onClick }: ProductCardProps) {
  const color = (PILLARS[pillar] || PILLARS.reading).bg;
  return (
    <div
      className="ds-product"
      data-clickable={onClick ? 'true' : 'false'}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        background: color, borderRadius: 16, padding: '28px 26px 24px',
        display: 'flex', flexDirection: 'column', minHeight: 260,
        color: 'var(--gray-900)', position: 'relative', cursor: onClick ? 'pointer' : 'default',
        boxShadow: 'var(--shadow-card-rest)',
      }}
    >
      {badge && (
        <span style={{
          position: 'absolute', top: 20, right: 20, background: 'var(--gray-900)', color: 'var(--gray-0)',
          fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', padding: '6px 12px', borderRadius: 6,
        }}>{badge}</span>
      )}
      {illustration && (
        <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <img src={illustration} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        </div>
      )}
      {eyebrow && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)', marginBottom: 12 }}>
          {eyebrow}
        </div>
      )}
      <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 24, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{title}</h3>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.6, color: 'rgba(0,0,0,0.7)', flexGrow: 1, margin: 0 }}>{description}</p>
      {meta && (
        <div style={{ paddingTop: 16, marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(0,0,0,0.6)', fontWeight: 500 }}>{meta}</span>
          <span style={{ width: 40, height: 40, borderRadius: '9999px', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowRight size={16} strokeWidth={2.2} /></span>
        </div>
      )}
    </div>
  );
}
