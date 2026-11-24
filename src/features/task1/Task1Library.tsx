'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TASK1_PROMPTS, type T1Prompt } from '@/content/task1';
import { SignedOutError } from '../attempts/store';
import { CL } from '../chainlab/constants';
import { createTask1Attempt, task1Store, type Task1Attempt } from './store';

const STEP_LABEL = { compare: '① So sánh', plan: '② Chia đoạn', write: '③ Viết bài' } as const;

/** A small drawing of the prompt's first chart. */
function Spark({ pr }: { pr: T1Prompt }) {
  const p = pr.parts[0], n = p.axis.labels.length, max = p.max || 100;
  return (
    <svg viewBox="0 0 120 50" width="120" height="50" aria-hidden="true">
      {p.items.map((it) => <polyline key={it.id} fill="none" stroke={it.color} strokeWidth="2" strokeLinejoin="round" points={p.data[it.id].map((v, i) => (v === null ? null : (4 + (i * 112) / Math.max(1, n - 1)).toFixed(1) + ',' + (46 - (v / max) * 42).toFixed(1))).filter(Boolean).join(' ')} />)}
    </svg>
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
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 64px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Task 1 · Thư viện đề</h1>
        <p style={{ margin: 0, fontSize: 14, color: CL.ink5 }}>Bản thử, chỉ quản trị viên thấy. Hiện có biểu đồ đường.</p>
      </div>
      {mine.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Bài đang làm</span>
          {mine.map((a) => { const pr = TASK1_PROMPTS.find((p) => p.id === a.promptId); return pr && (
            <button key={a.id} type="button" className="cl-btn" onClick={() => router.push('/task1/' + a.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{pr.title}</span>
              <span style={{ fontSize: 12, color: CL.ink5 }}>{a.review ? 'Band ' + a.review.scores.band.toFixed(1) : STEP_LABEL[a.step]} · {a.found.length} điểm nổi bật</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2F62C4' }}>Tiếp tục</span>
            </button>
          ); })}
        </section>
      )}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {TASK1_PROMPTS.map((pr) => (
          <article key={pr.id} style={{ borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ borderRadius: 6, padding: '2px 8px', background: '#EEF3FC', color: '#2F62C4', fontSize: 12, fontWeight: 500 }}>{pr.category}</span>
              <span style={{ marginLeft: 'auto' }}><Spark pr={pr} /></span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>{pr.title}</span>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: CL.ink6 }}>{pr.text.replace(/ Summari[sz]e .*$/, '')}</p>
            <button type="button" className="cl-btn cl-primary" disabled={!!busy} onClick={() => start(pr)} style={{ alignSelf: 'flex-start', height: 36, borderRadius: 10, border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 500, padding: '0 14px', cursor: 'pointer' }}>{busy === pr.id ? 'Đang mở…' : 'Luyện đề này'}</button>
          </article>
        ))}
      </section>
    </main>
  );
}
