import { aiConfigured, DAILY_LIMIT, remaining } from '@/lib/ai/claude';
import { getUser } from '@/lib/auth';

/** Today's remaining AI uses for the signed-in student. */
export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
  return Response.json({ configured: await aiConfigured(), limits: DAILY_LIMIT, remaining: await remaining(user.id) }, { headers: { 'Cache-Control': 'no-store' } });
}
