'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/shell/BrandHeader';
import { OnboardingDialog } from '@/components/shell/OnboardingDialog';
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
import { useProfile } from '@/lib/profile';
import { bandOf, bandText } from '../desk/scoring';
import { attemptStore, SignedOutError, type Attempt } from '../attempts/store';

type SkillId = 'writing' | 'speaking';
/** Each skill names its own criteria, so a new skill only needs an entry here and scored attempts. */
const SKILLS: Record<SkillId, { label: string; criteria: { key: string; label: string }[] }> = {
  writing: { label: 'Writing', criteria: [{ key: 'tr', label: 'TR' }, { key: 'cc', label: 'CC' }, { key: 'lr', label: 'LR' }, { key: 'gra', label: 'GRA' }] },
  speaking: { label: 'Speaking', criteria: [{ key: 'fc', label: 'FC' }, { key: 'lr', label: 'LR' }, { key: 'gra', label: 'GRA' }, { key: 'p', label: 'P' }] },
};
interface Point { t: number; band: number; scores: Record<string, number> }

const DAY = 86_400_000;
const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const weekStart = (t: number) => { const d = new Date(startOfDay(t)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
const monthStart = (t: number) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); };
const dm = (t: number) => { const d = new Date(t); return d.getDate() + '/' + (d.getMonth() + 1); };
const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((n, x) => n + x, 0) / xs.length) * 10) / 10 : 0);
const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const LEVEL = ['#EEF0F4', '#DCE6F7', '#B7CCEF', '#8FB0E6', '#2F62C4'];

function Tile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl bg-white px-4 py-3">
      <span className="flex items-center gap-2 text-[15px] text-ink-soft">{color && <span className="size-3 shrink-0 rounded-[4px]" style={{ background: color }} />}{label}</span>
      <span className="text-[17px] font-medium text-ink tabular-nums">{value}</span>
    </div>
  );
}

/** "Tiến độ": how far the student has come toward their target, when they practise most, and the detail by criterion. */
export function ProgressPage() {
  const router = useRouter();
  const profile = useProfile();
  const [list, setList] = useState<Attempt[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [skill, setSkill] = useState<SkillId>('writing');
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [goalOpen, setGoalOpen] = useState(false);

  useEffect(() => {
    attemptStore.list().then(setList, (e) => { if (e instanceof SignedOutError) router.replace('/login?next=/progress'); else setFailed(true); });
  }, [router]);

  const points = useMemo(() => {
    const out: Record<SkillId, Point[]> = { writing: [], speaking: [] };
    (list || []).filter((a) => a.essay?.review && a.essay.review.source !== 'sample').sort((a, b) => a.updatedAt - b.updatedAt).forEach((a) => {
      const s = a.essay.review!.scores;
      out.writing.push({ t: a.updatedAt, band: bandOf(s.tr, s.cc, s.lr, s.gra), scores: { tr: s.tr, cc: s.cc, lr: s.lr, gra: s.gra } });
    });
    return out;
  }, [list]);

  const target = skill === 'writing' ? profile?.targetWriting : profile?.targetSpeaking;
  const mine = points[skill];
  const last = mine[mine.length - 1];
  const first = mine[0];
  const change = first && last ? Math.round((last.band - first.band) * 10) / 10 : 0;
  const top = target || 9;

  // How far: average band per week / month, with the rest up to the target as the pale track.
  const bars = useMemo(() => {
    const now = Date.now();
    const buckets: { label: string; from: number; to: number }[] = [];
    if (period === 'week') for (let i = 7; i >= 0; i--) { const f = weekStart(now - i * 7 * DAY); buckets.push({ label: dm(f), from: f, to: f + 7 * DAY }); }
    else if (period === 'month') for (let i = 5; i >= 0; i--) { const d = new Date(new Date(now).getFullYear(), new Date(now).getMonth() - i, 1); const f = d.getTime(); buckets.push({ label: 'T' + (d.getMonth() + 1), from: f, to: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() }); }
    else for (let i = 11; i >= 0; i--) { const d = new Date(new Date(now).getFullYear(), new Date(now).getMonth() - i, 1); const f = d.getTime(); buckets.push({ label: 'T' + (d.getMonth() + 1), from: f, to: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() }); }
    return buckets.map((b) => { const v = avg(mine.filter((p) => p.t >= b.from && p.t < b.to).map((p) => p.band)); return { label: b.label, Band: v, Con: Math.max(0, Math.round((top - v) * 10) / 10) }; });
  }, [mine, period, top]);

  // When: attempts started or saved, by weekday and two-hour block.
  const heat = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array(12).fill(0) as number[]);
    const since = Date.now() - days * DAY;
    (list || []).forEach((a) => [a.createdAt, a.updatedAt].forEach((t) => { if (t >= since) { const d = new Date(t); grid[(d.getDay() + 6) % 7][Math.floor(d.getHours() / 2)] += 1; } }));
    const max = Math.max(1, ...grid.flat());
    return { grid, max, total: grid.flat().reduce((n, x) => n + x, 0) };
  }, [list, days]);
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / heat.max) * 4)));

  if (failed) return <div style={{ minHeight: '100%' }}><PageHeader /><p className="m-0 p-8 text-sm text-tomato-deep">Chưa tải được dữ liệu. Tải lại trang để thử lại.</p></div>;
  if (!list) return <div style={{ minHeight: '100%' }}><PageHeader /><p className="m-0 p-8 text-sm text-ink-soft">Đang tải…</p></div>;

  const noData = points.writing.length === 0 && points.speaking.length === 0;
  const skillSwitch = <RangeSwitch<SkillId> label="Kỹ năng" options={[{ id: 'writing', label: 'Writing' }, { id: 'speaking', label: 'Speaking' }]} value={skill} onChange={setSkill} />;
  const latestOf = (s: SkillId) => { const p = points[s]; return p.length ? p[p.length - 1].band : 0; };
  const targetOf = (s: SkillId) => (s === 'writing' ? profile?.targetWriting : profile?.targetSpeaking) || 9;

  return (
    <div style={{ minHeight: '100%', background: '#fff' }}>
      <PageHeader />
      <main style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 32px 24px' }} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-sm text-ink-soft">{profile && (profile.targetWriting || profile.targetSpeaking) ? 'Mục tiêu: ' + [profile.targetWriting && 'Writing ' + bandText(profile.targetWriting, true), profile.targetSpeaking && 'Speaking ' + bandText(profile.targetSpeaking, true)].filter(Boolean).join(' · ') + (profile.examDate ? ' · thi ngày ' + profile.examDate.split('-').reverse().join('/') : '') : 'Bạn chưa đặt mục tiêu band.'}</p>
          <button type="button" onClick={() => setGoalOpen(true)} className="cl-btn h-9 rounded-[10px] bg-white px-3 text-sm font-medium text-ink shadow-ring hover:bg-paper-2">{profile && (profile.targetWriting || profile.targetSpeaking) ? 'Đổi mục tiêu' : 'Đặt mục tiêu'}</button>
        </div>

        {noData ? (
          <div className="grid place-items-center gap-4 rounded-2xl bg-[#F7F7F7] px-6 py-16 text-center">
            <Illustration name="hands-holding-different-charts" className="h-40 w-auto" />
            <div>
              <p className="m-0 text-lg font-semibold text-ink">Chưa có bài nào được chấm</p>
              <p className="m-0 mt-1 text-sm text-ink-soft">Viết và nộp một bài, biểu đồ tiến độ sẽ hiện ở đây.</p>
            </div>
            <Link href="/writing" className="cl-primary inline-flex h-9 items-center gap-1 rounded-[10px] px-4 text-sm font-medium">Chọn một đề<ChevronRight className="size-4" /></Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <ChartCard tone="soft" className="lg:col-span-2" eyebrow={SKILLS[skill].label + ' · band trung bình'} title={last ? bandText(last.band, true) : '–'} value={undefined}
                delta={last && change ? { text: String(Math.abs(change)), up: change > 0, note: 'so với bài đầu' } : undefined}
                right={<div className="flex flex-wrap justify-end gap-2">{skillSwitch}<RangeSwitch<'week' | 'month' | 'year'> label="Khoảng thời gian" options={[{ id: 'week', label: 'Tuần' }, { id: 'month', label: 'Tháng' }, { id: 'year', label: 'Năm' }]} value={period} onChange={setPeriod} /></div>}>
                {mine.length === 0 ? (
                  <p className="m-0 py-16 text-center text-sm text-ink-soft">{SKILLS[skill].label} chưa có bài nào được chấm.</p>
                ) : (
                  <BarChart data={bars} xDataKey="label" stacked barGap={0.6} aspectRatio="2.6 / 1" margin={{ top: 16, right: 8, bottom: 32, left: 8 }}>
                    <Grid horizontal />
                    <Bar dataKey="Band" fill="var(--chart-1)" lineCap="round" />
                    <Bar dataKey="Con" fill="var(--chart-scale-01)" lineCap="round" />
                    <BarXAxis />
                    <ChartTooltip rows={(p) => [{ color: 'var(--chart-1)', label: 'Band', value: p.Band ? bandText(p.Band as number, true) : 'chưa có bài' }]} />
                  </BarChart>
                )}
              </ChartCard>
              <ChartCard tone="soft" eyebrow="Mục tiêu" title="Còn cách bao xa">
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
              <ChartCard tone="soft" className="lg:col-span-2" eyebrow="Giờ học" title="Bạn học nhiều nhất lúc nào"
                right={<RangeSwitch<'7' | '30' | '90'> label="Khoảng thời gian" options={[{ id: '7', label: '7 ngày' }, { id: '30', label: '30 ngày' }, { id: '90', label: '90 ngày' }]} value={String(days) as '7' | '30' | '90'} onChange={(v) => setDays(Number(v) as 7 | 30 | 90)} />}>
                <div className="flex flex-col gap-3">
                  <div className="grid gap-[6px]" style={{ gridTemplateColumns: '28px repeat(12, minmax(0, 1fr))' }}>
                    {heat.grid.map((row, d) => (
                      <div key={d} className="contents">
                        <span className="self-center text-[13px] text-ink-soft">{DOW[d]}</span>
                        {row.map((n, h) => <span key={h} title={DOW[d] + ', ' + String(h * 2).padStart(2, '0') + 'h–' + String(h * 2 + 2).padStart(2, '0') + 'h: ' + n + ' lần'} className="aspect-[1.35/1] min-h-[26px] rounded-md transition-colors duration-[var(--duration-fast)]" style={{ background: LEVEL[level(n)] }} />)}
                      </div>
                    ))}
                    <span />
                    {Array.from({ length: 12 }, (_, h) => <span key={h} className="text-center text-[12px] text-ink-soft tabular-nums">{String(h * 2).padStart(2, '0')}</span>)}
                  </div>
                  <div className="flex items-center justify-end gap-2 text-[13px] text-ink-soft">
                    Ít {LEVEL.map((c) => <span key={c} className="size-3.5 rounded-[4px]" style={{ background: c }} />)} Nhiều
                  </div>
                </div>
              </ChartCard>
              <ChartCard tone="soft" eyebrow={SKILLS[skill].label + ' · bài gần nhất'} title="Chi tiết từng tiêu chí">
                {last ? (
                  <div className="flex flex-col gap-4">
                    <div className="mx-auto w-full max-w-[300px]">
                      <RadarChart size={300} levels={4} margin={52}
                        metrics={SKILLS[skill].criteria}
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
          </>
        )}
      </main>
      {goalOpen && <OnboardingDialog forceOpen onClose={() => setGoalOpen(false)} />}
    </div>
  );
}
