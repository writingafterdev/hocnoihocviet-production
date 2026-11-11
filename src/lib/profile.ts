'use client';

import { useEffect, useSyncExternalStore } from 'react';

export interface Profile { targetWriting: number | null; targetSpeaking: number | null; examDate: string | null }

/** undefined = not loaded yet (or signed out), null = loaded and nothing set, otherwise the saved goals. */
let state: Profile | null | undefined;
let loading = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

async function load() {
  if (loading || state !== undefined) return;
  loading = true;
  try {
    const r = await fetch('/api/profile', { credentials: 'same-origin' });
    if (r.ok) { state = (await r.json()).profile ?? null; emit(); }
  } catch { /* offline: try again next time */ }
  loading = false;
}

export async function saveProfile(p: Profile) {
  const r = await fetch('/api/profile', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
  if (!r.ok) throw new Error('save failed');
  state = (await r.json()).profile;
  emit();
}

export function useProfile(): Profile | null | undefined {
  useEffect(() => { load(); }, []);
  return useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => state, () => undefined);
}
