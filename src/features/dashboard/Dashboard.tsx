'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { RiShuffleLine } from '@remixicon/react';
import { Illustration } from '@/components/brand/Illustration';
import { NavIcon, type NavIconName } from '@/components/brand/NavIcon';
import { AppCredits } from '@/components/shell/AppCredits';
import { findPrompt, PROMPTS, TOPIC_ILLUSTRATION, type Prompt } from '@/content/prompts';
import { wordCount } from '../desk/scoring';
import { attemptStore, type Attempt } from '../attempts/store';
import { startFreeAttempt } from '../attempts/start';

interface SavedWord { id: string; en: string; vi: string }

const TASK2 = PROMPTS.filter((p) => p.task === 'task2');
const WEEKS = 52;
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
    return { cells, days: cells.filter((c) => c.n > 0).length };
  }, [attempts]);

  const recent = (attempts || []).slice(0, 3);
  const saved = (words || []).slice(0, 4);

  return (
    <div className="relative flex min-h-full flex-col bg-white text-ink">
      <div className="mx-auto w-full max-w-[1560px] flex-1 px-8 pb-4 pt-6">
        <div className="mx-auto flex max-w-[1040px] flex-col">

          <div className="flex flex-col items-center gap-4 pt-4 text-center">
            <Illustration name="person-typing-essay-on-laptop-digital-writing-or-blogging" className="h-28 w-auto" />
            <h1 className="m-0 text-[clamp(30px,3.2vw,42px)] font-semibold leading-[1.1] tracking-[-0.03em]">Hôm nay luyện gì?</h1>
          </div>

          {/* A random prompt, as the same card as the library's, with a way to swap it. */}
          <div className="mt-8 flex items-stretch rounded-xl bg-white p-3 shadow-ring">
            <div className="flex min-h-[116px] w-[136px] shrink-0 items-center justify-center rounded-lg bg-[#F5F5F5]">
              {prompt && (/* eslint-disable-next-line @next/next/no-img-element */
                <img src={'/illustrations/' + TOPIC_ILLUSTRATION[prompt.topic] + '.svg'} alt="" className="size-[100px] object-contain mix-blend-multiply" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col px-4 py-1">
              {prompt ? (
                <>
                  <div className="mb-2.5 flex flex-wrap gap-2">
                    <span className="rounded bg-[#F5F5F5] px-2 py-1 text-xs font-semibold text-[#525252]">{prompt.category}</span>
                    <span className="rounded bg-[#EDF7EA] px-2 py-1 text-xs font-semibold text-[#167A59]">{prompt.topic}</span>
                  </div>
                  <p className="m-0 line-clamp-3 text-left text-sm font-medium leading-[1.55]">{prompt.text}</p>
                </>
              ) : <p className="m-0 text-sm text-ink-soft">…</p>}
            </div>
            <div className="flex w-36 shrink-0 flex-col items-stretch justify-center gap-2 p-2">
              <button type="button" onClick={start} disabled={!prompt || starting} className="cl-primary h-10 cursor-pointer rounded-[10px] border-0 px-4 text-sm font-medium text-white">{starting ? 'Đang mở…' : 'Viết bài này'}</button>
              <button type="button" onClick={shuffle} className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border-0 bg-[#F5F5F5] text-[13px] font-medium text-ink-soft hover:text-ink"><RiShuffleLine size={15} />Đổi đề</button>
            </div>
          </div>

          {/* Writing in progress, as the same cards as the library and Bài đã viết. */}
          <section aria-label="Bài đang viết" className="mt-12">
            <div className="mb-3 flex h-6 items-center text-[13px] font-medium text-ink-soft">
              <Link href="/attempts" className="inline-flex items-center gap-0.5 hover:text-ink">Bài đang viết<ChevronRight className="size-3.5" /></Link>
            </div>
            <div className="flex flex-col gap-3">
              {attempts === null ? <Empty>Đang tải…</Empty>
                : recent.length === 0 ? <Empty>Chưa có bài nào. Chọn một đề ở trên để bắt đầu.</Empty>
                : recent.map((a) => {
                  const p = findPrompt(a.promptId);
                  if (!p) return null;
                  const words = Object.values(a.essay.drafts || {}).reduce((n, t) => n + wordCount(t), 0);
                  const band = a.essay.review?.scores.band;
                  return (
                    <Link key={a.id} href={'/write/' + a.id + (words ? '/essay' : '/chains')} className="pl-card flex items-stretch rounded-xl bg-white p-3 text-ink shadow-ring">
                      <div className="flex min-h-[116px] w-[136px] shrink-0 items-center justify-center rounded-lg bg-[#F5F5F5]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={'/illustrations/' + TOPIC_ILLUSTRATION[p.topic] + '.svg'} alt="" className="size-[100px] object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col px-4 py-1">
                        <div className="mb-2.5 flex flex-wrap gap-2">
                          <span className="rounded bg-[#F5F5F5] px-2 py-1 text-xs font-semibold text-[#525252]">{p.category}</span>
                          <span className="rounded bg-[#EDF7EA] px-2 py-1 text-xs font-semibold text-[#167A59]">{p.topic}</span>
                        </div>
                        <p className="m-0 line-clamp-2 text-sm font-medium leading-[1.55]">{p.text}</p>
                        <p className="m-0 mt-auto pt-2.5 text-xs text-ink-soft">{a.chains.length} thân bài · {words} từ</p>
                      </div>
                      <div className="flex w-28 shrink-0 flex-col items-center justify-center p-2 text-center">
                        {band != null ? <span className="text-[34px] font-semibold leading-none tracking-[-0.02em] text-blue-deep tabular-nums">{band.toFixed(1)}</span>
                          : <span className="text-[13px] font-semibold text-ink-soft">{words ? 'Chưa nộp' : 'Đang dựng mạch'}</span>}
                      </div>
                    </Link>
                  );
                })}
            </div>
          </section>

          <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
            <Column title="Luyện tập">
              {PRACTICE.map((p) => <Row key={p.href} href={p.href} icon={<NavIcon name={p.icon} />}>{p.label}</Row>)}
            </Column>
            <Column title="Từ vựng đã lưu" href="/vocab">
              {words === null ? <Empty>Đang tải…</Empty>
                : saved.length === 0 ? <Empty>Chưa lưu từ nào. Lưu từ khi dịch hoặc xin gợi ý từ vựng.</Empty>
                : saved.map((w) => <Row key={w.id} href="/vocab" note={w.vi}>{w.en}</Row>)}
            </Column>
          </div>

          {/* The heat map: the days the student wrote. */}
          <section aria-label="Hoạt động" className="mt-12 rounded-[18px] bg-black/[0.035] p-1.5">
            <div className="rounded-[14px] bg-white p-6 shadow-ring">
              <div className="mb-5 flex items-baseline justify-between">
                <h2 className="m-0 text-[15px] font-semibold">Hoạt động</h2>
                <span className="text-xs text-ink-soft">{stats.days} ngày có viết bài trong năm qua</span>
              </div>
              <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={{ gridTemplateColumns: 'repeat(' + WEEKS + ', minmax(0, 1fr))' }} role="img" aria-label={stats.days + ' ngày có viết bài trong ' + WEEKS + ' tuần'}>
                {stats.cells.map((c, i) => <span key={i} title={c.n >= 0 ? new Date(c.t).toLocaleDateString('vi-VN') + ' · ' + c.n + ' bài' : undefined} className="heat-cell aspect-square rounded-[3px]" style={{ background: c.n < 0 ? 'transparent' : shade(c.n), ['--d' as string]: Math.floor(i / 7) * 12 + 'ms' }} />)}
              </div>
            </div>
          </section>
        </div>
      </div>
      <footer className="shrink-0 pb-4 pt-8"><AppCredits /></footer>
    </div>
  );
}
