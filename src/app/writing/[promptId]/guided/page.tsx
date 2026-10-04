import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findPrompt, PROMPTS } from '@/content/prompts';
import { GuidedFlow } from '@/features/guided/GuidedFlow';

export const metadata: Metadata = { title: 'Chép mẫu · hocnoihocviet' };

export function generateStaticParams() {
  return PROMPTS.map((p) => ({ promptId: p.id }));
}

export default async function Page({ params }: { params: Promise<{ promptId: string }> }) {
  const { promptId } = await params;
  if (!findPrompt(promptId)) notFound();
  return <GuidedFlow />;
}
