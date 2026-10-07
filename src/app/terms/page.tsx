import type { Metadata } from 'next';
import { TERMS } from '@/content/legal';
import { LegalPage } from '@/features/legal/LegalPage';

export const metadata: Metadata = { title: 'Điều khoản sử dụng · hocnoihocviet' };

export default function Page() {
  return <LegalPage doc={TERMS} />;
}
