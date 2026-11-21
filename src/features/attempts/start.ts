import type { Prompt } from '@/content/prompts';
import type { Statement } from '@/content/statements';
import { directionQuestion } from '../essay/direction';
import { bodyFromStatement, initialBodies } from '../essay/model';
import { attemptStore, createAttempt, modeOf, type Attempt, type WritingMode } from './store';

/**
 * Create and save a new attempt for a prompt; returns where it opens. Tự viết has no chains and opens on the essay;
 * Viết có hướng dẫn starts on ① Dựng mạch.
 */
export async function startAttempt(prompt: Prompt, mode: WritingMode): Promise<string> {
  if (mode === 'free') {
    const attempt = createAttempt(prompt.id, [], 'free');
    attempt.essay = { ...attempt.essay, mode: 'free', notes: '' };
    await attemptStore.save(attempt);
    return '/write/' + attempt.id + '/essay';
  }
  // A prompt that asks for a side starts on ① Chọn hướng bài; its chains come from the direction.
  const pick = !!directionQuestion(prompt);
  const attempt = createAttempt(prompt.id, pick ? [] : initialBodies(prompt), 'guided');
  await attemptStore.save(attempt);
  return '/write/' + attempt.id + (pick ? '/direction' : '/chains');
}

/** Where an existing attempt opens: the essay once it is open (always, for Tự viết), else ① Dựng mạch. */
export const attemptHref = (a: Attempt) => {
  const open = modeOf(a) === 'free' || !!a.essay.mode || !!a.essay.guided || !!a.essay.review || Object.values(a.essay.drafts).some((t) => t.trim());
  return '/write/' + a.id + (open ? '/essay' : a.chains.length ? '/chains' : '/direction');
};

/** "Viết cả bài cho đề này": a new attempt whose first body paragraph is the chain from "Phát triển ý". */
export async function startFromStatement(prompt: Prompt, s: Statement, middle: string[]): Promise<string> {
  const attempt = createAttempt(prompt.id, bodyFromStatement(prompt, s, middle));
  await attemptStore.save(attempt);
  return '/write/' + attempt.id + '/chains';
}

/** Save a copy of the assessed sample essay as a new attempt; returns its ② Viết bài URL. */
export async function startSampleAttempt(): Promise<string> {
  const { SAMPLE_CHAINS, SAMPLE_DRAFTS, SAMPLE_PROMPT_ID, sampleReview } = await import('@/content/sample-review');
  const attempt = createAttempt(SAMPLE_PROMPT_ID, SAMPLE_CHAINS.map((c) => ({ ...c, steps: [...c.steps] })));
  attempt.essay = { ...attempt.essay, drafts: { ...SAMPLE_DRAFTS }, seconds: 2280, review: sampleReview() };
  await attemptStore.save(attempt);
  return '/write/' + attempt.id + '/essay';
}
