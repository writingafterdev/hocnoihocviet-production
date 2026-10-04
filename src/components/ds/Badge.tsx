export const STATUS = {
  pending: { bg: 'var(--brand-orange-soft)', color: '#B9700F', label: 'Pending' },
  inProgress: { bg: 'var(--brand-sky-soft)', color: '#0F6E8C', label: 'In progress' },
  submitted: { bg: 'var(--brand-sky-soft)', color: '#2E9AC0', label: 'Submitted' },
  inReview: { bg: 'var(--semantic-warning-soft)', color: 'var(--semantic-warning)', label: 'In review' },
  success: { bg: 'var(--brand-mint-soft)', color: 'var(--semantic-success)', label: 'Success' },
  failed: { bg: 'var(--semantic-danger-soft)', color: 'var(--semantic-danger)', label: 'Failed' },
  expired: { bg: 'var(--ink-100)', color: 'var(--ink-500)', label: 'Expired' },
};

const SOURCE_LABELS: Record<string, string> = {
  economist: 'The Economist',
  'new-yorker': 'The New Yorker',
  'new-scientist': 'New Scientist',
};

/** Badge — status pill. */
export function Badge({ kind = 'inProgress', size = 'sm' }: { kind?: keyof typeof STATUS; size?: 'sm' | 'md' }) {
  const s = STATUS[kind] || STATUS.inProgress;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: size === 'md' ? '8px 16px' : '6px 12px', fontSize: size === 'md' ? 14 : 12, fontFamily: 'var(--font-sans)', fontWeight: 600,
      borderRadius: size === 'md' ? 16 : 12, background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

/** SourceBadge — publication source tag. */
export function SourceBadge({ source }: { source: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '6px 12px',
      fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      borderRadius: 'var(--radius-full)', background: 'var(--ink-50)', color: 'var(--text-primary)',
    }}>
      {SOURCE_LABELS[source] || source}
    </span>
  );
}
