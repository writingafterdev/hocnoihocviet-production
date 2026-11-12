'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Illustration } from '@/components/brand/Illustration';
import { setSfxEnabled, sfx, sfxEnabled } from '@/lib/sfx';
import { WorkspaceHeader } from '@/components/shell/BrandHeader';
import { findPrompt } from '@/content/prompts';
import { KIND_LABEL, sentenceParts, plainSentence, STATEMENTS, type Statement, type StatementKind } from '@/content/statements';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { SignedOutError } from '../attempts/store';
import { startFromStatement } from '../attempts/start';
import { CL } from '../chainlab/constants';
import { backLinkStyle, ClIcon, ClLabel, toolbarBtn } from '../chainlab/ui/primitives';
import { ChainEditor } from '../coach/ChainEditor';
import { CoachGrid, SidePanel, useLast } from '../coach/CoachGrid';
import { NotesPanel } from '../coach/NotesPanel';
import { TranslatorChat } from '../coach/TranslatorChat';
import { askVocabBank, useCoach } from '../coach/useCoach';
import { primaryBtn } from '../coach/ui';
import { Chip } from '@/components/base/badges/chip';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { AiStatus } from '@/components/ui/ai-status';
import { ProBeam } from '@/components/ui/pro-beam';

const shuffle = <T,>(xs: T[]) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/** A brand drawing for each kind of statement: why (a question), what it does (charts), what to do (brainstorm). */
const DRAWING: Record<string, string> = { cause: 'man-sitting-on-question-mark-and-thinking', impact: 'hands-holding-different-charts', solution: 'woman-brainstorming-and-choosing-ideas' };
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ROLL_MS = 1900;

export function kindChip(s: Pick<Statement, 'kind' | 'tone'>) {
  if (s.kind === 'cause') return { label: KIND_LABEL.cause, bg: '#FFF0EB', fg: '#B33A1A' };
  if (s.kind === 'solution') return { label: KIND_LABEL.solution, bg: '#E4F5FA', fg: '#17667A' };
  return s.tone === 'cost' ? { label: 'Tác động · hại', bg: CL.redSoft, fg: CL.redText } : { label: 'Tác động · lợi', bg: CL.mintSoft, fg: CL.greenText };
}

const sentenceStyle: React.CSSProperties = { margin: 0, fontFamily: CL.serif, fontSize: 21, lineHeight: 1.5, color: CL.ink };

/** Highlights in the statement: the starting point, the stakeholder and the ending point, swept in in reading order. */
const MARK = {
  start: { title: 'Điểm đầu', fg: CL.greenText, bg: CL.mintSoft, delay: '.15s' },
  who: { title: 'Stakeholder', fg: '#17667A', bg: '#E4F5FA', delay: '.45s' },
  end: { title: 'Điểm cuối', fg: '#B33A1A', bg: CL.yellowSoft, delay: '.75s' },
} as const;

/** The statement with its start (mint), stakeholder (sky) and end (yellow) highlighted; `still` skips the highlighter sweep. */
function Sentence({ s, still }: { s: Statement; still?: boolean }) {
  return (
    <>
      {sentenceParts(s.sentence).map((part, k) => {
        if (!part.mark) return <span key={k}>{part.text}</span>;
        const m = MARK[part.mark];
        return <span key={k} title={m.title} className={'co-hl' + (still ? ' still' : '')} style={{ color: m.fg, backgroundImage: 'linear-gradient(' + m.bg + ',' + m.bg + ')', ['--d' as string]: m.delay }}>{part.text}</span>;
      })}
    </>
  );
}

const KINDS: { kind: StatementKind; note: string; bg: string }[] = [
  { kind: 'cause', note: 'Vì sao chuyện này xảy ra?', bg: 'bg-tomato-soft' },
  { kind: 'impact', note: 'Nó ảnh hưởng ai, và ra sao?', bg: 'bg-blue-soft' },
  { kind: 'solution', note: 'Làm gì để giải quyết?', bg: 'bg-leaf-soft' },
];
const TONES: { tone: 'benefit' | 'cost' | undefined; label: string }[] = [{ tone: 'benefit', label: 'Có lợi' }, { tone: 'cost', label: 'Có hại' }, { tone: undefined, label: 'Cả hai' }];
const chipBtn = 'cursor-pointer rounded-lg border-0 bg-paper-2 px-4 py-2 text-[13px] font-medium text-ink shadow-none transition-colors hover:bg-blue-soft hover:text-blue-deep';

/** Step one: which kind of claim to prove. Impact asks one more question (good or bad); then the reel spins. */
function KindPicker({ onPick }: { onPick: (kind?: StatementKind, tone?: 'benefit' | 'cost') => void }) {
  const [impact, setImpact] = useState(false);
  return (
    <div className="co-rise flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-8">
      <div className="grid w-full max-w-[720px] grid-cols-3 gap-3 sm:gap-4">
        {KINDS.map((k) => (
          <button key={k.kind} type="button" onClick={() => (k.kind === 'impact' ? setImpact(true) : onPick(k.kind))}
            className={cn('group m-0 flex w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border-0 bg-white p-0 text-left shadow-ring hover:shadow-ring-hover focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--brand-blue-deep)]', impact && k.kind === 'impact' && 'shadow-[0_0_0_2px_var(--brand-blue-deep)]')}>
            <div className={cn('grid h-28 place-items-center', k.bg)}><Illustration name={DRAWING[k.kind]} className="h-24 w-auto" /></div>
            <div className="flex flex-col gap-1 px-4 pb-4 pt-3">
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{KIND_LABEL[k.kind]}</span>
              <span className="text-[13px] leading-snug text-ink-soft">{k.note}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="flex min-h-9 items-center gap-2">
        {impact
          ? <>{TONES.map((t) => <button key={t.label} type="button" onClick={() => onPick('impact', t.tone)} className={cn(chipBtn, 'co-rise')}>{t.label}</button>)}</>
          : <button type="button" onClick={() => onPick()} className={chipBtn}>Ngẫu nhiên</button>}
      </div>
    </div>
  );
}

interface Reel { items: string[]; target: Statement; startH: number; endH: number; h: number; settled: boolean }

/**
 * "Chứng minh nhanh": a random ready-made statement with its two ends given; the student writes the middle,
 * checks it, then moves on. "Đổi câu" / "Câu tiếp" spin the statement like a reel and land on another one.
 * Nothing is saved; the counter is for this visit only.
 */
export function ProveDrill() {
  const router = useRouter();
  const [deck, setDeck] = useState<Statement[] | null>(null);
  const [i, setI] = useState(0);
  const [done, setDone] = useState(0);
  const [steps, setSteps] = useState<string[]>(['']);
  const [active, setActive] = useState<number | null>(null);
  const [chat, setChat] = useState(true);
  const [notesOpen, setNotesOpen] = useState(true);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState('');
  const [reel, setReel] = useState<Reel | null>(null);
  const [landed, setLanded] = useState(0);
  const [promptOut, setPromptOut] = useState(false);
  const sentenceRef = useRef<HTMLParagraphElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);

  // The deck is shuffled when a kind is picked (in the browser only), so server and client renders agree.
  const s = deck && deck.length ? deck[i % deck.length] : null;
  const prompt = s ? findPrompt(s.promptId) : null;
  const coach = useCoach(s?.promptId || '', { kind: s?.kind || 'impact', tone: s?.tone || null, start: s?.start || '', end: s?.end || '', steps, sentence: s ? plainSentence(s.sentence) : '', stakeholder: s?.stakeholder });
  const rolling = !!reel;
  const focusStep = useRef(0);
  /** The translator panel can suggest English phrases for this chain; a tap adds one to the step being edited. */
  const vocab = {
    key: s ? s.id : '',
    ask: () => askVocabBank(s?.promptId || '', { kind: s?.kind || 'impact', tone: s?.tone || null, start: s?.start || '', end: s?.end || '', steps: [], stakeholder: s?.stakeholder }),
    onPick: (en: string) => {
      const i = Math.min(focusStep.current, steps.length - 1);
      setSteps(steps.map((x, j) => (j === i ? (x.trim() ? x.replace(/\s+$/, '') + ' ' : '') + en : x)));
    },
    used: (en: string) => steps.join(' ').toLowerCase().includes(en),
  };
  useEffect(() => { if (coach.error) toast.error(coach.error); }, [coach.error]);
  useEffect(() => { if (openError) toast.error(openError); }, [openError]);

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
  }, [coach.result]); // eslint-disable-line react-hooks/exhaustive-deps

  const land = (k: number) => {
    setI(k); setSteps(['']); setActive(null); setNotesOpen(true); setOpenError(''); setReel(null); setPromptOut(false); setLanded((n) => n + 1);
    sfx.pop();
    coach.reset();
  };

  /** Step one done: build a shuffled deck of the chosen kind and spin the reel onto its first statement. */
  const choose = (kind?: StatementKind, tone?: 'benefit' | 'cost') => {
    if (rolling) return;
    const pool = shuffle(STATEMENTS.filter((x) => (!kind || x.kind === kind) && (!tone || x.tone === tone)));
    const target = pool[0];
    setDeck(pool); setI(0); setSteps(['']); setActive(null); setNotesOpen(true); setOpenError(''); coach.reset();
    sfx.roll(ROLL_MS);
    if (reducedMotion()) { setLanded((n) => n + 1); return; }
    const others = shuffle(STATEMENTS.filter((x) => x.id !== target.id)).slice(0, 8).map((x) => plainSentence(x.sentence));
    setReel({ items: others, target, startH: 0, endH: 0, h: 64, settled: false });
    setPromptOut(true);
    setTimeout(() => setReel((r) => (r ? { ...r, settled: true } : r)), ROLL_MS * 0.72);
    setTimeout(() => setPromptOut(false), ROLL_MS);
    setTimeout(() => land(0), ROLL_MS + 250);
  };
  const backToPick = () => { if (rolling) return; setDeck(null); setI(0); setSteps(['']); setActive(null); setOpenError(''); coach.reset(); };

  /** Spin to the next statement: other statements slide past, slow down, and the new one eases into place. */
  const go = (counted: boolean) => {
    if (!deck || !s || rolling) return;
    if (counted && coach.result) setDone((d) => d + 1);
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

  const check = () => { setActive(null); setNotesOpen(true); coach.runCheck(); };
  const writeEssay = () => {
    if (!s || !prompt || opening) return;
    setOpening(true); setOpenError('');
    startFromStatement(prompt, s, steps).then((url) => router.push(url), (e) => {
      setOpening(false);
      if (e instanceof SignedOutError) router.replace('/login?next=/prove'); else setOpenError('Chưa tạo được bài. Thử lại nhé.');
    });
  };

  const checked = !!coach.result;
  const notes = coach.fresh && coach.result ? coach.result.placed : [];
  const clean = coach.fresh && !!coach.result && coach.result.placed.length === 0;
  const chip = s ? kindChip(s) : null;
  const notesOn = (checked && notesOpen) || coach.checking;
  const shownResult = useLast(coach.result);
  const helper = coach.checking ? 'Đang kiểm tra…' : coach.fresh ? (coach.result?.placed.length ? coach.result.placed.length + ' nhận xét ở bên phải.' : 'Mạch đi liền.') : checked ? 'Bạn đã sửa mạch, kiểm tra lại để xem nhận xét mới.' : '';

  return (
    <div style={{ height: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <WorkspaceHeader />
      <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 1560, margin: '0 auto', padding: '24px 32px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, minHeight: 42, paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Link href="/home" className="cl-link" style={backLinkStyle}><ClIcon name="left" size={14} />Trang chủ</Link>
            <Chip variant="subtle" color="blue">Chứng minh nhanh</Chip>
            <span style={{ width: 1, height: 18, background: CL.ink2 }} />
            <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5 }}>Đã chứng minh <AnimatedCounter value={done} className="ml-1 text-[15px] font-bold text-ink" /></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {s && <button type="button" className="cl-btn" onClick={backToPick} disabled={rolling} style={{ ...toolbarBtn(false), opacity: rolling ? 0.5 : 1 }}>Đổi loại</button>}
            <button type="button" className="cl-btn" onClick={() => go(false)} disabled={rolling || !s} style={{ ...toolbarBtn(false), opacity: rolling || !s ? 0.5 : 1 }}><span className={'co-dice' + (rolling ? ' on' : '')} aria-hidden="true">⟳</span> Đổi câu</button>
            <button type="button" className="cl-btn" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? 'Tắt âm thanh' : 'Bật âm thanh'} title={sound ? 'Tắt âm thanh' : 'Bật âm thanh'} style={{ ...toolbarBtn(false), width: 36, padding: 0, color: sound ? CL.ink7 : CL.ink4 }}>{sound ? <Volume2 size={16} strokeWidth={1.75} /> : <VolumeX size={16} strokeWidth={1.75} />}</button>
            <button type="button" className="cl-btn" onClick={() => setChat(!chat)} aria-pressed={chat} style={toolbarBtn(chat)}>Dịch</button>
            {!checked ? (
              <ProBeam><button type="button" className="cl-btn cl-primary" onClick={check} disabled={!coach.filled || coach.checking || rolling} style={{ ...primaryBtn, opacity: coach.filled && !coach.checking && !rolling ? 1 : 0.35 }}>{coach.checking ? 'Đang kiểm tra…' : 'Kiểm tra'}</button></ProBeam>
            ) : (
              <>
                <button type="button" className="cl-btn" onClick={check} disabled={coach.fresh || coach.checking || !coach.filled} style={{ ...toolbarBtn(false), color: CL.ink, opacity: coach.fresh || coach.checking ? 0.4 : 1 }}>{coach.checking ? 'Đang kiểm tra…' : 'Kiểm tra lại'}</button>
                <button type="button" className="cl-btn cl-primary" onClick={() => go(true)} disabled={rolling} style={primaryBtn}>Câu tiếp<ClIcon name="right" size={13} /></button>
              </>
            )}
          </div>
        </div>

        <CoachGrid
          open={chat || notesOn}
          main={
            <main className="co-col" style={{ minWidth: 0 }}>
              <section style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
                {s && chip && prompt ? (
                  <>
                    <div className="relative pb-5 pl-[34px] pr-[34px] pt-[22px] xl:pr-[200px]" style={{ borderBottom: '1px solid ' + CL.ink1, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                      <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 12.5, fontStyle: 'italic', lineHeight: 1.6, color: CL.ink5, opacity: promptOut ? 0 : 1, transition: 'opacity .45s ease' }}>{reel && !promptOut ? findPrompt(reel.target.promptId)?.text : prompt.text}</p>
                    </div>
                    <div key={'b' + s.id} className={'cl-scroll' + (landed ? ' co-rise' : '')} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 32px 16px 34px', opacity: rolling ? 0 : 1, transform: rolling ? 'translateY(6px)' : 'none', transition: 'opacity .5s ease, transform .5s ease' }}>
                      <ChainEditor
                        start={s.start} end={s.end} startLabel="Điểm đầu · đề cho" endLabel="Điểm cuối · đề cho"
                        steps={steps} setSteps={setSteps}
                        notes={notes} active={active} onPick={(k) => { setActive(k); setNotesOpen(true); }}
                        hint={coach.hint} asking={coach.asking} onHint={coach.askHint} onCloseHint={coach.closeHint}
                        helper={helper} checking={coach.checking} clean={clean} onFocusStep={(k) => { focusStep.current = k; }}
                        firstQuestion={s.ask}
                      />
                    </div>
                    {clean && !rolling && (
                      <div className="co-rise" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 34px 14px' }}>
                        <Illustration name="person-with-archery-bow-hitting-bullseye" className="h-24 w-auto" />
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" className="co-pop"><circle cx="11" cy="11" r="11" fill="#2D881A" /><path className="co-tick" d="M6.5 11.5l3 3 6-6.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          <span style={{ fontFamily: CL.sans, fontSize: 14, fontWeight: 600, color: CL.ink }}>Mạch đi liền</span>
                        </span>
                      </div>
                    )}
                    {checked && !rolling && (
                      <div className="co-rise" style={{ borderTop: '1px solid ' + CL.ink1, background: CL.panel, padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        
                        <button type="button" className="cl-btn cl-add" onClick={writeEssay} disabled={opening} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 5, border: '1px solid ' + CL.ink, background: '#fff', color: CL.ink, padding: '6px 12px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600 }}>{opening ? 'Đang tạo bài…' : 'Viết cả bài cho đề này'}<ClIcon name="right" size={12} /></button>
                      </div>
                    )}
                  </>
                ) : (
                  <KindPicker onPick={choose} />
                )}
              </section>
            </main>
          }
          side={
            <>
              <SidePanel on={notesOn} grow={3}>
                {coach.checking || !shownResult
                  ? <section style={{ height: '100%', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}><ClLabel color={CL.ink}>Nhận xét</ClLabel><AiStatus state="analyzing" states={{ analyzing: { label: 'Đang đọc mạch', active: true } }} className="text-[13px]" /></section>
                  : <NotesPanel result={shownResult} fresh={coach.fresh} active={active} onPick={setActive} onClose={() => setNotesOpen(false)} />}
              </SidePanel>
              <SidePanel on={chat} grow={2} top={notesOn}>
                <TranslatorChat onClose={() => setChat(false)} vocab={s ? vocab : undefined} />
              </SidePanel>
            </>
          }
        />
      </div>
    </div>
  );
}
