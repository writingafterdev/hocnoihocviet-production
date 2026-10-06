'use client';

import { CL } from '../constants';
import { CMP_CRITERIA, cellPair, cellQuestion, DRV, driverOf, isWritten, type CellCmp } from '../ideamap';
import { useSpec } from '../SpecContext';
import type { Chain, Question } from '../types';
import { ChainCard, type FixTarget } from './ChainCard';
import type { ReorderBinding } from './useReorder';

interface CellCompareProps {
  q: Question;
  row: string;
  col: string;
  chains: Chain[];
  cmp?: CellCmp;
  onCmp: (v: CellCmp) => void;
  /** Start the chain of driver A or B in this cell. */
  onCreate: (drv: 'A' | 'B') => void;
  onChange: (c: Chain) => void;
  onDelete: (c: Chain) => void;
  bind: (id: string) => ReorderBinding;
  numOf: (c: Chain) => number;
  targets: FixTarget[];
}

const EMPTY: CellCmp = { win: null, crit: [], why: '' };
const CHOICES: { win: 'A' | '=' | 'B'; label: string }[] = [{ win: 'A', label: 'A hơn' }, { win: '=', label: 'Ngang nhau' }, { win: 'B', label: 'B hơn' }];

/**
 * The middle panel for a cell of a two-driver map: the chain of driver A and the chain of driver B, one above the other,
 * and under them the student's comparison of the two (who is stronger here, on what grounds, and why).
 */
export function CellCompare({ q, row, col, chains, cmp, onCmp, onCreate, onChange, onDelete, bind, numOf, targets }: CellCompareProps) {
  const spec = useSpec();
  const pair = cellPair(chains, q.n, row, col);
  const ready = isWritten(pair.A) && isWritten(pair.B);
  const v = cmp || EMPTY;
  const set = (p: Partial<CellCmp>) => onCmp({ ...v, ...p });
  const pill: React.CSSProperties = { borderRadius: 999, background: CL.ink, color: '#fff', padding: '4px 12px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600 };

  return (
    <div className="cl-rise" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderRadius: 18, border: '1px solid ' + CL.border, background: '#fff', padding: '12px 18px' }}>
        <span style={pill}>{row}</span>
        <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink5 }}>×</span>
        <span style={pill}>{col}</span>
        <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 12, color: CL.ink4 }}>Viết hai mạch cho cùng một ô, rồi so sánh</span>
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

      <section aria-label="So sánh trong ô này" style={{ borderRadius: 18, border: ready ? '1px solid ' + CL.border : '1px dashed ' + CL.ink2, background: ready ? CL.panel : '#FCFCFB', padding: '16px 22px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: CL.sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: ready ? CL.ink : CL.ink4 }}>So sánh trong ô này</span>
          {!ready ? (
            <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5 }}>Viết xong cả mạch A và mạch B để so sánh</span>
          ) : (
            <span role="group" aria-label="Bên nào mạnh hơn" style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6 }}>
              {CHOICES.map((c) => {
                const on = v.win === c.win;
                const tone = c.win === 'A' ? DRV.A : c.win === 'B' ? DRV.B : null;
                return (
                  <button key={c.win} type="button" className="cl-btn" aria-pressed={on} onClick={() => set({ win: on ? null : c.win })}
                    style={{ height: 38, padding: '0 16px', borderRadius: 11, border: on ? '1.5px solid ' + (tone ? tone.solid : CL.ink) : '1px solid ' + CL.ink2, background: on ? (tone ? tone.soft : '#fff') : '#fff', color: tone ? tone.text : CL.ink7, fontFamily: CL.sans, fontSize: 13, fontWeight: on ? 700 : 600 }}>{c.label}</button>
                );
              })}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink6, marginRight: 4 }}>Mạnh hơn ở điểm nào?</span>
          {CMP_CRITERIA.map((c) => {
            const on = v.crit.includes(c);
            return (
              <button key={c} type="button" className="cl-btn" disabled={!ready} aria-pressed={on} onClick={() => set({ crit: on ? v.crit.filter((x) => x !== c) : [...v.crit, c] })}
                style={{ borderRadius: 999, border: '1px solid ' + (on ? CL.ink : ready ? CL.ink2 : '#E3E3DE'), background: on ? CL.ink : '#fff', color: on ? '#fff' : ready ? CL.ink7 : '#B5B5AE', padding: '5px 12px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600 }}>{c}</button>
            );
          })}
        </div>
        {ready && (
          <textarea value={v.why} onChange={(e) => set({ why: e.target.value.slice(0, 600) })} rows={2} aria-label="Vì sao bên đó mạnh hơn" placeholder="Bên đó mạnh hơn vì…"
            style={{ display: 'block', width: '100%', minHeight: 52, boxSizing: 'border-box', resize: 'none', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', padding: '12px 16px', fontFamily: CL.serif, fontSize: 15, lineHeight: 1.55, color: CL.ink, outline: 'none', fieldSizing: 'content' } as React.CSSProperties} />
        )}
      </section>
    </div>
  );
}
