import { aiErrorResponse, AiError } from '@/lib/ai/claude';
import { aiFixCheck, aiFixPlan, aiRescore, type FixComment, type PlanTask, type RescoreTask, type Scores } from '@/lib/ai/essay-fix';
import type { SectionIn } from '@/lib/ai/essay-review';
import { readAiRequest } from '@/lib/ai/http';
import type { Chain } from '@/features/chainlab/types';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const text = (x: unknown, max: number) => typeof x === 'string' && x.length <= max;
const validSections = (s: unknown): s is SectionIn[] =>
  Array.isArray(s) && s.length >= 1 && s.length <= 12 && s.every((x) => x && text(x.id, 100) && text(x.label, 100) && text(x.text, 8000));
const validScores = (s: unknown): s is Scores =>
  !!s && typeof s === 'object' && ['tr', 'cc', 'lr', 'gra'].every((k) => Number.isFinite((s as Record<string, unknown>)[k]));
const validTask = (t: unknown): t is PlanTask => {
  const x = t as PlanTask;
  return !!x && text(x.sectionId, 100) && (x.criterion === 'tr' || x.criterion === 'cc') && text(x.quote, 600) && text(x.title, 100) && Array.isArray(x.ask) && x.ask.length <= 3 && x.ask.every((q) => text(q, 400)) && text(x.starter, 200) && text(x.aim, 800);
};

/**
 * The fix round. action "plan": tasks from the grading's TR/CC comments; "check": is one task solved in the edited
 * paragraph; "rescore": the scores after the round, anchored to the last grading. Each takes one "fix" use.
 */
export async function POST(request: Request) {
  const r = await readAiRequest<{ promptId: string; chains: Chain[]; stance: string; action: string } & Record<string, unknown>>(request);
  if (r instanceof Response) return r;
  const b = r.body;
  try {
    if (b.action === 'plan') {
      const comments = b.comments as FixComment[];
      if (!validSections(b.sections) || !Array.isArray(comments) || comments.length > 40) return json({ error: 'invalid' }, 400);
      if (!comments.length) return json({ tasks: [] });
      return json({ tasks: await aiFixPlan(r.userId, r.prompt, b.sections, b.chains, comments) });
    }
    if (b.action === 'check') {
      if (!validTask(b.task) || !text(b.before, 8000) || !text(b.after, 8000)) return json({ error: 'invalid' }, 400);
      const chain = b.chains.find((c) => c.id === (b.task as PlanTask).sectionId) || null;
      return json(await aiFixCheck(r.userId, r.prompt, chain, b.task, b.before as string, b.after as string));
    }
    if (b.action === 'rescore') {
      const tasks = b.tasks as RescoreTask[];
      const why = Object.fromEntries(['tr', 'cc', 'lr', 'gra'].map((k) => [k, String((b.why as Record<string, unknown> | undefined)?.[k] ?? '').slice(0, 1200)]));
      if (!validScores(b.prev) || !validSections(b.before) || !validSections(b.after) || !Array.isArray(tasks) || tasks.length > 8) return json({ error: 'invalid' }, 400);
      return json(await aiRescore(r.userId, r.prompt, b.prev, why, tasks, b.before, b.after));
    }
    return json({ error: 'invalid' }, 400);
  } catch (err) {
    return aiErrorResponse(err instanceof Error ? err : new AiError('upstream'), { route: 'essay-fix/' + String(b.action), userId: r.userId });
  }
}
