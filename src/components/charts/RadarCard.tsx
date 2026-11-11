'use client';

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { CHART } from './palette';

/** A radar over a few axes, e.g. the four criteria. `max` is the top of the scale (9 for IELTS bands). */
export function RadarShape({ data, max = 9, height = 280, color = CHART.blue }: { data: { axis: string; value: number }[]; max?: number; height?: number; color?: string }) {
  return (
    <div style={{ height }} role="img" aria-label={data.map((d) => d.axis + ' ' + d.value).join(', ')}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke={CHART.grid} />
          <PolarAngleAxis dataKey="axis" tick={{ fill: CHART.ink, fontSize: 13, fontWeight: 600 }} />
          <PolarRadiusAxis domain={[0, max]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke={color} strokeWidth={2.5} fill={color} fillOpacity={0.18} dot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }} animationDuration={800} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
