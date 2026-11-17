'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Prompt } from '@/content/prompts';
import type { GuidedSentence } from '@/lib/ai/guided-essay';
import { SignedOutError, type EssayState } from '../attempts/store';
import { AI_ERROR_TEXT, AiRequestError, postAi } from '../ai/request';
import { CL } from '../chainlab/constants';
import type { Chain } from '../chainlab/types';
import { primaryBtn } from '../coach/ui';
import type { EssaySection } from '../desk/scoring';
import { hint, wordStates, words as splitWords } from '../guided/matching';

const label: React.CSSProperties = { fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink5 };
const nowrap: React.CSSProperties = { whiteSpace: 'nowrap', flexShrink: 0 };
const ghostBtn: React.CSSProperties = { whiteSpace: 'nowrap', height: 36, padding: '0 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,.12)', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.05)', fontFamily: CL.sans, fontSize: 14, fontWeight: 500, color: CL.ink };
const linkBtn: React.CSSProperties = { whiteSpace: 'nowrap', height: 36, padding: '0 10px', border: 'none', background: 'none', fontFamily: CL.sans, fontSize: 14, fontWeight: 500, color: CL.ink5 };
const slot: React.CSSProperties = { borderRadius: 5, background: '#EEF3FC', color: '#2F62C4', padding: '1px 6px', fontSize: 13.5 };

/** "Many [S] have never been [V3] …" with the slots as blue chips. */
function Frame({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  text.split(/(\[[^\]]+\])/).forEach((p, k) => { if (p) parts.push(p.startsWith('[') ? <span key={k} style={slot}>{p.slice(1, -1)}</span> : <span key={k}>{p}</span>); });
  return <span style={{ fontFamily: CL.sans, fontSize: 14.5, lineHeight: 2, color: CL.ink }}>{parts}</span>;
}

/** The student's chains, sent without the drill's check data. */
const chainsOut = (chains: Chain[]) => chains.map(({ check, ...c }) => c); // eslint-disable-line @typescript-eslint/no-unused-vars

/** `sentence`: the drill's statement; the plan is then one paragraph from its chain. */
export function useGuidedPlan(prompt: Prompt, chains: Chain[], essay: EssayState, setEssay: (fn: (e: EssayState) => EssayState) => void, sentence?: string) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const g = essay.guided;
  const load = async () => {
    if (loading) return;
    setLoading(true); setError('');
    try {
      const ready = chains.filter((c) => c.steps.slice(1, -1).some((s) => s.trim()));
      const r = await postAi<{ sentences: GuidedSentence[] }>('guided-plan', { promptId: prompt.id, chains: chainsOut(ready), stance: '', ...(sentence ? { sentence } : {}) });
      if (!r.sentences?.length) throw new AiRequestError('bad_output');
      setEssay((e) => (e.guided ? { ...e, guided: { ...e.guided, plan: r.sentences, at: 0 } } : e));
    } catch (e) {
      if (e instanceof SignedOutError) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
      setError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network);
    }
    setLoading(false);
  };
  useEffect(() => { if (g && !g.done && !g.plan) load(); }, [!!g, g?.plan]); // eslint-disable-line react-hooks/exhaustive-deps
  return { error, loading, retry: load };
}

/**
 * "Viết có hướng dẫn": one sentence at a time from the sample built on the student's chains. "Cấu trúc" shows the
 * sentence frame with its slots and the core phrases (typed by the student, never inserted); "Chi tiết" shows the
 * Vietnamese meaning and the first letter of each word. Each finished sentence joins its paragraph's draft.
 */
export function GuidedWriter({ sections, essay, setEssay, plan, error, loading, retry }: {
  sections: EssaySection[]; essay: EssayState; setEssay: (fn: (e: EssayState) => EssayState) => void;
  plan: GuidedSentence[] | null; error: string; loading: boolean; retry: () => void;
}) {
  const g = essay.guided!;
  const [typed, setTyped] = useState('');
  /** Words the student tapped to see in full (Chi tiết): one word at a time, never the whole sentence. */
  const [peek, setPeek] = useState<Set<number>>(new Set());
  const ta = useRef<HTMLTextAreaElement>(null);
  const at = g.at;
  useEffect(() => { ta.current?.focus(); }, [at]);

  const handOver = () => setEssay((e) => (e.guided ? { ...e, guided: { ...e.guided, done: true } } : e));
  const setLevel = (level: 'frame' | 'detail') => setEssay((e) => (e.guided ? { ...e, guided: { ...e.guided, level } } : e));

  if (!plan) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
        {error ? (
          <>
            <span role="alert" style={{ fontFamily: CL.sans, fontSize: 13, color: CL.redText }}>{error}</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="cl-btn" onClick={retry} style={ghostBtn}>Thử lại</button>
              <button type="button" className="cl-btn" onClick={handOver} style={linkBtn}>Tự viết</button>
            </span>
          </>
        ) : (
          <span role="status" style={label}>{loading ? 'Đang soạn từng câu theo mạch ý của bạn…' : ''}</span>
        )}
      </div>
    );
  }

  const s = plan[at];
  const sec = sections.find((x) => x.id === s.section);
  const last = at >= plan.length - 1;
  const detail = g.level === 'detail';
  const tokens = splitWords(s.en);
  const states = wordStates(s.en, typed);
  const ok = states.filter((x) => x.s === 'ok').length;
  // Chi tiết: every word typed right, or the ones still wrong were looked at.
  const canNext = detail ? ok === tokens.length || (!!typed.trim() && tokens.every((_, i) => states[i]?.s === 'ok' || peek.has(i))) : !!typed.trim();
  const next = () => {
    if (!canNext) return;
    const text = typed.trim();
    // Cleared here, not in an effect after the render, so a key pressed right after Enter starts the new sentence.
    setTyped(''); setPeek(new Set());
    setEssay((e) => {
      if (!e.guided || e.guided.at !== at) return e;
      const prev = (e.drafts[s.section] || '').trim();
      return { ...e, drafts: { ...e.drafts, [s.section]: prev ? prev + ' ' + text : text }, guided: { ...e.guided, at: e.guided.at + 1, done: last ? true : e.guided.done } };
    });
  };

  // What has been written so far, paragraph by paragraph.
  const written = sections.filter((x) => (essay.drafts[x.id] || '').trim());

  return (
    <>
      <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {written.map((x) => (
          <div key={x.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={label}>{x.label}</span>
            <p style={{ margin: 0, fontFamily: CL.serif, fontSize: 15, lineHeight: 1.75, color: CL.ink7 }}>{essay.drafts[x.id]}</p>
          </div>
        ))}

        <div className="co-unfold" key={at} style={{ borderRadius: 12, border: '1px solid #DCE7F7', background: '#F7F9FD', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {detail ? (
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={label}>{sec?.label} · nghĩa của câu · bấm một từ để xem cả từ</span>
                <span style={{ ...label, marginLeft: 'auto' }}>{ok}/{tokens.length} từ đúng</span>
              </span>
              <span style={{ fontFamily: CL.sans, fontSize: 15.5, fontWeight: 600, lineHeight: 1.5, color: CL.ink }}>{s.vi}</span>
              <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {tokens.map((w, i) => {
                  const st = states[i];
                  const good = st?.s === 'ok', bad = st?.s === 'bad';
                  const seen = peek.has(i);
                  return (
                    <button key={i} type="button" className="cl-btn" disabled={good || seen} aria-label={good || seen ? w : 'Xem từ thứ ' + (i + 1)}
                      onClick={() => { setPeek((p) => new Set(p).add(i)); ta.current?.focus(); }}
                      style={{ display: 'inline-block', borderRadius: 6, padding: '3px 8px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13, cursor: good || seen ? 'default' : 'pointer', border: '1px solid ' + (good ? '#BFE0B5' : bad ? '#F0C7BE' : '#E5E5E5'), background: good ? '#EDF7EA' : bad ? CL.redSoft : '#fff', color: good ? '#2D6E1E' : bad ? CL.redText : seen ? CL.ink8 : '#737373' }}>
                      {good || seen ? w : hint(w)}
                    </button>
                  );
                })}
              </span>
            </>
          ) : (
            <>
              <span style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={label}>{sec?.label}</span>
                <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 600, color: CL.ink }}>{s.idea}</span>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={label}>Cấu trúc</span>
                <Frame text={s.frame} />
                {s.note && <span style={label}>{s.note}</span>}
              </span>
              {s.vocab.length > 0 && (
                <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={label}>Từ vựng chính</span>
                  <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {s.vocab.map((v) => <span key={v} style={{ borderRadius: 8, padding: '5px 10px', background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.05)', fontFamily: CL.sans, fontSize: 13, fontWeight: 500, color: CL.ink7 }}>{v}</span>)}
                  </span>
                </span>
              )}
            </>
          )}
        </div>

        <textarea ref={ta} className="co-ta" value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Câu của bạn" placeholder="Gõ câu tiếng Anh của bạn…"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); next(); } }}
          style={{ flexShrink: 0, minHeight: 84, resize: 'none', border: '1px solid #77A1DD', borderRadius: 12, boxShadow: '0 0 0 3px #EEF3FC', outline: 'none', padding: '12px 14px', fontFamily: CL.serif, fontSize: 15, lineHeight: 1.6, color: CL.ink, background: '#fff', fieldSizing: 'content' } as React.CSSProperties} />
      </div>
      <div style={{ flexShrink: 0, padding: '12px 20px', borderTop: '1px solid ' + CL.ink1, background: CL.panel, display: 'flex', alignItems: 'center', gap: 8 }}>
        {!detail && <button type="button" className="cl-btn" onClick={() => setLevel('detail')} style={ghostBtn}>Vẫn bí? Gợi ý chi tiết</button>}
        <button type="button" className="cl-btn" onClick={handOver} style={linkBtn}>Tự viết phần còn lại</button>
        <button type="button" className="cl-btn cl-primary" onClick={next} disabled={!canNext} style={{ ...primaryBtn, ...nowrap, marginLeft: 'auto', opacity: canNext ? 1 : 0.45 }}>{last ? 'Xong' : 'Câu tiếp'}</button>
      </div>
    </>
  );
}

/** Header controls: hint level and progress. */
export function GuidedHeader({ essay, setEssay, total }: { essay: EssayState; setEssay: (fn: (e: EssayState) => EssayState) => void; total: number }) {
  const g = essay.guided!;
  const seg = (lv: 'frame' | 'detail', t: string) => (
    <button type="button" className="cl-btn" aria-pressed={g.level === lv} onClick={() => setEssay((e) => (e.guided ? { ...e, guided: { ...e.guided, level: lv } } : e))}
      style={{ ...nowrap, borderRadius: 6, padding: '4px 10px', border: 'none', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 500, background: g.level === lv ? '#fff' : 'transparent', color: g.level === lv ? CL.ink : CL.ink5, boxShadow: g.level === lv ? '0 1px 2px rgba(0,0,0,.08)' : 'none' }}>{t}</button>
  );
  return (
    <>
      <span style={{ ...nowrap, borderRadius: 6, padding: '2px 8px', background: '#EEF3FC', color: '#2F62C4', fontFamily: CL.sans, fontSize: 12, fontWeight: 500 }}>Có hướng dẫn</span>
      {total > 0 && (
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ ...label, ...nowrap }}>Gợi ý</span>
          <span style={{ display: 'inline-flex', gap: 3, padding: 3, borderRadius: 9, background: '#F5F5F5' }}>{seg('frame', 'Cấu trúc')}{seg('detail', 'Chi tiết')}</span>
          <span style={{ ...label, ...nowrap }}>Câu <b style={{ color: CL.ink }}>{Math.min(g.at + 1, total)}</b> / {total}</span>
        </span>
      )}
    </>
  );
}
