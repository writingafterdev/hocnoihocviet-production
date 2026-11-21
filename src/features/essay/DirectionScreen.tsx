'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { Prompt } from '@/content/prompts';
import { AI_ERROR_TEXT, AiRequestError, postAi } from '../ai/request';
import { CL, CL_CIRC } from '../chainlab/constants';
import type { Question } from '../chainlab/types';
import { ClIcon, PromptText, toolbarBtn } from '../chainlab/ui/primitives';
import { CoachGrid, SidePanel } from '../coach/CoachGrid';
import { TranslatorChat } from '../coach/TranslatorChat';
import { primaryBtn } from '../coach/ui';
import { Skeleton } from '@/components/base/skeleton/skeleton';
import { Chip } from '@/components/base/badges/chip';
import { directionQuestion, MOVE, routeNames, WAYS, wordingOf, type Direction, type DirectionWording, type RouteId, type WayId } from './direction';
import { KIND_ASK, kindOfShape } from './model';

/** The wording is the same for every student: kept for the session once loaded. */
const cache = new Map<string, DirectionWording>();

/** One move on a card's rail: dot, tag, what the mạch ý does. */
function Move({ id, text, last }: { id: keyof typeof MOVE; text: ReactNode; last: boolean }) {
  const m = MOVE[id];
  return (
    <span style={{ display: 'flex', gap: 12 }}>
      <span style={{ position: 'relative', width: 9, flexShrink: 0 }}>
        {!last && <span style={{ position: 'absolute', left: 4, top: 16, bottom: 0, width: 1, background: CL.ink2 }} />}
        <span style={{ position: 'absolute', top: 5, left: 0, width: 9, height: 9, borderRadius: id === 'end' ? 2 : 99, background: m.dot }} />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: last ? 4 : 12 }}>
        <span style={{ fontFamily: CL.sans, fontSize: 12, fontWeight: 600, color: m.fg }}>{m.tag}</span>
        <span style={{ fontFamily: CL.sans, fontSize: 13.5, lineHeight: 1.5, color: CL.ink8 }}>{text}</span>
      </span>
    </span>
  );
}

function Card({ name, route, on, way, wording, onPick }: { name: string; route: RouteId; on: boolean; way: WayId; wording: DirectionWording | null; onPick: (w: WayId) => void }) {
  const ways = WAYS[route];
  const cur = ways.find((w) => w.id === way) || ways[0];
  const words = wording ? wordingOf(wording, { route, way: cur.id }) : null;
  const bone = <Skeleton shape="text" style={{ display: 'block', width: '85%', height: 11, marginTop: 4 }} />;
  return (
    <div style={{ borderRadius: 12, background: on ? '#F7F9FD' : '#fff', boxShadow: '0 0 0 ' + (on ? '1.5px #2F62C4' : '1px ' + CL.border), display: 'flex', flexDirection: 'column', transition: 'box-shadow .15s, background-color .15s' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '12px 12px 0 16px' }}>
        <button type="button" className="cl-btn" onClick={() => onPick(cur.id)} aria-pressed={on}
          style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, minHeight: 30, border: 'none', background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
          <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: 99, boxSizing: 'border-box', border: on ? '5px solid #2F62C4' : '1.5px solid ' + CL.ink3, background: '#fff', flexShrink: 0 }} />
          <span style={{ fontFamily: CL.sans, fontSize: 14.5, fontWeight: 600, color: CL.ink }}>{name}</span>
        </button>
        <div role="group" aria-label={'Cách triển khai · ' + name} style={{ flex: '1 0 100%', boxSizing: 'border-box', display: 'flex', gap: 2, padding: 2, borderRadius: 8, background: CL.ink1 }}>
          {ways.map((w) => {
            const sel = w.id === cur.id;
            return (
              <button key={w.id} type="button" className="cl-btn" onClick={() => onPick(w.id)} aria-pressed={on && sel}
                style={{ flex: 1, height: 28, borderRadius: 6, padding: '0 8px', border: 'none', fontFamily: CL.sans, fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', background: sel ? '#fff' : 'transparent', color: sel ? CL.ink : CL.ink5, boxShadow: sel ? '0 1px 2px rgba(0,0,0,.08)' : 'none' }}>{w.name}</button>
            );
          })}
        </div>
      </div>
      <button type="button" className="cl-btn" tabIndex={-1} aria-hidden="true" onClick={() => onPick(cur.id)}
        style={{ flex: 1, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', padding: '14px 16px 8px', display: 'flex', flexDirection: 'column' }}>
        <Move id={cur.moves[0]} text={words ? words.b1 : bone} last={false} />
        <Move id={cur.moves[1]} text={words ? words.b2 : bone} last={false} />
        <Move id="end" text={words ? words.end : bone} last />
      </button>
    </div>
  );
}

/** A question placed automatically (cause, effect…): its kind and the prompt's own question. */
function AutoPart({ n, q }: { n: number; q: Question }) {
  return (
    <section style={{ flexShrink: 0, borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 56, padding: '0 22px' }}>
        <span style={{ fontFamily: CL.sans, fontSize: 14.5, fontWeight: 600, color: CL.ink }}>Ý {n}</span>
        <Chip variant="caption" color="gray">{CL_CIRC[q.n - 1]} {KIND_ASK[kindOfShape(q.shape)].chip}</Chip>
        <span style={{ flex: 1, minWidth: 0, fontFamily: CL.sans, fontSize: 13.5, color: CL.ink7 }}>{q.q}</span>
      </div>
    </section>
  );
}

export interface DirectionProps {
  prompt: Prompt;
  direction: Direction | null;
  setDirection: (d: Direction) => void;
  /** Rebuilding would discard mạch ý the student already wrote for another direction. */
  willRebuild: (d: Direction) => boolean;
  /** "Dựng mạch ý": the chains for this direction (rebuilt if it changed), then ② Dựng mạch ý. */
  onNext: (d: Direction, wording: DirectionWording) => void;
  toolbarLeft: ReactNode;
}

/** ① Chọn hướng bài: up to three directions for the verdict question; other questions are placed on their own. */
export function DirectionScreen({ prompt, direction, setDirection, willRebuild, onNext, toolbarLeft }: DirectionProps) {
  const vq = directionQuestion(prompt)!;
  const names = routeNames(prompt, vq);
  const [chat, setChat] = useState(true);
  const [wording, setWording] = useState<DirectionWording | null>(cache.get(prompt.id) || null);
  const [error, setError] = useState('');
  /** The way shown on each card (its toggle), kept when another card is picked. */
  const [ways, setWays] = useState<Record<RouteId, WayId>>({ left: 'other', right: 'other', balanced: 'depends', ...(direction ? { [direction.route]: direction.way } : {}) });

  const load = () => {
    setError('');
    postAi<{ wording: DirectionWording }>('direction', { promptId: prompt.id }).then(
      (r) => { cache.set(prompt.id, r.wording); setWording(r.wording); },
      (e) => setError(e instanceof AiRequestError ? AI_ERROR_TEXT[e.code] : AI_ERROR_TEXT.network),
    );
  };
  useEffect(() => { if (!wording) load(); }, [prompt.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (route: RouteId, way: WayId) => { setWays((w) => ({ ...w, [route]: way })); setDirection({ route, way }); };
  const ready = !!direction && !!wording;
  const multi = prompt.questions.length > 1;
  const routes: RouteId[] = ['left', 'right', 'balanced'];

  const cards = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
      {routes.map((r) => <Card key={r} name={names[r]} route={r} on={direction?.route === r} way={ways[r]} wording={wording} onPick={(w) => pick(r, w)} />)}
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1560, margin: '0 auto', padding: '24px 32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, minHeight: 42, paddingBottom: 12 }}>
        {toolbarLeft}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {ready && willRebuild(direction!) && <span style={{ fontFamily: CL.sans, fontSize: 12, color: CL.ink5, marginRight: 4 }}>Mạch ý đã dựng sẽ được dựng lại theo hướng mới.</span>}
          <button type="button" className="cl-btn" onClick={() => setChat(!chat)} aria-pressed={chat} style={toolbarBtn(chat)}>Dịch</button>
          <button type="button" className="cl-btn cl-primary" disabled={!ready} onClick={() => ready && onNext(direction!, wording!)}
            title={direction ? '' : 'Chọn một hướng bài để dựng mạch ý.'} style={{ ...primaryBtn, opacity: ready ? 1 : 0.4 }}>Dựng mạch ý<ClIcon name="right" size={13} /></button>
        </div>
      </div>

      <CoachGrid
        open={chat}
        main={
          <main className="co-col cl-scroll" style={{ minWidth: 0, overflowY: 'auto', gap: 16, paddingBottom: 24 }}>
            <PromptText text={prompt.text} style={{ flexShrink: 0, background: '#fff' }} />
            {prompt.questions.filter((q) => q.n < vq.n).map((q, i) => <AutoPart key={q.n} n={i + 1} q={q} />)}
            <section style={{ flexShrink: 0, borderRadius: 12, border: '1px solid ' + CL.border, background: '#fff', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 56, padding: '0 22px', borderBottom: '1px solid ' + CL.ink1 }}>
                <span style={{ fontFamily: CL.sans, fontSize: 14.5, fontWeight: 600, color: CL.ink }}>{multi ? 'Ý ' + (prompt.questions.filter((q) => q.n < vq.n).length + 1) : 'Hướng bài'}</span>
                {multi && <span style={{ flex: 1, minWidth: 0, fontFamily: CL.sans, fontSize: 13.5, color: CL.ink7 }}>{vq.q}</span>}
              </div>
              <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cards}
                {error && <p role="alert" style={{ margin: 0, fontFamily: CL.sans, fontSize: 12.5, color: CL.redText }}>{error} <button type="button" className="cl-btn" onClick={load} style={{ textDecoration: 'underline', color: CL.ink, fontSize: 12.5 }}>Thử lại</button></p>}
              </div>
            </section>
            {prompt.questions.filter((q) => q.n > vq.n).map((q, i) => <AutoPart key={q.n} n={prompt.questions.filter((x) => x.n < vq.n).length + 2 + i} q={q} />)}
          </main>
        }
        side={<SidePanel on={chat} grow={2}><TranslatorChat onClose={() => setChat(false)} /></SidePanel>}
      />
    </div>
  );
}
