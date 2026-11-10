'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Illustration } from '@/components/brand/Illustration';
import { Badge } from '@/components/ui/badge';
import { AppCredits } from '@/components/shell/AppCredits';
import { PageHeader } from '@/components/shell/BrandHeader';
import { cn } from '@/lib/utils';

type Tint = 'blue' | 'tomato' | 'leaf' | 'neutral';

interface Product {
  id: string;
  href?: string;
  tag: string;
  title: string;
  description: string;
  illustration: string;
  tint: Tint;
  /** A short note on the card: new, beta, coming soon. */
  note?: { text: string; variant: 'tomato' | 'blue' | 'secondary' };
}

const TINT: Record<Tint, string> = { blue: 'bg-blue-soft', tomato: 'bg-tomato-soft', leaf: 'bg-leaf-soft', neutral: 'bg-paper-2' };

// Speaking and Reading are switched off for now.
const LIVE: Product[] = [
  { id: 'prove', href: '/prove', tag: 'Khởi động · 5 phút', title: 'Chứng minh nhanh', description: 'Một câu chủ đề có sẵn điểm đầu và điểm cuối. Bạn viết phần giữa, AI chỉ chỗ còn hở.', illustration: 'man-sitting-on-question-mark-and-thinking', tint: 'blue', note: { text: 'Mới', variant: 'tomato' } },
  { id: 'writing', href: '/writing', tag: 'Writing · Task 2', title: 'Luyện viết Task 2', description: 'Dựng mạch cho từng thân bài rồi viết bài. Chấm theo bốn tiêu chí của giám khảo.', illustration: 'person-typing-essay-on-laptop-digital-writing-or-blogging', tint: 'tomato', note: { text: 'Beta', variant: 'blue' } },
  { id: 'vocab', href: '/vocab', tag: 'Từ vựng · theo chủ đề', title: 'Từ vựng', description: 'Cụm từ cho Task 1, Task 2 và Speaking, kèm đoạn văn để luyện dùng ngay.', illustration: 'person-studying-different-sciences', tint: 'leaf', note: { text: 'Beta', variant: 'blue' } },
];
const SOON: Product[] = [
  { id: 'speaking', tag: 'Speaking · Part 1–3', title: 'Luyện nói', description: 'Ngắt nghỉ, nhấn âm và độ dài câu trả lời.', illustration: 'woman-answering-questions-on-a-podium', tint: 'neutral', note: { text: 'Sắp ra mắt', variant: 'secondary' } },
  { id: 'reading', tag: 'Reading · bài báo', title: 'Đọc báo', description: 'Bài từ The Economist, The New Yorker, The Atlantic.', illustration: 'woman-with-paper-document-thinking', tint: 'neutral', note: { text: 'Tạm đóng', variant: 'secondary' } },
];

/** A product you can open now: the drawing on a soft panel, then what it is. The whole card is the link. */
function ProductCard({ p }: { p: Product }) {
  return (
    <Link href={p.href} className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-ring transition-shadow duration-150 hover:shadow-ring-hover focus-visible:shadow-[0_0_0_2px_var(--brand-blue-deep)] focus-visible:outline-none">
      <div className={cn('relative grid h-44 place-items-center', TINT[p.tint])}>
        <Illustration name={p.illustration} className="h-36 w-auto transition-transform duration-300 group-hover:scale-[1.03]" />
        {p.note && <Badge variant={p.note.variant} className="absolute left-3 top-3">{p.note.text}</Badge>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-4 pb-4 pt-3.5">
        <span className="text-xs font-medium text-ink-soft">{p.tag}</span>
        <h2 className="m-0 text-base font-semibold tracking-[-0.015em] text-ink">{p.title}</h2>
        <p className="m-0 text-sm leading-[1.5] text-ink-soft">{p.description}</p>
        <span className="mt-auto inline-flex items-center gap-0.5 pt-2.5 text-[13px] font-medium text-blue-deep">
          Bắt đầu <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/** Something not open yet: a wide, quiet card with the drawing on the left. */
function SoonCard({ p }: { p: Product }) {
  return (
    <div aria-disabled="true" className="flex overflow-hidden rounded-xl bg-white shadow-ring">
      <div className={cn('relative grid w-40 shrink-0 place-items-center', TINT[p.tint])}>
        <Illustration name={p.illustration} className="h-28 w-auto opacity-60 grayscale" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-4 py-4">
        <span className="text-xs font-medium text-ink-soft">{p.tag}</span>
        <h2 className="m-0 text-base font-semibold tracking-[-0.015em] text-ink">{p.title}</h2>
        <p className="m-0 text-sm leading-[1.5] text-ink-soft">{p.description}</p>
        {p.note && <Badge variant={p.note.variant} className="mt-auto">{p.note.text}</Badge>}
      </div>
    </div>
  );
}

/** App home: a bento grid, the three things to do now on top, then what's coming. */
export function Dashboard() {
  return (
    <div className="min-h-screen bg-white pb-20 text-ink">
      <PageHeader />
      <main className="mx-auto max-w-[1040px] px-6">
        <div className="grid grid-cols-1 gap-4 pt-8 md:grid-cols-6">
          {LIVE.map((p) => <div key={p.id} className="grid md:col-span-2"><ProductCard p={p} /></div>)}
          {SOON.map((p) => <div key={p.id} className="grid md:col-span-3"><SoonCard p={p} /></div>)}
        </div>
        <footer className="pt-16"><AppCredits /></footer>
      </main>
    </div>
  );
}
