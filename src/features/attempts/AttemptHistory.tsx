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
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <PageHeader />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '10px 32px 96px', fontFamily: 'var(--font-sans)', color: '#141413' }}>
        <Link href="/writing" style={{ display: 'inline-block', fontSize: 13, fontWeight: 500, color: '#857F70', marginBottom: 32 }}>← Thư viện đề</Link>
        <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 8px' }}>Bài đã viết</h1>
        <p style={{ fontSize: 15, color: '#857F70', margin: '0 0 20px' }}>Mỗi lần bạn bắt đầu một đề là một bài. Mở lại để viết tiếp hoặc xem nhận xét.</p>
        <button type="button" onClick={openSample} disabled={opening} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', borderRadius: 14, border: '1px solid #CDEFE2', background: '#F2FBF7', padding: '14px 20px', margin: '0 0 28px', cursor: 'pointer', fontFamily: 'inherit', color: '#141413' }}>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>Xem một bài chấm mẫu</span>
            <span style={{ display: 'block', fontSize: 12.5, color: '#5C5C56', marginTop: 3 }}>Bài band 7 về du lịch giá rẻ, với dàn ý, điểm từng tiêu chí và nhận xét gắn vào từng chỗ trong bài. Mở ra là một bản của riêng bạn, sửa thoải mái.</span>
          </span>
          <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 600 }}>{opening ? 'Đang mở…' : 'Mở →'}</span>
        </button>
        {failed && <p style={{ fontSize: 14, color: '#8B3A35' }}>Chưa tải được danh sách. Tải lại trang để thử lại.</p>}
        {list && list.length === 0 && (
          <div style={{ borderRadius: 14, border: '1px dashed #DAD8D2', padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>Chưa có bài nào</p>
            <p style={{ fontSize: 13, color: '#857F70', margin: '0 0 18px' }}>Chọn một đề trong thư viện để bắt đầu.</p>
            <Link href="/writing" style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 18px', borderRadius: 10, background: '#141413', color: '#fff', fontSize: 13, fontWeight: 600 }}>Mở thư viện đề</Link>
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
              <Link key={a.id} href={href} className="pl-card" style={{ display: 'flex', gap: 20, alignItems: 'center', borderRadius: 14, border: '1px solid #E6E4DE', padding: '16px 20px', color: '#141413' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 500, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.text}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#77776F' }}>
                    {p.questions.map((x) => (p.questions.length > 1 ? CL_CIRC[x.n - 1] + ' ' : '') + CL_SHAPE_LABEL[x.shape]).join(' · ')}
                    {' · '}{a.chains.length} mạch · {words} từ · lưu {date(a.updatedAt)}
                  </p>
                </div>
                {band != null
                  ? <span style={{ flexShrink: 0, borderRadius: 10, background: 'var(--brand-mint)', padding: '8px 12px', textAlign: 'center' }}><span style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#17664F' }}>BAND</span><span style={{ fontSize: 18, fontWeight: 700 }}>{band.toFixed(1)}</span></span>
                  : <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: '#9A9A93' }}>{words ? 'Chưa nộp' : 'Đang dựng mạch'}</span>}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
