/**
 * "Nộp bài" — essay feedback and band estimate for the Writing Desk.
 *
 * Scores and comments come from /api/ai/essay-review (Claude as examiner, grounded in The Art of
 * Nuance; see src/lib/ai): band + TR / CC / LR / GRA, comments grouped by criterion, each quoting
 * the essay. `reviewEssay` holds the prototype's rule-based checks, used only when the AI is not configured.
 */
import { AiRequestError, postAi } from '../ai/request';
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
  /** One group per criterion: tr, cc, lr, gra. */
  groups: ReviewGroup[];
  scores: BandScores;
  /** 'ai' = Claude; missing or 'mock' = rule-based checks. */
  source?: 'ai' | 'mock';
  /** Overall assessment across the four criteria (AI only). */
  summary?: string;
  /** Per criterion: why it got this band, and what would raise it (AI only). */
  criteria?: Record<string, { why: string; next: string }>;
}

/** Feedback groups, one per IELTS criterion. */
export const CRITERIA: [string, string][] = [['tr', 'Task Response'], ['cc', 'Coherence & Cohesion'], ['lr', 'Lexical Resource'], ['gra', 'Grammatical Range & Accuracy']];

/** Highlight colours per criterion: underline/bar and soft background. */
export const CRITERION_STYLE: Record<string, { line: string; soft: string }> = {
  tr: { line: '#D5452E', soft: '#FBE4E0' },
  cc: { line: '#C08A00', soft: '#FFF3CC' },
  lr: { line: '#17839A', soft: '#E1F3F8' },
  gra: { line: '#6A4BC4', soft: '#EEE9FB' },
};

/** Overall band: mean of the four criteria, rounded to the nearest half band (.25 and .75 round up). */
export const bandOf = (tr: number, cc: number, lr: number, gra: number) => Math.round(((tr + cc + lr + gra) / 4) * 2) / 2;

// Mock checks, and the criterion each one counts towards.
const GROUPS: [string, string][] = [['plan', 'tr'], ['stance', 'tr'], ['length', 'tr'], ['structure', 'cc'], ['cohesion', 'cc'], ['vague', 'lr']];
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
  return {
    source: 'mock',
    groups: CRITERIA.map(([id, title]) => ({ id, title, items: GROUPS.filter(([, c]) => c === id).flatMap(([g]) => G[g]) })),
    scores: { band: bandOf(tr, cc, lr, gra), tr, cc, lr, gra },
    key: draftsKey(drafts),
  };
}

/** Sends the essay for scoring. Falls back to the rule-based checks when the AI is not configured. */
export async function requestEssayReview(spec: PromptSpec, sections: EssaySection[], drafts: Record<string, string>, chains: Chain[], stance: string): Promise<EssayReview> {
  try {
    const r = await postAi<EssayReview>('essay-review', {
      promptId: spec.id,
      sections: sections.map((s) => ({ id: s.id, label: s.label, text: drafts[s.id] || '' })),
      chains: chains.map(({ check, ...c }) => c),
      stance,
    });
    return { ...r, key: draftsKey(drafts) };
  } catch (e) {
    if (e instanceof AiRequestError && e.code === 'not_configured') return reviewEssay(spec, sections, drafts, chains, stance);
    throw e;
  }
}
