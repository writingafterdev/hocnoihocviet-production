'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLayoutEffect, useRef, useState } from 'react';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Pagination } from '@/components/base/pagination/pagination';
import { RiShuffleLine } from '@remixicon/react';
import { PageHeader } from '@/components/shell/BrandHeader';
import { sfx } from '@/lib/sfx';
import { ModePickerModal } from './ModePickerModal';
import { CATEGORIES_TASK1, CATEGORIES_TASK2, PROMPTS, TOPIC_ILLUSTRATION, TOPICS_TASK2, type Prompt, type Task } from '@/content/prompts';
import { startFreeAttempt } from '../attempts/start';
import { SAMPLE_IDS } from '@/content/samples';

const EASE = 'cubic-bezier(.16,1,.3,1)';
const PAGE = 20;


const ROLL_MS = 2200;
const ROW_H = 156;
const shuffle = <T,>(xs: T[]) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** A prompt as the library shows it at rest: the topic's drawing, the two tags and the text. Shared by the cards and the random reel. */
function PromptFace({ prompt }: { prompt: Prompt }) {
  return (
    <div style={{ display: 'flex', padding: 12 }}>
      <div style={{ width: 136, height: 132, borderRadius: 8, background: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={'/illustrations/' + TOPIC_ILLUSTRATION[prompt.topic] + '.svg'} alt="" style={{ width: 112, height: 112, objectFit: 'contain', mixBlendMode: 'multiply' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: '4px 16px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ borderRadius: 4, background: '#F5F5F5', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: '#525252' }}>{prompt.category}</span>
          <span style={{ borderRadius: 4, background: '#EDF7EA', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: '#167A59' }}>{prompt.topic}</span>
        </div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, lineHeight: 1.55, color: '#171717', margin: 0, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prompt.text}</p>
      </div>
    </div>
  );
}

/** "Đề ngẫu nhiên": prompt cards spin past in a window, slow down and settle on the chosen one, then `onDone` opens it. */
function RandomReel({ target, others, onDone }: { target: Prompt; others: Prompt[]; onDone: () => void }) {
  const reelRef = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState(false);
  const items = [...others, target];
  useLayoutEffect(() => {
    const el = reelRef.current;
    if (!el) return;
    const dist = ROW_H * (items.length - 1);
    sfx.roll(ROLL_MS);
    const a = el.animate([
      { transform: 'translateY(0)', filter: 'blur(0px)' },
      { transform: 'translateY(' + -dist * 0.2 + 'px)', filter: 'blur(1.6px)', offset: 0.25 },
      { transform: 'translateY(' + -dist * 0.85 + 'px)', filter: 'blur(1px)', offset: 0.72 },
      { transform: 'translateY(' + -dist + 'px)', filter: 'blur(0px)' },
    ], { duration: ROLL_MS, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    a.onfinish = () => { setLanded(true); sfx.pop(); setTimeout(onDone, 650); };
    return () => a.cancel();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeContent: 'center', gap: 12, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', padding: 24 }}>
      <span style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: '#737373' }}>{landed ? 'Đề của bạn' : 'Đang chọn đề…'}</span>
      <div className="co-rise" style={{ width: 'min(860px, calc(100vw - 48px))', height: ROW_H, overflow: 'hidden', borderRadius: 12, background: '#fff', boxShadow: landed ? '0 0 0 2px var(--brand-blue-deep), 0 8px 24px rgba(0,0,0,0.08)' : '0 0 0 1px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)', transition: 'box-shadow var(--duration-medium) var(--ease-smooth-out)' }}>
        <div ref={reelRef} style={{ willChange: 'transform' }}>
          {items.map((it, k) => <div key={k} style={{ height: ROW_H, overflow: 'hidden' }}><PromptFace prompt={it} /></div>)}
        </div>
      </div>
    </div>
  );
}

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

/** Prompt card: the picture, the tags and the prompt, with its button in the card. No hover effect. */
function PromptCard({ prompt, onWrite, label = 'Viết bài' }: { prompt: Prompt; onWrite: () => void; label?: string }) {
  return (
    <article style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 10, borderRadius: 12, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)' }}>
      <div style={{ width: 84, height: 84, borderRadius: 8, background: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={'/illustrations/' + TOPIC_ILLUSTRATION[prompt.topic] + '.svg'} alt="" style={{ width: 70, height: 70, objectFit: 'contain', mixBlendMode: 'multiply' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ borderRadius: 4, background: '#F5F5F5', padding: '2px 7px', fontSize: 11.5, fontWeight: 600, color: '#525252' }}>{prompt.category}</span>
          <span style={{ borderRadius: 4, background: '#EDF7EA', padding: '2px 7px', fontSize: 11.5, fontWeight: 600, color: '#167A59' }}>{prompt.topic}</span>
        </div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500, lineHeight: 1.5, color: '#171717', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prompt.text}</p>
      </div>
      <button type="button" onClick={onWrite} className="cl-primary" style={{ flexShrink: 0, height: 34, padding: '0 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: '#fff' }}>{label}</button>
    </article>
  );
}

/** Thư viện đề: Task 1 / Task 2 switch, type and topic filters, prompt cards. */
export function PromptLibrary({ mode = 'write' }: { mode?: 'write' | 'copy' }) {
  const router = useRouter();
  const task = 'task2' as Task; // Task 1 has its own (greyed) place in the sidebar for now
  const [cats, setCats] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [modalPrompt, setModalPrompt] = useState<Prompt | null>(null);
  const [page, setPage] = useState(0);
  const [reel, setReel] = useState<{ target: Prompt; others: Prompt[] } | null>(null);
  const toggle = (arr: string[], setArr: (a: string[]) => void, v: string) => { setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]); setPage(0); };
  const filtered = PROMPTS.filter((p) => p.task === task && (mode === 'write' || SAMPLE_IDS.has(p.id)) && (cats.length === 0 || cats.includes(p.category)) && (topics.length === 0 || topics.includes(p.topic)));

  /** Writing opens the start dialog; copying goes straight into the sample. */
  const pick = (p: Prompt) => { if (mode === 'copy') router.push('/copy/' + p.id); else setModalPrompt(p); };
  const randomize = () => {
    if (reel) return;
    const target = filtered[Math.floor(Math.random() * filtered.length)];
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || PROMPTS.length < 3) { pick(target); return; }
    setReel({ target, others: shuffle(PROMPTS.filter((p) => p.task === target.task && p.id !== target.id)).slice(0, 9) });
  };
  const pager = (className: string) => <Pagination className={className} previousLabel="Trang trước" nextLabel="Trang sau" aria-label="Chọn trang" page={page + 1} totalPages={Math.ceil(filtered.length / PAGE)} onChange={(n) => { setPage(n - 1); window.scrollTo({ top: 0 }); document.querySelector('main')?.scrollTo({ top: 0 }); }} />;

  return (
    <div style={{ minHeight: '100%', background: '#FFFFFF' }}>
      <PageHeader />
      <div style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 32px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>
          <div style={{ width: 96, height: 96, borderRadius: 12, background: '#FFF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/illustrations/person-typing-essay-on-laptop-digital-writing-or-blogging.svg" style={{ width: 84, height: 84, objectFit: 'contain', mixBlendMode: 'multiply' }} alt="" />
          </div>
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: '#737373', margin: '0 0 12px' }}>Nghị luận xã hội</p>
            <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em', color: '#171717', margin: 0 }}>{mode === 'copy' ? 'Chép mẫu' : 'Thư viện đề thi'}</h1>
          </div>
        </div>

        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: 24 }} />

        <div className="pl-grid" style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
          <aside className="cl-scroll" style={{ width: 260, flexShrink: 0, position: 'sticky', top: 24, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 104px)', overflowY: 'auto' }}>
            <Filter title="Dạng đề" options={task === 'task1' ? CATEGORIES_TASK1 : CATEGORIES_TASK2} selected={cats} onToggle={(v) => toggle(cats, setCats, v)} />
            <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', marginBottom: 32 }} />
            {task === 'task2' && <Filter title="Chủ đề" options={TOPICS_TASK2} selected={topics} onToggle={(v) => toggle(topics, setTopics, v)} />}
          </aside>
          <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.length > 0 && (
              <>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#737373', margin: '0 0 4px' }}>{filtered.length} đề</p>
                {filtered.length > PAGE && pager('mb-1')}
                {/* The random pick is a small card of its own, in the same style as the prompts below it. */}
                <button type="button" onClick={randomize} disabled={!!reel} className="pl-card t-card-hover" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, textAlign: 'left', fontFamily: 'var(--font-sans)', color: '#171717', background: '#fff', border: 'none', cursor: 'pointer', borderRadius: 12, boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: 136, height: 72, borderRadius: 8, background: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/illustrations/scuba-diver-opening-treasure-chest-of-opportunities.svg" alt="" style={{ width: 64, height: 64, objectFit: 'contain', mixBlendMode: 'multiply' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>Đề ngẫu nhiên</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#737373', lineHeight: 1.4 }}>Để mình chọn một đề cho bạn, theo bộ lọc đang chọn.</p>
                  </div>
                  <RiShuffleLine size={20} style={{ flexShrink: 0, marginRight: 8, color: '#525252' }} />
                </button>
              </>
            )}
            {filtered.slice(page * PAGE, (page + 1) * PAGE).map((p) => <PromptCard key={p.id} prompt={p} label={mode === 'copy' ? 'Chép mẫu' : 'Viết bài'} onWrite={() => pick(p)} />)}
            {filtered.length > PAGE && pager('mt-5')}
            {filtered.length === 0 && (
              <div style={{ borderRadius: 10, border: '1px dashed #E5E5E5', padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#171717', margin: '0 0 6px' }}>{task === 'task1' ? 'Đề Task 1 đang được soạn' : 'Không có đề nào khớp bộ lọc'}</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#737373', margin: 0 }}>{task === 'task1' ? 'Trong lúc chờ, bạn có thể luyện từ vựng Task 1 ở trang chủ.' : 'Thử bỏ bớt một vài lựa chọn.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {reel && <RandomReel target={reel.target} others={reel.others} onDone={() => { pick(reel.target); setReel(null); }} />}
      {modalPrompt && <ModePickerModal prompt={modalPrompt} only="free" onClose={() => setModalPrompt(null)} onStart={async () => router.push(await startFreeAttempt(modalPrompt))} onResume={(id) => router.push('/write/' + id + '/chains')} />}
    </div>
  );
}
