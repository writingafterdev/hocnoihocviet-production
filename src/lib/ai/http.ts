import type { Prompt } from '@/content/prompts';
import { coachPrompt } from '@/lib/ai/coach-http';
import { getUser } from '@/lib/auth';
import { validChains } from '@/lib/ai/describe';
import type { Chain } from '@/features/chainlab/types';

const MAX_BYTES = 200 * 1024;
const fail = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

/** Signed-in user + parsed, size-checked body with a known prompt and valid chains; or the error response. */
export async function readAiRequest<T extends { promptId: string; chains: Chain[]; stance: string }>(request: Request): Promise<{ userId: string; prompt: Prompt; body: T } | Response> {
  const user = await getUser(request);
  if (!user) return fail('unauthorized', 401);
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return fail('invalid', 413);
  let body: T;
  try { body = JSON.parse(raw); } catch { return fail('invalid', 400); }
  // A library prompt, or one of missbacxiu's (Nghĩ ý's paragraph: guided sentences, comments, fixes).
  const prompt = body && typeof body.promptId === 'string' ? coachPrompt(body.promptId) : null;
  if (!prompt || !validChains(body.chains) || typeof (body.stance ?? '') !== 'string') return fail('invalid', 400);
  body.stance = (body.stance || '').slice(0, 2000);
  return { userId: user.id, prompt, body };
}
