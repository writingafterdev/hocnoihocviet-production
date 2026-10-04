import { getAttempt, json, saveAttempt } from '@/lib/attempts-db';
import { getUser } from '@/lib/auth';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const attempt = await getAttempt(user.id, (await params).id);
  return attempt ? json({ attempt }) : json({ error: 'not_found' }, 404);
}

export async function PUT(request: Request, { params }: Ctx) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const error = await saveAttempt(user.id, (await params).id, await request.text());
  if (!error) return json({ ok: true });
  return json({ error }, error === 'not_found' ? 404 : error === 'too_large' ? 413 : 400);
}
