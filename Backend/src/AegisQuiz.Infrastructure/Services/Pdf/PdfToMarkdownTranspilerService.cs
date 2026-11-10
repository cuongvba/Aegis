using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using UglyToad.PdfPig;
using AegisQuiz.Application.DTOs;
using AegisQuiz.Application.Interfaces;
using AegisQuiz.Infrastructure.Services.Docx;

namespace AegisQuiz.Infrastructure.Services.Pdf
{
    /// <summary>
    /// [Aegis PDF to Markdown Transpiler Engine]
    /// Dịch vụ chuyển đổi toàn diện luồng PDF thành tài liệu Markdown (.md) có cấu trúc chuẩn 100% KaTeX,
    /// tích hợp Động cơ Tái thiết Không gian 2D (Spatial Coordinate Letter Clustering, Image Anchoring & Fraction Synthesizer).
    /// Hợp nhất với DocxStateMachineClassifier & DynamicQuestionIngestionEngine (SSoT) để kế thừa toàn bộ thành tựu bóc tách Docx.
    /// </summary>
    public class PdfToMarkdownTranspilerService : IPdfToMarkdownTranspilerService
    {
        private readonly IPdfMathSymbolGlyphNormalizer _mathNormalizer;
        private readonly IPdfStructureGuardService _structureGuard;
        private readonly IPdfVisionFallbackService _visionFallback;

        public PdfToMarkdownTranspilerService(
            IPdfMathSymbolGlyphNormalizer mathNormalizer,
            IPdfStructureGuardService structureGuard,
            IPdfVisionFallbackService? visionFallback = null)
        {
            _mathNormalizer = mathNormalizer;
            _structureGuard = structureGuard;
            _visionFallback = visionFallback ?? new PdfHybridVisionFallbackService(mathNormalizer, structureGuard);
        }

        public string TranspileToMarkdown(string pdfRawText, IEnumerable<string>? pageTexts = null)
        {
            if (string.IsNullOrWhiteSpace(pdfRawText)) return string.Empty;

            string cleanedText = _structureGuard.CleanNoiseAndWatermarks(pdfRawText);
            string normalizedMathText = _mathNormalizer.NormalizeMathGlyphs(cleanedText);
            var segmentedLines = _structureGuard.SegmentSectionsAndQuestions(normalizedMathText);

            var sb = new StringBuilder();
            int currentPart = 1;

            foreach (var line in segmentedLines)
            {
                var trimmed = line.Trim();
                if (string.IsNullOrEmpty(trimmed)) continue;

                if (trimmed.StartsWith("=== PHẦN II", StringComparison.OrdinalIgnoreCase))
                {
                    currentPart = 2;
                    sb.AppendLine("\n# PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI\n");
                    continue;
                }
                else if (trimmed.StartsWith("=== PHẦN III", StringComparison.OrdinalIgnoreCase))
                {
                    currentPart = 3;
                    sb.AppendLine("\n# PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN\n");
                    continue;
                }
                else if (trimmed.StartsWith("=== PHẦN I", StringComparison.OrdinalIgnoreCase))
                {
                    currentPart = 1;
                    sb.AppendLine("\n# PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN\n");
                    continue;
                }

                var qMatch = Regex.Match(trimmed, @"^(?:Câu|Question|Bài)\s*(\d+)[\.\:\s\-]+(.*)$", RegexOptions.IgnoreCase);
                if (qMatch.Success)
                {
                    int qNum = int.Parse(qMatch.Groups[1].Value);
                    string stem = qMatch.Groups[2].Value.Trim();
                    sb.AppendLine($"\n## Câu {qNum}. {stem}");
                    continue;
                }

                var optMatch = Regex.Match(trimmed, @"^([A-D])\s*[\.\:\)]\s*(.*)$");
                if (optMatch.Success && currentPart == 1)
                {
                    sb.AppendLine($"{optMatch.Groups[1].Value}. {optMatch.Groups[2].Value.Trim()}");
                    continue;
                }

                var subMatch = Regex.Match(trimmed, @"^([a-d])\s*[\.\:\)]\s*(.*)$");
                if (subMatch.Success)
                {
                    sb.AppendLine($"  - {subMatch.Groups[1].Value}) {subMatch.Groups[2].Value.Trim()}");
                    continue;
                }

                sb.AppendLine(trimmed);
            }

            return sb.ToString();
        }

        public List<DocxImportPreviewDto> TranspileAndParse(Stream pdfStream)
        {
            if (pdfStream == null || pdfStream.Length == 0)
                return new List<DocxImportPreviewDto>();

            if (pdfStream.CanSeek)
                pdfStream.Seek(0, SeekOrigin.Begin);

            // 1. Áp dụng Động cơ Tái thiết Không gian 2D trên toàn bộ tài liệu (gồm ký tự text, ảnh và KaTeX)
            List<string> virtualParagraphs;
            Dictionary<string, Dictionary<string, Dictionary<int, string>>> answerKeyMap;
            using (var document = PdfDocument.Open(pdfStream))
            {
                (virtualParagraphs, answerKeyMap) = PdfSpatialMathReconstructor.ReconstructDocumentWithAnswerKeys(document);

                // [ST-1 Hybrid Vision Fallback] Nếu trang PDF là ảnh scan hoặc lỗi font PUA nặng không bóc được chữ
                if (virtualParagraphs.Count == 0)
                {
                    for (int p = 1; p <= document.NumberOfPages; p++)
                    {
                        var page = document.GetPage(p);
                        int letterCount = page.Letters.Count;
                        var largeImgs = page.GetImages()
                            .Where(i => i.BoundingBox.Width >= 200 && i.BoundingBox.Height >= 150)
                            .OrderByDescending(i => i.RawBytes.Length)
                            .ToList();

                        if (_visionFallback.ShouldTriggerVisionFallback(letterCount, largeImgs.Count, page.Text) && largeImgs.Count > 0)
                        {
                            var bytes = largeImgs[0].RawBytes.ToArray();
                            string mime = (bytes.Length >= 2 && bytes[0] == 0xFF && bytes[1] == 0xD8) ? "image/jpeg" : "image/png";
                            var visionParas = _visionFallback.ReconstructPageFromScannedImage(bytes, mime, p);
                            virtualParagraphs.AddRange(visionParas);
                        }
                    }
                }
            }

            // 2. Chuyển giao trực tiếp cho Bộ máy Phân tích SSoT của DOCX
            // (Thừa hưởng toàn bộ thuật toán tách phương án dàn ngang, bảng phương án, 9 dạng câu hỏi và taxonomy)
            var sSotQuestions = DocxStateMachineClassifier.ParseParagraphList(virtualParagraphs, answerKeyMap);

            if (sSotQuestions != null && sSotQuestions.Count > 0)
            {
                foreach (var q in sSotQuestions)
                {
                    DocxParserService.AutoEnrichTaxonomyAndTags(q);
                }
                return sSotQuestions;
            }

            // 3. Fallback: Parse qua Markdown Lines nếu SSoT Parser không tìm thấy câu
            string combinedText = string.Join("\n", virtualParagraphs);
            string markdown = TranspileToMarkdown(combinedText);
            var markdownLines = markdown.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            var fallbackQuestions = ParseMarkdownLines(markdownLines);

            return fallbackQuestions;
        }

        private List<DocxImportPreviewDto> ParseMarkdownLines(string[] lines)
        {
            var result = new List<DocxImportPreviewDto>();
            DocxImportPreviewDto? currentQuestion = null;
            int currentPart = 1;

            var qHeaderRegex = new Regex(@"^##\s+Câu\s+(\d+)[\.\:\s\-]+(.*)$", RegexOptions.IgnoreCase);
            var optRegex = new Regex(@"^([A-D])\s*[\.\:\)]\s*(.*)$");
            var subItemRegex = new Regex(@"^(?:-\s*)?([a-d])\s*[\.\:\)]\s*(.*)$");

            foreach (var line in lines)
            {
                var trimmed = line.Trim();

                if (trimmed.StartsWith("# PHẦN II", StringComparison.OrdinalIgnoreCase))
                {
                    currentPart = 2;
                    continue;
                }
                if (trimmed.StartsWith("# PHẦN III", StringComparison.OrdinalIgnoreCase))
                {
                    currentPart = 3;
                    continue;
                }
                if (trimmed.StartsWith("# PHẦN I", StringComparison.OrdinalIgnoreCase))
                {
                    currentPart = 1;
                    continue;
                }

                var qMatch = qHeaderRegex.Match(trimmed);
                if (qMatch.Success)
                {
                    currentQuestion = new DocxImportPreviewDto
                    {
                        TempId = Guid.NewGuid().ToString(),
                        Content = qMatch.Groups[2].Value.Trim(),
                        QuestionType = currentPart switch
                        {
                            2 => "MULTIPLE_TRUE_FALSE",
                            3 => "SHORT_ANSWER",
                            _ => "SINGLE"
                        },
                        Difficulty = 2,
                        Options = new List<string>(),
                        SubItems = new List<QuestionSubItemDto>()
                    };
                    result.Add(currentQuestion);
                    continue;
                }

                if (currentQuestion == null) continue;

                var optMatch = optRegex.Match(trimmed);
                if (optMatch.Success && currentPart == 1)
                {
                    string optText = optMatch.Groups[2].Value.Trim();
                    if (Regex.IsMatch(optText, @"^[0-9xya-z\^\{\}\+\-\*\/\\ ]+$") && !optText.StartsWith("$"))
                    {
                        optText = $"${optText}$";
                    }
                    currentQuestion.Options.Add(optText);
                    continue;
                }

                var subMatch = subItemRegex.Match(trimmed);
                if (subMatch.Success && currentPart == 2)
                {
                    currentQuestion.SubItems.Add(new QuestionSubItemDto
                    {
                        Key = subMatch.Groups[1].Value.ToLowerInvariant(),
                        Content = subMatch.Groups[2].Value.Trim(),
                        ExpectedAnswer = "Đúng"
                    });
                    continue;
                }

                if (!string.IsNullOrWhiteSpace(currentQuestion.Content))
                {
                    currentQuestion.Content += "\n" + trimmed;
                }
                else
                {
                    currentQuestion.Content = trimmed;
                }
            }

            if (result.Count == 0)
            {
                result = DocxParserService.ParseParagraphs(lines);
            }

            foreach (var q in result)
            {
                DocxParserService.AutoEnrichTaxonomyAndTags(q);
            }

            return result;
        }
    }
}
