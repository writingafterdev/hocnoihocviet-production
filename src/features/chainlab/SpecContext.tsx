'use client';

import { createContext, useContext } from 'react';
import { CL_SPECS } from './specs';
import type { PromptSpec } from './types';

const SpecContext = createContext<PromptSpec>(CL_SPECS.childcare);

/** The prompt (and its questions) the current writing session answers. */
export const SpecProvider = SpecContext.Provider;
export const useSpec = () => useContext(SpecContext);
