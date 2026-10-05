/**
 * "Tạo đoạn mẫu" in Vocab: a short paragraph that uses exactly the phrases the student ticked.
 * Phrases come only from the app's own vocab sets (checked by the route), so there is no free text to inject.
 */
import type { GuidedSample } from '@/features/guided/data';
import type { VocabSkill, VocabTopic } from '@/features/vocab/data';
import { AiError, ask } from './claude';

const KIND: Record<VocabSkill['id'], string> = {
  task2: 'one body paragraph of an IELTS Writing Task 2 essay (about 90–130 words) that argues one clear point: a topic sentence, then a cause-and-effect chain with no missing steps, and a sentence that links back to the point. Formal written register.',
  task1: 'one paragraph of an IELTS Writing Task 1 report (about 70–100 words) describing a realistic chart, table, process or map with specific figures. Neutral, factual register; no opinions.',
  speaking: 'one natural spoken answer for IELTS Speaking (about 60–90 words), in the first person, relaxed but accurate, as a strong candidate would say it.',
};

const TASK = (skill: VocabSkill, topic: VocabTopic | null) => `
You write short practice texts for Vietnamese learners in an IELTS app. The learner has ticked some English phrases and will rewrite your text sentence by sentence from its Vietnamese translation, so the text must use each ticked phrase naturally and correctly.

Write ${KIND[skill.id]}${topic ? ` Topic: ${topic.name}.` : ''}

Rules:
- Use EVERY ticked phrase at least once, naturally, with correct grammar and collocation. You may change the form of a word inside it (equip → equips / equipped, gap → gaps) but keep its words together and in order, so the learner can recognise it.
- 3–7 sentences. Each sentence must be correct, natural English a band 8 candidate would write.
- For every sentence give: "en" (the sentence), "vi" (a natural Vietnamese translation, not word for word), "uses" (the ticked phrases used in it, written exactly as given to you), and "forms" (for each item in "uses", the exact text as it appears in "en", same order).
- "prompt": the IELTS question this text answers, in English (for Task 2 the essay question; for Task 1 a one-line description of the visual; for Speaking the examiner's question).
`.trim();

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['prompt', 'sentences'],
  properties: {
    prompt: { type: 'string' },
    sentences: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['en', 'vi', 'uses', 'forms'],
        properties: { en: { type: 'string' }, vi: { type: 'string' }, uses: { type: 'array', items: { type: 'string' } }, forms: { type: 'array', items: { type: 'string' } } },
      },
    },
  },
};

interface Out { prompt: string; sentences: { en: string; vi: string; uses: string[]; forms: string[] }[] }

export async function aiVocabParagraph(userId: string, skill: VocabSkill, topic: VocabTopic | null, phrases: string[]): Promise<GuidedSample> {
  const out = await ask<Out>({
    userId, kind: 'vocab', task: TASK(skill, topic), schema: SCHEMA, effort: 'low', maxTokens: 6000, grounded: false,
    input: 'Ticked phrases (use every one):\n' + phrases.map((p) => '- ' + p).join('\n'),
  });
  const covered = new Set<string>();
  const segs = (out.sentences || []).filter((s) => s && s.en && s.vi).map((s) => {
    const vocab: string[] = [], hl: string[] = [];
    (s.uses || []).forEach((u, k) => {
      const form = (s.forms || [])[k] || u;
      // Keep a use only if it is one of the ticked phrases and its form really is in the sentence.
      if (phrases.includes(u) && form && s.en.toLowerCase().includes(form.toLowerCase()) && !vocab.includes(u)) { vocab.push(u); hl.push(form); covered.add(u); }
    });
    return { en: s.en.trim(), vi: s.vi.trim(), vocab, hl };
  });
  if (segs.length < 2 || phrases.some((p) => !covered.has(p))) throw new AiError('bad_output', 'phrases_missing');
  return { id: 'ai-' + crypto.randomUUID().slice(0, 8), prompt: (out.prompt || '').trim() || (topic ? topic.name : skill.title), paragraphs: [segs] };
}

