/** Question type inside a Task 2 prompt. Decides chips, rope/stance and solution links. */
export type Shape = 'verdict' | 'cause' | 'problem' | 'planproblem' | 'effect' | 'solution';
export type Side = 'left' | 'right' | null;
export type Tone = 'benefit' | 'cost' | null;

export interface Question {
  n: number;
  shape: Shape;
  q: string;
  /** Rope end labels, verdict questions only: [left, right]. */
  sides?: [string, string];
}

export interface PromptSpec {
  id: string;
  label?: string;
  text: string;
  questions: Question[];
  reqs?: string[];
  driver?: string;
  stakeholders?: string[];
  chains?: Chain[];
}

export interface Finding {
  id: string;
  kind: string;
  text: string;
  side: Side;
  /** 'all' = the whole chain, a number = that Scope branch. */
  target: 'all' | number;
  empty?: boolean;
}

export interface Branch {
  label: string;
  steps: string[];
  side?: Side;
  effect?: string;
}

export interface Split {
  at: number;
  noun: string;
  branches: Branch[];
}

export interface JumpFlag { at: number; snap: string; q: string }
export interface VagueFlag { step: number; snap: string; word: string; q: string }

export interface ChainCheck {
  snapshot: string;
  flags: JumpFlag[];
  vague: VagueFlag[];
  note?: string;
  dismissed?: string[];
}

export interface Chain {
  id: string;
  /** Which question (①, ②…) this chain answers. */
  q: number;
  title: string;
  tone: Tone;
  pos?: number;
  area: string;
  steps: string[];
  split: Split | null;
  findings: Finding[];
  side?: Side;
  /** Solution chains: id of the cause/problem chain this solution addresses. */
  fixes?: string | null;
  check?: ChainCheck;
}

export interface Lens {
  kind: string;
  q: string;
  ph?: string;
}

/** One item of feedback in a review panel (chain review or essay review). */
export interface ReviewItem {
  key: string;
  where: string;
  text: string;
  chainId?: string;
  sectionId?: string;
  target?: 'stance';
  snapKind?: 'flag' | 'vague';
  at?: number;
  snap?: string;
  word?: string;
  para?: boolean;
  fixed?: boolean;
}

export interface ReviewGroup {
  id: string;
  title: string;
  items: ReviewItem[];
}

export interface RopeUnit {
  key: string;
  label: string;
  kind: 'unit' | 'finding';
  chainId: string;
  ref: { type: 'chain' } | { type: 'branch'; k: number } | { type: 'finding'; id: string };
  side: Side;
  tone: Tone;
  title: string;
  findings?: Finding[];
  sub?: string;
  text?: string;
  chainName?: string;
  lens?: string;
}
