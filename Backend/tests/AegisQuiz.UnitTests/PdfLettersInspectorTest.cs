using System;
using System.IO;
using System.Linq;
using UglyToad.PdfPig;
using Xunit;
using Xunit.Abstractions;

namespace AegisQuiz.UnitTests
{
    public class PdfLettersInspectorTest
    {
        private readonly ITestOutputHelper _output;

        public PdfLettersInspectorTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void InspectPageLetters()
        {
            string path = @"D:\Cuong\DuAn\DETHI\DeWord\DeToan.pdf";
            if (!File.Exists(path)) return;

            using var doc = PdfDocument.Open(path);
            var page = doc.GetPage(1);

            // Tìm các letters của Câu 1 options: A. 362=−+yxx
            _output.WriteLine("--- WORDS AROUND CAU 1 ---");
            var allWords = page.GetWords().ToList();
            int cau1Idx = allWords.FindIndex(w => w.Text.Equals("Câu", StringComparison.OrdinalIgnoreCase));
            if (cau1Idx >= 0)
            {
                for (int i = cau1Idx; i < Math.Min(cau1Idx + 40, allWords.Count); i++)
                {
                    var w = allWords[i];
                    _output.WriteLine($"Word #{i}: '{w.Text}' X=[{w.BoundingBox.Left:F1}, {w.BoundingBox.Right:F1}], Y=[{w.BoundingBox.Bottom:F1}, {w.BoundingBox.Top:F1}]");
                }
            }

            _output.WriteLine("\n--- LETTERS AROUND CAU 4 ---");
            // Tìm các letters có X, Y ở khu vực Câu 4
            var cau4Word = allWords.FirstOrDefault(w => w.Text.Contains("tiệm cận") || w.Text.Contains("Câu 4"));
            if (cau4Word != null)
            {
                double targetY = cau4Word.BoundingBox.Bottom;
                // Lấy tất cả letters trong khoảng Y = targetY +/- 30
                var cau4Letters = page.Letters
                    .Where(l => Math.Abs(l.Location.Y - targetY) < 30)
                    .OrderByDescending(l => l.Location.Y) // Nhóm theo Y
                    .ThenBy(l => l.Location.X)
                    .ToList();

                foreach (var l in cau4Letters)
                {
                    _output.WriteLine($"Letter: '{l.Value}' Font: '{l.FontName}' Size: {l.PointSize:F1} X={l.Location.X:F1}, Y={l.Location.Y:F1}");
                }
            }

            _output.WriteLine("\n--- INDIVIDUAL LETTERS IN OPTION A ---");
            // Lọc các letter ở khu vực dòng Option A của Câu 1
            var optAWords = page.GetWords().FirstOrDefault(w => w.Text.Contains("362") || w.Text.Contains("yxx"));
            if (optAWords != null)
            {
                double targetY = optAWords.BoundingBox.Bottom;
                var letters = page.Letters
                    .Where(l => Math.Abs(l.Location.Y - targetY) < 15 && l.Location.X >= optAWords.BoundingBox.Left - 50 && l.Location.X <= optAWords.BoundingBox.Right + 50)
                    .OrderBy(l => l.Location.X) // SẮP XẾP THEO TỌA ĐỘ X TỪ TRÁI SANG PHẢI!
                    .ToList();

                foreach (var l in letters)
                {
                    _output.WriteLine($"Letter: '{l.Value}' Font: {l.FontName} Size: {l.PointSize:F1} at X={l.Location.X:F1}, Y={l.Location.Y:F1}");
                }

                string sortedByX = string.Join("", letters.Select(l => l.Value));
                _output.WriteLine($"\n--> SORTED BY X (LEFT TO RIGHT): '{sortedByX}'");
            }
        }
    }
}
