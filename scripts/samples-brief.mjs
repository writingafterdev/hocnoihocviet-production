// Writes docs/gpt-samples-brief.md: everything an outside writer needs to produce Chép mẫu samples
// (format, rules, the book's method, two worked examples) plus the prompts that still have none, in batches.
// Run: node scripts/samples-brief.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sdir = path.join(root, 'src/content/samples');
const have = new Set(fs.readdirSync(sdir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)));
const src = fs.readFileSync(path.join(root, 'src/content/prompts.ts'), 'utf8');
const method = fs.readFileSync(path.join(root, 'src/lib/ai/method.ts'), 'utf8').replace(/^[\s\S]*?export const METHOD = `/, '').replace(/`\.trim\(\);?\s*$/, '').replace(/\\`/g, '`').trim();

const missing = [];
for (const m of src.matchAll(/\{ id: '([^']+)'/g)) {
  if (have.has(m[1])) continue;
  const seg = src.slice(m.index, m.index + 1800);
  const text = (seg.match(/text: '((?:[^'\\]|\\.)*)'/) || seg.match(/text: "((?:[^"\\]|\\.)*)"/) || [])[1];
  const category = (seg.match(/category: '([^']+)'/) || [])[1];
  const reqs = [...(seg.match(/reqs: \[([\s\S]*?)\],\s*\n/) || [, ''])[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1].replace(/\\'/g, "'"));
  missing.push({ id: m[1], category, text: (text || '').replace(/\\'/g, "'"), reqs });
}

const example = (id) => fs.readFileSync(path.join(sdir, id + '.json'), 'utf8').trim();
const BATCH = 6;
const out = `# Brief: viết bài mẫu Chép mẫu cho hocnoihocviet

Bạn là người viết bài mẫu IELTS Writing Task 2 cho app học viết của một giáo viên Việt Nam. Mỗi bài mẫu là một bài viết hoàn chỉnh, từng câu được gắn nhãn "công cụ" theo phương pháp của cuốn *The Art of Nuance in IELTS Writing* (phần PHƯƠNG PHÁP bên dưới). Học sinh sẽ chép lại từng câu từ gợi ý tiếng Việt, nên bài mẫu phải là bài viết hay, đúng phương pháp, và dễ chép.

## Đầu ra

Trả về **một mảng JSON duy nhất** (trong một khối \`\`\`json), mỗi phần tử là một bài mẫu. Không thêm lời giải thích ngoài khối JSON.

\`\`\`
{
  "promptId": "<id của đề, đúng như danh sách bên dưới>",
  "source": "hocnoihocviet",
  "note": "<một câu tiếng Việt: dạng đề và hướng viết, ví dụ 'Viết theo phương pháp của sách: Dạng 1, ...'>",
  "paragraphs": [            // 3 đến 5 đoạn: mở bài, 1-3 đoạn thân bài, kết bài
    [                         // mỗi đoạn là một mảng câu
      { "tool": "Đề hỏi gì", "mark": "<cụm tiếng Anh trong câu>", "en": "<câu tiếng Anh>", "vi": "<câu dịch tiếng Việt>" }
    ]
  ]
}
\`\`\`

## Luật bắt buộc (script kiểm tra sẽ từ chối bài vi phạm)

1. Tổng số từ tiếng Anh của bài (cộng tất cả "en"): **250 đến 320 từ** (bắt buộc nằm trong 230–340).
2. 3 đến 5 đoạn. Câu đầu tiên của bài có \`"tool": "Đề hỏi gì"\`.
3. \`tool\` chỉ được là một trong: **Đề hỏi gì, Lập trường, Mạch, Scope, With/Without, Dài hạn, Quy mô, Khả thi, Phản biện, Nối về**. Một câu làm hai việc thì nối bằng " + " (ví dụ \`"Mạch + Scope"\`). Dùng đúng nghĩa các nhãn theo phần PHƯƠNG PHÁP.
4. \`mark\` là một cụm **nguyên văn có trong câu "en"** (đúng từng ký tự, kể cả hoa/thường), là chỗ thể hiện công cụ của câu đó (ví dụ cụm nói lập trường, cụm nêu Scope). Khoảng 3 đến 12 từ.
5. Không có hai dấu cách liền nhau, không có dấu cách ở đầu/cuối câu. Dùng dấu nháy kép thẳng " chỉ cho cú pháp JSON; trong câu dùng ‘ ’ hoặc “ ”.
6. "vi" là bản dịch tự nhiên, sát nghĩa, của đúng câu "en" đó (không tóm tắt, không thêm ý).

## Yêu cầu về nội dung

- Xác định đề thuộc **Dạng** nào của sách (theo loại đề trong danh sách) và viết đúng cấu trúc của dạng đó: đoạn thân bài theo ô 1, ô 2 + ô 3 (phản biện), ô 4; đoạn nào cũng có mạch đủ bước, không nhảy bước; mỗi câu làm một việc; ý phụ đi ngay sau ý chính; có câu NỐI VỀ khi cần.
- Lập trường rõ, nhất quán từ mở bài tới kết bài; câu kết nói lại **lý do** đã chứng minh, không chỉ đếm ý.
- Dùng Scope (đúng với ai, đúng khi nào), With/Without, Dài hạn, Quy mô, Khả thi ở những chỗ đề cần, không nhồi đủ cả mười nhãn vào một bài.
- Không bịa số liệu, tên nghiên cứu hay trích dẫn. Ví dụ phải là điều ai cũng thấy hợp lý.
- Văn phong học thuật vừa phải, câu đủ dài để có mạch nhưng không rối; trình độ khoảng band 8.
- Mỗi bài viết riêng cho đề của nó; không lặp lại cấu trúc câu giữa các bài.

## Hai bài mẫu để bắt chước về hình thức

Bài 1 (Dạng 7, hai câu hỏi nguyên nhân và giải pháp):

\`\`\`json
${example('city-traffic')}
\`\`\`

Bài 2 (đề có lập trường):

\`\`\`json
${example('childcare-training')}
\`\`\`

## PHƯƠNG PHÁP (từ cuốn sách)

${method}

## Các đề cần viết (${missing.length} đề, chia thành ${Math.ceil(missing.length / BATCH)} đợt)

Mỗi lần, xin viết **một đợt** (khoảng ${BATCH} đề) và trả về một mảng JSON cho đợt đó.

${Array.from({ length: Math.ceil(missing.length / BATCH) }, (_, b) => {
  const part = missing.slice(b * BATCH, b * BATCH + BATCH);
  return `### Đợt ${b + 1}\n\n` + part.map((p) => `- **promptId: \`${p.id}\`** · ${p.category}\n  Đề: ${p.text}\n  Đề bài yêu cầu: ${p.reqs.join(' | ') || '(không có)'}`).join('\n\n');
}).join('\n\n')}
`;
fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/gpt-samples-brief.md'), out);
console.log(`${missing.length} prompts without a sample → docs/gpt-samples-brief.md (${Math.round(out.length / 1024)} KB)`);
