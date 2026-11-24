import { findTask1Prompt } from '@/content/task1';
import { getAdmin, notFound } from '@/lib/admin';
import { aiErrorResponse, AiError } from '@/lib/ai/claude';
import { aiTask1Hint } from '@/lib/ai/task1';
import type { Row } from '@/features/task1/engine';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const rowOk = (r: unknown): r is Row => Array.isArray(r) && r.length <= 30 && r.every((e) => e && typeof e.id === 'string' && e.id.length < 80 && ['val', 'group', 'tip'].includes(e.k));

/** Task 1 ① So sánh: Gợi ý, a question then its answer, pointing at a key feature the checks found. One "hint" use. Admins only for now. */
export async function POST(request: Request) {
  const user = await getAdmin(request);
  if (!user) return notFound();
  let body: { promptId: string; found: Row[]; row: Row };
  try { body = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  const pr = body && typeof body.promptId === 'string' ? findTask1Prompt(body.promptId) : null;
  if (!pr || !Array.isArray(body.found) || body.found.length > 40 || !body.found.every(rowOk) || !rowOk(body.row)) return json({ error: 'invalid' }, 400);
  try {
    return json({ hint: await aiTask1Hint(user.id, pr, body.found, body.row) });
  } catch (err) {
    return aiErrorResponse(err instanceof Error ? err : new AiError('upstream'), { route: 'task1-hint', userId: user.id });
  }
}
