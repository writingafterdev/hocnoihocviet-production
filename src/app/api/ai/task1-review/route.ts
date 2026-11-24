import { findTask1Prompt } from '@/content/task1';
import { getAdmin, notFound } from '@/lib/admin';
import { aiErrorResponse, AiError } from '@/lib/ai/claude';
import { aiTask1Review } from '@/lib/ai/task1';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** Task 1 "Nộp bài": the assessment of the report against the Task 1 criteria and the prompt's key features. One "essay" use. Admins only for now. */
export async function POST(request: Request) {
  const user = await getAdmin(request);
  if (!user) return notFound();
  let body: { promptId: string; paragraphs: string[] };
  try { body = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  const pr = body && typeof body.promptId === 'string' ? findTask1Prompt(body.promptId) : null;
  const paras = Array.isArray(body && body.paragraphs) ? body.paragraphs.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.slice(0, 4000)).slice(0, 10) : [];
  if (!pr || !paras.length) return json({ error: 'invalid' }, 400);
  try {
    return json({ review: await aiTask1Review(user.id, pr, paras) });
  } catch (err) {
    return aiErrorResponse(err instanceof Error ? err : new AiError('upstream'), { route: 'task1-review', userId: user.id });
  }
}
