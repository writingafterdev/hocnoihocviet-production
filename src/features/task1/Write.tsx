'use client';

import { useEffect, useState } from 'react';
import type { T1Prompt } from '@/content/task1';
import { SignedOutError, type EssayState } from '../attempts/store';
import { AI_ERROR_TEXT, AiRequestError, postAi } from '../ai/request';
import { CL } from '../chainlab/constants';
import { TranslatorChat } from '../coach/TranslatorChat';
import type { EssaySection } from '../desk/scoring';
import { GuidedHeader, GuidedWriter } from '../essay/GuidedWriter';
import type { GuidedSentence } from '@/lib/ai/guided-essay';
import { boxesOf, indexesIn, type PlanState } from './Plan';
import type { Task1Review } from './store';

const words = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
const card: React.CSSProperties = { borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' };

/** The sections of a Task 1 report: Mở bài, Tổng quan, then the body paragraphs that hold findings, in the student's order. */
export function sectionsOf(plan: PlanState): EssaySection[] {
  const bodies = boxesOf(plan.order).filter((b) => b.key !== 'overview' && indexesIn(plan, b.key).length);
  return [
    { id: 'intro', label: 'Mở bài', guide: '1 câu', placeholder: '' },
    { id: 'overview', label: 'Tổng quan', guide: '1–2 câu', placeholder: '' },
    ...bodies.map((b, i) => ({ id: b.key, label: 'Đoạn ' + (i + 1), guide: '', placeholder: '' })),
  ];
}

/** The report as paragraphs, for grading and word count. */
export function paragraphsOf(mode: 'guided' | 'free', essay: EssayState, sections: EssaySection[]) {
  if (mode === 'free') return (essay.drafts.free || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return sections.map((s) => (essay.drafts[s.id] || '').trim()).filter(Boolean);
}

/** ③ Viết bài, chosen once: Viết có hướng dẫn (one sentence per finding) or Tự viết. */
export function ModeChoice({ onPick }: { onPick: (m: 'guided' | 'free') => void }) {
  const opt = (m: 'guided' | 'free', title: string, desc: string) => (
    <span className={m === 'guided' ? 'pro-fill pro-block' : ''} style={{ display: 'flex' }}>
      <button type="button" className="cl-btn" onClick={() => onPick(m)} style={{ flex: 1, textAlign: 'left', padding: '18px 20px', borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 13, lineHeight: 1.55, opacity: 0.85 }}>{desc}</span>
      </button>
    </span>
  );
  return (
    <div style={{ ...card, padding: 24, gap: 14, justifyContent: 'center' }}>
      <span style={{ fontSize: 16, fontWeight: 600 }}>Bạn muốn viết thế nào?</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {opt('guided', 'Viết có hướng dẫn', 'Viết từng câu theo dàn ý của bạn. Mỗi câu có cấu trúc và từ vựng; vẫn bí thì bật gợi ý chi tiết.')}
        {opt('free', 'Tự viết', 'Viết cả bài theo cách của bạn, có ghi chú và khung dịch bên cạnh.')}
      </div>
    </div>
  );
}

/** Viết có hướng dẫn: the sentences come from the AI once per plan, then GuidedWriter takes over (same as Task 2). */
export function GuidedColumn({ prompt, plan, essay, setEssay, found }: { prompt: T1Prompt; plan: PlanState; essay: EssayState; setEssay: (fn: (e: EssayState) => EssayState) => void; found: PlanState['found'] }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const sections = sectionsOf(plan);
  const g = essay.guided;
  const load = async () => {
    if (loading) return;
    setLoading(true); setError('');
    try {
      const body = { promptId: prompt.id, plan: { overview: plan.ov.map((i) => found[i].row), bodies: sections.filter((s) => s.id.startsWith('b')).map((s) => ({ key: s.id, rows: indexesIn(plan, s.id).map((i) => found[i].row) })) } };
      const r = await postAi<{ sentences: GuidedSentence[] }>('task1-plan', body);
      if (!r.sentences?.length) throw new AiRequestError('bad_output');
      setEssay((e) => (e.guided ? { ...e, guided: { ...e.guided, plan: r.sentences, at: 0 } } : e));
    } catch (e) {
      if (e instanceof SignedOutError) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
      setError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network);
    }
    setLoading(false);
  };
  useEffect(() => { if (g && !g.done && !g.plan) load(); }, [!!g, g?.plan]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!g) return null;
  if (g.done) return <DraftsColumn sections={sections} essay={essay} setEssay={setEssay} />;
  return (
    <section style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 50, padding: '0 20px', borderBottom: '1px solid ' + CL.ink1, background: CL.panel }}>
        <GuidedHeader essay={essay} setEssay={setEssay} total={g.plan ? g.plan.length : 0} />
      </div>
      <GuidedWriter sections={sections} essay={essay} setEssay={setEssay} plan={g.plan} error={error} loading={loading} retry={load} />
    </section>
  );
}

/** After the guided round (or "Tự viết phần còn lại"): each section as its own box. */
function DraftsColumn({ sections, essay, setEssay }: { sections: EssaySection[]; essay: EssayState; setEssay: (fn: (e: EssayState) => EssayState) => void }) {
  const total = sections.reduce((n, s) => n + words(essay.drafts[s.id] || ''), 0);
  return (
    <section style={card}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 50, padding: '0 20px', borderBottom: '1px solid ' + CL.ink1, background: CL.panel }}>
        <span style={{ fontSize: 12.5, fontWeight: 500 }}>Bài viết</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: CL.ink5 }}>Số từ: <b style={{ color: total >= 150 ? CL.green : CL.ink }}>{total}</b> / 150</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sections.map((s) => (
          <label key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: CL.ink5 }}>{s.label}</span>
            <textarea className="co-ta" rows={3} value={essay.drafts[s.id] || ''} onChange={(e) => { const t = e.target.value; setEssay((x) => ({ ...x, drafts: { ...x.drafts, [s.id]: t } })); }} placeholder="Viết đoạn này."
              style={{ resize: 'vertical', borderRadius: 10, border: '1px solid ' + CL.ink2, padding: '10px 13px', fontSize: 15, lineHeight: 1.7, color: CL.ink8, fontFamily: 'inherit' }} />
          </label>
        ))}
      </div>
    </section>
  );
}

/** Tự viết: one editor; paragraphs are split by an empty line. */
export function FreeColumn({ essay, setEssay }: { essay: EssayState; setEssay: (fn: (e: EssayState) => EssayState) => void }) {
  const text = essay.drafts.free || '';
  return (
    <section style={card}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 50, padding: '0 20px', borderBottom: '1px solid ' + CL.ink1, background: CL.panel }}>
        <span style={{ fontSize: 12.5, fontWeight: 500 }}>Bài viết</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: CL.ink5 }}>Số từ: <b style={{ color: words(text) >= 150 ? CL.green : CL.ink }}>{words(text)}</b> / 150</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: '16px 20px 20px', display: 'flex' }}>
        <textarea className="co-ta" value={text} onChange={(e) => { const t = e.target.value; setEssay((x) => ({ ...x, drafts: { ...x.drafts, free: t } })); }} placeholder="Viết bài của bạn ở đây. Để một dòng trống giữa các đoạn."
          style={{ flex: 1, resize: 'none', borderRadius: 12, border: '1px solid ' + CL.ink2, padding: '16px 20px', fontSize: 15, lineHeight: 1.75, color: CL.ink8, fontFamily: 'inherit' }} />
      </div>
    </section>
  );
}

/** Right column: notes (Tự viết) and the translator while writing; the assessment after Nộp bài. */
export function SideColumn({ mode, essay, setEssay, review }: { mode: 'guided' | 'free'; essay: EssayState; setEssay: (fn: (e: EssayState) => EssayState) => void; review: Task1Review | null }) {
  if (review) return <ReviewPanel review={review} />;
  return (
    <aside style={{ ...card, gap: 0 }}>
      {mode === 'free' && (
        <div style={{ padding: '12px 14px', borderBottom: '1px solid ' + CL.ink1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Ghi chú</span>
          <textarea className="co-ta" rows={4} value={essay.notes || ''} onChange={(e) => { const t = e.target.value; setEssay((x) => ({ ...x, notes: t })); }} placeholder="Ghi gì cũng được: điều bạn thấy trên biểu đồ, từ muốn dùng…"
            style={{ resize: 'vertical', borderRadius: 10, border: '1px solid ' + CL.ink2, padding: '8px 10px', fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit' }} />
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}><TranslatorChat skill="task1" /></div>
    </aside>
  );
}

function ReviewPanel({ review }: { review: Task1Review }) {
  const s = review.scores;
  const rows: [string, number][] = [['Task Achievement', s.ta], ['Coherence & Cohesion', s.cc], ['Lexical Resource', s.lr], ['Grammatical Range & Accuracy', s.gra]];
  return (
    <aside style={card}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 46, padding: '0 16px', borderBottom: '1px solid ' + CL.ink1 }}><span style={{ fontSize: 13.5, fontWeight: 600 }}>Kết quả</span></div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="pro-fill"><button type="button" tabIndex={-1} style={{ width: 60, height: 60, borderRadius: 12, fontSize: 24, fontWeight: 700, cursor: 'default' }}>{s.band.toFixed(1)}</button></span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>{rows.map(([n, v]) => <span key={n} style={{ display: 'flex', gap: 8, fontSize: 12, color: CL.ink7 }}><span style={{ flex: 1 }}>{n}</span><b style={{ color: CL.ink }}>{v.toFixed(1)}</b></span>)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Điểm chính của đề</span>
          {review.features.map((f) => (
            <span key={f.label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.5 }}>
              <span aria-hidden="true" style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1, borderRadius: 99, background: f.covered ? CL.mintSoft : CL.redSoft, color: f.covered ? CL.greenText : CL.redText, fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{f.covered ? '✓' : '!'}</span>
              <span>{f.label}{f.note && <span style={{ display: 'block', fontSize: 12, color: CL.ink5 }}>{f.note}</span>}</span>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Nhận xét</span>
          {review.comments.map((c, i) => <p key={i} style={{ margin: 0, padding: '9px 11px', borderRadius: 10, background: c.kind === 'good' ? CL.mintSoft : '#FFF7E0', fontSize: 13, lineHeight: 1.55 }}>{c.text}</p>)}
        </div>
        {review.skeleton.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Khung bài của bạn</span>
            {review.skeleton.map((k, i) => (
              <div key={i} style={{ position: 'relative', display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 10, background: k.warn ? CL.redSoft : 'transparent' }}>
                {i < review.skeleton.length - 1 && <span aria-hidden="true" style={{ position: 'absolute', left: 15, top: 19, bottom: -15, width: 1.5, background: '#DCE7F7' }} />}
                <span aria-hidden="true" style={{ position: 'relative', width: 11, height: 11, marginTop: 3, flexShrink: 0, borderRadius: 99, background: '#fff', boxShadow: 'inset 0 0 0 2.5px ' + (k.warn ? CL.red : '#2F62C4') }} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{k.name}</span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.5, color: CL.ink7 }}>{k.text}</span>
                  {k.warn && <span style={{ fontSize: 12, color: CL.redText }}>{k.warn}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
