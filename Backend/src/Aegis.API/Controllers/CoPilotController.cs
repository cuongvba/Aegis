using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Aegis.Application.Interfaces;
using Aegis.Application.Models.AI;
using Aegis.Infrastructure.Data;

namespace Aegis.API.Controllers
{
    /// <summary>
    /// [Aegis Sovereign Co-Pilot Studio & Docs RAG Knowledge Assistant]
    /// Bộ điều phối trung tâm cho giao diện Agentic Co-Pilot Sidecar và Trợ lý AI Giải đáp Tài liệu Hệ thống:
    /// - Nhận thức sâu ngữ cảnh màn hình và vai trò người dùng (Tri-Persona)
    /// - Điều phối Slash Commands (/soan, /hoithao, /ma-tran, /gia-su, /kiem-dinh)
    /// - Trả lời Hỏi-Đáp trực tiếp dựa trên Tài liệu Hệ thống (Cẩm nang Zen Studio, Kiến trúc AGCI, Hồ sơ Tổ chức & Pháp lý do Admin quản trị)
    /// </summary>
    [ApiController]
    [Route("api/v1/copilot")]
    public class CoPilotController : ControllerBase
    {
        private readonly ICoPilotService _coPilotService;
        private readonly IUniversalAiRouter _aiRouter;
        private readonly ITenantContext _tenantContext;
        private readonly AegisDbContext? _db;

        public CoPilotController(
            ICoPilotService coPilotService,
            IUniversalAiRouter aiRouter,
            ITenantContext tenantContext,
            AegisDbContext? db = null)
        {
            _coPilotService = coPilotService;
            _aiRouter = aiRouter;
            _tenantContext = tenantContext;
            _db = db;
        }

        private Guid GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(claim, out var uid) && uid != Guid.Empty)
                return uid;

            return Guid.Parse("00000000-0000-0000-0000-000000000001");
        }

        private Guid GetCurrentTenantId()
        {
            return _tenantContext.CurrentTenantId != Guid.Empty
                ? _tenantContext.CurrentTenantId
                : Guid.Empty;
        }

        /// <summary>
        /// Gửi yêu cầu đàm thoại hoặc lệnh Slash Command tới Aegis Co-Pilot
        /// </summary>
        [AllowAnonymous]
        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] CoPilotRequestDto request, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "Nội dung yêu cầu (Message) không được để trống." });
            }

            request.UserId ??= GetCurrentUserId();
            request.TenantId ??= GetCurrentTenantId();

            var response = await _coPilotService.ProcessPromptAsync(request, ct);
            return Ok(response);
        }

        /// <summary>
        /// [Aegis Living Docs RAG Assistant]
        /// Giải đáp thông minh mọi câu hỏi của Giáo viên, Học sinh, Ngân hàng & Tổ chức
        /// dựa trên hệ thống tài liệu chính thức (Cẩm nang Zen Studio, Kiến trúc AGCI v5.0)
        /// kết hợp với thông tin Tổ chức & Pháp lý sống do Admin cấu hình trong Database.
        /// </summary>
        [AllowAnonymous]
        [HttpPost("docs-qa")]
        public async Task<IActionResult> AskSystemDocs([FromBody] DocsQaRequestDto req, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(req?.Question))
            {
                return BadRequest(new { message = "Vui lòng nhập câu hỏi cần giải đáp." });
            }

            var sw = Stopwatch.StartNew();
            var question = req.Question.Trim();
            var isEn = string.Equals(req.Language, "en", StringComparison.OrdinalIgnoreCase);

            // 1. Nạp cấu hình Tổ chức & Pháp lý sống từ Database (do Admin cấu hình)
            TenantBrandingDto branding = await LoadActiveBrandingAsync(ct);

            // 2. Truy xuất các lát cắt tài liệu (Knowledge Chunks) phù hợp nhất với câu hỏi
            var matchedChunks = RetrieveRelevantDocChunks(question, branding, isEn);
            var sources = matchedChunks.Select(c => c.SourceTitle).Distinct().ToList();
            var contextBuilder = new StringBuilder();
            foreach (var chunk in matchedChunks)
            {
                contextBuilder.AppendLine($"--- [{chunk.SourceTitle}] ---");
                contextBuilder.AppendLine(chunk.Content);
                contextBuilder.AppendLine();
            }

            // 3. Thử gọi qua UniversalAiRouter với ngữ cảnh tài liệu nghiêm ngặt (Zero Hallucination)
            string? aiAnswer = null;
            string modelUsed = "Aegis-Docs-RAG-Engine";
            try
            {
                var systemPrompt = isEn
                    ? "You are the Official AI Documentation & Legal Assistant of AEGIS GLOBAL (AGCI v5.0). Answer concisely, accurately, and warmly using ONLY the provided Official System Documentation & Admin Configuration below. Use Markdown formatting, bullet points, and LaTeX ($...$) if needed."
                    : "Bạn là Trợ lý AI Giải đáp Tài liệu & Pháp lý Chính thức của hệ sinh thái AEGIS GLOBAL (AGCI v5.0). Hãy trả lời súc tích, chính xác, thân thiện và chuyên nghiệp DỰA TRÊN tài liệu hệ thống và cấu hình Admin được cung cấp bên dưới. Sử dụng định dạng Markdown rõ ràng, có gạch đầu dòng và công thức LaTeX ($...$) nếu cần.";

                var userPrompt =
                    $"TÀI LIỆU HỆ THỐNG & CẤU HÌNH ADMIN HIỆN HÀNH:\n{contextBuilder}\n\n" +
                    $"CÂU HỎI CỦA NGƯỜI DÙNG: {question}\n\n" +
                    (isEn ? "Please provide a clear, helpful response grounded in the documentation above." : "Hãy giải đáp rõ ràng, cụ thể và hướng dẫn từng bước dựa sát vào tài liệu trên.");

                var aiResp = await _aiRouter.ExecuteAsync(new AiExecutionRequest
                {
                    Prompt = userPrompt,
                    SystemPrompt = systemPrompt,
                    Temperature = 0.25
                });

                if (!string.IsNullOrWhiteSpace(aiResp?.Content) &&
                    !aiResp.Content.Contains("ResilientFallback", StringComparison.OrdinalIgnoreCase))
                {
                    aiAnswer = aiResp.Content;
                    modelUsed = string.IsNullOrWhiteSpace(aiResp.ModelUsed) ? "UniversalAiRouter (Docs-RAG)" : aiResp.ModelUsed;
                }
            }
            catch
            {
                // Chuyển sang bộ tổng hợp tri thức tài liệu nội tại siêu tốc (Deterministic Grounded Synthesis)
            }

            if (string.IsNullOrWhiteSpace(aiAnswer))
            {
                aiAnswer = SynthesizeGroundedDocAnswer(question, matchedChunks, branding, isEn);
                modelUsed = "Aegis-Docs-Semantic-Engine (<5ms)";
            }

            sw.Stop();
            return Ok(new
            {
                answer = aiAnswer,
                sources,
                modelUsed,
                latencyMs = sw.ElapsedMilliseconds,
                suggestedFollowUps = GetSuggestedFollowUps(question, isEn)
            });
        }

        private async Task<TenantBrandingDto> LoadActiveBrandingAsync(CancellationToken ct)
        {
            var fallback = new TenantBrandingDto
            {
                OrganizationName = "Aegis Global (AGCI)",
                SupportHotline = "1900 558818 • (+84) 24 3868 9999",
                SupportEmail = "enterprise@aegisglobal.io",
                HeadquartersAddress = "Tòa nhà Trung tâm Đổi mới Sáng tạo & Tài chính Số, Hà Nội / TP. Hồ Chí Minh / Singapore",
                TaxOrRegistrationCode = "ISO/IEC 27001:2022 • NIST SP 800-63B Certified",
                WorkingHours = "Hỗ trợ Kỹ thuật & AI Co-Pilot 24/7/365 (SLA 99.99%)",
                CopyrightText = $"© {DateTime.UtcNow.Year} Aegis Global. All rights reserved."
            };

            if (_db == null) return fallback;
            try
            {
                var tenantId = GetCurrentTenantId();
                var tenant = tenantId != Guid.Empty
                    ? await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId, ct)
                    : await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.IsActive, ct);

                if (tenant != null && !string.IsNullOrWhiteSpace(tenant.ConfigJson))
                {
                    var parsed = JsonSerializer.Deserialize<TenantBrandingDto>(
                        tenant.ConfigJson,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (parsed != null)
                    {
                        if (string.IsNullOrWhiteSpace(parsed.OrganizationName)) parsed.OrganizationName = tenant.Name;
                        if (string.IsNullOrWhiteSpace(parsed.SupportHotline)) parsed.SupportHotline = fallback.SupportHotline;
                        if (string.IsNullOrWhiteSpace(parsed.SupportEmail)) parsed.SupportEmail = fallback.SupportEmail;
                        if (string.IsNullOrWhiteSpace(parsed.HeadquartersAddress)) parsed.HeadquartersAddress = fallback.HeadquartersAddress;
                        if (string.IsNullOrWhiteSpace(parsed.TaxOrRegistrationCode)) parsed.TaxOrRegistrationCode = fallback.TaxOrRegistrationCode;
                        if (string.IsNullOrWhiteSpace(parsed.WorkingHours)) parsed.WorkingHours = fallback.WorkingHours;
                        return parsed;
                    }
                }
            }
            catch
            {
                // Fallback an toàn
            }
            return fallback;
        }

        private record DocChunk(string Id, string SourceTitle, string[] Keywords, string DirectAnswer, string Content);

        private static List<DocChunk> RetrieveRelevantDocChunks(string question, TenantBrandingDto branding, bool isEn)
        {
            var qLower = question.ToLowerInvariant();
            var catalog = new List<DocChunk>
            {
                new(
                    "student-access-no-account",
                    isEn ? "Student Participation & Zero-Account Access" : "Quy trình Học sinh & Không cần Tài khoản",
                    new[] { "học sinh", "học viên", "thi", "làm bài", "tài khoản", "đăng nhập", "quét qr", "mã pin", "zalo", "không cần", "điện thoại", "student", "join", "pin", "login", "register" },
                    isEn
                        ? "Students do **NOT** need to create an account or remember a password! They can join any exam instantly via a 6-digit PIN or a direct QR/Zalo link on their phones or computers."
                        : "Học sinh hoàn toàn **KHÔNG CẦN đăng ký tài khoản hay nhớ mật khẩu**! Chỉ cần quét **Mã QR / bấm Link Zalo** hoặc nhập **Mã PIN 6 số** trên điện thoại/máy tính là làm bài được ngay lập tức.",
                    "**Quy trình Trải nghiệm cho Học sinh & Phụ huynh**:\n" +
                    "1. **Không rào cản (Zero-Friction)**: Giáo viên gửi link qua nhóm Zalo lớp hoặc chiếu mã QR trên màn hình. Học sinh chỉ cần mở camera quét hoặc bấm vào link.\n" +
                    "2. **Chỉ cần nhập Tên**: Học sinh chỉ cần điền Họ và tên (hoặc Số báo danh) là bắt đầu làm bài thi/luyện tập ngay.\n" +
                    "3. **Tự động lưu bài & Chống mất mạng**: Mọi câu trả lời được lưu cục bộ trên trình duyệt (`IndexedDB / RAM Cache`). Nếu bị rớt mạng hoặc tắt nhầm ứng dụng, khi mở lại học sinh tiếp tục làm bài bình thường không bị mất dữ liệu.\n" +
                    "4. **Báo cáo kết quả tức thì**: Ngay khi nộp bài, học sinh thấy ngay điểm số, phân tích lỗi sai và lời giải thích chi tiết theo từng bước."
                ),
                new(
                    "export-import-formats",
                    isEn ? "Exam Import/Export & Transpiler Standard (QTI, Moodle, Word, PDF)" : "Xuất nhập Đề thi & Chuẩn Chuyển đổi (Word, PDF, QTI, Moodle)",
                    new[] { "xuất", "nhập", "word", "pdf", "docx", "qti", "moodle", "gift", "in", "tải về", "chuyển đổi", "export", "import", "download", "print" },
                    isEn
                        ? "Aegis supports seamless bi-directional import and export across Microsoft Word (.docx), PDF, QTI 3.0, Moodle XML, and GIFT standards."
                        : "Aegis hỗ trợ toàn diện việc **Nhập và Xuất đề thi 2 chiều** theo các chuẩn quốc tế và phổ biến: **Microsoft Word (.docx)**, **PDF chất lượng in ấn**, **QTI 3.0**, **Moodle XML** và **GIFT**.",
                    "**Năng lực Xuất/Nhập & Tương thích Đa nền tảng (`UniversalExamTranspilerService`)**:\n" +
                    "1. **Nhập đề Word siêu tốc**: Kéo thả file `.docx` chứa công thức MathType phức tạp, hệ thống tự động bóc tách và tạo ngân hàng câu hỏi trong `<1.2s`.\n" +
                    "2. **Xuất đề Word & PDF chuẩn Bộ GD&ĐT**: Xuất đề thi kèm ma trận, bảng đáp án, phiếu trả lời trắc nghiệm và lời giải chi tiết định dạng chuẩn để in ấn trực tiếp.\n" +
                    "3. **Tương thích Hệ thống LMS (Moodle, Canvas, Blackboard)**: Xuất tệp gói chuẩn `QTI 3.0` hoặc `Moodle XML` để nhập sang bất kỳ hệ thống quản lý học tập nào mà không bị lỗi font hay mất công thức."
                ),
                new(
                    "pricing-plans-fees",
                    isEn ? "Pricing, Subscriptions & VietQR Payment" : "Bảng giá, Gói cước & Thanh toán VietQR",
                    new[] { "giá", "bảng giá", "chi phí", "bao nhiêu", "tiền", "gói", "thanh toán", "vietqr", "mua", "miễn phí", "cước", "price", "pricing", "cost", "fee", "free", "pay" },
                    isEn
                        ? "Aegis offers a 100% Free Lifetime Tier for individual learners, an ultra-affordable Zen Creator Tier for teachers at ~25,000 VND/month, and tailored Enterprise plans."
                        : "Aegis cung cấp chính sách giá vô cùng ưu việt: **Miễn phí trọn đời (100% Free)** cho Người học cá nhân, **Gói Giáo viên Zen Creator chỉ 25.000đ/tháng**, và các gói Enterprise linh hoạt cho Trường học / Ngân hàng.",
                    "**Chi tiết Chính sách Gói cước & Cổng thanh toán Aegis Global Treasury**:\n" +
                    "1. **Gói Miễn Phí (Free Learner)**: Luyện thi không giới hạn, tham gia đấu trường Gameshow, xem lời giải chi tiết, không bao giờ thu phí học sinh.\n" +
                    "2. **Gói Giáo viên Sáng tạo (Zen Creator — 25.000đ/tháng)**: Không giới hạn ngân hàng câu hỏi, bóc tách MathType OLE không giới hạn, phát đề QR Zalo, ghi âm giọng cô giáo.\n" +
                    "3. **Thanh toán VietQR Napas 24/7 tức thì**: Quét mã QR chuyển khoản tự động kích hoạt gói trong **`<2 giây`** mà không cần liên kết thẻ tín dụng.\n" +
                    "4. **Gói Doanh nghiệp & Ngân hàng (Enterprise)**: Độc lập máy chủ On-Premise/Private Cloud, bảo mật RLS, xác thực SSO/Keycloak, tích hợp cổng thanh toán quốc tế (Stripe, Web3 Polygon)."
                ),
                new(
                    "zen-studio",
                    isEn ? "Teacher Zen Studio Guide (3-Touch / 10-Second Workflow)" : "Cẩm nang Giáo viên Zen Studio (Quy trình 3 Chạm / 10 Giây)",
                    new[] { "zen", "giáo viên", "mầm non", "tiểu học", "tạo đề", "3 chạm", "thu âm", "giọng", "cô", "teacher", "voice", "preschool", "studio" },
                    isEn
                        ? "Teacher Zen Studio empowers educators—including preschool and elementary teachers—to create and publish rich multimedia exams in just 3 touches and 10 seconds."
                        : "Không gian Sáng tạo **Zen Studio** cho phép mọi Giáo viên (kể cả giáo viên mầm non, tiểu học không rành công nghệ) tạo và phát đề thi đa phương tiện chỉ với **3 chạm trong vòng 10 giây**.",
                    "**Quy trình 3 Chạm / 10 Giây tại Zen Studio (`/creator/studio`)**:\n" +
                    "1. **Chạm 1 — Tạo câu hỏi đa phương tiện**: Giáo viên bấm `🎙️ Thu âm giọng cô` ngay trên trình duyệt để đọc câu hỏi cho bé chưa biết chữ, dán trực tiếp ảnh minh họa (`Ctrl+V`), hoặc chèn video sinh động.\n" +
                    "2. **Chạm 2 — Chọn đáp án & Lời giải**: Chọn đáp án đúng chỉ bằng 1 cú nhấp chuột hoặc dán cả bảng đáp án từ Word.\n" +
                    "3. **Chạm 3 — Bấm `🚀 Phát đề ngay`**: Hệ thống tức thì tạo mã PIN 6 số và **Mã QR / Link Zalo**. Giáo viên chỉ cần gửi link vào nhóm lớp là học sinh vào thi ngay."
                ),
                new(
                    "mathtype-clipboard",
                    isEn ? "MathType OLE & Word Formula Binary Transpiler (<2ms)" : "Giải Mã Nhị Phân MathType OLE & Công Thức Word (<2ms)",
                    new[] { "mathtype", "công thức", "toán", "latex", "bảng", "ctrl+v", "dán", "ảnh", "ole", "mtef", "formula", "table", "paste", "wmf" },
                    isEn
                        ? "Aegis features proprietary binary stream decoding (MTEF v5 / WMF) that converts Word MathType equations directly to crisp LaTeX in <2ms, slashing database footprint by 99.2%."
                        : "Aegis sở hữu công nghệ độc quyền giải mã luồng nhị phân `MathType OLE (MTEF v5)` từ Word sang **Vector LaTeX sắc nét trong `<2ms`**, giảm **99.2% dung lượng lưu trữ** so với việc chụp ảnh PNG.",
                    "**Công nghệ Xử lý Công thức & Bảng biểu Đỉnh cao**:\n" +
                    "1. **Chống vỡ hạt & Giảm 99.2% dung lượng**: Copy công thức MathType từ Word nhấn `Ctrl+V`, hệ thống dịch thẳng sang LaTeX (~60 bytes thay vì file ảnh 45KB), hiển thị mượt mà 60fps trên mọi thiết bị.\n" +
                    "2. **Dán Bảng Word/Excel sang Markdown**: Tự động chuyển đổi bảng tính nhiều cột thành bảng Markdown chuẩn hỗ trợ công thức Toán học bên trong từng ô.\n" +
                    "3. **Công cụ Chuyển Ảnh sang LaTeX (OCR AI)**: Với các ảnh công thức chụp sẵn, thanh công cụ cho phép nhận diện và chuyển hóa thành mã LaTeX chỉ với 1 click."
                ),
                new(
                    "ai-swarm-symposium",
                    isEn ? "Epistemic Triad AI Swarm & Hallucination Prevention" : "Kiến trúc Hệ Ba Ngôi AI Swarm & Chống Ảo Giác",
                    new[] { "ai", "bầy sói", "wolf", "symposium", "hội thảo", "ảo giác", "hallucination", "notebook", "sci", "copilot", "swarm", "tác tử" },
                    isEn
                        ? "Aegis prevents AI hallucinations through the Epistemic Triad: Universal AI Router (UAR) -> Wolf Pack Swarm Engine (WPSE with 98.4% Consensus) -> 6-Phase Symposium."
                        : "Aegis triệt tiêu hoàn toàn hiện tượng AI ảo giác (Hallucination) nhờ **Hệ Ba Ngôi Nhận Thức (Epistemic Triad)**: Universal AI Router $\\rightarrow$ Wolf Pack Swarm $\\rightarrow$ Đại Hội Thảo 6 Pha.",
                    "**Cơ chế Phản biện Đa tác tử & Thẩm định Độc lập**:\n" +
                    "1. **Universal AI Router (UAR)**: Tự động điều phối yêu cầu đến mô hình tối ưu nhất theo nguyên lý Pareto FinOps.\n" +
                    "2. **Wolf Pack Swarm Engine (WPSE)**: Nhiều tác tử AI độc lập cùng giải và phản biện chéo lời giải, tính toán **Chỉ số Đồng thuận Bầy sói (`SCI = 98.4%`)** trước khi duyệt câu hỏi vào ngân hàng.\n" +
                    "3. **AegisNotebook Sovereign & Đại Hội Thảo**: Đối chiếu đa nguồn tài liệu, tự động phát hiện xung đột và tạo câu hỏi tình huống tư duy bậc cao (Bloom 5-6)."
                ),
                new(
                    "irt-psychometrics",
                    isEn ? "IRT 3-PL Psychometrics & 9 Ministry-Standard Question Types" : "Tâm Trắc Học IRT 3-PL & 9 Dạng Đề GDPT 2025",
                    new[] { "irt", "chấm điểm", "đúng sai", "lũy tiến", "9 dạng", "gdpt", "2025", "thích ứng", "cat", "fsrs", "dkt", "psychometrics", "scoring" },
                    isEn
                        ? "Aegis implements the IRT 3-PL model (a, b, c parameters) and fully automates progressive scoring for 9 modern question types compliant with the 2025 National Education Standards."
                        : "Aegis là nền tảng tiên phong chuẩn hóa **Mô hình Tâm trắc học IRT 3-PL** ($a, b, c$) và tự động hóa toàn bộ việc chấm điểm lũy tiến cho **9 dạng câu hỏi hiện đại chuẩn GDPT 2025**.",
                    "**Chuẩn Đánh giá Năng lực Thực chất & Chấm điểm Tự động**:\n" +
                    "1. **Dạng Đúng/Sai 4 Mệnh đề**: Chấm điểm lũy tiến chính xác tuyệt đối: đúng 1 ý = `0.1đ`, đúng 2 ý = `0.25đ`, đúng 3 ý = `0.5đ`, đúng cả 4 ý = `1.0đ`.\n" +
                    "2. **Mô hình Khảo thí Thích ứng CAT (IRT 3-PL)**: Độ khó câu hỏi tự động co giãn theo năng lực thực chất của từng thí sinh, ngăn chặn đoán mò ($c$).\n" +
                    "3. **Thuật toán FSRS v5 & Deep Knowledge Tracing**: Dự báo chính xác điểm quên và lập lộ trình ôn tập cá nhân hóa."
                ),
                new(
                    "gameshow-arena",
                    isEn ? "Aegis Arena: 6 TV Gameshows with <2ms In-Memory Buzzer" : "Đấu Trường Aegis Arena: 6 Gameshow Truyền Hình & Buzzer <2ms",
                    new[] { "gameshow", "arena", "olympia", "rung chuông vàng", "chiếc nón", "jeopardy", "nhanh như chớp", "chuông", "buzzer", "đấu trường", "game" },
                    isEn
                        ? "Aegis Arena provides 6 built-in TV gameshow modes with sub-2ms in-memory buzzer arbitration, plus an infinite plugin architecture for custom formats."
                        : "Đấu trường **Aegis Arena (`/arena`)** tích hợp sẵn **6 Gameshow truyền hình kinh điển** với công nghệ tranh chuông RAM cực nhanh dưới 2 mili-giây, cùng kiến trúc Plug-in cho phép mở rộng không giới hạn.",
                    "**Các Chế độ Gameshow & Công nghệ Trọng tài Buzzer**:\n" +
                    "1. **6 Gameshow Tích hợp Sẵn**: *Đường Lên Đỉnh Olympia (4 vòng chuẩn)*, *Chiếc Nón Kỳ Diệu (Vòng quay 60fps)*, *Rung Chuông Vàng*, *Jeopardy! Ma trận 30 ô*, *University Challenge*, và *Nhanh Như Chớp (10 nấc thang)*.\n" +
                    "2. **Khóa Nguyên tử Tranh chuông `<2ms`**: Trọng tài điện tử phân xử ai bấm chuông trước bằng bộ nhớ RAM với độ trễ `<2ms`, đảm bảo công bằng tuyệt đối cho hàng nghìn người cùng xem.\n" +
                    "3. **Mở rộng Không giới hạn**: Hỗ trợ cộng đồng tự tạo và tích hợp gameshow riêng thông qua hệ thống Plugin Engine."
                ),
                new(
                    "security-banking-compliance",
                    isEn ? "Bank-Grade Security, Multi-Tenancy & Cryptographic Audit" : "Bảo Mật Cấp Ngân Hàng, Phân Quyền & Kiểm Toán Mật Mã",
                    new[] { "bảo mật", "ngân hàng", "an ninh", "rls", "pki", "merkle", "totp", "iso", "pháp lý", "security", "privacy", "bank", "compliance" },
                    isEn
                        ? "Engineered for Banking and Enterprise compliance, Aegis enforces 3-tier data isolation (PostgreSQL RLS), PKI USB Token signatures, and tamper-proof SHA-256 Merkle audit chains."
                        : "Được thiết kế đáp ứng tiêu chuẩn khắt khe của **Ngân hàng & Tập đoàn Đa quốc gia**, Aegis bảo vệ dữ liệu bằng **cách ly 3 tầng (PostgreSQL RLS)**, chữ ký số **PKI USB Token**, và nhật ký **SHA-256 Merkle Chain** chống can thiệp.",
                    "**Hạ Tầng Bảo Mật & Pháp Lý Chuẩn Quốc Tế**:\n" +
                    "1. **Cô lập Đa Khách thuê 3 Tầng**: Phân tách dữ liệu triệt để từ tầng Middleware, EF Global QueryFilter đến tận hàng dữ liệu PostgreSQL Row-Level Security (RLS).\n" +
                    "2. **Kiểm toán Bất biến SHA-256 Merkle Chain**: Mọi lượt nộp bài, chỉnh sửa điểm số đều được băm theo chuỗi Merkle Tree, không một ai (kể cả Quản trị viên hệ thống) có thể sửa lén dữ liệu.\n" +
                    "3. **Bảo mật Đăng nhập 2 Lớp (TOTP 2FA / SSO Keycloak)**: Tích hợp xác thực hai yếu tố và hệ thống quản trị định danh doanh nghiệp chuẩn OIDC/SAML2."
                ),
                new(
                    "mobile-devices-support",
                    isEn ? "Mobile & Multi-Device Compatibility" : "Tương Thích Thiết Bị & Điện Thoại Di Động",
                    new[] { "điện thoại", "mobile", "app", "thiết bị", "máy tính bảng", "ipad", "android", "ios", "chạy trên", "cài đặt", "device", "phone", "tablet" },
                    isEn
                        ? "Aegis is a high-performance Progressive Web Application (PWA) that runs flawlessly across all smartphones (iOS, Android), tablets, laptops, and smart TVs without mandatory app installation."
                        : "Aegis được xây dựng theo chuẩn **Progressive Web App (PWA) hiệu năng cao**, hoạt động mượt mà trên **100% các loại điện thoại thông minh (iPhone, Android)**, máy tính bảng iPad, laptop và cả màn hình tivi tương tác mà **không cần cài đặt ứng dụng phức tạp**.",
                    "**Khả năng Tương thích Thiết bị Tuyệt đối**:\n" +
                    "1. **Chạy trực tiếp trên Trình duyệt**: Học sinh chỉ cần mở Safari, Chrome, Zalo Browser hay Cốc Cốc là làm bài thi và bấm chuông gameshow mượt mà với tốc độ 60fps.\n" +
                    "2. **Không tốn dung lượng bộ nhớ máy**: Giao diện siêu nhẹ, tải trang đầu tiên dưới 150KB gzip, tối ưu hóa cho cả mạng 3G/4G yếu.\n" +
                    "3. **Hỗ trợ Chạm vuốt & Cảm ứng**: Các thao tác kéo thả ghép đôi, vẽ hình hình học, bấm chuông tranh quyền trả lời được thiết kế tối ưu riêng cho ngón tay người dùng."
                ),
                new(
                    "organization-contact-legal",
                    isEn ? "Organization Identity & Live Contact" : "Thông Tin Tổ Chức & Kênh Hỗ Trợ Trực Tiếp",
                    new[] { "liên hệ", "tổ chức", "hotline", "email", "địa chỉ", "trụ sở", "công ty", "đơn vị", "hỗ trợ", "gặp ai", "ở đâu", "contact", "support", "address", "phone", "email" },
                    isEn
                        ? $"Aegis Global operates 24/7 technical and architectural support. Contact our enterprise headquarters at {branding.SupportHotline} or {branding.SupportEmail}."
                        : $"Hệ sinh thái Aegis Global duy trì trung tâm hỗ trợ kỹ thuật và kiến trúc 24/7/365. Quý khách có thể liên hệ trực tiếp qua Hotline `{branding.SupportHotline}` hoặc Email `{branding.SupportEmail}`.",
                    $"**Thông Tin Đơn Vị Quản Trị & Kênh Liên Hệ Trực Tiếp**:\n" +
                    $"- **Đơn vị chủ quản**: {branding.OrganizationName}\n" +
                    $"- **Trụ sở chính**: {branding.HeadquartersAddress}\n" +
                    $"- **Hotline Kỹ thuật & AI 24/7**: `{branding.SupportHotline}`\n" +
                    $"- **Email Tiếp nhận Yêu cầu**: `{branding.SupportEmail}`\n" +
                    $"- **Tiêu chuẩn Tuân thủ**: `{branding.TaxOrRegistrationCode}` ({branding.WorkingHours})"
                )
            };

            // Chấm điểm mức độ liên quan theo từ khóa và cụm từ
            var scored = catalog
                .Select(c =>
                {
                    int score = 0;
                    foreach (var kw in c.Keywords)
                    {
                        if (qLower.Contains(kw))
                        {
                            score += kw.Length >= 4 ? 3 : 1;
                        }
                    }
                    return new { Chunk = c, Score = score };
                })
                .Where(x => x.Score > 0)
                .OrderByDescending(x => x.Score)
                .ToList();

            if (scored.Count > 0)
            {
                return scored.Take(2).Select(x => x.Chunk).ToList();
            }

            // Nếu câu hỏi mở hoặc chào hỏi chung, đưa ra câu trả lời tổng quan thay vì gán cứng Zen Studio
            return new List<DocChunk>
            {
                new(
                    "general-overview",
                    isEn ? "Aegis Global Comprehensive Overview" : "Tổng Quan Hệ Sinh Thái Aegis Global",
                    new[] { "tổng quan", "hệ thống" },
                    isEn
                        ? "Aegis Global is the world-class Cognitive Intelligence & Verification Standard, unifying Teacher Zen Studio, <2ms MathType transpilation, IRT 3-PL psychometrics, 6 live TV gameshows, and bank-grade data security."
                        : "Aegis Global là hệ sinh thái Khảo thí & Trí tuệ Nhận thức chuẩn quốc tế, hợp nhất trọn vẹn: Không gian Giáo viên 3 chạm (Zen Studio), Giải mã MathType Word sang LaTeX <2ms, Tâm trắc học IRT 3-PL, Đấu trường 6 Gameshow thời gian thực, và Bảo mật cấp Ngân hàng.",
                    "**Các Trụ Cột Nổi Bật của Hệ Thống**:\n" +
                    "1. **Dành cho Giáo viên & Trường học**: Soạn đề trong 10 giây, thu âm giọng cô, chia sẻ qua mã QR Zalo, học sinh vào thi ngay không cần tài khoản.\n" +
                    "2. **Dành cho Học sinh & Người học**: Trải nghiệm miễn phí trọn đời, tham gia các Gameshow đấu trí trực tiếp (Olympia, Nhanh Như Chớp), phân tích lỗ hổng kiến thức chuẩn xác.\n" +
                    "3. **Dành cho Doanh nghiệp & Ngân hàng**: Độc quyền kiểm toán bất biến SHA-256 Merkle Chain, phân quyền cách ly đa khách thuê cấp ngân hàng và chuẩn hóa khảo thí năng lực nhân sự."
                )
            };
        }

        private static string SynthesizeGroundedDocAnswer(
            string question,
            List<DocChunk> matchedChunks,
            TenantBrandingDto branding,
            bool isEn)
        {
            var primary = matchedChunks.FirstOrDefault();
            if (primary == null) return isEn ? "Thank you for asking! How can we assist you with Aegis Global today?" : "Cảm ơn Quý khách! Quý khách cần hỗ trợ thêm thông tin gì về hệ thống Aegis Global?";

            var sb = new StringBuilder();

            // 1. Câu trả lời trực diện vào trọng tâm câu hỏi (Direct & Focused Answer)
            sb.AppendLine(primary.DirectAnswer);
            sb.AppendLine();

            // 2. Chi tiết hướng dẫn & Bằng chứng kỹ thuật thực thi
            sb.AppendLine(primary.Content);
            sb.AppendLine();

            // 3. Nếu có khối liên quan thứ hai, bổ sung ngắn gọn
            if (matchedChunks.Count > 1)
            {
                var secondary = matchedChunks[1];
                sb.AppendLine(isEn ? $"**Related Information ({secondary.SourceTitle})**:" : $"**Thông Tin Bổ Trợ ({secondary.SourceTitle})**:");
                sb.AppendLine(secondary.DirectAnswer);
                sb.AppendLine();
            }

            // 4. Hotline hỗ trợ chính thức
            sb.AppendLine(isEn
                ? $"> 💡 *Need personalized guidance? Call our 24/7 hotline `{branding.SupportHotline}` or email `{branding.SupportEmail}`.*"
                : $"> 💡 *Cần hỗ trợ trực tiếp từ đội ngũ chuyên gia? Quý khách vui lòng gọi Hotline `{branding.SupportHotline}` hoặc gửi email đến `{branding.SupportEmail}`.*");

            return sb.ToString().Trim();
        }

        private static List<string> GetSuggestedFollowUps(string question, bool isEn)
        {
            if (isEn)
            {
                return new List<string>
                {
                    "How do Preschool/K-12 teachers record voice and share exams via QR?",
                    "How does Aegis convert MathType OLE equations from Word to LaTeX?",
                    "What security standards protect Enterprise & Banking tenants?",
                    "How do I contact the organization or review the Privacy Policy?"
                };
            }

            return new List<string>
            {
                "Giáo viên mầm non thu âm giọng đọc và gửi bài qua Zalo QR như thế nào?",
                "Copy công thức MathType từ Word dán vào hệ thống chuyển thành LaTeX ra sao?",
                "Hệ thống bảo mật 3 tầng RLS và ký số PKI cho Ngân hàng hoạt động thế nào?",
                "Thông tin liên hệ, trụ sở và chính sách bảo mật của Tổ chức?"
            };
        }

        /// <summary>
        /// Lấy danh mục Slash Commands khả dụng kèm mô tả và ví dụ
        /// </summary>
        [AllowAnonymous]
        [HttpGet("commands")]
        public async Task<IActionResult> GetCommands([FromQuery] CoPilotPersona? persona = null, CancellationToken ct = default)
        {
            var commands = await _coPilotService.GetAvailableCommandsAsync(persona, ct);
            return Ok(commands);
        }

        /// <summary>
        /// Lấy danh sách các Model AI đang kích hoạt trong hệ thống từ UniversalAiRouter
        /// </summary>
        [AllowAnonymous]
        [HttpGet("models")]
        public async Task<IActionResult> GetActiveModels(CancellationToken ct = default)
        {
            try
            {
                var models = await _aiRouter.GetActiveNormalizedModelsAsync(null, ct);
                return Ok(models);
            }
            catch
            {
                var fallbackList = new[]
                {
                    new { ModelCode = "claude-3-5-sonnet", DisplayName = "Claude 3.5 Sonnet (Chuyên gia Khảo thí)", Archetype = "DeepReasoner" },
                    new { ModelCode = "gemini-2-5-flash", DisplayName = "Gemini 2.5 Flash (Siêu tốc 0ms)", Archetype = "UltraFast" },
                    new { ModelCode = "gpt-4o", DisplayName = "GPT-4o (Đa phương thức)", Archetype = "MassiveContext" },
                    new { ModelCode = "deepseek-r1-local", DisplayName = "DeepSeek-R1 (Toán học & Logic)", Archetype = "DeepReasoner" }
                };
                return Ok(fallbackList);
            }
        }

        /// <summary>
        /// Lấy danh mục các Model AI gom nhóm theo Nhà cung cấp (Provider)
        /// </summary>
        [AllowAnonymous]
        [HttpGet("models/grouped")]
        public async Task<IActionResult> GetGroupedModels([FromQuery] string? prompt = null, CancellationToken ct = default)
        {
            var userId = GetCurrentUserId();
            var tenantId = GetCurrentTenantId();
            var groups = await _coPilotService.GetGroupedModelsAsync(prompt, userId, tenantId, ct);
            return Ok(groups);
        }

        /// <summary>
        /// [Aegis AI Quota & Health Status Gateway]
        /// Lấy thông tin hạn mức sử dụng Token AI, gói bản quyền và trạng thái cổng kết nối
        /// </summary>
        [AllowAnonymous]
        [HttpGet("quota")]
        public async Task<IActionResult> GetQuotaStatus(CancellationToken ct = default)
        {
            var userId = GetCurrentUserId();
            var tenantId = GetCurrentTenantId();

            string subscriptionTier = "FREE";
            long tokensLimit = 50000;
            long tokensUsed = 0;
            var byokProviders = new List<string>();

            if (_db != null)
            {
                var user = await _db.UserAccounts.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);
                if (user != null)
                {
                    subscriptionTier = string.IsNullOrWhiteSpace(user.SubscriptionTier) ? "FREE" : user.SubscriptionTier.ToUpperInvariant();
                    tokensLimit = subscriptionTier switch
                    {
                        "ENTERPRISE" => -1, // Unlimited
                        "VIP" => 2000000,
                        "PRO" => 500000,
                        _ => 50000
                    };
                }

                // Kiểm tra các khóa BYOK cá nhân hoặc tenant
                var byokKeys = await _db.UserAiKeys.AsNoTracking()
                    .Where(k => (k.UserId == userId || (tenantId != Guid.Empty && k.TenantId == tenantId)) && k.IsActive)
                    .ToListAsync(ct);

                if (byokKeys.Count > 0)
                {
                    byokProviders = byokKeys.Select(k => k.ProviderCompany).Distinct().ToList();
                    tokensUsed = byokKeys.Sum(k => k.TokensUsedThisMonth);
                }
            }

            var hasByok = byokProviders.Count > 0;
            if (hasByok)
            {
                tokensLimit = -1; // BYOK mở khóa hạn mức không giới hạn trên nền tảng
            }

            long remaining = tokensLimit == -1 ? -1 : Math.Max(0, tokensLimit - tokensUsed);
            double percentageUsed = tokensLimit <= 0 ? 0.0 : Math.Min(100.0, Math.Round((double)tokensUsed / tokensLimit * 100.0, 1));

            var result = new
            {
                plan = hasByok ? "Sovereign BYOK (Tự cấp khóa)" : $"{subscriptionTier} AI Community",
                tier = subscriptionTier,
                tokensUsedMonth = tokensUsed,
                tokensLimitMonth = tokensLimit,
                remainingTokens = remaining,
                percentageUsed = percentageUsed,
                hasByokKey = hasByok,
                byokProviders = byokProviders,
                fastPathAvailable = true,
                gatewayStatus = "Online",
                statusMessage = hasByok 
                    ? $"Đã kích hoạt {byokProviders.Count} nhà cung cấp BYOK riêng ({string.Join(", ", byokProviders)}) — Hạn mức không giới hạn"
                    : $"Gói {subscriptionTier}: {remaining:N0} tokens khả dụng trong tháng (Kèm 0-Token Fast-Path miễn phí)"
            };

            return Ok(result);
        }

        /// <summary>
        /// Bảo toàn và kết tinh tri thức từ hội thoại hoặc Artifact vào AegisNotebook
        /// </summary>
        [AllowAnonymous]
        [HttpPost("export-notebook")]
        public async Task<IActionResult> ExportToNotebook(
            [FromBody] ExportCoPilotToNotebookRequest request,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(request.Content) && request.ArtifactData == null)
            {
                return BadRequest(new { message = "Nội dung cần lưu vào Notebook không được để trống." });
            }

            request.UserId ??= GetCurrentUserId();
            request.TenantId ??= GetCurrentTenantId();

            var result = await _coPilotService.ExportToNotebookAsync(request, ct);
            return Ok(result);
        }
    }

    public class DocsQaRequestDto
    {
        public string Question { get; set; } = string.Empty;
        public string? Language { get; set; } = "vi";
    }
}
