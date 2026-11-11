'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { Prompt } from '@/content/prompts';
import { CL } from '../chainlab/constants';
import type { Chain } from '../chainlab/types';
import { endOf, KIND_ASK, kindOf, middleOf, startOf } from './model';
import { Chip } from '@/components/base/badges/chip';

/** The chain next to its paragraph: start, middle, end. A note about one step tints that step. */
export function MiniChain({ prompt, chain, num, first = true, last = true, onMove, hit, focused, onOpen, chainsHref }: { prompt: Prompt; chain: Chain; num: number; first?: boolean; last?: boolean; onMove?: (d: -1 | 1) => void; hit: { at: number | null; bg: string } | null; focused: boolean; onOpen?: () => void; chainsHref: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (focused || hit) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [focused, hit?.at, hit?.bg]); // eslint-disable-line react-hooks/exhaustive-deps
  const built = chain.built !== false && middleOf(chain).some((s) => s.trim());
  const steps = [startOf(chain), ...middleOf(chain).filter((s) => s.trim()), endOf(chain)];
  const total = chain.steps.length;
  // `at` indexes the stored steps (start, middle…, end); map it onto the shown list, which skips empty middle steps.
  const shownAt = hit && hit.at != null ? (hit.at === 0 ? 0 : hit.at === total - 1 ? steps.length - 1 : 1 + middleOf(chain).slice(0, hit.at - 1).filter((s) => s.trim()).length) : null;
  const arrowBtn = (d: -1 | 1, off: boolean) => (
    <button type="button" className="cl-btn cl-link" onClick={() => onMove?.(d)} disabled={off} aria-label={d < 0 ? 'Đưa thân bài lên' : 'Đưa thân bài xuống'} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid ' + CL.ink1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: CL.ink5, opacity: off ? 0.3 : 1 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d < 0 ? <path d="M6 15l6-6 6 6" /> : <path d="M6 9l6 6 6-6" />}</svg>
    </button>
  );
  return (
    <div ref={ref} onClick={onOpen} style={{ flexShrink: 0, cursor: onOpen ? 'pointer' : 'default', borderRadius: 12, border: '1px solid ' + (focused ? CL.ink4 : CL.ink2), background: '#fff', overflow: 'hidden', transition: 'border-color .25s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px 10px 14px', borderBottom: '1px solid ' + CL.ink1, background: hit && hit.at == null ? hit.bg : focused ? CL.panel : '#fff', transition: 'background-color .25s' }}>
        <span style={{ fontFamily: CL.sans, fontSize: 13, fontWeight: 600, color: CL.ink }}>Thân bài {num}</span>
        <Chip variant="caption" color="gray">{KIND_ASK[kindOf(prompt, chain)].chip}</Chip>
        {onMove && <span onClick={(e) => e.stopPropagation()} style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>{arrowBtn(-1, first)}{arrowBtn(1, last)}</span>}
      </div>
      {!built && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid ' + CL.ink1, background: CL.yellowSoft, fontFamily: CL.sans, fontSize: 12, lineHeight: 1.5, color: CL.yellowText }}>
          Mạch này chưa có bước nào ở giữa. <Link href={chainsHref} onClick={(e) => e.stopPropagation()} style={{ fontWeight: 600, textDecoration: 'underline', color: CL.yellowText }}>Quay lại dựng mạch</Link>
        </div>
      )}
      <ol style={{ position: 'relative', listStyle: 'none', margin: 0, padding: '10px 10px 12px' }}>
        <span aria-hidden="true" style={{ position: 'absolute', left: 20.5, top: 22, bottom: 24, width: 1, background: CL.ink2 }} />
        {steps.map((s, k) => {
          const isStart = k === 0, isEnd = k === steps.length - 1;
          return (
            <li key={k} style={{ position: 'relative', display: 'flex', gap: 10, alignItems: 'baseline', padding: '4px 6px', borderRadius: 6, background: shownAt === k ? hit!.bg : 'transparent', transition: 'background-color .2s' }}>
              <span style={{ position: 'relative', top: 1, width: 9, height: 9, flexShrink: 0, borderRadius: isEnd ? 2 : 999, background: isStart ? CL.green : isEnd ? '#B8862B' : CL.ink3, boxShadow: '0 0 0 3px ' + (shownAt === k ? hit!.bg : '#fff') }} />
              <span style={{ fontFamily: isEnd ? CL.sans : CL.serif, fontSize: 13, fontWeight: isEnd ? 600 : 400, lineHeight: 1.5, color: isEnd ? '#B33A1A' : isStart ? CL.ink8 : CL.ink6 }}>{s || '—'}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
