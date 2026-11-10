'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
/** The workspaces (drill, chains, essay) need every pixel, so there the sidebar starts hidden. Everywhere else it starts open. */
const WORKSPACE = ['/prove', '/write'];

/** Cloudflare's sidebar toggle icon: a rounded panel with a bar that moves across when the sidebar closes. */
function ToggleIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="shrink-0">
      <path d="M21.25 6.72v10.56a2.97 2.97 0 0 1-2.97 2.97H5.72a2.97 2.97 0 0 1-2.97-2.97V6.72a2.97 2.97 0 0 1 2.97-2.97h12.56a2.97 2.97 0 0 1 2.97 2.97" />
      <path d="M6.25 7.25v9.5" style={{ transform: open ? 'translateX(1px)' : 'translateX(10.5px)', transition: 'transform 200ms ease-out' }} />
    </svg>
  );
}

/** The sidebar's content: the brand as the first heading with the home page under it, the groups, the account. */
function SidebarBody({ path }: { path: string }) {
  return (
    <>
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-6 pl-12 pr-2 pt-[var(--content-top,70px)]">
        {GROUPS.map((g, k) => {
          const value = g.items.findIndex((it) => it.match.some((m) => inside(path, m)));
          return (
            <div key={k}>
              {/* The brand is the first heading, with the home page under it, just like Task 2 and its pages. */}
              {k === 0 && <Link href="/home" aria-label="hocnoihocviet · Trang chủ" className="mb-3 block"><Logo /></Link>}
              <HookSidebar label={g.label} items={g.items} value={value} color="var(--brand-tomato)" className="whitespace-nowrap" />
            </div>
          );
        })}
      </div>
      <div className="flex h-16 shrink-0 items-center pl-[56px] pr-2"><UserMenu placement="up" /></div>
    </>
  );
}

/**
 * The app's left sidebar (Rare UI's hook sidebar), on the same layer as the page: hiding it gives its width back to
 * the content, showing it takes the width again. One button at the top-left of the content (or ⌘B / Ctrl+B) does both.
 * The choice is remembered, separately for the workspaces and for the other pages.
 */
export function AppSidebar({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const workspace = WORKSPACE.some((b) => inside(path, b));
  const kind = workspace ? 'workspace' : 'page';
  const [stored, setStored] = useState<Record<string, boolean>>({});
  useEffect(() => { try { setStored(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* private mode */ } }, []);
  const open = stored[kind] ?? !workspace;
  const toggle = () => setStored((cur) => {
    const next = { ...cur, [kind]: !(cur[kind] ?? !workspace) };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode */ }
    return next;
  });
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b' && !e.altKey && !e.shiftKey) { e.preventDefault(); toggleRef.current(); } };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);

  return (
    <div className="flex min-h-screen bg-white">
      <aside aria-label="Thanh bên" aria-hidden={!open} inert={!open}
        className={cn('sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden bg-white transition-[width] duration-200 ease-out md:flex', open ? 'w-[208px]' : 'w-0')}>
        <div className="flex h-full w-[208px] shrink-0 flex-col"><SidebarBody path={path} /></div>
      </aside>
      <div className="relative min-w-0 flex-1">
        {children}
      </div>
      <button type="button" onClick={toggle} aria-label={open ? 'Ẩn thanh bên (⌘B)' : 'Hiện thanh bên (⌘B)'} title={(open ? 'Ẩn' : 'Hiện') + ' thanh bên · ⌘B'} aria-expanded={open}
        className="fixed bottom-4 left-[6px] z-50 hidden size-[34px] items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink md:flex">
        <ToggleIcon open={open} />
      </button>
    </div>
  );
}
