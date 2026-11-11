'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/shell/BrandHeader';
import { Illustration } from '@/components/brand/Illustration';
import { ChartCard } from '@/components/charts/ChartCard';
import { Gauge } from '@/components/charts/Gauge';
import { RadarShape } from '@/components/charts/RadarCard';
import { RangeSwitch } from '@/components/charts/RangeSwitch';
import { SmoothArea } from '@/components/charts/SmoothArea';
import { StackedBars } from '@/components/charts/StackedBars';
import { CHART } from '@/components/charts/palette';
import { bandOf, bandText } from '../desk/scoring';
import { attemptStore, SignedOutError, type Attempt } from '../attempts/store';

const WEEK = 7 * 86_400_000;
const dm = (t: number) => { const d = new Date(t); return d.getDate() + '/' + (d.getMonth() + 1); };
/** Monday 00:00 (local) of the week a time falls in. */
const weekStart = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-white p-5 shadow-ring">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      <span className="text-[36px] font-semibold leading-none tracking-[-0.03em] text-ink tabular-nums">{value}</span>
      {note && <span className="text-[13px] text-ink-soft">{note}</span>}
    </div>
  );
}

/** "Tiến độ": the student's band over time, the four criteria, and how much they practise each week. */
export function ProgressPage() {
  const router = useRouter();
  const [list, setList] = useState<Attempt[] | null>(null);
  const [vocab, setVocab] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [range, setRange] = useState<'recent' | 'all'>('recent');

  useEffect(() => {
    attemptStore.list().then(setList, (e) => { if (e instanceof SignedOutError) router.replace('/login?next=/progress'); else setFailed(true); });
    fetch('/api/vocab', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.practiced) setVocab(Object.keys(d.practiced).length); }, () => {});
  }, [router]);

  const data = useMemo(() => {
    const graded = (list || []).filter((a) => a.essay?.review && a.essay.review.source !== 'sample').sort((a, b) => a.updatedAt - b.updatedAt);
    const points = graded.map((a) => { const s = a.essay.review!.scores; return { t: a.updatedAt, tr: s.tr, cc: s.cc, lr: s.lr, gra: s.gra, band: bandOf(s.tr, s.cc, s.lr, s.gra) }; });
    const last = points[points.length - 1];
    // Eight weeks, oldest first: attempts started and attempts graded.
    const now = weekStart(Date.now());
    const weeks = Array.from({ length: 8 }, (_, i) => now - (7 - i) * WEEK);
    const bars = weeks.map((w) => ({
      label: dm(w),
      started: (list || []).filter((a) => weekStart(a.createdAt) === w).length,
      graded: graded.filter((a) => weekStart(a.updatedAt) === w).length,
    }));
    return { points, last, best: points.length ? Math.max(...points.map((p) => p.band)) : 0, bars, graded: graded.length };
  }, [list]);

  const shown = range === 'recent' ? data.points.slice(-10) : data.points;
  const first = data.points[0];
  const change = first && data.last ? Math.round((data.last.band - first.band) * 10) / 10 : 0;

  if (failed) return <div style={{ minHeight: '100%' }}><PageHeader /><p className="m-0 p-8 text-sm text-tomato-deep">Chưa tải được dữ liệu. Tải lại trang để thử lại.</p></div>;
  if (!list) return <div style={{ minHeight: '100%' }}><PageHeader /><p className="m-0 p-8 text-sm text-ink-soft">Đang tải…</p></div>;

  return (
    <div style={{ minHeight: '100%', background: '#fff' }}>
      <PageHeader />
      <main style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 32px 24px' }} className="flex flex-col gap-4">
        {data.graded === 0 ? (
          <div className="grid place-items-center gap-4 rounded-xl bg-blue-soft px-6 py-16 text-center">
            <Illustration name="hands-holding-different-charts" className="h-40 w-auto" />
            <div>
              <p className="m-0 text-lg font-semibold text-ink">Chưa có bài nào được chấm</p>
              <p className="m-0 mt-1 text-sm text-ink-soft">Viết và nộp một bài, điểm và biểu đồ tiến độ sẽ hiện ở đây.</p>
            </div>
            <Link href="/writing" className="cl-primary inline-flex h-9 items-center gap-1 rounded-[10px] px-4 text-sm font-medium">Chọn một đề<ChevronRight className="size-4" /></Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Tile label="Bài đã chấm" value={String(data.graded)} note={data.bars.reduce((n, b) => n + b.started, 0) + ' bài bắt đầu trong 8 tuần'} />
              <Tile label="Band gần nhất" value={bandText(data.last.band, true)} note={change ? (change > 0 ? '▲ ' : '▼ ') + Math.abs(change) + ' so với bài đầu' : 'Bằng bài đầu'} />
              <Tile label="Band cao nhất" value={bandText(data.best, true)} note="trong các bài đã chấm" />
              <Tile label="Cụm từ đã luyện" value={vocab === null ? '–' : String(vocab)} note="từ phần Từ vựng" />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <ChartCard className="lg:col-span-2" eyebrow="Tiến độ" title="Band qua từng bài" value={bandText(data.last.band, true)}
                delta={change ? { text: String(Math.abs(change)), up: change > 0, note: 'so với bài đầu' } : undefined}
                right={<RangeSwitch<'recent' | 'all'> options={[{ id: 'recent', label: '10 bài gần nhất' }, { id: 'all', label: 'Tất cả' }]} value={range} onChange={setRange} />}>
                <SmoothArea data={shown.map((p) => ({ label: dm(p.t), value: p.band, note: 'Band ' + bandText(p.band, true) + ' · ' + dm(p.t) }))} yDomain={[0, 9]} />
              </ChartCard>
              <ChartCard eyebrow="Bài gần nhất" title="Bốn tiêu chí">
                <RadarShape data={[{ axis: 'TR', value: data.last.tr }, { axis: 'CC', value: data.last.cc }, { axis: 'LR', value: data.last.lr }, { axis: 'GRA', value: data.last.gra }]} />
              </ChartCard>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <ChartCard className="lg:col-span-2" eyebrow="Hoạt động" title="Luyện tập theo tuần">
                <StackedBars data={data.bars} series={[{ key: 'started', name: 'Bắt đầu', color: CHART.blueSoft }, { key: 'graded', name: 'Đã chấm', color: CHART.blue }]} />
              </ChartCard>
              <ChartCard eyebrow="Thang điểm 9" title="Band gần nhất">
                <Gauge value={data.last.band} max={9} label={bandText(data.last.band, true)} sub="trên 9.0" />
              </ChartCard>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
