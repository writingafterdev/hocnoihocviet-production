import Link from 'next/link';
import { PageHeader } from '@/components/shell/BrandHeader';
import { GUIDEBOOKS } from './content';

/** Guidebooks list: one tall colour card per guidebook. */
export function GuidebookHome() {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#141413', paddingBottom: 60, fontFamily: 'var(--font-sans)' }}>
      <PageHeader />
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '8px 32px' }}>
        <Link href="/home" style={{ display: 'inline-block', fontSize: 13, fontWeight: 500, color: '#857F70', marginBottom: 28 }}>← Trang chủ</Link>

        <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
            <div style={{ width: 88, height: 88, borderRadius: 18, background: '#62DAB1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src="/assets/illustrations/il-structure.svg" style={{ width: 52, height: 52, objectFit: 'contain' }} alt="" />
            </div>
            <div style={{ paddingTop: 4 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#857F70', margin: '0 0 8px' }}>Tài liệu gốc</p>
              <h1 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, margin: '0 0 14px' }}>Guidebooks</h1>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: '#716D63', maxWidth: 560, margin: 0 }}>Chọn một tài liệu để bắt đầu. Bản đồ cơ học cho từng kỹ năng IELTS.</p>
            </div>
          </div>
        </section>

        <section style={{ paddingTop: 36 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 22px' }}>Danh sách tài liệu</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 18 }}>
            {GUIDEBOOKS.map((g) => (
              <Link key={g.slug} href={'/guidebooks/' + g.slug} className="vb-product" style={{ display: 'flex', flexDirection: 'column', minHeight: 380, borderRadius: 18, padding: '24px 22px 20px', background: g.color, color: '#141413' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ borderRadius: 8, background: 'rgba(255,255,255,0.45)', padding: '5px 10px', fontSize: 11, fontWeight: 600 }}>{g.count} modules</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
                  <img src={g.illustration} style={{ width: 108, height: 108, objectFit: 'contain' }} alt="" />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 8px' }}>{g.name}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(0,0,0,0.65)', margin: '0 0 16px', minHeight: 50 }}>{g.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.15)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Đọc tài liệu</span>
                    <span aria-hidden="true">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
