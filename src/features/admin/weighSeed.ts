/* eslint-disable */
/**
 * Test data for screen ② "Cân": one attempt per prompt type, screen ① filled the way a strong student would fill it
 * (many cells, findings, Scope cases, extra rows, awkward cases on purpose). Used by /admin/test-weigh.
 * Same data as scripts/seed-weigh-tests.js.
 */
export interface WeighSeed { promptId: string; label: string; chains: any[]; mapExtras: any }

export function weighSeeds(): WeighSeed[] {
  const id = (p: string = '') => p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const STEM: Record<string, string> = {
    'Vật chất': 'tốn thêm hay tiết kiệm được gì: tiền, thời gian, công sức?',
    'An toàn': 'ảnh hưởng thế nào đến sức khỏe, sự ổn định hay rủi ro?',
    'Gắn kết & Bản sắc': 'thay đổi gì trong quan hệ với người khác, hoặc cách họ hiểu về chính mình?',
    'Năng lực': 'mở ra hay đóng lại cơ hội học hỏi và kỹ năng nào về sau?',
    'Tự quyết': 'thay đổi khả năng lựa chọn và kiểm soát của họ thế nào?',
  };
  const cellQ = (r: string, c: string, d: string) => 'Với ' + r + ', việc "' + d + '" ' + (STEM[c] || 'ảnh hưởng thế nào đến «' + c + '»?');
  const f = (kind: string, text: string, side: any = null, target: any = 'all') => ({ id: id('f'), kind, text, side, target });
  /** A verdict chain: driver text first, then the student's steps. */
  const V = (drvText: string, cell: [string, string] | null, steps: string[], o: any = {}) => ({
    id: id('c'), q: o.q || 1, title: o.title || '', tone: o.side === 'left' ? 'cost' : 'benefit', pos: 50, area: cell ? cell[1] : o.area || '',
    steps: [drvText, ...steps], split: o.split || null, findings: o.findings || [], side: o.side ?? null, fixes: null, drv: o.drv || null,
    cell: cell ? { r: cell[0], c: cell[1], q: cellQ(cell[0], cell[1], drvText) } : null,
  });
  const split = (noun: string, at: number, a: any, b: any) => ({ at, noun, branches: [a, b] });
  const br = (label: string, steps: string[], side: any) => ({ label, steps, side });

  const T: WeighSeed[] = [];

  // 1 ---- Agree or Disagree, one driver -------------------------------------------------------------------------
  {
    const D = 'Requiring every parent to complete childcare training';
    T.push({ promptId: 'childcare-training', label: 'Đồng ý / Phản đối · một driver', mapExtras: { 1: { rows: ['Bố mẹ đơn thân, làm ca'], cols: [] } }, chains: [
      V(D, ['Trẻ em', 'An toàn'], ['Bố mẹ học sơ cứu, cách cho trẻ sơ sinh ngủ an toàn', 'nhận ra sớm dấu hiệu sốt cao, hóc dị vật', 'ít ca tai nạn trong nhà phải nhập viện'], { side: 'right', findings: [f('With/Without', 'Không có khoá học, phần lớn bố mẹ học từ mạng xã hội, nơi lời khuyên sai lan rất nhanh.', 'right'), f('Quy mô', 'Tai nạn trong nhà là nguyên nhân thương tích hàng đầu ở trẻ dưới 5 tuổi.', 'right')] }),
      V(D, ['Trẻ em', 'An toàn'], ['Khoá học dạy theo một chuẩn chung', 'bố mẹ tin chứng chỉ hơn trực giác với chính con mình', 'bỏ qua dấu hiệu khác thường không có trong giáo trình'], { side: 'left', findings: [f('Scope', 'Chỉ đúng nếu khoá học ngắn, toàn lý thuyết; khoá có thực hành tình huống thì ngược lại.', 'right')] }),
      V(D, ['Phụ huynh', 'Vật chất'], ['Mất học phí và vài buổi tối mỗi tuần', 'gia đình thu nhập thấp phải cắt giờ làm thêm', 'áp lực tiền bạc đúng những tháng đầu có con'], { side: 'left', findings: [f('Khả thi', 'Nếu nhà nước trả học phí và cho học online, chi phí gần như bằng không.', 'right')] }),
      V(D, ['Phụ huynh', 'Gắn kết & Bản sắc'], ['Bố mẹ hiểu các giai đoạn phát triển tâm lý của con'], { split: split('gia đình', 1, br('Bố mẹ trẻ, con đầu lòng', ['bớt hoảng khi con quấy khóc', 'vợ chồng ít cãi nhau vì cách nuôi con'], 'right'), br('Gia đình nhiều thế hệ', ['kiến thức mới va chạm với cách nuôi của ông bà', 'mâu thuẫn trong nhà tăng'], 'left')) }),
      V(D, ['Phụ huynh', 'Tự quyết'], ['Nhà nước bắt mọi người nuôi con theo một khuôn', 'bố mẹ mất quyền nuôi con theo văn hoá, tôn giáo của mình', 'cảm giác bị coi là không đủ tư cách làm cha mẹ'], { side: 'left', findings: [f('Dài hạn', 'Về lâu dài, lòng tin vào các chính sách gia đình giảm.', 'left')] }),
      V(D, ['Trẻ em', 'Năng lực'], ['Bố mẹ biết chơi và nói chuyện với con đúng giai đoạn', 'trẻ được kích thích ngôn ngữ sớm', 'vào lớp 1 với vốn từ và khả năng tập trung tốt hơn'], { side: 'right', findings: [f('Dài hạn', 'Khoảng cách ngôn ngữ trước 5 tuổi kéo theo khoảng cách học lực nhiều năm.', 'right')] }),
      V(D, ['Nơi làm việc', 'Vật chất'], ['Nhân viên mới có con xin nghỉ để đi học', 'công ty nhỏ thiếu người trong ca', 'chủ ngại tuyển người sắp có con'], {}),
      V(D, ['Chính phủ', 'Vật chất'], ['Ít ca cấp cứu nhi do tai nạn trong nhà', 'chi phí y tế công giảm', 'tiền tiết kiệm bù được chi phí mở lớp'], { side: 'right', findings: [f('Quy mô', 'Chỉ bù được nếu khoá học chạm tới đa số gia đình.')] }),
      V(D, ['Bố mẹ đơn thân, làm ca', 'Vật chất'], ['Lịch học cố định buổi tối', 'người làm ca đêm không đi học được', 'bị phạt hoặc bị ghi là không tuân thủ'], { side: 'left' }),
      V(D, null, ['Giảng viên gặp trực tiếp từng gia đình', 'nhận ra nhà có dấu hiệu bạo lực', 'chuyển cho công tác xã hội can thiệp sớm'], { title: 'Phát hiện bạo hành sớm', area: 'An toàn', side: 'right' }),
      V(D, ['Đơn vị đào tạo', 'Năng lực'], ['Nhu cầu mở lớp tăng vọt trong thời gian ngắn', 'nhiều trung tâm kém chất lượng ra đời', 'có chứng chỉ nhưng không có kiến thức'], { side: 'left', findings: [f('Khả thi', 'Cần cơ quan kiểm định; không có thì yêu cầu này chỉ là hình thức.', 'left')] }),
    ] });
  }

  // 2 ---- Positive or Negative Development ----------------------------------------------------------------------
  {
    const D = 'More people working from home';
    T.push({ promptId: 'working-from-home', label: 'Tích cực / Tiêu cực', mapExtras: { 1: { rows: ['Nhân viên mới ra trường'], cols: [] } }, chains: [
      V(D, ['Người lao động', 'Vật chất'], ['Không mất 1–2 tiếng đi lại mỗi ngày', 'đỡ tiền xăng xe, ăn trưa ngoài', 'thu nhập thực tế tăng'], { side: 'right', findings: [f('Quy mô', 'Rõ nhất ở các thành phố tắc đường như Hà Nội, TP.HCM.', 'right')] }),
      V(D, ['Người lao động', 'Gắn kết & Bản sắc'], ['Ít gặp đồng nghiệp ngoài các cuộc họp', 'mất những cuộc trò chuyện ngẫu nhiên', 'thấy cô đơn, ít gắn bó với công ty'], { side: 'left', findings: [f('Scope', 'Nhẹ hơn nhiều nếu làm hybrid, 2–3 ngày lên văn phòng.', 'right')] }),
      V(D, ['Người lao động', 'Tự quyết'], ['Tự sắp lịch làm việc trong ngày', 'làm vào giờ mình tập trung nhất', 'cân bằng việc và đời sống tốt hơn'], { side: 'right' }),
      V(D, ['Người lao động', 'An toàn'], ['Nhà cũng là chỗ làm'], { split: split('nhà ở', 1, br('Nhà rộng, có phòng riêng', ['tách được giờ làm và giờ nghỉ'], 'right'), br('Phòng trọ chật, ở ghép', ['làm việc trên giường, đau lưng', 'không ngắt được việc, kiệt sức'], 'left')) }),
      V(D, ['Nhân viên mới ra trường', 'Năng lực'], ['Không được ngồi cạnh người có kinh nghiệm', 'học nghề chậm, ngại hỏi qua chat', 'thăng tiến chậm hơn các lứa trước'], { side: 'left', findings: [f('Dài hạn', 'Khoảng hụt kỹ năng này kéo dài suốt những năm đầu đi làm.', 'left'), f('With/Without', 'Đi làm ở văn phòng, họ học qua quan sát hằng ngày mà không cần hỏi.', 'left')] }),
      V(D, ['Công ty', 'Vật chất'], ['Thu nhỏ văn phòng', 'giảm tiền thuê mặt bằng', 'có tiền tăng lương hoặc đầu tư'], { side: 'right' }),
      V(D, ['Công ty', 'Năng lực'], ['Trao đổi chậm, ý tưởng khó nảy ra', 'đổi mới sáng tạo giảm'], { side: 'left', findings: [f('Scope', 'Chỉ đúng với việc cần phối hợp nhiều; việc độc lập như lập trình thì ngược lại.', 'right')] }),
      V(D, ['Gia đình', 'Gắn kết & Bản sắc'], ['Bố mẹ ở nhà nhiều hơn', 'đưa đón con, ăn tối cùng nhau', 'con gắn bó với bố mẹ hơn'], { side: 'right' }),
      V(D, ['Gia đình', 'Tự quyết'], ['Ranh giới giờ làm và giờ ở nhà bị xoá', 'sếp nhắn việc lúc 10 giờ tối', 'người nhà thấy họ ở nhà mà như vắng nhà'], {}),
      V(D, ['Thành phố', 'An toàn'], ['Ít xe giờ cao điểm', 'giảm khói bụi và tai nạn giao thông'], { side: 'right', findings: [f('Quy mô', 'Phải đủ nhiều người cùng làm ở nhà mới thấy khác biệt.')] }),
      V(D, ['Thành phố', 'Vật chất'], ['Khu văn phòng vắng khách', 'quán ăn, quán cà phê trung tâm ế', 'nhiều tiểu thương mất thu nhập'], { side: 'left' }),
    ] });
  }

  // 3 ---- Advantages outweigh disadvantages -------------------------------------------------------------------
  {
    const D = 'Artificial intelligence replacing most human workers';
    T.push({ promptId: 'ai-replacing-workers', label: 'Ưu điểm / Nhược điểm', mapExtras: { 1: { rows: ['Lao động lớn tuổi, ít kỹ năng'], cols: ['Ý nghĩa cuộc sống'] } }, chains: [
      V(D, ['Người lao động', 'Vật chất'], ['Mất việc hàng loạt trong thời gian ngắn', 'không có thu nhập trong lúc học nghề mới', 'nợ nần, nghèo đi'], { side: 'left', findings: [f('Quy mô', 'Đề nói "most workers": quy mô cả xã hội, không phải một ngành.', 'left')] }),
      V(D, ['Người lao động', 'An toàn'], ['Máy làm thay việc nguy hiểm: hầm mỏ, hoá chất, trên cao', 'ít tai nạn lao động'], { side: 'right' }),
      V(D, ['Lao động lớn tuổi, ít kỹ năng', 'Năng lực'], ['Việc mới đòi kỹ năng số', 'người 50 tuổi khó học lại từ đầu', 'bị loại khỏi thị trường lao động vĩnh viễn'], { side: 'left', findings: [f('With/Without', 'Không có AI, họ vẫn làm nghề cũ được đến tuổi nghỉ hưu.', 'left')] }),
      V(D, ['Người lao động', 'Tự quyết'], ['Giờ làm việc giảm'], { split: split('quốc gia', 1, br('Có trợ cấp thu nhập cơ bản', ['có thời gian cho gia đình, học, sáng tạo'], 'right'), br('Không có lưới an sinh', ['thời gian rảnh thành thời gian thất nghiệp'], 'left')) }),
      V(D, ['Doanh nghiệp', 'Vật chất'], ['Chi phí lao động giảm mạnh', 'giá thành sản phẩm thấp', 'cạnh tranh tốt hơn trên thị trường quốc tế'], { side: 'right' }),
      V(D, ['Người tiêu dùng', 'Vật chất'], ['Hàng hoá, dịch vụ rẻ hơn', 'người thu nhập thấp mua được nhiều hơn'], { side: 'right', findings: [f('Scope', 'Chỉ có lợi khi họ còn thu nhập; người mất việc thì giá rẻ mấy cũng không mua được.', 'left')] }),
      V(D, ['Người tiêu dùng', 'Gắn kết & Bản sắc'], ['Dịch vụ do máy làm hết', 'mất tiếp xúc người với người ở bệnh viện, trường học'], {}),
      V(D, ['Chính phủ', 'Vật chất'], ['Thuế thu nhập cá nhân thu được giảm', 'trong khi chi trợ cấp thất nghiệp tăng', 'ngân sách thâm hụt'], { side: 'left', findings: [f('Khả thi', 'Đánh thuế robot có thể bù, nhưng chưa nước nào làm được.', 'right')] }),
      V(D, ['Chính phủ', 'Năng lực'], ['Năng suất quốc gia tăng', 'có nguồn lực đầu tư giáo dục, y tế'], { side: 'right' }),
      V(D, ['Người lao động', 'Ý nghĩa cuộc sống'], ['Công việc không chỉ là tiền mà là danh tính', 'mất việc là mất vai trò trong xã hội', 'trầm cảm và các vấn đề tâm lý tăng'], { side: 'left' }),
    ] });
  }

  // 4 ---- Discussion, one driver (the two views are about who gains) ----------------------------------------------
  {
    const D = 'Remote working';
    T.push({ promptId: 'remote-work-who-benefits', label: 'Thảo luận · một driver', mapExtras: { 1: { rows: [], cols: [] } }, chains: [
      V(D, ['Nhân viên', 'Vật chất'], ['Không mất tiền, mất giờ đi lại', 'mỗi tháng dư thêm vài triệu và vài chục tiếng'], { side: 'right' }),
      V(D, ['Chủ doanh nghiệp', 'Vật chất'], ['Không cần văn phòng lớn', 'cắt tiền thuê, điện nước', 'lợi nhuận tăng'], { side: 'left' }),
      V(D, ['Nhân viên', 'Tự quyết'], ['Công ty cài phần mềm theo dõi màn hình', 'nhân viên bị giám sát từng phút', 'quyền kiểm soát nằm trong tay chủ'], { side: 'left', findings: [f('Scope', 'Chỉ ở công ty quản lý bằng giờ ngồi, không phải bằng kết quả.', 'right')] }),
      V(D, ['Nhân viên', 'Tự quyết'], ['Tự chọn nơi sống, không cần ở gần văn phòng', 'chuyển về quê, thuê nhà rẻ'], { side: 'right' }),
      V(D, ['Chủ doanh nghiệp', 'Năng lực'], ['Tuyển được người giỏi ở bất kỳ đâu', 'trả lương theo mặt bằng tỉnh lẻ', 'nhân viên mất thế mặc cả lương'], { side: 'left', findings: [f('With/Without', 'Không có làm từ xa, chủ phải trả lương thành phố để giữ người.', 'left')] }),
      V(D, ['Gia đình', 'Gắn kết & Bản sắc'], ['Bố mẹ ở nhà khi con đi học về', 'bữa tối cả nhà cùng ăn'], { side: 'right' }),
      V(D, ['Nhân viên', 'An toàn'], ['Làm việc ở nhà'], { split: split('loại hợp đồng', 1, br('Nhân viên chính thức', ['được công ty trả tiền thiết bị, internet, bảo hiểm'], 'right'), br('Cộng tác viên tự do', ['tự chịu mọi chi phí, không bảo hiểm'], 'left')) }),
      V(D, ['Chủ doanh nghiệp', 'Gắn kết & Bản sắc'], ['Văn hoá công ty yếu đi', 'nhân viên dễ nghỉ việc', 'chi phí tuyển người thay tăng'], {}),
      V(D, ['Thành phố', 'Vật chất'], ['Nhân viên chuyển ra ngoại ô', 'giá thuê nhà trung tâm hạ nhiệt'], { side: 'right' }),
    ] });
  }

  // 5 ---- Discussion, two drivers ------------------------------------------------------------------------------
  {
    const A = 'Watching entertainment online instead of at theatres and cinemas', B = 'Keeping theatres and cinemas as places to watch entertainment';
    const a = (cell: [string, string], steps: string[], o: any = {}) => V(A, cell, steps, { ...o, drv: 'A' }), b = (cell: [string, string], steps: string[], o: any = {}) => V(B, cell, steps, { ...o, drv: 'B' });
    T.push({ promptId: 'theatres-and-cinemas', label: 'Thảo luận · hai driver', mapExtras: { 1: { rows: ['Người khuyết tật, người già'], cols: [] } }, chains: [
      a(['Khán giả', 'Vật chất'], ['Gói tháng bằng giá hai vé xem phim', 'cả nhà xem không giới hạn']),
      b(['Khán giả', 'Vật chất'], ['Ra rạp đắt hơn', 'nhưng là dịp hiếm, đáng tiền cho trải nghiệm']),
      a(['Khán giả', 'Gắn kết & Bản sắc'], ['Xem cùng lúc với bạn bè qua mạng, bình luận trực tiếp', 'bạn ở xa vẫn xem chung được']),
      b(['Khán giả', 'Gắn kết & Bản sắc'], ['Ngồi cùng hàng trăm người lạ, cười cùng một lúc', 'cảm giác thuộc về cộng đồng'], { findings: [f('With/Without', 'Xem online thì mỗi người một màn hình, không có tiếng cười chung.', 'left')] }),
      a(['Khán giả', 'Tự quyết'], ['Chọn phim, chọn giờ, tua lại', 'hợp người làm ca, bận con nhỏ']),
      a(['Khán giả', 'Năng lực'], ['Thuật toán chỉ gợi ý thứ giống thứ đã xem', 'khán giả ít gặp tác phẩm lạ, khẩu vị hẹp lại']),
      b(['Khán giả', 'Năng lực'], ['Kịch sân khấu buộc tập trung hai tiếng, không điện thoại', 'rèn khả năng chú ý']),
      a(['Rạp hát, rạp chiếu phim', 'Vật chất'], ['Khán giả bỏ rạp', 'nhiều rạp đóng cửa, nhân viên mất việc']),
      b(['Rạp hát, rạp chiếu phim', 'Vật chất'], ['Rạp chuyển sang chiếu bóng đá, hoà nhạc trực tiếp', 'có nguồn thu mới']),
      a(['Nghệ sĩ', 'Vật chất'], ['Nền tảng trả tiền theo lượt xem', 'nghệ sĩ nhỏ thu nhập gần như bằng không']),
      b(['Nghệ sĩ', 'Vật chất'], ['Nhà hát trả cát-xê theo suất diễn', 'nghề diễn sống được']),
      a(['Nghệ sĩ', 'Năng lực'], ['Phim ngắn tự làm lên mạng không cần nhà phân phối', 'người trẻ có cơ hội ra mắt']),
      b(['Thành phố', 'Vật chất'], ['Rạp kéo người tới khu trung tâm buổi tối', 'nhà hàng, quán xá quanh đó sống nhờ']),
      b(['Thành phố', 'Gắn kết & Bản sắc'], ['Nhà hát lớn là biểu tượng của thành phố'], { split: split('thành phố', 1, br('Thành phố du lịch', ['thu hút khách quốc tế'], 'left'), br('Thành phố nhỏ', ['nhà hát vắng, tốn tiền duy trì'], 'right')) }),
      a(['Người khuyết tật, người già', 'An toàn'], ['Không phải đi lại, leo cầu thang', 'vẫn được xem phim mới ra']),
    ] });
  }

  // 6 ---- Agree or Disagree, two drivers (A rather than B) ------------------------------------------------------
  {
    const A = 'Schools focusing on producing good citizens and workers', B = 'Schools focusing on benefiting children as individuals';
    const a = (cell: [string, string], steps: string[], o: any = {}) => V(A, cell, steps, { ...o, drv: 'A' }), b = (cell: [string, string], steps: string[], o: any = {}) => V(B, cell, steps, { ...o, drv: 'B' });
    T.push({ promptId: 'school-purpose-citizens', label: 'Đồng ý / Phản đối · hai driver', mapExtras: { 1: { rows: [], cols: [] } }, chains: [
      a(['Học sinh', 'Năng lực'], ['Học kỹ năng nghề, làm việc nhóm, đúng giờ', 'ra trường dễ có việc']),
      b(['Học sinh', 'Năng lực'], ['Được phát triển năng khiếu riêng như vẽ, nhạc', 'tìm được nghề hợp với mình']),
      b(['Học sinh', 'Tự quyết'], ['Được chọn môn, chọn hướng đi', 'tự tin quyết định cuộc đời mình'], { findings: [f('Scope', 'Chỉ đúng khi học sinh đủ lớn, khoảng từ lớp 10.')] }),
      a(['Học sinh', 'An toàn'], ['Áp lực phải thành người có ích theo một khuôn', 'em không hợp khuôn thấy mình thất bại']),
      b(['Học sinh', 'An toàn'], ['Trường quan tâm cảm xúc của từng em', 'ít trầm cảm học đường']),
      a(['Doanh nghiệp', 'Vật chất'], ['Nguồn lao động có sẵn kỹ năng', 'giảm chi phí đào tạo lại']),
      a(['Xã hội', 'Gắn kết & Bản sắc'], ['Học luật, học trách nhiệm công dân', 'ít vi phạm, xã hội ổn định']),
      b(['Xã hội', 'Gắn kết & Bản sắc'], ['Người được phát triển bản thân tự nguyện làm việc cộng đồng', 'gắn kết bền hơn vì không bị ép'], { findings: [f('Dài hạn', 'Tác động này chỉ thấy sau nhiều năm.')] }),
      b(['Xã hội', 'Năng lực'], ['Nhiều người sáng tạo, khác biệt', 'đổi mới công nghệ và nghệ thuật']),
      a(['Nhà trường', 'Vật chất'], ['Dạy theo khuôn chung, dễ đo bằng điểm thi', 'chi phí thấp']),
    ] });
  }

  // 7 ---- "The best way" (the student chose their own rival) ------------------------------------------------------
  {
    const A = 'Building tall apartment blocks to house city residents', B = 'Turning empty offices and old buildings into homes';
    const a = (cell: [string, string], steps: string[], o: any = {}) => V(A, cell, steps, { ...o, drv: 'A' }), b = (cell: [string, string], steps: string[], o: any = {}) => V(B, cell, steps, { ...o, drv: 'B' });
    T.push({ promptId: 'tall-apartment-blocks', label: '"The best way" · đối thủ tự chọn', mapExtras: { 1: { rows: [], cols: [], rival: B } }, chains: [
      a(['Cư dân thành phố', 'Vật chất'], ['Một khu đất chứa hàng nghìn căn', 'nguồn cung tăng, giá nhà ổn định']),
      b(['Cư dân thành phố', 'Vật chất'], ['Cải tạo toà cũ rẻ hơn xây mới', 'giá thuê thấp nhưng số căn ít']),
      a(['Cư dân thành phố', 'An toàn'], ['Cháy ở tầng cao rất khó thoát', 'rủi ro tính mạng lớn']),
      b(['Cư dân thành phố', 'An toàn'], ['Toà nhà cũ có thể không đạt chuẩn kết cấu', 'phải gia cố tốn kém']),
      a(['Gia đình có trẻ nhỏ', 'Gắn kết & Bản sắc'], ['Ít không gian chung cho trẻ chơi', 'trẻ ở trong nhà nhiều']),
      b(['Gia đình có trẻ nhỏ', 'Gắn kết & Bản sắc'], ['Toà nhà cũ ở khu phố có sẵn trường, công viên', 'trẻ lớn lên trong khu dân cư quen']),
      a(['Chính quyền', 'Vật chất'], ['Thu tiền sử dụng đất lớn', 'có tiền đầu tư hạ tầng']),
      b(['Chủ đầu tư', 'Vật chất'], ['Văn phòng trống được cho thuê lại', 'chủ không phải chịu lỗ']),
      a(['Cư dân thành phố', 'Tự quyết'], ['Ở gần trung tâm', 'ít phụ thuộc xe cá nhân']),
    ] });
  }

  // 8 ---- "The only way" ------------------------------------------------------------------------------------
  {
    const A = 'Much stricter punishments for driving offences', B = 'Redesigning roads and adding speed cameras';
    const a = (cell: [string, string], steps: string[], o: any = {}) => V(A, cell, steps, { ...o, drv: 'A' }), b = (cell: [string, string], steps: string[], o: any = {}) => V(B, cell, steps, { ...o, drv: 'B' });
    T.push({ promptId: 'road-safety-punishments', label: '"The only way"', mapExtras: { 1: { rows: ['Học sinh đi xe đạp'], cols: [] } }, chains: [
      a(['Người đi bộ', 'An toàn'], ['Tài xế sợ phạt nặng nên dừng đúng vạch', 'người đi bộ qua đường an toàn hơn']),
      b(['Người đi bộ', 'An toàn'], ['Đảo giữa đường, đèn riêng cho người đi bộ', 'xe buộc chạy chậm ở chỗ qua đường']),
      a(['Người lái xe', 'Tự quyết'], ['Tước bằng lái người tái phạm', 'tài xế liều bị loại khỏi đường']),
      a(['Người lái xe', 'Năng lực'], ['Phạt nặng buộc tài xế học lại luật', 'hiểu luật hơn']),
      b(['Người lái xe', 'Năng lực'], ['Camera tốc độ gửi ảnh vi phạm ngay', 'tài xế tự sửa thói quen']),
      a(['Người lái xe', 'An toàn'], ['Tài xế sợ mất tiền, mất bằng', 'chạy chậm lại'], { findings: [f('Scope', 'Phạt nặng chỉ hiệu quả khi khả năng bị bắt cao; không có camera thì tài xế cứ liều.')] }),
      a(['Cảnh sát giao thông', 'Vật chất'], ['Cần nhiều cảnh sát tuần tra để bắt lỗi', 'tốn nhân lực']),
      b(['Cảnh sát giao thông', 'Vật chất'], ['Camera tự động thay người đứng đường', 'ít tốn nhân lực']),
      a(['Chính phủ', 'Vật chất'], ['Tiền phạt tăng', 'có thêm ngân sách sửa đường']),
      a(['Chính phủ', 'Gắn kết & Bản sắc'], ['Mức phạt quá nặng so với thu nhập', 'dân thấy bất công, mất lòng tin vào cảnh sát']),
      b(['Học sinh đi xe đạp', 'An toàn'], ['Làn riêng cho xe đạp, tách khỏi ô tô', 'học sinh đi học an toàn']),
    ] });
  }

  // 9 ---- Two-part: causes, then a verdict -------------------------------------------------------------------------
  {
    const D = 'Young adults choosing to live alone';
    const C = (cell: [string, string], steps: string[], sys: number) => ({ id: id('c'), q: 1, title: '', tone: 'benefit', pos: 50, area: cell[1], sys, steps, split: null, findings: [], fixes: null, cell: { r: cell[0], c: cell[1], q: 'Về ' + cell[1] + ', điều gì khiến ' + cell[0] + ' góp phần tạo ra "' + D + '"?' } });
    T.push({ promptId: 'living-alone', label: 'Hai câu hỏi · nguyên nhân + tích cực/tiêu cực', mapExtras: {}, chains: [
      C(['Người trẻ', 'Vật chất'], ['Thành phố trả lương cao hơn cho dân văn phòng', 'người trẻ đủ tiền thuê căn hộ nhỏ', 'chọn ở một mình'], 2),
      C(['Chủ nhà / thị trường nhà ở', 'Vật chất'], ['Chủ đầu tư xây nhiều căn studio, căn hộ dịch vụ', 'giá thuê căn nhỏ vừa túi tiền', 'ở riêng trở thành lựa chọn dễ'], 1),
      C(['Người trẻ', 'Tự quyết'], ['Muốn tự quyết giờ giấc, bạn bè, lối sống mà không bị bố mẹ hỏi han'], 0),
      C(['Gia đình', 'Gắn kết & Bản sắc'], ['Gia đình hạt nhân thay gia đình nhiều thế hệ', 'bố mẹ không còn mong con ở nhà đến khi cưới', 'người trẻ dọn ra ở riêng sớm'], 2),
      V(D, ['Người trẻ', 'Năng lực'], ['Tự nấu ăn, trả hoá đơn, sửa đồ', 'trưởng thành nhanh, tự lập'], { q: 2, side: 'right' }),
      V(D, ['Người trẻ', 'Gắn kết & Bản sắc'], ['Về nhà không có ai', 'cô đơn, dễ trầm cảm'], { q: 2, side: 'left', findings: [f('Scope', 'Nặng nhất với người hướng nội, ít bạn ở thành phố.', 'left')] }),
      V(D, ['Người trẻ', 'Vật chất'], ['Một người trả toàn bộ tiền thuê', 'không tiết kiệm được để mua nhà'], { q: 2, side: 'left' }),
      V(D, ['Gia đình', 'Gắn kết & Bản sắc'], ['Con ít ở nhà'], { q: 2, split: split('khoảng cách', 1, br('Sống cùng thành phố với bố mẹ', ['cuối tuần vẫn về, ít va chạm nên quan hệ tốt hơn'], 'right'), br('Sống xa quê', ['bố mẹ già ở một mình, không ai chăm'], 'left')) }),
      V(D, ['Chủ nhà / thị trường nhà ở', 'Vật chất'], ['Nhu cầu căn nhỏ tăng', 'giá thuê bị đẩy lên cho cả người ở ghép'], { q: 2 }),
      V(D, null, ['Nhiều hộ gia đình hơn', 'mua sắm đồ gia dụng, dịch vụ tăng', 'kinh tế được kích thích'], { q: 2, area: 'Vật chất', side: 'right', title: 'Kích cầu tiêu dùng' }),
    ] });
  }

  // 10 ---- Causes and solutions (no verdict: screen ② is only the outline) -------------------------------------
  {
    const D = 'Serious traffic congestion in cities';
    const C = (cell: [string, string], steps: string[], sys: number) => ({ id: id('c'), q: 1, title: '', tone: 'benefit', pos: 50, area: cell[1], sys, steps, split: null, findings: [], fixes: null, cell: { r: cell[0], c: cell[1], q: 'Về ' + cell[1] + ', điều gì khiến ' + cell[0] + ' góp phần tạo ra "' + D + '"?' } });
    const k1 = C(['Người đi làm', 'Vật chất'], ['Văn phòng tập trung ở trung tâm, nhà ở ngoại ô', 'hàng triệu người cùng đi một chiều vào một giờ', 'người đi làm chọn xe riêng vì nhanh hơn xe buýt'], 2);
    const k2 = C(['Chính quyền thành phố', 'Vật chất'], ['Ngân sách cho giao thông công cộng thấp', 'xe buýt ít tuyến, hay trễ', 'người dân không tin xe buýt'], 2);
    const k3 = C(['Cư dân', 'Gắn kết & Bản sắc'], ['Ô tô là biểu tượng thành đạt', 'người có tiền mua xe dù chỉ đi một mình'], 1);
    const S = (cause: any, col: string, steps: string[], findings: any[] = []) => ({ id: id('c'), q: 2, title: '', tone: 'benefit', pos: 50, area: '', steps, split: null, findings, fixes: cause.id, cell: { r: cause.id, c: col, q: col + ' có thể làm gì để xử lý «' + cause.steps[0] + '»?', label: cause.steps[0] } });
    T.push({ promptId: 'city-traffic', label: 'Nguyên nhân + giải pháp (không cân)', mapExtras: {}, chains: [
      k1, k2, k3,
      S(k1, 'Chính quyền thành phố', ['Dời một phần cơ quan, trường đại học ra vùng ven', 'dòng xe chia ra hai chiều'], [f('Khả thi', 'Mất hàng chục năm mới xong.')]),
      S(k2, 'Chính quyền thành phố', ['Làn riêng cho xe buýt, 5 phút một chuyến', 'giờ cao điểm đi xe buýt nhanh hơn đi ô tô']),
      S(k3, 'Cư dân', ['Thu phí vào trung tâm giờ cao điểm', 'đi ô tô một mình trở nên đắt']),
    ] });
  }

  return T;
}
