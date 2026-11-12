'use client';

import Link from 'next/link';
import { Illustration } from '@/components/brand/Illustration';
import { AppCredits } from '@/components/shell/AppCredits';
import { cn } from '@/lib/utils';

type Item = { href?: string; tag: string; title: string; description: string; skills: string[]; status: string; tone: 'blue' | 'grey'; tint: string; ink: string; art: string };

const ITEMS: Item[] = [
  { href: '/writing', tag: 'Writing · IELTS', title: 'Task 2', description: 'Từ một lập luận ngắn đến cả bài viết: chứng minh nhanh, dựng mạch, viết rồi nhận điểm theo bốn tiêu chí.', skills: ['Chứng minh nhanh', 'Dựng mạch', 'Chép mẫu', 'Chấm điểm'], status: 'Beta', tone: 'blue', tint: 'bg-tomato-soft', ink: 'text-[#B33A1A]', art: 'person-typing-essay-on-laptop-digital-writing-or-blogging' },
  { href: '/vocab', tag: 'Từ vựng · theo chủ đề', title: 'Từ vựng', description: 'Cụm từ cho Task 1, Task 2 và Speaking, kèm đoạn văn để luyện dùng ngay.', skills: ['Task 1', 'Task 2', 'Speaking'], status: 'Beta', tone: 'blue', tint: 'bg-leaf-soft', ink: 'text-[#2D6A1F]', art: 'person-studying-different-sciences' },
  { tag: 'Speaking · Part 1–3', title: 'Luyện nói', description: 'Ngắt nghỉ, nhấn âm và độ dài câu trả lời.', skills: ['Phát âm', 'Trôi chảy'], status: 'Sắp ra mắt', tone: 'grey', tint: 'bg-sun-soft', ink: 'text-[#7A5A00]', art: 'woman-answering-questions-on-a-podium' },
  { tag: 'Reading · bài báo', title: 'Đọc báo', description: 'Bài từ The Economist, The New Yorker, The Atlantic.', skills: ['Đọc hiểu', 'Từ vựng'], status: 'Tạm đóng', tone: 'grey', tint: 'bg-blush-soft', ink: 'text-[#A3325E]', art: 'woman-with-paper-document-thinking' },
];

const focusRing = 'focus-visible:shadow-[0_0_0_2px_var(--brand-blue-deep)] focus-visible:outline-none';

/** Every card the same: a meta line with the status on the right, the title, one line, then skill chips. */
function Card({ p: item }: { p: Item }) {
  const off = !item.href;
  const p = off ? { ...item, tint: 'bg-neutral-100', ink: 'text-ink-soft' } : item;
  const body = (
    <>
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className={cn('text-[13px] font-medium', p.ink)}>{p.tag}</span>
          <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', p.tone === 'blue' ? 'bg-blue-soft text-blue-deep' : 'bg-neutral-100 text-ink-soft')}>{p.status}</span>
        </div>
        <h2 className="m-0 mt-2 text-lg font-semibold tracking-[-0.01em] text-ink">{p.title}</h2>
        <p className="m-0 mt-1 text-sm leading-[1.5] text-ink/70">{p.description}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {p.skills.map((k) => <span key={k} className={cn('rounded-lg px-2.5 py-1 text-[13px] font-medium', p.tint, p.ink)}>{k}</span>)}
        </div>
      </div>
      <div className={cn('grid w-40 shrink-0 place-items-center', p.tint)}>
        <Illustration name={p.art} className={cn('h-32 w-auto', off && 'grayscale opacity-60')} />
      </div>
    </>
  );
  const cls = 'group flex min-h-[188px] overflow-hidden rounded-xl bg-white shadow-ring';
  return p.href
    ? <Link href={p.href} className={cn(cls, 'hover:shadow-ring-hover', focusRing)}>{body}</Link>
    : <div aria-disabled="true" className={cn(cls, 'cursor-not-allowed bg-neutral-50 opacity-70')}>{body}</div>;
}

/** App home: the same card for everything, two to a row. */
export function Dashboard() {
  return (
    <div className="relative flex min-h-full flex-col bg-white text-ink">
      <div className="mx-auto w-full max-w-[1560px] flex-1 px-8 pb-4 pt-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ITEMS.map((p) => <Card key={p.title} p={p} />)}
        </div>
      </div>
      <footer className="shrink-0 pb-4"><AppCredits /></footer>
    </div>
  );
}
