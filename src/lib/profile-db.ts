import { getCloudflareContext } from '@opennextjs/cloudflare';

export interface Profile { targetWriting: number | null; targetSpeaking: number | null; examDate: string | null }

async function db() {
  return (await getCloudflareContext({ async: true })).env.DB;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const row = await (await db()).prepare('select targetWriting, targetSpeaking, examDate from user_profile where userId = ?').bind(userId).first<Profile>();
  return row || null;
}

export async function saveProfile(userId: string, p: Profile) {
  const now = Date.now();
  await (await db()).prepare('insert into user_profile (userId, targetWriting, targetSpeaking, examDate, createdAt, updatedAt) values (?, ?, ?, ?, ?, ?) on conflict (userId) do update set targetWriting = excluded.targetWriting, targetSpeaking = excluded.targetSpeaking, examDate = excluded.examDate, updatedAt = excluded.updatedAt')
    .bind(userId, p.targetWriting, p.targetSpeaking, p.examDate, now, now).run();
}
