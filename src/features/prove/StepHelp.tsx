'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CL } from '../chainlab/constants';
import { miniBtn } from '../coach/ChainEditor';
import type { ChainIn } from '../coach/useCoach';
import { AI_ERROR_TEXT, AiRequestError, postAi } from '../ai/request';
import { findPrompt } from '@/content/prompts';

interface Phrase { en: string; vi: string }
interface Scan { used: string[]; parts: { text: string; phrases: Phrase[] }[] }
type Load<T> = { state: 'loading' } | { state: 'error'; error: string } | { state: 'done'; data: T };

const errText = (e: unknown) => (e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network);
const card: React.CSSProperties = { borderRadius: 10, border: '1px solid #E5E5E5', background: '#fff', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 };
const panel: React.CSSProperties = { borderRadius: 12, border: '1px solid #DCE7F7', background: '#F7F9FD', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 };
const label: React.CSSProperties = { fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink5 };
const linkBtn: React.CSSProperties = { marginLeft: 'auto', border: 'none', background: 'none', padding: '2px 4px', cursor: 'pointer', fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink5 };

type SaveState = 'saving' | 'saved' | 'full' | 'error';
const SAVE_LABEL: Record<SaveState, string> = { saving: 'Đang lưu…', saved: 'Đã lưu', full: 'Sổ từ đã đầy', error: 'Thử lại' };

/** A phrase with its meaning, and "Lưu" to file it under Từ vựng › Đã lưu. */
function PhraseRow({ p, used, save, state }: { p: Phrase; used?: boolean; save?: () => void; state?: SaveState }) {
  return (
    <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
      <b style={{ borderRadius: 6, padding: '3px 8px', fontFamily: CL.sans, fontSize: 13.5, fontWeight: 500, background: used ? CL.mintSoft : '#EEF3FC', color: used ? CL.greenText : '#2F62C4' }}>{p.en}</b>
      <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5 }}>{used ? 'bạn đã dùng' : p.vi}</span>
      {save && (
        <button type="button" className="cl-btn" onClick={save} disabled={state === 'saving' || state === 'saved' || state === 'full'}
          style={{ ...linkBtn, color: state === 'saved' ? CL.greenText : state === 'full' || state === 'error' ? CL.redText : CL.ink5 }}>
          {state ? SAVE_LABEL[state] : 'Lưu'}
        </button>
      )}
    </span>
  );
}

/**
 * Per-step help in the quick drill. "Gợi ý" on a step gives a guiding question (shown as the step's placeholder) and vocabulary; after
 * Enter, the AI reads the step: which suggested phrases were used, and better wording for every rough part (the next
 * step's question comes only from "Gợi ý"). Students always type the phrases themselves; nothing is inserted on click.
 */
interface Vocab { question: string; phrases: Phrase[]; sample?: string; sampleVi?: string }

/**
 * `limit`: how many times "Gợi ý" can be used per statement (the drill: 2), after which the button goes away; none =
 * unlimited. Each use also carries a sample sentence behind "Xem câu mẫu", for when the question doesn't help.
 */
export function useStepHelp(promptId: string, base: Omit<ChainIn, 'steps'>, steps: string[], firstQuestion: string, limit?: number) {
  const [vocab, setVocab] = useState<Record<number, Load<Vocab>>>({});
  /** "Gợi ý" uses so far for this statement, and the steps whose sample sentence is open. */
  const [uses, setUses] = useState(0);
  const [sampleOpen, setSampleOpen] = useState<Record<number, boolean>>({});
  const [hidden, setHidden] = useState<Record<number, boolean>>({});
  /** Per step: the text that was scanned, the scan, and how many steps there were then (to tell whether this step moved). */
  const [scans, setScans] = useState<Record<number, { text: string; count: number; load: Load<Scan> }>>({});
  const [closed, setClosed] = useState<Record<number, boolean>>({});
  const key = promptId + '|' + base.start + '|' + base.end;
  // Saving a phrase to Từ vựng › Đã lưu, filed under the essay question's topic (kept across statements).
  const [saved, setSaved] = useState<Record<string, SaveState>>({});
  const topic = findPrompt(promptId)?.topic;
  const savePhrase = async (p: Phrase) => {
    if (saved[p.en] === 'saving' || saved[p.en] === 'saved') return;
    setSaved((s) => ({ ...s, [p.en]: 'saving' }));
    let state: SaveState = 'error';
    try {
      const r = await fetch('/api/vocab/mine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ en: p.en, vi: p.vi, skill: 'task2', topic }) });
      state = r.ok ? 'saved' : r.status === 409 ? 'full' : 'error';
    } catch { /* stays "error": the button offers to try again */ }
    setSaved((s) => ({ ...s, [p.en]: state }));
  };
  const saveAll = async (list: Phrase[]) => { for (const p of list) { if (saved[p.en] !== 'saved') await savePhrase(p); } };
  const row = (p: Phrase, used?: boolean) => <PhraseRow key={p.en} p={p} used={used} save={() => savePhrase(p)} state={saved[p.en]} />;
  useEffect(() => { setVocab({}); setHidden({}); setScans({}); setClosed({}); setUses(0); setSampleOpen({}); }, [key]);
  // While a step still reads exactly as scanned it is known to be in place: re-anchor its step count, so later steps
  // added elsewhere don't hide its panel when the student then rewrites it.
  useEffect(() => {
    setScans((s) => {
      let changed = false;
      const next = { ...s };
      Object.entries(s).forEach(([k, sc]) => { const i = Number(k); if (steps[i]?.trim() === sc.text && sc.count !== steps.length) { next[i] = { ...sc, count: steps.length }; changed = true; } });
      return changed ? next : s;
    });
  }, [steps.join('\u0001')]); // eslint-disable-line react-hooks/exhaustive-deps

  const chainUpTo = (i: number): ChainIn => ({ ...base, steps: steps.slice(0, i).map((x) => x.trim()).filter(Boolean) });
  /** The step's placeholder: the question from "Gợi ý" once asked, else the drill's question for the first step. */
  const question = (i: number) => {
    const v = vocab[i];
    if (v && v.state === 'done' && v.data.question) return v.data.question;
    return i === 0 && firstQuestion ? firstQuestion : undefined;
  };

  const askVocab = async (i: number) => {
    if (vocab[i]?.state === 'loading' || (limit != null && uses >= limit)) return;
    setVocab((v) => ({ ...v, [i]: { state: 'loading' } })); setHidden((h) => ({ ...h, [i]: false })); setSampleOpen((o) => ({ ...o, [i]: false }));
    try {
      const r = await postAi<Vocab>('step-vocab', { promptId, chain: chainUpTo(i), index: i, question: question(i) || '' });
      setVocab((v) => ({ ...v, [i]: { state: 'done', data: { question: r.question || '', phrases: r.phrases || [], sample: r.sample || '', sampleVi: r.sampleVi || '' } } }));
      // Only an answered request counts against the limit; a failed one can be tried again.
      setUses((n) => n + 1);
    } catch (e) { setVocab((v) => ({ ...v, [i]: { state: 'error', error: errText(e) } })); }
  };

  const onSubmitStep = async (i: number, text: string) => {
    if (scans[i]?.text === text) return;
    const v = vocab[i];
    const suggested = v && v.state === 'done' ? v.data.phrases.map((p) => p.en) : [];
    setScans((s) => ({ ...s, [i]: { text, count: steps.length, load: { state: 'loading' } } })); setClosed((c) => ({ ...c, [i]: false }));
    try {
      const r = await postAi<Scan>('step-scan', { promptId, chain: chainUpTo(i), index: i, step: text, suggested });
      setScans((s) => (s[i]?.text === text ? { ...s, [i]: { ...s[i], load: { state: 'done', data: r } } } : s));
    } catch (e) { setScans((s) => (s[i]?.text === text ? { ...s, [i]: { ...s[i], load: { state: 'error', error: errText(e) } } } : s)); }
  };

  const belowStep = (i: number): ReactNode => {
    const sc = scans[i];
    // The panel stays while the student rewrites this step (that's when its phrases are needed). It goes only if steps
    // were added or removed since, so it can't land on the wrong step; Enter again brings a fresh scan.
    // Enter adds one empty step right after a scan, so one more step than at the last anchor still counts as the same place.
    const samePlace = !!sc && (steps[i]?.trim() === sc.text || (i < steps.length && steps.length - sc.count >= 0 && steps.length - sc.count <= 1));
    if (sc && samePlace) {
      if (sc.load.state === 'loading') return <div style={panel}><span style={label}>Đang đọc bước này…</span></div>;
      if (sc.load.state === 'error') return <div style={panel}><span style={{ ...label, color: CL.redText }}>{sc.load.error}</span></div>;
      const d = sc.load.data;
      const vd = vocab[i];
      const usedPhrases = vd && vd.state === 'done' ? vd.data.phrases.filter((p) => d.used.some((u) => u.toLowerCase() === p.en.toLowerCase())) : [];
      // One panel that stays mounted: "Thu gọn" / "Mở" slide its body closed and open (height and fade), so the steps
      // below glide instead of jumping.
      const open = !closed[i];
      return (
        <div className="co-unfold" style={{ ...panel, gap: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={label}>{open ? 'Cách nói hay hơn cho bước bạn vừa gõ' : 'Cách nói hay hơn' + (d.parts.length ? ' · ' + d.parts.length + ' chỗ' : '')}</span>
            <button type="button" className="cl-btn" style={linkBtn} aria-expanded={open} onClick={() => setClosed((c) => ({ ...c, [i]: open }))}>{open ? 'Thu gọn' : 'Mở'}</button>
          </span>
          <div className="co-fold" data-open={open || undefined}>
          <div style={{ minHeight: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
          {usedPhrases.map((p) => row(p, true))}
          {usedPhrases.length > 0 && d.parts.length > 0 && <span style={{ height: 1, background: '#DCE7F7' }} />}
          {d.parts.map((part) => (
            <span key={part.text} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={label}>Cho phần “{part.text}”:</span>
              {part.phrases.map((p) => row(p))}
            </span>
          ))}
          {d.parts.length === 0 && usedPhrases.length === 0 && <span style={{ fontFamily: CL.sans, fontSize: 13, color: CL.greenText }}>Bước này đã viết tốt.</span>}
          </div>
          </div>
          </div>
        </div>
      );
    }
    // The step being written gets the vocabulary button: the last one, or an empty one (e.g. opened at a missing step).
    if (i !== steps.length - 1 && steps[i]?.trim()) return null;
    const v = vocab[i];
    // Reopening a hidden card costs nothing; a new "Gợi ý" counts against the limit, and once it's used up the button goes.
    const left = limit == null ? null : limit - uses;
    if (v && v.state === 'done' && hidden[i]) return (
      <button type="button" className="cl-btn" onClick={() => setHidden((h) => ({ ...h, [i]: false }))} style={{ ...miniBtn, boxShadow: 'none', background: '#EEF3FC', color: '#2F62C4' }}>Gợi ý</button>
    );
    if (!v || v.state === 'error' && left === 0) {
      if (left === 0) return <span style={label}>Đã dùng hết {limit} lượt gợi ý cho câu này</span>;
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" className="cl-btn" onClick={() => askVocab(i)} style={{ ...miniBtn, boxShadow: 'none', background: '#EEF3FC', color: '#2F62C4' }}>Gợi ý</button>
          {left != null && <span style={label}>còn {left} lượt cho câu này</span>}
        </span>
      );
    }
    if (v.state === 'loading') return <div style={card}><span style={label}>Đang tìm gợi ý…</span></div>;
    if (v.state === 'error') return <div style={card}><span style={{ ...label, color: CL.redText }}>{v.error}</span></div>;
    return (
      <div className="co-unfold" style={card}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={label}>Từ vựng cho bước này</span>
          {v.data.phrases.some((p) => saved[p.en] !== 'saved') && <button type="button" className="cl-btn" style={linkBtn} onClick={() => saveAll(v.data.phrases)}>Lưu cả</button>}
          <button type="button" className="cl-btn" style={{ ...linkBtn, marginLeft: 0 }} onClick={() => setHidden((h) => ({ ...h, [i]: true }))}>Ẩn</button>
        </span>
        {v.data.phrases.map((p) => row(p))}
        {v.data.sample && <>
          <span style={{ height: 1, background: CL.ink1, margin: '2px 0' }} />
          {sampleOpen[i] ? (
            <span className="co-unfold" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={label}>Câu mẫu · gõ lại bằng tay</span>
              {/* Not selectable and not copyable: the student retypes it (a paste of it into the step is refused too). */}
              <span onCopy={(e) => e.preventDefault()} style={{ fontFamily: CL.serif, fontSize: 15, lineHeight: 1.55, color: CL.ink8, userSelect: 'none', WebkitUserSelect: 'none' }}>{v.data.sample}</span>
              {v.data.sampleVi && <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink5 }}>{v.data.sampleVi}</span>}
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={label}>Vẫn chưa biết viết gì?</span>
              <button type="button" className="cl-btn" style={{ ...linkBtn, color: '#2F62C4' }} onClick={() => setSampleOpen((o) => ({ ...o, [i]: true }))}>Xem câu mẫu</button>
            </span>
          )}
        </>}
      </div>
    );
  };

  /** A paste of a sample sentence shown here (or most of one) is refused: the sample is there to be retyped. */
  const isSamplePaste = (text: string) => {
    const t = text.trim().toLowerCase().replace(/\s+/g, ' ');
    if (t.length < 12) return false;
    return Object.values(vocab).some((v) => v.state === 'done' && !!v.data.sample && v.data.sample.toLowerCase().replace(/\s+/g, ' ').includes(t));
  };

  return { belowStep, stepQuestion: question, onSubmitStep, isSamplePaste };
}
