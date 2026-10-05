import { VB_SKILLS } from '@/features/vocab/data';
import { aiErrorResponse, AiError } from '@/lib/ai/claude';
import { aiVocabGroups, chunkByTopic, GROUP_MAX } from '@/lib/ai/vocab-paragraph';
import { getUser } from '@/lib/auth';

const MAX_PHRASES = 30;
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** { skillId, phrases: [...] } → paragraph-sized groups. Up to GROUP_MAX phrases come back as one group without an AI call. */
export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return reply({ error: 'unauthorized' }, 401);
  let body: { skillId?: unknown; phrases?: unknown };
  try { body = await request.json(); } catch { return reply({ error: 'invalid' }, 400); }
  const skill = VB_SKILLS.find((s) => s.id === body.skillId);
  if (!skill) return reply({ error: 'invalid' }, 400);
  const allowed = new Set(skill.topics.flatMap((t) => t.items.map((i) => i.en)));
  const phrases = Array.isArray(body.phrases) ? [...new Set(body.phrases.filter((p): p is string => typeof p === 'string' && allowed.has(p)))] : [];
  if (!phrases.length || phrases.length > MAX_PHRASES) return reply({ error: 'invalid' }, 400);
  if (phrases.length <= GROUP_MAX) return reply({ groups: [{ name: '', phrases }] });
  try {
    return reply({ groups: await aiVocabGroups(user.id, skill, phrases) });
  } catch (err) {
    // Grouping is a convenience: when the AI is off or fails, split by topic instead of failing.
    if (err instanceof AiError && err.code === 'limit') return aiErrorResponse(err);
    return reply({ groups: chunkByTopic(skill, phrases), fallback: true });
  }
}
