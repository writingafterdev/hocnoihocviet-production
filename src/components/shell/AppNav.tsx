'use client';

import { BookOpen, FileText, House, PenLine, Sparkles } from 'lucide-react';
import { GooeyNav } from '@/components/ui/gooey-nav';

const ITEMS = [
  { label: 'Trang chủ', href: '/home', icon: <House /> },
  { label: 'Chứng minh nhanh', href: '/prove', icon: <Sparkles /> },
  { label: 'Viết bài', href: '/writing', icon: <PenLine /> },
  { label: 'Từ vựng', href: '/vocab', icon: <BookOpen /> },
  { label: 'Bài đã viết', href: '/attempts', icon: <FileText /> },
];

/** The app's main navigation: one bar at the top, the current section lifted out in the brand tomato. */
export function AppNav() {
  return <GooeyNav items={ITEMS} size="sm" activeColor="var(--brand-tomato)" />;
}
