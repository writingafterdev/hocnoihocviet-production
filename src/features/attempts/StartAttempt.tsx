'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { WorkspaceHeader } from '@/components/shell/BrandHeader';
import { findPrompt } from '@/content/prompts';
import { startFreeAttempt } from './start';

export function StartAttempt({ promptId }: { promptId: string }) {
  const router = useRouter();
  useEffect(() => {
    let alive = true;
    startFreeAttempt(findPrompt(promptId)).then((url) => { if (alive) router.replace(url); });
    return () => { alive = false; };
  }, [promptId, router]);
  return <div style={{ height: '100vh', background: '#fff' }}><WorkspaceHeader /></div>;
}
