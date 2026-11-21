import { findPrompt } from '@/content/prompts';
import { getUser } from '@/lib/auth';
import { aiErrorResponse } from '@/lib/ai/claude';
import { directionWording } from '@/lib/ai/direction';
import { directionQuestion } from '@/features/essay/direction';

const fail = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

/** Chọn hướng bài: { promptId } → what each mạch ý does in each direction, for that prompt (shared by every student). */
export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return fail('unauthorized', 401);
  let body: { promptId?: unknown };
  try { body = await request.json(); } catch { return fail('invalid', 400); }
  const p = typeof body.promptId === 'string' ? findPrompt(body.promptId) : null;
  if (!p || !directionQuestion(p)) return fail('invalid', 400);
  try {
    return Response.json({ wording: await directionWording(user.id, p) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err, { route: 'direction', userId: user.id });
  }
}
