import type { CSSProperties } from 'react';
import { CL } from '../chainlab/constants';

/** The main toolbar action (Kiểm tra, Câu tiếp, Viết bài, Nộp bài): filled brand blue with a darker ring. */
export const primaryBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 8, border: 'none', background: '#2F62C4', color: '#fff',
  boxShadow: '0 0 0 1px #2453AE, 0 1px 2px rgba(0,0,0,0.05)', fontFamily: CL.sans, fontSize: 14, fontWeight: 500, padding: '0 14px', whiteSpace: 'nowrap',
};
