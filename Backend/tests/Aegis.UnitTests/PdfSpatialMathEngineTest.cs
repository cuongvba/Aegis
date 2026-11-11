using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using Xunit;
using Xunit.Abstractions;

namespace Aegis.UnitTests
{
    public class PdfSpatialMathEngineTest
    {
        private readonly ITestOutputHelper _output;

        public PdfSpatialMathEngineTest(ITestOutputHelper output)
        {
            _output = output;
        }

        public class SpatialWordSegment
        {
            public string Text { get; set; } = string.Empty;
            public double LeftX { get; set; }
            public double RightX { get; set; }
            public double BaselineY { get; set; }
            public double TopY { get; set; }
            public double BottomY { get; set; }
        }

        public class SpatialLine
        {
            public double BaselineY { get; set; }
            public List<Letter> Letters { get; set; } = new();
            public string RawText { get; set; } = string.Empty;
            public double MinX => Letters.Count > 0 ? Letters.Min(l => l.Location.X) : 0;
            public double MaxX => Letters.Count > 0 ? Letters.Max(l => l.Location.X + l.GlyphRectangle.Width) : 0;
        }

        [Fact]
        public void TestReconstructMathAndLatexOnDeToan()
        {
            string path = @"D:\Cuong\DuAn\DETHI\DeWord\DeToan.pdf";
            if (!File.Exists(path)) return;

            using var doc = PdfDocument.Open(path);
            for (int p = 1; p <= 3; p++)
            {
                var page = doc.GetPage(p);
                var reconstructed = ReconstructPageWithFractionsAndLatex(page);
                _output.WriteLine($"\n=================== RECONSTRUCTED PAGE {p} ===================");
                foreach (var line in reconstructed.Take(30))
                {
                    _output.WriteLine(line);
                }
            }
        }

        public static List<string> ReconstructPageWithFractionsAndLatex(Page page)
        {
            var letters = page.Letters
                .Where(l => !string.IsNullOrEmpty(l.Value) && l.Value != "\0")
                .ToList();

            // 1. Nhóm letters theo dòng Y
            var sortedLetters = letters.OrderByDescending(l => l.Location.Y).ThenBy(l => l.Location.X).ToList();
            var lineList = new List<SpatialLine>();

            foreach (var letter in sortedLetters)
            {
                var matched = lineList.FirstOrDefault(line => Math.Abs(line.BaselineY - letter.Location.Y) <= 3.8);
                if (matched != null)
                {
                    matched.Letters.Add(letter);
                }
                else
                {
                    lineList.Add(new SpatialLine
                    {
                        BaselineY = letter.Location.Y,
                        Letters = new List<Letter> { letter }
                    });
                }
            }

            // Sắp xếp các dòng theo Y giảm dần
            lineList = lineList.OrderByDescending(l => l.BaselineY).ToList();

            // 2. Chuyển đổi từng dòng thành chuỗi kèm nhận diện số mũ, chỉ số dưới, PUA
            foreach (var line in lineList)
            {
                var sorted = line.Letters.OrderBy(l => l.Location.X).ToList();
                var sb = new StringBuilder();
                double lastX = -1;
                double lastW = 0;
                double avgSize = sorted.Average(l => l.PointSize);

                for (int i = 0; i < sorted.Count; i++)
                {
                    var l = sorted[i];
                    if (lastX >= 0 && (l.Location.X - (lastX + lastW)) >= 2.6)
                    {
                        sb.Append(' ');
                    }

                    char c = l.Value[0];
                    string val = l.Value;

                    // Dịch PUA
                    if (c == '\uF00E' || c == '\uF02D') val = "-";
                    else if (c == '\uF0CE') val = "\\in ";
                    else if (c == '\uF0A3') val = "\\le ";
                    else if (c == '\uF0B3') val = "\\ge ";
                    else if (c == '\uF0B9') val = "\\ne ";
                    else if (c == '\uF0D6') val = "\\sqrt ";
                    else if (c == '\uF05E') val = "\\perp ";
                    else if (c == '−') val = "-";
                    else if (c == '' || c == '·') val = "\\cdot ";
                    else if (c == '') val = "'";

                    bool isSuperscript = (l.PointSize < avgSize * 0.88) && (l.Location.Y > line.BaselineY + 2.4);
                    bool isSubscript = (l.PointSize < avgSize * 0.88) && (l.Location.Y < line.BaselineY - 1.8);

                    if (isSuperscript) sb.Append($"^{{{val}}}");
                    else if (isSubscript) sb.Append($"_{{{val}}}");
                    else sb.Append(val);

                    lastX = l.Location.X;
                    lastW = l.GlyphRectangle.Width > 0 ? l.GlyphRectangle.Width : (l.PointSize * 0.5);
                }

                line.RawText = sb.ToString().Trim();
            }

            // 3. Ghép Phân số (Fractions) giữa các dòng chồng lên nhau (Stacked Lines)
            var mergedLines = new List<string>();
            var skipLineIndices = new HashSet<int>();

            for (int i = 0; i < lineList.Count; i++)
            {
                if (skipLineIndices.Contains(i)) continue;

                var curLine = lineList[i];

                // Kiểm tra xem dòng hiện tại có phải là tử số hoặc phương trình chính không
                // Nếu dòng i+1 là phương trình có dấu '=' và dòng i là tử số, hoặc dòng i là tử số, i+1 là mẫu số
                // Kiểm tra trường hợp:
                // Line i:   Tử số (ví dụ: "2x-4" hoặc "ax^{2}+bx+c")
                // Line i+1: Phương trình chính (ví dụ: "Câu 4... y=  có phương trình...")
                // Line i+2: Mẫu số (ví dụ: "x-1")
                if (i + 2 < lineList.Count)
                {
                    var top = lineList[i];
                    var mid = lineList[i + 1];
                    var bot = lineList[i + 2];

                    // Điều kiện: top ngắn, bot ngắn, nằm trong khoảng X của mid và mid có dấu '='
                    if (top.Letters.Count < 20 && bot.Letters.Count < 20 &&
                        Math.Abs(top.BaselineY - mid.BaselineY) <= 18 &&
                        Math.Abs(mid.BaselineY - bot.BaselineY) <= 18 &&
                        Math.Abs(top.MinX - bot.MinX) <= 40 &&
                        (mid.RawText.Contains("=") || mid.RawText.Contains("+") || mid.RawText.Contains("-")))
                    {
                        // Ghép phân số: \frac{top}{bot}
                        string frac = $"\\frac{{{top.RawText}}}{{{bot.RawText}}}";
                        string mergedMid = mid.RawText;

                        // Chèn phân số vào vị trí dấu '=' gần nhất
                        int eqIdx = mergedMid.IndexOf('=');
                        if (eqIdx >= 0)
                        {
                            mergedMid = mergedMid.Substring(0, eqIdx + 1) + " " + frac + " " + mergedMid.Substring(eqIdx + 1);
                        }
                        else
                        {
                            mergedMid += " " + frac;
                        }

                        mergedLines.Add(FormatLatexInLine(mergedMid));
                        skipLineIndices.Add(i);
                        skipLineIndices.Add(i + 1);
                        skipLineIndices.Add(i + 2);
                        continue;
                    }
                }

                // Kiểm tra trường hợp phân số 2 dòng: Line i là tử, Line i+1 là mẫu (ví dụ ở các phương án A, B, C, D)
                if (i + 1 < lineList.Count)
                {
                    var lineA = lineList[i];
                    var lineB = lineList[i + 1];

                    if (lineA.Letters.Count <= 8 && lineB.Letters.Count <= 8 &&
                        Math.Abs(lineA.BaselineY - lineB.BaselineY) <= 16 &&
                        Math.Abs(lineA.MinX - lineB.MinX) <= 15)
                    {
                        string frac = $"\\frac{{{lineA.RawText}}}{{{lineB.RawText}}}";
                        mergedLines.Add(FormatLatexInLine(frac));
                        skipLineIndices.Add(i);
                        skipLineIndices.Add(i + 1);
                        continue;
                    }
                }

                mergedLines.Add(FormatLatexInLine(curLine.RawText));
            }

            return mergedLines;
        }

        private static string FormatLatexInLine(string line)
        {
            if (string.IsNullOrWhiteSpace(line)) return string.Empty;

            // Bọc công thức hàm số dạng y = ...
            line = Regex.Replace(line, @"(?<=(?:^|\s))y\s*=\s*([a-zA-Z0-9\^\{\}\+\-\*\/\\]+)", "$$y = $1$$");

            // Chuẩn hóa độ góc: 45^0 -> 45^\circ
            line = Regex.Replace(line, @"(\d+)\^\{?0\}?", "$$$1^{\\circ}$$");

            // Chuẩn hóa lăng trụ: ABC.A'B'C'
            line = line.Replace("ABC ABC", "$ABC.A'B'C'$")
                       .Replace("ABCD ABCD", "$ABCD.A'B'C'D'$")
                       .Replace("BC", "$B'C$")
                       .Replace("BB", "$BB'$")
                       .Replace("ABBA", "$ABB'A'$");

            return line;
        }
    }
}

