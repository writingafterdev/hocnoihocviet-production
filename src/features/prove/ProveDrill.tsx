'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { WorkspaceHeader } from '@/components/shell/BrandHeader';
import { findPrompt } from '@/content/prompts';
import { KIND_LABEL, sentenceParts, plainSentence, STATEMENTS, type Statement } from '@/content/statements';
import { SignedOutError } from '../attempts/store';
import { startFromStatement } from '../attempts/start';
import { CL } from '../chainlab/constants';
import { backLinkStyle, ClIcon, ClLabel, toolbarBtn } from '../chainlab/ui/primitives';
import { ChainEditor } from '../coach/ChainEditor';
import { CoachGrid, SidePanel, useLast } from '../coach/CoachGrid';
import { NotesPanel } from '../coach/NotesPanel';
import { TranslatorChat } from '../coach/TranslatorChat';
import { useCoach } from '../coach/useCoach';
import { primaryBtn } from '../coach/ui';

const shuffle = <T,>(xs: T[]) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ROLL_MS = 1900;

export function kindChip(s: Pick<Statement, 'kind' | 'tone'>) {
  if (s.kind === 'cause') return { label: KIND_LABEL.cause, bg: '#FFEEDA', fg: '#7B4D10' };
  if (s.kind === 'solution') return { label: KIND_LABEL.solution, bg: '#E4F5FA', fg: '#17667A' };
  return s.tone === 'cost' ? { label: 'Tác động · hại', bg: CL.redSoft, fg: CL.redText } : { label: 'Tác động · lợi', bg: CL.mintSoft, fg: CL.greenText };
}

const sentenceStyle: React.CSSProperties = { margin: 0, fontFamily: CL.serif, fontSize: 21, lineHeight: 1.5, color: CL.ink };

/** The statement with its start (mint) and stakeholder (sky) highlighted; `still` skips the highlighter sweep. */
function Sentence({ s, still }: { s: Statement; still?: boolean }) {
  return (
    <>
      {sentenceParts(s.sentence).map((part, k) => part.mark
        ? <span key={k} title={part.mark === 'start' ? 'Điểm đầu' : 'Stakeholder'} className={'co-hl' + (still ? ' still' : '')}
          style={{ color: part.mark === 'start' ? CL.greenText : '#17667A', backgroundImage: 'linear-gradient(' + (part.mark === 'start' ? CL.mintSoft : '#E4F5FA') + ',' + (part.mark === 'start' ? CL.mintSoft : '#E4F5FA') + ')', ['--d' as string]: part.mark === 'start' ? '.15s' : '.45s' }}>{part.text}</span>
        : <span key={k}>{part.text}</span>)}
    </>
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

  // Shuffled in the browser only, so the server render and the first client render agree.
  useEffect(() => { setDeck(shuffle(STATEMENTS)); }, []);
  const s = deck ? deck[i % deck.length] : null;
  const prompt = s ? findPrompt(s.promptId) : null;
  const coach = useCoach(s?.promptId || '', { kind: s?.kind || 'impact', tone: s?.tone || null, start: s?.start || '', end: s?.end || '', steps, sentence: s ? plainSentence(s.sentence) : '', stakeholder: s?.stakeholder });
  const rolling = !!reel;

  const land = (k: number) => {
    setI(k); setSteps(['']); setActive(null); setNotesOpen(true); setOpenError(''); setReel(null); setPromptOut(false); setLanded((n) => n + 1);
    coach.reset();
  };

  /** Spin to the next statement: other statements slide past, slow down, and the new one eases into place. */
  const go = (counted: boolean) => {
    if (!deck || rolling) return;
    if (counted && coach.result) setDone((d) => d + 1);
    const k = i + 1, target = deck[k % deck.length];
    coach.reset(); setActive(null);
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
    const others = shuffle(deck.filter((x) => x.id !== target.id && x.id !== s!.id)).slice(0, 7).map((x) => plainSentence(x.sentence));
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
    const dist = reel.h * reel.items.length;
    const a = el.animate([
      { transform: 'translateY(0)', filter: 'blur(0px)' },
      { transform: 'translateY(' + -dist * 0.18 + 'px)', filter: 'blur(1.2px)', offset: 0.25 },
      { transform: 'translateY(' + -dist * 0.82 + 'px)', filter: 'blur(0.8px)', offset: 0.7 },
      { transform: 'translateY(' + -dist + 'px)', filter: 'blur(0px)' },
    ], { duration: ROLL_MS, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    return () => { if (!reelRef.current) a.cancel(); };
  }, [reel?.target.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const helper = coach.checking ? 'Đang kiểm tra…' : coach.fresh ? (coach.result?.placed.length ? coach.result.placed.length + ' nhận xét ở bên phải. Sửa rồi bấm Kiểm tra lại.' : 'Mạch đi liền. Bấm Câu tiếp để sang câu khác.') : checked ? 'Bạn đã sửa mạch. Kiểm tra lại để xem nhận xét mới.' : coach.filled ? 'Từ điểm đầu đi tới điểm cuối, qua những người bị ảnh hưởng. Enter để thêm bước.' : 'Phần giữa đang trống. Bí thì bấm Gợi ý.';

  return (
    <div style={{ height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <WorkspaceHeader />
      <div style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 1710, margin: '0 auto', padding: '12px 40px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, minHeight: 42, paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Link href="/home" className="cl-link" style={backLinkStyle}><ClIcon name="left" size={14} />Trang chủ</Link>
            <span style={{ display: 'inline-flex', alignItems: 'center', minHeight: 30, borderRadius: 999, padding: '0 12px', background: CL.ink, color: '#fff', fontFamily: CL.sans, fontSize: 12, fontWeight: 600 }}>Chứng minh nhanh</span>
            <span style={{ width: 1, height: 18, background: CL.ink2 }} />
            <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5 }}>Đã chứng minh <b key={done} className={done ? 'co-bump' : ''} style={{ color: CL.ink, fontSize: 15, marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>{done}</b></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {coach.error && <span role="alert" style={{ fontFamily: CL.sans, fontSize: 12, color: CL.redText, marginRight: 4 }}>{coach.error}</span>}
            <button type="button" className="cl-btn" onClick={() => go(false)} disabled={rolling} style={{ ...toolbarBtn(false), opacity: rolling ? 0.5 : 1 }}><span className={'co-dice' + (rolling ? ' on' : '')} aria-hidden="true">⟳</span> Đổi câu</button>
            <button type="button" className="cl-btn" onClick={() => setChat(!chat)} aria-pressed={chat} style={toolbarBtn(chat)}>Dịch</button>
            {!checked ? (
              <button type="button" className="cl-btn cl-primary" onClick={check} disabled={!coach.filled || coach.checking || rolling} style={{ ...primaryBtn, opacity: coach.filled && !coach.checking && !rolling ? 1 : 0.35 }}>{coach.checking ? 'Đang kiểm tra…' : 'Kiểm tra'}</button>
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
              <section style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
                {s && chip && prompt ? (
                  <>
                    <div style={{ padding: '22px 34px 20px', borderBottom: '1px solid ' + CL.ink1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10, perspective: 400 }}>
                        <ClLabel>Chứng minh câu này</ClLabel>
                        <span key={s.id} className={landed ? 'co-flip' : ''} style={{ display: 'inline-block', borderRadius: 5, padding: '4px 8px', background: chip.bg, color: chip.fg, fontFamily: CL.sans, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{chip.label}</span>
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
                        helper={helper} checking={coach.checking} clean={clean}
                      />
                    </div>
                    {checked && !rolling && (
                      <div className="co-rise" style={{ borderTop: '1px solid ' + CL.ink1, background: CL.panel, padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink6 }}>Câu này lấy từ một đề trong thư viện.</span>
                        {openError && <span role="alert" style={{ fontFamily: CL.sans, fontSize: 12, color: CL.redText }}>{openError}</span>}
                        <button type="button" className="cl-btn cl-add" onClick={writeEssay} disabled={opening} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 5, border: '1px solid ' + CL.ink, background: '#fff', color: CL.ink, padding: '6px 12px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600 }}>{opening ? 'Đang tạo bài…' : 'Viết cả bài cho đề này'}<ClIcon name="right" size={12} /></button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ flex: 1 }} />
                )}
              </section>
            </main>
          }
          side={
            <>
              <SidePanel on={notesOn} grow={3}>
                {coach.checking || !shownResult
                  ? <section style={{ height: '100%', borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}><ClLabel color={CL.ink}>Nhận xét</ClLabel><span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink4 }}>Đang đọc mạch…</span></section>
                  : <NotesPanel result={shownResult} fresh={coach.fresh} active={active} onPick={setActive} onClose={() => setNotesOpen(false)} />}
              </SidePanel>
              <SidePanel on={chat} grow={2} top={notesOn}>
                <TranslatorChat onClose={() => setChat(false)} />
              </SidePanel>
            </>
          }
        />
      </div>
    </div>
  );
}
