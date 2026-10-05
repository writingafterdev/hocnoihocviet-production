/**
 * "Soát toàn bài" — whole-plan review for ChainLab.
 *
 * The review comes from /api/ai/chain-review (Claude, grounded in The Art of Nuance; see src/lib/ai).
 * `reviewChains` holds the prototype's rule-based checks, used only when the AI is not configured.
 */
import { postAi, AiRequestError } from '../ai/request';
import { CL_CIRC, CL_SHAPE_LABEL } from './constants';
import { hasVerdict, lensesFor, missingLevels, ropeUnits, shapeOf } from './model';
import type { Chain, ChainCheck, PromptSpec, ReviewGroup, ReviewItem } from './types';

export interface ChainReview {
  key: string;
  checks: Record<string, ChainCheck>;
  groups: ReviewGroup[];
  /** 'ai' = Claude; missing or 'mock' = rule-based checks. */
  source?: 'ai' | 'mock';
  /** One or two sentences on the plan as a whole (AI only). */
  summary?: string;
}

export const CHAIN_GROUPS: [string, string][] = [['logic', 'Mắt xích'], ['depth', 'Độ sâu'], ['scope', 'Trường hợp'], ['rope', 'Sợi dây'], ['stance', 'Lập trường'], ['cover', 'Độ phủ đề bài'], ['overlap', 'Trùng ý']];

/** Identity of the input a review was run on, so the UI can tell when it is stale. */
export const reviewKey = (chains: Chain[], stance: string) => JSON.stringify(chains.map(({ check, ...r }) => r)) + '|' + stance;

/** What a chain-level comment was about; when it changes, the comment shows as "Đã sửa?". */
export const chainSnap = (c: Chain) => JSON.stringify([c.title, c.area, c.steps, c.split, c.findings.map((f) => [f.kind, f.text, f.side, f.target]), c.side, c.fixes]);

function mockCheck(chain: Chain): ChainCheck {
  const st = chain.steps;
  const filled = st.filter((x) => x.trim());
  const all = st.join('||');
  if (filled.length < 2) return { snapshot: all, flags: [], vague: [], note: 'Cần ít nhất hai bước để soát.' };
  const pair = (i: number) => st[i] + '||' + st[i + 1];
  let best = -1;
  for (let i = 0; i < st.length - 1; i++) { if (st[i].trim() && st[i + 1].trim()) best = i; }
  if (best < 0) return { snapshot: all, flags: [], vague: [] };
  return { snapshot: all, flags: [{ at: best, snap: pair(best), q: 'Bước trước cho ra thứ gì cụ thể, và ai nhận nó để bước sau xảy ra?' }], vague: [] };
}

export function reviewChains(spec: PromptSpec, chains: Chain[], stance: string): ChainReview {
  const G: Record<string, ReviewItem[]> = {};
  CHAIN_GROUPS.forEach(([k]) => (G[k] = []));
  const checks: Record<string, ChainCheck> = {};
  const nm = (c: Chain, i: number) => 'Mạch ' + (i + 1) + (c.title ? ' · ' + c.title : '');
  const push = (g: string, it: Omit<ReviewItem, 'key'>) => G[g].push({ key: g + G[g].length, ...it });
  const verdict = hasVerdict(spec);

  chains.forEach((c, i) => {
    const ck = mockCheck(c); checks[c.id] = ck;
    const where = nm(c, i);
    ck.flags.forEach((f) => push('logic', { chainId: c.id, snapKind: 'flag', at: f.at, snap: f.snap, where, text: 'Bước ' + (f.at + 1) + ' → ' + (f.at + 2) + ': ' + f.q }));
    ck.vague.forEach((v) => push('logic', { chainId: c.id, snapKind: 'vague', at: v.step, snap: v.snap, where, text: '"' + v.word + '" (bước ' + (v.step + 1) + '): ' + v.q }));
    const n = c.steps.filter((s) => s.trim()).length + (c.split ? Math.max(...c.split.branches.map((b) => b.steps.filter((s) => s.trim()).length)) : 0);
    if (n < 3) push('depth', { chainId: c.id, where, text: 'Mạch mới có ' + n + ' bước. Nó dừng ở đâu: ai bị ảnh hưởng, và đến mức nào?' });
    const tried = new Set(c.findings.map((f) => f.kind)); if (c.split) tried.add('Scope');
    const lensSet = lensesFor(spec, c).map((l) => l.kind);
    const miss = lensSet.filter((k) => !tried.has(k));
    if (shapeOf(spec, c) !== 'cause' && miss.length && miss.length >= Math.min(3, lensSet.length)) push('depth', { chainId: c.id, where, text: 'Chưa thử ' + miss.join(', ') + '. Ý này còn đứng vững khi soi từ những góc đó không?' });
    if (c.split) {
      c.split.branches.forEach((b, k) => {
        const tag = (i + 1) + String.fromCharCode(97 + k);
        if (!c.findings.some((f) => f.target === k)) push('scope', { chainId: c.id, where: where + ' · ' + tag, text: 'Trường hợp "' + (b.label || tag) + '" chưa được thử riêng. ' + (shapeOf(spec, c) === 'verdict' ? 'Ống kính nào có thể làm nó đổi phía?' : 'Nó còn đúng với phần lớn người không?') });
      });
      if (new Set(c.split.branches.map((b) => b.side).filter(Boolean)).size > 1) push('scope', { chainId: c.id, where, text: 'Các trường hợp nằm ở hai phía. Điều kiện nào quyết định phía nào đúng, và lập trường đã nói điều đó chưa?' });
    } else if (c.side) {
      const fs = c.findings.filter((f) => f.side);
      if (fs.length && fs.filter((f) => f.side !== c.side).length * 2 >= fs.length) push('rope', { chainId: c.id, where, text: 'Phần lớn phát hiện nằm ở phía ngược lại. Mạch này còn mạnh như bạn nghĩ không?' });
    }
  });

  if (verdict) {
    const units = ropeUnits(spec, chains);
    const loose = units.filter((u) => !u.side);
    if (loose.length) G.rope.unshift({ key: 'rope-loose', chainId: loose[0].chainId, where: 'Sợi dây', text: loose.length + ' ý chưa xếp phía (' + loose.map((u) => u.label).join(', ') + '). Mỗi ý ủng hộ phía nào?' });
    const L = units.filter((u) => u.kind === 'unit' && u.side === 'left').length, R = units.filter((u) => u.kind === 'unit' && u.side === 'right').length;
    const st = stance.trim().toLowerCase();
    if (!st) push('stance', { target: 'stance', where: 'Lập trường', text: 'Chưa có lập trường. Nhìn sợi dây, bạn đang nghiêng về phía nào?' });
    else {
      const dis = /(disagree|không đồng ý|phản đối)/.test(st), agr = !dis && /(agree|đồng ý|ủng hộ)/.test(st);
      if ((agr && L > R) || (dis && R > L)) push('stance', { target: 'stance', where: 'Lập trường', text: 'Lập trường nói một phía, nhưng phần lớn ý trên sợi dây nằm ở phía kia. Bên nào cần sửa?' });
      if (L && R && !/(nếu|khi|một phần|chỉ|trừ|if|unless|only|partly|when|to some extent)/.test(st)) push('stance', { target: 'stance', where: 'Lập trường', text: 'Ý nằm ở cả hai phía nhưng lập trường chưa có điều kiện. Đồng ý trong trường hợp nào?' });
    }
  }

  spec.questions.forEach((q) => {
    if (spec.questions.length > 1 && !chains.some((c) => (c.q || 1) === q.n)) push('cover', { where: 'Câu ' + CL_CIRC[q.n - 1], text: 'Câu ' + CL_CIRC[q.n - 1] + ' (' + CL_SHAPE_LABEL[q.shape].toLowerCase() + ') chưa có mạch nào. Bài sẽ bỏ sót một phần đề.' });
  });
  missingLevels(spec, chains).forEach(([n, level]) => push('cover', { where: 'Câu ' + CL_CIRC[n - 1], text: 'Câu ' + CL_CIRC[n - 1] + ' chưa có mạch nguyên nhân ' + level + '. Một câu nguyên nhân cần cả hai: điều người trong cuộc chọn, và điều hệ thống đứng sau.' }));
  chains.forEach((c, i) => {
    if (shapeOf(spec, c) === 'solution' && !chains.some((x) => x.id === c.fixes)) push('cover', { chainId: c.id, where: 'Mạch ' + (i + 1) + (c.title ? ' · ' + c.title : ''), text: 'Giải pháp này xử lý nguyên nhân hay vấn đề nào? Chọn ở ô "Xử lý".' });
  });
  const areas = chains.filter((c) => shapeOf(spec, c) === 'verdict').map((c) => (c.area || '').toLowerCase()).join(' ');
  const noArea = ['Vật chất', 'An toàn', 'Gắn kết', 'Năng lực', 'Tự quyết'].filter((a) => !areas.includes(a.toLowerCase()));
  if (verdict && noArea.length >= 2) push('cover', { where: '5 vùng tác động', text: 'Chưa chạm tới vùng ' + noArea.join(', ') + '. Có tác động lớn nào đang bị bỏ sót?' });
  chains.forEach((a, i) => chains.slice(i + 1).forEach((b, j) => {
    if (a.area && a.area.trim() && a.area.trim().toLowerCase() === (b.area || '').trim().toLowerCase()) push('overlap', { chainId: b.id, where: 'Mạch ' + (i + 1) + ' & ' + (i + j + 2), text: 'Hai mạch cùng vùng tác động. Chúng là hai lý do khác nhau, hay một lý do nói hai lần?' });
  }));

  return {
    key: reviewKey(chains, stance),
    checks,
    source: 'mock',
    groups: CHAIN_GROUPS.filter(([id]) => verdict || (id !== 'rope' && id !== 'stance')).map(([id, title]) => ({ id, title, items: G[id] })),
  };
}

/** Asks the AI to review the plan. Falls back to the rule-based checks when the AI is not configured. */
export async function requestChainReview(spec: PromptSpec, chains: Chain[], stance: string): Promise<ChainReview> {
  try {
    return await postAi<ChainReview>('chain-review', { promptId: spec.id, chains: chains.map(({ check, ...c }) => c), stance });
  } catch (e) {
    if (e instanceof AiRequestError && e.code === 'not_configured') return reviewChains(spec, chains, stance);
    throw e;
  }
}
