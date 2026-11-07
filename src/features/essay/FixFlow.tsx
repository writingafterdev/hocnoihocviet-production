'use client';

import { useState, type ReactNode } from 'react';
import type { Prompt } from '@/content/prompts';
import type { EssayState } from '../attempts/store';
import { CL } from '../chainlab/constants';
import type { Chain, ReviewItem } from '../chainlab/types';
import { ClLabel, toolbarBtn } from '../chainlab/ui/primitives';
import { primaryBtn } from '../coach/ui';
import { CRITERION_STYLE, wordCount, type EssayReview, type EssaySection } from '../desk/scoring';
import { MiniChain } from './MiniChain';

/** One guided fix: an idea or flow comment (TR / CC) that quotes the essay. */
export interface FixTask { item: ReviewItem; crit: string; title: string; ask: string[]; starter?: string; ok: string }

/**
 * The fix round's tasks: comments that carry a guided fix (`task`). A review without any (older ones, the
 * rule-based checks) falls back to every TR / CC comment that quotes the essay, asked as its own text.
 */
export function fixTasks(review: EssayReview | null): FixTask[] {
  if (!review) return [];
  const all = review.groups.flatMap((g) => g.items.map((item) => ({ item, crit: g.id })));
  const guided = all.filter((n) => n.item.task);
  const pick = guided.length ? guided : all.filter((n) => (n.crit === 'tr' || n.crit === 'cc') && n.item.quote && n.item.sectionId);
  return pick.map(({ item, crit }) => ({
    item, crit,
    title: item.task?.title || item.label || 'Sửa ý',
    ask: item.task?.ask?.length ? item.task.ask : [item.text.replace(/\*\*/g, '')],
    starter: item.task?.starter,
    ok: item.task?.ok || 'Đã sửa xong chỗ này.',
  }));
}

/** A task is solved once its quoted words are gone and the paragraph hasn't simply been cut short. */
const passes = (t: FixTask, text: string, before: string) => !text.includes(t.item.quote!) && wordCount(text) >= wordCount(before) - 3;

type SetEssay = (fn: (e: EssayState) => EssayState) => void;
type Fix = NonNullable<EssayState['fix']>;

const pill = { display: 'inline-flex', alignItems: 'center', minHeight: 30, borderRadius: 999, padding: '0 12px', background: CL.ink, fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: '#fff' } as const;
const back = { fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', color: CL.ink5 } as const;
const card = { borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff' } as const;

function Bar({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, minHeight: 42, paddingBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>{left}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>
    </div>
  );
}

/** The paragraph with the task's words highlighted in the criterion's colour. */
function Highlighted({ text, quote, crit }: { text: string; quote?: string; crit: string }) {
  const at = quote ? text.indexOf(quote) : -1;
  if (at < 0) return <>{text}</>;
  const st = CRITERION_STYLE[crit];
  return <>{text.slice(0, at)}<mark style={{ color: 'inherit', borderRadius: 3, background: st.soft, boxShadow: 'inset 0 -2px 0 ' + st.line, padding: '0 1px' }}>{quote}</mark>{text.slice(at + quote!.length)}</>;
}

/**
 * "Sửa ý và mạch": one task at a time. An open question is pinned on top (no answer box; the student answers in
 * their head), the problem is highlighted in their own paragraph, which they edit in place. "Kiểm tra" re-reads
 * the paragraph; "Gợi ý thêm" adds another question, then a sentence starter.
 */
export function FixView({ prompt, chains, sections, essay, setEssay, tasks, chainsHref }: { prompt: Prompt; chains: Chain[]; sections: EssaySection[]; essay: EssayState; setEssay: SetEssay; tasks: FixTask[]; chainsHref: string }) {
  const fix = essay.fix as Fix;
  const step = Math.min(fix.step, tasks.length - 1);
  const task = tasks[step];
  const sec = task.item.sectionId!;
  const text = essay.drafts[sec] || '';
  const ok = fix.solved.includes(task.item.key);
  const allDone = tasks.every((t) => fix.solved.includes(t.item.key));
  const [editing, setEditing] = useState(false);
  const [hint, setHint] = useState(0);
  const [checked, setChecked] = useState(false);
  const st = CRITERION_STYLE[task.crit];
  const chain = chains.find((c) => c.id === sec);
  const label = sections.find((s) => s.id === sec)?.label || '';
  const hints = task.ask.length - 1 + (task.starter ? 1 : 0);
  const changed = sections.some((s) => (fix.before[s.id] || '') !== (essay.drafts[s.id] || ''));

  const setFix = (f: Partial<Fix>) => setEssay((e) => (e.fix ? { ...e, fix: { ...e.fix, ...f } } : e));
  const go = (k: number) => { setFix({ step: k }); setEditing(false); setHint(0); setChecked(false); };
  const check = () => {
    const pass = passes(task, text, fix.before[sec] || '');
    setChecked(true);
    if (pass) { setFix({ solved: [...fix.solved, task.item.key] }); setEditing(false); }
  };
  const next = () => {
    if (allDone) { setFix({ view: 'diff' }); return; }
    const later = tasks.findIndex((t, k) => k > step && !fix.solved.includes(t.item.key));
    go(later >= 0 ? later : tasks.findIndex((t) => !fix.solved.includes(t.item.key)));
  };

  return (
    <>
      <Bar
        left={<>
          <button type="button" className="cl-btn cl-link" onClick={() => setFix({ view: 'paused' })} style={back}>← Về bài chấm</button>
          <span style={pill}>Sửa ý và mạch</span>
          <span style={{ display: 'flex', gap: 6 }}>
            {tasks.map((t, k) => <span key={t.item.key} style={{ width: k === step ? 22 : 8, height: 8, borderRadius: 999, background: fix.solved.includes(t.item.key) ? CL.green : k === step ? CL.ink : CL.ink2, transition: 'width .3s, background-color .3s' }} />)}
          </span>
          <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5 }}>Việc <b style={{ color: CL.ink }}>{step + 1}</b> / {tasks.length}</span>
        </>}
        right={<button type="button" className="cl-btn" onClick={() => setFix({ view: 'diff' })} disabled={!changed} style={{ ...toolbarBtn(false), color: CL.ink, opacity: changed ? 1 : 0.4 }}>Xem trước / sau</button>}
      />
      <div className="co-fix3" style={{ flex: 1, minHeight: 0 }}>
        <aside style={{ ...card, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid ' + CL.ink1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ClLabel>Đề bài</ClLabel>
            <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 13.5, fontStyle: 'italic', lineHeight: 1.6, color: CL.ink8 }}>{prompt.text}</p>
          </div>
          <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chain ? <>
              <ClLabel>Mạch của {label}</ClLabel>
              <MiniChain prompt={prompt} chain={chain} num={chains.indexOf(chain) + 1} hit={{ at: task.item.at ?? null, bg: st.soft }} focused={false} chainsHref={chainsHref} />
              <span style={{ fontFamily: CL.sans, fontSize: 11.5, lineHeight: 1.5, color: CL.ink5 }}>Bước tô màu là chỗ đoạn văn đang thiếu hoặc lệch so với mạch.</span>
            </> : <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink5 }}>{label} không có mạch. Đọc câu hỏi rồi sửa thẳng trong đoạn.</span>}
          </div>
        </aside>

        <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <section style={{ ...card, flexShrink: 0, background: CL.panel, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClLabel>Câu hỏi gợi mở</ClLabel>
              <span style={{ borderRadius: 5, padding: '3px 7px', background: st.soft, fontFamily: CL.sans, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: st.fg }}>{st.short}</span>
              <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11.5, color: CL.ink5 }}>{task.title}</span>
            </span>
            <span style={{ fontFamily: CL.sans, fontSize: 17, fontWeight: 600, lineHeight: 1.45, color: CL.ink }}>{task.ask[0]}</span>
            {task.ask.slice(1, 1 + hint).map((q) => <span key={q} className="co-unfold" style={{ fontFamily: CL.sans, fontSize: 14.5, fontWeight: 600, lineHeight: 1.45, color: CL.ink7 }}>{q}</span>)}
            {task.starter && hint >= task.ask.length && <span className="co-unfold" style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.5, color: CL.ink6 }}>Thử mở câu bằng: <i style={{ fontFamily: CL.serif, fontSize: 14, color: CL.ink8 }}>{task.starter}</i></span>}
          </section>

          <section style={{ ...card, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 50, padding: '0 22px', borderBottom: '1px solid ' + CL.ink1, background: CL.panel }}>
              <span style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: CL.ink }}>{label}</span>
              <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>{editing ? 'Sửa thẳng trong đoạn.' : 'Bấm vào đoạn để sửa.'}</span>
              <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>{wordCount(text)} từ</span>
            </div>
            <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {editing ? <>
                {text.includes(task.item.quote!) && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderRadius: 8, background: st.soft, padding: '7px 12px', fontFamily: CL.sans, fontSize: 12, color: st.fg }}>
                    <b style={{ flexShrink: 0 }}>Chỗ cần sửa</b><i style={{ fontFamily: CL.serif, fontSize: 13 }}>“{task.item.quote}”</i>
                  </div>
                )}
                <textarea className="co-ta" autoFocus value={text} aria-label={label}
                  onChange={(e) => { const v = e.target.value; setChecked(false); setEssay((x) => ({ ...x, drafts: { ...x.drafts, [sec]: v } })); }}
                  style={{ flex: 1, minHeight: 200, resize: 'none', border: '1px solid ' + CL.ink5, borderRadius: 12, outline: 'none', padding: '14px 16px', fontFamily: CL.serif, fontSize: 15.5, lineHeight: 1.75, color: CL.ink8 }} />
              </> : (
                <button type="button" className="cl-btn" onClick={() => setEditing(true)} aria-label={'Sửa ' + label}
                  style={{ textAlign: 'left', cursor: 'text', border: '1px solid ' + CL.ink2, borderRadius: 12, background: '#fff', padding: '14px 16px', fontFamily: CL.serif, fontSize: 15.5, lineHeight: 1.75, color: CL.ink8, whiteSpace: 'pre-wrap' }}>
                  <Highlighted text={text} quote={task.item.quote} crit={task.crit} />
                </button>
              )}
              {ok && (
                <div className="co-unfold" style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10, background: CL.mintSoft, padding: '10px 14px', fontFamily: CL.sans, fontSize: 13, color: CL.greenText }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>{task.ok}
                </div>
              )}
              {checked && !ok && (
                <div role="status" className="co-unfold" style={{ borderRadius: 10, background: '#F3F3F1', padding: '10px 14px', fontFamily: CL.sans, fontSize: 13, lineHeight: 1.5, color: CL.ink7 }}>
                  {text.includes(task.item.quote!) ? 'Chưa được: câu cũ vẫn còn nguyên. Đọc lại câu hỏi ở trên rồi sửa thẳng chỗ tô màu.' : 'Gần rồi, nhưng đoạn đang ngắn đi. Thêm ý trả lời câu hỏi thay vì chỉ xoá câu cũ.'}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderTop: '1px solid ' + CL.ink1, background: CL.panel }}>
              {hints > 0 && <button type="button" className="cl-btn" onClick={() => setHint(hint + 1)} disabled={hint >= hints} style={{ ...toolbarBtn(false), color: CL.ink, opacity: hint >= hints ? 0.4 : 1 }}>Gợi ý thêm</button>}
              <button type="button" className="cl-btn cl-primary" onClick={ok ? next : check} style={{ ...primaryBtn, marginLeft: 'auto' }}>{!ok ? 'Kiểm tra' : allDone ? 'Xem trước / sau →' : 'Việc tiếp →'}</button>
            </div>
          </section>
        </div>

        <aside style={{ minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ClLabel>Ý và mạch · {tasks.length} việc</ClLabel>
          {tasks.map((t, k) => {
            const done = fix.solved.includes(t.item.key), on = k === step;
            return (
              <button key={t.item.key} type="button" className="cl-btn" onClick={() => go(k)} aria-current={on || undefined}
                style={{ textAlign: 'left', display: 'flex', gap: 10, alignItems: 'flex-start', borderRadius: 12, border: '1px solid ' + (on ? CL.ink : CL.ink1), background: '#fff', padding: '12px 14px', transition: 'border-color .2s' }}>
                <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 999, background: done ? CL.mintSoft : on ? CL.ink : CL.ink1, color: done ? CL.greenText : on ? '#fff' : CL.ink6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: CL.sans, fontSize: 11, fontWeight: 700 }}>{done ? '✓' : k + 1}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 600, color: CL.ink }}>{t.title}</span>
                  <span style={{ fontFamily: CL.sans, fontSize: 11.5, color: CL.ink5 }}>{sections.find((s) => s.id === t.item.sectionId)?.label} · {CRITERION_STYLE[t.crit].short}</span>
                </span>
              </button>
            );
          })}
          <span style={{ marginTop: 4, fontFamily: CL.sans, fontSize: 12, lineHeight: 1.55, color: CL.ink5 }}>Mỗi việc: đọc câu hỏi, sửa thẳng trong đoạn, bấm Kiểm tra. Bí thì bấm Gợi ý thêm.</span>
        </aside>
      </div>
    </>
  );
}

type Seg = { t: string; kind: 'same' | 'del' | 'add' };

/** Word-level diff (longest common subsequence), as runs of unchanged, removed and added text. */
function wordDiff(a: string, b: string): { before: Seg[]; after: Seg[] } {
  const A = a.split(/(\s+)/), B = b.split(/(\s+)/), n = A.length, m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const before: Seg[] = [], after: Seg[] = [];
  const push = (arr: Seg[], t: string, kind: Seg['kind']) => { const last = arr[arr.length - 1]; if (last && last.kind === kind) last.t += t; else arr.push({ t, kind }); };
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { push(before, A[i], 'same'); push(after, B[j], 'same'); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) push(before, A[i++], 'del');
    else push(after, B[j++], 'add');
  }
  while (i < n) push(before, A[i++], 'del');
  while (j < m) push(after, B[j++], 'add');
  // A space shared between two changed words joins them, so a rewritten clause reads as one run.
  const join = (arr: Seg[]) => arr.reduce<Seg[]>((out, g, k) => {
    const prev = out[out.length - 1], next = arr[k + 1];
    if (prev && prev.kind !== 'same' && g.kind === 'same' && /^\s+$/.test(g.t) && next && next.kind === prev.kind) prev.t += g.t;
    else if (prev && g.kind === prev.kind) prev.t += g.t;
    else out.push({ ...g });
    return out;
  }, []);
  return { before: join(before), after: join(after) };
}

const SEG_STYLE = { same: {}, del: { background: CL.redSoft, color: CL.redText, textDecoration: 'line-through' }, add: { background: CL.mintSoft, color: CL.greenText } } as const;

/** "Trước và sau": each changed paragraph, old beside new, then "Nộp lại". */
export function DiffView({ sections, essay, setEssay, tasks, onResubmit, sending, error }: { sections: EssaySection[]; essay: EssayState; setEssay: SetEssay; tasks: FixTask[]; onResubmit: () => void; sending: boolean; error: string }) {
  const fix = essay.fix as Fix;
  const changed = sections.filter((s) => (fix.before[s.id] || '') !== (essay.drafts[s.id] || ''));
  const solved = tasks.filter((t) => fix.solved.includes(t.item.key));
  return (
    <>
      <Bar
        left={<>
          <button type="button" className="cl-btn cl-link" onClick={() => setEssay((e) => (e.fix ? { ...e, fix: { ...e.fix, view: 'fix' } } : e))} style={back}>← Quay lại sửa</button>
          <span style={pill}>Trước và sau</span>
          <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5 }}>Bạn đã sửa {solved.length} / {tasks.length} việc trong {changed.length} đoạn.</span>
        </>}
        right={<>
          {error && <span role="alert" style={{ fontFamily: CL.sans, fontSize: 12, color: CL.redText, marginRight: 4 }}>{error}</span>}
          <button type="button" className="cl-btn cl-primary" onClick={onResubmit} disabled={sending} style={{ ...primaryBtn, opacity: sending ? 0.4 : 1 }}>{sending ? 'Đang chấm…' : 'Nộp lại →'}</button>
        </>}
      />
      <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 18, fontFamily: CL.sans, fontSize: 12, color: CL.ink6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 10, borderRadius: 3, background: CL.redSoft }} />Bỏ đi</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 10, borderRadius: 3, background: CL.mintSoft }} />Thêm vào</span>
        </div>
        {changed.length === 0 && <div style={{ borderRadius: 18, border: '1px dashed ' + CL.ink3, padding: 40, textAlign: 'center', fontFamily: CL.sans, fontSize: 14, color: CL.ink5 }}>Chưa có đoạn nào được sửa.</div>}
        {changed.map((s) => {
          const d = wordDiff(fix.before[s.id] || '', essay.drafts[s.id] || '');
          const n = solved.filter((t) => t.item.sectionId === s.id).length;
          return (
            <section key={s.id} style={{ ...card, flexShrink: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 22px', borderBottom: '1px solid ' + CL.ink1, background: CL.panel, fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: CL.ink }}>
                {s.label}{n > 0 && <span style={{ fontWeight: 400, fontSize: 12, color: CL.ink5 }}> · {n} việc đã sửa</span>}
              </div>
              <div className="co-diff2">
                {([['Trước', d.before, CL.ink5], ['Sau', d.after, CL.greenText]] as const).map(([title, segs, fg]) => (
                  <div key={title} style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <ClLabel color={fg}>{title}</ClLabel>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: CL.serif, fontSize: 14.5, lineHeight: 1.75, color: CL.ink8 }}>
                      {segs.map((g, k) => <span key={k} style={{ borderRadius: 3, ...SEG_STYLE[g.kind] }}>{g.t}</span>)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
