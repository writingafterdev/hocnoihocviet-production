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
  /** The question shown in the empty first step: one everyday question about this chain's real people and things (never the answer). */
  ask: string;
}

export const KIND_LABEL: Record<StatementKind, string> = { cause: 'Nguyên nhân', impact: 'Tác động', solution: 'Giải pháp' };

type Raw = Omit<Statement, 'start' | 'end' | 'stakeholder' | 'ask'>;

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


/** First-step questions, written by hand (no AI call): about the real person and thing, answerable from everyday life, never the answer itself. */
const ASK: Record<string, string> = {
  'c-city-traffic': 'Một anh nhân viên văn phòng thu nhập trung bình thấy khoản vay mua xe chỉ còn vài trăm nghìn mỗi tháng: cách đi làm của anh ấy thay đổi thế nào?',
  'c-declining-bicycle': 'Mỗi sáng, một nhân viên văn phòng sống ở rìa thành phố cần đi làm quãng đường dài bao nhiêu và mất mấy tiếng?',
  'c-anti-social': 'Chiều tối, khi cả bố và mẹ còn ở công ty, một bạn tuổi teen ở nhà làm gì và gặp ai?',
  'c-weight-fitness': 'Từ lúc tan làm đến lúc đi ngủ, một bạn trẻ hay đặt đồ ăn qua app đi lại và vận động vào những lúc nào?',
  'c-throwaway': 'Khi chiếc tai nghe hỏng mà mua mới gần bằng tiền sửa, một gia đình bình thường sẽ nghĩ gì?',
  'c-science-students': 'Một bạn sắp tốt nghiệp cấp ba đặt bảng lương khởi điểm của các ngành cạnh nhau thì bạn ấy nghĩ gì về ngành khoa học?',
  'c-elderly-care': 'Một người con vừa nhận việc ở thành phố lớn, cách nhà bố mẹ cả trăm cây số: cuối tuần của anh ấy sẽ ra sao?',
  'c-food-waste': 'Một gia đình đứng trước kệ rau mua hai tặng một ở siêu thị thì họ nghĩ gì khi bỏ thêm vào giỏ?',
  'c-rural-to-city': 'Một bạn lớp 12 ở quê trúng tuyển đại học nằm hoàn toàn ở thành phố thì nhà bạn ấy phải chuẩn bị gì?',
  'c-living-alone': 'Một bạn mới đi làm được vài tháng xem giá thuê căn studio nhỏ thì so với lương, bạn ấy thấy điều gì?',
  'i-working-from-home': 'Một người mẹ có con nhỏ, mỗi sáng ở nhà thay vì đi làm: quãng thời gian từng mất trên đường được chị ấy dùng vào việc gì?',
  'i-online-courses': 'Một nhân viên làm việc ở thị trấn nhỏ, cách trường đại học hàng giờ xe: học online thì buổi tối của anh ấy thay đổi thế nào?',
  'i-smoking-ban': 'Trước khi có lệnh cấm, một nhân viên quán bar hít thở không khí như thế nào suốt một ca làm?',
  'i-paternity-leave': 'Ba giờ sáng, em bé khóc đòi bú: nếu bố đang nghỉ phép có lương thì đêm đó của hai vợ chồng diễn ra thế nào?',
  'i-community-service': 'Một học sinh cấp ba đi làm tình nguyện ở bệnh viện sẽ gặp những người lớn nào, và họ làm gì ngay trước mắt em?',
  'i-cheaper-travel': 'Khi du khách vào khu phố cổ nhiều gấp đôi, một chủ nhà trong khu đó sẽ làm gì với căn nhà của mình?',
  'i-long-hours': 'Một nhân viên văn phòng về tới nhà lúc 8 giờ tối sau ngày làm dài: anh ấy còn sức làm gì trong buổi tối đó?',
  'i-children-tv': 'Một bé tiểu học xem ti vi hai tiếng mỗi chiều: hai tiếng đó vốn dành cho việc gì?',
  'i-credit-cards': 'Một sinh viên vừa được tặng thẻ tín dụng ở cổng trường thì lần mua món đồ đắt tiền đầu tiên diễn ra thế nào?',
  'i-ai-workers': 'Một nhân viên hành chính ngoài 50 tuổi nhập liệu và làm báo cáo mỗi ngày: phần việc nào của chị ấy phần mềm có thể làm thay?',
  's-obesity': 'Một bạn tuổi teen quen mua nước ngọt mỗi ngày ở cổng trường: nếu giá tăng gấp đôi thì bạn ấy làm gì?',
  's-car-ban': 'Sáng thứ Hai, khi xe riêng bị cấm vào trung tâm, một người sống ở ngoại ô cần gì để tới chỗ làm?',
  's-global-environment': 'Chính phủ một nước nghèo muốn xây điện mặt trời thì họ vấp phải khó khăn nào về tiền?',
  's-growing-cities': 'Một bạn mới tốt nghiệp nhận việc ở quận trung tâm: mỗi tháng tiền thuê nhà ăn mất bao nhiêu phần lương của bạn ấy?',
  's-imported-food': 'Một người nông dân trồng rau ở ngoại thành hiện bán rau cho ai, và người đó trả giá thế nào?',
  's-young-and-old': 'Một buổi chiều ở viện dưỡng lão, một cụ ngoài tám mươi tuổi thường làm gì?',
  's-older-workers': 'Một người 52 tuổi nộp đơn vào công ty: nhà tuyển dụng nhìn vào kỹ năng nào của chị ấy rồi do dự?',
  's-why-imported': 'Đứng trước kệ rau củ, một người mua hàng muốn biết rau nào tươi hơn thì họ nhìn vào đâu?',
  's-money-management': 'Một bạn vừa ra trường nhận lương tháng đầu tiên: bạn ấy chi tiền vào những việc gì trong tuần đầu?',
  's-household-rubbish': 'Mỗi tuần, túi rác của một gia đình chứa những gì nhiều nhất?',
};

export const STATEMENTS: Statement[] = RAW.map((r) => ({ ...r, start: cap(part(r.sentence, 'start')), end: cap(part(r.sentence, 'end')), stakeholder: part(r.sentence, 'who'), ask: ASK[r.id] || '' }));

export const plainSentence = (s: string) => sentenceParts(s).map((p) => p.text).join('');
export const findStatement = (id: string) => STATEMENTS.find((s) => s.id === id) || null;
