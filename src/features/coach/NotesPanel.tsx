'use client';

import { CL } from '../chainlab/constants';
import { AiStatus } from '@/components/ui/ai-status';
import { NOTE_STYLE, type CheckResult, type PlacedNote } from './useCoach';

/** Above the chain while "Kiểm tra" runs: a status line. (The notes themselves sit on the chain, each under its step.) */
export function CheckSummary({ checking }: { result?: CheckResult | null; fresh?: boolean; checking: boolean }) {
  if (checking) return <AiStatus state="analyzing" states={{ analyzing: { label: 'Đang đọc mạch ý', active: true } }} className="text-[13px]" />;
  return null;
}

/**
 * One note from "Kiểm tra", right under the step it is about: what is wrong, then "Cách sửa" (what to do). After the
 * student fixes it and presses Enter, a quick check runs (`busy`); fixed, the card folds down to its label, which is
 * crossed off like a done to-do (`done`); not yet, it says what is still missing (`miss`).
 */
export function NoteCard({ note, k, on, faded, onPick, delay, done, busy, miss }: { note: PlacedNote; k: number; on: boolean; faded: boolean; onPick: () => void; delay: string; done?: boolean; busy?: boolean; miss?: string }) {
  const st = NOTE_STYLE[note.type];
  return (
    <button type="button" className={'cl-btn t-reveal co-note' + (done ? ' done' : '')} disabled={faded || done} onClick={onPick} aria-pressed={on}
      style={{ ['--d' as string]: delay, width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', padding: '12px 14px', borderRadius: 12, border: '1px solid ' + CL.ink1, background: on && !done ? CL.panel : '#fff', opacity: faded ? 0.55 : 1, transition: 'background-color .2s, opacity .2s', cursor: faded || done ? 'default' : 'pointer' } as React.CSSProperties}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="co-note-badge" style={{ minWidth: 22, height: 20, padding: '0 6px', borderRadius: 5, background: done ? CL.mintSoft : st.bg, color: done ? CL.greenText : st.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700 }}>{done ? '✓' : k + 1}</span>
        <span className="co-note-label" style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 600, color: done ? CL.greenText : st.fg }}>{st.label}</span>
        {busy && <span role="status" style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink5 }}>Đang kiểm tra…</span>}
      </span>
      <span className="co-note-fold" aria-hidden={done || undefined}>
        <span style={{ minHeight: 0, overflow: 'hidden' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 7 }}>
            <span style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.55, color: CL.ink7 }}>{note.text}</span>
            {note.fix && <span style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.55, fontWeight: 500, color: CL.ink }}><span style={{ color: CL.ink5 }}>Cách sửa: </span>{note.fix}</span>}
            {miss && !busy && <span className="co-unfold" style={{ borderRadius: 8, background: '#F5F5F5', padding: '7px 10px', fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink7 }}>Chưa được: {miss}</span>}
          </span>
        </span>
      </span>
    </button>
  );
}
