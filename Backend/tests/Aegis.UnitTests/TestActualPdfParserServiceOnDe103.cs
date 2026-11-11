using System;
using System.IO;
using Xunit;
using Xunit.Abstractions;
using Aegis.Infrastructure.Services;
using Aegis.Infrastructure.Services.Pdf;
using Aegis.Infrastructure.Services.Docx;

namespace Aegis.UnitTests
{
    public class TestActualPdfParserServiceOnDe103
    {
        private readonly ITestOutputHelper _output;

        public TestActualPdfParserServiceOnDe103(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void TestParsePdfQuestionsOutput()
        {
            string pdfPath = @"D:\Cuong\DuAn\DETHI\TNPT\thuvienhoclieu.com-De-thi-TN-THPT-2026-mon-Toan-Bo-GD-ma-de-103.pdf";
            var service = new PdfParserService();
            using var stream = File.OpenRead(pdfPath);
            var questions = service.ParsePdfQuestions(stream);

            _output.WriteLine($"TOTAL QUESTIONS: {questions.Count}");
            var q6 = questions[5];
            _output.WriteLine($"--- QUESTION #6 ---");
            _output.WriteLine($"Content: {q6.Content}");
            _output.WriteLine($"Options: {string.Join(" | ", q6.Options ?? new())}");

            var q7 = questions[6];
            _output.WriteLine($"--- QUESTION #7 ---");
            _output.WriteLine($"Content: {q7.Content}");
            _output.WriteLine($"Options: {string.Join(" | ", q7.Options ?? new())}");

            var q12 = questions[11];
            _output.WriteLine($"--- QUESTION #12 ---");
            _output.WriteLine($"Content: {q12.Content}");
            _output.WriteLine($"Options: {string.Join(" | ", q12.Options ?? new())}");
        }
    }
}
