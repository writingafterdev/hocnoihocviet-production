import type { Metadata } from 'next';
import { AttemptWorkspace } from '@/features/attempts/AttemptWorkspace';

export const metadata: Metadata = { title: 'Viết tự do · hocnoihocviet' };
export const dynamic = 'force-dynamic';

/**
 * The workspace lives in the layout so it stays mounted when moving between /chains, /weigh and /essay:
 * one copy of the attempt in memory, no reload between screens.
 */
export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <><AttemptWorkspace attemptId={attemptId} />{children}</>;
}
