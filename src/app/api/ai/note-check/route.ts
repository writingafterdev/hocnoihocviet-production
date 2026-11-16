import { aiNoteCheck, type ChainNote } from '@/lib/ai/chain-coach';
import { aiErrorResponse } from '@/lib/ai/claude';
import { readCoachRequest } from '@/lib/ai/coach-http';

function readNote(x: unknown): ChainNote | null {
  const n = x as { type?: unknown; at?: unknown; text?: unknown; fix?: unknown } | null;
  if (!n || !(n.type === 'jump' || n.type === 'trait' || n.type === 'detail') || !Number.isInteger(n.at) || typeof n.text !== 'string' || n.text.length > 1000) return null;
  return { type: n.type, at: n.at as number, text: n.text, fix: typeof n.fix === 'string' ? n.fix.slice(0, 1000) : '' };
}

/** Enter on a step that had a note: is that one note resolved now (fixed, or what is still missing)? */
export async function POST(request: Request) {
  const r = await readCoachRequest(request);
  if (r instanceof Response) return r;
  const note = readNote(r.body.note);
  if (!note) return Response.json({ error: 'bad_request' }, { status: 400 });
  try {
    return Response.json(await aiNoteCheck(r.userId, r.prompt, r.chain, note), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err, { route: 'note-check', userId: r.userId });
  }
}
