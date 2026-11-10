'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Illustration } from '@/components/brand/Illustration';
import { Badge } from '@/components/ui/badge';
import { AppCredits } from '@/components/shell/AppCredits';
import { PageHeader } from '@/components/shell/BrandHeader';
import { cn } from '@/lib/utils';

const SOON = [
  { id: 'speaking', tag: 'Speaking · Part 1–3', title: 'Luyện nói', description: 'Ngắt nghỉ, nhấn âm và độ dài câu trả lời.', illustration: 'woman-answering-questions-on-a-podium', note: 'Sắp ra mắt' },
  { id: 'reading', tag: 'Reading · bài báo', title: 'Đọc báo', description: 'Bài từ The Economist, The New Yorker, The Atlantic.', illustration: 'woman-with-paper-document-thinking', note: 'Tạm đóng' },
];

const card = 'overflow-hidden rounded-xl bg-white shadow-ring';

/** Task 2: the big card, the drawing on the left. The whole card is the link to the writing practice. */
function Task2Card() {
  return (
    <Link href="/writing" className={cn(card, 'group flex flex-col transition-shadow duration-150 hover:shadow-ring-hover focus-visible:shadow-[0_0_0_2px_var(--brand-blue-deep)] focus-visible:outline-none md:flex-row')}>
      <div className="relative grid h-64 shrink-0 place-items-center bg-tomato-soft md:h-auto md:w-80">
        <Illustration name="person-typing-essay-on-laptop-digital-writing-or-blogging" className="h-60 w-auto transition-transform duration-300 group-hover:scale-[1.03]" />
        <Badge variant="blue" className="absolute left-3 top-3">Beta</Badge>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 p-8">
        <span className="text-xs font-medium text-ink-soft">Writing · IELTS</span>
        <h2 className="m-0 text-[32px] font-semibold leading-tight tracking-[-0.025em] text-ink">Task 2</h2>
        <p className="m-0 max-w-[40ch] text-[15px] leading-[1.6] text-ink-soft">Từ một câu khởi động đến cả bài viết: dựng mạch cho từng thân bài, viết, rồi nhận điểm theo bốn tiêu chí của giám khảo.</p>
        <span className="inline-flex items-center gap-0.5 pt-3 text-sm font-medium text-blue-deep">Bắt đầu <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
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

/** App home: Task 2 as the big card on the left, vocabulary beside it, what's coming below. */
export function Dashboard() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <PageHeader />
      <main className="mx-auto w-full max-w-[1200px] pb-10 pl-4 pr-6 pt-[22px]">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
          <div className="grid md:col-span-4"><Task2Card /></div>
          <div className="grid md:col-span-2"><VocabCard /></div>
          {SOON.map((p) => <div key={p.id} className="grid md:col-span-3"><SoonCard p={p} /></div>)}
        </div>
        <footer className="pt-10"><AppCredits /></footer>
      </main>
    </div>
  );
}
