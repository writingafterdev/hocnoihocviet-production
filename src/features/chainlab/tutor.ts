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
  'Gợi ý stakeholder': 'Nhìn Backward: ai cung cấp, ai trả tiền, ai thực hiện Driver? Nhìn Forward: bước cuối của mỗi mạch đi tới ai tiếp theo? Đối chiếu với "Các bên liên quan" bên trái và tìm bên chưa có mạch nào nhắc tới.',
  'Mạch này thiếu vùng nào?': 'Ghi vùng tác động cho từng mạch, rồi so với 5 vùng ở cột trái: Vật chất, An toàn, Gắn kết & Bản sắc, Năng lực, Tự quyết. Vùng nào chưa có mạch nào chạm tới là chỗ nên soi tiếp.',
  'Dịch một cụm từ': 'Gửi mình cụm tiếng Việt bạn muốn diễn đạt, mình sẽ gợi ý 2–3 cách viết hợp với giọng học thuật.',
};

export const DESK_ACTIONS: AssistantAction[] = [
  { label: 'Kiểm tra nhảy logic', desc: 'Tìm mũi tên nào trong đoạn đang bỏ qua một bước.' },
  { label: 'Đoạn này dùng mạch nào?', desc: 'Đối chiếu đoạn với các mạch và phát hiện ý bị thiếu.' },
  { label: 'Dịch một cụm từ', desc: 'Chuyển ý tiếng Việt sang cách diễn đạt tự nhiên.' },
];

export const DESK_REPLIES: Record<string, string> = {
  'Kiểm tra nhảy logic': 'Với mỗi cặp câu liền nhau, hỏi: câu trước cho ra thứ gì cụ thể, câu sau cần gì để xảy ra? Nếu hai thứ đó khác nhau, đang thiếu một bước ở giữa.',
  'Đoạn này dùng mạch nào?': 'Đặt từng câu của đoạn cạnh các bước của mạch bên trái. Bước nào chưa có câu tương ứng, và trường hợp nào (nhánh Scope) đã bị bỏ qua?',
  'Dịch một cụm từ': 'Gửi mình cụm tiếng Việt bạn muốn diễn đạt, mình sẽ gợi ý 2–3 cách viết hợp với giọng học thuật.',
};
