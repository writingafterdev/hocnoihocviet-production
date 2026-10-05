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
  /** API key for reviews, scoring and translation (Claude, or the AI_BASE_URL provider's token). Unset = rule-based mocks. */
  ANTHROPIC_API_KEY?: string;
  /** Optional: another Anthropic-compatible endpoint, e.g. https://api-inference.modelscope.cn (testing) or Cloudflare AI Gateway. */
  AI_BASE_URL?: string;
  /** Optional: model ID for that endpoint, e.g. a ModelScope model. Unset = claude-opus-5-5. Non-Claude models skip thinking, fallbacks and enforced JSON. */
  AI_MODEL?: string;
  /** Comma-separated emails that can open /admin. Unset = nobody. */
  ADMIN_EMAILS?: string;
  /** Optional: full URL of Model Studio's decision-model endpoint (…/compatible-mode/v1/systemone). Unset = derived from a Model Studio AI_BASE_URL. */
  DECISION_URL?: string;
}
