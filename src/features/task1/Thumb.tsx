import type { T1Prompt } from '@/content/task1';

/** The prompt's first chart drawn small and whole (light grid, every line or bar inside the frame), for cards. */
export function ChartSketch({ pr, size }: { pr: T1Prompt; size: number }) {
  const p = pr.parts[0], n = p.axis.labels.length, max = p.max || 100, pad = 10, w = 100, h = 100;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(1, n - 1), y = (v: number) => h - pad - (v / max) * (h - 2 * pad);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={size} height={size} aria-hidden="true" style={{ overflow: 'visible' }}>
      {p.kind !== 'pies' && [0, 0.5, 1].map((t) => <line key={t} x1={pad} x2={w - pad} y1={y(t * max)} y2={y(t * max)} stroke={t ? '#E5E5E5' : '#D4D4D4'} strokeWidth="1" />)}
      {p.kind === 'pies' ? p.axis.labels.map((_, i) => {
        // Pies: one small pie per label, side by side.
        const r = Math.min(30, (w - 2 * pad) / n / 2 - 2), cx = pad + ((w - 2 * pad) / n) * (i + 0.5), cy = h / 2;
        const vals = p.items.map((it) => p.data[it.id][i] ?? 0), tot = vals.reduce((a, b) => a + b, 0) || 1; let acc = 0;
        return p.items.map((it, k) => {
          const a0 = (acc / tot) * Math.PI * 2, a1 = ((acc + vals[k]) / tot) * Math.PI * 2; acc += vals[k];
          if (!vals[k]) return null;
          return <path key={it.id + i} fill={it.color} d={`M${cx} ${cy}L${cx + r * Math.sin(a0)} ${cy - r * Math.cos(a0)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${cx + r * Math.sin(a1)} ${cy - r * Math.cos(a1)}Z`} />;
        });
      }) : p.kind === 'bars' ? p.axis.labels.map((_, i) => {
        // Bars: one small group per label, inside the frame.
        const gw = (w - 2 * pad) / n, bw = Math.max(1.5, (gw - 3) / p.items.length);
        return p.items.map((it, k) => { const v = p.data[it.id][i]; if (v === null) return null; const y0 = y(v); return <rect key={it.id + i} x={pad + i * gw + (gw - bw * p.items.length) / 2 + k * bw} y={y0} width={Math.max(1, bw - 0.6)} height={h - pad - y0} fill={it.color} />; });
      }) : p.items.map((it) => <polyline key={it.id} fill="none" stroke={it.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={p.data[it.id].map((v, i) => (v === null ? null : x(i).toFixed(1) + ',' + y(v).toFixed(1))).filter(Boolean).join(' ')} />)}
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
