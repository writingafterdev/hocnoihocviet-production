'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { RiShuffleLine } from '@remixicon/react';
import { Illustration } from '@/components/brand/Illustration';
import { NavIcon, type NavIconName } from '@/components/brand/NavIcon';
import { AppCredits } from '@/components/shell/AppCredits';
import { findPrompt, PROMPTS, type Prompt } from '@/content/prompts';
import { attemptStore, type Attempt } from '../attempts/store';
import { startFreeAttempt } from '../attempts/start';

interface SavedWord { id: string; en: string; vi: string }

const TASK2 = PROMPTS.filter((p) => p.task === 'task2');
const WEEKS = 15;
const DAY = 86_400_000;

const dayKey = (t: number) => { const d = new Date(t); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); };
const shade = (n: number) => (n === 0 ? '#F0F0F0' : n === 1 ? '#D5E2F7' : n === 2 ? '#A9C3EC' : '#77A1DD');

/** A column of the middle band: a muted heading and rows separated by hairlines, like the Cloudflare account home. */
function Column({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex h-6 items-center text-[13px] font-medium text-ink-soft">
        {href ? <Link href={href} className="inline-flex items-center gap-0.5 hover:text-ink">{title}<ChevronRight className="size-3.5" /></Link> : title}
      </div>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function Row({ href, icon, children, note }: { href: string; icon?: React.ReactNode; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <Link href={href} className="flex min-h-12 items-center gap-3 border-t border-[#F0F0F0] py-2.5 first:border-t-0">
      {icon && <span className="grid size-6 shrink-0 place-items-center">{icon}</span>}
      <span className="min-w-0 flex-1 truncate text-[14.5px] text-ink">{children}</span>
      {note && <span className="max-w-[40%] shrink-0 truncate text-xs text-ink-soft">{note}</span>}
      <ChevronRight className="size-4 shrink-0 text-ink-soft/70" />
    </Link>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="m-0 py-3 text-[13.5px] leading-[1.5] text-ink-soft">{children}</p>;

const PRACTICE: { label: string; href: string; icon: NavIconName }[] = [
  { label: 'Chứng minh nhanh', href: '/prove', icon: 'drill' },
  { label: 'Luyện viết', href: '/writing', icon: 'write' },
  { label: 'Chép mẫu', href: '/copy', icon: 'copy' },
  { label: 'Từ vựng theo chủ đề', href: '/vocab', icon: 'vocab' },
];

/** App home, after the Cloudflare account home: a drawing and one line, a random prompt in place of the search bar, three short lists, then the student's numbers in one card. */
export function Dashboard() {
  const router = useRouter();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [starting, setStarting] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [words, setWords] = useState<SavedWord[] | null>(null);

  // Picked in the browser only, so the server and client renders agree.
  useEffect(() => { setPrompt(TASK2[Math.floor(Math.random() * TASK2.length)]); }, []);
  useEffect(() => { attemptStore.list().then(setAttempts, () => setAttempts([])); }, []);
  useEffect(() => {
    fetch('/api/vocab/mine', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : { items: [] })).then((d) => setWords(d.items || []), () => setWords([]));
  }, []);

  const shuffle = () => setPrompt((cur) => {
    const rest = TASK2.filter((p) => p.id !== cur?.id);
    return rest[Math.floor(Math.random() * rest.length)];
  });
  const start = async () => {
    if (!prompt || starting) return;
    setStarting(true);
    router.push(await startFreeAttempt(prompt));
  };

  // The numbers: writing days over the last weeks, the latest band scores, and counts.
  const stats = useMemo(() => {
    const list = attempts || [];
    const counts = new Map<string, number>();
    list.forEach((a) => { const k = dayKey(a.updatedAt); counts.set(k, (counts.get(k) || 0) + 1); });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    // Columns are weeks (Monday first), the last column is this week.
    const monday = today.getTime() - ((today.getDay() + 6) % 7) * DAY;
    const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
      const t = monday - (WEEKS - 1) * 7 * DAY + i * DAY;
      return { t, n: t > today.getTime() ? -1 : counts.get(dayKey(t)) || 0 };
    });
    const scored = list.filter((a) => a.essay.review?.scores.band != null).sort((a, b) => a.updatedAt - b.updatedAt);
    const bands = scored.slice(-8).map((a) => a.essay.review!.scores.band as number);
    return { cells, days: cells.filter((c) => c.n > 0).length, bands, latest: bands.length ? bands[bands.length - 1] : null, total: list.length };
  }, [attempts]);

  const recent = (attempts || []).slice(0, 4);
  const saved = (words || []).slice(0, 4);
  const figures: [string, string | number][] = [['Bài đã viết', stats.total], ['Band gần nhất', stats.latest != null ? stats.latest.toFixed(1) : '—'], ['Từ đã lưu', words ? words.length : '—']];

  return (
    <div className="relative flex min-h-full flex-col bg-white text-ink">
      <div className="mx-auto w-full max-w-[1560px] flex-1 px-8 pb-4 pt-6">
        <div className="mx-auto flex max-w-[1040px] flex-col">

          <div className="flex flex-col items-center gap-4 pt-4 text-center">
            <Illustration name="person-typing-essay-on-laptop-digital-writing-or-blogging" className="h-28 w-auto" />
            <h1 className="m-0 text-[clamp(30px,3.2vw,42px)] font-semibold leading-[1.1] tracking-[-0.03em]">Hôm nay luyện gì?</h1>
          </div>

          {/* A random prompt where the search bar would be. */}
          <div className="mt-8 rounded-[18px] bg-black/[0.035] p-1.5">
            <div className="flex min-h-14 items-center gap-3 rounded-[14px] bg-white py-2 pl-5 pr-2 shadow-ring">
              <span className="min-w-0 flex-1 text-[15px] leading-[1.45] text-ink">
                {prompt ? <span className="line-clamp-2">{prompt.text}</span> : <span className="text-ink-soft">…</span>}
              </span>
              <button type="button" onClick={shuffle} aria-label="Đổi đề khác" title="Đổi đề khác" className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-[10px] border-0 bg-transparent text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"><RiShuffleLine size={18} /></button>
              <button type="button" onClick={start} disabled={!prompt || starting} className="cl-primary h-10 shrink-0 cursor-pointer rounded-[10px] border-0 px-4 text-sm font-medium text-white">{starting ? 'Đang mở…' : 'Viết bài này'}</button>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-3">
            <Column title="Luyện tập">
              {PRACTICE.map((p) => <Row key={p.href} href={p.href} icon={<NavIcon name={p.icon} />}>{p.label}</Row>)}
            </Column>
            <Column title="Bài đang viết" href="/attempts">
              {attempts === null ? <Empty>Đang tải…</Empty>
                : recent.length === 0 ? <Empty>Chưa có bài nào. Chọn một đề ở trên để bắt đầu.</Empty>
                : recent.map((a) => {
                  const band = a.essay.review?.scores.band;
                  return <Row key={a.id} href={'/write/' + a.id + '/chains'} note={band != null ? band.toFixed(1) : undefined}>{findPrompt(a.promptId)?.text || 'Bài viết'}</Row>;
                })}
            </Column>
            <Column title="Từ vựng đã lưu" href="/vocab">
              {words === null ? <Empty>Đang tải…</Empty>
                : saved.length === 0 ? <Empty>Chưa lưu từ nào. Lưu từ khi dịch hoặc xin gợi ý từ vựng.</Empty>
                : saved.map((w) => <Row key={w.id} href="/vocab" note={w.vi}>{w.en}</Row>)}
            </Column>
          </div>

          {/* The numbers: several small diagrams in one card. */}
          <section aria-label="Hoạt động" className="mt-12 rounded-[18px] bg-black/[0.035] p-1.5">
            <div className="rounded-[14px] bg-white p-6 shadow-ring">
              <div className="mb-5 flex items-baseline justify-between">
                <h2 className="m-0 text-[15px] font-semibold">Hoạt động</h2>
                <span className="text-xs text-ink-soft">{WEEKS} tuần gần đây</span>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-[auto_1fr_auto] md:items-end">
                <div>
                  <div className="grid grid-flow-col grid-rows-7 gap-[3px]" role="img" aria-label={stats.days + ' ngày có viết bài trong ' + WEEKS + ' tuần'}>
                    {stats.cells.map((c, i) => <span key={i} title={c.n >= 0 ? new Date(c.t).toLocaleDateString('vi-VN') + ' · ' + c.n + ' bài' : undefined} className="heat-cell size-3 rounded-[3px]" style={{ background: c.n < 0 ? 'transparent' : shade(c.n), ['--d' as string]: Math.floor(i / 7) * 25 + 'ms' }} />)}
                  </div>
                  <p className="m-0 mt-3 text-xs text-ink-soft">{stats.days} ngày có viết bài</p>
                </div>

                <div className="flex h-24 items-end justify-center gap-2" role="img" aria-label="Điểm band các bài gần nhất">
                  {stats.bands.length === 0
                    ? <span className="self-center text-[13px] text-ink-soft">Điểm các bài đã chấm sẽ hiện ở đây.</span>
                    : stats.bands.map((b, i) => (
                      <div key={i} className="flex h-full w-7 flex-col items-center justify-end gap-1">
                        <span className="text-[11px] tabular-nums text-ink-soft">{b.toFixed(1)}</span>
                        <div className="flex w-full flex-1 items-end rounded-md bg-[#EEF0F4]"><div className="w-full rounded-md bg-[#77A1DD]" style={{ height: Math.max(8, (b / 9) * 100) + '%' }} /></div>
                      </div>
                    ))}
                </div>

                <dl className="m-0 grid grid-cols-3 gap-6 md:grid-cols-1 md:gap-3">
                  {figures.map(([k, v]) => (
                    <div key={k} className="flex flex-col md:flex-row md:items-baseline md:justify-between md:gap-6">
                      <dt className="text-xs text-ink-soft">{k}</dt>
                      <dd className="m-0 text-xl font-semibold tabular-nums tracking-[-0.02em]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>
        </div>
      </div>
      <footer className="shrink-0 pb-4 pt-8"><AppCredits /></footer>
    </div>
  );
}
