import type { Metadata } from 'next';
import { VocabPage } from '@/features/vocab/VocabPage';

export const metadata: Metadata = { title: 'Từ vựng · hocnoihocviet' };

export default function Page() {
  return <VocabPage />;
}
