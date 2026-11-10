'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shell/BrandHeader';
import { findPrompt } from '@/content/prompts';
import { CL_CIRC, CL_SHAPE_LABEL } from '../chainlab/constants';
import { wordCount } from '../desk/scoring';
import { startSampleAttempt } from './start';
import { attemptStore, SignedOutError, type Attempt } from './store';

const date = (t: number) => new Date(t).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** "Bài đã viết": the student's attempts, most recent first. */
export function AttemptHistory() {
  const router = useRouter();
  const [list, setList] = useState<Attempt[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [opening, setOpening] = useState(false);
  const openSample = () => {
    setOpening(true);
    startSampleAttempt().then((url) => router.push(url), (e) => { setOpening(false); if (e instanceof SignedOutError) router.replace('/login?next=/attempts'); else setFailed(true); });
  };

  useEffect(() => {
    attemptStore.list().then(setList, (e) => {
      if (e instanceof SignedOutError) router.replace('/login?next=/attempts'); else setFailed(true);
    });
  }, [router]);

  return (
    <div style={{ minHeight: '100%', background: '#fff' }}>
      <PageHeader />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '22px 32px 96px', fontFamily: 'var(--font-sans)', color: '#171717' }}>
        <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 8px' }}>Bài đã viết</h1>
        <p style={{ fontSize: 15, color: '#737373', margin: '0 0 20px' }}>Mỗi lần bạn bắt đầu một đề là một bài. Mở lại để viết tiếp hoặc xem nhận xét.</p>
        <button type="button" onClick={openSample} disabled={opening} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', borderRadius: 10, border: 'none', boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)', background: '#fff', padding: '14px 20px', margin: '0 0 28px', cursor: 'pointer', fontFamily: 'inherit', color: '#171717' }}>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>Xem một bài chấm mẫu</span>
            <span style={{ display: 'block', fontSize: 12.5, color: '#525252', marginTop: 3 }}>Bài band 7 về du lịch giá rẻ: hai mạch, bài viết, điểm từng tiêu chí và nhận xét chỉ vào câu trong bài và bước trong mạch. Mở ra là một bản của riêng bạn, sửa thoải mái.</span>
          </span>
          <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 600 }}>{opening ? 'Đang mở…' : 'Mở →'}</span>
        </button>
        {failed && <p style={{ fontSize: 14, color: '#B33A1A' }}>Chưa tải được danh sách. Tải lại trang để thử lại.</p>}
        {list && list.length === 0 && (
          <div style={{ borderRadius: 12, background: '#FAFAFA', padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src="/illustrations/woman-with-paper-document-thinking.svg" alt="" style={{ width: 140, height: 140, objectFit: 'contain', mixBlendMode: 'multiply', marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>Chưa có bài nào</p>
            <p style={{ fontSize: 13, color: '#737373', margin: '0 0 18px' }}>Chọn một đề trong thư viện để bắt đầu.</p>
            <Link href="/writing" style={{ display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 14px', borderRadius: 8, background: '#2F62C4', boxShadow: '0 0 0 1px #2453AE', color: '#fff', fontSize: 14, fontWeight: 500 }}>Mở thư viện đề</Link>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(list || []).map((a) => {
            const p = findPrompt(a.promptId);
            if (!p) return null;
            const words = Object.values(a.essay.drafts || {}).reduce((n, t) => n + wordCount(t), 0);
            const band = a.essay.review?.scores.band;
            const href = '/write/' + a.id + (words ? '/essay' : '/chains');
            return (
              <Link key={a.id} href={href} className="pl-card" style={{ display: 'flex', gap: 20, alignItems: 'center', borderRadius: 12, boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)', padding: '16px 20px', color: '#171717' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 500, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.text}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#737373' }}>
                    {p.questions.map((x) => (p.questions.length > 1 ? CL_CIRC[x.n - 1] + ' ' : '') + CL_SHAPE_LABEL[x.shape]).join(' · ')}
                    {' · '}{a.chains.length} thân bài · {words} từ · lưu {date(a.updatedAt)}
                  </p>
                </div>
                {band != null
                  ? <span style={{ flexShrink: 0, borderRadius: 10, background: '#EEF3FC', color: '#2F62C4', padding: '8px 12px', textAlign: 'center' }}><span style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#2D6E1E' }}>BAND</span><span style={{ fontSize: 18, fontWeight: 700 }}>{band.toFixed(1)}</span></span>
                  : <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: '#A3A3A3' }}>{words ? 'Chưa nộp' : 'Đang dựng mạch'}</span>}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
