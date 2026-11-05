import { findPrompt, type Prompt } from '@/content/prompts';
import { getUser } from '@/lib/auth';
import { readChain, type ChainIn } from './chain-coach';

const fail = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

/** Signed-in user + a known prompt + one valid chain; or the error response. */
export async function readCoachRequest(request: Request): Promise<{ userId: string; prompt: Prompt; chain: ChainIn; body: Record<string, unknown> } | Response> {
  const user = await getUser(request);
  if (!user) return fail('unauthorized', 401);
  const raw = await request.text();
  if (raw.length > 40 * 1024) return fail('invalid', 413);
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return fail('invalid', 400); }
  const prompt = body && typeof body.promptId === 'string' ? findPrompt(body.promptId) : null;
  const chain = body ? readChain(body.chain) : null;
  if (!prompt || !chain) return fail('invalid', 400);
  return { userId: user.id, prompt, chain, body };
}
