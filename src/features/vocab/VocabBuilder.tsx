'use client';

import { ArrowLeft, Bookmark, Check, Circle, CircleCheck, Hash, Sparkles, Volume2, type LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { PageHeader } from '@/components/shell/BrandHeader';
import { GW_VOCAB_PALETTE, type GuidedSample } from '../guided/data';
import { GuidedWriting } from '../guided/GuidedWriting';
import { AI_ERROR_TEXT, AiRequestError, postAi } from '../ai/request';
import { SignedOutError } from '../attempts/store';
import { groupPhrases, VB_SKILLS, type VocabItem, type VocabSkill, type VocabTopic } from './data';

const VB = {
  head: 'var(--ink-50)', border: 'var(--ink-200)', line: 'var(--ink-100)', strong: 'var(--ink-300)',
  ink: 'var(--ink-900)', ink2: 'var(--ink-700)', ink3: 'var(--ink-500)', ink4: 'var(--ink-400)',
  yellow: 'var(--brand-yellow)', yellowSoft: 'var(--brand-yellow-soft)', success: 'var(--semantic-success)',
  sans: 'var(--font-sans)', label: 'var(--font-mono, var(--font-sans))',
};

function VbLabel({ children, color = VB.ink3, style }: { children: ReactNode; color?: string; style?: React.CSSProperties }) {
  return <span style={{ fontFamily: VB.label, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color, ...style }}>{children}</span>;
}

/** Bold the phrase (or its first word's stem) inside an example sentence. */
function Example({ text, phrase }: { text: string; phrase: string }) {
  const i = text.toLowerCase().indexOf(phrase.toLowerCase());
  if (i >= 0) return <span>{text.slice(0, i)}<b style={{ fontWeight: 600, color: VB.ink }}>{text.slice(i, i + phrase.length)}</b>{text.slice(i + phrase.length)}</span>;
  const key = phrase.replace(/^(a|an|the|be)\s+/i, '').split(/\s+/)[0].toLowerCase().slice(0, 4);
  return <span>{text.split(/(\s+)/).map((w, k) => (w.toLowerCase().replace(/[^a-z]/g, '').startsWith(key) ? <b key={k} style={{ fontWeight: 600, color: VB.ink }}>{w}</b> : w))}</span>;
}

const speak = (t: string) => {
  try { const u = new SpeechSynthesisUtterance(t); u.lang = 'en-GB'; u.rate = 0.9; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch { /* speech not supported */ }
};

/** Landing: one card per skill. */
function Landing({ savedCount, onOpen, onBack }: { savedCount: (sk: VocabSkill) => number; onOpen: (id: VocabSkill['id']) => void; onBack: () => void }) {
  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: '8px 32px 60px', fontFamily: VB.sans, color: VB.ink }}>
      <button type="button" onClick={onBack} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: VB.sans, fontSize: 13, fontWeight: 500, color: '#857F70', padding: 0, marginBottom: 28 }}>← Trang chủ</button>
      <section style={{ display: 'flex', alignItems: 'flex-start', gap: 32, borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ width: 88, height: 88, borderRadius: 18, background: VB.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/assets/illustrations/il-knowledge.svg" style={{ width: 52, height: 52, objectFit: 'contain' }} alt="" />
          </div>
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontFamily: VB.label, fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#857F70', margin: '0 0 8px' }}>Vocabulary</p>
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
              <button type="button" key={sk.id} className="cl-btn vb-product" onClick={() => onOpen(sk.id)} style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', minHeight: 380, borderRadius: 18, padding: '24px 22px 20px', background: sk.pillar, color: VB.ink }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ borderRadius: 8, background: 'rgba(255,255,255,0.45)', padding: '5px 10px', fontSize: 11, fontWeight: 600 }}>{words} cụm</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
                  <img src={sk.ill} style={{ width: 108, height: 108, objectFit: 'contain' }} alt="" />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 8px' }}>{sk.title}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(0,0,0,0.65)', margin: '0 0 16px', minHeight: 50 }}>{sk.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.15)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{sk.topics.length} chủ đề{savedCount(sk) ? ' · ' + savedCount(sk) + ' đã lưu' : ''}</span>
                    <span aria-hidden="true">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function CheckBox({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className="cl-btn vb-check" role="checkbox" aria-checked={on} aria-label={label} onClick={onClick} style={{ width: 20, height: 20, borderRadius: 6, border: '1.5px solid ' + (on ? VB.ink : VB.strong), background: on ? VB.ink : '#fff', color: '#fff', display: 'grid', placeItems: 'center' }}>
      {on && <Check size={13} strokeWidth={3} />}
    </button>
  );
}

/** One phrase in the vocab table. Click the row to expand the clamped columns. */
function Row({ item, topicName, selected, saved, practiced, onSelect, onSave }: { item: VocabItem; topicName: string | null; selected: boolean; saved: boolean; practiced: number; onSelect: () => void; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const clamp: React.CSSProperties = open ? {} : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
  const td: React.CSSProperties = { padding: '16px 14px', verticalAlign: 'top', borderTop: '1px solid ' + VB.line };
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const Status: LucideIcon = practiced ? CircleCheck : Circle;
  return (
    <tr className="vb-row" onClick={() => setOpen(!open)} aria-expanded={open} style={{ cursor: 'pointer', background: selected ? VB.yellowSoft : 'transparent' }}>
      <td style={{ ...td, paddingRight: 4 }} onClick={stop}><CheckBox on={selected} label={'Chọn ' + item.en} onClick={onSelect} /></td>
      <td style={{ ...td, paddingLeft: 4 }} onClick={stop}>
        <button type="button" className="cl-btn vb-icon" onClick={onSave} aria-label={saved ? 'Bỏ lưu' : 'Lưu'} aria-pressed={saved} style={{ width: 30, height: 30, marginTop: -5, borderRadius: 999, display: 'grid', placeItems: 'center', color: saved ? VB.ink : VB.strong }}><Bookmark size={17} strokeWidth={2} fill={saved ? 'currentColor' : 'none'} /></button>
      </td>
      <td style={td}>
        <div style={{ fontFamily: VB.sans, fontSize: 15, fontWeight: 600, color: VB.ink, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{item.en}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
          <span style={{ fontFamily: VB.sans, fontSize: 12.5, color: VB.ink4 }}>{item.ipa}</span>
          <button type="button" className="cl-btn vb-icon" onClick={(e) => { stop(e); speak(item.en); }} aria-label="Nghe phát âm" style={{ width: 24, height: 24, borderRadius: 999, display: 'grid', placeItems: 'center', color: VB.ink4 }}><Volume2 size={14} strokeWidth={2} /></button>
        </div>
        {topicName && <span style={{ display: 'inline-block', marginTop: 6, borderRadius: 999, background: VB.head, padding: '2px 8px', fontFamily: VB.sans, fontSize: 11, color: VB.ink3 }}>{topicName}</span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontFamily: VB.sans, fontSize: 11.5, color: practiced ? VB.success : VB.ink4 }}>
          <Status size={13} strokeWidth={2} />{practiced ? 'Đã luyện ' + practiced + ' lần' : 'Chưa luyện'}
        </div>
      </td>
      <td style={{ ...td, fontFamily: VB.sans, fontSize: 13.5, color: VB.ink2 }}>{item.pos}</td>
      <td style={{ ...td, fontFamily: VB.sans, fontSize: 13.5, lineHeight: 1.55, color: VB.ink }}>{item.vi}</td>
      <td style={td}><div style={{ ...clamp, fontFamily: VB.sans, fontSize: 13.5, lineHeight: 1.6, color: VB.ink2 }}><b style={{ fontWeight: 600, color: VB.ink }}>{item.en}</b> ({item.pos}): {item.deep}</div></td>
      <td style={td}><div style={{ ...clamp, fontFamily: VB.sans, fontSize: 13.5, lineHeight: 1.6, color: VB.ink2 }}>{item.colls.join(', ')}</div></td>
      <td style={td}>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {item.ex.map((e) => (
            <li key={e} style={{ display: 'flex', gap: 9 }}>
              <span style={{ marginTop: 9, width: 5, height: 5, borderRadius: 999, background: VB.ink, flexShrink: 0 }} />
              <span style={{ ...(open ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }), fontFamily: VB.sans, fontSize: 13.5, lineHeight: 1.6, color: VB.ink2 }}><Example text={e} phrase={item.en} /></span>
            </li>
          ))}
        </ul>
      </td>
    </tr>
  );
}

/**
 * Vocab builder: skill cards → topic rail + phrase table → tick phrases → "Tạo đoạn mẫu"
 * → rewrite the sample paragraph from hints (Chép mẫu engine).
 * Saved phrases and practice counts are stored per student (/api/vocab). Practice paragraphs are written by
 * the AI from the ticked phrases (/api/ai/vocab-paragraph); the pre-written ones are the fallback.
 */
export function VocabBuilder({ onBack }: { onBack: () => void }) {
  const [skillId, setSkillId] = useState<VocabSkill['id'] | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null); // a topic id, or 'saved'
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const router = useRouter();
  const [saved, setSavedState] = useState<Record<string, boolean>>({});
  const [count, setCount] = useState<Record<string, number>>({});
  /** The paragraph being practised; `groups` are the paragraph-sized groups of the ticked phrases, `at` the current one. */
  const [practice, setPractice] = useState<{ sample: GuidedSample; topic: string; phrases: string[]; groups: { name: string; phrases: string[] }[]; at: number } | null>(null);
  const [round, setRound] = useState(0);
  const [making, setMaking] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const signedOut = () => router.replace('/login?next=/vocab');
  const send = (body: unknown) => fetch('/api/vocab', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) })
    .then((r) => { if (r.status === 401) signedOut(); }, () => {});
  useEffect(() => {
    fetch('/api/vocab', { credentials: 'same-origin' }).then(async (r) => {
      if (r.status === 401) return signedOut();
      if (!r.ok) return;
      const d = await r.json();
      setSavedState(d.saved || {}); setCount(d.practiced || {});
    }, () => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleSaved = (en: string) => {
    const next = !saved[en];
    setSavedState((s) => ({ ...s, [en]: next }));
    send({ save: { phrase: en, saved: next } });
  };

  const skill = VB_SKILLS.find((s) => s.id === skillId);
  const savedCount = (sk: VocabSkill) => sk.topics.reduce((n, t) => n + t.items.filter((it) => saved[it.en]).length, 0);
  const shell = (body: ReactNode) => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <PageHeader />
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="cl-scroll">{body}</div>
    </div>
  );

  if (!skill) return shell(<Landing savedCount={savedCount} onBack={onBack} onOpen={(id) => { const sk = VB_SKILLS.find((s) => s.id === id); setSkillId(id); setTopicId(sk.topics[0].id); }} />);

  const isSaved = topicId === 'saved';
  const topic = skill.topics.find((t) => t.id === topicId);
  const rows: { it: VocabItem; t: VocabTopic }[] = isSaved
    ? skill.topics.flatMap((t) => t.items.filter((it) => saved[it.en]).map((it) => ({ it, t })))
    : topic.items.map((it) => ({ it, t: topic }));
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
  const railItem = (id: string, name: string, sub: string, n: number, Icon: LucideIcon) => {
    const on = topicId === id;
    return (
      <button key={id} type="button" className="cl-btn vb-topic" onClick={() => setTopicId(id)} aria-current={on} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', borderRadius: 12, border: '1px solid ' + (on ? VB.ink : VB.border), background: '#fff', padding: '14px 14px' }}>
        <span style={{ width: 38, height: 38, borderRadius: 10, background: on ? skill.pillar : skill.soft, display: 'grid', placeItems: 'center', color: VB.ink, flexShrink: 0 }}><Icon size={18} strokeWidth={2} /></span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: VB.sans, fontSize: 14.5, fontWeight: 600, color: VB.ink }}>{name}</span>
          <span style={{ fontFamily: VB.sans, fontSize: 12.5, color: VB.ink3 }}>{sub}</span>
        </span>
        <span style={{ fontFamily: VB.sans, fontSize: 12, color: VB.ink4 }}>{n}</span>
      </button>
    );
  };
  const allPicked = picked.length === rows.length && rows.length > 0;

  return shell(
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 40px 24px' }}>
      <button type="button" className="cl-btn cl-link" onClick={() => { setSkillId(null); setTopicId(null); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, fontFamily: VB.label, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: VB.ink3 }}><ArrowLeft size={15} strokeWidth={2} />Từ vựng</button>
      <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0,1fr)', gap: 24, alignItems: 'start' }}>
        <aside style={{ position: 'sticky', top: 0, borderRadius: 16, border: '1px solid ' + VB.border, background: '#fff', padding: '20px 14px 14px' }}>
          <VbLabel style={{ padding: '0 4px' }}>{skill.eyebrow}</VbLabel>
          <div style={{ marginTop: 14 }}>{railItem('saved', 'Đã lưu', 'Từ bạn lưu trong ' + skill.eyebrow, savedCount(skill), Bookmark)}</div>
          <div style={{ height: 1, background: VB.line, margin: '14px 4px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {skill.topics.map((t) => railItem(t.id, t.name, t.vi, t.items.length, Hash))}
          </div>
        </aside>

        <section style={{ minWidth: 0, borderRadius: 16, border: '1px solid ' + VB.border, background: '#fff', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', padding: '22px 24px 18px' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <VbLabel>{isSaved ? 'Đã lưu' : 'Chủ đề'}</VbLabel>
              <h1 style={{ margin: '8px 0 0', fontFamily: VB.sans, fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em', color: VB.ink }}>{isSaved ? 'Từ đã lưu' : topic.name}<span style={{ fontWeight: 400, color: VB.ink3 }}> · {isSaved ? skill.title : topic.vi}</span></h1>
              <p style={{ margin: '6px 0 0', fontFamily: VB.sans, fontSize: 13.5, color: VB.ink3 }}>{rows.length} cụm · {done} đã luyện · Bấm vào một dòng để xem đủ.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {note && <span role="alert" style={{ maxWidth: 320, fontFamily: VB.sans, fontSize: 12, color: '#8B3A35' }}>{note}</span>}
              <span style={{ fontFamily: VB.sans, fontSize: 13, color: picked.length > MAX_TICK ? '#8B3A35' : VB.ink3 }}>{picked.length > MAX_TICK ? 'Tối đa ' + MAX_TICK + ' cụm; sẽ dùng ' + MAX_TICK + ' cụm đầu' : picked.length > 6 ? 'Đã chọn ' + picked.length + ' cụm · sẽ chia thành vài đoạn' : picked.length ? 'Đã chọn ' + picked.length + ' cụm' : 'Chọn cụm muốn luyện, hoặc để trống'}</span>
              <button type="button" className="cl-btn cl-primary" disabled={!rows.length || making} onClick={() => go()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, borderRadius: 12, background: VB.ink, color: '#fff', fontFamily: VB.sans, fontSize: 13.5, fontWeight: 600, padding: '0 18px', opacity: rows.length && !making ? 1 : 0.35 }}><Sparkles size={15} strokeWidth={2} />{making ? 'Đang tạo đoạn…' : 'Tạo đoạn mẫu'}</button>
            </div>
          </div>
          {rows.length ? (
            <div className="cl-scroll" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 980, tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                <colgroup><col style={{ width: 44 }} /><col style={{ width: 48 }} /><col style={{ width: '17%' }} /><col style={{ width: '9%' }} /><col style={{ width: '12%' }} /><col style={{ width: '21%' }} /><col style={{ width: '15%' }} /><col style={{ width: '26%' }} /></colgroup>
                <thead>
                  <tr style={{ background: VB.head }}>
                    <th style={{ padding: '12px 4px 12px 14px', width: 44, textAlign: 'left' }}>
                      <CheckBox on={allPicked} label="Chọn tất cả" onClick={() => setSel((s) => ({ ...s, [key]: allPicked ? [] : rows.map((r) => r.it.en) }))} />
                    </th>
                    {['Lưu', 'Từ vựng', 'Loại từ', 'Nghĩa', 'Hiểu sâu', 'Collocation', 'Ví dụ'].map((h, k) => <th key={h} style={{ padding: k ? '12px 14px' : '12px 14px 12px 4px', textAlign: 'left', fontFamily: VB.sans, fontSize: 13, fontWeight: 600, color: VB.ink }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ it, t }) => <Row key={t.id + it.en} item={it} topicName={isSaved ? t.name : null} selected={picked.includes(it.en)} saved={!!saved[it.en]} practiced={count[it.en] || 0} onSelect={() => toggle(it.en)} onSave={() => toggleSaved(it.en)} />)}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px 24px 48px', borderTop: '1px solid ' + VB.line, fontFamily: VB.sans, fontSize: 14, color: VB.ink3 }}>Chưa lưu từ nào. Bấm biểu tượng lưu ở một dòng trong bất kỳ chủ đề nào, từ đó sẽ hiện ở đây.</div>
          )}
        </section>
      </div>
    </div>
  );
}
