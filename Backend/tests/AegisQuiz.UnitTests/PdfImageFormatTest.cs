using System;
using System.IO;
using System.Linq;
using UglyToad.PdfPig;
using Xunit;
using Xunit.Abstractions;

namespace AegisQuiz.UnitTests
{
    public class PdfImageFormatTest
    {
        private readonly ITestOutputHelper _output;

        public PdfImageFormatTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void TestImageMimeTypeAndDataUri()
        {
            string path = @"D:\Cuong\DuAn\DETHI\DeWord\DeToan.pdf";
            if (!File.Exists(path)) return;

            using var doc = PdfDocument.Open(path);
            var page1 = doc.GetPage(1);
            var bigImages = page1.GetImages()
                .Where(i => i.RawBytes.Length > 1000 && i.BoundingBox.Width >= 100 && i.BoundingBox.Height >= 50)
                .ToList();

            foreach (var img in bigImages)
            {
                var bytes = img.RawBytes.ToArray();
                string header = string.Join(" ", bytes.Take(4).Select(b => b.ToString("X2")));
                _output.WriteLine($"Header: {header}, Len={bytes.Length}");

                string dataUri = "";
                if (img.TryGetPng(out var pngBytes))
                {
                    dataUri = $"data:image/png;base64,{Convert.ToBase64String(pngBytes)}";
                }
                else if (bytes.Length >= 2 && bytes[0] == 0xFF && bytes[1] == 0xD8)
                {
                    dataUri = $"data:image/jpeg;base64,{Convert.ToBase64String(bytes)}";
                }
                else
                {
                    // Fallback to raw bytes
                    dataUri = $"data:image/png;base64,{Convert.ToBase64String(bytes)}";
                }

                _output.WriteLine($"DataUri prefix: {dataUri.Substring(0, Math.Min(50, dataUri.Length))}... (Total length: {dataUri.Length})");
            }
        }
    }
}

