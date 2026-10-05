/**
 * Vocabulary sets. MOCK: hand-written topics and pre-written practice paragraphs. In production,
 * sets are imported and paragraphs are generated on demand from the phrases the student ticks.
 */
import type { GuidedSample } from '../guided/data';

export interface VocabItem {
  en: string;
  ipa: string;
  pos: string;
  vi: string;
  /** "Hiểu sâu": usage notes in Vietnamese. */
  deep: string;
  colls: string[];
  ex: string[];
}

export interface VocabTopic {
  id: string;
  name: string;
  vi: string;
  ill?: string;
  items: VocabItem[];
  samples: GuidedSample[];
}

export type SkillIcon = 'pen' | 'chart' | 'message';

export interface VocabSkill {
  id: 'task2' | 'task1' | 'speaking';
  pillar: string;
  soft: string;
  ill: string;
  icon: SkillIcon;
  eyebrow: string;
  title: string;
  desc: string;
  topics: VocabTopic[];
}

const vbMk = (en: string, ipa: string, pos: string, vi: string, deep: string, colls: string[], ex: string[]): VocabItem => ({ en, ipa, pos, vi, deep, colls, ex });

const VB_T2_TOPICS: VocabTopic[] = [
  {
    id: 'education', name: 'Education', vi: 'Giáo dục', ill: 'il-study',
    items: [
      vbMk('equip students with', '/ɪˈkwɪp ˈstjuːdnts wɪð/', 'verb phrase', 'trang bị cho học sinh / sinh viên', 'Equip nghĩa gốc là trang bị đồ dùng; trong bài viết thường dùng nghĩa bóng: trang bị kỹ năng, kiến thức. Hai cấu trúc hay gặp: equip sb with sth và equip sb to do sth.', ['equip students with skills', 'be well equipped for', 'equip sb for life'], ['Schools should equip students with the skills they need for everyday life.', 'Many graduates feel poorly equipped for the workplace.']),
      vbMk('bridge the gap', '/brɪdʒ ðə ɡæp/', 'idiom', 'thu hẹp khoảng cách', 'Hình ảnh "bắc cầu qua khoảng trống". Thường đi với between A and B. Tự nhiên hơn "reduce the difference" trong văn viết học thuật.', ['bridge the gap between A and B', 'bridge the skills gap', 'the gap widens'], ['Internships can help bridge the gap between university and work.', 'Online courses may bridge the gap for students in rural areas.']),
      vbMk('rote learning', '/rəʊt ˈlɜːnɪŋ/', 'noun', 'học vẹt', 'Học thuộc mà không hiểu. Hay dùng để phê phán hệ thống thi cử, đặt đối lập với critical thinking hoặc deep understanding.', ['rely on rote learning', 'learn by rote', 'rote memorisation'], ['Exam-focused systems often rely on rote learning.', 'Students who learn by rote may forget everything after the test.']),
      vbMk('critical thinking', '/ˈkrɪtɪkl ˈθɪŋkɪŋ/', 'noun', 'tư duy phản biện', 'Không phải "chỉ trích" (criticise). Là khả năng đánh giá thông tin và lập luận trước khi tin. Danh từ không đếm được, không thêm "a".', ['develop critical thinking', 'critical thinking skills', 'encourage critical thinking'], ['Debates help students develop critical thinking.', 'Employers value critical thinking more than memorised facts.']),
      vbMk('a well-rounded education', '/ə ˌwel ˈraʊndɪd ˌedʒuˈkeɪʃn/', 'noun phrase', 'nền giáo dục toàn diện', 'Well-rounded = phát triển đều nhiều mặt: học thuật, nghệ thuật, thể thao, kỹ năng sống. Cũng dùng cho người: a well-rounded student.', ['receive a well-rounded education', 'a well-rounded individual'], ['Art and music are part of a well-rounded education.', 'Universities look for well-rounded applicants.']),
      vbMk('lifelong learning', '/ˌlaɪflɒŋ ˈlɜːnɪŋ/', 'noun', 'học tập suốt đời', 'Tiếp tục học sau khi rời trường, thường để theo kịp thay đổi của công việc và công nghệ. Hợp với lập luận Dài hạn.', ['promote lifelong learning', 'a culture of lifelong learning'], ['Fast technological change makes lifelong learning essential.', 'Governments should fund lifelong learning for older workers.']),
      vbMk('tuition fees', '/tjuˈɪʃn fiːz/', 'noun', 'học phí', 'Thường ở dạng số nhiều. Phân biệt với living costs (chi phí sinh hoạt). Abolish / scrap tuition fees = bỏ học phí.', ['pay tuition fees', 'abolish tuition fees', 'rising tuition fees'], ['Rising tuition fees discourage poorer students.', 'Some countries have abolished tuition fees altogether.']),
      vbMk('widen inequality', '/ˈwaɪdn ˌɪnɪˈkwɒləti/', 'verb phrase', 'làm gia tăng bất bình đẳng', 'Widen = làm rộng ra. Cặp đối: widen ↔ narrow / reduce inequality. Hay đi với between rich and poor.', ['widen the gap', 'narrow inequality', 'social inequality'], ['Private tutoring can widen inequality between rich and poor families.', 'Free schooling helps narrow inequality.']),
      vbMk('vocational training', '/vəʊˈkeɪʃənl ˈtreɪnɪŋ/', 'noun', 'đào tạo nghề', 'Đào tạo kỹ năng cho một nghề cụ thể (thợ điện, đầu bếp…), khác với học thuật đại học. Vocational school = trường nghề.', ['vocational training programmes', 'vocational school', 'vocational qualifications'], ['Vocational training offers a faster route into work.', 'Good vocational training can lead to well-paid, secure jobs.']),
      vbMk('academic performance', '/ˌækəˈdemɪk pəˈfɔːməns/', 'noun', 'kết quả học tập', 'Trang trọng hơn grades. Thường đi với improve, affect, harm.', ['improve academic performance', 'poor academic performance', 'affect academic performance'], ['Lack of sleep can harm academic performance.', 'Smaller classes often improve academic performance.']),
    ],
    samples: [
      {
        id: 'edu-1',
        prompt: 'Some people think universities should provide graduates with the knowledge and skills needed in the workplace. Others think the true function of a university is to give access to knowledge for its own sake. Discuss both views and give your opinion.',
        paragraphs: [[
          { vocab: ['equip students with'], en: 'Many argue that universities should equip students with practical skills that employers value.', vi: 'Nhiều người cho rằng các trường đại học nên trang bị cho sinh viên những kỹ năng thực tế mà nhà tuyển dụng coi trọng.' },
          { vocab: ['bridge the gap'], en: 'In many countries, graduates learn very different things from what companies need, and courses linked to real jobs can help bridge the gap.', vi: 'Ở nhiều nước, những gì sinh viên học rất khác với những gì doanh nghiệp cần, và các khoá học gắn với công việc thực tế có thể giúp thu hẹp khoảng cách đó.' },
          { vocab: ['rote learning', 'critical thinking'], en: 'However, a degree built only around job skills may encourage rote learning rather than critical thinking.', vi: 'Tuy nhiên, một tấm bằng chỉ xoay quanh kỹ năng nghề có thể khuyến khích học vẹt thay vì tư duy phản biện.' },
          { vocab: ['a well-rounded education'], en: 'A well-rounded education, by contrast, prepares people for jobs that do not exist yet.', vi: 'Ngược lại, một nền giáo dục toàn diện chuẩn bị cho con người những công việc hiện chưa tồn tại.' },
          { vocab: ['lifelong learning'], en: 'For this reason, universities should treat practical skills as one part of lifelong learning, not as their only goal.', vi: 'Vì vậy, các trường đại học nên coi kỹ năng thực tế là một phần của việc học tập suốt đời, chứ không phải mục tiêu duy nhất.' },
        ]],
      },
      {
        id: 'edu-2',
        prompt: 'In some countries, university education is free for all students. Do the advantages of this outweigh the disadvantages?',
        paragraphs: [[
          { vocab: ['tuition fees'], en: 'Removing tuition fees would allow talented students from poor families to attend university.', vi: 'Bỏ học phí sẽ giúp những sinh viên giỏi từ gia đình nghèo được vào đại học.' },
          { vocab: ['widen inequality'], en: 'Without this support, rising costs could widen inequality, because only wealthy families could afford a degree.', vi: 'Nếu không có sự hỗ trợ này, chi phí tăng có thể làm gia tăng bất bình đẳng, vì chỉ những gia đình giàu mới đủ tiền cho con học đại học.' },
          { vocab: ['vocational training'], en: 'However, free places may lead many students to choose university even when vocational training would suit them better.', vi: 'Tuy nhiên, học miễn phí có thể khiến nhiều học sinh chọn đại học ngay cả khi đào tạo nghề phù hợp với họ hơn.' },
          { vocab: ['academic performance'], en: 'If too many students enrol, classes grow larger and the academic performance of the whole group may fall.', vi: 'Nếu quá nhiều sinh viên nhập học, lớp học đông hơn và kết quả học tập của cả nhóm có thể đi xuống.' },
        ]],
      },
    ],
  },
  {
    id: 'environment', name: 'Environment', vi: 'Môi trường', ill: 'il-knowledge',
    items: [
      vbMk('take drastic measures', '/teɪk ˈdræstɪk ˈmeʒəz/', 'verb phrase', 'có biện pháp mạnh', 'Drastic = mạnh tay, quyết liệt. Measures luôn ở số nhiều trong cụm này. Gần nghĩa: take decisive action.', ['take drastic measures to', 'drastic action', 'drastic cuts'], ['Governments must take drastic measures to cut pollution.', 'Without drastic action, cities will become unliveable.']),
      vbMk('carbon emissions', '/ˈkɑːbən iˈmɪʃnz/', 'noun', 'lượng khí thải carbon', 'Emissions thường số nhiều. Động từ hay đi kèm: cut, reduce, curb. Liên quan: carbon footprint (dấu chân carbon của một người hay một sản phẩm).', ['cut carbon emissions', 'curb emissions', 'carbon footprint'], ['Factories must cut carbon emissions by half.', 'Flying is a major source of carbon emissions.']),
      vbMk('renewable energy', '/rɪˈnjuːəbl ˈenədʒi/', 'noun', 'năng lượng tái tạo', 'Năng lượng từ nguồn không cạn: gió, mặt trời, nước. Viết ngắn: renewables. Đối lập với fossil fuels.', ['invest in renewable energy', 'renewable energy sources', 'switch to renewables'], ['Many countries are investing heavily in renewable energy.', 'Renewable energy sources are becoming cheaper every year.']),
      vbMk('public transport', '/ˌpʌblɪk ˈtrænspɔːt/', 'noun', 'giao thông công cộng', 'Tiếng Anh–Anh; tiếng Anh–Mỹ là public transportation. Danh từ không đếm được: không viết "a public transport".', ['use public transport', 'rely on public transport', 'a public transport network'], ['Cheap public transport encourages people to leave their cars at home.', 'Rural areas often lack reliable public transport.']),
      vbMk('single-use plastic', '/ˌsɪŋɡl juːs ˈplæstɪk/', 'noun', 'nhựa dùng một lần', 'Túi, ống hút, chai dùng một lần rồi bỏ. Có gạch nối giữa single và use.', ['ban single-use plastic', 'cut down on single-use plastic'], ['Several countries have banned single-use plastic bags.', 'Supermarkets can cut down on single-use plastic packaging.']),
      vbMk('raise awareness', '/reɪz əˈweənəs/', 'verb phrase', 'nâng cao nhận thức', 'Đi với of hoặc about. Raise tự nhiên hơn increase trong cụm này.', ['raise awareness of', 'raise public awareness', 'an awareness campaign'], ['Campaigns can raise awareness of the dangers of air pollution.', 'Schools play a key role in raising public awareness.']),
      vbMk('environmentally friendly', '/ɪnˌvaɪrənˈmentəli ˈfrendli/', 'adjective', 'thân thiện với môi trường', 'Gần nghĩa: eco-friendly, green. Đứng trước danh từ: environmentally friendly products.', ['environmentally friendly products', 'an environmentally friendly alternative'], ['Consumers increasingly choose environmentally friendly products.', 'Cycling is an environmentally friendly way to commute.']),
      vbMk('long-term consequences', '/ˌlɒŋ ˈtɜːm ˈkɒnsɪkwənsɪz/', 'noun phrase', 'hậu quả lâu dài', 'Hợp với lập luận Dài hạn: cái giá không thấy ngay mà tích tụ dần. Thường đi với have hoặc serious.', ['have long-term consequences', 'serious long-term consequences'], ['Deforestation has serious long-term consequences for the climate.', 'Few people consider the long-term consequences of fast fashion.']),
    ],
    samples: [
      {
        id: 'env-1',
        prompt: 'Some people believe that individuals can do little to improve the environment and that only governments and large companies can make a real difference. To what extent do you agree or disagree?',
        paragraphs: [[
          { vocab: ['take drastic measures', 'carbon emissions'], en: 'It is true that governments can take drastic measures, such as taxing carbon emissions, that no individual could take alone.', vi: 'Đúng là chính phủ có thể đưa ra những biện pháp mạnh, như đánh thuế khí thải carbon, mà không cá nhân nào tự làm được.' },
          { vocab: ['renewable energy'], en: 'Large companies can also invest in renewable energy on a scale that ordinary people cannot match.', vi: 'Các công ty lớn cũng có thể đầu tư vào năng lượng tái tạo ở quy mô mà người bình thường không thể sánh được.' },
          { vocab: ['public transport', 'single-use plastic'], en: 'However, when millions of people switch to public transport or stop using single-use plastic, the combined effect is significant.', vi: 'Tuy nhiên, khi hàng triệu người chuyển sang giao thông công cộng hoặc bỏ nhựa dùng một lần, tác động cộng lại là rất đáng kể.' },
          { vocab: ['raise awareness', 'environmentally friendly'], en: 'Individual choices also raise awareness, which pushes companies to offer more environmentally friendly products.', vi: 'Lựa chọn của từng người còn giúp nâng cao nhận thức, từ đó buộc các công ty đưa ra nhiều sản phẩm thân thiện với môi trường hơn.' },
        ]],
      },
    ],
  },
];

const VB_T1_TOPICS: VocabTopic[] = [
  {
    id: 'trends', name: 'Trends', vi: 'Mô tả xu hướng',
    items: [
      vbMk('rise sharply', '/raɪz ˈʃɑːpli/', 'verb phrase', 'tăng mạnh', 'Sharply = nhanh và nhiều trong thời gian ngắn. Thay được bằng increase dramatically / significantly. Dạng danh từ: a sharp rise in sth.', ['rise sharply to', 'a sharp rise in', 'rise sharply between X and Y'], ['The number of visitors rose sharply to 2 million in 2015.', 'There was a sharp rise in sales after 2018.']),
      vbMk('fall steadily', '/fɔːl ˈstedɪli/', 'verb phrase', 'giảm đều', 'Steadily = đều đặn, không đột ngột. Dùng khi đường đi xuống liên tục qua nhiều năm. Danh từ: a steady fall / decline.', ['fall steadily from X to Y', 'a steady decline in'], ['Car sales fell steadily from 2010 to 2020.', 'The chart shows a steady decline in birth rates.']),
      vbMk('fluctuate', '/ˈflʌktʃueɪt/', 'verb', 'dao động, lên xuống thất thường', 'Dùng khi số liệu lên xuống nhiều lần, không theo một hướng. Thường đi với between X and Y hoặc around X.', ['fluctuate between X and Y', 'fluctuate around', 'fluctuations in'], ['Oil prices fluctuated between 40 and 60 dollars.', 'Visitor numbers fluctuated around 500 a day.']),
      vbMk('peak at', '/piːk æt/', 'verb phrase', 'đạt đỉnh ở mức', 'Peak (v) = lên tới điểm cao nhất. Đi với at + số liệu và in + năm. Danh từ: reach a peak of.', ['peak at X in', 'reach a peak of'], ['Sales peaked at 9,000 units in 2016.', 'Unemployment reached a peak of 12% in 2009.']),
      vbMk('remain stable', '/rɪˈmeɪn ˈsteɪbl/', 'verb phrase', 'giữ ổn định', 'Dùng khi đường gần như nằm ngang. Gần nghĩa: level off (sau khi tăng/giảm thì chững lại), stay the same.', ['remain stable at', 'level off at'], ['The figure remained stable at around 30% for five years.', 'After 2015, prices levelled off at 200 dollars.']),
    ],
    samples: [
      {
        id: 't1-trends-1',
        prompt: 'The line graph shows the number of visitors to a city museum between 2010 and 2020. Summarise the information by selecting and reporting the main features.',
        paragraphs: [[
          { vocab: ['rise sharply'], hl: ['rose sharply'], en: 'Visitor numbers rose sharply in the first five years, from 200,000 to 600,000.', vi: 'Số lượt khách tăng mạnh trong năm năm đầu, từ 200.000 lên 600.000.' },
          { vocab: ['peak at'], hl: ['peaked at'], en: 'The figure peaked at 650,000 in 2016.', vi: 'Con số này đạt đỉnh ở mức 650.000 vào năm 2016.' },
          { vocab: ['fluctuate'], hl: ['fluctuated'], en: 'Over the next three years, it fluctuated between 550,000 and 620,000.', vi: 'Trong ba năm tiếp theo, nó dao động trong khoảng 550.000 đến 620.000.' },
          { vocab: ['remain stable'], hl: ['remained stable'], en: 'By the end of the period, the number of visitors remained stable at about 600,000.', vi: 'Đến cuối giai đoạn, số lượt khách giữ ổn định ở khoảng 600.000.' },
        ]],
      },
    ],
  },
  {
    id: 'comparison', name: 'Comparison', vi: 'So sánh số liệu',
    items: [
      vbMk('twice as many as', '/twaɪs əz ˈmeni əz/', 'structure', 'gấp đôi (số lượng)', 'Dùng many với danh từ đếm được, much với không đếm được: twice as much money as. Gấp ba: three times as many as.', ['twice as many X as Y', 'three times as much as'], ['Twice as many men as women used the gym.', 'City A produced three times as much waste as City B.']),
      vbMk('account for', '/əˈkaʊnt fɔː/', 'verb phrase', 'chiếm (bao nhiêu phần trăm)', 'Rất hay dùng với biểu đồ tròn: X accounts for 30% of Y. Gần nghĩa: make up, represent.', ['account for X% of', 'make up', 'the largest share'], ['Coal accounted for 40% of total energy use.', 'Students made up a quarter of all visitors.']),
      vbMk('slightly higher than', '/ˈslaɪtli ˈhaɪə ðæn/', 'structure', 'cao hơn một chút', 'Slightly / marginally = chênh ít; considerably / significantly = chênh nhiều. Chọn trạng từ đúng mức chênh là cách ghi điểm Task 1.', ['slightly higher than', 'considerably lower than', 'marginally more'], ['The figure for France was slightly higher than that for Spain.', 'Spending on food was considerably lower than on housing.']),
      vbMk('in contrast', '/ɪn ˈkɒntrɑːst/', 'linking phrase', 'ngược lại', 'Nối hai câu có xu hướng trái nhau. Đầu câu, có dấu phẩy: In contrast, … Gần nghĩa: by contrast, whereas (nối trong một câu).', ['in contrast,', 'by contrast', 'whereas'], ['Sales in Asia grew. In contrast, sales in Europe fell.', 'Men preferred football, whereas women preferred tennis.']),
    ],
    samples: [],
  },
];

const VB_SP_TOPICS: VocabTopic[] = [
  {
    id: 'hobbies', name: 'Hobbies', vi: 'Sở thích',
    items: [
      vbMk('unwind', '/ʌnˈwaɪnd/', 'verb', 'thư giãn, xả hơi', 'Tự nhiên hơn relax trong văn nói. Thường đi sau after a long day.', ['unwind after work', 'a way to unwind'], ['Reading helps me unwind after a long day.', 'Cooking is my way to unwind at weekends.']),
      vbMk('be really into', '/bi ˈrɪəli ˈɪntə/', 'phrase', 'rất mê, rất thích', 'Văn nói, thân mật. Thay cho I like … very much. Theo sau là danh từ hoặc V-ing.', ['be really into sth', 'get into sth'], ["I'm really into photography at the moment.", 'I got into running a few years ago.']),
      vbMk('pick up a hobby', '/pɪk ʌp ə ˈhɒbi/', 'verb phrase', 'bắt đầu một sở thích', 'Pick up = bắt đầu học/làm một cách tự nhiên, không bài bản. Pick up a language = học lỏm được một ngôn ngữ.', ['pick up a hobby', 'pick up a skill', 'take up'], ['I picked up drawing during the lockdown.', 'Many people take up yoga to reduce stress.']),
      vbMk('take my mind off', '/teɪk maɪ maɪnd ɒf/', 'phrase', 'giúp quên đi (chuyện căng thẳng)', 'Take one\'s mind off sth = khiến không nghĩ tới chuyện gì đó nữa. Rất hợp để giải thích vì sao thích một sở thích.', ['take my mind off work', 'take my mind off things'], ['Gardening takes my mind off work.', 'Music really takes my mind off things.']),
    ],
    samples: [
      {
        id: 'sp-hobbies-1',
        prompt: 'Speaking Part 1: What do you like to do in your free time?',
        paragraphs: [[
          { vocab: ['be really into'], hl: ['really into'], en: "To be honest, I'm really into photography these days.", vi: 'Thật ra dạo này mình rất mê chụp ảnh.' },
          { vocab: ['pick up a hobby'], en: 'I decided to pick up a hobby during the pandemic, when I had a lot of time at home.', vi: 'Mình quyết định bắt đầu một sở thích hồi dịch, lúc có nhiều thời gian ở nhà.' },
          { vocab: ['unwind', 'take my mind off'], en: 'Walking around with my camera helps me unwind and take my mind off work.', vi: 'Đi dạo với máy ảnh giúp mình thư giãn và quên đi chuyện công việc.' },
        ]],
      },
    ],
  },
  {
    id: 'hometown', name: 'Hometown', vi: 'Quê nhà',
    items: [
      vbMk('bustling', '/ˈbʌslɪŋ/', 'adjective', 'nhộn nhịp, tấp nập', 'Tả nơi đông người, nhiều hoạt động; sắc thái tích cực hơn crowded.', ['a bustling city', 'a bustling market'], ['Hanoi is a bustling city full of street food.', 'The town centre is bustling at weekends.']),
      vbMk('laid-back', '/ˌleɪd ˈbæk/', 'adjective', 'thong thả, thoải mái', 'Tả nơi chốn hoặc con người không vội vã. Đối lập với hectic, fast-paced.', ['a laid-back atmosphere', 'a laid-back lifestyle'], ['My hometown has a laid-back atmosphere.', 'People there have a very laid-back lifestyle.']),
      vbMk("a stone's throw from", "/ə ˈstəʊnz θrəʊ frəm/", 'idiom', 'rất gần, chỉ cách một đoạn ngắn', 'Thân mật, hợp với Speaking. Trong bài viết Task 2 nên dùng very close to.', ["just a stone's throw from"], ["My house is just a stone's throw from the beach.", "The school is a stone's throw from the market."]),
    ],
    samples: [],
  },
];

export const VB_SKILLS: VocabSkill[] = [
  { id: 'task2', pillar: 'var(--brand-yellow, #FFE17C)', soft: 'var(--brand-yellow-soft, #FFF6DA)', ill: '/assets/illustrations/il-writing.svg', icon: 'pen', eyebrow: 'Writing Task 2', title: 'Từ vựng Task 2', desc: 'Từ và collocation theo chủ đề nghị luận: giáo dục, môi trường, công nghệ…', topics: VB_T2_TOPICS },
  { id: 'task1', pillar: 'var(--brand-orange, #FFB760)', soft: 'var(--brand-orange-soft, #FFEEDA)', ill: '/assets/illustrations/il-progress.svg', icon: 'chart', eyebrow: 'Writing Task 1', title: 'Từ vựng Task 1', desc: 'Ngôn ngữ mô tả xu hướng, so sánh số liệu, quy trình và bản đồ.', topics: VB_T1_TOPICS },
  { id: 'speaking', pillar: 'var(--brand-sky, #97DBEC)', soft: 'var(--brand-sky-soft, #E4F5FA)', ill: '/assets/illustrations/il-conversation.svg', icon: 'message', eyebrow: 'Speaking', title: 'Từ vựng Speaking', desc: 'Cụm tự nhiên cho Part 1, 2, 3: sở thích, quê nhà, công việc…', topics: VB_SP_TOPICS },
];

/**
 * Theme of each phrase inside its topic, so many ticked phrases can be split into paragraphs that belong
 * together without an AI call. New phrases need a theme here (a classifier could suggest one at import time).
 */
const VB_THEMES: Record<string, string[]> = {
  'Cách học và tư duy': ['rote learning', 'critical thinking', 'academic performance'],
  'Kỹ năng cho tương lai': ['equip students with', 'a well-rounded education', 'lifelong learning', 'vocational training'],
  'Cơ hội và công bằng': ['tuition fees', 'widen inequality', 'bridge the gap'],
  'Nguyên nhân và tác hại': ['carbon emissions', 'single-use plastic', 'long-term consequences'],
  'Giải pháp cho môi trường': ['take drastic measures', 'renewable energy', 'public transport', 'raise awareness', 'environmentally friendly'],
  'Mô tả xu hướng': ['rise sharply', 'fall steadily', 'fluctuate', 'peak at', 'remain stable'],
  'So sánh số liệu': ['twice as many as', 'account for', 'slightly higher than', 'in contrast'],
  'Sở thích': ['unwind', 'be really into', 'pick up a hobby', 'take my mind off'],
  'Quê nhà': ['bustling', 'laid-back', "a stone's throw from"],
};
const THEME_OF = new Map(Object.entries(VB_THEMES).flatMap(([theme, ps]) => ps.map((p) => [p, theme] as [string, string])));

export interface VocabGroup { name: string; phrases: string[] }
export const GROUP_MAX = 6;

/**
 * Splits ticked phrases into paragraph-sized groups (≤ GROUP_MAX) of the same theme, in topic order.
 * Small groups (< 3) are merged with a neighbour from the same topic when they fit together.
 */
export function groupPhrases(skill: VocabSkill, phrases: string[]): VocabGroup[] {
  if (phrases.length <= GROUP_MAX) return [{ name: '', phrases }];
  const groups: (VocabGroup & { topic: string })[] = [];
  skill.topics.forEach((t) => {
    const mine = t.items.map((i) => i.en).filter((p) => phrases.includes(p));
    const byTheme = new Map<string, string[]>();
    mine.forEach((p) => { const th = THEME_OF.get(p) || t.vi; byTheme.set(th, [...(byTheme.get(th) || []), p]); });
    byTheme.forEach((ps, name) => {
      // Split an oversized theme evenly, e.g. 8 → 4 + 4 rather than 6 + 2.
      const n = Math.ceil(ps.length / GROUP_MAX), size = Math.ceil(ps.length / n);
      for (let i = 0; i < ps.length; i += size) groups.push({ name, topic: t.id, phrases: ps.slice(i, i + size) });
    });
  });
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    if (g.phrases.length >= 3) continue;
    const near = [groups[i - 1], groups[i + 1]].filter((x) => x && x.topic === g.topic && x.phrases.length + g.phrases.length <= GROUP_MAX)
      .sort((a, b) => a.phrases.length - b.phrases.length)[0];
    if (near) {
      const before = groups.indexOf(near) < i;
      near.phrases = before ? [...near.phrases, ...g.phrases] : [...g.phrases, ...near.phrases];
      near.name = before ? near.name + ' · ' + g.name : g.name + ' · ' + near.name;
      groups.splice(i, 1); i--;
    }
  }
  return groups.map(({ name, phrases: ps }) => ({ name, phrases: ps }));
}
