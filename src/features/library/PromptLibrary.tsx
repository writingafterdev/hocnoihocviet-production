'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Pagination } from '@/components/base/pagination/pagination';
import { PageHeader } from '@/components/shell/BrandHeader';
import { ModePickerModal } from './ModePickerModal';
import { CATEGORIES_TASK1, CATEGORIES_TASK2, PROMPTS, TOPIC_ILLUSTRATION, TOPICS_TASK2, type Prompt, type Task } from '@/content/prompts';
import { startFreeAttempt } from '../attempts/start';

const EASE = 'cubic-bezier(.16,1,.3,1)';
const PAGE = 20;

/** 'Government & Criminal Justice' -> 'government-and-criminal-justice': the file name of the option's icon in /icons/filters. */
const iconSlug = (label: string) => label.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function Filter({ title, options, selected, onToggle }: { title: string; options: readonly string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <fieldset style={{ marginBottom: 32, border: 'none', padding: 0, minWidth: 0 }}>
      <legend style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, color: '#171717', marginBottom: 20, padding: 0 }}>{title}</legend>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {options.map((opt) => {
          const on = selected.includes(opt);
          return (
            <Checkbox key={opt} isSelected={on} onChange={() => onToggle(opt)} className="items-center">
              <span className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={'/icons/filters/' + iconSlug(opt) + '.png'} alt="" width={24} height={24} draggable={false} onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500, color: 'rgba(44,51,56,0.8)', lineHeight: 1.3 }}>{opt}</span>
              </span>
            </Checkbox>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Prompt card: image + tags at rest; on hover it crossfades to the full prompt and a "Viết bài" button. */
function PromptCard({ prompt, onWrite }: { prompt: Prompt; onWrite: () => void }) {
  const [hover, setHover] = useState(false);
  const layer = (on: boolean): React.CSSProperties => ({ transition: 'opacity .32s ' + EASE + ', transform .42s ' + EASE, opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(6px)', pointerEvents: on ? 'auto' : 'none' });
  return (
    <article onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHover(false); }} style={{ position: 'relative', display: 'grid', borderRadius: 10, background: '#fff', boxShadow: hover ? '0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)', transform: hover ? 'translateY(-2px)' : 'none', transition: 'box-shadow .35s ' + EASE + ', transform .35s ' + EASE, overflow: 'hidden', minHeight: 156 }}>
      <div aria-hidden={hover} style={{ gridArea: '1/1', display: 'flex', padding: 12, ...layer(!hover) }}>
        <div style={{ width: 136, height: 132, borderRadius: 8, background: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={'/illustrations/' + TOPIC_ILLUSTRATION[prompt.topic] + '.svg'} alt="" style={{ width: 112, height: 112, objectFit: 'contain', mixBlendMode: 'multiply' }} />
        </div>
        <div style={{ flex: 1, padding: '4px 16px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ borderRadius: 4, background: '#F5F5F5', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: '#525252' }}>{prompt.category}</span>
            <span style={{ borderRadius: 4, background: '#EDF7EA', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: '#167A59' }}>{prompt.topic}</span>
          </div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, lineHeight: 1.55, color: '#171717', margin: 0 }}>{prompt.text}</p>
        </div>
      </div>
      <div style={{ gridArea: '1/1', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px 20px', ...layer(hover) }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: '#171717', margin: 0 }}>{prompt.text}</p>
        <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 12, marginTop: 12 }}>
          {/* Still reachable by keyboard at rest; focusing it reveals this layer. */}
          <button type="button" onClick={onWrite} className="cl-primary" style={{ width: '100%', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 7, border: 'none', background: '#2F62C4', cursor: 'pointer', transition: 'opacity .2s' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, color: '#fff' }}>Viết bài</span>
          </button>
        </div>
      </div>
    </article>
  );
}

/** Thư viện đề: Task 1 / Task 2 switch, type and topic filters, prompt cards. */
export function PromptLibrary() {
  const router = useRouter();
  const [task, setTask] = useState<Task>('task2');
  const [cats, setCats] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [modalPrompt, setModalPrompt] = useState<Prompt | null>(null);
  const [page, setPage] = useState(0);
  const toggle = (arr: string[], setArr: (a: string[]) => void, v: string) => { setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]); setPage(0); };
  const filtered = PROMPTS.filter((p) => p.task === task && (cats.length === 0 || cats.includes(p.category)) && (topics.length === 0 || topics.includes(p.topic)));

  return (
    <div style={{ minHeight: '100%', background: '#FFFFFF' }}>
      <PageHeader />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 40px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 48 }}>
          <div style={{ width: 96, height: 96, borderRadius: 12, background: '#FFF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/illustrations/person-typing-essay-on-laptop-digital-writing-or-blogging.svg" style={{ width: 84, height: 84, objectFit: 'contain', mixBlendMode: 'multiply' }} alt="" />
          </div>
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: '#737373', margin: '0 0 12px' }}>Nghị luận xã hội</p>
            <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em', color: '#171717', margin: 0 }}>Thư viện đề thi</h1>
          </div>
        </div>

        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: 40 }} />

        <div className="pl-grid" style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
          <aside style={{ width: 260, flexShrink: 0 }}>
            <div style={{ marginBottom: 32 }}>
              <div id="task-label" style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, color: '#171717', marginBottom: 16 }}>Phần thi</div>
              <div role="tablist" aria-labelledby="task-label" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, borderRadius: 10, background: '#F5F5F5' }}>
                {([['task2', 'Task 2'], ['task1', 'Task 1']] as const).map(([id, label]) => {
                  // Task 1 has no prompts or writing flow yet.
                  const soon = id === 'task1';
                  return (
                    <button key={id} type="button" role="tab" aria-selected={task === id} aria-disabled={soon} disabled={soon} title={soon ? 'Task 1 sắp ra mắt' : undefined} onClick={() => { setTask(id); setCats([]); setTopics([]); setPage(0); }} style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 7, border: 'none', cursor: soon ? 'not-allowed' : 'pointer', background: task === id ? '#fff' : 'transparent', boxShadow: task === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: task === id ? '#171717' : soon ? '#B5B2A8' : '#737373' }}>
                      {label}
                      {soon && <span style={{ borderRadius: 4, background: '#ECEAE4', padding: '1px 5px', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', color: '#737373' }}>SẮP CÓ</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', marginBottom: 32 }} />
            <Filter title="Dạng đề" options={task === 'task1' ? CATEGORIES_TASK1 : CATEGORIES_TASK2} selected={cats} onToggle={(v) => toggle(cats, setCats, v)} />
            <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', marginBottom: 32 }} />
            {task === 'task2' && <Filter title="Chủ đề" options={TOPICS_TASK2} selected={topics} onToggle={(v) => toggle(topics, setTopics, v)} />}
          </aside>
          <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.length > 0 && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#737373', margin: '0 0 4px' }}>{filtered.length} đề</p>}
            {filtered.slice(page * PAGE, (page + 1) * PAGE).map((p) => <PromptCard key={p.id} prompt={p} onWrite={() => setModalPrompt(p)} />)}
            {filtered.length > PAGE && <Pagination className="mt-5" previousLabel="Trang trước" nextLabel="Trang sau" aria-label="Chọn trang" page={page + 1} totalPages={Math.ceil(filtered.length / PAGE)} onChange={(n) => { setPage(n - 1); window.scrollTo({ top: 0 }); document.querySelector('main')?.scrollTo({ top: 0 }); }} />}
            {filtered.length === 0 && (
              <div style={{ borderRadius: 10, border: '1px dashed #E5E5E5', padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#171717', margin: '0 0 6px' }}>{task === 'task1' ? 'Đề Task 1 đang được soạn' : 'Không có đề nào khớp bộ lọc'}</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#737373', margin: 0 }}>{task === 'task1' ? 'Trong lúc chờ, bạn có thể luyện từ vựng Task 1 ở trang chủ.' : 'Thử bỏ bớt một vài lựa chọn.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {modalPrompt && <ModePickerModal prompt={modalPrompt} onClose={() => setModalPrompt(null)} onStart={async (mode) => router.push(mode === 'guided' ? '/writing/' + modalPrompt.id + '/guided' : await startFreeAttempt(modalPrompt))} onResume={(id) => router.push('/write/' + id + '/chains')} />}
    </div>
  );
}
