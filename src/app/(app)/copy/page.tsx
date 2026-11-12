import type { Metadata } from 'next';
import { PromptLibrary } from '@/features/library/PromptLibrary';

export const metadata: Metadata = { title: 'Chép mẫu · hocnoihocviet' };

export default function Page() {
  return <PromptLibrary mode="copy" />;
}
