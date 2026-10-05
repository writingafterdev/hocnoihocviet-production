'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from '@/lib/auth-client';

const initials = (name: string) => name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();

/** Avatar (Google photo or initials) with "Bài đã viết" and "Đăng xuất". Shows a login link when signed out. */
export function UserMenu() {
  const router = useRouter();
  const { data, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const signedIn = !!data;
  // Whether to show the admin link: asked once, the first time the menu opens.
  const asked = useRef(false);
  useEffect(() => {
    if (!open || !signedIn || asked.current) return;
    asked.current = true;
    fetch('/api/admin/me', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d && d.admin) setAdmin(true); }, () => {});
  }, [open, signedIn]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  if (isPending) return <span style={{ width: 40, height: 40 }} />;
  if (!data) return <Link href="/login" style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: '#141413' }}>Đăng nhập</Link>;

  // Cast: better-auth's inferred type collapses with strictNullChecks off.
  const user = (data as unknown as { user: unknown }).user as { name: string; email: string; image?: string | null };
  const item: React.CSSProperties = { display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-sans)', fontSize: 13.5, color: '#141413', background: 'none', border: 'none', cursor: 'pointer' };
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label="Tài khoản" style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 9999, background: 'var(--brand-orange)', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: '#141413' }}>
        {user.image ? <img src={user.image} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(user.name || user.email)}
      </button>
      {open && (
        <div role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 60, width: 240, padding: 6, borderRadius: 14, border: '1px solid #E6E4DE', background: '#fff', boxShadow: 'var(--shadow-ambient-high)' }}>
          <div style={{ padding: '10px 14px 12px', borderBottom: '1px solid #ECECEA', marginBottom: 6 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: '#141413', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#77776F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
          <Link role="menuitem" href="/attempts" onClick={() => setOpen(false)} className="cl-rv" style={item}>Bài đã viết</Link>
          {admin && <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className="cl-rv" style={item}>Quản trị</Link>}
          <button role="menuitem" type="button" className="cl-rv" style={item} onClick={() => signOut({ fetchOptions: { onSuccess: () => { router.push('/'); router.refresh(); } } })}>Đăng xuất</button>
        </div>
      )}
    </div>
  );
}
