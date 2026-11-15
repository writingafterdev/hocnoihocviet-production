import type { ReviewItem } from '../chainlab/types';
import { wordCount, type EssayReview } from '../desk/scoring';
import type { PlanTask } from './fix-api';

/** One guided fix: an idea or flow problem (TR / CC) that quotes the essay. `plan` = the AI's task, checked by the AI. */
export interface FixTask { item: ReviewItem; crit: string; title: string; ask: string[]; starter?: string; ok: string; plan?: PlanTask }

/** The AI's planned fixes as tasks (the essay's fix plan, or the drill paragraph's comments). */
export const planTasks = (plan: PlanTask[]): FixTask[] => plan.map((p, k) => ({
  item: { key: 'p' + k, where: '', text: p.title, sectionId: p.sectionId, quote: p.quote, chainId: p.sectionId },
  crit: p.criterion, title: p.title, ask: p.ask, starter: p.starter || undefined, ok: '', plan: p,
}));

/**
 * The fix round's tasks. With the AI's plan, one task per planned fix. Otherwise the comments that carry a guided
 * fix (`task`, the worked sample), or every TR / CC comment that quotes the essay, asked as its own text.
 */
export function fixTasks(review: EssayReview | null, plan?: PlanTask[]): FixTask[] {
  if (!review) return [];
  if (plan) return planTasks(plan);
  const all = review.groups.flatMap((g) => g.items.map((item) => ({ item, crit: g.id })));
  const guided = all.filter((n) => n.item.task);
  const pick = guided.length ? guided : all.filter((n) => (n.crit === 'tr' || n.crit === 'cc') && n.item.quote && n.item.sectionId);
  return pick.map(({ item, crit }) => ({
    item, crit,
    title: item.task?.title || item.label || 'Sửa ý',
    ask: item.task?.ask?.length ? item.task.ask : [item.text.replace(/\*\*/g, '')],
    starter: item.task?.starter,
    ok: item.task?.ok || 'Đã sửa xong chỗ này.',
  }));
}

/** Without the AI: a task is solved once its quoted words are gone and the paragraph hasn't simply been cut short. */
export const passes = (t: FixTask, text: string, before: string) => !text.includes(t.item.quote!) && wordCount(text) >= wordCount(before) - 3;
