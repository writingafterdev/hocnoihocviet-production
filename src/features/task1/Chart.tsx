'use client';

import { useState } from 'react';
import type { T1Part, T1Prompt } from '@/content/task1';
import { CL } from '../chainlab/constants';
import { uv } from './engine';

/** A chart is clickable in ① So sánh: a point adds that number, a line's name or a year adds the whole line or the whole year. */
export interface ChartActions { interactive: boolean; isIn: (id: string) => boolean; isHinted: (id: string) => boolean; onCell: (id: string) => void; onGroup: (g: string) => void; /** The walkthrough's line: drawn thicker, the others faded. */ focus?: string }

const L = 44, R = 12, TOP = 12, BOTTOM = 30;

function Glyph({ shapes }: { shapes: [string, string, number, string, string?][] }) {
  return <svg width="22" height="14" viewBox="0 0 28 18" fill="none" aria-hidden="true">{shapes.map((s, i) => <path key={i} d={s[0]} stroke={s[1]} fill={s[4] || 'none'} strokeWidth={s[2]} strokeLinecap={s[3] as 'round'} strokeLinejoin="round" />)}</svg>;
}
export { Glyph };

/** A line chart drawn in our style; points that sit on top of each other open a small list to pick from. */
export function LineChart({ part: p, act, compact }: { part: T1Part; act: ChartActions; compact?: boolean }) {
  // Compact (③ Viết bài, a narrow column): a smaller drawing area, so the labels stay readable once it is scaled to the column.
  const W = compact ? 400 : 760, H = compact ? 250 : 300, fs = compact ? 13 : 10.5;
  const [picker, setPicker] = useState<{ x: number; y: number; ids: string[] } | null>(null);
  const n = p.axis.labels.length, PW = W - L - R, PH = H - TOP - BOTTOM, max = p.max || 100, step = p.step || max / 5;
  const xs = (i: number) => L + 8 + (i * (PW - 16)) / Math.max(1, n - 1);
  const ys = (v: number) => TOP + PH - (v / max) * PH;
  const grid: number[] = []; for (let t = 0; t <= max + 1e-9; t += step) grid.push(Math.round(t * 100) / 100);
  const dots = p.items.flatMap((it) => p.data[it.id].map((v, ai) => (v === null ? null : { id: p.id + '.' + it.id + '.' + ai, it, ai, v, cx: xs(ai), cy: ys(v) })).filter(Boolean)) as { id: string; it: T1Part['items'][number]; ai: number; v: number; cx: number; cy: number }[];
  const click = (d: (typeof dots)[number]) => {
    if (!act.interactive) return;
    const near = dots.filter((e) => Math.abs(e.cx - d.cx) < 9 && Math.abs(e.cy - d.cy) < 9);
    if (near.length > 1) setPicker({ x: d.cx, y: d.cy, ids: near.map((e) => e.id) });
    else { setPicker(null); act.onCell(d.id); }
  };
  const link = act.interactive ? 't1-link' : '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: W, maxWidth: '100%' }}>
      <div data-tour={'part:' + p.id} style={{ position: 'relative', width: W, maxWidth: '100%' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }} role="img" aria-label={p.title}>
          {grid.map((t) => <g key={t}><line x1={L} x2={W - R} y1={ys(t)} y2={ys(t)} stroke={t ? CL.ink1 : CL.ink3} /><text x={L - 8} y={ys(t) + 3.5} fontSize={fs} fill={CL.ink5} textAnchor="end">{t}</text></g>)}
          {p.items.map((it) => {
            const pts = p.data[it.id].map((v, ai) => (v === null ? null : xs(ai).toFixed(1) + ',' + ys(v).toFixed(1))).filter(Boolean).join(' ');
            return <polyline key={it.id} points={pts} fill="none" stroke={it.color} strokeWidth={act.focus === it.id ? 4 : 2.5} opacity={act.focus && act.focus !== it.id ? 0.2 : 1} strokeLinejoin="round" strokeLinecap="round" />;
          })}
          {p.axis.labels.map((lab, ai) => (!p.axis.show || p.axis.show.includes(ai)) && (
            <text key={ai} x={xs(ai)} y={H - 10} fontSize={fs + 0.5} fontWeight={500} fill={CL.ink6} textAnchor="middle" className={link} onClick={() => act.interactive && act.onGroup(p.id + '>col:' + ai)}>
              <title>{act.interactive ? 'Chọn cả ' + lab : lab}</title>{lab}
            </text>
          ))}
          {dots.map((d) => {
            const on = act.isIn(d.id), hint = act.isHinted(d.id);
            return (
              <g key={d.id} onClick={() => click(d)} opacity={act.focus && act.focus !== d.it.id ? 0.2 : 1} style={{ cursor: act.interactive ? 'pointer' : 'default' }}>
                <title>{d.it.name + ', ' + p.axis.labels[d.ai] + ': ' + uv(p, d.v)}</title>
                {(on || hint) && <circle cx={d.cx} cy={d.cy} r={9} fill="none" stroke={on ? d.it.color : '#FFC73C'} strokeWidth={2.5} />}
                <circle cx={d.cx} cy={d.cy} r={5} fill={d.it.color} stroke="#fff" strokeWidth={2} />
                <circle cx={d.cx} cy={d.cy} r={11} fill="transparent" />
              </g>
            );
          })}
        </svg>
        {picker && (
          <div role="menu" style={{ position: 'absolute', left: `${((Math.min(picker.x + 10, W - 220)) / W) * 100}%`, top: `${(Math.max(0, picker.y - 14) / H) * 100}%`, zIndex: 5, width: 210, padding: 6, borderRadius: 10, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,.08), 0 8px 24px -8px rgba(0,0,0,.25)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ display: 'flex', alignItems: 'center', padding: '2px 4px 4px 6px', fontSize: 11.5, fontWeight: 500, color: CL.ink5 }}>Các điểm trùng nhau
              <button type="button" className="cl-btn" onClick={() => setPicker(null)} aria-label="Đóng" style={{ marginLeft: 'auto', width: 22, height: 22, border: 'none', background: 'none', color: CL.ink5, cursor: 'pointer' }}>×</button>
            </span>
            {picker.ids.map((id) => { const d = dots.find((e) => e.id === id)!; return (
              <button key={id} type="button" role="menuitem" className="t1-row" onClick={() => { setPicker(null); act.onCell(id); }} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 30, padding: '0 8px', border: 'none', borderRadius: 7, background: 'none', fontSize: 12.5, fontWeight: 500, color: CL.ink, cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 99, background: d.it.color, flexShrink: 0 }} />{d.it.name + ' · ' + p.axis.labels[d.ai] + ' · ' + uv(p, d.v)}
              </button>
            ); })}
          </div>
        )}
      </div>
      <Legend part={p} act={act} compact={compact} />
    </div>
  );
}

/** The chart's key: a name adds every value of that item (a whole line, or every bar of one colour). */
function Legend({ part: p, act, compact }: { part: T1Part; act: ChartActions; compact?: boolean }) {
  const link = act.interactive ? 't1-link' : '';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? '6px 12px' : 14, justifyContent: 'center' }}>
      {p.items.map((it) => (
        <span key={it.id} data-tour={'item:' + it.id} className={link} title={act.interactive ? 'Chọn cả ' + it.name : ''} onClick={() => act.interactive && act.onGroup(p.id + '>item:' + it.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: compact ? 11.5 : 12.5, color: CL.ink7 }}>
          <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, background: it.color }} />{it.name}
        </span>
      ))}
    </div>
  );
}

/** A label cut in two at the space nearest its middle (one line when it has no space). */
function splitMiddle(lab: string) {
  const mid = lab.length / 2; let at = -1;
  for (let i = 0; i < lab.length; i++) if (lab[i] === ' ' && (at < 0 || Math.abs(i - mid) < Math.abs(at - mid))) at = i;
  return at < 0 ? [lab] : [lab.slice(0, at), lab.slice(at + 1)];
}

/** A grouped bar chart in the same style: one group per axis label, one bar per item; a bar adds its number, a label below adds the whole group. */
export function BarChart({ part: p, act, compact }: { part: T1Part; act: ChartActions; compact?: boolean }) {
  const W = compact ? 400 : 760, H = compact ? 250 : 300, fs = compact ? 13 : 10.5;
  const n = p.axis.labels.length, PW = W - L - R, PH = H - TOP - BOTTOM, max = p.max || 100, step = p.step || max / 5;
  const ys = (v: number) => TOP + PH - (v / max) * PH;
  const grid: number[] = []; for (let t = 0; t <= max + 1e-9; t += step) grid.push(Math.round(t * 100) / 100);
  const gw = PW / n, bw = Math.max(4, Math.min(compact ? 18 : 26, (gw - (compact ? 6 : 12)) / p.items.length));
  const link = act.interactive ? 't1-link' : '';
  // Long labels under narrow groups go on two lines.
  const lines = (lab: string) => (lab.length * fs * 0.55 > gw - 4 ? splitMiddle(lab) : [lab]);
  // One label size for the whole axis, small enough that the longest line fits its group.
  const longest = Math.max(...p.axis.labels.map((l) => Math.max(...lines(l).map((x) => x.length))));
  const lfs = Math.max(8, Math.min(fs + 0.5, (gw - 4) / (longest * 0.56)));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: W, maxWidth: '100%' }}>
      <div data-tour={'part:' + p.id} style={{ position: 'relative', width: W, maxWidth: '100%' }}>
        <svg viewBox={`0 0 ${W} ${H + 12}`} width="100%" style={{ display: 'block', overflow: 'visible' }} role="img" aria-label={p.title}>
          {grid.map((t) => <g key={t}><line x1={L} x2={W - R} y1={ys(t)} y2={ys(t)} stroke={t ? CL.ink1 : CL.ink3} /><text x={L - 8} y={ys(t) + 3.5} fontSize={fs} fill={CL.ink5} textAnchor="end">{t}</text></g>)}
          {p.axis.labels.map((lab, ai) => {
            const gx = L + ai * gw + (gw - bw * p.items.length) / 2;
            return (
              <g key={ai}>
                {p.items.map((it, k) => {
                  const v = p.data[it.id][ai]; if (v === null) return null;
                  const id = p.id + '.' + it.id + '.' + ai, on = act.isIn(id), hint = act.isHinted(id), x = gx + k * bw, y = ys(v), h = Math.max(1, TOP + PH - y);
                  return (
                    <g key={it.id} onClick={() => act.interactive && act.onCell(id)} opacity={act.focus && act.focus !== it.id ? 0.2 : 1} style={{ cursor: act.interactive ? 'pointer' : 'default' }}>
                      <title>{it.name + ', ' + lab + ': ' + uv(p, v)}</title>
                      {(on || hint) && <rect x={x - 2.5} y={y - 3} width={bw + 3} height={h + 3} rx={4} fill="none" stroke={on ? it.color : '#FFC73C'} strokeWidth={2.5} />}
                      <rect x={x} y={y} width={bw - 2} height={h} rx={2} fill={it.color} />
                    </g>
                  );
                })}
                <text x={L + ai * gw + gw / 2} y={H - 10} fontSize={lfs} fontWeight={500} fill={CL.ink6} textAnchor="middle" className={link} onClick={() => act.interactive && act.onGroup(p.id + '>col:' + ai)}>
                  <title>{act.interactive ? 'Chọn cả ' + lab : lab}</title>
                  {lines(lab).map((t, i) => <tspan key={i} x={L + ai * gw + gw / 2} dy={i ? lfs + 2 : 0}>{t}</tspan>)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <Legend part={p} act={act} compact={compact} />
    </div>
  );
}

/** The prompt's charts, centred, with space between them: line and bar charts so far. */
export function Charts({ prompt, act, compact }: { prompt: T1Prompt; act: ChartActions; compact?: boolean }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: compact ? 24 : 44 }}>
      {prompt.parts.map((p) => (
        <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 10 : 16, width: compact ? '100%' : undefined }}>
          <span className={prompt.parts.length > 1 && act.interactive ? 't1-link' : ''} onClick={() => prompt.parts.length > 1 && act.interactive && act.onGroup(p.id)} style={{ fontSize: compact ? 12.5 : 13.5, fontWeight: 600, color: CL.ink, textAlign: 'center' }}>{p.title}</span>
          {p.kind === 'line' ? <LineChart part={p} act={act} compact={compact} /> : p.kind === 'bars' ? <BarChart part={p} act={act} compact={compact} /> : <span style={{ fontSize: 13, color: CL.ink5 }}>Dạng biểu đồ này sẽ có ở bước sau.</span>}
        </div>
      ))}
    </div>
  );
}
