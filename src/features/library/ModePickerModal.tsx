'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Prompt } from '@/content/prompts';
import { attemptStore, modeOf, type Attempt, type WritingMode } from '../attempts/store';

export type { WritingMode };

const MODE_KEY = 'hnhv.writeMode';
export const MODE_LABEL: Record<WritingMode, string> = { free: 'Tự viết', guided: 'Viết có hướng dẫn' };

/** The mode picked last time, so the popup opens on it. */
function lastMode(): WritingMode {
  try { return localStorage.getItem(MODE_KEY) === 'free' ? 'free' : 'guided'; } catch { return 'guided'; }
}
function rememberMode(m: WritingMode) {
  try { localStorage.setItem(MODE_KEY, m); } catch { /* private window */ }
}

const bar = (w: string, bg: string, h = 5): ReactNode => <span style={{ height: h, width: w, borderRadius: h / 2 + 0.5, background: bg }} />;
const box = { boxSizing: 'border-box', borderRadius: 6, background: '#fff', border: '1px solid #EBEBEB', padding: 6, display: 'flex', flexDirection: 'column', gap: 4 } as const;

/** Tự viết: the three panels (prompt and notes, the essay, the translator). */
const SketchFree = (
  <span aria-hidden="true" style={{ height: 88, boxSizing: 'border-box', borderRadius: 10, border: '1px solid #E5E5E5', background: '#FAFAFA', padding: 10, display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 6 }}>
    <span style={box}>{bar('80%', '#E5E5E5')}{bar('60%', '#E5E5E5')}{bar('70%', '#E5E5E5')}</span>
    <span style={box}>{bar('92%', '#D4D4D4')}{bar('86%', '#D4D4D4')}{bar('90%', '#D4D4D4')}{bar('50%', '#D4D4D4')}</span>
    <span style={{ ...box, alignItems: 'flex-end' }}>{bar('70%', '#EEF3FC', 8)}<span style={{ alignSelf: 'flex-start', height: 8, width: '60%', borderRadius: 4, background: '#F5F5F5' }} /></span>
  </span>
);

const dotRow = (bg: string, r = 99) => (
  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><span style={{ width: 6, height: 6, borderRadius: r, background: bg }} /><span style={{ height: 4, flex: 1, borderRadius: 2, background: '#E5E5E5' }} /></span>
);
const link = <span style={{ width: 10, height: 1, background: '#D4D4D4', flexShrink: 0 }} />;

/** Viết có hướng dẫn: the three steps (choose the direction, build the mạch ý, write sentence by sentence). */
const SketchGuided = (
  <span aria-hidden="true" style={{ height: 88, boxSizing: 'border-box', borderRadius: 10, border: '1px solid #E5E5E5', background: '#FAFAFA', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ flex: 1, height: 60, boxSizing: 'border-box', borderRadius: 6, background: '#fff', border: '1px solid #DCE7F7', padding: 7, display: 'flex', flexDirection: 'column', gap: 5 }}>
      {dotRow('#A3A3A3')}{dotRow('#2F62C4')}{dotRow('#B8862B', 1)}
    </span>
    {link}
    <span style={{ flex: 1, height: 60, boxSizing: 'border-box', borderRadius: 6, background: '#fff', border: '1px solid #EBEBEB', padding: '7px 7px 7px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      <span style={{ position: 'absolute', left: 6, top: 10, bottom: 10, width: 1, background: '#E5E5E5' }} />
      <span style={{ height: 4, width: '70%', marginLeft: 4, borderRadius: 2, background: '#2D881A' }} />
      <span style={{ height: 4, width: '80%', marginLeft: 4, borderRadius: 2, background: '#D4D4D4' }} />
      <span style={{ height: 4, width: '60%', marginLeft: 4, borderRadius: 2, background: '#B33A1A' }} />
    </span>
    {link}
    <span style={{ flex: 1, height: 60, boxSizing: 'border-box', borderRadius: 6, background: '#F7F9FD', border: '1px solid #DCE7F7', padding: 7, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ height: 4, width: '90%', borderRadius: 2, background: '#BFD0EC' }} />
      <span style={{ height: 4, width: '70%', borderRadius: 2, background: '#BFD0EC' }} />
      <span style={{ marginTop: 'auto', height: 12, boxSizing: 'border-box', borderRadius: 3, background: '#fff', border: '1px solid #77A1DD' }} />
    </span>
  </span>
);

function ModeOption({ selected, onClick, title, sketch }: { selected: boolean; onClick: () => void; title: string; sketch: ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onClick}
      style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit', borderRadius: 10, border: 'none', boxShadow: selected ? '0 0 0 2px #171717' : '0 0 0 1px #E5E5E5', background: '#fff', padding: 16, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
      {sketch}
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#171717' }}>{title}</span>
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

/** The start popup for a prompt: pick Tự viết or Viết có hướng dẫn (it opens on the last one used), or resume the latest attempt. */
export function ModePickerModal({ prompt, onClose, onStart, onResume }: { prompt: Prompt; onClose: () => void; onStart: (mode: WritingMode) => void; onResume: (attempt: Attempt) => void }) {
  const [mode, setMode] = useState<WritingMode>('guided');
  const [last, setLast] = useState<Attempt | null>(null);
  const [starting, setStarting] = useState(false);
  const [closing, setClosing] = useState(false);
  // Closing plays the quicker scale-down before the modal unmounts.
  const close = () => { if (closing) return; setClosing(true); setTimeout(onClose, 150); };
  useEffect(() => { setMode(lastMode()); }, []);
  useEffect(() => { attemptStore.listForPrompt(prompt.id).then((list) => setLast(list.find((a) => !a.essay.review) || null)).catch(() => {}); }, [prompt.id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, closing]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div onClick={close} className={'t-modal-back' + (closing ? ' is-closing' : '')} style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,19,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
      <div role="dialog" aria-modal="true" aria-labelledby="mode-title" className="t-modal" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 20, padding: '28px 28px 24px', boxShadow: '0 24px 60px rgba(20,20,19,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
          <p style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 600, lineHeight: 1.4, color: '#171717', margin: 0 }}>{prompt.text}</p>
          <button type="button" onClick={close} aria-label="Đóng" style={{ cursor: 'pointer', width: 28, height: 28, borderRadius: 999, border: '1px solid #E5E5E5', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6E6B64', flexShrink: 0, padding: 0 }}><X size={14} strokeWidth={2.5} /></button>
        </div>
        <p id="mode-title" style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#171717', margin: '0 0 14px' }}>Chọn chế độ làm bài</p>
        <div role="radiogroup" aria-labelledby="mode-title" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 22 }}>
          <ModeOption selected={mode === 'free'} onClick={() => setMode('free')} title={MODE_LABEL.free} sketch={SketchFree} />
          <ModeOption selected={mode === 'guided'} onClick={() => setMode('guided')} title={MODE_LABEL.guided} sketch={SketchGuided} />
        </div>
        <button type="button" className="cl-primary" disabled={starting} onClick={() => { setStarting(true); rememberMode(mode); onStart(mode); }} style={{ width: '100%', height: 46, borderRadius: 10, border: 'none', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: starting ? 0.6 : 1 }}>{last ? 'Bắt đầu bài mới' : 'Bắt đầu làm bài'}</button>
        {last && (
          <button type="button" onClick={() => onResume(last)} style={{ width: '100%', marginTop: 10, height: 42, borderRadius: 10, border: '1px solid #E5E5E5', background: '#fff', color: '#171717', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Tiếp tục bài đang viết · {MODE_LABEL[modeOf(last)]} · lưu {ago(last.updatedAt)}</button>
        )}
      </div>
    </div>
  );
}
