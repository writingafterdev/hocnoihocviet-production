import type { Metadata } from 'next';
import { BrandTile } from '@/features/brand/BrandTile';

export const metadata: Metadata = { title: 'Brand · hocnoihocviet', robots: { index: false } };

export default function Page() {
  return <BrandTile />;
}
