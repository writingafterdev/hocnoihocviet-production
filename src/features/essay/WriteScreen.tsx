'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Prompt } from '@/content/prompts';
import { SignedOutError, type EssayState } from '../attempts/store';
import { AI_ERROR_TEXT, AiRequestError } from '../ai/request';
import { CL } from '../chainlab/constants';
import type { Chain, ReviewItem } from '../chainlab/types';
import { ClLabel, toolbarBtn } from '../chainlab/ui/primitives';
import { CoachGrid, SidePanel } from '../coach/CoachGrid';
import { TranslatorChat } from '../coach/TranslatorChat';
import { primaryBtn } from '../coach/ui';
import { bandText, CRITERIA, markStyle, CRITERION_STYLE, draftsKey, requestEssayReview, retryEssayCriterion, wordCount, type EssayReview, type EssaySection } from '../desk/scoring';
import { DiffView, fixTasks, FixView } from './FixFlow';
import { planFix, rescore } from './fix-api';
import { MiniChain } from './MiniChain';

export interface WriteProps {
  prompt: Prompt;
  chains: Chain[];
  setChains: (fn: (cs: Chain[]) => Chain[]) => void;
  essay: EssayState;
  setEssay: (fn: (e: EssayState) => EssayState) => void;
  toolbarLeft: ReactNode;
  /** ① Dựng mạch, for chains that aren't built yet. */
  chainsHref: string;
}

interface Note { item: ReviewItem; crit: string; n: number }

const CRIT_SHORT: Record<string, string> = { tr: 'Task Response', cc: 'Coherence', lr: 'Lexical Resource', gra: 'Grammar' };
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
    const on = active === s.note;
    out.push(<mark key={'m' + k} ref={on ? (el) => el?.scrollIntoView({ block: 'center', behavior: 'smooth' }) : undefined} onClick={() => onPick(s.note)} style={{ ...markStyle(s.note.crit, on), cursor: 'pointer' }}>{text.slice(s.at, s.end)}</mark>);
    last = s.end;
  });
  if (last < text.length) out.push(<span key="end">{text.slice(last)}</span>);
  return <>{out}</>;
}

/** A grey block that shimmers: stands in for text that is on its way. */
const Bone = ({ w = '100%', h = 11, r }: { w?: number | string; h?: number; r?: number }) => <span className="co-skel" style={{ width: w, height: h, ...(r ? { borderRadius: r } : {}) }} />;

/** A comment card that hasn't arrived yet: title, quote, two lines of text. */
function CommentBone() {
  return (
    <div aria-hidden="true" style={{ flexShrink: 0, padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 9, borderRadius: 12, border: '1px solid ' + CL.ink1, background: '#fff' }}>
      <span style={{ display: 'flex', justifyContent: 'space-between' }}><Bone w="46%" h={12} /><Bone w="16%" h={10} /></span>
      <Bone w="92%" h={10} /><Bone w="70%" h={10} />
      <Bone w="100%" /><Bone w="84%" />
    </div>
  );
}

/** The feedback panel while the essay is being graded and the scores haven't arrived: the layout, in grey. */
function ReviewBone() {
  return (
    <>
      <section aria-hidden="true" style={{ flexShrink: 0, borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px 14px' }}>
          <Bone w={64} h={44} r={10} />
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}><Bone /><Bone w="88%" /><Bone w="60%" /></span>
        </div>
        <div style={{ display: 'flex', gap: 2, padding: '6px 6px 0', background: '#F5F5F5', borderTop: '1px solid ' + CL.ink1 }}>
          {CRITERIA.map(([id], k) => (
            <span key={id} style={{ flex: 1, borderRadius: '12px 12px 0 0', background: k === 0 ? '#fff' : 'transparent', padding: '12px 0 13px', display: 'flex', justifyContent: 'center' }}><Bone w={52} h={14} r={999} /></span>
          ))}
        </div>
        <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          <Bone w="76%" h={10} /><Bone /><Bone w="94%" /><Bone w="58%" h={10} /><Bone w="82%" />
        </div>
      </section>
      <span role="status" style={{ fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink5 }}>Đang chấm bài…</span>
      <CommentBone /><CommentBone /><CommentBone />
    </>
  );
}

/**
 * ② Viết bài, in three panels: the prompt and the chains (the essay's skeleton) on the left, the essay in the middle,
 * and the translator or, after "Nộp bài", the band, scores and comments on the right. Comments point at the essay and the chain.
 */
export function WriteScreen({ prompt, chains, setChains, essay, setEssay, toolbarLeft, chainsHref }: WriteProps) {
  const sections = sectionsFor(chains);
  const review = essay.review;
  const editing = !review || !!essay.fixing;
  const [chat, setChat] = useState(!review);
  /** The body paragraph being written (its chain is highlighted on the left). */
  const [focus, setFocus] = useState<string | null>(null);
  const paraRefs = useRef<Record<string, HTMLElement | null>>({});
  const [sending, setSending] = useState(false);
  /** While grading: the review so far (scores first, then each criterion's comments as they land). Never saved. */
  const [live, setLive] = useState<EssayReview | null>(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState<Note | null>(null);
  const [retrying, setRetrying] = useState(false);
  /** "Sửa bài" is asking the AI for the fix plan. */
  const [planning, setPlanning] = useState(false);
  /** The criterion tab open in the feedback panel; the essay highlights only its comments. */
  const [tab, setTab] = useState('tr');
  /** What the feedback panel shows: the review, or while grading, what has arrived so far (null = all skeleton). */
  const panel = sending ? live : review;

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
    if (!panel) return [];
    let n = 0;
    return panel.groups.flatMap((g) => g.items.map((item) => ({ item, crit: g.id, n: ++n })));
  }, [panel]);
  const plan = essay.fix?.plan;
  const tasks = useMemo(() => fixTasks(review, plan), [review, plan]);
  /** Before a round starts: will "Sửa bài" have idea/flow work to plan? */
  const fixable = !!review && (review.source === 'ai' ? review.groups.some((g) => (g.id === 'tr' || g.id === 'cc') && g.items.some((it) => it.quote)) : tasks.length > 0);
  const tabNotes = notes.filter((n) => n.crit === tab);
  const stale = !!review && review.key !== draftsKey(essay.drafts);
  const setDraft = (id: string, v: string) => setEssay((e) => ({ ...e, drafts: { ...e.drafts, [id]: v } }));
  const move = (i: number, d: -1 | 1) => setChains((cs) => { const a = [...cs]; [a[i], a[i + d]] = [a[i + d], a[i]]; return a; });

  const submit = async () => {
    if (sending || !words) return;
    setSending(true); setError(''); setActive(null); setLive(null); setChat(false); setTab('tr');
    try {
      const r = await requestEssayReview(prompt, sections, essay.drafts, chains, '', setLive);
      setEssay((e) => ({ ...e, review: r, fixing: false, fix: null, prevScores: e.review ? e.review.scores : null }));
      setTab('tr');
      setChat(false);
    } catch (e) {
      if (e instanceof SignedOutError) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
      setError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network);
    }
    setLive(null);
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

  /**
   * "Sửa bài": the guided round, resumed where it was left. An AI review asks for the fix plan first (tasks made only
   * from its TR/CC comments); the sample or the rule-based checks use the comments as they are. Plain editing when
   * there is nothing to fix, or when the plan can't be made.
   */
  const startFix = async () => {
    setActive(null); setError('');
    if (essay.fix) { setEssay((e) => (e.fix ? { ...e, fix: { ...e.fix, view: 'fix' } } : e)); return; }
    if (!review || !fixable) { setEssay((e) => ({ ...e, fixing: true })); return; }
    if (review.source !== 'ai') { setEssay((e) => ({ ...e, fix: { view: 'fix', step: 0, solved: [], before: { ...e.drafts } } })); return; }
    setPlanning(true);
    try {
      const planned = await planFix(prompt, chains, sections, essay.drafts, review);
      setEssay((e) => (planned.length ? { ...e, fix: { view: 'fix', step: 0, solved: [], before: { ...e.drafts }, plan: planned, checks: {} } } : { ...e, fixing: true }));
    } catch (e) {
      if (e instanceof SignedOutError) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
      setError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network);
    }
    setPlanning(false);
  };

  /**
   * "Nộp lại" at the end of an AI fix round: scores only, anchored to the last grading. The old comments stay where
   * their words are still in the essay. Without a plan (sample, rule-based), the essay is graded again in full.
   */
  const resubmitFix = async () => {
    const fix = essay.fix;
    if (!review || !fix?.plan) { submit(); return; }
    if (sending) return;
    setSending(true); setError('');
    try {
      const done = fix.plan.map((t, k) => ({ title: t.title, criterion: t.criterion, aim: t.aim, solved: fix.solved.includes('p' + k) }));
      const r = await rescore(prompt, chains, sections, fix.before, essay.drafts, review, done);
      setEssay((e) => {
        if (!e.review) return e;
        const groups = e.review.groups.map((g) => ({ ...g, items: g.items.filter((it) => !it.quote || !it.sectionId || (e.drafts[it.sectionId] || '').includes(it.quote)) }));
        const next: EssayReview = { ...e.review, scores: r.scores, groups, key: draftsKey(e.drafts), rescore: { notes: r.notes } };
        return { ...e, review: next, prevScores: e.review.scores, fix: null, fixing: false };
      });
      setTab('tr');
    } catch (e) {
      if (e instanceof SignedOutError) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
      setError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network);
    }
    setSending(false);
  };

  const hitFor = (c: Chain) => (active && active.item.chainId === c.id ? { at: active.item.at ?? null, bg: CRITERION_STYLE[active.crit].soft } : null);
  const scores = panel?.scores;

  const paragraph = (s: EssaySection) => {
    const text = essay.drafts[s.id] || '';
    const wc = wordCount(text);
    const range = s.guide.match(/\d+/g)!.map(Number);
    const own = tabNotes.filter((n) => n.item.sectionId === s.id);
    return (
      <div ref={(el) => { paraRefs.current[s.id] = el; }} style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, scrollMarginTop: 12 }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: CL.sans, fontSize: 14, fontWeight: 600, color: CL.ink }}>{s.label}</span>
          <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>{s.guide}</span>
          <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11, fontWeight: 600, color: wc >= range[0] && wc <= range[1] ? CL.green : CL.ink4 }}>{wc} từ</span>
        </span>
        <div style={{ borderRadius: 12, border: '1px solid ' + CL.ink2, background: '#fff', padding: '14px 18px' }}>
          {editing ? (
            <textarea className="co-ta" value={text} readOnly={sending} onChange={(e) => setDraft(s.id, e.target.value)} onFocus={() => setFocus(s.id)} rows={3} placeholder={s.placeholder} aria-label={s.label}
              style={{ display: 'block', width: '100%', minHeight: 72, resize: 'none', border: 'none', outline: 'none', background: 'transparent', padding: 0, fontFamily: CL.serif, fontSize: 15, lineHeight: 1.75, color: CL.ink8 }} />
          ) : (
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: CL.serif, fontSize: 15, lineHeight: 1.75, color: CL.ink8 }}>{text ? <Marked text={text} notes={own} active={active} onPick={(n) => setActive(active === n ? null : n)} /> : <span style={{ color: CL.ink4 }}>(trống)</span>}</p>
          )}
        </div>
      </div>
    );
  };
  /** Clicking a chain on the left brings its paragraph into view and puts the cursor in it. */
  const openPara = (id: string) => {
    setFocus(id);
    const el = paraRefs.current[id];
    el?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    el?.querySelector('textarea')?.focus({ preventScroll: true });
  };

  const shell = { height: '100%', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1710, margin: '0 auto', padding: '24px 40px 24px' } as const;
  if (essay.fix && essay.fix.view !== 'paused' && tasks.length) {
    return (
      <div style={shell}>
        {essay.fix.view === 'diff'
          ? <DiffView sections={sections} essay={essay} setEssay={setEssay} tasks={tasks} onResubmit={resubmitFix} sending={sending} error={error} />
          : <FixView prompt={prompt} chains={chains} sections={sections} essay={essay} setEssay={setEssay} tasks={tasks} chainsHref={chainsHref} />}
      </div>
    );
  }

  return (
    <div style={shell}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, minHeight: 42, paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {toolbarLeft}
          <span style={{ width: 1, height: 18, background: CL.ink2 }} />
          <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5 }}>Thời gian <b style={{ color: CL.ink, fontSize: 15, marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>{mmss(essay.seconds || 0)}</b></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {error && <span role="alert" style={{ fontFamily: CL.sans, fontSize: 12, color: CL.redText, marginRight: 4 }}>{error}</span>}
          <button type="button" className="cl-btn" onClick={() => setChat(!chat)} aria-pressed={chat} style={toolbarBtn(chat)}>Dịch</button>
          {editing
            ? <button type="button" className="cl-btn cl-primary" onClick={submit} disabled={sending || !words} style={{ ...primaryBtn, opacity: sending || !words ? 0.4 : 1 }}>{sending ? 'Đang chấm…' : review ? 'Nộp lại' : 'Nộp bài'}</button>
            : <button type="button" className="cl-btn cl-primary" onClick={startFix} disabled={planning} style={{ ...primaryBtn, opacity: planning ? 0.5 : 1 }}>{planning ? 'Đang chuẩn bị…' : essay.fix ? 'Tiếp tục sửa' : 'Sửa bài'}</button>}
        </div>
      </div>

      <CoachGrid
        open={chat || !!review || sending}
        main={
        <main className="co-col co-write3" style={{ minWidth: 0 }}>
          <aside aria-label="Dàn bài" style={{ minHeight: 0, display: 'flex', flexDirection: 'column', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid ' + CL.ink1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ClLabel>Đề bài</ClLabel>
              <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, color: CL.ink8 }}>{prompt.text}</p>
            </div>
            <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ClLabel>Dàn bài · {chains.length} thân bài</ClLabel>
              <div style={{ borderRadius: 10, border: '1px dashed ' + CL.ink2, padding: '9px 12px', fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>Mở bài · không cần mạch</div>
              {chains.map((c, i) => (
                <MiniChain key={c.id} prompt={prompt} chain={c} num={i + 1} first={i === 0} last={i === chains.length - 1} onMove={(d) => move(i, d)} hit={hitFor(c)}
                  focused={focus === c.id} onOpen={() => openPara(c.id)} chainsHref={chainsHref} />
              ))}
              <div style={{ borderRadius: 10, border: '1px dashed ' + CL.ink2, padding: '9px 12px', fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>Kết bài · không cần mạch</div>
            </div>
          </aside>
          <section style={{ minHeight: 0, display: 'flex', flexDirection: 'column', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 56, padding: '0 24px', borderBottom: '1px solid ' + CL.ink1, background: CL.panel }}>
              <ClLabel color={CL.ink}>Bài viết</ClLabel>
              <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>{editing ? '' : 'Bấm chỗ tô màu để xem nhận xét.'}{stale && editing ? 'Bạn đã sửa bài, nộp lại để chấm bản mới.' : ''}</span>
              <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>Số từ: <b style={{ color: words >= 250 ? CL.green : CL.ink }}>{words}</b> / 250</span>
            </div>
            <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 26px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>
              {sections.map((s) => <div key={s.id}>{paragraph(s)}</div>)}
            </div>
          </section>
        </main>
        }
        side={
          <>
            <SidePanel on={(!!review || sending) && !chat} grow={3}>
              <div className="cl-scroll" style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, padding: '2px 2px 4px' }}>
          {sending && !scores && <ReviewBone />}
          {panel && scores && (
            <section style={{ flexShrink: 0, borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px 14px' }}>
                <span style={{ fontFamily: CL.serif, fontSize: 42, fontWeight: 500, lineHeight: 1, color: CL.ink }}>{bandText(scores.band, true)}</span>
                {panel.rescore
                  ? <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink6 }}>Đã chấm lại sau vòng sửa.</span>
                  : panel.summary && <span style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink6 }}>
                    {panel.summary.replace(/\*\*/g, '')}
                    {panel.praise && <span style={{ color: CL.greenText }}>{panel.praise.replace(/\*\*/g, '')}</span>}
                  </span>}
              </div>
              {panel.rescore && panel.rescore.notes.length > 0 && (
                <div style={{ margin: '0 18px 14px', borderRadius: 12, background: CL.panel, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {panel.rescore.notes.map((n) => (
                    <span key={n.criterion} style={{ display: 'flex', gap: 8, fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink7 }}>
                      <b style={{ flexShrink: 0, width: 30, color: CRITERION_STYLE[n.criterion]?.fg }}>{CRITERION_STYLE[n.criterion]?.short}</b>{n.text}
                    </span>
                  ))}
                </div>
              )}
              <div role="tablist" aria-label="Tiêu chí" style={{ display: 'flex', gap: 2, padding: '6px 6px 0', background: '#F5F5F5', borderTop: '1px solid ' + CL.ink1 }}>
                {CRITERIA.map(([id]) => {
                  const st = CRITERION_STYLE[id], on = tab === id, v = scores[id as 'tr'], was = essay.prevScores?.[id as 'tr'];
                  return (
                    <button key={id} type="button" role="tab" aria-selected={on} className="cl-btn" onClick={() => { setTab(id); setActive(null); }}
                      style={{ flex: 1, borderRadius: '12px 12px 0 0', background: on ? '#fff' : 'transparent', padding: '10px 4px 11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: CL.sans, fontSize: 13, fontWeight: on ? 700 : 500, color: on ? CL.ink : CL.ink6, transition: 'background-color .2s' }}>
                      {st.short}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, borderRadius: 6, background: st.soft, padding: '2px 9px', fontSize: 12.5, fontWeight: 700, color: st.fg, fontVariantNumeric: 'tabular-nums' }}>
                        {bandText(v)}{was != null && v > was && <span style={{ fontSize: 10.5 }} title={'Trước: ' + bandText(was)}>↑</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
              {panel.criteria?.[tab]?.why && (() => {
                const c = panel.criteria[tab], v = scores[tab as 'tr'], plain = (x?: string) => (x || '').replace(/\*\*/g, '');
                const quote = { fontFamily: CL.serif, fontSize: 13, fontStyle: 'italic', color: CL.ink6 } as const;
                return (
                  <div style={{ padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 8, fontFamily: CL.sans, fontSize: 13, lineHeight: 1.55 }}>
                    {panel.rescore && <ClLabel>Nhận xét lần chấm trước</ClLabel>}
                    {c.bandQuote && !panel.rescore && <span style={quote}>Band {v}: “{c.bandQuote}”</span>}
                    <span style={{ color: CL.ink7 }}>{plain(c.why)}</span>
                    {c.nextQuote && !panel.rescore && v < 9 && <span style={quote}>Band {v + 1}: “{c.nextQuote}”</span>}
                    {c.gap && <span style={{ color: CL.ink7 }}>{plain(c.gap)}</span>}
                    {c.next && !panel.rescore && <span style={{ color: CL.ink, fontWeight: 600 }}>→ {plain(c.next)}</span>}
                  </div>
                );
              })()}
              {panel.failed && panel.failed.length > 0 && (
                <p style={{ margin: 0, padding: '0 18px 14px', fontFamily: CL.sans, fontSize: 12, color: CL.redText }}>Chưa tải được nhận xét của {panel.failed.map((id) => CRIT_SHORT[id]).join(', ')}. <button type="button" className="cl-btn" onClick={retry} disabled={retrying} style={{ textDecoration: 'underline', color: CL.ink, fontSize: 12 }}>{retrying ? 'Đang tải…' : 'Thử lại'}</button></p>
              )}
            </section>
          )}
          {panel && (panel.loading?.includes(tab)
            ? <><span role="status" style={{ fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink5 }}>Đang viết nhận xét…</span><CommentBone /><CommentBone /></>
            : <ClLabel>{tabNotes.length ? tabNotes.length + ' nhận xét' : 'Không có nhận xét'}</ClLabel>)}
          {panel && tabNotes.map((note) => {
            const on = active === note, st = CRITERION_STYLE[note.crit];
            return (
              <button key={note.item.key + note.crit} type="button" className={'cl-btn' + (sending ? ' co-skel-in' : '')} onClick={() => setActive(on ? null : note)} aria-pressed={on}
                style={{ flexShrink: 0, textAlign: 'left', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, borderRadius: 12, border: '1px solid ' + CL.ink1, background: on ? CL.panel : '#fff', opacity: stale ? 0.6 : 1, transition: 'background-color .2s' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 3, height: 13, borderRadius: 2, background: st.line }} />
                  <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 600, color: CL.ink }}>{note.item.label || CRIT_SHORT[note.crit]}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 10.5, color: CL.ink5, textAlign: 'right' }}>{note.item.where.split(' · Mạch')[0]}</span>
                </span>
                {note.item.quote && <span style={{ fontFamily: CL.serif, fontSize: 12.5, fontStyle: 'italic', lineHeight: 1.5, color: CL.ink6 }}>“{note.item.quote}”</span>}
                <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink7 }}>{note.item.text.replace(/\*\*/g, '')}</span>
                {note.item.fix && <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.greenText }}>Sửa: <i style={{ fontFamily: CL.serif }}>{note.item.fix}</i></span>}
                {note.item.example && <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.greenText }}>Ví dụ: <i style={{ fontFamily: CL.serif }}>{note.item.example}</i></span>}
              </button>
            );
          })}
          {review && !sending && !editing && fixable && (
            <section style={{ marginTop: 'auto', flexShrink: 0, borderRadius: 12, border: 'none', boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)', background: '#fff', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <ClLabel color={CL.ink}>{essay.fix ? 'Sửa ý và mạch · ' + (tasks.length - essay.fix.solved.length) + ' việc' : 'Sửa ý và mạch'}</ClLabel>
                <span style={{ fontFamily: CL.sans, fontSize: 12, lineHeight: 1.45, color: CL.ink6 }}>Task Response và Coherence, từng chỗ một.</span>
              </span>
              <button type="button" className="cl-btn cl-primary" onClick={startFix} disabled={planning} style={{ ...primaryBtn, opacity: planning ? 0.5 : 1 }}>{planning ? 'Đang chuẩn bị…' : essay.fix ? 'Tiếp tục →' : 'Bắt đầu sửa →'}</button>
            </section>
          )}
              </div>
            </SidePanel>
            <SidePanel on={chat} grow={2}>
              <TranslatorChat onClose={() => setChat(false)} />
            </SidePanel>
          </>
        }
      />
    </div>
  );
}
