'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/shell/BrandHeader';
import { ProgressView, type Point, type ProgressData } from './ProgressView';

/** A small seeded random, so the demo looks the same on every visit. */
const rng = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const half = (x: number) => Math.round(x * 2) / 2;

/** Sample data for looking at the design: eight weeks of Writing climbing from about 5.5 to 6.5, mostly evenings and weekends. */
function sample(): ProgressData {
  const r = rng(7);
  const DAY = 86_400_000;
  const now = Date.now();
  const writing: Point[] = [];
  const speaking: Point[] = [];
  const activity: number[] = [];
  for (let i = 0; i < 26; i++) {
    const daysAgo = 56 - i * 2.2 - r() * 1.2;
    const d = new Date(now - daysAgo * DAY);
    const evening = r() < 0.72;
    d.setHours(evening ? 19 + Math.floor(r() * 4) : 8 + Math.floor(r() * 4), Math.floor(r() * 60));
    const t = d.getTime();
    activity.push(t - 25 * 60_000, t);
    const base = 5.4 + (i / 25) * 1.2;
    const s = (j: number) => half(base + (r() - 0.5) * 0.9 + j);
    const sc = { tr: s(0.1), cc: s(-0.2), lr: s(0.1), gra: s(-0.1) };
    writing.push({ t, band: half((sc.tr + sc.cc + sc.lr + sc.gra) / 4), scores: sc });
  }
  for (let i = 0; i < 5; i++) {
    const t = now - (24 - i * 5) * DAY;
    const s = (j: number) => half(5.5 + i * 0.25 + j);
    const sc = { fc: s(0), lr: s(0.1), gra: s(-0.2), p: s(0.2) };
    speaking.push({ t, band: half((sc.fc + sc.lr + sc.gra + sc.p) / 4), scores: sc });
    activity.push(t);
  }
  return { points: { writing, speaking }, activity, goals: { targetWriting: 7, targetSpeaking: 6.5, examDate: null } };
}

/** /progress/demo: the Tiến độ design with sample data, so it can be looked at without any real attempts. */
export function ProgressDemo() {
  const data = useMemo(sample, []);
  return (
    <div style={{ minHeight: '100%', background: '#fff' }}>
      <PageHeader />
      <main style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 32px 24px' }}>
        <p className="m-0 mb-4 rounded-lg bg-sun-soft px-4 py-2 text-[13px] text-ink/80">Dữ liệu mẫu để xem thiết kế. Trang thật ở <b>/progress</b>.</p>
        <ProgressView data={data} />
      </main>
    </div>
  );
}
