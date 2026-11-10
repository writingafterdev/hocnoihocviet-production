'use client';

import Link from 'next/link';
import { useLayoutEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { Illustration } from '@/components/brand/Illustration';
import { Badge } from '@/components/ui/badge';
import { AppCredits } from '@/components/shell/AppCredits';
import { cn } from '@/lib/utils';

const SOON = [
  { id: 'speaking', tag: 'Speaking · Part 1–3', title: 'Luyện nói', description: 'Ngắt nghỉ, nhấn âm và độ dài câu trả lời.', illustration: 'woman-answering-questions-on-a-podium', note: 'Sắp ra mắt' },
  { id: 'reading', tag: 'Reading · bài báo', title: 'Đọc báo', description: 'Bài từ The Economist, The New Yorker, The Atlantic.', illustration: 'woman-with-paper-document-thinking', note: 'Tạm đóng' },
];

const card = 'overflow-hidden rounded-xl bg-white shadow-ring';

/** Task 2: the big card, tinted all over so there is no empty white. Words on the left, the drawing large on the right. */
function Task2Card() {
  return (
    <Link href="/writing" className="group relative flex min-h-[400px] flex-col overflow-hidden rounded-xl bg-tomato-soft shadow-ring transition-shadow duration-150 hover:shadow-ring-hover focus-visible:shadow-[0_0_0_2px_var(--brand-blue-deep)] focus-visible:outline-none md:flex-row">
      <div className="relative z-10 flex flex-col gap-2 p-8 md:w-[46%]">
        <Badge variant="blue" className="mb-4 bg-white">Beta</Badge>
        <span className="text-xs font-medium text-ink-soft">Writing · IELTS</span>
        <h2 className="m-0 text-[44px] font-semibold leading-none tracking-[-0.03em] text-ink">Task 2</h2>
        <p className="m-0 mt-1 max-w-[36ch] text-[15px] leading-[1.6] text-ink/70">Từ một câu khởi động đến cả bài viết: dựng mạch cho từng thân bài, viết, rồi nhận điểm theo bốn tiêu chí của giám khảo.</p>
        <span className="mt-auto inline-flex items-center gap-0.5 pt-6 text-sm font-medium text-blue-deep">Bắt đầu <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
      </div>
      <div className="relative min-h-64 flex-1">
        <Illustration name="person-typing-essay-on-laptop-digital-writing-or-blogging" className="absolute inset-0 m-auto h-[88%] w-[92%] transition-transform duration-300 group-hover:scale-[1.03]" />
      </div>
    </Link>
  );
}

/** Vocabulary stays a card of its own. */
function VocabCard() {
  return (
    <Link href="/vocab" className={cn(card, 'group flex flex-col transition-shadow duration-150 hover:shadow-ring-hover focus-visible:shadow-[0_0_0_2px_var(--brand-blue-deep)] focus-visible:outline-none')}>
      <div className="relative grid h-60 place-items-center bg-leaf-soft">
        <Illustration name="person-studying-different-sciences" className="h-48 w-auto transition-transform duration-300 group-hover:scale-[1.03]" />
        <Badge variant="blue" className="absolute left-3 top-3">Beta</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-4">
        <span className="text-xs font-medium text-ink-soft">Từ vựng · theo chủ đề</span>
        <h2 className="m-0 text-xl font-semibold tracking-[-0.02em] text-ink">Từ vựng</h2>
        <p className="m-0 text-[15px] leading-[1.55] text-ink-soft">Cụm từ cho Task 1, Task 2 và Speaking, kèm đoạn văn để luyện dùng ngay.</p>
        <span className="mt-auto inline-flex items-center gap-0.5 pt-2.5 text-[13px] font-medium text-blue-deep">Bắt đầu <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
      </div>
    </Link>
  );
}

/** Something not open yet: a wide, quiet card with the drawing on the left. */
function SoonCard({ p }: { p: (typeof SOON)[number] }) {
  return (
    <div aria-disabled="true" className={cn(card, 'flex')}>
      <div className="grid w-48 shrink-0 place-items-center bg-paper-2">
        <Illustration name={p.illustration} className="h-32 w-auto opacity-60 grayscale" />
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-5">
        <span className="text-xs font-medium text-ink-soft">{p.tag}</span>
        <h2 className="m-0 text-lg font-semibold tracking-[-0.02em] text-ink">{p.title}</h2>
        <p className="m-0 text-[15px] leading-[1.55] text-ink-soft">{p.description}</p>
        <Badge variant="secondary" className="mt-auto">{p.note}</Badge>
      </div>
    </div>
  );
}

/**
 * App home: Task 2 as the big card on the left, vocabulary beside it, what's coming below. The grid is centred
 * vertically; it tells the sidebar where its top is (--content-top) so the brand lines up with the top of the cards.
 */
export function Dashboard() {
  const grid = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = document.documentElement;
    const place = () => { if (grid.current) root.style.setProperty('--content-top', Math.round(grid.current.getBoundingClientRect().top + window.scrollY) + 'px'); };
    place();
    window.addEventListener('resize', place);
    const watch = new ResizeObserver(place);
    if (grid.current) watch.observe(grid.current);
    return () => { window.removeEventListener('resize', place); watch.disconnect(); root.style.removeProperty('--content-top'); };
  }, []);
  return (
    <div className="min-h-screen bg-white text-ink">
      <main className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col justify-center py-10 pl-4 pr-6">
        <div ref={grid} className="grid grid-cols-1 gap-5 md:grid-cols-6">
          <div className="grid md:col-span-4"><Task2Card /></div>
          <div className="grid md:col-span-2"><VocabCard /></div>
          {SOON.map((p) => <div key={p.id} className="grid md:col-span-3"><SoonCard p={p} /></div>)}
        </div>
        <footer className="pt-10"><AppCredits /></footer>
      </main>
    </div>
  );
}
