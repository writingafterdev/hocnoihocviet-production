/** "Nộp bài": the AI scores the essay on TR / CC / LR / GRA by the official band descriptors, and every comment quotes the essay. */
import type { Prompt } from '@/content/prompts';
import type { Chain } from '@/features/chainlab/types';
import { CRITERIA } from '@/features/desk/scoring';
import { describeChains, describePrompt } from './describe';
import { ASSESS_TASK } from './prompts';

export interface SectionIn { id: string; label: string; text: string }

const TASK = ASSESS_TASK;

const COMMENT = (criterion: string) => ({
  type: 'object',
  additionalProperties: false,
  required: ['criterion', 'sectionId', 'quote', 'label', 'text', 'fix', 'example', 'chainId', 'step'],
  properties: {
    criterion: { type: 'string', enum: [criterion] },
    sectionId: { type: 'string' },
    quote: { type: 'string' },
    label: { type: 'string' },
    text: { type: 'string' },
    fix: { type: 'string' },
    example: { type: 'string' },
    chainId: { type: 'string' },
    step: { type: 'integer' },
  },
});

/** Scores call: the four criteria and the summary. Each criterion's comments come from its own call. */
const SCORE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['criteria', 'summary', 'praise'],
  properties: {
    criteria: {
      type: 'object',
      additionalProperties: false,
      required: ['tr', 'cc', 'lr', 'gra'],
      properties: Object.fromEntries(['tr', 'cc', 'lr', 'gra'].map((k) => [k, {
        type: 'object',
        additionalProperties: false,
        required: ['score', 'band_quote', 'why', 'next_quote', 'gap', 'next'],
        properties: { score: { type: 'number' }, band_quote: { type: 'string' }, why: { type: 'string' }, next_quote: { type: 'string' }, gap: { type: 'string' }, next: { type: 'string' } },
      }])),
    },
    summary: { type: 'string' },
    praise: { type: 'string' },
  },
};

const COMMENTS_SCHEMA = (criterion: string) => ({
  type: 'object',
  additionalProperties: false,
  required: ['comments'],
  properties: { comments: { type: 'array', items: COMMENT(criterion) } },
});

const ONLY_SCORES = '\n\n# LẦN GỌI NÀY\nChỉ trả về criteria, summary và praise. KHÔNG viết comments; các nhận xét chi tiết do những lần gọi khác viết. Vẫn đọc kỹ cả bài và chấm đúng theo bảng mô tả band ở trên. Trả về JSON: {"criteria": {...}, "summary": string, "praise": string}.';
const ONLY_COMMENTS = (id: string, name: string) => `\n\n# LẦN GỌI NÀY\nChỉ viết nhận xét chi tiết (comments) cho MỘT tiêu chí: ${name} (criterion = "${id}"). Không chấm điểm, không viết summary hay praise, không nhận xét tiêu chí khác (các lần gọi khác làm phần đó). Đọc hết cả bài và nêu mọi chỗ làm bài mất điểm ở tiêu chí này. Trả về JSON: {"comments": [...]}.`;

const essayInput = (prompt: Prompt, sections: SectionIn[], chains: Chain[], stance: string) => {
  const words = sections.reduce((n, s) => n + (s.text.trim() ? s.text.trim().split(/\s+/).length : 0), 0);
  const essay = sections.map((s) => `<section id="${s.id}" label="${s.label}">\n${s.text.trim() || '(trống)'}\n</section>`).join('\n');
  return describePrompt(prompt) + '\n\n' + describeChains(prompt, chains, stance) + `\n\nBÀI VIẾT (${words} từ)\n` + essay;
};

/**
 * An essay review is five AI calls: "scores" (bands, descriptor quotes, why/gap/next, summary, praise) and one per criterion (its
 * detailed comments). Each is its own request, streamed straight to the browser, which parses the reply
 * (features/desk/essay-parse.ts).
 */
export function essayCall(part: string, prompt: Prompt, sections: SectionIn[], chains: Chain[], stance: string) {
  const input = essayInput(prompt, sections, chains, stance);
  if (part === 'scores') return { kind: 'essay' as const, effort: 'high' as const, task: TASK + ONLY_SCORES, schema: SCORE_SCHEMA, input, grounded: false };
  const name = CRITERIA.find(([id]) => id === part)[1];
  return { kind: 'essay' as const, effort: 'high' as const, task: TASK + ONLY_COMMENTS(part, name), schema: COMMENTS_SCHEMA(part), input, grounded: false };
}
