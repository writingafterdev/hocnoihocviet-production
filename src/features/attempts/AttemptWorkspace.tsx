'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { WorkspaceHeader } from '@/components/shell/BrandHeader';
import { findPrompt } from '@/content/prompts';
import { StepNav } from '../chainlab/ui/StepNav';
import type { Chain } from '../chainlab/types';
import { backLinkStyle, ClIcon } from '../chainlab/ui/primitives';
import type { CheckResult } from '../coach/useCoach';
import { BuildScreen } from '../essay/BuildScreen';
import { WriteScreen } from '../essay/WriteScreen';
import { attemptStore, SignedOutError, type Attempt, type EssayState } from './store';

type Status = 'loading' | 'ready' | 'missing' | 'error';
type SaveState = 'saved' | 'saving' | 'failed';

const SAVE_DELAY = 1500;

/** What counts as an edit worth saving: everything except the running timer and timestamps. */
const contentKey = (a: Attempt) => JSON.stringify([a.chains, a.checks, a.essay.bodies, a.essay.drafts, a.essay.review, a.essay.fixing]);

const SAVE_LABEL: Record<SaveState, string> = { saved: 'Đã lưu', saving: 'Đang lưu…', failed: 'Chưa lưu được · thử lại' };

/** One "Tự viết" attempt: ① Dựng mạch at /write/[id]/chains, ② Viết bài at /essay. Autosaves. */
export function AttemptWorkspace({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const path = usePathname();
  const view = path.endsWith('/essay') ? 'essay' : 'chains';
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
  // Body paragraphs follow the chains: same ids, same order.
  const setChains = (fn: (cs: Chain[]) => Chain[]) =>
    setAttempt((a) => { const chains = fn(a.chains); return { ...a, chains, essay: { ...a.essay, bodies: chains.map((c) => c.id) }, updatedAt: Date.now() }; });
  const setCheck = (id: string, r: CheckResult | null) =>
    setAttempt((a) => { const checks = { ...(a.checks || {}) }; if (r) checks[id] = r; else delete checks[id]; return { ...a, checks, updatedAt: Date.now() }; });
  const setEssay = (fn: (e: EssayState) => EssayState) => setAttempt((a) => ({ ...a, essay: fn(a.essay), updatedAt: Date.now() }));
  const base = '/write/' + attempt.id;
  const steps = [{ label: '① Dựng mạch', href: base + '/chains' }, { label: '② Viết bài', href: base + '/essay' }];
  const left = (back: string, label: string, k: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <Link href={back} className="cl-link" style={backLinkStyle}><ClIcon name="left" size={14} />{label}</Link>
      <StepNav steps={steps} current={k} />
    </div>
  );

  return (
    <div style={{ height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <WorkspaceHeader status={
        <button type="button" className="cl-btn" disabled={save !== 'failed'} onClick={() => persist(attempt)} aria-live="polite" style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: save === 'failed' ? '#8B3A35' : '#9A9A93', cursor: save === 'failed' ? 'pointer' : 'default' }}>{SAVE_LABEL[save === 'failed' ? 'failed' : contentKey(attempt) !== savedKey.current ? 'saving' : 'saved']}</button>
      } />
      <div style={{ flex: 1, minHeight: 0 }}>
        {view === 'chains' ? (
          <BuildScreen prompt={prompt} chains={attempt.chains} setChains={setChains} checks={attempt.checks || {}} setCheck={setCheck}
            toolbarLeft={left('/writing', 'Thư viện đề', 0)} onNext={() => router.push(base + '/essay')} />
        ) : (
          <WriteScreen prompt={prompt} chains={attempt.chains} setChains={setChains} essay={attempt.essay} setEssay={setEssay}
            toolbarLeft={left(base + '/chains', 'Dựng mạch', 1)} />
        )}
      </div>
    </div>
  );
}
