import type { Metadata } from 'next';
import { MBX_MACROS } from '@/content/missbacxiu';
import { DocView, type TocMacro } from '@/features/docs/DocView';

export const metadata: Metadata = { title: 'Tài liệu missbacxiu · hocnoihocviet' };

/**
 * Tài liệu missbacxiu: one part of her doc at a time (?p=A-1). The server picks the part, so the page ships only that
 * part's text and the table of contents, not the whole document.
 */
export default async function Page({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const toc: TocMacro[] = MBX_MACROS.map((m) => ({ id: m.id, name: m.name, parts: m.parts.filter((pt) => pt.title).map((pt) => ({ id: pt.id, title: pt.title as string })) }));
  const flat = toc.flatMap((m) => m.parts.map((pt) => ({ macro: m.id, id: pt.id })));
  const at = Math.max(0, flat.findIndex((x) => x.id === p));
  const macro = MBX_MACROS.find((m) => m.id === flat[at].macro)!;
  const part = macro.parts.find((pt) => pt.id === flat[at].id)!;
  // The macro's untitled intro shows above its first part.
  const first = macro.parts.find((pt) => pt.title)?.id === part.id;
  const intro = first ? macro.parts.filter((pt) => !pt.title).flatMap((pt) => pt.blocks) : [];
  const next = flat[at + 1];
  const nextTitle = next && toc.find((m) => m.id === next.macro)!.parts.find((pt) => pt.id === next.id)!.title;
  return (
    <DocView
      macro={{ id: macro.id, name: macro.name, title: macro.title }}
      part={part}
      intro={intro}
      toc={toc}
      next={next ? { id: next.id, title: next.macro === macro.id ? nextTitle : `${next.macro} · ${nextTitle}` } : null}
    />
  );
}
