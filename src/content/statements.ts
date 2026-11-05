/**
 * "Chứng minh nhanh": ready-made statements to prove, one per prompt in the library.
 *
 * Each statement is a topic sentence with its two ends given: `start` (where the chain begins) and `end`
 * (what it has to reach). The student writes the middle. In `sentence`, [[…]] marks the start and {{…}}
 * the stakeholder, so the screen can highlight them.
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
  start: string;
  end: string;
  stakeholder: string;
}

export const KIND_LABEL: Record<StatementKind, string> = { cause: 'Nguyên nhân', impact: 'Tác động', solution: 'Giải pháp' };

export const STATEMENTS: Statement[] = [
  // ---------------- Nguyên nhân ----------------
  { id: 'c-city-traffic', promptId: 'city-traffic', kind: 'cause',
    sentence: '[[Cheap motorbike and car loans]] have put far more private vehicles on the road, as {{middle-income commuters}} no longer need to save for years to own one.',
    start: 'Vay mua xe máy, ô tô trả góp rất dễ', end: 'Đường phố thành phố tắc nghẽn nghiêm trọng', stakeholder: 'Người đi làm thu nhập trung bình' },
  { id: 'c-declining-bicycle', promptId: 'declining-bicycle-use', kind: 'cause',
    sentence: '[[Cities spreading outwards]] mean that {{office workers}} now live too far from their jobs to cycle every day.',
    start: 'Thành phố mở rộng ra ngoại ô', end: 'Ít người dùng xe đạp làm phương tiện chính', stakeholder: 'Nhân viên văn phòng' },
  { id: 'c-anti-social', promptId: 'anti-social-behaviour', kind: 'cause',
    sentence: '[[Long working hours for both parents]] leave {{teenagers}} with little adult guidance about how to treat other people.',
    start: 'Cả bố và mẹ đều làm việc nhiều giờ', end: 'Hành vi thiếu tôn trọng nơi công cộng tăng lên', stakeholder: 'Thanh thiếu niên' },
  { id: 'c-weight-fitness', promptId: 'weight-and-fitness', kind: 'cause',
    sentence: '[[Food delivery apps]] have made high-calorie meals available at any hour, so {{busy young adults}} rarely cook or walk to buy food.',
    start: 'Ứng dụng giao đồ ăn phổ biến', end: 'Cân nặng trung bình tăng, thể lực giảm', stakeholder: 'Người trẻ bận rộn' },
  { id: 'c-throwaway', promptId: 'throwaway-culture', kind: 'cause',
    sentence: '[[Mass-produced electronics are now so cheap]] that {{ordinary households}} find a new device costs little more than a repair.',
    start: 'Đồ điện tử sản xuất hàng loạt rất rẻ', end: 'Đồ hỏng bị vứt đi thay vì sửa', stakeholder: 'Các hộ gia đình bình thường' },
  { id: 'c-science-students', promptId: 'declining-science-students', kind: 'cause',
    sentence: '[[Science degrees take longer and lead to lower starting salaries]], so {{school leavers}} choose business or IT instead.',
    start: 'Ngành khoa học học lâu, lương khởi điểm thấp', end: 'Ít sinh viên chọn học khoa học ở đại học', stakeholder: 'Học sinh vừa tốt nghiệp phổ thông' },
  { id: 'c-elderly-care', promptId: 'elderly-care-decline', kind: 'cause',
    sentence: '[[Jobs being concentrated in big cities]] force {{adult children}} to live hundreds of kilometres from their ageing parents.',
    start: 'Việc làm dồn về các thành phố lớn', end: 'Gia đình dành ít thời gian chăm sóc người già', stakeholder: 'Con cái đã trưởng thành' },
  { id: 'c-food-waste', promptId: 'food-waste', kind: 'cause',
    sentence: '[[Supermarket multi-buy offers]] persuade {{families}} to buy more fresh food than they can eat before it goes off.',
    start: 'Siêu thị khuyến mãi mua nhiều giảm giá', end: 'Hàng triệu tấn thực phẩm bị bỏ đi mỗi ngày', stakeholder: 'Các gia đình' },
  { id: 'c-rural-to-city', promptId: 'rural-to-city', kind: 'cause',
    sentence: '[[Universities and training centres being located only in cities]] means {{rural teenagers}} must move to study, and most never return.',
    start: 'Trường đại học, trung tâm đào tạo chỉ có ở thành phố', end: 'Người trẻ rời nông thôn lên thành phố', stakeholder: 'Thanh niên nông thôn' },
  { id: 'c-living-alone', promptId: 'living-alone', kind: 'cause',
    sentence: '[[The spread of small studio flats for rent]] allows {{young professionals}} to afford a place of their own soon after starting work.',
    start: 'Căn hộ studio nhỏ cho thuê ngày càng nhiều', end: 'Người trẻ chọn sống một mình', stakeholder: 'Người trẻ mới đi làm' },

  // ---------------- Tác động ----------------
  { id: 'i-working-from-home', promptId: 'working-from-home', kind: 'impact', tone: 'benefit',
    sentence: '[[Working from home]] gives {{parents of young children}} back the hours they used to lose in traffic.',
    start: 'Làm việc tại nhà', end: 'Bố mẹ có thêm thời gian ở bên con', stakeholder: 'Bố mẹ có con nhỏ' },
  { id: 'i-online-courses', promptId: 'online-university-courses', kind: 'impact', tone: 'benefit',
    sentence: '[[Online university courses]] let {{working adults in small towns}} earn a degree without leaving their jobs.',
    start: 'Đại học dạy trực tuyến', end: 'Người đi làm ở tỉnh nhỏ lấy được bằng đại học', stakeholder: 'Người đi làm ở tỉnh nhỏ' },
  { id: 'i-smoking-ban', promptId: 'smoking-ban-public', kind: 'impact', tone: 'benefit',
    sentence: '[[A ban on smoking in public places]] protects {{restaurant and bar staff}} from breathing other people’s smoke for a whole shift.',
    start: 'Cấm hút thuốc nơi công cộng', end: 'Nhân viên nhà hàng ít bệnh hô hấp hơn', stakeholder: 'Nhân viên nhà hàng, quán bar' },
  { id: 'i-paternity-leave', promptId: 'paternity-leave', kind: 'impact', tone: 'benefit',
    sentence: '[[Paid paternity leave]] allows {{new fathers}} to share night feeds, so mothers recover faster after giving birth.',
    start: 'Bố được nghỉ phép khi vợ sinh con', end: 'Người mẹ hồi phục nhanh hơn sau sinh', stakeholder: 'Người bố mới có con' },
  { id: 'i-community-service', promptId: 'compulsory-community-service', kind: 'impact', tone: 'benefit',
    sentence: '[[Compulsory community service]] puts {{high school students}} in contact with adults at work, which helps them choose a career.',
    start: 'Bắt buộc học sinh làm công việc cộng đồng', end: 'Học sinh chọn nghề sáng suốt hơn', stakeholder: 'Học sinh cấp ba' },
  { id: 'i-cheaper-travel', promptId: 'cheaper-international-travel', kind: 'impact', tone: 'cost',
    sentence: '[[Cheap international flights]] bring so many visitors that {{residents of historic city centres}} are priced out of their own neighbourhoods.',
    start: 'Vé máy bay quốc tế rẻ', end: 'Cư dân phố cổ phải dọn đi nơi khác', stakeholder: 'Cư dân khu phố cổ' },
  { id: 'i-long-hours', promptId: 'long-working-hours', kind: 'impact', tone: 'cost',
    sentence: '[[Long hours at the workplace]] leave {{office employees}} too tired to exercise, which damages their health over time.',
    start: 'Làm việc nhiều giờ ở nơi làm việc', end: 'Sức khoẻ nhân viên văn phòng giảm sút', stakeholder: 'Nhân viên văn phòng' },
  { id: 'i-children-tv', promptId: 'children-watching-tv', kind: 'impact', tone: 'cost',
    sentence: '[[Watching television every day]] takes time away from reading, so {{primary school children}} fall behind in vocabulary.',
    start: 'Trẻ xem tivi hằng ngày', end: 'Vốn từ của trẻ kém hơn bạn cùng lứa', stakeholder: 'Học sinh tiểu học' },
  { id: 'i-credit-cards', promptId: 'credit-cards', kind: 'impact', tone: 'cost',
    sentence: '[[Easy access to credit cards]] tempts {{university students}} to spend money they do not have, leaving them in debt before they start work.',
    start: 'Thẻ tín dụng rất dễ mở', end: 'Sinh viên mắc nợ trước khi đi làm', stakeholder: 'Sinh viên đại học' },
  { id: 'i-ai-workers', promptId: 'ai-replacing-workers', kind: 'impact', tone: 'cost',
    sentence: '[[Artificial intelligence taking over routine office tasks]] leaves {{middle-aged clerical workers}} without jobs they can easily retrain for.',
    start: 'Trí tuệ nhân tạo làm thay việc văn phòng lặp lại', end: 'Nhân viên văn phòng trung niên mất việc lâu dài', stakeholder: 'Nhân viên hành chính trung niên' },

  // ---------------- Giải pháp ----------------
  { id: 's-obesity', promptId: 'obesity-problems', kind: 'solution',
    sentence: '[[Taxing sugary drinks]] would make {{teenagers}} choose water or milk more often, slowing the rise in obesity.',
    start: 'Đánh thuế đồ uống có đường', end: 'Tỉ lệ béo phì tăng chậm lại', stakeholder: 'Thanh thiếu niên' },
  { id: 's-car-ban', promptId: 'car-ban-solutions', kind: 'solution',
    sentence: '[[Free park-and-ride bus services]] would let {{suburban commuters}} still reach the centre quickly after private cars are banned.',
    start: 'Bãi gửi xe kèm xe buýt miễn phí vào trung tâm', end: 'Người ở ngoại ô vẫn vào trung tâm nhanh khi cấm ô tô', stakeholder: 'Người đi làm từ ngoại ô' },
  { id: 's-global-environment', promptId: 'global-environment-solutions', kind: 'solution',
    sentence: '[[A shared international climate fund]] would let {{poorer countries}} afford clean energy without slowing their growth.',
    start: 'Quỹ khí hậu quốc tế chung', end: 'Nước nghèo chuyển sang năng lượng sạch', stakeholder: 'Các nước nghèo' },
  { id: 's-growing-cities', promptId: 'growing-cities-young-people', kind: 'solution',
    sentence: '[[Building rent-controlled flats near business districts]] would allow {{young graduates}} to live in the city without spending half their salary on rent.',
    start: 'Xây căn hộ giá thuê có kiểm soát gần khu văn phòng', end: 'Người trẻ ở thành phố không phải tốn nửa lương tiền nhà', stakeholder: 'Sinh viên mới ra trường' },
  { id: 's-imported-food', promptId: 'imported-food', kind: 'solution',
    sentence: '[[Weekly farmers’ markets in city centres]] would give {{local farmers}} a direct way to sell to urban shoppers.',
    start: 'Chợ nông sản hằng tuần ở trung tâm thành phố', end: 'Nông sản địa phương bán được nhiều hơn', stakeholder: 'Nông dân địa phương' },
  { id: 's-young-and-old', promptId: 'young-and-old-apart', kind: 'solution',
    sentence: '[[School volunteer programmes in care homes]] would bring {{teenagers}} and older people together every week.',
    start: 'Trường tổ chức tình nguyện ở viện dưỡng lão', end: 'Người trẻ và người già gặp nhau thường xuyên hơn', stakeholder: 'Thanh thiếu niên' },
  { id: 's-older-workers', promptId: 'older-workers-compete', kind: 'solution',
    sentence: '[[Government-funded retraining courses]] would help {{workers over fifty}} learn the digital skills employers now ask for.',
    start: 'Khoá đào tạo lại do nhà nước tài trợ', end: 'Người lớn tuổi cạnh tranh được với người trẻ', stakeholder: 'Người lao động trên năm mươi tuổi' },
  { id: 's-why-imported', promptId: 'why-imported-food', kind: 'solution',
    sentence: '[[Clear "grown nearby" labels on supermarket shelves]] would help {{shoppers}} see which products are fresher and support local jobs.',
    start: 'Nhãn "trồng gần đây" rõ ràng trên kệ siêu thị', end: 'Người dân mua thực phẩm địa phương nhiều hơn', stakeholder: 'Người đi chợ, siêu thị' },
  { id: 's-money-management', promptId: 'money-management-skills', kind: 'solution',
    sentence: '[[A compulsory personal finance course in the final year of school]] would teach {{school leavers}} to budget before they receive their first salary.',
    start: 'Môn tài chính cá nhân bắt buộc ở năm cuối phổ thông', end: 'Học sinh ra trường biết quản lý tiền', stakeholder: 'Học sinh sắp ra trường' },
  { id: 's-household-rubbish', promptId: 'household-rubbish', kind: 'solution',
    sentence: '[[Charging households by the weight of rubbish they throw away]] would push {{families}} to recycle and buy less packaging.',
    start: 'Tính phí rác theo cân nặng', end: 'Lượng rác sinh hoạt giảm', stakeholder: 'Các gia đình' },
];

/** The sentence split into plain, start and stakeholder parts, for highlighting. */
export function sentenceParts(s: string): { text: string; mark: 'start' | 'who' | null }[] {
  const out: { text: string; mark: 'start' | 'who' | null }[] = [];
  const re = /\[\[(.+?)\]\]|\{\{(.+?)\}\}/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), mark: null });
    out.push(m[1] ? { text: m[1], mark: 'start' } : { text: m[2], mark: 'who' });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last), mark: null });
  return out;
}

export const plainSentence = (s: string) => sentenceParts(s).map((p) => p.text).join('');
export const findStatement = (id: string) => STATEMENTS.find((s) => s.id === id) || null;
