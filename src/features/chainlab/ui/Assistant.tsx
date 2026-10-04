'use client';

import { Fragment, useState } from 'react';
import { CL } from '../constants';
import { ClIcon, ClLabel } from './primitives';

export interface AssistantAction { label: string; desc: string }

interface Message { from: 'me' | 'ai'; text: string; ctx?: string }

export interface AssistantProps {
  onClose: () => void;
  contextLabel: string;
  contextMeta: string;
  intro: string;
  placeholder: string;
  actions: AssistantAction[];
  /** MOCK: canned replies keyed by action label. Replace with a call to the tutoring endpoint. */
  replies: Record<string, string>;
}

/** "Hỏi" drawer: a context-aware tutor pinned to the right edge. */
export function Assistant({ onClose, contextLabel, contextMeta, intro, placeholder, actions, replies }: AssistantProps) {
  const [ask, setAsk] = useState('');
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [messages, setMessages] = useState<Message[]>([]);
  const send = (t: string) => {
    if (!t || !t.trim()) return;
    const reply = replies[t] || 'Mình sẽ đọc câu hỏi này cùng với nội dung bạn đang làm.';
    setMessages((m) => [...m, { from: 'me', text: t.trim() }, { from: 'ai', text: reply, ctx: contextLabel }]);
    setAsk('');
  };
  return (
    <div role="dialog" aria-label="Trợ lý" style={{ position: 'fixed', top: 16, right: 16, bottom: 16, width: 380, maxWidth: 'calc(100% - 32px)', zIndex: 30, display: 'flex', flexDirection: 'column', borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', boxShadow: '0 24px 60px rgba(20,20,19,0.14), 0 4px 12px rgba(20,20,19,0.06)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 58, padding: '0 10px 0 22px', borderBottom: '1px solid ' + CL.ink1 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: CL.mint }} />
        <ClLabel color={CL.ink}>Trợ lý</ClLabel>
        <button type="button" className="cl-btn cl-link" onClick={onClose} aria-label="Đóng" style={{ marginLeft: 'auto', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CL.ink4 }}><ClIcon name="x" size={15} /></button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderBottom: '1px solid ' + CL.ink1, background: CL.panel }}>
        <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink5 }}>Đang xem</span>
        <span style={{ borderRadius: 5, border: '1px solid ' + CL.ink2, background: '#fff', padding: '3px 8px', fontFamily: CL.sans, fontSize: 11, fontWeight: 600, color: CL.ink }}>{contextLabel}</span>
        <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11, color: CL.ink4, whiteSpace: 'nowrap' }}>{contextMeta}</span>
      </div>
      <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!messages.length && (
          <Fragment>
            <p style={{ margin: 0, fontFamily: CL.serif, fontSize: 15, lineHeight: 1.55, color: CL.ink8, textWrap: 'pretty' }}>{intro}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {actions.map((a) => (
                <button key={a.label} type="button" className="cl-btn cl-lens" onClick={() => send(a.label)} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', borderRadius: 10, border: '1px solid ' + CL.ink2, background: '#fff', padding: '12px 14px' }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: CL.ink }}>{a.label}</span>
                    <span style={{ display: 'block', marginTop: 3, fontFamily: CL.sans, fontSize: 11.5, lineHeight: 1.45, color: CL.ink5 }}>{a.desc}</span>
                  </span>
                  <span style={{ color: CL.ink3 }}><ClIcon name="right" size={14} /></span>
                </button>
              ))}
            </div>
          </Fragment>
        )}
        {messages.map((m, i) => m.from === 'me' ? (
          <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '85%', borderRadius: 10, background: CL.ink, color: '#fff', padding: '10px 13px', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.55 }}>{m.text}</div>
        ) : (
          <div key={i} style={{ alignSelf: 'flex-start', maxWidth: '92%', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ClLabel color={CL.ink4} style={{ fontSize: 9.5 }}>Trợ lý · {m.ctx}</ClLabel>
            <div style={{ borderRadius: 10, border: '1px solid ' + CL.ink1, background: '#FCFCFB', padding: '11px 14px', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.6, color: CL.ink7 }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 14px 14px', borderTop: '1px solid ' + CL.ink1 }}>
        {messages.length > 0 && (
          <div className="cl-scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 10 }}>
            {actions.map((a) => <button key={a.label} type="button" className="cl-btn cl-lens" onClick={() => send(a.label)} style={{ flexShrink: 0, borderRadius: 5, border: '1px solid ' + CL.ink2, background: '#fff', padding: '5px 9px', fontFamily: CL.sans, fontSize: 11, fontWeight: 600, color: CL.ink6, whiteSpace: 'nowrap' }}>{a.label}</button>)}
          </div>
        )}
        <div className="cl-askbox" style={{ borderRadius: 10, border: '1px solid ' + CL.ink2, background: '#fff', padding: '8px 8px 8px 12px' }}>
          <textarea value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(ask); } }} rows={2} placeholder={placeholder} aria-label={placeholder} style={{ display: 'block', width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink8, padding: '2px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <button type="button" className="cl-btn" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')} style={{ borderRadius: 5, border: '1px solid ' + CL.ink2, padding: '4px 8px', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, color: CL.ink6 }}>{lang === 'vi' ? 'Trả lời: Tiếng Việt' : 'Reply: English'}</button>
            <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 10.5, color: CL.ink4 }}>Enter để gửi</span>
            <button type="button" className="cl-btn cl-primary" onClick={() => send(ask)} disabled={!ask.trim()} aria-label="Gửi" style={{ width: 34, height: 34, borderRadius: 7, background: CL.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: ask.trim() ? 1 : 0.3 }}><ClIcon name="right" size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
