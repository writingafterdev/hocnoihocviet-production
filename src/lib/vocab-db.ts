import { getCloudflareContext } from '@opennextjs/cloudflare';
import { VB_SKILLS } from '@/features/vocab/data';
import type { VocabSkillId } from './vocab-topics';
import { cleanDetail, type VocabDetail } from './ai/vocab-detail';

/** Every phrase in the vocab sets; only these can be saved or counted. */
export const KNOWN_PHRASES: ReadonlySet<string> = new Set(VB_SKILLS.flatMap((s) => s.topics.flatMap((t) => t.items.map((i) => i.en))));

export interface VocabProgress { practiced: Record<string, number> }

async function db() {
  return (await getCloudflareContext({ async: true })).env.DB;
}

export async function getProgress(userId: string): Promise<VocabProgress> {
  const { results } = await (await db()).prepare('select phrase, practiced from vocab_progress where userId = ? and practiced > 0').bind(userId).all<{ phrase: string; practiced: number }>();
  const out: VocabProgress = { practiced: {} };
  results.forEach((r) => { out.practiced[r.phrase] = r.practiced; });
  return out;
}

export async function addPracticed(userId: string, phrases: string[]) {
  const d = await db(), now = Date.now();
  await d.batch(phrases.map((p) => d.prepare('insert into vocab_progress (userId, phrase, saved, practiced, updatedAt) values (?, ?, 0, 1, ?) on conflict (userId, phrase) do update set practiced = practiced + 1, updatedAt = excluded.updatedAt').bind(userId, p, now)));
}

/** A phrase the student saved from the translator, filed under a skill and a topic. */
export interface CustomPhrase { id: string; skill: VocabSkillId; topic: string; en: string; vi: string; createdAt: number; detail: VocabDetail | null }

export const CUSTOM_MAX = 500;

export async function listCustom(userId: string): Promise<CustomPhrase[]> {
  const { results } = await (await db()).prepare('select id, skill, topic, en, vi, createdAt, detail from vocab_custom where userId = ? order by createdAt desc').bind(userId).all<Omit<CustomPhrase, 'detail'> & { detail: string | null }>();
  return results.map(rowOf);
}

function rowOf(r: Omit<CustomPhrase, 'detail'> & { detail: string | null }): CustomPhrase {
  let detail: VocabDetail | null = null;
  try { detail = r.detail ? cleanDetail(JSON.parse(r.detail)) : null; } catch { /* unreadable: shown as not filled in */ }
  return { ...r, detail };
}

export async function getCustom(userId: string, id: string): Promise<CustomPhrase | null> {
  const r = await (await db()).prepare('select id, skill, topic, en, vi, createdAt, detail from vocab_custom where userId = ? and id = ?').bind(userId, id).first<Omit<CustomPhrase, 'detail'> & { detail: string | null }>();
  return r ? rowOf(r) : null;
}

export async function setCustomDetail(userId: string, id: string, detail: VocabDetail) {
  await (await db()).prepare('update vocab_custom set detail = ? where userId = ? and id = ?').bind(JSON.stringify(detail), userId, id).run();
}

/** Saves a phrase (the same English again, in the same skill, updates its meaning and keeps its topic). Null when the book is full. */
export async function addCustom(userId: string, skill: VocabSkillId, topic: string, en: string, vi: string): Promise<CustomPhrase | null> {
  const d = await db();
  const existing = await d.prepare('select id, topic, createdAt from vocab_custom where userId = ? and skill = ? and lower(en) = lower(?)').bind(userId, skill, en).first<{ id: string; topic: string; createdAt: number }>();
  if (existing) {
    await d.prepare('update vocab_custom set en = ?, vi = ? where userId = ? and id = ?').bind(en, vi, userId, existing.id).run();
    return (await getCustom(userId, existing.id)) as CustomPhrase;
  }
  const n = await d.prepare('select count(*) as n from vocab_custom where userId = ?').bind(userId).first<{ n: number }>();
  if (n && n.n >= CUSTOM_MAX) return null;
  const row: CustomPhrase = { id: crypto.randomUUID(), skill, topic, en, vi, createdAt: Date.now(), detail: null };
  await d.prepare('insert into vocab_custom (userId, id, skill, topic, en, vi, createdAt) values (?, ?, ?, ?, ?, ?, ?)').bind(userId, row.id, skill, topic, en, vi, row.createdAt).run();
  return row;
}

export async function setCustomTopic(userId: string, id: string, topic: string) {
  await (await db()).prepare('update vocab_custom set topic = ? where userId = ? and id = ?').bind(topic, userId, id).run();
}

export async function deleteCustom(userId: string, id: string) {
  await (await db()).prepare('delete from vocab_custom where userId = ? and id = ?').bind(userId, id).run();
}
