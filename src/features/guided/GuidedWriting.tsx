'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { CL } from '../chainlab/constants';
import { backLinkStyle, ClIcon, ClLabel } from '../chainlab/ui/primitives';
import { GW_SAMPLES, GW_VOCAB_STYLE, toolStyle, type GuidedSample, type Segment } from './data';
import { mask, partial, wordStates, words as splitWords } from './matching';

const vStyle = (seg: Segment, k: number) => (seg.vocabStyle && seg.vocabStyle[k]) || GW_VOCAB_STYLE;

function ToolChip({ tool, small }: { tool: string; small?: boolean }) {
  const s = toolStyle(tool);
  return <span style={{ display: 'inline-block', borderRadius: 5, padding: small ? '2px 6px' : '4px 8px', background: s.bg, color: s.fg, fontFamily: CL.sans, fontSize: small ? 9 : 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{tool}</span>;
}

/** A sentence's chip(s): the tool it uses (essays) or the vocab items it practises (vocab mode). `hidden` shows the Vietnamese instead of the answer. */
function SegChips({ seg, small, hidden }: { seg: Segment; small?: boolean; hidden?: boolean }) {
  if (!seg.vocab) return <ToolChip tool={seg.tool} small={small} />;
  const list = hidden ? seg.vocab.map((v, k) => (seg.vocabVi && seg.vocabVi[k]) || mask(v)) : seg.vocab;
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4, verticalAlign: 'middle' }}>
      {list.map((v, k) => <span key={v} style={{ borderRadius: 5, padding: small ? '1px 6px' : '3px 8px', background: vStyle(seg, k).bg, color: vStyle(seg, k).fg, fontFamily: CL.sans, fontSize: small ? 10.5 : 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{v}</span>)}
    </span>
  );
}

function barColor(seg: Segment) {
  if (seg.vocab) {
    // A linking sentence in a practice paragraph may use none of the ticked phrases.
    if (!seg.vocab.length) return '#ECECEA';
    const c = seg.vocab.map((_, k) => vStyle(seg, k).hl);
    return c.length > 1 ? 'linear-gradient(90deg,' + c.map((x, k) => x + ' ' + (k * 100 / c.length) + '%,' + x + ' ' + ((k + 1) * 100 / c.length) + '%').join(',') + ')' : c[0];
  }
  const ts = toolStyle(seg.tool);
  return ts.fg === '#FFFFFF' ? '#FFE17C' : ts.bg;
}

/** A finished sentence in the left column, with its key phrase(s) highlighted. */
function Revealed({ seg }: { seg: Segment }) {
  const marks = seg.hl || seg.vocab || (seg.mark ? [seg.mark] : []);
  const hlFor = (m: string) => (seg.vocab ? vStyle(seg, Math.max(0, marks.indexOf(m))).hl : barColor(seg));
  const parts: [string, string | false][] = [];
  let rest = seg.en;
  while (rest) {
    let best: { i: number; m: string } | null = null;
    marks.forEach((m) => { const i = rest.toLowerCase().indexOf(m.toLowerCase()); if (i >= 0 && (!best || i < best.i)) best = { i, m }; });
    if (!best) { parts.push([rest, false]); break; }
    if (best.i) parts.push([rest.slice(0, best.i), false]);
    parts.push([rest.slice(best.i, best.i + best.m.length), best.m]);
    rest = rest.slice(best.i + best.m.length);
  }
  // Essay labels go before the sentence they describe, as in the book's SAMPLE essays; vocab chips follow it.
  const chip = <SegChips seg={seg} small />;
  return (
    <span>
      {!seg.vocab && <>{chip}{' '}</>}
      {parts.map(([t, on], k) => on ? <span key={k} style={{ background: hlFor(on), borderRadius: 3, padding: '0 2px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>{t}</span> : <Fragment key={k}>{t}</Fragment>)}
      {' '}{seg.vocab && <>{chip}{' '}</>}
    </span>
  );
}

export interface GuidedWritingProps {
  sample?: GuidedSample;
  onBack: () => void;
  backLabel?: string;
  label?: string;
  textLabel?: string;
  taskLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
  onFinish?: () => void;
}

/**
 * Chép mẫu: rebuild a sample essay one sentence at a time from the Vietnamese meaning,
 * the first letter of every word and the tool chip. Wrong words turn red; no score.
 */
export function GuidedWriting({ sample = GW_SAMPLES.charity, onBack, backLabel = 'Thư viện đề', label = 'Chép mẫu', textLabel = 'Bài mẫu', onNext, nextLabel, onFinish, taskLabel = 'Writing Task 2' }: GuidedWritingProps) {
  const flat = useMemo(() => sample.paragraphs.flatMap((p, pi) => p.map((s, si) => ({ ...s, pi, si }))), [sample]);
  const [cur, setCur] = useState(0);
  const [typed, setTyped] = useState('');
  const [peek, setPeek] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [shown, setShown] = useState<number[]>([]); // sentences finished by revealing the answer
  const [shake, setShake] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const done = cur >= flat.length;
  const seg = flat[cur];
  const words = seg ? splitWords(seg.en) : [];
  const states = seg ? wordStates(seg.en, typed) : [];
  const nOk = states.filter((x) => x.s === 'ok').length;
  const all = seg && nOk === words.length;

  useEffect(() => { setTyped(''); setPeek([]); setShowAll(false); if (taRef.current) taRef.current.focus(); }, [cur]);
  useEffect(() => { if (done && onFinish) onFinish(); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = (revealed: boolean) => { if (revealed) setShown((s) => [...s, cur]); setCur((c) => c + 1); };
  const submit = () => { if (all) next(false); else { setShake(true); setTimeout(() => setShake(false), 400); } };
  const restart = () => { setCur(0); setShown([]); };
  const card = { borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 1710, margin: '0 auto', padding: '12px 40px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 42, paddingBottom: 12 }}>
        <button type="button" className="cl-btn cl-link" onClick={onBack} style={backLinkStyle}><ClIcon name="left" size={14} />{backLabel}</button>
        <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>Câu <b style={{ color: CL.ink, fontWeight: 600 }}>{Math.min(cur + 1, flat.length)}</b> / {flat.length}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 26 }}>
        {/* Left: prompt + the essay, revealed as the student finishes each sentence */}
        <aside className="cl-scroll" style={{ ...card, minHeight: 0, overflowY: 'auto', padding: '26px 26px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <ClLabel>{label}</ClLabel>
            <ClLabel color={CL.ink4} style={{ fontSize: 9.5 }}>{taskLabel}</ClLabel>
          </div>
          <div style={{ border: '1px solid ' + CL.ink3, padding: '14px 16px' }}>
            <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 13, fontWeight: 600, fontStyle: 'italic', lineHeight: 1.55, color: '#20252D', textWrap: 'pretty' }}>{sample.prompt}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 28, marginBottom: 14 }}>
            <ClLabel color={CL.ink}>{textLabel}</ClLabel>
            <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>Hiện dần sau mỗi câu bạn viết xong</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sample.paragraphs.map((p, pi) => (
              <p key={pi} style={{ margin: 0, fontFamily: CL.serif, fontSize: 15, lineHeight: 1.8, color: CL.ink8 }}>
                {p.map((s, si) => {
                  const k = flat.findIndex((x) => x.pi === pi && x.si === si);
                  if (k < cur) return <span key={si} style={{ opacity: shown.includes(k) ? 0.7 : 1 }}><Revealed seg={s} /></span>;
                  const w = Math.max(30, Math.min(100, s.en.length / 2.2));
                  return (
                    <span key={si} title={k === cur ? 'Câu đang viết' : ''} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: w + '%', margin: '0 8px 6px 0', verticalAlign: 'middle' }}>
                      {!s.vocab && <SegChips seg={s} small hidden />}
                      <span style={{ flex: 1, minWidth: 24, height: 10, borderRadius: 999, background: barColor(s), boxShadow: k === cur ? '0 0 0 2px ' + CL.ink : 'none' }} />
                      {s.vocab && <SegChips seg={s} small hidden />}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>
        </aside>

        {/* Right: meaning, the sentence being written, what comes next */}
        <main className="cl-scroll" style={{ minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, padding: 2 }}>
          {done ? (
            <section style={{ ...card, padding: '28px 26px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
              <ClLabel color={CL.ink}>Xong bài</ClLabel>
              <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 14, lineHeight: 1.6, color: CL.ink7 }}>Bạn đã viết lại đủ {flat.length} câu{shown.length ? ', có ' + shown.length + ' câu xem đáp án' : ''}. {flat.some((x) => x.vocab) ? 'Đọc lại đoạn văn bên trái, để ý các cụm từ được tô màu.' : 'Đọc lại bài bên trái, để ý mỗi câu đang làm việc gì qua các chip.'}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {onNext && <button type="button" className="cl-btn cl-primary" onClick={onNext} style={{ height: 40, borderRadius: 12, background: CL.ink, color: '#fff', fontFamily: CL.sans, fontSize: 13, fontWeight: 600, padding: '0 20px' }}>{nextLabel || 'Tiếp'}</button>}
                <button type="button" className="cl-btn" onClick={restart} style={{ height: 40, borderRadius: 12, border: '1px solid ' + CL.ink2, background: onNext ? '#fff' : CL.ink, color: onNext ? CL.ink : '#fff', fontFamily: CL.sans, fontSize: 13, fontWeight: 600, padding: '0 20px' }}>Làm lại từ đầu</button>
              </div>
            </section>
          ) : (
            <Fragment>
              <section style={{ ...card, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <ClLabel>Tiếng Việt → English</ClLabel>
                  <span style={{ marginLeft: 'auto' }}><SegChips seg={seg} hidden /></span>
                </div>
                <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 19, fontWeight: 600, lineHeight: 1.5, color: CL.ink, textWrap: 'pretty' }}>{seg.vi}</p>
              </section>

              <section style={{ ...card, padding: '22px 24px', transform: shake ? 'translateX(4px)' : 'none', transition: 'transform .1s' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                  <ClLabel>Câu mẫu · chữ cái đầu</ClLabel>
                  <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11.5, fontWeight: 600, color: all ? CL.greenText : CL.ink5 }}>{nOk}/{words.length} từ đúng</span>
                </div>
                <div style={{ height: 4, borderRadius: 999, background: CL.ink1, overflow: 'hidden', marginBottom: 14 }}><div style={{ width: (words.length ? nOk / words.length * 100 : 0) + '%', height: '100%', background: CL.mint, transition: 'width .2s' }} /></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {words.map((w, i) => {
                    const st = states[i] || { s: null, n: 0 };
                    const peeked = showAll || peek.includes(i);
                    const text = st.s === 'ok' || peeked ? w : st.s === 'part' ? partial(w, st.n) : mask(w);
                    const look = st.s === 'ok' ? { bd: CL.mint, bg: CL.mintSoft, fg: CL.greenText }
                      : st.s === 'bad' ? { bd: '#F0C7BE', bg: CL.redSoft, fg: CL.redText }
                      : st.s === 'part' ? { bd: CL.ink4, bg: '#fff', fg: CL.ink8 }
                      : { bd: CL.ink2, bg: '#fff', fg: peeked ? CL.ink8 : CL.ink4 };
                    return (
                      <button key={i} type="button" className="cl-btn" title={st.s === 'ok' ? '' : peeked ? 'Bấm để ẩn lại' : 'Bấm để xem từ này'} onClick={() => { if (st.s !== 'ok') setPeek((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i])); }} style={{ borderRadius: 7, border: '1px solid ' + look.bd, background: look.bg, padding: '5px 9px', fontFamily: CL.serif, fontSize: 14, color: look.fg, cursor: st.s === 'ok' ? 'default' : 'pointer', transition: 'background .15s, border-color .15s' }}>{text}</button>
                    );
                  })}
                </div>
                <textarea ref={taRef} className="cl-ta cl-field" value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder="Gõ câu tiếng Anh của bạn ở đây…" aria-label="Câu tiếng Anh của bạn" rows={3} style={{ display: 'block', width: '100%', marginTop: 16, minHeight: 96, resize: 'none', borderRadius: 12, border: '1px solid ' + CL.ink2, outline: 'none', background: 'transparent', fontFamily: CL.serif, fontSize: 15.5, lineHeight: 1.7, color: CL.ink8, padding: '12px 16px', fieldSizing: 'content' } as React.CSSProperties} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <button type="button" className="cl-btn cl-link" onClick={() => setShowAll(!showAll)} style={{ fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: CL.ink5, padding: '6px 4px' }}>{showAll ? 'Ẩn đáp án' : 'Hiện đáp án'}</button>
                  {showAll && !all && <button type="button" className="cl-btn cl-link" onClick={() => next(true)} style={{ fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: CL.ink5, padding: '6px 4px' }}>Bỏ qua câu này</button>}
                  <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>Enter để nộp</span>
                  <button type="button" className="cl-btn cl-primary" onClick={submit} style={{ height: 40, borderRadius: 12, background: CL.ink, color: '#fff', fontFamily: CL.sans, fontSize: 13, fontWeight: 600, padding: '0 20px', opacity: all ? 1 : 0.4 }}>Câu tiếp</button>
                </div>
              </section>

              <section style={{ ...card, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                  <ClLabel>Câu tiếp theo</ClLabel>
                  <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>còn {flat.length - cur - 1} câu</span>
                </div>
                {flat.slice(cur + 1, cur + 4).map((s, k) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderTop: k ? '1px solid ' + CL.ink1 : 'none' }}>
                    <span style={{ flex: 1, fontFamily: CL.sans, fontSize: 13, lineHeight: 1.55, color: CL.ink5 }}>{s.vi}</span>
                    <SegChips seg={s} small hidden />
                  </div>
                ))}
                {cur + 1 >= flat.length && <p style={{ margin: '8px 0 0', fontFamily: CL.sans, fontSize: 13, color: CL.ink4 }}>Đây là câu cuối.</p>}
              </section>
            </Fragment>
          )}
        </main>
      </div>
    </div>
  );
}
