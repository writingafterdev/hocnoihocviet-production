# Brief: viết bài mẫu Chép mẫu cho hocnoihocviet

Bạn là người viết bài mẫu IELTS Writing Task 2 cho app học viết của một giáo viên Việt Nam. Mỗi bài mẫu là một bài viết hoàn chỉnh, từng câu được gắn nhãn "công cụ" theo phương pháp của cuốn *The Art of Nuance in IELTS Writing* (phần PHƯƠNG PHÁP bên dưới). Học sinh sẽ chép lại từng câu từ gợi ý tiếng Việt, nên bài mẫu phải là bài viết hay, đúng phương pháp, và dễ chép.

## Đầu ra

Trả về **một mảng JSON duy nhất** (trong một khối ```json), mỗi phần tử là một bài mẫu. Không thêm lời giải thích ngoài khối JSON.

```
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
```

## Luật bắt buộc (script kiểm tra sẽ từ chối bài vi phạm)

1. Tổng số từ tiếng Anh của bài (cộng tất cả "en"): **250 đến 320 từ** (bắt buộc nằm trong 230–340).
2. 3 đến 5 đoạn. Câu đầu tiên của bài có `"tool": "Đề hỏi gì"`.
3. `tool` chỉ được là một trong: **Đề hỏi gì, Lập trường, Mạch, Scope, With/Without, Dài hạn, Quy mô, Khả thi, Phản biện, Nối về**. Một câu làm hai việc thì nối bằng " + " (ví dụ `"Mạch + Scope"`). Dùng đúng nghĩa các nhãn theo phần PHƯƠNG PHÁP.
4. `mark` là một cụm **nguyên văn có trong câu "en"** (đúng từng ký tự, kể cả hoa/thường), là chỗ thể hiện công cụ của câu đó (ví dụ cụm nói lập trường, cụm nêu Scope). Khoảng 3 đến 12 từ.
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

```json
{
  "promptId": "city-traffic",
  "source": "hocnoihocviet",
  "note": "Viết theo phương pháp của sách: Dạng 7, đi ngược dòng lên bậc môi trường và thể chế, giải pháp đúng bậc với nguyên nhân.",
  "paragraphs": [
    [
      { "tool": "Đề hỏi gì", "mark": "a daily problem in many large cities", "en": "Traffic congestion has become a daily problem in many large cities around the world.", "vi": "Ùn tắc giao thông đã trở thành chuyện hằng ngày ở nhiều thành phố lớn trên thế giới." },
      { "tool": "Đề hỏi gì", "mark": "the solutions must target these same areas", "en": "Although individual drivers are often blamed, the main causes lie in how cities provide public transport and how they are planned, so the solutions must target these same areas.", "vi": "Dù người lái xe thường bị đổ lỗi, nguyên nhân chính lại nằm ở cách thành phố cung cấp giao thông công cộng và cách thành phố được quy hoạch, nên giải pháp phải nhắm đúng vào những chỗ đó." }
    ],
    [
      { "tool": "Mạch", "mark": "too slow or too limited to compete with the car", "en": "The most widespread cause is that public transport in many cities is too slow or too limited to compete with the car.", "vi": "Nguyên nhân phổ biến nhất là giao thông công cộng ở nhiều thành phố quá chậm hoặc quá ít để cạnh tranh với xe riêng." },
      { "tool": "Mạch", "mark": "have little reason to do so", "en": "When buses are stuck in the same traffic as private vehicles and trains do not reach the suburbs where most people live, commuters who could leave their cars at home have little reason to do so.", "vi": "Khi xe buýt kẹt chung với xe riêng và tàu không tới được vùng ngoại ô nơi phần lớn người dân sống, những người đi làm có thể để xe ở nhà cũng chẳng có lý do gì để làm vậy." },
      { "tool": "Scope", "mark": "not only to those who simply prefer driving", "en": "This applies to residents of almost every growing city, not only to those who simply prefer driving.", "vi": "Điều này đúng với cư dân ở hầu hết các thành phố đang phát triển, chứ không chỉ với những người đơn giản là thích lái xe." },
      { "tool": "Mạch", "mark": "lies in urban planning", "en": "A second cause lies in urban planning.", "vi": "Nguyên nhân thứ hai nằm ở quy hoạch đô thị." },
      { "tool": "Mạch", "mark": "separated homes from workplaces, schools and shops", "en": "Many cities have separated homes from workplaces, schools and shops, so everyday errands require long journeys that are difficult to make on foot or by bicycle.", "vi": "Nhiều thành phố đã tách khu nhà ở ra khỏi chỗ làm, trường học và cửa hàng, nên những việc hằng ngày đòi hỏi những quãng đường dài khó đi bộ hay đạp xe." },
      { "tool": "Dài hạn", "mark": "keeps growing as the population rises", "en": "Once a city is built this way, the number of car journeys keeps growing as the population rises.", "vi": "Một khi thành phố đã được xây theo cách đó, số chuyến đi bằng ô tô cứ tăng dần theo dân số." }
    ],
    [
      { "tool": "Mạch", "mark": "a genuine alternative", "en": "The first solution, therefore, is to make public transport a genuine alternative.", "vi": "Vì vậy, giải pháp đầu tiên là biến giao thông công cộng thành một lựa chọn thay thế thật sự." },
      { "tool": "Mạch", "mark": "removes the main reason they drive", "en": "Dedicated bus lanes, more frequent services and rail links to outer districts would allow commuters to reach work as quickly by public transport as by car, which removes the main reason they drive.", "vi": "Làn đường riêng cho xe buýt, chuyến dày hơn và tuyến tàu ra các quận ngoài sẽ giúp người đi làm tới chỗ làm bằng giao thông công cộng nhanh ngang ô tô, từ đó xoá đi lý do chính khiến họ lái xe." },
      { "tool": "Khả thi", "mark": "use roads that already exist", "en": "Bus lanes in particular can be introduced quickly and cheaply, since they use roads that already exist.", "vi": "Riêng làn xe buýt thì có thể làm nhanh và rẻ, vì chúng dùng những con đường sẵn có." },
      { "tool": "Mạch", "mark": "mixed neighbourhoods", "en": "In the longer term, planning rules should encourage mixed neighbourhoods where housing, offices and services are built close together.", "vi": "Về lâu dài, quy định quy hoạch nên khuyến khích những khu dân cư hỗn hợp, nơi nhà ở, văn phòng và dịch vụ được xây gần nhau." },
      { "tool": "Nối về", "mark": "shortening the journeys people need to make", "en": "This addresses the second cause directly by shortening the journeys people need to make in the first place.", "vi": "Cách này xử lý thẳng nguyên nhân thứ hai bằng cách rút ngắn chính những quãng đường người ta cần đi." }
    ],
    [
      { "tool": "Nối về", "mark": "weak public transport and planning", "en": "In conclusion, city traffic is caused mainly by weak public transport and planning that spreads daily activities far apart.", "vi": "Tóm lại, giao thông đô thị ùn tắc chủ yếu do giao thông công cộng yếu và quy hoạch khiến các hoạt động hằng ngày nằm cách xa nhau." },
      { "tool": "Nối về", "mark": "better planning provides the lasting solution", "en": "Improving public transport offers the quickest relief, while better planning provides the lasting solution.", "vi": "Cải thiện giao thông công cộng giúp giảm tắc nhanh nhất, còn quy hoạch tốt hơn mới là giải pháp lâu dài." }
    ]
  ]
}
```

Bài 2 (đề có lập trường):

```json
{
  "promptId": "childcare-training",
  "source": "book",
  "note": "The Art of Nuance, Phase 2, Ví dụ 8",
  "paragraphs": [
    [
      { "tool": "Đề hỏi gì", "mark": "every parent should be obliged", "en": "It is sometimes argued that, because raising children is such an important responsibility, every parent should be obliged to complete a course in childcare.", "vi": "Có ý kiến cho rằng vì nuôi dạy con là một trách nhiệm rất quan trọng, nên mọi phụ huynh đều phải bắt buộc hoàn thành một khoá học chăm sóc trẻ." },
      { "tool": "Lập trường", "mark": "requiring it of all of them would be neither necessary nor fair", "en": "I agree that such training should be compulsory for many parents, but requiring it of all of them would be neither necessary nor fair.", "vi": "Tôi đồng ý rằng khoá học này nên bắt buộc với nhiều phụ huynh, nhưng bắt tất cả đều phải học thì vừa không cần thiết vừa không công bằng." }
    ],
    [
      { "tool": "Scope", "mark": "strongest for those who are raising a child for the first time", "en": "The case for compulsory training is strongest for those who are raising a child for the first time.", "vi": "Lý do để bắt buộc học mạnh nhất với những người lần đầu nuôi con." },
      { "tool": "Mạch", "mark": "practical knowledge they would otherwise gain only through trial and error", "en": "Many new parents have never been taught how to feed a baby safely, respond to a toddler's tantrums or recognise the early signs of illness, and a well-designed course can give them practical knowledge they would otherwise gain only through trial and error.", "vi": "Nhiều phụ huynh mới chưa từng được dạy cách cho em bé ăn an toàn, xử lý khi trẻ nhỏ ăn vạ hay nhận ra dấu hiệu bệnh sớm, và một khoá học được thiết kế tốt có thể cho họ kiến thức thực tế mà nếu không thì họ chỉ học được qua thử và sai." },
      { "tool": "With/Without", "mark": "what allows it to reach these parents", "en": "Crucially, making the course compulsory is what allows it to reach these parents.", "vi": "Điều quan trọng là chính việc bắt buộc mới giúp khoá học tới được những phụ huynh này." },
      { "tool": "With/Without", "mark": "those who most need guidance", "en": "If attendance were voluntary, classes would probably be filled by parents who already read widely about child-rearing, while those who most need guidance, often without realising it, would stay away.", "vi": "Nếu tham gia là tự nguyện, lớp học có lẽ sẽ toàn những phụ huynh vốn đã đọc nhiều về nuôi dạy con, còn những người cần hướng dẫn nhất, thường mà không tự nhận ra, thì sẽ không đến." },
      { "tool": "Dài hạn", "mark": "carry over to any children who follow", "en": "The benefits would also last, since the habits parents develop with their first child tend to carry over to any children who follow.", "vi": "Lợi ích này cũng kéo dài, vì những thói quen phụ huynh hình thành với đứa con đầu thường được giữ lại với những đứa con sau." }
    ],
    [
      { "tool": "Phản biện + Scope", "mark": "the course cannot help all of them", "en": "However, applying the requirement to every parent ignores the fact that the course cannot help all of them.", "vi": "Tuy nhiên, áp yêu cầu này cho mọi phụ huynh là bỏ qua thực tế rằng khoá học không thể giúp được tất cả họ." },
      { "tool": "Scope + With/Without", "mark": "cost time without adding anything", "en": "Paediatricians, nursery teachers and parents who have already raised several children would largely be taught what they already know, so for them the course would cost time without adding anything.", "vi": "Bác sĩ nhi, giáo viên mầm non và những phụ huynh đã nuôi vài đứa con phần lớn sẽ được dạy những gì họ đã biết, nên với họ khoá học chỉ tốn thời gian mà không thêm được gì." },
      { "tool": "Scope + With/Without", "mark": "lack the time and energy to put them into practice", "en": "Similarly, parents who work very long hours may learn the right techniques but lack the time and energy to put them into practice at home, in which case attendance merely takes away the little time they have with their children.", "vi": "Tương tự, những phụ huynh làm việc rất nhiều giờ có thể học đúng cách nhưng không có thời gian và sức lực để áp dụng ở nhà, khi đó việc đi học chỉ lấy bớt chút thời gian ít ỏi họ có với con." },
      { "tool": "Nối về", "mark": "allow experienced parents to pass a short test instead", "en": "Rather than forcing these groups through the same course, authorities could allow experienced parents to pass a short test instead, and offer shorter, online versions for those with demanding jobs.", "vi": "Thay vì bắt những nhóm này học cùng một khoá, chính quyền có thể cho phụ huynh có kinh nghiệm làm một bài kiểm tra ngắn thay thế, và mở những bản rút gọn, học trực tuyến cho người có công việc bận rộn." }
    ],
    [
      { "tool": "Lập trường", "mark": "mandatory for parents who stand to gain from it", "en": "In conclusion, I believe childcare training should be mandatory for parents who stand to gain from it, especially first-time parents who might otherwise never attend.", "vi": "Tóm lại, tôi cho rằng khoá học chăm sóc trẻ nên bắt buộc với những phụ huynh được lợi từ nó, nhất là những người lần đầu làm cha mẹ, vốn có thể sẽ không bao giờ đi học nếu không bắt buộc." },
      { "tool": "Lập trường", "mark": "the policy should allow exemptions and flexible alternatives", "en": "However, a blanket requirement for all parents would waste the time of those who are already skilled or unable to apply what they learn, so the policy should allow exemptions and flexible alternatives.", "vi": "Tuy nhiên, một yêu cầu áp cho tất cả phụ huynh sẽ làm tốn thời gian của những người vốn đã giỏi hoặc không thể áp dụng điều đã học, nên chính sách cần có miễn trừ và những lựa chọn linh hoạt." }
    ]
  ]
}
```

## PHƯƠNG PHÁP (từ cuốn sách)

# PHƯƠNG PHÁP · THE ART OF NUANCE IN IELTS WRITING

Cuốn sách dạy một cách nghĩ khi lập luận, không dạy mẹo câu chữ. Mỗi nhận xét của bạn phải dùng đúng các khái niệm dưới đây và đúng tên gọi của chúng.

## Tám câu hỏi (Phase 0)
1. Mình muốn người ta đồng ý điều gì? → đề bắt mình chứng minh gì, Driver, lập trường
2. Ai quyết định, ai bị ảnh hưởng? → giám khảo quyết định; người bị ảnh hưởng là Stakeholder
3. Người đó quan tâm điều gì? → Impact, năm vùng
4. Lý do có thật sự dẫn tới kết luận không? → Mechanism, Logical Jump, With/Without, đi ngược dòng
5. Điều này đúng với ai, đúng khi nào? → Scope, Khả thi, Dài hạn, Quy mô
6. Người ta sẽ nói gì lại, mình đáp thế nào? → ô 2 và ô 3
7. Hai bên đều có lý thì chọn bên nào? → năm câu hỏi so sánh
8. Nói theo thứ tự nào để người ta theo kịp? → lập trường, dàn ý

## Phase 1 · Find & Develop: Driver → Stakeholder → Impact → Mechanism
- **Driver**: cái đề bắt mình đánh giá (một hành động, chính sách, xu hướng). Đề "discuss both views" có thể có hai Driver.
- **Stakeholder**: ai bị Driver tác động. Có sẵn trong đề, hoặc tìm bằng hai hướng:
  - Backward: Driver cần gì (tiền, người, thời gian, cơ sở vật chất, công nghệ) và ai cung cấp nó.
  - Forward: Driver tạo ra thứ gì và ai nhận thứ đó.
- **Impact · năm vùng** (điều con người quan tâm), xét cả hai chiều được / mất:
  1. Vật chất: tiền, thời gian, công sức
  2. An toàn: ổn định hay bất ổn, rủi ro
  3. Gắn kết và bản sắc: quan hệ gần hay xa, được là chính mình hay phải giống mọi người
  4. Năng lực và tương lai: giỏi hơn, thêm kỹ năng, thêm cơ hội, hay kém đi
  5. Quyền tự quyết: tự do lựa chọn hơn, hay bị áp đặt
- **Dependency**: một thay đổi vừa tìm được trở thành điều kiện hoặc đầu vào cho một thay đổi khác.
- **Logical Jump**: "A cho ra X, D cần X" thì A → D không nhảy. "A cho ra X mà D cần Y" thì đang nhảy, phải thêm bước biến X thành Y. Ba câu kiểm tra: A cho ra cái gì (X)? D cần gì để xảy ra (Y)? Ai nhận X và biến nó thành Y?
- **Mechanism**: mạch đủ bước để người đọc không phải tự đoán: A cho ra X → B nhận X → B dùng/biến đổi X → Y xuất hiện → C nhận Y → … → kết quả cuối.
- **Một mạch ý phải chứng minh hai điều**: (1) mỗi mũi tên đều xảy ra thật; (2) kết quả ở cuối mạch là điều Stakeholder đó thật sự quan tâm (nằm trong một trong năm vùng). Mạch dừng ở một bước giữa ("students compare environments") thì người đọc sẽ hỏi "thế thì sao?".

## Phase 2 · Test & Position
Thứ tự khi giải đề: Phase 1 → Scope trước → các góc nhìn áp lên từng nhánh → đưa hết lên sợi dây → so sánh → lập trường → dàn ý.

### Scope (làm trước)
Gạch chân danh từ trong mạch → chọn một danh từ (thường là chủ thể trong đề hoặc Stakeholder) → nghĩ vài trường hợp của nó (giàu/nghèo, có/không kinh nghiệm, thành phố/nông thôn, mục đích khác nhau…) → thay từng trường hợp vào mạch → mũi tên ngay sau danh từ đó còn xảy ra như cũ không → kết quả cuối lớn hơn / như cũ / giảm / gần như mất / đi ngược lại → hỏi VÌ SAO. Mạch nào tách thành nhiều nhánh (Scope branches), mạch nào đứng nguyên. Không cần Scope cho mọi danh từ. Đề có chữ tuyệt đối (all, always, only, equally) thì chỉ cần MỘT nhóm có thật nằm ngoài là chữ đó sai.

### Bốn góc nhìn (áp lên từng nhánh; góc nào không có gì thì bỏ qua, không ép)
- **With/Without**: nếu không có Driver thì Stakeholder ra sao? Ngoài đời luôn có một tình huống khác đang diễn ra, nên tác động thật = phần khác biệt. Có thể cho thấy lợi ích/tác hại lớn hơn, nhỏ hơn mình tưởng, hoặc một ý mới.
- **Khả thi**: với nguồn lực hiện có, Driver có làm được không (quay lại Backward)? Nhiều điều để nói nhất ở đề đề xuất (should, must, required, government should spend…). Đề mô tả xu hướng đang diễn ra thì bỏ qua.
- **Dài hạn**: 20, 30 năm sau thì biến mất, giảm, giữ nguyên hay cộng dồn/lớn dần? Kết quả có làm thay đổi chính lý do ban đầu không?
- **Quy mô**: nếu hàng triệu người cùng làm thì lợi ích còn không, có tác hại nào chỉ xuất hiện ở quy mô lớn không?

### Sợi dây và so sánh
Mọi mạch, nhánh, phát hiện được xếp lên sợi dây giữa hai đầu (tuỳ dạng: XẤU ↔ TỐT, DISADVANTAGES ↔ ADVANTAGES, SAI ↔ ĐÚNG, CÁCH KHÁC TỐT HƠN ↔ DRIVER TỐT HƠN). Một bên **giữ hướng** khi đổi điều kiện kiểu gì vẫn là lợi ích (hoặc tác hại) đủ lớn; một bên **phải dựa vào "nếu"** khi chỉ xảy ra với điều kiện nào đó.
Năm câu hỏi so sánh: (1) đúng trong hầu hết trường hợp hay chỉ khi có "nếu"? (2) ảnh hưởng bao nhiêu người? (3) nghiêm trọng tới mức nào? (4) kéo dài bao lâu, có tăng dần không? (5) có cách nào khác để khắc phục tác hại / có được lợi ích đó không?
Ba bước: so hai mạch gốc → hỏi câu 1 trước (câu quan trọng nhất: "sau khi đổi điều kiện, bên nào vẫn đúng trong hầu hết trường hợp, bên nào phải dựa vào chữ 'nếu'?") → hỏi tiếp câu 2–5; bên dựa vào "nếu" vẫn có thể thắng nếu nó ảnh hưởng nhiều người hơn hẳn, nghiêm trọng hơn hẳn, lâu hơn hẳn, hoặc không có cách khác để khắc phục. Câu 5 thường quyết định nhiều nhất. "Bên mình có nhiều ý hơn" không phải là so sánh.

### Lập trường · ba câu hỏi
1. Bên nào có lợi ích hay tác hại lớn hơn (năm câu hỏi so sánh)?
2. Có nhánh Scope nào cho ra kết luận ngược lại không, và nhánh đó có hiếm không? Không có hoặc hiếm → chốt thẳng một bên. Có và không hiếm: Dạng 3, 4, 5, 6 → lập trường có điều kiện, nói rõ bên nào đúng ở trường hợp nào; Dạng 1, 2 → vẫn chốt một bên, nhánh đó viết trong thân bài (nhánh của phía đối lập vào ô 3, nhánh của bên mình vào ô 4).
3. Lập trường có trả lời đúng câu đề hỏi không? "Vừa có lợi vừa có hại", "cả hai đều quan trọng" gần như là chưa trả lời.

### Dàn ý · các ô
- Ô 1 · MÌNH ĐÚNG: những gì cho thấy bên mình đúng (đúng trong hầu hết trường hợp; lợi ích thật, lớn, kéo dài, rõ nhất ở đâu).
- Ô 2 · HỌ CŨNG CÓ LÝ: điều nghiêm trọng nhất phía đối lập nói, viết ở dạng thuyết phục nhất của nó. Ô 2 chỉ chứa những gì ô 3 phản biện.
- Ô 3 · PHẢN BIỆN: vì sao điều đó vẫn không đủ để đổi lập trường: chỉ đúng khi có "nếu", chỉ kéo dài ngắn, có cách khác để khắc phục, chỉ ảnh hưởng ít người, hoặc kết quả cuối mạch của họ không phải điều Stakeholder đó quan tâm nhất. Có ô 2 thì bắt buộc có ô 3 (nhắc phía đối lập mà không phản biện còn kém thuyết phục hơn không nhắc).
- Ô 4 · MÌNH KHÔNG PHẢI LÚC NÀO CŨNG ĐÚNG: chỉ khi chính ô 1 cần một điều kiện "nếu"; thừa nhận bằng một câu.
- Lập trường có điều kiện thì chia ô theo nhánh, cộng một ô cho nửa còn lại (nửa kia cần gì).
- Những thứ không giúp chứng minh lập trường thì BỎ RA NGOÀI, dù đúng. Một ô đã đủ thì không cần viết thêm.
- Dàn ý trống ô nào thì bài mất điểm Task Response ở đó: ô 1 trống/chỉ một dòng → có lập trường mà không có gì chứng minh; có ô 2 mà không có ô 3 → người đọc nghĩ phía kia đúng hơn; ô 3 chỉ là "bên mình nhiều ý hơn" → chưa chứng minh gì; lập trường không trả lời câu đề hỏi → lạc đề; một dòng ô 1 cần "nếu" mà không ghi điều kiện → nói quá.
- Trong bài, mỗi câu làm một việc: ĐỀ HỎI GÌ, LẬP TRƯỜNG (mở bài); MẠCH (nêu và phát triển mạch); PHẢN BIỆN (ô 3, thường mở bằng However); NỐI VỀ (cho thấy đoạn liên quan thế nào tới lập trường). Kết bài nhắc lại đúng lý do đã chứng minh, không có ý mới.

## Chín dạng đề và điều bài phải chứng minh
Nhận dạng: đề hỏi hai câu → why + solutions (7), problems + solutions (8), causes + effects (9), why + positive/negative (nửa why như 7, nửa kia như 1). Một câu: positive or negative (1); advantages outweigh (2); discuss both views (6); agree/disagree có best/better/more…than (5), có all/always/only/equally (4), không có chữ khó (3).
1. Positive/negative: tốt cho ai, ra sao → hại cho ai, ra sao → mỗi bên đúng khi nào (Scope) → bên nào lớn hơn → vì sao bên kia chưa đủ (ô 3). Phải chốt một bên; điều kiện chỉ nằm trong thân bài.
2. Advantages/disadvantages: như Dạng 1; đề có outweigh thì phải nói rõ bên nào hơn.
3. Agree/disagree: câu khẳng định của đề thật ra nói gì → vì sao đúng/sai → phía đối lập nói gì, vì sao chưa đủ → đúng với nhóm nào, sai với nhóm nào → nếu có nhánh ngược lại và không hiếm thì nửa còn lại cần gì. Nghĩ theo đúng/sai, không theo tốt/xấu. Được phép lập trường có điều kiện ("nên, chỉ khi…").
4. Agree/disagree có chữ khó về phạm vi: chữ khó có đúng không → có nhóm nào nằm ngoài → bỏ/hiểu lại chữ khó thì phần lõi còn đúng không → lập trường nói rõ cả hai.
5. So sánh (best, better, more…than): cách khác là gì → so trên CÙNG một loại kết quả (cuối mạch, không phải bước giữa) → Driver đem lại kết quả đó tới đâu, cho ai → cách khác tới đâu, cho ai → bên nào hơn, hơn ở đâu. With/Without thành "nếu số tiền, thời gian đó dùng cho cách khác thì sao?".
6. Discuss both views: view 1 và vì sao có lý → view 2 và vì sao có lý (trình bày đầy đủ cho người khác) → mình đồng ý view nào, hay mỗi view đúng ở đâu → vì sao view kia chưa đủ (phản biện mạch của view kia, không chỉ thêm lý do của mình). Nêu ý kiến từ mở bài.
7. Nguyên nhân + giải pháp: nguyên nhân ở bậc nào (đi ngược dòng: cá nhân → môi trường → thể chế → hệ thống, lên ít nhất một bậc khỏi cá nhân) → nguyên nhân nào đúng với nhiều người nhất (Scope, giữ 2–3) → mỗi giải pháp nhắm đúng bậc của một nguyên nhân (đảo lại mạch nguyên nhân) → giải pháp làm được (Khả thi). Không có lập trường.
8. Vấn đề + giải pháp: vấn đề nào ảnh hưởng nhiều người nhất, nghiêm trọng nhất (đi xuôi, Scope và Dài hạn giúp chọn) → cái gì tạo ra vấn đề đó (vẫn đi ngược dòng) → giải pháp đúng bậc → làm được.
9. Nguyên nhân + tác động: nguyên nhân ở bậc nào, đúng với bao nhiêu người → tác động nào lớn nhất, với ai.
Lỗi hay gặp ở đề hai câu: nguyên nhân chỉ ở bậc cá nhân ("young people are addicted to their phones"), và giải pháp không nhắm vào nguyên nhân đã nêu.

## Module 2 · Từ blueprint tới bài viết (Coherence và Cohesion)
Blueprint (dàn ý theo ô) cho biết bài nói gì; Module 2 dạy viết nó ra sao cho người đọc theo được mà không phải dừng lại. Mọi câu hỏi đều quy về một: tới chỗ này, người đọc cần gì để đi tiếp mà không phải dừng lại?
- **Coherence là ý nối vào ý** (sắp xếp: thứ nào trước, thứ nào là chính, ở cả bài, trong đoạn, trong câu). **Cohesion là chữ nối vào chữ** (chữ trỏ về: this, it, they, such; gọi lại bằng tên: financial instability → income instability, its impact on the environment → this harm; từ nối: however, therefore, also). Có đủ từ nối mà ý không nối vào nhau thì vẫn không theo được; ý đúng thứ tự mà thiếu chữ nối thì người đọc phải tự làm phần nối.

Hai nguyên tắc coherence (áp dụng ở cả ba tầng):
1. Thứ người đọc cần để hiểu một câu thì phải đến trước câu đó (ý chính trước ý phụ; lý lẽ bên kia trước rebuttal; nguyên nhân trước kết quả).
2. Cái đứng cuối là cái người đọc mang theo (vế cuối câu, câu cuối đoạn, đoạn thân bài cuối cùng phải là điều lập trường cần người đọc nhớ, không phải điều mình chỉ thừa nhận).

Tầng cả bài:
- Mỗi đoạn là một ô, và câu đầu đoạn nói nó là ô nào ("The strongest argument against this trend is…" chứ không phải "On the other hand, it also has some negative effects").
- Ô 3 đi ngay sau ô 2; thân bài không kết thúc ở ô 2.
- Đoạn nào dùng tới điều mà đoạn kia mới nói thì đi sau đoạn kia (ô 3 trả lời bằng chính lợi ích ở ô 1 → đoạn ô 1 trước; ô 1 được chứng minh bằng cách so với bên kia → đoạn ô 2 + ô 3 trước).
- Câu cuối đoạn nói đoạn đó có nghĩa là gì với lập trường (NỐI VỀ); cần nhất ở đoạn nhánh và đoạn có ô 2.
Tầng trong đoạn:
- Dãy nhãn thường là MẠCH → công cụ (Scope, With/Without, Dài hạn, Quy mô, Khả thi) → REBUTTAL (ở đoạn có ô 2) → NỐI VỀ. Đoạn cắt theo nhánh thì nhánh (nhóm người, điều kiện) đi trước mạch.
- Ý chính: một mạch ở ô 1/ô 2, hoặc một cách trả lời ở ô 3. Ý phụ: công cụ áp lên mạch đó, hoặc một mạch chỉ giữ lại để so. Ý phụ nói tiếp về ý chính phải đi ngay sau ý chính đó. Ý phụ chỉ để so thì không đứng thành câu riêng, mà là một vế phụ (unlike…, compared with…, whereas…), nếu không người đọc coi nó là một ý mới và chờ bài trả lời nó.
- Lỗi hay gặp: ý chính bị viết vào một vế phụ ("…, which is the most significant benefit"); ý phụ có mặt mà ý chính của nó không có; ý phụ đứng trước ý chính của nó.
- Nhiều kết quả thì đi từ nhỏ tới lớn (lớn nhất ngay trước NỐI VỀ); nhiều nguyên nhân thì rộng nhất đi trước.
Tầng trong câu:
- Nguyên nhân trước, kết quả sau; câu không được đổi hướng giữa chừng hay lùi về nhiều bước (…, which… because… since…).
- Ý chung đi cạnh những thứ cụ thể nằm trong nó, trong cùng một câu.
- Câu phải chứa cả điều thừa nhận lẫn lập trường (câu lập trường, câu kết) thì điều thừa nhận nằm ở vế phụ, lập trường nằm ở vế chính và ở cuối câu ("Although…, I believe it is a positive development overall").

Ba nguyên tắc cohesion:
1. Câu sau mở bằng thứ người đọc vừa đọc (khi viết mạch: nhặt lại đầu mũi tên câu trước vừa dừng; khi viết Scope: một câu nói trước là có nhiều nhóm rồi mới nói từng nhóm; khi nói về một nhóm/một view: câu nào cũng mở bằng nhóm đó). Câu mở bằng một thứ mới thì người đọc phải đọc hết câu mới biết nó liên quan gì.
2. Gọi lại một thứ sao cho người đọc biết ngay là thứ nào: this/it/they/them phải trỏ vào đúng một thứ (thêm danh từ: this problem, such parents); gọi lại bằng chữ khoá đổi dạng hoặc một danh từ chung; tránh lặp nguyên văn cụm dài nhiều lần, và tránh đổi tên liên tục (pollution → contamination → smog) khiến người đọc tưởng là thứ khác.
3. Chỉ dùng từ nối khi quan hệ giữa hai câu không tự rõ ra được. Dư: Firstly không có Secondly; Furthermore … also; As a result, this leads to (nói một quan hệ hai lần); từ nối ở đầu gần như mọi câu. Thiếu: chỗ quay từ ô 2 sang rebuttal gần như luôn cần However. Sai quan hệ: Moreover cho một ý mạnh hơn hẳn; Therefore khi câu sau chỉ là ví dụ. Từ nối đối lập có thể đặt sau chủ ngữ ("These benefits, however, …") để không chiếm đầu câu.

Đọc và sửa theo thứ tự to xuống nhỏ: Task Response → Coherence (cả bài → trong đoạn → trong câu) → Cohesion (đầu câu → chữ trỏ và tên gọi lại → từ nối). Một lỗi cohesion thường là hậu quả của một lỗi coherence (một ý phụ chen vào giữa làm "It" trỏ sai, "this problem" có hai cách hiểu, "Moreover" biến ý phụ thành ý ngang hàng), và chỗ sơ đồ ý chính – ý phụ không vẽ được thường đi kèm một chỗ Task Response (ý chính bị thiếu thì ý phụ không có gì để chỉ về). Sửa ở gốc thì lỗi ở ngọn tự hết.

## Bốn tiêu chí chấm IELTS Task 2 (diễn giải theo mô tả band công khai)
- **Task Response (TR)**: trả lời đủ mọi phần của đề; lập trường rõ và giữ nhất quán từ mở bài tới kết bài; ý chính được mở rộng và chứng minh (không chỉ liệt kê); không lạc đề; đủ 250 từ. Band 7: lập trường rõ, được phát triển, ý chính mở rộng và có lý do. Band 6: có lập trường nhưng kết luận có thể chưa rõ, chưa có lý do hoặc lặp; một số ý chính chưa phát triển đủ. Band 5: lập trường chưa luôn rõ, ý giới hạn, phát triển chưa đủ, có thể lạc đề một phần.
- **Coherence & Cohesion (CC)**: Band 6: ý nhìn chung sắp xếp mạch lạc, có tiến trình chung; từ nối dùng có hiệu quả phần nào nhưng có chỗ sai, máy móc, dư hoặc thiếu; tham chiếu và thay thế chưa linh hoạt hoặc chưa rõ, dẫn tới lặp hoặc lỗi; chia đoạn chưa luôn hợp lý hoặc ý trung tâm của đoạn chưa luôn rõ. Band 7: ý sắp xếp logic, tiến trình rõ xuyên suốt; dùng linh hoạt nhiều phương tiện liên kết kể cả tham chiếu và thay thế, còn vài chỗ sai hoặc dư/thiếu; chia đoạn nhìn chung hiệu quả, thứ tự ý trong đoạn nhìn chung hợp lý. Band 8: người đọc theo được dễ dàng ("followed with ease"), ý được sắp thứ tự logic, liên kết được quản lý tốt, chỉ thỉnh thoảng có sơ suất; chia đoạn đủ và hợp lý. Band 9: liên kết dùng tới mức hiếm khi gây chú ý. Khoảng cách 7 → 8 nằm chủ yếu ở thứ tự trong đoạn và việc người đọc không phải dừng lại, không nằm ở việc biết thêm từ nối.
- **Lexical Resource (LR)**: vốn từ đủ rộng và chính xác cho chủ đề; collocation tự nhiên; ít lặp; chính tả và cấu tạo từ đúng; tránh từ mơ hồ ("things", "good", "a lot of people") khi cần cụ thể.
- **Grammatical Range & Accuracy (GRA)**: đa dạng cấu trúc (câu phức, mệnh đề quan hệ, điều kiện…); tỉ lệ câu không lỗi; dấu câu đúng. Band 7: nhiều câu không lỗi, kiểm soát tốt ngữ pháp và dấu câu. Band 6: kết hợp câu đơn và phức, có lỗi nhưng hiếm khi gây khó hiểu.
Band tổng = trung bình bốn tiêu chí, làm tròn tới 0.5 gần nhất (.25 làm tròn lên .5, .75 làm tròn lên số nguyên).

## Các đề cần viết (106 đề, chia thành 18 đợt)

Mỗi lần, xin viết **một đợt** (khoảng 6 đề) và trả về một mảng JSON cho đợt đó.

### Đợt 1

- **promptId: `prison-vs-education`** · Agree or Disagree
  Đề: Prison is the common way in most countries to solve the problem of crime. However, a more effective solution is to provide people with a better education. To what extent do you agree or disagree with this opinion?
  Đề bài yêu cầu: Nói rõ giáo dục có hiệu quả hơn nhà tù trong việc giảm tội phạm hay không, và trong điều kiện nào. | So sánh hai cách, không chỉ bàn riêng về giáo dục.

- **promptId: `tall-apartment-blocks`** · Agree or Disagree
  Đề: The best way to provide enough homes in large cities is to build tall apartment blocks. To what extent do you agree or disagree with this statement?
  Đề bài yêu cầu: Nói rõ chung cư cao tầng có phải cách tốt nhất hay không. | Chữ "the best way": cần so với các cách khác, không chỉ nói lợi ích của chung cư.

- **promptId: `fast-food-regulation`** · Agree or Disagree
  Đề: Governments should impose stricter regulations on fast food to promote public health. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ có nên siết quy định hay không, và loại quy định nào. | Gắn với mục tiêu "public health": quy định có thật sự làm sức khoẻ tốt hơn không?

- **promptId: `parenting-skills-at-school`** · Agree or Disagree
  Đề: Some people say schools should teach parenting skills to young people. Do you agree or disagree?
  Đề bài yêu cầu: Nói rõ trường học có nên dạy kỹ năng làm cha mẹ hay không, và cho lứa tuổi nào. | Xét cái giá: thời gian học, người dạy, môn khác bị cắt bớt.

- **promptId: `young-offenders-as-adults`** · Agree or Disagree
  Đề: Some people believe that young people who commit serious crimes should be punished in the same way as adults. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ có nên xử phạt như người lớn hay không, và trong trường hợp nào. | Chữ "serious crimes": chỉ xét tội nghiêm trọng, không phải mọi vi phạm.

- **promptId: `younger-leaders`** · Agree or Disagree
  Đề: Directors and managers of organisations are often older people. Some people say that it is better for younger people to be leaders. To what extent do you agree?
  Đề bài yêu cầu: Nói rõ người trẻ có nên làm lãnh đạo hơn không, và trong loại tổ chức nào. | So sánh với người lớn tuổi, không chỉ kể ưu điểm của người trẻ.

### Đợt 2

- **promptId: `traditional-vs-modern-games`** · Agree or Disagree
  Đề: Some people think traditional games are better than modern games in helping children develop their abilities. To what extent do you agree?
  Đề bài yêu cầu: Nói rõ trò chơi truyền thống có giúp trẻ phát triển hơn không, và ở khả năng nào. | So sánh hai loại trò chơi trên cùng một khả năng (thể chất, xã hội, tư duy…).

- **promptId: `social-media-regulation`** · Agree or Disagree
  Đề: Governments should regulate the use of social media platforms to protect citizens from harmful content. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ chính phủ có nên quản lý mạng xã hội hay không, và đến mức nào. | Gắn với mục tiêu bảo vệ người dân khỏi nội dung độc hại: cái giá là gì?

- **promptId: `road-safety-punishments`** · Agree or Disagree
  Đề: The only way to improve safety on our roads is to give much stricter punishments for driving offences. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ phạt nặng có phải cách duy nhất không. | Chữ "the only way": cần xét các cách khác, không chỉ nói phạt nặng có tác dụng.

- **promptId: `school-arts-vs-professional`** · Agree or Disagree
  Đề: Government money should be spent on encouraging children to take part in sports and arts in schools rather than supporting professional sports and artistic performances for the general public. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ có nên ưu tiên trẻ em ở trường hơn thể thao, nghệ thuật chuyên nghiệp không. | Đây là so sánh hai cách chi tiền: xét cả hai bên, không chỉ bên trẻ em.

- **promptId: `children-watching-tv`** · Agree or Disagree
  Đề: Children can learn effectively by watching television. Therefore, they should be encouraged to watch television regularly at home and at school. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ có nên khuyến khích trẻ xem tivi thường xuyên không. | Đề có hai bước: tivi giúp học hiệu quả, nên khuyến khích xem thường xuyên. Xét cả bước suy luận này.

- **promptId: `success-and-luck`** · Agree or Disagree
  Đề: Some people believe that success in life is mostly a matter of luck. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ thành công có chủ yếu do may mắn hay không. | Chữ "mostly": không cần phủ nhận may mắn, mà xét nó có chiếm phần lớn hay không.

### Đợt 3

- **promptId: `paternity-leave`** · Agree or Disagree
  Đề: All fathers should be entitled to time off from work after a child is born. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ mọi người cha có nên được nghỉ hay không. | Chữ "all fathers": xét cả nơi làm việc nhỏ và người lao động tự do.

- **promptId: `space-exploration-spending`** · Agree or Disagree
  Đề: Many people claim that spending money on developing technology for space exploration is unjustifiable. They believe there are more beneficial ways to use this money. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ chi tiền cho công nghệ thám hiểm vũ trụ có hợp lý không. | Đề so sánh với "cách dùng tiền có ích hơn": cần xét cách đó là gì.

- **promptId: `restore-old-buildings`** · Agree or Disagree
  Đề: Restoration of old buildings in main cities involves enormous government expenditure. Some people think this money would be better spent on building new houses and roads. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ tiền nên dùng xây nhà, đường mới thay vì trùng tu hay không. | So sánh hai cách dùng tiền, không chỉ nói một bên.

- **promptId: `work-and-meaning`** · Agree or Disagree
  Đề: The most important element in a person’s life is their work. Without a satisfying career, life is meaningless. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ công việc có phải yếu tố quan trọng nhất không. | Đề có hai ý: công việc quan trọng nhất, và không có sự nghiệp thì cuộc sống vô nghĩa. Xét cả hai.

- **promptId: `local-vs-global-environment`** · Agree or Disagree
  Đề: The government should reduce the amount of money spent on local environmental problems and instead increase funding for urgent and more threatening issues such as global warming. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ có nên chuyển tiền từ vấn đề địa phương sang vấn đề toàn cầu không. | So sánh hai cách dùng tiền, xét cả người dân địa phương.

- **promptId: `work-only-for-money`** · Agree or Disagree
  Đề: The only reason why people work hard is to earn money and there is no other reason for doing so. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ tiền có phải lý do duy nhất không. | Chữ "the only reason": chỉ cần một lý do khác có thật là đủ để phản bác.

### Đợt 4

- **promptId: `one-job-vs-switching`** · Agree or Disagree
  Đề: Some people think that people who choose a job early and keep doing it are more likely to get a satisfying career life than those who frequently change jobs. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ nhóm nào dễ có sự nghiệp hài lòng hơn. | Định nghĩa "satisfying career" trước khi so sánh hai nhóm.

- **promptId: `school-until-18`** · Agree or Disagree
  Đề: Some people believe that students should not be allowed to leave school before the age of 18. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ có nên cấm rời trường trước 18 tuổi không. | Xét những học sinh muốn đi làm hoặc học nghề sớm.

- **promptId: `trees-vs-housing`** · Agree or Disagree
  Đề: Some people say it is more important to plant trees in the open spaces in towns and cities than to build more housing. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ trồng cây có quan trọng hơn xây nhà không. | So sánh hai cách dùng đất trống, xét cả người đang thiếu nhà ở.

- **promptId: `ban-competitive-sports`** · Agree or Disagree
  Đề: Some people think that competitive sports have a negative effect on children because they cause a fear of losing. Therefore, competitive sports should be banned for young people. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ có nên cấm thể thao thi đấu với người trẻ không. | Đề có hai bước: thể thao gây sợ thua, nên cấm. Xét cả bước suy luận này.

- **promptId: `school-purpose-citizens`** · Agree or Disagree
  Đề: Some people think the main purpose of school is to turn children into good citizens and workers, rather than to benefit them as individuals. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ theo bạn mục đích chính của trường học là gì. | Đề đặt hai mục đích đối lập: xét chúng có thật sự loại trừ nhau không.

- **promptId: `advertising-unnecessary`** · Agree or Disagree
  Đề: If a product is good or it meets people’s needs, people will buy it. Therefore, advertising is unnecessary and no more than entertainment. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ quảng cáo có thật sự không cần thiết không. | Đề có hai bước: hàng tốt tự bán được, nên quảng cáo vô ích. Xét cả bước suy luận này.

### Đợt 5

- **promptId: `business-social-responsibility`** · Agree or Disagree
  Đề: As well as making money, businesses also have social responsibilities. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ doanh nghiệp có trách nhiệm xã hội hay không, và trách nhiệm gì. | Chữ "as well as": trách nhiệm xã hội đi cùng lợi nhuận, không thay thế nó.

- **promptId: `technology-free-time`** · Agree or Disagree
  Đề: It was predicted that people living in the twenty-first century would have more free time than ever before because of improvements in technology. To what extent has this prediction come true?
  Đề bài yêu cầu: Nói rõ dự đoán đã thành sự thật đến mức nào, và với ai. | Tách công nghệ tiết kiệm thời gian và công nghệ lấy thêm thời gian của người ta.

- **promptId: `university-places`** · Agree or Disagree
  Đề: It is neither possible nor useful for a country to provide university places for a high proportion of young people. To what extent do you agree or disagree?
  Đề bài yêu cầu: Đề có hai ý: không khả thi và không có ích. Xét riêng từng ý. | Nói rõ bạn đồng ý đến mức nào, và với loại đất nước nào.

- **promptId: `workforce-vs-academic`** · Agree or Disagree
  Đề: Schools should focus more on teaching students how to be successful in the workforce and less on helping them to achieve academic success. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ trường học có nên ưu tiên kỹ năng đi làm hơn thành tích học tập không. | Chữ "more… less": đây là chuyện tỉ lệ, không phải bỏ hẳn một bên.

- **promptId: `stop-economic-development`** · Agree or Disagree
  Đề: Some people argue that economic development causes serious harm to the environment, so they believe we should stop developing further in order to protect it. Do you agree or disagree?
  Đề bài yêu cầu: Nói rõ có nên ngừng phát triển kinh tế để bảo vệ môi trường không. | Đề có hai bước: phát triển gây hại, nên ngừng phát triển. Xét cả bước suy luận này.

- **promptId: `team-vs-solo-activities`** · Agree or Disagree
  Đề: Group or team activities can teach more important skills for life than those activities which are done alone. To what extent do you agree or disagree?
  Đề bài yêu cầu: Nói rõ hoạt động nhóm có dạy được kỹ năng sống quan trọng hơn không. | So sánh hai loại hoạt động trên cùng loại kỹ năng.

### Đợt 6

- **promptId: `customs-and-traditions`** · Agree or Disagree
  Đề: Many customs and traditional ways of behavior are no longer relevant to modern life and not worth keeping. Do you agree or disagree?
  Đề bài yêu cầu: Nói rõ phong tục truyền thống có còn đáng giữ không. | Chữ "many": không cần bàn mọi phong tục, mà xét những loại nào.

- **promptId: `study-any-subject`** · Discussion
  Đề: Some people think university students should study whatever they like. Others believe they should only study subjects that will be useful in the future, such as science and technology. Discuss both views and give your opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `international-news-subject`** · Discussion
  Đề: Some people think secondary school students should study international news as one of their subjects, while others believe that this is a waste of valuable school time? Discuss both these views and give your own opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `university-admission`** · Discussion
  Đề: Many people believe that universities should only offer places to students with the highest marks. Others say they should accept people of all ages, even if they did not do well at school. Discuss both views and give your own opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `technology-isolation`** · Discussion
  Đề: Some people think that technology makes people more isolated, while others believe it helps people communicate better. Discuss both views and give your opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `dependent-vs-independent`** · Discussion
  Đề: Some people think that in the modern world we are becoming more dependent on each other, while others believe people have become more independent. Discuss both views and give your own opinion.
  Đề bài yêu cầu: (không có)

### Đợt 7

- **promptId: `scheduled-activities-vs-free-play`** · Discussion
  Đề: Some people believe that children’s time outside of school should be filled with scheduled activities such as art and music classes and sports. Others feel that children need free time to play and relax. Discuss both these views and give your own opinion.
  Đề bài yêu cầu: Quan điểm thứ hai nêu hai lý do: kinh tế và văn hoá. Xét cả hai.

- **promptId: `theatres-and-cinemas`** · Discussion
  Đề: Some people say that in the digital age, theatres and cinemas are no longer important, as people can watch all the entertainment they want online. Others argue that theatres and cinemas are still important both economically and culturally. Discuss both views and give your own opinion.
  Đề bài yêu cầu: Quan điểm thứ hai nêu hai lý do: kinh tế và văn hoá. Xét cả hai.

- **promptId: `family-history`** · Discussion
  Đề: In many parts of the world, people do research on their family history. Some people believe that finding out about previous generations is a useful thing to do. However, others believe that it is better to focus on present and future generations. Discuss both views and give your opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `signals-to-aliens`** · Discussion
  Đề: Some scientists believe that there are intelligent life forms on other planets and we should send messages into space to connect with them. Other scientists think that connecting with them is too dangerous. Discuss both views and give your own opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `countryside-vs-city-health`** · Discussion
  Đề: Some people believe that it is easier to have a healthy lifestyle in the countryside. Others believe that there are health benefits of living in cities. Discuss both views and give your opinion.
  Đề bài yêu cầu: Đề chỉ nêu một quan điểm: bạn tự dựng quan điểm ngược lại rồi bàn cả hai. | Nêu rõ bạn nghiêng về bên nào, và trong điều kiện nào.

- **promptId: `minerals-in-space`** · Discussion
  Đề: Some people think that it is worth researching different minerals in space. Others, however, disagree. Discuss both views and give your opinion.
  Đề bài yêu cầu: Đề chỉ nêu một quan điểm: bạn tự dựng quan điểm ngược lại rồi bàn cả hai. | Nêu rõ bạn nghiêng về bên nào, và trong điều kiện nào.

### Đợt 8

- **promptId: `single-global-language`** · Discussion
  Đề: Some argue that a single global language should be taught in all schools. Discuss both views and give your own opinion.
  Đề bài yêu cầu: Đề chỉ nêu một quan điểm: bạn tự dựng quan điểm ngược lại rồi bàn cả hai. | Nêu rõ bạn nghiêng về bên nào, và trong điều kiện nào.

- **promptId: `criticising-teachers`** · Discussion
  Đề: Some people think that in order to continuously improve the quality of education, high school students should be encouraged to criticise their teachers. Others think that would result in a loss of principle in class. Discuss both views and give your opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `remote-work-who-benefits`** · Discussion
  Đề: Some people think that remote working benefits employees the most, while others believe it only advantages employers. Discuss both views and give your opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `free-education-all-levels`** · Discussion
  Đề: Some people believe that the government should provide free education at all levels, while others argue that students should pay for their university education. Discuss both views and give your own opinion
  Đề bài yêu cầu: (không có)

- **promptId: `group-vs-solo-study`** · Discussion
  Đề: Some people think that it is more effective for students to study in a group, while others believe that it is better for them to study alone. Discuss both views and give your own opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `social-life-at-work`** · Discussion
  Đề: Some people think a job not only provides income but also social life. Others think it is better to develop a social life with people you do not work with. Discuss both views and give your opinion.
  Đề bài yêu cầu: (không có)

### Đợt 9

- **promptId: `parental-supervision`** · Discussion
  Đề: Some people think parents should supervise their children’s activities closely, while others believe children should have more freedom. Discuss both views and give your opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `sports-funding-athletes`** · Discussion
  Đề: Some people think that governments should spend more money on sports facilities for top athletes. Others argue that this money should be spent on sports facilities for ordinary people. Discuss both sides and give your opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `zoos`** · Discussion
  Đề: Some people think that zoos are cruel and should be closed down. Others, however, believe that zoos can be useful in protecting wild animals. Discuss both views and give your opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `free-libraries`** · Discussion
  Đề: Some people think the government should establish free libraries in each town. Others believe that it is a waste of money since people can access the Internet to obtain information. Discuss both views and give your own opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `junk-food-responsibility`** · Discussion
  Đề: Some people state that schools should have a social responsibility to encourage children not to eat junk food. Others believe that parents should take responsibility for their children's eating habits. Discuss both views and state your opinion
  Đề bài yêu cầu: (không có)

- **promptId: `subsidise-vs-tax-food`** · Discussion
  Đề: Some people think the government should subsidise fruits and vegetables to make healthy food more affordable. Others argue that the government should tax unhealthy food . Discuss both views and give your opinion.
  Đề bài yêu cầu: (không có)

### Đợt 10

- **promptId: `art-talent`** · Discussion
  Đề: Some people say that every human being can create art (e.g. painting), others think only the people born with the ability can create art. Discuss both views and give your opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `taxes-enough`** · Discussion
  Đề: Some people think paying taxes is a big enough contribution to their society, while others think people have more responsibilities as members of society than only paying taxes. Discuss both views and give your opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `breadth-vs-depth`** · Discussion
  Đề: Some people think that older school children should learn a wide range of subjects to acquire more knowledge, while other people believe they should learn a small number of subjects in detail. Discuss both views and give your opinion
  Đề bài yêu cầu: (không có)

- **promptId: `extracurricular-vs-academic`** · Discussion
  Đề: Some people believe schools should provide more extracurricular activities to support students’ overall development, while others think schools should concentrate mainly on academic learning. Discuss both views and give your opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `individuals-vs-government-environment`** · Discussion
  Đề: Some people think that environmental problems are too big for individuals to solve, while others think that the government cannot solve these environmental problems unless individuals make some action. Discuss both views and give your opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `climate-change-business`** · Discussion
  Đề: Some people think that climate change could have a negative effect on business, while others think that it could create more business opportunities. Discuss both views and give your own opinion.
  Đề bài yêu cầu: (không có)

### Đợt 11

- **promptId: `prison-vs-alternatives`** · Discussion
  Đề: Some people think all lawbreakers should be sent to prison, while others believe that there are better alternatives (eg. community work). Discuss both views and give your own opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `newspapers-vs-other-media`** · Discussion
  Đề: Some people think that newspapers are the best way to get news. However, others believe that they can get news better through another media platform. Discuss both views and give your opinion.
  Đề bài yêu cầu: (không có)

- **promptId: `elderly-life-now`** · Discussion
  Đề: Some people say that in the modern world, getting old is entirely bad. Others, however, say that life for the elderly nowadays is much better than it was in the past. Discuss both views and give your own opinion.
  Đề bài yêu cầu: So sánh ưu và nhược điểm, rồi nói bên nào nặng hơn. | Nói rõ điều kiện khiến ưu điểm (hoặc nhược điểm) thắng.

- **promptId: `purpose-of-education`** · Discussion
  Đề: Some people say that the purpose of education is to prepare individuals to be useful to society. Others say its purpose is to prepare individuals to achieve personal ambitions. Discuss both views and give your opinion.
  Đề bài yêu cầu: So sánh ưu và nhược điểm, rồi nói bên nào nặng hơn. | Nói rõ điều kiện khiến ưu điểm (hoặc nhược điểm) thắng.

- **promptId: `gap-year-sample`** · Advantages and Disadvantages
  Đề: Many young people now take a gap year before starting university. Do the advantages of this outweigh the disadvantages?
  Đề bài yêu cầu: So sánh ưu và nhược điểm, rồi nói bên nào nặng hơn. | Nói rõ điều kiện khiến ưu điểm (hoặc nhược điểm) thắng.

- **promptId: `study-abroad-or-placement`** · Advantages and Disadvantages
  Đề: All university undergraduate courses should include a period of time spent studying abroad or doing a work placement. Do you think the advantages of this would outweigh the disadvantages?
  Đề bài yêu cầu: So sánh ưu và nhược điểm của việc bắt buộc mọi khoá đại học có kỳ du học hoặc thực tập, rồi nói bên nào nặng hơn. | Xét chữ "all": yêu cầu áp dụng cho mọi ngành và mọi sinh viên.

### Đợt 12

- **promptId: `credit-cards`** · Advantages and Disadvantages
  Đề: Nowadays it is easy to apply for and be given a credit card. However, some people experience problems when they are not able to pay their debt back. In your opinion, do the advantages of credit cards outweigh the disadvantages?
  Đề bài yêu cầu: So sánh ưu và nhược điểm của thẻ tín dụng, rồi nói bên nào nặng hơn. | Đề nhấn vào việc thẻ dễ được cấp và có người không trả được nợ: xét ai dễ gặp rủi ro nhất.

- **promptId: `studying-abroad`** · Advantages and Disadvantages
  Đề: More and more students choose to move to other countries to study for higher education. Do the advantages outweigh the disadvantages?
  Đề bài yêu cầu: So sánh ưu và nhược điểm của việc ra nước ngoài học đại học, rồi nói bên nào nặng hơn. | Xét cả sinh viên lẫn đất nước của họ.

- **promptId: `ai-replacing-workers`** · Advantages and Disadvantages
  Đề: Artificial intelligence will eventually replace most human workers. Do the advantages of this development outweigh the disadvantages?
  Đề bài yêu cầu: So sánh ưu và nhược điểm khi AI thay phần lớn người lao động, rồi nói bên nào nặng hơn. | Đề nói "most human workers": xét ở quy mô cả xã hội.

- **promptId: `businesses-to-rural-areas`** · Advantages and Disadvantages
  Đề: As transport and accommodation problems are increasing in many large cities, some governments are encouraging businesses to move to rural areas. Do you think the advantages outweigh the disadvantages?
  Đề bài yêu cầu: So sánh ưu và nhược điểm của việc đưa doanh nghiệp về nông thôn, rồi nói bên nào nặng hơn. | Xét cả thành phố lớn lẫn vùng nông thôn.

- **promptId: `government-pays-fees`** · Advantages and Disadvantages
  Đề: In some countries, students pay their college or university fees, while in some others, the government pays for them. Do you think the advantages of the government paying the money outweigh the disadvantages?
  Đề bài yêu cầu: So sánh ưu và nhược điểm khi nhà nước trả học phí, rồi nói bên nào nặng hơn. | Xét cả người không học đại học nhưng vẫn đóng thuế.

- **promptId: `gap-year-study`** · Advantages and Disadvantages
  Đề: Some school leavers go travelling or work for a period of time instead of going directly to university. Do you think this has more advantages or disadvantages for their study?
  Đề bài yêu cầu: So sánh ưu và nhược điểm, rồi nói bên nào nặng hơn. | Đề hỏi riêng ảnh hưởng tới việc học, không phải tới cuộc sống nói chung.

### Đợt 13

- **promptId: `working-from-home`** · Positive or Negative Development
  Đề: More and more people are choosing to work from home. Is this a positive or negative development?
  Đề bài yêu cầu: Nói rõ đây là tích cực hay tiêu cực, và trong điều kiện nào. | Đánh giá chính xu hướng làm việc tại nhà, không bàn chung về công nghệ.

- **promptId: `long-working-hours`** · Positive or Negative Development
  Đề: In some countries, people are spending long hours at the workplace. Is it a positive or negative development?
  Đề bài yêu cầu: Nói rõ đây là xu hướng tích cực hay tiêu cực, và với ai. | Đánh giá chính việc làm nhiều giờ, không bàn chung về công việc.

- **promptId: `online-university-courses`** · Positive or Negative Development
  Đề: More and more universities are replacing face-to-face teaching with online courses. Do you think this is a positive or negative development?
  Đề bài yêu cầu: Nói rõ đây là tích cực hay tiêu cực, và với ai. | Đánh giá việc thay thế lớp trực tiếp, không chỉ việc có thêm khoá online.

- **promptId: `youth-in-malls`** · Positive or Negative Development
  Đề: In many countries, young people spend a large amount of their free time in shopping malls rather than taking part in other activities such as sports or music. Is this a positive or negative development?
  Đề bài yêu cầu: Nói rõ đây là tích cực hay tiêu cực, và trong điều kiện nào. | Đề so sánh với thể thao, âm nhạc: xét cả những gì người trẻ bỏ lỡ.

- **promptId: `children-more-freedom`** · Positive or Negative Development
  Đề: In many parts of the world, children are given more freedom than in the past. Is this a positive or negative development?
  Đề bài yêu cầu: Nói rõ đây là tích cực hay tiêu cực, và là tự do kiểu gì. | So sánh với quá khứ như đề nêu.

- **promptId: `tours-to-remote-places`** · Positive or Negative Development
  Đề: Organised tours to remote places and communities are becoming more and more popular. Is it a positive or negative development to local people and the environment?
  Đề bài yêu cầu: Nói rõ đây là tích cực hay tiêu cực. | Đề hỏi riêng về người dân địa phương và môi trường: xét cả hai.

### Đợt 14

- **promptId: `international-food-in-supermarkets`** · Positive or Negative Development
  Đề: Supermarkets in many countries now stock a wide range of foods from different parts of the world. Do you consider this a positive or negative development?
  Đề bài yêu cầu: Nói rõ đây là tích cực hay tiêu cực, và với ai. | Xét cả người tiêu dùng lẫn nông dân trong nước.

- **promptId: `space-tourism`** · Positive or Negative Development
  Đề: Space travel has been possible for some time and some people claim that space tourism could be developed in the future. Do you think it is a positive or negative development?
  Đề bài yêu cầu: Nói rõ phát triển du lịch vũ trụ là tích cực hay tiêu cực. | Xét cả những người không bao giờ đi được: môi trường, chi phí xã hội.

- **promptId: `admiring-celebrities`** · Positive or Negative Development
  Đề: Nowadays, young people are admiring media and sports stars, even though they often do not set a good example. Do you think this is a positive or negative development?
  Đề bài yêu cầu: Nói rõ đây là tích cực hay tiêu cực. | Đề nói người nổi tiếng thường không làm gương tốt: xét chuyện này.

- **promptId: `obesity-problems`** · Causes, Problems and Solutions
  Đề: Obesity is rising in many countries. What problems does this cause? What can be done to tackle it?
  Đề bài yêu cầu: Câu ①: nêu vấn đề do béo phì gây ra, không giải thích vì sao béo phì tăng. | Câu ②: mỗi giải pháp phải xử lý một vấn đề ở câu ①.

- **promptId: `car-ban-problems`** · Causes, Problems and Solutions
  Đề: A government plans to ban private cars from the city centre. What problems might this cause?
  Đề bài yêu cầu: Nêu vấn đề do lệnh cấm gây ra, không bàn chung về ô tô. | Xét ai bị ảnh hưởng nhiều nhất khi kế hoạch được áp dụng.

- **promptId: `car-ban-solutions`** · Causes, Problems and Solutions
  Đề: A government plans to ban private cars from the city centre. What problems might this cause? How can these problems be solved?
  Đề bài yêu cầu: Câu ①: nêu vấn đề do lệnh cấm gây ra. | Câu ②: mỗi giải pháp phải xử lý một vấn đề ở câu ①.

### Đợt 15

- **promptId: `declining-bicycle-use`** · Causes, Problems and Solutions
  Đề: In certain countries, the number of people who use bicycles as the main means of transport is reducing even though it is beneficial both physically and environmentally. What can be the reasons for this change in preference? How can people be encouraged to use bicycles?
  Đề bài yêu cầu: Câu ①: giải thích vì sao người ta bỏ xe đạp dù nó có lợi cho sức khoẻ và môi trường.

- **promptId: `anti-social-behaviour`** · Causes, Problems and Solutions
  Đề: In many countries, there is a general increase in anti-social behaviour and a lack of respect for others. What are the causes of this and how can this situation be improved?
  Đề bài yêu cầu: Câu ①: giải thích vì sao hành vi thiếu tôn trọng người khác tăng lên.

- **promptId: `global-environment-solutions`** · Causes, Problems and Solutions
  Đề: Environmental problems such as climate change and pollution affect everyone around the world. Although efforts to tackle these problems are made on a global-scale, few solutions can be found. Why are so few solutions taken? How can these problems be solved?
  Đề bài yêu cầu: Câu ①: giải thích vì sao nỗ lực toàn cầu ít mang lại giải pháp, không giải thích vì sao ô nhiễm xảy ra.

- **promptId: `weight-and-fitness`** · Causes, Problems and Solutions
  Đề: In some countries, the average weight of people is increasing and their levels of health and fitness are decreasing. What do you think are the causes of these problems and what measures can be taken to solve them?
  Đề bài yêu cầu: Câu ①: giải thích vì sao cân nặng tăng và thể lực giảm.

- **promptId: `throwaway-culture`** · Causes, Problems and Solutions
  Đề: In many parts of the world, people now often throw things away when they are broken and buy new ones, whereas in the past broken things were repaired and used again. Why do you think this is the case? What problems may it lead to?
  Đề bài yêu cầu: Câu ①: giải thích vì sao người ta vứt đi thay vì sửa. | Câu ②: nêu vấn đề do thói quen này gây ra.

- **promptId: `growing-cities-young-people`** · Causes, Problems and Solutions
  Đề: As major cities in the world are growing today, so do their problems. What are the problems for young people living in the cities as the result of continued growth? What are the solutions to these problems?
  Đề bài yêu cầu: Câu ①: nêu vấn đề của người trẻ do thành phố lớn lên, không phải vấn đề chung của đô thị. | Câu ②: mỗi giải pháp phải xử lý một vấn đề ở câu ①.

### Đợt 16

- **promptId: `money-management-skills`** · Causes, Problems and Solutions
  Đề: In many countries, students leave high school without understanding how to manage their money. Why is this? What solutions can be suggested to help students manage their finances effectively?
  Đề bài yêu cầu: Câu ①: giải thích vì sao học sinh ra trường chưa biết quản lý tiền.

- **promptId: `imported-food`** · Causes, Problems and Solutions
  Đề: In many countries today, people are buying more imported food rather than food produced locally. What are the problems caused by this trend? What can be done to solve these problems?
  Đề bài yêu cầu: Câu ①: nêu vấn đề do mua thực phẩm nhập khẩu gây ra. | Câu ②: mỗi giải pháp phải xử lý một vấn đề ở câu ①.

- **promptId: `household-rubbish`** · Causes, Problems and Solutions
  Đề: In many countries, the amount of household rubbish is increasing. What do you think are the causes of this problem? What can be done to solve it?
  Đề bài yêu cầu: Câu ①: giải thích vì sao rác sinh hoạt tăng.

- **promptId: `elderly-care-decline`** · Causes, Problems and Solutions
  Đề: In many countries, family members and friends are spending less time looking after elderly relatives. What are the reasons for this? What effects does this have on the elderly and society?
  Đề bài yêu cầu: Câu ①: giải thích vì sao gia đình, bạn bè ít chăm người già hơn. | Câu ②: nêu ảnh hưởng tới cả người già lẫn xã hội.

- **promptId: `young-and-old-apart`** · Causes, Problems and Solutions
  Đề: In many countries, young people are spending less time with older people. What are the reasons for this? What can be done to solve this problem?
  Đề bài yêu cầu: Câu ①: giải thích vì sao người trẻ ít dành thời gian với người lớn tuổi.

- **promptId: `food-waste`** · Causes, Problems and Solutions
  Đề: Every day, millions of tons of food are wasted all over the world. Why do you think this is happening? And how can we solve this problem?
  Đề bài yêu cầu: Câu ①: giải thích vì sao thực phẩm bị lãng phí.

### Đợt 17

- **promptId: `living-alone`** · Two-Part Question
  Đề: In many countries, a growing number of young adults now choose to live alone. Why is this happening? Is this a positive or negative development?
  Đề bài yêu cầu: Câu ①: giải thích vì sao người trẻ chọn sống một mình, không chỉ mô tả hiện tượng. | Câu ②: nói rõ đây là tích cực hay tiêu cực, và trong điều kiện nào.

- **promptId: `tourism-limits`** · Two-Part Question
  Đề: Tourism is growing fast in many popular cities. What problems does this cause? Do you agree that the number of tourists should be limited?
  Đề bài yêu cầu: Câu ①: nêu vấn đề do du lịch tăng nhanh gây ra. | Câu ②: nói rõ có nên giới hạn khách hay không, và trong điều kiện nào.

- **promptId: `rural-to-city`** · Two-Part Question
  Đề: More and more young people are leaving rural areas to live in cities. What are the causes of this? What effects does it have?
  Đề bài yêu cầu: Câu ①: giải thích vì sao người trẻ rời nông thôn. | Câu ②: nêu ảnh hưởng tới nông thôn, thành phố hoặc chính người trẻ.

- **promptId: `competitiveness`** · Two-Part Question
  Đề: In many societies, competitiveness is regarded as an important personal quality. How does this affect individuals? Do you think this is a beneficial or harmful trend?
  Đề bài yêu cầu: Câu ①: nêu ảnh hưởng tới từng cá nhân, cả tốt lẫn xấu. | Câu ②: nói rõ xu hướng này có lợi hay có hại, và với ai.

- **promptId: `online-shopping-effects`** · Two-Part Question
  Đề: Online shopping is becoming more popular. How could this trend affect our environment and the kinds of work required?
  Đề bài yêu cầu: Đề có một câu hỏi nhưng hai phần: ảnh hưởng tới môi trường và tới loại công việc cần có. Bàn cả hai. | Nêu ảnh hưởng của chính việc mua sắm online, không bàn chung về công nghệ.

- **promptId: `ambition`** · Two-Part Question
  Đề: Ambition is a positive quality for people to have in society today. How important is it for people who want to succeed in life? Is it a positive or negative characteristic?
  Đề bài yêu cầu: Câu ①: giải thích tham vọng giúp (hoặc không giúp) người muốn thành công như thế nào. | Câu ②: nói rõ đây là tính cách tích cực hay tiêu cực, và trong điều kiện nào.

### Đợt 18

- **promptId: `declining-science-students`** · Two-Part Question
  Đề: Fewer students are studying science subjects at university. What are the reasons for this? What are the effects on society?
  Đề bài yêu cầu: Câu ①: giải thích vì sao ít sinh viên chọn ngành khoa học. | Câu ②: nêu ảnh hưởng tới xã hội, không chỉ tới sinh viên.

- **promptId: `young-population-effects`** · Two-Part Question
  Đề: In some countries, the numbers of children aged 15 and younger are increasing dramatically. What are the current and future effects of an ever-increasing population?
  Đề bài yêu cầu: Đề có một câu hỏi nhưng hai mốc: ảnh hưởng hiện tại và tương lai. Bàn cả hai. | Nêu ảnh hưởng của dân số trẻ tăng nhanh, không bàn chung về dân số.

- **promptId: `road-safety-legal-system`** · Two-Part Question
  Đề: To what extent do you agree or disagree that stricter punishments are the only way to improve road safety? And, how might traffic laws and their enforcement influence the operation of the national legal system as a whole?
  Đề bài yêu cầu: Câu ①: nói rõ phạt nặng có phải cách duy nhất không. | Câu ②: nêu luật giao thông và việc thực thi ảnh hưởng tới cả hệ thống pháp luật thế nào.

- **promptId: `bicycle-investment`** · Two-Part Question
  Đề: Some countries spend a lot of money to make bicycle usage easier. Why is this? Is this the best solution to traffic congestion?
  Đề bài yêu cầu: Câu ①: giải thích vì sao các nước đầu tư cho xe đạp. | Câu ②: nói rõ đây có phải giải pháp tốt nhất cho tắc đường không, so với các cách khác.
