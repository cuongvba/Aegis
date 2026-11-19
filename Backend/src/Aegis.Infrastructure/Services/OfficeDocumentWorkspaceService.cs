using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Xml.Linq;
using Aegis.Application.Interfaces;
using Aegis.Application.Models.AI;
using Aegis.Infrastructure.Services.Docx;
using Aegis.Infrastructure.Services.Pdf;
using Microsoft.Extensions.Logging;
using NPOI.SS.UserModel;
using NPOI.Util;
using NPOI.XSSF.UserModel;
using NPOI.XWPF.UserModel;
using SkiaSharp;
using UglyToad.PdfPig;

namespace Aegis.Infrastructure.Services
{
    public class OfficeDocumentWorkspaceService : IOfficeDocumentWorkspaceService
    {
        private readonly ILogger<OfficeDocumentWorkspaceService> _logger;
        private readonly IUniversalAiRouter? _aiRouter;
        private readonly IPdfToMarkdownTranspilerService? _pdfTranspiler;
        private readonly IPdfMathSymbolGlyphNormalizer? _mathGlyphNormalizer;
        private readonly IPdfVisionFallbackService? _visionFallback;
        private readonly IVietnameseTextCorrectionService? _vnCorrector;
        private readonly IImageOcrService? _imageOcr;

        public OfficeDocumentWorkspaceService(
            ILogger<OfficeDocumentWorkspaceService> logger,
            IUniversalAiRouter? aiRouter = null,
            IPdfToMarkdownTranspilerService? pdfTranspiler = null,
            IPdfMathSymbolGlyphNormalizer? mathGlyphNormalizer = null,
            IPdfVisionFallbackService? visionFallback = null,
            IVietnameseTextCorrectionService? vnCorrector = null,
            IImageOcrService? imageOcr = null)
        {
            _logger = logger;
            _aiRouter = aiRouter;
            _pdfTranspiler = pdfTranspiler;
            _mathGlyphNormalizer = mathGlyphNormalizer;
            _visionFallback = visionFallback;
            _vnCorrector = vnCorrector;
            _imageOcr = imageOcr;
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
                ".png" or ".jpg" or ".jpeg" or ".webp" => await ParseImageToMarkdownAsync(ms, safeName, baseTitle, ext, ct),
                ".xlsx" or ".xls" => ParseSpreadsheet(ms, safeName, baseTitle),
                ".md" or ".txt" or ".csv" => await ParsePlainOrMarkdownAsync(ms, safeName, baseTitle, ext, ct),
                _ => throw new NotSupportedException($"Định dạng '{ext}' chưa được hỗ trợ. Vui lòng chọn .docx, .pdf, .png, .jpg, .xlsx, .xls, .md hoặc .txt.")
            };
        }

        private OfficeParsedDocumentDto ParseDocx(MemoryStream ms, string fileName, string title)
        {
            var sb = new StringBuilder();
            var warnings = new List<string>();

            try
            {
                ms.Position = 0;
                using var archive = new ZipArchive(ms, ZipArchiveMode.Read, leaveOpen: true);
                var relsMap = DocxRelationshipReader.LoadRelationships(archive);
                var mediaDict = DocxRelationshipReader.LoadMediaFiles(archive);

                var documentEntry = archive.GetEntry("word/document.xml");
                if (documentEntry != null)
                {
                    using var entryStream = documentEntry.Open();
                    var xdoc = XDocument.Load(entryStream);
                    var tokens = DocxParserService.ExtractParagraphTokens(xdoc, relsMap, mediaDict);
                    foreach (var token in tokens)
                    {
                        if (!string.IsNullOrWhiteSpace(token))
                        {
                            sb.AppendLine(token.Trim());
                            sb.AppendLine();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[OfficeWorkspace] Rich DOCX extraction fallback to NPOI | File={File}", fileName);
                warnings.Add("Một số đối tượng nhúng phức tạp được đọc ở chế độ tương thích.");
                ms.Position = 0;
                using var doc = new XWPFDocument(ms);
                foreach (var p in doc.Paragraphs)
                {
                    string text = (p.Text ?? string.Empty).Trim();
                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        sb.AppendLine(text);
                        sb.AppendLine();
                    }
                }
            }

            return new OfficeParsedDocumentDto
            {
                FileName = fileName,
                DocumentKind = "DOCX",
                Title = title,
                MarkdownContent = sb.ToString().Trim(),
                PageCount = 1,
                Warnings = warnings
            };
        }

        private OfficeParsedDocumentDto ParsePdf(MemoryStream ms, string fileName, string title)
        {
            var pageTexts = new List<string>();
            var warnings = new List<string>();
            int pageCount = 0;
            int visionRecoveredPages = 0;

            using (var pdf = PdfDocument.Open(ms))
            {
                pageCount = pdf.NumberOfPages;
                foreach (var page in pdf.GetPages())
                {
                    // 1. Spatial reconstruction from Letter (X, Y) coordinates preserves multi-column & superscripts
                    var spatialLines = PdfSpatialMathReconstructor.ReconstructPage(page);
                    string text = spatialLines.Count > 0
                        ? string.Join("\n", spatialLines)
                        : (page.Text ?? string.Empty).Trim();

                    // 2. Clean PUA glyphs, normalize math symbols, Unicode NFC & Vietnamese diacritics
                    text = NormalizeExtractedPdfText(text);

                    // 3. Trigger Vision OCR fallback when page is scanned or font ToUnicode CMap is corrupted
                    if (_visionFallback != null)
                    {
                        var imgs = page.GetImages().ToList();
                        bool corrupted = _visionFallback.ShouldTriggerVisionFallback(page.Letters.Count, imgs.Count, text);
                        if (corrupted && imgs.Count > 0)
                        {
                            var largest = imgs.OrderByDescending(i => i.RawBytes.Length).FirstOrDefault();
                            if (largest != null && largest.RawBytes.Length > 0)
                            {
                                var ocrLines = _visionFallback.ReconstructPageFromScannedImage(largest.RawBytes.ToArray(), "image/png", page.Number);
                                if (ocrLines.Count > 0)
                                {
                                    text = NormalizeExtractedPdfText(string.Join("\n", ocrLines));
                                    visionRecoveredPages++;
                                }
                            }
                        }
                    }

                    pageTexts.Add(text);
                }
            }

            if (visionRecoveredPages > 0)
            {
                warnings.Add($"Đã tự động phục hồi OCR thị giác cho {visionRecoveredPages} trang PDF scan/lỗi font.");
            }

            string rawJoined = string.Join("\n\n", pageTexts.Where(t => !string.IsNullOrWhiteSpace(t)));
            string content = _pdfTranspiler != null && !string.IsNullOrWhiteSpace(rawJoined)
                ? _pdfTranspiler.TranspileToMarkdown(rawJoined, pageTexts)
                : string.Join("\n\n", pageTexts.Select((t, idx) => $"<!-- Trang {idx + 1} -->\n{t}")).Trim();

            if (string.IsNullOrWhiteSpace(content))
            {
                warnings.Add("PDF này là bản scan dạng ảnh thuần; bạn vẫn có thể xem bản gốc bên trái hoặc dùng nút Tải .MD.");
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

        private async Task<OfficeParsedDocumentDto> ParseImageToMarkdownAsync(
            MemoryStream ms,
            string fileName,
            string title,
            string ext,
            CancellationToken ct)
        {
            byte[] bytes = ms.ToArray();
            string mime = ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".webp" => "image/webp",
                _ => "image/png"
            };

            string extracted = string.Empty;
            string ocrProvider = "none";
            if (_imageOcr != null)
            {
                var ocrRes = await _imageOcr.RecognizeDocumentAsync(bytes, mime, ct);
                if (ocrRes.Success)
                {
                    extracted = NormalizeExtractedPdfText(ocrRes.MarkdownText);
                    ocrProvider = ocrRes.Provider;
                }
            }

            if (string.IsNullOrWhiteSpace(extracted) && _visionFallback != null)
            {
                var ocrLines = _visionFallback.ReconstructPageFromScannedImage(bytes, mime, 1);
                if (ocrLines.Count > 0)
                    extracted = NormalizeExtractedPdfText(string.Join("\n\n", ocrLines));
            }

            var sb = new StringBuilder();
            if (!string.IsNullOrWhiteSpace(extracted))
            {
                sb.AppendLine(extracted);
            }
            else
            {
                sb.AppendLine($"# {title}");
                sb.AppendLine();
                sb.AppendLine($"![{fileName}](data:{mime};base64,{Convert.ToBase64String(bytes)})");
            }

            var warnings = new List<string>();
            if (ocrProvider == "tesseract-local")
            {
                warnings.Add("Đã nhận diện văn bản Unicode từ ảnh bằng Tesseract 5 LSTM (Offline).");
            }
            else if (ocrProvider == "vision-ai")
            {
                warnings.Add("Đã nhận diện văn bản Unicode & công thức Toán từ ảnh bằng Multimodal Vision AI.");
            }
            else if (string.IsNullOrWhiteSpace(extracted))
            {
                warnings.Add("Đã chèn ảnh vào trình soạn thảo Markdown (chưa trích xuất được chữ từ ảnh).");
            }

            return new OfficeParsedDocumentDto
            {
                FileName = fileName,
                DocumentKind = "MARKDOWN",
                Title = title,
                MarkdownContent = sb.ToString().Trim(),
                PageCount = 1,
                Warnings = warnings
            };
        }

        private string NormalizeExtractedPdfText(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return string.Empty;
            string s = text.Normalize(NormalizationForm.FormC);
            if (_mathGlyphNormalizer != null)
            {
                s = _mathGlyphNormalizer.CleanPuaCharacters(s);
                s = _mathGlyphNormalizer.NormalizeMathGlyphs(s);
                s = _mathGlyphNormalizer.ReconstructDegreeSymbols(s);
            }
            if (_vnCorrector != null)
            {
                s = _vnCorrector.CorrectText(s);
            }
            return s.Normalize(NormalizationForm.FormC).Trim();
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
                if (string.IsNullOrWhiteSpace(line))
                {
                    i++;
                    continue;
                }

                if (line == "---page---" || line.StartsWith("<!-- Trang ", StringComparison.OrdinalIgnoreCase))
                {
                    if (i > 0)
                    {
                        var pbPara = doc.CreateParagraph();
                        pbPara.IsPageBreak = true;
                    }
                    i++;
                    continue;
                }

                if (line.StartsWith("<!--"))
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

                // Embedded Markdown Base64 Image: ![alt](data:image/...;base64,...)
                var imgMatch = Regex.Match(line, @"^!\[[^\]]*\]\(data:image/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)\)$", RegexOptions.IgnoreCase);
                if (imgMatch.Success)
                {
                    TryAddPictureToDocx(doc, imgMatch.Groups[1].Value, imgMatch.Groups[2].Value);
                    i++;
                    continue;
                }

                var para = doc.CreateParagraph();

                if (line.StartsWith("### "))
                {
                    var run = para.CreateRun();
                    run.SetText(line.Substring(4).Trim());
                    run.IsBold = true;
                    run.FontSize = 13;
                }
                else if (line.StartsWith("## "))
                {
                    var run = para.CreateRun();
                    run.SetText(line.Substring(3).Trim());
                    run.IsBold = true;
                    run.FontSize = 15;
                }
                else if (line.StartsWith("# "))
                {
                    var run = para.CreateRun();
                    run.SetText(line.Substring(2).Trim());
                    run.IsBold = true;
                    run.FontSize = 17;
                }
                else if (line.StartsWith("- ") || line.StartsWith("* "))
                {
                    AppendFormattedRuns(para, "• " + line.Substring(2).Trim(), 11);
                }
                else
                {
                    AppendFormattedRuns(para, line, 11);
                }

                i++;
            }

            if (!string.IsNullOrWhiteSpace(request.WatermarkText))
            {
                string stamp = request.WatermarkText.Trim();
                var policy = doc.CreateHeaderFooterPolicy();
                var header = policy.CreateHeader(NPOI.XWPF.Model.XWPFHeaderFooterPolicy.DEFAULT);
                var hp = header.CreateParagraph();
                hp.Alignment = NPOI.XWPF.UserModel.ParagraphAlignment.RIGHT;
                var hRun = hp.CreateRun();
                hRun.SetText($"[STAMP: {stamp}]");
                hRun.FontSize = 9;
                hRun.SetColor("94A3B8");
                hRun.IsItalic = true;

                var footer = policy.CreateFooter(NPOI.XWPF.Model.XWPFHeaderFooterPolicy.DEFAULT);
                var fp = footer.CreateParagraph();
                fp.Alignment = NPOI.XWPF.UserModel.ParagraphAlignment.CENTER;
                var fRun = fp.CreateRun();
                fRun.SetText($"CONFIDENTIAL / SOVEREIGNTY STAMP — {stamp}");
                fRun.FontSize = 9;
                fRun.SetColor("94A3B8");
                fRun.IsItalic = true;
            }

            if (!string.IsNullOrWhiteSpace(request.ProtectionPassword))
            {
                doc.EnforceReadonlyProtection(request.ProtectionPassword.Trim(), NPOI.POIFS.Crypt.HashAlgorithm.sha256);
            }

            ApplyDocxProperties(doc, request.Title, request.Properties);

            using var outMs = new MemoryStream();
            doc.Write(outMs);
            return outMs.ToArray();
        }

        private static void ApplyDocxProperties(XWPFDocument doc, string? title, OfficeDocumentPropertiesDto? props)
        {
            var poixmlProps = doc.GetProperties();
            var core = poixmlProps.CoreProperties;
            if (!string.IsNullOrWhiteSpace(title)) core.Title = title.Trim();
            if (props == null) return;

            if (!string.IsNullOrWhiteSpace(props.Author)) core.Creator = props.Author.Trim();
            if (!string.IsNullOrWhiteSpace(props.Subject)) core.Subject = props.Subject.Trim();
            if (!string.IsNullOrWhiteSpace(props.Keywords)) core.Keywords = props.Keywords.Trim();
            if (!string.IsNullOrWhiteSpace(props.Classification)) core.Category = props.Classification.Trim();
            if (!string.IsNullOrWhiteSpace(props.Description)) core.Description = props.Description.Trim();
            if (!string.IsNullOrWhiteSpace(props.Company))
            {
                var ext = poixmlProps.ExtendedProperties.GetUnderlyingProperties();
                ext.Company = props.Company.Trim();
            }
        }

        private static void TryAddPictureToDocx(XWPFDocument doc, string format, string base64)
        {
            try
            {
                byte[] imgBytes = Convert.FromBase64String(base64);
                int pxW = 800, pxH = 1100;
                using (var bmp = SKBitmap.Decode(imgBytes))
                {
                    if (bmp != null && bmp.Width > 0 && bmp.Height > 0)
                    {
                        pxW = bmp.Width;
                        pxH = bmp.Height;
                    }
                }

                double maxPtW = 460.0;
                double maxPtH = 640.0;
                double scale = Math.Min(maxPtW / pxW, maxPtH / pxH);
                if (scale > 1.0 && pxW < 460) scale = 1.0;

                int widthEmu = Units.ToEMU(pxW * scale);
                int heightEmu = Units.ToEMU(pxH * scale);
                var picType = format.StartsWith("jp", StringComparison.OrdinalIgnoreCase)
                    ? NPOI.XWPF.UserModel.PictureType.JPEG
                    : NPOI.XWPF.UserModel.PictureType.PNG;

                var imgPara = doc.CreateParagraph();
                imgPara.Alignment = ParagraphAlignment.CENTER;
                var imgRun = imgPara.CreateRun();
                using var imgStream = new MemoryStream(imgBytes);
                imgRun.AddPicture(imgStream, (int)picType, $"page.{format}", widthEmu, heightEmu);
            }
            catch
            {
                // Ignore malformed base64 image
            }
        }

        private static void AppendFormattedRuns(XWPFParagraph para, string text, int fontSize)
        {
            var tokenRegex = new System.Text.RegularExpressions.Regex(@"(\*\*[^*]+\*\*|\*[^*]+\*|<mark>[^<]+</mark>)");
            int lastIdx = 0;
            foreach (System.Text.RegularExpressions.Match m in tokenRegex.Matches(text))
            {
                if (m.Index > lastIdx)
                {
                    var plainRun = para.CreateRun();
                    plainRun.SetText(text.Substring(lastIdx, m.Index - lastIdx));
                    plainRun.FontSize = fontSize;
                }

                string tok = m.Value;
                var styledRun = para.CreateRun();
                styledRun.FontSize = fontSize;
                if (tok.StartsWith("**") && tok.EndsWith("**"))
                {
                    styledRun.SetText(tok.Substring(2, tok.Length - 4));
                    styledRun.IsBold = true;
                }
                else if (tok.StartsWith("*") && tok.EndsWith("*"))
                {
                    styledRun.SetText(tok.Substring(1, tok.Length - 2));
                    styledRun.IsItalic = true;
                }
                else if (tok.StartsWith("<mark>") && tok.EndsWith("</mark>"))
                {
                    styledRun.SetText(tok.Substring(6, tok.Length - 13));
                    styledRun.SetColor("B45309");
                    styledRun.IsBold = true;
                }
                lastIdx = m.Index + m.Length;
            }

            if (lastIdx < text.Length)
            {
                var tailRun = para.CreateRun();
                tailRun.SetText(text.Substring(lastIdx));
                tailRun.FontSize = fontSize;
            }
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
