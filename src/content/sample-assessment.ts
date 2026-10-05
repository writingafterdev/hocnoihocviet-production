/**
 * A worked sample, so students (and we) can see a full assessment without spending an AI call.
 * Prompt, outline and stance: Phase 2, Ví dụ 4 (international travel).
 * Essay: the band-7 essay analysed in Module 2, Bài 1. The comments follow the book's own analysis of it.
 */
import type { Chain } from '@/features/chainlab/types';
import { bandOf, CRITERIA, draftsKey, wordCount, type EssayReview } from '@/features/desk/scoring';

export const SAMPLE_PROMPT_ID = 'cheaper-international-travel';

export const SAMPLE_STANCE = 'Tích cực, dù cái giá môi trường là thật: tác hại có cách khác để khắc phục, còn cơ hội đi lại của những người mới đi được thì mất là mất hẳn.';

export const SAMPLE_CHAINS: Chain[] = [
  {
    id: 'sample1a', q: 1, title: 'Người trước đây không đủ tiền đi', tone: 'benefit', pos: 50, area: 'Năng lực và tương lai', side: 'right', split: null, fixes: null,
    steps: ['Vé máy bay và chi phí đi lại rẻ hơn', 'Người thu nhập thấp, trước đây không đủ tiền, giờ đi được', 'Họ được trải nghiệm văn hoá và nơi chốn khác tận mắt', 'Cơ hội trước đây chỉ người giàu mới có giờ mở ra cho nhiều người'],
    findings: [{ id: 'sf1', kind: 'With/Without', text: 'Người thu nhập cao vốn đã đi được, nên lợi ích thật nằm ở nhóm mới đi được.', side: 'right', target: 'all' }],
  },
  {
    id: 'sample3', q: 1, title: 'Thu nhập cho nơi du lịch', tone: 'benefit', pos: 50, area: 'Vật chất', side: 'right', split: null, fixes: null,
    steps: ['Nhiều khách quốc tế hơn', 'Khách chi tiền cho chỗ ở, ăn uống, đi lại, hoạt động', 'Doanh nghiệp địa phương có thêm thu nhập', 'Người dân địa phương có thêm việc làm'],
    findings: [{ id: 'sf2', kind: 'Scope', text: 'Rõ nhất ở những nơi sống nhờ du lịch.', side: 'right', target: 'all' }],
  },
  {
    id: 'sample5', q: 1, title: 'Khí thải từ máy bay', tone: 'cost', pos: 50, area: 'An toàn', side: 'left', split: null, fixes: null,
    steps: ['Du lịch rẻ hơn, nhiều người đi hơn', 'Nhiều chuyến bay đường dài hơn', 'Máy bay đốt nhiều nhiên liệu và thải khí', 'Khí thải hại môi trường ở mọi nơi'],
    findings: [
      { id: 'sf3', kind: 'Dài hạn', text: 'Khí thải cộng dồn qua từng năm.', side: 'left', target: 'all' },
      { id: 'sf4', kind: 'With/Without', text: 'Tác hại đến từ số chuyến bay và nhiên liệu, không phải từ việc vé rẻ, nên có cách khác để khắc phục.', side: 'right', target: 'all' },
    ],
  },
  {
    id: 'sample4', q: 1, title: 'Quá tải ở điểm du lịch', tone: 'cost', pos: 50, area: 'Gắn kết và bản sắc', fixes: null,
    steps: ['Nhiều khách hơn ở các điểm nổi tiếng'],
    split: { at: 0, noun: 'điểm đến', branches: [
      { label: 'Nơi hạ tầng tốt', steps: ['Quá tải gần như không đáng kể'], side: 'right' },
      { label: 'Nơi hạ tầng yếu', steps: ['Cuộc sống người dân khó khăn hơn'], side: 'left' },
    ] },
    findings: [],
  },
];

export const SAMPLE_DRAFTS: Record<string, string> = {
  intro: 'Over the past few decades, international travel has become considerably cheaper and more accessible, largely due to the growth of budget airlines. In my opinion, this is a positive development overall, although it places a serious burden on the environment.',
  body1: 'One major drawback of this trend is environmental damage. Budget airlines have made flying the default option for many holidaymakers, which is harmful to the planet because each long-haul flight burns enormous amounts of fuel. Moreover, popular destinations are becoming increasingly crowded, which makes daily life more difficult for local residents. It also accumulates year after year. Nevertheless, this problem can be tackled through more fuel-efficient aircraft, carbon taxes and better rail links, without taking the opportunity to travel away from those who have only recently gained it.',
  body2: 'People on high incomes have always been able to go abroad whenever they wished. However, lower travel costs now allow those who previously could not afford it to experience other cultures first-hand, which is the most significant benefit of this trend. Furthermore, tourists also spend money on accommodation, food and entertainment. As a result, this creates jobs and the local economy develops.',
  conclusion: 'In conclusion, although cheaper travel brings more benefits than drawbacks, its environmental impact cannot be ignored.',
};

const LABEL: Record<string, string> = { intro: 'Mở bài', body1: 'Thân bài 1', body2: 'Thân bài 2', conclusion: 'Kết bài' };

type C = { label: string; sec: string; quote: string; text: string; fix?: string; chain?: string };

const COMMENTS: Record<string, C[]> = {
  tr: [
    { label: 'Thiếu With/Without', sec: 'body1', chain: 'sample5', quote: 'Nevertheless, this problem can be tackled through more fuel-efficient aircraft, carbon taxes and better rail links', text: 'Ô 3 đi thẳng tới các biện pháp, nhưng chưa nói vì sao du lịch rẻ không phải là nguyên nhân. Người đọc vẫn có thể nghĩ cách giảm khí thải nhanh nhất là làm vé đắt lại. **Dòng With/Without** trong dàn ý (tác hại đến từ số chuyến bay và nhiên liệu) đang bị thiếu, nên ô 2 chưa được trả lời hết.' },
    { label: 'Kết luận chưa có lý do', sec: 'conclusion', quote: 'cheaper travel brings more benefits than drawbacks', text: 'Câu kết đang đếm ý ("nhiều lợi hơn hại") thay vì nói lý do. Lý do nào trong bài làm bên lợi ích thắng? Đây là chỗ band 6 gọi là **kết luận chưa có lý do**.' },
    { label: 'Nói chung chung', sec: 'body2', chain: 'sample3', quote: 'the local economy develops', text: 'Cụm này bài nào về du lịch cũng viết được (over-generalise). Scope trong dàn ý đã tìm ra thu nhập này rõ nhất ở đâu; câu viết chưa giữ lại điều đó.' },
  ],
  cc: [
    { label: 'Sai thứ tự đoạn', sec: 'body1', chain: 'sample1a', quote: 'those who have only recently gained it', text: 'Câu rebuttal nhắc tới một nhóm người mà người đọc chỉ gặp ở đoạn sau. Thứ người đọc cần để hiểu câu này lại đến sau nó, nên **đoạn ô 1 phải đi trước** đoạn ô 2 + ô 3.' },
    { label: 'Câu lập trường dừng sai chỗ', sec: 'intro', quote: 'although it places a serious burden on the environment', text: 'Câu lập trường dừng ở tác hại, mà cái đứng cuối là cái người đọc mang theo. Đưa vế thừa nhận lên đầu câu để câu dừng ở lập trường. Câu kết cũng đang dừng ở tác hại.' },
    { label: 'Ý phụ chen giữa', sec: 'body1', chain: 'sample4', quote: 'Moreover, popular destinations are becoming increasingly crowded, which makes daily life more difficult for local residents.', text: 'Quá tải chỉ để so với khí thải nhưng đứng thành câu riêng, mở bằng Moreover, nên người đọc coi nó là tác hại thứ hai và chờ bài trả lời nó. Viết thành một vế phụ trong câu khí thải ("Unlike crowding, …").' },
    { label: 'Chữ trỏ mơ hồ', sec: 'body1', quote: 'It also accumulates', text: '"It" đứng ngay sau câu quá tải nên đọc lên như trỏ vào quá tải, trong khi chữ khí thải chưa xuất hiện lần nào. Đây là hậu quả của câu quá tải chen vào giữa.', fix: 'The resulting emissions also accumulate' },
    { label: 'Câu đầu đoạn là ý phụ', sec: 'body2', chain: 'sample1a', quote: 'People on high incomes have always been able to go abroad whenever they wished.', text: 'Câu With/Without đứng trước ý chính của nó, nên câu đầu đoạn không cho người đọc biết đoạn này là ô nào. Mở đoạn bằng ý chính, rồi đưa câu này xuống ngay sau.' },
    { label: 'Ý chính nằm trong vế phụ', sec: 'body2', quote: 'which is the most significant benefit of this trend', text: 'Điều cả đoạn muốn chứng minh lại nằm trong một vế "which", nên người đọc đọc nó như lời nói thêm. Đưa nó lên phần chính của câu đầu đoạn: "The most significant benefit of this trend is wider access to travel."' },
    { label: 'Mũi tên nhân quả đi ngược', sec: 'body1', quote: 'which is harmful to the planet because each long-haul flight burns enormous amounts of fuel', text: 'Câu đi tới tác hại rồi lùi về nguyên nhân bằng "because". Nguyên nhân trước, kết quả sau: nhiên liệu → khí thải → tác hại.' },
    { label: 'Đầu câu không nối', sec: 'body2', quote: 'Furthermore, tourists also', text: 'Câu trước nói về những người mới đi được, nên câu này nên mở bằng chính họ. "Furthermore … also" cũng nói "thêm một ý" hai lần.', fix: 'These new travellers also' },
    { label: 'Từ nối dư', sec: 'body2', quote: 'As a result, this creates', text: '"creates" đã là kết quả, nên "As a result" nói quan hệ đó lần thứ hai.', fix: 'This creates' },
  ],
  lr: [
    { label: 'Từ chung chung', sec: 'body1', quote: 'harmful to the planet', text: 'Khá chung so với phần còn lại của câu. Điều bài nói là khí thải, nên một cụm chính xác hơn sẽ đỡ cho lập luận.', fix: 'damaging to the climate' },
    { label: 'Cụm sáo', sec: 'conclusion', quote: 'cannot be ignored', text: 'Cụm sáo, hay gặp ở kết bài. Một động từ nói việc phải làm thì khớp với ô 3 hơn.', fix: 'must be addressed' },
  ],
  gra: [
    { label: 'Sai trật tự cụm động từ', sec: 'body1', quote: 'without taking the opportunity to travel away from those', text: 'Cụm động từ "take away" bị tách quá xa, câu đọc lên vướng. Đặt "away" ngay sau "taking".', fix: 'without taking away the opportunity to travel from those' },
  ],
};

const CRITERIA_TEXT: Record<string, { score: number; why: string; gap: string; next: string }> = {
  tr: {
    score: 6.5,
    why: 'Lập trường trả lời đúng câu hỏi (positive) và gần như mọi dòng của dàn ý đều có mặt. Nhưng dòng quan trọng nhất của ô 3, câu With/Without về khí thải, bị thiếu, câu kết chỉ đếm ý, và có cụm nói chung chung. Bài cũng mới khoảng 200 từ, dưới 250 nên bị trừ ở TR.',
    gap: 'Bài chưa lên **band 7** vì lập trường mới chỉ **developed**, chưa **well-developed**: ô 2 chưa được ô 3 trả lời hết, và câu kết chưa có lý do (**conclusions unjustified**). Bài không xuống **band 6** vì lập trường rõ, nhất quán, và các ý chính đều có mạch đủ bước.',
    next: 'Thêm câu With/Without ngay trước các biện pháp: tác hại đến từ số chuyến bay và nhiên liệu, không phải từ việc du lịch rẻ. Viết lại câu kết bằng đúng lý do đó, và giữ nhánh Scope cho mạch thu nhập. Viết đủ 250 từ.',
  },
  cc: {
    score: 7,
    why: 'Khung bài hợp lý và có tiến trình rõ, nhưng thứ tự ý trong đoạn mới "nhìn chung hợp lý": đoạn ô 1 đi sau đoạn rebuttal dùng tới nó, ý phụ quá tải chen vào giữa làm "It" và "this problem" trỏ sai, và ý chính của đoạn ô 1 nằm trong một vế phụ.',
    gap: 'Bài chưa lên **band 8** vì người đọc chưa theo được **with ease**: phải dừng lại ở "those who have only recently gained it", ở "It" và ở "this problem". Bài không xuống **band 6** vì mỗi đoạn vẫn có ý trung tâm và tiến trình chung rõ ràng.',
    next: 'Sửa từ to xuống nhỏ: đổi chỗ hai đoạn thân bài, mở mỗi đoạn bằng ý chính của nó, đưa quá tải thành một vế "Unlike…". Nhiều lỗi chữ trỏ và từ nối sẽ tự hết, phần còn lại thì bỏ bớt từ nối dư.',
  },
  lr: {
    score: 7,
    why: 'Vốn từ đủ rộng và chính xác cho chủ đề, với nhiều collocation tự nhiên (default option, first-hand, fuel-efficient aircraft, carbon taxes). Vài chỗ còn chung chung hoặc sáo.',
    gap: 'Bài chưa lên **band 8** vì còn những cụm chung chung như "harmful to the planet" và cụm sáo "cannot be ignored". Bài không xuống **band 6** vì collocation tự nhiên, gần như không có lỗi dùng từ.',
    next: 'Thay các cụm chung chung bằng từ nói đúng điều bài đang chứng minh, và tránh các cụm sáo ở kết bài.',
  },
  gra: {
    score: 7.5,
    why: 'Nhiều câu phức không lỗi, dùng mệnh đề quan hệ và cấu trúc "allow … to …" chính xác. Chỉ có một chỗ trật tự cụm động từ làm câu vướng.',
    gap: 'Bài chưa lên **band 8** vì cấu trúc còn khá giống nhau (nhiều vế "which"), và có một chỗ trật tự cụm động từ. Bài không xuống **band 7** vì phần lớn câu không lỗi và câu phức được kiểm soát tốt.',
    next: 'Giữ độ chính xác, và kiểm tra lại các cụm động từ có tiểu từ (take away, carry out) khi tân ngữ dài.',
  },
};

/** The sample assessment, built against the sample essay; throws if a quote does not match the text. */
export function sampleReview(): EssayReview {
  const groups = CRITERIA.map(([id, title]) => ({
    id, title,
    items: COMMENTS[id].map((c, k) => {
      if (!SAMPLE_DRAFTS[c.sec].includes(c.quote)) throw new Error('sample quote not in essay: ' + c.quote);
      const chainNo = c.chain ? SAMPLE_CHAINS.findIndex((x) => x.id === c.chain) + 1 : 0;
      return { key: id + k, sectionId: c.sec, where: LABEL[c.sec] + (chainNo ? ' · Mạch ' + chainNo : ''), ...(c.chain ? { chainId: c.chain } : {}), word: c.quote, quote: c.quote, snap: SAMPLE_DRAFTS[c.sec], label: c.label, text: c.text, ...(c.fix ? { fix: c.fix } : {}) };
    }),
  }));
  const s = Object.fromEntries(CRITERIA.map(([id]) => [id, CRITERIA_TEXT[id].score])) as Record<'tr' | 'cc' | 'lr' | 'gra', number>;
  const words = Object.values(SAMPLE_DRAFTS).reduce((n, t) => n + wordCount(t), 0);
  return {
    key: draftsKey(SAMPLE_DRAFTS),
    source: 'sample',
    summary: `Một bài band 7 điển hình (${words} từ): lập trường có, tiếng Anh khá, đọc được từ đầu tới cuối, nhưng người đọc vẫn phải dừng lại vài lần. TR đang kéo điểm xuống nhiều nhất, vì ô 3 thiếu câu With/Without và câu kết chỉ đếm ý. Việc quan trọng nhất là mở lại dàn ý, thêm dòng còn thiếu, rồi sắp lại hai đoạn thân bài.`,
    criteria: Object.fromEntries(CRITERIA.map(([id]) => [id, { why: CRITERIA_TEXT[id].why, gap: CRITERIA_TEXT[id].gap, next: CRITERIA_TEXT[id].next }])),
    groups,
    scores: { ...s, band: bandOf(s.tr, s.cc, s.lr, s.gra) },
  };
}
