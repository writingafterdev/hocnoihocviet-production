/**
 * MOCK: canned "Hỏi" tutor replies from the prototype. The real tutor reads the prompt, the chains
 * and the paragraph in focus; swap these maps for a request to that endpoint.
 */
import type { AssistantAction } from './ui/Assistant';

export const BUILDER_ACTIONS: AssistantAction[] = [
  { label: 'Gợi ý stakeholder', desc: 'Nhìn Backward và Forward để tìm thêm người bị tác động.' },
  { label: 'Mạch này thiếu vùng nào?', desc: 'Soi 5 vùng tác động để tìm ý chưa khai thác.' },
  { label: 'Dịch một cụm từ', desc: 'Chuyển ý tiếng Việt sang cách diễn đạt tự nhiên.' },
];

export const BUILDER_REPLIES: Record<string, string> = {
  'Gợi ý stakeholder': 'Nhìn Backward: ai cung cấp khoá học? Trainers, đơn vị đào tạo, chính phủ. Nhìn Forward: kiến thức nuôi con đi tới bố mẹ, rồi tới trẻ. Nơi làm việc cũng nhận tác động khi phụ huynh phải xin nghỉ để đi học.',
  'Mạch này thiếu vùng nào?': 'Hai mạch hiện tại đi qua Năng lực, An toàn, Tự quyết và Vật chất. Gắn kết & Bản sắc chưa được soi: khoá học có gò bố mẹ vào một cách nuôi con cố định không?',
  'Dịch một cụm từ': 'Gửi mình cụm tiếng Việt bạn muốn diễn đạt, mình sẽ gợi ý 2–3 cách viết hợp với giọng học thuật.',
};

export const DESK_ACTIONS: AssistantAction[] = [
  { label: 'Kiểm tra nhảy logic', desc: 'Tìm mũi tên nào trong đoạn đang bỏ qua một bước.' },
  { label: 'Đoạn này dùng mạch nào?', desc: 'Đối chiếu đoạn với các mạch và phát hiện ý bị thiếu.' },
  { label: 'Dịch một cụm từ', desc: 'Chuyển ý tiếng Việt sang cách diễn đạt tự nhiên.' },
];

export const DESK_REPLIES: Record<string, string> = {
  'Kiểm tra nhảy logic': 'Hỏi lại: A cho ra gì, D cần gì? Nếu câu của bạn đi thẳng từ khoá học tới sự phát triển của trẻ, còn thiếu bước bố mẹ áp dụng kiến thức vào sinh hoạt hằng ngày.',
  'Đoạn này dùng mạch nào?': 'Đoạn này gần nhất với mạch 01. Bạn đã tách nhánh theo "Parents" nhưng chưa nhắc tới nhánh B (làm ca dài, kiệt sức), đó là chỗ lợi ích nhỏ lại.',
  'Dịch một cụm từ': 'Gửi mình cụm tiếng Việt bạn muốn diễn đạt, mình sẽ gợi ý 2–3 cách viết hợp với giọng học thuật.',
};
