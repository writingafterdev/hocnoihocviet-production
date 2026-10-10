'use client';

import { useEffect, useState } from 'react';
import { weighSeeds } from './weighSeed';

const sans = 'var(--font-sans)';
const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Admins only: creates one test attempt per prompt type in the admin's own account, with screen ① filled, and links to screen ②. */
export function TestWeighPage() {
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<{ label: string; promptId: string; url: string; ok: boolean }[]>([]);
  useEffect(() => { fetch('/api/admin/me', { credentials: 'same-origin' }).then((r) => r.json()).then((j) => setAdmin(!!j.admin)).catch(() => setAdmin(false)); }, []);

  const create = async () => {
    setBusy(true);
    const out = [];
    for (const t of weighSeeds()) {
      const now = Date.now();
      const a = { id: newId(), promptId: t.promptId, mode: 'free', createdAt: now, updatedAt: now, chains: t.chains, mapExtras: t.mapExtras, stance: '', chainReview: null, essay: { bodies: ['body1', 'body2'], drafts: {}, seconds: 0, review: null } };
      const r = await fetch('/api/attempts/' + a.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(a) });
      out.push({ label: t.label, promptId: t.promptId, url: '/write/' + a.id + '/weigh', ok: r.ok });
    }
    setLinks(out);
    setBusy(false);
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 16px', fontFamily: sans, color: '#141413' }}>
      <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>Bài thử màn ② Cân</h1>
      <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.5, color: '#5C5C56' }}>Tạo 10 bài mới trong tài khoản của bạn, mỗi loại đề một bài, màn ① đã điền sẵn. Mỗi lần bấm tạo một bộ mới.</p>
      {admin === null ? <p style={{ fontSize: 14, color: '#77776F' }}>Đang kiểm tra quyền…</p>
        : !admin ? <p style={{ fontSize: 14, color: '#8B3A35' }}>Chỉ tài khoản quản trị mới dùng được trang này.</p>
        : <button type="button" onClick={create} disabled={busy} style={{ height: 44, padding: '0 20px', borderRadius: 12, border: 'none', background: '#141413', color: '#fff', fontFamily: sans, fontSize: 14, fontWeight: 600, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>{busy ? 'Đang tạo…' : 'Tạo 10 bài thử'}</button>}
      {links.length > 0 && (
        <ol style={{ margin: '24px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {links.map((l, i) => (
            <li key={l.url}>
              <a href={l.url} style={{ display: 'flex', gap: 12, alignItems: 'baseline', borderRadius: 12, border: '1px solid #DEDEDA', padding: '12px 16px', textDecoration: 'none', color: '#141413' }}>
                <span style={{ fontWeight: 700, minWidth: 20 }}>{i + 1}</span>
                <span style={{ flex: 1 }}><b style={{ fontWeight: 600 }}>{l.label}</b><br /><span style={{ fontSize: 12.5, color: '#77776F' }}>{l.promptId}</span></span>
                <span style={{ fontSize: 13, fontWeight: 600, color: l.ok ? '#17664F' : '#8B3A35' }}>{l.ok ? 'Mở màn ② →' : 'Lỗi'}</span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
