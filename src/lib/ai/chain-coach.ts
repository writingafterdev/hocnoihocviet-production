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
import { CHAIN_RECHECK_TASK, NOTE_CHECK_TASK, STEP_SCAN_TASK, STEP_VOCAB_TASK } from './prompts-drill';

const PHRASES_SCHEMA = { type: 'array', items: { type: 'object', additionalProperties: false, required: ['en', 'vi'], properties: { en: { type: 'string' }, vi: { type: 'string' } } } };
const cleanPhrases = (xs: unknown, max: number): { en: string; vi: string }[] => {
  const seen = new Set<string>();
  return (Array.isArray(xs) ? xs : [])
    .map((x) => ({ en: String((x as { en?: unknown })?.en || '').trim(), vi: String((x as { vi?: unknown })?.vi || '').trim() }))
    .filter((x) => x.en && x.en.length <= 60 && x.vi && !seen.has(x.en.toLowerCase()) && !!seen.add(x.en.toLowerCase()))
    .slice(0, max);
};

export interface StepVocab { question: string; phrases: { en: string; vi: string }[]; sample: string; sampleVi: string }

/** Quick drill, "Gợi ý" on step `index` (0-based among the middle steps): a guiding question, three phrases, and a sample sentence kept behind "Xem câu mẫu". */
export async function aiStepVocab(userId: string, prompt: Prompt, chain: ChainIn, index: number, question: string): Promise<StepVocab> {
  const { text } = describeChain(chain);
  const out = await ask<{ question: unknown; phrases: unknown; sample: unknown; sample_vi: unknown }>({
    userId, kind: 'hint', task: STEP_VOCAB_TASK, effort: 'low', maxTokens: 1800,
    schema: { type: 'object', additionalProperties: false, required: ['question', 'phrases', 'sample', 'sample_vi'], properties: { question: { type: 'string' }, phrases: PHRASES_SCHEMA, sample: { type: 'string' }, sample_vi: { type: 'string' } } },
    input: describePrompt(prompt) + '\n\n' + text + '\n\nBƯỚC ĐANG VIẾT: vị trí ' + (index + 1) + (question ? ' · câu hỏi: ' + question : ''),
  });
  return {
    question: String(out.question || '').trim().slice(0, 200), phrases: cleanPhrases(out.phrases, 3),
    sample: String(out.sample || '').trim().slice(0, 400), sampleVi: String(out.sample_vi || '').trim().slice(0, 400),
  };
}

export interface StepScan { used: string[]; parts: { text: string; phrases: { en: string; vi: string }[] }[] }

/** Quick drill, after Enter on step `index`: phrases used, and better wording for every rough part. */
export async function aiStepScan(userId: string, prompt: Prompt, chain: ChainIn, index: number, step: string, suggested: string[]): Promise<StepScan> {
  const { text } = describeChain(chain);
  const out = await ask<{ used: unknown; parts: unknown }>({
    userId, kind: 'hint', task: STEP_SCAN_TASK, effort: 'low', maxTokens: 3000,
    schema: {
      type: 'object', additionalProperties: false, required: ['used', 'parts'],
      properties: {
        used: { type: 'array', items: { type: 'string' } },
        parts: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['text', 'phrases'], properties: { text: { type: 'string' }, phrases: PHRASES_SCHEMA } } },
      },
    },
    input: describePrompt(prompt) + '\n\n' + text + '\n\nBƯỚC VỪA VIẾT (vị trí ' + (index + 1) + '): ' + step + '\n\nCỤM ĐÃ GỢI Ý CHO BƯỚC NÀY: ' + (suggested.length ? suggested.join(' | ') : '(không có)'),
  });
  const sug = new Set(suggested.map((x) => x.toLowerCase()));
  const used = (Array.isArray(out.used) ? out.used : []).map((x) => String(x).trim()).filter((x) => sug.has(x.toLowerCase()));
  const parts = (Array.isArray(out.parts) ? out.parts : [])
    .map((p) => ({ text: String((p as { text?: unknown })?.text || '').trim(), phrases: cleanPhrases((p as { phrases?: unknown })?.phrases, 2) }))
    .filter((p) => p.text && p.phrases.length);
  return { used, parts };
}

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
/** `text`: what is wrong; `fix`: what to do about it (an instruction, never a question). Older saved checks have no `fix`. */
export interface ChainNote { type: NoteType; at: number; text: string; fix?: string }
/** One step of the sample chain built on the student's own (middle steps only): kept as written, edited, or added. */
export interface SampleStep { text: string; tag: 'keep' | 'edit' | 'add' }
export interface ChainCheckOut { notes: ChainNote[]; summary: string; good: boolean; sample?: SampleStep[] }

const KIND_VI: Record<ChainKind, string> = {
  cause: 'nguyên nhân (điểm đầu là một nguyên nhân, điểm cuối là hiện tượng đề hỏi)',
  impact: 'tác động (điểm đầu là điều đề nói tới, điểm cuối là tác động lên một người cụ thể)',
  solution: 'giải pháp (điểm đầu là một biện pháp, điểm cuối là vấn đề được giải quyết)',
};

export function describeChain(c: ChainIn) {
  const mid = c.steps.map((s) => s.trim()).filter(Boolean);
  const lines = ['MẠCH CỦA HỌC SINH', 'Loại mạch: ' + KIND_VI[c.kind] + (c.kind === 'impact' && c.tone ? ' · tông: ' + (c.tone === 'cost' ? 'tác hại' : 'lợi ích') : '')];
  if (c.sentence) lines.push('Câu chủ đề: ' + c.sentence);
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
  type: 'object', additionalProperties: false, required: ['good', 'notes', 'sample'],
  properties: {
    good: { type: 'boolean' },
    notes: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['type', 'at', 'text', 'fix'],
        properties: { type: { type: 'string', enum: ['jump', 'trait', 'detail'] }, at: { type: 'integer' }, text: { type: 'string' }, fix: { type: 'string' } },
      },
    },
    sample: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['text', 'tag'], properties: { text: { type: 'string' }, tag: { type: 'string', enum: ['keep', 'edit', 'add'] } } },
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

/** What the last check said, sent back with "Kiểm tra lại" so the recheck only has to judge those notes. */
export interface PrevCheck { steps: string[]; notes: ChainNote[] }

export async function aiChainCheck(userId: string, prompt: Prompt, chain: ChainIn, prev?: PrevCheck | null): Promise<ChainCheckOut> {
  const { text, n } = describeChain(chain);
  // A recheck after notes: short prompt, no METHOD, low effort. Otherwise the full read of the chain.
  const out = prev && prev.notes.length
    ? await ask<ChainCheckOut>({
      userId, kind: 'chain', task: CHAIN_RECHECK_TASK, schema: CHECK_SCHEMA, effort: 'low', maxTokens: 1500, grounded: false,
      input: 'ĐỀ BÀI\n' + prompt.text + '\n\nCHUỖI CŨ\nvị trí 0 · điểm đầu: ' + chain.start + '\n' + prev.steps.map((s, i) => 'vị trí ' + (i + 1) + ': ' + s).join('\n') + '\nvị trí ' + (prev.steps.length + 1) + ' · điểm cuối: ' + chain.end
        + '\n\nNHẬN XÉT LẦN TRƯỚC\n' + JSON.stringify(prev.notes) + '\n\nCHUỖI MỚI\n' + text,
    })
    : await ask<ChainCheckOut>({
      userId, kind: 'chain', task: CHECK_TASK, schema: CHECK_SCHEMA, effort: 'medium', maxTokens: 8000,
      input: describePrompt(prompt) + '\n\n' + text,
    });
  const notes = (out.notes || [])
    .map((x) => ({ type: x.type, at: Math.round(Number(x.at)), text: (x.text || '').trim(), fix: (x.fix || '').trim() }))
    // A jump sits between `at` and `at + 1`, so it can't start at the ending point; a trait or detail is on a middle step.
    .filter((x) => x.text && ['jump', 'trait', 'detail'].includes(x.type) && (x.type === 'jump' ? x.at >= 0 && x.at <= n : x.at >= 1 && x.at <= n));
  // The sample chain only comes with notes (a clean chain needs none), and only from steps that say something.
  const sample = notes.length ? (Array.isArray(out.sample) ? out.sample : [])
    .map((x) => ({ text: String(x?.text || '').trim().slice(0, 400), tag: (x?.tag === 'edit' || x?.tag === 'add' ? x.tag : 'keep') as SampleStep['tag'] }))
    .filter((x) => x.text).slice(0, 10) : [];
  return { notes, summary: '', good: !!out.good && !notes.some((x) => x.type === 'jump'), sample };
}

export interface NoteCheckOut { fixed: boolean; why: string }

/**
 * Enter on a step that had a note: does the chain now do what the note asked? One note, a short prompt, low effort,
 * so the card can collapse (or say what is still missing) right away.
 */
export async function aiNoteCheck(userId: string, prompt: Prompt, chain: ChainIn, note: ChainNote): Promise<NoteCheckOut> {
  const { text } = describeChain(chain);
  const out = await ask<{ fixed: unknown; why: unknown }>({
    userId, kind: 'chain', task: NOTE_CHECK_TASK, effort: 'low', maxTokens: 500, grounded: false,
    schema: { type: 'object', additionalProperties: false, required: ['fixed', 'why'], properties: { fixed: { type: 'boolean' }, why: { type: 'string' } } },
    input: 'ĐỀ BÀI\n' + prompt.text + '\n\nNHẬN XÉT CẦN XÉT\nloại: ' + note.type + ' · vị trí lúc nhận xét: ' + note.at + '\nvấn đề: ' + note.text + '\ncách sửa: ' + (note.fix || '(không có)') + '\n\n' + text,
  });
  return { fixed: !!out.fixed, why: out.fixed ? '' : String(out.why || '').trim().slice(0, 300) };
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
