'use client';

import { useRouter } from 'next/navigation';
import { VocabBuilder } from './VocabBuilder';

export function VocabPage() {
  const router = useRouter();
  return <div style={{ height: '100vh', background: '#fff' }}><VocabBuilder onBack={() => router.push('/home')} /></div>;
}
