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
  { name: 'Ink', hex: '#171717', cls: 'bg-ink', note: 'Chữ chính' },
  { name: 'White', hex: '#FFFFFF', cls: 'bg-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]', note: 'Nền trang, nền thẻ' },
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
    <section className="border-t border-line py-10">
      <h2 className="m-0 mb-5 flex items-baseline gap-2.5 text-lg font-semibold tracking-[-0.015em]"><span className="text-xs font-medium text-ink-soft">{n}</span>{title}</h2>
      {children}
    </section>
  );
}

/** The style tile: the brand's colours, type and core components in one place, for review before the rollout. */
export function BrandTile() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <main className="mx-auto max-w-[1080px] px-6 pb-24 pt-10">
        <div className="flex items-end justify-between gap-6 pb-10">
          <div>
            <Logo />
            <h1 className="m-0 mt-8 text-[30px] font-semibold leading-tight tracking-[-0.025em]">Hệ thống nhận diện</h1>
            <p className="mb-0 mt-1.5 max-w-[56ch] text-sm leading-[1.6] text-ink-soft">Sạch và tối giản: nền trắng, đường viền mảnh, chữ Inter. Hai màu chính lấy từ tranh minh hoạ, ba màu nhấn dùng ít để dễ nhớ.</p>
          </div>
          <Illustration name="woman-brainstorming-and-choosing-ideas" className="hidden h-48 w-auto md:block" />
        </div>

        <Section n="01" title="Màu">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {PRIMARY.map((c) => (
              <div key={c.name} className="overflow-hidden rounded-xl bg-white shadow-ring">
                <div className={`${c.cls} h-20`} />
                <div className="p-3"><div className="text-sm font-medium">{c.name}</div><div className="font-mono text-[12px] text-ink-soft">{c.hex}</div><div className="mt-1 text-xs leading-snug text-ink-soft">{c.note}</div></div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-[13px] font-medium">Màu nhấn, dùng ít</span>
            {ACCENT.map((c) => <span key={c.name} className="inline-flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-[13px] shadow-ring"><span className={`${c.cls} size-5 rounded-full`} />{c.name} <span className="font-mono text-[11.5px] text-ink-soft">{c.hex}</span></span>)}
          </div>
        </Section>

        <Section n="02" title="Chữ">
          <div className="grid gap-8 md:grid-cols-3">
            <div><div className="text-xs font-medium text-ink-soft">Tiêu đề · Inter 30 / 600</div><div className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.025em]">Mỗi bài viết bắt đầu từ một mạch ý.</div></div>
            <div><div className="text-xs font-medium text-ink-soft">Giao diện · Inter 14 / 400–500</div><p className="mt-2 text-sm leading-[1.6]">Nút, nhãn, nhận xét và mọi chữ để thao tác. Rõ, gọn, đọc tốt ở cỡ nhỏ: <b>Nộp bài</b>, <b>Sửa bài</b>, <b>Kiểm tra</b>.</p></div>
            <div><div className="text-xs font-medium text-ink-soft">Bài viết của học sinh · Lora</div><p className="mt-2 font-essay text-[16px] leading-[1.75]">Cheaper flights mean that a student from a small town can spend a summer abroad for less than a month of wages.</p></div>
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
                <TabsContent value="tr" className="pt-2 text-[13.5px] text-ink-soft">Band 6: “presents a relevant position although the conclusions may become unclear”</TabsContent>
              </Tabs>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-ring">
              <div className="flex items-center gap-2"><span className="h-3.5 w-[3px] rounded bg-tomato" /><span className="text-sm font-medium">Câu này lại giúp phe kia</span><span className="ml-auto text-xs text-ink-soft">Thân bài 1</span></div>
              <p className="mb-0 mt-2 font-essay text-[14px] italic text-ink-soft">“Detention centres usually provide prisoners with free education…”</p>
              <p className="mb-0 mt-2 text-[13.5px] leading-[1.55]">Câu này khen nhà tù vì nó dạy học, tức là khen giáo dục. <b>Giám khảo sẽ không chắc bạn đang bênh phía nào.</b></p>
              <p className="mb-0 mt-2 text-[13.5px] text-leaf">Ví dụ: <i className="font-essay">Prison is the only way to keep dangerous offenders away from the public.</i></p>
            </div>
          </div>
        </Section>

        <Section n="05" title="Tranh minh hoạ">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
            {DRAWINGS.map((d, k) => (
              <div key={d} className={`grid aspect-square place-items-center rounded-xl ${['bg-blue-soft', 'bg-tomato-soft', 'bg-leaf-soft', 'bg-sun-soft', 'bg-blush-soft', 'bg-paper-2'][k]}`}>
                <Illustration name={d} className="h-[80%] w-[80%]" />
              </div>
            ))}
          </div>
          <p className="mb-0 mt-4 text-[13px] text-ink-soft">96 tranh trong <code className="font-mono">public/illustrations</code>. Đặt trên một mảng màu rất nhạt, không viền.</p>
        </Section>
      </main>
    </div>
  );
}
