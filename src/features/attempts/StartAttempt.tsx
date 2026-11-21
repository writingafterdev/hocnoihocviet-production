'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { WorkspaceHeader } from '@/components/shell/BrandHeader';
import { findPrompt } from '@/content/prompts';
import { startAttempt } from './start';

export function StartAttempt({ promptId }: { promptId: string }) {
  const router = useRouter();
  useEffect(() => {
    let alive = true;
    startAttempt(findPrompt(promptId), 'free').then((url) => { if (alive) router.replace(url); });
    return () => { alive = false; };
  }, [promptId, router]);
  return <div style={{ height: '100%', background: '#fff' }}><WorkspaceHeader /></div>;
}
