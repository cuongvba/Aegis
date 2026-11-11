using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Aegis.Application.DTOs;
using Aegis.Application.Interfaces;
using Microsoft.Extensions.Logging;
using NPOI.XWPF.UserModel;

namespace Aegis.Infrastructure.Services.Docx
{
    /// <summary>
    /// [Aegis Global Sovereign Docx Exam Transpiler Service]
    /// Dịch vụ xuất bản đề thi ra file Word (.docx) và trọn gói hồ sơ khảo thí nộp trường theo thể thức chuẩn quốc gia.
    /// </summary>
    public class DocxExamExportTranspilerService : IExamExportTranspilerService
    {
        private readonly ISmartOptionShufflerService _shuffler;
        private readonly ILogger<DocxExamExportTranspilerService> _logger;

        public DocxExamExportTranspilerService(
            ISmartOptionShufflerService shuffler,
            ILogger<DocxExamExportTranspilerService> logger)
        {
            _shuffler = shuffler;
            _logger = logger;
        }

        public byte[] ExportSingleExamToDocx(IReadOnlyList<DocxImportPreviewDto> questions, ExamExportOptionsDto options, string examCode = "101")
        {
            using var ms = new MemoryStream();
            var doc = new XWPFDocument();

            // 1. Tạo Header chuẩn thể thức Bộ GD&ĐT (Bảng 2 cột không viền)
            BuildExamHeaderTable(doc, options, examCode);

            // 2. Dòng thông tin thí sinh
            BuildStudentInfoParagraph(doc);

            // 3. Nội dung các phần thi
            BuildExamQuestionsBody(doc, questions);

            // 4. Bảng đáp án ở cuối đề thi (nếu được yêu cầu)
            if (options.IncludeAnswerKey)
            {
                BuildQuickAnswerKeyTable(doc, questions);
            }

            doc.Write(ms);
            return ms.ToArray();
        }

        public byte[] ExportDetailedSolutionsToDocx(IReadOnlyList<DocxImportPreviewDto> questions, ExamExportOptionsDto options)
        {
            using var ms = new MemoryStream();
            var doc = new XWPFDocument();

            var pHeader = doc.CreateParagraph();
            pHeader.Alignment = ParagraphAlignment.CENTER;
            var rH = pHeader.CreateRun();
            rH.IsBold = true;
            rH.FontSize = 14;
            rH.SetText($"ĐÁP ÁN & HƯỚNG DẪN GIẢI CHI TIẾT");
            
            var pSub = doc.CreateParagraph();
            pSub.Alignment = ParagraphAlignment.CENTER;
            var rSub = pSub.CreateRun();
            rSub.IsItalic = true;
            rSub.FontSize = 11;
            rSub.SetText($"{options.ExamTitle.ToUpperInvariant()} — {options.SubjectName} (NĂM HỌC {options.AcademicYear})");

            doc.CreateParagraph(); // Dòng trống

            // Bảng đáp án tổng quan
            BuildQuickAnswerKeyTable(doc, questions);

            doc.CreateParagraph(); // Dòng trống

            // Lời giải chi tiết từng câu
            for (int i = 0; i < questions.Count; i++)
            {
                var q = questions[i];
                var pQ = doc.CreateParagraph();
                pQ.SpacingBefore = 100;
                var rQ = pQ.CreateRun();
                rQ.IsBold = true;
                rQ.FontSize = 11;
                rQ.SetText($"Câu {i + 1}: ");

                var rQText = pQ.CreateRun();
                rQText.FontSize = 11;
                rQText.SetText(CleanFormatting(q.Content));

                // Phương án đúng
                var pAns = doc.CreateParagraph();
                pAns.IndentationLeft = 400;
                var rAns = pAns.CreateRun();
                rAns.IsBold = true;
                rAns.FontSize = 11;
                rAns.SetColor("008000"); // Màu xanh lá
                rAns.SetText($"➔ Đáp án đúng: {ResolveAnswerLabel(q)}");

                // Lời giải chi tiết
                var expl = q.AiExplanation ?? q.GradingRubric;
                if (!string.IsNullOrWhiteSpace(expl))
                {
                    var pExp = doc.CreateParagraph();
                    pExp.IndentationLeft = 400;
                    var rExpTitle = pExp.CreateRun();
                    rExpTitle.IsBold = true;
                    rExpTitle.IsItalic = true;
                    rExpTitle.FontSize = 10;
                    rExpTitle.SetText("Hướng dẫn giải: ");

                    var rExpText = pExp.CreateRun();
                    rExpText.FontSize = 10;
                    rExpText.SetText(CleanFormatting(expl));
                }
            }

            doc.Write(ms);
            return ms.ToArray();
        }

        public byte[] ExportSpecificationMatrixToDocx(IReadOnlyList<DocxImportPreviewDto> questions, ExamExportOptionsDto options)
        {
            using var ms = new MemoryStream();
            var doc = new XWPFDocument();

            var pHeader = doc.CreateParagraph();
            pHeader.Alignment = ParagraphAlignment.CENTER;
            var rH = pHeader.CreateRun();
            rH.IsBold = true;
            rH.FontSize = 14;
            rH.SetText("MA TRẬN & BẢN ĐẶC TẢ ĐỀ THI ĐÁNH GIÁ ĐỊNH KỲ");

            var pSub = doc.CreateParagraph();
            pSub.Alignment = ParagraphAlignment.CENTER;
            var rSub = pSub.CreateRun();
            rSub.IsItalic = true;
            rSub.FontSize = 11;
            rSub.SetText($"MÔN: {options.SubjectName} — THỜI GIAN: {options.DurationMinutes} PHÚT — CHUẨN: {options.TargetStandard}");

            doc.CreateParagraph();

            // Phân nhóm theo Topic/Chủ đề
            var grouped = questions.GroupBy(q => !string.IsNullOrWhiteSpace(q.TopicName) ? q.TopicName : (!string.IsNullOrWhiteSpace(q.TopicCode) ? q.TopicCode : "Kiến thức chung"))
                                   .ToList();

            var table = doc.CreateTable(grouped.Count + 2, 7);
            string[] headers = new[] { "TT", "Chủ đề / Đơn vị kiến thức", "Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao", "Tổng số câu" };
            for (int col = 0; col < headers.Length; col++)
            {
                var cell = table.GetRow(0).GetCell(col);
                cell.SetColor("F2F2F2");
                var p = cell.Paragraphs[0];
                p.Alignment = ParagraphAlignment.CENTER;
                var r = p.CreateRun();
                r.IsBold = true;
                r.FontSize = 10;
                r.SetText(headers[col]);
            }

            int totalNB = 0, totalTH = 0, totalVD = 0, totalVDC = 0;
            for (int rIdx = 0; rIdx < grouped.Count; rIdx++)
            {
                var group = grouped[rIdx];
                var row = table.GetRow(rIdx + 1);

                int nb = group.Count(q => q.Difficulty <= 1);
                int th = group.Count(q => q.Difficulty == 2);
                int vd = group.Count(q => q.Difficulty == 3);
                int vdc = group.Count(q => q.Difficulty >= 4);

                totalNB += nb;
                totalTH += th;
                totalVD += vd;
                totalVDC += vdc;

                SetCellText(row.GetCell(0), (rIdx + 1).ToString(), true, ParagraphAlignment.CENTER);
                SetCellText(row.GetCell(1), group.Key, false, ParagraphAlignment.LEFT);
                SetCellText(row.GetCell(2), nb.ToString(), false, ParagraphAlignment.CENTER);
                SetCellText(row.GetCell(3), th.ToString(), false, ParagraphAlignment.CENTER);
                SetCellText(row.GetCell(4), vd.ToString(), false, ParagraphAlignment.CENTER);
                SetCellText(row.GetCell(5), vdc.ToString(), false, ParagraphAlignment.CENTER);
                SetCellText(row.GetCell(6), group.Count().ToString(), true, ParagraphAlignment.CENTER);
            }

            // Dòng tổng cộng
            var totalRow = table.GetRow(grouped.Count + 1);
            totalRow.GetCell(0).SetColor("E8F0FE");
            totalRow.GetCell(1).SetColor("E8F0FE");
            totalRow.GetCell(2).SetColor("E8F0FE");
            totalRow.GetCell(3).SetColor("E8F0FE");
            totalRow.GetCell(4).SetColor("E8F0FE");
            totalRow.GetCell(5).SetColor("E8F0FE");
            totalRow.GetCell(6).SetColor("E8F0FE");

            SetCellText(totalRow.GetCell(0), "", true, ParagraphAlignment.CENTER);
            SetCellText(totalRow.GetCell(1), "TỔNG CỘNG TOÀN ĐỀ", true, ParagraphAlignment.LEFT);
            SetCellText(totalRow.GetCell(2), totalNB.ToString(), true, ParagraphAlignment.CENTER);
            SetCellText(totalRow.GetCell(3), totalTH.ToString(), true, ParagraphAlignment.CENTER);
            SetCellText(totalRow.GetCell(4), totalVD.ToString(), true, ParagraphAlignment.CENTER);
            SetCellText(totalRow.GetCell(5), totalVDC.ToString(), true, ParagraphAlignment.CENTER);
            SetCellText(totalRow.GetCell(6), questions.Count.ToString(), true, ParagraphAlignment.CENTER);

            doc.Write(ms);
            return ms.ToArray();
        }

        public ExamExportResultDto GenerateMultiVariantPackageZip(IReadOnlyList<DocxImportPreviewDto> questions, ExamExportOptionsDto options)
        {
            var result = new ExamExportResultDto
            {
                TotalQuestions = questions.Count,
                TotalVariants = Math.Max(1, options.VariantCount)
            };

            int vCount = Math.Max(1, options.VariantCount);
            int basePrefix = int.TryParse(options.ExamCodePrefix, out int parsedPrefix) ? parsedPrefix * 10 : 100;
            if (basePrefix < 100) basePrefix = 100;

            var variants = new List<ExamVariantDto>();
            for (int v = 0; v < vCount; v++)
            {
                string code = (basePrefix + v + 1).ToString();
                result.GeneratedExamCodes.Add(code);

                if (v == 0)
                {
                    // Mã đề đầu tiên: giữ nguyên thứ tự câu hỏi gốc, chỉ chuẩn hóa nhãn đáp án
                    var var0 = new ExamVariantDto { ExamCode = code };
                    for (int i = 0; i < questions.Count; i++)
                    {
                        var qClone = CloneQuestion(questions[i]);
                        var0.Questions.Add(qClone);
                        var0.AnswerKey[i + 1] = ResolveAnswerLabel(qClone);
                        var0.QuestionMappingFromOriginal[i + 1] = i + 1;
                    }
                    variants.Add(var0);
                }
                else
                {
                    // Các mã đề tiếp theo: Hoán vị thông minh bảo toàn phương án neo và cụm đọc hiểu
                    var variant = PermuteExamVariant(questions, code, seed: v * 7919);
                    variants.Add(variant);
                }
            }

            // Tạo file Docx đơn lẻ của mã đề đầu tiên
            result.SingleDocxBytes = ExportSingleExamToDocx(variants[0].Questions, options, variants[0].ExamCode);
            result.SingleDocxFileName = $"DeThi_MaDe_{variants[0].ExamCode}.docx";

            // Đóng gói toàn bộ các tài liệu vào file ZIP
            using var zipStream = new MemoryStream();
            using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, true))
            {
                // 1. Thêm từng file Word đề thi cho từng mã đề
                foreach (var variant in variants)
                {
                    var docBytes = ExportSingleExamToDocx(variant.Questions, options, variant.ExamCode);
                    var entry = archive.CreateEntry($"De_Thi/DeThi_MaDe_{variant.ExamCode}.docx");
                    using var es = entry.Open();
                    es.Write(docBytes, 0, docBytes.Length);
                }

                // 2. Thêm file Lời giải & Đáp án chi tiết
                if (options.IncludeDetailedSolutions)
                {
                    var solBytes = ExportDetailedSolutionsToDocx(variants[0].Questions, options);
                    var entry = archive.CreateEntry("Ho_So_Chuyen_Mon/Dap_An_Va_Loi_Giai_Chi_Tiet.docx");
                    using var es = entry.Open();
                    es.Write(solBytes, 0, solBytes.Length);
                }

                // 3. Thêm file Ma trận đặc tả đề thi
                if (options.IncludeSpecificationMatrix)
                {
                    var matBytes = ExportSpecificationMatrixToDocx(questions, options);
                    var entry = archive.CreateEntry("Ho_So_Chuyen_Mon/Ma_Tran_Dac_Ta_De_Thi.docx");
                    using var es = entry.Open();
                    es.Write(matBytes, 0, matBytes.Length);
                }

                // 4. Thêm file Bảng Ma Trận Đáp Án Tổng Hợp của tất cả các mã đề (Master Matrix Answer Sheet)
                var masterMatrixBytes = BuildMasterAnswerKeyMatrixDocx(variants, options);
                var entryMatrix = archive.CreateEntry("Ho_So_Chuyen_Mon/Bang_Ma_Tran_Dap_An_Cac_Ma_De.docx");
                using (var es = entryMatrix.Open())
                {
                    es.Write(masterMatrixBytes, 0, masterMatrixBytes.Length);
                }

                // 5. Thêm Phiếu trả lời trắc nghiệm quang học OMR
                if (options.IncludeOmrAnswerSheet)
                {
                    var omrHtml = GenerateOmrAnswerSheetHtml(questions.Count, options);
                    var entryOmr = archive.CreateEntry("Phieu_Tra_Loi/Phieu_To_Trac_Nghiem_OMR_A4.html");
                    using var es = entryOmr.Open();
                    using var writer = new StreamWriter(es, Encoding.UTF8);
                    writer.Write(omrHtml);
                }
            }

            result.ZipPackageBytes = zipStream.ToArray();
            result.ZipPackageFileName = $"HoSo_KhaoThi_{options.SubjectName.Replace(" ", "_")}_{DateTime.Now:yyyyMMdd_HHmm}.zip";
            return result;
        }

        public string GenerateOmrAnswerSheetHtml(int totalQuestions, ExamExportOptionsDto options)
        {
            var sb = new StringBuilder();
            sb.AppendLine("<!DOCTYPE html>");
            sb.AppendLine("<html lang=\"vi\">");
            sb.AppendLine("<head>");
            sb.AppendLine("  <meta charset=\"UTF-8\">");
            sb.AppendLine("  <title>Phiếu Trả Lời Trắc Nghiệm Quang Học OMR A4</title>");
            sb.AppendLine("  <style>");
            sb.AppendLine("    @page { size: A4 portrait; margin: 8mm; }");
            sb.AppendLine("    body { font-family: 'Times New Roman', serif; margin: 0; padding: 0; color: #111; font-size: 11pt; }");
            sb.AppendLine("    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }");
            sb.AppendLine("    .title { text-align: center; font-weight: bold; font-size: 14pt; margin: 8px 0; text-transform: uppercase; }");
            sb.AppendLine("    .instruction { font-size: 9pt; font-style: italic; border: 1px dashed #666; padding: 6px; margin-bottom: 10px; }");
            sb.AppendLine("    .box-container { display: flex; gap: 15px; margin-bottom: 12px; }");
            sb.AppendLine("    .student-info { flex: 1.4; border: 1px solid #000; padding: 6px; font-size: 10pt; line-height: 1.8; }");
            sb.AppendLine("    .grid-box { flex: 0.8; border: 1px solid #000; padding: 4px; text-align: center; }");
            sb.AppendLine("    .omr-grid { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; }");
            sb.AppendLine("    .omr-col { width: 23%; border: 1px solid #ccc; padding: 4px; box-sizing: border-box; }");
            sb.AppendLine("    .q-row { display: flex; align-items: center; justify-content: space-between; font-size: 9pt; margin-bottom: 3px; }");
            sb.AppendLine("    .q-no { font-weight: bold; width: 22px; text-align: right; margin-right: 4px; }");
            sb.AppendLine("    .bubble { width: 15px; height: 15px; border-radius: 50%; border: 1.2px solid #222; display: inline-flex; align-items: center; justify-content: center; font-size: 7.5pt; font-weight: bold; }");
            sb.AppendLine("    .barcode { font-family: monospace; letter-spacing: 4px; font-weight: bold; font-size: 13pt; text-align: center; margin-top: 5px; }");
            sb.AppendLine("  </style>");
            sb.AppendLine("</head>");
            sb.AppendLine("<body>");

            sb.AppendLine("  <div class=\"header\">");
            sb.AppendLine($"    <div><strong>{options.MinistryOrDepartmentName.ToUpperInvariant()}</strong><br/><strong>{options.SchoolOrOrgName.ToUpperInvariant()}</strong></div>");
            sb.AppendLine($"    <div style=\"text-align: right;\"><strong>KỲ THI KHẢO SÁT CHẤT LƯỢNG</strong><br/>Năm học: {options.AcademicYear}</div>");
            sb.AppendLine("  </div>");

            sb.AppendLine("  <div class=\"title\">PHIẾU TRẢ LỜI TRẮC NGHIỆM CHUẨN QUANG HỌC OMR</div>");

            sb.AppendLine("  <div class=\"instruction\">");
            sb.AppendLine("    <strong>HƯỚNG DẪN TÔ PHIẾU:</strong> Dùng bút chì 2B tô kín và đậm các ô tròn tương ứng. Không gạch chéo hoặc đánh dấu tích. Giữ phiếu phẳng, không gấp mép.");
            sb.AppendLine("  </div>");

            sb.AppendLine("  <div class=\"box-container\">");
            sb.AppendLine("    <div class=\"student-info\">");
            sb.AppendLine("      1. Họ và tên thí sinh: ................................................................<br/>");
            sb.AppendLine("      2. Ngày sinh: ......../......../................ Lớp: .................................<br/>");
            sb.AppendLine($"      3. Bài thi môn: <strong>{options.SubjectName}</strong><br/>");
            sb.AppendLine("      4. Chữ ký giám thị 1: ........................ Giám thị 2: ........................");
            sb.AppendLine("    </div>");
            sb.AppendLine("    <div class=\"grid-box\">");
            sb.AppendLine("      <strong>SỐ BÁO DANH</strong>");
            sb.AppendLine("      <div style=\"display: flex; justify-content: center; gap: 3px; margin: 4px 0;\">");
            for (int i = 0; i < 6; i++) sb.AppendLine("        <div style=\"width: 16px; height: 20px; border: 1px solid #000;\"></div>");
            sb.AppendLine("      </div>");
            sb.AppendLine("      <div class=\"barcode\">|||| | ||||| || |</div>");
            sb.AppendLine("    </div>");
            sb.AppendLine("    <div class=\"grid-box\">");
            sb.AppendLine("      <strong>MÃ ĐỀ THI</strong>");
            sb.AppendLine("      <div style=\"display: flex; justify-content: center; gap: 3px; margin: 4px 0;\">");
            for (int i = 0; i < 3; i++) sb.AppendLine("        <div style=\"width: 16px; height: 20px; border: 1px solid #000;\"></div>");
            sb.AppendLine("      </div>");
            sb.AppendLine("      <div class=\"barcode\">|| |||| |</div>");
            sb.AppendLine("    </div>");
            sb.AppendLine("  </div>");

            // Lưới câu hỏi tô trắc nghiệm (chia 4 cột)
            sb.AppendLine("  <div class=\"omr-grid\">");
            int perCol = (int)Math.Ceiling(totalQuestions / 4.0);
            if (perCol < 10) perCol = 10;

            for (int col = 0; col < 4; col++)
            {
                sb.AppendLine("    <div class=\"omr-col\">");
                int startQ = col * perCol + 1;
                int endQ = Math.Min(totalQuestions, (col + 1) * perCol);

                for (int q = startQ; q <= endQ; q++)
                {
                    sb.AppendLine("      <div class=\"q-row\">");
                    sb.AppendLine($"        <span class=\"q-no\">{q}</span>");
                    sb.AppendLine("        <span class=\"bubble\">A</span>");
                    sb.AppendLine("        <span class=\"bubble\">B</span>");
                    sb.AppendLine("        <span class=\"bubble\">C</span>");
                    sb.AppendLine("        <span class=\"bubble\">D</span>");
                    sb.AppendLine("      </div>");
                }
                sb.AppendLine("    </div>");
            }
            sb.AppendLine("  </div>");

            sb.AppendLine("</body>");
            sb.AppendLine("</html>");
            return sb.ToString();
        }

        // ─────────────────────────────────────────────────────────────────────
        // Helper Methods: XWPF Word Document Construction
        // ─────────────────────────────────────────────────────────────────────

        private static void BuildExamHeaderTable(XWPFDocument doc, ExamExportOptionsDto options, string examCode)
        {
            var table = doc.CreateTable(1, 2);
            table.Width = 5000;

            // Cột 1: Cơ quan chủ quản & Trường
            var cell1 = table.GetRow(0).GetCell(0);
            var p1 = cell1.Paragraphs[0];
            p1.Alignment = ParagraphAlignment.CENTER;
            var r1_1 = p1.CreateRun();
            r1_1.IsBold = true;
            r1_1.FontSize = 10;
            r1_1.SetText(options.MinistryOrDepartmentName.ToUpperInvariant());
            p1.CreateRun().AddBreak();

            var r1_2 = p1.CreateRun();
            r1_2.IsBold = true;
            r1_2.FontSize = 10;
            r1_2.SetText(options.SchoolOrOrgName.ToUpperInvariant());
            p1.CreateRun().AddBreak();

            var r1_3 = p1.CreateRun();
            r1_3.IsItalic = true;
            r1_3.FontSize = 9;
            r1_3.SetText("(Đề thi có 04 trang)");

            // Cột 2: Kỳ thi, môn thi, mã đề
            var cell2 = table.GetRow(0).GetCell(1);
            var p2 = cell2.Paragraphs[0];
            p2.Alignment = ParagraphAlignment.CENTER;
            var r2_1 = p2.CreateRun();
            r2_1.IsBold = true;
            r2_1.FontSize = 10;
            r2_1.SetText($"{options.ExamTitle.ToUpperInvariant()} — NĂM HỌC {options.AcademicYear}");
            p2.CreateRun().AddBreak();

            var r2_2 = p2.CreateRun();
            r2_2.IsBold = true;
            r2_2.FontSize = 10;
            r2_2.SetText($"BÀI THI: {options.SubjectName.ToUpperInvariant()}");
            p2.CreateRun().AddBreak();

            var r2_3 = p2.CreateRun();
            r2_3.IsItalic = true;
            r2_3.FontSize = 9;
            r2_3.SetText($"Thời gian làm bài: {options.DurationMinutes} phút, không kể thời gian phát đề");
            p2.CreateRun().AddBreak();

            // Khung mã đề thi
            var r2_4 = p2.CreateRun();
            r2_4.IsBold = true;
            r2_4.FontSize = 10;
            r2_4.SetText($"MÃ ĐỀ THI: {examCode}");
        }

        private static void BuildStudentInfoParagraph(XWPFDocument doc)
        {
            var p = doc.CreateParagraph();
            p.SpacingBefore = 80;
            p.SpacingAfter = 120;
            var r = p.CreateRun();
            r.FontSize = 10;
            r.IsItalic = true;
            r.SetText("Họ và tên thí sinh: ................................................................................ Số báo danh: .......................................");
        }

        private static void BuildExamQuestionsBody(XWPFDocument doc, IReadOnlyList<DocxImportPreviewDto> questions)
        {
            string currentSection = string.Empty;
            string? currentContext = null;

            for (int i = 0; i < questions.Count; i++)
            {
                var q = questions[i];
                string section = q.QuestionType ?? "SINGLE";

                // Tiêu đề Phân đoạn thi (Phần I, Phần II, Phần III)
                if (section != currentSection)
                {
                    currentSection = section;
                    var pSec = doc.CreateParagraph();
                    pSec.SpacingBefore = 180;
                    pSec.SpacingAfter = 60;
                    var rSec = pSec.CreateRun();
                    rSec.IsBold = true;
                    rSec.FontSize = 11;

                    if (section is "TRUE_FALSE" or "MULTI_TRUE_FALSE")
                    {
                        rSec.SetText("PHẦN II. Câu trắc nghiệm đúng sai. Thí sinh trả lời từ câu 1 đến câu 4. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.");
                    }
                    else if (section is "SHORT_ANSWER" or "ESSAY")
                    {
                        rSec.SetText("PHẦN III. Câu trắc nghiệm trả lời ngắn. Thí sinh trả lời từ câu 1 đến câu 6. Thí sinh điền kết quả vào ô tương ứng trên phiếu trả lời.");
                    }
                    else
                    {
                        rSec.SetText("PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn. Thí sinh trả lời từ câu 1 đến câu 18. Mỗi câu hỏi thí sinh chỉ chọn một phương án.");
                    }
                }

                // Bài đọc hiểu / Tình huống dùng chung (Stimulus)
                if (!string.IsNullOrWhiteSpace(q.ContextContent) && q.ContextContent != currentContext)
                {
                    currentContext = q.ContextContent;
                    var pCtx = doc.CreateParagraph();
                    pCtx.SpacingBefore = 120;
                    pCtx.SpacingAfter = 40;
                    var rCtxTitle = pCtx.CreateRun();
                    rCtxTitle.IsBold = true;
                    rCtxTitle.FontSize = 10;
                    rCtxTitle.SetText($"[NGỮ CẢNH: {q.ContextTitle ?? "Bài đọc tham chiếu"}]\n");

                    var rCtxBody = pCtx.CreateRun();
                    rCtxBody.IsItalic = true;
                    rCtxBody.FontSize = 10;
                    rCtxBody.SetText(CleanFormatting(currentContext));
                }

                // Nội dung câu hỏi
                var pQ = doc.CreateParagraph();
                pQ.SpacingBefore = 60;
                pQ.SpacingAfter = 30;
                var rQNum = pQ.CreateRun();
                rQNum.IsBold = true;
                rQNum.FontSize = 10;
                rQNum.SetText($"Câu {i + 1}. ");

                var rQText = pQ.CreateRun();
                rQText.FontSize = 10;
                rQText.SetText(CleanFormatting(q.Content));

                // Các ý con (Phần II: Đúng / Sai)
                if (q.SubItems != null && q.SubItems.Count > 0)
                {
                    for (int s = 0; s < q.SubItems.Count; s++)
                    {
                        var sub = q.SubItems[s];
                        var pSub = doc.CreateParagraph();
                        pSub.IndentationLeft = 300;
                        pSub.SpacingAfter = 20;

                        var rSubKey = pSub.CreateRun();
                        rSubKey.IsBold = true;
                        rSubKey.FontSize = 10;
                        rSubKey.SetText($"{sub.Key ?? ((char)('a' + s)).ToString()}). ");

                        var rSubVal = pSub.CreateRun();
                        rSubVal.FontSize = 10;
                        rSubVal.SetText(CleanFormatting(sub.Content ?? ""));
                    }
                }
                // Các phương án trắc nghiệm (Phần I: A, B, C, D)
                else if (q.Options != null && q.Options.Count > 0)
                {
                    for (int o = 0; o < q.Options.Count; o++)
                    {
                        var pOpt = doc.CreateParagraph();
                        pOpt.IndentationLeft = 300;
                        pOpt.SpacingAfter = 20;

                        var rOptKey = pOpt.CreateRun();
                        rOptKey.IsBold = true;
                        rOptKey.FontSize = 10;
                        rOptKey.SetText($"{(char)('A' + o)}. ");

                        var rOptVal = pOpt.CreateRun();
                        rOptVal.FontSize = 10;
                        rOptVal.SetText(CleanFormatting(q.Options[o]));
                    }
                }
            }

            // Dòng kết thúc đề thi
            var pEnd = doc.CreateParagraph();
            pEnd.Alignment = ParagraphAlignment.CENTER;
            pEnd.SpacingBefore = 240;
            var rEnd = pEnd.CreateRun();
            rEnd.IsBold = true;
            rEnd.FontSize = 10;
            rEnd.SetText("----------------------------- HẾT -----------------------------");

            var pProctor = doc.CreateParagraph();
            pProctor.Alignment = ParagraphAlignment.CENTER;
            var rProc = pProctor.CreateRun();
            rProc.IsItalic = true;
            rProc.FontSize = 9;
            rProc.SetText("Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.");
        }

        private static void BuildQuickAnswerKeyTable(XWPFDocument doc, IReadOnlyList<DocxImportPreviewDto> questions)
        {
            var pTitle = doc.CreateParagraph();
            pTitle.SpacingBefore = 200;
            pTitle.Alignment = ParagraphAlignment.CENTER;
            var rT = pTitle.CreateRun();
            rT.IsBold = true;
            rT.FontSize = 12;
            rT.SetText("BẢNG ĐÁP ÁN THAM KHẢO");

            int colCount = 10;
            int rowCount = (int)Math.Ceiling(questions.Count / (double)colCount) * 2;
            if (rowCount == 0) return;

            var table = doc.CreateTable(rowCount, colCount);
            table.Width = 5000;

            for (int block = 0; block < rowCount / 2; block++)
            {
                var rowQ = table.GetRow(block * 2);
                var rowA = table.GetRow(block * 2 + 1);

                for (int c = 0; c < colCount; c++)
                {
                    int qIdx = block * colCount + c;
                    var cellQ = rowQ.GetCell(c);
                    cellQ.SetColor("F2F2F2");
                    var cellA = rowA.GetCell(c);

                    if (qIdx < questions.Count)
                    {
                        SetCellText(cellQ, (qIdx + 1).ToString(), true, ParagraphAlignment.CENTER);
                        SetCellText(cellA, ResolveAnswerLabel(questions[qIdx]), true, ParagraphAlignment.CENTER);
                    }
                    else
                    {
                        SetCellText(cellQ, "", false, ParagraphAlignment.CENTER);
                        SetCellText(cellA, "", false, ParagraphAlignment.CENTER);
                    }
                }
            }
        }

        private static byte[] BuildMasterAnswerKeyMatrixDocx(IReadOnlyList<ExamVariantDto> variants, ExamExportOptionsDto options)
        {
            using var ms = new MemoryStream();
            var doc = new XWPFDocument();

            var pHeader = doc.CreateParagraph();
            pHeader.Alignment = ParagraphAlignment.CENTER;
            var rH = pHeader.CreateRun();
            rH.IsBold = true;
            rH.FontSize = 13;
            rH.SetText($"BẢNG MA TRẬN ĐÁP ÁN TỔNG HỢP CÁC MÃ ĐỀ");

            var pSub = doc.CreateParagraph();
            pSub.Alignment = ParagraphAlignment.CENTER;
            var rSub = pSub.CreateRun();
            rSub.IsItalic = true;
            rSub.FontSize = 10;
            rSub.SetText($"{options.ExamTitle.ToUpperInvariant()} — MÔN: {options.SubjectName.ToUpperInvariant()}");

            doc.CreateParagraph();

            int totalQ = variants[0].Questions.Count;
            var table = doc.CreateTable(totalQ + 1, variants.Count + 1);

            // Header hàng 0
            var hRow = table.GetRow(0);
            SetCellText(hRow.GetCell(0), "CÂU", true, ParagraphAlignment.CENTER);
            hRow.GetCell(0).SetColor("D9E1F2");

            for (int v = 0; v < variants.Count; v++)
            {
                var cell = hRow.GetCell(v + 1);
                cell.SetColor("D9E1F2");
                SetCellText(cell, $"MÃ {variants[v].ExamCode}", true, ParagraphAlignment.CENTER);
            }

            // Các hàng câu hỏi 1..N
            for (int q = 1; q <= totalQ; q++)
            {
                var row = table.GetRow(q);
                SetCellText(row.GetCell(0), q.ToString(), true, ParagraphAlignment.CENTER);
                row.GetCell(0).SetColor("F2F2F2");

                for (int v = 0; v < variants.Count; v++)
                {
                    string ans = variants[v].AnswerKey.TryGetValue(q, out var val) ? val : "";
                    SetCellText(row.GetCell(v + 1), ans, true, ParagraphAlignment.CENTER);
                }
            }

            doc.Write(ms);
            return ms.ToArray();
        }

        private ExamVariantDto PermuteExamVariant(IReadOnlyList<DocxImportPreviewDto> originalQuestions, string examCode, int seed)
        {
            var variant = new ExamVariantDto { ExamCode = examCode };
            var random = new Random(seed);
            var originalList = originalQuestions.ToList();

            // Tách theo Section (Phần I, Phần II, Phần III) để không xáo trộn lẫn lộn giữa các dạng câu hỏi
            var sectionGroups = originalQuestions
                .GroupBy(q => q.QuestionType ?? "SINGLE")
                .ToList();

            int newIndex = 1;
            foreach (var group in sectionGroups)
            {
                var questionList = group.ToList();

                // Nhóm các câu hỏi có chung Context Stimulus (Reading Passage) để không xé lẻ bài đọc
                var contextClusters = new List<List<DocxImportPreviewDto>>();
                var currentCluster = new List<DocxImportPreviewDto>();
                string? activeContext = null;

                foreach (var q in questionList)
                {
                    if (string.IsNullOrWhiteSpace(q.ContextContent))
                    {
                        if (currentCluster.Count > 0)
                        {
                            contextClusters.Add(currentCluster);
                            currentCluster = new List<DocxImportPreviewDto>();
                            activeContext = null;
                        }
                        contextClusters.Add(new List<DocxImportPreviewDto> { q });
                    }
                    else
                    {
                        if (activeContext == null || activeContext == q.ContextContent)
                        {
                            activeContext = q.ContextContent;
                            currentCluster.Add(q);
                        }
                        else
                        {
                            contextClusters.Add(currentCluster);
                            currentCluster = new List<DocxImportPreviewDto> { q };
                            activeContext = q.ContextContent;
                        }
                    }
                }
                if (currentCluster.Count > 0) contextClusters.Add(currentCluster);

                // Trộn thứ tự các cụm câu hỏi trong phân đoạn
                var shuffledClusters = contextClusters.OrderBy(_ => random.Next()).ToList();

                foreach (var cluster in shuffledClusters)
                {
                    foreach (var qOrig in cluster)
                    {
                        var qPermuted = CloneQuestion(qOrig);

                        // Trộn phương án trắc nghiệm (cho Phần I) bảo vệ phương án neo qua SmartOptionShufflerService
                        if (qPermuted.Options != null && qPermuted.Options.Count > 1 && (qPermuted.QuestionType is "SINGLE" or "MULTI" or null))
                        {
                            var shuffleRes = _shuffler.ShuffleOptions(qPermuted.Options, qPermuted.SuggestedAnswer);
                            qPermuted.Options = shuffleRes.Options;
                            qPermuted.SuggestedAnswer = shuffleRes.CorrectAnswer;
                        }

                        variant.Questions.Add(qPermuted);
                        variant.AnswerKey[newIndex] = ResolveAnswerLabel(qPermuted);
                        variant.QuestionMappingFromOriginal[newIndex] = originalList.IndexOf(qOrig) + 1;
                        newIndex++;
                    }
                }
            }

            return variant;
        }

        private static void SetCellText(XWPFTableCell cell, string text, bool isBold, ParagraphAlignment alignment)
        {
            var p = cell.Paragraphs.Count > 0 ? cell.Paragraphs[0] : cell.AddParagraph();
            p.Alignment = alignment;
            var r = p.Runs.Count > 0 ? p.Runs[0] : p.CreateRun();
            r.IsBold = isBold;
            r.FontSize = 10;
            r.SetText(text);
        }

        private static string ResolveAnswerLabel(DocxImportPreviewDto q)
        {
            if (string.IsNullOrWhiteSpace(q.SuggestedAnswer)) return "---";

            // Nếu là số 1, 2, 3, 4 -> A, B, C, D
            if (int.TryParse(q.SuggestedAnswer, out int idx) && idx >= 1 && idx <= 8)
            {
                return ((char)('A' + idx - 1)).ToString();
            }

            // Nếu câu hỏi Đúng/Sai có SubItems
            if (q.SubItems != null && q.SubItems.Count > 0)
            {
                var tfList = q.SubItems.Select(s => $"{s.Key ?? "?"}:{s.ExpectedAnswer ?? "?"}");
                return string.Join("; ", tfList);
            }

            return q.SuggestedAnswer.Trim();
        }

        private static string CleanFormatting(string? raw)
        {
            if (string.IsNullOrEmpty(raw)) return string.Empty;
            return Regex.Replace(raw, @"<[^>]+>|__AEGIS_[A-Z0-9_]+__|\u200B", " ").Trim();
        }

        private static DocxImportPreviewDto CloneQuestion(DocxImportPreviewDto src)
        {
            return new DocxImportPreviewDto
            {
                Content = src.Content,
                QuestionType = src.QuestionType,
                Options = src.Options != null ? new List<string>(src.Options) : new(),
                SuggestedAnswer = src.SuggestedAnswer,
                AiExplanation = src.AiExplanation,
                GradingRubric = src.GradingRubric,
                ContextId = src.ContextId,
                ContextTitle = src.ContextTitle,
                ContextContent = src.ContextContent,
                TopicCode = src.TopicCode,
                TopicName = src.TopicName,
                Difficulty = src.Difficulty,
                SubItems = src.SubItems != null ? src.SubItems.Select(s => new QuestionSubItemDto
                {
                    Key = s.Key,
                    Content = s.Content,
                    ExpectedAnswer = s.ExpectedAnswer,
                    Explanation = s.Explanation
                }).ToList() : new()
            };
        }
    }
}
