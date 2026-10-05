import { getUser } from '@/lib/auth';
import { addCustom, CUSTOM_MAX, deleteCustom, listCustom, setCustomTopic } from '@/lib/vocab-db';
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
  return item ? json({ item }) : json({ error: 'full' }, 409);
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
