'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TASK1_PROMPTS, type T1Prompt } from '@/content/task1';
import { SignedOutError } from '../attempts/store';
import { CL } from '../chainlab/constants';
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

/** Task 1 library (admins only while it is being built): the prompts, and the attempts in progress. */
export function Task1Library() {
  const router = useRouter();
  const [open, setOpen] = useState<boolean | null>(null);
  const [mine, setMine] = useState<Task1Attempt[]>([]);
  const [busy, setBusy] = useState('');
  useEffect(() => {
    task1Store.access().then((ok) => { setOpen(ok); if (ok) task1Store.list().then(setMine, (e) => { if (e instanceof SignedOutError) router.replace('/login?next=/task1'); }); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const start = async (pr: T1Prompt) => {
    setBusy(pr.id);
    const a = createTask1Attempt(pr.id);
    try { await task1Store.save(a); router.push('/task1/' + a.id); } catch (e) { if (e instanceof SignedOutError) router.replace('/login?next=/task1'); setBusy(''); }
  };
  if (open === null) return null;
  if (!open) return <main style={{ maxWidth: 520, margin: '96px auto 0', padding: '0 24px' }}><h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 10px' }}>Task 1 đang được soạn</h1><p style={{ fontSize: 14.5, color: CL.ink6, margin: 0 }}>Trong lúc chờ, bạn có thể luyện từ vựng Task 1 ở trang Từ vựng.</p></main>;
  const cardStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, padding: 10, width: '100%', textAlign: 'left', font: 'inherit', color: CL.ink, cursor: 'pointer', border: 'none', borderRadius: 12, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)' };
  const tag = (t: string, bg = '#F5F5F5', fg = '#525252') => <span style={{ borderRadius: 4, background: bg, padding: '2px 7px', fontSize: 11.5, fontWeight: 600, color: fg }}>{t}</span>;
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 64px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Thư viện đề Task 1</h1>
        <p style={{ margin: 0, fontSize: 14, color: CL.ink5 }}>Bản thử, chỉ quản trị viên thấy. Hiện có biểu đồ đường.</p>
      </div>
      {mine.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Bài đang làm</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 12 }}>
            {mine.map((a) => { const pr = TASK1_PROMPTS.find((p) => p.id === a.promptId); return pr && (
              <button key={a.id} type="button" className="pl-card" onClick={() => router.push('/task1/' + a.id)} style={cardStyle}>
                <Thumb pr={pr} size={64} />
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ display: 'flex', gap: 6 }}>{tag(a.review ? 'Band ' + a.review.scores.band.toFixed(1) : STEP_LABEL[a.step], '#EEF3FC', '#2F62C4')}{tag(a.found.length + ' điểm nổi bật')}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.5 }}>{pr.title}</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#2F62C4', paddingRight: 6 }}>Tiếp tục</span>
              </button>
            ); })}
          </div>
        </section>
      )}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Đề</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 12 }}>
          {TASK1_PROMPTS.map((pr) => (
            <button key={pr.id} type="button" className="pl-card" disabled={!!busy} onClick={() => start(pr)} style={{ ...cardStyle, opacity: busy && busy !== pr.id ? 0.6 : 1 }}>
              <Thumb pr={pr} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{tag(pr.category)}{busy === pr.id && tag('Đang mở…', '#EEF3FC', '#2F62C4')}</span>
                <span style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pr.text.replace(/ Summari[sz]e .*$/, '')}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
