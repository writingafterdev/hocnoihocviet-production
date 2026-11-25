import { getUser } from '@/lib/auth';
import { json } from '@/lib/attempts-db';
import { listTask1Attempts } from '@/lib/task1-db';

/** GET /api/task1/attempts[?promptId=…]: the signed-in student's Task 1 attempts, most recent first. */
export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  const promptId = new URL(request.url).searchParams.get('promptId') || undefined;
  return json({ attempts: await listTask1Attempts(user.id, promptId) });
}
