/** Idea map: the grid of cells (row × column) a question offers as starting points for chains. Pure helpers. */
import { CL_FIXABLE, CL_IMPACT_AREAS } from './constants';
import { filledSteps, shapeOf } from './model';
import type { Chain, PromptSpec, Question } from './types';

/** The student's comparison of one cell of a two-driver map: who is stronger there, on what grounds, and why. */
export interface CellCmp { win: 'A' | 'B' | '=' | null; crit: string[]; why: string }

export interface MapExtras {
  rows: string[];
  cols: string[];
  /** Prompt stakeholders the student removed from the map. */
  hiddenRows?: string[];
  /** Two-driver maps: comparison per cell, keyed `row|column`. */
  cmp?: Record<string, CellCmp>;
}

/** What a student can say makes one side stronger in a cell. */
export const CMP_CRITERIA = ['Mức độ', 'Số người', 'Kéo dài bao lâu', 'Qua được Scope', 'Khó đảo ngược'];

/** A question with two real drivers to compare (A = `driver`, B = `driver2`). */
export const isCompare = (spec: PromptSpec, q: Question) => q.shape === 'verdict' && !!spec.driver && !!spec.driver2;
export const driverOf = (spec: PromptSpec, drv?: 'A' | 'B' | null) => (drv === 'B' ? spec.driver2 : spec.driver) || '';
/** Colours of the two drivers of a comparison prompt: told apart by lightness as well as hue. */
export const DRV = {
  A: { solid: '#3B4FA0', soft: '#E8EBFA', text: '#2C3C86' },
  B: { solid: '#8A5A00', soft: '#FFF1D6', text: '#7A4E00' },
} as const;
export const cmpKey = (r: string, c: string) => r + '|' + c;

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
  const hidden = ex.hiddenRows || [];
  return { rows: [...(spec.stakeholders || []), ...ex.rows].filter((s) => !hidden.includes(s)).map((s) => ({ key: s, label: s })), cols: areas, hint, rowsAddable: true, colsAddable: true, colWord: 'vùng khác', rowWord: 'bên liên quan' };
}

/** The question a cell asks. */
/** `driver` is named in the question, so the student always knows what is being asked about. */
export function cellQuestion(q: Question, row: MapRow, col: string, driver?: string): string {
  const d = (driver || '').trim();
  if (q.shape === 'solution') return col + ' có thể làm gì để xử lý «' + row.label + '»?';
  if (q.shape === 'cause') {
    const h = AREA_HINT[col] ? AREA_HINT[col].replace(/ · /g, ', ') : col;
    if (d) return row.key === 'Cá nhân' ? 'Người trong cuộc cần gì về ' + h + ', khiến "' + d + '" xảy ra?' : 'Cơ chế nào về ' + h + ' đứng sau "' + d + '"?';
    return row.key === 'Cá nhân' ? 'Người trong cuộc cần gì về ' + h + ', khiến họ làm vậy?' : 'Cơ chế nào về ' + h + ' đứng sau tất cả?';
  }
  return 'Với ' + row.label + ', ' + (d ? 'việc "' + d + '"' : 'điều này') + ' ' + (AREA_STEM[col] || 'ảnh hưởng thế nào đến «' + col + '»?');
}

/** Chains made in one cell of a two-driver map: A first, then B. A chain without a side counts as A. */
export const cellPair = (chains: Chain[], q: number, row: string, col: string): { A?: Chain; B?: Chain } => {
  const mine = cellChains(chains, q, row, col);
  return { A: mine.find((c) => (c.drv || 'A') === 'A'), B: mine.find((c) => c.drv === 'B') };
};
/** A chain is written once it has the driver and at least one step of its own. */
export const isWritten = (c?: Chain) => !!c && filledSteps(c) >= 2;

/** Chains started from this cell. */
export const cellChains = (chains: Chain[], q: number, row: string, col: string) => chains.filter((c) => (c.q || 1) === q && c.cell && c.cell.r === row && c.cell.c === col);
