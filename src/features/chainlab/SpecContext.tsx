'use client';

import { createContext, useContext } from 'react';
import type { PromptSpec } from './types';

const SpecContext = createContext<PromptSpec | null>(null);

/** The prompt (and its questions) the current writing session answers. */
export const SpecProvider = SpecContext.Provider;

export function useSpec(): PromptSpec {
  const spec = useContext(SpecContext);
  if (!spec) throw new Error('useSpec must be used inside <SpecProvider>');
  return spec;
}
