import { VB_SKILLS } from '@/features/vocab/data';
import { aiErrorResponse } from '@/lib/ai/claude';
import { aiVocabParagraph } from '@/lib/ai/vocab-paragraph';
import { getUser } from '@/lib/auth';

const fail = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });

/** { skillId, topicId | 'saved', phrases: [...] } → a practice paragraph using those phrases. */
export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return fail('unauthorized', 401);
  let body: { skillId?: unknown; topicId?: unknown; phrases?: unknown };
  try { body = await request.json(); } catch { return fail('invalid', 400); }
  const skill = VB_SKILLS.find((s) => s.id === body.skillId);
  if (!skill) return fail('invalid', 400);
  const topic = skill.topics.find((t) => t.id === body.topicId) || null;
  // Only phrases from this skill's sets are accepted; that is all the model ever sees from the student.
  const allowed = new Set(skill.topics.flatMap((t) => t.items.map((i) => i.en)));
  const phrases = Array.isArray(body.phrases) ? [...new Set(body.phrases.filter((p): p is string => typeof p === 'string' && allowed.has(p)))] : [];
  if (phrases.length < 1 || phrases.length > 6) return fail('invalid', 400);
  try {
    return Response.json({ sample: await aiVocabParagraph(user.id, skill, topic, phrases) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
