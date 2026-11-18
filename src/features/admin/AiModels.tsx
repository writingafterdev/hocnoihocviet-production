'use client';

import { useCallback, useEffect, useState } from 'react';

interface ModelRow {
  model: string;
  today: { ok: number; limited: number; failed: number; tokens: number; avgMs: number | null };
  week: { ok: number; limited: number; failed: number };
  last: { status: string; at: number | null } | null;
}
interface KeyRow { n: number; tail: string; today: { ok: number; limited: number; bad: number }; last: { status: string; at: number | null } | null }
interface KeyProbe { n: number; tail: string; model: string; status: string; ms: number; note: string }
interface AiInfo { provider: 'gemini' | 'anthropic' | 'none'; keys: number; keyList?: KeyRow[]; custom: boolean; fallback: string | null; models: ModelRow[] }
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
  const [keyProbe, setKeyProbe] = useState<Record<number, KeyProbe> | null>(null);
  const [probingKeys, setProbingKeys] = useState(false);
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

  const runKeyProbe = async () => {
    setProbingKeys(true);
    try {
      const r = await fetch('/api/admin/ai?what=keys', { method: 'POST', credentials: 'same-origin' });
      if (r.ok) { const d: { keys: KeyProbe[] } = await r.json(); setKeyProbe(Object.fromEntries(d.keys.map((p) => [p.n, p]))); }
    } catch { /* leave the last result */ }
    setProbingKeys(false);
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
              ? <>Google AI Studio · <span className="adm-num">{info.keys}</span> khoá · mỗi lượt bắt đầu ở một khoá khác nhau; khoá hết lượt thì sang khoá sau, mọi khoá hết lượt thì sang mô hình sau{info.custom ? ' · danh sách đặt trong GEMINI_MODELS' : ''}.</>
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
                      {pill ? <span className={'adm-pill ' + pill.cls}>{pill.label}{p!.status === 'ok' ? ' · ' + secs(p!.ms) : ''}</span>
                        : m.last ? <span className="adm-sub">Lần cuối: {m.last.status === '200' ? 'trả lời' : m.last.status.startsWith('429') ? 'hết lượt' : 'lỗi ' + m.last.status.split(':')[0]}</span>
                        : <span className="adm-sub">Chưa dùng hôm nay</span>}
                      {/* Google's own words for a failure: shown, not hidden in a tooltip. */}
                      {(p && p.status !== 'ok' && p.note) || (!p && m.last && m.last.status.includes(': ')) ? <div className="adm-sub" style={{ marginTop: 4, maxWidth: 280, overflowWrap: 'anywhere', color: '#B33A1A' }}>{p ? p.note : m.last!.status.slice(m.last!.status.indexOf(': ') + 2)}</div> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!!info.keyList?.length && <KeyTable keys={info.keyList} probe={keyProbe} probing={probingKeys} onProbe={runKeyProbe} />}
          <p className="adm-sub" style={{ margin: 0, padding: '12px 24px 18px', lineHeight: 1.5 }}>
            Hôm nay <span className="adm-num">{num(answered)}</span> lượt được trả lời. Số liệu tính theo ngày giờ Việt Nam; hạn mức miễn phí của Google đặt lại lúc nửa đêm giờ California.
            Nút kiểm tra gửi một yêu cầu rất ngắn tới mỗi mô hình, dùng một lượt của mỗi mô hình.
          </p>
        </div>
      )}
    </div>
  );
}

/** What a key's last call or probe says, in words. */
function keyState(status: string): { label: string; cls: string } {
  if (status === 'ok' || status.startsWith('200')) return { label: 'Dùng được', cls: 'ok' };
  if (status.startsWith('429')) return { label: 'Hết lượt', cls: 'warn' };
  if (/^(400|401|403)/.test(status)) return { label: 'Khoá sai', cls: 'bad' };
  return { label: 'Lỗi ' + status.split(/[ :·]/)[0], cls: 'bad' };
}

/**
 * "Khoá API": each Gemini key by its last 4 characters, with today's answered, used-up and refused calls and its state
 * (from the last call, or from "Kiểm tra từng khoá", which sends one tiny request per key on a Flash Lite model).
 */
function KeyTable({ keys, probe, probing, onProbe }: { keys: KeyRow[]; probe: Record<number, KeyProbe> | null; probing: boolean; onProbe: () => void }) {
  return (
    <div style={{ borderTop: '1px solid #F0F0F0' }}>
      <div style={{ padding: '16px 24px 10px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h3 className="adm-h2" style={{ fontSize: 15, margin: 0, flexGrow: 1 }}>Khoá API</h3>
        <button type="button" className="adm-btn sm" onClick={onProbe} disabled={probing}>{probing ? 'Đang kiểm tra…' : 'Kiểm tra từng khoá'}</button>
      </div>
      <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#FAFAF8' }}>
            <th className="adm-th" scope="col" style={{ textAlign: 'left', padding: '12px 24px' }}>Khoá</th>
            <th className="adm-th" scope="col" style={{ textAlign: 'right', padding: '12px 12px' }}>Trả lời</th>
            <th className="adm-th" scope="col" style={{ textAlign: 'right', padding: '12px 12px' }}>Hết lượt</th>
            <th className="adm-th" scope="col" style={{ textAlign: 'right', padding: '12px 12px' }}>Bị từ chối</th>
            <th className="adm-th" scope="col" style={{ textAlign: 'left', padding: '12px 24px 12px 12px' }}>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => {
            const p = probe?.[k.n];
            const state = p ? keyState(p.status) : k.last ? keyState(k.last.status) : null;
            const note = p ? (p.status !== 'ok' ? p.note : 'Thử bằng ' + p.model + ' · ' + secs(p.ms)) : k.last && !k.last.status.startsWith('200') ? k.last.status.replace(/^\d+ · /, '') : '';
            return (
              <tr key={k.n} className="adm-row" style={{ borderTop: '1px solid #F0F0F0' }}>
                <th scope="row" style={{ textAlign: 'left', padding: '12px 24px', fontWeight: 600 }}>
                  <span className="adm-num" style={{ color: '#A3A3A3', fontWeight: 500, marginRight: 8 }}>{k.n}</span>Khoá {k.n} <span className="adm-num" style={{ color: '#737373', fontWeight: 500 }}>· …{k.tail}</span>
                </th>
                <td className="adm-num" style={{ textAlign: 'right', padding: '12px' }}>{num(k.today.ok)}</td>
                <td className="adm-num" style={{ textAlign: 'right', padding: '12px', color: k.today.limited ? '#2F62C4' : '#A3A3A3' }}>{num(k.today.limited)}</td>
                <td className="adm-num" style={{ textAlign: 'right', padding: '12px', color: k.today.bad ? '#B33A1A' : '#A3A3A3' }}>{num(k.today.bad)}</td>
                <td style={{ padding: '12px 24px 12px 12px' }}>
                  {state ? <span className={'adm-pill ' + state.cls}>{state.label}</span> : <span className="adm-sub">Chưa dùng hôm nay</span>}
                  {note && <div className="adm-sub" style={{ marginTop: 4, maxWidth: 300, overflowWrap: 'anywhere', color: state?.cls === 'ok' ? undefined : '#B33A1A' }}>{note}</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
