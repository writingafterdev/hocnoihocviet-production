'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { HookSidebar } from '@/components/ui/hook-sidebar';
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
/** The workspaces (drill, chains, essay) need every pixel, so they go without the sidebar and keep their own back links. */
const WORKSPACE = ['/prove', '/write'];

/**
 * The app's left sidebar (Rare UI's hook sidebar): the brand as the first heading with the home page under it, then
 * the groups with a dashed rail that hooks to the current page, the account at the bottom.
 */
export function AppSidebar({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const workspace = WORKSPACE.some((b) => inside(path, b));

  return (
    <div className="flex min-h-screen bg-white">
      {!workspace && (
        <aside aria-label="Thanh bên" className="sticky top-0 hidden h-screen w-[208px] shrink-0 flex-col bg-white md:flex">
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
          <div className="flex h-16 shrink-0 items-center pl-12 pr-2"><UserMenu placement="up" /></div>
        </aside>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
