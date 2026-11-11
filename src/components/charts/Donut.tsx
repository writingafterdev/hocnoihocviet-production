'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { SERIES } from './palette';
import { TipBox } from './ChartTip';

export interface Slice { name: string; value: number; color?: string }

/** A donut with a figure in the hole and a legend list beside it (BRIX "Monthly activity"). */
export function Donut({ data, centre, sub, size = 220 }: { data: Slice[]; centre: string; sub?: string; size?: number }) {
  const total = data.reduce((n, d) => n + d.value, 0) || 1;
  const rows = data.map((d, i) => ({ ...d, color: d.color || SERIES[i % SERIES.length] }));
  return (
    <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
      <div className="relative" style={{ width: size, height: size }} role="img" aria-label={rows.map((r) => r.name + ' ' + r.value).join(', ')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={({ active, payload }) => active && payload?.length ? <TipBox title={String(payload[0].name)}>{payload[0].value}</TipBox> : null} />
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="100%" paddingAngle={3} cornerRadius={6} stroke="none" animationDuration={800}>
              {rows.map((r) => <Cell key={r.name} fill={r.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <div className="text-[32px] font-semibold leading-none tracking-[-0.02em] text-ink tabular-nums">{centre}</div>
          {sub && <div className="mt-1 text-[12px] text-ink-soft">{sub}</div>}
        </div>
      </div>
      <ul className="m-0 flex min-w-[180px] list-none flex-col gap-2.5 p-0">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-2.5 text-[14px] text-ink-soft">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
            <span className="flex-1">{r.name}</span>
            <span className="font-semibold text-ink tabular-nums">{Math.round((r.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
