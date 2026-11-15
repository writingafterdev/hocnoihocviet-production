'use client';

import { CL } from '../chainlab/constants';
import { AiStatus } from '@/components/ui/ai-status';
import { NOTE_STYLE, type CheckResult, type PlacedNote } from './useCoach';

/**
 * Above the chain after "Kiểm tra": the one-line summary (the notes themselves sit on the chain). While checking, a
 * status line; after an edit, a line asks for "Kiểm tra lại".
 */
export function CheckSummary({ result, fresh, checking }: { result: CheckResult | null; fresh: boolean; checking: boolean }) {
  if (checking) return <AiStatus state="analyzing" states={{ analyzing: { label: 'Đang đọc mạch', active: true } }} className="text-[13px]" />;
  if (!result) return null;
  if (!fresh) return <span style={{ margin: '0 2px', fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink5 }}>Bạn đã sửa mạch, kiểm tra lại để xem nhận xét mới.</span>;
  return result.summary ? <p key={result.snap + result.summary} className="co-rise" style={{ margin: '0 2px', fontFamily: CL.sans, fontSize: 13, lineHeight: 1.6, color: CL.ink7 }}>{result.summary}</p> : null;
}

/** One note from "Kiểm tra", shown on the chain right under the step it is about. Faded once the chain has changed. */
export function NoteCard({ note, k, on, faded, onPick, delay }: { note: PlacedNote; k: number; on: boolean; faded: boolean; onPick: () => void; delay: string }) {
  const st = NOTE_STYLE[note.type];
  return (
    <button type="button" className="cl-btn t-reveal" disabled={faded} onClick={onPick} aria-pressed={on}
      style={{ ['--d' as string]: delay, width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 7, padding: '12px 14px', borderRadius: 12, border: '1px solid ' + CL.ink1, background: on ? CL.panel : '#fff', opacity: faded ? 0.55 : 1, transition: 'background-color .2s, opacity .2s', cursor: faded ? 'default' : 'pointer' } as React.CSSProperties}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ minWidth: 22, height: 20, padding: '0 6px', borderRadius: 5, background: st.bg, color: st.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700 }}>{k + 1}</span>
        <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 600, color: st.fg }}>{st.label}</span>
      </span>
      <span style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.55, color: CL.ink7 }}>{note.text}</span>
    </button>
  );
}
