import type { Prompt } from '@/content/prompts';
import { initialChains } from '../chainlab/model';
import { attemptStore, createAttempt } from './store';

/** Create and save a new "Viết tự do" attempt for a prompt; returns its ChainLab URL. */
export async function startFreeAttempt(prompt: Prompt): Promise<string> {
  const attempt = createAttempt(prompt.id, initialChains(prompt));
  await attemptStore.save(attempt);
  return '/write/' + attempt.id + '/chains';
}
