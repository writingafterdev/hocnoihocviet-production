import Link from 'next/link';
import type { ReactNode } from 'react';
import { UserMenu } from './UserMenu';

/** Logo tile + lowercase wordmark on the left, user avatar on the right. Shared by every signed-in screen. */
export function BrandBar({ avatar = true, href = '/home', status }: { avatar?: boolean; href?: string; status?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 42, height: 42, borderRadius: 14, background: 'var(--brand-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/assets/illustrations/il-structure.svg" style={{ width: 26, height: 26 }} alt="" />
        </span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em', color: '#141413' }}>hocnoihocviet</span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {status}
        {avatar && <UserMenu />}
      </div>
    </div>
  );
}

/** Header for scrolling pages (home, library, guidebooks, vocab). */
export function PageHeader({ avatar = true }: { avatar?: boolean }) {
  return (
    <header style={{ padding: '24px 40px' }}>
      <BrandBar avatar={avatar} />
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
