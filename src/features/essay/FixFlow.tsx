import type { ReviewItem } from '../chainlab/types';
import { wordCount } from '../desk/scoring';
import type { PlanTask } from './fix-api';

/** One guided fix: an idea or flow problem (TR / CC) that quotes the essay. `plan` = the AI's task, checked by the AI. */
export interface FixTask { item: ReviewItem; crit: string; title: string; ask: string[]; starter?: string; ok: string; plan?: PlanTask }

/** The AI's planned fixes as tasks (the essay's fix plan, or the drill paragraph's comments). */
export const planTasks = (plan: PlanTask[]): FixTask[] => plan.map((p, k) => ({
  item: { key: 'p' + k, where: '', text: p.title, sectionId: p.sectionId, quote: p.quote, chainId: p.sectionId },
  crit: p.criterion, title: p.title, ask: p.ask, starter: p.starter || undefined, ok: '', plan: p,
}));

/** Without the AI: a task is solved once its quoted words are gone and the paragraph hasn't simply been cut short. */
export const passes = (t: FixTask, text: string, before: string) => !text.includes(t.item.quote!) && wordCount(text) >= wordCount(before) - 3;
