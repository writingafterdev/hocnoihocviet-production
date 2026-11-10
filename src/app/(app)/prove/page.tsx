import type { Metadata } from 'next';
import { ProveDrill } from '@/features/prove/ProveDrill';

export const metadata: Metadata = { title: 'Chứng minh nhanh · hocnoihocviet' };

export default function Page() {
  return <ProveDrill />;
}
