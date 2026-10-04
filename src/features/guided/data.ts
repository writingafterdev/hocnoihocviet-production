/**
 * Chép mẫu content. MOCK: one hand-tagged sample essay. In production there are several tagged
 * sample essays per prompt; GuidedWriting renders any `GuidedSample`.
 */

export interface VocabStyle { bg: string; fg: string; hl: string }

/** One sentence to rebuild. Essay mode uses `tool`; vocab mode uses `vocab` (+ per-item Vietnamese and colours). */
export interface Segment {
  en: string;
  vi: string;
  tool?: string;
  /** Phrase inside `en` highlighted once revealed (essay mode). */
  mark?: string;
  vocab?: string[];
  vocabVi?: string[];
  vocabStyle?: VocabStyle[];
  /** Inflected forms to highlight instead of the dictionary forms in `vocab`. */
  hl?: string[];
}

export interface GuidedSample {
  id: string;
  title?: string;
  prompt: string;
  paragraphs: Segment[][];
}

export const GW_TOOL_STYLE: Record<string, { bg: string; fg: string }> = {
  'Nêu vấn đề': { bg: '#E6ECF3', fg: '#33475E' },
  'Lập trường': { bg: '#141413', fg: '#FFFFFF' },
  'Nhượng bộ': { bg: '#FBE4E0', fg: '#8B3A35' },
  'Gắn kết & Bản sắc': { bg: '#FFEEDA', fg: '#7B4D10' },
  'Mắt xích': { bg: '#F1F1EE', fg: '#44443F' },
  'Tác động': { bg: '#DCF5EC', fg: '#17664F' },
  'Khả thi': { bg: '#DEDEDA', fg: '#2B2B29' },
  'With/Without': { bg: '#E4F5FA', fg: '#17667A' },
  'Nối về': { bg: '#FFF6DA', fg: '#765A00' },
};

export const GW_VOCAB_STYLE: VocabStyle = { bg: '#FFF6DA', fg: '#765A00', hl: '#FFE17C' };
// One colour per vocab item in a set, so each phrase keeps its colour on its chip, its bar and its highlight.
export const GW_VOCAB_PALETTE: VocabStyle[] = [
  { bg: '#E4F5FA', fg: '#17667A', hl: '#BFE7F3' },
  { bg: '#FFEEDA', fg: '#7B4D10', hl: '#FFD9AE' },
  { bg: '#DCF5EC', fg: '#17664F', hl: '#B5EBD7' },
  { bg: '#FBE4E0', fg: '#8B3A35', hl: '#F6C9C0' },
  { bg: '#FFF6DA', fg: '#765A00', hl: '#FFE17C' },
  { bg: '#E6ECF3', fg: '#33475E', hl: '#C9D6E6' },
];

export const GW_SAMPLES: Record<string, GuidedSample> = {
  charity: {
    id: 'charity',
    title: 'Từ thiện: theo mức độ cần hay theo quốc gia',
    prompt: 'Some people believe that charities should focus on helping people in their own countries. Others think they should help people in great need wherever they live. Discuss both views and give your opinion.',
    paragraphs: [
      [
        { tool: 'Nêu vấn đề', mark: 'provide assistance to people in great need regardless of where they live', en: 'People have different views on whether charity organizations should provide assistance to people in great need regardless of where they live or whether they should focus on helping people in their own countries.', vi: 'Mọi người có quan điểm khác nhau về việc các tổ chức từ thiện nên giúp những người đang rất cần, bất kể họ sống ở đâu, hay nên tập trung giúp người dân nước mình.' },
        { tool: 'Lập trường', mark: 'the level of need should take priority over nationality', en: 'Although supporting local communities has certain practical advantages, I believe that the level of need should take priority over nationality.', vi: 'Dù hỗ trợ cộng đồng trong nước có một số lợi ích thực tế, tôi cho rằng mức độ cần giúp đỡ nên được ưu tiên hơn quốc tịch.' },
      ],
      [
        { tool: 'Nhượng bộ', mark: 'it is understandable why some believe', en: 'Admittedly, it is understandable why some believe that charity organisations should focus on helping people in their own countries.', vi: 'Phải thừa nhận rằng có thể hiểu vì sao một số người tin rằng các tổ chức từ thiện nên tập trung giúp người dân nước mình.' },
        { tool: 'Gắn kết & Bản sắc', mark: 'a better understanding of their communities', en: 'The foremost reason is that local charities have a better understanding of their communities.', vi: 'Lý do quan trọng nhất là các tổ chức từ thiện địa phương hiểu cộng đồng của họ rõ hơn.' },
        { tool: 'Mắt xích', mark: 'familiar with the difficulties faced by disadvantaged individuals', en: 'They are often familiar with the difficulties faced by disadvantaged individuals, such as a lack of food, shelter, and financial support.', vi: 'Họ thường quen thuộc với những khó khăn mà người yếu thế gặp phải, chẳng hạn như thiếu thức ăn, chỗ ở và hỗ trợ tài chính.' },
        { tool: 'Mắt xích', mark: 'identify vulnerable groups', en: 'This knowledge not only makes it easier for charity organisations to identify vulnerable groups but also helps them determine what kind of assistance is most urgently needed.', vi: 'Hiểu biết này không chỉ giúp các tổ chức từ thiện dễ nhận ra nhóm người dễ tổn thương hơn mà còn giúp họ xác định loại hỗ trợ nào đang cần gấp nhất.' },
        { tool: 'Tác động', mark: 'targeted and effective assistance', en: 'As a result, their resources can be distributed more effectively, eventually enabling them to provide targeted and effective assistance.', vi: 'Nhờ vậy, nguồn lực của họ được phân bổ hiệu quả hơn, cuối cùng giúp họ hỗ trợ đúng chỗ và hiệu quả.' },
      ],
      [
        { tool: 'Lập trường', mark: 'based primarily on the level of need', en: 'However, I believe that charities should provide assistance based primarily on the level of need.', vi: 'Tuy nhiên, tôi cho rằng các tổ chức từ thiện nên hỗ trợ chủ yếu dựa trên mức độ cần giúp đỡ.' },
        { tool: 'Khả thi', mark: 'lack sufficient resources to support them', en: 'In some countries, residents may face severe poverty, natural disasters, or other serious crises, while local governments and charities may lack sufficient resources to support them.', vi: 'Ở một số nước, người dân có thể đối mặt với nghèo đói nghiêm trọng, thiên tai hoặc khủng hoảng khác, trong khi chính quyền và các tổ chức từ thiện địa phương lại không đủ nguồn lực để hỗ trợ họ.' },
        { tool: 'Mắt xích', mark: 'unable to meet their basic needs', en: 'Consequently, many of these people may be unable to meet their basic needs, such as food, shelter, and medical care.', vi: 'Hệ quả là nhiều người trong số họ có thể không đáp ứng được những nhu cầu cơ bản như thức ăn, chỗ ở và chăm sóc y tế.' },
        { tool: 'Mắt xích', mark: 'directing resources to places where local support is insufficient', en: 'International charities can therefore play a crucial role by directing resources to places where local support is insufficient and the need is most urgent.', vi: 'Vì thế, các tổ chức từ thiện quốc tế có thể đóng vai trò quan trọng khi đưa nguồn lực tới những nơi hỗ trợ tại chỗ còn thiếu và nhu cầu cấp bách nhất.' },
        { tool: 'With/Without', mark: 'Without such assistance', en: 'Without such assistance, these people may continue to lack basic necessities, potentially putting their health and even their lives at risk.', vi: 'Nếu không có sự hỗ trợ đó, những người này có thể tiếp tục thiếu thốn nhu yếu phẩm, có thể khiến sức khoẻ và thậm chí tính mạng của họ bị đe doạ.' },
        { tool: 'Nối về', mark: 'should take priority over restricting charitable assistance', en: 'For this reason, addressing urgent and fundamental needs should take priority over restricting charitable assistance according to where people live.', vi: 'Vì lý do này, giải quyết những nhu cầu cấp bách và thiết yếu nên được ưu tiên hơn việc giới hạn hỗ trợ từ thiện theo nơi người ta sống.' },
      ],
      [
        { tool: 'Lập trường', mark: 'priority should be given to those in greatest need', en: 'In conclusion, while helping people within their own countries may enable charities to provide more targeted and effective assistance, I maintain that priority should be given to those in greatest need, regardless of where they live.', vi: 'Tóm lại, dù giúp người dân trong nước có thể giúp các tổ chức từ thiện hỗ trợ đúng chỗ và hiệu quả hơn, tôi vẫn cho rằng nên ưu tiên những người cần giúp đỡ nhất, bất kể họ sống ở đâu.' },
      ],
    ],
  },
};
