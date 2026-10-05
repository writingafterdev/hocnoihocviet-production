/**
 * Alibaba Model Studio's decision model (decision-model-preview): classification, yes/no and scoring.
 * Called on the "systemone" endpoint of the same Model Studio host as AI_BASE_URL, with the same key.
 * Its response shape isn't documented in the code sample we have, so answers are read defensively and the
 * raw reply is logged when an answer can't be found.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const DECISION_MODEL = 'decision-model-preview';

export type DecisionQuestion =
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { type: 'noul'; instructions: string }
  | { type: 'score'; instructions: string; criteria: string[] };

/** The systemone URL, from DECISION_URL or derived from a Model Studio AI_BASE_URL; null when unavailable. */
async function endpoint() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.ANTHROPIC_API_KEY) return null;
  if (env.DECISION_URL) return { url: env.DECISION_URL, key: env.ANTHROPIC_API_KEY };
  if (!env.AI_BASE_URL || !/\.maas\.aliyuncs\.com$/.test(new URL(env.AI_BASE_URL).host)) return null;
  return { url: new URL(env.AI_BASE_URL).origin + '/compatible-mode/v1/systemone', key: env.ANTHROPIC_API_KEY };
}

/** First value for `key` anywhere in the reply (the answers may be nested under output/result/answers…). */
function deepFind(o: unknown, key: string, depth = 0): unknown {
  if (!o || typeof o !== 'object' || depth > 6) return undefined;
  if (Object.prototype.hasOwnProperty.call(o, key)) return (o as Record<string, unknown>)[key];
  for (const v of Object.values(o as Record<string, unknown>)) {
    const f = deepFind(v, key, depth + 1);
    if (f !== undefined) return f;
  }
  return undefined;
}

/** A choice label from an answer: the label itself, a field holding it, or the most probable label in a distribution. */
function readChoice(a: unknown, labels: string[], depth = 0): string | undefined {
  if (typeof a === 'string') return labels.includes(a) ? a : undefined;
  if (!a || typeof a !== 'object' || depth > 4) return undefined;
  const o = a as Record<string, unknown>;
  for (const k of ['choice', 'answer', 'result', 'label', 'value', 'decision', 'prediction', 'output']) {
    const r = readChoice(o[k], labels, depth + 1);
    if (r) return r;
  }
  // A map of label → probability, possibly under "probabilities" / "distribution" / "scores".
  const maps = [o, o.probabilities, o.distribution, o.scores, o.probs].filter((m): m is Record<string, unknown> => !!m && typeof m === 'object');
  for (const m of maps) {
    const entries = Object.entries(m).filter(([k, v]) => labels.includes(k) && typeof v === 'number') as [string, number][];
    if (entries.length) return entries.sort((x, y) => y[1] - x[1])[0][0];
  }
  return undefined;
}

/**
 * Asks several choice questions about one piece of context in a single call.
 * Returns question id → chosen label for the questions it could read; null if the model isn't available or the call fails.
 */
export async function decideChoices(state: Record<string, unknown>, questions: Record<string, Extract<DecisionQuestion, { type: 'choice' }>>, timeoutMs = 20_000): Promise<Record<string, string> | null> {
  const ep = await endpoint();
  if (!ep) return null;
  const body = JSON.stringify({ model: DECISION_MODEL, state, questions });
  const call = (auth: string) => fetch(ep.url, { method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/json' }, body, signal: AbortSignal.timeout(timeoutMs) });
  try {
    // The code sample sends the bare key; fall back to the usual Bearer form if that is refused.
    let res = await call(ep.key);
    if (res.status === 401 || res.status === 403) res = await call('Bearer ' + ep.key);
    const text = await res.text();
    if (!res.ok) { console.error('decision_failed', res.status, text.slice(0, 300)); return null; }
    let data: unknown;
    try { data = JSON.parse(text); } catch { console.error('decision_bad_json', text.slice(0, 300)); return null; }
    const out: Record<string, string> = {};
    for (const [id, q] of Object.entries(questions)) {
      const c = readChoice(deepFind(data, id), Object.keys(q.criteria));
      if (c) out[id] = c;
    }
    if (Object.keys(out).length < Object.keys(questions).length) console.error('decision_unread', Object.keys(out).length + '/' + Object.keys(questions).length, text.slice(0, 500));
    else console.log('decision_ok', Object.keys(out).length + ' answers');
    return out;
  } catch (err) {
    console.error('decision_error', err instanceof Error ? err.message : err);
    return null;
  }
}
