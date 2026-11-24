/**
 * Task 1 checks, for any chart in the general form (content/task1): cells and groups, the check of one finding,
 * Gợi ý from the top down, why a paragraph's findings belong together, and a template sentence per finding
 * (the AI writes the real guided sentences; these are the fallback).
 *
 * A finding is a row of entries: a number ({k:'val', id:'a.fish.2'}), a group ({k:'group', id:'a>item:fish'}, 'a>col:2', 'a')
 * or a tip ({k:'tip', id:'tăng mạnh'}). "rồi" chains stages along time; "trừ" names exceptions.
 */
import type { T1Item, T1Part, T1Prompt } from '@/content/task1';

export interface Entry { k: 'val' | 'group' | 'tip'; id: string }
export type Row = Entry[];
export interface Cell { id: string; part: string; item: string; ai: number; v: number | null; name: string; col: string; color: string; initial: string }
export interface Verdict { ok: boolean; text: string; note?: { warn: boolean; text: string } | null; fix?: string }
export interface Feature { tip: string; items: string[]; label: string; all?: boolean }
export interface Hint { part: string; ids: string[]; text: string; next: string; feat: Feature; colPair?: boolean; cross?: boolean; opp?: boolean }
export interface Sentence { en: string; vi: string; frame: string; note: string; vocab: string[] }

/* The general engine: cells, groups, checks, hints, paragraph reasons and guided sentences, for any prompt in the form above. */
export var MODS = ['mạnh', 'nhẹ', 'đều'];
export var TREND: string[] = ['tăng', 'giảm', 'ổn định', 'dao động', 'đảo chiều', 'phục hồi', 'chững lại'];
export var POINT: string[] = ['đạt đỉnh', 'chạm đáy'];
export var PAIR: string[] = ['cao hơn', 'thấp hơn', 'chênh lệch', 'gấp … lần', 'một nửa', 'gần bằng', 'bằng nhau'];
export var SHARE: string[] = ['chiếm', 'gần như toàn bộ', 'phần lớn', 'hai phần ba', 'gần một nửa', 'một phần ba', 'một phần tư', 'một phần năm', 'phần nhỏ nhất'];
export var RATIO: string[] = ['gấp đôi', 'gấp ba', 'giảm một nửa'];
export var SECOND: string[] = ['cao thứ hai', 'thấp thứ hai'];
export var RANK: string[] = ['cao nhất', 'thấp nhất'];
export var BAND: string[] = ['nhóm cao nhất', 'nhóm thấp nhất'];
/** The top or bottom group of a column: values nearer the end than the middle (60% sits with 33%, not with 114%). */
function bandOf(vs, low) {
  var s = vs.slice().sort(function (a, b) { return a - b; }), mid = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2, mn = s[0], mx = s[s.length - 1];
  return vs.map(function (v) { return low ? v - mn < mid - v : mx - v < v - mid; });
}
export var TWO: string[] = ['vượt qua', 'nới rộng', 'thu hẹp', 'ngược chiều', 'cùng xu hướng'];
export var MOST: string[] = ['tăng nhiều nhất', 'giảm nhiều nhất'];
/** "tăng mạnh" is one chip for the student; the checks read it as tăng + mạnh. */
export function expandRow(row: Row): Row {
  var out: Row = [];
  row.forEach(function (e) { var m = e.k === 'tip' && /^(tăng|giảm) (mạnh|nhẹ|đều)$/.exec(e.id); if (m) out.push({ k: 'tip', id: m[1] }, { k: 'tip', id: m[2] }); else out.push(e); });
  return out;
}

export function partById(pr: T1Prompt, id: string): T1Part { return pr.parts.filter(function (p) { return p.id === id; })[0]; }
export function itemOf(p: T1Part, id: string): T1Item { return p.items.filter(function (x) { return x.id === id; })[0]; }
export function cellsOf(pr: T1Prompt): Cell[] {
  var out: Cell[] = [];
  pr.parts.forEach(function (p) { p.items.forEach(function (x) { p.data[x.id].forEach(function (v, ai) {
    out.push({ id: p.id + '.' + x.id + '.' + ai, part: p.id, item: x.id, ai: ai, v: v, name: x.name, col: p.axis.labels[ai], color: x.color, initial: x.initial });
  }); }); });
  return out;
}
export function cellById(pr: T1Prompt, id: string): Cell { var s = id.split('.'), p = partById(pr, s[0]), x = itemOf(p, s[1]), ai = +s[2]; return { id: id, part: p.id, item: x.id, ai: ai, v: p.data[x.id][ai], name: x.name, col: p.axis.labels[ai], color: x.color, initial: x.initial }; }

/** Numbers as people read them: 1064000 → "1,06 triệu", 79216 → "79.216", 8.6 → "8,6". */
export function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  var a = Math.abs(v);
  if (a >= 1e6) return String(Math.round(v / 1e4) / 100).replace('.', ',') + ' triệu';
  if (a >= 1e4) return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return String(Math.round(v * 100) / 100).replace('.', ',');
}
function enNum(v) { return Math.abs(v) >= 1000 ? String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(Math.round(v * 100) / 100); }
export function uv(p: T1Part, v: number | null): string { return fmt(v) + p.unit; }
function where(p, ai) { return p.axis.labels[ai] ? ' (' + p.axis.labels[ai] + ')' : ''; }
function axisWord(p) { return p.axis.name || 'cột'; }

/* Groups are paths: "a" (a whole part), "a>item:men", "a>col:3". */
export function groupPart(g: string): string { return g.split('>')[0]; }
export function groupType(g: string): string { var s = g.split('>'); return s.length > 1 ? s[1].split(':')[0] : 'part'; }
export function groupVal(g: string): string | null { var s = g.split('>'); return s.length > 1 ? s[1].split(':')[1] : null; }
function groupCells(pr, g) {
  var p = partById(pr, groupPart(g)), t = groupType(g), v = groupVal(g);
  return cellsOf(pr).filter(function (c) { return c.part === p.id && (t === 'part' || (t === 'item' ? c.item === v : c.ai === +v)); });
}
export function groupLabel(pr: T1Prompt, g: string): string {
  var p = partById(pr, groupPart(g)), t = groupType(g), v = groupVal(g);
  if (t === 'part') return pr.parts.length > 1 ? p.title.replace(/ \(.*\)$/, '') : 'Tất cả';
  if (t === 'item') return itemOf(p, v).name;
  return p.axis.labels[+v] || p.title;
}
function entryPart(e) { return e.k === 'tip' ? null : e.k === 'val' ? e.id.split('.')[0] : groupPart(e.id); }
export function partOfRow(row: Row): string | null { for (var i = 0; i < row.length; i++) { var x = entryPart(row[i]); if (x) return x; } return null; }

/** The figures of one item between two points, missing ones left out (a series that starts later starts at its first figure). */
function seriesStats(p: T1Part, item: string, a: number, b: number) {
  var v = p.data[item].slice(a, b + 1).filter(function (x) { return x !== null && x !== undefined; }) as number[];
  return { v: v, first: v[0], last: v[v.length - 1], d: v.length ? v[v.length - 1] - v[0] : 0 };
}
/** First and last points where an item has a figure. */
function spanOf(p: T1Part, item: string) {
  var d = p.data[item], a = 0, b = d.length - 1;
  while (a < b && (d[a] === null || d[a] === undefined)) a++;
  while (b > a && (d[b] === null || d[b] === undefined)) b--;
  return { a: a, b: b };
}
/** A column's figures, without the missing ones. */
function colVals(p: T1Part, ai: number) { return p.items.map(function (o) { return { item: o.id, v: p.data[o.id][ai] }; }).filter(function (o) { return o.v !== null && o.v !== undefined; }) as { item: string; v: number }[]; }
function turnsOf(v, T) {
  var dirs = []; for (var q = 1; q < v.length; q++) { var dd = v[q] - v[q - 1]; if (Math.abs(dd) >= T) dirs.push(dd > 0 ? 1 : -1); }
  var turns = 0; for (var u = 1; u < dirs.length; u++) if (dirs[u] !== dirs[u - 1]) turns++;
  return { dirs: dirs, turns: turns };
}
function holds(tip, x, y, T) {
  if (tip === 'cao hơn') return x > y;
  if (tip === 'thấp hơn') return x < y;
  if (tip === 'bằng nhau') return Math.abs(x - y) <= T / 2;
  return Math.abs(x - y) <= Math.max(T, Math.max(x, y) * 0.12);
}

/** Check one row of chips against the numbers. */
export function judge(pr: T1Prompt, row: Row): Verdict {
  row = expandRow(row);
  var pid = partOfRow(row); if (!pid) return { ok: false, text: 'Bấm số liệu hoặc tên trên biểu đồ trước.' };
  var p = partById(pr, pid), T = p.tol, A = p.axis, W = axisWord(p);
  if (row.some(function (e) { var x = entryPart(e); return x && x !== pid; })) return { ok: false, text: 'Mỗi ý chỉ so sánh trong cùng một biểu đồ hoặc bảng.' };
  if (row.some(function (e) { return e.k === 'tip' && e.id === 'rồi'; })) return judgeChain(pr, p, row);
  var ex = row.map(function (e) { return e.k === 'tip' && e.id === 'trừ'; }).indexOf(true);
  var main = ex >= 0 ? row.slice(0, ex) : row, after = ex >= 0 ? row.slice(ex + 1) : [];
  var mods = main.filter(function (e) { return e.k === 'tip' && MODS.indexOf(e.id) >= 0; }).map(function (e) { return e.id; });
  var tips = main.filter(function (e) { return e.k === 'tip' && MODS.indexOf(e.id) < 0; });
  if (!tips.length && mods.length) return { ok: false, text: '“' + mods[0] + '” chỉ là mức độ, cần đi cùng “tăng” hoặc “giảm”: thêm một trong hai (vd tăng ' + mods[0] + ').' };
  if (tips.length !== 1) return { ok: false, text: tips.length ? 'Mỗi ý chỉ một cách so sánh (có thể thêm một mức độ cho tăng / giảm).' : 'Còn thiếu cách so sánh: chọn một ô bên dưới, như tăng, cao hơn hay cao nhất.' };
  var tip = tips[0].id;
  if (mods.length && tip !== 'tăng' && tip !== 'giảm') return { ok: false, text: '“' + mods[0] + '” chỉ đi kèm tăng hoặc giảm.' };
  var vals = main.filter(function (e) { return e.k === 'val'; }).map(function (e) { return cellById(pr, e.id); });
  var groups = main.filter(function (e) { return e.k === 'group'; }).map(function (e) { return e.id; });
  var itemGroups = groups.filter(function (g) { return groupType(g) === 'item'; }).map(groupVal);
  var colGroups = groups.filter(function (g) { return groupType(g) === 'col'; }).map(function (g) { return +groupVal(g); });
  var whole = groups.some(function (g) { return groupType(g) === 'part'; });
  var items = []; vals.forEach(function (c) { if (items.indexOf(c.item) < 0) items.push(c.item); }); itemGroups.forEach(function (x) { if (items.indexOf(x) < 0) items.push(x); });
  var name = function (x) { return itemOf(p, x).name; };
  var parentNote = p.parent ? ' của ' + itemOf(partById(pr, p.parent.part), p.parent.item).name.toLowerCase() : '';
  var exceptCols = []; after.forEach(function (e) { if (e.k === 'group' && groupType(e.id) === 'col') exceptCols.push(+groupVal(e.id)); if (e.k === 'val') exceptCols.push(cellById(pr, e.id).ai); });
  var exceptItems = []; after.forEach(function (e) { if (e.k === 'group' && groupType(e.id) === 'item') exceptItems.push(groupVal(e.id)); });
  var gap0 = vals.filter(function (c) { return c.v === null || c.v === undefined; })[0];
  if (gap0) return { ok: false, text: gap0.name + ' không có số liệu' + where(p, gap0.ai) + ': không so được.' };

  // Changes along an ordered axis
  if (TREND.indexOf(tip) >= 0) {
    if (!A.ordered) return { ok: false, text: 'Trục ở đây là ' + W + ', không phải thời gian: không nói “' + tip + '” theo ' + W + '. Dùng cao hơn / thấp hơn, hoặc cao nhất.' };
    var spans = [];
    if (whole && !items.length) p.items.forEach(function (x) { var sp0 = spanOf(p, x.id); spans.push({ item: x.id, a: sp0.a, b: sp0.b }); });
    else if (itemGroups.length && !vals.length) itemGroups.forEach(function (x) { var sp1 = spanOf(p, x); spans.push({ item: x, a: sp1.a, b: sp1.b }); });
    else if (vals.length === 2 && vals[0].item === vals[1].item && vals[0].ai !== vals[1].ai) spans.push({ item: vals[0].item, a: Math.min(vals[0].ai, vals[1].ai), b: Math.max(vals[0].ai, vals[1].ai) });
    else return { ok: false, text: '“' + tip + '” cần một mục ở hai ' + W + ' khác nhau (hoặc bấm tên mục để nói cho cả giai đoạn).' };
    var bad = [], lines = [];
    spans.forEach(function (s) {
      var st = seriesStats(p, s.item, s.a, s.b), ad = Math.abs(st.d), tt = turnsOf(st.v, T), ok = true, real = '';
      var span = name(s.item) + ' ' + A.labels[s.a] + ' → ' + A.labels[s.b] + ' (' + fmt(st.first) + ' → ' + fmt(st.last) + p.unit + ')';
      if (tip === 'tăng' || tip === 'giảm') {
        real = st.d > 0 ? 'tăng' : st.d < 0 ? 'giảm' : 'không đổi'; ok = real === tip;
        if (ok && mods.indexOf('mạnh') >= 0 && !(ad >= 3 * T || (st.first && ad / Math.abs(st.first) >= 0.5))) { ok = false; real = 'chỉ đổi ' + fmt(ad) + p.unit + ', chưa mạnh'; }
        if (ok && mods.indexOf('nhẹ') >= 0 && ad > Math.max(1.2 * T, Math.abs(st.first) * 0.15)) { ok = false; real = 'đổi tới ' + fmt(ad) + p.unit + ', không nhẹ'; }
        if (ok && mods.indexOf('đều') >= 0) { for (var m = 1; m < st.v.length; m++) if ((st.v[m] - st.v[m - 1]) * st.d <= 0) { ok = false; real = 'không đều: ' + st.v.map(fmt).join(' → '); break; } }
      } else if (tip === 'ổn định' || tip === 'chững lại') {
        var lim = tip === 'ổn định' ? T : T / 2; ok = st.v.every(function (x) { return Math.abs(x - st.v[0]) <= lim; }); real = 'đổi quá ' + fmt(lim) + p.unit;
      } else {
        ok = st.v.length >= 3 && (tip === 'phục hồi' ? tt.turns >= 1 && tt.dirs[0] === -1 && tt.dirs[tt.dirs.length - 1] === 1 : tt.turns >= 1);
        real = st.v.length < 3 ? 'không có mốc nào ở giữa' : tt.turns ? 'không xuống rồi lên lại' : 'chỉ đi một chiều';
      }
      (ok ? lines : bad).push(span + (ok ? '' : ': ' + real));
    });
    var what = tip + (mods.length ? ' ' + mods.join(' ') : '');
    if (bad.length && spans.length > 1) return { ok: false, text: (spans.length - bad.length) + '/' + spans.length + ' mục ' + what + '; chưa đúng ở ' + bad.join('; ') + '.' };
    if (bad.length) return { ok: false, text: bad[0] + ', chưa phải ' + what + '.' };
    return { ok: true, text: (spans.length > 1 ? 'Cả ' + spans.length + ' mục đều ' + what + ' (' + A.labels[0] + ' → ' + A.labels[A.labels.length - 1] + ')' : lines[0] + ': ' + what) + ', đúng.' };
  }
  if (POINT.indexOf(tip) >= 0) {
    if (!A.ordered) return { ok: false, text: '“' + tip + '” chỉ dùng khi trục là thời gian.' };
    if (vals.length !== 1) return { ok: false, text: '“' + tip + '” cần một số liệu: bấm điểm ' + (tip === 'đạt đỉnh' ? 'cao' : 'thấp') + ' nhất của mục đó.' };
    var c = vals[0], sv = p.data[c.item], svn = sv.filter(function (x) { return x !== null; }), want = tip === 'đạt đỉnh' ? Math.max.apply(null, svn) : Math.min.apply(null, svn);
    if (c.v !== want) return { ok: false, text: (tip === 'đạt đỉnh' ? 'Đỉnh' : 'Đáy') + ' của ' + c.name + ' là ' + uv(p, want) + where(p, sv.indexOf(want)) + '.' };
    return { ok: true, text: c.name + ' ' + tip + ' ở ' + uv(p, c.v) + where(p, c.ai) + ', đúng.' };
  }
  if (SHARE.indexOf(tip) >= 0) {
    if (!p.share) return { ok: false, text: 'Số ở đây không phải phần của một tổng: dùng cao hơn / cao nhất.' };
    if (vals.length !== 1) return { ok: false, text: '“' + tip + '” cần một số liệu.' };
    var pv = vals[0].v;
    if (tip === 'phần nhỏ nhất') { var colS = p.items.map(function (o) { return p.data[o.id][vals[0].ai]; }), mnS = Math.min.apply(null, colS); if (pv !== mnS) return { ok: false, text: 'Phần nhỏ nhất' + where(p, vals[0].ai) + ' là ' + p.items[colS.indexOf(mnS)].name + ' (' + uv(p, mnS) + ').' }; return { ok: true, text: vals[0].name + ' là phần nhỏ nhất' + parentNote + where(p, vals[0].ai) + ', ' + uv(p, pv) + ': đúng.' }; }
    var rng = { 'gần như toàn bộ': [80, 100], 'phần lớn': [50.01, 100], 'hai phần ba': [60, 72], 'gần một nửa': [40, 50], 'một phần ba': [28, 38], 'một phần tư': [20, 30], 'một phần năm': [17, 23], 'chiếm': [0, 100] }[tip];
    if (pv < rng[0] || pv > rng[1]) return { ok: false, text: uv(p, pv) + ' không phải ' + tip + '.' };
    return { ok: true, text: vals[0].name + ' chiếm ' + uv(p, pv) + parentNote + where(p, vals[0].ai) + (tip === 'chiếm' ? '' : ', tức ' + tip) + ': đúng.' + (p.parent ? ' Nhớ nói rõ “' + parentNote.trim() + '”, không phải của tất cả.' : '') };
  }
  if (RANK.indexOf(tip) >= 0) {
    var hi = tip === 'cao nhất', pick = function (vs) { return hi ? Math.max.apply(null, vs) : Math.min.apply(null, vs); };
    var colOf = function (ai) { return colVals(p, ai); };
    if (items.length !== 1) return { ok: false, text: '“' + tip + '” nói về một mục: bấm các số của cùng một mục, hoặc bấm tên mục.' };
    var x = items[0], cols = vals.length ? vals.map(function (c) { return c.ai; }) : A.labels.map(function (l, i) { return i; }).filter(function (i) { return exceptCols.indexOf(i) < 0; });
    var miss = [];
    cols.forEach(function (ai) { if (p.data[x][ai] === null) return; var col = colOf(ai), w = pick(col.map(function (o) { return o.v; })); if (p.data[x][ai] !== w) miss.push(ai); });
    var colName = function (ai) { return A.labels[ai] || p.title; };
    if (miss.length) {
      var m0 = miss[0], col0 = colOf(m0), w0 = pick(col0.map(function (o) { return o.v; })), who = col0.filter(function (o) { return o.v === w0; })[0];
      if (!vals.length && miss.length === 1 && cols.length > 2) return { ok: false, text: name(x) + ' ' + tip + ' ở ' + (cols.length - 1) + '/' + cols.length + ' ' + W + ', trừ ' + colName(m0) + ' (' + name(who.item) + ' ' + uv(p, w0) + '). Thêm “trừ” rồi bấm ' + colName(m0) + '.', fix: 'trừ' };
      var inBand = cols.every(function (ai) { var col = colOf(ai), b = bandOf(col.map(function (o) { return o.v; }), !hi); return b[col.map(function (o) { return o.item; }).indexOf(x)]; });
      return { ok: false, text: 'Ở ' + colName(m0) + ', ' + tip + ' là ' + name(who.item) + ' (' + uv(p, w0) + '), không phải ' + name(x) + ' (' + uv(p, p.data[x][m0]) + ').' + (inBand ? ' Nhưng ' + name(x) + ' nằm trong nhóm ' + (hi ? 'cao' : 'thấp') + ' nhất: dùng “nhóm ' + tip + '”.' : '') };
    }
    var excNote = exceptCols.length ? ', trừ ' + exceptCols.map(colName).join(', ') : '';
    if (exceptCols.length) { var also = exceptCols.filter(function (ai) { var col = colOf(ai); return p.data[x][ai] === pick(col.map(function (o) { return o.v; })); }); if (also.length) return { ok: false, text: 'Ở ' + also.map(colName).join(', ') + ', ' + name(x) + ' cũng ' + tip + ': không cần “trừ”.' }; }
    if (!vals.length) return { ok: true, text: name(x) + ' ' + tip + (A.labels.length > 1 ? ' ở mọi ' + W + excNote : '') + ': đúng.' };
    return { ok: true, text: name(x) + ' ' + tip + ' ở ' + vals.map(function (c) { return colName(c.ai) + ' (' + uv(p, c.v) + ')'; }).join(' và ') + ': đúng.' };
  }
  if (RATIO.indexOf(tip) >= 0) {
    if (!A.ordered) return { ok: false, text: '“' + tip + '” là thay đổi theo thời gian, mà trục ở đây là ' + W + '. So hai thứ khác nhau thì dùng “gấp … lần”.' };
    var sp = null;
    if (vals.length === 2 && vals[0].item === vals[1].item && vals[0].ai !== vals[1].ai) { var lo = vals[0].ai < vals[1].ai ? vals[0] : vals[1], hi2 = lo === vals[0] ? vals[1] : vals[0]; sp = { item: lo.item, a: lo.ai, b: hi2.ai }; }
    else if (itemGroups.length === 1 && !vals.length) { var sr = spanOf(p, itemGroups[0]); sp = { item: itemGroups[0], a: sr.a, b: sr.b }; }
    if (!sp) return { ok: false, text: '“' + tip + '” cần một mục ở hai mốc (lúc đầu và lúc sau).' };
    var va = p.data[sp.item][sp.a], vb = p.data[sp.item][sp.b], rr = va ? vb / va : 0, wantR = { 'gấp đôi': [1.8, 2.3], 'gấp ba': [2.7, 3.4], 'giảm một nửa': [0.4, 0.6] }[tip];
    var head = name(sp.item) + ' ' + A.labels[sp.a] + ' → ' + A.labels[sp.b] + ' (' + fmt(va) + ' → ' + fmt(vb) + p.unit + ')';
    if (!va) return { ok: false, text: 'Không nói ' + tip + ' khi lúc đầu bằng 0.' };
    if (rr < wantR[0] || rr > wantR[1]) return { ok: false, text: head + ': ' + (rr >= 1 ? 'gấp ' + fmt(Math.round(rr * 10) / 10) + ' lần' : 'còn ' + Math.round(rr * 100) + '%') + ', chưa phải ' + tip + '.' };
    return { ok: true, text: head + ': ' + tip + ', đúng.' };
  }
  if (SECOND.indexOf(tip) >= 0) {
    var hiS = tip === 'cao thứ hai';
    if (items.length !== 1) return { ok: false, text: '“' + tip + '” nói về một mục: bấm số của mục đó, hoặc tên mục.' };
    if (p.items.length < 3) return { ok: false, text: 'Chỉ có ' + p.items.length + ' mục: “thứ hai” cũng là cuối, nói cao hơn / thấp hơn thì rõ hơn.' };
    var xs2 = items[0], colsS = vals.length ? vals.map(function (c) { return c.ai; }) : A.labels.map(function (l, i) { return i; }).filter(function (i) { return exceptCols.indexOf(i) < 0; });
    for (var q2 = 0; q2 < colsS.length; q2++) {
      var ai2 = colsS[q2]; if (p.data[xs2][ai2] === null) continue; var srt = colVals(p, ai2).map(function (o) { return { id: o.item, v: o.v }; }).sort(function (u, w) { return hiS ? w.v - u.v : u.v - w.v; });
      if (p.data[xs2][ai2] !== srt[1].v) { var cnm = A.labels[ai2] && A.labels.length > 1 ? 'Ở ' + A.labels[ai2] + ', ' : ''; return { ok: false, text: cnm + tip + ' là ' + name(srt[1].id) + ' (' + uv(p, srt[1].v) + '), ' + name(xs2) + ' là ' + uv(p, p.data[xs2][ai2]) + '.' }; }
    }
    return { ok: true, text: name(xs2) + ' ' + tip + (vals.length ? ' ở ' + vals.map(function (c) { return (A.labels[c.ai] && A.labels.length > 1 ? A.labels[c.ai] + ' ' : '') + '(' + uv(p, c.v) + ')'; }).join(', ') : A.labels.length > 1 ? ' ở mọi ' + W : '') + ': đúng.' };
  }
  if (BAND.indexOf(tip) >= 0) {
    var lowB = tip === 'nhóm thấp nhất', word = lowB ? 'thấp' : 'cao';
    if (items.length !== 1) return { ok: false, text: '“' + tip + '” nói về một mục: bấm số của mục đó, hoặc tên mục.' };
    var xb = items[0], colsB = vals.length ? vals.map(function (c) { return c.ai; }) : A.labels.map(function (l, i) { return i; });
    var mates = [], outs = [];
    colsB.forEach(function (ai) {
      var col = colVals(p, ai), band = bandOf(col.map(function (o) { return o.v; }), lowB), k = col.map(function (o) { return o.item; }).indexOf(xb);
      if (k < 0) return;
      if (!band[k]) outs.push(ai);
      col.forEach(function (o, j) { if (band[j] && o.item !== xb && mates.indexOf(o.item) < 0) mates.push(o.item); });
    });
    var cn = function (ai) { return A.labels[ai] && A.labels.length > 1 ? ' ở ' + A.labels[ai] : ''; };
    if (outs.length) return { ok: false, text: name(xb) + ' (' + uv(p, p.data[xb][outs[0]]) + cn(outs[0]) + ') không thuộc nhóm ' + word + ' nhất: nó gần mức giữa hơn là gần mức ' + word + ' nhất.' };
    var only = !mates.length;
    return { ok: true, text: name(xb) + ' (' + colsB.map(function (ai) { return uv(p, p.data[xb][ai]); }).join(', ') + ') nằm trong nhóm ' + word + ' nhất' + (only ? '' : ', cùng ' + mates.map(name).join(', ')) + ': đúng. Viết “one of the ' + (lowB ? 'lowest' : 'highest') + '”.' + (only ? ' (Nó là ' + word + ' nhất luôn, nói “' + word + ' nhất” thì rõ hơn.)' : '') };
  }
  if (PAIR.indexOf(tip) >= 0) {
    if (vals.length === 2 && !groups.length) {
      var a = vals[0], b = vals[1], xv = a.v, yv = b.v, gap = Math.round(Math.abs(xv - yv) * 100) / 100;
      var nv = function (c) { return c.name + (a.ai !== b.ai || A.labels.length === 1 ? where(p, c.ai) : '') + ' ' + uv(p, c.v); };
      var note = null;
      if (p.total !== undefined && a.item === b.item && (a.ai === p.total || b.ai === p.total)) note = { warn: true, text: A.labels[p.total] + ' là tổng của các cột kia: so ' + A.labels[p.total] + ' với một phần của nó thì luôn lớn hơn. So Public với Private, hoặc so các nước với nhau.' };
      else if (a.item !== b.item && a.ai !== b.ai && A.labels.length > 1) note = { warn: false, text: 'Khác cả mục và ' + W + ': nói rõ cả hai trong câu.' };
      else if (a.item === b.item) note = { warn: false, text: 'So cùng ' + a.name + ' ở hai ' + W + '.' };
      if (tip === 'cao hơn' || tip === 'thấp hơn') {
        if (!holds(tip, xv, yv, T)) return { ok: false, text: nv(a) + ' ' + (xv === yv ? 'bằng' : tip === 'cao hơn' ? 'thấp hơn' : 'cao hơn') + ' ' + nv(b) + '.', note: note };
        return { ok: true, text: nv(a) + ' ' + tip + ' ' + nv(b) + ', hơn kém ' + fmt(gap) + (p.unit === '%' ? ' điểm %' : p.unit) + ': đúng.', note: note };
      }
      if (tip === 'chênh lệch') return { ok: true, text: nv(a) + ' và ' + nv(b) + ' chênh nhau ' + fmt(gap) + (p.unit === '%' ? ' điểm %' : p.unit) + '.', note: note };
      if (tip === 'gấp … lần') {
        if (!xv || !yv) return { ok: false, text: 'Không nói “gấp mấy lần” khi một bên bằng 0.', note: note };
        var r = xv / yv; if (r < 1.5) return { ok: false, text: nv(a) + ' chỉ gấp ' + fmt(Math.round(r * 10) / 10) + ' lần ' + nv(b) + '; dùng cao hơn thì đúng hơn.', note: note };
        return { ok: true, text: nv(a) + ' gấp khoảng ' + fmt(Math.round(r * 2) / 2) + ' lần ' + nv(b) + ': đúng.', note: note };
      }
      if (tip === 'một nửa') { var r2 = yv ? xv / yv : 0; if (Math.abs(r2 - 0.5) > 0.1) return { ok: false, text: nv(a) + ' là ' + Math.round(r2 * 100) + '% của ' + nv(b) + ', chưa phải một nửa.', note: note }; return { ok: true, text: nv(a) + ' gần bằng một nửa ' + nv(b) + ': đúng.', note: note }; }
      if (!holds(tip, xv, yv, T)) return { ok: false, text: nv(a) + ' và ' + nv(b) + ' chênh nhau ' + fmt(gap) + p.unit + ', chưa ' + tip + '.', note: note };
      return { ok: true, text: nv(a) + ' và ' + nv(b) + ' ' + (tip === 'bằng nhau' ? 'bằng nhau' : 'gần bằng nhau') + ': đúng.', note: note };
    }
    // Two whole groups of one kind: checked in every slice (every column for two items, every item for two columns).
    if (groups.length === 2 && !vals.length && groupType(groups[0]) === groupType(groups[1]) && groupType(groups[0]) !== 'part' && ['cao hơn', 'thấp hơn', 'gần bằng', 'bằng nhau'].indexOf(tip) >= 0) {
      var byItem = groupType(groups[0]) === 'item', g1 = groupVal(groups[0]), g2 = groupVal(groups[1]);
      var slices = byItem ? A.labels.map(function (l, i) { return i; }) : p.items.map(function (o) { return o.id; });
      var sName = function (s) { return byItem ? (A.labels[s] || p.title) : name(s); };
      var excl = byItem ? exceptCols : exceptItems;
      var good = [], fail = [];
      slices.forEach(function (s) {
        var xv2 = byItem ? p.data[g1][s] : p.data[s][+g1], yv2 = byItem ? p.data[g2][s] : p.data[s][+g2];
        if (xv2 === null || yv2 === null) return;
        (holds(tip, xv2, yv2, T) ? good : fail).push(s);
      });
      var head = groupLabel(pr, groups[0]) + ' ' + tip + ' ' + groupLabel(pr, groups[1]), unitW = byItem ? W : 'mục';
      var failNotExcl = fail.filter(function (s) { return excl.indexOf(s) < 0; }), exclHolding = excl.filter(function (s) { return good.indexOf(s) >= 0; });
      if (!byItem && p.total !== undefined && (+g1 === p.total || +g2 === p.total)) return { ok: false, text: A.labels[p.total] + ' là tổng của các cột kia, nên lúc nào cũng lớn hơn từng phần: so Public với Private thì có ý hơn.' };
      if (exclHolding.length) return { ok: false, text: 'Ở ' + exclHolding.map(sName).join(', ') + ', ' + head + ' cũng đúng: không cần “trừ”.' };
      if (failNotExcl.length === 1 && good.length >= 2) return { ok: false, text: head + ' ở ' + good.length + '/' + (good.length + fail.length) + ' ' + unitW + ', trừ ' + sName(failNotExcl[0]) + '. Thêm “trừ” rồi bấm ' + sName(failNotExcl[0]) + '.', fix: 'trừ' };
      if (failNotExcl.length) return { ok: false, text: head + ': chỉ đúng ở ' + (good.length ? good.map(sName).join(', ') : 'không chỗ nào') + '.' };
      return { ok: true, text: head + ' ở mọi ' + unitW + (excl.length ? ', trừ ' + excl.map(sName).join(', ') : '') + ': đúng.' };
    }
    return { ok: false, text: '“' + tip + '” cần hai số liệu, hoặc hai mục cùng loại (bấm hai tên mục, hoặc hai tên cột).' };
  }
  if (TWO.indexOf(tip) >= 0) {
    if (!A.ordered) return { ok: false, text: '“' + tip + '” cần trục thời gian.' };
    if (items.length !== 2) return { ok: false, text: '“' + tip + '” cần hai mục (bấm hai tên mục, hoặc một số của mỗi mục).' };
    var SA = p.data[items[0]], SB = p.data[items[1]], nA = name(items[0]), nB = name(items[1]);
    if (tip === 'vượt qua') {
      var last = -1, lastSign = 0;
      for (var i = 0; i < SA.length; i++) { if (SA[i] === null || SB[i] === null) continue; var sg = SA[i] > SB[i] ? 1 : SA[i] < SB[i] ? -1 : 0; if (!sg) continue; if (lastSign === -1 && sg === 1) return { ok: true, text: nA + ' vượt ' + nB + ' trong khoảng ' + A.labels[last] + ' → ' + A.labels[i] + ': đúng.' }; last = i; lastSign = sg; }
      var always = SA.every(function (v, k) { return v === null || SB[k] === null || v >= SB[k]; });
      return { ok: false, text: always ? nA + ' luôn cao hơn ' + nB + ', nên không có lúc nào “vượt”.' : nA + ' không vượt ' + nB + ' lần nào' + (SB.some(function (v, k) { return v > SA[k]; }) && SA[0] > SB[0] ? ' (' + nB + ' vượt ' + nA + ' thì có)' : '') + '.' };
    }
    if (tip === 'cùng xu hướng') {
      var sm = 0, op = 0;
      for (var k2 = 1; k2 < SA.length; k2++) { if (SA[k2] === null || SA[k2 - 1] === null || SB[k2] === null || SB[k2 - 1] === null) continue; var da2 = SA[k2] - SA[k2 - 1], db2 = SB[k2] - SB[k2 - 1]; if (Math.abs(da2) < T || Math.abs(db2) < T) continue; if (da2 * db2 > 0) sm++; else op++; }
      if (sm >= 2 && sm >= 2 * op) return { ok: true, text: nA + ' và ' + nB + ' cùng lên cùng xuống ở ' + sm + '/' + (sm + op) + ' khoảng: đúng.' };
      return { ok: false, text: nA + ' và ' + nB + ' cùng chiều ' + sm + ' lần, ngược chiều ' + op + ' lần: chưa gọi là cùng xu hướng.' };
    }
    if (tip === 'ngược chiều') {
      var opp = 0, same = 0;
      for (var k = 1; k < SA.length; k++) { if (SA[k] === null || SA[k - 1] === null || SB[k] === null || SB[k - 1] === null) continue; var da = SA[k] - SA[k - 1], db = SB[k] - SB[k - 1]; if (Math.abs(da) < T || Math.abs(db) < T) continue; if (da * db < 0) opp++; else same++; }
      if (opp >= 2 && opp >= 2 * same) return { ok: true, text: nA + ' và ' + nB + ' đi ngược chiều nhau ở ' + opp + '/' + (opp + same) + ' khoảng: đúng.' };
      return { ok: false, text: nA + ' và ' + nB + ' ngược chiều ' + opp + ' lần, cùng chiều ' + same + ' lần: chưa gọi là ngược chiều.' };
    }
    var yrs = []; vals.forEach(function (c) { if (yrs.indexOf(c.ai) < 0) yrs.push(c.ai); });
    if (yrs.length < 2) yrs = [0, A.labels.length - 1];
    yrs.sort(function (u, w) { return u - w; });
    var e1 = Math.abs(SA[yrs[0]] - SB[yrs[0]]), e2 = Math.abs(SA[yrs[1]] - SB[yrs[1]]);
    var real2 = e2 > e1 ? 'nới rộng' : e2 < e1 ? 'thu hẹp' : 'không đổi';
    var txt = 'Khoảng cách ' + nA + '–' + nB + ': ' + fmt(e1) + where(p, yrs[0]) + ' → ' + fmt(e2) + where(p, yrs[1]);
    if (real2 !== tip) return { ok: false, text: txt + ', ' + real2 + ' chứ không ' + tip + '.' };
    return { ok: true, text: txt + ': ' + tip + ', đúng.' };
  }
  if (tip === 'giảm nhiều nhất') {
    if (items.length !== 1) return { ok: false, text: '“giảm nhiều nhất” nói về một mục.' };
    if (!A.ordered) return { ok: false, text: '“giảm nhiều nhất” cần trục thời gian.' };
    var nL = A.labels.length - 1, chL = p.items.map(function (o) { var so = spanOf(p, o.id); return { id: o.id, d: p.data[o.id][so.b] - p.data[o.id][so.a] }; }), worst = chL.slice().sort(function (u, w) { return u.d - w.d; })[0];
    if (worst.d >= 0) return { ok: false, text: 'Không mục nào giảm từ ' + A.labels[0] + ' đến ' + A.labels[nL] + '.' };
    if (worst.id !== items[0]) return { ok: false, text: 'Giảm nhiều nhất (' + A.labels[0] + ' → ' + A.labels[nL] + ') là ' + name(worst.id) + ' (' + fmt(worst.d) + p.unit + ').' };
    return { ok: true, text: name(items[0]) + ' giảm nhiều nhất, ' + fmt(worst.d) + p.unit + ' (' + A.labels[0] + ' → ' + A.labels[nL] + '): đúng.' };
  }
  if (tip === 'tăng nhiều nhất') {
    if (items.length !== 1) return { ok: false, text: '“tăng nhiều nhất” nói về một mục.' };
    var x2 = items[0];
    if (p.derived) {
      var col = p.items.map(function (o) { return p.data[o.id][0]; }), mx = Math.max.apply(null, col);
      if (p.data[x2][0] !== mx) return { ok: false, text: 'Tăng nhiều nhất (theo tỉ lệ) là ' + p.items[col.indexOf(mx)].name + ' (' + uv(p, mx) + ').' };
      return { ok: true, text: name(x2) + ' tăng nhiều nhất theo tỉ lệ, ' + uv(p, mx) + ': đúng.' };
    }
    if (!A.ordered) return { ok: false, text: '“tăng nhiều nhất” cần trục thời gian.' };
    var n = A.labels.length - 1, chg = p.items.map(function (o) { var so = spanOf(p, o.id); return { id: o.id, d: p.data[o.id][so.b] - p.data[o.id][so.a] }; }), best = chg.slice().sort(function (u, w) { return w.d - u.d; })[0];
    if (best.id !== x2) return { ok: false, text: 'Tăng nhiều nhất (' + A.labels[0] + ' → ' + A.labels[n] + ') là ' + name(best.id) + ' (+' + fmt(best.d) + p.unit + '), ' + name(x2) + ' +' + fmt(chg.filter(function (o) { return o.id === x2; })[0].d) + p.unit + '.' };
    return { ok: true, text: name(x2) + ' tăng nhiều nhất, +' + fmt(best.d) + p.unit + ' (' + A.labels[0] + ' → ' + A.labels[n] + '): đúng.' + (p.items.length && p.data[x2][0] && best.d / p.data[x2][0] < 0.5 ? '' : '') };
  }
  return { ok: false, text: '' };
}

/** A chain along time: "15-24 [1984] [1994] tăng mạnh rồi [1996] giảm rồi [2002] đạt đỉnh". Each stage starts where the last ended. */
function stagesOf(row: Row): Row[] {
  var out: Row[] = [[]]; row.forEach(function (e) { if (e.k === 'tip' && e.id === 'rồi') out.push([]); else out[out.length - 1].push(e); });
  return out;
}
function judgeChain(pr: T1Prompt, p: T1Part, row: Row): Verdict {
  var A = p.axis;
  if (!A.ordered) return { ok: false, text: '“rồi” nối các chặng theo thời gian, mà trục ở đây là ' + axisWord(p) + '.' };
  if (row.some(function (e) { return (e.k === 'group' && groupType(e.id) !== 'item') || (e.k === 'tip' && e.id === 'trừ'); })) return { ok: false, text: '“rồi” đi theo từng mốc của một mục: bấm các điểm của mục đó.' };
  var first = row.filter(function (e) { return e.k === 'val'; })[0];
  if (!first) return { ok: false, text: 'Bấm điểm đầu của mục bạn muốn kể.' };
  var actor = cellById(pr, first.id).item, an = itemOf(p, actor).name, S = p.data[actor];
  var stages = stagesOf(row), texts = [], prevEnd = null;
  for (var i = 0; i < stages.length; i++) {
    var st = stages[i], tips = st.filter(function (e) { return e.k === 'tip'; }), main = tips.filter(function (e) { return MODS.indexOf(e.id) < 0; });
    var mine = st.filter(function (e) { return e.k === 'val' && cellById(pr, e.id).item === actor; });
    var objs = []; st.forEach(function (e) { var it2 = e.k === 'val' ? cellById(pr, e.id).item : e.k === 'group' ? groupVal(e.id) : null; if (it2 && it2 !== actor && objs.indexOf(it2) < 0) objs.push(it2); });
    if (!main.length) return { ok: false, text: 'Chặng ' + (i + 1) + ' chưa có cách so sánh: chọn tăng, giảm, đạt đỉnh, vượt qua…' };
    var tip = main[0].id;
    if (objs.length && tip !== 'vượt qua') return { ok: false, text: 'Chặng ' + (i + 1) + ': chỉ “vượt qua” mới nhắc tới đường khác. Người làm hành động trong cả chuỗi vẫn là ' + an + '; muốn kể ' + objs.map(function (x) { return itemOf(p, x).name; }).join(', ') + ' làm gì thì tách thành một ý khác.' };
    if (!mine.length) return { ok: false, text: 'Chặng ' + (i + 1) + ' chưa có điểm của ' + an + ': bấm điểm ' + an + ' ' + (i ? 'đi tới' : 'đầu và điểm cuối') + '.' };
    var cells = mine.map(function (e) { return cellById(pr, e.id); }), end = cells[cells.length - 1];
    if (prevEnd && end.ai <= prevEnd.ai) return { ok: false, text: 'Chặng ' + (i + 1) + ' phải đi tiếp về sau ' + A.labels[prevEnd.ai] + '.' };
    if (tip === 'vượt qua') {
      if (!objs.length) return { ok: false, text: 'Chặng ' + (i + 1) + ': ' + an + ' vượt ai? Bấm tên hoặc một điểm của đường bị vượt.' };
      var s0 = i === 0 ? (cells.length >= 2 ? cells[0].ai : null) : prevEnd.ai;
      if (s0 === null) return { ok: false, text: 'Chặng đầu cần hai điểm của ' + an + ': lúc bắt đầu và lúc vượt.' };
      for (var k = 0; k < objs.length; k++) {
        var B = p.data[objs[k]], bn = itemOf(p, objs[k]).name;
        if (!(S[s0] <= B[s0] && S[end.ai] > B[end.ai])) return { ok: false, text: 'Chặng ' + (i + 1) + ': từ ' + A.labels[s0] + ' tới ' + A.labels[end.ai] + ', ' + an + ' (' + fmt(S[s0]) + ' → ' + fmt(S[end.ai]) + p.unit + ') ' + (S[s0] > B[s0] ? 'đã ở trên ' + bn + ' từ đầu (' + fmt(B[s0]) + p.unit + '), nên không phải “vượt”.' : 'chưa vượt ' + bn + ' (' + fmt(B[s0]) + ' → ' + fmt(B[end.ai]) + p.unit + ').') };
      }
      texts.push(an + ' vượt ' + objs.map(function (x) { return itemOf(p, x).name; }).join(' và ') + ' (' + A.labels[s0] + ' → ' + A.labels[end.ai] + ')');
      prevEnd = end; continue;
    }
    var sv = mine, sub;
    if (POINT.indexOf(tip) >= 0) sub = [sv[sv.length - 1]].concat(tips);
    else {
      var start = i === 0 ? (sv.length >= 2 ? sv[0] : null) : { k: 'val', id: prevEnd.id };
      if (!start) return { ok: false, text: 'Chặng đầu cần hai điểm: điểm bắt đầu và điểm nó tới.' };
      sub = [start, sv[sv.length - 1]].concat(tips);
    }
    var jr = judge(pr, sub);
    if (!jr.ok) return { ok: false, text: 'Chặng ' + (i + 1) + ': ' + jr.text };
    texts.push(jr.text.replace(/, đúng\.$|: đúng\.$/, ''));
    prevEnd = end;
  }
  return { ok: true, text: texts.join(' → rồi ') + '. Cả ' + stages.length + ' chặng đều đúng.' };
}

/** Gợi ý, from the top down for each part: true for all, then who stands out, then one split, then single facts. Each is also a key feature. */
export function hintsOf(pr: T1Prompt): Hint[] {
  var out: Hint[] = [];
  pr.parts.forEach(function (p) {
    var A = p.axis, T = p.tol, n = A.labels.length, W = axisWord(p), nm = function (x) { return itemOf(p, x).name; };
    var ids = function (x: string, cols?: number[]) { return (cols || A.labels.map(function (l, i) { return i; })).map(function (i) { return p.id + '.' + x + '.' + i; }); };
    var allIds = function () { var o = []; p.items.forEach(function (x) { o = o.concat(ids(x.id)); }); return o; };
    var partLabel = pr.parts.length > 1 ? 'bấm tên “' + p.title.replace(/ \(.*\)$/, '') + '”' : 'chọn “Tất cả”';
    if (A.ordered && A.name !== 'tháng' && n >= 2 && p.items.length >= 2) {
      var dirs = p.items.map(function (x) { var sx = spanOf(p, x.id), d = p.data[x.id][sx.b] - p.data[x.id][sx.a]; return { id: x.id, d: Math.abs(d) <= T ? 0 : d > 0 ? 1 : -1 }; });
      var ups = dirs.filter(function (o) { return o.d > 0; }), downs = dirs.filter(function (o) { return o.d < 0; });
      if (ups.length === dirs.length || downs.length === dirs.length) out.push({ part: p.id, ids: allIds(), text: 'có một điều đúng với tất cả: ' + partLabel + ' rồi “' + (ups.length ? 'tăng' : 'giảm') + '”', next: 'nhìn cả biểu đồ trước, xem có điều gì đúng với mọi mục không', feat: { tip: ups.length ? 'tăng' : 'giảm', items: [], all: true, label: 'Tất cả đều ' + (ups.length ? 'tăng' : 'giảm') } });
      else if (dirs.length >= 3) { var maj = ups.length >= downs.length ? ups : downs, odd = dirs.filter(function (o) { return maj.indexOf(o) < 0; }); if (odd.length === 1) out.push({ part: p.id, ids: ids(odd[0].id), text: 'gần như tất cả đều ' + (maj === ups ? 'tăng' : 'giảm') + ', trừ ' + nm(odd[0].id) + ' đang sáng', next: 'tìm cái đi ngược số đông, đó thường là điều đáng nói', feat: { tip: maj === ups ? 'tăng' : 'giảm', items: [nm(odd[0].id)], label: nm(odd[0].id) + ' đi ngược số đông' } }); }
    }
    if (p.items.length >= 3 && n >= 2) ['cao nhất', 'thấp nhất'].forEach(function (tip) {
      p.items.forEach(function (x) {
        var cols = A.labels.map(function (l, i) { return i; }), hit = cols.filter(function (i) { var col = colVals(p, i).map(function (o) { return o.v; }); return p.data[x.id][i] === (tip === 'cao nhất' ? Math.max.apply(null, col) : Math.min.apply(null, col)); });
        if (p.total !== undefined && tip === 'thấp nhất') return;
        if (hit.length === n || (hit.length === n - 1 && (n >= 4 || (n === 3 && !A.ordered)))) {
          var miss = cols.filter(function (i) { return hit.indexOf(i) < 0; });
          out.push({ part: p.id, ids: ids(x.id), text: x.name + ' ' + tip + ' ở mọi ' + W + (miss.length ? ' trừ ' + A.labels[miss[0]] : '') + '. Bấm tên ' + x.name + ', chọn “' + tip + '”' + (miss.length ? ', rồi “trừ” và ' + A.labels[miss[0]] : ''), next: 'xem có mục nào luôn đứng ' + (tip === 'cao nhất' ? 'đầu' : 'cuối') + ' không', feat: { tip: tip, items: [x.name], label: x.name + ' ' + tip + (miss.length ? ' (trừ ' + A.labels[miss[0]] + ')' : '') } });
        }
      });
    });
    if (p.items.length === 2 && n >= 3) {
      var a = p.items[0].id, b = p.items[1].id, aw = A.labels.map(function (l, i) { return i; }).filter(function (i) { return p.data[a][i] > p.data[b][i]; });
      var hiI = aw.length >= n / 2 ? a : b, loI = hiI === a ? b : a, win = A.labels.map(function (l, i) { return i; }).filter(function (i) { return p.data[hiI][i] > p.data[loI][i]; }), lose = A.labels.map(function (l, i) { return i; }).filter(function (i) { return win.indexOf(i) < 0; });
      if (!A.ordered && lose.length <= 1) out.push({ part: p.id, ids: lose.length ? ids(hiI, lose).concat(ids(loI, lose)) : ids(hiI), text: nm(hiI) + ' cao hơn ' + nm(loI) + ' ở mọi ' + W + (lose.length ? ', trừ ' + A.labels[lose[0]] + ' đang sáng' : '') + '. Bấm tên ' + nm(hiI) + ', “cao hơn”, tên ' + nm(loI) + (lose.length ? ', rồi “trừ” và ' + A.labels[lose[0]] : ''), next: 'so hai mục ở mọi ' + W + ' một lượt, rồi tìm chỗ khác', feat: { tip: 'cao hơn', items: [nm(hiI), nm(loI)], label: nm(hiI) + ' cao hơn ' + nm(loI) + (lose.length ? ' (trừ ' + A.labels[lose[0]] + ')' : '') } });
    }
    if (p.kind === 'table' && !A.ordered && n >= 2 && p.items.length >= 2) {
      // Two columns compared over every item (Public vs Private).
      for (var i1 = 0; i1 < n; i1++) for (var i2 = 0; i2 < n; i2++) { if (i1 === i2 || i1 === p.total || i2 === p.total) continue; if (p.items.every(function (o) { return p.data[o.id][i1] > p.data[o.id][i2]; }) && !out.some(function (h) { return h.colPair; })) out.push({ part: p.id, colPair: true, ids: p.items.map(function (o) { return p.id + '.' + o.id + '.' + i1; }), text: A.labels[i1] + ' cao hơn ' + A.labels[i2] + ' ở mọi mục. Bấm tên cột ' + A.labels[i1] + ', “cao hơn”, tên cột ' + A.labels[i2], next: 'so hai cột với nhau, không chỉ từng ô', feat: { tip: 'cao hơn', items: [A.labels[i1], A.labels[i2]], label: A.labels[i1] + ' cao hơn ' + A.labels[i2] + ' ở mọi mục' } }); }
    }
    if (A.ordered && n >= 3) {
      for (var u = 0; u < p.items.length; u++) for (var w = 0; w < p.items.length; w++) {
        if (u === w) continue; var X = p.data[p.items[u].id], Y = p.data[p.items[w].id];
        if (X[0] !== null && Y[0] !== null && X[0] < Y[0] && X[n - 1] > Y[n - 1] && !out.some(function (h) { return h.cross; })) out.push({ part: p.id, cross: true, ids: ids(p.items[u].id).concat(ids(p.items[w].id)), text: p.items[u].name + ' vượt ' + p.items[w].name + '. Bấm hai tên đó và “vượt qua”', next: 'tìm hai đường cắt nhau', feat: { tip: 'vượt qua', items: [p.items[u].name, p.items[w].name], label: p.items[u].name + ' vượt ' + p.items[w].name } });
      }
      for (var u2 = 0; u2 < p.items.length; u2++) for (var w2 = u2 + 1; w2 < p.items.length; w2++) {
        var X2 = p.data[p.items[u2].id], Y2 = p.data[p.items[w2].id], opp = 0, same = 0;
        for (var k = 1; k < n; k++) { if (X2[k] === null || X2[k - 1] === null || Y2[k] === null || Y2[k - 1] === null) continue; var da = X2[k] - X2[k - 1], db = Y2[k] - Y2[k - 1]; if (Math.abs(da) < T || Math.abs(db) < T) continue; if (da * db < 0) opp++; else same++; }
        if (opp >= 3 && opp >= 2 * same && !out.some(function (h) { return h.opp; })) out.push({ part: p.id, opp: true, ids: ids(p.items[u2].id), text: p.items[u2].name + ' và ' + p.items[w2].name + ' đi ngược chiều nhau. Bấm hai tên đó và “ngược chiều”', next: 'xem có đường nào đi ngược những đường khác', feat: { tip: 'ngược chiều', items: [p.items[u2].name, p.items[w2].name], label: p.items[u2].name + ' ngược chiều ' + p.items[w2].name } });
      }
    }
    if (p.share && p.kind === 'pies') A.labels.forEach(function (l, ai) {
      if (ai > 0 && A.ordered) return;
      p.items.forEach(function (x) { var v = p.data[x.id][ai]; if (v > 50 || (v >= 40 && v <= 50)) out.push({ part: p.id, ids: [p.id + '.' + x.id + '.' + ai], text: x.name + ' chiếm ' + (v > 50 ? 'phần lớn' : 'gần một nửa') + where(p, ai) + '. Bấm số đó, chọn “' + (v > 50 ? 'phần lớn' : 'gần một nửa') + '”', next: 'với biểu đồ tròn, tìm phần lớn nhất trước', feat: { tip: v > 50 ? 'phần lớn' : 'gần một nửa', items: [x.name], label: x.name + ' chiếm ' + (v > 50 ? 'phần lớn' : 'gần một nửa') + (p.parent ? ' (của ' + itemOf(partById(pr, p.parent.part), p.parent.item).name.toLowerCase() + ')' : '') } }); });
    });
    if (p.derived) { var col = p.items.map(function (o) { return p.data[o.id][0]; }), mx = Math.max.apply(null, col), xi = p.items[col.indexOf(mx)]; out.push({ part: p.id, ids: [p.id + '.' + xi.id + '.0'], text: xi.name + ' tăng nhiều nhất theo tỉ lệ. Bấm số ' + uv(p, mx) + ', chọn “tăng nhiều nhất”', next: 'ngoài số lớn nhất, xem cái gì tăng nhanh nhất', feat: { tip: 'tăng nhiều nhất', items: [xi.name], label: xi.name + ' tăng nhanh nhất' } }); }
    else if (n === 1 && p.items.length >= 3 && !p.share) { var col2 = p.items.map(function (o) { return p.data[o.id][0]; }), mx2 = Math.max.apply(null, col2), mn2 = Math.min.apply(null, col2), xa = p.items[col2.indexOf(mx2)], xb = p.items[col2.indexOf(mn2)]; out.push({ part: p.id, ids: [p.id + '.' + xb.id + '.0'], text: xb.name + ' thấp nhất (' + uv(p, mn2) + '), ' + xa.name + ' cao nhất. Bấm số của ' + xb.name + ', chọn “thấp nhất”', next: 'với một cột số, tìm số cao nhất và thấp nhất', feat: { tip: 'thấp nhất', items: [xb.name], label: xb.name + ' thấp nhất' } }); }
    if (A.ordered && n >= 4) {
      var big = p.items.map(function (x) { var v = p.data[x.id].filter(function (y) { return y !== null; }); return { id: x.id, r: Math.max.apply(null, v) - Math.min.apply(null, v) }; }).sort(function (u3, w3) { return w3.r - u3.r; })[0], sv = p.data[big.id], pk = sv.indexOf(Math.max.apply(null, sv.filter(function (y) { return y !== null; })));
      if (pk > 0 && pk < n - 1) out.push({ part: p.id, ids: [p.id + '.' + big.id + '.' + pk], text: nm(big.id) + ' đạt đỉnh ở ' + A.labels[pk] + ' rồi giảm. Bấm điểm đang sáng, chọn “đạt đỉnh”', next: 'tìm điểm cao nhất của đường thay đổi nhiều nhất', feat: { tip: 'đạt đỉnh', items: [nm(big.id)], label: nm(big.id) + ' đạt đỉnh ' + A.labels[pk] } });
    }
  });
  return out;
}

/** The kind of comparison a row makes, for paragraph reasons. */
export function kindOf(row: Row): string {
  row = expandRow(row);
  if (row.some(function (e) { return e.k === 'tip' && e.id === 'rồi'; })) return 'trend';
  var tip = (row.filter(function (e) { return e.k === 'tip' && MODS.indexOf(e.id) < 0 && e.id !== 'trừ'; })[0] || {}).id;
  if (TREND.indexOf(tip) >= 0 || POINT.indexOf(tip) >= 0 || RATIO.indexOf(tip) >= 0 || MOST.indexOf(tip) >= 0) return 'trend';
  if (RANK.indexOf(tip) >= 0 || BAND.indexOf(tip) >= 0 || SECOND.indexOf(tip) >= 0) return 'rank';
  if (SHARE.indexOf(tip) >= 0) return 'share';
  if (TWO.indexOf(tip) >= 0) return 'two';
  return 'pair';
}
export function rowItems(pr: T1Prompt, row: Row): string[] {
  var out: string[] = [];
  row.forEach(function (e) {
    if (e.k === 'val') { var c = cellById(pr, e.id); if (out.indexOf(c.name) < 0) out.push(c.name); }
    if (e.k === 'group' && groupType(e.id) === 'item') { var nme = groupLabel(pr, e.id); if (out.indexOf(nme) < 0) out.push(nme); }
  });
  return out;
}
var KIND_TEXT = { trend: 'các thay đổi', rank: 'thứ hạng: cao nhất, thấp nhất', share: 'tỉ lệ của từng phần', two: 'hai mục đặt cạnh nhau', pair: 'so sánh các mục với nhau' };
export function reasonOf(pr: T1Prompt, rows: Row[]): { warn: boolean; text: string } | null {
  if (!rows.length) return null;
  var parts = []; rows.forEach(function (r) { var x = partOfRow(r); if (parts.indexOf(x) < 0) parts.push(x); });
  if (parts.length > 1) return { warn: true, text: 'Đoạn này trộn ' + parts.length + ' biểu đồ / bảng. Với đề hỗn hợp, thường mỗi phần một đoạn.' };
  var kinds = []; rows.forEach(function (r) { var k = kindOf(r); if (kinds.indexOf(k) < 0) kinds.push(k); });
  var lists = rows.map(function (r) { return rowItems(pr, r); }), all = []; lists.forEach(function (l) { l.forEach(function (x) { if (all.indexOf(x) < 0) all.push(x); }); });
  var shared = all.filter(function (x) { return lists.filter(function (l) { return l.indexOf(x) >= 0; }).length > 1; });
  if (lists.some(function (l) { return !l.length; }) && !shared.length) shared = ['cả biểu đồ'];
  if (rows.length === 1) return { warn: false, text: 'Một ý: ' + KIND_TEXT[kinds[0]] + '.' };
  if (kinds.length === 1) return { warn: false, text: 'Cùng một kiểu: ' + KIND_TEXT[kinds[0]] + (all.length ? ' (' + all.join(', ') + ')' : '') + '.' };
  if (shared.length) return { warn: false, text: 'Cùng nói về ' + shared.join(', ') + ', từ nhiều phía.' };
  return { warn: true, text: 'Đoạn này kể hai chuyện không dính nhau (' + lists.map(function (l) { return l.join(', ') || 'cả biểu đồ'; }).join(' / ') + '). Thử tách ra, hoặc tìm điểm chung.' };
}

export function rowKey(row: Row): string {
  var r = row.map(function (e) { return e.k + ':' + e.id; });
  var ti = r.indexOf('tip:thấp hơn');
  if (ti >= 0) { var l = r.slice(0, ti), rr = r.slice(ti + 1); r = rr.concat(['tip:cao hơn']).concat(l); }
  return r.join('|');
}
/** Tổng quan takes only the big picture: a group, without its numbers. */
export function bigPicture(row: Row): boolean { return row.some(function (e) { return e.k === 'group'; }) && !row.some(function (e) { return e.k === 'val'; }); }

/* ③ Viết có hướng dẫn: one sentence per finding, from templates (the real build asks the AI once per plan). */
var ADV = { 'mạnh': ['sharply', 'mạnh'], 'nhẹ': ['slightly', 'nhẹ'], 'đều': ['steadily', 'đều'] };
export function sentenceOf(pr: T1Prompt, row: Row, overview: boolean): Sentence {
  row = expandRow(row);
  var pid = partOfRow(row), p = partById(pr, pid), A = p.axis;
  var ex = row.map(function (e) { return e.k === 'tip' && e.id === 'trừ'; }).indexOf(true), main = ex >= 0 ? row.slice(0, ex) : row, after = ex >= 0 ? row.slice(ex + 1) : [];
  var tip = (main.filter(function (e) { return e.k === 'tip' && MODS.indexOf(e.id) < 0; })[0] || {}).id, mod = (main.filter(function (e) { return e.k === 'tip' && MODS.indexOf(e.id) >= 0; })[0] || {}).id;
  var vals = main.filter(function (e) { return e.k === 'val'; }).map(function (e) { return cellById(pr, e.id); });
  var groups = main.filter(function (e) { return e.k === 'group'; }).map(function (e) { return e.id; });
  var at = function (ai) { var l = A.en ? A.en[ai] : A.labels[ai]; return l && A.labels.length > 1 ? (A.prep ? A.prep + ' ' : 'for ') + l : ''; };
  var lab = function (ai) { return A.en ? A.en[ai] : A.labels[ai]; };
  var num = function (v) { return enNum(v) + p.unitEn; };
  var gname = function (g) { return groupType(g) === 'part' ? 'all of the figures' : groupLabel(pr, g); };
  var subj = groups.length ? gname(groups[0]) : vals.length ? vals[0].name : '';
  var exc = after.map(function (e) { return e.k === 'group' ? groupLabel(pr, e.id) : cellById(pr, e.id).col; }).join(' and ');
  var excEn = exc ? ', except ' + (A.prep === 'in' ? 'in ' : 'for ') + exc : '', excVi = exc ? ', trừ ' + exc : '';
  var parentEn = p.parent ? ' of ' + itemOf(partById(pr, p.parent.part), p.parent.item).name.toLowerCase() : '';
  var s = { en: '', vi: '', frame: '', note: '', vocab: [] };
  var up = tip === 'tăng', adv = mod ? ADV[mod] : null;
  var span = function () {
    if (vals.length === 2) { var a = vals[0].ai < vals[1].ai ? vals[0] : vals[1], b = a === vals[0] ? vals[1] : vals[0]; return { a: a.ai, b: b.ai, va: a.v, vb: b.v, item: a.item }; }
    var it0 = groups.length && groupType(groups[0]) === 'item' ? groupVal(groups[0]) : p.items[0].id, so = spanOf(p, it0); return { a: so.a, b: so.b, va: p.data[it0][so.a], vb: p.data[it0][so.b], item: it0 };
  };
  if (!overview && row.some(function (e) { return e.k === 'tip' && e.id === 'rồi'; })) return chainSentence(pr, p, row);
  if (overview) {
    if (tip === 'tăng' || tip === 'giảm') { s.en = 'Overall, ' + subj + ' ' + (up ? 'rose' : 'fell') + ' over the period.'; s.frame = 'Overall, [S] [V2] over the period.'; s.vocab = [up ? 'rose' : 'fell', 'over the period']; s.vi = 'Nhìn chung, ' + subj + ' ' + tip + ' trong cả giai đoạn.'; }
    else if (RANK.indexOf(tip) >= 0) { s.en = subj + ' had the ' + (tip === 'cao nhất' ? 'highest' : 'lowest') + ' figures ' + (A.labels.length > 1 ? 'throughout' : 'of all') + excEn + '.'; s.frame = '[S] had the [adj-est] figures throughout.'; s.vocab = [tip === 'cao nhất' ? 'the highest figures' : 'the lowest figures', 'throughout']; s.vi = subj + ' luôn ' + tip + excVi + '.'; }
    else if (PAIR.indexOf(tip) >= 0 && groups.length === 2) { s.en = 'Overall, ' + gname(groups[0]) + ' was ' + (tip === 'thấp hơn' ? 'lower' : tip === 'cao hơn' ? 'higher' : 'similar') + (tip === 'cao hơn' || tip === 'thấp hơn' ? ' than ' : ' to ') + gname(groups[1]) + excEn + '.'; s.frame = 'Overall, [S] was [adj-er] than [O], except [mốc].'; s.vocab = ['was higher than', 'except']; s.vi = 'Nhìn chung, ' + gname(groups[0]) + ' ' + tip + ' ' + gname(groups[1]) + excVi + '.'; }
    else if (tip === 'vượt qua') { var it2 = rowItems(pr, row); s.en = it2[0] + ' overtook ' + it2[1] + ' during the period.'; s.frame = '[S] overtook [O] during the period.'; s.vocab = ['overtook', 'during the period']; s.vi = it2[0] + ' vượt ' + it2[1] + ' trong giai đoạn này.'; }
    else if (tip === 'cùng xu hướng') { var it4 = rowItems(pr, row); s.en = it4[0] + ' followed a similar pattern to ' + it4[1] + '.'; s.frame = '[S] followed a similar pattern to [O].'; s.vocab = ['a similar pattern']; s.vi = it4[0] + ' đi cùng xu hướng với ' + it4[1] + '.'; }
    else if (tip === 'ngược chiều') { var it3 = rowItems(pr, row); s.en = it3[0] + ' followed the opposite pattern to ' + it3[1] + '.'; s.frame = '[S] followed the opposite pattern to [O].'; s.vocab = ['the opposite pattern']; s.vi = it3[0] + ' đi ngược chiều với ' + it3[1] + '.'; }
    else { s.en = 'Overall, ' + subj + ' stood out.'; s.frame = 'Overall, [S] stood out.'; s.vocab = ['stood out']; s.vi = 'Nhìn chung, ' + subj + ' nổi bật nhất.'; }
    s.note = 'Tổng quan: nói điều lớn nhất, không có số.';
    return s;
  }
  if (tip === 'tăng' || tip === 'giảm') {
    if (groups.length && groupType(groups[0]) === 'part') { s.en = 'All of the figures ' + (up ? 'rose' : 'fell') + ' between ' + lab(0) + ' and ' + lab(A.labels.length - 1) + '.'; s.frame = 'All of the figures [V2] between [mốc] and [mốc].'; s.vocab = [up ? 'rose' : 'fell']; s.vi = 'Tất cả đều ' + tip + ' từ ' + A.labels[0] + ' đến ' + A.labels[A.labels.length - 1] + '.'; }
    else { var sp = span(), nm = itemOf(p, sp.item).name, verb = (up ? 'rose' : 'fell') + (adv ? ' ' + adv[0] : ''); s.en = nm + ' ' + verb + ' from ' + num(sp.va) + ' ' + at(sp.a) + ' to ' + num(sp.vb) + ' ' + at(sp.b) + '.'; s.frame = '[S] [V2]' + (adv ? ' [adv]' : '') + ' from [số] ' + (A.prep || 'in') + ' [mốc] to [số] ' + (A.prep || 'in') + ' [mốc].'; s.vocab = [verb]; s.vi = nm + ' ' + tip + (adv ? ' ' + adv[1] : '') + ' từ ' + uv(p, sp.va) + ' (' + A.labels[sp.a] + ') ' + (up ? 'lên ' : 'xuống ') + uv(p, sp.vb) + ' (' + A.labels[sp.b] + ').'; s.note = 'from … to …: mức trước và mức sau khi thay đổi.'; }
  } else if (tip === 'ổn định' || tip === 'chững lại') { var sp2 = span(), nm2 = itemOf(p, sp2.item).name; s.en = nm2 + ' ' + (tip === 'ổn định' ? 'remained stable' : 'levelled off') + ' at around ' + num(sp2.va) + ' between ' + lab(sp2.a) + ' and ' + lab(sp2.b) + '.'; s.frame = '[S] ' + (tip === 'ổn định' ? 'remained stable' : 'levelled off') + ' at around [số] between [mốc] and [mốc].'; s.vocab = [tip === 'ổn định' ? 'remained stable' : 'levelled off', 'at around']; s.vi = nm2 + ' ' + tip + ' quanh ' + uv(p, sp2.va) + '.'; }
  else if (['dao động', 'đảo chiều', 'phục hồi'].indexOf(tip) >= 0) {
    var sp3 = span(), nm3 = itemOf(p, sp3.item).name, seg = p.data[sp3.item].slice(sp3.a, sp3.b + 1), mn = Math.min.apply(null, seg), mx = Math.max.apply(null, seg);
    if (tip === 'dao động') { s.en = nm3 + ' fluctuated between ' + num(mn) + ' and ' + num(mx) + ' from ' + lab(sp3.a) + ' to ' + lab(sp3.b) + '.'; s.frame = '[S] fluctuated between [số] and [số] from [mốc] to [mốc].'; s.vocab = ['fluctuated between']; s.vi = nm3 + ' lên xuống trong khoảng ' + uv(p, mn) + ' đến ' + uv(p, mx) + '.'; }
    else { var lo = sp3.a + seg.indexOf(mn); s.en = nm3 + ' dropped to ' + num(mn) + ' ' + at(lo) + ' before recovering to ' + num(sp3.vb) + ' ' + at(sp3.b) + '.'; s.frame = '[S] dropped to [số] in [mốc] before [V-ing] to [số] in [mốc].'; s.vocab = ['dropped to', 'before recovering']; s.vi = nm3 + ' giảm xuống ' + uv(p, mn) + ' (' + A.labels[lo] + ') rồi tăng lại lên ' + uv(p, sp3.vb) + ' (' + A.labels[sp3.b] + ').'; }
  } else if (POINT.indexOf(tip) >= 0) { var c = vals[0]; s.en = c.name + (tip === 'đạt đỉnh' ? ' peaked at ' : ' fell to a low of ') + num(c.v) + ' ' + at(c.ai) + '.'; s.frame = '[S] ' + (tip === 'đạt đỉnh' ? 'peaked at' : 'fell to a low of') + ' [số] ' + (A.prep || 'in') + ' [mốc].'; s.vocab = [tip === 'đạt đỉnh' ? 'peaked at' : 'fell to a low of']; s.vi = c.name + ' ' + tip + ' ở ' + uv(p, c.v) + where(p, c.ai) + '.'; }
  else if (SHARE.indexOf(tip) >= 0) { var c2 = vals[0], phr = { 'gần như toàn bộ': 'made up the vast majority' + parentEn + ', at ', 'hai phần ba': 'made up about two thirds' + parentEn + ', at ', 'một phần năm': 'made up about a fifth' + parentEn + ', at ', 'phần nhỏ nhất': 'made up the smallest proportion' + parentEn + ', at ', 'chiếm': 'accounted for ', 'phần lớn': 'made up the majority' + parentEn + ', at ', 'gần một nửa': 'accounted for almost half' + parentEn + ', at ', 'một phần ba': 'made up about a third' + parentEn + ', at ', 'một phần tư': 'made up about a quarter' + parentEn + ', at ' }[tip]; s.en = c2.name + ' ' + phr + num(c2.v) + (tip === 'chiếm' ? parentEn : '') + (at(c2.ai) ? ' ' + at(c2.ai) : '') + '.'; s.frame = '[S] ' + phr.trim() + ' [số]' + (at(c2.ai) ? ' in [mốc]' : '') + '.'; s.vocab = [phr.split(',')[0].trim()]; s.vi = c2.name + ' chiếm ' + uv(p, c2.v) + (p.parent ? ' của ' + itemOf(partById(pr, p.parent.part), p.parent.item).name.toLowerCase() : '') + where(p, c2.ai) + '.'; s.note = p.parent ? 'Nói rõ đây là phần của ' + itemOf(partById(pr, p.parent.part), p.parent.item).name.toLowerCase() + ', không phải của tất cả.' : ''; }
  else if (RANK.indexOf(tip) >= 0) {
    var adj = tip === 'cao nhất' ? 'highest' : 'lowest';
    if (vals.length) { s.en = vals[0].name + ' was the ' + adj + (at(vals[0].ai) ? ' ' + vals.map(function (x) { return at(x.ai); }).join(' and ') : '') + ', at ' + vals.map(function (x) { return num(x.v); }).join(' and ') + '.'; s.frame = '[S] was the ' + adj + (at(vals[0].ai) ? ' in [mốc]' : '') + ', at [số].'; s.vi = vals[0].name + ' ' + tip + ' ở ' + vals.map(function (x) { return (x.col || '') + ' (' + uv(p, x.v) + ')'; }).join(' và ') + '.'; }
    else { s.en = subj + ' was the ' + adj + ' in every ' + (A.name === 'năm' ? 'year' : A.name === 'tháng' ? 'month' : 'category') + excEn + '.'; s.frame = '[S] was the ' + adj + ' in every [N], except [mốc].'; s.vi = subj + ' ' + tip + ' ở mọi ' + axisWord(p) + excVi + '.'; }
    s.vocab = ['the ' + adj];
  } else if (RATIO.indexOf(tip) >= 0) {
    var spR = span(), nmR = itemOf(p, spR.item).name, vR = { 'gấp đôi': 'doubled', 'gấp ba': 'tripled', 'giảm một nửa': 'halved' }[tip];
    s.en = nmR + ' ' + vR + ', ' + (tip === 'giảm một nửa' ? 'falling' : 'rising') + ' from ' + num(spR.va) + ' ' + at(spR.a) + ' to ' + num(spR.vb) + ' ' + at(spR.b) + '.'; s.frame = '[S] ' + vR + ', [V-ing] from [số] in [mốc] to [số] in [mốc].'; s.vocab = [vR]; s.vi = nmR + ' ' + tip + ', từ ' + uv(p, spR.va) + ' (' + A.labels[spR.a] + ') ' + (tip === 'giảm một nửa' ? 'xuống ' : 'lên ') + uv(p, spR.vb) + ' (' + A.labels[spR.b] + ').';
  } else if (SECOND.indexOf(tip) >= 0) {
    var adj2 = tip === 'cao thứ hai' ? 'second highest' : 'second lowest';
    if (vals.length) { s.en = vals[0].name + ' was the ' + adj2 + (at(vals[0].ai) ? ' ' + at(vals[0].ai) : '') + ', at ' + num(vals[0].v) + '.'; s.frame = '[S] was the ' + adj2 + ' in [mốc], at [số].'; s.vi = vals[0].name + ' ' + tip + ', ' + uv(p, vals[0].v) + where(p, vals[0].ai) + '.'; }
    else { s.en = subj + ' was the ' + adj2 + ' throughout.'; s.frame = '[S] was the ' + adj2 + ' throughout.'; s.vi = subj + ' luôn ' + tip + '.'; }
    s.vocab = ['the ' + adj2];
  } else if (BAND.indexOf(tip) >= 0) {
    var adjB = tip === 'nhóm cao nhất' ? 'highest' : 'lowest', nmB = vals.length ? vals[0].name : subj, what = p.derived ? ' growth rates' : '';
    s.en = nmB + ' had one of the ' + adjB + what + (vals.length ? ', at ' + num(vals[0].v) + (at(vals[0].ai) ? ' ' + at(vals[0].ai) : '') : '') + '.'; s.frame = '[S] had one of the ' + adjB + what + ', at [số].'; s.vocab = ['one of the ' + adjB]; s.vi = nmB + ' nằm trong nhóm ' + (adjB === 'highest' ? 'cao' : 'thấp') + ' nhất' + (vals.length ? ', ' + uv(p, vals[0].v) : '') + '.'; s.note = 'one of the + so sánh nhất + danh từ số nhiều.';
  } else if (PAIR.indexOf(tip) >= 0) {
    if (vals.length === 2) {
      var a = vals[0], b = vals[1], diffCol = a.ai !== b.ai && A.labels.length > 1, ph = function (x) { return x.name + (diffCol ? ' ' + at(x.ai) : ''); }, ctx = !diffCol && a.col ? ' ' + at(a.ai) : '';
      if (tip === 'cao hơn' || tip === 'thấp hơn') { s.en = 'At ' + num(a.v) + ', ' + ph(a) + ' was ' + (tip === 'cao hơn' ? 'higher' : 'lower') + ' than ' + ph(b) + ctx + ', at ' + num(b.v) + '.'; s.frame = 'At [số], [S] was [adj-er] than [O] in [mốc], at [số].'; s.vocab = [tip === 'cao hơn' ? 'was higher than' : 'was lower than']; }
      else if (tip === 'gấp … lần') { s.en = ph(a) + ' (' + num(a.v) + ') was about ' + enNum(Math.round(a.v / b.v * 2) / 2) + ' times as high as ' + ph(b) + ctx + ' (' + num(b.v) + ').'; s.frame = '[S] ([số]) was about [n] times as high as [O] ([số]).'; s.vocab = ['times as high as']; }
      else if (tip === 'một nửa') { s.en = 'At ' + num(a.v) + ', ' + ph(a) + ' was about half the figure for ' + ph(b) + ctx + ' (' + num(b.v) + ').'; s.frame = 'At [số], [S] was about half the figure for [O] ([số]).'; s.vocab = ['half the figure for']; }
      else if (tip === 'chênh lệch') { s.en = 'There was a gap of ' + enNum(Math.round(Math.abs(a.v - b.v) * 100) / 100) + p.unitEn + ' between ' + ph(a) + ' and ' + ph(b) + ctx + '.'; s.frame = 'There was a gap of [số] between [S] and [O].'; s.vocab = ['a gap of']; }
      else { s.en = ph(a) + ' and ' + ph(b) + ' were ' + (tip === 'bằng nhau' ? 'the same' : 'almost the same') + ctx + ', at ' + num(a.v) + (a.v === b.v ? '' : ' and ' + num(b.v)) + '.'; s.frame = '[S] and [O] were ' + (tip === 'bằng nhau' ? 'the same' : 'almost the same') + ' in [mốc], at [số].'; s.vocab = [tip === 'bằng nhau' ? 'were the same' : 'almost the same']; }
      s.vi = (tip === 'bằng nhau' || tip === 'gần bằng') ? a.name + (diffCol ? where(p, a.ai) : '') + ' và ' + b.name + (diffCol ? where(p, b.ai) : '') + ' ' + tip + ', ' + uv(p, a.v) + (a.v === b.v ? '' : ' và ' + uv(p, b.v)) + (!diffCol && a.col ? where(p, a.ai) : '') + '.' : a.name + (diffCol ? where(p, a.ai) : '') + ' ' + uv(p, a.v) + ' ' + tip + ' ' + b.name + (diffCol ? where(p, b.ai) : '') + ' ' + uv(p, b.v) + (!diffCol && a.col ? where(p, a.ai) : '') + '.';
    } else { s.en = gname(groups[0]) + ' was ' + (tip === 'thấp hơn' ? 'lower' : 'higher') + ' than ' + gname(groups[1]) + ' in every case' + excEn + '.'; s.frame = '[S] was [adj-er] than [O] in every case, except [mốc].'; s.vocab = ['in every case', 'except']; s.vi = gname(groups[0]) + ' ' + tip + ' ' + gname(groups[1]) + ' ở mọi chỗ' + excVi + '.'; }
  } else if (TWO.indexOf(tip) >= 0) {
    var its = rowItems(pr, row);
    if (tip === 'vượt qua') { s.en = its[0] + ' overtook ' + its[1] + (vals.length ? ', reaching ' + num(vals[vals.length - 1].v) + ' ' + at(vals[vals.length - 1].ai) : ' during the period') + '.'; s.frame = '[S] overtook [O], reaching [số] in [mốc].'; s.vocab = ['overtook']; s.vi = its[0] + ' vượt ' + its[1] + '.'; }
    else if (tip === 'cùng xu hướng') { s.en = its[0] + ' followed a similar pattern to ' + its[1] + '.'; s.frame = '[S] followed a similar pattern to [O].'; s.vocab = ['a similar pattern']; s.vi = its[0] + ' đi cùng xu hướng với ' + its[1] + '.'; }
    else if (tip === 'ngược chiều') { s.en = its[0] + ' moved in the opposite direction to ' + its[1] + ' for most of the period.'; s.frame = '[S] moved in the opposite direction to [O] for most of the period.'; s.vocab = ['the opposite direction']; s.vi = its[0] + ' đi ngược chiều với ' + its[1] + ' trong phần lớn thời gian.'; }
    else { s.en = 'The gap between ' + its[0] + ' and ' + its[1] + ' ' + (tip === 'nới rộng' ? 'widened' : 'narrowed') + ' over the period.'; s.frame = 'The gap between [S] and [O] [V2] over the period.'; s.vocab = [tip === 'nới rộng' ? 'widened' : 'narrowed', 'the gap between']; s.vi = 'Khoảng cách giữa ' + its[0] + ' và ' + its[1] + ' ' + tip + '.'; }
  } else if (tip === 'giảm nhiều nhất') {
    var spD = span(), nmD = itemOf(p, spD.item).name; s.en = nmD + ' saw the largest decrease, from ' + num(spD.va) + ' to ' + num(spD.vb) + '.'; s.frame = '[S] saw the largest decrease, from [số] to [số].'; s.vocab = ['the largest decrease']; s.vi = nmD + ' giảm nhiều nhất, từ ' + uv(p, spD.va) + ' xuống ' + uv(p, spD.vb) + '.';
  } else if (tip === 'tăng nhiều nhất') {
    if (p.derived) { var c3 = vals[0] || { name: subj, v: 0 }; s.en = c3.name + ' saw the highest growth rate, at ' + num(c3.v) + '.'; s.frame = '[S] saw the highest growth rate, at [số].'; s.vocab = ['the highest growth rate']; s.vi = c3.name + ' tăng nhanh nhất, ' + uv(p, c3.v) + '.'; }
    else { var sp4 = span(), nm4 = itemOf(p, sp4.item).name; s.en = nm4 + ' saw the largest increase, from ' + num(sp4.va) + ' to ' + num(sp4.vb) + '.'; s.frame = '[S] saw the largest increase, from [số] to [số].'; s.vocab = ['the largest increase']; s.vi = nm4 + ' tăng nhiều nhất, từ ' + uv(p, sp4.va) + ' lên ' + uv(p, sp4.vb) + '.'; }
  }
  if (!s.en) { s.en = subj + ' is worth mentioning.'; s.frame = '[S] is worth mentioning.'; s.vi = subj + '.'; }
  s.en = s.en.charAt(0).toUpperCase() + s.en.slice(1);
  return s;
}

var ING = { 'tăng': ['rising', 'rose', 'lên'], 'giảm': ['falling', 'fell', 'xuống'], 'ổn định': ['remaining stable at around', 'remained stable at around', 'quanh'], 'chững lại': ['levelling off at', 'levelled off at', 'quanh'], 'dao động': ['fluctuating to', 'fluctuated to', 'tới'], 'phục hồi': ['recovering to', 'recovered to', 'lên'], 'đảo chiều': ['changing direction to', 'changed direction to', 'tới'], 'đạt đỉnh': ['peaking at', 'peaked at', 'ở'], 'chạm đáy': ['hitting a low of', 'hit a low of', 'ở'] };
function chainSentence(pr: T1Prompt, p: T1Part, row: Row): Sentence {
  var A = p.axis, lab = function (ai) { return A.en ? A.en[ai] : A.labels[ai]; }, num = function (v) { return enNum(v) + p.unitEn; };
  var stages = stagesOf(row), en = '', fr = '', vi = '', vocab = [], prev = null, name = '';
  stages.forEach(function (st, i) {
    var actorId = cellById(pr, row.filter(function (e) { return e.k === 'val'; })[0].id).item;
    var all = st.filter(function (e) { return e.k === 'val'; }).map(function (e) { return cellById(pr, e.id); });
    var cells = all.filter(function (c) { return c.item === actorId; });
    var objs = []; st.forEach(function (e) { var x = e.k === 'val' ? cellById(pr, e.id).item : e.k === 'group' ? groupVal(e.id) : null; if (x && x !== actorId && objs.indexOf(x) < 0) objs.push(itemOf(p, x).name); });
    var tip = (st.filter(function (e) { return e.k === 'tip' && MODS.indexOf(e.id) < 0; })[0] || {}).id, mod = (st.filter(function (e) { return e.k === 'tip' && MODS.indexOf(e.id) >= 0; })[0] || {}).id;
    var w = ING[tip] || ['changing to', 'changed to', 'tới'], adv = mod ? ADV[mod] : null, end = cells[cells.length - 1], point = POINT.indexOf(tip) >= 0 || tip === 'ổn định' || tip === 'chững lại';
    name = end.name;
    var verbPast = w[1] + (adv ? ' ' + adv[0] : ''), verbIng = w[0] + (adv ? ' ' + adv[0] : '');
    if (tip === 'vượt qua') {
      var on = objs.join(' and ');
      if (i === 0) { en = cells[0].name + ' overtook ' + on + ' in ' + lab(end.ai) + ', reaching ' + num(end.v); fr = '[S] overtook [O] in [mốc], reaching [số]'; vi = cells[0].name + ' vượt ' + objs.join(' và ') + ' (' + A.labels[end.ai] + ', ' + uv(p, end.v) + ')'; vocab.push('overtook'); }
      else { var jn = i === 1 ? ', before ' : ' and then '; en += jn + 'overtaking ' + on + ' in ' + lab(end.ai) + ', at ' + num(end.v); fr += jn + '[V-ing] [O] in [mốc], at [số]'; vi += ', rồi vượt ' + objs.join(' và ') + ' (' + A.labels[end.ai] + ', ' + uv(p, end.v) + ')'; vocab.push((i === 1 ? 'before' : 'and then') + ' overtaking'); }
      name = cells[0].name; prev = end; return;
    }
    if (i === 0) {
      var a = cells[0];
      if (point && cells.length >= 2 && POINT.indexOf(tip) < 0) { en = name + ' ' + verbPast + ' ' + num(a.v) + ' between ' + lab(a.ai) + ' and ' + lab(end.ai); fr = '[S] ' + verbPast + ' [số] between [mốc] and [mốc]'; }
      else if (point) { en = name + ' ' + verbPast + ' ' + num(end.v) + ' in ' + lab(end.ai); fr = '[S] ' + verbPast + ' [số] in [mốc]'; }
      else { en = name + ' ' + verbPast.replace(/ to$/, '') + ' from ' + num(a.v) + ' in ' + lab(a.ai) + ' to ' + num(end.v) + ' in ' + lab(end.ai); fr = '[S] [V2]' + (adv ? ' [adv]' : '') + ' from [số] in [mốc] to [số] in [mốc]'; }
      vi = name + ' ' + tip + (adv ? ' ' + adv[1] : '') + (point ? ' ở ' : ' từ ' + uv(p, a.v) + ' (' + A.labels[a.ai] + ') ' + w[2] + ' ') + uv(p, end.v) + ' (' + A.labels[end.ai] + ')';
      vocab.push(verbPast.replace(/ (to|at|of|at around)$/, ''));
    } else {
      var join = i === 1 ? ', before ' : ' and then ';
      var phrase = verbIng + (/( to| at| of| around)$/.test(w[0]) ? ' ' : ' to ');
      en += join + phrase + num(end.v) + ' in ' + lab(end.ai);
      fr += join + '[V-ing]' + (adv ? ' [adv]' : '') + (point ? ' at' : ' to') + ' [số] in [mốc]';
      vi += ', rồi ' + tip + (adv ? ' ' + adv[1] : '') + ' ' + (point ? 'ở ' : w[2] + ' ') + uv(p, end.v) + ' (' + A.labels[end.ai] + ')';
      vocab.push(i === 1 ? 'before ' + verbIng.replace(/ (to|at|of|at around)$/, '') : 'and then ' + verbIng.replace(/ (to|at|of|at around)$/, ''));
    }
    prev = end;
  });
  return { en: en.charAt(0).toUpperCase() + en.slice(1) + '.', frame: fr + '.', vi: vi + '.', vocab: vocab.slice(0, 3), note: 'before + V-ing, and then + V-ing: kể tiếp các chặng trong một câu.' };
}

/* Key features for grading: the first hints, found again in a written paragraph by names + the right kind of word. */
var KIND_WORDS = { 'tăng': /(rose|rise|increas|grew|grow|climb|went up|higher)/i, 'giảm': /(fell|fall|decreas|declin|drop|went down|less|lower)/i, 'cao nhất': /(highest|most|largest|biggest|top|main|greatest)/i, 'nhóm thấp nhất': /(one of the lowest|among the lowest|lowest)/i, 'nhóm cao nhất': /(one of the highest|among the highest|highest)/i, 'thấp nhất': /(lowest|least|smallest|fewest)/i, 'cao hơn': /(higher|more|greater|exceed|than)/i, 'vượt qua': /(overt|surpass|exceed)/i, 'ngược chiều': /(opposite|contrast|whereas|while)/i, 'phần lớn': /(majority|most|over half|more than half|\d{2}%)/i, 'gần một nửa': /(half|\d{2}%)/i, 'đạt đỉnh': /(peak|highest|high of)/i, 'tăng nhiều nhất': /(largest increase|highest growth|fastest|most rapid|biggest rise|largest rise|\d{3}%)/i };
export function featureFound(f: Feature, text: string): boolean {
  var t = text || '';
  if (f.all && !/(all|every|each|both|three|four|five|seven)/i.test(t)) return false;
  var names = f.items.slice(0, 2).every(function (n) { var w = n.toLowerCase().split(/[\s-]+/)[0]; return t.toLowerCase().indexOf(w) >= 0; });
  return names && (KIND_WORDS[f.tip] || /./).test(t);
}
