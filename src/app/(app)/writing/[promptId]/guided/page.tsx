import { notFound, redirect } from 'next/navigation';
import { findPrompt, PROMPTS } from '@/content/prompts';

export function generateStaticParams() {
  return PROMPTS.map((p) => ({ promptId: p.id }));
}

/** Chép mẫu moved to its own section; old links land there. */
export default async function Page({ params }: { params: Promise<{ promptId: string }> }) {
  const { promptId } = await params;
  if (!findPrompt(promptId)) notFound();
  redirect('/copy/' + promptId);
}
