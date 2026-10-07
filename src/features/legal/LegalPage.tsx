import Link from 'next/link';
import type { LegalDoc } from '@/content/legal';

const ink = '#141413', mute = '#5C5C56', soft = '#77776F', line = '#E6E4DC';

/** A public page (no sign-in) showing a policy in Vietnamese, then in English. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  const block = (lang: 'vi' | 'en', heading: string) => (
    <section lang={lang} aria-label={heading} style={{ marginTop: 40 }}>
      <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 28, letterSpacing: '-0.02em' }}>{heading}</h2>
      {doc[lang].map((s) => (
        <div key={s.h} style={{ marginTop: 24 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>{s.h}</h3>
          {s.p.map((t) => <p key={t} style={{ margin: '0 0 10px', fontSize: 15, lineHeight: 1.7, color: mute }}>{t}</p>)}
        </div>
      ))}
    </section>
  );
  return (
    <main style={{ minHeight: '100vh', background: '#fff', color: ink, fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px 72px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid ' + line }}>
          <Link href="/" style={{ fontWeight: 600, fontSize: 18, letterSpacing: '-0.02em', color: ink }}>hocnoihocviet</Link>
          <span style={{ display: 'inline-flex', gap: 18, fontSize: 13.5 }}>
            <Link href="/privacy" style={{ color: mute }}>Quyền riêng tư</Link>
            <Link href="/terms" style={{ color: mute }}>Điều khoản</Link>
          </span>
        </nav>
        <h1 style={{ margin: '36px 0 6px', fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.025em' }}>{doc.title}</h1>
        <p style={{ margin: 0, fontSize: 13, color: soft }}>Cập nhật / Last updated: {doc.updated}</p>
        {block('vi', 'Tiếng Việt')}
        {block('en', 'English')}
      </div>
    </main>
  );
}
