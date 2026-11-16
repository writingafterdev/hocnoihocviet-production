import { aiChainCheck, type PrevCheck } from '@/lib/ai/chain-coach';
import { aiErrorResponse } from '@/lib/ai/claude';
import { readCoachRequest } from '@/lib/ai/coach-http';

/** The last check's steps and notes, when the browser sends them with "Kiểm tra lại"; anything malformed is ignored. */
function readPrev(x: unknown): PrevCheck | null {
  const p = x as { steps?: unknown; notes?: unknown } | null;
  if (!p || !Array.isArray(p.steps) || !Array.isArray(p.notes) || p.steps.length > 12 || p.notes.length > 20) return null;
  const steps = p.steps.filter((s): s is string => typeof s === 'string' && s.length <= 600);
  const notes = p.notes.map((n) => n as { type?: unknown; at?: unknown; text?: unknown; fix?: unknown })
    .filter((n) => (n.type === 'jump' || n.type === 'trait' || n.type === 'detail') && Number.isInteger(n.at) && typeof n.text === 'string' && n.text.length <= 1000)
    .map((n) => ({ type: n.type as 'jump' | 'trait' | 'detail', at: n.at as number, text: n.text as string, fix: typeof n.fix === 'string' ? n.fix.slice(0, 1000) : '' }));
  return steps.length === p.steps.length && notes.length ? { steps, notes } : null;
}

/**
 * "Kiểm tra": logical jumps, and where a stakeholder trait or a detail would help, linked to positions in the chain.
 * With `prev` ("Kiểm tra lại" after an edit) it is the quick recheck of those notes only.
 */
export async function POST(request: Request) {
  const r = await readCoachRequest(request);
  if (r instanceof Response) return r;
  try {
    return Response.json(await aiChainCheck(r.userId, r.prompt, r.chain, readPrev(r.body.prev)), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err, { route: 'chain-check', userId: r.userId });
  }
}
