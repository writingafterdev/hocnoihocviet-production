import { getAdmin, notFound } from '@/lib/admin';

/** Task 1 is open only to admins while it is being built: 200 for them, 404 for everyone else. */
export async function GET(request: Request) {
  if (!(await getAdmin(request))) return notFound();
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
