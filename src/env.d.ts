// Bindings and secrets this app reads from Cloudflare (see wrangler.jsonc and the Worker's Variables and Secrets).
// Minimal D1 types, so we don't pull in @cloudflare/workers-types (it clashes with the DOM lib).
interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: { changes?: number } & Record<string, unknown>;
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(column?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

interface CloudflareEnv {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  /** Optional: comma-separated emails allowed to sign up. Unset = anyone with a Google account. */
  ALLOWED_EMAILS?: string;
  /** Local testing only (.dev.vars): enables email + password sign-in. Never set in production. */
  DEV_PASSWORD_LOGIN?: string;
}
