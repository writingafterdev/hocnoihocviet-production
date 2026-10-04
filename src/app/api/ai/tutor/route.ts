import { aiErrorResponse } from '@/lib/ai/claude';
import { readAiRequest } from '@/lib/ai/http';
import { aiTutor, type TutorInput } from '@/lib/ai/tutor';

export async function POST(request: Request) {
  const r = await readAiRequest<TutorInput & { promptId: string }>(request);
  if (r instanceof Response) return r;
  const b = r.body;
  const question = typeof b.question === 'string' ? b.question.trim().slice(0, 2000) : '';
  if (!question) return Response.json({ error: 'invalid' }, { status: 400 });
  const history = (Array.isArray(b.history) ? b.history : [])
    .filter((m) => m && (m.from === 'me' || m.from === 'ai') && typeof m.text === 'string')
    .slice(-10).map((m) => ({ from: m.from, text: m.text.slice(0, 3000) }));
  const focus = b.focus && typeof b.focus.text === 'string' ? { label: String(b.focus.label || '').slice(0, 60), text: b.focus.text.slice(0, 8000) } : null;
  try {
    const reply = await aiTutor(r.userId, r.prompt, { screen: b.screen === 'essay' ? 'essay' : 'chains', chains: b.chains, stance: b.stance, focus, history, question, lang: b.lang === 'en' ? 'en' : 'vi' });
    return Response.json({ reply }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
