import type { Metadata } from 'next';
import { GuidebookHome } from '@/features/guidebooks/GuidebookHome';

export const metadata: Metadata = { title: 'Guidebooks · hocnoihocviet' };

export default function Page() {
  return <GuidebookHome />;
}
