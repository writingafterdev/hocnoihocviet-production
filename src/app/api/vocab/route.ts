import { getUser } from '@/lib/auth';
import { addPracticed, getProgress, KNOWN_PHRASES, setSaved } from '@/lib/vocab-db';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** The student's saved phrases and practice counts. */
export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  return json(await getProgress(user.id));
}

/** { save: { phrase, saved } } or { practiced: [phrase, …] }. Unknown phrases are rejected. */
export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return json({ error: 'unauthorized' }, 401);
  let body: { save?: { phrase?: unknown; saved?: unknown }; practiced?: unknown };
  try { body = await request.json(); } catch { return json({ error: 'invalid' }, 400); }
  if (body.save && typeof body.save.phrase === 'string' && KNOWN_PHRASES.has(body.save.phrase)) {
    await setSaved(user.id, body.save.phrase, !!body.save.saved);
    return json({ ok: true });
  }
  if (Array.isArray(body.practiced)) {
    const phrases = [...new Set(body.practiced.filter((p): p is string => typeof p === 'string' && KNOWN_PHRASES.has(p)))].slice(0, 12);
    if (phrases.length) await addPracticed(user.id, phrases);
    return json({ ok: true });
  }
  return json({ error: 'invalid' }, 400);
}
