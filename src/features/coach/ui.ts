import type { CSSProperties } from 'react';
import { CL } from '../chainlab/constants';

/** The main toolbar action (Kiểm tra, Câu tiếp, Viết bài, Nộp bài): filled brand blue with a darker ring. */
export const primaryBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 10, border: 'none', color: '#fff',
  fontFamily: CL.sans, fontSize: 14, fontWeight: 500, padding: '0 14px', whiteSpace: 'nowrap',
};
