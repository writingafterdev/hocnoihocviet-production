import { getUser } from '@/lib/auth';

/** Task 1 is open to every signed-in student (it was admins only while it was being built). */
export async function GET(request: Request) {
  if (!(await getUser(request))) return Response.json({ error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
