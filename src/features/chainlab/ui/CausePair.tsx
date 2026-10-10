'use client';

import { CL } from '../constants';
import { causeLabel, cellQuestion, type MapRow } from '../ideamap';
import { filledSteps } from '../model';
import type { Chain, Question } from '../types';
import { ChainCard, type FixTarget } from './ChainCard';
import { ClLabel } from './primitives';
import type { ReorderBinding } from './useReorder';

interface CausePairProps {
  causeQ: Question;
  solQ: Question;
  row: MapRow;
  col: string;
  hint?: string;
  /** The cause chain written in this cell, if any. */
  cause?: Chain;
  chains: Chain[];
  /** Who can act on a cause: the solution map's columns. */
  actors: string[];
  driver?: string;
  onCreateCause: () => void;
  onCreateSolution: (cause: Chain, who: string) => void;
  onChange: (c: Chain) => void;
  onDelete: (c: Chain) => void;
  bind: (id: string) => ReorderBinding;
  numOf: (c: Chain) => number;
  targets: FixTarget[];
}

/**
 * The middle panel for a cell of a cause map on a cause + solution prompt: the cause chain on top and, right under
 * it, the solutions written for that cause (with a way to start another).
 */
export function CausePair({ causeQ, solQ, row, col, hint, cause, chains, actors, driver, onCreateCause, onCreateSolution, onChange, onDelete, bind, numOf, targets }: CausePairProps) {
  const pill: React.CSSProperties = { borderRadius: 999, background: CL.ink, color: '#fff', padding: '4px 12px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600 };
  const fixes = cause ? chains.filter((c) => (c.q || 1) === solQ.n && c.fixes === cause.id) : [];
  const ready = !!cause && filledSteps(cause) > 0;
  const causeRow: MapRow | null = cause ? { key: cause.id, label: causeLabel(cause) } : null;

  return (
    <div className="cl-rise" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', padding: '12px 18px' }}>
        <span style={pill}>{row.label}</span>
        <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>×</span>
        <span style={pill}>{col}</span>
        {hint && <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>{hint}</span>}
        <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>Nguyên nhân, rồi giải pháp ngay dưới</span>
      </div>

      {cause ? (
        <ol style={{ margin: 0, padding: 0 }}><ChainCard single num={numOf(cause)} chain={cause} onChange={onChange} onDelete={() => onDelete(cause)} drag={bind(cause.id)} focused={false} targets={targets} /></ol>
      ) : (
        <div style={{ borderRadius: 18, border: '1px dashed ' + CL.ink3, background: '#fff', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            <ClLabel color={CL.ink}>Nguyên nhân</ClLabel>
            <div style={{ marginTop: 6, fontFamily: CL.serif, fontSize: 16, lineHeight: 1.5, color: CL.ink }}>{cellQuestion(causeQ, row, col, driver)}</div>
          </div>
          <button type="button" className="cl-btn cl-primary" onClick={onCreateCause} style={{ height: 40, padding: '0 18px', borderRadius: 12, background: CL.ink, color: '#fff', fontFamily: CL.sans, fontSize: 13, fontWeight: 600 }}>Viết mạch từ ô này</button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '4px 4px 0' }}>
        <ClLabel color={CL.ink}>Giải pháp cho nguyên nhân này</ClLabel>
        {fixes.length > 0 && <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>{fixes.length} giải pháp</span>}
      </div>

      {fixes.map((s) => (
        <ol key={s.id} style={{ margin: 0, padding: 0 }}><ChainCard single num={numOf(s)} chain={s} onChange={onChange} onDelete={() => onDelete(s)} drag={bind(s.id)} focused={false} targets={targets} /></ol>
      ))}

      <section aria-label="Thêm giải pháp" style={{ borderRadius: 18, border: '1px dashed ' + (ready ? CL.ink3 : CL.ink2), background: ready ? '#fff' : '#FCFCFB', padding: '16px 22px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ready && causeRow ? (
          <>
            <div style={{ fontFamily: CL.serif, fontSize: 15.5, lineHeight: 1.5, color: CL.ink }}>Ai có thể làm gì để xử lý «{causeRow.label}»?</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink6, marginRight: 4 }}>{fixes.length ? 'Thêm giải pháp khác: ai làm?' : 'Ai làm?'}</span>
              {actors.map((a) => (
                <button key={a} type="button" className="cl-btn" onClick={() => onCreateSolution(cause, a)} title={cellQuestion(solQ, causeRow, a)}
                  style={{ minHeight: 34, borderRadius: 999, border: '1px solid ' + CL.ink2, background: '#fff', color: CL.ink7, padding: '5px 13px', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600 }}>{a}</button>
              ))}
            </div>
          </>
        ) : (
          <span style={{ fontFamily: CL.sans, fontSize: 12.5, lineHeight: 1.5, color: CL.ink5 }}>Viết nguyên nhân trước, rồi tìm giải pháp cho nó ngay ở đây.</span>
        )}
      </section>
    </div>
  );
}
