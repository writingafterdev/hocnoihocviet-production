'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Illustration } from '@/components/brand/Illustration';
import { Skeleton } from '@/components/base/skeleton/skeleton';
import { ProBeam } from '@/components/ui/pro-beam';
import { toast } from '@/components/ui/toast';
import type { ChainKind } from '@/lib/ai/chain-coach';
import type { IdeaEnds } from '@/lib/ai/idea-ends';
import { AI_ERROR_TEXT, AiRequestError, postAi } from '../ai/request';
import { SignedOutError } from '../attempts/store';
import { CL } from '../chainlab/constants';
import { ClIcon, ClLabel, toolbarBtn } from '../chainlab/ui/primitives';
import { ChainEditor } from '../coach/ChainEditor';
import { CoachGrid, SidePanel } from '../coach/CoachGrid';
import { ENDS } from '../coach/ends';
import { TranslatorChat } from '../coach/TranslatorChat';
import { primaryBtn } from '../coach/ui';
import { NOTE_STYLE, useCoach } from '../coach/useCoach';
import { saveAttempt, type DrillErr } from '../prove/drill-attempts';
import { SampleChain } from '../prove/SampleChain';
import { useStepHelp } from '../prove/StepHelp';
import { MACRO_NAME, MACRO_TINT, type IdeaPrompt, type Macro } from './NghiY';

const KIND: Record<Macro, ChainKind> = { A: 'cause', B: 'impact', C: 'solution' };
/** Which end the student finds: the cause (A), the impact (B), the measure (C). */
const MINE_IS_START: Record<ChainKind, boolean> = { cause: true, impact: false, solution: true };
const DRAWING: Record<Macro, string> = { A: 'man-sitting-on-question-mark-and-thinking', B: 'hands-holding-different-charts', C: 'woman-brainstorming-and-choosing-ideas' };
const HINTS = 2;

/** The ends of each prompt, asked once per visit to the page. */
const ENDS_CACHE = new Map<string, IdeaEnds>();

const errText = (e: unknown) => {
  if (e instanceof SignedOutError) { location.href = '/login?next=' + encodeURIComponent(location.pathname + location.search); return ''; }
  return e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network;
};

/**
 * One prompt as a Nghĩ ý exercise. Her prompt gives one end of the mạch ý; the student writes the other end (Gợi ý: a
 * leading question, then her idea from the doc), then the steps between, and checks the mạch ý like Chứng minh nhanh.
 */
export function IdeaExercise({ p, onLibrary, onNext, onDone }: { p: IdeaPrompt; onLibrary: () => void; onNext: () => void; onDone: () => void }) {
  const kind = KIND[p.macro];
  const mineStart = MINE_IS_START[kind];
  const [ends, setEnds] = useState<IdeaEnds | null>(ENDS_CACHE.get(p.id) ?? null);
  const [endsErr, setEndsErr] = useState('');
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (ends) return;
    let live = true;
    setEndsErr('');
    postAi<IdeaEnds>('idea-ends', { promptId: p.id })
      .then((e) => { ENDS_CACHE.set(p.id, e); if (live) setEnds(e); })
      .catch((e) => { if (live) setEndsErr(errText(e)); });
    return () => { live = false; };
  }, [p.id, tries]); // eslint-disable-line react-hooks/exhaustive-deps

  const [mine, setMine] = useState('');
  const [hints, setHints] = useState(0);
  const [steps, setSteps] = useState<string[]>(['']);
  const [active, setActive] = useState<number | null>(null);
  const [chat, setChat] = useState(false);
  const given = ends?.given ?? '';
  const start = mineStart ? mine.trim() : given;
  const end = mineStart ? given : mine.trim();
  const base = { kind, tone: null, start, end, sentence: '', stakeholder: undefined };
  const coach = useCoach(p.id, { ...base, steps });
  const help = useStepHelp(p.id, base, steps, '', 2);
  useEffect(() => { if (coach.error) toast.error(coach.error); }, [coach.error]);

  const [fixMode, setFixMode] = useState(false);
  const [peek, setPeek] = useState(false);
  useEffect(() => { setFixMode(false); setPeek(false); }, [coach.result?.snap]);
  useEffect(() => { if (coach.result?.sample?.length && coach.fresh) setChat(false); }, [coach.result?.snap]); // eslint-disable-line react-hooks/exhaustive-deps

  const checked = !!coach.result;
  const notes = coach.fresh && coach.result ? coach.result.placed : [];
  const clean = !!coach.result && ((coach.fresh && coach.result.placed.length === 0) || coach.allFixed);
  const showSample = !!coach.result?.sample?.length && !coach.allFixed;
  const ready = !!ends && !!mine.trim() && coach.filled > 0;
  const check = () => { setActive(null); coach.runCheck(); };

  // Every note raised on the way is kept, and saved with the attempt once the mạch ý passes (✓ in the list).
  const errs = useRef(new Map<string, DrillErr>());
  const saved = useRef(false);
  useEffect(() => {
    if (!coach.result || !coach.fresh) return;
    for (const n of coach.result.placed) {
      const where = n.step < 0 ? ENDS[kind].start : 'Bước ' + (n.step + 1);
      errs.current.set(n.type + '|' + n.text, { where, label: NOTE_STYLE[n.type].label, quote: n.step < 0 ? start : steps[n.step] || '', fix: n.fix || '' });
    }
  }, [coach.result]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!clean || saved.current) return;
    saved.current = true;
    onDone();
    saveAttempt(p.id, [start, ...steps.map((x) => x.trim()).filter(Boolean), end], [...errs.current.values()]);
  }, [clean]); // eslint-disable-line react-hooks/exhaustive-deps

  const labelMine = (mineStart ? ENDS[kind].start : ENDS[kind].end) + ' · bạn tìm';
  const labelGiven = (mineStart ? ENDS[kind].end : ENDS[kind].start) + ' · đề cho';
  const mineColor = mineStart ? CL.greenText : '#B33A1A';

  const givenNode = ends ? (
    <span style={{ fontFamily: CL.sans, fontSize: 15, fontWeight: 500, lineHeight: 1.5, color: mineStart ? '#B33A1A' : CL.greenText }}>{given}</span>
  ) : endsErr ? (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontFamily: CL.sans, fontSize: 13.5, color: CL.ink5 }}>
      {endsErr}
      <button type="button" className="cl-btn" onClick={() => setTries((n) => n + 1)} style={toolbarBtn(false)}>Thử lại</button>
    </span>
  ) : (
    <Skeleton shape="text" style={{ width: '60%', height: 18, marginTop: 3 }} />
  );

  const mineNode = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <textarea
        aria-label={labelMine}
        value={mine}
        onChange={(e) => setMine(e.target.value)}
        rows={2}
        placeholder={ends?.ask || ''}
        disabled={!ends}
        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 56, padding: '10px 12px', borderRadius: 10, border: '1px solid ' + (mine.trim() ? CL.ink2 : '#77A1DD'), boxShadow: mine.trim() ? 'none' : '0 0 0 3px #EEF3FC', fontFamily: CL.sans, fontSize: 15, fontWeight: 500, lineHeight: 1.5, color: mineColor, outline: 'none', background: '#fff' }}
      />
      {ends && !checked && hints < HINTS && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ProBeam><button type="button" className="cl-btn cl-primary" onClick={() => setHints((h) => h + 1)} style={{ ...primaryBtn, height: 32 }}>Gợi ý</button></ProBeam>
          <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5 }}>còn {HINTS - hints} lượt</span>
        </span>
      )}
      {ends && hints >= 1 && (
        <div className="co-rise" style={{ borderRadius: 10, background: '#F7F9FD', boxShadow: '0 0 0 1px #DCE7F7', padding: '10px 14px', fontFamily: CL.sans, fontSize: 14, lineHeight: 1.55, color: CL.ink8 }}>{ends.nudge}</div>
      )}
      {ends && hints >= 2 && (
        <div className="co-rise" style={{ borderRadius: 10, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, fontFamily: CL.sans }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ borderRadius: 4, padding: '1px 6px', background: MACRO_TINT[p.macro].bg, color: MACRO_TINT[p.macro].fg, fontSize: 11.5, fontWeight: 700 }}>{p.macro}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: CL.ink5 }}>{p.idea}</span>
          </span>
          <span style={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.5, color: CL.ink }}>{ends.idea}</span>
          <span style={{ fontSize: 13, lineHeight: 1.5, color: CL.ink5 }}>{ends.ideaVi}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
            <button type="button" className="cl-btn" onClick={() => setMine(ends.idea)} style={toolbarBtn(false)}>Dùng ý này</button>
            <Link href={'/tai-lieu?p=' + p.part} target="_blank" style={{ fontSize: 13, fontWeight: 500, color: '#2F62C4' }}>Xem trong tài liệu</Link>
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ height: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 1560, margin: '0 auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', fontFamily: CL.sans }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, minHeight: 42, paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="cl-btn" onClick={onLibrary} style={toolbarBtn(false)}>Thư viện</button>
            <button type="button" className="cl-btn" onClick={onNext} style={toolbarBtn(false)}>Đổi đề</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="cl-btn" onClick={() => setChat(!chat)} aria-pressed={chat} style={toolbarBtn(chat)}>Dịch</button>
            {!checked ? (
              <ProBeam><button type="button" className="cl-btn cl-primary" onClick={check} disabled={!ready || coach.checking} style={{ ...primaryBtn, opacity: ready && !coach.checking ? 1 : 0.35 }}>{coach.checking ? 'Đang kiểm tra…' : 'Kiểm tra'}</button></ProBeam>
            ) : (
              <>
                <button type="button" className="cl-btn" onClick={check} disabled={coach.fresh || coach.checking || !ready} style={{ ...toolbarBtn(false), color: CL.ink, opacity: coach.fresh || coach.checking ? 0.4 : 1 }}>{coach.checking ? 'Đang kiểm tra…' : 'Kiểm tra lại'}</button>
                <button type="button" className="cl-btn cl-primary" onClick={onNext} style={primaryBtn}>Đề tiếp<ClIcon name="right" size={13} /></button>
              </>
            )}
          </div>
        </div>

        <CoachGrid
          open={chat || showSample}
          main={
            <main className="co-col" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <section className="relative pb-5 pl-[34px] pr-[34px] pt-[22px] xl:pr-[200px]" style={{ flexShrink: 0, boxSizing: 'border-box', minHeight: 180, borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Illustration name={DRAWING[p.macro]} className="co-rise pointer-events-none absolute bottom-3 right-6 top-3 hidden h-[calc(100%-24px)] w-[150px] xl:block" />
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <ClLabel>Nghĩ ý cho đề này</ClLabel>
                  <span style={{ borderRadius: 5, padding: '4px 8px', background: MACRO_TINT[p.macro].bg, color: MACRO_TINT[p.macro].fg, fontSize: 12, fontWeight: 500 }}>{MACRO_NAME[p.macro]}</span>
                  {p.date && <span style={{ borderRadius: 5, padding: '4px 8px', background: '#FFF6DE', color: '#8A5A00', fontSize: 12, fontWeight: 500 }}>Đề thi {p.date}</span>}
                </span>
                <p style={{ margin: 0, fontFamily: CL.serif, fontSize: 19, lineHeight: 1.55, color: CL.ink }}>{p.text}</p>
              </section>
              <section style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
                <div className="cl-scroll co-rise" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 32px 16px 34px' }}>
                  <ChainEditor
                    start={start} end={end}
                    startLabel={mineStart ? labelMine : labelGiven} endLabel={mineStart ? labelGiven : labelMine}
                    startNode={mineStart ? mineNode : givenNode} endNode={mineStart ? givenNode : mineNode}
                    steps={steps} setSteps={setSteps}
                    notes={notes} active={active} onPick={setActive}
                    hint={coach.hint} asking={coach.asking} onHint={coach.askHint} onCloseHint={coach.closeHint}
                    checking={coach.checking} clean={clean} hideHint
                    check={{ result: coach.result, fresh: coach.fresh, checking: coach.checking, busy: coach.noteBusy, miss: coach.noteMiss, onStepEnter: (k, now) => coach.checkStep(k, now) }}
                    blockPaste={help.isSamplePaste} onBlockedPaste={() => toast('Không dán được câu mẫu: hãy gõ lại bằng tay.')}
                    stepQuestion={help.stepQuestion} onSubmitStep={help.onSubmitStep} belowStep={help.belowStep}
                  />
                </div>
              </section>
            </main>
          }
          side={
            <>
              <SidePanel on={chat} grow={2}>
                <TranslatorChat onClose={() => setChat(false)} />
              </SidePanel>
              <SidePanel on={showSample && !chat} grow={2}>
                {showSample && <SampleChain start={start} end={end} steps={coach.result!.sample!} hiding={fixMode || !coach.fresh} peek={peek} onFix={() => setFixMode(true)} onPeek={() => setPeek(!peek)} />}
              </SidePanel>
            </>
          }
        />
      </div>
    </div>
  );
}
