'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { WorkspaceHeader } from '@/components/shell/BrandHeader';
import { findPrompt } from '@/content/prompts';
import { ChainBuilder } from '../chainlab/ChainBuilder';
import type { OutlinePara } from '../chainlab/plan';
import { StepNav } from '../chainlab/ui/StepNav';
import { WeighScreen } from '../chainlab/WeighScreen';
import { SpecProvider } from '../chainlab/SpecContext';
import type { Chain } from '../chainlab/types';
import { ChainDesk } from '../desk/ChainDesk';
import { attemptStore, SignedOutError, type Attempt, type EssayState } from './store';

type Status = 'loading' | 'ready' | 'missing' | 'error';
type SaveState = 'saved' | 'saving' | 'failed';

const SAVE_DELAY = 1500;

/** What counts as an edit worth saving: everything except the running timer and timestamps. */
const contentKey = (a: Attempt) => JSON.stringify([a.chains, a.mapExtras, a.stance, a.plan, a.chainReview, a.essay.bodies, a.essay.drafts, a.essay.review]);

const SAVE_LABEL: Record<SaveState, string> = { saved: 'Đã lưu', saving: 'Đang lưu…', failed: 'Chưa lưu được · thử lại' };

/** One "Viết tự do" attempt: ① chains at /write/[id]/chains, ② Cân at /weigh, ③ Writing Desk at /essay. Autosaves. */
export function AttemptWorkspace({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const path = usePathname();
  const view = path.endsWith('/essay') ? 'essay' : path.endsWith('/weigh') ? 'weigh' : 'chains';
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [save, setSave] = useState<SaveState>('saved');
  const savedKey = useRef<string | null>(null);
  const latest = useRef<Attempt | null>(null);
  latest.current = attempt;

  const toLogin = () => router.replace('/login?next=' + encodeURIComponent(location.pathname));

  useEffect(() => {
    let alive = true;
    attemptStore.get(attemptId).then(
      (a) => {
        if (!alive) return;
        savedKey.current = a ? contentKey(a) : null;
        setAttempt(a); setStatus(a && findPrompt(a.promptId) ? 'ready' : 'missing');
      },
      (e) => { if (!alive) return; if (e instanceof SignedOutError) toLogin(); else setStatus('error'); },
    );
    return () => { alive = false; };
  }, [attemptId]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (a: Attempt) => {
    const key = contentKey(a);
    setSave('saving');
    attemptStore.save(a).then(
      () => { savedKey.current = key; if (latest.current && contentKey(latest.current) === key) setSave('saved'); },
      (e) => { if (e instanceof SignedOutError) toLogin(); else setSave('failed'); },
    );
  };

  // Debounced autosave whenever the content changes (the Desk timer alone doesn't trigger a save).
  const key = attempt ? contentKey(attempt) : null;
  useEffect(() => {
    if (!attempt || key === savedKey.current) return;
    const t = setTimeout(() => persist(latest.current), SAVE_DELAY);
    return () => clearTimeout(t);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on leaving the page or hiding the tab (also stores the Desk timer).
  useEffect(() => {
    const flush = () => { if (latest.current) attemptStore.save(latest.current).catch(() => {}); };
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => { flush(); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onHide); };
  }, []);

  if (status !== 'ready') {
    return (
      <div style={{ height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <WorkspaceHeader />
        {status === 'error' && (
          <main style={{ maxWidth: 520, margin: '96px auto 0', padding: '0 24px', fontFamily: 'var(--font-sans)', color: '#141413' }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 10px' }}>Chưa tải được bài viết</h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#5C5C56', margin: '0 0 24px' }}>Có thể mạng đang chập chờn. Bài của bạn vẫn được lưu trên máy chủ.</p>
            <button type="button" onClick={() => location.reload()} style={{ height: 42, padding: '0 18px', borderRadius: 10, border: 'none', background: '#141413', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Tải lại</button>
          </main>
        )}
        {status === 'missing' && (
          <main style={{ maxWidth: 520, margin: '96px auto 0', padding: '0 24px', fontFamily: 'var(--font-sans)', color: '#141413' }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 10px' }}>Không tìm thấy bài viết này</h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#5C5C56', margin: '0 0 24px' }}>Bài này không có trong tài khoản của bạn. Có thể bạn đang đăng nhập bằng một tài khoản Google khác.</p>
            <Link href="/writing" style={{ display: 'inline-flex', alignItems: 'center', height: 42, padding: '0 18px', borderRadius: 10, background: '#141413', color: '#fff', fontSize: 13.5, fontWeight: 600 }}>Về thư viện đề</Link>
          </main>
        )}
      </div>
    );
  }

  const prompt = findPrompt(attempt.promptId);
  const touch = (patch: Partial<Attempt>) => setAttempt((a) => ({ ...a, ...patch, updatedAt: Date.now() }));
  const setChains = (fn: Chain[] | ((cs: Chain[]) => Chain[])) =>
    setAttempt((a) => ({ ...a, chains: typeof fn === 'function' ? fn(a.chains) : fn, updatedAt: Date.now() }));
  const setEssay = (fn: (e: EssayState) => EssayState) => setAttempt((a) => ({ ...a, essay: fn(a.essay), updatedAt: Date.now() }));
  const base = '/write/' + attempt.id;
  const verdict = prompt.questions.some((q) => q.shape === 'verdict');
  const steps = [{ label: '① Ý', href: base + '/chains' }, { label: verdict ? '② Cân' : '② Dàn bài', href: base + '/weigh' }, { label: '③ Viết', href: base + '/essay' }];
  const nav = (k: number) => <StepNav steps={steps} current={k} />;
  /** Leaving ② for ③: the outline becomes the essay's body paragraphs; drafts of other paragraphs are kept. */
  const toEssay = (paras: OutlinePara[]) => {
    setAttempt((a) => {
      const ids = paras.map((p) => p.id);
      const kept = a.essay.bodies.filter((b) => !ids.includes(b) && (a.essay.drafts[b] || '').trim());
      return { ...a, plan: { ...(a.plan || {}), paras }, essay: { ...a.essay, bodies: [...ids, ...kept] }, updatedAt: Date.now() };
    });
    router.push(base + '/essay');
  };

  return (
    <SpecProvider value={prompt}>
      <div style={{ height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <WorkspaceHeader status={
          <button type="button" className="cl-btn" disabled={save !== 'failed'} onClick={() => persist(attempt)} aria-live="polite" style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: save === 'failed' ? '#8B3A35' : '#9A9A93', cursor: save === 'failed' ? 'pointer' : 'default' }}>{SAVE_LABEL[save === 'failed' ? 'failed' : contentKey(attempt) !== savedKey.current ? 'saving' : 'saved']}</button>
        } />
        <div style={{ flex: 1, minHeight: 0 }}>
          {view === 'chains' ? (
            <ChainBuilder
              chains={attempt.chains}
              setChains={setChains}
              extras={attempt.mapExtras}
              setExtras={(mapExtras) => touch({ mapExtras })}
              stance={attempt.stance}
              review={attempt.chainReview}
              setReview={(chainReview) => touch({ chainReview })}
              onBack={() => router.push('/writing')}
              onNext={() => router.push(base + '/weigh')}
              nav={nav(0)}
            />
          ) : view === 'weigh' ? (
            <WeighScreen
              chains={attempt.chains}
              setChains={setChains}
              extras={attempt.mapExtras}
              stance={attempt.stance}
              setStance={(stance) => touch({ stance })}
              plan={attempt.plan || {}}
              setPlan={(plan) => touch({ plan })}
              onBack={() => router.push(base + '/chains')}
              onWrite={toEssay}
              nav={nav(1)}
            />
          ) : (
            <ChainDesk chains={attempt.chains} stance={attempt.stance} essay={attempt.essay} setEssay={setEssay} plan={attempt.plan} onBack={() => router.push(base + '/weigh')} nav={nav(2)} />
          )}
        </div>
      </div>
    </SpecProvider>
  );
}
