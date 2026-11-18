'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Illustration } from '@/components/brand/Illustration';
import { setSfxEnabled, sfx, sfxEnabled } from '@/lib/sfx';
import { WorkspaceHeader } from '@/components/shell/BrandHeader';
import { findPrompt } from '@/content/prompts';
import { sentenceParts, plainSentence, STATEMENTS, type Statement } from '@/content/statements';
import { toast } from '@/components/ui/toast';
import { CL } from '../chainlab/constants';
import { ClIcon, ClLabel, toolbarBtn } from '../chainlab/ui/primitives';
import { ChainEditor } from '../coach/ChainEditor';
import { CoachGrid, SidePanel } from '../coach/CoachGrid';
import { TranslatorChat } from '../coach/TranslatorChat';
import { useCoach } from '../coach/useCoach';
import { DrillParagraph, type ParagraphDraft } from './DrillParagraph';
import { kindChip } from './kind';
import { EMPTY_VIEW, StatementLibrary, type LibraryView } from './StatementLibrary';
import { useStepHelp } from './StepHelp';
import { SampleChain } from './SampleChain';
import { primaryBtn } from '../coach/ui';
import { ProBeam } from '@/components/ui/pro-beam';
import { ENDS } from '../coach/ends';

const shuffle = <T,>(xs: T[]) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/** A brand drawing for each kind of statement: why (a question), what it does (charts), what to do (brainstorm). */
const DRAWING: Record<string, string> = { cause: 'man-sitting-on-question-mark-and-thinking', impact: 'hands-holding-different-charts', solution: 'woman-brainstorming-and-choosing-ideas' };
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ROLL_MS = 1900;


const sentenceStyle: React.CSSProperties = { margin: 0, fontFamily: CL.serif, fontSize: 21, lineHeight: 1.5, color: CL.ink };

/** Highlights in the statement: the starting point, the stakeholder and the ending point, swept in in reading order. */
const MARK = {
  start: { fg: CL.greenText, bg: CL.mintSoft, delay: '.15s' },
  who: { fg: '#17667A', bg: '#E4F5FA', delay: '.45s' },
  end: { fg: '#B33A1A', bg: CL.yellowSoft, delay: '.75s' },
} as const;

/** The statement with its start (mint), stakeholder (sky) and end (yellow) highlighted; `still` skips the highlighter sweep. */
/** The statement card keeps one height (room for a three-line statement and two lines of the prompt) so the mạch ý below never jumps. */
const STATEMENT_H = 244;

/** The IELTS prompt under the statement: two lines, with Xem thêm / Thu gọn only when it is longer than that. */
function PromptLine({ text, open, setOpen, hidden }: { text: string; open: boolean; setOpen: (v: boolean) => void; hidden: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [long, setLong] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setLong(open || el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, [text, open]);
  return (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, opacity: hidden ? 0 : 1, transition: 'opacity .45s ease' }}>
      <p ref={ref} style={{ margin: 0, fontFamily: CL.sans, fontSize: 12.5, fontStyle: 'italic', lineHeight: 1.6, color: CL.ink5, ...(open ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }) }}>{text}</p>
      {long && <button type="button" className="cl-btn cl-link" aria-expanded={open} onClick={() => setOpen(!open)} style={{ fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: CL.ink5, padding: 0 }}>{open ? 'Thu gọn' : 'Xem thêm'}</button>}
    </span>
  );
}

function Sentence({ s, still }: { s: Statement; still?: boolean }) {
  return (
    <>
      {sentenceParts(s.sentence).map((part, k) => {
        if (!part.mark) return <span key={k}>{part.text}</span>;
        const m = MARK[part.mark];
        const title = part.mark === 'who' ? 'Nhóm người' : ENDS[s.kind][part.mark];
        return <span key={k} title={title} className={'co-hl' + (still ? ' still' : '')} style={{ color: m.fg, ['--d' as string]: m.delay }}>{part.text}</span>;
      })}
    </>
  );
}

interface Reel { items: string[]; target: Statement; startH: number; endH: number; h: number; settled: boolean }

/**
 * "Chứng minh nhanh": a ready-made statement, picked in the library (or "Câu ngẫu nhiên"), with its two ends given; the
 * student writes the middle, checks it, then moves on. "Đổi câu" / "Câu tiếp" spin the statement like a reel and land on another one.
 * A statement whose mạch ý passes Kiểm tra is saved as finished (✓ in the library).
 */
export function ProveDrill() {
  const [deck, setDeck] = useState<Statement[] | null>(null);
  /** The library's filters and page, kept while a statement is open so "Thư viện" returns to the same list. */
  const [view, setView] = useState<LibraryView>(EMPTY_VIEW);
  /** Statements this student has finished (saved to their account): ✓ in the library. */
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    fetch('/api/drill/done', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null)).then((d: { ids?: string[] } | null) => { if (d?.ids) setDone(new Set(d.ids)); }).catch(() => {});
  }, []);
  const [i, setI] = useState(0);
  const [steps, setSteps] = useState<string[]>(['']);
  const [active, setActive] = useState<number | null>(null);
  const [chat, setChat] = useState(true);
  /** "Viết mạch ý này thành một đoạn văn": the paragraph screen, written alone or guided. */
  const [para, setPara] = useState<'free' | 'guided' | null>(null);
  /** Paragraphs in progress, per statement, chain and way of writing: going back to the chain and returning resumes them. */
  const drafts = useRef(new Map<string, ParagraphDraft>());
  const [reel, setReel] = useState<Reel | null>(null);
  const [landed, setLanded] = useState(0);
  const [promptOut, setPromptOut] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const sentenceRef = useRef<HTMLParagraphElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);

  // The deck is shuffled when a kind is picked (in the browser only), so server and client renders agree.
  const s = deck && deck.length ? deck[i % deck.length] : null;
  const prompt = s ? findPrompt(s.promptId) : null;
  const coach = useCoach(s?.promptId || '', { kind: s?.kind || 'impact', tone: s?.tone || null, start: s?.start || '', end: s?.end || '', steps, sentence: s ? plainSentence(s.sentence) : '', stakeholder: s?.stakeholder });
  const rolling = !!reel;
  /** Per-step help: vocabulary when asked, then a rewording panel and the next question after each Enter. */
  const help = useStepHelp(s?.promptId || '', { kind: s?.kind || 'impact', tone: s?.tone || null, start: s?.start || '', end: s?.end || '', stakeholder: s?.stakeholder }, steps, s?.ask || '', 2);
  /** The sample chain beside the notes: "Sửa chuỗi" (or any edit) hides its edited and added steps; "Hiện các bước mẫu" peeks. */
  const [fixMode, setFixMode] = useState(false);
  const [peek, setPeek] = useState(false);
  useEffect(() => { setFixMode(false); setPeek(false); }, [coach.result?.snap]);
  useEffect(() => { if (coach.error) toast.error(coach.error); }, [coach.error]);

  // Sounds: on by default, muted with the speaker button (remembered).
  const [sound, setSound] = useState(true);
  useEffect(() => { setSound(sfxEnabled()); }, []);
  const toggleSound = () => { const on = !sound; setSound(on); setSfxEnabled(on); if (on) sfx.pop(); };
  const prevSteps = useRef(steps.length);
  useEffect(() => { if (steps.length > prevSteps.current) sfx.pop(); prevSteps.current = steps.length; }, [steps.length]);
  const shownHint = useRef(false);
  useEffect(() => { if (coach.hint && !shownHint.current) sfx.tick(); shownHint.current = !!coach.hint; }, [coach.hint]);
  useEffect(() => {
    if (!coach.result || !coach.fresh) return;
    if (coach.result.placed.length === 0) sfx.success(); else sfx.note();
    // Notes came with a sample chain: it takes the side panel (the translator stays one click away).
    if (coach.result.sample?.length) setChat(false);
  }, [coach.result?.snap]); // eslint-disable-line react-hooks/exhaustive-deps
  // Every note fixed on Enter: the chain is clean now.
  useEffect(() => { if (coach.allFixed) sfx.success(); }, [coach.allFixed]);

  const land = (k: number) => {
    setI(k); setSteps(['']); setActive(null); setReel(null); setPara(null); setPromptOut(false); setPromptOpen(false); setLanded((n) => n + 1);
    sfx.pop();
    coach.reset();
  };

  /** "Câu ngẫu nhiên" in the library: shuffle the filtered statements and spin the reel onto the first. */
  const choose = (filtered: Statement[]) => {
    if (rolling || !filtered.length) return;
    const pool = shuffle(filtered);
    const target = pool[0];
    setDeck(pool); setI(0); setSteps(['']); setActive(null); coach.reset();
    sfx.roll(ROLL_MS);
    if (reducedMotion()) { setLanded((n) => n + 1); return; }
    const others = shuffle(STATEMENTS.filter((x) => x.id !== target.id)).slice(0, 8).map((x) => plainSentence(x.sentence));
    setReel({ items: others, target, startH: 0, endH: 0, h: 64, settled: false });
    setPromptOut(true);
    setTimeout(() => setReel((r) => (r ? { ...r, settled: true } : r)), ROLL_MS * 0.72);
    setTimeout(() => setPromptOut(false), ROLL_MS);
    setTimeout(() => land(0), ROLL_MS + 250);
  };
  /** A statement picked in the library: it opens at once; "Câu tiếp" then goes through the rest of the filtered list. */
  const open = (target: Statement, filtered: Statement[]) => {
    if (rolling) return;
    setDeck([target, ...shuffle(filtered.filter((x) => x.id !== target.id))]);
    land(0);
  };
  const backToPick = () => { if (rolling) return; setDeck(null); setI(0); setSteps(['']); setActive(null); coach.reset(); };

  /** Spin to the next statement: other statements slide past, slow down, and the new one eases into place. */
  /** "Câu tiếp" on the paragraph screen: back to the drill, then spin to the next statement once it's on screen. */
  const nextAfter = useRef(false);
  useEffect(() => { if (!para && nextAfter.current) { nextAfter.current = false; go(); } }, [para]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = () => {
    if (!deck || !s || rolling) return;
    const k = i + 1, target = deck[k % deck.length];
    coach.reset(); setActive(null);
    sfx.roll(ROLL_MS);
    const el = sentenceRef.current;
    if (!el || reducedMotion()) { land(k); return; }
    const startH = el.getBoundingClientRect().height;
    // Measure the new sentence at the same width, so the window eases to its height before the swap.
    const probe = el.cloneNode(false) as HTMLElement;
    probe.style.cssText += ';position:absolute;visibility:hidden;width:' + el.getBoundingClientRect().width + 'px';
    probe.innerHTML = sentenceParts(target.sentence).map((x) => (x.mark ? '<span style="padding:0 4px">' : '<span>') + x.text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string)) + '</span>').join('');
    el.parentElement!.appendChild(probe);
    const endH = probe.getBoundingClientRect().height;
    probe.remove();
    const others = shuffle(STATEMENTS.filter((x) => x.id !== target.id && x.id !== s!.id)).slice(0, 7).map((x) => plainSentence(x.sentence));
    setReel({ items: [plainSentence(s!.sentence), ...others], target, startH, endH, h: Math.max(startH, endH), settled: false });
    setPromptOut(true);
    setTimeout(() => setReel((r) => (r ? { ...r, settled: true } : r)), ROLL_MS * 0.72);
    setTimeout(() => setPromptOut(false), ROLL_MS);
    setTimeout(() => land(k), ROLL_MS + 250);
  };

  // Run the reel once it is on screen: one continuous curve that speeds up, glides and eases into place.
  useLayoutEffect(() => {
    const el = reelRef.current;
    if (!reel || !el || reel.settled) return;
    // First spin (from the picker) has no sentence on screen yet: measure the target's height, then run.
    if (!reel.endH) { const eh = (el.lastElementChild as HTMLElement).getBoundingClientRect().height; setReel((r) => (r ? { ...r, startH: eh, endH: eh, h: eh } : r)); return; }
    const dist = reel.h * reel.items.length;
    const a = el.animate([
      { transform: 'translateY(0)', filter: 'blur(0px)' },
      { transform: 'translateY(' + -dist * 0.18 + 'px)', filter: 'blur(1.2px)', offset: 0.25 },
      { transform: 'translateY(' + -dist * 0.82 + 'px)', filter: 'blur(0.8px)', offset: 0.7 },
      { transform: 'translateY(' + -dist + 'px)', filter: 'blur(0px)' },
    ], { duration: ROLL_MS, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    return () => { if (!reelRef.current) a.cancel(); };
  }, [reel?.target.id, reel?.endH]); // eslint-disable-line react-hooks/exhaustive-deps

  const check = () => { setActive(null); coach.runCheck(); };

  const checked = !!coach.result;
  const notes = coach.fresh && coach.result ? coach.result.placed : [];
  const clean = !!coach.result && ((coach.fresh && coach.result.placed.length === 0) || coach.allFixed);
  const showSample = !!coach.result?.sample?.length && !coach.allFixed && !rolling && !!s;
  // Its mạch ý passed Kiểm tra (no notes, or every note fixed): the statement counts as finished, once.
  useEffect(() => {
    if (!clean || !s || done.has(s.id)) return;
    const id = s.id;
    setDone((d) => new Set(d).add(id));
    fetch('/api/drill/done', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ statementId: id }) }).catch(() => {});
  }, [clean, s?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const chip = s ? kindChip(s) : null;

  return (
    <div style={{ height: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <WorkspaceHeader />
      <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 1560, margin: '0 auto', padding: '24px 32px 24px', display: 'flex', flexDirection: 'column' }}>
        {!deck ? <StatementLibrary view={view} setView={setView} done={done} onOpen={open} onRandom={choose} /> : para && s && prompt ? <DrillParagraph key={s.id + para} s={s} prompt={prompt} steps={steps} guided={para === 'guided'} onBack={() => setPara(null)} onNext={() => { nextAfter.current = true; setPara(null); }}
          saved={drafts.current.get([s.id, para, ...steps.map((x) => x.trim()).filter(Boolean)].join('|'))}
          onSave={(d) => drafts.current.set([s.id, para, ...steps.map((x) => x.trim()).filter(Boolean)].join('|'), d)} /> : <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, minHeight: 42, paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {s && <button type="button" className="cl-btn" onClick={backToPick} disabled={rolling} style={{ ...toolbarBtn(false), opacity: rolling ? 0.5 : 1 }}>Thư viện</button>}
            <button type="button" className="cl-btn" onClick={() => go()} disabled={rolling || !s} style={{ ...toolbarBtn(false), opacity: rolling || !s ? 0.5 : 1 }}><span className={'co-dice' + (rolling ? ' on' : '')} aria-hidden="true">⟳</span> Đổi câu</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="cl-btn" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? 'Tắt âm thanh' : 'Bật âm thanh'} title={sound ? 'Tắt âm thanh' : 'Bật âm thanh'} style={{ ...toolbarBtn(false), width: 36, padding: 0, color: sound ? CL.ink7 : CL.ink4 }}>{sound ? <Volume2 size={16} strokeWidth={1.75} /> : <VolumeX size={16} strokeWidth={1.75} />}</button>
            <button type="button" className="cl-btn" onClick={() => setChat(!chat)} aria-pressed={chat} style={toolbarBtn(chat)}>Dịch</button>
            {!checked ? (
              <ProBeam><button type="button" className="cl-btn cl-primary" onClick={check} disabled={!coach.filled || coach.checking || rolling} style={{ ...primaryBtn, opacity: coach.filled && !coach.checking && !rolling ? 1 : 0.35 }}>{coach.checking ? 'Đang kiểm tra…' : 'Kiểm tra'}</button></ProBeam>
            ) : (
              <>
                <button type="button" className="cl-btn" onClick={check} disabled={coach.fresh || coach.checking || !coach.filled} style={{ ...toolbarBtn(false), color: CL.ink, opacity: coach.fresh || coach.checking ? 0.4 : 1 }}>{coach.checking ? 'Đang kiểm tra…' : 'Kiểm tra lại'}</button>
                <button type="button" className="cl-btn cl-primary" onClick={() => go()} disabled={rolling} style={primaryBtn}>Câu tiếp<ClIcon name="right" size={13} /></button>
              </>
            )}
          </div>
        </div>

        <CoachGrid
          open={chat || showSample}
          main={
            <main className="co-col" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {s && chip && prompt ? (
                  <>
                    {/* The statement: its own card, always the same height; the full IELTS prompt opens on demand. */}
                    <section key={'st' + s.id} className="relative pb-5 pl-[34px] pr-[34px] pt-[22px] xl:pr-[200px]" style={{ flexShrink: 0, boxSizing: 'border-box', height: promptOpen ? 'auto' : STATEMENT_H, minHeight: STATEMENT_H, overflow: 'hidden', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <Illustration key={'drawing-' + s.id} name={DRAWING[s.kind] || DRAWING.impact} className="co-rise pointer-events-none absolute bottom-3 right-6 top-3 hidden h-[calc(100%-24px)] w-[150px] xl:block" />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10, perspective: 400 }}>
                        <ClLabel>Chứng minh câu này</ClLabel>
                        <span key={s.id} className={landed ? 'co-flip' : ''} style={{ display: 'inline-block', borderRadius: 5, padding: '4px 8px', background: chip.bg, color: chip.fg, fontFamily: CL.sans, fontSize: 12, fontWeight: 500 }}>{chip.label}</span>
                      </span>
                      {reel ? (
                        <div className={'co-reel-win' + (reel.settled ? ' settled' : '')} style={{ height: reel.settled ? reel.endH : reel.startH }}>
                          <div ref={reelRef} style={{ display: 'flex', flexDirection: 'column', willChange: 'transform' }}>
                            {reel.items.map((t, k) => <p key={k} style={{ ...sentenceStyle, height: reel.h, overflow: 'hidden', color: CL.ink4 }}>{t}</p>)}
                            <p style={sentenceStyle}><Sentence s={reel.target} still /></p>
                          </div>
                        </div>
                      ) : (
                        <p key={s.id} ref={sentenceRef} style={sentenceStyle}><Sentence s={s} /></p>
                      )}
                      <PromptLine text={(reel && !promptOut ? findPrompt(reel.target.promptId)?.text : prompt.text) || ''} open={promptOpen} setOpen={setPromptOpen} hidden={promptOut} />
                    </section>
                    <section style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
                    <div key={'b' + s.id} className={'cl-scroll' + (landed ? ' co-rise' : '')} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 32px 16px 34px', opacity: rolling ? 0 : 1, transform: rolling ? 'translateY(6px)' : 'none', transition: 'opacity .5s ease, transform .5s ease' }}>
                      <ChainEditor
                        start={s.start} end={s.end} startLabel={ENDS[s.kind].start + ' · đề cho'} endLabel={ENDS[s.kind].end + ' · đề cho'}
                        steps={steps} setSteps={setSteps}
                        notes={notes} active={active} onPick={setActive}
                        hint={coach.hint} asking={coach.asking} onHint={coach.askHint} onCloseHint={coach.closeHint}
                        checking={coach.checking} clean={clean} hideHint
                        check={{ result: coach.result, fresh: coach.fresh, checking: coach.checking, busy: coach.noteBusy, miss: coach.noteMiss, onStepEnter: (k, now) => coach.checkStep(k, now) }}
                        blockPaste={help.isSamplePaste} onBlockedPaste={() => toast('Không dán được câu mẫu: hãy gõ lại bằng tay.')}
                        stepQuestion={help.stepQuestion} onSubmitStep={help.onSubmitStep} belowStep={help.belowStep}
                      />
                    </div>
                    {checked && !rolling && (
                      <div className="co-rise" style={{ borderTop: '1px solid ' + CL.ink1, background: CL.panel, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ marginRight: 'auto', fontFamily: CL.sans, fontSize: 14, fontWeight: 600, color: CL.ink }}>Viết mạch ý này thành một đoạn văn</span>
                        <button type="button" className="cl-btn" onClick={() => setPara('free')} style={toolbarBtn(false)}>Tự viết</button>
                        <ProBeam><button type="button" className="cl-btn cl-primary" onClick={() => setPara('guided')} style={primaryBtn}>Viết có hướng dẫn</button></ProBeam>
                      </div>
                    )}
                    </section>
                  </>
                ) : null}
            </main>
          }
          side={
            <>
              <SidePanel on={chat} grow={2}>
                <TranslatorChat onClose={() => setChat(false)} />
              </SidePanel>
              <SidePanel on={showSample && !chat} grow={2}>
                {showSample && s && <SampleChain start={s.start} end={s.end} steps={coach.result!.sample!} hiding={fixMode || !coach.fresh} peek={peek} onFix={() => setFixMode(true)} onPeek={() => setPeek(!peek)} />}
              </SidePanel>
            </>
          }
        />
        </>}
      </div>
    </div>
  );
}
