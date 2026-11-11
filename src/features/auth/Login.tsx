'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authClient, signIn, useSession } from '@/lib/auth-client';
import { AuthCard, AuthMediaCarousel, type AuthMediaSlide } from '@/components/application/auth/auth-card';


/** Only same-site paths are allowed as the post-login destination. */
const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/home');

const SLIDES: AuthMediaSlide[] = [
  { src: '/illustrations/person-typing-essay-on-laptop-digital-writing-or-blogging.svg', tint: '#FFF0EB' },
  { src: '/illustrations/hands-holding-different-charts.svg', tint: '#EEF3FC' },
  { src: '/illustrations/person-studying-different-sciences.svg', tint: '#EDF7EA' },
  { src: '/illustrations/woman-brainstorming-and-choosing-ideas.svg', tint: '#FFF7E1' },
  { src: '/illustrations/man-sitting-on-question-mark-and-thinking.svg', tint: '#FFF0F5' },
];

const alert = 'm-0 mt-4 rounded-[10px] bg-tomato-soft px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-[#B33A1A]';

/** Login: BoardUI's split auth card with our drawings on the right and Google sign-in on the left. */
export function Login({ dev = false }: { dev?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const error = params.get('error');
  const { data: session } = useSession();
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
    <div className="flex min-h-screen flex-col items-center bg-white px-6 py-6 text-ink">
      <Link href="/home" className="mb-auto inline-flex min-h-10 items-center gap-1 self-start text-[13.5px] text-ink-soft hover:text-ink">← Trang chủ</Link>
      <AuthCard
        hideForm
        className="md:min-h-[540px]"
        providers={['google']}
        providerLabel={() => 'Tiếp tục với Google'}
        onProvider={() => { if (!busy) google(); }}
        logo={<span className="text-lg font-semibold tracking-[-0.02em] text-ink">hocnoihocviet</span>}
        title="Đăng nhập"
        description="Dùng tài khoản Google để tiếp tục. Không cần mật khẩu. Lần đầu đăng nhập cũng là tạo tài khoản, miễn phí khi đang beta."
        media={<AuthMediaCarousel slides={SLIDES} />}
        footnote={<>Khi tiếp tục, bạn đồng ý với <Link href="/terms" className="underline">Điều khoản</Link> và <Link href="/privacy" className="underline">Chính sách quyền riêng tư</Link>.</>}
      >
        {failure && <p role="alert" className={alert}>Chưa mở được trang đăng nhập Google. Chi tiết: <code>{failure}</code></p>}
        {error && <p role="alert" className={alert}>{/not_allowed|unable_to_create_user/i.test(error) ? 'Tài khoản này chưa được mở quyền dùng thử. Hãy dùng email bạn đã đăng ký.' : 'Chưa đăng nhập được. Thử lại nhé.'}</p>}
        {dev && <button type="button" disabled={busy} onClick={devLogin} className="mt-3 h-10 w-full cursor-pointer rounded-[10px] border-0 bg-blue-soft text-sm font-semibold text-blue-deep">Đăng nhập thử (chỉ trên máy dev)</button>}
      </AuthCard>
      <div className="mt-auto" />
    </div>
  );
}
