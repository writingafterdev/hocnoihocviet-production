import { getAdmin, notFound } from '@/lib/admin';
import { json } from '@/lib/attempts-db';
import { getTask1Attempt, saveTask1Attempt } from '@/lib/task1-db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const user = await getAdmin(request);
  if (!user) return notFound();
  const attempt = await getTask1Attempt(user.id, (await params).id);
  return attempt ? json({ attempt }) : json({ error: 'not_found' }, 404);
}

export async function PUT(request: Request, { params }: Ctx) {
  const user = await getAdmin(request);
  if (!user) return notFound();
  const error = await saveTask1Attempt(user.id, (await params).id, await request.text());
  if (!error) return json({ ok: true });
  return json({ error }, error === 'not_found' ? 404 : error === 'too_large' ? 413 : 400);
}
