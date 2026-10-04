import type { Metadata } from 'next';
import { Dashboard } from '@/features/dashboard/Dashboard';

export const metadata: Metadata = { title: 'Trang chủ · hocnoihocviet' };

export default function Page() {
  return <Dashboard />;
}
