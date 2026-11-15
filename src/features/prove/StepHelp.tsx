'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CL } from '../chainlab/constants';
import { miniBtn } from '../coach/ChainEditor';
import type { ChainIn } from '../coach/useCoach';
import { AI_ERROR_TEXT, AiRequestError, postAi } from '../ai/request';

interface Phrase { en: string; vi: string }
interface Scan { used: string[]; parts: { text: string; phrases: Phrase[] }[] }
type Load<T> = { state: 'loading' } | { state: 'error'; error: string } | { state: 'done'; data: T };

const errText = (e: unknown) => (e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network);
const card: React.CSSProperties = { borderRadius: 10, border: '1px solid #E5E5E5', background: '#fff', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 };
const panel: React.CSSProperties = { borderRadius: 12, border: '1px solid #DCE7F7', background: '#F7F9FD', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 };
const label: React.CSSProperties = { fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink5 };
const linkBtn: React.CSSProperties = { marginLeft: 'auto', border: 'none', background: 'none', padding: '2px 4px', cursor: 'pointer', fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink5 };

function PhraseRow({ p, used }: { p: Phrase; used?: boolean }) {
  return (
    <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
      <b style={{ borderRadius: 6, padding: '3px 8px', fontFamily: CL.sans, fontSize: 13.5, fontWeight: 500, background: used ? CL.mintSoft : '#EEF3FC', color: used ? CL.greenText : '#2F62C4' }}>{p.en}</b>
      <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5 }}>{used ? 'bạn đã dùng' : p.vi}</span>
    </span>
  );
}

/**
 * Per-step help in the quick drill. "Gợi ý" on a step gives a guiding question (shown as the step's placeholder) and vocabulary; after
 * Enter, the AI reads the step: which suggested phrases were used, and better wording for every rough part (the next
 * step's question comes only from "Gợi ý"). Students always type the phrases themselves; nothing is inserted on click.
 */
export function useStepHelp(promptId: string, base: Omit<ChainIn, 'steps'>, steps: string[], firstQuestion: string) {
  const [vocab, setVocab] = useState<Record<number, Load<{ question: string; phrases: Phrase[] }>>>({});
  const [hidden, setHidden] = useState<Record<number, boolean>>({});
  const [scans, setScans] = useState<Record<number, { text: string; load: Load<Scan> }>>({});
  const [closed, setClosed] = useState<Record<number, boolean>>({});
  const key = promptId + '|' + base.start + '|' + base.end;
  useEffect(() => { setVocab({}); setHidden({}); setScans({}); setClosed({}); }, [key]);

  const chainUpTo = (i: number): ChainIn => ({ ...base, steps: steps.slice(0, i).map((x) => x.trim()).filter(Boolean) });
  /** The step's placeholder: the question from "Gợi ý" once asked, else the drill's question for the first step. */
  const question = (i: number) => {
    const v = vocab[i];
    if (v && v.state === 'done' && v.data.question) return v.data.question;
    return i === 0 && firstQuestion ? firstQuestion : undefined;
  };

  const askVocab = async (i: number) => {
    if (vocab[i]?.state === 'loading') return;
    setVocab((v) => ({ ...v, [i]: { state: 'loading' } })); setHidden((h) => ({ ...h, [i]: false }));
    try {
      const r = await postAi<{ question: string; phrases: Phrase[] }>('step-vocab', { promptId, chain: chainUpTo(i), index: i, question: question(i) || '' });
      setVocab((v) => ({ ...v, [i]: { state: 'done', data: { question: r.question || '', phrases: r.phrases || [] } } }));
    } catch (e) { setVocab((v) => ({ ...v, [i]: { state: 'error', error: errText(e) } })); }
  };

  const onSubmitStep = async (i: number, text: string) => {
    if (scans[i]?.text === text) return;
    const v = vocab[i];
    const suggested = v && v.state === 'done' ? v.data.phrases.map((p) => p.en) : [];
    setScans((s) => ({ ...s, [i]: { text, load: { state: 'loading' } } })); setClosed((c) => ({ ...c, [i]: false }));
    try {
      const r = await postAi<Scan>('step-scan', { promptId, chain: chainUpTo(i), index: i, step: text, suggested });
      setScans((s) => (s[i]?.text === text ? { ...s, [i]: { text, load: { state: 'done', data: r } } } : s));
    } catch (e) { setScans((s) => (s[i]?.text === text ? { ...s, [i]: { text, load: { state: 'error', error: errText(e) } } } : s)); }
  };

  const belowStep = (i: number): ReactNode => {
    const sc = scans[i];
    if (sc && steps[i]?.trim() === sc.text) {
      if (sc.load.state === 'loading') return <div style={panel}><span style={label}>Đang đọc bước này…</span></div>;
      if (sc.load.state === 'error') return <div style={panel}><span style={{ ...label, color: CL.redText }}>{sc.load.error}</span></div>;
      const d = sc.load.data;
      const vd = vocab[i];
      const usedPhrases = vd && vd.state === 'done' ? vd.data.phrases.filter((p) => d.used.some((u) => u.toLowerCase() === p.en.toLowerCase())) : [];
      if (closed[i]) return (
        <div style={{ ...panel, flexDirection: 'row', alignItems: 'center' }}>
          <span style={label}>Cách nói hay hơn{d.parts.length ? ' · ' + d.parts.length + ' chỗ' : ''}</span>
          <button type="button" className="cl-btn" style={linkBtn} onClick={() => setClosed((c) => ({ ...c, [i]: false }))}>Mở</button>
        </div>
      );
      return (
        <div className="co-unfold" style={panel}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={label}>Cách nói hay hơn cho bước bạn vừa gõ</span>
            <button type="button" className="cl-btn" style={linkBtn} onClick={() => setClosed((c) => ({ ...c, [i]: true }))}>Thu gọn</button>
          </span>
          {usedPhrases.map((p) => <PhraseRow key={p.en} p={p} used />)}
          {usedPhrases.length > 0 && d.parts.length > 0 && <span style={{ height: 1, background: '#DCE7F7' }} />}
          {d.parts.map((part) => (
            <span key={part.text} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={label}>Cho phần “{part.text}”:</span>
              {part.phrases.map((p) => <PhraseRow key={p.en} p={p} />)}
            </span>
          ))}
          {d.parts.length === 0 && usedPhrases.length === 0 && <span style={{ fontFamily: CL.sans, fontSize: 13, color: CL.greenText }}>Bước này đã viết tốt.</span>}
        </div>
      );
    }
    // The step being written (the last one) gets the vocabulary button.
    if (i !== steps.length - 1) return null;
    const v = vocab[i];
    if (!v || hidden[i]) return (
      <button type="button" className="cl-btn" onClick={() => (v && v.state === 'done' ? setHidden((h) => ({ ...h, [i]: false })) : askVocab(i))} style={{ ...miniBtn, boxShadow: 'none', background: '#EEF3FC', color: '#2F62C4' }}>Gợi ý</button>
    );
    if (v.state === 'loading') return <div style={card}><span style={label}>Đang tìm gợi ý…</span></div>;
    if (v.state === 'error') return <div style={card}><span style={{ ...label, color: CL.redText }}>{v.error}</span></div>;
    return (
      <div className="co-unfold" style={card}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={label}>Từ vựng cho bước này</span>
          <button type="button" className="cl-btn" style={linkBtn} onClick={() => setHidden((h) => ({ ...h, [i]: true }))}>Ẩn</button>
        </span>
        {v.data.phrases.map((p) => <PhraseRow key={p.en} p={p} />)}
      </div>
    );
  };

  return { belowStep, stepQuestion: question, onSubmitStep };
}
