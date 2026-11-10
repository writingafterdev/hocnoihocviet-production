'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Illustration } from '@/components/brand/Illustration';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shell/BrandHeader';
import { cn } from '@/lib/utils';

type Tint = 'blue' | 'tomato' | 'leaf' | 'blush' | 'paper';

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
  wide?: boolean;
}

const TINT: Record<Tint, string> = {
  blue: 'bg-blue-soft',
  tomato: 'bg-tomato-soft',
  leaf: 'bg-leaf-soft',
  blush: 'bg-blush-soft',
  paper: 'bg-paper-2',
};

// Speaking and Reading are switched off for now.
const LIVE: Product[] = [
  { id: 'prove', href: '/prove', tag: 'Khởi động · 5 phút', title: 'Chứng minh nhanh', description: 'Một câu chủ đề có sẵn điểm đầu và điểm cuối. Bạn viết phần giữa, AI chỉ chỗ còn hở.', illustration: 'man-sitting-on-question-mark-and-thinking', tint: 'blue', note: { text: 'Mới', variant: 'tomato' } },
  { id: 'writing', href: '/writing', tag: 'Writing · Task 2', title: 'Luyện viết Task 2', description: 'Dựng mạch cho từng thân bài rồi viết bài. Chấm theo bốn tiêu chí của giám khảo.', illustration: 'person-typing-essay-on-laptop-digital-writing-or-blogging', tint: 'tomato', note: { text: 'Beta', variant: 'blue' } },
  { id: 'vocab', href: '/vocab', tag: 'Từ vựng · theo chủ đề', title: 'Từ vựng', description: 'Cụm từ cho Task 1, Task 2 và Speaking, kèm đoạn văn để luyện dùng ngay.', illustration: 'person-studying-different-sciences', tint: 'leaf', note: { text: 'Beta', variant: 'blue' } },
];
const SOON: Product[] = [
  { id: 'speaking', tag: 'Speaking · Part 1–3', title: 'Luyện nói', description: 'Ngắt nghỉ, nhấn âm và độ dài câu trả lời.', illustration: 'woman-answering-questions-on-a-podium', tint: 'paper', note: { text: 'Sắp ra mắt', variant: 'secondary' }, wide: true },
  { id: 'reading', tag: 'Reading · bài báo', title: 'Đọc báo', description: 'Bài từ The Economist, The New Yorker, The Atlantic.', illustration: 'woman-with-paper-document-thinking', tint: 'paper', note: { text: 'Tạm đóng', variant: 'secondary' }, wide: true },
];

/** A product: the drawing on a tinted panel, then what it is and a way in. The whole card is the link. */
function ProductTile({ p }: { p: Product }) {
  const off = !p.href;
  const body = (
    <>
      <div className={cn('relative grid place-items-center overflow-hidden rounded-t-[17px] border-b-[1.5px]', off ? 'border-line' : 'border-ink', TINT[p.tint], p.wide ? 'h-36 md:h-auto md:w-56 md:shrink-0 md:rounded-l-[17px] md:rounded-tr-none md:border-b-0 md:border-r-[1.5px]' : 'h-48')}>
        <Illustration name={p.illustration} className={cn(p.wide ? 'h-32 w-auto transition-transform duration-300 md:h-40' : 'h-40 w-auto transition-transform duration-300', off ? 'opacity-60 grayscale' : 'group-hover:scale-[1.04]')} />
        {p.note && <Badge variant={p.note.variant} className="absolute left-3 top-3">{p.note.text}</Badge>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="font-ui text-[12.5px] font-medium text-ink-soft">{p.tag}</span>
        <h2 className="m-0 font-display text-[27px] font-medium leading-[1.1] tracking-[-0.015em] text-ink">{p.title}</h2>
        <p className="m-0 font-ui text-[14px] leading-[1.55] text-ink-soft">{p.description}</p>
        {!off && (
          <span className="mt-auto inline-flex items-center gap-1.5 pt-3 font-ui text-[13.5px] font-semibold text-ink">
            Bắt đầu <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </>
  );
  const frame = cn(
    'group flex overflow-hidden rounded-[18px] border-[1.5px] bg-card text-left',
    p.wide ? 'flex-col md:flex-row' : 'flex-col',
    off ? 'border-dashed border-line' : 'border-ink transition-[transform,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-ink focus-visible:-translate-y-0.5 focus-visible:shadow-ink focus-visible:outline-none',
  );
  return off ? <div aria-disabled="true" className={frame}>{body}</div> : <Link href={p.href} className={frame}>{body}</Link>;
}

/** App home: a greeting with a drawing, the three things to do now, then what's coming. */
export function Dashboard() {
  return (
    <div className="min-h-screen bg-paper pb-20 text-ink">
      <PageHeader />
      <main className="mx-auto max-w-[1080px] px-6">
        <section className="flex items-end justify-between gap-6 border-b-[1.5px] border-ink pb-8 pt-4">
          <div>
            <h1 className="m-0 font-display text-[52px] font-normal leading-[0.98] tracking-[-0.03em] md:text-[64px]">
              Chào bạn,<br /><em className="text-tomato-deep">hôm nay</em> học gì?
            </h1>
            <p className="mb-0 mt-4 max-w-[34ch] font-ui text-[15px] leading-[1.6] text-ink-soft">Chọn một việc nhỏ. Mười lăm phút đều đặn tốt hơn ba tiếng một lần.</p>
          </div>
          <Illustration name="student-walking-with-thought-bubble-backpack" className="hidden h-44 w-auto shrink-0 md:block" />
        </section>

        <h2 className="mb-4 mt-10 font-ui text-[13px] font-semibold text-ink">Luyện ngay</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {LIVE.map((p) => <ProductTile key={p.id} p={p} />)}
        </div>

        <h2 className="mb-4 mt-12 font-ui text-[13px] font-semibold text-ink-soft">Sắp có</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {SOON.map((p) => <ProductTile key={p.id} p={p} />)}
        </div>
      </main>
    </div>
  );
}
