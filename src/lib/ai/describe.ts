/** Plain-text views of the student's work, as the AI reviewers read it. */
import type { Prompt } from '@/content/prompts';
import { CL_SHAPE_LABEL } from '@/features/chainlab/constants';
import { levelOf, shapeOf, sidesOf, upstreamSteps } from '@/features/chainlab/model';
import type { Chain, Side } from '@/features/chainlab/types';

const SHAPE_EN: Record<string, string> = { verdict: 'verdict (chọn phía)', cause: 'cause (nguyên nhân)', problem: 'problem (vấn đề)', planproblem: 'problem of a plan (vấn đề của kế hoạch)', effect: 'effect (ảnh hưởng)', solution: 'solution (giải pháp)' };

export function describePrompt(p: Prompt) {
  const lines = ['ĐỀ BÀI', p.text, '', 'Các câu hỏi trong đề:'];
  p.questions.forEach((q) => lines.push(`  Câu ${q.n} · ${SHAPE_EN[q.shape]} · ${q.q}${q.sides ? ` · hai đầu sợi dây: [trái] ${q.sides[0]} ↔ [phải] ${q.sides[1]}` : ''}`));
  if (p.driver2) {
    lines.push('Đề so sánh hai lựa chọn. Driver A: ' + p.driver + ' · Driver B: ' + p.driver2 + '. Mỗi mạch xuất phát từ A hoặc B; so sánh hai bên theo cùng bên liên quan và cùng vùng tác động.');
  } else if (p.driver) lines.push('Driver gợi ý: ' + p.driver);
  if (p.stakeholders && p.stakeholders.length) lines.push('Stakeholder gợi ý: ' + p.stakeholders.join(', '));
  if (p.reqs && p.reqs.length) lines.push('Bài phải: ' + p.reqs.join(' · '));
  return lines.join('\n');
}

export function describeChains(p: Prompt, chains: Chain[], stance: string) {
  const [left, right] = sidesOf(p);
  const side = (s?: Side) => (s === 'left' ? left : s === 'right' ? right : 'chưa xếp');
  const out: string[] = ['CÁC MẠCH CỦA HỌC SINH'];
  chains.forEach((c, i) => {
    const sh = shapeOf(p, c);
    out.push('', `[Mạch ${i + 1}] id=${c.id} · câu ${c.q || 1} (${CL_SHAPE_LABEL[sh]}) · tên: ${c.title || '(chưa đặt)'}${c.drv ? ' · xuất phát từ driver ' + c.drv : ''}${sh === 'verdict' ? ` · tông: ${c.tone === 'cost' ? 'tác hại' : 'lợi ích'}` : ''}${sh === 'cause' ? ' · loại nguyên nhân: ' + (levelOf(c) || '(chưa viết)') + (upstreamSteps(c).length ? ' (bước 1–' + upstreamSteps(c).length + ' là nguyên nhân thượng nguồn thuộc hệ thống, các bước sau là của người trong cuộc)' : '') : ''}${c.area ? ' · vùng: ' + c.area : ''}${c.cell ? ' · ô bản đồ: ' + String(c.cell.r).slice(0, 60) + ' × ' + String(c.cell.c).slice(0, 60) : ''}`);
    c.steps.forEach((s, k) => out.push(`  bước ${k + 1}: ${s.trim() || '(trống)'}`));
    if (c.split) {
      out.push(`  Scope: tách theo "${c.split.noun}" sau bước ${c.split.at + 1}`);
      c.split.branches.forEach((b, k) => out.push(`    nhánh ${String.fromCharCode(97 + k)} · ${b.label || '(chưa đặt tên)'}${sh === 'verdict' ? ' · phía: ' + side(b.side) : ''}: ${b.steps.filter((x) => x.trim()).join(' → ') || '(chưa có bước)'}`));
    } else if (sh === 'verdict') out.push('  phía trên sợi dây: ' + side(c.side));
    c.findings.filter((f) => !f.empty && f.text.trim()).forEach((f) => out.push(`  góc nhìn ${f.kind}${f.target === 'all' ? '' : ' (nhánh ' + String.fromCharCode(97 + (f.target as number)) + ')'}${sh === 'verdict' ? ' · phía: ' + side(f.side) : ''}: ${f.text}`));
    if (sh === 'solution') {
      const k = chains.findIndex((x) => x.id === c.fixes);
      out.push('  xử lý: ' + (k >= 0 ? 'Mạch ' + (k + 1) : '(chưa chọn)'));
    }
  });
  if (p.questions.some((q) => q.shape === 'verdict')) out.push('', 'LẬP TRƯỜNG: ' + (stance.trim() || '(chưa viết)'));
  return out.join('\n');
}

/** Rough guard against oversized or malformed chain input. */
export function validChains(chains: unknown): chains is Chain[] {
  return Array.isArray(chains) && chains.length <= 24 && chains.every((c) => c && typeof c.id === 'string' && Array.isArray(c.steps) && c.steps.length <= 30 && c.steps.every((s: unknown) => typeof s === 'string' && s.length <= 600) && Array.isArray(c.findings));
}
