import { json, listAttempts } from '@/lib/attempts-db';
import { getUser } from '@/lib/auth';

/** GET /api/attempts[?promptId=…]: the signed-in user's attempts, most recent first. */
export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const promptId = new URL(request.url).searchParams.get('promptId') || undefined;
  return json({ attempts: await listAttempts(user.id, promptId) });
}
