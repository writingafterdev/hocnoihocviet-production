'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CATEGORIES_TASK2, findPrompt, TOPIC_ILLUSTRATION, TOPICS_TASK2, type Prompt } from '@/content/prompts';
import { wordCount } from '../desk/scoring';
import { Filter } from '../library/PromptLibrary';
import { Chip, dayMonth, HistoryBone, HistoryCard, HistoryHeader, HistoryLayout, primaryLink, SectionTitle, smallLink } from './HistoryUI';
import { startFreeAttempt, startSampleAttempt } from './start';
import { attemptStore, SignedOutError, type Attempt } from './store';

const STATUS = ['draft', 'graded'];
const STATUS_LABEL: Record<string, string> = { draft: 'Đang viết', graded: 'Đã chấm' };
const STATUS_ICON: Record<string, string> = { draft: '', graded: '' };

const wordsOf = (a: Attempt) => Object.values(a.essay.drafts || {}).reduce((n, t) => n + wordCount(t), 0);
const bandOf = (a: Attempt) => a.essay.review?.scores.band ?? null;
const hrefOf = (a: Attempt) => '/write/' + a.id + (wordsOf(a) ? '/essay' : '/chains');
/** Nothing written yet (only the pre-filled starting point, no word): left out of the list. */
const isEmpty = (a: Attempt) => !wordsOf(a) && !a.chains.some((c) => (c.steps || []).slice(1).some((x) => x.trim()));

interface Group { p: Prompt; tries: Attempt[] }

/**
 * "Bài đã viết": unfinished essays on top ("Đang viết", to pick up again), then one card per prompt with its current band;
 * opening a card lists every graded attempt at it. Filters by state, prompt type and topic.
 */
export function AttemptHistory() {
  const router = useRouter();
  const [list, setList] = useState<Attempt[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState('');
  const [open, setOpen] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const signedOut = () => router.replace('/login?next=/attempts');
  useEffect(() => {
    attemptStore.list().then(setList, (e) => { if (e instanceof SignedOutError) signedOut(); else setFailed(true); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = (key: string, make: () => Promise<string>) => {
    if (busy) return;
    setBusy(key);
    make().then((url) => router.push(url), (e) => { setBusy(''); if (e instanceof SignedOutError) signedOut(); else setFailed(true); });
  };
  const toggle = (set: (f: (v: string[]) => string[]) => void) => (v: string) => set((xs) => (xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v]));

  const all = (list || []).filter((a) => findPrompt(a.promptId) && !isEmpty(a));
  const fits = (p: Prompt) => (!cats.length || cats.includes(p.category)) && (!topics.length || topics.includes(p.topic));
  // One card per prompt in "Đang viết": its newest unfinished attempt (the list comes newest first), with how many there are.
  const drafts: { a: Attempt; n: number }[] = [];
  for (const a of all) {
    if (bandOf(a) != null || !fits(findPrompt(a.promptId)!)) continue;
    const d = drafts.find((x) => x.a.promptId === a.promptId);
    if (d) d.n++; else drafts.push({ a, n: 1 });
  }
  const groups: Group[] = [];
  for (const a of all) {
    if (bandOf(a) == null) continue;
    const p = findPrompt(a.promptId)!;
    const g = groups.find((x) => x.p.id === p.id);
    if (g) g.tries.push(a); else groups.push({ p, tries: [a] });
  }
  groups.forEach((g) => g.tries.sort((x, y) => y.updatedAt - x.updatedAt));
  groups.sort((x, y) => y.tries[0].updatedAt - x.tries[0].updatedAt);
  const graded = groups.filter((g) => fits(g.p));
  const showDrafts = (!status.length || status.includes('draft')) && drafts.length > 0;
  const showGraded = (!status.length || status.includes('graded')) && graded.length > 0;
  const catOptions = CATEGORIES_TASK2.filter((c) => all.some((a) => findPrompt(a.promptId)?.category === c));
  const topicOptions = TOPICS_TASK2.filter((t) => all.some((a) => findPrompt(a.promptId)?.topic === t));

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
            {catOptions.length > 1 && <Filter title="Dạng đề" options={catOptions} selected={cats} onToggle={toggle(setCats)} />}
            {topicOptions.length > 1 && <Filter title="Chủ đề" options={topicOptions} selected={topics} onToggle={toggle(setTopics)} />}
          </>}>
            {showDrafts && (
              <div>
                <SectionTitle>Đang viết</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
                  {drafts.map(({ a, n }) => {
                    const p = findPrompt(a.promptId)!, words = wordsOf(a);
                    return (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px 8px 8px', borderRadius: 12, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)' }}>
                        <span style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 8, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={'/illustrations/' + TOPIC_ILLUSTRATION[p.topic] + '.svg'} alt="" style={{ width: 44, height: 44, objectFit: 'contain', mixBlendMode: 'multiply' }} />
                        </span>
                        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.text}</span>
                          <span style={{ fontSize: 12, color: '#737373' }}>{words ? a.chains.length + ' thân bài · ' + words + ' từ' : 'Đang dựng mạch ý'} · {dayMonth(a.updatedAt)}{n > 1 ? ' · ' + n + ' bản nháp' : ''}</span>
                        </span>
                        <Link href={hrefOf(a)} style={smallLink}>Viết tiếp</Link>
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
                  {graded.map(({ p, tries }) => {
                    const on = open.includes(p.id);
                    return (
                      <HistoryCard key={p.id} img={TOPIC_ILLUSTRATION[p.topic]} open={on} onToggle={() => toggle(setOpen)(p.id)}
                        chips={<><Chip bg="#F5F5F5" fg="#525252">{p.category}</Chip><Chip bg="#EDF7EA" fg="#167A59">{p.topic}</Chip></>}
                        title={p.text}
                        meta={tries.length + ' lần viết · ' + (tries.length > 1 ? 'gần nhất ' : '') + dayMonth(tries[0].updatedAt)}
                        right={<span style={{ flexShrink: 0, minWidth: 64, textAlign: 'center', fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', color: '#2F62C4', fontVariantNumeric: 'tabular-nums' }}>{bandOf(tries[0])!.toFixed(1)}</span>}>
                        {tries.map((a, k) => (
                          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0', borderBottom: '1px solid #F0F0F0', fontSize: 13.5 }}>
                            <span style={{ width: 56, fontWeight: 600 }}>Lần {tries.length - k}</span>
                            <span style={{ width: 64, color: '#525252' }}>{dayMonth(a.updatedAt)}</span>
                            <span style={{ flex: 1, color: '#525252' }}>{wordsOf(a)} từ</span>
                            <span style={{ width: 40, textAlign: 'right', fontWeight: 600, color: '#2F62C4', fontVariantNumeric: 'tabular-nums' }}>{bandOf(a)!.toFixed(1)}</span>
                            <Link href={hrefOf(a)} style={smallLink}>Mở</Link>
                          </div>
                        ))}
                        <button type="button" onClick={() => start(p.id, () => startFreeAttempt(p))} disabled={!!busy} style={primaryLink}>{busy === p.id ? 'Đang mở…' : 'Viết lại đề này'}</button>
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
    </div>
  );
}
