'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { NavIcon } from '@/components/brand/NavIcon';
import { HookSidebar } from '@/components/ui/hook-sidebar';
import { cn } from '@/lib/utils';
import { UserMenu } from './UserMenu';

/** One group of the sidebar: a small heading and its pages. `match` tells which pages count as being inside an item. */
interface Group { label?: string; items: { label: string; href: string; match: string[]; icon: React.ReactNode }[] }

// Task 2 holds the quick drill and the writing practice; vocab and the student's own essays stand apart.
const GROUPS: Group[] = [
  { items: [{ label: 'Trang chủ', href: '/home', match: ['/home'], icon: <NavIcon name="home" /> }] },
  { label: 'Task 2', items: [
    { label: 'Chứng minh nhanh', href: '/prove', match: ['/prove'], icon: <NavIcon name="drill" /> },
    { label: 'Luyện viết', href: '/writing', match: ['/writing', '/write'], icon: <NavIcon name="write" /> },
  ] },
  { label: 'Từ vựng', items: [{ label: 'Từ vựng theo chủ đề', href: '/vocab', match: ['/vocab'], icon: <NavIcon name="vocab" /> }] },
  { label: 'Của bạn', items: [
    { label: 'Tiến độ', href: '/progress', match: ['/progress'], icon: <NavIcon name="progress" /> },
    { label: 'Bài đã viết', href: '/attempts', match: ['/attempts'], icon: <NavIcon name="essays" /> },
  ] },
];

const inside = (path: string, base: string) => path === base || path.startsWith(base + '/');
const KEY = 'hnhv-sidebar';
/** The workspaces (drill, chains, essay) need every pixel, so there the sidebar starts hidden. Everywhere else it starts open. */
const WORKSPACE = ['/prove', '/write'];
const SIDEBAR_W = 232;

/** What the top bar says about the current page: a section (muted) and the page. */
function titleOf(path: string): { section?: string; page: string } {
  if (inside(path, '/prove')) return { section: 'Task 2', page: 'Chứng minh nhanh' };
  if (inside(path, '/writing')) return { section: 'Task 2', page: 'Thư viện đề' };
  if (inside(path, '/write')) return { section: 'Task 2', page: 'Luyện viết' };
  if (inside(path, '/vocab')) return { page: 'Từ vựng' };
  if (inside(path, '/progress')) return { page: 'Tiến độ' };
  if (inside(path, '/attempts')) return { page: 'Bài đã viết' };
  if (inside(path, '/admin')) return { page: 'Quản trị' };
  return { page: 'Trang chủ' };
}

/** Cloudflare's sidebar toggle icon: a rounded panel with a bar that moves across when the sidebar closes. */
function ToggleIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="shrink-0">
      <path d="M21.25 6.72v10.56a2.97 2.97 0 0 1-2.97 2.97H5.72a2.97 2.97 0 0 1-2.97-2.97V6.72a2.97 2.97 0 0 1 2.97-2.97h12.56a2.97 2.97 0 0 1 2.97 2.97" />
      <path d="M6.25 7.25v9.5" style={{ transform: open ? 'translateX(1px)' : 'translateX(10.5px)', transition: 'transform var(--duration-fast) var(--ease-smooth-out)' }} />
    </svg>
  );
}

/**
 * The app frame, laid out like the Cloudflare dashboard in four regions: the brand in the top-left cell, the
 * navigation under it, a top bar across the rest (where you are, your account), and the page below the bar.
 * The sidebar is on the same layer as the page: hiding it (button at the bottom-left, or ⌘B / Ctrl+B) gives its
 * width back to the page. The choice is remembered, separately for the workspaces and the other pages.
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
  const title = titleOf(path);
  const toggleBtn = (
    <button type="button" onClick={toggle} aria-label={open ? 'Ẩn thanh bên (⌘B)' : 'Hiện thanh bên (⌘B)'} title={(open ? 'Ẩn' : 'Hiện') + ' thanh bên · ⌘B'} aria-expanded={open}
      className="hidden size-[34px] shrink-0 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink md:flex">
      <ToggleIcon open={open} />
    </button>
  );

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Top: the brand cell (as wide as the sidebar), then the bar. */}
      <header className="flex h-14 shrink-0 border-b border-line">
        <div style={{ width: open ? SIDEBAR_W : 0 }} className={cn('hidden shrink-0 items-center overflow-hidden transition-[width] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] md:flex', open && 'border-r border-line')}>
          <div className="flex w-[232px] shrink-0 items-center justify-between pl-4 pr-3">
            <Link href="/home" aria-label="hocnoihocviet · Trang chủ" className="flex items-center"><Logo /></Link>
            {toggleBtn}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3 px-5">
          {!open && <span className="-ml-2 hidden items-center gap-2 md:flex">{toggleBtn}<Link href="/home" aria-label="hocnoihocviet · Trang chủ"><Logo word={false} /></Link></span>}
          <h1 className="m-0 truncate text-[15px] font-medium tracking-[-0.01em] text-ink">
            {title.section && <span className="font-normal text-ink-soft">{title.section} / </span>}{title.page}
          </h1>
          <div className={cn('ml-auto flex items-center gap-3', open && 'md:hidden')}><UserMenu /></div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside aria-label="Thanh bên" aria-hidden={!open} inert={!open} style={{ width: open ? SIDEBAR_W : 0 }}
          className={cn('hidden shrink-0 flex-col overflow-hidden bg-white transition-[width] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] md:flex', open && 'border-r border-line')}>
          <div className="flex h-full w-[232px] shrink-0 flex-col">
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
              {GROUPS.map((g, k) => {
                const value = g.items.findIndex((it) => it.match.some((m) => inside(path, m)));
                return <HookSidebar key={k} label={g.label} items={g.items} value={value} color="var(--brand-tomato)" className="whitespace-nowrap" />;
              })}
            </div>
            <div className="shrink-0 border-t border-line p-3"><UserMenu variant="row" placement="up" /></div>
          </div>
        </aside>
        <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
