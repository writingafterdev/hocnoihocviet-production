'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IdeaExercise } from './IdeaExercise';
import { IdeaLibrary } from './IdeaLibrary';

export type Macro = 'A' | 'B' | 'C';
/** One of missbacxiu's prompts, as Nghĩ ý lists it. `idea` is her idea for its row of the doc; `part` the doc part it sits in. */
export interface IdeaPrompt { id: string; text: string; macro: Macro; idea: string; part: string; date?: string }

export const MACRO_TINT: Record<Macro, { bg: string; fg: string }> = {
  A: { bg: '#FFF0EB', fg: '#B33A1A' },
  B: { bg: '#EEF3FC', fg: '#2F62C4' },
  C: { bg: '#EDF7EA', fg: '#2D6E1E' },
};
export const MACRO_NAME: Record<Macro, string> = { A: 'Nguyên nhân', B: 'Tác động', C: 'Giải pháp' };

/**
 * Nghĩ ý: her prompts in a list (/nghi-y), one open as an exercise (/nghi-y?q=<id>): one end of the mạch ý is given,
 * the student finds the other end, then writes the steps between and checks them.
 */
export function NghiY({ list }: { list: IdeaPrompt[] }) {
  const router = useRouter();
  const q = useSearchParams().get('q');
  const current = q ? list.find((p) => p.id === q) ?? null : null;
  /** Prompts this student has finished (✓), shared with Chứng minh nhanh's attempts. */
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    fetch('/api/drill/done', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null)).then((d: { ids?: string[] } | null) => { if (d?.ids) setDone(new Set(d.ids)); }).catch(() => {});
  }, []);
  const open = (id: string) => router.push('/nghi-y?q=' + id, { scroll: false });
  if (current) {
    return (
      <IdeaExercise
        key={current.id}
        p={current}
        onLibrary={() => router.push('/nghi-y', { scroll: false })}
        onNext={() => {
          const pool = list.filter((x) => x.macro === current.macro && x.id !== current.id && !done.has(x.id));
          const from = pool.length ? pool : list.filter((x) => x.id !== current.id);
          open(from[Math.floor(Math.random() * from.length)].id);
        }}
        onDone={() => setDone((d) => new Set(d).add(current.id))}
      />
    );
  }
  return <IdeaLibrary list={list} done={done} onOpen={open} />;
}
