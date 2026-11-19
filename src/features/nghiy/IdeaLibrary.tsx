'use client';

import { useMemo, useState } from 'react';
import { HistoryHeader } from '@/features/attempts/HistoryUI';
import { RandomCard } from '@/features/library/RandomCard';
import { MACRO_NAME, MACRO_TINT, type IdeaPrompt, type Macro } from './NghiY';

const MACROS: Macro[] = ['A', 'B', 'C'];
const PAGE = 30;

/**
 * Nghĩ ý before a prompt is picked: her prompts by macro (count of the ones done, no "done" state for a macro), a
 * search, "Đề ngẫu nhiên", and one row per prompt with her idea for it.
 */
export function IdeaLibrary({ list, done, onOpen }: { list: IdeaPrompt[]; done: Set<string>; onOpen: (id: string) => void }) {
  const [macro, setMacro] = useState<Macro>('A');
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((p) => p.macro === macro && (!q || p.text.toLowerCase().includes(q) || p.idea.toLowerCase().includes(q)));
  }, [list, macro, query]);
  const random = () => { if (rows.length) onOpen(rows[Math.floor(Math.random() * rows.length)].id); };

  return (
    <main style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 32px 64px', fontFamily: 'var(--font-sans)', color: '#171717' }}>
      <HistoryHeader img="woman-brainstorming-and-choosing-ideas" tint="#EEF3FC" title="Nghĩ ý" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <div role="tablist" aria-label="Phần" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {MACROS.map((m) => {
            const on = m === macro;
            const all = list.filter((p) => p.macro === m);
            const n = all.filter((p) => done.has(p.id)).length;
            return (
              <button key={m} type="button" role="tab" aria-selected={on} onClick={() => { setMacro(m); setShown(PAGE); }} style={{ height: 36, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 12px', borderRadius: 8, border: '1px solid ' + (on ? '#DCE7F7' : '#E5E5E5'), background: on ? '#F7F9FD' : '#fff', color: '#171717', fontFamily: 'inherit', fontSize: 13.5, fontWeight: on ? 600 : 500, cursor: 'pointer' }}>
                <span style={{ borderRadius: 4, padding: '1px 6px', background: MACRO_TINT[m].bg, color: MACRO_TINT[m].fg, fontSize: 11.5, fontWeight: 700 }}>{m}</span>
                {MACRO_NAME[m]}
                <span style={{ fontSize: 12.5, fontWeight: 500, color: '#737373', fontVariantNumeric: 'tabular-nums' }}>{n ? `${n}/${all.length}` : all.length}</span>
              </button>
            );
          })}
        </div>
        <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }} placeholder="Tìm đề" aria-label="Tìm đề" style={{ flex: '1 1 220px', maxWidth: 360, height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #E5E5E5', fontFamily: 'inherit', fontSize: 14, outline: 'none' }} />
      </div>

      {rows.length > 0 && <div style={{ marginBottom: 12 }}><RandomCard label="Đề ngẫu nhiên" onClick={random} /></div>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderRadius: 12, boxShadow: '0 0 0 1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {rows.slice(0, shown).map((p, i) => (
          <li key={p.id} style={{ borderTop: i ? '1px solid #F0F0F0' : 'none' }}>
            <button type="button" onClick={() => onOpen(p.id)} style={{ all: 'unset', boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 18px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 14.5, lineHeight: 1.55, color: '#171717' }}>{p.text}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12.5, color: '#737373' }}>
                  {p.idea}
                  {p.date && <span style={{ borderRadius: 4, padding: '1px 7px', background: '#FFF6DE', color: '#8A5A00', fontSize: 12, fontWeight: 600 }}>Đề thi {p.date}</span>}
                </span>
              </span>
              {done.has(p.id) && <svg width="16" height="16" viewBox="0 0 16 16" aria-label="Đã luyện" role="img" style={{ marginTop: 4, flexShrink: 0 }}><path d="M3.5 8.4l3.1 2.9 5.9-6.4" fill="none" stroke="#2D881A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
          </li>
        ))}
        {rows.length === 0 && <li style={{ padding: '28px 18px', textAlign: 'center', fontSize: 14, color: '#737373' }}>Không có đề nào khớp.</li>}
      </ul>
      {rows.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + PAGE)} style={{ display: 'block', margin: '16px auto 0', height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #E5E5E5', background: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Xem thêm</button>
      )}
    </main>
  );
}
