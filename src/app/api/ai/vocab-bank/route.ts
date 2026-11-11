import { aiVocabBank } from '@/lib/ai/chain-coach';
import { aiErrorResponse } from '@/lib/ai/claude';
import { readCoachRequest } from '@/lib/ai/coach-http';

/** "Từ vựng cho chuỗi này": English phrases for a whole chain, from its start and end points. */
export async function POST(request: Request) {
  const r = await readCoachRequest(request);
  if (r instanceof Response) return r;
  try {
    return Response.json(await aiVocabBank(r.userId, r.prompt, r.chain), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err, { route: 'vocab-bank', userId: r.userId });
  }
}
