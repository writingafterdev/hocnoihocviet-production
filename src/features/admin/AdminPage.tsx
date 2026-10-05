'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { PageHeader } from '@/components/shell/BrandHeader';
import './admin.css';

const KIND_NAME: Record<string, string> = { essay: 'Chấm bài viết', chain: 'Soát mạch', translate: 'Dịch', vocab: 'Từ vựng' };
const ERROR_NAME: Record<string, string> = { upstream: 'Nhà cung cấp AI báo lỗi', timeout: 'AI trả lời quá lâu', bad_output: 'AI trả về kết quả lỗi', refused: 'AI từ chối nội dung', not_configured: 'AI chưa được bật' };

interface Overview {
  generatedAt: number;
  students: { total: number; newThisWeek: number; active7d: number };
  today: { essays: number; essayAtLimit: number; uses: number; tokens: number; activeStudents: number };
  series: { day: string; total: number }[];
  features: { kind: string; limit: number; uses: number; students: number; atLimit: number; tokensIn: number; tokensOut: number }[];
  errors: { total24h: number; byCode: Record<string, number>; recent: { code: string; route: string | null; n: number; last: number; detail: string | null }[] };
  health: { apiKey: boolean; model: string; endpoint: string; decisionModel: boolean; migrations: number | null };
  content: { samplesHave: number; promptsTotal: number; byCategory: { category: string; total: number; have: number }[] };
  loop: { resubmitted: number; avgBandChange: number | null };
  savedTopics: { topic: string; n: number }[];
}
interface Student { id: string; name: string; email: string; lastActive: number | null; essays: number; chains: number; vocab: number; usedToday: number }
interface StudentPage { total: number; limit: number; items: Student[] }

const num = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const VN = 7 * 3600_000;
const dayOf = (ms: number) => Math.floor((ms + VN) / 86_400_000);
const hhmm = (ms: number) => new Date(ms + VN).toISOString().slice(11, 16);
const dm = (ms: number) => { const d = new Date(ms + VN); return d.getUTCDate() + '/' + (d.getUTCMonth() + 1); };
/** "Hôm nay, 14:20" · "Hôm qua" · "3 ngày trước" · "5/10". */
const since = (ms: number | null) => {
  if (!ms) return 'Chưa có';
  const diff = dayOf(Date.now()) - dayOf(ms);
  return diff <= 0 ? 'Hôm nay, ' + hhmm(ms) : diff === 1 ? 'Hôm qua' : diff < 7 ? diff + ' ngày trước' : dm(ms);
};
const WEEKDAY = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const dateLine = (ms: number) => { const d = new Date(ms + VN); return WEEKDAY[d.getUTCDay()] + ', ' + d.getUTCDate() + ' tháng ' + (d.getUTCMonth() + 1); };

const Icon = ({ children }: { children: ReactNode }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;

function Stat({ label, value, tone, children }: { label: string; value: string; tone?: string; children: ReactNode }) {
  return (
    <div className="ad-card" style={{ padding: '22px 24px' }}>
      <div className="ad-label">{label}</div>
      <div className="ad-num" style={{ marginTop: 12, fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: tone }}>{value}</div>
      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 13, color: '#5C5C56' }}>{children}</div>
    </div>
  );
}

export function AdminPage() {
  const router = useRouter();
  const [ov, setOv] = useState<Overview | null>(null);
  const [days, setDays] = useState(14);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [sp, setSp] = useState<StudentPage | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [offset, setOffset] = useState(0);
  const PAGE = 10;
  const reqId = useRef(0);

  const loadOverview = useCallback(async (d: number) => {
    try {
      const r = await fetch('/api/admin/overview?days=' + d, { credentials: 'same-origin' });
      if (r.status === 401) return router.replace('/login?next=/admin');
      if (r.status === 404) return setState('missing');
      if (!r.ok) return setState('error');
      setOv(await r.json()); setState('ready');
    } catch { setState('error'); }
  }, [router]);
  const loadStudents = useCallback(async (query: string, f: string, off: number) => {
    const id = ++reqId.current;
    try {
      const r = await fetch('/api/admin/students?' + new URLSearchParams({ q: query, filter: f, offset: String(off), limit: String(PAGE) }), { credentials: 'same-origin' });
      if (r.ok && id === reqId.current) setSp(await r.json());
    } catch { /* keep the previous page */ }
  }, []);

  useEffect(() => { loadOverview(days); }, [days, loadOverview]);
  // Search waits a moment after typing; filters and paging load at once.
  useEffect(() => { const t = setTimeout(() => loadStudents(q, filter, offset), q ? 250 : 0); return () => clearTimeout(t); }, [q, filter, offset, loadStudents]);
  const refresh = () => { loadOverview(days); loadStudents(q, filter, offset); };

  const exportCsv = async () => {
    const rows: string[][] = [['Tên', 'Email', 'Hoạt động gần nhất', 'Bài đã chấm', 'Soát mạch', 'Từ đã lưu']];
    for (let off = 0; off < 1000; off += 50) {
      const r = await fetch('/api/admin/students?' + new URLSearchParams({ q, filter, offset: String(off), limit: '50' }), { credentials: 'same-origin' });
      if (!r.ok) break;
      const page: StudentPage = await r.json();
      page.items.forEach((s) => rows.push([s.name, s.email, s.lastActive ? new Date(s.lastActive).toISOString() : '', String(s.essays), String(s.chains), String(s.vocab)]));
      if (off + 50 >= page.total) break;
    }
    const csv = rows.map((r) => r.map((c) => '"' + c.replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'hoc-vien.csv'; a.click(); URL.revokeObjectURL(a.href);
  };

  if (state === 'missing') {
    return <div style={{ minHeight: '100vh', background: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-sans)', color: '#77776F' }}>Không tìm thấy trang này.</div>;
  }
  const head = <PageHeader />;
  if (state !== 'ready' || !ov) {
    return <div className="ad" style={{ minHeight: '100vh', background: '#fff' }}>{head}<p style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 40px', fontSize: 14, color: state === 'error' ? '#8B3A35' : '#77776F' }} role={state === 'error' ? 'alert' : undefined}>{state === 'error' ? 'Không tải được số liệu. Thử tải lại trang.' : 'Đang tải…'}</p></div>;
  }

  const peak = Math.max(10, ...ov.series.map((s) => s.total));
  const ymax = Math.ceil(peak / 20) * 20, plot = 156;
  const grid = [0, 1, 2, 3, 4].map((i) => ({ v: Math.round((ymax / 4) * i), bottom: Math.round(((ymax / 4) * i / ymax) * plot) }));
  const missing = ov.content.promptsTotal - ov.content.samplesHave;
  const errCodes = Object.entries(ov.errors.byCode).sort((a, b) => b[1] - a[1]);
  const totalPages = sp ? Math.max(1, Math.ceil(sp.total / PAGE)) : 1;
  const th = (t: string, extra?: React.CSSProperties) => <div role="columnheader" className="ad-th" style={{ padding: '12px 16px', ...extra }}>{t}</div>;
  const COLS = 'minmax(240px, 2.2fr) minmax(150px, 1.3fr) 96px 96px 96px minmax(180px, 1.4fr)';

  return (
    <div className="ad" style={{ minHeight: '100vh', background: '#fff' }}>
      {head}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 40px 80px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        <section id="tong-quan" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <p className="ad-label" style={{ margin: '0 0 8px', letterSpacing: '.2em', color: '#857F70' }}>Quản trị · {dateLine(ov.generatedAt)}</p>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 38, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05 }}>Tổng quan</h1>
              <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.6, color: '#716D63', maxWidth: 560 }}>Học viên, lượt dùng AI, lỗi và nội dung, cập nhật lúc <span className="ad-num">{hhmm(ov.generatedAt)}</span>.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {[7, 14, 30].map((d) => <button key={d} type="button" className="ad-btn" aria-pressed={days === d} onClick={() => setDays(d)}>{d} ngày</button>)}
              <button type="button" className="ad-btn icon" aria-label="Tải lại số liệu" onClick={refresh}><Icon><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></Icon></button>
            </div>
          </div>
          <nav className="ad-tabs" aria-label="Các mục quản trị" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 16, borderTop: '1px solid #ECECEA' }}>
            <a href="#tong-quan">Tổng quan</a><a href="#ai">Dùng AI</a><a href="#hoc-vien">Học viên</a><a href="#noi-dung">Nội dung</a>
          </nav>
        </section>

        <section aria-label="Số liệu chính" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          <Stat label="Học viên" value={num(ov.students.total)}>
            {ov.students.newThisWeek > 0 && <span className="ad-pill ok">+{ov.students.newThisWeek} tuần này</span>}
            <span><span className="ad-num">{ov.students.active7d}</span> hoạt động 7 ngày qua</span>
          </Stat>
          <Stat label="Bài đã chấm hôm nay" value={num(ov.today.essays)}>
            <span><span className="ad-num">{ov.today.essayAtLimit}</span> học viên đã dùng hết lượt chấm</span>
          </Stat>
          <Stat label="Lượt dùng AI hôm nay" value={num(ov.today.uses)}>
            <span><span className="ad-num">{num(ov.today.tokens)}</span> token (chưa gồm chấm bài)</span>
          </Stat>
          <Stat label="Lỗi AI trong 24 giờ" value={num(ov.errors.total24h)} tone={ov.errors.total24h ? '#D5452E' : undefined}>
            {errCodes.length ? errCodes.map(([c, n]) => <span key={c} className="ad-pill bad">{c} ×{n}</span>) : <span className="ad-pill ok">Không có lỗi</span>}
          </Stat>
        </section>

        <section id="ai" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: '999 1 600px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="ad-card" style={{ padding: '22px 24px 20px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <h2 className="ad-h2">Lượt dùng AI theo ngày</h2>
                <span style={{ fontSize: 13, color: '#77776F' }}>Cao nhất <span className="ad-num">{peak}</span> lượt · hôm nay tính đến <span className="ad-num">{hhmm(ov.generatedAt)}</span></span>
              </div>
              <div role="img" aria-label={'Lượt dùng AI mỗi ngày trong ' + days + ' ngày'} style={{ position: 'relative', height: 200, marginTop: 24 }}>
                {grid.map((g) => (
                  <div key={g.v} style={{ position: 'absolute', left: 0, right: 0, bottom: g.bottom, borderTop: '1px solid #ECECEA' }}>
                    <span className="ad-num" style={{ position: 'absolute', left: 0, bottom: 3, fontSize: 11, color: '#9A9A93' }}>{g.v}</span>
                  </div>
                ))}
                <div style={{ position: 'absolute', left: 36, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'flex-end', gap: days > 14 ? 3 : 6 }}>
                  {ov.series.map((s, i) => (
                    <div key={s.day} style={{ flex: '1 1 0', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      {days <= 14 && <span className="ad-num" style={{ fontSize: 11, color: '#5C5C56' }}>{s.total}</span>}
                      <div title={s.day + ': ' + s.total} style={{ width: '100%', maxWidth: 40, height: Math.round((s.total / ymax) * plot), minHeight: s.total ? 2 : 0, background: i === ov.series.length - 1 ? '#1FA97A' : '#62DAB1', borderRadius: '6px 6px 0 0' }} />
                    </div>
                  ))}
                </div>
              </div>
              <div aria-hidden="true" style={{ display: 'flex', gap: days > 14 ? 3 : 6, margin: '8px 0 0 36px' }}>
                {ov.series.map((s, i) => <span key={s.day} className="ad-num" style={{ flex: '1 1 0', minWidth: 0, textAlign: 'center', fontSize: 11, color: '#77776F', overflow: 'hidden' }}>{days <= 14 || i % 3 === 0 || i === ov.series.length - 1 ? s.day.slice(8).replace(/^0/, '') + '/' + s.day.slice(5, 7).replace(/^0/, '') : ''}</span>)}
              </div>
            </div>

            <div className="ad-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px 16px' }}><h2 className="ad-h2">Theo tính năng hôm nay</h2></div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#F4F4F2' }}>
                      <th className="ad-th" scope="col" style={{ textAlign: 'left', padding: '12px 24px' }}>Tính năng</th>
                      <th className="ad-th" scope="col" style={{ textAlign: 'right', padding: '12px 16px' }}>Lượt</th>
                      <th className="ad-th" scope="col" style={{ textAlign: 'right', padding: '12px 16px' }}>Token vào / ra</th>
                      <th className="ad-th" scope="col" style={{ textAlign: 'left', padding: '12px 16px', width: 220 }}>Chạm giới hạn ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ov.features.map((f) => (
                      <tr key={f.kind} className="ad-row" style={{ borderTop: '1px solid #ECECEA' }}>
                        <th scope="row" style={{ textAlign: 'left', padding: '14px 24px', fontWeight: 600 }}>{KIND_NAME[f.kind]}<div className="ad-sub">{f.limit} lượt mỗi người mỗi ngày</div></th>
                        <td className="ad-num" style={{ textAlign: 'right', padding: '14px 16px' }}>{num(f.uses)}</td>
                        <td className="ad-num" style={{ textAlign: 'right', padding: '14px 16px', color: '#5C5C56' }}>{f.tokensIn + f.tokensOut ? num(f.tokensIn) + ' / ' + num(f.tokensOut) : '—'}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div className={'ad-bar' + (f.atLimit ? ' red' : '')}><i style={{ width: (f.students ? Math.max(f.atLimit ? 4 : 0, Math.round((f.atLimit / f.students) * 100)) : 0) + '%' }} /></div>
                          <div className="ad-sub" style={{ marginTop: 6 }}><span className="ad-num">{f.atLimit}</span> / <span className="ad-num">{f.students}</span> học viên đã dùng</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="ad-card" style={{ padding: '22px 24px' }}>
              <h2 className="ad-h2">Sức khoẻ hệ thống</h2>
              <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0 }}>
                <li className="ad-li"><span style={{ flexGrow: 1, fontSize: 14, fontWeight: 500 }}>Khoá API<div className="ad-sub">{ov.health.apiKey ? 'Đã đặt trong Cloudflare' : 'Chưa đặt: AI đang tắt'}</div></span><span className={'ad-pill ' + (ov.health.apiKey ? 'ok' : 'bad')}><i className="ad-dot" />{ov.health.apiKey ? 'Ổn' : 'Thiếu'}</span></li>
                <li className="ad-li"><span style={{ flexGrow: 1, minWidth: 0, fontSize: 14, fontWeight: 500 }}>Mô hình đang dùng<div className="ad-sub" style={{ overflowWrap: 'anywhere' }}>{ov.health.model} · {ov.health.endpoint}</div></span><span className={'ad-pill ' + (ov.health.model.startsWith('claude-') ? 'ok' : 'info')}>{ov.health.model.startsWith('claude-') ? 'Claude' : 'Thử nghiệm'}</span></li>
                <li className="ad-li"><span style={{ flexGrow: 1, fontSize: 14, fontWeight: 500 }}>Mô hình phân nhóm từ vựng<div className="ad-sub">{ov.health.decisionModel ? 'Đã cấu hình' : 'Chưa cấu hình: dùng nhóm có sẵn'}</div></span><span className={'ad-pill ' + (ov.health.decisionModel ? 'ok' : 'idle')}>{ov.health.decisionModel ? 'Bật' : 'Tắt'}</span></li>
                <li className="ad-li"><span style={{ flexGrow: 1, fontSize: 14, fontWeight: 500 }}>Cơ sở dữ liệu<div className="ad-sub">{ov.health.migrations != null ? <><span className="ad-num">{ov.health.migrations}</span> bản cập nhật cấu trúc đã chạy</> : 'Không đọc được danh sách bản cập nhật'}</div></span><span className={'ad-pill ' + (ov.health.migrations != null ? 'ok' : 'warn')}><i className="ad-dot" />{ov.health.migrations != null ? 'Ổn' : 'Kiểm tra'}</span></li>
              </ul>
            </div>

            <div className="ad-card" style={{ padding: '22px 24px' }}>
              <h2 className="ad-h2">Lỗi gần đây</h2>
              {ov.errors.recent.length ? (
                <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0 }}>
                  {ov.errors.recent.map((e) => (
                    <li key={e.code + (e.route || '')} className="ad-li" style={{ alignItems: 'flex-start' }}>
                      <span className="ad-num" style={{ flexShrink: 0, fontSize: 12, color: '#77776F', paddingTop: 3 }}>{dayOf(e.last) === dayOf(Date.now()) ? hhmm(e.last) : dm(e.last)}</span>
                      <span style={{ flexGrow: 1, minWidth: 0, fontSize: 14, fontWeight: 500 }}>{ERROR_NAME[e.code] || e.code}<div className="ad-sub" style={{ overflowWrap: 'anywhere' }}>{(e.route || 'không rõ') + (e.detail ? ' · ' + e.detail : '')}</div></span>
                      <span className={'ad-pill ' + (e.code === 'bad_output' ? 'warn' : 'bad')}>×{e.n}</span>
                    </li>
                  ))}
                </ul>
              ) : <p style={{ margin: '14px 0 0', fontSize: 14, color: '#5C5C56' }}>Chưa có lỗi nào trong 7 ngày qua.</p>}
              <p className="ad-sub" style={{ margin: '14px 0 0', lineHeight: 1.5 }}>Lỗi vượt giới hạn CPU của Worker không ghi được ở đây. Xem trong Cloudflare, mục Logs.</p>
            </div>
          </div>
        </section>

        <section id="hoc-vien">
          <div className="ad-card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px', padding: '20px 24px' }}>
              <h2 className="ad-h2" style={{ flexGrow: 1 }}>Học viên</h2>
              <label style={{ position: 'relative', flex: '0 1 280px', minWidth: 200, display: 'block' }}>
                <span className="ad-sr">Tìm học viên</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#77776F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'absolute', left: 12, top: 12 }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                <input className="ad-field" type="search" placeholder="Tìm theo tên hoặc email" value={q} onChange={(e) => { setQ(e.target.value); setOffset(0); }} style={{ width: '100%', paddingLeft: 36 }} />
              </label>
              <label style={{ display: 'block', flex: '0 0 190px' }}>
                <span className="ad-sr">Lọc học viên</span>
                <select className="ad-field" value={filter} onChange={(e) => { setFilter(e.target.value); setOffset(0); }} style={{ width: '100%' }}>
                  <option value="all">Tất cả học viên</option><option value="active">Hoạt động 7 ngày</option><option value="limit">Đã chạm giới hạn</option><option value="idle">Chưa dùng AI</option>
                </select>
              </label>
              <button type="button" className="ad-btn" onClick={exportCsv}><Icon><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Icon>Xuất CSV</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <div role="table" aria-label="Danh sách học viên" style={{ minWidth: 820, fontSize: 14 }}>
                <div role="row" style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', background: '#F4F4F2' }}>
                  {th('Học viên', { paddingLeft: 24 })}{th('Hoạt động gần nhất')}{th('Bài đã chấm', { textAlign: 'right' })}{th('Soát mạch', { textAlign: 'right' })}{th('Từ đã lưu', { textAlign: 'right' })}{th('Lượt chấm hôm nay', { paddingRight: 24 })}
                </div>
                {sp && sp.items.map((s) => (
                  <div key={s.id} role="row" className="ad-row" style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', borderTop: '1px solid #ECECEA' }}>
                    <div role="rowheader" style={{ padding: '14px 16px 14px 24px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <span aria-hidden="true" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 999, background: '#F4F4F2', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, color: '#44443F' }}>{s.name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase()}</span>
                      <span style={{ minWidth: 0 }}><span style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{s.name}</span><div className="ad-sub">{s.email}</div></span>
                    </div>
                    <div role="cell" style={{ padding: '14px 16px', color: '#5C5C56' }}>{since(s.lastActive)}</div>
                    <div role="cell" className="ad-num" style={{ padding: '14px 16px', textAlign: 'right' }}>{s.essays}</div>
                    <div role="cell" className="ad-num" style={{ padding: '14px 16px', textAlign: 'right' }}>{s.chains}</div>
                    <div role="cell" className="ad-num" style={{ padding: '14px 16px', textAlign: 'right' }}>{s.vocab}</div>
                    <div role="cell" style={{ padding: '14px 24px 14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={'ad-bar' + (s.usedToday >= (sp.limit || 5) ? ' red' : '')} style={{ flexGrow: 1 }}><i style={{ width: Math.min(100, (s.usedToday / (sp.limit || 5)) * 100) + '%' }} /></div>
                      <span className="ad-num" style={{ fontSize: 12, color: '#77776F' }}>{s.usedToday}/{sp.limit || 5}</span>
                    </div>
                  </div>
                ))}
                {sp && !sp.items.length && <div style={{ padding: '28px 24px', borderTop: '1px solid #ECECEA', fontSize: 14, color: '#77776F' }}>Không có học viên nào khớp.</div>}
                {!sp && <div style={{ padding: '28px 24px', borderTop: '1px solid #ECECEA', fontSize: 14, color: '#77776F' }}>Đang tải…</div>}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 24px', borderTop: '1px solid #ECECEA', fontSize: 13, color: '#77776F' }}>
              <span>{sp && sp.total ? <>Hiện <span className="ad-num">{offset + 1}–{offset + sp.items.length}</span> trên <span className="ad-num">{sp.total}</span> học viên</> : 'Không có học viên'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="button" className="ad-btn sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Trang trước</button>
                <span className="ad-num">{Math.floor(offset / PAGE) + 1} / {totalPages}</span>
                <button type="button" className="ad-btn sm" disabled={!sp || offset + PAGE >= sp.total} onClick={() => setOffset(offset + PAGE)}>Trang sau</button>
              </span>
            </div>
          </div>
        </section>

        <section id="noi-dung" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
          <div className="ad-card" style={{ flex: '1 1 480px', minWidth: 0, padding: '22px 24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <h2 className="ad-h2">Bài mẫu Chép mẫu</h2>
              <span style={{ fontSize: 13, color: '#77776F' }}><span className="ad-num">{ov.content.samplesHave}</span> trên <span className="ad-num">{ov.content.promptsTotal}</span> đề đã có</span>
            </div>
            <div className="ad-bar green" style={{ height: 8, marginTop: 18 }}><i style={{ width: (ov.content.promptsTotal ? (ov.content.samplesHave / ov.content.promptsTotal) * 100 : 0) + '%' }} /></div>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ov.content.byCategory.map((c) => (
                <div key={c.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, marginBottom: 6 }}><span>{c.category}</span><span className="ad-num" style={{ color: '#77776F' }}>{c.have} / {c.total}</span></div>
                  <div className="ad-bar"><i style={{ width: (c.total ? (c.have / c.total) * 100 : 0) + '%' }} /></div>
                </div>
              ))}
            </div>
            <p style={{ margin: '24px 0 0', fontSize: 13, color: '#77776F' }}>{missing > 0 ? <>Còn <span className="ad-num">{missing}</span> đề chưa có bài mẫu.</> : 'Mọi đề đã có bài mẫu.'}</p>
          </div>
          <div className="ad-card" style={{ flex: '1 1 320px', minWidth: 0, padding: '22px 24px' }}>
            <h2 className="ad-h2">Vòng Sửa bài</h2>
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
              <div><div className="ad-num" style={{ fontSize: 32, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.03em' }}>{ov.loop.resubmitted}</div><div style={{ marginTop: 8, fontSize: 13, color: '#5C5C56' }}>bài nộp lại sau khi sửa</div></div>
              <div><div className="ad-num" style={{ fontSize: 32, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.03em', color: ov.loop.avgBandChange != null && ov.loop.avgBandChange > 0 ? '#1FA97A' : undefined }}>{ov.loop.avgBandChange == null ? '—' : (ov.loop.avgBandChange > 0 ? '+' : '') + String(ov.loop.avgBandChange).replace('.', ',')}</div><div style={{ marginTop: 8, fontSize: 13, color: '#5C5C56' }}>band thay đổi trung bình</div></div>
            </div>
            <div style={{ height: 1, background: '#ECECEA', margin: '20px 0' }} />
            <h3 className="ad-h2" style={{ fontSize: 14 }}>Từ đã lưu từ Dịch</h3>
            {ov.savedTopics.length ? (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>{ov.savedTopics.map((t) => <span key={t.topic} className="ad-pill idle">{t.topic} · {t.n}</span>)}</div>
            ) : <p style={{ margin: '12px 0 0', fontSize: 13, color: '#77776F' }}>Chưa ai lưu từ nào.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
