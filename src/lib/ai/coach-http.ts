import { findMbxPrompt } from '@/content/missbacxiu';
import { findPrompt, type Prompt } from '@/content/prompts';
import { getUser } from '@/lib/auth';
import { readChain, type ChainIn } from './chain-coach';

/**
 * A prompt by id: one from the library, or one of missbacxiu's ("mbx-…", Nghĩ ý), which the coach reads by its text only.
 */
export function coachPrompt(id: string): Prompt | null {
  if (!id.startsWith('mbx-')) return findPrompt(id);
  const p = findMbxPrompt(id);
  return p ? { id: p.id, text: p.text, questions: [], task: 'task2', category: 'Causes, Problems and Solutions', topic: 'Other Topics', source: 'missbacxiu', reqs: [], driver: '', stakeholders: [] } : null;
}

const fail = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

/** Signed-in user + a known prompt + one valid chain; or the error response. */
export async function readCoachRequest(request: Request): Promise<{ userId: string; prompt: Prompt; chain: ChainIn; body: Record<string, unknown> } | Response> {
  const user = await getUser(request);
  if (!user) return fail('unauthorized', 401);
  const raw = await request.text();
  if (raw.length > 40 * 1024) return fail('invalid', 413);
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return fail('invalid', 400); }
  const prompt = body && typeof body.promptId === 'string' ? coachPrompt(body.promptId) : null;
  const chain = body ? readChain(body.chain) : null;
  if (!prompt || !chain) return fail('invalid', 400);
  return { userId: user.id, prompt, chain, body };
}
