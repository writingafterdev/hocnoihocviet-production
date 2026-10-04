import { aiErrorResponse } from '@/lib/ai/claude';
import { aiTranslate, MAX_CHARS, type Direction } from '@/lib/ai/translate';
import { getUser } from '@/lib/auth';

const fail = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return fail('unauthorized', 401);
  let body: { text?: unknown; dir?: unknown };
  try { body = await request.json(); } catch { return fail('invalid', 400); }
  const dir = body.dir === 'vi-en' || body.dir === 'en-vi' ? (body.dir as Direction) : null;
  // Drop control characters (keep line breaks) before anything reaches the model.
  const text = typeof body.text === 'string' ? body.text.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').trim() : '';
  if (!dir || !text || text.length > MAX_CHARS) return fail('invalid', 400);
  try {
    return Response.json({ translation: await aiTranslate(user.id, text, dir) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
