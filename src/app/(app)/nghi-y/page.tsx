import type { Metadata } from 'next';
import { Suspense } from 'react';
import { mbxPrompts } from '@/content/missbacxiu';
import { NghiY, type IdeaPrompt } from '@/features/nghiy/NghiY';

export const metadata: Metadata = { title: 'Nghĩ ý · hocnoihocviet' };

/** Nghĩ ý: missbacxiu's prompts (her doc, tab 1). The list is built here so the page doesn't ship the whole doc. */
export default function Page() {
  const list: IdeaPrompt[] = mbxPrompts().map((p) => ({ id: p.id, text: p.text, macro: p.macro, idea: p.idea, part: p.part, ...(p.date ? { date: p.date } : {}) }));
  return (
    <Suspense>
      <NghiY list={list} />
    </Suspense>
  );
}
