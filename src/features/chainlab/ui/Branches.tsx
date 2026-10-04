'use client';

import { CL } from '../constants';
import type { Branch, Split } from '../types';
import { ClIcon, ClTag } from './primitives';
import { StepList } from './StepList';

/** Scope split: the chain forks into cases after the chosen step, one card per case. */
export function Branches({ split, onChange, onMerge, num, verdict = true }: { split: Split; onChange: (s: Split) => void; onMerge: () => void; num: number; verdict?: boolean }) {
  const setB = (k: number, patch: Partial<Branch>) => onChange({ ...split, branches: split.branches.map((b, j) => (j === k ? { ...b, ...patch } : b)) });
  const add = () => onChange({ ...split, branches: [...split.branches, { label: '', steps: [''], effect: '' }] });
  const remove = (k: number) => onChange({ ...split, branches: split.branches.filter((_, j) => j !== k) });
  return (
    <div style={{ marginTop: 4, marginLeft: 8, borderLeft: '1px solid ' + CL.ink2, paddingLeft: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: CL.sans, fontSize: 12, color: CL.ink6 }}>
          <ClTag kind="Scope" />
          <span>Đổi điều kiện của <b style={{ fontFamily: CL.serif, fontWeight: 600, color: CL.ink, borderBottom: '2px solid #EBCB7A' }}>{split.noun}</b></span>
        </div>
        <button type="button" className="cl-btn cl-link" onClick={onMerge} style={{ fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: CL.ink4 }}>Bỏ tách</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {split.branches.map((b, k) => (
          <div key={k} style={{ borderRadius: 10, border: '1px solid ' + CL.ink2, background: '#fff', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid ' + CL.ink1, background: '#FCFCFB' }}>
              <span style={{ fontFamily: CL.sans, fontSize: 10, fontWeight: 700, color: CL.ink4 }}>{String.fromCharCode(65 + k)}</span>
              <input value={b.label} onChange={(e) => setB(k, { label: e.target.value })} placeholder={split.noun + ' kiểu nào?'} style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: CL.sans, fontSize: 12.5, fontWeight: 600, color: CL.ink }} />
              {split.branches.length > 2 && <button type="button" className="cl-btn cl-del" onClick={() => remove(k)} aria-label="Xoá trường hợp" style={{ color: CL.ink3 }}><ClIcon name="x" size={12} /></button>}
            </div>
            <div style={{ padding: '14px 14px 4px' }}>
              <StepList steps={b.steps} onChange={(steps) => setB(k, { steps })} idPrefix={'b' + k} />
            </div>
            {verdict && (
              <div style={{ padding: '10px 14px 12px', borderTop: '1px solid ' + CL.ink1 }}>
                <span style={{ fontFamily: CL.sans, fontSize: 11, color: CL.ink5 }}>Xếp chip <b style={{ color: CL.ink, fontWeight: 600 }}>{num}{String.fromCharCode(97 + k)}</b> sang một phía trên sợi dây</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {split.branches.length < 4 && <button type="button" className="cl-btn cl-link" onClick={add} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: CL.sans, fontSize: 11, fontWeight: 600, color: CL.ink5 }}><ClIcon name="plus" size={12} />Thêm trường hợp</button>}
    </div>
  );
}
