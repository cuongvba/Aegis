using System.Collections.Generic;
using System.IO;
using System.Linq;
using Xunit;
using AegisQuiz.Infrastructure.Services.Pdf;

namespace AegisQuiz.UnitTests
{
    public class PdfMathAndStructureNormalizerTests
    {
        private readonly PdfMathSymbolGlyphNormalizer _mathNormalizer = new();
        private readonly PdfStructureGuardService _structureGuard = new();
        private readonly PdfToMarkdownTranspilerService _transpiler;

        public PdfMathAndStructureNormalizerTests()
        {
            _transpiler = new PdfToMarkdownTranspilerService(_mathNormalizer, _structureGuard);
        }

        [Fact]
        public void NormalizeMathGlyphs_ShouldResolvePuaMinusAndSymbols()
        {
            // Case Câu 8 in user exam: \uF00E represents minus / negative
            string input = "Bất phương trình ()()2331log2log79++- \uF00E --xxx có tập nghiệm là";
            string output = _mathNormalizer.NormalizeMathGlyphs(input);

            Assert.DoesNotContain("\uF00E", output);
            Assert.Contains("-", output);
        }

        [Fact]
        public void ReconstructDegreeSymbols_ShouldConvertZeroAngleOptionsToLatexDegrees()
        {
            // Case Câu 7: A. 045, B. 30, C. 90, D. 60
            string input = "A. 045\nB. 30\nC. 90\nD. 60";
            string output = _mathNormalizer.ReconstructDegreeSymbols(input);

            Assert.Contains("$45^{\\circ}$", output);
        }

        [Fact]
        public void ReconstructGeometricPrismLabels_ShouldResolvePrismAndPlanes()
        {
            // Case Câu 7: Cho hình lăng trụ đứng □□□□ABCABC... ()□□ABBA
            string input = "Cho hình lăng trụ đứng □□□□ABCABC có đáy là tam giác vuông cân tại C, cạnh 2□ ==BCaBB. Tính góc tạo bởi □BC và mặt phẳng ()□□ABBA.";
            string output = _mathNormalizer.ReconstructGeometricPrismLabels(input);

            Assert.Contains("ABC.A'B'C'", output);
            Assert.Contains("(ABB'A')", output);
            Assert.Contains("B'C", output);
            Assert.DoesNotContain("□", output);
        }

        [Fact]
        public void CleanNoiseAndWatermarks_ShouldRemoveSiteHeadersAndPageFooters()
        {
            string raw = "Câu 1. Nội dung câu 1.\nthuvienhoclieu.com thuvienhoclieu.com Trang 3\nCâu 2. Nội dung câu 2.";
            string cleaned = _structureGuard.CleanNoiseAndWatermarks(raw);

            Assert.DoesNotContain("thuvienhoclieu.com", cleaned);
            Assert.DoesNotContain("Trang 3", cleaned);
            Assert.Contains("Câu 1. Nội dung câu 1.", cleaned);
            Assert.Contains("Câu 2. Nội dung câu 2.", cleaned);
        }

        [Fact]
        public void TranspileToMarkdown_ShouldProperlySeparatePartIAndPartIIQuestions()
        {
            string input = @"Câu 8. Bất phương trình log2(x) có tập nghiệm là
A. (0; 1)
B. (1; 2)
C. (2; 3)
D. (3; 4)
PHẦN II. Câu trắc nghiệm đúng sai. Thí sinh trả lời từ câu 1 đến câu 4. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
Câu 1. Một hộp chứa các viên bi có kích thước và khối lượng như nhau...
a) Xác suất chọn được ít nhất 5 viên bi màu trắng là 178.
b) Xác suất chọn được 6 viên bi đủ ba màu là 69/442.
c) Xác suất chọn được 6 viên bi toàn màu đỏ là 11/786.
d) Xác suất chọn được ít nhất một viên bi màu xanh nhỏ hơn 0,95.";

            string md = _transpiler.TranspileToMarkdown(input);

            Assert.Contains("# PHẦN I", md);
            Assert.Contains("## Câu 8.", md);
            Assert.Contains("# PHẦN II", md);
            Assert.Contains("## Câu 1.", md);
            Assert.Contains("a)", md);
            Assert.Contains("b)", md);
        }

        [Fact]
        public void TranspileAndParse_OnActualDeToanPdf_ShouldExtractQuestionsWithFormulas()
        {
            string path = @"D:\Cuong\DuAn\DETHI\DeWord\DeToan.pdf";
            if (!File.Exists(path)) return;

            using var stream = File.OpenRead(path);
            var questions = _transpiler.TranspileAndParse(stream);

            Assert.NotNull(questions);
            Assert.NotEmpty(questions);

            // Kiểm tra các câu hỏi Phần I
            var q1 = questions.FirstOrDefault(q => q.Content.Contains("Cho hàm số") && q.Content.Contains("y ="));
            Assert.NotNull(q1);

            // Kiểm tra các phương án có chứa KaTeX
            var qWithOpts = questions.FirstOrDefault(q => q.Options != null && q.Options.Count == 4);
            Assert.NotNull(qWithOpts);
        }
    }
}
