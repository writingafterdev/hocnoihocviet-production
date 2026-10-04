'use client';

import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { SECTIONS, TOC, type Block, type Span } from './content';

const TONE = { warning: { bg: '#FFF6DA', fg: '#8B6325' }, info: { bg: '#E4F5FA', fg: '#1F6E8C' }, success: { bg: '#DCF5EC', fg: '#1FA97A' } };

function SpanView({ s }: { s: Span }) {
  if (s.m === 'code') return <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9em', background: '#F2F0E9', padding: '2px 6px', borderRadius: 4, color: '#5E5950' }}>{s.t}</code>;
  if (s.m === 'bold') return <b style={{ color: '#141413' }}>{s.t}</b>;
  if (s.m === 'highlight') return <mark style={{ background: '#FFE17C', padding: '0 3px', borderRadius: 3 }}>{s.t}</mark>;
  return <Fragment>{s.t}</Fragment>;
}

function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case 'p':
      return <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.85, color: '#2B2B29', margin: '0 0 18px' }}>{b.spans.map((s, i) => <SpanView key={i} s={s} />)}</p>;
    case 'quote':
      return <blockquote style={{ margin: '0 0 18px', borderLeft: '3px solid #DAD8D2', paddingLeft: 18, fontFamily: 'var(--font-serif)', fontSize: 15, fontStyle: 'italic', lineHeight: 1.7, color: '#5E5950' }}>{b.body}</blockquote>;
    case 'callout': {
      const tone = TONE[b.tone] || TONE.info;
      return (
        <div style={{ borderRadius: 12, background: tone.bg, padding: '14px 18px', margin: '0 0 18px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: tone.fg, margin: '0 0 6px', fontWeight: 700 }}>{b.label}</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.6, color: '#2B2B29', margin: 0 }}>{b.body}</p>
        </div>
      );
    }
    case 'code':
      return <pre style={{ margin: '0 0 18px', borderRadius: 10, background: '#1C1C1A', color: '#E8E6DE', padding: '16px 18px', fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.6, overflow: 'auto' }}><code>{b.body}</code></pre>;
    case 'table':
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0 0 18px', fontFamily: 'var(--font-sans)', fontSize: 13 }}>
          <thead><tr>{b.head.map((h, i) => <th key={i} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #E7E5DF', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#86837B' }}>{h}</th>)}</tr></thead>
          <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: '10px 12px', borderBottom: '1px solid #ECEAE5', color: '#2B2B29' }}>{c}</td>)}</tr>)}</tbody>
        </table>
      );
    case 'list': {
      const Tag = b.style === 'ol' ? 'ol' : 'ul';
      return <Tag style={{ margin: '0 0 18px', paddingLeft: 22, fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.8, color: '#2B2B29' }}>{b.items.map((it, i) => <li key={i}>{it}</li>)}</Tag>;
    }
    case 'divider':
      return <hr style={{ border: 'none', borderTop: '1px solid #ECEAE5', margin: '8px 0 22px' }} />;
    case 'image':
      return <div style={{ margin: '0 0 18px', borderRadius: 10, background: '#F2F0E9', aspectRatio: '16/7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#A19F98' }}>{b.caption}</div>;
    default:
      return null;
  }
}

/** Guidebook reader: module TOC on the left, watermarked block content on the right. */
export function DocumentViewer({ anchor }: { anchor?: string }) {
  const [openMods, setOpenMods] = useState<Record<string, boolean>>({ m1: true, m2: true, m3: true });
  const [active, setActive] = useState(anchor || 'action');
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (anchor && refs.current[anchor]) { refs.current[anchor].scrollIntoView({ block: 'start' }); setActive(anchor); }
  }, [anchor]);

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 28px', borderBottom: '1px solid #E7E5DF' }}>
        <Link href="/guidebooks" style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#242421' }}>← Thoát</Link>
        <span style={{ width: 1, height: 18, background: '#E7E5DF' }} />
        <div style={{ width: 30, height: 30, borderRadius: 10, background: '#62DAB1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/assets/illustrations/il-structure.svg" style={{ width: 18, height: 18 }} alt="" />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', borderRadius: 7, background: '#F2F0E9', color: '#5E5950', padding: '5px 11px' }}>Tài liệu gốc</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#141413' }}>Giáo trình — The Engine Guidebook</span>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 59px)' }}>
        <nav aria-label="Mục lục" style={{ width: 260, flexShrink: 0, borderRight: '1px solid #E7E5DF', padding: '20px 12px', overflow: 'auto' }}>
          {TOC.map((mod) => (
            <div key={mod.id} style={{ marginBottom: 6 }}>
              <button type="button" className="cl-btn" aria-expanded={openMods[mod.id]} onClick={() => setOpenMods({ ...openMods, [mod.id]: !openMods[mod.id] })} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 10px', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: '#141413' }}>
                <span style={{ color: '#86837B', display: 'flex' }}>{openMods[mod.id] ? <ChevronDown size={12} strokeWidth={2.5} /> : <ChevronRight size={12} strokeWidth={2.5} />}</span>{mod.title}
              </button>
              {openMods[mod.id] && mod.items.map((it) => (
                <button key={it.id} type="button" className="cl-btn" aria-current={active === it.id} onClick={() => { setActive(it.id); refs.current[it.id]?.scrollIntoView({ block: 'start' }); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 14px 7px 30px', borderRadius: 8, background: active === it.id ? '#F2F0E9' : 'transparent', fontFamily: 'var(--font-sans)', fontSize: 12, color: active === it.id ? '#141413' : '#6E6B64', fontWeight: active === it.id ? 600 : 400 }}>{it.label}</button>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ flex: 1, overflow: 'auto', padding: '40px 56px', position: 'relative' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-45deg)', width: '220%', display: 'flex', flexWrap: 'wrap', gap: '48px 64px', justifyContent: 'center', alignContent: 'center' }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 700, color: '#141413', opacity: 0.045, whiteSpace: 'nowrap' }}>hocnoihocviet</span>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {Object.entries(SECTIONS).map(([id, s]) => (
              <section key={id} ref={(el) => { refs.current[id] = el; }} style={{ marginBottom: 44, padding: id === active ? '18px 22px' : 0, borderRadius: 12, background: id === active ? '#FFF6DA' : 'transparent', transition: 'background .3s' }}>
                <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 600, color: '#141413', margin: '0 0 14px' }}>{s.title}</h2>
                {s.blocks.map((b, i) => <BlockView key={i} b={b} />)}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
