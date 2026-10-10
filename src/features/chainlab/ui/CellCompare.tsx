'use client';

import { CL } from '../constants';
import { cellPair, cellQuestion, DRV, driverOf, isWritten, verdictKind } from '../ideamap';
import { useSpec } from '../SpecContext';
import type { Chain, Question } from '../types';
import { ChainCard, type FixTarget } from './ChainCard';
import type { ReorderBinding } from './useReorder';

interface CellCompareProps {
  q: Question;
  row: string;
  col: string;
  chains: Chain[];
  /** Start the chain of driver A or B in this cell. */
  onCreate: (drv: 'A' | 'B') => void;
  onChange: (c: Chain) => void;
  onDelete: (c: Chain) => void;
  bind: (id: string) => ReorderBinding;
  numOf: (c: Chain) => number;
  targets: FixTarget[];
  /** Go to screen ②, where the cells are weighed. */
  onNext?: () => void;
}

/**
 * The middle panel for a cell of a two-driver map: the chain of driver A and the chain of driver B, one above the other,
 * and under them a note: the comparison itself happens on screen ②.
 */
export function CellCompare({ q, row, col, chains, onCreate, onChange, onDelete, bind, numOf, targets, onNext }: CellCompareProps) {
  const spec = useSpec();
  const only = verdictKind(spec) === 'only';
  const pair = cellPair(chains, q.n, row, col);
  const both = isWritten(pair.A) && isWritten(pair.B);
  const one = !both && (isWritten(pair.A) ? 'A' : isWritten(pair.B) ? 'B' : null);
  const pill: React.CSSProperties = { borderRadius: 999, background: CL.ink, color: '#fff', padding: '4px 12px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600 };

  return (
    <div className="cl-rise" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', padding: '12px 18px' }}>
        <span style={pill}>{row}</span>
        <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>×</span>
        <span style={pill}>{col}</span>
        <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>Viết hai mạch cho cùng một ô</span>
      </div>

      {(['A', 'B'] as const).map((k) => {
        const chain = pair[k];
        if (chain) {
          return <ol key={k} style={{ margin: 0, padding: 0 }}><ChainCard single num={numOf(chain)} chain={chain} onChange={onChange} onDelete={() => onDelete(chain)} drag={bind(chain.id)} focused={false} targets={targets} /></ol>;
        }
        return (
          <div key={k} style={{ borderRadius: 18, border: '1px dashed ' + CL.ink3, background: '#fff', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: DRV[k].solid, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: CL.sans, fontSize: 11, fontWeight: 700 }}>{k}</span>
                <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 700, color: DRV[k].text }}>{driverOf(spec, k)}</span>
              </div>
              <div style={{ fontFamily: CL.serif, fontSize: 15.5, lineHeight: 1.5, color: CL.ink }}>{cellQuestion(q, { key: row, label: row }, col, driverOf(spec, k))}</div>
            </div>
            <button type="button" className="cl-btn cl-primary" onClick={() => onCreate(k)} style={{ height: 40, padding: '0 18px', borderRadius: 12, background: CL.ink, color: '#fff', fontFamily: CL.sans, fontSize: 13, fontWeight: 600 }}>Viết mạch {k} từ ô này</button>
          </div>
        );
      })}

      <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderRadius: 14, background: CL.panel, padding: '14px 18px' }}>
        <span style={{ flex: '1 1 260px', fontFamily: CL.sans, fontSize: 13, lineHeight: 1.5, color: CL.ink7 }}>
          {both ? <><b style={{ color: CL.ink }}>Ô này có cả A và B.</b> {only ? 'Ở ② Cân, bạn sẽ xét: B có làm được việc này mà không cần A không.' : 'Bạn sẽ cân hai mạch này ở ② Cân, cùng với các cặp khác ô.'}</>
            : one ? <><b style={{ color: CL.ink }}>Ô này mới có mạch {one}.</b> {only && one === 'A' ? 'Viết thêm mạch B nếu cách khác cũng làm được việc này.' : 'Ở ② Cân, ý này tự về phía ' + one + ' và được ghép với ý cùng người hoặc cùng vùng.'}</>
            : 'Viết mạch A, mạch B cho ô này. Mọi so sánh làm ở ② Cân.'}
        </span>
        {(both || one) && onNext && <button type="button" className="cl-btn" onClick={onNext} style={{ flexShrink: 0, height: 38, padding: '0 14px', borderRadius: 10, border: '1px solid ' + CL.ink2, background: '#fff', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: CL.ink }}>Sang ② Cân</button>}
      </div>
    </div>
  );
}
