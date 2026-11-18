using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.Interfaces;
using Aegis.Application.Models.AI;
using Microsoft.Extensions.Logging;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;
using NPOI.XWPF.UserModel;
using UglyToad.PdfPig;

namespace Aegis.Infrastructure.Services
{
    public class OfficeDocumentWorkspaceService : IOfficeDocumentWorkspaceService
    {
        private readonly ILogger<OfficeDocumentWorkspaceService> _logger;
        private readonly IUniversalAiRouter? _aiRouter;

        public OfficeDocumentWorkspaceService(
            ILogger<OfficeDocumentWorkspaceService> logger,
            IUniversalAiRouter? aiRouter = null)
        {
            _logger = logger;
            _aiRouter = aiRouter;
        }

        public async Task<OfficeParsedDocumentDto> ParseDocumentAsync(
            Stream stream,
            string fileName,
            CancellationToken ct = default)
        {
            if (stream == null) throw new ArgumentNullException(nameof(stream));
            string safeName = string.IsNullOrWhiteSpace(fileName) ? "document.docx" : Path.GetFileName(fileName);
            string ext = Path.GetExtension(safeName).ToLowerInvariant();
            string baseTitle = Path.GetFileNameWithoutExtension(safeName);

            using var ms = new MemoryStream();
            await stream.CopyToAsync(ms, ct);
            ms.Position = 0;

            return ext switch
            {
                ".docx" => ParseDocx(ms, safeName, baseTitle),
                ".pdf" => ParsePdf(ms, safeName, baseTitle),
                ".xlsx" or ".xls" => ParseSpreadsheet(ms, safeName, baseTitle),
                ".md" or ".txt" or ".csv" => await ParsePlainOrMarkdownAsync(ms, safeName, baseTitle, ext, ct),
                _ => throw new NotSupportedException($"Định dạng '{ext}' chưa được hỗ trợ. Vui lòng chọn .docx, .pdf, .xlsx, .xls, .md hoặc .txt.")
            };
        }

        private OfficeParsedDocumentDto ParseDocx(MemoryStream ms, string fileName, string title)
        {
            var sb = new StringBuilder();
            using var doc = new XWPFDocument(ms);

            foreach (var elem in doc.BodyElements)
            {
                if (elem is XWPFParagraph p)
                {
                    string text = (p.Text ?? string.Empty).Trim();
                    if (string.IsNullOrWhiteSpace(text)) continue;

                    string style = (p.Style ?? string.Empty).ToLowerInvariant();
                    if (style.Contains("heading1") || style == "1" || style.Contains("title"))
                        sb.AppendLine($"# {text}");
                    else if (style.Contains("heading2") || style == "2")
                        sb.AppendLine($"## {text}");
                    else if (style.Contains("heading3") || style == "3")
                        sb.AppendLine($"### {text}");
                    else if (p.GetNumID() != null)
                        sb.AppendLine($"- {text}");
                    else
                        sb.AppendLine(text);

                    sb.AppendLine();
                }
                else if (elem is XWPFTable tbl)
                {
                    var rows = tbl.Rows;
                    if (rows == null || rows.Count == 0) continue;

                    for (int r = 0; r < rows.Count; r++)
                    {
                        var cells = rows[r].GetTableCells()
                            .Select(c => (c.GetText() ?? string.Empty).Replace("\r", " ").Replace("\n", " ").Replace("|", "\\|").Trim())
                            .ToList();
                        if (cells.Count == 0) continue;

                        sb.AppendLine($"| {string.Join(" | ", cells)} |");
                        if (r == 0)
                        {
                            sb.AppendLine($"| {string.Join(" | ", cells.Select(_ => "---"))} |");
                        }
                    }
                    sb.AppendLine();
                }
            }

            return new OfficeParsedDocumentDto
            {
                FileName = fileName,
                DocumentKind = "DOCX",
                Title = title,
                MarkdownContent = sb.ToString().Trim(),
                PageCount = 1
            };
        }

        private OfficeParsedDocumentDto ParsePdf(MemoryStream ms, string fileName, string title)
        {
            var sb = new StringBuilder();
            var warnings = new List<string>();
            int pageCount = 0;

            using (var pdf = PdfDocument.Open(ms))
            {
                pageCount = pdf.NumberOfPages;
                foreach (var page in pdf.GetPages())
                {
                    sb.AppendLine($"<!-- Trang {page.Number} -->");
                    string text = (page.Text ?? string.Empty).Trim();
                    if (!string.IsNullOrWhiteSpace(text))
                        sb.AppendLine(text);
                    sb.AppendLine();
                }
            }

            string content = sb.ToString().Trim();
            if (string.IsNullOrWhiteSpace(content))
            {
                warnings.Add("PDF này có thể là bản scan dạng ảnh; bạn vẫn có thể xem trực tiếp ở khung bên trái và ghi chú ở khung bên phải.");
            }

            return new OfficeParsedDocumentDto
            {
                FileName = fileName,
                DocumentKind = "PDF",
                Title = title,
                MarkdownContent = content,
                PageCount = pageCount,
                Warnings = warnings
            };
        }

        private OfficeParsedDocumentDto ParseSpreadsheet(MemoryStream ms, string fileName, string title)
        {
            var sheets = new List<OfficeSheetDto>();
            var formatter = new DataFormatter();
            using var workbook = WorkbookFactory.Create(ms);

            for (int i = 0; i < workbook.NumberOfSheets; i++)
            {
                var sheet = workbook.GetSheetAt(i);
                var rows = new List<List<string>>();
                int maxCols = 0;

                for (int r = 0; r <= sheet.LastRowNum; r++)
                {
                    var row = sheet.GetRow(r);
                    if (row == null) continue;
                    int lastCell = Math.Max(1, (int)row.LastCellNum);
                    maxCols = Math.Max(maxCols, lastCell);
                }

                maxCols = Math.Clamp(maxCols, 1, 50);

                for (int r = 0; r <= sheet.LastRowNum; r++)
                {
                    var row = sheet.GetRow(r);
                    var vals = new List<string>(maxCols);
                    for (int c = 0; c < maxCols; c++)
                    {
                        var cell = row?.GetCell(c);
                        vals.Add(cell == null ? string.Empty : formatter.FormatCellValue(cell).Trim());
                    }
                    if (vals.Any(v => !string.IsNullOrEmpty(v)))
                        rows.Add(vals);
                }

                if (rows.Count == 0)
                    rows.Add(new List<string> { "Cột 1", "Cột 2", "Cột 3" });

                sheets.Add(new OfficeSheetDto
                {
                    Name = string.IsNullOrWhiteSpace(sheet.SheetName) ? $"Sheet{i + 1}" : sheet.SheetName,
                    Rows = rows
                });
            }

            _logger.LogInformation("[OfficeWorkspace] Parsed spreadsheet | File={File} Sheets={Count}", fileName, sheets.Count);

            return new OfficeParsedDocumentDto
            {
                FileName = fileName,
                DocumentKind = "XLSX",
                Title = title,
                Sheets = sheets
            };
        }

        private static async Task<OfficeParsedDocumentDto> ParsePlainOrMarkdownAsync(
            MemoryStream ms,
            string fileName,
            string title,
            string ext,
            CancellationToken ct)
        {
            using var reader = new StreamReader(ms, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
            string text = await reader.ReadToEndAsync(ct);

            if (ext == ".csv")
            {
                var rows = text.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(line => line.Split(',').Select(c => c.Trim().Trim('"')).ToList())
                    .ToList();
                return new OfficeParsedDocumentDto
                {
                    FileName = fileName,
                    DocumentKind = "XLSX",
                    Title = title,
                    Sheets = new List<OfficeSheetDto> { new() { Name = "CSV", Rows = rows } }
                };
            }

            return new OfficeParsedDocumentDto
            {
                FileName = fileName,
                DocumentKind = "MARKDOWN",
                Title = title,
                MarkdownContent = text
            };
        }

        public byte[] ExportDocx(OfficeExportDocxRequestDto request)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            using var doc = new XWPFDocument();

            if (!string.IsNullOrWhiteSpace(request.Title))
            {
                var titlePara = doc.CreateParagraph();
                titlePara.Alignment = ParagraphAlignment.CENTER;
                var titleRun = titlePara.CreateRun();
                titleRun.SetText(request.Title.Trim());
                titleRun.IsBold = true;
                titleRun.FontSize = 18;
            }

            var lines = (request.MarkdownContent ?? string.Empty).Replace("\r\n", "\n").Split('\n');
            int i = 0;
            while (i < lines.Length)
            {
                string line = lines[i].Trim();
                if (string.IsNullOrWhiteSpace(line) || line.StartsWith("<!--"))
                {
                    i++;
                    continue;
                }

                // Markdown table block
                if (line.StartsWith("|") && line.EndsWith("|"))
                {
                    var tableRows = new List<List<string>>();
                    while (i < lines.Length)
                    {
                        string tLine = lines[i].Trim();
                        if (!tLine.StartsWith("|")) break;
                        var cols = tLine.Trim('|').Split('|').Select(c => c.Trim()).ToList();
                        bool isSeparator = cols.All(c => c.Length > 0 && c.All(ch => ch == '-' || ch == ':'));
                        if (!isSeparator) tableRows.Add(cols);
                        i++;
                    }

                    if (tableRows.Count > 0)
                    {
                        int colCount = tableRows.Max(r => r.Count);
                        var xTable = doc.CreateTable(tableRows.Count, Math.Max(1, colCount));
                        for (int r = 0; r < tableRows.Count; r++)
                        {
                            for (int c = 0; c < tableRows[r].Count; c++)
                            {
                                var cell = xTable.GetRow(r).GetCell(c);
                                cell.SetText(tableRows[r][c]);
                            }
                        }
                    }
                    continue;
                }

                var para = doc.CreateParagraph();
                var run = para.CreateRun();

                if (line.StartsWith("### "))
                {
                    run.SetText(line.Substring(4).Trim());
                    run.IsBold = true;
                    run.FontSize = 13;
                }
                else if (line.StartsWith("## "))
                {
                    run.SetText(line.Substring(3).Trim());
                    run.IsBold = true;
                    run.FontSize = 15;
                }
                else if (line.StartsWith("# "))
                {
                    run.SetText(line.Substring(2).Trim());
                    run.IsBold = true;
                    run.FontSize = 17;
                }
                else if (line.StartsWith("- ") || line.StartsWith("* "))
                {
                    run.SetText("• " + line.Substring(2).Trim());
                    run.FontSize = 11;
                }
                else
                {
                    run.SetText(line);
                    run.FontSize = 11;
                }

                i++;
            }

            using var outMs = new MemoryStream();
            doc.Write(outMs);
            return outMs.ToArray();
        }

        public byte[] ExportXlsx(OfficeExportXlsxRequestDto request)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            using var workbook = new XSSFWorkbook();

            var headerFont = workbook.CreateFont();
            headerFont.IsBold = true;
            var headerStyle = workbook.CreateCellStyle();
            headerStyle.SetFont(headerFont);

            var sheets = request.Sheets != null && request.Sheets.Count > 0
                ? request.Sheets
                : new List<OfficeSheetDto> { new() { Name = "Sheet1", Rows = new List<List<string>> { new() { "A", "B" } } } };

            int idx = 1;
            foreach (var sheetDto in sheets)
            {
                string sheetName = string.IsNullOrWhiteSpace(sheetDto.Name) ? $"Sheet{idx}" : sheetDto.Name.Trim();
                if (sheetName.Length > 31) sheetName = sheetName.Substring(0, 31);
                var sheet = workbook.CreateSheet(sheetName);

                for (int r = 0; r < sheetDto.Rows.Count; r++)
                {
                    var row = sheet.CreateRow(r);
                    for (int c = 0; c < sheetDto.Rows[r].Count; c++)
                    {
                        var cell = row.CreateCell(c);
                        cell.SetCellValue(sheetDto.Rows[r][c] ?? string.Empty);
                        if (r == 0) cell.CellStyle = headerStyle;
                    }
                }
                idx++;
            }

            using var outMs = new MemoryStream();
            workbook.Write(outMs, leaveOpen: true);
            return outMs.ToArray();
        }

        public async Task<OfficeAiAssistResponseDto> RunAiAssistAsync(
            Guid tenantId,
            OfficeAiAssistRequestDto request,
            CancellationToken ct = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            string action = string.IsNullOrWhiteSpace(request.Action)
                ? "POLISH_LESSON"
                : request.Action.Trim().ToUpperInvariant();

            string title = string.IsNullOrWhiteSpace(request.Title) ? "Tài liệu giáo dục" : request.Title.Trim();
            string sourceText = BuildSourceContext(request);
            if (string.IsNullOrWhiteSpace(sourceText))
                sourceText = title;

            string instruction = action switch
            {
                "POLISH_LESSON" => "Hãy chuẩn hóa và nâng cấp nội dung sau thành một Giáo án / Tài liệu giảng dạy mạch lạc theo chuẩn Markdown (# Tiêu đề, ## Mục tiêu, ## Khởi động, ## Hoạt động Khám phá, ## Tổng kết & Dặn dò, bảng biểu nếu phù hợp).",
                "SUMMARIZE" => "Hãy tóm tắt nội dung sau thành các ý chính cô đọng (bullet points) và bảng thuật ngữ / khái niệm trọng tâm bằng Markdown.",
                "GENERATE_QUIZ" => "Từ nội dung sau, hãy biên soạn 5 câu hỏi trắc nghiệm 4 lựa chọn (A, B, C, D) kèm đáp án đúng và giải thích ngắn gọn bằng Markdown.",
                "ANALYZE_SHEET" => "Hãy phân tích bảng dữ liệu / bảng điểm sau: tính toán nhận xét xu hướng, điểm nổi bật, nhóm cần hỗ trợ thêm và đề xuất hành động sư phạm cụ thể bằng Markdown.",
                "TRANSLATE_BILINGUAL" => "Hãy chuyển nội dung sau thành tài liệu Song ngữ Việt – Anh rõ ràng, giữ nguyên cấu trúc tiêu đề, danh sách và bảng biểu.",
                _ => string.IsNullOrWhiteSpace(request.CustomInstruction)
                    ? "Hãy cải thiện nội dung sau cho rõ ràng, khoa học và dễ hiểu hơn bằng Markdown."
                    : request.CustomInstruction.Trim()
            };

            if (_aiRouter != null)
            {
                try
                {
                    string truncated = sourceText.Length > 8000 ? sourceText.Substring(0, 8000) : sourceText;
                    var aiRes = await _aiRouter.ExecuteAsync(new AiExecutionRequest
                    {
                        TenantId = tenantId == Guid.Empty ? null : tenantId.ToString(),
                        SystemPrompt = "You are Aegis Office AI Co-Pilot — an expert educator, curriculum designer, and data analyst. Always respond in clean, well-structured Markdown ready to paste or export to .docx.",
                        Prompt = $"Tiêu đề: {title}\nYêu cầu: {instruction}\n\n--- NỘI DUNG GỐC ---\n{truncated}"
                    });

                    if (aiRes.Success && !string.IsNullOrWhiteSpace(aiRes.Content))
                    {
                        return new OfficeAiAssistResponseDto
                        {
                            Success = true,
                            UsedAi = true,
                            Action = action,
                            ResultMarkdown = aiRes.Content.Trim(),
                            Message = "AI đã hoàn thành xử lý tài liệu."
                        };
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[OfficeAi] AI router fallback to deterministic assistant | Action={Action}", action);
                }
            }

            string fallback = BuildDeterministicAiFallback(action, title, request);
            return new OfficeAiAssistResponseDto
            {
                Success = true,
                UsedAi = false,
                Action = action,
                ResultMarkdown = fallback,
                Message = "Đã tạo bản gợi ý cấu trúc chuẩn (Offline Assistant)."
            };
        }

        private static string BuildSourceContext(OfficeAiAssistRequestDto request)
        {
            if (request.Sheets != null && request.Sheets.Count > 0)
            {
                var sb = new StringBuilder();
                foreach (var s in request.Sheets)
                {
                    sb.AppendLine($"### Sheet: {s.Name}");
                    foreach (var row in s.Rows.Take(80))
                        sb.AppendLine($"| {string.Join(" | ", row)} |");
                }
                return sb.ToString();
            }
            return request.MarkdownContent ?? string.Empty;
        }

        private static string BuildDeterministicAiFallback(string action, string title, OfficeAiAssistRequestDto request)
        {
            if (action == "ANALYZE_SHEET" && request.Sheets != null && request.Sheets.Count > 0)
            {
                var sheet = request.Sheets[0];
                int dataRows = Math.Max(0, sheet.Rows.Count - 1);
                var nums = new List<double>();
                foreach (var row in sheet.Rows.Skip(1))
                {
                    foreach (var cell in row)
                    {
                        if (double.TryParse(cell?.Replace(',', '.'), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out double v))
                            nums.Add(v);
                    }
                }
                string stats = nums.Count > 0
                    ? $"- Số giá trị số: **{nums.Count}** | Trung bình: **{nums.Average():F2}** | Cao nhất: **{nums.Max():F2}** | Thấp nhất: **{nums.Min():F2}**"
                    : "- Chưa phát hiện cột điểm số định lượng.";

                return $"# Phân Tích Bảng Dữ Liệu: {title}\n\n" +
                       $"- Tên trang tính: **{sheet.Name}**\n" +
                       $"- Tổng số bản ghi dữ liệu: **{dataRows}**\n" +
                       $"{stats}\n\n" +
                       "## Đề xuất hành động\n- Khen ngợi nhóm học sinh đạt kết quả cao.\n- Tổ chức ôn tập cá nhân hóa cho nhóm dưới mức trung bình.";
            }

            if (action == "GENERATE_QUIZ")
            {
                return $"# Bộ Câu Hỏi Trắc Nghiệm: {title}\n\n" +
                       "**Câu 1:** Ý chính quan trọng nhất của bài học \"{title}\" là gì?\n" +
                       "- A. Ghi nhớ máy móc\n- B. Hiểu bản chất và vận dụng thực tế\n- C. Bỏ qua thực hành\n- D. Không cần ôn tập\n" +
                       "**Đáp án:** B\n\n" +
                       "**Câu 2:** Sau khi học xong \"{title}\", học sinh cần thực hành điều gì?\n" +
                       "- A. Chia sẻ và vận dụng vào bài tập\n- B. Đóng vở lại ngay\n- C. Không cần kiểm tra\n- D. Chỉ đọc lướt\n" +
                       "**Đáp án:** A";
            }

            string excerpt = (request.MarkdownContent ?? string.Empty).Trim();
            if (excerpt.Length > 600) excerpt = excerpt.Substring(0, 600) + "...";

            return $"# {title} (Chuẩn Hóa Sư Phạm)\n\n" +
                   "## 1. Mục tiêu bài học\n- Giúp học sinh nắm vững trọng tâm kiến thức và thực hành ngay tại lớp.\n\n" +
                   "## 2. Nội dung cốt lõi\n" +
                   (string.IsNullOrWhiteSpace(excerpt) ? "- Nhập nội dung bài giảng tại đây." : excerpt) +
                   "\n\n## 3. Hoạt động tương tác & Tổng kết\n- Thảo luận nhóm 5 phút và kiểm tra nhanh bằng câu hỏi trắc nghiệm.";
        }
    }
}
