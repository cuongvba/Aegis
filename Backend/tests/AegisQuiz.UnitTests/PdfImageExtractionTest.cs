using System;
using System.IO;
using System.Linq;
using UglyToad.PdfPig;
using Xunit;
using Xunit.Abstractions;

namespace AegisQuiz.UnitTests
{
    public class PdfImageExtractionTest
    {
        private readonly ITestOutputHelper _output;

        public PdfImageExtractionTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void TestExtractPngImages()
        {
            string path = @"D:\Cuong\DuAn\DETHI\DeWord\DeToan.pdf";
            if (!File.Exists(path)) return;

            using var doc = PdfDocument.Open(path);
            var page1 = doc.GetPage(1);
            var bigImages = page1.GetImages()
                .Where(i => i.RawBytes.Length > 1000 && i.BoundingBox.Width >= 100 && i.BoundingBox.Height >= 50)
                .ToList();

            _output.WriteLine($"Found {bigImages.Count} big diagram images on Page 1");
            foreach (var img in bigImages)
            {
                bool hasPng = img.TryGetPng(out var pngBytes);
                _output.WriteLine($"Image at Y={img.BoundingBox.Bottom:F1}-{img.BoundingBox.Top:F1}, TryGetPng: {hasPng}, PngBytes: {pngBytes?.Length ?? 0}, RawBytes: {img.RawBytes.Length}");
            }
        }
    }
}

