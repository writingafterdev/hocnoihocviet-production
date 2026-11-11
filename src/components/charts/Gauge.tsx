'use client';

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import { CHART } from './palette';

/** A half-circle gauge with the figure in the middle (BRIX "Credit score" / "Sales goal"). */
export function Gauge({ value, max, label, sub, color = CHART.blue, height = 200 }: { value: number; max: number; label: string; sub?: string; color?: string; height?: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className="relative mx-auto w-full max-w-[360px]" style={{ height }} role="img" aria-label={label + ': ' + value + ' / ' + max}>
      <ResponsiveContainer width="100%" height="200%">
        <RadialBarChart data={[{ pct }]} innerRadius="78%" outerRadius="100%" startAngle={180} endAngle={0} barSize={18} cy="50%">
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="pct" cornerRadius={9} fill={color} background={{ fill: CHART.track }} animationDuration={800} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center">
        <div className="text-[40px] font-semibold leading-none tracking-[-0.03em] text-ink tabular-nums">{label}</div>
        {sub && <div className="mt-1 text-[13px] text-ink-soft">{sub}</div>}
      </div>
    </div>
  );
}
