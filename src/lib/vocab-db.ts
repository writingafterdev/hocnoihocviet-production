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

/** A phrase the student saved from the translator. */
export interface CustomPhrase { id: string; en: string; vi: string; createdAt: number }

export const CUSTOM_MAX = 500;

export async function listCustom(userId: string): Promise<CustomPhrase[]> {
  const { results } = await (await db()).prepare('select id, en, vi, createdAt from vocab_custom where userId = ? order by createdAt desc').bind(userId).all<CustomPhrase>();
  return results;
}

/** Saves a phrase (the same English again just updates its meaning). Returns it, or null when the book is full. */
export async function addCustom(userId: string, en: string, vi: string): Promise<CustomPhrase | null> {
  const d = await db();
  const n = await d.prepare('select count(*) as n from vocab_custom where userId = ?').bind(userId).first<{ n: number }>();
  const existing = await d.prepare('select id, createdAt from vocab_custom where userId = ? and lower(en) = lower(?)').bind(userId, en).first<{ id: string; createdAt: number }>();
  if (existing) {
    await d.prepare('update vocab_custom set en = ?, vi = ? where userId = ? and id = ?').bind(en, vi, userId, existing.id).run();
    return { id: existing.id, en, vi, createdAt: existing.createdAt };
  }
  if (n && n.n >= CUSTOM_MAX) return null;
  const row = { id: crypto.randomUUID(), en, vi, createdAt: Date.now() };
  await d.prepare('insert into vocab_custom (userId, id, en, vi, createdAt) values (?, ?, ?, ?, ?)').bind(userId, row.id, en, vi, row.createdAt).run();
  return row;
}

export async function deleteCustom(userId: string, id: string) {
  await (await db()).prepare('delete from vocab_custom where userId = ? and id = ?').bind(userId, id).run();
}
