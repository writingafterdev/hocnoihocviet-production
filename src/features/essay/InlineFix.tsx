'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
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
 * A comment that has just been fixed: its green line shows for a moment, then the card folds down to its title, crossed
 * off with a ✓ (the same motion as a chain note fixed on Enter). One that was already fixed shows folded at once.
 */
export function useFolded(solved: boolean) {
  const [folded, setFolded] = useState(solved);
  useEffect(() => {
    if (!solved) { setFolded(false); return; }
    const t = setTimeout(() => setFolded(true), 1800);
    return () => clearTimeout(t);
  }, [solved]);
  return folded;
}

/** `useFolded` for places that render cards in a loop. */
export function Folded({ solved, children }: { solved: boolean; children: (folded: boolean) => ReactNode }) {
  return <>{children(useFolded(solved))}</>;
}

/** The ✓ badge a folded comment shows in place of its colour bar. */
export const DoneTick = () => (
  <span className="co-note-badge co-unfold" style={{ minWidth: 20, height: 18, borderRadius: 5, background: CL.mintSoft, color: CL.greenText, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700 }}>✓</span>
);

/**
 * One comment that is fixed where it stands: "Sửa" opens it; the guiding question sits on top, "Gợi ý cách viết"
 * shows the model rewrite's meaning and the first letter of each word, the student types the new words, "Kiểm tra".
 */
export function FixCard({ task, where, comment, open, onOpen, edit, setEdit, solved, verdict, checking, error, onCheck }: {
  task: FixTask; where: string; comment?: string; open: boolean; onOpen: () => void;
  edit: string; setEdit: (v: string) => void; solved: boolean; verdict?: CheckOut; checking: boolean; error: string; onCheck: () => void;
}) {
  const st = CRITERION_STYLE[task.crit] || CRITERION_STYLE.tr;
  const folded = useFolded(solved);

  if (!open && !solved) {
    return (
      <div style={{ flexShrink: 0, borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: st.line }} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <b style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: CL.ink }}>{task.title}</b>
          <span style={label}>{where}</span>
        </span>
        <button type="button" className="cl-btn" onClick={onOpen} style={{ ...smallBtn, marginLeft: 'auto', height: 30 }}>Sửa</button>
      </div>
    );
  }

  // Open for fixing, or fixed: once fixed it folds down to its crossed-off title.
  const active = open && !folded;
  return (
    <div className={'co-note' + (folded ? ' done' : '')} style={{ flexShrink: 0, borderRadius: 12, border: '1px solid ' + (active ? '#2F62C4' : CL.border), background: '#fff', padding: active ? 14 : '12px 14px', display: 'flex', flexDirection: 'column', transition: 'border-color .3s ease, padding .3s ease' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {folded && <DoneTick />}
        <b className="co-note-label" style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: folded ? CL.greenText : CL.ink }}>{task.title}</b>
        <span style={{ ...label, marginLeft: 'auto' }}>{where}</span>
      </span>
      {open && (
        <span className="co-note-fold" aria-hidden={folded || undefined}>
          <span style={{ minHeight: 0, overflow: 'hidden' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 9 }}>
              {/* Why it's wrong first (the struck words are already marked in the paragraph, so no quote here), then the fix. */}
              {(comment || task.plan?.why) && <span style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.55, color: CL.ink7 }}>{comment || task.plan?.why}</span>}
              <FixBody task={task} edit={edit} setEdit={setEdit} solved={solved} verdict={verdict} checking={checking} error={error} onCheck={onCheck} />
            </span>
          </span>
        </span>
      )}
    </div>
  );
}

/**
 * The fix itself, inside a comment: one guiding question on top, then "Gợi ý thêm" opens the model rewrite's meaning and
 * the first letter of each word; then the box for the new words and "Kiểm tra" (both gone once fixed). `preparing`: the AI's
 * questions and hints are still on their way (the comment's own text stands in until then).
 */
export function FixBody({ task, edit, setEdit, solved, verdict, checking, error, onCheck, preparing }: {
  task: FixTask; edit: string; setEdit: (v: string) => void; solved: boolean; verdict?: CheckOut; checking: boolean; error: string; onCheck: () => void; preparing?: boolean;
}) {
  const [hints, setHints] = useState(false);
  /** First-letter words the student tapped to see in full: one word at a time. */
  const [peek, setPeek] = useState<Set<number>>(new Set());
  const box = useRef<HTMLTextAreaElement>(null);
  // The model rewrite: from the AI's plan, or from the comment itself (a written-in task, or its "Sửa:" text).
  const model = task.plan?.model || task.model || '';
  const vi = task.plan?.vi || task.vi || '';
  const tokens = model ? splitWords(model) : [];
  const states = model ? wordStates(model, edit) : [];
  const ok = states.filter((x) => x.s === 'ok').length;
  return (
    <>
      <div style={{ borderRadius: 10, background: '#F7F9FD', border: '1px solid #DCE7F7', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {preparing && <span role="status" style={label}>Đang chuẩn bị cách sửa…</span>}
        {/* Newer reviews say what to do ("Cách sửa"); older ones asked a guiding question instead. */}
        {task.how
          ? <span style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, lineHeight: 1.45, color: CL.ink }}><span style={{ fontWeight: 500, color: CL.ink5 }}>Cách sửa: </span>{task.how}</span>
          : task.ask[0] && <span style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, lineHeight: 1.45, color: CL.ink }}>{task.ask[0]}</span>}
        {hints && model && <span className="co-unfold" style={{ ...label, display: 'flex' }}>Gợi ý cách viết<span style={{ marginLeft: 'auto' }}>bấm một từ để xem · {ok}/{tokens.length} từ đúng</span></span>}
        {hints && model && <>
          {vi && <span style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.45, color: CL.ink7 }}>{vi}</span>}
          <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {tokens.map((w, i) => {
              const good = states[i]?.s === 'ok', bad = states[i]?.s === 'bad';
              const seen = peek.has(i);
              return (
                <button key={i} type="button" className="cl-btn" disabled={good || seen} aria-label={good || seen ? w : 'Xem từ thứ ' + (i + 1)}
                  onClick={() => { setPeek((p) => new Set(p).add(i)); box.current?.focus(); }}
                  style={{ display: 'inline-block', borderRadius: 6, padding: '2px 7px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12.5, cursor: good || seen ? 'default' : 'pointer', border: '1px solid ' + (good ? '#BFE0B5' : bad ? '#F0C7BE' : '#E5E5E5'), background: good ? '#EDF7EA' : bad ? CL.redSoft : '#fff', color: good ? '#2D6E1E' : bad ? CL.redText : seen ? CL.ink8 : '#737373' }}>{good || seen ? w : hint(w)}</button>
              );
            })}
          </span>
        </>}
        <textarea ref={box} className="co-ta" autoFocus value={edit} onChange={(e) => setEdit(e.target.value)} aria-label="Câu thay thế" placeholder="Gõ câu thay cho chỗ bị gạch…" rows={2}
          style={{ resize: 'none', boxSizing: 'border-box', border: '1px solid #77A1DD', borderRadius: 8, boxShadow: '0 0 0 3px #EEF3FC', outline: 'none', padding: '8px 12px', fontFamily: CL.serif, fontSize: 14, lineHeight: 1.55, color: CL.ink, background: '#fff', fieldSizing: 'content' } as React.CSSProperties} />
      </div>
      {solved && <span className="co-unfold" style={{ borderRadius: 10, background: CL.mintSoft, padding: '9px 12px', fontFamily: CL.sans, fontSize: 13, lineHeight: 1.5, color: CL.greenText }}>{verdict?.reply || 'Đã sửa xong chỗ này.'}</span>}
      {/* Not fixed yet: why, then the next hint as a card of its own. */}
      {!solved && verdict && <span role="status" key={verdict.reply} className="co-unfold" style={{ borderRadius: 10, background: '#F5F5F5', padding: '9px 12px', fontFamily: CL.sans, fontSize: 13, lineHeight: 1.5, color: CL.ink7 }}>Chưa được: {verdict.reply}</span>}
      {!solved && verdict?.ask && (
        <span key={verdict.ask} className="co-unfold" style={{ display: 'flex', flexDirection: 'column', gap: 4, borderRadius: 10, background: '#F7F9FD', border: '1px solid #DCE7F7', padding: '10px 12px' }}>
          <span style={label}>Làm tiếp</span>
          <span style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, lineHeight: 1.45, color: CL.ink }}>{verdict.ask}</span>
        </span>
      )}
      {error && <span role="alert" style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.redText }}>{error}</span>}
      {/* Fixed: nothing left to do here. Two layers of help only: the guiding question, then "Gợi ý thêm" for the first-letter hints. */}
      {!solved && <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {model && !hints && <button type="button" className="cl-btn" onClick={() => setHints(true)} style={smallBtn}>Gợi ý thêm</button>}
        <button type="button" className="cl-btn cl-primary" onClick={onCheck} disabled={checking || !edit.trim()} style={{ ...primaryBtn, height: 32, fontSize: 13, marginLeft: 'auto', opacity: checking || !edit.trim() ? 0.45 : 1 }}>{checking ? 'Đang kiểm tra…' : 'Kiểm tra'}</button>
      </span>}
    </>
  );
}
