'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { WorkspaceHeader } from '@/components/shell/BrandHeader';
import { findPrompt } from '@/content/prompts';
import { ChainBuilder } from '../chainlab/ChainBuilder';
import { SpecProvider } from '../chainlab/SpecContext';
import type { Chain } from '../chainlab/types';
import { ChainDesk } from '../desk/ChainDesk';
import { attemptStore, type Attempt, type EssayState } from './store';

type Status = 'loading' | 'ready' | 'missing';

const SAVE_DELAY = 400;

/** One "Viết tự do" attempt: ChainLab at /write/[id]/chains, Writing Desk at /write/[id]/essay. Autosaves. */
export function AttemptWorkspace({ attemptId, view }: { attemptId: string; view: 'chains' | 'essay' }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const loaded = useRef(false);

  useEffect(() => {
    let alive = true;
    attemptStore.get(attemptId).then((a) => {
      if (!alive) return;
      setAttempt(a); setStatus(a && findPrompt(a.promptId) ? 'ready' : 'missing');
    });
    return () => { alive = false; };
  }, [attemptId]);

  // Debounced autosave; skips the first render after loading.
  useEffect(() => {
    if (!attempt) return;
    if (!loaded.current) { loaded.current = true; return; }
    const t = setTimeout(() => attemptStore.save(attempt), SAVE_DELAY);
    return () => clearTimeout(t);
  }, [attempt]);

  // Flush pending edits when the tab is hidden or closed.
  const latest = useRef(attempt);
  latest.current = attempt;
  useEffect(() => {
    const flush = () => { if (latest.current) attemptStore.save(latest.current); };
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => { flush(); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onHide); };
  }, []);

  if (status !== 'ready') {
    return (
      <div style={{ height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <WorkspaceHeader />
        {status === 'missing' && (
          <main style={{ maxWidth: 520, margin: '96px auto 0', padding: '0 24px', fontFamily: 'var(--font-sans)', color: '#141413' }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 10px' }}>Không tìm thấy bài viết này</h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#5C5C56', margin: '0 0 24px' }}>Bài viết đang được lưu trên trình duyệt bạn dùng để tạo nó. Mở lại từ thiết bị đó, hoặc bắt đầu một bài mới.</p>
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

  return (
    <SpecProvider value={prompt}>
      <div style={{ height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <WorkspaceHeader />
        <div style={{ flex: 1, minHeight: 0 }}>
          {view === 'chains' ? (
            <ChainBuilder
              chains={attempt.chains}
              setChains={setChains}
              stance={attempt.stance}
              setStance={(stance) => touch({ stance })}
              review={attempt.chainReview}
              setReview={(chainReview) => touch({ chainReview })}
              onBack={() => router.push('/writing')}
              onWrite={() => router.push(base + '/essay')}
            />
          ) : (
            <ChainDesk chains={attempt.chains} stance={attempt.stance} essay={attempt.essay} setEssay={setEssay} onBack={() => router.push(base + '/chains')} />
          )}
        </div>
      </div>
    </SpecProvider>
  );
}
