'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TASK1_PROMPTS, type T1Prompt } from '@/content/task1';
import { SignedOutError } from '../attempts/store';
import { CL } from '../chainlab/constants';
import { Filter } from '../library/PromptLibrary';
import { RandomCard } from '../library/RandomCard';
import { ModePickerDialog } from '../library/ModePickerModal';
import { PageHeader } from '@/components/shell/BrandHeader';
import { CATEGORIES_TASK1 } from '@/content/prompts';
import { startTask1, task1Store, type Task1Attempt } from './store';
import { Thumb } from './Thumb';

const STEP_LABEL = { compare: '① So sánh', plan: '② Chia đoạn', write: '③ Viết bài' } as const;
const shortText = (pr: T1Prompt) => pr.text.replace(/ Summari[sz]e .*$/, '');

/** Viết có hướng dẫn in Task 1: find the key features on the chart, group them into paragraphs, write sentence by sentence. */
const SketchGuided1 = (
  <span aria-hidden="true" style={{ height: 88, boxSizing: 'border-box', borderRadius: 10, border: '1px solid #E5E5E5', background: '#FAFAFA', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ flex: 1, height: 60, boxSizing: 'border-box', borderRadius: 6, background: '#fff', border: '1px solid #DCE7F7', padding: 6, display: 'flex' }}>
      <svg viewBox="0 0 40 30" width="100%" height="100%" preserveAspectRatio="none"><polyline points="2,24 12,18 22,20 38,6" fill="none" stroke="#2F62C4" strokeWidth="2" strokeLinejoin="round" /><polyline points="2,12 12,16 22,22 38,24" fill="none" stroke="#FF5C33" strokeWidth="2" strokeLinejoin="round" /></svg>
    </span>
    <span style={{ width: 10, height: 1, background: '#D4D4D4', flexShrink: 0 }} />
    <span style={{ flex: 1, height: 60, boxSizing: 'border-box', borderRadius: 6, background: '#fff', border: '1px solid #EBEBEB', padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {['#DCE7F7', '#F5F5F5', '#F5F5F5'].map((bg, i) => <span key={i} style={{ flex: 1, borderRadius: 3, background: bg, display: 'flex', alignItems: 'center', padding: '0 4px' }}><span style={{ height: 3, width: i ? '55%' : '75%', borderRadius: 2, background: i ? '#D4D4D4' : '#77A1DD' }} /></span>)}
    </span>
    <span style={{ width: 10, height: 1, background: '#D4D4D4', flexShrink: 0 }} />
    <span style={{ flex: 1, height: 60, boxSizing: 'border-box', borderRadius: 6, background: '#F7F9FD', border: '1px solid #DCE7F7', padding: 7, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ height: 4, width: '90%', borderRadius: 2, background: '#BFD0EC' }} />
      <span style={{ height: 4, width: '70%', borderRadius: 2, background: '#BFD0EC' }} />
      <span style={{ marginTop: 'auto', height: 12, boxSizing: 'border-box', borderRadius: 3, background: '#fff', border: '1px solid #77A1DD' }} />
    </span>
  </span>
);

/** Thư viện đề Task 1 (admins only while it is being built), laid out like Task 2's: header, Dạng đề filter, one card per row. A prompt with an attempt in progress opens that attempt. */
export function Task1Library() {
  const router = useRouter();
  const [open, setOpen] = useState<boolean | null>(null);
  const [mine, setMine] = useState<Task1Attempt[]>([]);
  const [busy, setBusy] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  useEffect(() => {
    task1Store.access().then((ok) => { setOpen(ok); if (ok) task1Store.list().then(setMine, (e) => { if (e instanceof SignedOutError) router.replace('/login?next=/task1'); }); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [picking, setPicking] = useState<T1Prompt | null>(null);
  const latestOf = (pr: T1Prompt) => mine.filter((a) => a.promptId === pr.id).sort((a, b) => b.updatedAt - a.updatedAt)[0];
  // Clicking a prompt opens the start popup (Tự viết or Viết có hướng dẫn, or carry on with the attempt in progress), like Task 2.
  const start = (pr: T1Prompt) => { if (!busy) setPicking(pr); };
  const create = async (pr: T1Prompt, mode: 'guided' | 'free') => {
    setBusy(pr.id);
    try { router.push(await startTask1(pr.id, mode)); } catch (e) { if (e instanceof SignedOutError) router.replace('/login?next=/task1'); setBusy(''); setPicking(null); }
  };
  if (open === null) return null;
  if (!open) return <main style={{ maxWidth: 520, margin: '96px auto 0', padding: '0 24px' }}><h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 10px' }}>Task 1 đang được soạn</h1><p style={{ fontSize: 14.5, color: CL.ink6, margin: 0 }}>Trong lúc chờ, bạn có thể luyện từ vựng Task 1 ở trang Từ vựng.</p></main>;
  const filtered = TASK1_PROMPTS.filter((p) => !cats.length || cats.includes(p.category));
  const tag = (t: string, bg: string, fg: string) => <span style={{ borderRadius: 4, background: bg, padding: '2px 7px', fontSize: 11.5, fontWeight: 600, color: fg }}>{t}</span>;
  const randomize = () => { if (filtered.length) start(filtered[Math.floor(Math.random() * filtered.length)]); };
  return (
    <div style={{ minHeight: '100%', background: '#FFFFFF' }}>
      <PageHeader />
      <div style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>
          <div style={{ width: 96, height: 96, borderRadius: 12, background: '#EEF3FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/hands-holding-different-charts.svg" style={{ width: 84, height: 84, objectFit: 'contain', mixBlendMode: 'multiply' }} alt="" />
          </div>
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: '#737373', margin: '0 0 12px' }}>Mô tả biểu đồ</p>
            <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em', color: '#171717', margin: 0 }}>Thư viện đề thi</h1>
          </div>
        </div>
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: 24 }} />
        <div className="pl-grid" style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
          <aside className="cl-scroll" style={{ width: 260, flexShrink: 0, position: 'sticky', top: 24, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 104px)', overflowY: 'auto' }}>
            <Filter title="Dạng đề" options={CATEGORIES_TASK1} selected={cats} onToggle={(v) => setCats((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]))} />
          </aside>
          <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.length > 0 && (
              <>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#737373', margin: '0 0 4px' }}>{filtered.length} đề</p>
                <RandomCard label="Đề ngẫu nhiên" sub="Để mình chọn một đề cho bạn, theo bộ lọc đang chọn." onClick={randomize} disabled={!!busy} />
              </>
            )}
            {filtered.map((pr) => {
              const cur = latestOf(pr);
              return (
                <button key={pr.id} type="button" className="pl-card" onClick={() => start(pr)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 10, width: '100%', textAlign: 'left', font: 'inherit', color: '#171717', cursor: 'pointer', border: 'none', borderRadius: 12, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)', opacity: busy && busy !== pr.id ? 0.6 : 1 }}>
                  <Thumb pr={pr} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {tag(pr.category, '#F5F5F5', '#525252')}
                      {cur && tag(cur.review ? 'Band ' + cur.review.scores.band.toFixed(1) : 'Đang làm · ' + (cur.mode === 'free' ? 'Tự viết' : STEP_LABEL[cur.step]), '#EEF3FC', '#2F62C4')}
                      {busy === pr.id && tag('Đang mở…', '#EEF3FC', '#2F62C4')}
                    </div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{shortText(pr)}</p>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ borderRadius: 10, border: '1px dashed #E5E5E5', padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#171717', margin: '0 0 6px' }}>Dạng đề này đang được soạn</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#737373', margin: 0 }}>Hiện có biểu đồ đường và biểu đồ cột. Thử bỏ bớt một vài lựa chọn.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {picking && (() => {
        const cur = latestOf(picking), open = cur && !cur.review ? cur : null;
        return <ModePickerDialog text={shortText(picking)} sketches={{ guided: SketchGuided1 }} onClose={() => setPicking(null)} onStart={(m) => create(picking, m)}
          last={open ? { mode: open.mode || 'guided', updatedAt: open.updatedAt, resume: () => router.push('/task1/' + open.id) } : null} />;
      })()}
    </div>
  );
}
