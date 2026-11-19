import { findMbxPrompt } from '@/content/missbacxiu';
import { getUser } from '@/lib/auth';
import { aiErrorResponse } from '@/lib/ai/claude';
import { aiIdeaEnds } from '@/lib/ai/idea-ends';

const fail = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

/** Nghĩ ý: { promptId } (one of missbacxiu's) → the given end, the question in the empty end, and the two hints. */
export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return fail('unauthorized', 401);
  let body: { promptId?: unknown };
  try { body = await request.json(); } catch { return fail('invalid', 400); }
  const p = typeof body.promptId === 'string' ? findMbxPrompt(body.promptId) : null;
  if (!p) return fail('invalid', 400);
  try {
    return Response.json(await aiIdeaEnds(user.id, p), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err, { route: 'idea-ends', userId: user.id });
  }
}
