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
      <GuidedWriter sections={sections} essay={essay} setEssay={setEssay} plan={g.plan} error={error} loading={loading} retry={load} loadingPhases={['Đang đọc dàn ý của bạn', 'Đang soạn từng câu', 'Đang chọn từ vựng']} />
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

/** Tự viết: the notes box under the chart in the left panel, saved with the attempt. */
export function FreeNotes({ essay, setEssay }: { essay: EssayState; setEssay: (fn: (e: EssayState) => EssayState) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>Ghi chú</span>
      <textarea className="co-ta" rows={5} value={essay.notes || ''} onChange={(e) => { const t = e.target.value; setEssay((x) => ({ ...x, notes: t })); }} placeholder="Ghi gì cũng được: điều bạn thấy trên biểu đồ, từ muốn dùng…"
        style={{ resize: 'vertical', borderRadius: 10, border: '1px solid ' + CL.ink2, padding: '8px 10px', fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit' }} />
    </label>
  );
}

/** Right column while writing: the translator. After Nộp bài the workspace shows the review instead. */
export function SideColumn() {
  return <aside style={{ ...card, gap: 0 }}><div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}><TranslatorChat skill="task1" /></div></aside>;
}

/** The label of each graded paragraph: the guided sections that hold text, or plain numbers for Tự viết. */
export function labelsOf(mode: 'guided' | 'free', essay: EssayState, sections: EssaySection[], count: number) {
  if (mode === 'guided') return sections.filter((s) => (essay.drafts[s.id] || '').trim()).map((s) => s.label);
  return Array.from({ length: count }, (_, i) => 'Đoạn ' + (i + 1));
}
