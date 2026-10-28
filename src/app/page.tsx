import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Login } from '@/features/auth/Login';

export const metadata: Metadata = { title: 'Đăng nhập · hocnoihocviet' };

/** No landing page for now: the root is the login page (signed-in visitors go on to /home). */
export default function Page() {
  return <Suspense><Login /></Suspense>;
}
