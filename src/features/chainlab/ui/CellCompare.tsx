'use client';

import { CL } from '../constants';
import { CMP_CRITERIA, CMP_CRITERIA_ONLY, cellPair, cellQuestion, type ClaimTally, DRV, driverOf, isWritten, type CellCmp, VERDICT_WORDS, verdictKind } from '../ideamap';
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
  /** Wins over the whole map, for the "best" / "only" claim check. */
  tally: ClaimTally;
}

const EMPTY: CellCmp = { win: null, crit: [], why: '' };

/**
 * The middle panel for a cell of a two-driver map: the chain of driver A and the chain of driver B, one above the other,
 * and under them the student's comparison of the two (who is stronger here, on what grounds, and why).
 */
export function CellCompare({ q, row, col, chains, cmp, onCmp, onCreate, onChange, onDelete, bind, numOf, targets, tally }: CellCompareProps) {
  const spec = useSpec();
  const only = verdictKind(spec) === 'only';
  const words = VERDICT_WORDS[only ? 'only' : 'cmp'];
  const order: ('A' | '=' | 'B')[] = only ? ['B', '=', 'A'] : ['A', '=', 'B'];
  const criteria = only ? CMP_CRITERIA_ONLY : CMP_CRITERIA;
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
          <span style={{ fontFamily: CL.sans, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: ready ? CL.ink : CL.ink4 }}>{only ? 'B có tự đứng được không?' : 'So sánh trong ô này'}</span>
          {!ready ? (
            <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 12.5, color: CL.ink5 }}>Viết xong cả mạch A và mạch B để {only ? 'xét' : 'so sánh'}</span>
          ) : (
            <span role="group" aria-label="Bên nào mạnh hơn" style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6 }}>
              {order.map((w) => {
                const on = v.win === w;
                const tone = only ? (w === 'B' ? { solid: '#17664F', soft: '#DCF5EC', text: '#17664F' } : w === '=' ? { solid: '#B59A2A', soft: '#FFF6DA', text: '#765A00' } : null) : (w === 'A' ? DRV.A : w === 'B' ? DRV.B : null);
                return (
                  <button key={w} type="button" className="cl-btn" aria-pressed={on} onClick={() => set({ win: on ? null : w })}
                    style={{ height: 38, padding: '0 16px', borderRadius: 11, border: on ? '1.5px solid ' + (tone ? tone.solid : CL.ink) : '1px solid ' + CL.ink2, background: on ? (tone ? tone.soft : '#fff') : '#fff', color: tone ? tone.text : CL.ink7, fontFamily: CL.sans, fontSize: 13, fontWeight: on ? 700 : 600 }}>{words[w]}</button>
                );
              })}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: CL.sans, fontSize: 12.5, color: CL.ink6, marginRight: 4 }}>{only ? 'Vì sao B tự đứng được?' : 'Mạnh hơn ở điểm nào?'}</span>
          {criteria.map((c) => {
            const on = v.crit.includes(c);
            return (
              <button key={c} type="button" className="cl-btn" disabled={!ready} aria-pressed={on} onClick={() => set({ crit: on ? v.crit.filter((x) => x !== c) : [...v.crit, c] })}
                style={{ borderRadius: 999, border: '1px solid ' + (on ? CL.ink : ready ? CL.ink2 : '#E3E3DE'), background: on ? CL.ink : '#fff', color: on ? '#fff' : ready ? CL.ink7 : '#B5B5AE', padding: '5px 12px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600 }}>{c}</button>
            );
          })}
        </div>
        {ready && (
          <textarea value={v.why} onChange={(e) => set({ why: e.target.value.slice(0, 600) })} rows={2} aria-label="Vì sao" placeholder={only ? 'B tự đứng được vì…' : 'Bên đó mạnh hơn vì…'}
            style={{ display: 'block', width: '100%', minHeight: 52, boxSizing: 'border-box', resize: 'none', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', padding: '12px 16px', fontFamily: CL.serif, fontSize: 15, lineHeight: 1.55, color: CL.ink, outline: 'none', fieldSizing: 'content' } as React.CSSProperties} />
        )}
      </section>

      {spec.claim && <ClaimCheck claim={spec.claim} tally={tally} />}
    </div>
  );
}

/** What the cells add up to for a "best" / "only" claim. */
function ClaimCheck({ claim, tally: t }: { claim: 'best' | 'only'; tally: ClaimTally }) {
  const only = claim === 'only';
  const good = only && t.b > 0;
  const pill = (bg: string, fg: string, text: string) => <span style={{ borderRadius: 999, background: bg, color: fg, padding: '4px 12px', fontFamily: CL.sans, fontSize: 12, fontWeight: 700 }}>{text}</span>;
  let title: string, body: string;
  if (only) {
    title = t.b > 0 ? 'Không: đã có ' + t.b + ' mạch B đứng vững' : t.eq > 0 ? 'Mới có B một phần' : 'Chưa có mạch B đứng vững';
    body = t.b > 0 ? t.bCells[0] + ' cho thấy B tự đứng được mà không cần A, nên câu "duy nhất" không còn đúng tuyệt đối. Trong bài, bạn có thể nói A vẫn có ích nhưng không phải cách duy nhất, rồi dùng ô này làm ví dụ.'
      : t.eq > 0 ? 'B mới xử lý được một phần. Tìm một ô mà B làm được mà không cần A đi kèm.'
      : 'Chỉ cần một ô mà B tự xử lý được là đề không còn đúng. Thử ô mà A khó với tới.';
  } else {
    title = 'A có phải cách tốt nhất không?';
    const lead = t.done === 0 ? 'Chưa so sánh ô nào. Viết hai mạch rồi so sánh để xem A có thắng không.' : (t.a > t.b ? 'A đang dẫn' : t.b > t.a ? 'B đang dẫn' : 'A và B đang ngang nhau') + '.';
    body = lead + (t.done > 0 && t.bCells.length ? ' B thắng ở ' + t.bCells.slice(0, 3).join(', ') + ': chỗ để thừa nhận mặt trái của A.' : '') + (t.done > 0 && t.done < 4 ? ' Mới so sánh ' + t.done + ' ô, chưa đủ để kết luận "tốt nhất".' : '');
  }
  return (
    <section aria-label="Kiểm tra câu của đề" style={{ borderRadius: 18, border: '1px solid ' + (good ? '#BFE6D7' : '#E2D3A0'), background: good ? '#F2FBF7' : '#FFFCF0', padding: '16px 22px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ borderRadius: 6, background: CL.ink, color: '#fff', padding: '3px 9px', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{only ? 'The only way' : 'The best way'}</span>
        <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 700, color: CL.ink }}>{only ? 'A có phải cách duy nhất không?' : title}</span>
        {only && <span style={{ marginLeft: 'auto' }}>{pill(good ? '#DCF5EC' : t.eq > 0 ? '#FFF6DA' : '#F1F1EE', good ? '#17664F' : t.eq > 0 ? '#765A00' : '#3D3D3A', title)}</span>}
      </div>
      {!only && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {pill(DRV.A.soft, DRV.A.text, 'A hơn ' + t.a + ' ô')}{pill('#F1F1EE', '#3D3D3A', 'Ngang ' + t.eq + ' ô')}{pill(DRV.B.soft, DRV.B.text, 'B hơn ' + t.b + ' ô')}
        </div>
      )}
      <div style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.55, color: CL.ink7 }}>{body}</div>
    </section>
  );
}

