'use client';

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import { CHART, SERIES } from './palette';

export interface RingItem { name: string; value: number; max: number; color?: string; text?: string }

/** Concentric rings on pale tracks with a big number and a legend beside them (BRIX "Productivity"). */
export function Rings({ items, big, size = 220 }: { items: RingItem[]; big: string; size?: number }) {
  const data = items.map((it, i) => ({ name: it.name, pct: Math.min(100, Math.round((it.value / Math.max(1, it.max)) * 100)), fill: it.color || SERIES[i % SERIES.length] }));
  return (
    <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
      <div style={{ width: size, height: size }} role="img" aria-label={items.map((i) => i.name + ' ' + (i.text ?? i.value)).join(', ')}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart data={data} innerRadius="38%" outerRadius="100%" startAngle={90} endAngle={-270} barSize={11}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="pct" cornerRadius={8} background={{ fill: CHART.track }} animationDuration={800} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex min-w-[180px] flex-col gap-4">
        <span className="text-[40px] font-semibold leading-none tracking-[-0.03em] text-ink tabular-nums">{big}</span>
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center gap-2.5 text-[14px] text-ink-soft">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.fill }} />
              <span className="flex-1">{d.name}</span>
              <span className="font-semibold text-ink tabular-nums">{items[i].text ?? items[i].value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
