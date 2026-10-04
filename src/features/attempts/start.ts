import type { Prompt } from '@/content/prompts';
import { SAMPLE_CHAINS, SAMPLE_DRAFTS, SAMPLE_PROMPT_ID, SAMPLE_STANCE, sampleReview } from '@/content/sample-assessment';
import { initialChains } from '../chainlab/model';
import { attemptStore, createAttempt } from './store';

/** Create and save a new "Viết tự do" attempt for a prompt; returns its ChainLab URL. */
export async function startFreeAttempt(prompt: Prompt): Promise<string> {
  const attempt = createAttempt(prompt.id, initialChains(prompt));
  await attemptStore.save(attempt);
  return '/write/' + attempt.id + '/chains';
}

/** Save a copy of the worked sample (outline, essay and assessment) as a new attempt; returns its Writing Desk URL. */
export async function startSampleAttempt(): Promise<string> {
  const attempt = createAttempt(SAMPLE_PROMPT_ID, SAMPLE_CHAINS.map((c) => ({ ...c })));
  attempt.stance = SAMPLE_STANCE;
  attempt.essay = { bodies: ['body1', 'body2'], drafts: { ...SAMPLE_DRAFTS }, seconds: 0, review: sampleReview() };
  await attemptStore.save(attempt);
  return '/write/' + attempt.id + '/essay';
}
