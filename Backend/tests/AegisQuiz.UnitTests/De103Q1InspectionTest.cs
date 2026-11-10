using System;
using System.IO;
using System.Linq;
using Xunit;
using Xunit.Abstractions;
using UglyToad.PdfPig;
using AegisQuiz.Infrastructure.Services.Pdf;

namespace AegisQuiz.UnitTests
{
    public class De103Q1InspectionTest
    {
        private readonly ITestOutputHelper _output;

        public De103Q1InspectionTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void InspectDe103Q1AndOptions()
        {
            string pdfPath = @"D:\Cuong\DuAn\DETHI\TNPT\thuvienhoclieu.com-De-thi-TN-THPT-2026-mon-Toan-Bo-GD-ma-de-103.pdf";
            if (!File.Exists(pdfPath)) return;

            using var doc = PdfDocument.Open(pdfPath);
            var page1 = doc.GetPage(1);

            _output.WriteLine("=== RAW PAGE 1 TEXT ===");
            _output.WriteLine(page1.Text);

            _output.WriteLine("\n=== RECONSTRUCTED LINES ===");
            var reconstructed = PdfSpatialMathReconstructor.ReconstructPage(page1);
            foreach (var line in reconstructed)
            {
                _output.WriteLine($"  LINE: {line}");
            }
        }
    }
}
