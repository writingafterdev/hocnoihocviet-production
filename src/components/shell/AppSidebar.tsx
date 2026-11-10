'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
/** The workspaces (drill, chains, essay) need every pixel, so the sidebar stays hidden there until the cursor reaches the left edge. */
const WORKSPACE = ['/prove', '/write'];

/** The sidebar's content: the brand as the first heading with the home page under it, the groups, the account. */
function SidebarBody({ path, overlay = false }: { path: string; overlay?: boolean }) {
  return (
    <>
      <div className={cn('flex flex-1 flex-col gap-6 overflow-y-auto pb-6 pl-12 pr-2', overlay ? 'pt-6' : 'pt-[var(--content-top,70px)]')}>
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
      <div className="flex h-16 shrink-0 items-center pl-12 pr-2"><UserMenu placement="up" /></div>
    </>
  );
}

/**
 * The app's left sidebar (Rare UI's hook sidebar). On most pages it sits beside the content. On the workspaces it is
 * hidden; moving the cursor to the left edge slides it in over the page, and moving away (or Escape) hides it again.
 */
export function AppSidebar({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const workspace = WORKSPACE.some((b) => inside(path, b));
  const [peek, setPeek] = useState(false);
  // A new page starts with the sidebar tucked away.
  useEffect(() => { setPeek(false); }, [path]);
  useEffect(() => {
    if (!peek) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setPeek(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [peek]);

  return (
    <div className="flex min-h-screen bg-white">
      {!workspace && (
        <aside aria-label="Thanh bên" className="sticky top-0 hidden h-screen w-[208px] shrink-0 flex-col bg-white md:flex">
          <SidebarBody path={path} />
        </aside>
      )}
      {workspace && (
        <>
          {/* The hot zone along the left edge, then the sidebar that slides over the page. */}
          <div aria-hidden="true" onMouseEnter={() => setPeek(true)} className="fixed inset-y-0 left-0 z-40 hidden w-3 md:block" />
          <aside aria-label="Thanh bên" onMouseLeave={() => setPeek(false)} onFocusCapture={() => setPeek(true)}
            className={cn('fixed inset-y-0 left-0 z-50 hidden w-[208px] flex-col bg-white shadow-pop transition-transform duration-200 ease-out md:flex', peek ? 'translate-x-0' : '-translate-x-full')}>
            <SidebarBody path={path} overlay />
          </aside>
        </>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
