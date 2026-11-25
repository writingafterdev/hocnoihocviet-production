import { findTask1Prompt } from '@/content/task1';
import { getUser } from '@/lib/auth';
import { aiErrorResponse, AiError } from '@/lib/ai/claude';
import { aiTask1Plan, type Task1Plan } from '@/lib/ai/task1';
import type { Row } from '@/features/task1/engine';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const rowsOk = (rows: unknown): rows is Row[] => Array.isArray(rows) && rows.length <= 20 && rows.every((r) => Array.isArray(r) && r.length <= 30 && r.every((e) => e && typeof e.id === 'string' && ['val', 'group', 'tip'].includes(e.k)));

/** Task 1 "Viết có hướng dẫn": the sample report from the student's plan, sentence by sentence. One "fix" use. */
export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  let body: { promptId: string; plan: Task1Plan };
  try { body = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  const pr = body && typeof body.promptId === 'string' ? findTask1Prompt(body.promptId) : null;
  const plan = body && body.plan;
  if (!pr || !plan || !rowsOk(plan.overview) || !Array.isArray(plan.bodies) || plan.bodies.length > 4 || !plan.bodies.every((b) => b && typeof b.key === 'string' && rowsOk(b.rows))) return json({ error: 'invalid' }, 400);
  try {
    return json({ sentences: await aiTask1Plan(user.id, pr, plan) });
  } catch (err) {
    return aiErrorResponse(err instanceof Error ? err : new AiError('upstream'), { route: 'task1-plan', userId: user.id });
  }
}
