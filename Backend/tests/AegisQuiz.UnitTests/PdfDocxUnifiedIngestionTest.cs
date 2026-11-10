using System;
using System.IO;
using System.Linq;
using Xunit;
using Xunit.Abstractions;
using AegisQuiz.Infrastructure.Services.Docx;
using AegisQuiz.Infrastructure.Services.Pdf;
using UglyToad.PdfPig;

namespace AegisQuiz.UnitTests
{
    public class PdfDocxUnifiedIngestionTest
    {
        private readonly ITestOutputHelper _output;

        public PdfDocxUnifiedIngestionTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void TestPdfToDocxEngineIntegration()
        {
            string path = @"D:\Cuong\DuAn\DETHI\DeWord\DeToan.pdf";
            if (!File.Exists(path)) return;

            using var doc = PdfDocument.Open(path);
            var virtualParagraphs = PdfSpatialMathReconstructor.ReconstructDocumentToParagraphs(doc);

            _output.WriteLine($"Total Virtual Paragraphs Generated: {virtualParagraphs.Count}");

            // Chuyển giao trực tiếp cho DocxStateMachineClassifier (SSoT)
            var questions = DocxStateMachineClassifier.ParseParagraphList(virtualParagraphs);

            _output.WriteLine($"Total Questions Parsed by SSoT Engine: {questions.Count}");

            for (int i = 0; i < Math.Min(12, questions.Count); i++)
            {
                var q = questions[i];
                _output.WriteLine($"\n[Q{i + 1}] Type: {q.QuestionType}, Options: {q.Options?.Count ?? 0}, SubItems: {q.SubItems?.Count ?? 0}, HasImage: {q.Content.Contains("data:image")}");
                _output.WriteLine($"Content: {q.Content.Substring(0, Math.Min(120, q.Content.Length))}...");
                if (q.Options != null && q.Options.Count > 0)
                {
                    _output.WriteLine($"Options: {string.Join(" | ", q.Options)}");
                }
                if (q.SubItems != null && q.SubItems.Count > 0)
                {
                    _output.WriteLine($"SubItems: {string.Join(", ", q.SubItems.Select(s => $"{s.Key}) {s.Content}"))}");
                }
            }

            Assert.NotEmpty(questions);
        }
    }
}

