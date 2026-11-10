import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';
import { AppNav } from './AppNav';
import { UserMenu } from './UserMenu';

/** The brand mark + lowercase wordmark on the left, user avatar on the right. Shared by every signed-in screen. */
export function BrandBar({ avatar = true, href = '/home', status }: { avatar?: boolean; href?: string; status?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Link href={href} aria-label="hocnoihocviet · Trang chủ">
        <Logo />
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {status}
        {avatar && <UserMenu />}
      </div>
    </div>
  );
}

/** Header for scrolling pages (home, library, vocab): logo, the main navigation in the middle, the avatar. */
export function PageHeader({ avatar = true }: { avatar?: boolean }) {
  return (
    <header className="sticky top-0 z-20 grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-line bg-white/90 px-6 backdrop-blur">
      <BrandBar avatar={false} />
      <nav aria-label="Điều hướng chính" className="hidden md:block"><AppNav /></nav>
      <div className="flex justify-end">{avatar && <UserMenu />}</div>
    </header>
  );
}

/** Header for full-height workspaces (ChainLab, Writing Desk, Chép mẫu). */
export function WorkspaceHeader({ status }: { status?: ReactNode }) {
  return (
    <header style={{ width: '100%', maxWidth: 1710, margin: '0 auto', padding: '18px 40px 4px', flexShrink: 0 }}>
      <BrandBar status={status} />
    </header>
  );
}
