'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Prompt } from '@/content/prompts';
import { SignedOutError, type EssayState } from '../attempts/store';
import { AI_ERROR_TEXT, AiRequestError } from '../ai/request';
import { CL } from '../chainlab/constants';
import type { Chain, ReviewItem } from '../chainlab/types';
import { ClIcon, ClLabel, toolbarBtn } from '../chainlab/ui/primitives';
import { TranslatorChat } from '../coach/TranslatorChat';
import { primaryBtn } from '../coach/ui';
import { CRITERIA, CRITERION_STYLE, draftsKey, requestEssayReview, retryEssayCriterion, wordCount, type EssaySection } from '../desk/scoring';
import { endOf, KIND_ASK, kindOf, middleOf, startOf } from './model';

export interface WriteProps {
  prompt: Prompt;
  chains: Chain[];
  setChains: (fn: (cs: Chain[]) => Chain[]) => void;
  essay: EssayState;
  setEssay: (fn: (e: EssayState) => EssayState) => void;
  toolbarLeft: ReactNode;
}

interface Note { item: ReviewItem; crit: string; n: number }

const CRIT_SHORT: Record<string, string> = { tr: 'Task Response', cc: 'Coherence', lr: 'Lexical', gra: 'Grammar' };
const mmss = (s: number) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

export function sectionsFor(chains: Chain[]): EssaySection[] {
  return [
    { id: 'intro', label: 'Mở bài', guide: '40–55 từ', placeholder: 'Nhắc lại đề bằng lời của bạn, rồi nêu lập trường hoặc câu trả lời.' },
    ...chains.map((c, i) => ({ id: c.id, label: 'Thân bài ' + (i + 1), guide: '85–100 từ', placeholder: 'Câu chủ đề, rồi đi theo mạch bên trái: điểm đầu → từng bước → điểm cuối.' })),
    { id: 'conclusion', label: 'Kết bài', guide: '30–45 từ', placeholder: 'Nói lại câu trả lời và lý do chính.' },
  ];
}

/** Paragraph text with the review's quotes highlighted; the selected one stands out. */
function Marked({ text, notes, active, onPick }: { text: string; notes: Note[]; active: Note | null; onPick: (n: Note) => void }) {
  const spans = useMemo(() => {
    const found: { at: number; end: number; note: Note }[] = [];
    for (const note of notes) {
      const q = note.item.quote || note.item.word;
      if (!q) continue;
      const at = text.indexOf(q);
      if (at < 0 || found.some((f) => at < f.end && at + q.length > f.at)) continue;
      found.push({ at, end: at + q.length, note });
    }
    return found.sort((a, b) => a.at - b.at);
  }, [text, notes]);
  const out: ReactNode[] = [];
  let last = 0;
  spans.forEach((s, k) => {
    if (s.at > last) out.push(<span key={'t' + k}>{text.slice(last, s.at)}</span>);
    const st = CRITERION_STYLE[s.note.crit], on = active === s.note;
    out.push(<mark key={'m' + k} ref={on ? (el) => el?.scrollIntoView({ block: 'center', behavior: 'smooth' }) : undefined} onClick={() => onPick(s.note)} style={{ cursor: 'pointer', color: 'inherit', borderRadius: 3, background: on ? st.soft : 'transparent', boxShadow: 'inset 0 -2px 0 ' + st.line, padding: '0 1px', transition: 'background-color .2s' }}>{text.slice(s.at, s.end)}</mark>);
    last = s.end;
  });
  if (last < text.length) out.push(<span key="end">{text.slice(last)}</span>);
  return <>{out}</>;
}

/** The chain next to its paragraph: start, middle, end. A note about one step tints that step. */
function MiniChain({ prompt, chain, num, first, last, onMove, hit }: { prompt: Prompt; chain: Chain; num: number; first: boolean; last: boolean; onMove: (d: -1 | 1) => void; hit: { at: number | null; bg: string } | null }) {
  const steps = [startOf(chain), ...middleOf(chain).filter((s) => s.trim()), endOf(chain)];
  const total = chain.steps.length;
  // `at` indexes the stored steps (start, middle…, end); map it onto the shown list, which skips empty middle steps.
  const shownAt = hit && hit.at != null ? (hit.at === 0 ? 0 : hit.at === total - 1 ? steps.length - 1 : 1 + middleOf(chain).slice(0, hit.at - 1).filter((s) => s.trim()).length) : null;
  const arrowBtn = (d: -1 | 1, off: boolean) => (
    <button type="button" className="cl-btn cl-link" onClick={() => onMove(d)} disabled={off} aria-label={d < 0 ? 'Đưa thân bài lên' : 'Đưa thân bài xuống'} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid ' + CL.ink1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: CL.ink5, opacity: off ? 0.3 : 1 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d < 0 ? <path d="M6 15l6-6 6 6" /> : <path d="M6 9l6 6 6-6" />}</svg>
    </button>
  );
  return (
    <div style={{ borderRadius: 12, border: '1px solid ' + CL.ink2, background: '#fff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px 10px 14px', borderBottom: '1px solid ' + CL.ink1, background: hit && hit.at == null ? hit.bg : '#fff', transition: 'background-color .2s' }}>
        <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 600, color: CL.ink }}>Thân bài {num}</span>
        <span style={{ borderRadius: 999, background: '#F1F1EE', padding: '2px 9px', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: CL.ink6 }}>{KIND_ASK[kindOf(prompt, chain)].chip}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>{arrowBtn(-1, first)}{arrowBtn(1, last)}</span>
      </div>
      <ol style={{ position: 'relative', listStyle: 'none', margin: 0, padding: '10px 10px 12px' }}>
        <span aria-hidden="true" style={{ position: 'absolute', left: 20.5, top: 22, bottom: 24, width: 1, background: CL.ink2 }} />
        {steps.map((s, k) => {
          const isStart = k === 0, isEnd = k === steps.length - 1;
          return (
            <li key={k} style={{ position: 'relative', display: 'flex', gap: 10, alignItems: 'baseline', padding: '4px 6px', borderRadius: 6, background: shownAt === k ? hit!.bg : 'transparent', transition: 'background-color .2s' }}>
              <span style={{ position: 'relative', top: 1, width: 9, height: 9, flexShrink: 0, borderRadius: isEnd ? 2 : 999, background: isStart ? CL.green : isEnd ? '#B8862B' : CL.ink3, boxShadow: '0 0 0 3px ' + (shownAt === k ? hit!.bg : '#fff') }} />
              <span style={{ fontFamily: isEnd ? CL.sans : CL.serif, fontSize: 13, fontWeight: isEnd ? 600 : 400, lineHeight: 1.5, color: isEnd ? '#8A5A12' : isStart ? CL.ink8 : CL.ink6 }}>{s || '—'}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** ② Viết bài: each body paragraph beside its chain; after "Nộp bài", the band, the scores and comments that point at the essay and the chain. */
export function WriteScreen({ prompt, chains, setChains, essay, setEssay, toolbarLeft }: WriteProps) {
  const sections = sectionsFor(chains);
  const review = essay.review;
  const editing = !review || !!essay.fixing;
  const [chat, setChat] = useState(!review);
  const [showPrompt, setShowPrompt] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState<Note | null>(null);
  const [retrying, setRetrying] = useState(false);

  // Timer: runs while the student is writing.
  const tick = useRef(setEssay);
  tick.current = setEssay;
  useEffect(() => {
    if (!editing) return;
    const t = setInterval(() => tick.current((e) => ({ ...e, seconds: (e.seconds || 0) + 1 })), 1000);
    return () => clearInterval(t);
  }, [editing]);

  const words = sections.reduce((n, s) => n + wordCount(essay.drafts[s.id]), 0);
  const notes: Note[] = useMemo(() => {
    if (!review) return [];
    let n = 0;
    return review.groups.flatMap((g) => g.items.map((item) => ({ item, crit: g.id, n: ++n })));
  }, [review]);
  const stale = !!review && review.key !== draftsKey(essay.drafts);
  const setDraft = (id: string, v: string) => setEssay((e) => ({ ...e, drafts: { ...e.drafts, [id]: v } }));
  const move = (i: number, d: -1 | 1) => setChains((cs) => { const a = [...cs]; [a[i], a[i + d]] = [a[i + d], a[i]]; return a; });

  const submit = async () => {
    if (sending || !words) return;
    setSending(true); setError(''); setActive(null);
    try {
      const r = await requestEssayReview(prompt, sections, essay.drafts, chains, '');
      setEssay((e) => ({ ...e, review: r, fixing: false, prevScores: e.review ? e.review.scores : null }));
      setChat(false);
    } catch (e) {
      if (e instanceof SignedOutError) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
      setError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network);
    }
    setSending(false);
  };
  const retry = async () => {
    if (!review || !review.failed || retrying) return;
    setRetrying(true);
    let groups = review.groups, failed = [...review.failed];
    for (const id of review.failed) {
      try {
        const items = await retryEssayCriterion(review, prompt, sections, essay.drafts, chains, '', id);
        groups = groups.map((g) => (g.id === id ? { ...g, items } : g));
        failed = failed.filter((x) => x !== id);
      } catch { /* stays failed */ }
    }
    setEssay((e) => ({ ...e, review: e.review ? { ...e.review, groups, failed: failed.length ? failed : undefined } : e.review }));
    setRetrying(false);
  };

  const hitFor = (c: Chain) => (active && active.item.chainId === c.id ? { at: active.item.at ?? null, bg: CRITERION_STYLE[active.crit].soft } : null);
  const scores = review?.scores;

  const paragraph = (s: EssaySection) => {
    const text = essay.drafts[s.id] || '';
    const wc = wordCount(text);
    const range = s.guide.match(/\d+/g)!.map(Number);
    const own = notes.filter((n) => n.item.sectionId === s.id);
    return (
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: CL.sans, fontSize: 14, fontWeight: 600, color: CL.ink }}>{s.label}</span>
          <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>{s.guide}</span>
          <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11, fontWeight: 600, color: wc >= range[0] && wc <= range[1] ? CL.green : CL.ink4 }}>{wc} từ</span>
        </span>
        <div style={{ borderRadius: 12, border: '1px solid ' + CL.ink2, background: '#fff', padding: '14px 18px' }}>
          {editing ? (
            <textarea className="co-ta" value={text} onChange={(e) => setDraft(s.id, e.target.value)} rows={3} placeholder={s.placeholder} aria-label={s.label}
              style={{ display: 'block', width: '100%', minHeight: 72, resize: 'none', border: 'none', outline: 'none', background: 'transparent', padding: 0, fontFamily: CL.serif, fontSize: 15, lineHeight: 1.75, color: CL.ink8 }} />
          ) : (
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: CL.serif, fontSize: 15, lineHeight: 1.75, color: CL.ink8 }}>{text ? <Marked text={text} notes={own} active={active} onPick={(n) => setActive(active === n ? null : n)} /> : <span style={{ color: CL.ink4 }}>(trống)</span>}</p>
          )}
        </div>
      </div>
    );
  };
  const noChain = (label: string) => <div style={{ marginTop: 26, borderRadius: 12, border: '1px dashed ' + CL.ink2, padding: '12px 14px', fontFamily: CL.sans, fontSize: 12.5, color: CL.ink4 }}>{label} · không cần mạch</div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1710, margin: '0 auto', padding: '12px 40px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, minHeight: 42, paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {toolbarLeft}
          <span style={{ width: 1, height: 18, background: CL.ink2 }} />
          <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5 }}>Thời gian <b style={{ color: CL.ink, fontSize: 15, marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>{mmss(essay.seconds || 0)}</b></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {error && <span role="alert" style={{ fontFamily: CL.sans, fontSize: 12, color: CL.redText, marginRight: 4 }}>{error}</span>}
          <button type="button" className="cl-btn" onClick={() => setShowPrompt(!showPrompt)} aria-pressed={showPrompt} style={toolbarBtn(showPrompt)}>Đề bài</button>
          <button type="button" className="cl-btn" onClick={() => setChat(!chat)} aria-pressed={chat} style={toolbarBtn(chat)}>Dịch</button>
          {editing
            ? <button type="button" className="cl-btn cl-primary" onClick={submit} disabled={sending || !words} style={{ ...primaryBtn, opacity: sending || !words ? 0.4 : 1 }}>{sending ? 'Đang chấm…' : review ? 'Nộp lại' : 'Nộp bài'}</button>
            : <button type="button" className="cl-btn" onClick={() => { setEssay((e) => ({ ...e, fixing: true })); setActive(null); }} style={{ ...toolbarBtn(false), color: CL.ink }}>Sửa bài</button>}
        </div>
      </div>

      <div className="co-grid">
        <main className="co-col" style={{ minWidth: 0 }}>
          <section style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 56, padding: '0 24px', borderBottom: '1px solid ' + CL.ink1, background: CL.panel }}>
              <ClLabel color={CL.ink}>Bài viết</ClLabel>
              <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>{editing ? 'Mỗi đoạn thân bài nằm cạnh mạch của nó.' : 'Bấm chỗ tô màu để xem nhận xét.'}{stale && editing ? ' Bạn đã sửa bài, nộp lại để chấm bản mới.' : ''}</span>
              <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>Số từ: <b style={{ color: words >= 250 ? CL.green : CL.ink }}>{words}</b> / 250</span>
            </div>
            <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 24px 28px' }}>
              {showPrompt && <p className="cl-rise" style={{ margin: '0 0 18px', borderRadius: 12, background: CL.panel, padding: '12px 16px', fontFamily: CL.sans, fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, color: CL.ink8 }}>{prompt.text}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 330px) minmax(0, 1fr)', columnGap: 22, rowGap: 24, alignItems: 'start' }}>
                <ClLabel>Mạch</ClLabel><ClLabel>Đoạn văn</ClLabel>
                {noChain('Mở bài')}{paragraph(sections[0])}
                {chains.map((c, i) => (
                  <div key={c.id} style={{ display: 'contents' }}>
                    <div style={{ marginTop: 26 }}><MiniChain prompt={prompt} chain={c} num={i + 1} first={i === 0} last={i === chains.length - 1} onMove={(d) => move(i, d)} hit={hitFor(c)} /></div>
                    {paragraph(sections[i + 1])}
                  </div>
                ))}
                {noChain('Kết bài')}{paragraph(sections[sections.length - 1])}
              </div>
            </div>
          </section>
        </main>

        <aside className="co-col cl-scroll" style={{ minWidth: 0, overflowY: chat ? 'hidden' : 'auto' }}>
          {review && scores && (
            <section style={{ flexShrink: 0, borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 22, borderRight: '1px solid ' + CL.ink1 }}>
                  <ClLabel>Band</ClLabel>
                  <span style={{ fontFamily: CL.serif, fontSize: 46, fontWeight: 500, lineHeight: 1, color: CL.ink }}>{scores.band.toFixed(1)}</span>
                  <span style={{ fontFamily: CL.sans, fontSize: 11.5, color: CL.ink5 }}>{notes.length} nhận xét</span>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {CRITERIA.map(([id]) => {
                    const v = scores[id as 'tr'];
                    return (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 104, flexShrink: 0, fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink7, whiteSpace: 'nowrap' }}>{CRIT_SHORT[id]}</span>
                        <span style={{ flex: 1, height: 4, borderRadius: 999, background: CL.ink1, overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: Math.max(0, Math.min(100, ((v - 4) / 5) * 100)) + '%', borderRadius: 999, background: CL.mint }} /></span>
                        <span style={{ width: 28, textAlign: 'right', fontFamily: CL.sans, fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: CL.ink }}>{v.toFixed(1)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {review.summary && <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.6, color: CL.ink6 }}>{review.summary}</p>}
              {review.failed && review.failed.length > 0 && (
                <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 12, color: CL.redText }}>Chưa tải được nhận xét của {review.failed.map((id) => CRIT_SHORT[id]).join(', ')}. <button type="button" className="cl-btn" onClick={retry} disabled={retrying} style={{ textDecoration: 'underline', color: CL.ink, fontSize: 12 }}>{retrying ? 'Đang tải…' : 'Thử lại'}</button></p>
              )}
            </section>
          )}
          {review && !chat && notes.map((note) => {
            const on = active === note, st = CRITERION_STYLE[note.crit];
            return (
              <button key={note.item.key + note.crit} type="button" className="cl-btn" onClick={() => setActive(on ? null : note)} aria-pressed={on}
                style={{ flexShrink: 0, textAlign: 'left', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, borderRadius: 18, border: '1px solid ' + CL.border, background: on ? CL.panel : '#fff', opacity: stale ? 0.6 : 1, transition: 'background-color .2s' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 3, height: 14, borderRadius: 2, background: st.line }} />
                  <span style={{ fontFamily: CL.sans, fontSize: 14, fontWeight: 600, color: CL.ink }}>{note.item.label || CRIT_SHORT[note.crit]}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11, color: CL.ink4, textAlign: 'right' }}>{CRIT_SHORT[note.crit]} · {note.item.where.split(' · Mạch')[0]}{note.item.chainId ? ' · bài + mạch' : ''}</span>
                </span>
                {note.item.quote && <span style={{ padding: '8px 10px', borderRadius: 8, background: st.soft, fontFamily: CL.serif, fontSize: 13, lineHeight: 1.5, color: CL.ink8 }}>“{note.item.quote}”</span>}
                <span style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.55, color: CL.ink7 }}>{note.item.text.replace(/\*\*/g, '')}</span>
                {note.item.fix && <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.greenText }}>Sửa: <i style={{ fontFamily: CL.serif }}>{note.item.fix}</i></span>}
              </button>
            );
          })}
          {chat && <TranslatorChat onClose={() => setChat(false)} />}
          {!review && !chat && <p style={{ margin: 0, padding: '4px 6px', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.6, color: CL.ink4 }}>Viết xong bấm “Nộp bài”. Điểm và nhận xét hiện ở đây; mỗi nhận xét chỉ vào câu trong bài và bước trong mạch.</p>}
        </aside>
      </div>
    </div>
  );
}
