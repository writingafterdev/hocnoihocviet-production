import type { GuidedSample } from '@/features/guided/data';
import { findPrompt } from '../prompts';
import { SAMPLE_IDS } from './index';

export interface SampleFile { promptId: string; source: 'book' | 'hocnoihocviet'; note?: string; paragraphs: GuidedSample['paragraphs'] }

/** The Chép mẫu sample for a prompt (server side, so only that one essay ships to the page), or null. */
export async function loadSample(promptId: string): Promise<(GuidedSample & { source: SampleFile['source'] }) | null> {
  const p = findPrompt(promptId);
  if (!p || !SAMPLE_IDS.has(promptId)) return null;
  const file = (await import(`./${promptId}.json`)).default as SampleFile;
  return { id: promptId, prompt: p.text, paragraphs: file.paragraphs, source: file.source };
}
