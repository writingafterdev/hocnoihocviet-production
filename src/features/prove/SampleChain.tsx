'use client';

import { ProBeam } from '@/components/ui/pro-beam';
import { CL } from '../chainlab/constants';
import type { SampleStep } from '@/lib/ai/chain-coach';
import { toolbarBtn } from '../chainlab/ui/primitives';
import { primaryBtn } from '../coach/ui';

const DOT = 17;
const TAG: Record<SampleStep['tag'], { label: string; bg: string; fg: string } | null> = {
  keep: null,
  edit: { label: 'Sửa', bg: '#EEF3FC', fg: '#2F62C4' },
  add: { label: 'Thêm', bg: CL.mintSoft, fg: CL.greenText },
};

/** One row of the small chain: its rail and dot, then the content. */
function Row({ dot, first, last, children }: { dot: React.ReactNode; first?: boolean; last?: boolean; children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', gap: 14 }}>
      <div aria-hidden="true" style={{ position: 'relative', width: DOT, flexShrink: 0 }}>
        <span style={{ position: 'absolute', left: DOT / 2 - 0.5, width: 1, background: CL.ink2, top: first ? 16 : 0, ...(last ? { height: 16 } : { bottom: 0 }) }} />
        <span style={{ position: 'absolute', top: 7.5, left: 0, width: DOT, height: DOT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{dot}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: last ? '5px 0' : '5px 0 12px', display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>{children}</div>
    </li>
  );
}

const plainDot = (bg: string) => <span style={{ width: DOT, height: DOT, boxSizing: 'border-box', borderRadius: 999, border: '4px solid #fff', background: bg }} />;

/**
 * "Kiểm tra" found something: beside the student's chain, a sample chain built on it (their steps kept, edited, or
 * added where one was missing), so the two can be compared. "Sửa mạch ý" hides the edited and added steps (they show as
 * blank lines) so the student writes them on their own; "Hiện các bước mẫu" brings them back for a look.
 */
export function SampleChain({ start, end, steps, hiding, peek, onFix, onPeek }: {
  start: string; end: string; steps: SampleStep[]; hiding: boolean; peek: boolean; onFix: () => void; onPeek: () => void;
}) {
  return (
    <section style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
      <div style={{ minHeight: 46, padding: '0 16px', borderBottom: '1px solid ' + CL.ink1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 99, background: CL.mint }} />
        <span style={{ fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink }}>Mạch ý mẫu</span>
        <span style={{ borderRadius: 5, padding: '3px 7px', background: '#F5F5F5', fontFamily: CL.sans, fontSize: 12, fontWeight: 500, color: CL.ink7 }}>dựa trên mạch ý của bạn</span>
      </div>
      <ol className="cl-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', listStyle: 'none', margin: 0, padding: '14px 16px' }}>
        <Row first dot={plainDot(CL.green)}>
          <span style={{ fontFamily: CL.sans, fontSize: 14, fontWeight: 500, lineHeight: 1.5, color: CL.greenText }}>{start}</span>
        </Row>
        {steps.map((st, k) => {
          const tag = TAG[st.tag];
          const hidden = !!tag && hiding && !peek;
          return (
            <Row key={k} dot={plainDot(CL.ink3)}>
              {hidden ? (
                <span aria-label="Bước đã ẩn" style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
                  <span style={{ height: 9, width: '100%', borderRadius: 99, background: CL.ink1 }} />
                  <span style={{ height: 9, width: '70%', borderRadius: 99, background: CL.ink1 }} />
                </span>
              ) : (
                <span onCopy={(e) => e.preventDefault()} style={{ fontFamily: CL.serif, fontSize: 14, lineHeight: 1.55, color: CL.ink8, userSelect: 'none', WebkitUserSelect: 'none' }}>{st.text}</span>
              )}
              {tag && <span style={{ borderRadius: 5, padding: '2px 7px', background: tag.bg, color: tag.fg, fontFamily: CL.sans, fontSize: 11.5, fontWeight: 500 }}>{tag.label}</span>}
            </Row>
          );
        })}
        <Row last dot={<span style={{ width: 9, height: 9, borderRadius: 2, background: '#B8862B', boxShadow: '0 0 0 4px #fff' }} />}>
          <span style={{ fontFamily: CL.sans, fontSize: 14, fontWeight: 500, lineHeight: 1.5, color: CL.redText }}>{end}</span>
        </Row>
      </ol>
      <div style={{ borderTop: '1px solid ' + CL.ink1, background: CL.panel, padding: '12px 16px', display: 'flex', justifyContent: 'flex-end' }}>
        {hiding
          ? <button type="button" className="cl-btn" onClick={onPeek} aria-pressed={peek} style={toolbarBtn(false)}>{peek ? 'Ẩn các bước mẫu' : 'Hiện các bước mẫu'}</button>
          : <ProBeam><button type="button" className="cl-btn cl-primary" onClick={onFix} style={primaryBtn}>Sửa mạch ý</button></ProBeam>}
      </div>
    </section>
  );
}
