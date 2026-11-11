'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Illustration } from '@/components/brand/Illustration';
import { Bar } from '@/components/charts/bar';
import { BarChart } from '@/components/charts/bar-chart';
import { BarXAxis } from '@/components/charts/bar-x-axis';
import { ChartCard } from '@/components/charts/ChartCard';
import { Grid } from '@/components/charts/grid';
import { RadarArea } from '@/components/charts/radar-area';
import { RadarAxis } from '@/components/charts/radar-axis';
import { RadarChart } from '@/components/charts/radar-chart';
import { RadarGrid } from '@/components/charts/radar-grid';
import { RadarLabels } from '@/components/charts/radar-labels';
import { RangeSwitch } from '@/components/charts/RangeSwitch';
import { Ring } from '@/components/charts/ring';
import { RingChart } from '@/components/charts/ring-chart';
import { ChartTooltip } from '@/components/charts/tooltip';
import { bandText } from '../desk/scoring';

export type SkillId = 'writing' | 'speaking';
export interface Point { t: number; band: number; scores: Record<string, number> }
export interface Goals { targetWriting: number | null; targetSpeaking: number | null; examDate: string | null }
export interface ProgressData { points: Record<SkillId, Point[]>; /** Times (ms) the student practised, for the "when" map. */ activity: number[]; goals: Goals | null }

/** Each skill names its own criteria, so a new skill only needs an entry here and scored attempts. */
const SKILLS: Record<SkillId, { label: string; criteria: { key: string; label: string }[] }> = {
  writing: { label: 'Writing', criteria: [{ key: 'tr', label: 'TR' }, { key: 'cc', label: 'CC' }, { key: 'lr', label: 'LR' }, { key: 'gra', label: 'GRA' }] },
  speaking: { label: 'Speaking', criteria: [{ key: 'fc', label: 'FC' }, { key: 'lr', label: 'LR' }, { key: 'gra', label: 'GRA' }, { key: 'p', label: 'P' }] },
};

const DAY = 86_400_000;
const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const weekStart = (t: number) => { const d = new Date(startOfDay(t)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
const dm = (t: number) => { const d = new Date(t); return d.getDate() + '/' + (d.getMonth() + 1); };
const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((n, x) => n + x, 0) / xs.length) * 10) / 10 : 0);
const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
/** Empty cell, then four steps of tomato. */
const HEAT = ['#FFFFFF', '#FFE3D8', '#FFBFA6', '#FF8E6B', '#FF5C33'];

function Tile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl bg-white px-4 py-3 shadow-ring">
      <span className="flex items-center gap-2 text-[14px] text-ink-soft">{color && <span className="size-3 shrink-0 rounded-[4px]" style={{ background: color }} />}{label}</span>
      <span className="text-[18px] font-semibold text-ink tabular-nums">{value}</span>
    </div>
  );
}

/** The Tiến độ page itself: pure, it only draws what it is given (the real page and the demo page both use it). */
export function ProgressView({ data, onEditGoal }: { data: ProgressData; onEditGoal?: () => void }) {
  const { points, goals } = data;
  const [skill, setSkill] = useState<SkillId>('writing');
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [days, setDays] = useState<7 | 30 | 90>(30);

  const target = (skill === 'writing' ? goals?.targetWriting : goals?.targetSpeaking) || null;
  const mine = points[skill];
  const last = mine[mine.length - 1];
  const first = mine[0];
  const top = target || 9;
  const gap = last && target ? Math.max(0, Math.round((target - last.band) * 10) / 10) : null;
  const journey = last && first && target && target > first.band ? Math.max(0, Math.min(100, Math.round(((last.band - first.band) / (target - first.band)) * 100))) : last && target && last.band >= target ? 100 : 0;
  const latestOf = (s: SkillId) => { const p = points[s]; return p.length ? p[p.length - 1].band : 0; };
  const targetOf = (s: SkillId) => (s === 'writing' ? goals?.targetWriting : goals?.targetSpeaking) || 9;

  const bars = useMemo(() => {
    const now = Date.now();
    const buckets: { label: string; from: number; to: number }[] = [];
    if (period === 'week') for (let i = 7; i >= 0; i--) { const f = weekStart(now - i * 7 * DAY); buckets.push({ label: dm(f), from: f, to: f + 7 * DAY }); }
    else for (let i = 5; i >= 0; i--) { const d = new Date(new Date(now).getFullYear(), new Date(now).getMonth() - i, 1); buckets.push({ label: 'T' + (d.getMonth() + 1), from: d.getTime(), to: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() }); }
    return buckets.map((b) => { const v = avg(mine.filter((p) => p.t >= b.from && p.t < b.to).map((p) => p.band)); return { label: b.label, Band: v, Con: Math.max(0, Math.round((top - v) * 10) / 10) }; });
  }, [mine, period, top]);

  const heat = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array(12).fill(0) as number[]);
    const since = Date.now() - days * DAY;
    data.activity.forEach((t) => { if (t >= since) { const d = new Date(t); grid[(d.getDay() + 6) % 7][Math.floor(d.getHours() / 2)] += 1; } });
    const flat = grid.flat();
    const max = Math.max(1, ...flat);
    // The busiest block, in words.
    let best = { d: 0, h: 0, n: 0 };
    grid.forEach((row, d) => row.forEach((n, h) => { if (n > best.n) best = { d, h, n }; }));
    return { grid, max, total: flat.reduce((n, x) => n + x, 0), best };
  }, [data.activity, days]);
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / heat.max) * 4)));

  const thisWeek = points.writing.concat(points.speaking).filter((p) => p.t >= weekStart(Date.now())).length;
  const bestBand = Math.max(0, ...mine.map((p) => p.band));
  const noData = points.writing.length === 0 && points.speaking.length === 0;

  if (noData) {
    return (
      <div className="grid place-items-center gap-4 rounded-xl bg-blue-soft px-6 py-16 text-center shadow-ring">
        <Illustration name="climbing-a-ladder-to-achieve-dreams-and-goals" className="h-48 w-auto" />
        <div>
          <p className="m-0 text-lg font-semibold text-ink">Chưa có bài nào được chấm</p>
          <p className="m-0 mt-1 text-sm text-ink-soft">Viết và nộp một bài, hành trình của bạn sẽ bắt đầu từ đây.</p>
        </div>
        <Link href="/writing" className="cl-primary inline-flex h-9 items-center gap-1 rounded-[10px] px-4 text-sm font-medium">Chọn một đề<ChevronRight className="size-4" /></Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Hero: where you are, how far to go, one clear next step. */}
      <section className="relative flex min-h-[220px] flex-col justify-between gap-6 overflow-hidden rounded-xl bg-blue-soft p-8 shadow-ring md:flex-row md:items-center">
        <div className="relative z-10 flex max-w-[560px] flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <RangeSwitch<SkillId> label="Kỹ năng" options={[{ id: 'writing', label: 'Writing' }, { id: 'speaking', label: 'Speaking' }]} value={skill} onChange={setSkill} />
            {onEditGoal && <button type="button" onClick={onEditGoal} className="cl-btn h-8 rounded-[10px] bg-white px-3 text-[13px] font-medium text-ink shadow-ring hover:bg-paper-2">{target ? 'Đổi mục tiêu' : 'Đặt mục tiêu'}</button>}
          </div>
          {last ? (
            <>
              <div>
                <p className="m-0 text-[13px] font-medium text-ink-soft">{SKILLS[skill].label} · band gần nhất</p>
                <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-3 text-[56px] font-semibold leading-none tracking-[-0.03em] text-ink tabular-nums">{bandText(last.band, true)}{target && <span className="text-xl font-medium tracking-normal text-ink-soft">/ mục tiêu {bandText(target, true)}</span>}</p>
              </div>
              {target ? (
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-gradient-to-r from-[#77A1DD] to-[#2F62C4] transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-smooth-out)]" style={{ width: Math.max(4, journey) + '%' }} /></div>
                  <p className="m-0 text-sm text-ink/80">{gap === 0 ? 'Bạn đã chạm mục tiêu. Giữ phong độ nhé!' : 'Còn ' + bandText(gap as number, true) + ' band nữa là tới đích · đã đi được ' + journey + '% quãng đường.'}</p>
                </div>
              ) : <p className="m-0 text-sm text-ink/80">Đặt mục tiêu band để thấy mình còn cách đích bao xa.</p>}
            </>
          ) : <p className="m-0 text-base text-ink/80">{SKILLS[skill].label} chưa có bài nào được chấm. Speaking sắp ra mắt.</p>}
          <div className="flex flex-wrap gap-3">
            <Tile label="Bài đã chấm" value={String(mine.length)} />
            <Tile label="Cao nhất" value={bestBand ? bandText(bestBand, true) : '–'} />
            <Tile label="Tuần này" value={thisWeek + ' bài'} />
          </div>
        </div>
        <Illustration name="climbing-a-ladder-to-achieve-dreams-and-goals" className="pointer-events-none relative z-0 h-60 w-auto shrink-0 md:h-72 md:self-end" />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard className="lg:col-span-2" art="person-running-up-the-stairs-by-drawing-and-creating-their-own-path-to-successs" eyebrow={SKILLS[skill].label + ' · band trung bình'} title="Bạn đã đi được bao xa"
          delta={last && first && last.band !== first.band ? { text: String(Math.abs(Math.round((last.band - first.band) * 10) / 10)), up: last.band > first.band, note: 'so với bài đầu' } : undefined}
          right={<RangeSwitch<'week' | 'month'> label="Khoảng thời gian" options={[{ id: 'week', label: 'Tuần' }, { id: 'month', label: 'Tháng' }]} value={period} onChange={setPeriod} />}>
          {mine.length === 0 ? <p className="m-0 py-16 text-center text-sm text-ink-soft">{SKILLS[skill].label} chưa có bài nào được chấm.</p> : (
            <div className="rounded-xl bg-blue-soft px-3 pt-2">
              <BarChart data={bars} xDataKey="label" stacked barGap={0.55} aspectRatio="2.5 / 1" margin={{ top: 16, right: 8, bottom: 32, left: 8 }}>
                <Grid horizontal />
                <Bar dataKey="Band" fill="var(--chart-1)" lineCap="round" />
                <Bar dataKey="Con" fill="#FFFFFF" lineCap="round" />
                <BarXAxis />
                <ChartTooltip rows={(p) => [{ color: 'var(--chart-1)', label: 'Band', value: p.Band ? bandText(p.Band as number, true) : 'chưa có bài' }]} />
              </BarChart>
            </div>
          )}
        </ChartCard>

        <ChartCard tint="bg-leaf-soft" art="person-with-archery-bow-hitting-bullseye" eyebrow="Mục tiêu" title="Còn cách bao xa">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <Tile label="Writing" value={latestOf('writing') ? bandText(latestOf('writing'), true) + ' / ' + bandText(targetOf('writing'), true) : '– / ' + bandText(targetOf('writing'), true)} color="var(--chart-1)" />
              <Tile label="Speaking" value={latestOf('speaking') ? bandText(latestOf('speaking'), true) + ' / ' + bandText(targetOf('speaking'), true) : 'sắp có'} color="var(--chart-2)" />
            </div>
            <div className="relative mx-auto w-full max-w-[300px]">
              <RingChart size={300} strokeWidth={16} ringGap={8} baseInnerRadius={52} data={[
                { label: 'Writing', value: latestOf('writing'), maxValue: targetOf('writing'), color: 'var(--chart-1)' },
                { label: 'Speaking', value: latestOf('speaking'), maxValue: targetOf('speaking'), color: 'var(--chart-2)' },
              ]}>
                <Ring index={0} showGlow={false} />
                <Ring index={1} showGlow={false} />
              </RingChart>
              <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                <div className="text-[30px] font-semibold leading-none tracking-[-0.02em] text-ink tabular-nums">{bandText(latestOf(skill), true)}</div>
                <div className="mt-1 text-xs text-ink-soft">{SKILLS[skill].label}</div>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard tint="bg-tomato-soft" className="lg:col-span-2" art="employee-meditating-among-work-tasks-work-life-balance" eyebrow="Giờ học" title="Bạn học nhiều nhất lúc nào"
          right={<RangeSwitch<'7' | '30' | '90'> label="Khoảng thời gian" options={[{ id: '7', label: '7 ngày' }, { id: '30', label: '30 ngày' }, { id: '90', label: '90 ngày' }]} value={String(days) as '7' | '30' | '90'} onChange={(v) => setDays(Number(v) as 7 | 30 | 90)} />}>
          <div className="flex flex-col gap-3">
            {heat.total > 0 && <p className="m-0 text-sm text-ink/80">Bạn hay luyện nhất vào <b className="text-ink">{DOW[heat.best.d]}, {String(heat.best.h * 2).padStart(2, '0')}h–{String(heat.best.h * 2 + 2).padStart(2, '0')}h</b> ({heat.total} lần trong {days} ngày).</p>}
            <div className="grid gap-[6px]" style={{ gridTemplateColumns: '28px repeat(12, minmax(0, 1fr))' }}>
              {heat.grid.map((row, d) => (
                <div key={d} className="contents">
                  <span className="self-center text-[13px] text-ink-soft">{DOW[d]}</span>
                  {row.map((n, h) => <span key={h} title={DOW[d] + ', ' + String(h * 2).padStart(2, '0') + 'h–' + String(h * 2 + 2).padStart(2, '0') + 'h: ' + n + ' lần'} className="aspect-[1.35/1] min-h-[26px] rounded-md transition-colors duration-[var(--duration-fast)]" style={{ background: HEAT[level(n)] }} />)}
                </div>
              ))}
              <span />
              {Array.from({ length: 12 }, (_, h) => <span key={h} className="text-center text-[12px] text-ink-soft tabular-nums">{String(h * 2).padStart(2, '0')}</span>)}
            </div>
            <div className="flex items-center justify-end gap-2 text-[13px] text-ink-soft">
              Ít {HEAT.map((c) => <span key={c} className="size-3.5 rounded-[4px] shadow-ring" style={{ background: c }} />)} Nhiều
            </div>
          </div>
        </ChartCard>

        <ChartCard tint="bg-sun-soft" art="woman-brainstorming-and-choosing-ideas" eyebrow={SKILLS[skill].label + ' · bài gần nhất'} title="Chi tiết tiêu chí">
          {last ? (
            <div className="flex flex-col gap-4">
              <div className="mx-auto w-full max-w-[300px]">
                <RadarChart size={300} levels={4} margin={52} metrics={SKILLS[skill].criteria}
                  data={[
                    { label: 'Gần nhất', color: 'var(--chart-1)', values: Object.fromEntries(SKILLS[skill].criteria.map((c) => [c.key, ((last.scores[c.key] ?? 0) / 9) * 100])) },
                    ...(target ? [{ label: 'Mục tiêu', color: 'var(--chart-2)', values: Object.fromEntries(SKILLS[skill].criteria.map((c) => [c.key, (target / 9) * 100])) }] : []),
                  ]}>
                  <RadarGrid showLabels={false} />
                  <RadarAxis />
                  <RadarLabels />
                  {target ? <RadarArea index={1} showPoints={false} /> : null}
                  <RadarArea index={0} />
                </RadarChart>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SKILLS[skill].criteria.map((c) => <Tile key={c.key} label={c.label} value={bandText(last.scores[c.key] ?? 0, true) + (target ? ' / ' + bandText(target, true) : '')} />)}
              </div>
            </div>
          ) : <p className="m-0 py-12 text-center text-sm text-ink-soft">{SKILLS[skill].label} chưa có bài nào được chấm.</p>}
        </ChartCard>
      </div>
    </div>
  );
}
