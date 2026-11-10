'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { Illustration } from '@/components/brand/Illustration';
import { Logo } from '@/components/brand/Logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const PRIMARY = [
  { name: 'Ink', hex: '#1E1D19', cls: 'bg-ink', note: 'Chữ, đường viền, nút chính' },
  { name: 'Paper', hex: '#F5F2EB', cls: 'bg-paper', note: 'Nền trang' },
  { name: 'Blue', hex: '#77A1DD', cls: 'bg-blue', note: 'Màu chính 1 · tin cậy, mạch ý' },
  { name: 'Tomato', hex: '#FF5C33', cls: 'bg-tomato', note: 'Màu chính 2 · hành động, chỗ cần sửa' },
];
const ACCENT = [
  { name: 'Sun', hex: '#FFC73C', cls: 'bg-sun' },
  { name: 'Leaf', hex: '#2D881A', cls: 'bg-leaf' },
  { name: 'Blush', hex: '#FFA0C1', cls: 'bg-blush' },
];
const DRAWINGS = ['man-sitting-on-question-mark-and-thinking', 'person-typing-essay-on-laptop-digital-writing-or-blogging', 'finishing-tasks-on-checklist-task-completion-or-productivity-concept', 'woman-brainstorming-and-choosing-ideas', 'person-with-archery-bow-hitting-bullseye', 'student-walking-with-thought-bubble-backpack'];

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t-[1.5px] border-ink py-10">
      <h2 className="m-0 mb-6 flex items-baseline gap-3 font-display text-[28px] font-normal tracking-[-0.02em]"><span className="font-ui text-[13px] font-semibold text-tomato-deep">{n}</span>{title}</h2>
      {children}
    </section>
  );
}

/** The style tile: the brand's colours, type and core components in one place, for review before the rollout. */
export function BrandTile() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <main className="mx-auto max-w-[1080px] px-6 pb-24 pt-10">
        <div className="flex items-end justify-between gap-6 pb-10">
          <div>
            <Logo />
            <h1 className="m-0 mt-8 font-display text-[64px] font-normal leading-[0.95] tracking-[-0.035em]">Hệ thống <em className="text-tomato-deep">nhận diện</em></h1>
            <p className="mb-0 mt-4 max-w-[52ch] font-ui text-[15px] leading-[1.6] text-ink-soft">Nét mực dày và mảng màu phẳng như trong tranh minh hoạ. Hai màu chính, ba màu nhấn để dễ nhớ, mọi thứ đặt trên nền giấy.</p>
          </div>
          <Illustration name="woman-brainstorming-and-choosing-ideas" className="hidden h-48 w-auto md:block" />
        </div>

        <Section n="01" title="Màu">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {PRIMARY.map((c) => (
              <div key={c.name} className="overflow-hidden rounded-[16px] border-[1.5px] border-ink bg-card">
                <div className={`${c.cls} h-24 border-b-[1.5px] border-ink`} />
                <div className="p-3"><div className="font-ui text-[14px] font-semibold">{c.name}</div><div className="font-mono text-[12px] text-ink-soft">{c.hex}</div><div className="mt-1 font-ui text-[12px] leading-snug text-ink-soft">{c.note}</div></div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-ui text-[13px] font-semibold">Màu nhấn, dùng ít</span>
            {ACCENT.map((c) => <span key={c.name} className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-card py-1 pl-1 pr-3 font-ui text-[13px]"><span className={`${c.cls} size-5 rounded-full border-[1.5px] border-ink`} />{c.name} <span className="font-mono text-[11.5px] text-ink-soft">{c.hex}</span></span>)}
          </div>
        </Section>

        <Section n="02" title="Chữ">
          <div className="grid gap-8 md:grid-cols-3">
            <div><div className="font-ui text-[12px] font-semibold text-ink-soft">Tiêu đề · Newsreader</div><div className="mt-2 font-display text-[44px] leading-none tracking-[-0.03em]">Mỗi bài viết bắt đầu từ <em>một mạch ý.</em></div></div>
            <div><div className="font-ui text-[12px] font-semibold text-ink-soft">Giao diện · Be Vietnam Pro</div><p className="mt-2 font-ui text-[15px] leading-[1.6]">Nút, nhãn, nhận xét và mọi chữ để thao tác. Rõ, gọn, đọc tốt ở cỡ nhỏ: <b>Nộp bài</b>, <b>Sửa bài</b>, <b>Kiểm tra</b>.</p></div>
            <div><div className="font-ui text-[12px] font-semibold text-ink-soft">Bài viết · Lora</div><p className="mt-2 font-essay text-[16px] leading-[1.75]">Cheaper flights mean that a student from a small town can spend a summer abroad for less than a month of wages.</p></div>
          </div>
        </Section>

        <Section n="03" title="Nút và nhãn">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Nộp bài</Button>
            <Button variant="tomato">Sửa bài <ArrowRight /></Button>
            <Button variant="blue"><Sparkles /> Gợi ý</Button>
            <Button variant="outline">Xem trước / sau</Button>
            <Button variant="ghost">Huỷ</Button>
            <Button disabled>Đang chấm…</Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge variant="tomato">Mới</Badge><Badge variant="blue">Beta</Badge><Badge variant="secondary">Sắp ra mắt</Badge>
            <Badge variant="tomato">TR 6</Badge><Badge variant="blue">CC 7</Badge><Badge variant="leaf">LR 8</Badge><Badge variant="blush">GRA 7</Badge>
            <Badge variant="outline">Thân bài 1</Badge>
          </div>
        </Section>

        <Section n="04" title="Ô nhập và thẻ">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <Input placeholder="Tìm một đề…" />
              <Textarea placeholder="Viết bước tiếp theo của bạn…" className="min-h-28" />
              <Tabs defaultValue="tr">
                <TabsList><TabsTrigger value="tr">TR · 6</TabsTrigger><TabsTrigger value="cc">CC · 7</TabsTrigger><TabsTrigger value="lr">LR · 8</TabsTrigger><TabsTrigger value="gra">GRA · 7</TabsTrigger></TabsList>
                <TabsContent value="tr" className="pt-2 font-ui text-[13.5px] text-ink-soft">Band 6: “presents a relevant position although the conclusions may become unclear”</TabsContent>
              </Tabs>
            </div>
            <div className="rounded-[18px] border-[1.5px] border-ink bg-card p-5 shadow-ink">
              <div className="flex items-center gap-2"><span className="h-3.5 w-1 rounded bg-tomato" /><span className="font-ui text-[14px] font-semibold">Câu này lại giúp phe kia</span><span className="ml-auto font-ui text-[12px] text-ink-soft">Thân bài 1</span></div>
              <p className="mb-0 mt-2 font-essay text-[14px] italic text-ink-soft">“Detention centres usually provide prisoners with free education…”</p>
              <p className="mb-0 mt-2 font-ui text-[13.5px] leading-[1.55]">Câu này khen nhà tù vì nó dạy học, tức là khen giáo dục. <b>Giám khảo sẽ không chắc bạn đang bênh phía nào.</b></p>
              <p className="mb-0 mt-2 font-ui text-[13.5px] text-leaf">Ví dụ: <i className="font-essay">Prison is the only way to keep dangerous offenders away from the public.</i></p>
            </div>
          </div>
        </Section>

        <Section n="05" title="Tranh minh hoạ">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
            {DRAWINGS.map((d, k) => (
              <div key={d} className={`grid aspect-square place-items-center rounded-[16px] border-[1.5px] border-ink ${['bg-blue-soft', 'bg-tomato-soft', 'bg-leaf-soft', 'bg-sun-soft', 'bg-blush-soft', 'bg-paper-2'][k]}`}>
                <Illustration name={d} className="h-[80%] w-[80%]" />
              </div>
            ))}
          </div>
          <p className="mb-0 mt-4 font-ui text-[13px] text-ink-soft">96 tranh trong <code className="font-mono">public/illustrations</code>. Đặt trên một mảng màu nhạt, có viền mực; không đặt trong hộp trắng.</p>
        </Section>
      </main>
    </div>
  );
}
