'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authClient, signIn, useSession } from '@/lib/auth-client';

const ink = '#171717', mute = '#525252', soft = '#737373', line = '#E6E4DC';
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: soft };

function RopeChip({ t, c, unit }: { t: string; c: string; unit?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 7, border: '1px solid ' + (unit ? '#D4D4D4' : '#E5E5E5'), background: '#fff', fontSize: 12, fontWeight: unit ? 700 : 500, color: unit ? ink : '#404040' }}>
      <i style={{ width: 8, height: 8, borderRadius: unit ? 99 : 2, background: c }} />{t}
    </span>
  );
}

/** Only same-site paths are allowed as the post-login destination. */
const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/home');

/** Split-screen login: brand story with a rope example on the left, Google sign-in on the right. */
export function Login({ dev = false }: { dev?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const error = params.get('error');
  const { data: session } = useSession();
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => { if (session) router.replace(next); }, [session, next, router]);

  const google = async () => {
    setBusy(true); setFailure(null);
    try {
      const { error: e } = await signIn.social({ provider: 'google', callbackURL: next, errorCallbackURL: '/login?next=' + encodeURIComponent(next) });
      if (e) { setBusy(false); setFailure((e.status ? e.status + ' · ' : '') + (e.message || e.statusText || 'unknown error')); }
    } catch (err) {
      setBusy(false); setFailure(err instanceof Error ? err.message : String(err));
    }
  };
  /** Local development only: one shared test account, created on first use. */
  const devLogin = async () => {
    setBusy(true); setFailure(null);
    const cred = { email: 'dev@localhost.test', password: 'dev-password-123' };
    let r = await signIn.email(cred);
    if (r.error) { await authClient.signUp.email({ ...cred, name: 'Dev' }); r = await signIn.email(cred); }
    if (r.error) { setBusy(false); setFailure(r.error.message || 'dev login failed'); } else router.replace(next);
  };
  return (
    <div className="login-grid" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)', background: '#fff', color: ink, fontFamily: 'var(--font-sans)' }}>
      <div className="login-brand" style={{ display: 'flex', flexDirection: 'column', padding: '28px 48px 40px', borderRight: '1px solid ' + line, background: '#F4F2EB' }}>
        <span style={{ fontWeight: 600, fontSize: 18, letterSpacing: '-0.02em' }}>hocnoihocviet</span>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 36, maxWidth: 480, padding: '48px 0' }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 44, lineHeight: 1.08, letterSpacing: '-0.025em', textWrap: 'balance' }}>Mỗi bài viết bắt đầu từ một <i>mạch</i> ý.</h1>
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: 12, border: '1px solid #E1DFD7', background: '#fff', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #EFEDE6' }}>
                <span style={lbl}>Lập trường</span>
                <span style={{ fontSize: 12, color: soft }}>5 ý đã xếp</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ ...lbl, fontSize: 10 }}>Phản đối</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}><RopeChip t="2" c="#D2401B" unit /><RopeChip t="2 · QM" c="#B33A1A" /><RopeChip t="1b" c="#77A1DD" unit /></div>
                </div>
                <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', borderLeft: '1px solid #EFEDE6' }}>
                  <span style={{ ...lbl, fontSize: 10 }}>Đồng ý</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}><RopeChip t="1a" c="#77A1DD" unit /><RopeChip t="1 · W/W" c="#17667A" /></div>
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', right: -20, bottom: -52, width: 96, height: 96, borderRadius: 22, background: '#DCE7F7', display: 'grid', placeItems: 'center', transform: 'rotate(-6deg)' }}>
              <img src="/illustrations/student-walking-with-thought-bubble-backpack.svg" alt="" style={{ width: '78%', mixBlendMode: 'multiply' }} />
            </div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: mute, maxWidth: 360 }}>Mạch, bài viết và nhận xét của bạn được lưu lại và đồng bộ trên mọi thiết bị.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', padding: '28px 48px 40px' }}>
        <Link href="/home" style={{ alignSelf: 'flex-start', minHeight: 40, display: 'inline-flex', alignItems: 'center', fontSize: 13.5, color: mute }}>← Trang chủ</Link>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', maxWidth: 360, margin: '0 auto' }}>
          <span style={lbl}>Chào mừng trở lại</span>
          <h2 style={{ margin: '14px 0 12px', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 36, letterSpacing: '-0.02em' }}>Đăng nhập</h2>
          <p style={{ margin: '0 0 32px', fontSize: 15, lineHeight: 1.6, color: mute }}>Dùng tài khoản Google để tiếp tục. Không cần mật khẩu.</p>
          {failure && (
            <p role="alert" style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: 10, background: '#FFF0EB', color: '#B33A1A', fontSize: 13.5, lineHeight: 1.5 }}>
              Chưa mở được trang đăng nhập Google. Chi tiết: <code>{failure}</code>
            </p>
          )}
          {error && (
            <p role="alert" style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: 10, background: '#FFF0EB', color: '#B33A1A', fontSize: 13.5, lineHeight: 1.5 }}>
              {/not_allowed|unable_to_create_user/i.test(error) ? 'Tài khoản này chưa được mở quyền dùng thử. Hãy dùng email bạn đã đăng ký.' : 'Chưa đăng nhập được. Thử lại nhé.'}
            </p>
          )}
          <button type="button" disabled={busy} onClick={google} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ width: '100%', height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 12, border: '1px solid ' + (hover ? '#D4D4D4' : '#E5E5E5'), background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: ink, transition: 'border-color .2s', opacity: busy ? 0.6 : 1 }}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" /></svg>
            Tiếp tục với Google
          </button>
          {dev && <button type="button" disabled={busy} onClick={devLogin} style={{ width: '100%', height: 44, marginTop: 10, borderRadius: 12, border: '1px dashed #77A1DD', background: '#EEF3FC', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: '#2F62C4' }}>Đăng nhập thử (chỉ trên máy dev)</button>}
          <p style={{ margin: '20px 0 0', fontSize: 12.5, lineHeight: 1.6, color: soft }}>Lần đầu? Đăng nhập cũng là tạo tài khoản. Miễn phí khi đang beta.</p>
          <p style={{ margin: '12px 0 0', fontSize: 12.5, lineHeight: 1.6, color: soft }}>Khi tiếp tục, bạn đồng ý với <Link href="/terms" style={{ color: mute, textDecoration: 'underline' }}>Điều khoản</Link> và <Link href="/privacy" style={{ color: mute, textDecoration: 'underline' }}>Chính sách quyền riêng tư</Link>.</p>
        </div>
      </div>
      <style>{'@media (max-width: 880px){.login-grid{grid-template-columns:minmax(0,1fr)!important}.login-brand{border-right:none!important;border-bottom:1px solid ' + line + '}}'}</style>
    </div>
  );
}
