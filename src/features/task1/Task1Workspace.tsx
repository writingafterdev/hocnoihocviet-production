'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { WorkspaceHeader } from '@/components/shell/BrandHeader';
import { WorkspaceBone } from '@/components/ui/page-bone';
import { findTask1Prompt } from '@/content/task1';
import { SignedOutError, type EssayState } from '../attempts/store';
import { AI_ERROR_TEXT, AiRequestError, postAi } from '../ai/request';
import { CL } from '../chainlab/constants';
import { backLinkStyle, ClIcon } from '../chainlab/ui/primitives';
import { Charts } from './Chart';
import { ComparePanel } from './Compare';
import { cellById, groupPart, partOfRow, type Hint, type Row } from './engine';
import { PlanPanel, planReady, type PlanState } from './Plan';
import { normalizeTask1, task1Store, type Task1Attempt, type Task1Review, type Task1Step } from './store';
import { FreeColumn, FreeNotes, GuidedColumn, labelsOf, paragraphsOf, sectionsOf, SideColumn } from './Write';
import { GradedEssay, GradedOutline, ReadingEssay, ReviewPanel, type Fixer } from './Review';
import { ReviewBone } from '../essay/WriteScreen';
import type { FixTask } from '../essay/FixFlow';
import { applyEdits, matchesFix } from '../essay/InlineFix';
import type { Task1Comment, Task1Crit } from './store';
import { markTourSeen, TourLayer, tourPlanOf, tourSeen, tourStage, type TourPlan, type TourStage } from './Tour';

type Status = 'loading' | 'ready' | 'missing' | 'error';
const SAVE_DELAY = 1500;
const contentKey = (a: Task1Attempt) => JSON.stringify([a.step, a.found, a.place, a.ov, a.order, a.mode, a.essay.drafts, a.essay.guided, a.essay.notes, a.review, a.fix, a.prevScores]);

/** The paragraphs after Sửa bài go back where the student writes: one free text, or the plan's sections that had words, in order. */
function writeBack(mode: 'guided' | 'free', essay: EssayState, ids: string[], paras: string[]): EssayState {
  if (mode === 'free') return { ...essay, drafts: { ...essay.drafts, free: paras.join('\n\n') } };
  const filled = ids.filter((id) => (essay.drafts[id] || '').trim());
  const drafts = { ...essay.drafts };
  filled.forEach((id, i) => { if (paras[i] !== undefined) drafts[id] = paras[i]; });
  return { ...essay, drafts };
}
const STEPS: [Task1Step, string][] = [['compare', '① So sánh'], ['plan', '② Chia đoạn'], ['write', '③ Viết bài']];
const primary: React.CSSProperties = { height: 36, borderRadius: 10, border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, padding: '0 14px', cursor: 'pointer' };

/** One Task 1 attempt, autosaved. Viết có hướng dẫn: ① So sánh → ② Chia đoạn → ③ Viết bài on one page. Tự viết: straight to writing, the chart and notes on the left. */
export function Task1Workspace({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [a, setA] = useState<Task1Attempt | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [save, setSave] = useState<'saved' | 'saving' | 'failed'>('saved');
  const [row, setRow] = useState<Row>([]);
  const [hint, setHint] = useState<Hint | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState('');
  /** The paragraphs being graded (Nộp bài, or Viết lại after Sửa bài): read in the middle while the feedback panel is grey. */
  const [reading, setReading] = useState<string[] | null>(null);
  const [active, setActive] = useState<Task1Comment | null>(null);
  // A comment about the chart lights its numbers there; bring the chart into view if the column has scrolled past it.
  useEffect(() => {
    const id = active?.marks?.[0];
    if (id) document.querySelector('[data-tour="part:' + id.split('.')[0] + '"]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [active]);
  const [tab, setTab] = useState<Task1Crit>('ta');
  /** Sửa bài: the comment open for rewriting, the one being checked, the last error. */
  const [openFix, setOpenFix] = useState<string | null>(null);
  const [checkingFix, setCheckingFix] = useState<string | null>(null);
  const [fixError, setFixError] = useState('');
  /** The first-visit walkthrough in ① (one finding done together); `start` = findings before it began. */
  const [tour, setTour] = useState<{ start: number; plan: TourPlan } | null>(null);
  const tourChecked = useRef(false);
  const savedKey = useRef<string | null>(null);
  const latest = useRef<Task1Attempt | null>(null);
  latest.current = a;
  const toLogin = () => router.replace('/login?next=' + encodeURIComponent(location.pathname));

  useEffect(() => {
    let alive = true;
    task1Store.get(attemptId).then(
      (x) => { if (!alive) return; savedKey.current = x ? contentKey(x) : null; setA(x && normalizeTask1(x)); setStatus(x && findTask1Prompt(x.promptId) ? 'ready' : 'missing'); },
      (e) => { if (!alive) return; if (e instanceof SignedOutError) toLogin(); else setStatus('error'); },
    );
    return () => { alive = false; };
  }, [attemptId]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (x: Task1Attempt) => {
    const key = contentKey(x); setSave('saving');
    task1Store.save(x).then(() => { savedKey.current = key; if (latest.current && contentKey(latest.current) === key) setSave('saved'); }, (e) => { if (e instanceof SignedOutError) toLogin(); else setSave('failed'); });
  };
  const key = a ? contentKey(a) : null;
  useEffect(() => { if (!a || key === savedKey.current) return; const t = setTimeout(() => persist(latest.current!), SAVE_DELAY); return () => clearTimeout(t); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Only when something is unsaved: the page can be hidden and shown many times without a change.
    const flush = () => { const x = latest.current; if (x && contentKey(x) !== savedKey.current) task1Store.save(x).then(() => { savedKey.current = contentKey(x); }, () => {}); };
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', onHide);
    return () => { flush(); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onHide); };
  }, []);

  useEffect(() => {
    if (tourChecked.current || status !== 'ready' || !a) return;
    tourChecked.current = true;
    const p = findTask1Prompt(a.promptId);
    if (p && a.mode !== 'free' && a.step === 'compare' && !a.found.length && !tourSeen()) { const plan = tourPlanOf(p, a.found); if (plan) setTour({ start: 0, plan }); }
  }, [status, a]);

  if (status !== 'ready' || !a) {
    return (
      <div style={{ height: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <WorkspaceHeader />
        {status === 'loading' && <WorkspaceBone />}
        {status !== 'loading' && (
          <main style={{ maxWidth: 520, margin: '96px auto 0', padding: '0 24px', color: CL.ink }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 10px' }}>{status === 'error' ? 'Chưa tải được bài viết' : 'Không tìm thấy bài viết này'}</h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: CL.ink6, margin: '0 0 24px' }}>{status === 'error' ? 'Có thể mạng đang chập chờn. Bài của bạn vẫn được lưu trên máy chủ.' : 'Bài này không có trong tài khoản của bạn.'}</p>
            <Link href="/task1" className="cl-primary" style={{ display: 'inline-flex', alignItems: 'center', height: 42, padding: '0 18px', borderRadius: 10, color: '#fff', fontSize: 13.5, fontWeight: 600 }}>Về thư viện đề Task 1</Link>
          </main>
        )}
      </div>
    );
  }

  const prompt = findTask1Prompt(a.promptId)!;
  const upd = (patch: Partial<Task1Attempt>) => setA((x) => (x ? { ...x, ...patch, updatedAt: Date.now() } : x));
  const setEssay = (fn: (e: EssayState) => EssayState) => setA((x) => (x ? { ...x, essay: fn(x.essay), updatedAt: Date.now() } : x));
  const plan: PlanState = { found: a.found, place: a.place, ov: a.ov, order: a.order };
  const canPlan = a.found.length >= 2, ready = planReady(plan);
  const go = (step: Task1Step) => { if (step !== 'compare' && !canPlan) return; upd({ step }); setRow([]); setHint(null); };
  const stage = tour ? tourStage(tour.plan, row, a.found.length, tour.start) : 0;
  const guiding = !!tour && a.step === 'compare' && stage > 0 && stage < 5;
  /** The number the walkthrough asks for next (pair: one bar, then the other): ringed on the chart, the only cell that takes a click. */
  const tourCell = guiding && tour!.plan.first.kind === 'pair' ? (stage === 1 ? tour!.plan.first.a : stage === 3 ? tour!.plan.first.b : null) : null;
  const endTour = () => { markTourSeen(); setTour(null); };
  const replay = () => { const plan = tourPlanOf(prompt, a.found); if (!plan) return; setRow([]); setHint(null); setTour({ start: a.found.length, plan }); };
  const rowPart = partOfRow(row);
  const isIn = (id: string) => row.some((e) => e.k === 'val' && e.id === id);
  const act = {
    interactive: a.step === 'compare',
    isIn, isHinted: (id: string) => id === tourCell || (!!hint && hint.ids.includes(id) && !isIn(id)) || (!!a.review && !!active?.marks?.includes(id)),
    spot: a.review && active?.marks?.length ? active.marks : undefined,
    // While the walkthrough shows, the chart only takes its one click (the line's name in step 1).
    focus: tour && a.step === 'compare' && stage <= 2 && tour.plan.first.kind === 'item' ? tour.plan.first.id : undefined,
    onCell: (id: string) => { if (guiding && id !== tourCell) return; if (rowPart && rowPart !== cellById(prompt, id).part) return; setRow([...row, { k: 'val', id }]); },
    onGroup: (g: string) => { if (guiding && !(tour!.plan.first.kind !== 'pair' && stage === 1 && g === tour!.plan.first.group)) return; if (rowPart && rowPart !== groupPart(g)) return; setRow([...row, { k: 'group', id: g }]); },
  };
  const sections = sectionsOf(plan);
  const mode = a.mode || 'guided', free = mode === 'free';
  const submit = async () => {
    const paras = paragraphsOf(mode, a.essay, sections);
    if (!paras.length) { setGradeError('Bài còn trống.'); return; }
    setGrading(true); setGradeError(''); setReading(paras);
    try { const r = await postAi<{ review: Task1Review }>('task1-review', { promptId: prompt.id, paragraphs: paras }); setActive(null); setTab('ta'); upd({ review: r.review }); }
    catch (e) { if (e instanceof SignedOutError) { toLogin(); return; } setGradeError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network); }
    setGrading(false); setReading(null);
  };
  const writing = a.step === 'write';
  // A review saved before the feedback took Task 2's shape has no paragraphs: treat it as not graded.
  const graded = a.review && Array.isArray(a.review.paragraphs) ? a.review : null;
  const labels = graded ? labelsOf(mode, a.essay, sections, graded.paragraphs.length) : [];
  // Sửa bài (Task 2's round): every comment that quotes the report is fixed where it stands; key = the comment's index.
  const tasks: FixTask[] = graded && !grading ? graded.comments.map((c, k) => ({ c, k })).filter(({ c }) => c.quote && (graded.paragraphs[c.section - 1] || '').includes(c.quote)).map(({ c, k }) => ({
    item: { key: String(k), where: '', text: c.text, sectionId: String(c.section), quote: c.quote },
    crit: c.crit, title: c.label || c.crit.toUpperCase(), how: c.how || undefined, ask: c.how ? [] : [c.text.replace(/\*\*/g, '')], ok: 'Đã sửa xong chỗ này.', model: c.fix || undefined, vi: c.vi || undefined,
  })) : [];
  const fix = a.fix || null, edits = fix?.edits || {};
  const solvedN = fix ? tasks.filter((t) => fix.solved.includes(t.item.key)).length : 0;
  const paraAfter = (k: number, ps: string[]) => applyEdits(ps[k] || '', tasks.filter((t) => t.item.sectionId === String(k + 1)), edits);
  const checkTask = async (t: FixTask) => {
    if (!graded || checkingFix) return;
    const key = t.item.key, k = Number(t.item.sectionId) - 1;
    const before = graded.paragraphs[k] || '', after = applyEdits(before, [t], edits);
    const verdict = (v: { solved: boolean; reply: string; ask: string }) => setA((x) => (x && x.fix ? { ...x, updatedAt: Date.now(), fix: { ...x.fix, checks: { ...x.fix.checks, [key]: v }, solved: v.solved ? [...x.fix.solved.filter((y) => y !== key), key] : x.fix.solved.filter((y) => y !== key) } } : x));
    // Written along the hidden fix (the first-letter hints): solved at once, nothing to ask the AI.
    if (matchesFix(t, edits[key] || '')) { verdict({ solved: true, reply: 'Đã sửa đúng chỗ này.', ask: '' }); return; }
    // Vocabulary and grammar have one right fix: not matching it is not solved yet.
    if ((t.crit === 'lr' || t.crit === 'gra') && t.model) { verdict({ solved: false, reply: 'Chưa khớp cách sửa. Bấm "Gợi ý thêm" để xem chữ cái đầu của từng từ.', ask: '' }); return; }
    setCheckingFix(key); setFixError('');
    try { verdict(await postAi<{ solved: boolean; reply: string; ask: string }>('task1-fix', { promptId: prompt.id, action: 'check', task: { crit: t.crit, label: t.title.slice(0, 100), text: t.item.text.slice(0, 800), how: (t.how || '').slice(0, 400), quote: t.item.quote }, before, after })); }
    catch (e) { if (e instanceof SignedOutError) { toLogin(); return; } setFixError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network); }
    setCheckingFix(null);
  };
  const fixer: Fixer | null = graded && tasks.length ? {
    has: (k) => tasks.some((t) => t.item.key === String(k)),
    task: (k) => tasks.find((t) => t.item.key === String(k)) || null,
    open: openFix, edits, solved: fix?.solved || [], checks: fix?.checks || {}, checking: checkingFix, error: fixError,
    onOpen: (k) => {
      const c = graded.comments[k]; setOpenFix(String(k)); setActive(c); setTab(c.crit); setFixError(''); setGradeError('');
      if (!a.fix) upd({ fix: { before: [...graded.paragraphs], edits: {}, checks: {}, solved: [] } });
    },
    setEdit: (k, v) => setA((x) => (x && x.fix ? { ...x, updatedAt: Date.now(), fix: { ...x.fix, edits: { ...x.fix.edits, [k]: v } } } : x)),
    onCheck: (k) => { const t = tasks.find((x) => x.item.key === String(k)); if (t) checkTask(t); },
  } : null;
  /** "Viết lại" after the round: the rewrites go in place of their struck words and the report is re-scored against the last grading. */
  const resubmitFix = async () => {
    if (!graded || !fix || grading) return;
    const paras = graded.paragraphs.map((_, k) => paraAfter(k, graded.paragraphs));
    setOpenFix(null); setGrading(true); setGradeError(''); setReading(paras);
    try {
      const done = tasks.filter((t) => fix.solved.includes(t.item.key) || (edits[t.item.key] || '').trim()).slice(0, 12)
        .map((t) => ({ label: t.title, crit: t.crit, text: t.item.text.replace(/\*\*/g, '').slice(0, 600), solved: fix.solved.includes(t.item.key) }));
      const why = Object.fromEntries((['ta', 'cc', 'lr', 'gra'] as const).map((k) => [k, [graded.criteria?.[k]?.why, graded.criteria?.[k]?.gap].filter(Boolean).join(' ').replace(/\*\*/g, '')]));
      const prev = { ta: graded.scores.ta, cc: graded.scores.cc, lr: graded.scores.lr, gra: graded.scores.gra };
      const r = await postAi<{ scores: Task1Review['scores']; notes: { criterion: Task1Crit; text: string }[] }>('task1-fix', { promptId: prompt.id, action: 'rescore', prev, why, tasks: done, before: fix.before, after: paras });
      // Comments whose words are gone from the report are done with; the rest stay where their words still are.
      const comments = graded.comments.filter((c) => !c.quote || (paras[c.section - 1] || '').includes(c.quote));
      setActive(null); setTab('ta');
      setA((x) => x && ({ ...x, updatedAt: Date.now(), essay: writeBack(mode, x.essay, sections.map((t) => t.id), paras), review: { ...graded, scores: r.scores, comments, paragraphs: paras, rescore: { notes: r.notes } }, prevScores: graded.scores, fix: null }));
    } catch (e) { if (e instanceof SignedOutError) { toLogin(); return; } setGradeError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network); }
    setGrading(false); setReading(null);
  };
  const saveLabel = save === 'failed' ? 'Chưa lưu được · thử lại' : contentKey(a) !== savedKey.current ? 'Đang lưu…' : 'Đã lưu';

  return (
    <div style={{ height: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Saving is silent; only a failed save shows, with a retry. */}
      <WorkspaceHeader status={save === 'failed' ? <button type="button" className="cl-btn" onClick={() => persist(a)} style={{ fontSize: 12, fontWeight: 500, color: CL.redText, background: 'none', border: 'none' }}>{saveLabel}</button> : undefined} />
      <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 1560, margin: '0 auto', boxSizing: 'border-box', padding: '18px 32px 22px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 42, paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Link href="/task1" className="cl-link" style={backLinkStyle}><ClIcon name="left" size={14} />Thư viện đề</Link>
            {!free && <nav aria-label="Các bước" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {STEPS.map(([s, label], i) => {
                const on = a.step === s, off = s !== 'compare' && !canPlan;
                return (
                  <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {i > 0 && <span aria-hidden="true" style={{ width: 14, height: 1, background: CL.ink2 }} />}
                    <button type="button" className="cl-btn" aria-current={on ? 'step' : undefined} disabled={off} title={off ? 'Tìm ít nhất 2 điểm nổi bật trước.' : ''} onClick={() => go(s)}
                      style={{ minHeight: 30, borderRadius: 8, padding: '0 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: off ? 'not-allowed' : 'pointer', background: on ? '#EEF3FC' : '#fff', color: on ? '#2F62C4' : CL.ink6, boxShadow: on ? 'none' : '0 0 0 1px rgba(0,0,0,.1)', opacity: off ? 0.45 : 1 }}>{label}</button>
                  </span>
                );
              })}
            </nav>}
            {!free && a.step === 'compare' && <button type="button" className="cl-btn" onClick={replay} aria-label="Xem lại cách làm" title="Xem lại cách làm" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', boxShadow: '0 0 0 1px rgba(0,0,0,.1)', background: '#fff', color: CL.ink6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>?</button>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {gradeError && <span role="alert" style={{ fontSize: 12.5, color: CL.redText }}>{gradeError}</span>}
            {a.step === 'compare' && <button type="button" className="cl-btn cl-primary" disabled={!canPlan} onClick={() => go('plan')} style={{ ...primary, opacity: canPlan ? 1 : 0.4 }}>Chia đoạn →</button>}
            {a.step === 'plan' && <button type="button" className="cl-btn cl-primary" disabled={!ready} title={ready ? '' : 'Cần ít nhất một ý trong Tổng quan, Đoạn 1 và Đoạn 2.'} onClick={() => go('write')} style={{ ...primary, opacity: ready ? 1 : 0.4 }}>Viết bài →</button>}
            {writing && !a.review && (grading ? <span role="status" style={{ fontSize: 13, fontWeight: 500, color: CL.ink5 }}>Đang chấm bài…</span> : <span className="pro-fill"><button type="button" className="cl-btn" onClick={submit} style={primary}>Nộp bài</button></span>)}
            {writing && a.review && grading && <span role="status" style={{ fontSize: 13, fontWeight: 500, color: CL.ink5 }}>Đang chấm lại…</span>}
            {writing && a.review && !grading && (fixer ? <>
              <span style={{ fontSize: 12.5, color: CL.ink5, marginRight: 4 }}>Đã sửa <b style={{ color: CL.ink }}>{solvedN}</b> / {tasks.length}</span>
              {/* The Pro look only styles a live button: until one comment is fixed it stays the plain blue, faded. */}
              <span className={solvedN ? 'pro-fill' : ''}><button type="button" className={'cl-btn' + (solvedN ? '' : ' cl-primary')} onClick={resubmitFix} disabled={!solvedN} style={{ ...primary, opacity: solvedN ? 1 : 0.45 }}>Viết lại</button></span>
            </> : <button type="button" className="cl-btn cl-primary" onClick={() => { setActive(null); upd({ review: null, fix: null, prevScores: null }); }} style={primary}>Viết lại</button>)}
          </div>
        </div>

        <main style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: writing ? (a.review || reading ? '360px minmax(0, 1fr) 380px' : '360px minmax(0, 1fr) 330px') : 'minmax(0, 1fr) 520px', gap: 16 }}>
          <section style={{ minHeight: 0, overflowY: 'auto', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', padding: writing ? '16px' : '18px 20px 24px', display: 'flex', flexDirection: 'column', gap: writing ? 16 : 28 }}>
            <div style={{ border: '1px solid ' + CL.ink3, padding: '10px 13px' }}><p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, fontStyle: 'italic', lineHeight: 1.55, color: '#20252D' }}>{prompt.text}</p></div>
            <Charts prompt={prompt} act={act} compact={writing} />
            {writing && free && !graded && <FreeNotes essay={a.essay} setEssay={setEssay} />}
            {writing && graded && <GradedOutline review={graded} labels={labels} />}
          </section>

          {a.step === 'compare' && (
            <ComparePanel prompt={prompt} row={row} setRow={setRow} hint={hint} setHint={setHint} found={a.found}
              setFound={(f) => upd(f.length < a.found.length ? { found: f, place: {}, ov: [] } : { found: f })} />
          )}
          {a.step === 'compare' && tour && stage > 0 && <Walkthrough plan={tour.plan} stage={stage as TourStage} onEnd={endTour} />}
          {a.step === 'plan' && <PlanPanel prompt={prompt} state={plan} set={(p) => upd(p)} />}
          {writing && reading && <ReadingEssay paragraphs={reading} labels={labelsOf(mode, a.essay, sections, reading.length)} />}
          {writing && graded && !reading && <GradedEssay review={graded} labels={labels} active={active} setActive={setActive} tab={tab} fixer={fixer} reading={grading} />}
          {writing && !graded && !reading && !free && <GuidedColumn prompt={prompt} plan={plan} essay={a.essay} setEssay={setEssay} found={a.found} />}
          {writing && !graded && !reading && free && <FreeColumn essay={a.essay} setEssay={setEssay} />}
          {writing && graded && !reading && <ReviewPanel review={graded} labels={labels} active={active} setActive={setActive} tab={tab} setTab={setTab} fixer={fixer} prev={a.prevScores || null} />}
          {writing && reading && <aside className="cl-scroll" style={{ minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, padding: '2px 2px 4px' }}><ReviewBone phases={graded ? ['Đang đọc bài đã sửa', 'Đang so với lần chấm trước', 'Đang chấm lại'] : ['Đang đọc bài', 'Đang đối chiếu số liệu', 'Đang chấm từng tiêu chí', 'Đang viết nhận xét']} /></aside>}
          {writing && !graded && !reading && <SideColumn />}
        </main>
      </div>
    </div>
  );
}

const skipStyle: React.CSSProperties = { alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0, fontSize: 12.5, fontWeight: 500, color: CL.ink5, cursor: 'pointer' };

/** The four cards of the walkthrough: the first thing, the comparison, Kiểm tra, then Gợi ý for the rest. */
function Walkthrough({ plan, stage, onEnd }: { plan: TourPlan; stage: TourStage; onEnd: () => void }) {
  const first = plan.first, skip = <button type="button" onClick={onEnd} style={skipStyle}>Bỏ qua, mình tự làm</button>;
  if (first.kind === 'pair') {
    const chart = 'part:' + first.group, bar = first.shape === 'bars' ? 'cột' : first.shape === 'pies' ? 'phần' : first.shape === 'table' ? 'ô' : 'điểm';
    if (stage === 1) return <TourLayer step={1} dim holes={[chart]} anchor={chart} side="below" title="Mình làm thử một ý nhé" action={skip}>Mỗi điểm nổi bật bắt đầu từ biểu đồ. Bấm {bar} <b>{first.nameA}</b>{first.at ? <> ở <b>{first.at}</b></> : null} (có viền vàng): con số đó sẽ vào ô so sánh.</TourLayer>;
    if (stage === 2) return <TourLayer step={2} dim holes={[chart, 'row', 'tip:' + plan.tip]} anchor={'tip:' + plan.tip} side="below" title="Giờ nói điều bạn thấy" action={skip}>{plan.why} Chọn <b>{plan.tip}</b>.</TourLayer>;
    if (stage === 3) return <TourLayer step={3} dim holes={[chart, 'row']} anchor={chart} side="below" title="So với cái gì?" action={skip}>Bấm {bar} <b>{first.nameB}</b>{first.at ? <> ở <b>{first.at}</b></> : null} (có viền vàng) để có đủ hai con số.</TourLayer>;
  }
  if (stage === 1 && first.kind !== 'pair') return first.kind === 'item'
    ? <TourLayer step={1} dim holes={['part:' + first.group.split('>')[0], 'item:' + first.id]} anchor={'item:' + first.id} side="below" title="Mình làm thử một ý nhé" action={skip}>Mỗi điểm nổi bật bắt đầu từ biểu đồ. Bấm tên <b>{first.name}</b>: {first.shape === 'table' ? 'mọi số của ' + first.name : first.shape === 'bars' ? 'mọi cột ' + first.name : first.shape === 'pies' ? 'phần ' + first.name + ' ở mọi biểu đồ' : 'cả đường đó'} sẽ vào ô so sánh.</TourLayer>
    : <TourLayer step={1} dim holes={['tip:Tất cả']} anchor="tip:Tất cả" side="below" title="Mình làm thử một ý nhé" action={skip}>Có một điều đúng với cả biểu đồ. Bấm <b>Tất cả</b>: cả biểu đồ cùng vào ô so sánh.</TourLayer>;
  if (stage === 2 && first.kind !== 'pair') return <TourLayer step={2} dim holes={first.kind === 'item' ? ['part:' + first.group.split('>')[0], 'row', 'tip:' + plan.tip] : ['row', 'tip:' + plan.tip]} anchor={'tip:' + plan.tip} side="below" title="Giờ nói điều bạn thấy" action={skip}>{plan.why} Chọn <b>{plan.tip}</b>.</TourLayer>;
  if (stage === 4) return <TourLayer step={4} dim holes={['row', 'check']} anchor="check" side="above" title="Để mình đối chiếu số liệu" action={skip}>Bấm <b>Kiểm tra</b>. Ý nào đúng với biểu đồ mới được giữ lại.</TourLayer>;
  return (
    <TourLayer step={5} dim={false} holes={[]} anchor="hint" side="above" title="Xong một ý rồi đó"
      action={<button type="button" className="cl-btn cl-primary" onClick={onEnd} style={{ alignSelf: 'flex-start', height: 34, borderRadius: 8, border: 'none', color: '#fff', fontSize: 13, fontWeight: 500, padding: '0 14px', cursor: 'pointer' }}>Mình tự tìm tiếp</button>}>
      Giờ bạn tự tìm thêm, cứ thế: bấm trên biểu đồ, chọn ý, rồi Kiểm tra. Bí thì bấm <b>Gợi ý</b>, mình hỏi một câu để bạn tự nhìn ra.
    </TourLayer>
  );
}
