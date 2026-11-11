'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART } from './palette';
import { TipBox } from './ChartTip';

export interface BarPoint { label: string; value: number; max?: number }

/** Rounded bars standing on a pale track that shows the maximum (BRIX "Online users"). */
export function TrackBars({ data, height = 260, color = CHART.blue, unit = '', max }: { data: BarPoint[]; height?: number; color?: string; unit?: string; max?: number }) {
  const top = max ?? Math.max(1, ...data.map((d) => d.max ?? d.value));
  const rows = data.map((d) => ({ ...d, full: d.max ?? top }));
  return (
    <div style={{ height }} role="img" aria-label="Biểu đồ cột">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="4 4" />
          <XAxis dataKey="label" axisLine={{ stroke: CHART.grid }} tickLine={false} tick={{ fill: CHART.soft, fontSize: 12 }} />
          <YAxis domain={[0, top]} axisLine={false} tickLine={false} tick={{ fill: CHART.soft, fontSize: 12 }} width={36} allowDecimals={false} tickFormatter={(v: number) => (v >= 1000 ? v / 1000 + 'k' : String(v))} />
          <Tooltip cursor={false} content={({ active, payload, label }) => active && payload?.length ? <TipBox title={label}>{payload[0].payload.value}{unit}</TipBox> : null} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 4, 4]} maxBarSize={10} background={{ fill: CHART.track, radius: 4 }} isAnimationActive animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
