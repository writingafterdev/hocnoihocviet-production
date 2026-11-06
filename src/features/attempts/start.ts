import type { Prompt } from '@/content/prompts';
import type { Statement } from '@/content/statements';
import { bodyFromStatement, initialBodies } from '../essay/model';
import { attemptStore, createAttempt } from './store';

/** Create and save a new "Tự viết" attempt for a prompt; returns its ① Dựng mạch URL. */
export async function startFreeAttempt(prompt: Prompt): Promise<string> {
  const attempt = createAttempt(prompt.id, initialBodies(prompt));
  await attemptStore.save(attempt);
  return '/write/' + attempt.id + '/chains';
}

/** "Viết cả bài cho đề này": a new attempt whose first body paragraph is the chain from "Chứng minh nhanh". */
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
