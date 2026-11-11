'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shell/BrandHeader';
import { findPrompt, TOPIC_ILLUSTRATION } from '@/content/prompts';
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
      <main style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 32px 24px', fontFamily: 'var(--font-sans)', color: '#171717' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>
          <div style={{ width: 96, height: 96, borderRadius: 12, background: '#EEF3FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/illustrations/finishing-tasks-on-checklist-task-completion-or-productivity-concept.svg" style={{ width: 84, height: 84, objectFit: 'contain', mixBlendMode: 'multiply' }} alt="" />
          </div>
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#737373', margin: '0 0 12px' }}>Của bạn</p>
            <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>Bài đã viết</h1>
          </div>
        </div>
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: 24 }} />
        {failed && <p style={{ fontSize: 14, color: '#B33A1A' }}>Chưa tải được danh sách. Tải lại trang để thử lại.</p>}
        {list && list.length === 0 && (
          <div style={{ borderRadius: 12, background: '#FAFAFA', padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
            <img src="/illustrations/woman-with-paper-document-thinking.svg" alt="" style={{ width: 140, height: 140, objectFit: 'contain', mixBlendMode: 'multiply', marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>Chưa có bài nào</p>
            <p style={{ fontSize: 13, color: '#737373', margin: '0 0 18px' }}>Chọn một đề trong thư viện để bắt đầu.</p>
            <Link href="/writing" className="cl-primary" style={{ display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 14px', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 500 }}>Mở thư viện đề</Link>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* The worked sample first: the same card as the prompts in the library. */}
          <button type="button" onClick={openSample} disabled={opening} className="pl-card" style={{ display: 'flex', padding: 12, textAlign: 'left', fontFamily: 'inherit', color: '#171717', background: '#fff', border: 'none', cursor: 'pointer', borderRadius: 12, boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 136, height: 96, borderRadius: 8, background: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/illustrations/cv-of-a-perfect-candidate.svg" alt="" style={{ width: 84, height: 84, objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
            <div style={{ flex: 1, padding: '4px 16px', alignSelf: 'center' }}>
              <span style={{ borderRadius: 4, background: '#EEF3FC', padding: '4px 8px', fontSize: 12, fontWeight: 600, color: '#2F62C4' }}>Bài mẫu · band 7</span>
              <p style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.55, margin: '10px 0 0' }}>Xem một bài chấm mẫu</p>
            </div>
            <span style={{ alignSelf: 'center', paddingRight: 12, fontSize: 13, fontWeight: 600 }}>{opening ? 'Đang mở…' : 'Mở →'}</span>
          </button>
          {(list || []).map((a) => {
            const p = findPrompt(a.promptId);
            if (!p) return null;
            const words = Object.values(a.essay.drafts || {}).reduce((n, t) => n + wordCount(t), 0);
            const band = a.essay.review?.scores.band;
            const href = '/write/' + a.id + (words ? '/essay' : '/chains');
            return (
              <Link key={a.id} href={href} className="pl-card" style={{ display: 'flex', alignItems: 'stretch', padding: 12, borderRadius: 12, boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)', color: '#171717', background: '#fff' }}>
                <div style={{ width: 136, minHeight: 132, borderRadius: 8, background: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={'/illustrations/' + TOPIC_ILLUSTRATION[p.topic] + '.svg'} alt="" style={{ width: 112, height: 112, objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, padding: '4px 16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ borderRadius: 4, background: '#F5F5F5', padding: '4px 8px', fontSize: 12, fontWeight: 600, color: '#525252' }}>{p.category}</span>
                    <span style={{ borderRadius: 4, background: '#EDF7EA', padding: '4px 8px', fontSize: 12, fontWeight: 600, color: '#167A59' }}>{p.topic}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.55, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.text}</p>
                  <p style={{ margin: 'auto 0 0', paddingTop: 10, fontSize: 12, color: '#737373' }}>{a.chains.length} thân bài · {words} từ · lưu {date(a.updatedAt)}</p>
                </div>
                {/* The score fills the card's whole height, like the picture does on the left. */}
                <div style={{ width: 132, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, textAlign: 'center', padding: 8 }}>
                  {band != null ? (
                    <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: '#2F62C4', fontVariantNumeric: 'tabular-nums' }}>{band.toFixed(1)}</span>
                  ) : <span style={{ fontSize: 13, fontWeight: 600, color: '#737373' }}>{words ? 'Chưa nộp' : 'Đang dựng mạch'}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
