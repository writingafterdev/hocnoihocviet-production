import { getCloudflareContext } from '@opennextjs/cloudflare';
import { APIError, betterAuth } from 'better-auth';

/**
 * Better Auth for one request. Bindings (D1, secrets) only exist per request on Workers,
 * so the instance is created from the request's Cloudflare env.
 */
export async function getAuth(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const origin = new URL(request.url).origin;
  const allowed = (env.ALLOWED_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: origin,
    trustedOrigins: [origin],
    socialProviders: {
      google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: 'select_account' },
    },
    emailAndPassword: { enabled: env.DEV_PASSWORD_LOGIN === '1' },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (allowed.length && !allowed.includes(user.email.toLowerCase())) {
              throw new APIError('FORBIDDEN', { message: 'not_allowed' });
            }
            return { data: user };
          },
        },
      },
    },
  });
}

/** The signed-in user for an API request, or null. */
export async function getUser(request: Request) {
  const auth = await getAuth(request);
  const session = await auth.api.getSession({ headers: request.headers });
  return session ? session.user : null;
}
