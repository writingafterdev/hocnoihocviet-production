'use client';

import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART } from './palette';
import { TipBox } from './ChartTip';

export interface AreaPoint { label: string; value: number; note?: string }

/** A smooth line over a soft gradient, a vertical hover line, a dot and a dark tooltip (BRIX "Sales"). */
export function SmoothArea({ data, height = 280, color = CHART.blue, unit = '', yDomain }: { data: AreaPoint[]; height?: number; color?: string; unit?: string; yDomain?: [number, number] }) {
  const id = useId().replace(/:/g, '');
  return (
    <div style={{ height }} role="img" aria-label="Biểu đồ đường">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={'g' + id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.24} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: CHART.soft, fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: CHART.soft, fontSize: 12 }} width={44} domain={yDomain} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: color, strokeWidth: 1.5 }}
            content={({ active, payload }) => active && payload?.length ? <TipBox title={payload[0].payload.note || payload[0].payload.label}>{payload[0].payload.value}{unit}</TipBox> : null}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={'url(#g' + id + ')'} activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }} dot={false} animationDuration={800} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
