'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WorkspaceHeader } from '@/components/shell/BrandHeader';
import { findPrompt } from '@/content/prompts';
import { KIND_LABEL, sentenceParts, plainSentence, STATEMENTS, type Statement } from '@/content/statements';
import { SignedOutError } from '../attempts/store';
import { startFromStatement } from '../attempts/start';
import { CL } from '../chainlab/constants';
import { backLinkStyle, ClIcon, ClLabel, toolbarBtn } from '../chainlab/ui/primitives';
import { ChainEditor } from '../coach/ChainEditor';
import { NotesPanel } from '../coach/NotesPanel';
import { TranslatorChat } from '../coach/TranslatorChat';
import { useCoach } from '../coach/useCoach';
import { primaryBtn } from '../coach/ui';

const shuffle = <T,>(xs: T[]) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function kindChip(s: Pick<Statement, 'kind' | 'tone'>) {
  if (s.kind === 'cause') return { label: KIND_LABEL.cause, bg: '#FFEEDA', fg: '#7B4D10' };
  if (s.kind === 'solution') return { label: KIND_LABEL.solution, bg: '#E4F5FA', fg: '#17667A' };
  return s.tone === 'cost' ? { label: 'Tác động · hại', bg: CL.redSoft, fg: CL.redText } : { label: 'Tác động · lợi', bg: CL.mintSoft, fg: CL.greenText };
}

/**
 * "Chứng minh nhanh": a random ready-made statement with its two ends given; the student writes the middle,
 * checks it, then moves on like a flashcard. Nothing is saved; the counter is for this visit only.
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

  // Shuffled in the browser only, so the server render and the first client render agree.
  useEffect(() => { setDeck(shuffle(STATEMENTS)); }, []);
  const s = deck ? deck[i % deck.length] : null;
  const prompt = s ? findPrompt(s.promptId) : null;
  const coach = useCoach(s?.promptId || '', { kind: s?.kind || 'impact', tone: s?.tone || null, start: s?.start || '', end: s?.end || '', steps, sentence: s ? plainSentence(s.sentence) : '', stakeholder: s?.stakeholder });

  const go = (k: number, counted: boolean) => {
    if (counted) setDone((d) => d + 1);
    setI(k); setSteps(['']); setActive(null); setNotesOpen(true); setOpenError('');
    coach.reset();
  };
  const next = () => go(i + 1, !!coach.result);
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
  const chip = s ? kindChip(s) : null;
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
            <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5 }}>Đã chứng minh <b style={{ color: CL.ink, fontSize: 15, marginLeft: 4 }}>{done}</b></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {coach.error && <span role="alert" style={{ fontFamily: CL.sans, fontSize: 12, color: CL.redText, marginRight: 4 }}>{coach.error}</span>}
            <button type="button" className="cl-btn" onClick={() => go(i + 1, false)} style={toolbarBtn(false)}>Đổi câu</button>
            <button type="button" className="cl-btn" onClick={() => setChat(!chat)} aria-pressed={chat} style={toolbarBtn(chat)}>Dịch</button>
            {!checked ? (
              <button type="button" className="cl-btn cl-primary" onClick={check} disabled={!coach.filled || coach.checking} style={{ ...primaryBtn, opacity: coach.filled && !coach.checking ? 1 : 0.35 }}>{coach.checking ? 'Đang kiểm tra…' : 'Kiểm tra'}</button>
            ) : (
              <>
                <button type="button" className="cl-btn" onClick={check} disabled={coach.fresh || coach.checking || !coach.filled} style={{ ...toolbarBtn(false), color: CL.ink, opacity: coach.fresh || coach.checking ? 0.4 : 1 }}>{coach.checking ? 'Đang kiểm tra…' : 'Kiểm tra lại'}</button>
                <button type="button" className="cl-btn cl-primary" onClick={next} style={primaryBtn}>Câu tiếp<ClIcon name="right" size={13} /></button>
              </>
            )}
          </div>
        </div>

        <div className="co-grid">
          <main className="co-col" style={{ minWidth: 0 }}>
            <section style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
              {s && chip && prompt ? (
                <>
                  <div style={{ padding: '22px 34px 20px', borderBottom: '1px solid ' + CL.ink1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ClLabel>Chứng minh câu này</ClLabel>
                      <span style={{ borderRadius: 5, padding: '4px 8px', background: chip.bg, color: chip.fg, fontFamily: CL.sans, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{chip.label}</span>
                    </span>
                    <p style={{ margin: 0, fontFamily: CL.serif, fontSize: 21, lineHeight: 1.5, color: CL.ink }}>
                      {sentenceParts(s.sentence).map((part, k) => part.mark
                        ? <span key={k} title={part.mark === 'start' ? 'Điểm đầu' : 'Stakeholder'} style={{ borderRadius: 4, padding: '0 4px', background: part.mark === 'start' ? CL.mintSoft : '#E4F5FA', color: part.mark === 'start' ? CL.greenText : '#17667A' }}>{part.text}</span>
                        : <span key={k}>{part.text}</span>)}
                    </p>
                    <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 12.5, fontStyle: 'italic', lineHeight: 1.6, color: CL.ink5 }}>{prompt.text}</p>
                  </div>
                  <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 32px 16px 34px' }}>
                    <ChainEditor
                      key={s.id}
                      start={s.start} end={s.end} startLabel="Điểm đầu · đề cho" endLabel="Điểm cuối · đề cho"
                      steps={steps} setSteps={setSteps}
                      notes={notes} active={active} onPick={(k) => { setActive(k); setNotesOpen(true); }}
                      hint={coach.hint} asking={coach.asking} onHint={coach.askHint} onCloseHint={coach.closeHint}
                      helper={helper}
                    />
                  </div>
                  {checked && (
                    <div className="cl-rise" style={{ borderTop: '1px solid ' + CL.ink1, background: CL.panel, padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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

          <aside className="co-col" style={{ minWidth: 0 }}>
            {coach.result && notesOpen && <NotesPanel result={coach.result} fresh={coach.fresh} active={active} onPick={setActive} onClose={() => setNotesOpen(false)} />}
            {coach.result && !notesOpen && <button type="button" className="cl-btn cl-add" onClick={() => setNotesOpen(true)} style={{ flexShrink: 0, borderRadius: 12, border: '1px solid ' + CL.border, padding: '12px 16px', textAlign: 'left', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: CL.ink6 }}>Xem nhận xét ({coach.result.placed.length})</button>}
            {chat && <TranslatorChat onClose={() => setChat(false)} />}
          </aside>
        </div>
      </div>
    </div>
  );
}
