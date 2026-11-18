import type { Metadata } from 'next';
import { DrillHistory } from '@/features/prove/DrillHistory';

export const metadata: Metadata = { title: 'Mạch ý đã chứng minh · hocnoihocviet' };

export default function Page() {
  return <DrillHistory />;
}
