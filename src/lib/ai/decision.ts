/**
 * Alibaba Model Studio's decision model (decision-model-preview): classification, yes/no and scoring with
 * probabilities, in one forward pass and without generating text.
 * Docs: https://docs.modelstudio.console.alibabacloud.com (Decision Model API).
 * Endpoint: POST {Model Studio host}/compatible-mode/v1/systemone, `Authorization: Bearer <key>`.
 * Reply: { answers: { <question id>: { type, choice, confidence, probabilities } }, usage, latency_ms }.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const DECISION_MODEL = 'decision-model-preview';
/** The docs recommend at most 16 questions per request (latency grows with each one). */
const MAX_QUESTIONS = 16;

export interface ChoiceQuestion { type: 'choice'; instructions: string; criteria: Record<string, string> }
export interface ChoiceAnswer { choice: string; confidence: number }

/** The systemone URL, from DECISION_URL or derived from a Model Studio AI_BASE_URL; null when unavailable. */
async function endpoint() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.ANTHROPIC_API_KEY) return null;
  if (env.DECISION_URL) return { url: env.DECISION_URL, key: env.ANTHROPIC_API_KEY };
  if (!env.AI_BASE_URL || !/\.maas\.aliyuncs\.com$/.test(new URL(env.AI_BASE_URL).host)) return null;
  return { url: new URL(env.AI_BASE_URL).origin + '/compatible-mode/v1/systemone', key: env.ANTHROPIC_API_KEY };
}

async function call(ep: { url: string; key: string }, state: unknown, questions: Record<string, ChoiceQuestion>, timeoutMs: number) {
  const res = await fetch(ep.url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + ep.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: DECISION_MODEL, state, questions }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(res.status + ' ' + text.slice(0, 300));
  const data = JSON.parse(text) as { answers?: Record<string, { choice?: string; confidence?: number }>; latency_ms?: number; usage?: { input_tokens?: number } };
  console.log('decision_ok', Object.keys(data.answers || {}).length + '/' + Object.keys(questions).length, (data.latency_ms ?? '?') + 'ms', 'in=' + (data.usage?.input_tokens ?? '?'));
  return data.answers || {};
}

/**
 * Asks choice questions about one piece of context (split into requests of ≤ 16, sent in parallel).
 * Returns question id → answer for every answer that names one of its options; null if the model isn't
 * available or a request fails.
 */
export async function decideChoices(state: unknown, questions: Record<string, ChoiceQuestion>, timeoutMs = 20_000): Promise<Record<string, ChoiceAnswer> | null> {
  const ep = await endpoint();
  if (!ep) return null;
  const ids = Object.keys(questions);
  const batches: Record<string, ChoiceQuestion>[] = [];
  for (let i = 0; i < ids.length; i += MAX_QUESTIONS) batches.push(Object.fromEntries(ids.slice(i, i + MAX_QUESTIONS).map((id) => [id, questions[id]])));
  try {
    const answers = Object.assign({}, ...(await Promise.all(batches.map((b) => call(ep, state, b, timeoutMs)))));
    const out: Record<string, ChoiceAnswer> = {};
    for (const id of ids) {
      const a = answers[id];
      if (a && typeof a.choice === 'string' && a.choice in questions[id].criteria) out[id] = { choice: a.choice, confidence: Number(a.confidence) || 0 };
    }
    return out;
  } catch (err) {
    console.error('decision_failed', err instanceof Error ? err.message : err);
    return null;
  }
}
