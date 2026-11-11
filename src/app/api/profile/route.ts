import { getUser } from '@/lib/auth';
import { getProfile, saveProfile, type Profile } from '@/lib/profile-db';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** A band is 4 to 9 in half steps; anything else (or missing) is "not set". */
const band = (v: unknown) => (typeof v === 'number' && v >= 4 && v <= 9 && Math.round(v * 2) === v * 2 ? v : null);

/** { profile: { targetWriting, targetSpeaking, examDate } | null }: what the signed-in student is aiming for. */
export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  return json({ profile: await getProfile(user.id) });
}

/** { targetWriting?, targetSpeaking?, examDate? } (YYYY-MM-DD): saves the student's goals. */
export async function PUT(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  const exam = typeof body.examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.examDate) ? body.examDate : null;
  const profile: Profile = { targetWriting: band(body.targetWriting), targetSpeaking: band(body.targetSpeaking), examDate: exam };
  await saveProfile(user.id, profile);
  return json({ profile });
}
