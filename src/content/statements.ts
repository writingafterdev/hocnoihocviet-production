/**
 * "Phát triển ý": ready-made statements to prove, one per prompt in the library.
 *
 * Each statement is an English topic sentence whose two ends are words of the sentence itself: [[…]] marks
 * the starting point and ((…)) the ending point; the people involved are named in the two ends, and the
 * sentence says nothing about the steps between, which the student writes. WHO names the group for the AI coach.
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
  /** The question shown in the empty first step: one everyday question about this chain's real people and things (never the answer). */
  ask: string;
}

export const KIND_LABEL: Record<StatementKind, string> = { cause: 'Nguyên nhân', impact: 'Tác động', solution: 'Giải pháp' };

type Raw = Omit<Statement, 'start' | 'end' | 'stakeholder' | 'ask'>;

const RAW: Raw[] = [
  { id: 'c-city-traffic', promptId: 'city-traffic', kind: 'cause',
    sentence: '[[Cheap car loans for commuters]] lead to ((more traffic jams)).' },
  { id: 'c-declining-bicycle', promptId: 'declining-bicycle-use', kind: 'cause',
    sentence: '[[Cities spreading outwards]] leads to ((fewer workers cycling to work)).' },
  { id: 'c-anti-social', promptId: 'anti-social-behaviour', kind: 'cause',
    sentence: '[[Parents working long hours]] leads to ((teenagers behaving anti-socially)).' },
  { id: 'c-weight-fitness', promptId: 'weight-and-fitness', kind: 'cause',
    sentence: '[[Food delivery apps]] lead to ((young adults becoming less fit)).' },
  { id: 'c-throwaway', promptId: 'throwaway-culture', kind: 'cause',
    sentence: '[[Cheap electronics]] lead to ((households throwing things away instead of repairing them)).' },
  { id: 'c-science-students', promptId: 'declining-science-students', kind: 'cause',
    sentence: '[[Low starting salaries in science]] lead to ((fewer school leavers choosing science)).' },
  { id: 'c-elderly-care', promptId: 'elderly-care-decline', kind: 'cause',
    sentence: '[[Jobs concentrated in big cities]] lead to ((adult children caring less for elderly parents)).' },
  { id: 'c-food-waste', promptId: 'food-waste', kind: 'cause',
    sentence: '[[Multi-buy offers]] lead to ((families wasting more food)).' },
  { id: 'c-rural-to-city', promptId: 'rural-to-city', kind: 'cause',
    sentence: '[[City-only universities]] lead to ((rural teenagers moving to cities)).' },
  { id: 'c-living-alone', promptId: 'living-alone', kind: 'cause',
    sentence: '[[Small flats to rent]] lead to ((more young workers living alone)).' },
  { id: 'i-working-from-home', promptId: 'working-from-home', kind: 'impact', tone: 'benefit',
    sentence: '[[Working from home]] leads to ((parents spending more time with their children)).' },
  { id: 'i-online-courses', promptId: 'online-university-courses', kind: 'impact', tone: 'benefit',
    sentence: '[[Online courses]] lead to ((more working adults earning degrees)).' },
  { id: 'i-smoking-ban', promptId: 'smoking-ban-public', kind: 'impact', tone: 'benefit',
    sentence: '[[A smoking ban]] leads to ((bar staff having fewer breathing problems)).' },
  { id: 'i-paternity-leave', promptId: 'paternity-leave', kind: 'impact', tone: 'benefit',
    sentence: '[[Paid paternity leave for fathers]] leads to ((mothers recovering faster)).' },
  { id: 'i-community-service', promptId: 'compulsory-community-service', kind: 'impact', tone: 'benefit',
    sentence: '[[Community service]] leads to ((students choosing careers more wisely)).' },
  { id: 'i-cheaper-travel', promptId: 'cheaper-international-travel', kind: 'impact', tone: 'cost',
    sentence: '[[Cheap flights]] lead to ((locals being priced out of their neighbourhoods)).' },
  { id: 'i-long-hours', promptId: 'long-working-hours', kind: 'impact', tone: 'cost',
    sentence: '[[Long working hours]] lead to ((office employees\' health getting worse)).' },
  { id: 'i-children-tv', promptId: 'children-watching-tv', kind: 'impact', tone: 'cost',
    sentence: '[[Daily TV]] leads to ((children falling behind in vocabulary)).' },
  { id: 'i-credit-cards', promptId: 'credit-cards', kind: 'impact', tone: 'cost',
    sentence: '[[Easy credit cards]] lead to ((students ending up in debt)).' },
  { id: 'i-ai-workers', promptId: 'ai-replacing-workers', kind: 'impact', tone: 'cost',
    sentence: '[[AI doing routine tasks]] leads to ((clerical workers losing their jobs)).' },
  { id: 's-obesity', promptId: 'obesity-problems', kind: 'solution',
    sentence: '[[A sugar tax]] would help ((slow obesity among teenagers)).' },
  { id: 's-car-ban', promptId: 'car-ban-solutions', kind: 'solution',
    sentence: '[[Free park-and-ride buses]] would help ((commuters reach the centre without cars)).' },
  { id: 's-global-environment', promptId: 'global-environment-solutions', kind: 'solution',
    sentence: '[[A shared climate fund]] would help ((poorer countries switch to clean energy)).' },
  { id: 's-growing-cities', promptId: 'growing-cities-young-people', kind: 'solution',
    sentence: '[[Rent-controlled flats]] would help ((young graduates afford city life)).' },
  { id: 's-imported-food', promptId: 'imported-food', kind: 'solution',
    sentence: '[[Farmers\u2019 markets]] would help ((local farmers sell more produce)).' },
  { id: 's-young-and-old', promptId: 'young-and-old-apart', kind: 'solution',
    sentence: '[[School visits to care homes]] would help ((teenagers and elderly people spend more time together)).' },
  { id: 's-older-workers', promptId: 'older-workers-compete', kind: 'solution',
    sentence: '[[Retraining courses]] would help ((older workers compete with younger applicants)).' },
  { id: 's-why-imported', promptId: 'why-imported-food', kind: 'solution',
    sentence: '[[\u201cGrown nearby\u201d labels]] would help ((shoppers choose more local food)).' },
  { id: 's-money-management', promptId: 'money-management-skills', kind: 'solution',
    sentence: '[[A finance course at school]] would help ((school leavers manage money well)).' },
  { id: 's-household-rubbish', promptId: 'household-rubbish', kind: 'solution',
    sentence: '[[Charging by weight]] would help ((families cut household rubbish)).' },
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


/** First-step questions, written by hand (no AI call): short and open, about what changes for the person in the chain; they make the student think without saying the answer. */
const ASK: Record<string, string> = {
  'c-city-traffic': 'Khoản vay rẻ thay đổi quyết định nào của người đi làm?',
  'c-declining-bicycle': 'Thành phố lan rộng ra xa thì người đi làm phải đối mặt với điều gì?',
  'c-anti-social': 'Khi bố mẹ vắng nhà nhiều, điều gì thay đổi với tuổi teen?',
  'c-weight-fitness': 'App giao đồ ăn thay đổi thói quen hằng ngày của người trẻ thế nào?',
  'c-throwaway': 'Khi mua mới rẻ ngang tiền sửa, một gia đình sẽ chọn gì, vì sao?',
  'c-science-students': 'Lương khởi điểm thấp ảnh hưởng thế nào tới việc chọn ngành của học sinh?',
  'c-elderly-care': 'Khi con cái lên thành phố làm việc, điều gì xảy ra với bố mẹ ở quê?',
  'c-food-waste': 'Khuyến mãi mua nhiều thay đổi cách một gia đình đi chợ thế nào?',
  'c-rural-to-city': 'Học sinh ở quê muốn học đại học thì phải đối mặt với điều gì?',
  'c-living-alone': 'Căn hộ nhỏ cho thuê thay đổi lựa chọn nơi ở của người trẻ thế nào?',
  'i-working-from-home': 'Làm việc tại nhà thay đổi một ngày của cha mẹ thế nào?',
  'i-online-courses': 'Học online gỡ được trở ngại nào cho người đang đi làm?',
  'i-smoking-ban': 'Trước khi có lệnh cấm, nhân viên quán bar phải chịu điều gì mỗi ca làm?',
  'i-paternity-leave': 'Khi bố được nghỉ phép, việc chăm con ban đêm thay đổi thế nào?',
  'i-community-service': 'Học sinh đi làm tình nguyện sẽ thấy gì mà trong lớp không thấy?',
  'i-cheaper-travel': 'Khi du khách đổ vào, cuộc sống của người dân trong khu phố đó thay đổi thế nào?',
  'i-long-hours': 'Sau một ngày làm việc dài, người đi làm còn sức cho điều gì?',
  'i-children-tv': 'Thời gian trẻ xem ti vi vốn dành cho việc gì?',
  'i-credit-cards': 'Có thẻ tín dụng trong tay, sinh viên quyết định chi tiêu thế nào?',
  'i-ai-workers': 'Phần việc nào của nhân viên hành chính máy có thể làm thay?',
  's-obesity': 'Khi nước ngọt đắt hơn, thanh thiếu niên sẽ làm gì?',
  's-car-ban': 'Khi xe riêng bị cấm, người ở ngoại ô cần gì để vào trung tâm?',
  's-global-environment': 'Nước nghèo muốn dùng năng lượng sạch thì đang thiếu điều gì?',
  's-growing-cities': 'Người mới đi làm ở thành phố lớn gặp khó khăn gì về nhà ở?',
  's-imported-food': 'Hiện nay nông dân địa phương bán nông sản qua những cách nào?',
  's-young-and-old': 'Hiện nay thanh thiếu niên và người già gặp nhau ở đâu?',
  's-older-workers': 'Người lớn tuổi đang thiếu điều gì khi cạnh tranh việc làm?',
  's-why-imported': 'Khi chọn rau củ, người mua dựa vào điều gì để quyết định?',
  's-money-management': 'Học sinh ra trường còn thiếu hiểu biết gì về tiền?',
  's-household-rubbish': 'Khi mỗi túi rác đều tốn tiền, một gia đình sẽ làm gì?',
};

/** Who the chain is about. It is not in the sentence; it lives in the first-step question and goes to the AI coach as context. */
const WHO: Record<string, string> = {
  'c-city-traffic': 'commuters',
  'c-declining-bicycle': 'workers',
  'c-anti-social': 'teenagers',
  'c-weight-fitness': 'young adults',
  'c-throwaway': 'households',
  'c-science-students': 'school leavers',
  'c-elderly-care': 'adult children',
  'c-food-waste': 'families',
  'c-rural-to-city': 'rural teenagers',
  'c-living-alone': 'young workers',
  'i-working-from-home': 'parents',
  'i-online-courses': 'working adults',
  'i-smoking-ban': 'bar staff',
  'i-paternity-leave': 'fathers',
  'i-community-service': 'students',
  'i-cheaper-travel': 'locals',
  'i-long-hours': 'employees',
  'i-children-tv': 'children',
  'i-credit-cards': 'students',
  'i-ai-workers': 'clerical workers',
  's-obesity': 'teenagers',
  's-car-ban': 'commuters',
  's-global-environment': 'poorer countries',
  's-growing-cities': 'young graduates',
  's-imported-food': 'local farmers',
  's-young-and-old': 'teenagers',
  's-older-workers': 'older workers',
  's-why-imported': 'shoppers',
  's-money-management': 'school leavers',
  's-household-rubbish': 'families',
};

export const STATEMENTS: Statement[] = RAW.map((r) => ({ ...r, start: cap(part(r.sentence, 'start')), end: cap(part(r.sentence, 'end')), stakeholder: part(r.sentence, 'who') || WHO[r.id] || '', ask: ASK[r.id] || '' }));

export const plainSentence = (s: string) => sentenceParts(s).map((p) => p.text).join('');
export const findStatement = (id: string) => STATEMENTS.find((s) => s.id === id) || null;
