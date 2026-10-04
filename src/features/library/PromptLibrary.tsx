'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { PageHeader } from '@/components/shell/BrandHeader';
import { ModePickerModal } from './ModePickerModal';
import { CATEGORIES_TASK1, CATEGORIES_TASK2, PROMPTS, TOPIC_ILLUSTRATION, TOPICS_TASK2, type Prompt, type Task } from '@/content/prompts';
import { CL_CIRC, CL_SHAPE_LABEL } from '../chainlab/constants';
import { startFreeAttempt } from '../attempts/start';

const EASE = 'cubic-bezier(.16,1,.3,1)';
const PAGE = 20;

/** "① Nguyên nhân · ② Giải pháp" */
const questionTypes = (p: Prompt) => p.questions.map((x) => (p.questions.length > 1 ? CL_CIRC[x.n - 1] + ' ' : '') + CL_SHAPE_LABEL[x.shape]).join(' · ');

function Filter({ title, options, selected, onToggle }: { title: string; options: readonly string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <fieldset style={{ marginBottom: 32, border: 'none', padding: 0, minWidth: 0 }}>
      <legend style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, color: '#141413', marginBottom: 20, padding: 0 }}>{title}</legend>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {options.map((opt) => {
          const on = selected.includes(opt);
          return (
            <label key={opt} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={on} onChange={() => onToggle(opt)} style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
              <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: 6, border: '1.5px solid rgba(44,51,56,0.2)', background: on ? '#2c3338' : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                {on && <Check size={12} strokeWidth={3} />}
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500, color: 'rgba(44,51,56,0.8)', lineHeight: 1.3 }}>{opt}</span>
            </label>
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
    <article onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHover(false); }} style={{ position: 'relative', display: 'grid', borderRadius: 14, background: '#fff', boxShadow: hover ? '0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)', transform: hover ? 'translateY(-2px)' : 'none', transition: 'box-shadow .35s ' + EASE + ', transform .35s ' + EASE, overflow: 'hidden', minHeight: 156 }}>
      <div aria-hidden={hover} style={{ gridArea: '1/1', display: 'flex', padding: 12, ...layer(!hover) }}>
        <div style={{ width: 136, height: 132, borderRadius: 7, background: '#FFF6DA', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={'/assets/illustrations/' + TOPIC_ILLUSTRATION[prompt.topic] + '.svg'} alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, padding: '4px 16px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ borderRadius: 4, background: '#F4F4F2', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5C5C56' }}>{prompt.category}</span>
            <span style={{ borderRadius: 4, background: '#DCF5EC', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#167A59' }}>{prompt.topic}</span>
          </div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, lineHeight: 1.55, color: '#141413', margin: 0 }}>{prompt.text}</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, color: '#77776F', margin: '10px 0 0' }}>{questionTypes(prompt)}</p>
        </div>
      </div>
      <div style={{ gridArea: '1/1', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px 20px', ...layer(hover) }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: '#141413', margin: 0 }}>{prompt.text}</p>
        <div style={{ borderTop: '1px solid #ECECEA', paddingTop: 12, marginTop: 12 }}>
          {/* Still reachable by keyboard at rest; focusing it reveals this layer. */}
          <button type="button" onClick={onWrite} className="cl-primary" style={{ width: '100%', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 7, border: '1px solid #141413', background: '#141413', cursor: 'pointer', transition: 'opacity .2s' }}>
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
  const [shown, setShown] = useState(PAGE);
  const toggle = (arr: string[], setArr: (a: string[]) => void, v: string) => { setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]); setShown(PAGE); };
  const filtered = PROMPTS.filter((p) => p.task === task && (cats.length === 0 || cats.includes(p.category)) && (topics.length === 0 || topics.includes(p.topic)));

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <PageHeader avatar={false} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 32px 96px' }}>
        <Link href="/home" style={{ display: 'inline-block', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: '#857F70', marginBottom: 40 }}>← Trang chủ</Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 48 }}>
          <div style={{ width: 80, height: 80, borderRadius: 18, background: '#FFE17B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/assets/illustrations/il-study.svg" style={{ width: 40, height: 40, objectFit: 'contain' }} alt="" />
          </div>
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#857F70', margin: '0 0 12px' }}>Nghị luận xã hội</p>
            <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em', color: '#141413', margin: '0 0 8px' }}>Thư viện đề thi</h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'rgba(133,127,112,0.8)', maxWidth: 560, lineHeight: 1.6, margin: 0 }}>Chọn một đề bài để luyện tập. Chúng mình sẽ mô phỏng lại cấu trúc lập luận của bạn và chỉ ra chính xác lỗ hổng trong logic.</p>
          </div>
        </div>

        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: 40 }} />

        <div className="pl-grid" style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
          <aside style={{ width: 260, flexShrink: 0 }}>
            <div style={{ marginBottom: 32 }}>
              <div id="task-label" style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, color: '#141413', marginBottom: 16 }}>Phần thi</div>
              <div role="tablist" aria-labelledby="task-label" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, borderRadius: 10, background: '#F4F4F2' }}>
                {([['task2', 'Task 2'], ['task1', 'Task 1']] as const).map(([id, label]) => (
                  <button key={id} type="button" role="tab" aria-selected={task === id} onClick={() => { setTask(id); setCats([]); setTopics([]); setShown(PAGE); }} style={{ height: 36, borderRadius: 7, border: 'none', cursor: 'pointer', background: task === id ? '#fff' : 'transparent', boxShadow: task === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: task === id ? '#141413' : '#857F70' }}>{label}</button>
                ))}
              </div>
            </div>
            <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', marginBottom: 32 }} />
            <Filter title="Dạng đề" options={task === 'task1' ? CATEGORIES_TASK1 : CATEGORIES_TASK2} selected={cats} onToggle={(v) => toggle(cats, setCats, v)} />
            <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', marginBottom: 32 }} />
            {task === 'task2' && <Filter title="Chủ đề" options={TOPICS_TASK2} selected={topics} onToggle={(v) => toggle(topics, setTopics, v)} />}
          </aside>
          <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.length > 0 && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#857F70', margin: '0 0 4px' }}>{filtered.length} đề</p>}
            {filtered.slice(0, shown).map((p) => <PromptCard key={p.id} prompt={p} onWrite={() => setModalPrompt(p)} />)}
            {filtered.length > shown && (
              <button type="button" onClick={() => setShown(shown + PAGE)} className="pl-card" style={{ alignSelf: 'center', marginTop: 12, height: 42, padding: '0 20px', borderRadius: 10, border: '1px solid #E6E4DE', background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#141413' }}>Xem thêm {Math.min(PAGE, filtered.length - shown)} đề</button>
            )}
            {filtered.length === 0 && (
              <div style={{ borderRadius: 14, border: '1px dashed #DAD8D2', padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#141413', margin: '0 0 6px' }}>{task === 'task1' ? 'Đề Task 1 đang được soạn' : 'Không có đề nào khớp bộ lọc'}</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#857F70', margin: 0 }}>{task === 'task1' ? 'Trong lúc chờ, bạn có thể luyện từ vựng Task 1 ở trang chủ.' : 'Thử bỏ bớt một vài lựa chọn.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {modalPrompt && <ModePickerModal prompt={modalPrompt} onClose={() => setModalPrompt(null)} onStart={async (mode) => router.push(mode === 'guided' ? '/writing/' + modalPrompt.id + '/guided' : await startFreeAttempt(modalPrompt))} onResume={(id) => router.push('/write/' + id + '/chains')} />}
    </div>
  );
}
