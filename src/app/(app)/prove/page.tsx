import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProveDrill } from '@/features/prove/ProveDrill';

export const metadata: Metadata = { title: 'Chứng minh nhanh · hocnoihocviet' };

// ProveDrill reads ?s= (a statement to open) with useSearchParams, which needs a Suspense boundary on a static page.
export default function Page() {
  return <Suspense><ProveDrill /></Suspense>;
}
