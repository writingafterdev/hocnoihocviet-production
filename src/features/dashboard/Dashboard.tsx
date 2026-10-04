'use client';

import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/ds';
import type { Pillar } from '@/components/ds/ProductCard';
import { PageHeader } from '@/components/shell/BrandHeader';

interface Product {
  id: string;
  href?: string;
  pillar: Pillar;
  badge: string;
  eyebrow: string;
  title: string;
  description: string;
  meta: string;
  illustration: string;
  span: number;
  disabled?: boolean;
}

// Speaking and Reading are switched off for now; the vocab card uses mint while Reading is closed.
const PRODUCTS: Product[] = [
  { id: 'engine', href: '/guidebooks', pillar: 'engine', badge: 'TÀI LIỆU GỐC', eyebrow: 'GUIDEBOOKS', title: 'Sách hướng dẫn', description: 'Phương pháp của The Art of Nuance, tra cứu theo từng công cụ.', meta: '1 tài liệu', illustration: '/assets/illustrations/il-structure.svg', span: 2 },
  { id: 'writing', href: '/writing', pillar: 'writing', badge: 'BETA', eyebrow: 'WRITING FOR IELTS', title: 'Luyện viết Task 2', description: 'Dựng mạch lập luận rồi viết bài, hoặc chép lại bài mẫu từng câu. Chấm theo 4 tiêu chí.', meta: 'Có sẵn', illustration: '/assets/illustrations/il-writing.svg', span: 4 },
  { id: 'vocab', href: '/vocab', pillar: 'reading', badge: 'BETA', eyebrow: 'VOCABULARY', title: 'Từ vựng', description: 'Cụm từ theo chủ đề cho Task 1, Task 2 và Speaking, kèm đoạn văn để luyện dùng.', meta: 'Có sẵn', illustration: '/assets/illustrations/il-knowledge.svg', span: 2 },
  { id: 'speaking', pillar: 'speaking', badge: 'SẮP RA MẮT', eyebrow: 'SPEAKING FOR IELTS', title: 'Luyện nói', description: 'Ngắt nghỉ, nhấn âm và độ dài câu trả lời cho Part 1 đến 3.', meta: 'Đang phát triển', illustration: '/assets/illustrations/il-conversation.svg', span: 2, disabled: true },
  { id: 'reading', pillar: 'reading', badge: 'TẠM ĐÓNG', eyebrow: 'READING ARTICLES', title: 'Đọc báo', description: 'Bài từ The Economist, The New Yorker, The Atlantic.', meta: 'Tạm đóng', illustration: '/assets/illustrations/il-study.svg', span: 2, disabled: true },
];

/** App home: greeting + one card per product. */
export function Dashboard() {
  const router = useRouter();
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#141413', paddingBottom: 60 }}>
      <PageHeader />
      <main style={{ maxWidth: 1060, margin: '0 auto', padding: '10px 24px' }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#857F70', margin: '0 0 12px' }}>CHÀO MỪNG TRỞ LẠI</p>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 42, fontWeight: 500, letterSpacing: '-0.01em', margin: '0 0 6px' }}>Hellooo</h1>
          <p style={{ fontFamily: 'var(--font-sans)', color: '#857F70', fontSize: 15, margin: 0 }}>Hôm nay học gì không?</p>
        </div>
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: 36 }} />
        <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 20 }}>
          {PRODUCTS.map((p) => (
            <div key={p.id} aria-disabled={p.disabled || undefined} className="dash-cell" style={{ gridColumn: 'span ' + p.span, display: 'grid', opacity: p.disabled ? 0.45 : 1, filter: p.disabled ? 'grayscale(1)' : 'none', pointerEvents: p.disabled ? 'none' : 'auto' }}>
              <ProductCard pillar={p.pillar} badge={p.badge} eyebrow={p.eyebrow} title={p.title} description={p.description} meta={p.meta} illustration={p.illustration} onClick={p.disabled ? undefined : () => router.push(p.href)} />
            </div>
          ))}
        </div>
      </main>
      <style>{'@media (max-width: 760px){.dash-grid{grid-template-columns:minmax(0,1fr)!important}.dash-cell{grid-column:auto!important}}'}</style>
    </div>
  );
}
