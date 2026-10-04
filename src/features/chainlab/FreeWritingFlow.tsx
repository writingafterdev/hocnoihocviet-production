'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { WorkspaceHeader } from '@/components/shell/BrandHeader';
import { ChainDesk } from '../desk/ChainDesk';
import { DEMO_PROMPT_ID, type LibraryPrompt } from '../library/prompts';
import { ChainBuilder } from './ChainBuilder';
import { newChain } from './model';
import { SpecProvider } from './SpecContext';
import { CL_SPECS, customSpec } from './specs';
import type { Chain } from './types';

const SPEC_KEY = 'cl-demo-spec';
const clone = (cs: Chain[]): Chain[] => JSON.parse(JSON.stringify(cs));

function readStoredSpec(): string | null {
  try { const v = localStorage.getItem(SPEC_KEY); return v && CL_SPECS[v] ? v : null; } catch { return null; }
}

/**
 * "Viết tự do": ChainLab (build chains) → Writing Desk (write + submit), on one route.
 * The demo prompt gets a "Đề mẫu" switcher across the sample prompt types.
 */
export function FreeWritingFlow({ prompt }: { prompt: LibraryPrompt }) {
  const router = useRouter();
  const isDemo = prompt.id === DEMO_PROMPT_ID;
  const [specId, setSpecId] = useState<string | null>(isDemo ? 'childcare' : null);
  const spec = useMemo(() => (specId ? CL_SPECS[specId] : customSpec(prompt.text)), [specId, prompt.text]);
  const [mode, setMode] = useState<'chains' | 'desk'>('chains');
  const [chains, setChains] = useState<Chain[]>(() => (isDemo ? clone(CL_SPECS.childcare.chains) : [newChain(1)]));
  const [stance, setStance] = useState('');

  const pick = (id: string) => {
    try { localStorage.setItem(SPEC_KEY, id); } catch { /* storage unavailable */ }
    setSpecId(id); setChains(clone(CL_SPECS[id].chains)); setStance(''); setMode('chains');
  };
  useEffect(() => {
    if (!isDemo) return;
    const stored = readStoredSpec();
    if (stored && stored !== 'childcare') pick(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  return (
    <SpecProvider value={spec}>
      <div style={{ height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <WorkspaceHeader />
        {isDemo && (
          <div role="tablist" aria-label="Đề mẫu" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, width: '100%', maxWidth: 1710, margin: '0 auto', padding: '8px 40px 0', flexShrink: 0 }}>
            <span style={{ padding: '0 8px', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9A9A93' }}>Đề mẫu</span>
            {Object.values(CL_SPECS).map((s) => (
              <button key={s.id} type="button" role="tab" aria-selected={specId === s.id} className="cl-btn" onClick={() => pick(s.id)} style={{ borderRadius: 6, padding: '6px 10px', background: specId === s.id ? '#141413' : 'transparent', color: specId === s.id ? '#fff' : '#5C5C56', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</button>
            ))}
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0 }}>
          {mode === 'chains'
            ? <ChainBuilder key={specId || 'custom'} chains={chains} setChains={setChains} stance={stance} setStance={setStance} onBack={() => router.push('/writing')} onWrite={() => setMode('desk')} />
            : <ChainDesk chains={chains} stance={stance} onBack={() => setMode('chains')} />}
        </div>
      </div>
    </SpecProvider>
  );
}
