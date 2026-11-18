'use client';

import { RiShuffleLine } from '@remixicon/react';
import { Pagination } from '@/components/base/pagination/pagination';
import { findPrompt, TOPIC_ILLUSTRATION, TOPICS_TASK2, type Topic } from '@/content/prompts';
import { KIND_LABEL, sentenceParts, STATEMENTS, type Statement, type StatementKind } from '@/content/statements';
import { Filter } from '../library/PromptLibrary';
import { kindChip } from './kind';

const PAGE = 20;
export const KINDS: StatementKind[] = ['cause', 'impact', 'solution'];
/** The type filter's icons, from /icons/filters: a question mark for causes, a chart for impacts, a light bulb for solutions. */
export const KIND_ICON: Record<string, string> = { cause: 'two-part-question', impact: 'positive-or-negative-development', solution: 'causes-problems-and-solutions' };
export const topicOf = (s: Statement) => findPrompt(s.promptId)?.topic as Topic | undefined;
/** Only the topics some statement belongs to, in the library's order. */
const TOPICS = TOPICS_TASK2.filter((t) => STATEMENTS.some((s) => topicOf(s) === t));

/** The statement with its starting point in green and its ending point in red, as the drill shows it. */
export function Sentence({ s }: { s: Statement }) {
  return (
    <>
      {sentenceParts(s.sentence).map((p, k) => (
        <span key={k} style={p.mark === 'start' ? { color: '#2D6E1E' } : p.mark === 'end' ? { color: '#B33A1A' } : undefined}>{p.text}</span>
      ))}
    </>
  );
}

/**
 * Chứng minh nhanh, before a statement is picked: every statement in the layout of the prompt library (Luyện viết), with
 * type and topic filters, "Câu ngẫu nhiên" (a random one from the filtered list, with the reel) and one row per statement.
 * `onOpen` gets the statement and the filtered list (what "Câu tiếp" goes on to); `onRandom` gets the filtered list.
 */
export interface LibraryView { kinds: string[]; topics: string[]; status: string[]; page: number }
export const EMPTY_VIEW: LibraryView = { kinds: [], topics: [], status: [], page: 0 };
const STATUS = ['todo', 'done'];
const STATUS_LABEL: Record<string, string> = { todo: 'Chưa làm', done: 'Đã làm' };
/** The progress filter has no icons. */
const STATUS_ICON: Record<string, string> = { todo: '', done: '' };

/**
 * `view`/`setView`: the filters and page, kept by the drill so "Thư viện" comes back to the same list. `done`: the
 * statements the student has finished (✓ on their rows, and the Tiến độ filter).
 */
export function StatementLibrary({ view, setView, done, onOpen, onRandom }: { view: LibraryView; setView: (v: LibraryView) => void; done: ReadonlySet<string>; onOpen: (s: Statement, pool: Statement[]) => void; onRandom: (pool: Statement[]) => void }) {
  const { kinds, topics, status, page } = view;
  const setPage = (n: number) => setView({ ...view, page: n });
  const toggle = (key: 'kinds' | 'topics' | 'status', v: string) => { const arr = view[key]; setView({ ...view, [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v], page: 0 }); };
  const filtered = STATEMENTS.filter((s) => (!kinds.length || kinds.includes(s.kind)) && (!topics.length || topics.includes(topicOf(s) || '')) && (!status.length || status.includes(done.has(s.id) ? 'done' : 'todo')));
  const pages = Math.ceil(filtered.length / PAGE);
  const pager = (className: string) => <Pagination className={className} previousLabel="Trang trước" nextLabel="Trang sau" aria-label="Chọn trang" page={page + 1} totalPages={pages} onChange={(n) => { setPage(n - 1); document.querySelector('main')?.scrollTo({ top: 0 }); }} />;

  return (
    // Scrolls on its own: a few px of padding so the cards' outline (drawn just outside them) isn't cut at the edges.
    <div className="co-rise" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '2px 4px 24px 2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>
        <div style={{ width: 96, height: 96, borderRadius: 12, background: '#FFF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src="/illustrations/man-sitting-on-question-mark-and-thinking.svg" style={{ width: 84, height: 84, objectFit: 'contain', mixBlendMode: 'multiply' }} alt="" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em', color: '#171717', margin: 0 }}>Chứng minh nhanh</h1>
      </div>

      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: 24 }} />

      <div className="pl-grid" style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
        <aside className="cl-scroll" style={{ width: 260, flexShrink: 0, position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
          <Filter title="Loại" options={KINDS} labels={KIND_LABEL} icons={KIND_ICON} selected={kinds} onToggle={(v) => toggle('kinds', v)} />
          <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', marginBottom: 32 }} />
          <Filter title="Chủ đề" options={TOPICS} selected={topics} onToggle={(v) => toggle('topics', v)} />
          <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', marginBottom: 32 }} />
          <Filter title="Tiến độ" options={STATUS} labels={STATUS_LABEL} icons={STATUS_ICON} selected={status} onToggle={(v) => toggle('status', v)} />
        </aside>
        <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length > 0 ? (
            <>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#737373', margin: '0 0 4px' }}>{filtered.length} câu</p>
              {pages > 1 && pager('mb-1')}
              <button type="button" onClick={() => onRandom(filtered)} className="pl-card t-card-hover" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, textAlign: 'left', fontFamily: 'var(--font-sans)', color: '#171717', background: '#fff', border: 'none', cursor: 'pointer', borderRadius: 12, boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 136, height: 72, borderRadius: 8, background: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/illustrations/scuba-diver-opening-treasure-chest-of-opportunities.svg" alt="" style={{ width: 64, height: 64, objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>
                <p style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>Câu ngẫu nhiên</p>
                <RiShuffleLine size={20} style={{ flexShrink: 0, marginRight: 8, color: '#525252' }} />
              </button>
              {filtered.slice(page * PAGE, (page + 1) * PAGE).map((s) => {
                const chip = kindChip(s), topic = topicOf(s), prompt = findPrompt(s.promptId);
                return (
                  <button key={s.id} type="button" onClick={() => onOpen(s, filtered)} className="pl-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 10, width: '100%', textAlign: 'left', font: 'inherit', color: '#171717', cursor: 'pointer', border: 'none', borderRadius: 12, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: 84, height: 84, borderRadius: 8, background: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {topic && <img src={'/illustrations/' + TOPIC_ILLUSTRATION[topic] + '.svg'} alt="" style={{ width: 70, height: 70, objectFit: 'contain', mixBlendMode: 'multiply' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ borderRadius: 4, background: chip.bg, padding: '2px 7px', fontSize: 11.5, fontWeight: 600, color: chip.fg }}>{chip.label}</span>
                        {topic && <span style={{ borderRadius: 4, background: '#EDF7EA', padding: '2px 7px', fontSize: 11.5, fontWeight: 600, color: '#167A59' }}>{topic}</span>}
                      </div>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, lineHeight: 1.5, margin: 0 }}><Sentence s={s} /></p>
                      {prompt && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, fontStyle: 'italic', lineHeight: 1.5, color: '#737373', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prompt.text}</p>}
                    </div>
                    {done.has(s.id) && <span aria-label="Đã làm" style={{ flexShrink: 0, width: 24, marginRight: 8, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#2D6E1E' }}>✓</span>}
                  </button>
                );
              })}
              {pages > 1 && pager('mt-5')}
            </>
          ) : (
            <div style={{ borderRadius: 10, border: '1px dashed #E5E5E5', padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: '#171717', margin: 0 }}>Không có câu nào khớp bộ lọc</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
