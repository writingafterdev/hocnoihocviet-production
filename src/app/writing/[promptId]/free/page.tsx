import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FreeWritingFlow } from '@/features/chainlab/FreeWritingFlow';
import { findPrompt, PROMPTS } from '@/features/library/prompts';

export const metadata: Metadata = { title: 'Viết tự do · hocnoihocviet' };

export function generateStaticParams() {
  return PROMPTS.map((p) => ({ promptId: p.id }));
}

export default async function Page({ params }: { params: Promise<{ promptId: string }> }) {
  const prompt = findPrompt((await params).promptId);
  if (!prompt) notFound();
  return <FreeWritingFlow prompt={prompt} />;
}
