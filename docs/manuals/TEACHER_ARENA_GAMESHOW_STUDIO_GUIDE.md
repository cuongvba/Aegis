# 🎡 HƯỚNG DẪN CẤU HÌNH & TỰ TẠO GAMESHOW RIÊNG TRÊN AEGIS ARENA
> **Dành cho Giáo viên Mầm non, Tiểu học, Trung học, Giảng viên & Ban tổ chức sự kiện**  
> *Chuẩn ALDS v4.0 — Đơn giản, Trực quan, Từng bước 1-2-3 có ví dụ thực tế minh họa.*

---

## 🌟 1. HIỂU VỀ ĐẤU TRƯỜNG AEGIS ARENA: KHÔNG CHỈ LÀ 6 GAMESHOW

Nhiều Thầy Cô khi mới làm quen với Aegis thường nghĩ: *"Hệ thống chỉ có 6 trò chơi truyền hình có sẵn (Olympia, Rung Chuông Vàng, Chiếc Nón Kỳ Diệu, University Challenge, Jeopardy, Nhanh Như Chớp)"*.

**Sự thật là**: 6 gameshow đó chỉ là **6 mẫu ví dụ ban đầu**!  
Aegis Arena được thiết kế theo kiến trúc **Hot-Plug GameshowPlugins**. Điều này có nghĩa là Thầy Cô hoàn toàn có thể:
1. **Tự thiết kế ra Gameshow mang tên riêng của lớp mình** (Ví dụ: *"Đố Vui Bé Ngoan 5 Tuổi"*, *"Nông Trại Vui Vẻ"*, *"Chinh Phục Vũ Trụ Lớp 3A"*).
2. **Tùy chỉnh luật chơi dễ như xếp hình Lego**: Thích bấm chuông nhanh, thích cho cả lớp cùng giơ bảng, thích leo thang điểm số, thích có quyền trợ giúp 50:50 hay hỏi Cô giáo đều làm được trong 1 phút!
3. **Cắm rút chạy ngay lập tức (Hot-Plug)**: Vừa bấm *Xuất bản* là trò chơi hiện ngay ở sảnh để học sinh bấm mã PIN vào chơi, không cần nhờ kỹ thuật viên lập trình!

---

## 🎯 2. VÍ DỤ MINH HỌA CỤ THỂ DỄ HIỂU NHẤT
> **Cô Mai — Giáo viên lớp Mầm non 5 tuổi** muốn tổ chức trò chơi cuối tuần:  
> **Tên trò chơi**: *"Bé Khỏe Bé Ngoan Đi Tìm Kho Báu"* 🐻🍎  
> **Cách chơi**:
> - Trên màn hình tivi lớn ở lớp hiện hình 4 bục thi đấu cho 4 đội (Tổ Gấu Misa, Tổ Thỏ Trắng, Tổ Mèo Con, Tổ Cún Con).
> - Cô đọc câu hỏi nhận biết con vật/hoa quả kèm hình ảnh to rõ.
> - Mỗi bé đại diện cầm máy tính bảng hoặc Cô bấm nút chuông to trên bàn. Đội nào bấm trước được quyền trả lời.
> - Trả lời đúng: Cô cộng 10 bông hoa điểm 🌸. Nếu khó quá, bé được dùng quyền trợ giúp *"Hỏi Cô Giáo"* hoặc *"Bỏ 2 đáp án sai"*.

Hãy cùng theo dõi cách Cô Mai tạo ra trò chơi này chỉ qua **4 bước cực kỳ dễ dàng** dưới đây!

---

## 🚀 3. QUY TRÌNH 4 BƯỚC TỰ TẠO GAMESHOW (AI CŨNG LÀM ĐƯỢC)

### BƯỚC 1: VÀO "XƯỞNG TẠO GAMESHOW" (ARENA STUDIO)
1. Thầy Cô đăng nhập vào Aegis và nhấp vào mục **"Đấu trường ⚡"** trên thanh menu (hoặc truy cập link: `/arena`).
2. Nhìn lên góc trên bên phải, Thầy Cô sẽ thấy nút màu tím phát sáng:  
   👉 **`🎨 TỰ TẠO GAMESHOW (ARENA STUDIO)`** (Đường dẫn: `/arena/studio`). Bấm vào đó.
3. Màn hình chia làm 2 phần cực kỳ trực quan:
   - **Bên Trái (Khu vực chọn luật)**: Nơi Thầy Cô tích chọn kiểu sân khấu, tính điểm.
   - **Bên Phải (Màn hình chiếu thử)**: Nhìn thấy ngay sân khấu trò chơi biến đổi theo từng cú click chuột của Thầy Cô!

---

### BƯỚC 2: CHỌN MẪU CÓ SẴN HOẶC ĐẶT TÊN MỚI (1 CHẠM)
Thầy Cô có thể chọn 1 trong 2 cách:
- **Cách siêu nhanh (Khuyên dùng)**: Bấm vào các nút mẫu có sẵn ở thanh trên cùng:
  - 🏆 *Ai Là Triệu Phú (Thang leo dốc 15 bậc)*
  - 🔥 *Kẻ Săn Mồi (Thi đấu đuổi bắt thời gian)*
  - 🧩 *Đuổi Hình Bắt Chữ (Lật tranh bí mật)*
  - 👥 *Đấu Trí 1 vs 100 (Cả lớp cùng thi đấu)*
- **Cách tự do**: Nhập vào các ô thông tin:
  - **Mã trò chơi (`Game Code`)**: Viết hoa không dấu, ví dụ: `BE_NGOAN_5T`.
  - **Tên trò chơi hiển thị**: *"Bé Khỏe Bé Ngoan Đi Tìm Kho Báu"*.
  - **Biểu tượng (Icon)**: Chọn hình chú gấu 🐻, vương miện 👑 hoặc tia chớp ⚡.
  - **Màu chủ đạo**: Chọn màu Vàng, Xanh lá hoặc Hồng tươi vui cho các con.

---

### BƯỚC 3: CHỌN SÂN KHẤU & CÁCH THI ĐẤU (XẾP HÌNH LEGO)
Thầy Cô chỉ cần bấm chọn theo sở thích, không cần gõ công thức gì phức tạp:

#### 1. Chọn Kiểu Sân Khấu (Layout Shell)
- 🏛️ **Bục Thí Sinh 3D (`PODIUM`)**: Dành cho 2 - 4 đội hoặc 4 bạn đứng thi trên bục (giống Olympia). *(Cô Mai chọn kiểu này)*.
- 🪜 **Thang Leo Dốc Bậc Thang (`STEP_LADDER`)**: Dành cho trò leo núi, leo cây hái quả. Trả lời đúng là nhân vật trèo lên 1 nấc!
- 🔔 **Sàn Đấu Ma Trận 100 Ghế (`MEGA_GRID`)**: Cả lớp 30 - 40 bé đều có ghế riêng trên màn hình. Bé nào sai thì đèn ghế chuyển màu (giống Rung Chuông Vàng).
- 🎡 **Vòng Quay Kỳ Diệu (`RADIAL_WHEEL`)**: Vòng quay tròn xoay tít có kim chỉ điểm số may mắn.
- 🖼️ **Lật Tranh Bí Mật (`HIDDEN_TILES`)**: Có một bức ảnh giấu sau 4 - 8 ô vuông, trả lời đúng thì ô vuông mở ra!

#### 2. Chọn Cách Giành Quyền Trả Lời (Contention Mode)
- 🔴 **Bấm Chuông Siêu Tốc (`BUZZER_FASTEST`)**: Đội nào tay nhanh mắt tinh bấm chuông trước thì chuông reo lên và đèn sáng! *(Cực kỳ náo nhiệt)*.
- 📝 **Cả Lớp Cùng Làm (`SIMULTANEOUS_ALL`)**: Tất cả các bé cùng chọn đáp án A, B, C, D trên máy của mình trong 15 giây.
- 🔄 **Lần Lượt Từng Bạn (`TURN_ROUND_ROBIN`)**: Hết lượt bạn này đến bạn kế tiếp, không sợ tranh nhau.

#### 3. Bật Phao Cứu Trợ (Lifelines) Cho Các Bé
Thầy Cô chỉ cần tích dấu V vào các quyền trợ giúp:
- ⚡ **50:50**: Máy tính tự động xóa đi 2 đáp án sai, chỉ để lại 2 đáp án cho bé dễ chọn.
- 🧠 **Hỏi Gia Sư AI / Hỏi Cô Giáo**: Hiện gợi ý thông minh nhẹ nhàng để bé tư duy.
- 👥 **Hỏi Ý Kiến Cả Lớp**: Xem biểu đồ các bạn trong lớp đang chọn hình nào nhiều nhất.

---

### BƯỚC 4: BẤM "XUẤT BẢN" & BẮT ĐẦU CHƠI!
1. Sau khi chọn xong, Thầy Cô bấm nút to màu tím ở góc phải:  
   👉 **`✨ XUẤT BẢN GAMESHOW ➔`**.
2. **Kỳ diệu xuất hiện**:
   - Hệ thống tự động biên dịch và cắm nóng (Hot-Plug) trò chơi của Thầy Cô vào máy chủ.
   - Quay lại Sảnh Đấu Trường (`/arena`), Thầy Cô sẽ thấy trò chơi *"Bé Khỏe Bé Ngoan Đi Tìm Kho Báu"* đã nằm trang trọng ngay mục đầu tiên!
3. Thầy Cô bấm **`Tạo Phòng`**:
   - Chọn bộ câu hỏi (Ví dụ: đề hình ảnh hoa quả, con vật đã soạn ở Creator Zen Studio).
   - Màn hình cấp **Mã PIN 6 số** (Ví dụ: `889966`) và **Mã QR to rõ**.
   - Phụ huynh hoặc học sinh dùng điện thoại/máy tính bảng quét mã QR là vào thẳng phòng chơi ngay trong 1 giây!

---

## 📊 4. BẢNG TRA CỨU CẤU HÌNH NHANH CHO TỪNG CẤP HỌC

| Cấp Học | Thể Thức Khuyên Dùng | Kiểu Sân Khấu (`Layout`) | Chế Độ Chơi (`Contention`) | Phao Cứu Sinh Phù Hợp |
| :--- | :--- | :--- | :--- | :--- |
| **Mầm Non (1 - 5 Tuổi)** | Tìm hoa quả, đoán con vật, nhận biết màu sắc | 🖼️ Lật Tranh Bí Mật (`HIDDEN_TILES`) hoặc 🏛️ Bục 3D | 🔄 Lần lượt hoặc 🔴 Chuông bấm to | Hỏi Cô giáo, Bỏ bớt 2 hình sai |
| **Tiểu Học (Lớp 1 - 5)** | Hái táo toán học, giải cứu rừng xanh, từ vựng Tiếng Anh | 🪜 Thang Leo Dốc (`STEP_LADDER`) | 🔴 Bấm chuông nhanh | 50:50, Ngôi sao may mắn nhân đôi |
| **THCS & THPT** | Rung chuông vàng khối, Đấu trí liên đội, Tri thức bách khoa | 🔔 Sàn Đấu 100 Ghế (`MEGA_GRID`) hoặc 🏛️ Bục 4 Người | 🔴 Khóa chuông vi-giây $<2\text{ms}$ | Cứu trợ ném máy bay giấy, Trợ giúp AI Socrates |
| **Doanh Nghiệp / Sự Kiện** | Onboarding văn hóa, Đào tạo nghiệp vụ, Gala Dinner | 🎡 Vòng Quay May Mắn hoặc 🇺🇸 Ma Trận Điểm Số | 📝 Cả hội trường cùng làm | Thăm dò toàn hội trường |

---

## 💡 5. NHỮNG MẸO NHỎ ĐỂ TIẾT HỌC HÀO HỨNG GẤP 10 LẦN
1. **Âm thanh rực rỡ**: Hệ thống có sẵn bộ âm thanh chuẩn truyền hình (tiếng chuông cướp lượt, tiếng tạch tạch nan nón, tiếng chuông reo chiến thắng). Thầy Cô chỉ cần cắm loa lớp học là không khí sôi động như trường quay VTV!
2. **Không lo mất mạng**: Nếu Wi-Fi lớp chập chờn, Aegis có cơ chế lưu điểm số an toàn ngay trên máy tính bảng của bé và tự động nộp lại khi có mạng trở lại.
3. **Chiếu lên Tivi / Máy chiếu**: Bấm phím **`F11`** trên bàn phím máy tính để mở toàn màn hình, giấu hết các thanh công cụ để lớp học hóa thân thành sân khấu chuyên nghiệp.
