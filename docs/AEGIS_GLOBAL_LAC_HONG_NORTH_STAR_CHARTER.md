# 🌟 HIẾN CHƯƠNG KIM CHỈ NAM LẠC HỒNG — PHỤNG SỰ NHÂN LOẠI (AEGIS GLOBAL NORTH STAR CHARTER)

> **Hệ sinh thái**: **AEGIS GLOBAL COGNITIVE & OPERATIONS OS**  
> **Tuyên ngôn Sứ mệnh**: *"Born in Vietnam, Built for Humanity — Trí tuệ Khai phóng Giáo dục • Kỷ luật Điều hành Tự chủ • Nhân ái Bảo vệ Con người Số"*  
> **Trạng thái Tài liệu**: Kim chỉ nam Tối thượng (North Star) cho mọi quyết định Kiến trúc, Sản phẩm & Phụng sự Cộng đồng (`2026-11-19`)

---

## I. TẦM NHÌN CỐT LÕI: BA CUỘC CHUYỂN DỊCH LỊCH SỬ

AegisGlobal không được xây dựng để trở thành một phần mềm đơn lẻ, mà để dẫn dắt **3 cuộc chuyển dịch nền tảng** cho giáo dục, tổ chức và văn minh nhân loại:

### 1. Thay đổi Nền Giáo dục Thế giới — *"Khai phóng Trực quan & Bình đẳng Tri thức"*
- **Giải mã Tri thức STEM Phức tạp**: Chuyển đổi trực tiếp hàng tỷ trang đề thi/tài liệu Word/PDF chứa **MathType nhị phân (OLE/WMF)** sang **KaTeX, Vector SVG, IRT 3-PL & QTI 3.0** ([`HeroWordDropzone`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Frontend/src/pages/landing/components/hero/HeroWordDropzone.tsx), [`MathTypeWmfEngine.cs`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.Infrastructure/Services/MathTypeWmfEngine.cs)).
- **Công xưởng Visual Learning Lab (`/visual-lab`)**: Biến khái niệm trừu tượng thành bài giảng trực quan 60fps và **xuất Video tái sử dụng** giúp giáo viên tại vùng sâu, vùng xa và các quốc gia đang phát triển giảng dạy chất lượng cao ngay cả khi không có Internet ([`VisualLearningLabPage.tsx`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Frontend/src/pages/visual-lab/VisualLearningLabPage.tsx)).
- **Đánh thức Sáng tạo & Di sản từ Tuổi thơ (`/kids`)**: Sân khấu động 6 lớp & Game nhập vai đa tập chạy **100% Offline-First** ([`KidsWorldPage.tsx`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Frontend/src/pages/kids/KidsWorldPage.tsx)), lưu giữ văn hóa, lịch sử và đạo lý dân tộc cho trẻ em 3–11 tuổi.

### 2. Thay đổi Phương pháp Quản lý Công việc & Văn phòng — *"Điều hành Tự chủ, Minh bạch & Không Ma sát"*
- **Giải phóng Giấy tờ & Sổ sách Thủ công (`/office-studio`, `/work-ledger`)**: Hợp nhất xử lý tài liệu OCR/PDF/Word/Excel, sổ điểm danh, thời khóa biểu, lịch rèn luyện, việc tốt, bảng Kanban/KPI và đồng bộ **Google Calendar** ([`SmartLedgerPage.tsx`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Frontend/src/pages/ledger/SmartLedgerPage.tsx)).
- **Luồng Công văn & Phê duyệt 7 Pha AI Auto-Pilot (`/dispatches`)**: Từ OCR $\rightarrow$ Trình $\rightarrow$ Bút phê $\rightarrow$ Phân công tự động $\rightarrow$ Báo cáo $\rightarrow$ Đánh giá $\rightarrow$ Chốt điểm KPI bất biến ([`OfficialDispatchController.cs`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.API/Controllers/OfficialDispatchController.cs), [`DispatchWorkflowHelper.cs`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.Infrastructure/Services/DispatchWorkflowHelper.cs)).
- **Trách nhiệm Gắn với Xác thực**: Mọi công đoạn điều hành được kiểm soát bởi phân quyền **4 tầng CRUDAP** và **TOTP 2FA (RFC 6238)** ([`TotpSecurityHelper.cs`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.Infrastructure/Security/TotpSecurityHelper.cs)).

### 3. Đóng góp Nền Văn minh Nhân loại — *"Văn minh Tri thức Tự chủ, Chính trực & Bình đẳng"*
- **Thu hẹp Hố ngăn Cách Số Toàn cầu**: Ưu tiên **Offline-First + Video Export + Hybrid Deterministic AI (chi phí token = 0 cho các luồng lõi)** để các cộng đồng yếu thế tiếp cận được công nghệ hàng đầu với chi phí tối thiểu.
- **Bảo vệ Sự thật & Phẩm giá Dữ liệu**: Kết hợp **Hội đồng AI Biện chứng** ([`UniversalSymposiumEngine.cs`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.Infrastructure/AI/UniversalSymposiumEngine.cs)) với **Hệ thống Quản trị An toàn Thông tin chuẩn ISO/IEC 27001:2022 (`/isms`)** — đầy đủ **93 Controls Annex A**, Live Auto-Evidence, Ma trận Rủi ro 5x5, AI CAPA và Niêm phong **SHA-256** ([`Iso27001AnnexACatalog.cs`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.Infrastructure/Services/Iso27001AnnexACatalog.cs), [`IsmsController.cs`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.API/Controllers/IsmsController.cs)).

---

## II. BẢN ĐỒ 6 KIỆT TÁC HỢP NHẤT & TRUNG TÂM ĐIỀU PHỐI SỨ MỆNH

Mặt tiền [`LandingPage.tsx`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Frontend/src/pages/landing/LandingPage.tsx) ([`PersonaEntryPortals.tsx`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Frontend/src/pages/landing/components/PersonaEntryPortals.tsx)) và [`LacHongMissionHubPage.tsx`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Frontend/src/pages/hub/LacHongMissionHubPage.tsx) (`/mission-hub`) kết nối trực tiếp 6 không gian chủ lực:

| STT | Kiệt tác / Phân hệ | Tuyến đường | Giá trị Phụng sự Cốt lõi |
| :---: | :--- | :--- | :--- |
| 1 | **STEM Exam & MathType AI** | `/creator/studio` | Giải mã Word/PDF/MathType WMF $\rightarrow$ Kho đề KaTeX, IRT 3-PL, QTI 3.0 |
| 2 | **Visual Learning Lab** | `/visual-lab` | Tạo bài giảng trực quan 60fps & xuất Video tái sử dụng cho vùng khó khăn |
| 3 | **Aegis Kids Creative Factory** | `/kids` | Sân khấu 6 lớp, truyện di sản & game đa tập 100% Offline-First |
| 4 | **Công văn 7 Pha & 2FA** | `/dispatches` | OCR, AI Auto-Pilot SLA, đồng bộ `/work-ledger` & xác thực TOTP 2FA |
| 5 | **Smart Work & Ledger OS** | `/work-ledger` | Sổ điểm danh, thời khóa biểu, KPI tập thể, Kanban & Lịch Google |
| 6 | **ISMS ISO/IEC 27001:2022** | `/isms` | 93 Controls SoA, Live Auto-Evidence, Rủi ro 5x5, AI CAPA & SHA-256 |

---

## III. 5 NGUYÊN TẮC KIM CHỈ NAM CHO MỌI BƯỚC PHÁT TRIỂN TƯƠNG LAI

Mỗi tính năng mới khi đưa vào AegisGlobal bắt buộc phải trả lời đạt cả 5 câu hỏi sau:
1. **Giải phóng Con người**: Tính năng này có giúp giáo viên, học sinh hay nhân sự bớt đi thao tác thủ công lặp lại không?
2. **Tiếp cận Bình đẳng (Frugal & Offline-Resilient)**: Người ở vùng mạng yếu, máy cấu hình thấp hoặc ngân sách hạn hẹp có dùng được không?
3. **Chính trực & Có Bằng chứng (Verifiable Trust)**: Có bảo toàn dấu vết kiểm toán (`CRUDAP` / `TOTP 2FA` / `SHA-256`) và chống giả mạo không?
4. **Liên thông Không Đảo Cô Lập**: Có kết nối tự nhiên với kho tri thức, `/work-ledger`, `/dispatches` hoặc `/isms` thay vì tạo thêm dữ liệu rời rạc không?
5. **Tinh giản & Nhân văn**: Giao diện có đủ trực quan để người phổ thông thao tác ngay trong vài phút mà vẫn đạt chuẩn kỹ thuật quốc tế không?
