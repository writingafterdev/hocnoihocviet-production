import type { Metadata } from 'next';
import { Task1Library } from '@/features/task1/Task1Library';

export const metadata: Metadata = { title: 'Task 1 · hocnoihocviet', robots: { index: false, follow: false } };

export default function Page() {
  return <Task1Library />;
}
