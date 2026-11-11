using System;
using System.IO;
using System.Linq;
using UglyToad.PdfPig;
using Xunit;
using Xunit.Abstractions;

namespace Aegis.UnitTests
{
    public class Q1LettersInspectorTest
    {
        private readonly ITestOutputHelper _output;

        public Q1LettersInspectorTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void InspectQ1Letters()
        {
            string path = @"D:\Cuong\DuAn\DETHI\DeWord\DeToan.pdf";
            if (!File.Exists(path)) return;

            using var doc = PdfDocument.Open(path);
            var page1 = doc.GetPage(1);

            // Tìm các letters nằm ở vùng phương án của câu 1 (Y khoảng 400 - 500)
            var letters = page1.Letters
                .Where(l => l.Location.Y >= 420 && l.Location.Y <= 500)
                .OrderByDescending(l => l.Location.Y)
                .ThenBy(l => l.Location.X)
                .ToList();

            foreach (var l in letters)
            {
                _output.WriteLine($"Char: '{l.Value}' (U+{(int)l.Value[0]:X4}) at X={l.Location.X:F1}, Y={l.Location.Y:F1}, Size={l.PointSize:F1}, Font={l.FontName}");
            }
        }
    }
}

