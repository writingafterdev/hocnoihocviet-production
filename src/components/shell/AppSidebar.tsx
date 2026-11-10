'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { HookSidebar } from '@/components/ui/hook-sidebar';
import { cn } from '@/lib/utils';
import { UserMenu } from './UserMenu';

/** One group of the sidebar: a small heading and its pages. `match` tells which pages count as being inside an item. */
interface Group { label?: string; items: { label: string; href: string; match: string[] }[] }

// Task 2 holds the quick drill and the writing practice; vocab and the student's own essays stand apart.
const GROUPS: Group[] = [
  { items: [{ label: 'Trang chủ', href: '/home', match: ['/home'] }] },
  { label: 'Task 2', items: [
    { label: 'Chứng minh nhanh', href: '/prove', match: ['/prove'] },
    { label: 'Luyện viết', href: '/writing', match: ['/writing', '/write'] },
  ] },
  { label: 'Từ vựng', items: [{ label: 'Từ vựng theo chủ đề', href: '/vocab', match: ['/vocab'] }] },
  { label: 'Của bạn', items: [{ label: 'Bài đã viết', href: '/attempts', match: ['/attempts'] }] },
];

const inside = (path: string, base: string) => path === base || path.startsWith(base + '/');
const KEY = 'hnhv-sidebar';
/** The workspaces need every pixel, so the sidebar starts closed there. */
const WORKSPACE = ['/prove', '/write'];

/**
 * The app's left sidebar (Rare UI's hook sidebar): logo on top, the groups with a dashed rail that hooks to the current
 * page, the account at the bottom. It can be folded away; the choice is remembered per kind of page.
 */
export function AppSidebar({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const workspace = WORKSPACE.some((b) => inside(path, b));
  const [stored, setStored] = useState<Record<string, boolean>>({});
  useEffect(() => { try { setStored(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* private mode */ } }, []);
  const kind = workspace ? 'workspace' : 'page';
  const open = stored[kind] ?? !workspace;
  const toggle = () => {
    const next = { ...stored, [kind]: !open };
    setStored(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode */ }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <aside aria-label="Thanh bên" className={cn('sticky top-0 hidden h-screen shrink-0 flex-col bg-white transition-[width] duration-200 md:flex', open ? 'w-60' : 'w-0 overflow-hidden')}>
        <div className="flex h-14 w-60 shrink-0 items-center px-5">
          <Link href="/home" aria-label="hocnoihocviet · Trang chủ"><Logo /></Link>
        </div>
        <div className="flex w-60 flex-1 flex-col gap-6 overflow-y-auto px-5 pb-6 pt-4">
          {GROUPS.map((g, k) => {
            const value = g.items.findIndex((it) => it.match.some((m) => inside(path, m)));
            return <HookSidebar key={k} label={g.label} items={g.items} value={value} color="var(--brand-tomato)" />;
          })}
        </div>
        <div className="flex h-16 w-60 shrink-0 items-center px-5"><UserMenu placement="up" /></div>
      </aside>
      <div className="relative min-w-0 flex-1">
        <button type="button" onClick={toggle} aria-label={open ? 'Ẩn thanh bên' : 'Hiện thanh bên'} aria-pressed={open}
          className="absolute left-3 top-3 z-30 hidden size-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink md:flex">
          <PanelLeft className="size-[18px]" />
        </button>
        {children}
      </div>
    </div>
  );
}
