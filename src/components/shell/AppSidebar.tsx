'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { NavIcon } from '@/components/brand/NavIcon';
import { HookSidebar } from '@/components/ui/hook-sidebar';
import { cn } from '@/lib/utils';
import { UserMenu } from './UserMenu';

/** One group of the sidebar: a small heading and its pages, or a heading over nested sections. `match` tells which pages count as being inside an item. */
interface Item { label: string; href: string; match: string[]; icon: React.ReactNode; disabled?: boolean }
interface Section { label: string; soon?: boolean; items: Item[] }
interface Group { label?: string; items?: Item[]; sections?: Section[] }

const drill = (disabled?: boolean): Item => ({ label: 'Phát triển ý', href: '/prove', match: disabled ? [] : ['/prove'], icon: <NavIcon name="drill" />, disabled });
const write = (disabled?: boolean): Item => ({ label: 'Luyện viết', href: '/writing', match: disabled ? [] : ['/writing', '/write'], icon: <NavIcon name="write" />, disabled });
const copy = (disabled?: boolean): Item => ({ label: 'Chép mẫu', href: '/copy', match: disabled ? [] : ['/copy'], icon: <NavIcon name="copy" />, disabled });

// Tài liệu missbacxiu (her doc and Nghĩ ý) comes first; Writing holds Task 2 (quick drill, writing practice, copying a sample) and Task 1 (writing practice, copying a sample later; no drill); vocab and the student's own essays stand apart.
/** Task 1: Luyện viết is open to every signed-in student (Chép mẫu stays "Sắp có"). */
const task1Write = (open: boolean): Item => ({ label: 'Luyện viết', href: '/task1', match: open ? ['/task1'] : [], icon: <NavIcon name="write" />, disabled: !open });
const groupsFor = (task1: boolean): Group[] => [
  { items: [{ label: 'Trang chủ', href: '/home', match: ['/home'], icon: <NavIcon name="home" /> }] },
  { label: 'Tài liệu missbacxiu', items: [{ label: 'Tài liệu', href: '/tai-lieu', match: ['/tai-lieu'], icon: <NavIcon name="cafe" /> },
    { label: 'Nghĩ ý', href: '/nghi-y', match: ['/nghi-y'], icon: <NavIcon name="idea" /> }] },
  { label: 'Writing', sections: [
    { label: 'Task 2', items: [drill(), write(), copy()] },
    { label: 'Task 1', soon: !task1, items: [task1Write(task1), copy(true)] },
  ] },
  { label: 'Từ vựng', items: [{ label: 'Từ vựng theo chủ đề', href: '/vocab', match: ['/vocab'], icon: <NavIcon name="vocab" /> }] },
  { label: 'Của bạn', items: [
    { label: 'Bài đã viết', href: '/attempts', match: ['/attempts'], icon: <NavIcon name="essays" /> },
    { label: 'Mạch ý đã chứng minh', href: '/drills', match: ['/drills'], icon: <NavIcon name="chains" /> },
  ] },
];

const inside = (path: string, base: string) => path === base || path.startsWith(base + '/');
const KEY = 'hnhv-sidebar';
/** The workspaces (drill, chains, essay) need every pixel, so there the sidebar starts hidden. Everywhere else it starts open. */
const WORKSPACE = ['/prove', '/write'];
/** A Task 1 attempt (/task1/<id>) is a workspace too; the Task 1 library is not. */
const isWorkspace = (path: string) => WORKSPACE.some((b) => inside(path, b)) || /^\/task1\/[^/]+/.test(path);
const SIDEBAR_W = 232;

/** What the top bar says about the current page: a section (muted) and the page, each a link (the section to its first page, the page to its start). */
interface Crumb { label: string; href: string }
function titleOf(path: string): { section?: Crumb; page: Crumb } {
  const task2: Crumb = { label: 'Task 2', href: '/writing' };
  const mbx: Crumb = { label: 'Tài liệu missbacxiu', href: '/tai-lieu' };
  if (inside(path, '/task1')) return { section: { label: 'Task 1', href: '/task1' }, page: path === '/task1' ? { label: 'Thư viện đề', href: '/task1' } : { label: 'Luyện viết', href: '/task1' } };
  if (inside(path, '/prove')) return { section: task2, page: { label: 'Phát triển ý', href: '/prove' } };
  if (inside(path, '/copy')) return { section: task2, page: { label: 'Chép mẫu', href: '/copy' } };
  if (inside(path, '/writing')) return { section: task2, page: { label: 'Thư viện đề', href: '/writing' } };
  if (inside(path, '/write')) return { section: task2, page: { label: 'Luyện viết', href: '/writing' } };
  if (inside(path, '/tai-lieu')) return { section: mbx, page: { label: 'Tài liệu', href: '/tai-lieu' } };
  if (inside(path, '/nghi-y')) return { section: mbx, page: { label: 'Nghĩ ý', href: '/nghi-y' } };
  if (inside(path, '/vocab')) return { page: { label: 'Từ vựng', href: '/vocab' } };
  if (inside(path, '/attempts')) return { page: { label: 'Bài đã viết', href: '/attempts' } };
  if (inside(path, '/drills')) return { page: { label: 'Mạch ý đã chứng minh', href: '/drills' } };
  if (inside(path, '/admin')) return { page: { label: 'Quản trị', href: '/admin' } };
  return { page: { label: 'Trang chủ', href: '/home' } };
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
  const workspace = isWorkspace(path);
  // Open for every signed-in student; only a signed-out check (401) greys it out again.
  const [task1, setTask1] = useState(true);
  useEffect(() => { fetch('/api/task1/access', { credentials: 'same-origin' }).then((r) => setTask1(r.ok), () => {}); }, []);
  const GROUPS = groupsFor(task1);
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
          <nav aria-label="Vị trí" className="min-w-0">
            <h1 className="m-0 truncate text-[15px] font-medium tracking-[-0.01em] text-ink">
              {title.section && <><Link href={title.section.href} className="font-normal text-ink-soft transition-colors hover:text-ink">{title.section.label}</Link><span className="font-normal text-ink-soft"> / </span></>}
              <Link href={title.page.href} aria-current="page" className="text-ink">{title.page.label}</Link>
            </h1>
          </nav>
          <div className={cn('ml-auto flex items-center gap-3', open && 'md:hidden')}><UserMenu /></div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside aria-label="Thanh bên" aria-hidden={!open} inert={!open} style={{ width: open ? SIDEBAR_W : 0 }}
          className={cn('hidden shrink-0 flex-col overflow-hidden bg-white transition-[width] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] md:flex', open && 'border-r border-line')}>
          <div className="flex h-full w-[232px] shrink-0 flex-col">
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
              {GROUPS.map((g, k) => {
                if (g.sections) return (
                  <div key={k} className="flex flex-col">
                    <span className="pb-3 pl-0.5 pr-2 font-sans text-sm font-medium uppercase tracking-wide text-foreground">{g.label}</span>
                    <div className="flex flex-col gap-4 pl-2">
                      {g.sections.map((sec) => (
                        <HookSidebar key={sec.label} sub label={sec.label}
                          labelSuffix={sec.soon ? <span className="rounded bg-black/[0.05] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground/45">Sắp có</span> : undefined}
                          items={sec.items} value={sec.items.findIndex((it) => it.match.some((m) => inside(path, m)))} color="var(--brand-tomato)" className="whitespace-nowrap" />
                      ))}
                    </div>
                  </div>
                );
                const items = g.items || [];
                const value = items.findIndex((it) => it.match.some((m) => inside(path, m)));
                return <HookSidebar key={k} label={g.label} items={items} value={value} color="var(--brand-tomato)" className="whitespace-nowrap" />;
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
