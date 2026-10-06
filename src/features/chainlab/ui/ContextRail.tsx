'use client';

import { useState } from 'react';
import { CL, CL_CIRC, CL_SHAPE_LABEL } from '../constants';
import { useSpec } from '../SpecContext';
import { ClLabel } from './primitives';

/** The prompt text with its numbered questions (① ②) and their types. */
export function PromptBlock() {
  const spec = useSpec();
  const qs = spec.questions.filter((q) => q.q);
  return (
    <div style={{ border: '1px solid ' + CL.ink3, background: '#fff', padding: '14px 16px' }}>
      <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 13, fontWeight: 600, fontStyle: 'italic', lineHeight: 1.55, color: '#20252D', textWrap: 'pretty' }}>{spec.text}</p>
      {qs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid ' + CL.ink1 }}>
          {qs.map((q) => (
            <div key={q.n} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontFamily: CL.sans, fontSize: 12, lineHeight: 1.45 }}>
              <span style={{ fontSize: 14, color: CL.ink }}>{CL_CIRC[q.n - 1]}</span>
              <span style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: CL.ink5, whiteSpace: 'nowrap' }}>{CL_SHAPE_LABEL[q.shape]}</span>
              <span style={{ color: CL.ink7 }}>{q.q}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Rail header shared by ChainLab and the Writing Desk. */
export function RailTop() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <ClLabel>Writing Task 2</ClLabel>
      <ClLabel color={CL.ink4} style={{ fontSize: 9.5 }}>40 phút</ClLabel>
    </div>
  );
}

/** Left rail in ChainLab: prompt, requirements, driver, stakeholders. (The 5 impact areas are picked on each chain card.) */
export function ContextRail({ bare = false }: { bare?: boolean }) {
  const [hints, setHints] = useState(true);
  const spec = useSpec();
  return (
    <aside style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', ...(bare ? {} : { borderRadius: 18, border: '1px solid ' + CL.border }), background: '#fff' }}>
      <div className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: bare ? 'visible' : 'auto', padding: bare ? '8px 4px 6px' : '26px 26px 30px' }}>
        <RailTop />
        <PromptBlock />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 28 }}>
          <ClLabel color={CL.ink}>Yêu cầu đề bài</ClLabel>
          <button type="button" className="cl-btn" onClick={() => setHints(!hints)} aria-pressed={hints} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: CL.sans, fontSize: 10.5, fontWeight: 600, color: CL.ink5 }}>
            Gợi ý
            <span style={{ position: 'relative', width: 36, height: 20, borderRadius: 999, background: hints ? CL.mint : CL.ink2, transition: 'background .2s' }}>
              <span style={{ position: 'absolute', top: 3, left: 3, width: 14, height: 14, borderRadius: 999, background: '#fff', transform: hints ? 'translateX(16px)' : 'none', transition: 'transform .2s' }} />
            </span>
          </button>
        </div>
        {hints && (
          <div>
            {spec.reqs && spec.reqs.length > 0 && (
              <ol style={{ listStyle: 'none', margin: 0, padding: '14px 0 24px', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '1px solid ' + CL.ink1 }}>
                {spec.reqs.map((r, k) => (
                  <li key={r} style={{ display: 'flex', gap: 12, fontFamily: CL.sans, fontSize: 13, lineHeight: 1.5, color: CL.ink8 }}>
                    <span style={{ width: 20, height: 20, marginTop: 1, borderRadius: 6, background: CL.ink1, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: CL.ink }}>{k + 1}</span>{r}
                  </li>
                ))}
              </ol>
            )}
            {/* In the chains screen (bare) the driver is named in every cell's question and the stakeholders are the map's rows. */}
            {!bare && (<>
            {spec.driver && (
              <section style={{ padding: '24px 0', borderBottom: '1px solid ' + CL.ink1 }}>
                <ClLabel color={CL.ink}>Driver</ClLabel>
                <p style={{ margin: '12px 0 0', fontFamily: CL.sans, fontSize: 16, fontWeight: 700, lineHeight: 1.45, color: '#B07A00', textWrap: 'pretty' }}>{spec.driver}</p>
              </section>
            )}
            <div style={{ height: 24 }} />
            <section style={{ paddingBottom: 8 }}>
              <ClLabel color={CL.ink}>Các bên liên quan</ClLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {(spec.stakeholders || []).map((s) => <span key={s} style={{ borderRadius: 7, border: '1px solid ' + CL.ink2, background: '#fff', padding: '6px 11px', fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: CL.ink8 }}>{s}</span>)}
              </div>
            </section>
            </>)}
          </div>
        )}
      </div>
    </aside>
  );
}
