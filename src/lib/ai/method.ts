/**
 * The method from "The Art of Nuance in IELTS Writing", distilled for the AI reviewers.
 * Both reviews (chains and essay) are grounded in this text, so the feedback uses the book's words
 * (Driver, mạch, Logical Jump, Scope, ô 1–4…) and asks the questions the book teaches.
 * Keep it stable: it sits in the cached part of every request.
 */
export const METHOD = `
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
`.trim();
