import type { Metadata } from 'next';
import { AttemptHistory } from '@/features/attempts/AttemptHistory';

export const metadata: Metadata = { title: 'Bài đã viết · hocnoihocviet' };

export default function Page() {
  return <AttemptHistory />;
}
