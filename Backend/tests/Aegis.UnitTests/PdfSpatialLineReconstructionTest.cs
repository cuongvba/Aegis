using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using Xunit;
using Xunit.Abstractions;

namespace Aegis.UnitTests
{
    public class PdfSpatialLineReconstructionTest
    {
        private readonly ITestOutputHelper _output;

        public PdfSpatialLineReconstructionTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void ReconstructLinesFromLetters()
        {
            string path = @"D:\Cuong\DuAn\DETHI\DeWord\DeToan.pdf";
            if (!File.Exists(path)) return;

            using var doc = PdfDocument.Open(path);
            for (int p = 1; p <= 3; p++)
            {
                var page = doc.GetPage(p);
                var lines = ClusterLettersIntoLines(page.Letters);
                _output.WriteLine($"\n=================== PAGE {p} ===================");
                foreach (var l in lines.Take(25))
                {
                    _output.WriteLine(l);
                }
            }
        }

        public static List<string> ClusterLettersIntoLines(IEnumerable<Letter> letters)
        {
            var rawLetters = letters
                .Where(l => !string.IsNullOrEmpty(l.Value) && l.Value != "\0")
                .ToList();

            // Nhóm các chữ cái có cùng Y xấp xỉ (sai số <= 4pt cho đường cơ sở)
            var lineGroups = new List<List<Letter>>();

            // Sắp xếp Y giảm dần (từ đỉnh trang xuống đáy trang)
            var sortedLetters = rawLetters.OrderByDescending(l => l.Location.Y).ThenBy(l => l.Location.X).ToList();

            foreach (var letter in sortedLetters)
            {
                // Tìm dòng đã có mà khoảng cách Y với letter <= 4pt
                // (hoặc nếu là số mũ superscript thì Y lệch lên trên 3-7pt nhưng nằm ngay sau một chữ cái)
                var matchedGroup = lineGroups.FirstOrDefault(g => {
                    double avgY = g.Average(x => x.Location.Y);
                    return Math.Abs(avgY - letter.Location.Y) <= 4.0;
                });

                if (matchedGroup != null)
                {
                    matchedGroup.Add(letter);
                }
                else
                {
                    lineGroups.Add(new List<Letter> { letter });
                }
            }

            var result = new List<string>();

            foreach (var grp in lineGroups)
            {
                // Sắp xếp các letter trong dòng từ TRÁI sang PHẢI (X tăng dần)
                var sortedLine = grp.OrderBy(l => l.Location.X).ToList();

                var lineSb = new StringBuilder();
                double lastX = -1;
                double lastWidth = 0;
                double baselineY = sortedLine.GroupBy(l => Math.Round(l.Location.Y)).OrderByDescending(g => g.Count()).First().Key;
                double avgSize = sortedLine.Average(l => l.PointSize);

                for (int i = 0; i < sortedLine.Count; i++)
                {
                    var l = sortedLine[i];

                    // Chèn khoảng trắng nếu khoảng cách giữa 2 chữ cái > 2.5pt
                    if (lastX >= 0)
                    {
                        double gap = l.Location.X - (lastX + lastWidth);
                        if (gap >= 2.8)
                        {
                            lineSb.Append(' ');
                        }
                    }

                    // Phát hiện SỐ MŨ (Superscript): cỡ chữ nhỏ hơn và Y cao hơn baseline >= 3pt
                    bool isSuperscript = (l.PointSize < avgSize * 0.88) && (l.Location.Y > baselineY + 2.5);
                    // Phát hiện CHỈ SỐ DƯỚI (Subscript): cỡ chữ nhỏ hơn và Y thấp hơn baseline >= 2pt
                    bool isSubscript = (l.PointSize < avgSize * 0.88) && (l.Location.Y < baselineY - 2.0);

                    if (isSuperscript)
                    {
                        lineSb.Append($"^{l.Value}");
                    }
                    else if (isSubscript)
                    {
                        lineSb.Append($"_{l.Value}");
                    }
                    else
                    {
                        lineSb.Append(l.Value);
                    }

                    lastX = l.Location.X;
                    lastWidth = l.GlyphRectangle.Width > 0 ? l.GlyphRectangle.Width : (l.PointSize * 0.5);
                }

                string lineStr = lineSb.ToString().Trim();
                if (!string.IsNullOrEmpty(lineStr))
                {
                    result.Add(lineStr);
                }
            }

            return result;
        }
    }
}
