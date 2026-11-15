'use client';

import { useCallback, useEffect, useState } from 'react';

interface ModelRow {
  model: string;
  today: { ok: number; limited: number; failed: number; tokens: number; avgMs: number | null };
  week: { ok: number; limited: number; failed: number };
  last: { status: string; at: number | null } | null;
}
interface AiInfo { provider: 'gemini' | 'anthropic' | 'none'; keys: number; custom: boolean; fallback: string | null; models: ModelRow[] }
interface Probe { model: string; status: string; ms: number; note: string }

const num = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const secs = (ms: number | null) => (ms == null ? '—' : (ms / 1000).toFixed(1) + ' s');
const PROBE: Record<string, { label: string; cls: string }> = {
  ok: { label: 'Chạy được', cls: 'ok' }, '429': { label: 'Hết lượt', cls: 'warn' }, '404': { label: 'Sai tên', cls: 'bad' },
  '400': { label: 'Không hỗ trợ', cls: 'bad' }, '401': { label: 'Sai khoá', cls: 'bad' }, '403': { label: 'Sai khoá', cls: 'bad' },
};

/**
 * Admin "Mô hình AI": the provider in use and, for Gemini, each model in rotation order with today's calls (answered,
 * used up, failed), tokens and average time, the last 7 days, and a button that sends one tiny request per model.
 */
export function AiModels() {
  const [info, setInfo] = useState<AiInfo | null>(null);
  const [probe, setProbe] = useState<Record<string, Probe> | null>(null);
  const [probing, setProbing] = useState(false);
  const load = useCallback(async () => {
    try { const r = await fetch('/api/admin/ai', { credentials: 'same-origin' }); if (r.ok) setInfo(await r.json()); } catch { /* keep the last data */ }
  }, []);
  useEffect(() => { load(); }, [load]);
  const runProbe = async () => {
    setProbing(true);
    try {
      const r = await fetch('/api/admin/ai', { method: 'POST', credentials: 'same-origin' });
      if (r.ok) { const d: { results: Probe[] } = await r.json(); setProbe(Object.fromEntries(d.results.map((p) => [p.model, p]))); }
    } catch { /* leave the last result */ }
    setProbing(false);
    load();
  };

  if (!info) return null;
  const answered = info.models.reduce((s, m) => s + m.today.ok, 0);
  return (
    <div className="adm-card" style={{ overflow: 'hidden' }} id="mo-hinh">
      <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <h2 className="adm-h2">Mô hình AI</h2>
          <p className="adm-sub" style={{ margin: '6px 0 0', lineHeight: 1.5 }}>
            {info.provider === 'gemini'
              ? <>Google AI Studio · <span className="adm-num">{info.keys}</span> khoá · thử lần lượt từ trên xuống, mô hình hết lượt thì chuyển sang mô hình sau{info.custom ? ' · danh sách đặt trong GEMINI_MODELS' : ''}.</>
              : info.provider === 'anthropic' ? <>Đang dùng {info.fallback}. Đặt GEMINI_API_KEYS trong Cloudflare để chuyển sang Gemini.</>
              : <>Chưa có khoá AI nào: AI đang tắt.</>}
          </p>
        </div>
        {info.provider === 'gemini' && <button type="button" className="adm-btn sm" onClick={runProbe} disabled={probing}>{probing ? 'Đang kiểm tra…' : 'Kiểm tra từng mô hình'}</button>}
      </div>
      {info.provider === 'gemini' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#FAFAF8' }}>
                <th className="adm-th" scope="col" style={{ textAlign: 'left', padding: '12px 24px' }}>Mô hình</th>
                <th className="adm-th" scope="col" style={{ textAlign: 'right', padding: '12px 12px' }}>Trả lời</th>
                <th className="adm-th" scope="col" style={{ textAlign: 'right', padding: '12px 12px' }}>Hết lượt</th>
                <th className="adm-th" scope="col" style={{ textAlign: 'right', padding: '12px 12px' }}>Lỗi</th>
                <th className="adm-th" scope="col" style={{ textAlign: 'right', padding: '12px 12px' }}>Token</th>
                <th className="adm-th" scope="col" style={{ textAlign: 'right', padding: '12px 12px' }}>TB / lượt</th>
                <th className="adm-th" scope="col" style={{ textAlign: 'left', padding: '12px 24px 12px 12px' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {info.models.map((m, i) => {
                const p = probe?.[m.model];
                const pill = p ? PROBE[p.status] || { label: 'Lỗi ' + p.status, cls: 'bad' } : null;
                return (
                  <tr key={m.model} className="adm-row" style={{ borderTop: '1px solid #F0F0F0' }}>
                    <th scope="row" style={{ textAlign: 'left', padding: '12px 24px', fontWeight: 600 }}>
                      <span className="adm-num" style={{ color: '#A3A3A3', fontWeight: 500, marginRight: 8 }}>{i + 1}</span>{m.model}
                      <div className="adm-sub">7 ngày: <span className="adm-num">{num(m.week.ok)}</span> trả lời · <span className="adm-num">{num(m.week.limited)}</span> hết lượt · <span className="adm-num">{num(m.week.failed)}</span> lỗi</div>
                    </th>
                    <td className="adm-num" style={{ textAlign: 'right', padding: '12px' }}>{num(m.today.ok)}</td>
                    <td className="adm-num" style={{ textAlign: 'right', padding: '12px', color: m.today.limited ? '#2F62C4' : '#A3A3A3' }}>{num(m.today.limited)}</td>
                    <td className="adm-num" style={{ textAlign: 'right', padding: '12px', color: m.today.failed ? '#B33A1A' : '#A3A3A3' }}>{num(m.today.failed)}</td>
                    <td className="adm-num" style={{ textAlign: 'right', padding: '12px', color: '#525252' }}>{m.today.tokens ? num(m.today.tokens) : '—'}</td>
                    <td className="adm-num" style={{ textAlign: 'right', padding: '12px', color: '#525252' }}>{secs(m.today.avgMs)}</td>
                    <td style={{ padding: '12px 24px 12px 12px' }}>
                      {pill ? <span className={'adm-pill ' + pill.cls} title={p!.note || undefined}>{pill.label}{p!.status === 'ok' ? ' · ' + secs(p!.ms) : ''}</span>
                        : m.last ? <span className="adm-sub">Lần cuối: {m.last.status === '200' ? 'trả lời' : m.last.status === '429' ? 'hết lượt' : 'lỗi ' + m.last.status}</span>
                        : <span className="adm-sub">Chưa dùng hôm nay</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="adm-sub" style={{ margin: 0, padding: '12px 24px 18px', lineHeight: 1.5 }}>
            Hôm nay <span className="adm-num">{num(answered)}</span> lượt được trả lời. Số liệu tính theo ngày giờ Việt Nam; hạn mức miễn phí của Google đặt lại lúc nửa đêm giờ California.
            Nút kiểm tra gửi một yêu cầu rất ngắn tới mỗi mô hình, dùng một lượt của mỗi mô hình.
          </p>
        </div>
      )}
    </div>
  );
}
