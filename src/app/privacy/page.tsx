import type { Metadata } from 'next';
import { PRIVACY } from '@/content/legal';
import { LegalPage } from '@/features/legal/LegalPage';

export const metadata: Metadata = { title: 'Chính sách quyền riêng tư · hocnoihocviet' };

export default function Page() {
  return <LegalPage doc={PRIVACY} />;
}
