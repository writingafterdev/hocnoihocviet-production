import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getUser } from '@/lib/auth';

/** The signed-in user when their email is in ADMIN_EMAILS (comma-separated, Cloudflare variable); otherwise null. */
export async function getAdmin(request: Request) {
  const user = await getUser(request);
  if (!user || !user.email) return null;
  const { env } = await getCloudflareContext({ async: true });
  const allowed = (env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(user.email.toLowerCase()) ? user : null;
}

/** "minh.anh@gmail.com" → "m***@gmail.com". */
export const maskEmail = (email: string) => {
  const at = email.lastIndexOf('@');
  return at > 0 ? email[0] + '***' + email.slice(at) : '***';
};

/** Admin pages answer 404 to everyone else, so they don't reveal that they exist. */
export const notFound = () => Response.json({ error: 'not_found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
