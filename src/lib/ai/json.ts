/** Reading a model's JSON reply. Pure: used by the server (ask) and the browser (streamed essay review). */
import { jsonrepair } from 'jsonrepair';

/** The JSON object inside a reply that may carry code fences or stray text (non-Claude models). */
export function jsonPart(text: string) {
  const t = text.replace(/```(?:json)?/gi, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  return a >= 0 && b > a ? t.slice(a, b + 1) : t;
}

/** Repairs a reply cut off mid-JSON; null unless every required top-level field survived. */
export function salvage(text: string, required: string[]): Record<string, unknown> | null {
  const a = text.indexOf('{');
  if (a < 0) return null;
  try {
    const out = JSON.parse(jsonrepair(text.slice(a).replace(/```\s*$/, '')));
    if (!out || typeof out !== 'object' || !required.every((k) => k in out)) return null;
    // The item that was being written when the reply stopped is incomplete: drop it.
    const last = Object.keys(out).pop();
    if (Array.isArray(out[last])) out[last].pop();
    return out;
  } catch { return null; }
}

/**
 * Parses a reply: as is, then with the JSON cut out of any surrounding text, then repaired (unescaped quotes,
 * trailing commas). A reply that stopped at max_tokens is salvaged when its top-level fields are complete.
 * Throws 'max_tokens' or 'invalid_json'.
 */
export function parseReply<T>(text: string, stop: string, required: string[]): T {
  if (stop === 'max_tokens') {
    const kept = salvage(text, required);
    if (!kept) throw new Error('max_tokens');
    return kept as T;
  }
  try { return JSON.parse(text) as T; } catch { /* below */ }
  try { return JSON.parse(jsonPart(text)) as T; } catch { /* below */ }
  try { return JSON.parse(jsonrepair(jsonPart(text))) as T; } catch { throw new Error('invalid_json'); }
}
