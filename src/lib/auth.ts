import { getCloudflareContext } from '@opennextjs/cloudflare';
import { APIError, betterAuth } from 'better-auth';

function createAuth(env: CloudflareEnv, origin: string, urlOrigin: string) {
  const allowed = (env.ALLOWED_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: origin,
    trustedOrigins: [...new Set([origin, urlOrigin])],
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

/**
 * Better Auth, built once per Worker instance and origin and then reused: building it is costly in CPU, and
 * Workers Free allows only 10 ms of CPU per request. Bindings stay valid for the life of the instance;
 * the key includes the settings, so a changed secret or flag gets a fresh instance.
 */
const cache = new Map<string, ReturnType<typeof createAuth>>();

export async function getAuth(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  // The public origin. Prefer the Host header in case the runtime rewrote request.url.
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  const origin = proto + '://' + host;
  const key = [origin, url.origin, env.BETTER_AUTH_SECRET, env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.ALLOWED_EMAILS, env.DEV_PASSWORD_LOGIN].join('\n');
  let auth = cache.get(key);
  if (!auth) { auth = createAuth(env, origin, url.origin); cache.set(key, auth); }
  return auth;
}

/** The signed-in user for an API request, or null. */
export async function getUser(request: Request) {
  const auth = await getAuth(request);
  const session = await auth.api.getSession({ headers: request.headers });
  return session ? session.user : null;
}
