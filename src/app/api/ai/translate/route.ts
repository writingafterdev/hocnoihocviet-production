import { aiErrorResponse } from '@/lib/ai/claude';
import { aiTranslate, MAX_CHARS, type Direction } from '@/lib/ai/translate';
import { getUser } from '@/lib/auth';
import { isSkill } from '@/lib/vocab-topics';

const fail = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return fail('unauthorized', 401);
  let body: { text?: unknown; dir?: unknown; skill?: unknown };
  try { body = await request.json(); } catch { return fail('invalid', 400); }
  const dir = body.dir === 'vi-en' || body.dir === 'en-vi' ? (body.dir as Direction) : null;
  // Drop control characters (keep line breaks) before anything reaches the model.
  const text = typeof body.text === 'string' ? body.text.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').trim() : '';
  const skill = body.skill === undefined ? 'task2' : body.skill;
  if (!dir || !text || text.length > MAX_CHARS || !isSkill(skill)) return fail('invalid', 400);
  try {
    return Response.json(await aiTranslate(user.id, text, dir, skill), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err, { route: 'translate', userId: user.id });
  }
}
