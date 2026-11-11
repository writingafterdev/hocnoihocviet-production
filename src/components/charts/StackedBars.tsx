'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART, SERIES } from './palette';
import { TipBox } from './ChartTip';

/** Stacked columns, one colour per series (BRIX "Subscriptions"). `data` rows look like { label: 'T2', essays: 3, chains: 5 }. */
export function StackedBars({ data, series, height = 280 }: { data: Record<string, string | number>[]; series: { key: string; name: string; color?: string }[]; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label="Biểu đồ cột chồng">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="4 4" />
          <XAxis dataKey="label" axisLine={{ stroke: CHART.grid }} tickLine={false} tick={{ fill: CHART.soft, fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: CHART.soft, fontSize: 12 }} width={36} allowDecimals={false} tickFormatter={(v: number) => (v >= 1000 ? v / 1000 + 'k' : String(v))} />
          <Tooltip cursor={{ fill: 'rgba(47,98,196,0.06)' }} content={({ active, payload, label }) => active && payload?.length ? <TipBox title={label}>{payload.map((p) => p.value).join(' · ')}</TipBox> : null} />
          <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: CHART.soft, paddingBottom: 8 }} />
          {series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.name} stackId="a" fill={s.color || SERIES[i % SERIES.length]} radius={i === series.length - 1 ? [5, 5, 0, 0] : 0} maxBarSize={28} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
