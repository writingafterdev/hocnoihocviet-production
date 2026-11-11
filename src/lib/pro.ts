'use client';

import { useSyncExternalStore } from 'react';

/**
 * Pro state, for trying out how Pro looks. It lives in this browser only (localStorage), on by default, and is
 * switched from the account menu. Nothing here is a real plan: a real one would come from the signed-in user.
 */
const KEY = 'hnhv-pro';
const EVENT = 'hnhv-pro-change';

const read = () => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } };

export function setPro(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* private mode */ }
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener('storage', cb); };
};

/** Whether the visitor counts as Pro. False on the server and the first paint, then the stored choice. */
export const usePro = () => useSyncExternalStore(subscribe, read, () => false);
