import type { Metadata } from 'next';
import { Login } from '@/features/auth/Login';

export const metadata: Metadata = { title: 'Đăng nhập · hocnoihocviet' };

export default function Page() {
  return <Login />;
}
