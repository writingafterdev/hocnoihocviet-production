/**
 * The tip panel of ① So sánh: base words grouped by kind, each with a small drawing; a base word's variations open in a
 * strip under the box (tăng ▾ mạnh · nhẹ · đều · gấp đôi …). Nothing is ever disabled: the check answers.
 */
import type { T1Part } from '@/content/task1';
import { BAND, PAIR, RANK, RATIO, SECOND, SHARE, TWO } from './engine';

type Shape = [string, string, number, string, string?];
const GB = '#2F62C4', GG = '#A3A3A3';
const bar = (x: number, h: number, c: string): Shape => ['M' + x + ' 16 L' + x + ' ' + (16 - h), c, 5, 'butt'];
const ln = (d: string, c = GB, w = 1.8): Shape => [d, c, w, 'round'];
const dot = (x: number, y: number): Shape => ['M' + x + ' ' + y + ' L' + (x + 0.01) + ' ' + y, GB, 4.5, 'round'];
const pie = (end: string, large: number): Shape[] => [['M7 9 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0', GG, 1.4, 'round'], ['M14 9 L14 2 A7 7 0 ' + large + ' 1 ' + end + ' Z', GB, 1.4, 'round', '#77A1DD']];

/** One drawing per tip, 28 × 18. */
export const GLYPH: Record<string, Shape[]> = {
  'Tất cả': [bar(7, 8, GB), bar(14, 12, GB), bar(21, 6, GB)],
  'tăng': [ln('M3 14 L10 11 L16 12 L25 4')], 'giảm': [ln('M3 4 L10 8 L16 7 L25 14')],
  'tăng mạnh': [ln('M4 16 L24 2', GB, 2.4)], 'tăng nhẹ': [ln('M3 12 L25 7')], 'tăng đều': [ln('M3 15 L9 15 L9 11 L15 11 L15 7 L21 7 L21 3 L25 3')],
  'giảm mạnh': [ln('M4 2 L24 16', GB, 2.4)], 'giảm nhẹ': [ln('M3 7 L25 12')], 'giảm đều': [ln('M3 3 L9 3 L9 7 L15 7 L15 11 L21 11 L21 15 L25 15')],
  'ổn định': [ln('M3 9 L9 8.4 L16 9.6 L25 9')], 'dao động': [ln('M3 11 L8 5 L13 13 L18 5 L25 10')],
  'đạt đỉnh': [ln('M3 15 L11 10 L16 4 L21 10 L25 12', GG), dot(16, 4)], 'chạm đáy': [ln('M3 4 L11 9 L16 15 L21 9 L25 6', GG), dot(16, 15)],
  'chững lại': [ln('M3 15 L12 6 L25 6')], 'đảo chiều': [ln('M3 15 L14 4 L25 14')], 'phục hồi': [ln('M3 4 L12 14 L25 6')],
  'tăng nhiều nhất': [ln('M3 14 L25 2'), ln('M3 14 L25 10', GG)], 'giảm nhiều nhất': [ln('M3 2 L25 14'), ln('M3 2 L25 7', GG)],
  'gấp đôi': [bar(9, 6, GG), bar(18, 12, GB)], 'gấp ba': [bar(9, 4, GG), bar(18, 13, GB)], 'giảm một nửa': [bar(9, 12, GG), bar(18, 6, GB)],
  'cao hơn': [bar(10, 13, GB), bar(18, 6, GG)], 'thấp hơn': [bar(10, 5, GB), bar(18, 12, GG)],
  'chênh lệch': [bar(8, 13, GG), bar(15, 6, GG), ln('M20 3 L23 3 L23 10 L20 10')],
  'gấp … lần': [bar(10, 14, GB), bar(18, 7, GG), ln('M6 9 L13 9', GB, 1.2)], 'một nửa': [bar(10, 6, GB), bar(18, 12, GG)],
  'gần bằng': [bar(10, 11, GB), bar(18, 12, GG)], 'bằng nhau': [bar(10, 11, GB), bar(18, 11, GB)],
  'cao nhất': [bar(7, 6, GG), bar(14, 13, GB), bar(21, 9, GG)], 'thấp nhất': [bar(7, 10, GG), bar(14, 4, GB), bar(21, 12, GG)],
  'cao thứ hai': [bar(7, 13, GG), bar(14, 10, GB), bar(21, 5, GG)], 'thấp thứ hai': [bar(7, 4, GG), bar(14, 7, GB), bar(21, 13, GG)],
  'nhóm cao nhất': [bar(7, 12, GB), bar(14, 13, GB), bar(21, 5, GG)], 'nhóm thấp nhất': [bar(7, 4, GB), bar(14, 5, GB), bar(21, 13, GG)],
  'trừ': [bar(7, 11, GB), bar(14, 4, GG), bar(21, 11, GB)],
  'vượt qua': [ln('M3 13 L25 5'), ln('M3 6 L25 12', GG)], 'nới rộng': [ln('M3 8.5 L25 2.5'), ln('M3 9.5 L25 15.5', GG)], 'thu hẹp': [ln('M3 2.5 L25 8'), ln('M3 15.5 L25 10', GG)],
  'cùng xu hướng': [ln('M3 10 L10 5 L17 9 L25 3'), ln('M3 15 L10 10 L17 14 L25 8', GG)], 'ngược chiều': [ln('M3 12 L10 5 L17 12 L25 5'), ln('M3 6 L10 13 L17 6 L25 13', GG)],
  'chiếm': pie('20.89 10.22', 0), 'gần như toàn bộ': pie('11.57 2.43', 1), 'phần lớn': pie('8.64 13.5', 1), 'hai phần ba': pie('7.94 12.5', 1), 'gần một nửa': pie('15.22 15.89', 0),
  'một phần ba': pie('20.06 12.5', 0), 'một phần tư': pie('21 9', 0), 'một phần năm': pie('20.66 6.84', 0), 'phần nhỏ nhất': pie('15.81 2.24', 0),
};

/** What each tip needs, shown on hover. */
export const TIP_HINT: Record<string, string> = {
  'tăng': 'một mục ở hai mốc, hoặc bấm tên mục', 'giảm': 'một mục ở hai mốc, hoặc bấm tên mục', 'tăng mạnh': 'tăng nhiều, rõ rệt', 'tăng nhẹ': 'tăng một chút', 'tăng đều': 'mốc nào cũng tăng',
  'giảm mạnh': 'giảm nhiều, rõ rệt', 'giảm nhẹ': 'giảm một chút', 'giảm đều': 'mốc nào cũng giảm', 'ổn định': 'gần như không đổi', 'dao động': 'lên xuống', 'đạt đỉnh': 'điểm cao nhất của một mục',
  'chạm đáy': 'điểm thấp nhất của một mục', 'chững lại': 'đứng yên một lúc', 'đảo chiều': 'đổi chiều', 'phục hồi': 'xuống rồi lên lại', 'tăng nhiều nhất': 'mục tăng nhiều nhất', 'giảm nhiều nhất': 'mục giảm nhiều nhất',
  'gấp đôi': 'lúc sau gấp đôi lúc đầu', 'gấp ba': 'lúc sau gấp ba lúc đầu', 'giảm một nửa': 'lúc sau còn một nửa', 'cao hơn': 'số trước cao hơn số sau, hoặc hai tên mục', 'thấp hơn': 'số trước thấp hơn số sau',
  'chênh lệch': 'hơn kém bao nhiêu', 'gấp … lần': 'số trước gấp mấy lần số sau', 'một nửa': 'số trước bằng nửa số sau', 'gần bằng': 'hai số liệu', 'bằng nhau': 'hai số liệu',
  'cao nhất': 'các số của một mục, hoặc tên mục', 'thấp nhất': 'các số của một mục, hoặc tên mục', 'cao thứ hai': 'đứng thứ hai từ trên xuống', 'thấp thứ hai': 'đứng thứ hai từ dưới lên',
  'nhóm cao nhất': 'không phải nhất, nhưng ở nhóm đầu (one of the highest)', 'nhóm thấp nhất': 'không phải nhất, nhưng ở nhóm cuối (one of the lowest)', 'trừ': 'rồi bấm cột ngoại lệ',
  'vượt qua': 'hai mục', 'nới rộng': 'hai mục', 'thu hẹp': 'hai mục', 'cùng xu hướng': 'hai mục cùng lên cùng xuống', 'ngược chiều': 'hai mục đi ngược nhau', 'chiếm': 'một số liệu',
  'gần như toàn bộ': 'từ 80% trở lên', 'phần lớn': 'hơn một nửa', 'hai phần ba': '60 tới 72%', 'gần một nửa': '40 tới 50%', 'một phần ba': '28 tới 38%', 'một phần tư': '20 tới 30%',
  'một phần năm': '17 tới 23%', 'phần nhỏ nhất': 'phần ít nhất', 'Tất cả': 'cả biểu đồ',
};

export const FAMILY: Record<string, string[]> = {
  'chiếm': ['gần như toàn bộ', 'phần lớn', 'hai phần ba', 'gần một nửa', 'một phần ba', 'một phần tư', 'một phần năm', 'phần nhỏ nhất'],
  'tăng': ['tăng mạnh', 'tăng nhẹ', 'tăng đều', 'gấp đôi', 'gấp ba', 'tăng nhiều nhất'],
  'giảm': ['giảm mạnh', 'giảm nhẹ', 'giảm đều', 'giảm một nửa', 'giảm nhiều nhất'],
  'ổn định': ['chững lại'], 'dao động': ['đảo chiều', 'phục hồi'], 'đạt đỉnh': ['chạm đáy'],
  'cao hơn': ['thấp hơn', 'chênh lệch', 'gấp … lần', 'một nửa'], 'gần bằng': ['bằng nhau'], 'vượt qua': ['nới rộng', 'thu hẹp'], 'cùng xu hướng': ['ngược chiều'],
  'cao nhất': ['cao thứ hai', 'nhóm cao nhất'], 'thấp nhất': ['thấp thứ hai', 'nhóm thấp nhất'],
};
const BASE_OF: Record<string, string> = {};
Object.keys(FAMILY).forEach((b) => { BASE_OF[b] = b; FAMILY[b].forEach((v) => { BASE_OF[v] = b; }); });

/** A tip's family (its base first), limited to what this chart offers. */
export const familyOf = (tip: string, avail?: string[]) => { const b = BASE_OF[tip]; return b ? [b, ...FAMILY[b]].filter((t) => !avail || avail.includes(t)) : null; };

/** Every tip this chart offers, by box: shares, one thing over time, two things, ranks. */
export function tipsFor(parts: T1Part[], single: boolean): string[][] {
  const share: string[] = [], one: string[] = [], two = PAIR.slice(), all = [...RANK, ...SECOND, ...BAND, 'trừ'];
  const add = (list: string[], xs: string[]) => xs.forEach((x) => { if (!list.includes(x)) list.push(x); });
  parts.forEach((p) => {
    if (p.axis.ordered) {
      add(one, ['tăng', 'tăng mạnh', 'tăng nhẹ', 'tăng đều', 'giảm', 'giảm mạnh', 'giảm nhẹ', 'giảm đều', 'ổn định', 'dao động']);
      if (p.axis.labels.length > 2) add(one, ['đạt đỉnh', 'chạm đáy', 'đảo chiều', 'phục hồi', 'chững lại']);
      add(one, [...RATIO, 'tăng nhiều nhất', 'giảm nhiều nhất']); add(two, TWO);
    }
    if (p.derived) add(one, ['tăng nhiều nhất']);
    if (p.share) add(share, SHARE);
  });
  if (single) all.push('Tất cả');
  return [share, one, two, all].filter((b) => b.length);
}

/** The panel: each box shows base words only (a variation shows by itself only when its base isn't offered). */
export function panelOf(boxes: string[][]) {
  const avail = boxes.flat();
  return { avail, boxes: boxes.map((b) => { const out: string[] = []; b.forEach((t) => { const base = BASE_OF[t] && avail.includes(BASE_OF[t]) ? BASE_OF[t] : t; if (!out.includes(base)) out.push(base); }); return out; }) };
}
