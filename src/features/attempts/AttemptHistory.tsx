'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { CATEGORIES_TASK1, CATEGORIES_TASK2, findPrompt, TOPIC_ILLUSTRATION, TOPICS_TASK2 } from '@/content/prompts';
import { findTask1Prompt, type T1Prompt } from '@/content/task1';
import { wordCount } from '../desk/scoring';
import { Filter } from '../library/PromptLibrary';
import { Chip, dayMonth, HistoryBone, HistoryCard, HistoryHeader, HistoryLayout, primaryLink, SectionTitle, smallLink } from './HistoryUI';
import { MODE_LABEL, ModePickerDialog, ModePickerModal } from '../library/ModePickerModal';
import { startTask1, task1Store, type Task1Attempt } from '../task1/store';
import { ChartSketch } from '../task1/Thumb';
import { attemptHref, startAttempt, startSampleAttempt } from './start';
import { attemptStore, modeOf, SignedOutError, type Attempt } from './store';

const STATUS = ['draft', 'graded'];
const STATUS_LABEL: Record<string, string> = { draft: 'Đang viết', graded: 'Đã chấm' };
const STATUS_ICON: Record<string, string> = { draft: '', graded: '' };

const wordsOf = (a: Attempt) => Object.values(a.essay.drafts || {}).reduce((n, t) => n + wordCount(t), 0);
const bandOf = (a: Attempt) => a.essay.review?.scores.band ?? null;
/** Nothing written yet (only the pre-filled starting point, no word): left out of the list. */
const isEmpty = (a: Attempt) => !wordsOf(a) && !a.chains.some((c) => (c.steps || []).slice(1).some((x) => x.trim()));
const T1_STEP = { compare: 'Đang tìm điểm nổi bật', plan: 'Đang chia đoạn', write: 'Chưa viết chữ nào' } as const;
const TASKS = ['Task 1', 'Task 2'];

/** One attempt as the list shows it, whichever task it belongs to. */
interface Item { id: string; task: 'Task 1' | 'Task 2'; promptId: string; text: string; category: string; topic?: string; img: string | ((size: number) => ReactNode); mode: string; words: number; band: number | null; note: string; updatedAt: number; href: string }

function fromTask2(a: Attempt): Item | null {
  const p = findPrompt(a.promptId);
  if (!p || isEmpty(a)) return null;
  return { id: a.id, task: 'Task 2', promptId: p.id, text: p.text, category: p.category, topic: p.topic, img: TOPIC_ILLUSTRATION[p.topic], mode: MODE_LABEL[modeOf(a)], words: wordsOf(a), band: bandOf(a), note: 'Đang dựng mạch ý', updatedAt: a.updatedAt, href: attemptHref(a) };
}
const t1Text = (p: T1Prompt) => p.text.replace(/ (Summari[sz]e|Provide an overview) .*$/, '');
function fromTask1(a: Task1Attempt): Item | null {
  const p = findTask1Prompt(a.promptId);
  const words = Object.values(a.essay.drafts || {}).reduce((n, t) => n + wordCount(t), 0);
  if (!p || (!words && !a.found.length)) return null;
  const band = a.review && Array.isArray(a.review.paragraphs) ? a.review.scores.band : null;
  return { id: a.id, task: 'Task 1', promptId: p.id, text: t1Text(p), category: p.category, img: (size) => <ChartSketch pr={p} size={size} />, mode: MODE_LABEL[a.mode || 'guided'], words, band, note: a.mode === 'free' ? T1_STEP.write : T1_STEP[a.step], updatedAt: a.updatedAt, href: '/task1/' + a.id };
}

interface Group { key: string; first: Item; tries: Item[] }

/**
 * "Bài đã viết": unfinished essays on top ("Đang viết", to pick up again), then one card per prompt with its current band;
 * opening a card lists every graded attempt at it. Filters by state, prompt type and topic.
 */
export function AttemptHistory() {
  const router = useRouter();
  const [list, setList] = useState<Attempt[] | null>(null);
  /** Task 1 attempts, for signed-in students. */
  const [t1, setT1] = useState<Task1Attempt[]>([]);
  const [tasks, setTasks] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState('');
  /** "Viết lại đề này" opens the start popup for that prompt. */
  const [again, setAgain] = useState<Item | null>(null);
  const [open, setOpen] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const signedOut = () => router.replace('/login?next=/attempts');
  useEffect(() => {
    attemptStore.list().then(setList, (e) => { if (e instanceof SignedOutError) signedOut(); else setFailed(true); });
    task1Store.access().then((ok) => { if (ok) task1Store.list().then(setT1, () => {}); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = (key: string, make: () => Promise<string>) => {
    if (busy) return;
    setBusy(key);
    make().then((url) => router.push(url), (e) => { setBusy(''); if (e instanceof SignedOutError) signedOut(); else setFailed(true); });
  };
  const toggle = (set: (f: (v: string[]) => string[]) => void) => (v: string) => set((xs) => (xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v]));

  // Newest first, both tasks together.
  const all = [...(list || []).map(fromTask2), ...t1.map(fromTask1)].filter((x): x is Item => !!x).sort((x, y) => y.updatedAt - x.updatedAt);
  const fits = (x: Item) => (!tasks.length || tasks.includes(x.task)) && (!cats.length || cats.includes(x.category)) && (!topics.length || (!!x.topic && topics.includes(x.topic)));
  const keyOf = (x: Item) => x.task + ':' + x.promptId;
  // One card per prompt in "Đang viết": its newest unfinished attempt, with how many there are.
  const drafts: { a: Item; n: number }[] = [];
  for (const a of all) {
    if (a.band != null || !fits(a)) continue;
    const d = drafts.find((x) => keyOf(x.a) === keyOf(a));
    if (d) d.n++; else drafts.push({ a, n: 1 });
  }
  const groups: Group[] = [];
  for (const a of all) {
    if (a.band == null || !fits(a)) continue;
    const g = groups.find((x) => x.key === keyOf(a));
    if (g) g.tries.push(a); else groups.push({ key: keyOf(a), first: a, tries: [a] });
  }
  const graded = groups;
  const showDrafts = (!status.length || status.includes('draft')) && drafts.length > 0;
  const showGraded = (!status.length || status.includes('graded')) && graded.length > 0;
  const hasT1 = all.some((x) => x.task === 'Task 1');
  const catOptions = [...CATEGORIES_TASK2, ...CATEGORIES_TASK1].filter((c) => all.some((x) => x.category === c));
  const topicOptions = TOPICS_TASK2.filter((t) => all.some((x) => x.topic === t));

  const sample = (
    <button type="button" onClick={() => start('sample', startSampleAttempt)} disabled={!!busy} className="pl-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px 10px 10px', textAlign: 'left', fontFamily: 'inherit', color: '#171717', background: '#fff', border: 'none', cursor: 'pointer', borderRadius: 12, boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)' }}>
      <span style={{ width: 120, height: 72, borderRadius: 8, background: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/cv-of-a-perfect-candidate.svg" alt="" style={{ width: 60, height: 60, objectFit: 'contain', mixBlendMode: 'multiply' }} />
      </span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Bài mẫu band 7</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{busy === 'sample' ? 'Đang mở…' : 'Mở →'}</span>
    </button>
  );

  return (
    <div style={{ minHeight: '100%', background: '#fff' }}>
      <main style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 32px', fontFamily: 'var(--font-sans)', color: '#171717' }}>
        <HistoryHeader img="finishing-tasks-on-checklist-task-completion-or-productivity-concept" tint="#EEF3FC" title="Bài đã viết" />
        {failed && <p style={{ fontSize: 14, color: '#B33A1A' }}>Chưa tải được danh sách. Tải lại trang để thử lại.</p>}
        {!list && !failed && <HistoryBone />}
        {list && !all.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ borderRadius: 12, background: '#FAFAFA', padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/illustrations/woman-with-paper-document-thinking.svg" alt="" style={{ width: 140, height: 140, objectFit: 'contain', mixBlendMode: 'multiply', marginBottom: 12 }} />
              <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px' }}>Chưa có bài nào</p>
              <Link href="/writing" className="cl-primary" style={{ display: 'inline-flex', alignItems: 'center', height: 36, padding: '0 14px', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 500 }}>Mở thư viện đề</Link>
            </div>
            {sample}
          </div>
        ) : list && (
          <HistoryLayout filters={<>
            <Filter title="Trạng thái" options={STATUS} selected={status} onToggle={toggle(setStatus)} labels={STATUS_LABEL} icons={STATUS_ICON} />
            {hasT1 && <Filter title="Bài viết" options={TASKS} selected={tasks} onToggle={toggle(setTasks)} />}
            {catOptions.length > 1 && <Filter title="Dạng đề" options={catOptions} selected={cats} onToggle={toggle(setCats)} />}
            {topicOptions.length > 1 && <Filter title="Chủ đề" options={topicOptions} selected={topics} onToggle={toggle(setTopics)} />}
          </>}>
            {showDrafts && (
              <div>
                <SectionTitle>Đang viết</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
                  {drafts.map(({ a, n }) => {
                    return (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px 8px 8px', borderRadius: 12, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)' }}>
                        <span style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 8, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {typeof a.img === 'string' ? <img src={'/illustrations/' + a.img + '.svg'} alt="" style={{ width: 44, height: 44, objectFit: 'contain', mixBlendMode: 'multiply' }} /> : a.img(44)}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.text}</span>
                          <span style={{ fontSize: 12, color: '#737373' }}>{hasT1 ? a.task + ' · ' : ''}{a.mode} · {a.words ? a.words + ' từ' : a.note} · {dayMonth(a.updatedAt)}{n > 1 ? ' · ' + n + ' bản nháp' : ''}</span>
                        </span>
                        <Link href={a.href} style={smallLink}>Viết tiếp</Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {showGraded && (
              <div>
                {showDrafts && <SectionTitle>Đã chấm</SectionTitle>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {graded.map(({ key, first: p, tries }) => {
                    const on = open.includes(key);
                    return (
                      <HistoryCard key={key} img={typeof p.img === 'string' ? p.img : p.img(76)} open={on} onToggle={() => toggle(setOpen)(key)}
                        chips={<>{hasT1 && <Chip bg="#EEF3FC" fg="#2F62C4">{p.task}</Chip>}<Chip bg="#F5F5F5" fg="#525252">{p.category}</Chip>{p.topic && <Chip bg="#EDF7EA" fg="#167A59">{p.topic}</Chip>}</>}
                        title={p.text}
                        meta={tries.length + ' lần viết · ' + (tries.length > 1 ? 'gần nhất ' : '') + dayMonth(tries[0].updatedAt)}
                        right={<span style={{ flexShrink: 0, minWidth: 64, textAlign: 'center', fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', color: '#2F62C4', fontVariantNumeric: 'tabular-nums' }}>{tries[0].band!.toFixed(1)}</span>}>
                        {tries.map((a, k) => (
                          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0', borderBottom: '1px solid #F0F0F0', fontSize: 13.5 }}>
                            <span style={{ width: 56, fontWeight: 600 }}>Lần {tries.length - k}</span>
                            <span style={{ width: 64, color: '#525252' }}>{dayMonth(a.updatedAt)}</span>
                            <span style={{ width: 128, color: '#525252', whiteSpace: 'nowrap' }}>{a.mode}</span>
                            <span style={{ flex: 1, color: '#525252', whiteSpace: 'nowrap' }}>{a.words} từ</span>
                            <span style={{ width: 40, textAlign: 'right', fontWeight: 600, color: '#2F62C4', fontVariantNumeric: 'tabular-nums' }}>{a.band!.toFixed(1)}</span>
                            <Link href={a.href} style={smallLink}>Mở</Link>
                          </div>
                        ))}
                        <button type="button" onClick={() => setAgain(p)} disabled={!!busy} style={primaryLink}>Viết lại đề này</button>
                      </HistoryCard>
                    );
                  })}
                </div>
              </div>
            )}
            {sample}
          </HistoryLayout>
        )}
      </main>
      {again && again.task === 'Task 2' && (() => { const p = findPrompt(again.promptId)!; return <ModePickerModal prompt={p} onClose={() => setAgain(null)} onStart={(m) => start(p.id, () => startAttempt(p, m))} onResume={(a) => router.push(attemptHref(a))} />; })()}
      {again && again.task === 'Task 1' && (() => {
        const open1 = t1.filter((a) => a.promptId === again.promptId && !a.review).sort((a, b) => b.updatedAt - a.updatedAt)[0];
        return <ModePickerDialog text={again.text} onClose={() => setAgain(null)} onStart={(m) => start(again.promptId, () => startTask1(again.promptId, m))}
          last={open1 ? { mode: open1.mode || 'guided', updatedAt: open1.updatedAt, resume: () => router.push('/task1/' + open1.id) } : null} />;
      })()}
    </div>
  );
}
