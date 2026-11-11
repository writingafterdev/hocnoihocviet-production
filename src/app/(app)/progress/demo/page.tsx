import type { Metadata } from 'next';
import { ProgressDemo } from '@/features/progress/ProgressDemo';

export const metadata: Metadata = { title: 'Tiến độ (dữ liệu mẫu) · hocnoihocviet' };

export default function Page() {
  return <ProgressDemo />;
}
