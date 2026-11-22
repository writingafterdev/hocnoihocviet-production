'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode, useLayoutEffect } from 'react';
import type { Prompt } from '@/content/prompts';
import { SignedOutError, type EssayState } from '../attempts/store';
import { AI_ERROR_TEXT, AiRequestError } from '../ai/request';
import { CL } from '../chainlab/constants';
import type { Chain, ReviewItem } from '../chainlab/types';
import { ClLabel, PromptText, toolbarBtn } from '../chainlab/ui/primitives';
import { CoachGrid, SidePanel } from '../coach/CoachGrid';
import { TranslatorChat } from '../coach/TranslatorChat';
import { primaryBtn } from '../coach/ui';
import { bandText, CRITERIA, markStyle, CRITERION_STYLE, draftsKey, requestEssayReview, retryEssayCriterion, wordCount, type EssayReview, type EssaySection } from '../desk/scoring';
import { passes, type FixTask } from './FixFlow';
import { checkFix, rescore } from './fix-api';
import { applyEdits, DoneTick, FixBody, Folded, matchesFix } from './InlineFix';
import { Clamp } from './Clamp';
import { GuidedHeader, GuidedWriter, useGuidedPlan } from './GuidedWriter';
import { MiniChain } from './MiniChain';
import { Skeleton } from '@/components/base/skeleton/skeleton';
import { ScanText, wordCount as scanWords } from '@/components/ui/scan-text';
import { ThinkingLoader } from '@/components/ui/thinking-loader';

const GRADING_PHASES = ['Đang đọc bài', 'Đang chấm lập luận', 'Đang chấm độ mạch lạc', 'Đang chấm từ vựng', 'Đang chấm ngữ pháp', 'Đang viết nhận xét'];
import { ProBeam } from '@/components/ui/pro-beam';

export interface WriteProps {
  prompt: Prompt;
  chains: Chain[];
  setChains: (fn: (cs: Chain[]) => Chain[]) => void;
  essay: EssayState;
  setEssay: (fn: (e: EssayState) => EssayState) => void;
  toolbarLeft: ReactNode;
  /** ① Dựng mạch, for chains that aren't built yet. */
  chainsHref: string;
  /** Tự viết: no chains. The left panel holds the student's notes, then after grading the skeleton the AI read from the essay. */
  free?: boolean;
  /** Where the essay lands (from ① Chọn hướng bài), for the grading and the guided writer. */
  stance?: string;
}

interface Note { item: ReviewItem; crit: string; n: number }

const CRIT_SHORT: Record<string, string> = { tr: 'Task Response', cc: 'Coherence', lr: 'Lexical Resource', gra: 'Grammar' };
const mmss = (s: number) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

export function sectionsFor(chains: Chain[]): EssaySection[] {
  return [
    { id: 'intro', label: 'Mở bài', guide: '40–55 từ', placeholder: 'Nhắc lại đề bằng lời của bạn, rồi nêu lập trường hoặc câu trả lời.' },
    ...chains.map((c, i) => ({ id: c.id, label: 'Thân bài ' + (i + 1), guide: chains.length >= 3 ? '65–80 từ' : '85–100 từ', placeholder: 'Câu chủ đề, rồi đi theo mạch ý bên trái, lần lượt từng bước.' })),
    { id: 'conclusion', label: 'Kết bài', guide: '30–45 từ', placeholder: 'Nói lại câu trả lời và lý do chính.' },
  ];
}

/** Tự viết has no chains to follow: a fixed four-paragraph essay. */
export const FREE_SECTIONS: EssaySection[] = [
  { id: 'intro', label: 'Mở bài', guide: '40–55 từ', placeholder: 'Nhắc lại đề bằng lời của bạn, rồi nêu lập trường hoặc câu trả lời.' },
  { id: 'body1', label: 'Thân bài 1', guide: '85–100 từ', placeholder: 'Câu chủ đề, rồi giải thích từng bước cho tới kết quả.' },
  { id: 'body2', label: 'Thân bài 2', guide: '85–100 từ', placeholder: 'Câu chủ đề, rồi giải thích từng bước cho tới kết quả.' },
  { id: 'conclusion', label: 'Kết bài', guide: '30–45 từ', placeholder: 'Nói lại câu trả lời và lý do chính.' },
];

/** The dashed row for Mở bài / Kết bài in the left panel, with what the essay says there when known. */
const EndRow = ({ label, text }: { label: string; text?: string }) => (
  <div style={{ flexShrink: 0, borderRadius: 10, border: '1px dashed ' + CL.ink2, padding: '9px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
    <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>{label}</span>
    {text && <span style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.5, color: CL.ink7 }}>{text}</span>}
  </div>
);

/**
 * "Khung bài của bạn" (Tự viết, after grading): each body's mạch ý as the essay actually argued it, from the claim to where it
 * lands. A body whose mạch ý is thin or jumps gets a light red background; the comments say why.
 */
function SkeletonView({ skeleton, sections, onOpen }: { skeleton: NonNullable<EssayReview['skeleton']>; sections: EssaySection[]; onOpen: (id: string) => void }) {
  return (
    <>
      <ClLabel>Khung bài của bạn</ClLabel>
      <EndRow label="Mở bài" text={skeleton.thesis} />
      {skeleton.bodies.map((b) => {
        const label = sections.find((x) => x.id === b.sectionId)?.label || 'Thân bài';
        const line = b.weak ? '#F5C7B8' : CL.ink1;
        return (
          <button key={b.sectionId} type="button" className="cl-btn" onClick={() => onOpen(b.sectionId)}
            style={{ flexShrink: 0, textAlign: 'left', borderRadius: 12, border: '1px solid ' + (b.weak ? '#F5C7B8' : CL.ink2), background: b.weak ? CL.redSoft : '#fff', overflow: 'hidden', padding: 0, cursor: 'pointer' }}>
            <span style={{ display: 'block', padding: '10px 14px', borderBottom: '1px solid ' + line, fontFamily: CL.sans, fontSize: 13, fontWeight: 600, color: CL.ink }}>{label}</span>
            <ol style={{ listStyle: 'none', margin: 0, padding: '10px 10px 12px', display: 'flex', flexDirection: 'column' }}>
              {b.steps.map((t, k) => {
                const first = k === 0, end = k === b.steps.length - 1 && k > 0;
                return (
                  <li key={k} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '4px 6px' }}>
                    <span style={{ width: 9, height: 9, flexShrink: 0, borderRadius: end ? 2 : 99, background: first ? CL.green : end ? '#B8862B' : '#D4D4D4' }} />
                    <span style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.5, fontWeight: end ? 600 : 400, color: first || end ? CL.ink8 : CL.ink6 }}>{t}</span>
                  </li>
                );
              })}
            </ol>
          </button>
        );
      })}
      <EndRow label="Kết bài" text={skeleton.conclusion} />
    </>
  );
}

/**
 * Paragraph text with the review's quotes highlighted; the selected one stands out. A comment being fixed shows its
 * words struck through, with the typed rewrite after them in green; clicking them opens that comment's fix.
 */
function Marked({ text, notes, active, onPick, fixing = {}, keyOf, onFix }: { text: string; notes: Note[]; active: Note | null; onPick: (n: Note) => void; fixing?: Record<string, { edit: string; open: boolean }>; keyOf?: (n: Note) => string; onFix?: (n: Note) => void }) {
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
    const fx = keyOf ? fixing[keyOf(s.note)] : undefined;
    if (fx) {
      const edit = fx.edit.trim();
      out.push(
        <span key={'f' + k} role="button" tabIndex={0} title="Viết lại chỗ này" onClick={() => onFix?.(s.note)} onKeyDown={(e) => { if (e.key === 'Enter') onFix?.(s.note); }} style={{ cursor: 'pointer' }}>
          <s ref={fx.open ? (el) => el?.scrollIntoView({ block: 'center', behavior: 'smooth' }) : undefined} style={{ borderRadius: 3, padding: '1px 2px', background: CL.redSoft, color: CL.redText, textDecorationColor: CL.red, boxShadow: fx.open ? '0 0 0 2px #2F62C4' : 'none', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', transition: 'box-shadow .15s' }}>{text.slice(s.at, s.end)}</s>
          {edit && <>{' '}<span style={{ borderRadius: 3, padding: '1px 3px', background: CL.mintSoft, color: CL.greenText, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>{edit}</span></>}
        </span>,
      );
      last = s.end;
      return;
    }
    out.push(<mark key={'m' + k} ref={on ? (el) => el?.scrollIntoView({ block: 'center', behavior: 'smooth' }) : undefined} onClick={() => onPick(s.note)} style={{ ...markStyle(s.note.crit, on), cursor: 'pointer' }}>{text.slice(s.at, s.end)}</mark>);
    last = s.end;
  });
  if (last < text.length) out.push(<span key="end">{text.slice(last)}</span>);
  return <>{out}</>;
}

/** A grey block that shimmers: stands in for text that is on its way. */
const Bone = ({ w = '100%', h = 11, r }: { w?: number | string; h?: number; r?: number }) => <Skeleton shape="text" style={{ width: w, height: h, ...(r ? { borderRadius: r } : {}) }} />;

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
      <span style={{ alignSelf: 'flex-start' }}><ThinkingLoader phases={GRADING_PHASES} interval={2600} /></span>
      <CommentBone /><CommentBone /><CommentBone />
    </>
  );
}

/**
 * ② Viết bài, in three panels: the prompt and the chains (the essay's skeleton) on the left, the essay in the middle,
 * and the translator or, after "Nộp bài", the band, scores and comments on the right. Comments point at the essay and the chain.
 */
export function WriteScreen({ prompt, chains, setChains, essay, setEssay, toolbarLeft, chainsHref, free, stance = '' }: WriteProps) {
  const sections = free ? FREE_SECTIONS : sectionsFor(chains);
  const review = essay.review;
  const editing = !review || !!essay.fixing;
  // The guided writer needs the room: the translator starts closed there.
  // Tự viết keeps the room for the essay (prompt, notes and essay side by side): the translator opens on "Dịch".
  const [chat, setChat] = useState(!review && !free && !(essay.guided && !essay.guided.done));
  /** The body paragraph being written (its chain is highlighted on the left). */
  const [focus, setFocus] = useState<string | null>(null);
  const paraRefs = useRef<Record<string, HTMLElement | null>>({});
  const [sending, setSending] = useState(false);
  /** While grading: the review so far (scores first, then each criterion's comments as they land). Never saved. */
  const [live, setLive] = useState<EssayReview | null>(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState<Note | null>(null);
  const [retrying, setRetrying] = useState(false);
  /** The fix round: the comment open for rewriting, the one being checked, and the last error. */
  const [openFix, setOpenFix] = useState<string | null>(null);
  const [checkingFix, setCheckingFix] = useState<string | null>(null);
  const [fixError, setFixError] = useState('');
  /** The criterion tab open in the feedback panel; the essay highlights only its comments. */
  const [tab, setTab] = useState('tr');
  /** What the feedback panel shows: the review, or while grading, what has arrived so far (null = all skeleton). */
  const panel = sending ? live : review;
  /** "Viết có hướng dẫn" is running: the middle panel writes one sentence at a time. */
  const guidedOn = !!essay.guided && !essay.guided.done && !review;
  const guided = useGuidedPlan(prompt, chains, essay, setEssay, undefined, stance);
  const gPlan = essay.guided?.plan || null;
  const gNow = guidedOn && gPlan ? gPlan[essay.guided!.at] : null;
  /** Handed over with "Tự viết phần còn lại": sentences are still left in the plan, so the student can go back to them. */
  const canResume = !review && !!essay.guided?.done && !!gPlan && essay.guided!.at < gPlan.length;
  // The white tab behind the active criterion slides to the new one (transitions.dev "Tabs sliding").
  const tabsRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const list = tabsRef.current;
    if (!list) return;
    const measure = () => { const el = list.querySelector<HTMLElement>('[aria-selected="true"]'); if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth }); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [tab, panel]); // eslint-disable-line react-hooks/exhaustive-deps

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
  /** Every comment that quotes the essay is fixed in place ("Sửa" on its card); guiding questions come with the idea/flow ones. */
  const isFixable = (n: Note) => !!n.item.quote && !!n.item.sectionId;
  /** The comment carries its own fix (and questions) from the grading, so they belong together. */
  const ownFix = (n: Note) => !!(n.item.fix || n.item.how || n.item.ask?.length || n.item.task?.model);
  const fixKey = (n: Note) => n.crit + ':' + n.item.key;
  /** The comment as a fix task: its own fix, meaning and questions from the grading (or the comment's words as the question). */
  const taskFor = (n: Note): FixTask => {
    const item = { ...n.item, key: fixKey(n) };
    const own = { item, crit: n.crit, title: n.item.label || 'Sửa', how: n.item.how || undefined, ask: n.item.ask?.length ? n.item.ask : n.item.task?.ask || [], starter: n.item.task?.starter, ok: n.item.task?.ok || 'Đã sửa xong chỗ này.', model: n.item.task?.model || n.item.fix, vi: n.item.task?.vi || n.item.vi };
    if (ownFix(n) || n.crit === 'lr' || n.crit === 'gra') return own;
    // A comment graded before comments carried their own fix: its explanation stands in as the question.
    return { ...own, ask: own.ask.length || own.how ? own.ask : [n.item.text.replace(/\*\*/g, '')] };
  };
  const tasks = useMemo(() => (sending ? [] : notes.filter(isFixable).map(taskFor)), [notes, sending]); // eslint-disable-line react-hooks/exhaustive-deps
  const taskOf = (n: Note) => tasks.find((t) => t.item.key === fixKey(n)) || null;
  const tabNotes = notes.filter((n) => n.crit === tab);
  const edits = essay.fix?.edits || {};
  const solvedN = essay.fix ? tasks.filter((t) => essay.fix!.solved.includes(t.item.key)).length : 0;
  /** Comments whose words are struck through in the essay: open for fixing, rewritten, or solved. */
  const fixing: Record<string, { edit: string; open: boolean }> = {};
  tasks.forEach((t) => { const k = t.item.key; if (openFix === k || (edits[k] || '').trim() || essay.fix?.solved.includes(k)) fixing[k] = { edit: edits[k] || '', open: openFix === k }; });
  const setEdit = (key: string, v: string) => setEssay((e) => (e.fix ? { ...e, fix: { ...e.fix, edits: { ...e.fix.edits, [key]: v } } } : e));
  const checkTask = async (t: FixTask) => {
    const fix = essay.fix;
    if (!fix || checkingFix) return;
    const sec = t.item.sectionId!, before = essay.drafts[sec] || '';
    const after = applyEdits(before, [t], edits);
    const key = t.item.key;
    const verdict = (v: { solved: boolean; reply: string; ask: string }) => setEssay((e) => (e.fix ? { ...e, fix: { ...e.fix, checks: { ...e.fix.checks, [key]: v }, solved: v.solved ? [...e.fix.solved.filter((x) => x !== key), key] : e.fix.solved.filter((x) => x !== key) } } : e));
    // Written along the hidden fix (the first-letter hints): solved at once, nothing to ask the AI.
    if (matchesFix(t, edits[key] || '')) { verdict({ solved: true, reply: 'Đã sửa đúng chỗ này.', ask: '' }); return; }
    // Vocabulary and grammar have one right fix: not matching it is not solved yet.
    if ((t.crit === 'lr' || t.crit === 'gra') && t.model) {
      verdict({ solved: false, reply: 'Chưa khớp cách sửa. Bấm "Gợi ý thêm" để xem chữ cái đầu của từng từ.', ask: '' });
      return;
    }
    // Ideas and flow in an AI review: checked by the AI, with the planned task or the comment itself.
    const task = (review?.source === 'ai' ? { sectionId: sec, criterion: t.crit as 'tr' | 'cc', quote: t.item.quote!, title: t.title, ask: t.ask, how: t.how, starter: t.starter || '', aim: t.item.text.replace(/\*\*/g, '') } : null);
    if (!task) {
      const ok = passes(t, after, before);
      verdict({ solved: ok, reply: ok ? t.ok : 'Câu mới còn ngắn quá. Làm theo cách sửa ở trên thay vì chỉ xoá câu cũ.', ask: '' });
      return;
    }
    setCheckingFix(key); setFixError('');
    try { verdict(await checkFix(prompt, chains, task, before, after)); }
    catch (e) { setFixError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network); }
    setCheckingFix(null);
  };
  const stale = !!review && review.key !== draftsKey(essay.drafts);
  const setDraft = (id: string, v: string) => setEssay((e) => ({ ...e, drafts: { ...e.drafts, [id]: v } }));
  const move = (i: number, d: -1 | 1) => setChains((cs) => { const a = [...cs]; [a[i], a[i + d]] = [a[i + d], a[i]]; return a; });

  const submit = async (override?: Record<string, string>) => {
    const drafts = override || essay.drafts;
    if (sending || !words) return;
    setSending(true); setError(''); setActive(null); setLive(null); setChat(false); setTab('tr');
    try {
      const r = await requestEssayReview(prompt, sections, drafts, chains, stance, setLive);
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
        const items = await retryEssayCriterion(review, prompt, sections, essay.drafts, chains, stance, id);
        groups = groups.map((g) => (g.id === id ? { ...g, items } : g));
        failed = failed.filter((x) => x !== id);
      } catch { /* stays failed */ }
    }
    setEssay((e) => ({ ...e, review: e.review ? { ...e.review, groups, failed: failed.length ? failed : undefined } : e.review }));
    setRetrying(false);
  };

  /**
   * "Sửa" on a comment: opens the fix inside that card. The first one starts the round: the drafts are kept as they
   * were. Each comment brings its own fix, meaning and questions from the grading.
   */
  const openFixFor = (n: Note) => {
    const key = fixKey(n);
    setOpenFix(key); setActive(n); setTab(n.crit); setFixError(''); setError('');
    if (essay.fix || !review) return;
    setEssay((e) => ({ ...e, fix: { view: 'fix', step: 0, solved: [], before: { ...e.drafts }, checks: {}, edits: {} } }));
  };
  /** "Sửa bài" without idea/flow comments to fix: plain editing. */
  const startFix = () => { setActive(null); setError(''); setEssay((e) => ({ ...e, fixing: true })); };

  /**
   * "Nộp lại": every rewrite goes in place of its struck words. An AI review is re-scored against the last grading
   * (the old comments stay where their words are still in the essay); otherwise the essay is graded again in full.
   */
  const resubmitFix = async () => {
    const fix = essay.fix;
    if (sending || !fix) return;
    const drafts = Object.fromEntries(Object.entries(essay.drafts).map(([id, t]) => [id, applyEdits(t, tasks.filter((x) => x.item.sectionId === id), fix.edits || {})]));
    setOpenFix(null);
    if (!review || review.source !== 'ai') { setEssay((e) => ({ ...e, drafts, fix: null })); submit(drafts); return; }
    setSending(true); setError('');
    try {
      const done = tasks.filter((t) => fix.solved.includes(t.item.key) || (fix.edits?.[t.item.key] || '').trim()).slice(0, 8)
        .map((t) => ({ title: t.title, criterion: t.crit, aim: t.item.text.replace(/\*\*/g, '').slice(0, 600), solved: fix.solved.includes(t.item.key) }));
      const r = await rescore(prompt, chains, sections, fix.before, drafts, review, done);
      setEssay((e) => {
        if (!e.review) return e;
        const groups = e.review.groups.map((g) => ({ ...g, items: g.items.filter((it) => !it.quote || !it.sectionId || (drafts[it.sectionId] || '').includes(it.quote)) }));
        const next: EssayReview = { ...e.review, scores: r.scores, groups, key: draftsKey(drafts), rescore: { notes: r.notes }, ...(r.skeleton ? { skeleton: r.skeleton } : {}) };
        return { ...e, drafts, review: next, prevScores: e.review.scores, fix: null, fixing: false };
      });
      setTab('tr');
    } catch (e) {
      if (e instanceof SignedOutError) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
      setError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network);
    }
    setSending(false);
  };

  const hitFor = (c: Chain) => (gNow ? (gNow.section === c.id && gNow.step >= 0 ? { at: gNow.step, bg: '#EEF3FC' } : null)
    : active && active.item.chainId === c.id ? { at: active.item.at ?? null, bg: CRITERION_STYLE[active.crit].soft } : null);
  const scores = panel?.scores;

  // While grading (or re-grading) the essay is read as one text, section after section (ScanText).
  const readCounts = sections.map((x) => scanWords(essay.drafts[x.id] || ''));
  const readTotal = readCounts.reduce((t, n) => t + n, 0);
  const readAt = (id: string) => { const k = sections.findIndex((x) => x.id === id); return readCounts.slice(0, k).reduce((t, n) => t + n, 0); };

  const paragraph = (s: EssaySection) => {
    const text = essay.drafts[s.id] || '';
    const wc = wordCount(text);
    const range = s.guide.match(/\d+/g)!.map(Number);
    // This tab's comments, plus any comment being fixed (from any tab) so its strike-through stays in place.
    const own = notes.filter((n) => n.item.sectionId === s.id && (n.crit === tab || !!fixing[fixKey(n)]));
    return (
      <div ref={(el) => { paraRefs.current[s.id] = el; }} style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, scrollMarginTop: 12 }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: CL.sans, fontSize: 14, fontWeight: 600, color: CL.ink }}>{s.label}</span>
          <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>{s.guide}</span>
          <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11, fontWeight: 600, color: wc >= range[0] && wc <= range[1] ? CL.green : CL.ink4 }}>{wc} từ</span>
        </span>
        <div style={{ borderRadius: 12, border: '1px solid ' + CL.ink2, background: '#fff', padding: '14px 18px' }}>
          {sending && text.trim() ? (
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: CL.serif, fontSize: 15, lineHeight: 1.75, color: CL.ink8 }}><ScanText text={text} offset={readAt(s.id)} total={readTotal} /></p>
          ) : editing ? (
            <textarea className="co-ta" value={text} readOnly={sending} onChange={(e) => setDraft(s.id, e.target.value)} onFocus={() => setFocus(s.id)} rows={3} placeholder={s.placeholder} aria-label={s.label}
              style={{ display: 'block', width: '100%', minHeight: 72, resize: 'none', border: 'none', outline: 'none', background: 'transparent', padding: 0, fontFamily: CL.serif, fontSize: 15, lineHeight: 1.75, color: CL.ink8 }} />
          ) : (
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: CL.serif, fontSize: 15, lineHeight: 1.75, color: CL.ink8 }}>{!text ? <span style={{ color: CL.ink4 }}>(trống)</span>
              : <Marked text={text} notes={own} active={active} onPick={(n) => setActive(active === n ? null : n)} fixing={fixing} keyOf={fixKey} onFix={openFixFor} />}</p>
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

  const shell = { height: '100%', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1560, margin: '0 auto', padding: '24px 32px 24px' } as const;

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
            ? <ProBeam><button type="button" className="cl-btn cl-primary" onClick={() => submit()} disabled={sending || !words || guidedOn} style={{ ...primaryBtn, opacity: sending || !words || guidedOn ? 0.4 : 1 }}>{sending ? 'Đang chấm…' : review ? 'Viết lại' : 'Nộp bài'}</button></ProBeam>
            : sending ? <ProBeam><button type="button" className="cl-btn cl-primary" disabled style={{ ...primaryBtn, opacity: 0.45 }}>Đang chấm…</button></ProBeam>
            : tasks.length ? <>
              <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5, marginRight: 4 }}>Đã sửa <b style={{ color: CL.ink }}>{solvedN}</b> / {tasks.length}</span>
              <ProBeam><button type="button" className="cl-btn cl-primary" onClick={resubmitFix} disabled={sending || !solvedN} style={{ ...primaryBtn, opacity: sending || !solvedN ? 0.45 : 1 }}>{sending ? 'Đang chấm…' : 'Viết lại'}</button></ProBeam>
            </>
            : <ProBeam><button type="button" className="cl-btn cl-primary" onClick={startFix} style={primaryBtn}>Sửa bài</button></ProBeam>}
        </div>
      </div>

      <CoachGrid
        open={chat || !!review || sending}
        main={
        <main className="co-col co-write3" style={{ minWidth: 0 }}>
          <aside aria-label={free ? 'Đề bài và ghi chú' : 'Dàn bài'} style={{ minHeight: 0, display: 'flex', flexDirection: 'column', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
            <PromptText text={prompt.text} style={{ padding: '18px 20px 16px', borderBottom: '1px solid ' + CL.ink1 }} />
            {free ? (panel?.skeleton ? (
              <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <SkeletonView skeleton={panel.skeleton} sections={sections} onOpen={openPara} />
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '14px 16px 16px', gap: 8 }}>
                <label htmlFor="essay-notes" style={{ fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink5 }}>Ghi chú</label>
                <textarea id="essay-notes" className="cl-scroll" value={essay.notes || ''} onChange={(e) => { const v = e.target.value; setEssay((x) => ({ ...x, notes: v })); }}
                  placeholder="Ghi gì cũng được: ý, dàn bài, tiếng Việt…"
                  style={{ flex: 1, minHeight: 0, resize: 'none', borderRadius: 10, border: '1px solid ' + CL.ink1, background: CL.panel, outline: 'none', padding: '12px 14px', fontFamily: CL.sans, fontSize: 14, lineHeight: 1.65, color: CL.ink8 }} />
              </div>
            )) : <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ClLabel>Dàn bài · {chains.length} thân bài</ClLabel>
              <div style={{ borderRadius: 10, border: '1px dashed ' + CL.ink2, padding: '9px 12px', fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>Mở bài · không cần mạch ý</div>
              {chains.map((c, i) => (
                <MiniChain key={c.id} prompt={prompt} chain={c} num={i + 1} first={i === 0} last={i === chains.length - 1} onMove={(d) => move(i, d)} hit={hitFor(c)}
                  focused={gNow ? gNow.section === c.id : focus === c.id} onOpen={() => openPara(c.id)} chainsHref={chainsHref} />
              ))}
              <div style={{ borderRadius: 10, border: '1px dashed ' + CL.ink2, padding: '9px 12px', fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>Kết bài · không cần mạch ý</div>
            </div>}
          </aside>
          <section style={{ minHeight: 0, display: 'flex', flexDirection: 'column', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 56, padding: '0 24px', borderBottom: '1px solid ' + CL.ink1, background: CL.panel }}>
              <ClLabel color={CL.ink}>Bài viết</ClLabel>
              {guidedOn ? <GuidedHeader essay={essay} setEssay={setEssay} total={gPlan?.length || 0} /> : <>
              <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>{editing ? '' : 'Bấm chỗ tô màu để xem nhận xét.'}{stale && editing ? 'Bạn đã sửa bài, nộp lại để chấm bản mới.' : ''}</span>
              {canResume && <button type="button" className="cl-btn" onClick={() => setEssay((e) => (e.guided ? { ...e, guided: { ...e.guided, done: false } } : e))}
                style={{ marginLeft: 'auto', whiteSpace: 'nowrap', border: 'none', background: '#EEF3FC', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 500, color: '#2F62C4' }}>Quay lại viết có hướng dẫn</button>}
              <span style={{ marginLeft: canResume ? 0 : 'auto', fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>Số từ: <b style={{ color: words >= 250 ? CL.green : CL.ink }}>{words}</b> / 250</span>
              </>}
            </div>
            {guidedOn
              ? <GuidedWriter sections={sections} essay={essay} setEssay={setEssay} plan={gPlan} error={guided.error} loading={guided.loading} retry={guided.retry} />
              : <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 26px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>
              {sections.map((s) => <div key={s.id}>{paragraph(s)}</div>)}
            </div>}
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
              {/* The band stays centred; the text beside it is folded to about its height, so the box stays compact. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px' }}>
                <span style={{ flexShrink: 0, fontFamily: CL.serif, fontSize: 42, fontWeight: 500, lineHeight: 1, color: CL.ink }}>{bandText(scores.band, true)}</span>
                {panel.rescore
                  ? <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink6 }}>Đã chấm lại sau vòng sửa.</span>
                  : panel.summary && <span style={{ flex: 1, minWidth: 0, fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink6 }}>
                    <Clamp lines={2} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span>{panel.summary.replace(/\*\*/g, '')}</span>
                      {panel.praise && <span style={{ color: CL.greenText }}>{panel.praise.replace(/\*\*/g, '')}</span>}
                    </Clamp>
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
              <div ref={tabsRef} role="tablist" aria-label="Tiêu chí" style={{ position: 'relative', display: 'flex', gap: 2, padding: '6px 6px 0', background: '#F5F5F5', borderTop: '1px solid ' + CL.ink1 }}>
                {ind && <span aria-hidden="true" className="t-tabs-slide" style={{ position: 'absolute', top: 6, bottom: 0, left: ind.left, width: ind.width, background: '#fff', borderRadius: '12px 12px 0 0' }} />}
                {CRITERIA.map(([id]) => {
                  const st = CRITERION_STYLE[id], on = tab === id, v = scores[id as 'tr'], was = essay.prevScores?.[id as 'tr'];
                  return (
                    <button key={id} type="button" role="tab" aria-selected={on} className="cl-btn" onClick={() => { setTab(id); setActive(null); }}
                      style={{ position: 'relative', zIndex: 1, flex: 1, borderRadius: '12px 12px 0 0', background: 'transparent', padding: '10px 4px 11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: CL.sans, fontSize: 13, fontWeight: on ? 700 : 500, color: on ? CL.ink : CL.ink6, transition: 'background-color .2s' }}>
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
                    {/* The next step stays in view; the analysis behind it folds after a few lines. */}
                    {c.next && !panel.rescore && <span style={{ color: CL.ink, fontWeight: 600 }}>→ {plain(c.next)}</span>}
                    <Clamp key={tab} height={112} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {c.bandQuote && !panel.rescore && <span style={quote}>Band {v}: “{c.bandQuote}”</span>}
                      <span style={{ color: CL.ink7 }}>{plain(c.why)}</span>
                      {c.nextQuote && !panel.rescore && v < 9 && <span style={quote}>Band {v + 1}: “{c.nextQuote}”</span>}
                      {c.gap && <span style={{ color: CL.ink7 }}>{plain(c.gap)}</span>}
                    </Clamp>
                  </div>
                );
              })()}
              {panel.failed && panel.failed.length > 0 && (
                <p style={{ margin: 0, padding: '0 18px 14px', fontFamily: CL.sans, fontSize: 12, color: CL.redText }}>Chưa tải được nhận xét của {panel.failed.map((id) => CRIT_SHORT[id]).join(', ')}. <button type="button" className="cl-btn" onClick={retry} disabled={retrying} style={{ textDecoration: 'underline', color: CL.ink, fontSize: 12 }}>{retrying ? 'Đang tải…' : 'Thử lại'}</button></p>
              )}
            </section>
          )}
          {panel && (panel.loading?.includes(tab)
            ? <><span style={{ alignSelf: 'flex-start' }}><ThinkingLoader size="sm" phases={['Đang đọc lại bài', 'Đang chọn chỗ cần sửa', 'Đang viết nhận xét']} /></span><CommentBone /><CommentBone /></>
            : <ClLabel>{tabNotes.length ? tabNotes.length + ' nhận xét' : 'Không có nhận xét'}</ClLabel>)}
          {panel && tabNotes.map((note) => {
            const on = active === note, st = CRITERION_STYLE[note.crit];
            const t = taskOf(note), key = t?.item.key || '', open = !!t && openFix === key && !editing, solved = !!t && !!essay.fix?.solved.includes(key);
            return (
              <Folded key={note.item.key + note.crit} solved={solved}>{(folded) => (
              <div role="button" tabIndex={0} aria-pressed={on} className={'cl-btn co-note' + (folded ? ' done' : '') + (sending ? ' co-skel-in' : '')}
                onClick={() => setActive(on ? null : note)} onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) setActive(on ? null : note); }}
                style={{ flexShrink: 0, textAlign: 'left', cursor: 'pointer', padding: '12px 14px', display: 'flex', flexDirection: 'column', borderRadius: 12, border: '1px solid ' + (open ? '#2F62C4' : CL.ink1), background: on && !open ? CL.panel : '#fff', opacity: stale && !open ? 0.6 : 1, transition: 'background-color .2s, border-color .2s' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {folded ? <DoneTick /> : <span style={{ width: 3, height: 13, borderRadius: 2, background: solved ? CL.green : st.line }} />}
                  <span className="co-note-label" style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 600, color: folded ? CL.greenText : CL.ink }}>{note.item.label || CRIT_SHORT[note.crit]}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 10.5, color: CL.ink5, textAlign: 'right' }}>{note.item.where.split(' · Mạch')[0]}</span>
                </span>
                {/* Fixed: everything below the title folds away and the title is crossed off. */}
                <span className="co-note-fold" aria-hidden={folded || undefined}><span style={{ minHeight: 0, overflow: 'hidden' }}><span style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6 }}>
                {/* No quote: the words are marked in the essay, and picking the card highlights them there. */}
                <Clamp lines={3} style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink7 }}>{note.item.text.replace(/\*\*/g, '')}</Clamp>
                {/* The fix is the answer to type: hidden here, shown only as first-letter hints inside "Sửa". */}
                {note.item.fix && !t && <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.greenText }}>Sửa: <i style={{ fontFamily: CL.serif }}>{note.item.fix}</i></span>}
                {note.item.example && !t && <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.greenText }}>Ví dụ: <i style={{ fontFamily: CL.serif }}>{note.item.example}</i></span>}
                {t && !editing && (open ? (
                  <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 9, cursor: 'default', marginTop: 2 }}>
                    <FixBody task={t} edit={edits[key] || ''} setEdit={(v) => setEdit(key, v)} solved={solved} verdict={essay.fix?.checks?.[key]}
                      checking={checkingFix === key} error={fixError} onCheck={() => checkTask(t)} />
                  </div>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    {solved && <span style={{ borderRadius: 6, padding: '3px 8px', background: CL.mintSoft, color: CL.greenText, fontFamily: CL.sans, fontSize: 12, fontWeight: 600 }}>Đã sửa</span>}
                    <button type="button" className="cl-btn" onClick={(e) => { e.stopPropagation(); openFixFor(note); }}
                      style={{ marginLeft: 'auto', height: 30, padding: '0 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,.12)', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.05)', fontFamily: CL.sans, fontSize: 13, fontWeight: 500, color: CL.ink }}>{solved ? 'Xem lại' : 'Sửa'}</button>
                  </span>
                ))}
                </span></span></span>
              </div>
              )}</Folded>
            );
          })}
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
