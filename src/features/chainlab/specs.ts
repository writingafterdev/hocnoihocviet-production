import type { Chain, PromptSpec } from './types';

// Sample prompts for the prototype. In production these come from prompt import + question extraction.

export const CL_PROMPT = 'Caring for children is an important responsibility. Some people believe that all parents should be required to take childcare training courses. To what extent do you agree or disagree?';

const CL_INITIAL: Chain[] = [
  {
    id: 'c1', q: 1, title: 'Knowledge becomes better daily care', tone: 'benefit', pos: 72, area: 'Năng lực → An toàn',
    steps: ['Childcare course', 'Parents gain practical parenting knowledge', 'They apply it in everyday interactions'],
    split: { at: 2, noun: 'Parents', branches: [
      { label: 'Chưa có kinh nghiệm', steps: ['Most of the knowledge is new to them', 'The home environment becomes noticeably healthier'], side: 'right' },
      { label: 'Làm ca dài, tối về kiệt sức', steps: ['They know what to do but rarely have the energy', 'They fall back on old habits'], side: 'left' },
    ] },
    findings: [
      { id: 'f1', kind: 'With/Without', text: 'Không có khoá học, bố mẹ vẫn học từ ông bà, mạng, kinh nghiệm. Lợi ích thật chỉ là phần họ chưa có.', side: null, target: 'all' },
    ],
  },
  {
    id: 'c2', q: 1, title: 'A universal requirement creates uneven burden', tone: 'cost', side: 'left', area: 'Tự quyết → Vật chất',
    steps: ['All parents are required to attend', 'Every household must make time for the course', 'Working parents rearrange work or childcare', 'The requirement creates additional time and financial pressure'],
    split: null,
    findings: [
      { id: 'f2', kind: 'Quy mô', text: '"All parents": nhu cầu tăng mạnh; nếu không đủ người dạy, chất lượng khoá học giảm.', side: 'left', target: 'all' },
    ],
  },
];

const clMk = (o: Partial<Chain> & Pick<Chain, 'id' | 'q' | 'title' | 'steps'>): Chain => ({ tone: null, pos: 50, area: '', split: null, findings: [], side: null, fixes: null, ...o });
export const CL_SPECS: Record<string, PromptSpec> = {
  childcare: {
    id: 'childcare', label: 'Đồng ý hay không', text: CL_PROMPT,
    questions: [{ n: 1, shape: 'verdict', q: 'To what extent do you agree or disagree?', sides: ['Phản đối', 'Đồng ý'] }],
    reqs: ['Đưa ra lập trường rõ ràng về yêu cầu được đề xuất.', 'Đánh giá tác động của yêu cầu, không bàn chung về việc học chăm sóc trẻ.', 'Xét phạm vi áp dụng cho tất cả phụ huynh.'],
    driver: 'Requiring every parent to complete childcare training',
    stakeholders: ['Phụ huynh', 'Trẻ em', 'Nơi làm việc', 'Đơn vị đào tạo', 'Chính phủ'],
    chains: CL_INITIAL,
  },
  alone: {
    id: 'alone', label: 'Nguyên nhân + đánh giá',
    text: 'In many countries, a growing number of young adults now choose to live alone. Why is this happening? Is this a positive or negative development?',
    questions: [{ n: 1, shape: 'cause', q: 'Why is this happening?' }, { n: 2, shape: 'verdict', q: 'Is this a positive or negative development?', sides: ['Tiêu cực', 'Tích cực'] }],
    reqs: ['Câu ①: giải thích vì sao người trẻ chọn sống một mình, không chỉ mô tả hiện tượng.', 'Câu ②: nói rõ đây là tích cực hay tiêu cực, và trong điều kiện nào.'],
    driver: 'Young adults choosing to live alone',
    stakeholders: ['Người trẻ', 'Gia đình', 'Chủ nhà / thị trường nhà ở', 'Chính phủ'],
    chains: [
      clMk({ id: 'a1', q: 1, title: 'Earlier incomes make independence affordable', steps: ['Young adults find city jobs earlier', 'They can pay rent without family help', 'Moving out becomes a realistic choice'], findings: [{ id: 'af1', kind: 'Hệ thống', text: 'Việc làm tập trung ở thành phố lớn: người trẻ rời quê để đi làm, nên sống một mình gần như bắt buộc.', side: null, target: 'all' }] }),
      clMk({ id: 'a2', q: 1, title: 'Privacy matters more than before', steps: ['Media celebrates personal freedom', 'Young people value their own space', ''] }),
      clMk({ id: 'a3', q: 2, tone: 'benefit', side: 'right', title: 'Living alone builds self-reliance', area: 'Năng lực → Tự quyết', steps: ['Living alone', 'Young adults manage bills and chores themselves', 'They become more independent'] }),
      clMk({ id: 'a4', q: 2, tone: 'cost', title: 'Isolation hurts mental health', area: 'Gắn kết → An toàn', steps: ['Living alone', 'Fewer daily conversations at home', 'Loneliness increases'], findings: [{ id: 'af2', kind: 'Dài hạn', text: 'Nếu kéo dài, người trẻ ít kỹ năng sống chung, ảnh hưởng tới hôn nhân sau này.', side: null, target: 'all' }] }),
    ],
  },
  traffic: {
    id: 'traffic', label: 'Nguyên nhân + giải pháp',
    text: 'Many cities around the world have serious traffic problems. What are the causes of this? What can be done to solve it?',
    questions: [{ n: 1, shape: 'cause', q: 'What are the causes of this?' }, { n: 2, shape: 'solution', q: 'What can be done to solve it?' }],
    reqs: ['Câu ①: nêu 2–3 nguyên nhân đúng với phần lớn thành phố.', 'Câu ②: mỗi giải pháp phải xử lý một nguyên nhân ở câu ①.'],
    driver: 'Serious traffic congestion in cities',
    stakeholders: ['Người đi làm', 'Chính quyền thành phố', 'Doanh nghiệp vận tải', 'Cư dân'],
    chains: [
      clMk({ id: 't1', q: 1, title: 'More households own cars', steps: ['Incomes rise', 'More households buy private cars', 'More cars share the same roads at rush hour'], findings: [{ id: 'tf1', kind: 'Cá nhân', text: 'Xe riêng tiện và thể hiện địa vị, nên người ta chọn xe dù có xe buýt.', side: null, target: 'all' }] }),
      clMk({ id: 't2', q: 1, title: 'Public transport is unreliable', steps: ['Buses share lanes with cars', 'Buses are often late', 'Commuters give up on buses and drive'] }),
      clMk({ id: 't3', q: 2, fixes: 't2', title: 'Dedicated bus lanes', steps: ['The city builds dedicated bus lanes', 'Buses run on time', 'Commuters switch from cars to buses'], findings: [{ id: 'tf2', kind: 'Khả thi', text: 'Cần ngân sách và mặt đường; phố cũ quá hẹp để tách làn.', side: null, target: 'all' }] }),
      clMk({ id: 't4', q: 2, title: 'Congestion charge', steps: ['Drivers pay to enter the centre at peak hours', 'Some trips move to other times', ''] }),
    ],
  },
  posneg: {
    id: 'posneg', label: 'Tích cực hay tiêu cực',
    text: 'More and more people are choosing to work from home. Is this a positive or negative development?',
    questions: [{ n: 1, shape: 'verdict', q: 'Is this a positive or negative development?', sides: ['Tiêu cực', 'Tích cực'] }],
    reqs: ['Nói rõ đây là tích cực hay tiêu cực, và trong điều kiện nào.', 'Đánh giá chính xu hướng làm việc tại nhà, không bàn chung về công nghệ.'],
    driver: 'More people working from home',
    stakeholders: ['Người lao động', 'Công ty', 'Gia đình', 'Thành phố'],
    chains: [
      clMk({ id: 'p1', q: 1, tone: 'benefit', side: 'right', title: 'Commuting time returns to workers', area: 'Vật chất → Gắn kết', steps: ['Working from home', 'No daily commute', 'Workers spend the saved hours with family'] }),
      clMk({ id: 'p2', q: 1, tone: 'cost', title: 'Junior staff learn less', area: 'Năng lực', steps: ['Teams rarely meet in person', 'New staff cannot watch experienced colleagues', ''] }),
    ],
  },
  views: {
    id: 'views', label: 'Hai quan điểm + ý kiến',
    text: 'Some people think university students should study whatever they like. Others believe they should only study subjects that will be useful in the future, such as science and technology. Discuss both views and give your opinion.',
    questions: [{ n: 1, shape: 'verdict', q: 'Discuss both views and give your opinion.', sides: ['Môn có ích', 'Môn yêu thích'] }],
    reqs: ['Bàn cả hai quan điểm, mỗi bên có lý do riêng.', 'Nêu rõ bạn nghiêng về bên nào, và trong điều kiện nào.'],
    driver: 'Letting students choose any subject they like',
    stakeholders: ['Sinh viên', 'Trường đại học', 'Nhà tuyển dụng', 'Xã hội'],
    chains: [
      clMk({ id: 'v1', q: 1, tone: 'benefit', side: 'right', title: 'Interest keeps students going', area: 'Năng lực', steps: ['Students choose subjects they enjoy', 'They study harder and longer', 'They finish with deeper skills'] }),
      clMk({ id: 'v2', q: 1, tone: 'cost', side: 'left', title: 'Graduates struggle to find jobs', area: 'Vật chất', steps: ['Many choose subjects with few jobs', 'Too many graduates compete for the same roles', ''] }),
    ],
  },
  outweigh: {
    id: 'outweigh', label: 'Ưu điểm hơn nhược điểm?',
    text: 'Many young people now take a gap year before starting university. Do the advantages of this outweigh the disadvantages?',
    questions: [{ n: 1, shape: 'verdict', q: 'Do the advantages outweigh the disadvantages?', sides: ['Nhược điểm', 'Ưu điểm'] }],
    reqs: ['So sánh ưu và nhược điểm, rồi nói bên nào nặng hơn.', 'Nói rõ điều kiện khiến ưu điểm (hoặc nhược điểm) thắng.'],
    driver: 'Taking a gap year before university',
    stakeholders: ['Học sinh', 'Gia đình', 'Trường đại học', 'Nhà tuyển dụng'],
    chains: [
      clMk({ id: 'g1', q: 1, tone: 'benefit', side: 'right', title: 'Students arrive with clearer goals', area: 'Năng lực → Tự quyết', steps: ['A year of work or travel', 'Students learn what they want', 'They pick a better-fitting course'] }),
      clMk({ id: 'g2', q: 1, tone: 'cost', title: 'Some never go back', area: 'Năng lực', steps: ['A year away from study', 'Study habits fade', ''] }),
    ],
  },
  tourism: {
    id: 'tourism', label: 'Vấn đề + chọn phía',
    text: 'Tourism is growing fast in many popular cities. What problems does this cause? Do you agree that the number of tourists should be limited?',
    questions: [{ n: 1, shape: 'problem', q: 'What problems does this cause?' }, { n: 2, shape: 'verdict', q: 'Do you agree that the number of tourists should be limited?', sides: ['Phản đối', 'Đồng ý'] }],
    reqs: ['Câu ①: nêu vấn đề do du lịch tăng nhanh gây ra.', 'Câu ②: nói rõ có nên giới hạn khách hay không, và trong điều kiện nào.'],
    driver: 'Fast-growing tourism in popular cities',
    stakeholders: ['Cư dân', 'Doanh nghiệp du lịch', 'Du khách', 'Chính quyền'],
    chains: [
      clMk({ id: 'u1', q: 1, title: 'Rents push locals out', steps: ['Owners rent flats to tourists', 'Fewer homes for residents', 'Rents rise in the centre'] }),
      clMk({ id: 'u2', q: 2, tone: 'benefit', side: 'right', title: 'A cap protects residents', area: 'Vật chất → An toàn', steps: ['The city caps tourist numbers', 'Fewer short-term rentals are needed', 'Homes return to residents'] }),
      clMk({ id: 'u3', q: 2, tone: 'cost', title: 'Local jobs depend on visitors', area: 'Vật chất', steps: ['Fewer tourists', 'Hotels and shops earn less', ''] }),
    ],
  },
  carfix: {
    id: 'carfix', label: 'Vấn đề kế hoạch + giải pháp',
    text: 'A government plans to ban private cars from the city centre. What problems might this cause? How can these problems be solved?',
    questions: [{ n: 1, shape: 'planproblem', q: 'What problems might this cause?' }, { n: 2, shape: 'solution', q: 'How can these problems be solved?' }],
    reqs: ['Câu ①: nêu vấn đề do lệnh cấm gây ra.', 'Câu ②: mỗi giải pháp phải xử lý một vấn đề ở câu ①.'],
    driver: 'Banning private cars from the city centre',
    stakeholders: ['Người đi làm', 'Cửa hàng trung tâm', 'Người già, người khuyết tật', 'Chính quyền'],
    chains: [
      clMk({ id: 'x1', q: 1, title: 'Shops lose customers', steps: ['Cars are banned from the centre', 'Shoppers who drive go to malls outside', 'Central shops lose sales'] }),
      clMk({ id: 'x2', q: 2, fixes: 'x1', title: 'Park-and-ride buses', steps: ['The city builds car parks at the edge', 'Free buses run to the centre', 'Shoppers still reach central shops'] }),
    ],
  },
  obesity: {
    id: 'obesity', label: 'Vấn đề + giải pháp',
    text: 'Obesity is rising in many countries. What problems does this cause? What can be done to tackle it?',
    questions: [{ n: 1, shape: 'problem', q: 'What problems does this cause?' }, { n: 2, shape: 'solution', q: 'What can be done to tackle it?' }],
    reqs: ['Câu ①: nêu vấn đề do béo phì gây ra, không giải thích vì sao béo phì tăng.', 'Câu ②: mỗi giải pháp phải xử lý một vấn đề ở câu ①.'],
    driver: 'Rising obesity rates',
    stakeholders: ['Người béo phì', 'Gia đình', 'Hệ thống y tế', 'Nơi làm việc', 'Chính phủ'],
    chains: [
      clMk({ id: 'o1', q: 1, title: 'Health systems carry the cost', steps: ['More people become obese', 'More cases of diabetes and heart disease', 'Hospitals spend more on long-term treatment'], findings: [{ id: 'of1', kind: 'Dài hạn', text: 'Bệnh mãn tính kéo dài hàng chục năm, nên chi phí tích tụ chứ không mất đi.', side: null, target: 'all' }] }),
      clMk({ id: 'o2', q: 1, title: 'Workers lose productive years', steps: ['Obesity-related illness', 'Workers take more sick days', ''] }),
      clMk({ id: 'o3', q: 2, fixes: 'o1', title: 'Tax on sugary drinks', steps: ['The government taxes sugary drinks', 'Prices rise', 'People buy fewer of them'], findings: [{ id: 'of2', kind: 'Quy mô', text: 'Áp dụng cả nước thì nhà sản xuất giảm đường để giữ giá, tác động lan ra cả người không đổi thói quen.', side: null, target: 'all' }] }),
    ],
  },
  rural: {
    id: 'rural', label: 'Nguyên nhân + ảnh hưởng',
    text: 'More and more young people are leaving rural areas to live in cities. What are the causes of this? What effects does it have?',
    questions: [{ n: 1, shape: 'cause', q: 'What are the causes of this?' }, { n: 2, shape: 'effect', q: 'What effects does it have?' }],
    reqs: ['Câu ①: giải thích vì sao người trẻ rời nông thôn.', 'Câu ②: nêu ảnh hưởng tới nông thôn, thành phố hoặc chính người trẻ.'],
    driver: 'Young people moving from rural areas to cities',
    stakeholders: ['Người trẻ', 'Gia đình ở quê', 'Làng quê', 'Thành phố'],
    chains: [
      clMk({ id: 'r1', q: 1, title: 'Jobs are in the cities', steps: ['Factories and offices cluster in cities', 'Rural jobs pay less', 'Young people move to earn more'], findings: [{ id: 'rf1', kind: 'Hệ thống', text: 'Đầu tư tập trung ở thành phố lớn, nên việc tốt ở quê ngày càng ít.', side: null, target: 'all' }] }),
      clMk({ id: 'r2', q: 2, title: 'Villages age quickly', steps: ['Young people leave', 'Mostly older residents remain', 'Farms and local services lack workers'] }),
    ],
  },
  carban: {
    id: 'carban', label: 'Vấn đề của kế hoạch',
    text: 'A government plans to ban private cars from the city centre. What problems might this cause?',
    questions: [{ n: 1, shape: 'planproblem', q: 'What problems might this cause?' }],
    reqs: ['Nêu vấn đề do lệnh cấm gây ra, không bàn chung về ô tô.', 'Xét ai bị ảnh hưởng nhiều nhất khi kế hoạch được áp dụng.'],
    driver: 'Banning private cars from the city centre',
    stakeholders: ['Người đi làm', 'Cửa hàng trung tâm', 'Người già, người khuyết tật', 'Chính quyền'],
    chains: [
      clMk({ id: 'k1', q: 1, title: 'Shops lose customers', steps: ['Cars are banned from the centre', 'Shoppers who drive go to malls outside', 'Central shops lose sales'], findings: [{ id: 'kf1', kind: 'Khả thi', text: 'Nếu xe buýt vào trung tâm chưa đủ, người đi xe hơi không có lựa chọn thay thế.', side: null, target: 'all' }] }),
    ],
  },
};

/** Single-question verdict spec for prompts that have no question data yet. */
export function customSpec(text: string): PromptSpec {
  if (text === CL_PROMPT) return CL_SPECS.childcare;
  return { id: 'custom', text, questions: [{ n: 1, shape: 'verdict', q: '', sides: ['Phản đối', 'Đồng ý'] }] };
}
