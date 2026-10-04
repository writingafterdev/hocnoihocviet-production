/**
 * "Nộp bài" — essay feedback and band estimate for the Writing Desk.
 *
 * MOCK: rule-based checks and a heuristic band from the prototype. The real version scores
 * TR / CC / LR / GRA with an AI examiner, and every comment must quote the essay. Replace
 * `requestEssayReview` with an API call returning the same `EssayReview` shape.
 */
import { hasVerdict } from '../chainlab/model';
import type { Chain, PromptSpec, ReviewGroup, ReviewItem } from '../chainlab/types';

export interface EssaySection {
  id: string;
  label: string;
  /** Target word range, e.g. "85–100 từ". */
  guide: string;
  placeholder: string;
}

export interface BandScores { band: number; tr: number; cc: number; lr: number; gra: number }

export interface EssayReview {
  key: string;
  groups: ReviewGroup[];
  scores: BandScores;
}

const GROUPS: [string, string][] = [['plan', 'Bám mạch'], ['stance', 'Lập trường'], ['structure', 'Cấu trúc đoạn'], ['cohesion', 'Mạch lạc'], ['vague', 'Từ mơ hồ'], ['length', 'Độ dài']];
const VAGUE = ['things', 'stuff', 'a lot', 'very', 'good', 'bad', 'pressure', 'many people', 'nowadays'];

export const wordCount = (t?: string) => (t && t.trim() ? t.trim().split(/\s+/).length : 0);
export const draftsKey = (drafts: Record<string, string>) => JSON.stringify(drafts);

export function reviewEssay(spec: PromptSpec, sections: EssaySection[], drafts: Record<string, string>, chains: Chain[], stance: string): EssayReview {
  const G: Record<string, ReviewItem[]> = {};
  GROUPS.forEach(([k]) => (G[k] = []));
  const push = (g: string, it: Omit<ReviewItem, 'key'>) => G[g].push({ key: g + G[g].length, ...it });
  const sents = (t: string) => (t || '').split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const bodies = sections.filter((s) => s.id.startsWith('body'));
  const all = sections.map((s) => drafts[s.id] || '').join(' ').toLowerCase();

  sections.forEach((s) => {
    const t = drafts[s.id] || '', base = { sectionId: s.id, where: s.label, snap: t };
    const w = wordCount(t), nums = s.guide.match(/\d+/g).map(Number);
    if (!w) { push('length', { ...base, text: s.label + ' còn trống.' }); return; }
    if (w < nums[0] || w > nums[1]) push('length', { ...base, text: w + ' từ, ngoài khoảng ' + s.guide + '. ' + (w < nums[0] ? 'Ý nào còn chưa được giải thích đủ?' : 'Câu nào có thể bỏ mà ý vẫn đứng?') });
    const vw = VAGUE.find((v) => new RegExp('\\b' + v + '\\b', 'i').test(t));
    if (vw) { const m = t.match(new RegExp('\\b' + vw + '\\b', 'i'))[0]; push('vague', { ...base, word: m, text: '"' + m + '": cụ thể là gì, của ai, bao nhiêu?' }); }
    if (s.id.startsWith('body')) {
      const ss = sents(t);
      if (ss[0] && wordCount(ss[0]) > 32) push('structure', { ...base, para: true, text: 'Câu chủ đề dài ' + wordCount(ss[0]) + ' từ. Người đọc có biết ngay đoạn này bàn ý gì không?' });
      if (!/(for example|for instance|such as|e\.g\.)/i.test(t)) push('structure', { ...base, para: true, text: 'Chưa có ví dụ. Trường hợp cụ thể nào làm ý này dễ tin hơn?' });
      if (ss.length >= 2 && !/(because|therefore|as a result|this means|so that|consequently|thus|which leads|hence)/i.test(t)) push('cohesion', { ...base, para: true, text: 'Các câu đứng cạnh nhau nhưng chưa có từ nối nguyên nhân – kết quả. Câu sau xảy ra vì câu trước thế nào?' });
    }
  });

  const intro = (drafts.intro || '').toLowerCase(), concl = (drafts.conclusion || '').toLowerCase();
  const verdict = hasVerdict(spec);
  if (verdict && intro && !/(agree|disagree|believe|argue|view|opinion)/.test(intro)) push('stance', { sectionId: 'intro', where: 'Mở bài', snap: drafts.intro, para: true, text: 'Mở bài chưa nêu lập trường. Người chấm đọc xong có biết bạn đứng ở đâu không?' });
  const cond = /(nếu|khi|một phần|chỉ|if|unless|only|partly|when|to some extent)/.test((stance || '').toLowerCase());
  if (verdict && cond && intro && !/(if|unless|only|partly|to some extent|when|provided)/.test(intro)) push('stance', { sectionId: 'intro', where: 'Mở bài', snap: drafts.intro, para: true, text: 'Lập trường ở màn 1 có điều kiện, nhưng mở bài thì không. Điều kiện đó đâu rồi?' });
  if (verdict && concl && intro && /disagree/.test(intro) !== /disagree/.test(concl)) push('stance', { sectionId: 'conclusion', where: 'Kết bài', snap: drafts.conclusion, para: true, text: 'Kết bài nghiêng khác mở bài. Bài đang giữ lập trường nào?' });

  chains.forEach((c, i) => {
    const bid = bodies[Math.min(i, bodies.length - 1)].id;
    const key = (c.steps[1] || c.title || '').toLowerCase().split(/\s+/).filter((x) => x.length > 5).slice(0, 3);
    if (key.length && !key.some((k) => all.includes(k))) push('plan', { sectionId: bid, where: 'Mạch ' + (i + 1), snap: drafts[bid] || '', para: true, text: 'Chưa thấy mạch "' + (c.title || 'Mạch ' + (i + 1)) + '" trong bài. Bạn bỏ nó có chủ ý không?' });
    if (c.split) c.split.branches.forEach((b, k) => {
      const kw = (b.label + ' ' + b.steps.join(' ')).toLowerCase().split(/\s+/).filter((x) => x.length > 5);
      if (kw.length && !kw.some((x) => all.includes(x))) push('plan', { sectionId: bid, where: 'Mạch ' + (i + 1) + String.fromCharCode(97 + k), snap: drafts[bid] || '', para: true, text: 'Trường hợp "' + (b.label || '') + '" có trong mạch nhưng chưa có trong bài. Thiếu nó, ý này có bị nói quá không?' });
    });
  });

  const words = sections.reduce((n, s) => n + wordCount(drafts[s.id]), 0);
  const nIss = Object.values(G).reduce((n, a) => n + a.length, 0);
  const clamp = (x: number) => Math.max(4, Math.min(9, Math.round(x * 2) / 2));
  const tr = clamp(7 - G.stance.length * 0.5 - G.plan.length * 0.5 - (words < 250 ? 1 : 0));
  const cc = clamp(7 - G.cohesion.length * 0.5 - G.structure.length * 0.25);
  const lr = clamp(6.5 + (words > 200 ? 0.5 : 0) - G.vague.length * 0.5);
  const gra = clamp(6.5 + (words > 200 ? 0.5 : 0) - (nIss > 8 ? 0.5 : 0));
  const band = clamp((tr + cc + lr + gra) / 4);
  return {
    groups: GROUPS.filter(([id]) => verdict || id !== 'stance').map(([id, title]) => ({ id, title, items: G[id] })),
    scores: { band, tr, cc, lr, gra },
    key: draftsKey(drafts),
  };
}

/** Async boundary the UI calls. Swap the body for a fetch to the real scoring endpoint. */
export function requestEssayReview(spec: PromptSpec, sections: EssaySection[], drafts: Record<string, string>, chains: Chain[], stance: string): Promise<EssayReview> {
  return new Promise((resolve) => setTimeout(() => resolve(reviewEssay(spec, sections, drafts, chains, stance)), 900));
}
