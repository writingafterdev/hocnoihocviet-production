/** Phát triển ý attempts (one per mạch ý that passed Kiểm tra), shared by the drill, the API and "Mạch ý đã chứng minh". */

/** One mistake, as the history page shows it: where it was, the note's label, the student's words, how to fix it. */
export interface DrillErr { where: string; label: string; quote: string; fix: string }
export interface DrillAttempt { id: string; statementId: string; createdAt: number; errs: DrillErr[]; paragraph: string | null; paraErrs: DrillErr[] }

const send = (method: string, body: unknown) => fetch('/api/drill/attempts', { method, credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

/** Saves a passed mạch ý; resolves to the new attempt's id (null when it could not be saved). */
export const saveAttempt = (statementId: string, steps: string[], errs: DrillErr[]): Promise<string | null> =>
  send('POST', { statementId, steps, errs }).then((r) => (r.ok ? r.json() : null)).then((d: { id?: string } | null) => d?.id || null).catch(() => null);

/** Adds the paragraph written from that mạch ý and its first review's comments. */
export const saveParagraph = (id: string, paragraph: string, paraErrs: DrillErr[]) => send('PATCH', { id, paragraph, paraErrs }).catch(() => {});

export const listAttempts = (): Promise<DrillAttempt[] | 'signed-out'> =>
  fetch('/api/drill/attempts', { credentials: 'same-origin' }).then((r) => (r.status === 401 ? 'signed-out' : r.ok ? r.json().then((d: { list: DrillAttempt[] }) => d.list) : Promise.reject(new Error('load'))));
