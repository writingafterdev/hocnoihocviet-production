'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TOPIC_ILLUSTRATION, TOPICS_TASK2 } from '@/content/prompts';
import { findStatement, KIND_LABEL, type Statement } from '@/content/statements';
import { NOTE_STYLE } from '../coach/useCoach';
import { Filter } from '../library/PromptLibrary';
import { Chip, dayMonth, HistoryBone, HistoryCard, HistoryHeader, HistoryLayout, primaryLink } from '../attempts/HistoryUI';
import { listAttempts, type DrillAttempt, type DrillErr } from './drill-attempts';
import { kindChip } from './kind';
import { KIND_ICON, KINDS, Sentence, topicOf } from './StatementLibrary';

const PARA = ['yes', 'no'];
const PARA_LABEL: Record<string, string> = { yes: 'Đã viết', no: 'Chưa viết' };
const PARA_ICON: Record<string, string> = { yes: '', no: '' };
const PARA_STYLE = { bg: '#EEF3FC', fg: '#2F62C4' };
/** A mạch ý mistake takes its note's colours; a paragraph comment, blue. */
const styleOf = (e: DrillErr) => (e.where === 'Đoạn văn' ? PARA_STYLE : Object.values(NOTE_STYLE).find((n) => n.label === e.label) || NOTE_STYLE.jump);

/** A Nghĩ ý prompt, as this page needs it (sent from the server: the doc itself stays there). */
export interface IdeaRef { text: string; macro: 'A' | 'B' | 'C' }
const MACRO_KIND = { A: 'cause', B: 'impact', C: 'solution' } as const;
const MACRO_CHIP = { A: { label: 'Nguyên nhân', bg: '#FFF0EB', fg: '#B33A1A' }, B: { label: 'Tác động', bg: '#EEF3FC', fg: '#2F62C4' }, C: { label: 'Giải pháp', bg: '#EDF7EA', fg: '#2D6E1E' } };
const SOURCES = ['prove', 'idea'];
const SOURCE_LABEL: Record<string, string> = { prove: 'Phát triển ý', idea: 'Nghĩ ý' };

/** One card: a Phát triển ý statement, or a missbacxiu prompt done in Nghĩ ý. */
interface Group { id: string; source: 'prove' | 'idea'; kind: string; topic: string | null; s?: Statement; idea?: IdeaRef; tries: DrillAttempt[] }

/** One mistake: where it was, the note's label, the student's words, how to fix it. */
function Err({ e }: { e: DrillErr }) {
  const st = styleOf(e);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', borderRadius: 8, background: '#FAFAFA' }}>
      <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip bg={st.bg} fg={st.fg}>{e.where}</Chip>
        <span style={{ fontSize: 13, fontWeight: 600, color: st.fg }}>{e.label}</span>
      </span>
      {e.quote && <span style={{ fontSize: 13, lineHeight: 1.5, color: '#737373' }}>“{e.quote}”</span>}
      {e.fix && <span style={{ fontSize: 13, lineHeight: 1.5, color: '#404040' }}><span style={{ color: '#737373' }}>Cách sửa: </span>{e.fix}</span>}
    </div>
  );
}

/**
 * "Mạch ý đã chứng minh": every Phát triển ý statement the student has proved, one card per statement; opening it lists
 * each attempt with only what went wrong on the way (the notes of each Kiểm tra, then the paragraph's comments).
 */
export function DrillHistory({ ideas = {} }: { ideas?: Record<string, IdeaRef> }) {
  const router = useRouter();
  const [list, setList] = useState<DrillAttempt[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string[]>([]);
  const [kinds, setKinds] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [para, setPara] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  useEffect(() => {
    listAttempts().then((l) => (l === 'signed-out' ? router.replace('/login?next=/drills') : setList(l)), () => setFailed(true));
  }, [router]);

  const groups: Group[] = [];
  for (const a of list || []) {
    const g = groups.find((x) => x.id === a.statementId);
    if (g) { g.tries.push(a); continue; }
    const s = findStatement(a.statementId), idea = ideas[a.statementId];
    if (s) groups.push({ id: s.id, source: 'prove', kind: s.kind, topic: topicOf(s) || null, s, tries: [a] });
    else if (idea) groups.push({ id: a.statementId, source: 'idea', kind: MACRO_KIND[idea.macro], topic: null, idea, tries: [a] });
  }
  const toggle = (set: (f: (v: string[]) => string[]) => void) => (v: string) => set((xs) => (xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v]));
  const shown = groups.filter((g) => (!kinds.length || kinds.includes(g.kind)) && (!topics.length || topics.includes(g.topic || ''))
    && (!sources.length || sources.includes(g.source)) && (!para.length || para.includes(g.tries.some((t) => t.paragraph) ? 'yes' : 'no')));
  const topicOptions = TOPICS_TASK2.filter((t) => groups.some((g) => g.topic === t));
  const bothSources = groups.some((g) => g.source === 'idea') && groups.some((g) => g.source === 'prove');

  return (
    <div style={{ minHeight: '100%', background: '#fff' }}>
      <main style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 32px', fontFamily: 'var(--font-sans)', color: '#171717' }}>
        <HistoryHeader img="man-sitting-on-question-mark-and-thinking" tint="#FFF0EB" title="Mạch ý đã chứng minh" />
        {failed && <p style={{ fontSize: 14, color: '#B33A1A' }}>Chưa tải được danh sách. Tải lại trang để thử lại.</p>}
        {!list && !failed && <HistoryBone />}
        {list && !groups.length ? (
          <div style={{ borderRadius: 12, background: '#FAFAFA', padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/woman-brainstorming-and-choosing-ideas.svg" alt="" style={{ width: 140, height: 140, objectFit: 'contain', mixBlendMode: 'multiply', marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px' }}>Chưa có mạch ý nào</p>
            <Link href="/prove" className="cl-primary" style={{ display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 14px', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 500 }}>Mở Phát triển ý</Link>
          </div>
        ) : list && (
          <HistoryLayout filters={<>
            {bothSources && <Filter title="Từ" options={SOURCES} selected={sources} onToggle={toggle(setSources)} labels={SOURCE_LABEL} />}
            <Filter title="Loại" options={KINDS} selected={kinds} onToggle={toggle(setKinds)} labels={KIND_LABEL} icons={KIND_ICON} />
            {topicOptions.length > 1 && <Filter title="Chủ đề" options={topicOptions} selected={topics} onToggle={toggle(setTopics)} />}
            <Filter title="Đoạn văn" options={PARA} selected={para} onToggle={toggle(setPara)} labels={PARA_LABEL} icons={PARA_ICON} />
          </>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {shown.map(({ id, s, idea, topic, tries }) => {
                const chip = s ? kindChip(s) : MACRO_CHIP[idea!.macro], on = open.includes(id);
                return (
                  <HistoryCard key={id} img={TOPIC_ILLUSTRATION[topic || 'Other Topics']} open={on} onToggle={() => toggle(setOpen)(id)}
                    chips={<>{idea && <Chip bg="#FFF6DE" fg="#8A5A00">Nghĩ ý</Chip>}<Chip bg={chip.bg} fg={chip.fg}>{chip.label}</Chip>{topic && <Chip bg="#F5F5F5" fg="#525252">{topic}</Chip>}</>}
                    title={s ? <Sentence s={s} /> : idea!.text}
                    meta={tries.length + ' lần · ' + (tries.length > 1 ? 'gần nhất ' : '') + dayMonth(tries[0].createdAt)}>
                    {tries.map((t, k) => {
                      const errs = [...t.errs, ...t.paraErrs];
                      return (
                        <div key={t.id} style={{ borderRadius: 10, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.08)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <span style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Lần {tries.length - k}</span>
                            <span style={{ fontSize: 12.5, color: '#737373' }}>{dayMonth(t.createdAt)}</span>
                          </span>
                          {errs.map((e, j) => <Err key={j} e={e} />)}
                          {!errs.length && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#2D6E1E' }}>
                              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.4l3.1 2.9 5.9-6.4" fill="none" stroke="#2D881A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>Qua ngay lần đầu
                            </span>
                          )}
                        </div>
                      );
                    })}
                    <Link href={s ? '/prove?s=' + s.id : '/nghi-y?q=' + id} style={primaryLink}>{s ? 'Làm lại câu này' : 'Làm lại đề này'}</Link>
                  </HistoryCard>
                );
              })}
            </div>
          </HistoryLayout>
        )}
      </main>
    </div>
  );
}
