using System;
using System.IO;
using System.Linq;
using Aegis.Infrastructure.Services;
using Xunit;
using Xunit.Abstractions;

namespace Aegis.UnitTests
{
    public class TestParseSnippetDirective
    {
        private readonly ITestOutputHelper _output;

        public TestParseSnippetDirective(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void TestDirectiveParsingSnippet()
        {
            var engine = DynamicQuestionIngestionEngine.Instance;
            var rules = engine.GetAllRules();
            var rGen = rules.FirstOrDefault(r => r.RuleCode == "GENERAL_UNIVERSAL_INGESTION");

            var line1 = "PHẦN II: CÂU HỎI ĐÚNG HOẶC SAI";
            var line2 = "Thí sinh trả lời từ câu 1 đến câu 2. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.";
            var line3 = "PHẦN III: CÂU HỎI TRẢ LỜI NGẮN";
            var line4 = "Thí sinh viết câu trả lời vào phiếu trả lời.";

            bool isSection1 = engine.TryMatchSectionHeader(line1, out string sec1);
            _output.WriteLine($"Line1: isSection={isSection1}, sec={sec1}");

            bool isSection3 = engine.TryMatchSectionHeader(line3, out string sec3);
            _output.WriteLine($"Line3: isSection={isSection3}, sec={sec3}");

            bool isDir2 = engine.TryParseScopeDirective(line2, out var win2);
            _output.WriteLine($"Line2: isDir={isDir2}, winType={win2?.QuestionType}, start={win2?.StartQuestion}, end={win2?.EndQuestion}");

            bool isDir4 = engine.TryParseScopeDirective(line4, out var win4);
            _output.WriteLine($"Line4: isDir={isDir4}, winType={win4?.QuestionType}, start={win4?.StartQuestion}, end={win4?.EndQuestion}");

            var stemInfer1 = engine.InferQuestionTypeFromStemDirective(line1, "SINGLE", rules);
            _output.WriteLine($"StemInfer1: {stemInfer1}");

            var stemInfer2 = engine.InferQuestionTypeFromStemDirective(line2, "SINGLE", rules);
            _output.WriteLine($"StemInfer2: {stemInfer2}");

            var stemInfer3 = engine.InferQuestionTypeFromStemDirective(line3, "SINGLE", rules);
            _output.WriteLine($"StemInfer3: {stemInfer3}");

            var stemInfer4 = engine.InferQuestionTypeFromStemDirective(line4, "SINGLE", rules);
            _output.WriteLine($"StemInfer4: {stemInfer4}");
        }

        [Fact]
        public void TestParseSnippetFullFlow()
        {
            var engine = DynamicQuestionIngestionEngine.Instance;
            var snippet = @"PHẦN II: CÂU HỎI ĐÚNG HOẶC SAI
Thí sinh trả lời từ câu 1 đến câu 2. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
Câu 1. Cho hàm số y = f(x).
a) Đồ thị hàm số đi qua gốc tọa độ.
b) Hàm số đồng biến trên R.
c) Hàm số đạt cực đại tại x = 1.
d) Giá trị nhỏ nhất của hàm số bằng 0.
Hướng dẫn giải
a) Đúng, b) Sai, c) Đúng, d) Sai.

PHẦN III: CÂU HỎI TRẢ LỜI NGẮN
Thí sinh trả lời câu hỏi sau.
Câu 2. Tính diện tích hình phẳng.
ĐÁP ÁN: 10.67";

            var result = engine.ParseSnippet(snippet, "GENERAL_UNIVERSAL_INGESTION");
            _output.WriteLine($"Total Questions: {result.Questions.Count}");
            foreach (var q in result.Questions)
            {
                _output.WriteLine($"Q: Type={q.QuestionType}, Content={q.Content?.Split('\n').FirstOrDefault()}, Options={q.Options.Count}, Ans={q.SuggestedAnswer}");
            }
        }

        [Fact]
        public void TestParseSnippetDirectivesWithoutSectionHeaders()
        {
            var engine = DynamicQuestionIngestionEngine.Instance;
            var snippet = @"CÂU HỎI ĐÚNG HOẶC SAI
Thí sinh trả lời từ câu 1 đến câu 2. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
Câu 1. Cho hàm số f(x).
a) Đồng biến trên R.
b) Đạt cực trị tại 0.
c) Có giới hạn hữu hạn.
d) Có tiệm cận ngang.
a) Đúng, b) Sai, c) Đúng, d) Sai

CÂU HỎI TRẢ LỜI NGẮN
Thí sinh trả lời từ câu 2 đến câu 2.
Câu 2. Tính tích phân I.
ĐÁP ÁN: 42";

            var result = engine.ParseSnippet(snippet, "GENERAL_UNIVERSAL_INGESTION");
            _output.WriteLine($"Standalone Directive - Total Questions: {result.Questions.Count}");
            foreach (var q in result.Questions)
            {
                _output.WriteLine($"Q: Type={q.QuestionType}, Content={q.Content?.Split('\n').FirstOrDefault()}, Options={q.Options.Count}, Ans={q.SuggestedAnswer}");
            }

            Assert.Equal(2, result.Questions.Count);
            Assert.Contains(result.Questions[0].QuestionType, new[] { "TRUE_FALSE", "MULTI_TRUE_FALSE" });
            Assert.Equal("SHORT_ANSWER", result.Questions[1].QuestionType);
            Assert.Equal("42", result.Questions[1].SuggestedAnswer);
        }

        [Fact]
        public void TestWhyOptionLineMatchesSection()
        {
            var line = "A. read                         B. reads                         C. reading                         D. to read";
            var cig = DynamicQuestionIngestionEngine.Instance;
            var rules = cig.GetAllRules();

            bool isQ = cig.TryMatchQuestionAnchor(line, out _, out _, rules);
            bool isExp = cig.IsExplanationLine(line);
            bool isTopic = cig.TryMatchTopicHeading(line, out string rawTopic);
            bool isSec = cig.TryMatchSectionHeader(line, out string secKey);
            bool isScope = cig.TryParseScopeDirective(line, out var scopeWin, 5, rules);
            bool isPrompt = cig.TryParsePassageContextPrompt(line, out int pStart, out int pEnd, out _);
            bool isPassage = cig.TryMatchReadingPassage(line, out int ps, out int pe);

            _output.WriteLine($"line: '{line}'");
            _output.WriteLine($"isQ: {isQ}, isExp: {isExp}, isTopic: {isTopic} ({rawTopic}), isSec: {isSec} ({secKey}), isScope: {isScope} ({scopeWin?.RawDirective}), isPrompt: {isPrompt}, isPassage: {isPassage}");

            var dict = cig.GetStructureDictionary();
            foreach (var kvp in dict.SectionMarkers ?? new())
            {
                foreach (var pat in kvp.Value)
                {
                    if (System.Text.RegularExpressions.Regex.IsMatch(line, pat, System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                    {
                        _output.WriteLine($"MATCHED Dict SectionMarker: Key={kvp.Key}, Pattern={pat}");
                    }
                }
            }

            foreach (var r in rules)
            {
                if (r.LifecycleSpec?.SectionHeaderMapping != null)
                {
                    foreach (var kvp in r.LifecycleSpec.SectionHeaderMapping)
                    {
                        foreach (var pat in kvp.Value)
                        {
                            if (System.Text.RegularExpressions.Regex.IsMatch(line, pat, System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                            {
                                _output.WriteLine($"MATCHED Rule [{r.RuleCode}] SectionHeaderMapping: Key={kvp.Key}, Pattern={pat}");
                            }
                        }
                    }
                }
            }
        }

        [Fact]
        public void TestDe07Questions21And22()
        {
            var filePath = @"D:\Cuong\DuAn\DETHI\THCS\LOP7\Bo-10-de-on-tap-giua-ky-1-Tieng-Anh-7-nam-25-26-co-dap-an.docx";
            if (!File.Exists(filePath)) return;

            using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            var results = DocxParserService.ParseRichDocxStream(fs);

            var de7Questions = results.Where(q => q.SourceExamName == "DE_07").ToList();
            _output.WriteLine($"DE_07 Total questions: {de7Questions.Count}");

            var q21 = de7Questions.FirstOrDefault(q => q.SourceQuestionNo == "21");
            var q22 = de7Questions.FirstOrDefault(q => q.SourceQuestionNo == "22");
            var q11 = de7Questions.FirstOrDefault(q => q.SourceQuestionNo == "11");

            if (q21 != null)
            {
                _output.WriteLine($"DEBUG Q21: Sec='{q21.SourceSectionName}', HierarchyIndex='{q21.HierarchyIndex}', Content='{q21.Content}', OptsCount={q21.Options.Count}");
                Assert.NotEqual("A. like", q21.SourceSectionName);
                Assert.NotEqual("A. like", q21.Content);
                Assert.Equal("7_0_0_7", q21.HierarchyIndex);
            }

            if (q22 != null)
            {
                _output.WriteLine($"DEBUG Q22: Sec='{q22.SourceSectionName}', HierarchyIndex='{q22.HierarchyIndex}', Content='{q22.Content}', OptsCount={q22.Options.Count}");
                Assert.NotEqual("A. like", q22.SourceSectionName);
                Assert.NotEqual("A. like", q22.Content);
                Assert.Equal("7_0_0_7", q22.HierarchyIndex);
            }

            if (q11 != null)
            {
                _output.WriteLine($"DEBUG Q11: Sec='{q11.SourceSectionName}', HierarchyIndex='{q11.HierarchyIndex}', Content='{q11.Content}'");
                Assert.NotEqual("A. like", q11.SourceSectionName);
            }
        }

    }
}
