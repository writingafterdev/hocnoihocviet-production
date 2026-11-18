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

interface Group { s: Statement; tries: DrillAttempt[] }

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
 * "Mạch ý đã chứng minh": every Chứng minh nhanh statement the student has proved, one card per statement; opening it lists
 * each attempt with only what went wrong on the way (the notes of each Kiểm tra, then the paragraph's comments).
 */
export function DrillHistory() {
  const router = useRouter();
  const [list, setList] = useState<DrillAttempt[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string[]>([]);
  const [kinds, setKinds] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [para, setPara] = useState<string[]>([]);
  useEffect(() => {
    listAttempts().then((l) => (l === 'signed-out' ? router.replace('/login?next=/drills') : setList(l)), () => setFailed(true));
  }, [router]);

  const groups: Group[] = [];
  for (const a of list || []) {
    const s = findStatement(a.statementId);
    if (!s) continue;
    const g = groups.find((x) => x.s.id === s.id);
    if (g) g.tries.push(a); else groups.push({ s, tries: [a] });
  }
  const toggle = (set: (f: (v: string[]) => string[]) => void) => (v: string) => set((xs) => (xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v]));
  const shown = groups.filter(({ s, tries }) => (!kinds.length || kinds.includes(s.kind)) && (!topics.length || topics.includes(topicOf(s) || ''))
    && (!para.length || para.includes(tries.some((t) => t.paragraph) ? 'yes' : 'no')));
  const topicOptions = TOPICS_TASK2.filter((t) => groups.some((g) => topicOf(g.s) === t));

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
            <Link href="/prove" className="cl-primary" style={{ display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 14px', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 500 }}>Mở Chứng minh nhanh</Link>
          </div>
        ) : list && (
          <HistoryLayout filters={<>
            <Filter title="Loại" options={KINDS} selected={kinds} onToggle={toggle(setKinds)} labels={KIND_LABEL} icons={KIND_ICON} />
            {topicOptions.length > 1 && <Filter title="Chủ đề" options={topicOptions} selected={topics} onToggle={toggle(setTopics)} />}
            <Filter title="Đoạn văn" options={PARA} selected={para} onToggle={toggle(setPara)} labels={PARA_LABEL} icons={PARA_ICON} />
          </>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {shown.map(({ s, tries }) => {
                const chip = kindChip(s), topic = topicOf(s), on = open.includes(s.id);
                return (
                  <HistoryCard key={s.id} img={TOPIC_ILLUSTRATION[topic || 'Other Topics']} open={on} onToggle={() => toggle(setOpen)(s.id)}
                    chips={<><Chip bg={chip.bg} fg={chip.fg}>{chip.label}</Chip>{topic && <Chip bg="#F5F5F5" fg="#525252">{topic}</Chip>}</>}
                    title={<Sentence s={s} />}
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
                    <Link href={'/prove?s=' + s.id} style={primaryLink}>Làm lại câu này</Link>
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
