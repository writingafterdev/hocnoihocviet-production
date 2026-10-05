import type { Metadata } from 'next';
import { AdminPage } from '@/features/admin/AdminPage';

export const metadata: Metadata = { title: 'Quản trị · hocnoihocviet', robots: { index: false, follow: false } };

export default function Page() {
  return <AdminPage />;
}
