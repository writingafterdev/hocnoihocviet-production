import { getAdmin, notFound } from '@/lib/admin';
import { json } from '@/lib/attempts-db';
import { listTask1Attempts } from '@/lib/task1-db';

/** GET /api/task1/attempts[?promptId=…]: the signed-in admin's Task 1 attempts, most recent first. */
export async function GET(request: Request) {
  const user = await getAdmin(request);
  if (!user) return notFound();
  const promptId = new URL(request.url).searchParams.get('promptId') || undefined;
  return json({ attempts: await listTask1Attempts(user.id, promptId) });
}
