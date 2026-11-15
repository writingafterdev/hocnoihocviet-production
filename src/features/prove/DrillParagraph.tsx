'use client';

import { useState } from 'react';
import type { Prompt } from '@/content/prompts';
import { plainSentence, type Statement } from '@/content/statements';
import type { EssayState } from '../attempts/store';
import { AI_ERROR_TEXT, AiRequestError, postAi } from '../ai/request';
import { CL } from '../chainlab/constants';
import type { Chain } from '../chainlab/types';
import { backLinkStyle, ClIcon, ClLabel, toolbarBtn } from '../chainlab/ui/primitives';
import { TranslatorChat } from '../coach/TranslatorChat';
import { primaryBtn } from '../coach/ui';
import { wordCount } from '../desk/scoring';
import { checkFix, type CheckOut, type PlanTask } from '../essay/fix-api';
import { planTasks, type FixTask } from '../essay/FixFlow';
import { GuidedHeader, GuidedWriter, useGuidedPlan } from '../essay/GuidedWriter';
import { applyEdits, FixCard, FixParagraph } from '../essay/InlineFix';
import { Chip } from '@/components/base/badges/chip';
import { AiStatus } from '@/components/ui/ai-status';
import { ProBeam } from '@/components/ui/pro-beam';

const SECTIONS = [{ id: 'para', label: 'Đoạn văn', guide: '', placeholder: '' }];
const card: React.CSSProperties = { minHeight: 0, borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const label: React.CSSProperties = { fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink5 };

interface Review { tasks: FixTask[]; solved: string[]; checks: Record<string, CheckOut>; edits: Record<string, string> }

/**
 * Chứng minh nhanh, after "Kiểm tra": the chain written as one paragraph, by the student alone ("Tự viết") or
 * sentence by sentence ("Viết có hướng dẫn"). "Nhận xét đoạn văn" gives idea/flow comments, no score; each is fixed
 * inside its comment, the old words struck through in the paragraph with the rewrite after them.
 */
export function DrillParagraph({ s, prompt, steps, guided: startGuided, onBack }: { s: Statement; prompt: Prompt; steps: string[]; guided: boolean; onBack: () => void }) {
  const chain: Chain = { id: 'para', q: 1, title: '', tone: s.tone || null, area: '', split: null, findings: [], steps: [s.start, ...steps.map((x) => x.trim()).filter(Boolean), s.end], mine: 'start', built: true };
  const sentence = plainSentence(s.sentence);
  const [essay, setEssay] = useState<EssayState>({ bodies: [], drafts: { para: '' }, seconds: 0, review: null, guided: startGuided ? { plan: null, at: 0, level: 'frame' } : null });
  const plan = useGuidedPlan(prompt, [chain], essay, setEssay, sentence);
  const [chat, setChat] = useState(!startGuided);
  const [review, setReview] = useState<Review | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [fixError, setFixError] = useState('');

  const text = essay.drafts.para || '';
  const guidedOn = !!essay.guided && !essay.guided.done;
  const gNow = guidedOn && essay.guided!.plan ? essay.guided!.plan[essay.guided!.at] : null;
  const solvedN = review ? review.tasks.filter((t) => review.solved.includes(t.item.key)).length : 0;

  /** Comments on the paragraph (with every solved rewrite put in place first, when asked again). */
  const askReview = async () => {
    if (reviewing) return;
    const body = review ? applyEdits(text, review.tasks, review.edits) : text;
    if (!body.trim()) return;
    setReviewing(true); setError(''); setOpen(null); setChat(false);
    try {
      const r = await postAi<{ tasks: PlanTask[] }>('paragraph-review', { promptId: prompt.id, chains: [chain], stance: '', sentence, text: body });
      setEssay((e) => ({ ...e, drafts: { para: body } }));
      const tasks = planTasks(r.tasks || []);
      setReview({ tasks, solved: [], checks: {}, edits: {} });
      setOpen(tasks[0]?.item.key || null);
    } catch (e) { setError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network); }
    setReviewing(false);
  };

  const check = async (t: FixTask) => {
    if (!review || !t.plan || checking) return;
    const key = t.item.key, after = applyEdits(text, [t], review.edits);
    setChecking(key); setFixError('');
    try {
      const v = await checkFix(prompt, [chain], t.plan, text, after);
      setReview((r) => (r ? { ...r, checks: { ...r.checks, [key]: v }, solved: v.solved ? [...r.solved.filter((x) => x !== key), key] : r.solved.filter((x) => x !== key) } : r));
    } catch (e) { setFixError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network); }
    setChecking(null);
  };

  // The chain as a thread: start, steps, end; the step the guided sentence is about is tinted.
  const thread = chain.steps;
  const now = gNow && gNow.step >= 0 ? gNow.step : null;

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, minHeight: 42, paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <button type="button" className="cl-btn cl-link" onClick={onBack} style={backLinkStyle}><ClIcon name="left" size={14} />Về chuỗi</button>
          <Chip variant="subtle" color="blue">Chứng minh nhanh</Chip>
          <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5 }}>Viết đoạn văn từ chuỗi</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {error && <span role="alert" style={{ fontFamily: CL.sans, fontSize: 12, color: CL.redText, marginRight: 4 }}>{error}</span>}
          {review && review.tasks.length > 0 && <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5, marginRight: 4 }}>Đã sửa <b style={{ color: CL.ink }}>{solvedN}</b> / {review.tasks.length}</span>}
          <button type="button" className="cl-btn" onClick={() => setChat(!chat)} aria-pressed={chat} style={toolbarBtn(chat)}>Dịch</button>
          {review
            ? <ProBeam><button type="button" className="cl-btn cl-primary" onClick={askReview} disabled={reviewing || !solvedN} style={{ ...primaryBtn, opacity: reviewing || !solvedN ? 0.45 : 1 }}>{reviewing ? 'Đang đọc…' : 'Nhận xét lại'}</button></ProBeam>
            : <ProBeam><button type="button" className="cl-btn cl-primary" onClick={askReview} disabled={reviewing || guidedOn || !text.trim()} style={{ ...primaryBtn, opacity: reviewing || guidedOn || !text.trim() ? 0.45 : 1 }}>{reviewing ? 'Đang đọc…' : 'Nhận xét đoạn văn'}</button></ProBeam>}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '300px minmax(0,1fr)' + (chat || review || reviewing ? ' 360px' : ''), gap: 18 }}>
        <aside style={card}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid ' + CL.ink1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ClLabel>Câu cần chứng minh</ClLabel>
            <span style={{ fontFamily: CL.sans, fontSize: 14, lineHeight: 1.5, color: CL.ink }}>{sentence}</span>
          </div>
          <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 12px' }}>
            <span style={{ ...label, display: 'block', padding: '0 6px 6px' }}>Chuỗi của bạn</span>
            <ol style={{ position: 'relative', listStyle: 'none', margin: 0, padding: 0 }}>
              <span aria-hidden="true" style={{ position: 'absolute', left: 11.5, top: 14, bottom: 14, width: 1, background: CL.ink2 }} />
              {thread.map((x, k) => {
                const isStart = k === 0, isEnd = k === thread.length - 1, on = now === k;
                return (
                  <li key={k} style={{ position: 'relative', display: 'flex', gap: 10, padding: '6px 8px', borderRadius: 8, background: on ? '#EEF3FC' : 'transparent', transition: 'background-color .2s' }}>
                    <span style={{ position: 'relative', top: 6, width: 8, height: 8, flexShrink: 0, borderRadius: isEnd ? 2 : 99, background: isStart ? '#2D881A' : isEnd ? '#B8862B' : on ? '#2F62C4' : CL.ink3, boxShadow: '0 0 0 3px ' + (on ? '#EEF3FC' : '#fff') }} />
                    <span style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.5, fontWeight: isEnd || on ? 600 : 400, color: isEnd ? '#B33A1A' : isStart ? '#2D6E1E' : on ? CL.ink : CL.ink7 }}>{x}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        <section style={card}>
          <div style={{ minHeight: 50, padding: '0 20px', borderBottom: '1px solid ' + CL.ink1, background: CL.panel, display: 'flex', alignItems: 'center', gap: 10 }}>
            <b style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: CL.ink }}>Đoạn văn</b>
            {guidedOn
              ? <GuidedHeader essay={essay} setEssay={setEssay} total={essay.guided?.plan?.length || 0} />
              : <>
                {review && <span style={label}>Bấm chỗ bị gạch để viết lại.</span>}
                <span style={{ ...label, marginLeft: 'auto' }}>{wordCount(text)} từ</span>
              </>}
          </div>
          {guidedOn
            ? <GuidedWriter sections={SECTIONS} essay={essay} setEssay={setEssay} plan={essay.guided?.plan || null} error={plan.error} loading={plan.loading} retry={plan.retry} />
            : (
              <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px' }}>
                {review
                  ? <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: CL.serif, fontSize: 15, lineHeight: 1.8, color: CL.ink8 }}><FixParagraph text={text} tasks={review.tasks} edits={review.edits} open={open} onOpen={setOpen} /></p>
                  : <textarea className="co-ta" autoFocus value={text} readOnly={reviewing} onChange={(e) => { const v = e.target.value; setEssay((x) => ({ ...x, drafts: { para: v } })); }} aria-label="Đoạn văn"
                    placeholder="Câu chủ đề, rồi đi theo chuỗi bên trái: điểm đầu → từng bước → điểm cuối."
                    style={{ display: 'block', width: '100%', minHeight: 240, resize: 'none', border: 'none', outline: 'none', background: 'transparent', padding: 0, fontFamily: CL.serif, fontSize: 15.5, lineHeight: 1.8, color: CL.ink8, fieldSizing: 'content' } as React.CSSProperties} />}
              </div>
            )}
        </section>

        {(chat || review || reviewing) && (
          <aside className="cl-scroll" style={{ minHeight: 0, overflowY: chat ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: 2 }}>
            {chat ? <TranslatorChat onClose={() => setChat(false)} />
              : reviewing ? (
                <section style={{ ...card, padding: '18px 20px', gap: 10 }}><ClLabel color={CL.ink}>Nhận xét</ClLabel><AiStatus state="analyzing" states={{ analyzing: { label: 'Đang đọc đoạn văn', active: true } }} className="text-[13px]" /></section>
              ) : review && (review.tasks.length ? <>
                <ClLabel>{review.tasks.length} nhận xét về ý và mạch</ClLabel>
                {review.tasks.map((t) => (
                  <FixCard key={t.item.key} task={t} where="Đoạn văn" open={open === t.item.key} onOpen={() => { setOpen(t.item.key); setFixError(''); }}
                    edit={review.edits[t.item.key] || ''} setEdit={(v) => setReview((r) => (r ? { ...r, edits: { ...r.edits, [t.item.key]: v } } : r))}
                    solved={review.solved.includes(t.item.key)} verdict={review.checks[t.item.key]}
                    checking={checking === t.item.key} error={open === t.item.key ? fixError : ''} onCheck={() => check(t)} />
                ))}
              </> : (
                <section style={{ ...card, padding: '16px 18px', gap: 6 }}>
                  <ClLabel color={CL.ink}>Nhận xét</ClLabel>
                  <span style={{ fontFamily: CL.sans, fontSize: 13.5, lineHeight: 1.55, color: CL.greenText }}>Đoạn văn đi liền theo chuỗi, không có chỗ cần sửa về ý và mạch.</span>
                </section>
              ))}
          </aside>
        )}
      </div>
    </div>
  );
}
