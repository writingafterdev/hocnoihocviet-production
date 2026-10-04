import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Login } from '@/features/auth/Login';

export const metadata: Metadata = { title: 'Đăng nhập · hocnoihocviet' };

export default function Page() {
  return <Suspense><Login /></Suspense>;
}
