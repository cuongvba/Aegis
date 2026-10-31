using System;
using System.IO;
using System.Text.RegularExpressions;
using AegisQuiz.Infrastructure.Services;
using AegisQuiz.Infrastructure.Services.Docx;
using Xunit;
using Xunit.Abstractions;

namespace AegisQuiz.UnitTests
{
    public class HierarchyDe103Tests
    {
        private readonly ITestOutputHelper _output;

        public HierarchyDe103Tests(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void TestParseDe103Docx()
        {
            var filePath = @"D:\Cuong\DuAn\DETHI\TNPT\thuvienhoclieu.com-De-thi-TN-THPT-2026-mon-Toan-Bo-GD-ma-de-103.docx";
            if (!File.Exists(filePath))
            {
                _output.WriteLine($"File not found: {filePath}");
                return;
            }

            var service = new DocxParserService();
            using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);

            using var archive = new System.IO.Compression.ZipArchive(fs, System.IO.Compression.ZipArchiveMode.Read, leaveOpen: true);
            var entry = archive.GetEntry("word/document.xml");
            var doc = System.Xml.Linq.XDocument.Load(entry.Open());
            var headers = DocxParserService.FastScanDocumentHeader(doc, 35);
            _output.WriteLine($"FastScanDocumentHeader count: {headers.Count}");
            foreach (var h in headers)
            {
                _output.WriteLine($"  HDR: '{h}'");
            }
            var profile = DynamicQuestionIngestionEngine.Instance.ProfileHeader(headers.Take(35));
            _output.WriteLine($"ProfileHeader: DetectedSubject={profile.DetectedSubject}, DetectedExamCode={profile.DetectedExamCode}, Duration={profile.DurationSeconds}");

            fs.Position = 0;
            var results = service.ParseDocxFile(fs);

            _output.WriteLine($"Total parsed questions: {results.Count}");

            var p1 = results.Where(q => q.HierarchyIndex.Contains("_1_0_0") || q.QuestionType == "SINGLE").ToList();
            var p2 = results.Where(q => q.HierarchyIndex.Contains("_2_0_0") || q.QuestionType == "TRUE_FALSE").ToList();
            var p3 = results.Where(q => q.HierarchyIndex.Contains("_3_0_0") || q.QuestionType == "SHORT_ANSWER").ToList();

            _output.WriteLine($"Phần I count: {p1.Count}");
            foreach (var q in p1)
            {
                _output.WriteLine($"  Q{q.SourceQuestionNo} | H={q.HierarchyIndex} | Type={q.QuestionType} | Ans={q.SuggestedAnswer}");
            }

            _output.WriteLine($"Phần II count: {p2.Count}");
            foreach (var q in p2)
            {
                _output.WriteLine($"  Q{q.SourceQuestionNo} | H={q.HierarchyIndex} | Type={q.QuestionType} | Ans={q.SuggestedAnswer} | Sub={q.SubItems?.Count}");
            }

            _output.WriteLine($"Phần III count: {p3.Count}");
            foreach (var q in p3)
            {
                _output.WriteLine($"  Q{q.SourceQuestionNo} | H={q.HierarchyIndex} | Type={q.QuestionType} | Ans={q.SuggestedAnswer} | ExplLen={q.AiExplanation?.Length}");
            }

            // Assertions
            Assert.Equal(22, results.Count);
            Assert.Equal(12, p1.Count);
            Assert.Equal(4, p2.Count);
            Assert.Equal(6, p3.Count);

            foreach (var q in p1)
            {
                Assert.Equal("103_1_0_0", q.HierarchyIndex);
            }
            foreach (var q in p2)
            {
                Assert.Equal("103_2_0_0", q.HierarchyIndex);
            }
            foreach (var q in p3)
            {
                Assert.Equal("103_3_0_0", q.HierarchyIndex);
            }
        }

        [Fact]
        public void TestParseDe0323Docx()
        {
            var filePath = @"D:\Cuong\DuAn\DETHI\TNPT\thuvienhoclieu.com-De-thi-TN-THPT-2026-mon-Hoa-Bo-GD-ma-de-0323.docx";
            if (!File.Exists(filePath))
            {
                _output.WriteLine($"File not found: {filePath}");
                return;
            }

            var service = new DocxParserService();
            using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);

            using var archive = new System.IO.Compression.ZipArchive(fs, System.IO.Compression.ZipArchiveMode.Read, leaveOpen: true);
            var entry = archive.GetEntry("word/document.xml");
            var doc = System.Xml.Linq.XDocument.Load(entry.Open());
            var headers = DocxParserService.FastScanDocumentHeader(doc, 35);
            _output.WriteLine($"FastScanDocumentHeader count: {headers.Count}");
            foreach (var h in headers)
            {
                _output.WriteLine($"  HDR: '{h}'");
            }
            var profile = DynamicQuestionIngestionEngine.Instance.ProfileHeader(headers.Take(35));
            _output.WriteLine($"ProfileHeader: DetectedSubject={profile.DetectedSubject}, DetectedExamCode={profile.DetectedExamCode}, Duration={profile.DurationSeconds}");

            fs.Position = 0;
            var results = service.ParseDocxFile(fs);

            _output.WriteLine($"Total parsed questions: {results.Count}");
            foreach (var q in results)
            {
                _output.WriteLine($"Q{q.SourceQuestionNo}: H={q.HierarchyIndex}, FullIndex={q.FullQuestionIndex}, Exam={q.SourceExamName}, Type={q.QuestionType}");
            }

            Assert.Equal(28, results.Count);
            var p1 = results.Where(q => q.HierarchyIndex.StartsWith("323_1_")).ToList();
            var p2 = results.Where(q => q.HierarchyIndex.StartsWith("323_2_")).ToList();
            var p3 = results.Where(q => q.HierarchyIndex.StartsWith("323_3_")).ToList();

            Assert.Equal(18, p1.Count);
            Assert.Equal(4, p2.Count);
            Assert.Equal(6, p3.Count);

            foreach (var q in p1)
            {
                Assert.StartsWith("323_1_", q.HierarchyIndex);
                Assert.StartsWith("323_1_", q.FullQuestionIndex);
                Assert.EndsWith($"_{q.SourceQuestionNo}", q.FullQuestionIndex);
                Assert.Equal("DE_0323", q.SourceExamName);
            }
            foreach (var q in p2)
            {
                Assert.Equal("323_2_0_0", q.HierarchyIndex);
                Assert.Equal($"323_2_0_0_{q.SourceQuestionNo}", q.FullQuestionIndex);
                Assert.Equal("DE_0323", q.SourceExamName);
            }
            foreach (var q in p3)
            {
                Assert.Equal("323_3_0_0", q.HierarchyIndex);
                Assert.Equal($"323_3_0_0_{q.SourceQuestionNo}", q.FullQuestionIndex);
                Assert.Equal("DE_0323", q.SourceExamName);
            }
        }

        [Theory]
        [InlineData("thuvienhoclieu.com-De-thi-TN-THPT-2026-mon-Hoa-Bo-GD-ma-de-0323.docx", "DE_0323")]
        [InlineData("thuvienhoclieu.com-De-thi-TN-THPT-2026-mon-Toan-Bo-GD-ma-de-103.docx", "DE_103")]
        [InlineData("De_thi_thu_tot_nghiep_ma_de_01.docx", "DE_01")]
        [InlineData("Exam_Test_Code_A12.docx", "DE_A12")]
        public void TestExtractExamCodeFromFileName(string fileName, string expected)
        {
            var cig = DynamicQuestionIngestionEngine.Instance;
            bool ok = cig.TryExtractExamCodeFromFileName(fileName, out var code);
            Assert.True(ok);
            Assert.Equal(expected, code);
        }
    }
}
