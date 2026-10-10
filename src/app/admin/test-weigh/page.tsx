import type { Metadata } from 'next';
import { TestWeighPage } from '@/features/admin/TestWeighPage';

export const metadata: Metadata = { title: 'Bài thử màn ② · hocnoihocviet', robots: { index: false, follow: false } };

export default function Page() {
  return <TestWeighPage />;
}
