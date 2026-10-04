'use client';

import { useState } from 'react';
import { CL } from '../chainlab/constants';
import { ClIcon, ClLabel } from '../chainlab/ui/primitives';
import { AI_ERROR_TEXT, AiRequestError, postAi } from './request';

type Dir = 'vi-en' | 'en-vi';
interface Item { id: number; dir: Dir; source: string; translation?: string; error?: string }

const MAX = 800;
const VI_CHARS = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const guess = (t: string): Dir => (VI_CHARS.test(t) ? 'vi-en' : 'en-vi');
const LABEL: Record<Dir, string> = { 'vi-en': 'Việt → Anh', 'en-vi': 'Anh → Việt' };

/** "Dịch" drawer: Vietnamese ↔ English, one text at a time. */
export function Translator({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [dir, setDir] = useState<Dir>('vi-en');
  const [manual, setManual] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const onText = (v: string) => { setText(v); if (!manual && v.trim()) setDir(guess(v)); };
  const send = async () => {
    const source = text.trim();
    if (!source || pending || source.length > MAX) return;
    const id = Date.now();
    setItems((xs) => [{ id, dir, source }, ...xs]);
    setText(''); setManual(false); setPending(true);
    try {
      const r = await postAi<{ translation: string }>('translate', { text: source, dir });
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, translation: r.translation } : x)));
    } catch (e) {
      const error = e instanceof AiRequestError ? (e.code === 'bad_output' ? 'Không dịch được đoạn này. Mục Dịch chỉ dịch qua lại Việt – Anh.' : AI_ERROR_TEXT[e.code]) : AI_ERROR_TEXT.network;
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, error } : x)));
    }
    setPending(false);
  };
  const copy = (it: Item) => {
    navigator.clipboard?.writeText(it.translation || '').then(() => { setCopied(it.id); setTimeout(() => setCopied(null), 1500); }, () => {});
  };

  return (
    <div role="dialog" aria-label="Dịch" style={{ position: 'fixed', top: 16, right: 16, bottom: 16, width: 380, maxWidth: 'calc(100% - 32px)', zIndex: 30, display: 'flex', flexDirection: 'column', borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', boxShadow: '0 24px 60px rgba(20,20,19,0.14), 0 4px 12px rgba(20,20,19,0.06)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 58, padding: '0 10px 0 22px', borderBottom: '1px solid ' + CL.ink1 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: CL.mint }} />
        <ClLabel color={CL.ink}>Dịch</ClLabel>
        <button type="button" className="cl-btn cl-link" onClick={onClose} aria-label="Đóng" style={{ marginLeft: 'auto', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CL.ink4 }}><ClIcon name="x" size={15} /></button>
      </div>

      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid ' + CL.ink1, background: CL.panel }}>
        <div className="cl-askbox" style={{ borderRadius: 10, border: '1px solid ' + CL.ink2, background: '#fff', padding: '8px 8px 8px 12px' }}>
          <textarea value={text} onChange={(e) => onText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} rows={3} maxLength={MAX} placeholder="Gõ một từ, cụm từ hay câu tiếng Việt hoặc tiếng Anh…" aria-label="Văn bản cần dịch" style={{ display: 'block', width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontFamily: CL.sans, fontSize: 13, lineHeight: 1.5, color: CL.ink8, padding: '2px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <button type="button" className="cl-btn" onClick={() => { setDir(dir === 'vi-en' ? 'en-vi' : 'vi-en'); setManual(true); }} title="Đổi chiều dịch" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 5, border: '1px solid ' + CL.ink2, padding: '4px 8px', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, color: CL.ink6 }}>{LABEL[dir]}</button>
            <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 10.5, color: text.length > MAX - 50 ? CL.redText : CL.ink4 }}>{text.length}/{MAX}</span>
            <button type="button" className="cl-btn cl-primary" onClick={send} disabled={!text.trim() || pending} aria-label="Dịch" style={{ height: 30, borderRadius: 7, background: CL.ink, color: '#fff', padding: '0 12px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600, opacity: text.trim() && !pending ? 1 : 0.3 }}>Dịch</button>
          </div>
        </div>
      </div>

      <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!items.length && <p style={{ margin: '4px 6px', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.6, color: CL.ink5 }}>Chỉ dịch qua lại giữa tiếng Việt và tiếng Anh. Chiều dịch tự đổi theo chữ bạn gõ; bấm nút chiều dịch để đổi tay.</p>}
        {items.map((it) => (
          <div key={it.id} style={{ borderRadius: 12, border: '1px solid ' + CL.ink1, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: '#FCFCFB', borderBottom: '1px solid ' + CL.ink1 }}>
              <span style={{ display: 'block', marginBottom: 4, fontFamily: CL.sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: CL.ink4 }}>{LABEL[it.dir]}</span>
              <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.55, color: CL.ink6, whiteSpace: 'pre-wrap' }}>{it.source}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px' }}>
              {it.translation != null ? (
                <>
                  <span style={{ flex: 1, fontFamily: CL.serif, fontSize: 14.5, lineHeight: 1.55, color: CL.ink, whiteSpace: 'pre-wrap' }}>{it.translation || '—'}</span>
                  {it.translation && <button type="button" className="cl-btn" onClick={() => copy(it)} style={{ flexShrink: 0, borderRadius: 5, border: '1px solid ' + CL.ink2, padding: '3px 8px', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: copied === it.id ? CL.greenText : CL.ink6 }}>{copied === it.id ? 'Đã chép' : 'Chép'}</button>}
                </>
              ) : it.error ? (
                <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.redText }}>{it.error}</span>
              ) : (
                <span aria-live="polite" style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>Đang dịch…</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
