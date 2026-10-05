import { getUser } from '@/lib/auth';
import { addCustom, CUSTOM_MAX, deleteCustom, listCustom } from '@/lib/vocab-db';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const clean = (x: unknown, max: number) => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim() : '').slice(0, max);

/** The student's word book: phrases saved from the translator. */
export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  return json({ items: await listCustom(user.id), max: CUSTOM_MAX });
}

/** { en, vi } → saved phrase. 409 "full" when the book has CUSTOM_MAX phrases. */
export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  let body: { en?: unknown; vi?: unknown };
  try { body = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  const en = clean(body.en, 300), vi = clean(body.vi, 600);
  if (!en || !vi) return json({ error: 'invalid' }, 400);
  const item = await addCustom(user.id, en, vi);
  return item ? json({ item }) : json({ error: 'full' }, 409);
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
