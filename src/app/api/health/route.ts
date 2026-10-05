import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Setup check: database tables and which secrets are present (never their values).
 * Safe to leave public; it reveals nothing a visitor could use.
 */
export async function GET(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  let tables: string[] | string;
  try {
    const { results } = await env.DB.prepare("select name from sqlite_master where type = 'table' and name not like '\\_cf%' escape '\\' order by name").all<{ name: string }>();
    tables = results.map((r) => r.name);
  } catch (e) {
    tables = 'error: ' + (e instanceof Error ? e.message : String(e));
  }
  const need = ['user', 'session', 'account', 'verification', 'attempt', 'ai_usage', 'vocab_progress'];
  return Response.json({
    origin: new URL(request.url).origin,
    host: request.headers.get('host'),
    database: { tables, ready: Array.isArray(tables) && need.every((t) => tables.includes(t)) },
    secrets: {
      BETTER_AUTH_SECRET: !!env.BETTER_AUTH_SECRET && env.BETTER_AUTH_SECRET.length >= 32,
      GOOGLE_CLIENT_ID: !!env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com'),
      GOOGLE_CLIENT_SECRET: !!env.GOOGLE_CLIENT_SECRET,
      ANTHROPIC_API_KEY: !!env.ANTHROPIC_API_KEY && (!!env.AI_BASE_URL || env.ANTHROPIC_API_KEY.startsWith('sk-ant-')),
    },
    ai: { endpoint: env.AI_BASE_URL ? new URL(env.AI_BASE_URL).host : 'api.anthropic.com', model: env.AI_MODEL || 'claude-opus-5-5' },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
