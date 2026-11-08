'use client';

import { useState, type ReactNode } from 'react';
import type { Prompt } from '@/content/prompts';
import { CL, CL_CIRC } from '../chainlab/constants';
import type { Chain } from '../chainlab/types';
import { ClIcon, ClLabel, toolbarBtn } from '../chainlab/ui/primitives';
import { ChainEditor, miniBtn } from '../coach/ChainEditor';
import { CoachGrid, SidePanel, useLast } from '../coach/CoachGrid';
import { NotesPanel } from '../coach/NotesPanel';
import { TranslatorChat } from '../coach/TranslatorChat';
import { primaryBtn } from '../coach/ui';
import { useCoach, type CheckResult } from '../coach/useCoach';
import { chainIn, endOf, hasTone, KIND_ASK, kindOf, middleOf, newBody, questionOf, startOf, withEnds, withMiddle } from './model';

export interface BuildProps {
  prompt: Prompt;
  chains: Chain[];
  setChains: (fn: (cs: Chain[]) => Chain[]) => void;
  checks: Record<string, CheckResult>;
  setCheck: (id: string, r: CheckResult | null) => void;
  toolbarLeft: ReactNode;
  onNext: () => void;
}

const arrow = (
  <svg aria-hidden="true" viewBox="0 0 36 12" style={{ width: 36, height: 12, alignSelf: 'center', overflow: 'visible' }}>
    <line x1="1" y1="6" x2="29" y2="6" stroke={CL.ink6} strokeWidth="1.5" />
    <path d="M27 1.5 L35 6 L27 10.5 Z" fill={CL.ink6} />
  </svg>
);

const box = (dashed: boolean, filled: boolean): React.CSSProperties => ({
  minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', borderRadius: 12,
  ...(dashed ? { border: '1.5px dashed ' + (filled ? CL.ink5 : CL.ink3), background: '#fff' } : { border: '1px solid ' + CL.ink1, background: CL.panel }),
});

const fieldStyle: React.CSSProperties = { display: 'block', width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', padding: 0, fontFamily: CL.serif, fontSize: 15, lineHeight: 1.55, color: CL.ink8 };

/** One body paragraph's chain: two boxes until built, then the line with its middle. */
function BodyCard({ prompt, chain, num, canDelete, onChange, onDelete, check, onCheck, focused, onFocus, active, onPick }: {
  prompt: Prompt; chain: Chain; num: number; canDelete: boolean; onChange: (c: Chain) => void; onDelete: () => void;
  check: CheckResult | null; onCheck: (r: CheckResult | null) => void; focused: boolean; onFocus: () => void; active: number | null; onPick: (k: number | null) => void;
}) {
  const kind = kindOf(prompt, chain), q = questionOf(prompt, chain), info = KIND_ASK[kind];
  const coach = useCoach(prompt.id, chainIn(prompt, chain), check, onCheck);
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
  const tone = hasTone(prompt, chain);

  const endBox = (which: 'start' | 'end') => {
    const isMine = which === mine;
    const value = which === 'start' ? start : end;
    return (
      <div style={box(isMine, !!value.trim())}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClLabel color={isMine ? CL.ink : CL.ink5}>{which === 'start' ? 'Điểm đầu' : 'Điểm cuối'}{isMine ? ' · bạn viết' : ''}</ClLabel>
          {!isMine && <span style={{ borderRadius: 5, padding: '2px 6px', background: '#E4F5FA', color: '#17667A', fontFamily: CL.sans, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Gợi ý từ đề</span>}
        </span>
        <textarea className="co-ta" value={value} rows={1} autoFocus={isMine && !value} aria-label={which === 'start' ? 'Điểm đầu' : 'Điểm cuối'} placeholder={isMine ? info.ph : ''}
          onChange={(e) => setEnd(which, e.target.value)} onFocus={onFocus}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); build(); } }}
          style={fieldStyle} />
      </div>
    );
  };

  return (
    <section onFocusCapture={onFocus} style={{ flexShrink: 0, borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 56, padding: '0 14px 0 22px', borderBottom: '1px solid ' + CL.ink1 }}>
        <span style={{ fontFamily: CL.sans, fontSize: 14.5, fontWeight: 600, color: CL.ink }}>Thân bài {num}</span>
        <span style={{ borderRadius: 999, background: '#F1F1EE', color: CL.ink7, padding: '4px 12px', fontFamily: CL.sans, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{multi ? CL_CIRC[q.n - 1] + ' ' : ''}{info.chip}</span>
        {tone && (
          <button type="button" className="cl-btn" onClick={() => onChange({ ...chain, tone: chain.tone === 'cost' ? 'benefit' : 'cost' })} title="Đổi lợi ích / tác hại"
            style={{ borderRadius: 999, padding: '4px 12px', background: chain.tone === 'cost' ? CL.redSoft : CL.mintSoft, color: chain.tone === 'cost' ? CL.redText : CL.greenText, fontFamily: CL.sans, fontSize: 11.5, fontWeight: 600 }}>{chain.tone === 'cost' ? 'Tác hại' : 'Lợi ích'} ⇄</button>
        )}
        <span style={{ marginLeft: 'auto', borderRadius: 5, padding: '3px 8px', background: chain.built && filled ? CL.mintSoft : '#F1F1EE', color: chain.built && filled ? CL.greenText : CL.ink6, fontFamily: CL.sans, fontSize: 11, fontWeight: 600 }}>{status}</span>
        {canDelete && <button type="button" className="cl-btn cl-del" onClick={onDelete} aria-label={'Xoá thân bài ' + num} style={{ width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: CL.ink3 }}><ClIcon name="trash" size={14} /></button>}
      </div>

      {!chain.built ? (
        <>
          <div style={{ padding: '20px 24px 18px' }}>
            <p style={{ margin: '0 0 14px', fontFamily: CL.sans, fontSize: 14, lineHeight: 1.55, color: CL.ink7 }}>{info.ask}{q.q ? <span style={{ color: CL.ink4 }}> · {q.q}</span> : null}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 36px minmax(0,1fr)', alignItems: 'stretch' }}>
              {endBox('start')}
              {arrow}
              {endBox('end')}
            </div>
          </div>
          <div style={{ borderTop: '1px solid ' + CL.ink1, background: CL.panel, padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" className="cl-btn cl-primary" onClick={build} disabled={!ready} style={{ ...miniBtn, marginLeft: 'auto', border: 'none', background: CL.ink, color: '#fff', opacity: ready ? 1 : 0.3 }}>Dựng mạch ↵</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ padding: '18px 26px 12px 26px' }}>
            <ChainEditor
              start={start} end={end}
              startLabel={'Điểm đầu · ' + (mine === 'start' ? 'bạn viết' : 'gợi ý từ đề')}
              endLabel={'Điểm cuối · ' + (mine === 'end' ? 'bạn viết' : 'gợi ý từ đề')}
              steps={middle.length ? middle : ['']} setSteps={(m) => onChange(withMiddle(chain, m))}
              notes={notes} active={focused ? active : null} onPick={(k) => { onFocus(); onPick(k); }}
              hint={coach.hint} asking={coach.asking} onHint={coach.askHint} onCloseHint={coach.closeHint}
              helper={coach.error || (coach.checking ? 'Đang kiểm tra…' : '')}
              checking={coach.checking} clean={coach.fresh && !!coach.result && coach.result.placed.length === 0}
            />
          </div>
          <div style={{ borderTop: '1px solid ' + CL.ink1, background: CL.panel, padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="cl-btn cl-link" onClick={() => onChange({ ...chain, built: false })} style={{ ...miniBtn, border: 'none', background: 'transparent', color: CL.ink5 }}>Đổi hai đầu</button>
            {coach.result && !coach.fresh && <span style={{ fontFamily: CL.sans, fontSize: 11.5, color: CL.ink4 }}>Bạn đã sửa mạch sau lần kiểm tra trước.</span>}
            <button type="button" className="cl-btn cl-add" onClick={() => { onFocus(); onPick(null); coach.runCheck(); }} disabled={!filled || coach.checking || coach.fresh}
              style={{ ...miniBtn, marginLeft: 'auto', borderColor: CL.ink, color: CL.ink, opacity: !filled || coach.checking || coach.fresh ? 0.4 : 1 }}>{coach.checking ? 'Đang kiểm tra…' : coach.result ? 'Kiểm tra lại' : 'Kiểm tra mạch'}</button>
          </div>
        </>
      )}
    </section>
  );
}

/** ① Dựng mạch: the prompt, then one chain card per body paragraph. Right: the chosen chain's notes and the translator. */
export function BuildScreen({ prompt, chains, setChains, checks, setCheck, toolbarLeft, onNext }: BuildProps) {
  const [chat, setChat] = useState(true);
  const [focus, setFocus] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [notesOpen, setNotesOpen] = useState(true);
  const update = (c: Chain) => setChains((cs) => cs.map((x) => (x.id === c.id ? c : x)));
  const remove = (id: string) => setChains((cs) => cs.filter((x) => x.id !== id));
  const add = (n: number) => setChains((cs) => [...cs, newBody(prompt, prompt.questions.find((q) => q.n === n) || prompt.questions[0], cs)]);
  const focused = chains.find((c) => c.id === focus) || null;
  const shown = focused && checks[focused.id] ? focused : null;
  const shownCheck = shown ? checks[shown.id] : null;
  const fresh = !!shown && !!shownCheck && shownCheck.snap === JSON.stringify([startOf(shown), endOf(shown), middleOf(shown).map((s) => s.trim()).filter(Boolean)]);
  const notesOn = !!(shown && shownCheck && notesOpen);
  const lastCheck = useLast(notesOn ? shownCheck : null);
  const multi = prompt.questions.length > 1;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1710, margin: '0 auto', padding: '12px 40px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, minHeight: 42, paddingBottom: 12 }}>
        {toolbarLeft}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" className="cl-btn" onClick={() => setChat(!chat)} aria-pressed={chat} style={toolbarBtn(chat)}>Dịch</button>
          <button type="button" className="cl-btn cl-primary" onClick={onNext} style={primaryBtn}>Viết bài<ClIcon name="right" size={13} /></button>
        </div>
      </div>

      <CoachGrid
        open={chat || notesOn}
        main={
        <main className="co-col cl-scroll" style={{ minWidth: 0, overflowY: 'auto', gap: 16, paddingBottom: 24 }}>
          <section style={{ flexShrink: 0, borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between' }}><ClLabel>Writing Task 2</ClLabel><ClLabel>40 phút</ClLabel></span>
            <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 15, fontStyle: 'italic', lineHeight: 1.6, color: CL.ink8 }}>{prompt.text}</p>
          </section>
          {chains.map((c, i) => (
            <BodyCard key={c.id} prompt={prompt} chain={c} num={i + 1} canDelete={chains.length > 1}
              onChange={update} onDelete={() => remove(c.id)}
              check={checks[c.id] || null} onCheck={(r) => { setCheck(c.id, r); setFocus(c.id); setActive(null); setNotesOpen(true); }}
              focused={focus === c.id} onFocus={() => { if (focus !== c.id) { setFocus(c.id); setActive(null); } }}
              active={active} onPick={(k) => { setActive(k); setNotesOpen(true); }} />
          ))}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {prompt.questions.map((q) => (
              <button key={q.n} type="button" className="cl-btn cl-add" onClick={() => add(q.n)} style={{ ...miniBtn, borderStyle: 'dashed', padding: '7px 12px' }}>
                <ClIcon name="plus" size={11} />Thêm thân bài{multi ? ' · ' + CL_CIRC[q.n - 1] + ' ' + KIND_ASK[kindOf(prompt, { q: q.n } as Chain)].chip.toLowerCase() : ''}
              </button>
            ))}
          </div>
        </main>
        }
        side={
          <>
            <SidePanel on={notesOn} grow={3}>
              {lastCheck && <NotesPanel result={lastCheck} fresh={fresh} active={active} onPick={setActive} onClose={() => setNotesOpen(false)} />}
            </SidePanel>
            <SidePanel on={chat} grow={2} top={notesOn}>
              <TranslatorChat onClose={() => setChat(false)} />
            </SidePanel>
          </>
        }
      />
    </div>
  );
}
