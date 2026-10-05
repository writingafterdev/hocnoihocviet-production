import type { Level, Lens, Shape } from './types';

/** Writing-workbench palette (ink track + brand softs). */
export const CL = {
  ink: '#141413', ink8: '#2B2B29', ink7: '#44443F', ink6: '#5C5C56', ink5: '#77776F', ink4: '#9A9A93', ink3: '#BDBDB7', ink2: '#DEDEDA', ink1: '#ECECEA',
  border: '#D6D6D0', mint: '#62DAB1', green: '#1FA97A', mintSoft: '#DCF5EC', greenText: '#17664F', yellowSoft: '#FFF6DA', yellowText: '#765A00', red: '#D5452E', redSoft: '#FBE4E0', redText: '#8B3A35', panel: '#F9FAFC', cream: '#FAF9F5',
  sans: 'var(--font-sans)', serif: 'var(--font-serif)',
};

export const EASE = 'cubic-bezier(.16,1,.3,1)';

export const CL_LENSES: Lens[] = [
  { kind: 'With/Without', q: 'Nếu không có Driver thì stakeholder ra sao? Khác với hiện tại nhiều hay ít?', ph: 'vd: không có khoá học, bố mẹ vẫn học từ ông bà, mạng…' },
  { kind: 'Scope', q: 'Chọn một bước, đổi điều kiện của một danh từ trong đó, rồi xem mũi tên phía sau còn xảy ra không.' },
  { kind: 'Khả thi', q: 'Driver cần gì (tiền, người, thời gian, cơ sở vật chất)? Những thứ đó có đủ không?', ph: 'vd: nếu số người dạy không tăng theo…' },
  { kind: 'Dài hạn', q: '20, 30 năm sau ý này biến mất, yếu đi, giữ nguyên hay tích tụ?', ph: 'vd: thói quen mới có thể giữ lâu…' },
  { kind: 'Quy mô', q: 'Nếu hàng triệu người cùng làm, lợi ích còn không? Có tác hại mới xuất hiện không?', ph: 'vd: ai cũng có bằng thì bằng hết giá trị…' },
];

/** The two types of a cause chain. Each one's question is what the chain answers. */
export const CL_LEVELS: { kind: Level; q: string; bg: string; fg: string }[] = [
  { kind: 'Cá nhân', q: 'Ở mức cá nhân: người trong cuộc chọn gì, và vì sao họ thấy lựa chọn đó hợp lý?', bg: '#E4F5FA', fg: '#1F6E8C' },
  { kind: 'Hệ thống', q: 'Ở mức hệ thống: kinh tế, công nghệ, văn hoá nào đứng sau tất cả?', bg: '#FFEEDA', fg: '#7B4D10' },
];
export const CL_LEVEL_LENSES: Lens[] = CL_LEVELS.map((l) => ({ kind: l.kind, q: l.q }));

export const CL_KIND_STYLE: Record<string, { bg: string; fg: string }> = {
  'With/Without': { bg: '#E4F5FA', fg: '#17667A' },
  'Scope': { bg: CL.yellowSoft, fg: CL.yellowText },
  'Khả thi': { bg: '#F1F1EE', fg: CL.ink7 },
  'Dài hạn': { bg: CL.mintSoft, fg: CL.greenText },
  'Quy mô': { bg: '#FFEEDA', fg: '#7B4D10' },
  'Cá nhân': { bg: '#E4F5FA', fg: '#17667A' },
  // Older saved findings may carry these two kinds; they are no longer offered.
  'Môi trường': { bg: CL.mintSoft, fg: CL.greenText },
  'Thể chế': { bg: '#FFEEDA', fg: '#7B4D10' },
  'Hệ thống': { bg: CL.yellowSoft, fg: CL.yellowText },
};

/** Chips shown by default for each question type. Everything else sits behind "+ Thêm góc nhìn". */
export const CL_SHAPE_LENSES: Record<Shape, string[]> = {
  verdict: ['With/Without', 'Scope', 'Khả thi', 'Dài hạn', 'Quy mô'],
  cause: ['Scope'],
  problem: ['Scope', 'Khả thi', 'Dài hạn', 'Quy mô'],
  planproblem: ['Scope', 'Khả thi', 'Dài hạn', 'Quy mô'],
  effect: ['Scope', 'Khả thi', 'Dài hạn', 'Quy mô'],
  solution: ['Khả thi', 'Dài hạn', 'Quy mô'],
};

export const CL_ALL_LENS_KINDS = ['With/Without', 'Scope', 'Khả thi', 'Dài hạn', 'Quy mô', 'Cá nhân', 'Hệ thống'];

export const CL_SHAPE_LABEL: Record<Shape, string> = { verdict: 'Chọn phía', cause: 'Nguyên nhân', problem: 'Vấn đề', planproblem: 'Vấn đề của kế hoạch', effect: 'Ảnh hưởng', solution: 'Giải pháp' };

/** Question types a solution chain can link to via "Xử lý". */
export const CL_FIXABLE: Shape[] = ['cause', 'problem', 'planproblem'];

/** Shape-specific wording for a lens question. */
export const CL_LENS_Q: Partial<Record<Shape, Record<string, string>>> = {
  solution: {
    'Khả thi': 'Giải pháp cần gì (tiền, người, thời gian, cơ sở vật chất)? Những thứ đó có đủ không?',
    'Dài hạn': '20, 30 năm sau giải pháp này còn tác dụng, yếu đi, hay tạo ra vấn đề mới?',
    'Quy mô': 'Áp dụng cho cả thành phố, cả nước, giải pháp còn chạy không? Có vấn đề mới xuất hiện không?',
  },
  problem: {
    'Khả thi': 'Người gặp vấn đề có tự xoay xở được không (tiền, thời gian, hỗ trợ)? Ai không xoay xở được?',
    'Dài hạn': '20, 30 năm sau vấn đề này biến mất, yếu đi, giữ nguyên hay tích tụ?',
    'Quy mô': 'Khi hàng triệu người cùng gặp, vấn đề có lớn hơn tổng từng người không? Có vấn đề mới xuất hiện không?',
  },
  planproblem: {
    'Khả thi': 'Kế hoạch cần gì (tiền, người, thời gian, cơ sở vật chất)? Thiếu thứ nào thì vấn đề xuất hiện?',
    'Dài hạn': '20, 30 năm sau vấn đề này biến mất, yếu đi, giữ nguyên hay tích tụ?',
    'Quy mô': 'Khi áp dụng cho tất cả mọi người, vấn đề có lớn hơn không? Có vấn đề mới xuất hiện không?',
  },
  effect: {
    'Khả thi': 'Người chịu ảnh hưởng có tự thích nghi được không (tiền, thời gian, hỗ trợ)? Ai không thích nghi được?',
    'Dài hạn': '20, 30 năm sau ảnh hưởng này biến mất, yếu đi, giữ nguyên hay tích tụ?',
    'Quy mô': 'Khi hàng triệu người cùng chịu, ảnh hưởng có lớn hơn tổng từng người không? Có ảnh hưởng mới xuất hiện không?',
  },
};

export const CL_CIRC = ['①', '②', '③', '④'];

/** Short codes for findings on the rope. */
export const CL_ABBR: Record<string, string> = { 'With/Without': 'W/W', 'Scope': 'Scope', 'Khả thi': 'KT', 'Dài hạn': 'DH', 'Quy mô': 'QM' };

export const CL_IMPACT_AREAS: [string, string][] = [
  ['Vật chất', 'tiền · thời gian · công sức'],
  ['An toàn', 'sức khỏe · ổn định · rủi ro'],
  ['Gắn kết & Bản sắc', 'quan hệ · hiểu bản thân'],
  ['Năng lực', 'kiến thức · cơ hội tương lai'],
  ['Tự quyết', 'lựa chọn · kiểm soát · tự chủ'],
];
