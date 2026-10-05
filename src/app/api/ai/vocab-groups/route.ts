import { GROUP_MAX, groupPhrases, themesFor, VB_SKILLS } from '@/features/vocab/data';
import { decideChoices } from '@/lib/ai/decision';
import { getUser } from '@/lib/auth';

const MAX_PHRASES = 30;
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * { skillId, phrases } → paragraph-sized groups. The decision model classifies each phrase into one of the
 * skill's themes; phrases it can't classify (or when it's unavailable) use their hand-tagged theme.
 */
export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return reply({ error: 'unauthorized' }, 401);
  let body: { skillId?: unknown; phrases?: unknown };
  try { body = await request.json(); } catch { return reply({ error: 'invalid' }, 400); }
  const skill = VB_SKILLS.find((s) => s.id === body.skillId);
  if (!skill) return reply({ error: 'invalid' }, 400);
  // Only phrases from the app's own sets ever reach the model.
  const allowed = new Set(skill.topics.flatMap((t) => t.items.map((i) => i.en)));
  const phrases = Array.isArray(body.phrases) ? [...new Set(body.phrases.filter((p): p is string => typeof p === 'string' && allowed.has(p)))] : [];
  if (!phrases.length || phrases.length > MAX_PHRASES) return reply({ error: 'invalid' }, 400);
  if (phrases.length <= GROUP_MAX) return reply({ groups: [{ name: '', phrases }], by: 'none' });

  const themes = themesFor(skill);
  const criteria = Object.fromEntries(themes.map((name, i) => ['t' + i, name]));
  const questions = Object.fromEntries(phrases.map((p, i) => ['p' + i, {
    type: 'choice' as const,
    instructions: `Which theme does the English phrase "${p}" belong to, as used in ${skill.eyebrow} writing or speaking?`,
    criteria,
  }]));
  const answers = await decideChoices({ skill: skill.eyebrow, phrases }, questions);
  const themeOf = (p: string) => { const a = answers && answers['p' + phrases.indexOf(p)]; return a ? themes[+a.slice(1)] : undefined; };
  return reply({ groups: groupPhrases(skill, phrases, themeOf), by: answers && Object.keys(answers).length ? 'decision-model' : 'themes' });
}
