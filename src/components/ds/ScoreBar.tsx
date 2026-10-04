const LABELS = { taskAchievement: 'TA', coherenceCohesion: 'CC', lexicalResource: 'LR', grammaticalRange: 'GRA' } as const;
type Dimension = keyof typeof LABELS;

export interface ScoreBarProps {
  scores: { overall: number } & Record<Dimension, number>;
  activeDimension?: Dimension;
  onSelect?: (d: Dimension) => void;
}

/** ScoreBar — IELTS band display: overall band as hero figure + 4 dimension tiles. */
export function ScoreBar({ scores, activeDimension, onSelect }: ScoreBarProps) {
  const dims = Object.keys(LABELS) as Dimension[];
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 100, padding: '0 8px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 6 }}>Overall</span>
        <span style={{ fontSize: 42, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{scores.overall.toFixed(1)}</span>
      </div>
      <div style={{ width: 1, background: 'rgba(0,0,0,0.05)', margin: '8px 4px' }} />
      <div style={{ flex: 1, display: 'flex', gap: 10 }}>
        {dims.map((key) => {
          const isActive = activeDimension === key;
          return (
            <button key={key} type="button" onClick={() => onSelect && onSelect(key)} style={{
              flex: 1, position: 'relative', borderRadius: 14, padding: '16px 8px', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: isActive ? '#fff' : 'rgba(0,0,0,0.02)',
              boxShadow: isActive ? '0 0 0 1px rgba(0,0,0,0.1)' : '0 0 0 1px transparent',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 6 }}>{LABELS[key]}</span>
              <span style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{scores[key]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
