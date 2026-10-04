/** The Engine Guidebook content, in the block vocabulary the doc viewer renders. MOCK: replace with the real guidebook source. */

export type Span = { t: string; m?: 'code' | 'bold' | 'highlight' };
export type Block =
  | { type: 'p'; spans: Span[] }
  | { type: 'quote'; body: string }
  | { type: 'callout'; tone: 'warning' | 'info' | 'success'; label: string; body: string }
  | { type: 'code'; body: string }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'list'; style: 'ol' | 'ul'; items: string[] }
  | { type: 'divider' }
  | { type: 'image'; caption: string };

export const GUIDEBOOKS = [
  { slug: 'engine', name: 'The Engine Guidebook', description: 'Bản đồ cơ học cho IELTS Task 2 — hành động, chủ thể, chuỗi domino, phản biện.', count: 3, color: '#FFE17B', illustration: '/assets/illustrations/il-structure.svg' },
];

export const TOC: { id: string; title: string; items: { id: string; label: string }[] }[] = [
  { id: 'm1', title: 'Module 1', items: [
    { id: 'action', label: 'Action' }, { id: 'subjects', label: 'Subjects' }, { id: 'domino-chain', label: 'Domino Chain' }, { id: 'cba', label: 'CBA' },
  ]},
  { id: 'm2', title: 'Module 2', items: [
    { id: '3cs', label: '3Cs' }, { id: 'refutations', label: 'Refutations' }, { id: 'qualifiers', label: 'Qualifiers' },
  ]},
  { id: 'm3', title: 'Module 3', items: [
    { id: 'walkthroughs', label: 'Applied Walkthroughs' }, { id: 'logical-jump', label: 'Logical Jump' }, { id: 'boomerang', label: 'The Boomerang Move' },
  ]},
];

// Block-based content — mirrors the block vocabulary the real doc editor supports:
// p (rich text spans), quote, callout, code, table, list, divider, image.
export const SECTIONS: Record<string, { title: string; blocks: Block[] }> = {
  action: { title: 'Action', blocks: [
    { type: 'p', spans: [{ t: 'Mọi bài luận bắt đầu từ một ' }, { t: 'Action', m: 'code' }, { t: ' cụ thể — điều gì đang được thực hiện, bởi ai, lên đối tượng nào.' }] },
    { type: 'callout', tone: 'warning', label: 'Lỗi thường gặp', body: 'Xác định sai Action là nguồn gốc của mọi bước nhảy logic phía sau. Luôn viết Action ra thành một câu độc lập trước khi brainstorm.' },
  ]},
  subjects: { title: 'Subjects', blocks: [
    { type: 'p', spans: [{ t: 'Phân loại chủ thể theo hai vai: ' }, { t: 'Front Subjects', m: 'bold' }, { t: ' (bên cung cấp/thực hiện) và ' }, { t: 'Back Subjects', m: 'bold' }, { t: ' (bên chịu tác động).' }] },
    { type: 'table', head: ['Vai', 'Định nghĩa', 'Ví dụ'], rows: [
      ['Front', 'Cung cấp nguồn lực hoặc thực hiện hành động', 'Chính phủ, Toà án, Nhà trường'],
      ['Back', 'Chịu tác động trực tiếp hoặc gián tiếp', 'Thiếu niên, Xã hội, Nạn nhân'],
    ]},
  ]},
  'domino-chain': { title: 'Domino Chain', blocks: [
    { type: 'p', spans: [{ t: 'Chuỗi domino nối ' }, { t: 'Action → Output X → Condition Y → Outcome', m: 'code' }, { t: '. Mỗi mắt xích phải được viết ra rõ ràng.' }] },
    { type: 'quote', body: 'Bỏ qua một mắt xích không làm chuỗi ngắn lại — nó làm chuỗi gãy.' },
    { type: 'list', style: 'ol', items: ['Xác định Action gốc.', 'Suy ra Output X — điều môi trường này tự nhiên tạo ra.', 'Xác định Condition Y — điều kiện cần để đạt Outcome mong muốn.', 'Viết Cầu nối giải thích Output X biến thành Condition Y như thế nào.'] },
  ]},
  cba: { title: 'CBA — Cost/Benefit Analysis', blocks: [
    { type: 'p', spans: [{ t: 'So sánh Past vs. Present hoặc Option A vs. Option B trên cùng một trục Maslow, để tránh so sánh táo với cam.' }] },
    { type: 'code', body: "if (axis(A) !== axis(B)) {\n  throw new LogicalJump('So sánh trên hai trục Maslow khác nhau');\n}" },
  ]},
  '3cs': { title: '3Cs', blocks: [
    { type: 'list', style: 'ul', items: ['CAN — khả năng thực hiện', 'CARE — động lực để thực hiện', 'CONDITION — điều kiện môi trường cho phép'] },
    { type: 'p', spans: [{ t: 'Ba điều kiện cần để một ' }, { t: 'Action', m: 'code' }, { t: ' dẫn tới ' }, { t: 'Outcome', m: 'code' }, { t: ' mong muốn.' }] },
  ]},
  refutations: { title: 'Refutations', blocks: [
    { type: 'callout', tone: 'info', label: 'Chiến thuật', body: 'Phản biện hiệu quả nhất tấn công vào Condition Y bị thiếu, không phải vào Action hay Outcome.' },
    { type: 'divider' },
    { type: 'p', spans: [{ t: 'Tấn công Outcome thường chỉ tạo tranh luận cảm tính; tấn công ' }, { t: 'Condition Y', m: 'code' }, { t: ' mới bộc lộ lỗ hổng logic thật.' }] },
  ]},
  qualifiers: { title: 'Boundary Qualifiers', blocks: [
    { type: 'p', spans: [{ t: 'Từ như ' }, { t: '"largely"', m: 'highlight' }, { t: ', ' }, { t: '"provided that"', m: 'highlight' }, { t: ', ' }, { t: '"in routine situations"', m: 'highlight' }, { t: ' giới hạn phạm vi của một khẳng định.' }] },
    { type: 'table', head: ['Qualifier', 'Tác dụng'], rows: [['largely', 'Thu hẹp phạm vi đúng của claim'], ['provided that', 'Gắn điều kiện tiên quyết'], ['in routine situations', 'Loại trừ trường hợp ngoại lệ']] },
  ]},
  walkthroughs: { title: 'Applied Walkthroughs', blocks: [
    { type: 'p', spans: [{ t: 'Các bài mẫu band 8.5+ được mổ xẻ chuỗi lập luận từng đoạn — xem trong ' }, { t: 'Sample X-Ray Mode', m: 'bold' }, { t: '.' }] },
    { type: 'image', caption: 'Ảnh chụp màn hình chế độ X-Ray' },
  ]},
  'logical-jump': { title: 'Logical Jump', blocks: [
    { type: 'p', spans: [{ t: 'Kết luận đi thẳng từ Action sang Outcome cuối, bỏ qua mắt xích trung gian bắt buộc.' }] },
    { type: 'quote', body: '"Não chưa phát triển ⇒ không nên xử như người lớn" — thiếu mắt xích: hành vi bốc đồng dẫn đến điều gì cụ thể?' },
  ]},
  boomerang: { title: 'The Boomerang Move', blocks: [
    { type: 'callout', tone: 'success', label: 'Bản chất', body: 'Chứng minh một hành động ngược lại gây hại chính chủ thể nó vốn nhằm bảo vệ.' },
    { type: 'p', spans: [{ t: 'Vai trò: dùng để dismantle lập luận đối lập khi chi phí dài hạn đảo ngược hoàn toàn tiền đề ban đầu.' }] },
  ]},
};
