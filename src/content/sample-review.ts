/**
 * "Xem một bài chấm mẫu": a finished, assessed essay for the two-screen flow, copied into the student's
 * account so they can see what ② Viết bài looks like after "Nộp bài". Written by hand: a band 7 essay with
 * realistic slips, and comments that point at the essay and at steps in its chains.
 */
import type { Chain, ReviewItem } from '@/features/chainlab/types';
import { bandOf, draftsKey, type EssayReview } from '@/features/desk/scoring';

export const SAMPLE_PROMPT_ID = 'cheaper-international-travel';

const B1 = 'sample-b1', B2 = 'sample-b2';

export const SAMPLE_CHAINS: Chain[] = [
  {
    id: B1, q: 1, title: '', tone: 'benefit', area: '', split: null, findings: [], mine: 'end', built: true,
    steps: ['International travel becoming easier and cheaper', 'Families on average incomes can now afford a trip abroad', 'Young people experience other cultures first-hand', 'They become more open-minded and confident', 'Travel stops being a privilege of the rich'],
  },
  {
    id: B2, q: 1, title: '', tone: 'cost', area: '', split: null, findings: [], mine: 'end', built: true,
    steps: ['International travel becoming easier and cheaper', 'Far more people take long-haul flights every year', 'Each flight burns huge amounts of fuel', 'Carbon emissions damage the environment'],
  },
];

export const SAMPLE_DRAFTS: Record<string, string> = {
  intro: 'In recent decades, budget airlines and online booking have made international travel far cheaper and easier than before. Although this trend has a real environmental cost, I believe it is a positive development, because it opens up opportunities that used to belong only to the wealthy.',
  [B1]: 'The main benefit is that travel is no longer a privilege of the rich. In the past, only high earners could afford to fly abroad, but now families on average incomes can buy tickets for a few hundred dollars. For example, a student from a small town in Vietnam can spend a summer in Thailand or South Korea for less than a month of wages. As a result, young people experience other cultures first-hand rather than through screens. This makes them more open-minded and confident, which is a very good thing for society.',
  [B2]: 'On the other hand, cheap flights is harmful to the environment. Far more people now take long-haul flights every year, and each flight burns enormous amounts of fuel. A single return flight from Hanoi to London, for instance, produces more carbon dioxide per passenger than many people in poorer countries create in a whole year. It also causes a lot of pollution. However, this problem can be reduced through more fuel-efficient aircraft and carbon taxes, without taking the chance to travel away from ordinary people.',
  conclusion: 'In conclusion, cheaper international travel is mainly positive. Its environmental damage is serious but can be solved by technology and policy, whereas the opportunities it gives ordinary families would be lost entirely if travel became expensive again.',
};

const LABEL: Record<string, string> = { intro: 'Mở bài', [B1]: 'Thân bài 1', [B2]: 'Thân bài 2', conclusion: 'Kết bài' };

type Note = { sec: string; quote: string; label: string; text: string; chain?: string; at?: number; fix?: string };

const NOTES: Record<'tr' | 'cc' | 'lr' | 'gra', Note[]> = {
  tr: [
    { sec: B1, chain: B1, at: 4, quote: 'This makes them more open-minded and confident, which is a very good thing for society.', label: 'Kết đoạn chưa về điểm cuối', text: 'Mạch đi tới "cởi mở, tự tin" rồi dừng ở một lời khen chung cho xã hội. Điểm cuối trong dàn bài là **du lịch không còn là đặc quyền của người giàu**: câu cuối đoạn nên quay về đúng điều đó, vì đó là lý do bạn nói xu hướng này tích cực.' },
    { sec: B2, chain: B2, at: 2, quote: 'It also causes a lot of pollution.', label: 'Câu lặp, không thêm bước', text: 'Câu này nói lại "đốt nhiên liệu" bằng từ khác, không thêm bước nào. Trong mạch, bước còn thiếu là khí thải làm môi trường bị hại **ra sao, ở đâu**. Thay câu này bằng một hậu quả cụ thể.' },
  ],
  cc: [
    { sec: B1, chain: B1, at: 2, quote: 'As a result, young people', label: 'Từ nối sai quan hệ', text: 'Trải nghiệm văn hoá không phải "kết quả" của giá vé rẻ; đó là việc người ta làm được khi đã đi. Nối bằng một cụm chỉ đúng bước đó.', fix: 'Once abroad, young people' },
    { sec: B2, chain: B2, quote: 'However, this problem can be reduced', label: 'Chữ trỏ mơ hồ', text: '"This problem" trỏ chung chung trong khi đoạn vừa nói nhiên liệu và ô nhiễm. Gọi tên đúng thứ bạn đang trả lời để câu phản biện bám vào ý trước.', fix: 'However, this environmental cost can be reduced' },
  ],
  lr: [
    { sec: B1, quote: 'a very good thing', label: 'Từ chung chung', text: '"A very good thing" quá chung cho Task 2. Dùng cụm nói được lợi ích cụ thể là gì.', fix: 'a genuine benefit' },
    { sec: B2, quote: 'taking the chance to travel away from ordinary people', label: 'Cụm động từ bị tách xa', text: '"Take something away from someone" bị tách quá xa nên khó đọc. Đưa "away" lại gần động từ.', fix: "taking away ordinary people's chance to travel" },
  ],
  gra: [
    { sec: B2, quote: 'cheap flights is harmful', label: 'Sai hoà hợp chủ ngữ', text: '"Flights" là số nhiều nên động từ phải là "are".', fix: 'cheap flights are harmful' },
  ],
};

const TITLE: Record<string, string> = { tr: 'Task Response', cc: 'Coherence & Cohesion', lr: 'Lexical Resource', gra: 'Grammatical Range & Accuracy' };

/** The assessment, keyed to the drafts so it isn't shown as out of date. */
export function sampleReview(): EssayReview {
  const scores = { tr: 6.5, cc: 7, lr: 7, gra: 6.5 };
  return {
    key: draftsKey(SAMPLE_DRAFTS),
    source: 'sample',
    scores: { ...scores, band: bandOf(scores.tr, scores.cc, scores.lr, scores.gra) },
    summary: 'Lập trường rõ và cả hai thân bài đều có mạch thật, nên bài đứng vững ở band 7. Điểm kéo xuống nhiều nhất là Task Response: thân bài 1 dừng ở một lời khen chung thay vì về điểm cuối, và thân bài 2 có một câu chỉ lặp lại ý. Việc quan trọng nhất: kết mỗi đoạn bằng đúng điểm cuối trong dàn bài.',
    criteria: {
      tr: { why: 'Bài trả lời đúng câu hỏi tích cực hay tiêu cực, có lập trường rõ ở mở bài và kết bài, và có so hai bên.', gap: 'Chưa lên 7 vì thân bài 1 kết bằng một nhận xét chung và thân bài 2 có câu không thêm bước nào.', next: 'Kết mỗi đoạn bằng **điểm cuối** của mạch.' },
      cc: { why: 'Thứ tự đoạn hợp lý, có câu phản biện ở thân bài 2.', gap: 'Một từ nối sai quan hệ và một chữ trỏ mơ hồ.', next: 'Chọn từ nối theo đúng bước trong mạch.' },
      lr: { why: 'Từ vựng đủ rộng cho đề, có collocation tốt như "fuel-efficient aircraft".', gap: 'Vài cụm còn chung chung.', next: 'Thay cụm chung bằng cụm nói rõ lợi ích hay tác hại.' },
      gra: { why: 'Câu phức dùng khá chắc.', gap: 'Một lỗi hoà hợp chủ ngữ ở câu đầu thân bài 2, chỗ người chấm đọc kỹ.', next: 'Soát lại chủ ngữ số nhiều.' },
    },
    groups: (['tr', 'cc', 'lr', 'gra'] as const).map((id) => ({
      id, title: TITLE[id],
      items: NOTES[id].map((n, k): ReviewItem => ({
        key: id + k, sectionId: n.sec, where: LABEL[n.sec] + (n.chain ? ' · Mạch ' + (n.chain === B1 ? 1 : 2) : ''),
        ...(n.chain ? { chainId: n.chain } : {}), ...(n.at != null ? { at: n.at } : {}),
        word: n.quote, quote: n.quote, label: n.label, ...(n.fix ? { fix: n.fix } : {}), snap: SAMPLE_DRAFTS[n.sec], text: n.text,
      })),
    })),
  };
}
