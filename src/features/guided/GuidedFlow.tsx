'use client';

import { useRouter } from 'next/navigation';
import { WorkspaceHeader } from '@/components/shell/BrandHeader';
import { GuidedWriting } from './GuidedWriting';

/**
 * Chép mẫu route shell. MOCK: every prompt opens the one tagged sample essay;
 * in production, pick from the tagged samples for this prompt.
 */
export function GuidedFlow() {
  const router = useRouter();
  return (
    <div style={{ height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <WorkspaceHeader />
      <div style={{ flex: 1, minHeight: 0 }}><GuidedWriting onBack={() => router.push('/writing')} /></div>
    </div>
  );
}
