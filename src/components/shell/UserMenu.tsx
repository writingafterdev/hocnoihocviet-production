'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from '@/lib/auth-client';
import { setPro, usePro } from '@/lib/pro';
import { ProBeam } from '@/components/ui/pro-beam';

const initials = (name: string) => name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();

/** Avatar (Google photo or initials) with "Bài đã viết" and "Đăng xuất". Shows a login link when signed out. */
export function UserMenu({ placement = 'down' }: { placement?: 'down' | 'up' }) {
  const router = useRouter();
  const { data, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const pro = usePro();
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
  if (!data) return <Link href="/login" style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: '#171717' }}>Đăng nhập</Link>;

  // Cast: better-auth's inferred type collapses with strictNullChecks off.
  const user = (data as unknown as { user: unknown }).user as { name: string; email: string; image?: string | null };
  const item: React.CSSProperties = { display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-sans)', fontSize: 13.5, color: '#171717', background: 'none', border: 'none', cursor: 'pointer' };
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <ProBeam radius={18}>
      <button type="button" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label="Tài khoản" style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 9999, background: 'var(--brand-blue-soft)', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--brand-blue-deep)' }}>
        {user.image ? <img src={user.image} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(user.name || user.email)}
      </button>
      </ProBeam>
      {open && (
        <div role="menu" style={{ position: 'absolute', ...(placement === 'up' ? { left: 0, bottom: 'calc(100% + 8px)' } : { right: 0, top: 'calc(100% + 8px)' }), zIndex: 60, width: 240, padding: 6, borderRadius: 10, border: '1px solid #E5E5E5', background: '#fff', boxShadow: 'var(--shadow-ambient-high)' }}>
          <div style={{ padding: '10px 14px 12px', borderBottom: '1px solid #F0F0F0', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: '#171717' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
              {pro && <span style={{ flexShrink: 0, borderRadius: 6, padding: '1px 6px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', color: '#fff', background: 'linear-gradient(135deg, #2F62C4, #8B5CF6 55%, #FF5C33)' }}>PRO</span>}
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#737373', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
          <Link role="menuitem" href="/attempts" onClick={() => setOpen(false)} className="cl-rv" style={item}>Bài đã viết</Link>
          {admin && <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className="cl-rv" style={item}>Quản trị</Link>}
          <button role="menuitem" type="button" className="cl-rv" style={item} onClick={() => setPro(!pro)}>{pro ? 'Tắt chế độ Pro (thử)' : 'Bật chế độ Pro (thử)'}</button>
          <button role="menuitem" type="button" className="cl-rv" style={item} onClick={() => signOut({ fetchOptions: { onSuccess: () => { router.push('/'); router.refresh(); } } })}>Đăng xuất</button>
        </div>
      )}
    </div>
  );
}
