'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Illustration } from '@/components/brand/Illustration';
import { Badge } from '@/components/ui/badge';
import { AppCredits } from '@/components/shell/AppCredits';
import { PageHeader } from '@/components/shell/BrandHeader';
import { cn } from '@/lib/utils';

/** Task 2 is one product with two ways in: the five-minute drill, and the full writing practice. */
const TASK2_PARTS = [
  { href: '/prove', title: 'Chứng minh nhanh', tag: 'Khởi động · 5 phút', description: 'Một câu chủ đề có sẵn điểm đầu và điểm cuối. Bạn viết phần giữa, AI chỉ chỗ còn hở.', note: 'Mới' },
  { href: '/writing', title: 'Luyện viết cả bài', tag: 'Dựng mạch · viết · chấm điểm', description: 'Dựng mạch cho từng thân bài rồi viết bài. Chấm theo bốn tiêu chí của giám khảo.', note: 'Beta' },
];

const SOON = [
  { id: 'speaking', tag: 'Speaking · Part 1–3', title: 'Luyện nói', description: 'Ngắt nghỉ, nhấn âm và độ dài câu trả lời.', illustration: 'woman-answering-questions-on-a-podium', note: 'Sắp ra mắt' },
  { id: 'reading', tag: 'Reading · bài báo', title: 'Đọc báo', description: 'Bài từ The Economist, The New Yorker, The Atlantic.', illustration: 'woman-with-paper-document-thinking', note: 'Tạm đóng' },
];

const card = 'overflow-hidden rounded-xl bg-white shadow-ring';

/** Task 2: the big card. The drawing on the left, the two ways in on the right. */
function Task2Card() {
  return (
    <section className={cn(card, 'flex flex-col md:flex-row')}>
      <div className="relative grid h-56 shrink-0 place-items-center bg-tomato-soft md:h-auto md:w-64">
        <Illustration name="person-typing-essay-on-laptop-digital-writing-or-blogging" className="h-44 w-auto" />
        <Badge variant="blue" className="absolute left-3 top-3">Beta</Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-medium text-ink-soft">Writing · IELTS</span>
        <h2 className="m-0 mt-1 text-xl font-semibold tracking-[-0.02em] text-ink">Task 2</h2>
        <p className="m-0 mt-1 text-sm leading-[1.5] text-ink-soft">Từ một câu khởi động đến cả bài viết, cùng một cách nghĩ.</p>
        <div className="mt-4 divide-y divide-line rounded-lg shadow-ring">
          {TASK2_PARTS.map((p) => (
            <Link key={p.href} href={p.href} className="group flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-paper-2 focus-visible:bg-paper-2 focus-visible:outline-none">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{p.title}</span>
                  {p.note === 'Mới' && <Badge variant="tomato">Mới</Badge>}
                </div>
                <div className="text-xs font-medium text-ink-soft">{p.tag}</div>
                <div className="mt-1 text-[13px] leading-[1.5] text-ink-soft">{p.description}</div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Vocabulary stays a card of its own. */
function VocabCard() {
  return (
    <Link href="/vocab" className={cn(card, 'group flex flex-col transition-shadow duration-150 hover:shadow-ring-hover focus-visible:shadow-[0_0_0_2px_var(--brand-blue-deep)] focus-visible:outline-none')}>
      <div className="relative grid h-44 place-items-center bg-leaf-soft">
        <Illustration name="person-studying-different-sciences" className="h-36 w-auto transition-transform duration-300 group-hover:scale-[1.03]" />
        <Badge variant="blue" className="absolute left-3 top-3">Beta</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-3.5">
        <span className="text-xs font-medium text-ink-soft">Từ vựng · theo chủ đề</span>
        <h2 className="m-0 text-base font-semibold tracking-[-0.015em] text-ink">Từ vựng</h2>
        <p className="m-0 text-sm leading-[1.5] text-ink-soft">Cụm từ cho Task 1, Task 2 và Speaking, kèm đoạn văn để luyện dùng ngay.</p>
        <span className="mt-auto inline-flex items-center gap-0.5 pt-2.5 text-[13px] font-medium text-blue-deep">Bắt đầu <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
      </div>
    </Link>
  );
}

/** Something not open yet: a wide, quiet card with the drawing on the left. */
function SoonCard({ p }: { p: (typeof SOON)[number] }) {
  return (
    <div aria-disabled="true" className={cn(card, 'flex')}>
      <div className="grid w-40 shrink-0 place-items-center bg-paper-2">
        <Illustration name={p.illustration} className="h-28 w-auto opacity-60 grayscale" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-4 py-4">
        <span className="text-xs font-medium text-ink-soft">{p.tag}</span>
        <h2 className="m-0 text-base font-semibold tracking-[-0.015em] text-ink">{p.title}</h2>
        <p className="m-0 text-sm leading-[1.5] text-ink-soft">{p.description}</p>
        <Badge variant="secondary" className="mt-auto">{p.note}</Badge>
      </div>
    </div>
  );
}

/** App home: Task 2 as the big card on the left, vocabulary beside it, what's coming below. */
export function Dashboard() {
  return (
    <div className="min-h-screen bg-white pb-20 text-ink">
      <PageHeader />
      <main className="mx-auto max-w-[1040px] px-6">
        <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-6">
          <div className="grid md:col-span-4"><Task2Card /></div>
          <div className="grid md:col-span-2"><VocabCard /></div>
          {SOON.map((p) => <div key={p.id} className="grid md:col-span-3"><SoonCard p={p} /></div>)}
        </div>
        <footer className="pt-16"><AppCredits /></footer>
      </main>
    </div>
  );
}
