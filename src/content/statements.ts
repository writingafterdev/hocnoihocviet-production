/**
 * "Chứng minh nhanh": ready-made statements to prove, one per prompt in the library.
 *
 * Each statement is an English topic sentence whose two ends are words of the sentence itself: [[…]] marks
 * the starting point, ((…)) the ending point and {{…}} the stakeholder. The student writes the steps between.
 *
 * - cause: start = a cause, end = the trend the prompt asks about
 * - impact: start = what the prompt describes, end = what it does to someone (tone: benefit or cost)
 * - solution: start = a measure, end = the problem solved
 */
export type StatementKind = 'cause' | 'impact' | 'solution';

export interface Statement {
  id: string;
  promptId: string;
  kind: StatementKind;
  tone?: 'benefit' | 'cost';
  sentence: string;
  /** Taken from the sentence's markers. */
  start: string;
  end: string;
  stakeholder: string;
}

export const KIND_LABEL: Record<StatementKind, string> = { cause: 'Nguyên nhân', impact: 'Tác động', solution: 'Giải pháp' };

type Raw = Omit<Statement, 'start' | 'end' | 'stakeholder'>;

const RAW: Raw[] = [
  { id: 'c-city-traffic', promptId: 'city-traffic', kind: 'cause',
    sentence: '[[Cheap motorbike and car loans]] let {{middle-income commuters}} buy their own vehicles, which is a major reason for ((serious traffic congestion in cities)).' },
  { id: 'c-declining-bicycle', promptId: 'declining-bicycle-use', kind: 'cause',
    sentence: '[[Cities spreading outwards]] leave {{office workers}} living too far from their jobs to cycle, so ((fewer people use bicycles as their main transport)).' },
  { id: 'c-anti-social', promptId: 'anti-social-behaviour', kind: 'cause',
    sentence: '[[Long working hours for both parents]] leave {{teenagers}} with little adult guidance, which contributes to ((rising anti-social behaviour and a lack of respect)).' },
  { id: 'c-weight-fitness', promptId: 'weight-and-fitness', kind: 'cause',
    sentence: '[[Food delivery apps]] mean {{busy young adults}} rarely cook or walk to buy food, one cause of ((rising average weight and falling fitness)).' },
  { id: 'c-throwaway', promptId: 'throwaway-culture', kind: 'cause',
    sentence: '[[Cheap mass-produced electronics]] make a new device cost {{ordinary households}} little more than a repair, so ((broken things are thrown away instead of repaired)).' },
  { id: 'c-science-students', promptId: 'declining-science-students', kind: 'cause',
    sentence: '[[Long science degrees with low starting salaries]] push {{school leavers}} towards business or IT, so ((fewer students study science at university)).' },
  { id: 'c-elderly-care', promptId: 'elderly-care-decline', kind: 'cause',
    sentence: '[[Jobs concentrated in big cities]] force {{adult children}} to live far from their parents, so ((families spend less time caring for elderly relatives)).' },
  { id: 'c-food-waste', promptId: 'food-waste', kind: 'cause',
    sentence: '[[Supermarket multi-buy offers]] persuade {{families}} to buy more fresh food than they can eat, which adds to ((millions of tons of food wasted every day)).' },
  { id: 'c-rural-to-city', promptId: 'rural-to-city', kind: 'cause',
    sentence: '[[Universities located only in cities]] mean {{rural teenagers}} must move away to study, which explains why ((young people move from rural areas to cities)).' },
  { id: 'c-living-alone', promptId: 'living-alone', kind: 'cause',
    sentence: '[[Small studio flats for rent]] let {{young professionals}} afford a place of their own soon after starting work, so ((more young adults choose to live alone)).' },
  { id: 'i-working-from-home', promptId: 'working-from-home', kind: 'impact', tone: 'benefit',
    sentence: '[[Working from home]] saves {{parents of young children}} the hours they used to lose in traffic, so ((parents have more time with their children)).' },
  { id: 'i-online-courses', promptId: 'online-university-courses', kind: 'impact', tone: 'benefit',
    sentence: '[[Online university courses]] let {{working adults in small towns}} study without leaving their jobs, so ((more working adults earn a degree)).' },
  { id: 'i-smoking-ban', promptId: 'smoking-ban-public', kind: 'impact', tone: 'benefit',
    sentence: '[[A ban on smoking in public places]] stops {{restaurant and bar staff}} breathing other people\u2019s smoke for a whole shift, so ((staff suffer fewer breathing problems)).' },
  { id: 'i-paternity-leave', promptId: 'paternity-leave', kind: 'impact', tone: 'benefit',
    sentence: '[[Paid paternity leave]] allows {{new fathers}} to share night feeds, so ((mothers recover faster after giving birth)).' },
  { id: 'i-community-service', promptId: 'compulsory-community-service', kind: 'impact', tone: 'benefit',
    sentence: '[[Compulsory community service]] puts {{high school students}} in contact with adults at work, which helps them ((choose a career more wisely)).' },
  { id: 'i-cheaper-travel', promptId: 'cheaper-international-travel', kind: 'impact', tone: 'cost',
    sentence: '[[Cheap international flights]] bring so many visitors that rents rise until {{residents of historic city centres}} ((are priced out of their own neighbourhoods)).' },
  { id: 'i-long-hours', promptId: 'long-working-hours', kind: 'impact', tone: 'cost',
    sentence: '[[Long hours at the workplace]] leave {{office employees}} too tired to exercise, so ((their health gets worse over time)).' },
  { id: 'i-children-tv', promptId: 'children-watching-tv', kind: 'impact', tone: 'cost',
    sentence: '[[Watching television every day]] takes time away from reading, so {{primary school children}} ((fall behind in vocabulary)).' },
  { id: 'i-credit-cards', promptId: 'credit-cards', kind: 'impact', tone: 'cost',
    sentence: '[[Easy access to credit cards]] tempts {{university students}} to spend money they do not have, leaving them ((in debt before they start work)).' },
  { id: 'i-ai-workers', promptId: 'ai-replacing-workers', kind: 'impact', tone: 'cost',
    sentence: '[[Artificial intelligence taking over routine office tasks]] leaves {{middle-aged clerical workers}} ((without a job for a long time)).' },
  { id: 's-obesity', promptId: 'obesity-problems', kind: 'solution',
    sentence: '[[Taxing sugary drinks]] would make {{teenagers}} choose water or milk more often, which would ((slow the rise in obesity)).' },
  { id: 's-car-ban', promptId: 'car-ban-solutions', kind: 'solution',
    sentence: '[[Free park-and-ride buses]] would let {{suburban commuters}} ((reach the city centre quickly after private cars are banned)).' },
  { id: 's-global-environment', promptId: 'global-environment-solutions', kind: 'solution',
    sentence: '[[A shared international climate fund]] would let {{poorer countries}} ((switch to clean energy without slowing their growth)).' },
  { id: 's-growing-cities', promptId: 'growing-cities-young-people', kind: 'solution',
    sentence: '[[Rent-controlled flats near business districts]] would allow {{young graduates}} to ((live in the city without spending half their salary on rent)).' },
  { id: 's-imported-food', promptId: 'imported-food', kind: 'solution',
    sentence: '[[Weekly farmers\u2019 markets in city centres]] would give {{local farmers}} direct access to urban shoppers, so ((more local produce gets sold)).' },
  { id: 's-young-and-old', promptId: 'young-and-old-apart', kind: 'solution',
    sentence: '[[School volunteer programmes in care homes]] would bring {{teenagers}} into regular contact with residents, so ((young and old people spend more time together)).' },
  { id: 's-older-workers', promptId: 'older-workers-compete', kind: 'solution',
    sentence: '[[Government-funded retraining courses]] would help {{workers over fifty}} learn digital skills, so they ((can compete with younger applicants)).' },
  { id: 's-why-imported', promptId: 'why-imported-food', kind: 'solution',
    sentence: '[[Clear "grown nearby" labels on supermarket shelves]] would show {{shoppers}} which products are fresher, so ((people buy more local food)).' },
  { id: 's-money-management', promptId: 'money-management-skills', kind: 'solution',
    sentence: '[[A compulsory personal finance course in the final year of school]] would teach {{school leavers}} to budget, so they ((leave school knowing how to manage money)).' },
  { id: 's-household-rubbish', promptId: 'household-rubbish', kind: 'solution',
    sentence: '[[Charging households by the weight of their rubbish]] would push {{families}} to recycle and buy less packaging, so ((household rubbish falls)).' },
];

export type Mark = 'start' | 'end' | 'who';

/** The sentence split into plain text and its marked parts, for highlighting. */
export function sentenceParts(s: string): { text: string; mark: Mark | null }[] {
  const out: { text: string; mark: Mark | null }[] = [];
  const re = /\[\[(.+?)\]\]|\(\((.+?)\)\)|\{\{(.+?)\}\}/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), mark: null });
    out.push(m[1] ? { text: m[1], mark: 'start' } : m[2] ? { text: m[2], mark: 'end' } : { text: m[3], mark: 'who' });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last), mark: null });
  return out;
}

const part = (s: string, mark: Mark) => sentenceParts(s).find((x) => x.mark === mark)?.text || '';
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

export const STATEMENTS: Statement[] = RAW.map((r) => ({ ...r, start: cap(part(r.sentence, 'start')), end: cap(part(r.sentence, 'end')), stakeholder: part(r.sentence, 'who') }));

export const plainSentence = (s: string) => sentenceParts(s).map((p) => p.text).join('');
export const findStatement = (id: string) => STATEMENTS.find((s) => s.id === id) || null;
