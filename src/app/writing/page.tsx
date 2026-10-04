import type { Metadata } from 'next';
import { PromptLibrary } from '@/features/library/PromptLibrary';

export const metadata: Metadata = { title: 'Thư viện đề · hocnoihocviet' };

export default function Page() {
  return <PromptLibrary />;
}
