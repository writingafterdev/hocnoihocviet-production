import type { Metadata } from 'next';
import { mbxPrompts } from '@/content/missbacxiu';
import { DrillHistory, type IdeaRef } from '@/features/prove/DrillHistory';

export const metadata: Metadata = { title: 'Mạch ý đã chứng minh · hocnoihocviet' };

/** Nghĩ ý's prompts go along as text and macro only, so mạch ý done there show beside Phát triển ý's. */
export default function Page() {
  const ideas: Record<string, IdeaRef> = Object.fromEntries(mbxPrompts().map((p) => [p.id, { text: p.text, macro: p.macro }]));
  return <DrillHistory ideas={ideas} />;
}
