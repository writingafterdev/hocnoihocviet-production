/**
 * Coaching one chain: "Bí? Gợi ý" asks one open question, "Kiểm tra" finds missing steps and the places
 * where a group's situation or a detail would make the chain more convincing (prompts in ./prompts).
 *
 * Used by "Chứng minh nhanh" (a ready-made statement) and by ① Dựng mạch (one chain per body paragraph).
 * A chain is read as positions: 0 = starting point, 1…n = the student's middle steps, n+1 = ending point.
 */
import type { Prompt } from '@/content/prompts';
import { ask } from './claude';
import { describePrompt } from './describe';
import { BANK_TASK, CHECK_TASK, HINT_TASK } from './prompts';

export type ChainKind = 'cause' | 'impact' | 'solution';

export interface ChainIn {
  kind: ChainKind;
  tone?: 'benefit' | 'cost' | null;
  start: string;
  end: string;
  steps: string[];
  /** The statement being proved (drill only), or the stakeholder the statement names. */
  sentence?: string;
  stakeholder?: string;
}

export type NoteType = 'jump' | 'trait' | 'detail';
export interface ChainNote { type: NoteType; at: number; text: string }
export interface ChainCheckOut { notes: ChainNote[]; summary: string; good: boolean }

const KIND_VI: Record<ChainKind, string> = {
  cause: 'nguyên nhân (điểm đầu là một nguyên nhân, điểm cuối là hiện tượng đề hỏi)',
  impact: 'tác động (điểm đầu là điều đề nói tới, điểm cuối là tác động lên một người cụ thể)',
  solution: 'giải pháp (điểm đầu là một biện pháp, điểm cuối là vấn đề được giải quyết)',
};

export function describeChain(c: ChainIn) {
  const mid = c.steps.map((s) => s.trim()).filter(Boolean);
  const lines = ['MẠCH CỦA HỌC SINH', 'Loại mạch: ' + KIND_VI[c.kind] + (c.kind === 'impact' && c.tone ? ' · tông: ' + (c.tone === 'cost' ? 'tác hại' : 'lợi ích') : '')];
  if (c.sentence) lines.push('Câu cần chứng minh: ' + c.sentence);
  if (c.stakeholder) lines.push('Stakeholder trong câu: ' + c.stakeholder);
  lines.push('vị trí 0 · điểm đầu: ' + (c.start.trim() || '(trống)'));
  mid.forEach((s, i) => lines.push('vị trí ' + (i + 1) + ': ' + s));
  lines.push('vị trí ' + (mid.length + 1) + ' · điểm cuối: ' + (c.end.trim() || '(trống)'));
  return { text: lines.join('\n'), n: mid.length };
}

const HINT_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['q', 'why'],
  properties: { q: { type: 'string' }, why: { type: 'string' } },
};

const CHECK_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['summary', 'good', 'notes'],
  properties: {
    summary: { type: 'string' },
    good: { type: 'boolean' },
    notes: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['type', 'at', 'text'],
        properties: { type: { type: 'string', enum: ['jump', 'trait', 'detail'] }, at: { type: 'integer' }, text: { type: 'string' } },
      },
    },
  },
};

export async function aiChainHint(userId: string, prompt: Prompt, chain: ChainIn, asked: string[]): Promise<{ q: string; why: string }> {
  const { text } = describeChain(chain);
  const prev = asked.length ? '\n\nCâu đã hỏi (đừng lặp lại):\n' + asked.map((a) => '- ' + a).join('\n') : '';
  const out = await ask<{ q: string; why: string }>({
    userId, kind: 'hint', task: HINT_TASK, schema: HINT_SCHEMA, effort: 'low', maxTokens: 2000,
    input: describePrompt(prompt) + '\n\n' + text + prev,
  });
  return { q: (out.q || '').trim(), why: (out.why || '').trim() };
}

const BANK_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['phrases'],
  properties: { phrases: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['en', 'vi'], properties: { en: { type: 'string' }, vi: { type: 'string' } } } } },
};

export interface BankPhrase { en: string; vi: string }

/** English phrases for the whole chain, from its two ends only (never per step). */
export async function aiVocabBank(userId: string, prompt: Prompt, chain: ChainIn): Promise<{ phrases: BankPhrase[] }> {
  const { text } = describeChain({ ...chain, steps: [] });
  const out = await ask<{ phrases: BankPhrase[] }>({
    userId, kind: 'hint', task: BANK_TASK, schema: BANK_SCHEMA, effort: 'low', maxTokens: 2000,
    input: describePrompt(prompt) + '\n\n' + text,
  });
  const seen = new Set<string>();
  const phrases = (out.phrases || [])
    .map((x) => ({ en: String(x.en || '').trim().toLowerCase(), vi: String(x.vi || '').trim() }))
    .filter((x) => x.en && x.en.length <= 40 && x.vi && !seen.has(x.en) && !!seen.add(x.en))
    .slice(0, 8);
  return { phrases };
}

export async function aiChainCheck(userId: string, prompt: Prompt, chain: ChainIn): Promise<ChainCheckOut> {
  const { text, n } = describeChain(chain);
  const out = await ask<ChainCheckOut>({
    userId, kind: 'chain', task: CHECK_TASK, schema: CHECK_SCHEMA, effort: 'medium', maxTokens: 8000,
    input: describePrompt(prompt) + '\n\n' + text,
  });
  const notes = (out.notes || [])
    .map((x) => ({ type: x.type, at: Math.round(Number(x.at)), text: (x.text || '').trim() }))
    // A jump sits between `at` and `at + 1`, so it can't start at the ending point; a trait or detail is on a middle step.
    .filter((x) => x.text && ['jump', 'trait', 'detail'].includes(x.type) && (x.type === 'jump' ? x.at >= 0 && x.at <= n : x.at >= 1 && x.at <= n))
    .slice(0, 3);
  return { notes, summary: (out.summary || '').trim(), good: !!out.good && !notes.some((x) => x.type === 'jump') };
}

/** Rough guard against oversized or malformed chain input from the browser. */
export function readChain(x: unknown): ChainIn | null {
  if (!x || typeof x !== 'object') return null;
  const c = x as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === 'string' && v.length <= max ? v.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '') : null);
  const kind = c.kind === 'cause' || c.kind === 'impact' || c.kind === 'solution' ? c.kind : null;
  const start = str(c.start, 600), end = str(c.end, 600);
  if (!kind || start === null || end === null || !Array.isArray(c.steps) || c.steps.length > 12) return null;
  const steps = c.steps.map((s) => str(s, 600));
  if (steps.some((s) => s === null)) return null;
  return {
    kind, start, end, steps: steps as string[],
    tone: c.tone === 'benefit' || c.tone === 'cost' ? c.tone : null,
    sentence: str(c.sentence, 600) || undefined,
    stakeholder: str(c.stakeholder, 200) || undefined,
  };
}
