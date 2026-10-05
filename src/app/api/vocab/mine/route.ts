import { getUser } from '@/lib/auth';
import { aiErrorResponse } from '@/lib/ai/claude';
import { aiVocabDetail } from '@/lib/ai/vocab-detail';
import { addCustom, CUSTOM_MAX, deleteCustom, getCustom, listCustom, setCustomDetail, setCustomTopic } from '@/lib/vocab-db';
import { cleanTopic, isSkill, topicsFor } from '@/lib/vocab-topics';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const clean = (x: unknown, max: number) => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim() : '').slice(0, max);

/** The student's saved phrases (from the translator), all skills. */
export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  return json({ items: await listCustom(user.id), max: CUSTOM_MAX });
}

/** { en, vi, skill?, topic? } → saved phrase. 409 "full" when the book has CUSTOM_MAX phrases. */
export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  let body: { en?: unknown; vi?: unknown; skill?: unknown; topic?: unknown };
  try { body = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  const en = clean(body.en, 300), vi = clean(body.vi, 600);
  const skill = body.skill === undefined ? 'task2' : body.skill;
  if (!en || !vi || !isSkill(skill)) return json({ error: 'invalid' }, 400);
  const item = await addCustom(user.id, skill, cleanTopic(skill, body.topic), en, vi);
  if (!item) return json({ error: 'full' }, 409);
  // Fill in the dictionary columns; the phrase stays saved if this fails (the list offers to try again).
  if (!item.detail) {
    try { item.detail = await aiVocabDetail(user.id, skill, item.en, item.vi); await setCustomDetail(user.id, item.id, item.detail); } catch { /* saved without detail */ }
  }
  return json({ item });
}

/** { id } → writes the dictionary columns of a saved phrase that has none. */
export async function PUT(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  let body: { id?: unknown };
  try { body = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  if (typeof body.id !== 'string' || !body.id || body.id.length > 64) return json({ error: 'invalid' }, 400);
  const item = await getCustom(user.id, body.id);
  if (!item) return json({ error: 'not_found' }, 404);
  if (item.detail) return json({ item });
  try {
    const detail = await aiVocabDetail(user.id, item.skill, item.en, item.vi);
    await setCustomDetail(user.id, item.id, detail);
    return json({ item: { ...item, detail } });
  } catch (err) {
    return aiErrorResponse(err, { route: 'vocab/mine', userId: user.id });
  }
}

/** { id, topic } → moves a saved phrase to another topic of its skill. */
export async function PATCH(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  let body: { id?: unknown; skill?: unknown; topic?: unknown };
  try { body = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  if (typeof body.id !== 'string' || !body.id || body.id.length > 64 || !isSkill(body.skill) || typeof body.topic !== 'string' || !topicsFor(body.skill).includes(body.topic)) return json({ error: 'invalid' }, 400);
  await setCustomTopic(user.id, body.id, body.topic);
  return json({ ok: true });
}

/** ?id=… → removed. */
export async function DELETE(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!id || id.length > 64) return json({ error: 'invalid' }, 400);
  await deleteCustom(user.id, id);
  return json({ ok: true });
}
