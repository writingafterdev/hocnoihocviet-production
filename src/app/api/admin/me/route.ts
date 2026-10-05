import { getAdmin } from '@/lib/admin';

/** { admin: boolean }: whether the signed-in user may open /admin (used to show the menu link). */
export async function GET(request: Request) {
  return Response.json({ admin: !!(await getAdmin(request)) }, { headers: { 'Cache-Control': 'no-store' } });
}
