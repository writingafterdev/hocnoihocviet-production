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
