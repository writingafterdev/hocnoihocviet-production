'use client';

import { ArrowLeft, Check, Trash2, Volume2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { PageHeader } from '@/components/shell/BrandHeader';
import { GW_VOCAB_PALETTE, type GuidedSample } from '../guided/data';
import { GuidedWriting } from '../guided/GuidedWriting';
import { AI_ERROR_TEXT, AiRequestError, postAi } from '../ai/request';
import { SignedOutError } from '../attempts/store';
import { topicsFor } from '@/lib/vocab-topics';
import { groupPhrases, VB_SKILLS, type VocabItem, type VocabSkill, type VocabTopic } from './data';

const VB = {
  head: 'var(--ink-50)', border: 'var(--ink-200)', line: 'var(--ink-100)', strong: 'var(--ink-300)',
  ink: 'var(--ink-900)', ink2: 'var(--ink-700)', ink3: 'var(--ink-500)', ink4: 'var(--ink-400)',
  yellow: 'var(--brand-yellow)', yellowSoft: 'var(--brand-yellow-soft)', success: 'var(--semantic-success)',
  sans: 'var(--font-sans)', label: 'var(--font-mono, var(--font-sans))',
};

function VbLabel({ children, color = VB.ink3, style }: { children: ReactNode; color?: string; style?: React.CSSProperties }) {
  return <span style={{ fontFamily: VB.label, fontSize: 12, fontWeight: 600, color, ...style }}>{children}</span>;
}

/** Bold the phrase (or its first word's stem) inside an example sentence. */
function Example({ text, phrase }: { text: string; phrase: string }) {
  const i = text.toLowerCase().indexOf(phrase.toLowerCase());
  const mark: React.CSSProperties = { fontWeight: 500, color: VB.ink, background: 'linear-gradient(transparent 62%, #EDF7EA 62%)' };
  if (i >= 0) return <span>{text.slice(0, i)}<b style={mark}>{text.slice(i, i + phrase.length)}</b>{text.slice(i + phrase.length)}</span>;
  const key = phrase.replace(/^(a|an|the|be)\s+/i, '').split(/\s+/)[0].toLowerCase().slice(0, 4);
  return <span>{text.split(/(\s+)/).map((w, k) => (w.toLowerCase().replace(/[^a-z]/g, '').startsWith(key) ? <b key={k} style={mark}>{w}</b> : w))}</span>;
}

const speak = (t: string) => {
  try { const u = new SpeechSynthesisUtterance(t); u.lang = 'en-GB'; u.rate = 0.9; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch { /* speech not supported */ }
};

/** Landing: one card per skill. */
function Landing({ savedCount, onOpen, onBack }: { savedCount: (sk: VocabSkill) => number; onOpen: (id: VocabSkill['id']) => void; onBack: () => void }) {
  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: '8px 32px 60px', fontFamily: VB.sans, color: VB.ink }}>
      <section style={{ display: 'flex', alignItems: 'flex-start', gap: 32, borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ width: 96, height: 96, borderRadius: 12, background: '#EDF7EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/illustrations/person-studying-different-sciences.svg" style={{ width: 84, height: 84, objectFit: 'contain', mixBlendMode: 'multiply' }} alt="" />
          </div>
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontFamily: VB.label, fontSize: 12, fontWeight: 600, color: '#737373', margin: '0 0 8px' }}>Vocabulary</p>
            <h1 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, margin: '0 0 14px' }}>Học từ vựng</h1>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#716D63', maxWidth: 560, margin: 0 }}>Chọn kỹ năng, chọn chủ đề, rồi viết lại đoạn mẫu dùng chính những từ đó. Học từ để dùng, không phải để thuộc.</p>
          </div>
        </div>
      </section>
      <section style={{ paddingTop: 36 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 22px' }}>Bộ từ vựng</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {VB_SKILLS.map((sk) => {
            const words = sk.topics.reduce((n, t) => n + t.items.length, 0);
            return (
              <button type="button" key={sk.id} onClick={() => onOpen(sk.id)} className="group flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white text-left shadow-ring transition-shadow duration-150 hover:shadow-ring-hover focus-visible:shadow-[0_0_0_2px_var(--brand-blue-deep)] focus-visible:outline-none">
                <div className="relative grid h-48 w-full place-items-center" style={{ background: sk.pillar }}>
                  <img src={sk.ill} alt="" className="h-40 w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.03]" />
                  <span className="absolute right-3 top-3 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-ink-soft">{words} cụm</span>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 px-5 pb-5 pt-4">
                  <span className="text-xs font-medium text-ink-soft">{sk.eyebrow}</span>
                  <h3 className="m-0 text-lg font-semibold tracking-[-0.02em] text-ink">{sk.title}</h3>
                  <p className="m-0 text-sm leading-[1.55] text-ink-soft">{sk.desc}</p>
                  <span className="mt-auto pt-3 text-[13px] font-medium text-blue-deep">{sk.topics.length} chủ đề{savedCount(sk) ? ' · ' + savedCount(sk) + ' đã lưu' : ''} ›</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

interface MinePhrase { id: string; skill: string; topic: string; en: string; vi: string; createdAt: number; detail: Omit<VocabItem, 'en' | 'vi'> | null }

/** One saved phrase, with the same columns as the built-in sets. Click the row to expand the clamped columns. */
function SavedRow({ it, topics, onTopic, onDelete, onEnrich }: { it: MinePhrase; topics: readonly string[]; onTopic: (id: string, topic: string) => void; onDelete: (id: string) => void; onEnrich: (id: string) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [filling, setFilling] = useState<'idle' | 'busy' | 'error'>('idle');
  const d = it.detail;
  const clamp: React.CSSProperties = open ? {} : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
  const td: React.CSSProperties = { padding: '16px 14px', verticalAlign: 'top', borderTop: '1px solid ' + VB.line, fontFamily: VB.sans };
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const fill = async (e: React.SyntheticEvent) => {
    stop(e);
    setFilling('busy');
    setFilling((await onEnrich(it.id)) ? 'idle' : 'error');
  };
  const dash = <span style={{ color: VB.ink4 }}>–</span>;
  return (
    <tr className="vb-row" onClick={() => setOpen(!open)} aria-expanded={open} style={{ cursor: 'pointer' }}>
      <td style={td}>
        <div style={{ fontSize: 15, fontWeight: 600, color: VB.ink, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{it.en}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
          {d?.ipa && <span style={{ fontSize: 12.5, color: VB.ink4 }}>{d.ipa}</span>}
          <button type="button" className="cl-btn vb-icon" onClick={(e) => { stop(e); speak(it.en); }} aria-label="Nghe phát âm" style={{ width: 24, height: 24, borderRadius: 999, display: 'grid', placeItems: 'center', color: VB.ink4 }}><Volume2 size={14} strokeWidth={2} /></button>
        </div>
      </td>
      <td style={{ ...td, fontSize: 13.5, color: VB.ink2 }}>{d?.pos || dash}</td>
      <td style={{ ...td, fontSize: 13.5, lineHeight: 1.55, color: VB.ink, overflowWrap: 'anywhere' }}>{it.vi}</td>
      {d ? (<>
        <td style={td}><div style={{ ...clamp, fontSize: 13.5, lineHeight: 1.6, color: VB.ink2 }}><b style={{ fontWeight: 600, color: VB.ink }}>{it.en}</b> ({d.pos}): {d.deep}</div></td>
        <td style={td}><div style={{ ...clamp, fontSize: 13.5, lineHeight: 1.6, color: VB.ink2 }}>{d.colls.length ? d.colls.join(', ') : dash}</div></td>
        <td style={td}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.ex.map((e) => (
              <li key={e} style={{ display: 'flex', gap: 9 }}>
                <span style={{ marginTop: 9, width: 5, height: 5, borderRadius: 999, background: VB.ink, flexShrink: 0 }} />
                <span style={{ ...(open ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }), fontSize: 13.5, lineHeight: 1.6, color: VB.ink2 }}><Example text={e} phrase={it.en} /></span>
              </li>
            ))}
          </ul>
        </td>
      </>) : (
        <td style={td} colSpan={3}>
          <button type="button" className="cl-btn cl-link" onClick={fill} disabled={filling === 'busy'} style={{ fontSize: 13, fontWeight: 600, color: '#2B6BE8' }}>{filling === 'busy' ? 'Đang viết…' : filling === 'error' ? 'Chưa được, thử lại' : 'Bổ sung chi tiết'}</button>
          <span style={{ marginLeft: 10, fontSize: 12.5, color: VB.ink4 }}>IPA, loại từ, cách dùng, collocation và ví dụ</span>
        </td>
      )}
      <td style={td} onClick={stop}>
        <select value={it.topic} onChange={(e) => onTopic(it.id, e.target.value)} aria-label={'Chủ đề của ' + it.en} style={{ width: '100%', height: 34, borderRadius: 8, border: '1px solid ' + VB.border, background: '#fff', padding: '0 8px', fontFamily: VB.sans, fontSize: 13, color: VB.ink2 }}>
          {(topics.includes(it.topic) ? topics : [...topics, it.topic]).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </td>
      <td style={td} onClick={stop}><button type="button" className="cl-btn vb-icon" onClick={() => onDelete(it.id)} aria-label={'Xoá ' + it.en} style={{ width: 30, height: 30, marginTop: -2, borderRadius: 999, display: 'grid', placeItems: 'center', color: VB.ink4 }}><Trash2 size={15} strokeWidth={2} /></button></td>
    </tr>
  );
}

/** "Đã lưu" of one skill: phrases saved from the translator, filed by topic. The topic can be changed here. */
function SavedList({ skill, items, loaded, onTopic, onDelete, onEnrich }: { skill: VocabSkill; items: MinePhrase[]; loaded: boolean; onTopic: (id: string, topic: string) => void; onDelete: (id: string) => void; onEnrich: (id: string) => Promise<boolean> }) {
  const [topic, setTopic] = useState<string>('');
  const [q, setQ] = useState('');
  const topics = topicsFor(skill.id);
  const counts = new Map<string, number>();
  items.forEach((it) => counts.set(it.topic, (counts.get(it.topic) || 0) + 1));
  const shown = items.filter((it) => (!topic || it.topic === topic) && (!q.trim() || (it.en + ' ' + it.vi).toLowerCase().includes(q.trim().toLowerCase())));
  const chip = (id: string, label: string, n: number) => (
    <button key={id} type="button" className="cl-btn" aria-pressed={topic === id} onClick={() => setTopic(id)} style={{ borderRadius: 999, border: '1px solid ' + (topic === id ? VB.ink : VB.border), background: topic === id ? VB.ink : '#fff', color: topic === id ? '#fff' : VB.ink2, padding: '5px 11px', fontFamily: VB.sans, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{label} <span style={{ opacity: 0.7 }}>{n}</span></button>
  );
  return (
    <section style={{ minWidth: 0, borderRadius: 12, border: '1px solid ' + VB.border, background: '#fff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', padding: '22px 24px 16px' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <VbLabel>Đã lưu</VbLabel>
          <h1 style={{ margin: '8px 0 0', fontFamily: VB.sans, fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em', color: VB.ink }}>Từ đã lưu<span style={{ fontWeight: 400, color: VB.ink3 }}> · {skill.title}</span></h1>
          <p style={{ margin: '6px 0 0', fontFamily: VB.sans, fontSize: 13.5, color: VB.ink3 }}>{items.length} cụm · Lưu thêm bằng nút "Lưu từ" trong mục Dịch. Chủ đề do AI gán, bạn đổi được.</p>
        </div>
        {items.length > 8 && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm trong từ đã lưu…" aria-label="Tìm trong từ đã lưu" style={{ width: 240, height: 40, borderRadius: 10, border: '1px solid ' + VB.border, padding: '0 12px', fontFamily: VB.sans, fontSize: 13.5, outline: 'none' }} />}
      </div>
      {items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 24px 16px' }}>
          {chip('', 'Tất cả', items.length)}
          {[...counts.keys()].sort((a, b) => topics.indexOf(a) - topics.indexOf(b)).map((t) => chip(t, t, counts.get(t)))}
        </div>
      )}
      {!loaded ? (
        <div style={{ padding: '32px 24px 40px', borderTop: '1px solid ' + VB.line, fontFamily: VB.sans, fontSize: 14, color: VB.ink3 }}>Đang tải…</div>
      ) : shown.length ? (
        <div className="cl-scroll" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1180, tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <colgroup><col style={{ width: '16%' }} /><col style={{ width: '8%' }} /><col style={{ width: '12%' }} /><col style={{ width: '19%' }} /><col style={{ width: '14%' }} /><col style={{ width: '20%' }} /><col style={{ width: 160 }} /><col style={{ width: 48 }} /></colgroup>
            <thead>
              <tr style={{ background: VB.head }}>
                {['Từ vựng', 'Loại từ', 'Nghĩa', 'Hiểu sâu', 'Collocation', 'Ví dụ', 'Chủ đề', ''].map((h, k) => <th key={k} style={{ padding: '12px 14px', textAlign: 'left', fontFamily: VB.sans, fontSize: 13, fontWeight: 600, color: VB.ink }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {shown.map((it) => <SavedRow key={it.id} it={it} topics={topics} onTopic={onTopic} onDelete={onDelete} onEnrich={onEnrich} />)}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '32px 24px 40px', borderTop: '1px solid ' + VB.line, fontFamily: VB.sans, fontSize: 14, lineHeight: 1.6, color: VB.ink3 }}>{items.length ? 'Không có cụm nào khớp.' : 'Chưa có từ nào. Khi lập ý hoặc viết bài, mở Dịch, dịch một từ hay cụm, rồi bấm "Lưu từ".'}</div>
      )}
    </section>
  );
}

function CheckBox({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className="cl-btn vb-check" role="checkbox" aria-checked={on} aria-label={label} onClick={onClick} style={{ width: 20, height: 20, borderRadius: 6, border: '1.5px solid ' + (on ? VB.ink : VB.strong), background: on ? VB.ink : '#fff', color: '#fff', display: 'grid', placeItems: 'center' }}>
      {on && <Check size={13} strokeWidth={3} />}
    </button>
  );
}

/** One phrase in the list: the phrase, its meaning, its word type and whether it has been practised. Click to see it in full. */
function PhraseRow({ item, selected, focused, practiced, onSelect, onFocus }: { item: VocabItem; selected: boolean; focused: boolean; practiced: number; onSelect: () => void; onFocus: () => void }) {
  return (
    <li className="vb-row" onClick={onFocus} aria-current={focused || undefined} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) auto', alignItems: 'center', gap: 12, padding: '12px 12px 12px 10px', borderRadius: 12, cursor: 'pointer', background: focused ? '#FAFAFA' : 'transparent', transition: 'background-color .2s' }}>
      <span onClick={(e) => e.stopPropagation()}><CheckBox on={selected} label={'Chọn ' + item.en} onClick={onSelect} /></span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 500, lineHeight: 1.35, color: VB.ink, overflowWrap: 'anywhere' }}>{item.en}</span>
        <span style={{ display: 'block', marginTop: 2, fontFamily: VB.sans, fontSize: 13, lineHeight: 1.45, color: VB.ink3 }}>{item.vi}</span>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ borderRadius: 999, background: '#F5F5F5', padding: '3px 9px', fontFamily: VB.sans, fontSize: 11, fontWeight: 600, color: VB.ink2, whiteSpace: 'nowrap' }}>{item.pos}</span>
        <span title={practiced ? 'Đã luyện ' + practiced + ' lần' : 'Chưa luyện'} style={{ width: 8, height: 8, borderRadius: 999, background: practiced ? VB.success : VB.strong }} />
      </span>
    </li>
  );
}

const cardLabel: React.CSSProperties = { fontFamily: VB.sans, fontSize: 12, fontWeight: 500, color: VB.ink3 };

/** The focused phrase in full: pronunciation, meaning, usage notes, collocations and examples. */
function PhraseCard({ item }: { item: VocabItem }) {
  return (
    <div key={item.en} className="vb-card-in" style={{ padding: '22px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={cardLabel}>{item.pos}</span>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.01em', color: VB.ink, textWrap: 'balance' }}>{item.en}</h2>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontFamily: VB.sans, fontSize: 13, color: VB.ink3 }}>
          {item.ipa}
          <button type="button" className="cl-btn vb-say" onClick={() => speak(item.en)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: '1px solid ' + VB.border, padding: '4px 10px', fontFamily: VB.sans, fontSize: 12, fontWeight: 600, color: VB.ink2 }}><Volume2 size={13} strokeWidth={2} />Nghe</button>
        </span>
      </div>
      <div style={{ fontFamily: VB.sans, fontSize: 16, fontWeight: 600, color: VB.ink }}>{item.vi}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={cardLabel}>Hiểu sâu</span>
        <p style={{ margin: 0, fontFamily: VB.sans, fontSize: 13.5, lineHeight: 1.65, color: VB.ink2 }}>{item.deep}</p>
      </div>
      {item.colls.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={cardLabel}>Hay đi với</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{item.colls.map((c) => <span key={c} style={{ borderRadius: 8, background: VB.yellowSoft, color: '#2F62C4', padding: '5px 10px', fontFamily: 'var(--font-serif)', fontSize: 14, lineHeight: 1.4 }}>{c}</span>)}</div>
        </div>
      )}
      {item.ex.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={cardLabel}>Ví dụ</span>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {item.ex.map((e) => <li key={e} style={{ borderLeft: '2px solid ' + VB.border, paddingLeft: 12, fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.55, color: VB.ink }}><Example text={e} phrase={item.en} /></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Vocab builder: skill cards → topic rail + phrase table → tick phrases → "Ôn từ"
 * → rewrite the sample paragraph from hints (Chép mẫu engine).
 * Practice counts are stored per student (/api/vocab); phrases saved from the translator are listed under "Đã lưu" (/api/vocab/mine). Practice paragraphs are written by
 * the AI from the ticked phrases (/api/ai/vocab-paragraph); the pre-written ones are the fallback.
 */
export function VocabBuilder({ onBack }: { onBack: () => void }) {
  const [skillId, setSkillId] = useState<VocabSkill['id'] | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null); // a topic id, or 'saved'
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const router = useRouter();
  const [count, setCount] = useState<Record<string, number>>({});
  /** The paragraph being practised; `groups` are the paragraph-sized groups of the ticked phrases, `at` the current one. */
  const [practice, setPractice] = useState<{ sample: GuidedSample; topic: string; phrases: string[]; groups: { name: string; phrases: string[] }[]; at: number } | null>(null);
  const [round, setRound] = useState(0);
  const [making, setMaking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [mine, setMine] = useState<MinePhrase[]>([]);
  const [mineLoaded, setMineLoaded] = useState(false);
  /** The phrase shown in full on the right, per topic. */
  const [focus, setFocus] = useState<Record<string, string>>({});

  const signedOut = () => router.replace('/login?next=/vocab');
  const send = (body: unknown) => fetch('/api/vocab', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) })
    .then((r) => { if (r.status === 401) signedOut(); }, () => {});
  useEffect(() => {
    fetch('/api/vocab', { credentials: 'same-origin' }).then(async (r) => {
      if (r.status === 401) return signedOut();
      if (!r.ok) return;
      const d = await r.json();
      setCount(d.practiced || {});
    }, () => {});
    fetch('/api/vocab/mine', { credentials: 'same-origin' }).then(async (r) => {
      if (r.ok) setMine((await r.json()).items || []);
      setMineLoaded(true);
    }, () => setMineLoaded(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const deleteMine = (id: string) => {
    setMine((m) => m.filter((x) => x.id !== id));
    fetch('/api/vocab/mine?id=' + encodeURIComponent(id), { method: 'DELETE', credentials: 'same-origin' }).then((r) => { if (r.status === 401) signedOut(); }, () => {});
  };
  const enrichMine = async (id: string) => {
    try {
      const r = await fetch('/api/vocab/mine', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id }) });
      if (r.status === 401) { signedOut(); return false; }
      if (!r.ok) return false;
      const { item } = await r.json();
      setMine((m) => m.map((x) => (x.id === id ? { ...x, detail: item.detail } : x)));
      return !!item.detail;
    } catch { return false; }
  };
  const changeTopic = (id: string, topic: string) => {
    const it = mine.find((x) => x.id === id);
    if (!it || it.topic === topic) return;
    setMine((m) => m.map((x) => (x.id === id ? { ...x, topic } : x)));
    fetch('/api/vocab/mine', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id, skill: it.skill, topic }) })
      .then((r) => { if (r.status === 401) signedOut(); else if (!r.ok) setMine((m) => m.map((x) => (x.id === id ? { ...x, topic: it.topic } : x))); }, () => setMine((m) => m.map((x) => (x.id === id ? { ...x, topic: it.topic } : x))));
  };

  const skill = VB_SKILLS.find((s) => s.id === skillId);
  const savedCount = (sk: VocabSkill) => mine.filter((m) => m.skill === sk.id).length;
  const shell = (body: ReactNode) => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <PageHeader />
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="cl-scroll">{body}</div>
    </div>
  );

  if (!skill) return shell(<Landing savedCount={savedCount} onBack={onBack} onOpen={(id) => { const sk = VB_SKILLS.find((s) => s.id === id); setSkillId(id); setTopicId(sk.topics[0].id); }} />);

  const isSaved = topicId === 'saved';
  const topic = skill.topics.find((t) => t.id === topicId);
  const rows: { it: VocabItem; t: VocabTopic }[] = isSaved ? [] : topic.items.map((it) => ({ it, t: topic }));
  const key = skillId + ':' + topicId;
  const picked = (sel[key] || []).filter((p) => rows.some((r) => r.it.en === p));
  const toggle = (en: string) => setSel((s) => ({ ...s, [key]: picked.includes(en) ? picked.filter((x) => x !== en) : [...picked, en] }));
  // Fallback when the AI is off or fails: the pre-written paragraph (in this view's topics) that uses most of the chosen phrases.
  const pool = (isSaved ? skill.topics : [topic]).flatMap((t) => t.samples.map((s) => ({ s, t })));
  const fallback = (afterId: string | null, phrases: string[], groups: { name: string; phrases: string[] }[], at: number) => {
    if (!pool.length) return false;
    const score = ({ s }: { s: GuidedSample }) => s.paragraphs.flat().flatMap((g) => g.vocab).filter((v) => phrases.includes(v)).length;
    const order = [...pool].sort((a, b) => score(b) - score(a));
    const k = afterId ? (order.findIndex((x) => x.s.id === afterId) + 1) % order.length : 0;
    setPractice({ sample: order[k].s, topic: order[k].t.name, phrases, groups, at }); setRound((r) => r + 1);
    return true;
  };
  const MAX_TICK = 30;
  // Nothing ticked: practise up to 4 phrases from this view, least-practised first.
  const choose = () => (picked.length ? picked : [...rows].sort((a, b) => (count[a.it.en] || 0) - (count[b.it.en] || 0)).slice(0, 4).map((r) => r.it.en)).slice(0, MAX_TICK);
  const fail = (e: unknown) => {
    if (e instanceof SignedOutError) { signedOut(); return true; }
    return false;
  };
  /** Writes the paragraph for group `at`; `afterId` asks for a different one than the current. */
  const paragraph = async (groups: { name: string; phrases: string[] }[], at: number, afterId: string | null) => {
    const phrases = groups[at].phrases;
    setMaking(true); setNote(null);
    try {
      const r = await postAi<{ sample: GuidedSample }>('vocab-paragraph', { skillId, topicId, phrases });
      setPractice({ sample: r.sample, topic: groups[at].name || (isSaved ? 'Từ đã lưu' : topic.name), phrases, groups, at }); setRound((x) => x + 1);
    } catch (e) {
      if (!fail(e)) {
        const used = fallback(afterId, phrases, groups, at);
        if (!used && e instanceof AiRequestError && e.code === 'not_configured') setNote('Chủ đề này chưa có đoạn mẫu.');
        else if (!(e instanceof AiRequestError && e.code === 'not_configured')) setNote(used ? 'Chưa tạo được đoạn mới (' + (e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network) + '). Đang dùng đoạn có sẵn.' : e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network);
      }
    }
    setMaking(false);
  };
  // Many ticked phrases are split into paragraph-sized groups of the same theme; each group is one paragraph.
  const go = async () => {
    const phrases = choose();
    if (!phrases.length || making) return;
    // More than 6: the decision model classifies the phrases into themes (server); the hand-tagged themes are the fallback.
    let groups = groupPhrases(skill, phrases);
    if (phrases.length > 6) {
      setMaking(true);
      try { groups = (await postAi<{ groups: typeof groups }>('vocab-groups', { skillId, phrases })).groups; }
      catch (e) { if (fail(e)) return; }
    }
    await paragraph(groups, 0, null);
  };

  if (practice) {
    const all = skill.topics.flatMap((t) => t.items);
    const idx = (v: string) => Math.max(0, all.findIndex((it) => it.en === v));
    const base = practice.sample;
    const sample: GuidedSample = { ...base, paragraphs: base.paragraphs.map((p) => p.map((sg) => ({ ...sg, vocabVi: sg.vocab.map((v) => all[idx(v)].vi), vocabStyle: sg.vocab.map((v) => GW_VOCAB_PALETTE[idx(v) % GW_VOCAB_PALETTE.length]) }))) };
    const markPracticed = () => {
      const used = [...new Set(base.paragraphs.flat().flatMap((g) => g.vocab || []))];
      setCount((c) => { const n = { ...c }; used.forEach((v) => (n[v] = (n[v] || 0) + 1)); return n; });
      send({ practiced: used });
    };
    const { groups, at } = practice, more = at + 1 < groups.length;
    const tag = groups.length > 1 ? 'Đoạn ' + (at + 1) + '/' + groups.length + ' · ' : '';
    return shell(<GuidedWriting key={base.id + round} sample={sample} label={'Từ vựng · ' + tag + practice.topic} taskLabel={skill.eyebrow} textLabel="Đoạn mẫu" backLabel={skill.title} onBack={() => setPractice(null)} onFinish={markPracticed}
      onNext={() => (more ? paragraph(groups, at + 1, null) : paragraph(groups, at, base.id))}
      nextLabel={making ? 'Đang tạo…' : more ? 'Đoạn tiếp · ' + (at + 2) + '/' + groups.length : 'Tạo đoạn khác'} />);
  }

  const done = rows.filter((r) => count[r.it.en]).length;
  const allPicked = picked.length === rows.length && rows.length > 0;
  const focused = rows.find((r) => r.it.en === focus[key])?.it || rows[0]?.it || null;
  const pill = (id: string, name: string, n: number) => {
    const on = topicId === id;
    return (
      <button key={id} type="button" className="cl-btn vb-pill" onClick={() => setTopicId(id)} aria-pressed={on} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 34, borderRadius: 999, padding: '0 14px', border: '1px solid ' + (on ? VB.ink : VB.border), background: on ? VB.ink : '#fff', color: on ? '#fff' : VB.ink2, fontFamily: VB.sans, fontSize: 12.5, fontWeight: 600, transition: 'background-color .25s, color .25s, border-color .25s' }}>
        {name}<span style={{ fontSize: 11, fontWeight: 500, color: on ? 'rgba(255,255,255,.6)' : VB.ink4 }}>{n}</span>
      </button>
    );
  };
  const n = picked.length;
  const label = n > MAX_TICK ? 'Tối đa ' + MAX_TICK + ' cụm; sẽ dùng ' + MAX_TICK + ' cụm đầu' : n > 6 ? 'Đã chọn ' + n + ' cụm · chia thành vài đoạn' : n ? 'Đã chọn ' + n + ' cụm' : 'Chưa chọn cụm nào. Ôn ngay 4 cụm bạn ít luyện nhất.';

  return shell(
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 40px 24px', fontFamily: VB.sans, color: VB.ink }}>
      <button type="button" className="cl-btn cl-link" onClick={() => { setSkillId(null); setTopicId(null); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14, fontFamily: VB.sans, fontSize: 12, fontWeight: 500, color: VB.ink3 }}><ArrowLeft size={13} strokeWidth={2} />Từ vựng</button>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
        <div>
          <span style={cardLabel}>{skill.eyebrow}</span>
          <h1 style={{ margin: '6px 0 0', fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 500, lineHeight: 1.15, letterSpacing: '-0.01em', textWrap: 'balance' }}>{isSaved ? 'Từ đã lưu' : topic.name}<span style={{ color: VB.ink3 }}> · {isSaved ? skill.title : topic.vi}</span></h1>
          {!isSaved && <p style={{ margin: '6px 0 0', fontSize: 13.5, color: VB.ink3 }}>{rows.length} cụm · {done} đã luyện</p>}
        </div>
        <div role="group" aria-label="Chủ đề" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {pill('saved', 'Đã lưu', savedCount(skill))}
          {skill.topics.map((x) => pill(x.id, x.name, x.items.length))}
        </div>
      </div>

      {isSaved ? <SavedList skill={skill} items={mine.filter((m) => m.skill === skill.id)} loaded={mineLoaded} onTopic={changeTopic} onDelete={deleteMine} onEnrich={enrichMine} /> : (
        <div className="vb-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 440px', gap: 22, alignItems: 'start' }}>
          <section aria-label="Danh sách cụm từ" style={{ minWidth: 0, borderRadius: 12, border: '1px solid ' + VB.border, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid ' + VB.line, borderRadius: '18px 18px 0 0', background: '#FAFAFA', fontSize: 12.5, color: VB.ink3 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 600, color: VB.ink2 }}>
                <CheckBox on={allPicked} label="Chọn tất cả" onClick={() => setSel((s) => ({ ...s, [key]: allPicked ? [] : rows.map((r) => r.it.en) }))} />Chọn tất cả
              </span>
              <span style={{ marginLeft: 'auto' }}>Bấm vào cụm để xem đủ · tick để ôn</span>
            </div>
            {rows.length ? (
              <ul key={key} className="vb-list" style={{ listStyle: 'none', margin: 0, padding: 6, display: 'flex', flexDirection: 'column' }}>
                {rows.map(({ it, t: tp }) => <PhraseRow key={tp.id + it.en} item={it} selected={picked.includes(it.en)} focused={focused === it} practiced={count[it.en] || 0} onSelect={() => toggle(it.en)} onFocus={() => setFocus((f) => ({ ...f, [key]: it.en }))} />)}
              </ul>
            ) : (
              <div style={{ padding: '40px 24px 48px', fontSize: 14, color: VB.ink3 }}>Chủ đề này chưa có cụm nào.</div>
            )}
            <div style={{ position: 'sticky', bottom: 12, margin: '0 6px 6px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderRadius: 10, border: '1px solid ' + VB.border, background: '#fff', padding: '10px 10px 10px 18px', boxShadow: '0 10px 30px rgba(20,20,19,.10)' }}>
              <span style={{ fontSize: 13, color: n > MAX_TICK ? '#B33A1A' : VB.ink3 }}>{n ? <><b style={{ color: VB.ink, fontWeight: 600 }}>{label.split(' · ')[0]}</b>{label.includes(' · ') ? ' · ' + label.split(' · ')[1] : ''}</> : label}</span>
              {n > 0 && <button type="button" className="cl-btn cl-link" onClick={() => setSel((s) => ({ ...s, [key]: [] }))} style={{ fontSize: 12, fontWeight: 600, color: VB.ink3, textDecoration: 'underline', textUnderlineOffset: 3 }}>Bỏ chọn</button>}
              {note && <span role="alert" style={{ flexBasis: '100%', order: 3, fontSize: 12, color: '#B33A1A' }}>{note}</span>}
              <button type="button" className="cl-btn cl-primary" disabled={!rows.length || making} onClick={() => go()} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, borderRadius: 10, background: VB.ink, color: '#fff', padding: '0 16px', fontFamily: VB.sans, fontSize: 12.5, fontWeight: 700, opacity: !rows.length || making ? 0.5 : 1 }}>{making ? 'Đang tạo đoạn…' : 'Ôn ' + Math.min(n || Math.min(4, rows.length), MAX_TICK) + ' cụm →'}</button>
            </div>
          </section>
          {focused && (
            <aside aria-live="polite" className="vb-detail" style={{ position: 'sticky', top: 16, minWidth: 0, borderRadius: 12, border: '1px solid ' + VB.border, background: '#fff', overflow: 'hidden' }}>
              <PhraseCard item={focused} />
            </aside>
          )}
        </div>
      )}
      <style>{'.vb-row:hover{background:#FBFBFA}.vb-say:hover{border-color:#171717!important;color:#171717!important}.vb-card-in>*{animation:vb-rise .45s cubic-bezier(.22,1,.36,1) both}.vb-card-in>*:nth-child(2){animation-delay:.04s}.vb-card-in>*:nth-child(3){animation-delay:.08s}.vb-card-in>*:nth-child(4){animation-delay:.12s}.vb-card-in>*:nth-child(5){animation-delay:.16s}.vb-list{animation:vb-rise .45s cubic-bezier(.22,1,.36,1)}@keyframes vb-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@media (max-width:980px){.vb-grid{grid-template-columns:minmax(0,1fr)!important}.vb-detail{position:static!important}}@media (prefers-reduced-motion:reduce){.vb-card-in>*,.vb-list{animation:none!important}}'}</style>
    </div>
  );
}
