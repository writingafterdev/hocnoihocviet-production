import type { T1Prompt } from '@/content/task1';

/** The prompt's first chart drawn small and whole (light grid, every line inside the frame), for cards. */
export function ChartSketch({ pr, size }: { pr: T1Prompt; size: number }) {
  const p = pr.parts[0], n = p.axis.labels.length, max = p.max || 100, pad = 10, w = 100, h = 100;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(1, n - 1), y = (v: number) => h - pad - (v / max) * (h - 2 * pad);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={size} height={size} aria-hidden="true" style={{ overflow: 'visible' }}>
      {[0, 0.5, 1].map((t) => <line key={t} x1={pad} x2={w - pad} y1={y(t * max)} y2={y(t * max)} stroke={t ? '#E5E5E5' : '#D4D4D4'} strokeWidth="1" />)}
      {p.items.map((it) => <polyline key={it.id} fill="none" stroke={it.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={p.data[it.id].map((v, i) => (v === null ? null : x(i).toFixed(1) + ',' + y(v).toFixed(1))).filter(Boolean).join(' ')} />)}
    </svg>
  );
}

/** The chart in the cards' grey picture box. */
export function Thumb({ pr, size = 84 }: { pr: T1Prompt; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ChartSketch pr={pr} size={size - 8} />
    </div>
  );
}
