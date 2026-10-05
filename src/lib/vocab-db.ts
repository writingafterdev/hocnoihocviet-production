import { getCloudflareContext } from '@opennextjs/cloudflare';
import { VB_SKILLS } from '@/features/vocab/data';

/** Every phrase in the vocab sets; only these can be saved or counted. */
export const KNOWN_PHRASES: ReadonlySet<string> = new Set(VB_SKILLS.flatMap((s) => s.topics.flatMap((t) => t.items.map((i) => i.en))));

export interface VocabProgress { saved: Record<string, boolean>; practiced: Record<string, number> }

async function db() {
  return (await getCloudflareContext({ async: true })).env.DB;
}

export async function getProgress(userId: string): Promise<VocabProgress> {
  const { results } = await (await db()).prepare('select phrase, saved, practiced from vocab_progress where userId = ?').bind(userId).all<{ phrase: string; saved: number; practiced: number }>();
  const out: VocabProgress = { saved: {}, practiced: {} };
  results.forEach((r) => { if (r.saved) out.saved[r.phrase] = true; if (r.practiced) out.practiced[r.phrase] = r.practiced; });
  return out;
}

export async function setSaved(userId: string, phrase: string, saved: boolean) {
  await (await db()).prepare('insert into vocab_progress (userId, phrase, saved, practiced, updatedAt) values (?, ?, ?, 0, ?) on conflict (userId, phrase) do update set saved = excluded.saved, updatedAt = excluded.updatedAt')
    .bind(userId, phrase, saved ? 1 : 0, Date.now()).run();
}

export async function addPracticed(userId: string, phrases: string[]) {
  const d = await db(), now = Date.now();
  await d.batch(phrases.map((p) => d.prepare('insert into vocab_progress (userId, phrase, saved, practiced, updatedAt) values (?, ?, 0, 1, ?) on conflict (userId, phrase) do update set practiced = practiced + 1, updatedAt = excluded.updatedAt').bind(userId, p, now)));
}
