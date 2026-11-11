import type { Metadata } from 'next';
import { ProgressPage } from '@/features/progress/ProgressPage';

export const metadata: Metadata = { title: 'Tiến độ · hocnoihocviet' };

export default function Page() {
  return <ProgressPage />;
}
