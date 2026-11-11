'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Illustration } from '@/components/brand/Illustration';
import { Badge } from '@/components/ui/badge';
import { AppCredits } from '@/components/shell/AppCredits';
import { cn } from '@/lib/utils';

const SOON = [
  { id: 'speaking', tag: 'Speaking · Part 1–3', title: 'Luyện nói', description: 'Ngắt nghỉ, nhấn âm và độ dài câu trả lời.', illustration: 'woman-answering-questions-on-a-podium', note: 'Sắp ra mắt', tint: 'bg-blue-soft' },
  { id: 'reading', tag: 'Reading · bài báo', title: 'Đọc báo', description: 'Bài từ The Economist, The New Yorker, The Atlantic.', illustration: 'woman-with-paper-document-thinking', note: 'Tạm đóng', tint: 'bg-blush-soft' },
];

const card = 'overflow-hidden rounded-xl bg-white shadow-ring';
const focusRing = 'focus-visible:shadow-[0_0_0_2px_var(--brand-blue-deep)] focus-visible:outline-none';
/** The same call to action on every card: a real button look (it is a span, the whole card is the link). */
const Cta = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn('bg-button-primary inline-flex h-9 w-fit items-center gap-1 rounded-[10px] px-4 text-sm font-medium text-white shadow-xs', className)}>
    {children}<ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
  </span>
);

/** Task 2: the lead card. Words and the button sit together, centred beside the drawing, on one tint. */
function Task2Card() {
  return (
    <Link href="/writing" className={cn('group relative flex h-full min-h-[400px] flex-col overflow-hidden rounded-xl bg-tomato-soft shadow-ring t-card-hover hover:shadow-ring-hover md:flex-row', focusRing)}>
      <div className="relative z-10 flex flex-col justify-center gap-3 p-10 md:w-[46%]">
        <Badge variant="blue" className="w-fit bg-white">Beta</Badge>
        <span className="mt-1 text-xs font-medium text-ink-soft">Writing · IELTS</span>
        <h2 className="m-0 whitespace-nowrap text-[clamp(40px,3.4vw,60px)] font-semibold leading-none tracking-[-0.03em] text-ink">Task 2</h2>
        <p className="m-0 max-w-[38ch] text-base leading-[1.6] text-ink/75">Từ một câu khởi động đến cả bài viết: dựng mạch cho từng thân bài, viết, rồi nhận điểm theo bốn tiêu chí của giám khảo.</p>
        <Cta className="mt-3">Bắt đầu</Cta>
      </div>
      <div className="relative min-h-64 flex-1">
        <Illustration name="person-typing-essay-on-laptop-digital-writing-or-blogging" className="absolute inset-0 m-auto h-[86%] w-[90%] transition-transform duration-[var(--duration-slow)] ease-[var(--ease-smooth-out)] group-hover:scale-[1.03]" />
      </div>
    </Link>
  );
}

/** Vocabulary: the same tint-all-over treatment (leaf), stacked because the card is narrower. */
function VocabCard() {
  return (
    <Link href="/vocab" className={cn('group flex h-full min-h-[400px] flex-col overflow-hidden rounded-xl bg-leaf-soft shadow-ring t-card-hover hover:shadow-ring-hover', focusRing)}>
      <div className="relative grid flex-1 place-items-center px-6 pt-6">
        <Illustration name="person-studying-different-sciences" className="h-[min(15rem,34vh)] w-auto transition-transform duration-[var(--duration-slow)] ease-[var(--ease-smooth-out)] group-hover:scale-[1.03]" />
        <Badge variant="blue" className="absolute left-4 top-4 bg-white">Beta</Badge>
      </div>
      <div className="flex flex-col gap-2 p-6 pt-4">
        <span className="text-xs font-medium text-ink-soft">Từ vựng · theo chủ đề</span>
        <h2 className="m-0 text-2xl font-semibold tracking-[-0.02em] text-ink">Từ vựng</h2>
        <p className="m-0 text-[15px] leading-[1.55] text-ink/70">Cụm từ cho Task 1, Task 2 và Speaking, kèm đoạn văn để luyện dùng ngay.</p>
        <Cta className="mt-2">Bắt đầu</Cta>
      </div>
    </Link>
  );
}

/** Something not open yet: a slim card in colour (not greyed out), with the drawing on the left and a small status chip. */
function SoonCard({ p }: { p: (typeof SOON)[number] }) {
  return (
    <div aria-disabled="true" className={cn('flex h-full min-h-[190px] overflow-hidden rounded-xl shadow-ring', p.tint)}>
      <div className="grid w-44 shrink-0 place-items-center">
        <Illustration name={p.illustration} className="h-36 w-auto" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.5 py-5 pr-6">
        <span className="text-xs font-medium text-ink-soft">{p.tag}</span>
        <h2 className="m-0 text-lg font-semibold tracking-[-0.02em] text-ink">{p.title}</h2>
        <p className="m-0 text-sm leading-[1.5] text-ink/70">{p.description}</p>
        <Badge variant="secondary" className="mt-1.5 w-fit bg-white">{p.note}</Badge>
      </div>
    </div>
  );
}

/** App home: Task 2 as the big card on the left, vocabulary beside it, what's coming below; centred in the page. */
export function Dashboard() {
  return (
    <div className="relative flex min-h-full flex-col bg-white text-ink">
      {/* The grid alone is centred, so the space above and below it is equal; the credit sits inside the bottom margin. */}
      <div className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col px-8 pb-6 pt-8">
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-[minmax(400px,1fr)_auto]">
          <div className="grid md:col-span-4"><Task2Card /></div>
          <div className="grid md:col-span-2"><VocabCard /></div>
          {SOON.map((p) => <div key={p.id} className="grid md:col-span-3"><SoonCard p={p} /></div>)}
        </div>
      </div>
      <footer className="shrink-0 pb-4"><AppCredits /></footer>
    </div>
  );
}
