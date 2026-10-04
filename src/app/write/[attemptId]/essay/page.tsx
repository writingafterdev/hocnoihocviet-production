import type { Metadata } from 'next';
import { AttemptWorkspace } from '@/features/attempts/AttemptWorkspace';

export const metadata: Metadata = { title: 'Viết bài · hocnoihocviet' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <AttemptWorkspace attemptId={attemptId} view="essay" />;
}
