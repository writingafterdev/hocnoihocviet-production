'use client';

import { CL } from '../constants';

interface CellSlotProps {
  row: string;
  col: string;
  /** Small hint under the column name, e.g. "tiền · thời gian · công sức". */
  hint?: string;
  /** The question this cell asks. */
  question: string;
  /** "nhờ" instead of "×" for solution cells. */
  solution?: boolean;
  onCreate: () => void;
}

/** The middle panel for a selected cell that has no chain yet: its question and the button that starts the chain. */
export function CellSlot({ row, col, hint, question, solution, onCreate }: CellSlotProps) {
  const pill: React.CSSProperties = { borderRadius: 999, background: CL.ink, color: '#fff', padding: '4px 12px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600 };
  return (
    <div className="cl-rise" style={{ borderRadius: 18, border: '1px dashed ' + CL.ink3, background: '#fff', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 320px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <span style={pill}>{row}</span>
          <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>{solution ? 'nhờ' : '×'}</span>
          <span style={pill}>{col}</span>
          {hint && <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>{hint}</span>}
        </div>
        <div style={{ fontFamily: CL.serif, fontSize: 16.5, lineHeight: 1.5, color: CL.ink }}>{question}</div>
      </div>
      <button type="button" className="cl-btn cl-primary" onClick={onCreate} style={{ height: 40, padding: '0 20px', borderRadius: 12, background: CL.ink, color: '#fff', fontFamily: CL.sans, fontSize: 13, fontWeight: 600 }}>{solution ? 'Viết giải pháp từ ô này' : 'Viết mạch từ ô này'}</button>
    </div>
  );
}
