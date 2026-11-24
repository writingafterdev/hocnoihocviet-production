'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TASK1_PROMPTS, type T1Prompt } from '@/content/task1';
import { SignedOutError } from '../attempts/store';
import { CL } from '../chainlab/constants';
import { Filter } from '../library/PromptLibrary';
import { RandomCard } from '../library/RandomCard';
import { PageHeader } from '@/components/shell/BrandHeader';
import { CATEGORIES_TASK1 } from '@/content/prompts';
import { createTask1Attempt, task1Store, type Task1Attempt } from './store';

const STEP_LABEL = { compare: '① So sánh', plan: '② Chia đoạn', write: '③ Viết bài' } as const;

/** The prompt's first chart, drawn whole inside the card's picture box (light grid, every line inside the frame). */
function Thumb({ pr, size = 84 }: { pr: T1Prompt; size?: number }) {
  const p = pr.parts[0], n = p.axis.labels.length, max = p.max || 100, pad = 10, w = 100, h = 100;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(1, n - 1), y = (v: number) => h - pad - (v / max) * (h - 2 * pad);
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox={`0 0 ${w} ${h}`} width={size - 8} height={size - 8} aria-hidden="true" style={{ overflow: 'visible' }}>
        {[0, 0.5, 1].map((t) => <line key={t} x1={pad} x2={w - pad} y1={y(t * max)} y2={y(t * max)} stroke={t ? '#E5E5E5' : '#D4D4D4'} strokeWidth="1" />)}
        {p.items.map((it) => <polyline key={it.id} fill="none" stroke={it.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={p.data[it.id].map((v, i) => (v === null ? null : x(i).toFixed(1) + ',' + y(v).toFixed(1))).filter(Boolean).join(' ')} />)}
      </svg>
    </div>
  );
}

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
  const start = async (pr: T1Prompt) => {
    if (busy) return;
    const cur = mine.filter((a) => a.promptId === pr.id).sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (cur) { router.push('/task1/' + cur.id); return; }
    setBusy(pr.id);
    const a = createTask1Attempt(pr.id);
    try { await task1Store.save(a); router.push('/task1/' + a.id); } catch (e) { if (e instanceof SignedOutError) router.replace('/login?next=/task1'); setBusy(''); }
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
              const cur = mine.filter((a) => a.promptId === pr.id).sort((a, b) => b.updatedAt - a.updatedAt)[0];
              return (
                <button key={pr.id} type="button" className="pl-card" onClick={() => start(pr)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 10, width: '100%', textAlign: 'left', font: 'inherit', color: '#171717', cursor: 'pointer', border: 'none', borderRadius: 12, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)', opacity: busy && busy !== pr.id ? 0.6 : 1 }}>
                  <Thumb pr={pr} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {tag(pr.category, '#F5F5F5', '#525252')}
                      {cur && tag(cur.review ? 'Band ' + cur.review.scores.band.toFixed(1) : 'Đang làm · ' + STEP_LABEL[cur.step], '#EEF3FC', '#2F62C4')}
                      {busy === pr.id && tag('Đang mở…', '#EEF3FC', '#2F62C4')}
                    </div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 500, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pr.text.replace(/ Summari[sz]e .*$/, '')}</p>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ borderRadius: 10, border: '1px dashed #E5E5E5', padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#171717', margin: '0 0 6px' }}>Dạng đề này đang được soạn</p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#737373', margin: 0 }}>Hiện có biểu đồ đường. Thử bỏ bớt một vài lựa chọn.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
