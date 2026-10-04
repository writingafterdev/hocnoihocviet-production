import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GuidedFlow } from '@/features/guided/GuidedFlow';
import { findPrompt, PROMPTS } from '@/features/library/prompts';

export const metadata: Metadata = { title: 'Chép mẫu · hocnoihocviet' };

export function generateStaticParams() {
  return PROMPTS.map((p) => ({ promptId: p.id }));
}

export default async function Page({ params }: { params: Promise<{ promptId: string }> }) {
  if (!findPrompt((await params).promptId)) notFound();
  return <GuidedFlow />;
}
