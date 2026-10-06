/** Idea map: the grid of cells (row × column) a question offers as starting points for chains. Pure helpers. */
import { CL_FIXABLE, CL_IMPACT_AREAS } from './constants';
import { filledSteps, shapeOf } from './model';
import type { Chain, PromptSpec, Question } from './types';

export interface MapExtras { rows: string[]; cols: string[] }

export interface MapRow { key: string; label: string; tag?: string }

export interface MapGrid {
  rows: MapRow[];
  cols: string[];
  /** Hint under a column name, shown only for the selected cell. */
  hint: (col: string) => string;
  rowsAddable: boolean;
  colsAddable: boolean;
  colWord: string;
  rowWord: string;
}

const AREA_HINT: Record<string, string> = Object.fromEntries(CL_IMPACT_AREAS);
const AREA_STEM: Record<string, string> = {
  'Vật chất': 'tốn thêm hay tiết kiệm được gì: tiền, thời gian, công sức?',
  'An toàn': 'ảnh hưởng thế nào đến sức khỏe, sự ổn định hay rủi ro?',
  'Gắn kết & Bản sắc': 'thay đổi gì trong quan hệ với người khác, hoặc cách họ hiểu về chính mình?',
  'Năng lực': 'mở ra hay đóng lại cơ hội học hỏi và kỹ năng nào về sau?',
  'Tự quyết': 'thay đổi khả năng lựa chọn và kiểm soát của họ thế nào?',
};

const short = (s: string, n = 48) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

/** What a solution chain is aimed at: a written cause or problem chain. */
export const causeRows = (spec: PromptSpec, chains: Chain[]): MapRow[] =>
  chains.filter((c) => CL_FIXABLE.includes(shapeOf(spec, c)) && filledSteps(c) > 0).map((c) => ({ key: c.id, label: causeLabel(c), tag: c.level || undefined }));

export const causeLabel = (c: Chain) => short(c.title.trim() || c.steps.find((s) => s.trim())?.trim() || 'Mạch chưa đặt tên');

export function gridFor(spec: PromptSpec, q: Question, chains: Chain[], extras?: MapExtras): MapGrid {
  const ex = extras || { rows: [], cols: [] };
  if (q.shape === 'solution') {
    return { rows: causeRows(spec, chains), cols: [...(spec.stakeholders || []), ...ex.cols], hint: () => '', rowsAddable: false, colsAddable: true, colWord: 'bên khác', rowWord: '' };
  }
  const areas = [...CL_IMPACT_AREAS.map(([l]) => l), ...ex.cols];
  const hint = (c: string) => AREA_HINT[c] || '';
  if (q.shape === 'cause') {
    return { rows: [{ key: 'Cá nhân', label: 'Cá nhân', tag: 'Cá nhân' }, { key: 'Hệ thống', label: 'Hệ thống', tag: 'Hệ thống' }], cols: areas, hint, rowsAddable: false, colsAddable: true, colWord: 'vùng khác', rowWord: '' };
  }
  return { rows: [...(spec.stakeholders || []), ...ex.rows].map((s) => ({ key: s, label: s })), cols: areas, hint, rowsAddable: true, colsAddable: true, colWord: 'vùng khác', rowWord: 'bên liên quan' };
}

/** The question a cell asks. */
export function cellQuestion(q: Question, row: MapRow, col: string): string {
  if (q.shape === 'solution') return col + ' có thể làm gì để xử lý «' + row.label + '»?';
  if (q.shape === 'cause') {
    const h = AREA_HINT[col] ? AREA_HINT[col].replace(/ · /g, ', ') : col;
    return row.key === 'Cá nhân' ? 'Người trong cuộc cần gì về ' + h + ', khiến họ làm vậy?' : 'Cơ chế nào về ' + h + ' đứng sau tất cả?';
  }
  return 'Với ' + row.label + ', điều này ' + (AREA_STEM[col] || 'ảnh hưởng thế nào đến «' + col + '»?');
}

/** Chains started from this cell. */
export const cellChains = (chains: Chain[], q: number, row: string, col: string) => chains.filter((c) => (c.q || 1) === q && c.cell && c.cell.r === row && c.cell.c === col);
