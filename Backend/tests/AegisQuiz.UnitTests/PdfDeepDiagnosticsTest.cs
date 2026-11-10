using System;
using System.IO;
using System.Linq;
using UglyToad.PdfPig;
using Xunit;
using Xunit.Abstractions;

namespace AegisQuiz.UnitTests
{
    public class PdfDeepDiagnosticsTest
    {
        private readonly ITestOutputHelper _output;

        public PdfDeepDiagnosticsTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void DiagnoseImagesAndFormulasInDeToan()
        {
            string path = @"D:\Cuong\DuAn\DETHI\DeWord\DeToan.pdf";
            if (!File.Exists(path)) return;

            using var doc = PdfDocument.Open(path);
            _output.WriteLine($"Total Pages: {doc.NumberOfPages}");

            for (int p = 1; p <= doc.NumberOfPages; p++)
            {
                var page = doc.GetPage(p);
                var images = page.GetImages().ToList();
                _output.WriteLine($"\n--- PAGE {p} --- Image Count: {images.Count}");

                for (int i = 0; i < images.Count; i++)
                {
                    var img = images[i];
                    var box = img.BoundingBox;
                    _output.WriteLine($"  Image [{i}]: Size {box.Width:F1}x{box.Height:F1} at X={box.Left:F1}, Y={box.Bottom:F1} to TopY={box.Top:F1}, Bytes={img.RawBytes.Length}");
                }
            }
        }
    }
}

