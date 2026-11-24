import type { Metadata } from 'next';
import { Task1Workspace } from '@/features/task1/Task1Workspace';

export const metadata: Metadata = { title: 'Luyện viết Task 1 · hocnoihocviet', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <Task1Workspace attemptId={attemptId} />;
}
