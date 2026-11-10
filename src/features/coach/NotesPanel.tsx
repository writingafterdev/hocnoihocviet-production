'use client';

import { CL } from '../chainlab/constants';
import { ClLabel } from '../chainlab/ui/primitives';
import { NOTE_STYLE, type CheckResult } from './useCoach';

/** "Nhận xét" after "Kiểm tra": logic and persuasiveness at a glance, then one card per note, linked to the chain. */
export function NotesPanel({ result, fresh, active, onPick, onClose }: { result: CheckResult; fresh: boolean; active: number | null; onPick: (k: number | null) => void; onClose?: () => void }) {
  const jumps = result.placed.filter((n) => n.type === 'jump').length;
  const more = result.placed.length - jumps;
  const tile = (label: string, value: string, ok: boolean, okBg: string, okFg: string, badBg: string, badFg: string) => (
    <div className="co-rise" style={{ flex: 1, minWidth: 0, borderRadius: 12, background: ok ? okBg : badBg, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <ClLabel color={ok ? okFg : badFg}>{label}</ClLabel>
      <span style={{ fontFamily: CL.sans, fontSize: 13.5, fontWeight: 600, color: ok ? okFg : badFg }}>{value}</span>
    </div>
  );
  return (
    <section aria-label="Nhận xét" style={{ flex: '1 1 0', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 54, padding: '0 12px 0 20px', borderBottom: '1px solid ' + CL.ink1 }}>
        <ClLabel color={CL.ink}>Nhận xét</ClLabel>
        {!fresh && <span style={{ fontFamily: CL.sans, fontSize: 11.5, color: CL.ink4 }}>· bạn đã sửa mạch, kiểm tra lại để xem nhận xét mới</span>}
        {onClose && <button type="button" className="cl-btn cl-link" onClick={onClose} style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11, fontWeight: 600, color: CL.ink5, padding: '5px 8px' }}>Ẩn</button>}
      </div>
      <div key={result.snap + result.summary} className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, opacity: fresh ? 1 : 0.55, transition: 'opacity .2s' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {tile('Logic', jumps ? jumps + ' chỗ nhảy bước' : 'Mạch đi liền', !jumps, CL.mintSoft, CL.greenText, CL.redSoft, CL.redText)}
          {tile('Thuyết phục', more ? more + ' chỗ nên thêm' : 'Đủ chi tiết', !more, CL.mintSoft, CL.greenText, CL.yellowSoft, CL.yellowText)}
        </div>
        {result.summary && <p className="co-rise" style={{ ['--d' as string]: '.15s', margin: '2px 2px 4px', fontFamily: CL.sans, fontSize: 13, lineHeight: 1.6, color: CL.ink7 }}>{result.summary}</p>}
        {result.placed.map((n, k) => {
          const st = NOTE_STYLE[n.type];
          const on = active === k && fresh;
          return (
            <button key={k} type="button" className="cl-btn co-slidein" disabled={!fresh} onClick={() => onPick(on ? null : k)} aria-pressed={on}
              style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 7, padding: '12px 14px', borderRadius: 12, border: '1px solid ' + CL.ink1, background: on ? CL.panel : '#fff', transition: 'background-color .2s', ['--d' as string]: (0.3 + k * 0.16).toFixed(2) + 's' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ minWidth: 22, height: 20, padding: '0 6px', borderRadius: 5, background: st.bg, color: st.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700 }}>{k + 1}</span>
                <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 600, color: st.fg }}>{st.label}</span>
                <span style={{ marginLeft: 'auto', fontFamily: CL.sans, fontSize: 11, color: CL.ink4 }}>{n.where}</span>
              </span>
              <span style={{ fontFamily: CL.sans, fontSize: 13, lineHeight: 1.55, color: CL.ink7 }}>{n.text}</span>
            </button>
          );
        })}
        {!result.placed.length && <p style={{ margin: 0, fontFamily: CL.sans, fontSize: 13, lineHeight: 1.6, color: CL.greenText }}>Không có chỗ nào cần sửa. Mạch đi liền từ điểm đầu tới điểm cuối.</p>}
      </div>
    </section>
  );
}
