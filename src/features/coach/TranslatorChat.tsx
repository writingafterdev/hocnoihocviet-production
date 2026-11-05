'use client';

import { useEffect, useRef, useState } from 'react';
import { CL } from '../chainlab/constants';
import { ClLabel } from '../chainlab/ui/primitives';
import { AI_ERROR_TEXT, AiRequestError, postAi } from '../ai/request';

type Dir = 'vi-en' | 'en-vi';
interface Msg { id: number; dir: Dir; source: string; translation?: string; topic?: string; error?: string }

const MAX = 800;
const VI_CHARS = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const guess = (t: string): Dir => (VI_CHARS.test(t) ? 'vi-en' : 'en-vi');
const SAVE_LABEL = { saving: 'Đang lưu…', saved: 'Đã lưu', full: 'Đã lưu đầy', error: 'Lưu lỗi' } as const;
type SaveState = keyof typeof SAVE_LABEL;

const chipBtn: React.CSSProperties = { borderRadius: 5, padding: '3px 8px', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: CL.ink5 };

/**
 * "Dịch" as a chat: the student's text on the right, the translation on the left. The direction is guessed
 * from the text (Vietnamese letters → English, otherwise → Vietnamese). Kept for the visit only.
 */
export function TranslatorChat({ ideas = [], onClose, skill = 'task2' }: { ideas?: string[]; onClose?: () => void; skill?: 'task2' | 'task1' | 'speaking' }) {
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [saved, setSaved] = useState<Record<number, SaveState>>({});
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs]);

  const send = async (raw?: string) => {
    const source = (raw ?? text).trim();
    if (!source || pending || source.length > MAX) return;
    const id = Date.now(), dir = guess(source);
    setMsgs((xs) => [...xs, { id, dir, source }]);
    if (raw == null) setText('');
    setPending(true);
    try {
      const r = await postAi<{ translation: string; topic?: string }>('translate', { text: source, dir, skill });
      setMsgs((xs) => xs.map((x) => (x.id === id ? { ...x, translation: r.translation, topic: r.topic } : x)));
    } catch (e) {
      const error = e instanceof AiRequestError ? (e.code === 'bad_output' ? 'Không dịch được đoạn này. Mục Dịch chỉ dịch qua lại Việt – Anh.' : AI_ERROR_TEXT[e.code]) : AI_ERROR_TEXT.network;
      setMsgs((xs) => xs.map((x) => (x.id === id ? { ...x, error } : x)));
    }
    setPending(false);
  };

  const copy = (m: Msg) => navigator.clipboard?.writeText(m.translation || '').then(() => { setCopied(m.id); setTimeout(() => setCopied(null), 1500); }, () => {});
  // Saves the pair under "Đã lưu" in Từ vựng, filed under the topic the translator chose.
  const pair = (m: Msg) => (m.dir === 'vi-en' ? { en: m.translation || '', vi: m.source } : { en: m.source, vi: m.translation || '' });
  const savable = (m: Msg) => { const p = pair(m); return !!p.en && !!p.vi && p.en.length <= 300 && p.vi.length <= 600; };
  const save = async (m: Msg) => {
    if (saved[m.id] === 'saving' || saved[m.id] === 'saved') return;
    setSaved((s) => ({ ...s, [m.id]: 'saving' }));
    let state: SaveState = 'error';
    try {
      const r = await fetch('/api/vocab/mine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ ...pair(m), skill, topic: m.topic }) });
      state = r.ok ? 'saved' : r.status === 409 ? 'full' : 'error';
    } catch { /* network: error */ }
    setSaved((s) => ({ ...s, [m.id]: state }));
  };

  return (
    <section aria-label="Dịch" style={{ flex: '1 1 0', minHeight: 320, display: 'flex', flexDirection: 'column', borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 54, padding: '0 12px 0 20px', borderBottom: '1px solid ' + CL.ink1 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: CL.mint }} />
        <ClLabel color={CL.ink}>Dịch</ClLabel>
        <span style={{ borderRadius: 999, background: '#F1F1EE', color: CL.ink7, padding: '3px 10px', fontFamily: CL.sans, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>Việt ⇄ Anh · tự nhận</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          {msgs.length > 0 && <button type="button" className="cl-btn cl-link" onClick={() => setMsgs([])} style={{ ...chipBtn, padding: '5px 8px' }}>Xoá</button>}
          {onClose && <button type="button" className="cl-btn cl-link" onClick={onClose} style={{ ...chipBtn, padding: '5px 8px' }}>Ẩn</button>}
        </span>
      </div>

      <div ref={listRef} className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!msgs.length && (
          <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: '8px 12px' }}>
            <span style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.6, color: CL.ink5 }}>Gõ tiếng Việt hay tiếng Anh, mình dịch chiều còn lại.</span>
            {ideas.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
                {ideas.map((t) => <button key={t} type="button" className="cl-btn cl-add" onClick={() => send(t)} style={{ borderRadius: 999, border: '1px solid ' + CL.ink2, padding: '5px 12px', fontFamily: CL.sans, fontSize: 11.5, fontWeight: 600, color: CL.ink6 }}>{t}</button>)}
              </div>
            )}
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ alignSelf: 'flex-end', maxWidth: '85%', borderRadius: '16px 16px 4px 16px', background: '#F1F1EE', padding: '9px 13px', fontFamily: CL.sans, fontSize: 13.5, lineHeight: 1.5, color: CL.ink8, whiteSpace: 'pre-wrap' }}>{m.source}</div>
            <div style={{ alignSelf: 'flex-start', maxWidth: '92%', display: 'flex', gap: 9 }}>
              <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 8, background: CL.mint, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: CL.sans, fontSize: 9.5, fontWeight: 700, color: CL.ink }}>{m.dir === 'vi-en' ? 'EN' : 'VI'}</span>
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {m.translation != null ? (
                  <>
                    <div style={{ borderRadius: '4px 16px 16px 16px', border: '1px solid ' + CL.ink2, background: '#fff', padding: '9px 13px', fontFamily: CL.serif, fontSize: 15, lineHeight: 1.5, color: CL.ink8, whiteSpace: 'pre-wrap' }}>{m.translation || '—'}</div>
                    {m.translation && (
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button type="button" className="cl-btn cl-link" onClick={() => copy(m)} style={{ ...chipBtn, color: copied === m.id ? CL.greenText : CL.ink5 }}>{copied === m.id ? 'Đã chép' : 'Chép'}</button>
                        {savable(m) && <button type="button" className="cl-btn cl-link" onClick={() => save(m)} disabled={saved[m.id] === 'saving' || saved[m.id] === 'saved'} title={'Lưu vào Từ vựng' + (m.topic ? ' · ' + m.topic : '')} style={{ ...chipBtn, color: saved[m.id] === 'saved' ? CL.greenText : saved[m.id] === 'error' || saved[m.id] === 'full' ? CL.redText : CL.ink5 }}>{saved[m.id] ? SAVE_LABEL[saved[m.id]] : 'Lưu từ'}</button>}
                      </div>
                    )}
                  </>
                ) : m.error ? (
                  <div style={{ borderRadius: '4px 16px 16px 16px', background: CL.redSoft, padding: '9px 13px', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.redText }}>{m.error}</div>
                ) : (
                  <div aria-live="polite" style={{ borderRadius: '4px 16px 16px 16px', border: '1px solid ' + CL.ink1, padding: '9px 13px', fontFamily: CL.sans, fontSize: 12.5, color: CL.ink4 }}>Đang dịch…</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 12px 12px' }}>
        <div className="cl-askbox" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, borderRadius: 16, border: '1px solid ' + CL.ink2, background: CL.panel, padding: '7px 7px 7px 14px' }}>
          <textarea className="co-ta" value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX} rows={1} placeholder="Nhắn để dịch…" aria-label="Văn bản cần dịch"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
            style={{ flex: 1, minWidth: 0, maxHeight: 120, resize: 'none', border: 'none', outline: 'none', background: 'transparent', padding: '6px 0', fontFamily: CL.sans, fontSize: 13.5, lineHeight: 1.5, color: CL.ink8 }} />
          <button type="button" className="cl-btn cl-primary" onClick={() => send()} disabled={!text.trim() || pending} aria-label="Gửi"
            style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 999, background: CL.ink, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: text.trim() && !pending ? 1 : 0.3 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </button>
        </div>
        <div style={{ padding: '6px 4px 0', fontFamily: CL.sans, fontSize: 10.5, color: text.length > MAX - 50 ? CL.redText : CL.ink4 }}>{text.length > MAX - 50 ? text.length + '/' + MAX : 'Enter để gửi · Shift + Enter xuống dòng'}</div>
      </div>
    </section>
  );
}
