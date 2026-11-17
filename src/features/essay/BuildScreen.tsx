'use client';

import { useState, type ReactNode } from 'react';
import type { Prompt } from '@/content/prompts';
import { CL, CL_CIRC } from '../chainlab/constants';
import type { Chain } from '../chainlab/types';
import { ClIcon, ClLabel, PromptText, toolbarBtn } from '../chainlab/ui/primitives';
import { ChainEditor, miniBtn } from '../coach/ChainEditor';
import { CoachGrid, SidePanel } from '../coach/CoachGrid';
import { TranslatorChat } from '../coach/TranslatorChat';
import { primaryBtn } from '../coach/ui';
import { useCoach, type CheckResult } from '../coach/useCoach';
import { useStepHelp } from '../prove/StepHelp';
import { chainIn, endOf, KIND_ASK, kindOf, middleOf, newBody, questionOf, startOf, withEnds, withMiddle } from './model';
import { Chip } from '@/components/base/badges/chip';
import { ProBeam } from '@/components/ui/pro-beam';
import { ENDS } from '../coach/ends';

export interface BuildProps {
  prompt: Prompt;
  chains: Chain[];
  setChains: (fn: (cs: Chain[]) => Chain[]) => void;
  checks: Record<string, CheckResult>;
  setCheck: (id: string, r: CheckResult | null) => void;
  toolbarLeft: ReactNode;
  /** The essay already has text, a review or a guided round: "Viết bài" goes straight there. */
  started: boolean;
  /** To ② Viết bài; a first visit says how the student wants to write. */
  onNext: (mode?: 'free' | 'guided') => void;
}

/** A chain is ready for writing when both ends and at least one middle step are there. */
export const isReady = (c: Chain) => c.built !== false && !!startOf(c).trim() && !!endOf(c).trim() && middleOf(c).some((s) => s.trim());
export const NEED = 2;

/** Tiny pictures on the two choices: lines of text, and a sentence half typed over first-letter hints. */
const picFree = (
  <span aria-hidden="true" style={{ height: 72, borderRadius: 10, background: '#F7F6F2', border: '1px solid #E5E5E5', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, padding: '0 12px' }}>
    {[86, 70, 78].map((w) => <span key={w} style={{ height: 7, borderRadius: 4, background: '#E3E1D8', width: w + '%' }} />)}
  </span>
);
const tok = (t: string, ok: boolean) => <span key={t} style={{ border: '1px solid ' + (ok ? '#BFE0B5' : '#E5E5E5'), background: ok ? '#EDF7EA' : '#fff', borderRadius: 5, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, color: ok ? '#2D6E1E' : '#737373', padding: '2px 6px' }}>{t}</span>;
const picGuided = (
  <span aria-hidden="true" style={{ height: 72, borderRadius: 10, background: '#F7F9FD', border: '1px solid #DCE7F7', display: 'flex', alignItems: 'center', alignContent: 'center', flexWrap: 'wrap', gap: 5, padding: '0 12px' }}>
    {tok('Many', true)}{tok('new', true)}{tok('p******', false)}{tok('h***', false)}{tok('n****', false)}
  </span>
);

function ModeDialog({ onPick, onClose }: { onPick: (m: 'free' | 'guided') => void; onClose: () => void }) {
  const [mode, setMode] = useState<'free' | 'guided'>('guided');
  const opt = (m: 'free' | 'guided', pic: ReactNode, title: string, text: string) => (
    <button type="button" className="cl-btn" onClick={() => setMode(m)} aria-pressed={mode === m}
      style={{ flex: 1, textAlign: 'left', borderRadius: 14, border: '1px solid ' + (mode === m ? '#2F62C4' : '#E5E5E5'), boxShadow: mode === m ? '0 0 0 3px #EEF3FC' : 'none', background: '#fff', padding: 14, display: 'flex', flexDirection: 'column', gap: 6, transition: 'border-color .15s, box-shadow .15s' }}>
      {pic}
      <b style={{ marginTop: 6, fontFamily: CL.sans, fontSize: 15, fontWeight: 600, color: CL.ink }}>{title}</b>
      <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.55, color: CL.ink5 }}>{text}</span>
    </button>
  );
  return (
    <div role="dialog" aria-modal="true" aria-label="Chọn cách viết" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(20,20,19,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 640, maxWidth: '100%', boxSizing: 'border-box', background: '#fff', borderRadius: 20, padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 17, fontWeight: 600, lineHeight: 1.4, color: CL.ink }}>Mạch ý đã xong. Bạn muốn viết thế nào?</p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {opt('free', picFree, 'Tự viết', 'Viết cả bài với mạch ý nằm cạnh, rồi nộp để chấm theo bốn tiêu chí.')}
          {opt('guided', picGuided, 'Viết có hướng dẫn', 'Viết từng câu theo mạch ý của bạn. Mỗi câu có gợi ý cấu trúc và từ vựng; vẫn bí thì bật gợi ý chi tiết.')}
        </div>
        <button type="button" autoFocus className="cl-btn cl-primary" onClick={() => onPick(mode)} style={{ ...primaryBtn, height: 46, justifyContent: 'center' }}>Bắt đầu viết</button>
      </div>
    </div>
  );
}

const arrow = (
  <svg aria-hidden="true" viewBox="0 0 36 12" style={{ width: 36, height: 12, alignSelf: 'center', overflow: 'visible' }}>
    <line x1="1" y1="6" x2="29" y2="6" stroke={CL.ink6} strokeWidth="1.5" />
    <path d="M27 1.5 L35 6 L27 10.5 Z" fill={CL.ink6} />
  </svg>
);

const box = (dashed: boolean, filled: boolean): React.CSSProperties => ({
  minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', borderRadius: 10,
  ...(dashed ? { border: '1px solid ' + (filled ? 'var(--color-border-button-hover)' : 'var(--color-border-button-default)'), background: '#fff', boxShadow: 'var(--shadow-xs)' } : { border: '1px solid ' + CL.ink1, background: CL.panel }),
});

const fieldStyle: React.CSSProperties = { display: 'block', width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', padding: 0, fontFamily: CL.serif, fontSize: 15, lineHeight: 1.55, color: CL.ink8 };

/** One body paragraph's chain: two boxes until built, then the line with its middle. */
function BodyCard({ prompt, chain, num, canDelete, onChange, onDelete, check, onCheck, focused, onFocus, active, onPick }: {
  prompt: Prompt; chain: Chain; num: number; canDelete: boolean; onChange: (c: Chain) => void; onDelete: () => void;
  check: CheckResult | null; onCheck: (r: CheckResult | null) => void; focused: boolean; onFocus: () => void; active: number | null; onPick: (k: number | null) => void;
}) {
  const kind = kindOf(prompt, chain), q = questionOf(prompt, chain), info = KIND_ASK[kind];
  const coach = useCoach(prompt.id, chainIn(prompt, chain), check, onCheck);
  const { steps: _steps, ...base } = chainIn(prompt, chain); // eslint-disable-line @typescript-eslint/no-unused-vars
  /** Same per-step help as Chứng minh nhanh: "Gợi ý" (a guiding question as the placeholder + phrases), then rewording after Enter. */
  const help = useStepHelp(prompt.id, base, middleOf(chain).length ? middleOf(chain) : [''], '');
  const mine = chain.mine || 'start';
  const start = startOf(chain), end = endOf(chain);
  const ready = !!(start.trim() && end.trim());
  const middle = middleOf(chain);
  const filled = middle.filter((s) => s.trim()).length;
  const build = () => { if (ready) onChange({ ...withMiddle(chain, middle.length ? middle : ['']), built: true }); };
  const setEnd = (which: 'start' | 'end', v: string) => onChange(withEnds(chain, which === 'start' ? v : start, which === 'end' ? v : end));
  const notes = coach.fresh && coach.result ? coach.result.placed : [];
  const multi = prompt.questions.length > 1;
  const status = !chain.built ? (ready ? 'Đủ hai đầu' : 'Chưa đủ hai đầu') : filled ? filled + ' bước ở giữa' : 'Chưa có bước nào';

  const endBox = (which: 'start' | 'end') => {
    const isMine = which === mine;
    const value = which === 'start' ? start : end;
    return (
      <div className={isMine ? 'cl-field' : undefined} style={box(isMine, !!value.trim())}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClLabel color={isMine ? CL.ink : CL.ink5}>{ENDS[kind][which]}{isMine ? ' · bạn viết' : ''}</ClLabel>
          {!isMine && <span style={{ borderRadius: 5, padding: '2px 6px', background: '#E4F5FA', color: '#17667A', fontFamily: CL.sans, fontSize: 12, fontWeight: 500 }}>Gợi ý từ đề</span>}
        </span>
        <textarea className="co-ta" value={value} rows={1} autoFocus={isMine && !value} aria-label={ENDS[kind][which]} placeholder={isMine ? info.ph : ''}
          onChange={(e) => setEnd(which, e.target.value)} onFocus={onFocus}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); build(); } }}
          style={fieldStyle} />
      </div>
    );
  };

  return (
    <section onFocusCapture={onFocus} style={{ flexShrink: 0, borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 56, padding: '0 14px 0 22px', borderBottom: '1px solid ' + CL.ink1 }}>
        <span style={{ fontFamily: CL.sans, fontSize: 14.5, fontWeight: 600, color: CL.ink }}>Thân bài {num}</span>
        <Chip variant="caption" color="gray">{multi ? CL_CIRC[q.n - 1] + ' ' : ''}{info.chip}</Chip>
        <Chip className="ml-auto" variant="caption" color={chain.built && filled ? 'lime' : 'gray'}>{status}</Chip>
        {canDelete && <button type="button" className="cl-btn cl-del" onClick={onDelete} aria-label={'Xoá thân bài ' + num} style={{ width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: CL.ink3 }}><ClIcon name="trash" size={14} /></button>}
      </div>

      {!chain.built ? (
        <>
          <div style={{ padding: '20px 24px 18px' }}>
            <p style={{ margin: '0 0 14px', fontFamily: CL.sans, fontSize: 14, lineHeight: 1.55, color: CL.ink7 }}>{info.ask}{q.q && prompt.questions.length > 1 ? <span style={{ color: CL.ink4 }}> · {q.q}</span> : null}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 36px minmax(0,1fr)', alignItems: 'stretch' }}>
              {endBox('start')}
              {arrow}
              {endBox('end')}
            </div>
          </div>
          <div style={{ borderTop: '1px solid ' + CL.ink1, background: CL.panel, padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" className="cl-btn cl-primary" onClick={build} disabled={!ready} style={{ ...miniBtn, background: undefined, boxShadow: undefined, marginLeft: 'auto', border: 'none', color: '#fff', opacity: ready ? 1 : 0.3 }}>Dựng mạch ↵</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ padding: '18px 26px 12px 26px' }}>
            <ChainEditor
              start={start} end={end}
              startLabel={ENDS[kind].start + ' · ' + (mine === 'start' ? 'bạn viết' : 'gợi ý từ đề')}
              endLabel={ENDS[kind].end + ' · ' + (mine === 'end' ? 'bạn viết' : 'gợi ý từ đề')}
              steps={middle.length ? middle : ['']} setSteps={(m) => onChange(withMiddle(chain, m))}
              notes={notes} active={focused ? active : null} onPick={(k) => { onFocus(); onPick(k); }}
              hint={coach.hint} asking={coach.asking} onHint={coach.askHint} onCloseHint={coach.closeHint} hideHint
              stepQuestion={help.stepQuestion} onSubmitStep={help.onSubmitStep} belowStep={help.belowStep}
              helper={coach.error}
              check={{ result: coach.result, fresh: coach.fresh, checking: coach.checking, busy: coach.noteBusy, miss: coach.noteMiss, onStepEnter: (k, now) => coach.checkStep(k, now) }}
              checking={coach.checking} clean={!!coach.result && ((coach.fresh && coach.result.placed.length === 0) || coach.allFixed)}
            />
          </div>
          <div style={{ borderTop: '1px solid ' + CL.ink1, background: CL.panel, padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="cl-btn cl-link" onClick={() => onChange({ ...chain, built: false })} style={{ ...miniBtn, border: 'none', background: 'transparent', color: CL.ink5 }}>Đổi hai đầu</button>
            {coach.result && !coach.fresh && <span style={{ fontFamily: CL.sans, fontSize: 11.5, color: CL.ink4 }}>Bạn đã sửa mạch ý sau lần kiểm tra trước.</span>}
            <ProBeam className="ml-auto"><button type="button" className="cl-btn cl-add" onClick={() => { onFocus(); onPick(null); coach.runCheck(); }} disabled={!filled || coach.checking || coach.fresh}
              style={{ ...miniBtn, marginLeft: 'auto', color: CL.ink, opacity: !filled || coach.checking || coach.fresh ? 0.4 : 1 }}>{coach.checking ? 'Đang kiểm tra…' : coach.result ? 'Kiểm tra lại' : 'Kiểm tra mạch'}</button></ProBeam>
          </div>
        </>
      )}
    </section>
  );
}

/** ① Dựng mạch: the prompt, then one chain card per body paragraph. Right: the chosen chain's notes and the translator. */
export function BuildScreen({ prompt, chains, setChains, checks, setCheck, toolbarLeft, started, onNext }: BuildProps) {
  const [chat, setChat] = useState(true);
  const [picking, setPicking] = useState(false);
  const ready = chains.filter(isReady).length;
  const canWrite = started || ready >= NEED;
  const [focus, setFocus] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const update = (c: Chain) => setChains((cs) => cs.map((x) => (x.id === c.id ? c : x)));
  const remove = (id: string) => setChains((cs) => cs.filter((x) => x.id !== id));
  const add = (n: number) => setChains((cs) => [...cs, newBody(prompt, prompt.questions.find((q) => q.n === n) || prompt.questions[0], cs)]);
  const focused = chains.find((c) => c.id === focus) || null;
  const multi = prompt.questions.length > 1;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1560, margin: '0 auto', padding: '24px 32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, minHeight: 42, paddingBottom: 12 }}>
        {toolbarLeft}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!started && <Chip variant="caption" color={ready >= NEED ? 'lime' : 'gray'}>{Math.min(ready, NEED)}/{NEED} mạch ý đã dựng</Chip>}
          <button type="button" className="cl-btn" onClick={() => setChat(!chat)} aria-pressed={chat} style={toolbarBtn(chat)}>Dịch</button>
          <button type="button" className="cl-btn cl-primary" onClick={() => (started ? onNext() : setPicking(true))} disabled={!canWrite}
            title={canWrite ? '' : 'Dựng xong ít nhất ' + NEED + ' mạch ý (đủ hai đầu và ít nhất một bước ở giữa) để viết bài.'}
            style={{ ...primaryBtn, opacity: canWrite ? 1 : 0.4 }}>Viết bài<ClIcon name="right" size={13} /></button>
        </div>
      </div>
      {picking && <ModeDialog onClose={() => setPicking(false)} onPick={(m) => { setPicking(false); onNext(m); }} />}

      <CoachGrid
        open={chat}
        main={
        <main className="co-col cl-scroll" style={{ minWidth: 0, overflowY: 'auto', gap: 16, paddingBottom: 24 }}>
          <PromptText text={prompt.text} style={{ flexShrink: 0, background: '#fff' }} />
          {chains.map((c, i) => (
            <BodyCard key={c.id} prompt={prompt} chain={c} num={i + 1} canDelete={chains.length > 1}
              onChange={update} onDelete={() => remove(c.id)}
              check={checks[c.id] || null} onCheck={(r) => { setCheck(c.id, r); setFocus(c.id); setActive(null); }}
              focused={focus === c.id} onFocus={() => { if (focus !== c.id) { setFocus(c.id); setActive(null); } }}
              active={active} onPick={(k) => { setActive(k); }} />
          ))}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {prompt.questions.map((q) => (
              <button key={q.n} type="button" className="cl-btn cl-add" onClick={() => add(q.n)} style={{ ...miniBtn, height: 36, borderRadius: 10, border: '1px solid var(--color-border-button-default)', boxShadow: 'var(--shadow-xs)', padding: '0 12px', fontSize: 14, fontWeight: 500 }}>
                <ClIcon name="plus" size={11} />Thêm thân bài{multi ? ' · ' + CL_CIRC[q.n - 1] + ' ' + KIND_ASK[kindOf(prompt, { q: q.n } as Chain)].chip.toLowerCase() : ''}
              </button>
            ))}
          </div>
        </main>
        }
        side={
          <>
            <SidePanel on={chat} grow={2}>
              <TranslatorChat onClose={() => setChat(false)} />
            </SidePanel>
          </>
        }
      />
    </div>
  );
}
