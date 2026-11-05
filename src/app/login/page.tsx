import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Login } from '@/features/auth/Login';

export const metadata: Metadata = { title: 'Đăng nhập · hocnoihocviet' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  // DEV_PASSWORD_LOGIN is only ever set in a local .dev.vars, never on the live site.
  const dev = (await getCloudflareContext({ async: true })).env.DEV_PASSWORD_LOGIN === '1';
  return <Suspense><Login dev={dev} /></Suspense>;
}
