'use client';

import { useState, type ReactNode } from 'react';
import { CL } from '../chainlab/constants';
import { primaryBtn } from '../coach/ui';
import { CRITERION_STYLE } from '../desk/scoring';
import { hint, wordStates, words as splitWords } from '../guided/matching';
import type { CheckOut } from './fix-api';
import type { FixTask } from './FixFlow';

const label: React.CSSProperties = { fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink5 };
const smallBtn: React.CSSProperties = { height: 32, padding: '0 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,.12)', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.05)', fontFamily: CL.sans, fontSize: 13, fontWeight: 500, color: CL.ink, whiteSpace: 'nowrap' };

/** The paragraph with each task's words struck through and, once typed, the student's rewrite after them in green. Clicking a struck part opens its task. */
export function FixParagraph({ text, tasks, edits, open, onOpen }: { text: string; tasks: FixTask[]; edits: Record<string, string>; open: string | null; onOpen: (key: string) => void }) {
  const spans = tasks
    .map((t) => ({ t, at: t.item.quote ? text.indexOf(t.item.quote) : -1 }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at)
    .filter((x, k, all) => !all.slice(0, k).some((y) => x.at < y.at + y.t.item.quote!.length));
  const out: ReactNode[] = [];
  let last = 0;
  spans.forEach(({ t, at }) => {
    const key = t.item.key, q = t.item.quote!, on = open === key, edit = (edits[key] || '').trim();
    if (at > last) out.push(<span key={'t' + key}>{text.slice(last, at)}</span>);
    out.push(
      <span key={key} role="button" tabIndex={0} onClick={() => onOpen(key)} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(key); }} title="Viết lại chỗ này" style={{ cursor: 'pointer' }}>
        <s style={{ borderRadius: 3, padding: '1px 2px', background: CL.redSoft, color: CL.redText, textDecorationColor: CL.red, boxShadow: on ? '0 0 0 2px #2F62C4' : 'none', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', transition: 'box-shadow .15s' }}>{q}</s>
        {edit && <>{' '}<span style={{ borderRadius: 3, padding: '1px 3px', background: CL.mintSoft, color: CL.greenText, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>{edit}</span></>}
      </span>,
    );
    last = at + q.length;
  });
  if (last < text.length) out.push(<span key="end">{text.slice(last)}</span>);
  return <>{out}</>;
}

/**
 * The rewrite follows the hidden fix (most words match, the way the first-letter hints lead): solved on the spot,
 * with no AI call. Only a rewrite in the student's own words needs the AI to judge it.
 */
export function matchesFix(task: FixTask, typed: string) {
  const model = task.plan?.model || task.model || '';
  const n = model ? splitWords(model).length : 0;
  return n > 0 && wordStates(model, typed).filter((x) => x.s === 'ok').length / n >= 0.75;
}

/** The text with every typed rewrite put in place of its quoted words. */
export function applyEdits(text: string, tasks: FixTask[], edits: Record<string, string>) {
  return tasks.reduce((t, task) => {
    const e = (edits[task.item.key] || '').trim(), q = task.item.quote;
    return e && q && t.includes(q) ? t.replace(q, e) : t;
  }, text);
}

/**
 * One comment that is fixed where it stands: "Sửa" opens it; the guiding question sits on top, "Gợi ý cách viết"
 * shows the model rewrite's meaning and the first letter of each word, the student types the new words, "Kiểm tra".
 */
export function FixCard({ task, where, comment, open, onOpen, edit, setEdit, solved, verdict, checking, error, onCheck }: {
  task: FixTask; where: string; comment?: string; open: boolean; onOpen: () => void;
  edit: string; setEdit: (v: string) => void; solved: boolean; verdict?: CheckOut; checking: boolean; error: string; onCheck: () => void;
}) {
  const st = CRITERION_STYLE[task.crit] || CRITERION_STYLE.tr;

  if (!open) {
    return (
      <div style={{ flexShrink: 0, borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: solved ? CL.green : st.line }} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <b style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: CL.ink }}>{task.title}</b>
          <span style={label}>{where}</span>
        </span>
        {solved
          ? <span style={{ marginLeft: 'auto', borderRadius: 6, padding: '3px 8px', background: CL.mintSoft, color: CL.greenText, fontFamily: CL.sans, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Đã sửa</span>
          : <button type="button" className="cl-btn" onClick={onOpen} style={{ ...smallBtn, marginLeft: 'auto', height: 30 }}>Sửa</button>}
      </div>
    );
  }

  return (
    <div className="co-unfold" style={{ flexShrink: 0, borderRadius: 12, border: '1px solid #2F62C4', background: '#fff', padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <b style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: CL.ink }}>{task.title}</b>
        <span style={{ ...label, marginLeft: 'auto' }}>{where}</span>
      </span>
      {/* Why it's wrong first (the struck words are already marked in the paragraph, so no quote here), then the question. */}
      {(comment || task.plan?.why) && <span style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.55, color: CL.ink7 }}>{comment || task.plan?.why}</span>}
      <FixBody task={task} edit={edit} setEdit={setEdit} solved={solved} verdict={verdict} checking={checking} error={error} onCheck={onCheck} />
    </div>
  );
}

/**
 * The fix itself, inside a comment: the guiding question on top, "Gợi ý cách viết" for the model rewrite's meaning and
 * the first letter of each word, the box for the new words, "Gợi ý thêm" and "Kiểm tra". `preparing`: the AI's
 * questions and hints are still on their way (the comment's own text stands in until then).
 */
export function FixBody({ task, edit, setEdit, solved, verdict, checking, error, onCheck, preparing }: {
  task: FixTask; edit: string; setEdit: (v: string) => void; solved: boolean; verdict?: CheckOut; checking: boolean; error: string; onCheck: () => void; preparing?: boolean;
}) {
  const [more, setMore] = useState(0);
  const [hints, setHints] = useState(false);
  // The model rewrite: from the AI's plan, or from the comment itself (a written-in task, or its "Sửa:" text).
  const model = task.plan?.model || task.model || '';
  const vi = task.plan?.vi || task.vi || '';
  const tokens = model ? splitWords(model) : [];
  const states = model ? wordStates(model, edit) : [];
  const ok = states.filter((x) => x.s === 'ok').length;
  const extra = Math.max(0, task.ask.length - 1) + (task.starter ? 1 : 0);
  return (
    <>
      <div style={{ borderRadius: 10, background: '#F7F9FD', border: '1px solid #DCE7F7', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {preparing && <span role="status" style={label}>Đang chuẩn bị câu hỏi gợi mở…</span>}
        {task.ask[0] && <span style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, lineHeight: 1.45, color: CL.ink }}>{task.ask[0]}</span>}
        {task.ask.slice(1, 1 + more).map((q) => <span key={q} className="co-unfold" style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 600, lineHeight: 1.45, color: CL.ink7 }}>{q}</span>)}
        {task.starter && more >= task.ask.length && <span className="co-unfold" style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink6 }}>Thử mở câu bằng: <i style={{ fontFamily: CL.serif, fontSize: 13.5, color: CL.ink8 }}>{task.starter}</i></span>}
        {model && (
          <button type="button" role="switch" aria-checked={hints} className="cl-btn" onClick={() => setHints(!hints)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 0, border: 'none', background: 'none', fontFamily: CL.sans, fontSize: 12.5, color: CL.ink7, textAlign: 'left' }}>
            <span aria-hidden="true" style={{ position: 'relative', width: 30, height: 18, flexShrink: 0, borderRadius: 99, background: hints ? '#2F62C4' : CL.ink2, transition: 'background-color .15s' }}>
              <span style={{ position: 'absolute', top: 2, left: hints ? 14 : 2, width: 14, height: 14, borderRadius: 99, background: '#fff', transition: 'left .15s' }} />
            </span>
            Gợi ý cách viết
            {hints && <span style={{ ...label, marginLeft: 'auto' }}>{ok}/{tokens.length} từ đúng</span>}
          </button>
        )}
        {hints && model && <>
          {vi && <span style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.45, color: CL.ink7 }}>{vi}</span>}
          <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {tokens.map((w, i) => {
              const good = states[i]?.s === 'ok', bad = states[i]?.s === 'bad';
              return <span key={i} style={{ display: 'inline-block', borderRadius: 6, padding: '2px 7px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12.5, border: '1px solid ' + (good ? '#BFE0B5' : bad ? '#F0C7BE' : '#E5E5E5'), background: good ? '#EDF7EA' : bad ? CL.redSoft : '#fff', color: good ? '#2D6E1E' : bad ? CL.redText : '#737373' }}>{good ? w : hint(w)}</span>;
            })}
          </span>
        </>}
        <textarea className="co-ta" autoFocus value={edit} onChange={(e) => setEdit(e.target.value)} aria-label="Câu thay thế" placeholder="Gõ câu thay cho chỗ bị gạch…" rows={2}
          style={{ resize: 'none', boxSizing: 'border-box', border: '1px solid #77A1DD', borderRadius: 8, boxShadow: '0 0 0 3px #EEF3FC', outline: 'none', padding: '8px 12px', fontFamily: CL.serif, fontSize: 14, lineHeight: 1.55, color: CL.ink, background: '#fff', fieldSizing: 'content' } as React.CSSProperties} />
      </div>
      {solved && <span className="co-unfold" style={{ borderRadius: 10, background: CL.mintSoft, padding: '9px 12px', fontFamily: CL.sans, fontSize: 13, lineHeight: 1.5, color: CL.greenText }}>{verdict?.reply || 'Đã sửa xong chỗ này.'}</span>}
      {/* Not fixed yet: why, then the next hint as a card of its own. */}
      {!solved && verdict && <span role="status" key={verdict.reply} className="co-unfold" style={{ borderRadius: 10, background: '#F5F5F5', padding: '9px 12px', fontFamily: CL.sans, fontSize: 13, lineHeight: 1.5, color: CL.ink7 }}>Chưa được: {verdict.reply}</span>}
      {!solved && verdict?.ask && (
        <span key={verdict.ask} className="co-unfold" style={{ display: 'flex', flexDirection: 'column', gap: 4, borderRadius: 10, background: '#F7F9FD', border: '1px solid #DCE7F7', padding: '10px 12px' }}>
          <span style={label}>Gợi ý tiếp</span>
          <span style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, lineHeight: 1.45, color: CL.ink }}>{verdict.ask}</span>
        </span>
      )}
      {error && <span role="alert" style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.redText }}>{error}</span>}
      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {extra > 0 && <button type="button" className="cl-btn" onClick={() => setMore(more + 1)} disabled={more >= extra} style={{ ...smallBtn, opacity: more >= extra ? 0.4 : 1 }}>Gợi ý thêm</button>}
        <button type="button" className="cl-btn cl-primary" onClick={onCheck} disabled={checking || !edit.trim()} style={{ ...primaryBtn, height: 32, fontSize: 13, marginLeft: 'auto', opacity: checking || !edit.trim() ? 0.45 : 1 }}>{checking ? 'Đang kiểm tra…' : 'Kiểm tra'}</button>
      </span>
    </>
  );
}
