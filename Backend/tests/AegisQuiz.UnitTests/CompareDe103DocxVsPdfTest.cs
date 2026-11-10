using System;
using System.IO;
using System.Linq;
using Xunit;
using Xunit.Abstractions;
using AegisQuiz.Infrastructure.Services;
using AegisQuiz.Infrastructure.Services.Docx;
using AegisQuiz.Infrastructure.Services.Pdf;
using UglyToad.PdfPig;

namespace AegisQuiz.UnitTests
{
    public class CompareDe103DocxVsPdfTest
    {
        private readonly ITestOutputHelper _output;

        public CompareDe103DocxVsPdfTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void CompareDocxAndPdfQuestions()
        {
            string docxPath = @"D:\Cuong\DuAn\DETHI\TNPT\thuvienhoclieu.com-De-thi-TN-THPT-2026-mon-Toan-Bo-GD-ma-de-103.docx";
            string pdfPath = @"D:\Cuong\DuAn\DETHI\TNPT\thuvienhoclieu.com-De-thi-TN-THPT-2026-mon-Toan-Bo-GD-ma-de-103.pdf";

            if (!File.Exists(docxPath) || !File.Exists(pdfPath))
            {
                _output.WriteLine("File not found!");
                return;
            }

            // 1. Docx Parse
            using var docxStream = File.OpenRead(docxPath);
            var docxQuestions = DocxParserService.ParseRichDocxStream(docxStream);
            _output.WriteLine($"=== DOCX QUESTIONS: {docxQuestions.Count} ===");
            if (docxQuestions.Count >= 4)
            {
                _output.WriteLine($"[DOCX Q4] Correct: {docxQuestions[3].SuggestedAnswer}, Explanation: {docxQuestions[3].AiExplanation}");
            }
            var docxLogs = DocxStateMachineClassifier.LastDebugLogs.Where(l => l.Contains("isSolPhaseMatch") || l.Contains("isSolutionPhase=True") || l.Contains("PHẦN I") || l.Contains("LỜI GIẢI") || l.Contains("HƯỚNG DẪN")).ToList();
            foreach (var l in docxLogs) _output.WriteLine($"  DOCX LOG: {l}");
            foreach (var l in docxLogs) _output.WriteLine($"  DOCX LOG: {l}");
            for (int i = 0; i < Math.Min(3, docxQuestions.Count); i++)
            {
                var q = docxQuestions[i];
                string content = q.Content;
                if (content.Length > 100) content = content.Substring(0, 100) + "...";
                _output.WriteLine($"[DOCX Q{i+1}] Content: {content}");
                _output.WriteLine($"  Options ({q.Options?.Count}): {string.Join(" | ", q.Options ?? new())}");
                _output.WriteLine($"  Correct: {q.SuggestedAnswer}, Explanation: {q.AiExplanation}");
            }

            // 2. PDF Parse qua PdfParserService / PdfSpatialMathReconstructor
            using var pdfDoc = PdfDocument.Open(pdfPath);
            var rawParagraphs = new List<string>();
            for (int p = 1; p <= pdfDoc.NumberOfPages; p++)
            {
                rawParagraphs.AddRange(PdfSpatialMathReconstructor.ReconstructPage(pdfDoc.GetPage(p)));
            }
            _output.WriteLine($"\n=== RAW PARAGRAPHS FOR Q4, Q11, Q15, Q16 ===");
            for (int idx = 0; idx < rawParagraphs.Count; idx++)
            {
                var r = rawParagraphs[idx];
                if (r.Contains("Câu 4") || r.Contains("Câu 11") || r.Contains("Câu 15") || r.Contains("Câu 16") || r.Contains("Hàm số F") || r.Contains("F(t)"))
                {
                    for (int k = Math.Max(0, idx - 1); k <= Math.Min(rawParagraphs.Count - 1, idx + 4); k++)
                    {
                        _output.WriteLine($"  RAW [{k}] '{rawParagraphs[k]}'");
                    }
                }
            }

            var (virtualParagraphs, answerKeyMap) = PdfSpatialMathReconstructor.ReconstructDocumentWithAnswerKeys(pdfDoc);
            _output.WriteLine($"\n=== TOTAL VIRTUAL PARAGRAPHS: {virtualParagraphs.Count} ===");
            for (int i = 0; i < virtualParagraphs.Count; i++)
            {
                if (virtualParagraphs[i].Contains("Oxyz") || virtualParagraphs[i].Contains("Câu 9") || virtualParagraphs[i].Contains("Câu 10") || virtualParagraphs[i].Contains("bất phương trình"))
                {
                    for (int j = Math.Max(0, i - 1); j <= Math.Min(virtualParagraphs.Count - 1, i + 6); j++)
                    {
                        _output.WriteLine($"  VP[{j}]: '{virtualParagraphs[j]}'");
                    }
                    break;
                }
            }

            var pdfQuestions = DocxStateMachineClassifier.ParseParagraphList(virtualParagraphs, answerKeyMap);
            _output.WriteLine($"\n=== DOCX STATE MACHINE DEBUG LOGS ({DocxStateMachineClassifier.LastDebugLogs.Count}) ===");
            foreach (var log in DocxStateMachineClassifier.LastDebugLogs.Where(l => l.Contains("QNum=4") || l.Contains("Câu 4") || l.Contains("tiệm cận") || l.Contains("tiem can")))
            {
                _output.WriteLine($"  LOG: {log}");
            }
            _output.WriteLine($"=== COMPARING Q6 (103_1_0_0_6) ===");
            if (docxQuestions.Count > 5)
            {
                _output.WriteLine($"[DOCX Q6 Content]: {docxQuestions[5].Content}");
                _output.WriteLine($"[DOCX Q6 Options]: {string.Join(" | ", docxQuestions[5].Options ?? new())}");
            }
            if (pdfQuestions.Count > 5)
            {
                _output.WriteLine($"[PDF Q6 Content]: {pdfQuestions[5].Content}");
                _output.WriteLine($"[PDF Q6 Options]: {string.Join(" | ", pdfQuestions[5].Options ?? new())}");
            }

            _output.WriteLine($"\n=== COMPARING Q18 (103_3_0_0_2) ===");
            if (docxQuestions.Count > 17)
            {
                _output.WriteLine($"[DOCX Q18 Content]: {docxQuestions[17].Content}");
                _output.WriteLine($"[DOCX Q18 Explanation]: {docxQuestions[17].AiExplanation}");
            }
            if (pdfQuestions.Count > 17)
            {
                _output.WriteLine($"[PDF Q18 Content]: {pdfQuestions[17].Content}");
                _output.WriteLine($"[PDF Q18 Explanation]: {pdfQuestions[17].AiExplanation}");
            }

            // 3. Nghiệm thu chất lượng KaTeX & Không gian đề thi
            Assert.Equal(docxQuestions.Count, pdfQuestions.Count);

            for (int i = 0; i < pdfQuestions.Count; i++)
            {
                var q = pdfQuestions[i];

                // Assert Parity: Số lượng dấu $ trong Content không được lẻ
                int dollarCountContent = q.Content.Count(c => c == '$');
                Assert.True(dollarCountContent % 2 == 0, $"Q{i + 1} Content has odd number of $ signs ({dollarCountContent}): {q.Content}");

                // Assert Options: Mọi phương án nếu có $ thì số lượng $ không được lẻ
                if (q.Options?.Count > 0)
                {
                    for (int o = 0; o < q.Options.Count; o++)
                    {
                        int dollarCountOpt = q.Options[o].Count(c => c == '$');
                        Assert.True(dollarCountOpt % 2 == 0, $"Q{i + 1} Option {o + 1} has odd number of $ signs ({dollarCountOpt}): {q.Options[o]}");
                    }
                }
            }

            // Q4: Phải có hàm số y = \frac{ax+b}{cx+d} và điều kiện (không còn \\frac)
            Assert.Contains(@"\frac{ax+b}{cx+d}", pdfQuestions[3].Content);
            Assert.DoesNotContain(@"\\frac", pdfQuestions[3].Content);
            Assert.Contains(@"\ne", pdfQuestions[3].Content);

            // Q5: Phải có tích phân KaTeX đầy đủ
            Assert.Contains(@"$\int f(x)\,dx = \sin x + C$", pdfQuestions[4].Content);
            Assert.All(pdfQuestions[4].Options, opt => Assert.StartsWith(@"$\int", opt));

            // Q6 (103_1_0_0_6): Bảng số liệu ghép nhóm chuẩn Markdown Table, số không bị dính chùm 4814745
            Assert.Contains("| Thời gian học trực tuyến |", pdfQuestions[5].Content);
            Assert.Contains("| Số học sinh | 4 | 8 | 14 | 7 | 4 | 5 |", pdfQuestions[5].Content);
            Assert.DoesNotContain("4814745", pdfQuestions[5].Content);

            // Q10: Hệ bất phương trình \begin{cases} trong cả đề bài và lời giải
            Assert.Contains(@"\begin{cases}", pdfQuestions[9].Content);
            Assert.Contains(@"\begin{cases}", pdfQuestions[9].AiExplanation);

            // Q13: Hệ phương trình tham số đường thẳng MN ý b
            Assert.DoesNotContain("5+3t", pdfQuestions[12].Options[0]); // Ý a không bị dính dòng 1 của hệ
            Assert.Contains(@"\begin{cases}", pdfQuestions[12].Options[1]); // Ý b gom trọn vẹn cả 3 phương trình
            Assert.Contains("5 +3t", pdfQuestions[12].Options[1]);
            Assert.Contains("z = 0", pdfQuestions[12].Options[1]);

            // Q18 (103_3_0_0_2): Bảng số liệu bán hàng đa cột chuẩn Markdown Table, số không bị dính chùm 191410600
            Assert.Contains("| Thứ Tư | 19 | 14 | 10 | 600 |", pdfQuestions[17].Content);
            Assert.Contains("| Thứ Bảy | 50 | 25 | 20 | ? |", pdfQuestions[17].Content);
            Assert.DoesNotContain("191410600", pdfQuestions[17].Content);
            Assert.Contains(@"\begin{cases}", pdfQuestions[17].AiExplanation); // Hệ 3 phương trình 3 ẩn trong lời giải

            // Nghiệm thu Vectơ & Suy luận KaTeX trong Explanation & Content:
            Assert.Contains(@"\overrightarrow{AB}", pdfQuestions[1].Content);
            Assert.Contains(@"\overrightarrow{D'C'}", pdfQuestions[1].Options[1]);
            Assert.Contains(@"\Rightarrow", pdfQuestions[0].AiExplanation);
            Assert.Contains(@"\to", pdfQuestions[3].AiExplanation);
            Assert.Contains(@"\overrightarrow{AB}", pdfQuestions[8].AiExplanation);
            Assert.Contains(@"\Leftrightarrow", pdfQuestions[15].AiExplanation);
        }
    }
}
