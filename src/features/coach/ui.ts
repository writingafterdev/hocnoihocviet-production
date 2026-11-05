import type { CSSProperties } from 'react';
import { CL } from '../chainlab/constants';

/** Black uppercase toolbar button (Kiểm tra, Câu tiếp, Viết bài, Nộp bài). */
export const primaryBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 5, border: '1px solid ' + CL.ink, background: CL.ink, color: '#fff',
  fontFamily: CL.sans, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 14px',
};
