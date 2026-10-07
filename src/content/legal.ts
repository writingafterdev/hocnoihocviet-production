/**
 * Privacy policy and terms of service, shown at /privacy and /terms (the links Google's OAuth consent screen asks for).
 * Keep the text in step with what the app really stores and sends: migrations/ for the data, src/lib/ai for the AI calls.
 */
export interface LegalSection { h: string; p: string[] }
export interface LegalDoc { title: string; updated: string; vi: LegalSection[]; en: LegalSection[] }

/** Where people reach us about their data. */
export const CONTACT_EMAIL = '';
const CONTACT_VI = CONTACT_EMAIL ? 'Email: ' + CONTACT_EMAIL : 'Liên hệ qua email hỗ trợ của hocnoihocviet.';
const CONTACT_EN = CONTACT_EMAIL ? 'Email: ' + CONTACT_EMAIL : 'Contact the hocnoihocviet support email.';

export const PRIVACY: LegalDoc = {
  title: 'Chính sách quyền riêng tư · Privacy Policy',
  updated: '2026-10-07',
  vi: [
    { h: 'hocnoihocviet là gì', p: ['hocnoihocviet là ứng dụng web giúp học sinh luyện IELTS Writing Task 2: xây mạch lập luận, chép mẫu, học từ vựng và nhận nhận xét cho bài viết. Chính sách này nói rõ ứng dụng lưu gì về bạn và dùng nó ra sao.'] },
    { h: 'Dữ liệu chúng tôi thu thập', p: [
      'Khi bạn đăng nhập bằng Google: tên, địa chỉ email và ảnh đại diện trong tài khoản Google của bạn (quyền openid, email, profile). Chúng tôi không đọc Gmail, Drive, danh bạ hay bất kỳ dữ liệu Google nào khác.',
      'Những gì bạn viết trong ứng dụng: các mạch lập luận, lập trường, bài viết, nhận xét nhận được, từ vựng bạn lưu và tiến độ học.',
      'Thông tin dùng thử: số lượt nhờ AI mỗi ngày, số token đã dùng, và nhật ký lỗi của các lượt gọi AI, để áp giới hạn dùng mỗi ngày và sửa lỗi.',
      'Cookie phiên đăng nhập, để bạn không phải đăng nhập lại ở mỗi trang.',
    ] },
    { h: 'Chúng tôi dùng dữ liệu để làm gì', p: ['Để đăng nhập cho bạn, lưu và đồng bộ bài làm giữa các thiết bị, tạo nhận xét bằng AI, áp giới hạn dùng và sửa lỗi. Chúng tôi không bán dữ liệu của bạn, không chạy quảng cáo và không dùng bài viết của bạn để quảng bá.'] },
    { h: 'AI xử lý nội dung của bạn', p: ['Khi bạn bấm xin nhận xét, dịch hoặc làm phong phú một từ vựng, văn bản bạn gửi (bài viết, mạch, từ hoặc cụm từ) được chuyển tới nhà cung cấp mô hình AI bên thứ ba để tạo câu trả lời. Chúng tôi chỉ gửi văn bản cần thiết cho yêu cầu đó, không gửi tên hay email của bạn. Nhà cung cấp AI có thể thay đổi theo thời gian và xử lý văn bản theo điều khoản riêng của họ.'] },
    { h: 'Nơi lưu trữ và bên xử lý', p: ['Dữ liệu được lưu trên nền tảng Cloudflare (máy chủ và cơ sở dữ liệu). Google xử lý việc đăng nhập. Nhà cung cấp mô hình AI xử lý văn bản như nêu ở trên.'] },
    { h: 'Thời gian lưu và xoá dữ liệu', p: ['Chúng tôi giữ dữ liệu trong thời gian tài khoản còn tồn tại. Bạn có thể yêu cầu xoá tài khoản và toàn bộ bài làm bằng cách gửi email cho chúng tôi; chúng tôi sẽ xoá trong vòng 30 ngày. ' + CONTACT_VI] },
    { h: 'Trẻ em', p: ['Ứng dụng không dành cho trẻ dưới 13 tuổi và chúng tôi không cố ý thu thập dữ liệu của các em.'] },
    { h: 'Thay đổi và liên hệ', p: ['Khi chính sách thay đổi, chúng tôi cập nhật ngày ở đầu trang. Câu hỏi về dữ liệu của bạn: ' + CONTACT_VI] },
  ],
  en: [
    { h: 'What hocnoihocviet is', p: ['hocnoihocviet is a web app that helps students practise IELTS Writing Task 2: building argument chains, copying model answers, learning vocabulary and getting feedback on their writing. This policy explains what the app stores about you and how it is used.'] },
    { h: 'Data we collect', p: [
      'When you sign in with Google: the name, email address and profile picture of your Google account (scopes openid, email, profile). We do not read your Gmail, Drive, contacts or any other Google data.',
      'What you write in the app: argument chains, your stance, essays, the feedback you receive, vocabulary you save and your progress.',
      'Usage information: the number of AI requests per day, tokens used, and error logs of AI requests, to apply daily limits and fix problems.',
      'A session cookie, so you stay signed in between pages.',
    ] },
    { h: 'How we use it', p: ['To sign you in, save and sync your work across devices, generate AI feedback, apply usage limits and fix errors. We do not sell your data, show ads, or use your writing to promote anything.'] },
    { h: 'AI processes your content', p: ['When you ask for feedback, a translation or help enriching a vocabulary item, the text you submit (an essay, a chain, a word or phrase) is sent to a third-party AI model provider to produce the reply. We send only the text needed for that request, not your name or email. The AI provider may change over time and handles the text under its own terms.'] },
    { h: 'Where data is kept and who processes it', p: ['Data is stored on Cloudflare (servers and database). Google handles sign-in. The AI model provider processes text as described above.'] },
    { h: 'Retention and deletion', p: ['We keep your data while your account exists. You can ask us to delete your account and all your work by emailing us; we will delete it within 30 days. ' + CONTACT_EN] },
    { h: 'Children', p: ['The app is not meant for children under 13 and we do not knowingly collect their data.'] },
    { h: 'Changes and contact', p: ['When this policy changes we update the date at the top. Questions about your data: ' + CONTACT_EN] },
  ],
};

export const TERMS: LegalDoc = {
  title: 'Điều khoản sử dụng · Terms of Service',
  updated: '2026-10-07',
  vi: [
    { h: 'Dùng ứng dụng', p: ['hocnoihocviet là công cụ luyện viết IELTS Writing Task 2. Bằng việc đăng nhập, bạn đồng ý với các điều khoản này và với Chính sách quyền riêng tư. Ứng dụng đang ở giai đoạn beta và miễn phí; tính năng và giới hạn dùng mỗi ngày có thể thay đổi.'] },
    { h: 'Tài khoản', p: ['Bạn đăng nhập bằng tài khoản Google và chịu trách nhiệm về những gì xảy ra trong tài khoản của mình. Hãy dùng ứng dụng đúng mục đích học tập, không lạm dụng hay làm quá tải hệ thống.'] },
    { h: 'Nội dung của bạn', p: ['Bài viết, mạch và từ vựng bạn tạo vẫn thuộc về bạn. Bạn cho phép chúng tôi lưu và xử lý nội dung đó (kể cả gửi tới nhà cung cấp AI) chỉ để vận hành các tính năng bạn dùng.'] },
    { h: 'Nhận xét của AI', p: ['Nhận xét, điểm và gợi ý do AI tạo ra chỉ mang tính tham khảo, có thể chưa chính xác và không phải điểm thi chính thức. hocnoihocviet không liên kết với IELTS, British Council, IDP hay Cambridge.'] },
    { h: 'Dịch vụ và trách nhiệm', p: ['Dịch vụ được cung cấp "như hiện có", không cam kết hoạt động liên tục hay không có lỗi. Trong phạm vi pháp luật cho phép, chúng tôi không chịu trách nhiệm về thiệt hại phát sinh từ việc dùng ứng dụng.'] },
    { h: 'Thay đổi và liên hệ', p: ['Chúng tôi có thể cập nhật các điều khoản này và sẽ đổi ngày ở đầu trang. ' + CONTACT_VI] },
  ],
  en: [
    { h: 'Using the app', p: ['hocnoihocviet is a tool for practising IELTS Writing Task 2. By signing in you agree to these terms and to the Privacy Policy. The app is in beta and free; features and daily limits may change.'] },
    { h: 'Your account', p: ['You sign in with your Google account and are responsible for what happens under it. Use the app for learning and do not abuse it or overload the system.'] },
    { h: 'Your content', p: ['The essays, chains and vocabulary you create remain yours. You allow us to store and process them (including sending them to an AI provider) only to run the features you use.'] },
    { h: 'AI feedback', p: ['Feedback, scores and suggestions produced by AI are for guidance only, may be inaccurate, and are not official exam scores. hocnoihocviet is not affiliated with IELTS, the British Council, IDP or Cambridge.'] },
    { h: 'Service and liability', p: ['The service is provided "as is", with no promise that it is always available or error-free. To the extent the law allows, we are not liable for damage arising from using the app.'] },
    { h: 'Changes and contact', p: ['We may update these terms and will change the date at the top. ' + CONTACT_EN] },
  ],
};
