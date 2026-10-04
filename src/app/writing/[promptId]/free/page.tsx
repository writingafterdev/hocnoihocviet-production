import { notFound } from 'next/navigation';
import { findPrompt, PROMPTS } from '@/content/prompts';
import { StartAttempt } from '@/features/attempts/StartAttempt';

export function generateStaticParams() {
  return PROMPTS.map((p) => ({ promptId: p.id }));
}

/** Shareable link that starts a new "Viết tự do" attempt for a prompt. */
export default async function Page({ params }: { params: Promise<{ promptId: string }> }) {
  const { promptId } = await params;
  if (!findPrompt(promptId)) notFound();
  return <StartAttempt promptId={promptId} />;
}
