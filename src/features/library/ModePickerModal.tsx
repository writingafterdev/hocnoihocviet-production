'use client';

import { Fragment, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Prompt } from '@/content/prompts';
import { SAMPLE_IDS } from '@/content/samples';
import { attemptStore, type Attempt } from '../attempts/store';

export type WritingMode = 'free' | 'guided';

function OptionPreview({ kind }: { kind: WritingMode }) {
  if (kind === 'guided') return (
    <div style={{ borderRadius: 10, border: '1px solid #E7E5DF', background: '#F7F6F2', padding: 10, height: 88, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}><span style={{ width: 52, height: 12, borderRadius: 5, background: '#FFE17B' }} /><span style={{ width: 40, height: 12, borderRadius: 5, background: '#fff', border: '1px solid #E7E5DF' }} /></div>
      <div style={{ display: 'flex', gap: 5 }}>{[18, 30, 14, 26, 20].map((w, i) => <span key={i} style={{ width: w, height: 10, borderBottom: '2px solid ' + (i < 2 ? '#1FA97A' : '#C8C4B5') }} />)}</div>
      <span style={{ height: 8, borderRadius: 4, background: '#E3E1D8', width: '80%' }} />
      <span style={{ height: 8, borderRadius: 4, background: '#E3E1D8', width: '64%' }} />
    </div>
  );
  return (
    <div style={{ borderRadius: 10, border: '1px solid #E7E5DF', background: '#F7F6F2', padding: 10, height: 88, display: 'flex', alignItems: 'center', gap: 4 }}>
      {[1, 2, 3, 4].map((n) => (
        <Fragment key={n}>
          <span style={{ width: 20, height: 20, borderRadius: 999, background: n === 1 ? '#1FA97A' : n === 2 ? '#FFE17B' : '#fff', border: n > 2 ? '1px solid #C8C4B5' : 'none', flexShrink: 0 }} />
          {n < 4 && <span style={{ flex: 1, height: 1, background: '#DAD8D2' }} />}
        </Fragment>
      ))}
    </div>
  );
}

function ModeOption({ selected, onClick, title, desc, kind, disabled, badge }: { selected: boolean; onClick: () => void; title: string; desc: string; kind: WritingMode; disabled?: boolean; badge?: string }) {
  return (
    <button type="button" role="radio" aria-checked={selected} aria-disabled={disabled} disabled={disabled} onClick={onClick} style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1, textAlign: 'left', font: 'inherit', borderRadius: 14, border: selected ? '2px solid #141413' : '1px solid #E6E4DE', background: '#fff', padding: 16, flex: 1, minWidth: 220 }}>
      <OptionPreview kind={kind} />
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#141413', margin: '14px 0 6px' }}>{title}{badge && <span style={{ borderRadius: 4, background: '#ECEAE4', padding: '1px 6px', fontSize: 10, fontWeight: 700, color: '#857F70' }}>{badge}</span>}</h3>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, lineHeight: 1.55, color: '#6E6B64', margin: 0 }}>{desc}</p>
    </button>
  );
}

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return m + ' phút trước';
  const h = Math.round(m / 60);
  return h < 24 ? h + ' giờ trước' : Math.round(h / 24) + ' ngày trước';
};

/** Pop-up after "Viết bài": pick Viết tự do (ChainLab → Writing Desk) or Chép mẫu, or resume the last attempt. */
export function ModePickerModal({ prompt, onClose, onStart, onResume }: { prompt: Prompt; onClose: () => void; onStart: (mode: WritingMode) => void; onResume: (attemptId: string) => void }) {
  const [mode, setMode] = useState<WritingMode>('free');
  const [last, setLast] = useState<Attempt | null>(null);
  const [starting, setStarting] = useState(false);
  useEffect(() => { attemptStore.listForPrompt(prompt.id).then((list) => setLast(list[0] || null)); }, [prompt.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,19,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
      <div role="dialog" aria-modal="true" aria-labelledby="mode-title" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 20, padding: '28px 28px 24px', boxShadow: '0 24px 60px rgba(20,20,19,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
          <p style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 600, lineHeight: 1.4, color: '#141413', margin: 0 }}>{prompt.text}</p>
          <button type="button" onClick={onClose} aria-label="Đóng" style={{ cursor: 'pointer', width: 28, height: 28, borderRadius: 999, border: '1px solid #E6E4DE', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6E6B64', flexShrink: 0, padding: 0 }}><X size={14} strokeWidth={2.5} /></button>
        </div>
        <p id="mode-title" style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#141413', margin: '0 0 14px' }}>Chọn chế độ làm bài</p>
        <div role="radiogroup" aria-labelledby="mode-title" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
          <ModeOption kind="free" selected={mode === 'free'} onClick={() => setMode('free')} title="Viết tự do" desc="Dựng mạch lập luận cho từng câu hỏi, rồi tự viết bài bên cạnh dàn ý. Không gợi ý, chấm TR / CC / LR / GRA khi nộp." />
          <ModeOption kind="guided" selected={mode === 'guided'} onClick={() => setMode('guided')} title="Chép mẫu" desc="Viết lại bài mẫu từng câu từ nghĩa tiếng Việt, chữ cái đầu và công cụ lập luận. Không chấm điểm." disabled={!SAMPLE_IDS.has(prompt.id)} badge={SAMPLE_IDS.has(prompt.id) ? undefined : 'Chưa có bài mẫu'} />
        </div>
        <button type="button" disabled={starting} onClick={() => { setStarting(true); onStart(mode); }} style={{ width: '100%', height: 46, borderRadius: 10, border: 'none', background: '#141413', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: starting ? 0.6 : 1 }}>{mode === 'free' && last ? 'Bắt đầu bài mới' : 'Bắt đầu làm bài'}</button>
        {mode === 'free' && last && (
          <button type="button" onClick={() => onResume(last.id)} style={{ width: '100%', marginTop: 10, height: 42, borderRadius: 10, border: '1px solid #E6E4DE', background: '#fff', color: '#141413', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Tiếp tục bài đang viết · lưu {ago(last.updatedAt)}</button>
        )}
      </div>
    </div>
  );
}
