import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GUIDEBOOKS } from '@/features/guidebooks/content';
import { DocumentViewer } from '@/features/guidebooks/DocumentViewer';

export const metadata: Metadata = { title: 'The Engine Guidebook · hocnoihocviet' };

export function generateStaticParams() {
  return GUIDEBOOKS.map((g) => ({ slug: g.slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!GUIDEBOOKS.some((g) => g.slug === slug)) notFound();
  return <DocumentViewer />;
}
