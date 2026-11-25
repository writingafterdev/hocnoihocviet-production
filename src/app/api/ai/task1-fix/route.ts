import { findTask1Prompt } from '@/content/task1';
import { getUser } from '@/lib/auth';
import { aiErrorResponse, AiError } from '@/lib/ai/claude';
import { aiTask1FixCheck, aiTask1Rescore, type T1FixTask, type T1Scores } from '@/lib/ai/task1';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const text = (x: unknown, max: number) => typeof x === 'string' && x.length <= max;
const CRITS = ['ta', 'cc', 'lr', 'gra'];
const paras = (p: unknown): p is string[] => Array.isArray(p) && p.length >= 1 && p.length <= 10 && p.every((t) => text(t, 4000));

/**
 * Task 1 Sửa bài. action "check": is one comment fixed in the edited paragraph; "rescore": the scores after the round,
 * anchored to the last grading. Each takes one "fix" use.
 */
export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  const pr = typeof b?.promptId === 'string' ? findTask1Prompt(b.promptId) : null;
  if (!pr) return json({ error: 'invalid' }, 400);
  try {
    if (b.action === 'check') {
      const t = b.task as T1FixTask;
      if (!t || !CRITS.includes(t.crit) || !text(t.label, 100) || !text(t.text, 800) || !text(t.how, 400) || !text(t.quote, 600) || !text(b.before, 4000) || !text(b.after, 4000)) return json({ error: 'invalid' }, 400);
      return json(await aiTask1FixCheck(user.id, pr, t, b.before as string, b.after as string));
    }
    if (b.action === 'rescore') {
      const prev = b.prev as T1Scores, tasks = b.tasks as { label: string; crit: string; text: string; solved: boolean }[];
      const why = Object.fromEntries(CRITS.map((k) => [k, String((b.why as Record<string, unknown> | undefined)?.[k] ?? '').slice(0, 1200)]));
      if (!prev || !CRITS.every((k) => Number.isFinite(prev[k as keyof T1Scores])) || !paras(b.before) || !paras(b.after) || !Array.isArray(tasks) || tasks.length > 12) return json({ error: 'invalid' }, 400);
      const clean = tasks.map((t) => ({ label: String(t?.label || '').slice(0, 100), crit: String(t?.crit || '').slice(0, 4), text: String(t?.text || '').slice(0, 600), solved: !!t?.solved }));
      return json(await aiTask1Rescore(user.id, pr, prev, why, clean, b.before, b.after));
    }
    return json({ error: 'invalid' }, 400);
  } catch (err) {
    return aiErrorResponse(err instanceof Error ? err : new AiError('upstream'), { route: 'task1-fix/' + String(b.action), userId: user.id });
  }
}
