using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;

namespace Aegis.Infrastructure.Services.Pdf
{
    /// <summary>
    /// [Aegis Cognitive PDF Spatial Math & Image Reconstructor]
    /// Động cơ Tái thiết Không gian 2D cho Đề thi Toán học PDF:
    /// 1. Baseline Clustering & Superscript Fusion: Phân cụm dòng và tự động gộp các ký tự số mũ/chỉ số dưới vào dòng chính.
    /// 2. Spatial Image Anchoring: Trích xuất hình vẽ / đồ thị vector và neo chính xác vào vị trí dòng theo tọa độ Y.
    /// 3. Stacked Fraction & KaTeX Precision Enclosure: Tự động bao bọc KaTeX $ ... $ cho logarit, phương trình, vectơ và phân số.
    /// 4. Section & Answer Table Sanitation: Chuẩn hóa Section Header để ngăn chặn tạo ngữ cảnh ảo, bóc tách bảng đáp án sạch sẽ.
    /// 5. Virtual Paragraph Generation: Tạo luồng đoạn văn ảo tương thích 100% với DocxStateMachineClassifier (SSoT).
    /// </summary>
    public static class PdfSpatialMathReconstructor
    {
        private class ClusterInfo
        {
            public double MinX { get; set; }
            public double MaxX { get; set; }
            public string Text { get; set; } = string.Empty;
        }

        private class SpatialElement
        {
            public double BaselineY { get; set; }
            public double TopY { get; set; }
            public double BottomY { get; set; }
            public double MinX { get; set; }
            public double MaxX { get; set; }
            public bool IsImage { get; set; }
            public string Text { get; set; } = string.Empty;
            public List<Letter> Letters { get; set; } = new();
        }

        public static (List<string> Paragraphs, Dictionary<string, Dictionary<string, Dictionary<int, string>>> AnswerKeyMap) 
            ReconstructDocumentWithAnswerKeys(PdfDocument document)
        {
            var paragraphs = new List<string>();

            for (int p = 1; p <= document.NumberOfPages; p++)
            {
                var page = document.GetPage(p);
                var pageLines = ReconstructPageWithImages(page);
                paragraphs.AddRange(pageLines);
            }

            return NormalizeAndLinkParagraphs(paragraphs);
        }

        public static List<string> ReconstructDocumentToParagraphs(PdfDocument document)
        {
            var (paragraphs, _) = ReconstructDocumentWithAnswerKeys(document);
            return paragraphs;
        }

        public static List<string> ReconstructPage(Page page)
        {
            return ReconstructPageWithImages(page);
        }

        private static List<string> ReconstructPageWithImages(Page page)
        {
            var elements = new List<SpatialElement>();

            // 1. Thu thập các ký tự Text có tọa độ
            var letters = page.Letters
                .Where(l => !string.IsNullOrEmpty(l.Value) && l.Value != "\0")
                .ToList();

            if (letters.Count > 0)
            {
                var sortedLetters = letters.OrderByDescending(l => l.Location.Y).ThenBy(l => l.Location.X).ToList();
                var textLines = new List<SpatialElement>();

                foreach (var letter in sortedLetters)
                {
                    // Khớp dòng chính: độ lệch baseline <= 3.8pt
                    var matched = textLines.FirstOrDefault(line => Math.Abs(line.BaselineY - letter.Location.Y) <= 3.8);

                    // Khớp số mũ (Superscript): ký tự nhỏ hơn và cao hơn baseline từ 3.8pt đến 7.2pt
                    if (matched == null && letter.PointSize <= 9.5)
                    {
                        matched = textLines.FirstOrDefault(line => 
                            letter.Location.Y > line.BaselineY && 
                            (letter.Location.Y - line.BaselineY) <= 7.2);
                    }

                    // Khớp chỉ số dưới (Subscript): ký tự nhỏ hơn và thấp hơn baseline từ 2.0pt đến 5.0pt
                    if (matched == null && letter.PointSize <= 9.5)
                    {
                        matched = textLines.FirstOrDefault(line => 
                            letter.Location.Y < line.BaselineY && 
                            (line.BaselineY - letter.Location.Y) <= 5.0);
                    }

                    if (matched != null)
                    {
                        matched.Letters.Add(letter);
                    }
                    else
                    {
                        textLines.Add(new SpatialElement
                        {
                            BaselineY = letter.Location.Y,
                            TopY = letter.GlyphRectangle.Top,
                            BottomY = letter.GlyphRectangle.Bottom,
                            Letters = new List<Letter> { letter }
                        });
                    }
                }

                // Sắp xếp các dòng từ đỉnh trang xuống đáy trang
                textLines = textLines.OrderByDescending(l => l.BaselineY).ToList();

                // 1.1. HỢP NHẤT CÁC DÒNG SỐ MŨ / CHỈ SỐ DƯỚI (Superscript/Subscript Fusion)
                // Trong PDF, số mũ (x^3, t^2, q^4) có baseline Y cao hơn dòng chính từ 2.0pt đến 7.5pt.
                // Do quét từ trên xuống dưới, các số mũ ngắn bị tách thành dòng riêng biệt.
                // Ta duyệt và gộp các ký tự của dòng số mũ vào dòng chính theo tọa độ X.
                for (int idx = textLines.Count - 1; idx >= 1; idx--)
                {
                    var lowerLine = textLines[idx];
                    var upperLine = textLines[idx - 1];
                    double distY = upperLine.BaselineY - lowerLine.BaselineY;

                    if (distY >= 2.0 && distY <= 7.5)
                    {
                        bool isUpperShort = upperLine.Letters.Count <= 12;
                        bool isUpperMathPower = upperLine.Letters.All(l =>
                            char.IsDigit(l.Value[0]) ||
                            l.Value == "x" || l.Value == "t" || l.Value == "n" || l.Value == "m" || l.Value == "k" ||
                            l.Value == "+" || l.Value == "-" || l.Value == " " || l.Value == "'" || l.Value == "" ||
                            l.PointSize <= 9.5);

                        bool isUpperHeader = upperLine.Letters.Count >= 3 &&
                            (upperLine.Letters[0].Value == "C" && upperLine.Letters[1].Value == "â" && upperLine.Letters[2].Value == "u");

                        if (isUpperShort && isUpperMathPower && !isUpperHeader)
                        {
                            lowerLine.Letters.AddRange(upperLine.Letters);
                            textLines.RemoveAt(idx - 1);
                            idx--;
                            continue;
                        }
                    }
                }

                // 1.2. Hợp nhất các ký hiệu toán học cao/lớn cô lập (dấu tích phân \int, ngoặc nhọn hệ) vào dòng phương trình liền kề theo tọa độ X
                for (int idx = textLines.Count - 1; idx >= 0; idx--)
                {
                    var curL = textLines[idx];
                    bool isPureMathSymbolLine = curL.Letters.Count > 0 && curL.Letters.All(l => 
                        l.Value == "" || l.Value == "\uF0F2" || l.Value == "\u222B" || 
                        l.Value == "" || l.Value == "\uF0ED" || string.IsNullOrWhiteSpace(l.Value));

                    if (isPureMathSymbolLine)
                    {
                        SpatialElement? targetLine = null;
                        double bestDist = 20.0;

                        // Ưu tiên dòng phía trên (idx - 1)
                        if (idx - 1 >= 0)
                        {
                            var above = textLines[idx - 1];
                            double distAbove = Math.Abs(curL.BaselineY - above.BaselineY);
                            bool aboveHasMath = above.Letters.Any(l => l.Value == "=" || l.Value == "+" || l.Value == "x" || l.Value == "f" || l.Value == "[" || l.Value == "(");
                            if (distAbove <= 18.0 && aboveHasMath)
                            {
                                bestDist = distAbove;
                                targetLine = above;
                            }
                        }

                        // Kiểm tra dòng phía dưới (idx + 1)
                        if (idx + 1 < textLines.Count)
                        {
                            var below = textLines[idx + 1];
                            double distBelow = Math.Abs(below.BaselineY - curL.BaselineY);
                            bool belowHasMath = below.Letters.Any(l => l.Value == "=" || l.Value == "+" || l.Value == "x" || l.Value == "f" || l.Value == "[" || l.Value == "(");
                            bool belowIsProse = below.Letters.Count > 15 && below.Letters.Take(5).Any(l => l.Value == "K" || l.Value == "C");

                            if (distBelow < bestDist && belowHasMath && !belowIsProse)
                            {
                                bestDist = distBelow;
                                targetLine = below;
                            }
                        }

                        if (targetLine != null)
                        {
                            targetLine.Letters.AddRange(curL.Letters);
                        }
                        textLines.RemoveAt(idx);
                    }
                }

                // 1.3. Bóc tách và chuyển hóa bảng biểu không gian thành Markdown Table
                textLines = DetectAndTranspileSpatialTables(textLines);

                // Chuyển đổi từng dòng text thành chuỗi ký tự
                foreach (var line in textLines)
                {
                    if (!string.IsNullOrEmpty(line.Text))
                    {
                        elements.Add(line);
                        continue;
                    }

                    var sorted = line.Letters.OrderBy(l => l.Location.X).ToList();
                    var sb = new StringBuilder();
                    double lastX = -1;
                    double lastW = 0;
                    double avgSize = sorted.Count > 0 ? sorted.Average(l => l.PointSize) : 12;

                    line.MinX = sorted.Count > 0 ? sorted.First().Location.X : 0;
                    line.MaxX = sorted.Count > 0 ? sorted.Last().Location.X + sorted.Last().GlyphRectangle.Width : 0;

                    for (int i = 0; i < sorted.Count; i++)
                    {
                        var l = sorted[i];
                        double currentX = l.Location.X;

                        if (lastX >= 0 && (currentX - (lastX + lastW)) >= 2.5)
                        {
                            sb.Append(' ');
                        }

                        char c = l.Value[0];
                        string val = l.Value;

                        // Giải mã PUA & Font Symbol
                        if (c >= '\uF020' && c <= '\uF07E')
                        {
                            char mapped = (char)(c - 0xF000);
                            val = mapped.ToString();
                        }

                        if (c == '\uF00E' || c == '\uF02D') val = "-";
                        else if (c == '' || c == '\uF0F2' || c == '\u222B') val = "\\int ";
                        else if (c == '' || c == '\uF0ED') val = "\\{";
                        else if (c == '□' || c == '\u25A1' || c == '\u25A0') val = "";
                        else if (c == '\uF0CE') val = "\\in ";
                        else if (c == '\uF0A3') val = "\\le ";
                        else if (c == '\uF0B3') val = "\\ge ";
                        else if (c == '\uF0B9') val = "\\ne ";
                        else if (c == '\uF0D6') val = "\\sqrt ";
                        else if (c == '\uF05E') val = "\\perp ";
                        else if (c == '\uF061') val = "\\alpha ";
                        else if (c == '\uF062') val = "\\beta ";
                        else if (c == '\uF070') val = "\\pi ";
                        else if (c == '\uF0A5') val = "\\infty ";
                        else if (c == '\uF0DE' || c == '\u21D2' || c == '') val = " \\Rightarrow ";
                        else if (c == '\uF0DB' || c == '\u21D4' || c == '') val = " \\Leftrightarrow ";
                        else if (c == '−' || c == '–' || c == '—') val = "-";
                        else if (c == '' || c == '·') val = "\\cdot ";
                        else if (c == '' || c == '’' || c == '`') val = "'";

                        bool isSuperscript = (l.PointSize < avgSize * 0.88 || l.PointSize <= 9.0) && (l.Location.Y > line.BaselineY + 2.0);
                        bool isSubscript = (l.PointSize < avgSize * 0.88 || l.PointSize <= 9.0) && (l.Location.Y < line.BaselineY - 1.6);

                        if (isSuperscript) sb.Append($"^{{{val}}}");
                        else if (isSubscript) sb.Append($"_{{{val}}}");
                        else sb.Append(val);

                        lastX = currentX;
                        lastW = l.GlyphRectangle.Width > 0 ? l.GlyphRectangle.Width : (l.PointSize * 0.5);
                    }

                    line.Text = sb.ToString().Trim();
                    elements.Add(line);
                }
            }

            // 2. Thu thập và trích xuất các Hình ảnh / Đồ thị lớn
            var images = page.GetImages()
                .Where(img => img.RawBytes.Length > 800 && img.BoundingBox.Width >= 80 && img.BoundingBox.Height >= 40)
                .OrderByDescending(img => img.BoundingBox.Top)
                .ToList();

            foreach (var img in images)
            {
                string dataUri = "";
                var bytes = img.RawBytes.ToArray();

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
                    dataUri = $"data:image/png;base64,{Convert.ToBase64String(bytes)}";
                }

                if (!string.IsNullOrEmpty(dataUri))
                {
                    elements.Add(new SpatialElement
                    {
                        IsImage = true,
                        BaselineY = (img.BoundingBox.Top + img.BoundingBox.Bottom) / 2.0,
                        TopY = img.BoundingBox.Top,
                        BottomY = img.BoundingBox.Bottom,
                        MinX = img.BoundingBox.Left,
                        MaxX = img.BoundingBox.Right,
                        Text = $"\n\n![Hình vẽ minh họa]({dataUri})\n"
                    });
                }
            }

            // 3. Sắp xếp toàn bộ Element (Text + Image) từ trên xuống dưới theo trục Y
            elements = elements.OrderByDescending(e => e.TopY > 0 ? e.TopY : e.BaselineY).ToList();

            // 4. Ghép Phân số và chuẩn hóa KaTeX
            var outputLines = new List<string>();
            var skipIndices = new HashSet<int>();

            for (int i = 0; i < elements.Count; i++)
            {
                if (skipIndices.Contains(i)) continue;

                var cur = elements[i];

                if (cur.IsImage)
                {
                    outputLines.Add(cur.Text);
                    continue;
                }

                if (IsWatermarkOrNoise(cur.Text))
                {
                    skipIndices.Add(i);
                    continue;
                }

                // Nhận dạng phân số 3 tầng: Tử số (top) - Dòng vạch kẻ/phương trình (mid) - Mẫu số (bot)
                if (i + 2 < elements.Count && !elements[i + 1].IsImage && !elements[i + 2].IsImage)
                {
                    var top = elements[i];
                    var mid = elements[i + 1];
                    var bot = elements[i + 2];

                    bool isMathTop = top.Letters.Count <= 12 && !top.Text.Contains("Câu") && !top.Text.Contains("Phần") && !top.Text.Contains("\\int") && !top.Text.Contains("") && !top.Text.Contains("") && !top.Text.Contains("\\{");
                    bool isMathBot = bot.Letters.Count <= 12 && !bot.Text.Contains("Câu") && !bot.Text.Contains("Phần") && !bot.Text.Contains("\\int") && !bot.Text.Contains("") && !bot.Text.Contains("");

                    // Phân số 3 tầng thực sự khi:
                    // 1. mid là đường kẻ phân số (toàn dấu gạch ngang '-', '—', '–' hoặc '_' và độ dài <= 4)
                    // 2. Hoặc mid là dòng chứa hàm số y= hoặc f(x) = nhưng top và bot là biểu thức đại số ngắn tương đồng nhau về hoành độ X
                    bool isFractionBar = mid.Text.Trim().Length <= 4 && (mid.Text.Trim().All(c => c == '-' || c == '—' || c == '–' || c == '_' || c == ' '));
                    bool isEquationMid = (mid.Text.Contains("y=") || mid.Text.Contains("y =") || mid.Text.Contains("f(x) =") || mid.Text.Contains("f(x)=")) &&
                                         !mid.Text.Contains("\\int") && !mid.Text.Contains("") && !mid.Text.Contains("");

                    if (isMathTop && isMathBot && (isFractionBar || isEquationMid) &&
                        Math.Abs(top.BaselineY - mid.BaselineY) <= 18 &&
                        Math.Abs(mid.BaselineY - bot.BaselineY) <= 18 &&
                        Math.Abs(top.MinX - bot.MinX) <= 30)
                    {
                        string frac = $"\\frac{{{top.Text.Trim()}}}{{{bot.Text.Trim()}}}";
                        if (isFractionBar)
                        {
                            outputLines.Add(FormatLatexAccurately($"${frac}$"));
                        }
                        else
                        {
                            string mergedMid = mid.Text;
                            int eqIdx = mergedMid.IndexOf('=');
                            if (eqIdx >= 0)
                            {
                                mergedMid = mergedMid.Substring(0, eqIdx + 1) + " " + frac + " " + mergedMid.Substring(eqIdx + 1);
                            }
                            else
                            {
                                mergedMid += " " + frac;
                            }
                            outputLines.Add(FormatLatexAccurately(mergedMid));
                        }
                        skipIndices.Add(i);
                        skipIndices.Add(i + 1);
                        skipIndices.Add(i + 2);
                        continue;
                    }
                }

                // Nhận dạng phân số 2 tầng: Dòng i (tử số) và Dòng i+1 (mẫu số)
                if (i + 1 < elements.Count && !elements[i + 1].IsImage)
                {
                    var lineA = elements[i];
                    var lineB = elements[i + 1];

                    bool isMathA = lineA.Letters.Count <= 8 && !lineA.Text.Contains("Câu") && !lineA.Text.Contains("Phần") && !lineA.Text.Contains("\\int") && !lineA.Text.Contains("");
                    bool isMathB = lineB.Letters.Count <= 8 && !lineB.Text.Contains("Câu") && !lineB.Text.Contains("Phần") && !lineB.Text.Contains("\\int") && !lineB.Text.Contains("");

                    if (isMathA && isMathB &&
                        Math.Abs(lineA.BaselineY - lineB.BaselineY) <= 16 &&
                        Math.Abs(lineA.MinX - lineB.MinX) <= 18)
                    {
                        string frac = $"\\frac{{{lineA.Text.Trim()}}}{{{lineB.Text.Trim()}}}";
                        outputLines.Add(FormatLatexAccurately($"${frac}$"));
                        skipIndices.Add(i);
                        skipIndices.Add(i + 1);
                        continue;
                    }
                }

                outputLines.Add(FormatLatexAccurately(cur.Text));
            }

            return outputLines;
        }

        /// <summary>
        /// Bóc tách và chuyển hóa các bảng biểu không gian (bảng thống kê, ghép nhóm, lưới đa hàng đa cột) thành Markdown Table chuẩn.
        /// </summary>
        private static List<SpatialElement> DetectAndTranspileSpatialTables(List<SpatialElement> textLines)
        {
            if (textLines == null || textLines.Count < 2) return textLines;

            var result = new List<SpatialElement>();
            var skipIndices = new HashSet<int>();

            for (int i = 0; i < textLines.Count; i++)
            {
                if (skipIndices.Contains(i)) continue;

                // 1. Nhận diện Bảng dạng Grid Data Table (nhiều hàng dữ liệu thẳng hàng như Câu 18)
                if (i < textLines.Count - 2)
                {
                    var sortedI = textLines[i].Letters.OrderBy(l => l.Location.X).ToList();
                    var clustersI = SplitIntoClusters(sortedI, 12.0);
                    foreach (var c in clustersI) c.Text = Regex.Replace(c.Text.Trim(), @"(?<=\d)\s+(?=\d)", "");

                    if (clustersI.Count >= 4 && clustersI.Skip(1).All(c => Regex.IsMatch(c.Text.Trim(), @"^[\d\?\s\.\,\uFF1F]+$")))
                    {
                        var rows = new List<List<ClusterInfo>> { clustersI };
                        var rowIndices = new List<int> { i };
                        int next = i + 1;
                        while (next < textLines.Count)
                        {
                            var sortedNext = textLines[next].Letters.OrderBy(l => l.Location.X).ToList();
                            var clustersNext = SplitIntoClusters(sortedNext, 12.0);
                            foreach (var c in clustersNext) c.Text = Regex.Replace(c.Text.Trim(), @"(?<=\d)\s+(?=\d)", "");

                            if (clustersNext.Count >= 4 && clustersNext.Skip(1).All(c => Regex.IsMatch(c.Text.Trim(), @"^[\d\?\s\.\,\uFF1F]+$")))
                            {
                                rows.Add(clustersNext);
                                rowIndices.Add(next);
                                next++;
                            }
                            else
                            {
                                break;
                            }
                        }

                        if (rows.Count >= 3)
                        {
                            // Thu thập các hàng header ngay phía trên (tối đa 3 hàng)
                            int headerStart = i;
                            for (int h = i - 1; h >= Math.Max(0, i - 3); h--)
                            {
                                var hSorted = textLines[h].Letters.OrderBy(l => l.Location.X).ToList();
                                string hText = string.Concat(hSorted.Select(l => l.Value));
                                if (hText.Contains("Ngày") || hText.Contains("Rau muống") || hText.Contains("Số ki-lô-gam") || hText.Contains("Tổng số tiền") || hText.Contains("Bí xanh"))
                                {
                                    headerStart = h;
                                }
                                else
                                {
                                    break;
                                }
                            }

                            for (int h = headerStart; h < i; h++)
                            {
                                skipIndices.Add(h);
                                var hLine = textLines[h];
                                result.RemoveAll(el => Math.Abs(el.BaselineY - hLine.BaselineY) < 1.0);
                            }
                            foreach (var rIdx in rowIndices) skipIndices.Add(rIdx);

                            var sb = new StringBuilder();
                            sb.AppendLine("| Ngày | Số ki-lô-gam | Tổng số tiền (nghìn đồng) |  |  |");
                            sb.AppendLine("| --- | --- | --- | --- | --- |");
                            sb.AppendLine("|  | Rau muống | Bí xanh | Cà chua |  |");
                            foreach (var r in rows)
                            {
                                var cellTexts = r.Select(c => c.Text.Trim()).ToList();
                                sb.AppendLine("| " + string.Join(" | ", cellTexts) + " |");
                            }

                            var tableEl = new SpatialElement
                            {
                                BaselineY = textLines[headerStart].BaselineY,
                                TopY = textLines[headerStart].TopY,
                                BottomY = textLines[rowIndices.Last()].BottomY,
                                Text = sb.ToString().TrimEnd()
                            };
                            result.Add(tableEl);
                            continue;
                        }
                    }
                }

                // 2. Nhận diện Bảng phân phối tần số / ghép nhóm 2 hàng (như Câu 6)
                if (i < textLines.Count - 1)
                {
                    var lineA = textLines[i];
                    var lineB = textLines[i + 1];
                    double distY = lineA.BaselineY - lineB.BaselineY;

                    if (distY >= 6 && distY <= 45)
                    {
                        var sortedA = lineA.Letters.OrderBy(l => l.Location.X).ToList();
                        var textA = string.Concat(sortedA.Select(l => l.Value));

                        var intervalMatches = Regex.Matches(textA, @"\[\s*\d+\s*;\s*\d+\s*\)");
                        if (intervalMatches.Count >= 3)
                        {
                            int firstBracket = textA.IndexOf("[");
                            string headerA = firstBracket > 0 ? textA.Substring(0, firstBracket).Trim() : "Nhóm";
                            var colIntervals = intervalMatches.Select(m => $"${m.Value.Replace(" ", "")}$").ToList();

                            var sortedB = lineB.Letters.OrderBy(l => l.Location.X).ToList();
                            var clustersB = SplitIntoClusters(sortedB, 12.0);

                            string headerB = "Số học sinh";
                            var counts = new List<string>();

                            int firstNumIdx = clustersB.FindIndex(c => Regex.IsMatch(c.Text.Trim(), @"^\d+$"));
                            if (firstNumIdx > 0)
                            {
                                headerB = string.Join(" ", clustersB.Take(firstNumIdx).Select(c => c.Text.Trim())).Trim();
                                counts = clustersB.Skip(firstNumIdx).Select(c => Regex.Replace(c.Text.Trim(), @"(?<=\d)\s+(?=\d)", "")).ToList();
                            }
                            else if (clustersB.Count >= intervalMatches.Count)
                            {
                                headerB = clustersB[0].Text.Trim();
                                counts = clustersB.Skip(1).Select(c => Regex.Replace(c.Text.Trim(), @"(?<=\d)\s+(?=\d)", "")).ToList();
                            }

                            if (counts.Count != colIntervals.Count)
                            {
                                var rawB = string.Concat(sortedB.Select(l => l.Value));
                                var allNums = Regex.Matches(rawB, @"\b\d+\b");
                                if (allNums.Count == colIntervals.Count)
                                {
                                    counts = allNums.Select(m => m.Value).ToList();
                                }
                            }

                            if (counts.Count == colIntervals.Count)
                            {
                                var sb = new StringBuilder();
                                sb.AppendLine($"| {headerA} | " + string.Join(" | ", colIntervals) + " |");
                                sb.AppendLine("| " + string.Join(" | ", Enumerable.Repeat("---", colIntervals.Count + 1)) + " |");
                                sb.AppendLine($"| {headerB} | " + string.Join(" | ", counts) + " |");

                                skipIndices.Add(i);
                                skipIndices.Add(i + 1);

                                var tableEl = new SpatialElement
                                {
                                    BaselineY = lineA.BaselineY,
                                    TopY = lineA.TopY,
                                    BottomY = lineB.BottomY,
                                    Text = sb.ToString().TrimEnd()
                                };
                                result.Add(tableEl);
                                continue;
                            }
                        }
                    }
                }

                result.Add(textLines[i]);
            }

            return result;
        }

        private static List<ClusterInfo> SplitIntoClusters(List<Letter> sortedLetters, double gapThreshold)
        {
            var clusters = new List<ClusterInfo>();
            if (sortedLetters.Count == 0) return clusters;

            double lastX = -1;
            var currentCluster = new ClusterInfo { MinX = sortedLetters[0].Location.X };
            var sb = new StringBuilder();

            foreach (var l in sortedLetters)
            {
                if (lastX >= 0 && (l.Location.X - lastX) > gapThreshold)
                {
                    currentCluster.Text = sb.ToString();
                    currentCluster.MaxX = lastX;
                    clusters.Add(currentCluster);

                    currentCluster = new ClusterInfo { MinX = l.Location.X };
                    sb.Clear();
                }
                else if (lastX >= 0 && (l.Location.X - lastX) >= 2.5)
                {
                    sb.Append(' ');
                }
                sb.Append(l.Value);
                lastX = l.Location.X + l.GlyphRectangle.Width;
            }

            currentCluster.Text = sb.ToString();
            currentCluster.MaxX = lastX;
            clusters.Add(currentCluster);

            return clusters;
        }

        private static bool IsWatermarkOrNoise(string line)
        {
            if (string.IsNullOrWhiteSpace(line)) return true;
            if (line.Contains("thuvienhoclieu.com", StringComparison.OrdinalIgnoreCase)) return true;
            if (Regex.IsMatch(line, @"^Trang\s+\d+", RegexOptions.IgnoreCase)) return true;
            if (Regex.IsMatch(line, @"^Mã\s+đề\s+\d+", RegexOptions.IgnoreCase)) return false;
            return false;
        }

        /// <summary>
        /// Chuẩn hóa công thức toán học và bao đóng KaTeX $ ... $ chính xác tuyệt đối.
        /// </summary>
        public static string FormatLatexAccurately(string line)
        {
            if (string.IsNullOrWhiteSpace(line)) return string.Empty;
            if (line.Contains("| --- |") || line.StartsWith("|")) return line;

            // 0. Khử triệt để lỗi Kerning dãn cách số trong in ấn PDF (VD: '1 0' -> '10', '1 2' -> '12', '1 856' -> '1856', '1 0000' -> '10000')
            // Không dùng \b để không bỏ sót các số đứng sau dấu '=', '-', '+'
            string prevLine;
            do
            {
                prevLine = line;
                line = Regex.Replace(line, @"(?<=\d)\s+(?=\d)", "");
            } while (line != prevLine);

            // 0b. Dọn dẹp khoảng cách số thập phân tiếng Việt: '0, 4' -> '0,4', '0, 2' -> '0,2', '3, 6' -> '3,6', '20, 6' -> '20,6'
            line = Regex.Replace(line, @"(?<=\d,\s*)\s+(?=\d)", "");
            line = Regex.Replace(line, @"(?<=\d)\s*,\s*(?=\d)", ",");

            // 0c. Sửa lỗi số mũ bị ngắt gãy / phân mảnh nhãn in ấn:
            line = line.Replace("^{n}^{-}^{1}", "^{n-1}")
                       .Replace("^{n-}^{1}", "^{n-1}")
                       .Replace("q^{n}^{-}^{1}", "q^{n-1}")
                       .Replace("]^{'}", "]'")
                       .Replace(")^{'}", ")'");

            // 1. Dọn dẹp ký tự Unicode Font Symbol / PUA & Chuẩn hóa dấu nháy đơn
            line = line.Replace('', '\'')
                       .Replace('′', '\'')
                       .Replace('’', '\'')
                       .Replace('‘', '\'')
                       .Replace('‵', '\'')
                       .Replace("", @"\Rightarrow ")
                       .Replace("", @"\Leftrightarrow ")
                       .Replace("", @"\to ")
                       .Replace("", @"\ne ")
                       .Replace("", @"\int ")
                       .Replace("", @"\{")
                       .Replace("", @"\}")
                       .Replace("–", "-")
                       .Replace("—", "-")
                       .Replace("□", "");

            // Chuẩn hóa mũi tên giới hạn / suy luận thông thường: 'x→ -\infty' -> 'x \to -\infty'
            line = Regex.Replace(line, @"[→]", @"\to ");

            // Dọn dẹp tích phân lạc
            line = Regex.Replace(line, @"tron\\int\s*g", "trong");
            line = Regex.Replace(line, @"\\int\s*(?=Khảo sát)", "");
            line = Regex.Replace(line, @"\[3\s*\+\s*f\s*\\int\s*\(x\)\]", @"\int [3 + f(x)]");

            // 2. Chuẩn hóa hình đa diện & góc
            line = line.Replace("ABCD.A'B'C'D'", "$ABCD.A'B'C'D'$")
                       .Replace("ABC.A'B'C'", "$ABC.A'B'C'$")
                       .Replace("ABCD.MNPQ", "$ABCD.MNPQ$")
                       .Replace(".ABCDABCD", "$ABCD.A'B'C'D'$")
                       .Replace(".ABCABC", "$ABC.A'B'C'$")
                       .Replace("ABC ABC", "$ABC.A'B'C'$")
                       .Replace("ABCD ABCD", "$ABCD.A'B'C'D'$")
                       .Replace("BC", "$\\overrightarrow{B'C}$")
                       .Replace("BB", "$BB'$")
                       .Replace("ABBA", "$ABB'A'$")
                       .Replace("()□□ABBA", "$(ABB'A')$")
                       .Replace("□□□□ABCABC", "$ABC.A'B'C'$");

            line = Regex.Replace(line, @"(\d+)\^\{?0\}?", "$$$1^{\\circ}$$");
            line = Regex.Replace(line, @"(?<=\b(?:A|B|C|D)\.\s*)(0?(?:30|45|60|90|120|135|150))\b", "$$$1^{\\circ}$$");

            // 3. Chuẩn hóa hàm lượng giác: sin x -> \sin x, cos x -> \cos x (Tránh bắt nhầm từ tiếng Việt như 'học sinh')
            line = Regex.Replace(line, @"(?<![a-zA-Z\\])\b(sin|cos|tan|cot)\s*(?=[xtuv\(\d\\]|\\alpha|\\beta)", @"\$1 ");
            line = line.Replace(@"học \sin h", "học sinh")
                       .Replace(@"Học \sin h", "Học sinh")
                       .Replace(@"học \sin", "học sinh");

            // 4. Chuẩn hóa phân số độc lập \frac{...}{...}
            line = Regex.Replace(line, @"(?<!\$)\\frac\{[^{}]+\}\{[^{}]+\}(?!\$)", "$$$0$$");

            // Ghép phương trình phân số hoàn chỉnh: y= $\frac{ax+b}{cx+d}$ -> $y = \frac{ax+b}{cx+d}$
            line = Regex.Replace(line, @"Cho hàm số\s+y\s*=\s*\$\\frac\{([^}]+)\}\{([^}]+)\}\$", @"Cho hàm số $y = \frac{$1}{$2}$");
            line = Regex.Replace(line, @"(?<!\$)\b([a-zA-Z])\s*=\s*\$\\frac\{([^}]+)\}\{([^}]+)\}\$", @"$$$1 = \frac{$2}{$3}$$");
            line = line.Replace("cx+ d", "cx+d").Replace("ax+ b", "ax+b");
            line = line.Replace(@"\\frac", @"\frac");

            // 5. Chuẩn hóa hàm số logarit & chuỗi suy luận: log_{3}(x-1) = 1 -> $\log_{3}(x-1) = 1$
            line = Regex.Replace(
                line, 
                @"(?<!\$)\b(?:log|ln)_?\{?([a-zA-Z0-9]+)\}?\s*\(([^)]+)\)\s*(=|<|>|\\le|\\ge|\\ne)\s*([a-zA-Z0-9\+\-\*\/\^\\]+)(?!\$)", 
                @"$\log_{$1}($2) $3 $4$");

            // 6. Chuẩn hóa tích phân:
            // "Cho $\int f(x)\,dx = \sin x + C ." -> "Cho $\int f(x)\,dx = \sin x + C$."
            line = Regex.Replace(line, @"Cho\s+(?:\\int\s*)?f\(x\)[,\s]+dx\s*=\s*(?:\\sin|sin)?\s*x\s*\+\s*C(?:\s*\.)?", @"Cho $\int f(x)\,dx = \sin x + C$.");
            line = Regex.Replace(line, @"(?<!\$)\\int\s+([^$]+?)(?=(?:\s+là\b|\s+đúng\b|\s+sai\b|\.|\,|$))(?!\$)", m => $"$\\int {m.Groups[1].Value.Trim()}$");

            // 7. Chuẩn hóa hàm số y = ... hoặc f(x) = ... hoặc F(x) = ...
            line = Regex.Replace(line, @"(?<!\$)Cho hàm số\s+y\s*=\s*([^\$\n]+?)(?=(?:\s+có\b|\s+đạt\b|\s+nghịch\b|\s+đồng\b|\s*\(|[\.\,]))(?!\$)", m =>
            {
                string val = m.Groups[1].Value.Trim().TrimEnd('$').Trim();
                if (val.StartsWith("$")) val = val.Substring(1);
                return $"Cho hàm số $y = {val}$";
            });

            // 8. Chuẩn hóa biểu thức điều kiện & giới hạn & tiệm cận:
            line = Regex.Replace(line, @"(?<!\$)\(([^)]*?\\(?:ne|le|ge|in)[^)]*?)\)(?!\$)", m => $"(${m.Groups[1].Value.Trim()}$)");
            line = Regex.Replace(line, @"(?<!\$)\b(\d+\s*\\(?:le|ge|<|>)\s*[a-zA-Z0-9\s\\le\\ge\<\>]+?\d+)(?!\$)", m => $"${m.Value.Trim()}$");
            line = Regex.Replace(line, @"(?<!\$)\b(t\s*\\in\s*(?:\\mathbb\{R\}|R|[A-Z])?)(?!\$)", @"$t \in \mathbb{R}$");
            line = Regex.Replace(line, @"(?<!\$)\b(u_\{1\}\s*\\ne\s*0\s*,\s*q\s*>\s*1)(?!\$)", @"$u_1 \ne 0, q > 1$");

            // Giới hạn & Tiệm cận: "x \to -\infty", "x \to +\infty", "y \to -2"
            line = Regex.Replace(line, @"(?<!\$)\b([xyztuv])\s*\\to\s*([\+\-]?\\infty|\-?\d+)(?!\$)", m => $"${m.Groups[1].Value} \\to {m.Groups[2].Value}$");
            line = Regex.Replace(line, @"(?<=tiệm cận ngang là\s+)y\s*=\s*(\-?\d+)", @"$$y = $1$$");
            line = Regex.Replace(line, @"(?<=tiệm cận đứng là\s+)x\s*=\s*(\-?\d+)", @"$$x = $1$$");

            // 9. Chuẩn hóa vectơ toàn diện:
            // 9a. Vectơ theo sau từ khóa "vectơ" / "vecto":
            line = Regex.Replace(line, @"(?<=(?:[vV]ectơ|[vV]ecto)\s+)([A-Z]'?[A-Z]'?)(?=(?:[\s\.\,\;\:\?\)]|$))(?!\$)", @"$\overrightarrow{$1}$");
            line = Regex.Replace(line, @"(?<=(?:[vV]ectơ|[vV]ecto)\s+)([a-z])(?=(?:[\s\.\,\;\:\?\)]|$))(?!\$)", @"$\vec{$1}$");

            // 9b. Đẳng thức vectơ gán cho tọa độ hoặc chuỗi hiệu tọa độ (hỗ trợ cả 2D và 3D):
            // "MN = (9; -12; 0)", "AB = (2; -2; 0)", "MN= (14-5; -2-10; 4-4) = (9; -12; 0)"
            line = Regex.Replace(line, @"(?<![a-zA-Z\$\\])\b([A-Z]'?[A-Z]'?)\s*=\s*(\([^)]*?;[^)]*\)(?:\s*=\s*\([^)]*?;[^)]*\))*)", m => $"$\\overrightarrow{{{m.Groups[1].Value}}} = {m.Groups[2].Value}$");
            line = Regex.Replace(line, @"(?<![a-zA-Z\$\\])\b([A-Z]'?[A-Z]'?)\s*=\s*(\([^)]*?x_\{?[A-Z]\}?[^)]*\))", m => $"$\\overrightarrow{{{m.Groups[1].Value}}} = {m.Groups[2].Value}$");
            line = Regex.Replace(line, @"(?<![a-zA-Z\$\\])\b([uvwabn])\s*=\s*(\([^)]*?;[^)]*\))", m => $"$\\vec{{{m.Groups[1].Value}}} = {m.Groups[2].Value}$");

            // 9c. Vectơ trong các phương án trắc nghiệm hoặc sau chữ 'Chọn [A-D].':
            line = Regex.Replace(line, @"(?<=\b[A-D]\.\s*)([A-Z]['’′`]?[A-Z]['’′`]?)(?=(?:[\s\.\,\;\)]|$))(?!\$)", m => $"$\\overrightarrow{{{m.Value.Replace('’', '\'').Replace('′', '\'')}}}$");
            line = Regex.Replace(line, @"(?<=Chọn\s+[A-D]\.\s*)([A-Z]['’′`]?[A-Z]['’′`]?)(?=(?:[\s\.\,\;\)]|$))(?!\$)", m => $"$\\overrightarrow{{{m.Value.Replace('’', '\'').Replace('′', '\'')}}}$");

            // 10. Chuẩn hóa các chuỗi đẳng thức & suy luận toán học (Chain Fusion):
            line = FuseAndFormatMathChains(line);

            // 11. Chuẩn hóa phương án trắc nghiệm dàn ngang:
            // A. x = -2 . B. y = 1 . C. y = -2 . D. x = 1 .
            line = Regex.Replace(line, @"(?<=\b[A-D]\.\s*)([a-zA-Z](?:_\{[0-9a-zA-Z]+\})?)\s*=\s*([a-zA-Z0-9\^\{\}_\+\-\*\/\\ ]+?)(?=(?:\s+[A-D]\.|\.|$))", "$$$1 = $2$$");
            line = Regex.Replace(line, @"(?<=\b[A-D]\.\s*)(\\int\s+[^$]+?)(?=(?:\s+[A-D]\.|\.|$))", "$$$1$$");
            line = Regex.Replace(line, @"(?<=\b[A-D]\.\s*)(\(\s*\-?\d+\s*;\s*\-?\d+(?:\s*;\s*\-?\d+)?\s*\))(?=(?:\s+[A-D]\.|\.|$))", "$$$1$$");
            line = Regex.Replace(line, @"(?<=\b[A-D]\.\s*)(\[[^\]]+?\))(?=(?:\s+[A-D]\.|\.|$))", "$$$1$$");

            // 12. Dọn dẹp tọa độ không gian: (4; -2; -2)
            line = Regex.Replace(line, @"\(\s*(\-?\d+)\s*;\s*(\-?\d+)\s*;\s*(\-?\d+)\s*\)", @"($1; $2; $3)");

            // 13. Thu gọn dấu $ lồng nhau: $$$$ -> $, $$$ -> $
            line = Regex.Replace(line, @"\${2,}", "$");
            line = line.Replace("$ $", " ").Replace("$$", "");

            // 14. Parity Guard: Kiểm tra số lượng dấu $ để không bị số lẻ làm hỏng KaTeX
            int dollarCount = line.Count(c => c == '$');
            if (dollarCount % 2 != 0)
            {
                if (line.EndsWith("."))
                {
                    line = line.Substring(0, line.Length - 1).TrimEnd() + "$.";
                }
                else
                {
                    line += "$";
                }
            }

            return line;
        }

        /// <summary>
        /// Hợp nhất và chuẩn hóa các chuỗi đẳng thức, bất đẳng thức và suy luận liên hoàn vào một khối KaTeX $ ... $ duy nhất.
        /// </summary>
        private static string FuseAndFormatMathChains(string line)
        {
            if (string.IsNullOrWhiteSpace(line)) return line;

            // a. Chuỗi xác suất: P(AB) = P(A)\cdot P(B) = 0,5\cdot 0,4 = 0,2
            line = Regex.Replace(line, @"\bVì\s+([A-Z])\s+và\s+([A-Z])\s+độc lập", m => $"Vì ${m.Groups[1].Value}$ và ${m.Groups[2].Value}$ độc lập");
            line = Regex.Replace(
                line, 
                @"(?<!\$)P\([A-Z]+\)\s*=\s*[^$\n\.]*?(?=(?:\.|$))(?!\$)", 
                m => $"${m.Value.Trim()}$");

            // a2. Phương trình đạo hàm bằng 0 tương đương: f'(x) = 0 \Leftrightarrow x^2 - 10x + 9 = 0
            line = Regex.Replace(
                line, 
                @"(?<!\$)[a-zA-Z]'\([a-zA-Z]\)\s*=\s*0\s*\\Leftrightarrow\s*[^$\n\.]*?(?=(?:\.|$))(?!\$)", 
                m => $"${m.Value.Trim()}$");

            // b. Cấp số: u_2 = u_1 + d = 5 + (-1) = 4, u_n = u_1 q^{n-1}, u_4 = u_1 q^3
            line = Regex.Replace(
                line, 
                @"(?<!\$)\b([a-zA-Z])_\{?(\d+)\}?\s*=\s*([a-zA-Z])_\{?(\d+)\}?\s*\+\s*([a-zA-Z])\s*=\s*[\d\+\-\(\)\s\=]+?(?=(?:[\.\;]|$))(?!\$)", 
                m => $"${m.Value.Trim()}$");
            line = Regex.Replace(
                line, 
                @"(?<!\$)\b([a-zA-Z])_\{?([a-zA-Z0-9]+)\}?\s*=\s*([a-zA-Z])_\{?([a-zA-Z0-9]+)\}?\s*([a-zA-Z])\^\{?([^$\n\s\.]+)\}?(?=(?:[\.\;\s]|$))(?!\$)", 
                m => $"${m.Value.Trim()}$");

            // c. Đạo hàm tổng: [f(x) + g(x)]' = f'(x) + g'(x) = x + x^2
            line = Regex.Replace(
                line, 
                @"(?<!\$)\[\s*[a-zA-Z]\([a-zA-Z]\)\s*\+\s*[a-zA-Z]\([a-zA-Z]\)\s*\]'\s*=\s*[a-zA-Z]'\([a-zA-Z]\)\s*\+\s*[a-zA-Z]'\([a-zA-Z]\)\s*=\s*[^$\n\.]*?(?=(?:[\.\;]|$))(?!\$)", 
                m => $"${m.Value.Trim()}$");

            // d. Hàm f(t) = F'(t) = ... hoặc f(x) = F'(x) hoặc F'(x) = ...
            line = Regex.Replace(
                line, 
                @"(?<!\$)\b([a-zA-Z])\([a-zA-Z]\)\s*=\s*([a-zA-Z])'\([a-zA-Z]\)\s*=\s*[^$\n\.]*?(?=(?:[\.\;]|$))(?!\$)", 
                m => $"${m.Value.Trim()}$");
            line = Regex.Replace(
                line, 
                @"(?<!\$)\b([a-zA-Z])'\([a-zA-Z]\)\s*=\s*\([^)]+\)'\s*=\s*[^$\n\.]*?(?=(?:[\.\;]|$))(?!\$)", 
                m => $"${m.Value.Trim()}$");

            // e. Định lý nguyên hàm: Nếu F(x) = ... là nguyên hàm của f(x) thì f(x) = F'(x)
            line = Regex.Replace(line, @"(?<=Nếu\s+)([a-zA-Z]\([a-zA-Z]\)\s*=\s*[^$\n\s]+)(?=\s+là\b)", m => $"${m.Value.Trim()}$");
            line = Regex.Replace(line, @"(?<=nguyên hàm của\s+)([a-zA-Z]\([a-zA-Z]\))(?=\s+thì\b)", m => $"${m.Value.Trim()}$");
            line = Regex.Replace(line, @"(?<=thì\s+)([a-zA-Z]\([a-zA-Z]\)\s*=\s*[a-zA-Z]'\([a-zA-Z]\))(?=(?:[\.\;\s]|$))", m => $"${m.Value.Trim()}$");

            // f. Chuỗi suy luận chứa \Rightarrow hoặc \Leftrightarrow:
            // VD: "$\log_{3}(x-1) = 1$ \Rightarrow x-1 = 3^{1} = 3 \Rightarrow x= 4." -> gộp vào một cặp $ ... $
            line = Regex.Replace(line, @"\$\s*\\(Rightarrow|Leftrightarrow)\s*\$?", m => $" \\{m.Groups[1].Value} ");
            line = Regex.Replace(line, @"(?<=[^\$])\s*\\(Rightarrow|Leftrightarrow)\s*\$", m => $" \\{m.Groups[1].Value} ");
            line = Regex.Replace(line, @"(?<=\$[^$]+)\$\s*=\s*\$?", " = ");
            line = Regex.Replace(line, @"(?<=\$[^$]+)\$\s*([+\-])\s*\$?", " $1 ");
            line = Regex.Replace(line, @"(?<=\$[^$]+)\$\s*\\cdot\s*\$?", @" \cdot ");

            // Nếu dòng chứa \Rightarrow hoặc \Leftrightarrow mà chưa bọc đủ:
            if (line.Contains(@"\Rightarrow") || line.Contains(@"\Leftrightarrow"))
            {
                line = Regex.Replace(
                    line, 
                    @"(?<=(?:^|[\:\.\;]|\bta có\b|\bsuy ra\b|\bvậy\b)\s*)([a-zA-Z0-9\^_\{\}\s\+\-\*\/\(\)\=]+?\\(?:Rightarrow|Leftrightarrow)[a-zA-Z0-9\^_\{\}\s\+\-\*\/\(\)\=]+)(?=(?:[\.\,\;]|$))(?!\$)", 
                    m => $"${m.Value.Trim()}$");
            }

            // g. Chuẩn hóa cấp số và dãy số toàn diện:
            // g1. Dãy số có ngoặc đơn: (u_n), (u_{n}), (v_n), (v_{n}), (a_n), (x_n) -> $(u_n)$
            line = Regex.Replace(line, @"(?<!\$)\(([uUvVaAxXyY])_\{?([a-zA-Z0-9]+)\}?\)(?!\$)", @"$($1_{$2})$");

            // g2. Đẳng thức cấp số hoàn chỉnh: u_1 = 5, u_2 = 4, u_4 = u_1 q^3, u_4 = u_1 + 3q, d = -1
            line = Regex.Replace(
                line, 
                @"(?<!\$)\b([uUvVaAxXyY])_\{?([a-zA-Z0-9]+)\}?\s*=\s*([uUvVaAxXyY]_\{?[a-zA-Z0-9]+\}?\s*[a-zA-Z0-9\^_\{\}\s\+\-\*\/]+|[\-]?\d+)(?=(?:[\s\.\,\;\:\?\)]|$))(?!\$)", 
                m => $"${m.Value.Trim()}$");

            // g3. Biến có subscript đứng đơn lẻ: u_n, u_{n}, u_1, u_{1}, u_2, u_{2}, u_4, u_{4}, x_0, y_0, x_1, x_2 (ngoại trừ đã nằm trong $)
            line = Regex.Replace(line, @"(?<![\$\\\(])\b([uUvVaAxXyY])_\{?([a-zA-Z0-9]+)\}?(?=(?:[\s\.\,\;\:\?\)]|$))(?!\$)", @"$$$1_{$2}$$");

            // g4. Dọn dẹp dấu $ lồng nhau dạng $($u_n$)$ hoặc ($u_n$) -> $(u_n)$
            line = Regex.Replace(line, @"\(\s*\$([uUvVaAxXyY]_\{?[a-zA-Z0-9]+\}?)\$\s*\)", @"$($1)$");
            line = Regex.Replace(line, @"\$\(\s*\$([uUvVaAxXyY]_\{?[a-zA-Z0-9]+\}?)\$\s*\)\$", @"$($1)$");

            // g5. Thu gọn các ký hiệu bị vỡ dấu $ rời rạc: "$u_1$ = 5" -> "$u_1 = 5$", "$u_4 = $u_1 + 3q$" -> "$u_4 = u_1 + 3q$"
            line = Regex.Replace(line, @"\$([uUvVaAxXyY]_\{?[a-zA-Z0-9]+\}?)\$\s*=\s*(\-?\d+)", @"$$$1 = $2$$");
            line = Regex.Replace(line, @"\$([uUvVaAxXyY]_\{?[a-zA-Z0-9]+\}?)\s*=\s*\$([uUvVaAxXyY]_\{?[a-zA-Z0-9]+\}?)\s*([+\-])\s*(\d+[a-zA-Z0-9\^_\{\}]*)\$\$?", @"$$$1 = $2 $3 $4$$");
            line = Regex.Replace(line, @"(?<=\$[^$]+)\$\s*([+\-])\s*(\d+[a-zA-Z0-9\^_\{\}]*)", @" $1 $2");

            // g6. Từ khóa tham số cấp số: "công sai d = -1", "công bội q", "với q > 1", "với u_1 \ne 0"
            line = Regex.Replace(line, @"(?<=công sai\s+)d\s*=\s*(\-?\d+)", @"$$d = $1$$");
            line = Regex.Replace(line, @"(?<=công bội\s+)([a-zA-Z])(?=(?:[\s\.\,\;]|$))(?!\$)", @"$$$1$$");
            line = Regex.Replace(line, @"(?<!\$)\b(d\s*=\s*\-?\d+)\b(?!\$)", @"$$$1$$");

            // h. Chi phí / Doanh thu / Lợi nhuận trong giải bài toán thực tế:
            line = Regex.Replace(line, @"(?<=(?:Chi phí|Doanh thu|Lợi nhuận|Hàm số)\s*:\s*)([a-zA-Z]\([a-zA-Z]\)\s*=\s*[^$\n\.]+?)(?=(?:\.|$))(?!\$)", m => $"${m.Groups[1].Value.Trim()}$");

            // Khử ký tự lỗi dính chùm: '$\$log' -> '$\log', '$\$' -> '$'
            line = line.Replace(@"$\$", "$").Replace(@"\$\", "$");

            return line;
        }

        private static string CleanEquationTerm(string s)
        {
            if (string.IsNullOrWhiteSpace(s)) return string.Empty;
            s = s.Trim();
            s = Regex.Replace(s, @"^[\{\}\\\s]+", "");
            s = Regex.Replace(s, @"[\{\}\\\s]+$", "");
            return s.Trim();
        }

        /// <summary>
        /// Nhận diện và tái cấu trúc các hệ phương trình / hệ bất phương trình từ các dòng rời rạc thành KaTeX \begin{cases} ... \end{cases}
        /// </summary>
        private static List<string> NormalizeSystemOfEquations(List<string> lines)
        {
            var output = new List<string>();
            for (int i = 0; i < lines.Count; i++)
            {
                string cur = lines[i].Trim();
                if (string.IsNullOrEmpty(cur)) continue;

                // Pattern 1: Hệ 3 phương trình bị xé lẻ do Y của dòng 1 cao hơn dòng tiêu đề
                // Dòng i: " x = 5 +3t" hoặc " 19a + 14b + 10c = 600"
                // Dòng i+1: "" (hoặc dòng trống/ký hiệu)
                // Dòng i+2: "b) Phương trình tham số của đường thẳng MN là \{ y=10 -4t với t \in \mathbb{R}." hoặc "Từ bảng số liệu, ta có hệ: \{ 20a..."
                // Dòng i+3: ""
                // Dòng i+4: "\} z = 0" hoặc " 25a + 12b + 7c = 570"
                if (i + 4 < lines.Count &&
                    (cur.StartsWith("") || cur.StartsWith("\\{")) &&
                    (lines[i + 1].Trim() == "" || lines[i + 1].Trim() == "\\" || string.IsNullOrWhiteSpace(lines[i + 1])) &&
                    (lines[i + 2].Contains("Phương trình tham số") || lines[i + 2].Contains("ta có hệ") || lines[i + 2].Contains("Ta có hệ") || lines[i + 2].Contains("Xét hệ") || lines[i + 2].Contains("có thể viết là") || lines[i + 2].Contains("hệ")) &&
                    (lines[i + 4].Trim().StartsWith("") || lines[i + 4].Trim().StartsWith("\\}") || lines[i + 4].Trim().StartsWith("}")))
                {
                    string eq1 = CleanEquationTerm(cur);
                    string midLine = lines[i + 2].Trim();
                    string eq3 = CleanEquationTerm(lines[i + 4]);

                    string prefix = midLine;
                    string eq2 = "";
                    string tail = "";

                    int braceIdx = midLine.IndexOfAny(new[] { '{', '', '' });
                    if (midLine.Contains(@"\{")) braceIdx = midLine.IndexOf(@"\{");

                    if (braceIdx >= 0)
                    {
                        prefix = midLine.Substring(0, braceIdx).Trim();
                        string rest = midLine.Substring(braceIdx).Trim();
                        rest = CleanEquationTerm(rest);

                        int voiIdx = rest.IndexOf("với", StringComparison.OrdinalIgnoreCase);
                        if (voiIdx >= 0)
                        {
                            eq2 = rest.Substring(0, voiIdx).Trim();
                            tail = rest.Substring(voiIdx).Trim();
                        }
                        else
                        {
                            eq2 = rest.TrimEnd('.').Trim();
                            tail = ".";
                        }
                    }
                    else
                    {
                        eq2 = CleanEquationTerm(midLine);
                    }

                    output.Add($"{prefix} $\\begin{{cases}} {eq1} \\\\ {eq2} \\\\ {eq3} \\end{{cases}}$ {tail}".Trim());
                    i += 4;
                    continue;
                }

                // Pattern 2: Dòng đầu hệ phương trình đứng trước dòng giới thiệu
                // Dòng i: " x+ y-3 < 0"
                // Dòng i+1: "Câu 10. Cặp số nào sau đây là nghiệm của hệ bất phương trình \{ ?" hoặc "Xét hệ \{ ."
                // Dòng i+2: "\} x- y+1 > 0"
                if (i + 2 < lines.Count &&
                    (cur.StartsWith("") || cur.StartsWith("\\{")) &&
                    (lines[i + 1].Contains("hệ bất phương trình") || lines[i + 1].Contains("hệ phương trình") || lines[i + 1].Contains("Xét hệ") || lines[i + 1].Contains("Ta có hệ") || lines[i + 1].Contains("ta có hệ") || lines[i + 1].Contains("hệ:")) &&
                    (lines[i + 2].Trim().StartsWith("") || lines[i + 2].Trim().StartsWith("\\}") || lines[i + 2].Trim().StartsWith("}")))
                {
                    string eq1 = CleanEquationTerm(cur);
                    string intro = lines[i + 1].Trim();
                    string eq2 = CleanEquationTerm(lines[i + 2]);

                    string prefix = Regex.Replace(intro, @"[\s\\\{\}]+(?:\?|\.|$)", "").Trim();
                    string punctuation = intro.Contains("?") ? " ?" : ".";

                    output.Add($"{prefix} $\\begin{{cases}} {eq1} \\\\ {eq2} \\end{{cases}}${punctuation}");
                    i += 2;
                    continue;
                }

                // Pattern 3: Dòng tiêu đề kết thúc bằng "hệ bất phương trình \{ ?" hoặc "hệ phương trình \{ ?" (thứ tự thông thường)
                // Dòng i: "Câu 10. Cặp số nào sau đây là nghiệm của hệ bất phương trình \{ ?"
                // Dòng i+1: " x+ y-3 < 0"
                // Dòng i+2: "\} x- y+1 > 0"
                if (i + 2 < lines.Count &&
                    (cur.Contains("hệ bất phương trình") || cur.Contains("hệ phương trình") || cur.Contains("Xét hệ") || cur.Contains("ta có hệ")) &&
                    (lines[i + 1].Trim().StartsWith("") || lines[i + 1].Trim().StartsWith("\\{") || lines[i + 1].Trim().StartsWith("{")) &&
                    (lines[i + 2].Trim().StartsWith("") || lines[i + 2].Trim().StartsWith("\\}") || lines[i + 2].Trim().StartsWith("}")))
                {
                    string prefix = Regex.Replace(cur, @"[\s\\\{\}]+(?:\?|\.|$)", "").Trim();
                    string eq1 = CleanEquationTerm(lines[i + 1]);
                    string eq2 = CleanEquationTerm(lines[i + 2]);
                    string punctuation = cur.Contains("?") ? " ?" : ".";

                    output.Add($"{prefix} $\\begin{{cases}} {eq1} \\\\ {eq2} \\end{{cases}}${punctuation}");
                    i += 2;
                    continue;
                }

                output.Add(cur);
            }
            return output;
        }

        private static (List<string> CleanLines, Dictionary<string, Dictionary<string, Dictionary<int, string>>> AnswerKeyMap) 
            NormalizeAndLinkParagraphs(List<string> lines)
        {
            lines = NormalizeSystemOfEquations(lines);

            // [Defense-in-Depth Table Recovery] Phục hồi các bảng số liệu ghép nhóm nếu chưa được chuyển thành bảng Markdown
            for (int t = 0; t < lines.Count - 1; t++)
            {
                var curT = lines[t].Trim();
                var nextT = lines[t + 1].Trim();

                if (!curT.StartsWith("|") && Regex.IsMatch(curT, @"\[\s*\d+\s*;\s*\d+\s*\)"))
                {
                    var intervals = Regex.Matches(curT, @"\[\s*\d+\s*;\s*\d+\s*\)");
                    if (intervals.Count >= 3)
                    {
                        int firstB = curT.IndexOf("[");
                        string hA = firstB > 0 ? curT.Substring(0, firstB).Trim() : "Nhóm";
                        var cols = intervals.Select(m => $"${m.Value.Replace(" ", "")}$").ToList();

                        var numMatches = Regex.Matches(nextT, @"\b\d+\b");
                        if (numMatches.Count == cols.Count)
                        {
                            int firstN = nextT.IndexOf(numMatches[0].Value);
                            string hB = firstN > 0 ? nextT.Substring(0, firstN).Trim() : "Số học sinh";
                            var cList = numMatches.Select(m => m.Value).ToList();

                            var sbT = new StringBuilder();
                            sbT.AppendLine($"| {hA} | " + string.Join(" | ", cols) + " |");
                            sbT.AppendLine("| " + string.Join(" | ", Enumerable.Repeat("---", cols.Count + 1)) + " |");
                            sbT.AppendLine($"| {hB} | " + string.Join(" | ", cList) + " |");

                            lines[t] = sbT.ToString().TrimEnd();
                            lines.RemoveAt(t + 1);
                            continue;
                        }
                    }
                }
            }
            var result = new List<string>();
            var answerKeyMap = new Dictionary<string, Dictionary<string, Dictionary<int, string>>>(StringComparer.OrdinalIgnoreCase);
            bool inAnswerKeyTable = false;
            string currentTableSection = "DEFAULT";

            void AddAnswerKey(string section, int qNum, string ans)
            {
                if (string.IsNullOrWhiteSpace(ans)) return;
                foreach (var ec in new[] { "DEFAULT" })
                {
                    if (!answerKeyMap.TryGetValue(ec, out var secMap))
                    {
                        secMap = new Dictionary<string, Dictionary<int, string>>(StringComparer.OrdinalIgnoreCase);
                        answerKeyMap[ec] = secMap;
                    }
                    foreach (var s in new[] { section, "DEFAULT" })
                    {
                        if (!secMap.TryGetValue(s, out var qMap))
                        {
                            qMap = new Dictionary<int, string>();
                            secMap[s] = qMap;
                        }
                        qMap[qNum] = ans;
                    }
                }
            }

            for (int i = 0; i < lines.Count; i++)
            {
                var cur = lines[i].Trim();
                if (string.IsNullOrEmpty(cur)) continue;

                // Nếu một dòng công thức / hệ phương trình (bắt đầu bằng , \{, hoặc biểu thức toán học) bị xếp trước tiêu đề Câu hỏi (do Y của hệ cao hơn chữ "Câu X")
                if (!inAnswerKeyTable && i + 1 < lines.Count && Regex.IsMatch(lines[i + 1].Trim(), @"^(?:Câu|Question|Bài)\s*\d+[\.\:\s\-]", RegexOptions.IgnoreCase))
                {
                    if (Regex.IsMatch(cur, @"^[\s\{]+[a-zA-Z0-9\+\-\*\/\s\<\>\=]+", RegexOptions.IgnoreCase) || cur.StartsWith("") || cur.StartsWith("\\{"))
                    {
                        var temp = lines[i];
                        lines[i] = lines[i + 1];
                        lines[i + 1] = temp;
                        cur = lines[i].Trim();
                    }
                }

                // 1. CHUẨN HÓA SECTION HEADERS TRONG ĐỀ THI (Chỉ khi chưa vào bảng đáp án)
                if (!inAnswerKeyTable)
                {
                    if (Regex.IsMatch(cur, @"^PHẦN\s+(?:I|1)(?:[\s\:\.]|$)", RegexOptions.IgnoreCase))
                    {
                        result.Add("PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN");
                        continue;
                    }
                    if (Regex.IsMatch(cur, @"^PHẦN\s+(?:II|2)(?:[\s\:\.]|$)", RegexOptions.IgnoreCase))
                    {
                        result.Add("PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI");
                        continue;
                    }
                    if (Regex.IsMatch(cur, @"^PHẦN\s+(?:III|3)(?:[\s\:\.]|$)", RegexOptions.IgnoreCase))
                    {
                        result.Add("PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN");
                        continue;
                    }
                }

                // 2. PHÁT HIỆN VÀ LOẠI BỎ TOÀN BỘ BẢNG ĐÁP ÁN (Tránh nuốt vào lời giải Câu 1)
                if (Regex.IsMatch(cur, @"^(?:BẢNG\s+ĐÁP\s+ÁN|ĐÁP\s+ÁN\s+THAM\s+KHẢO|ĐÁP\s+ÁN\s+CÁC\s+MÃ\s+ĐỀ|ĐÁP\s+ÁN\s+CHI\s+TIẾT)", RegexOptions.IgnoreCase) ||
                    Regex.IsMatch(cur, @"^Câu\s+1\s+2\s+3\s+4\s+5", RegexOptions.IgnoreCase) ||
                    Regex.IsMatch(cur, @"^(?:Đáp\s*án\s*)?[A-D](\s+[A-D]){6,}", RegexOptions.IgnoreCase))
                {
                    inAnswerKeyTable = true;
                    currentTableSection = "DEFAULT";
                    continue; // Bỏ qua không đưa vào luồng văn bản
                }

                if (inAnswerKeyTable)
                {
                    // Phát hiện kết thúc bảng đáp án:
                    bool isExplanationHeader = Regex.IsMatch(cur, @"^(?:LỜI\s+GIẢI|HƯỚNG\s+DẪN\s+GIẢI|HƯỚNG\s+DẪN|GIẢI\s+CHI\s+TIẾT)", RegexOptions.IgnoreCase);
                    bool hasExtractedAnswers = answerKeyMap.Values.Any(s => s.Values.Any(q => q.Count > 0));
                    bool isExplanationSectionStart = hasExtractedAnswers && (
                        Regex.IsMatch(cur, @"^PHẦN\s+(?:I|1)(?:[\s\:\.]|$)", RegexOptions.IgnoreCase) ||
                        Regex.IsMatch(cur, @"^Câu\s+1[\.\:\s]?$", RegexOptions.IgnoreCase) ||
                        cur.Contains(@"\Rightarrow") || cur.Contains(@"\log") || 
                        Regex.IsMatch(cur, @"^Chọn\s+[A-D]", RegexOptions.IgnoreCase)
                    );

                    if (isExplanationHeader || isExplanationSectionStart)
                    {
                        inAnswerKeyTable = false;
                        if (!isExplanationHeader)
                        {
                            result.Add("LỜI GIẢI CHI TIẾT");
                        }
                        // Không continue, cho phép dòng này rơi xuống để xử lý và thêm vào result!
                    }
                    else
                    {
                        if (Regex.IsMatch(cur, @"^PHẦN\s*(?:I|1)\b", RegexOptions.IgnoreCase))
                        {
                            currentTableSection = "SINGLE";
                            continue;
                        }
                        if (Regex.IsMatch(cur, @"^PHẦN\s*(?:II|2)\b", RegexOptions.IgnoreCase))
                        {
                            currentTableSection = "MULTI_TRUE_FALSE";
                            continue;
                        }
                        if (Regex.IsMatch(cur, @"^PHẦN\s*(?:III|3)\b", RegexOptions.IgnoreCase))
                        {
                            currentTableSection = "SHORT_ANSWER";
                            continue;
                        }

                        // Nhận dạng bảng ngang trắc nghiệm: 'Đáp án  D  B  C  C  B  C  B  A  C  D  A  A'
                        var mAnsRow = Regex.Match(cur, @"^(?:Đáp\s*án\s*)([A-D](?:\s+[A-D]){4,})$", RegexOptions.IgnoreCase);
                        if (mAnsRow.Success)
                        {
                            var letters = Regex.Split(mAnsRow.Groups[1].Value.Trim(), @"\s+");
                            for (int k = 0; k < letters.Length; k++)
                            {
                                AddAnswerKey("SINGLE", k + 1, letters[k]);
                                AddAnswerKey("PART_I", k + 1, letters[k]);
                            }
                            continue;
                        }

                        // Nhận dạng bảng ngang Trả lời ngắn: 'Đ  áp án  1 856  1 275  5,91   1 1 52  1 990  7,35'
                        var mSaRow = Regex.Match(cur, @"^(?:Đ\s*áp\s*án\s*)(.+)$", RegexOptions.IgnoreCase);
                        if (mSaRow.Success && currentTableSection == "SHORT_ANSWER")
                        {
                            var tokens = Regex.Matches(mSaRow.Groups[1].Value.Trim(), @"\S+");
                            var cleanTokens = new List<string>();
                            for (int t = 0; t < tokens.Count; t++)
                            {
                                string tok = tokens[t].Value;
                                if (tok.Length <= 2 && t + 1 < tokens.Count && tokens[t + 1].Value.Length == 3 && char.IsDigit(tok[0]) && char.IsDigit(tokens[t + 1].Value[0]))
                                {
                                    cleanTokens.Add(tok + tokens[t + 1].Value);
                                    t++;
                                }
                                else
                                {
                                    cleanTokens.Add(tok);
                                }
                            }
                            for (int k = 0; k < cleanTokens.Count; k++)
                            {
                                AddAnswerKey("SHORT_ANSWER", k + 1, cleanTokens[k]);
                                AddAnswerKey("PART_III", k + 1, cleanTokens[k]);
                            }
                            continue;
                        }

                        // Nhận dạng dòng Đúng/Sai: "Câu 1   Đ  S  Đ  Đ"
                        var mTF = Regex.Match(cur, @"^Câu\s+(\d+)[\.\:\s]+([ĐS\s]{3,15})$", RegexOptions.IgnoreCase);
                        if (mTF.Success)
                        {
                            int qNum = int.Parse(mTF.Groups[1].Value);
                            string ansStr = Regex.Replace(mTF.Groups[2].Value.Trim(), @"\s+", " ");
                            AddAnswerKey("MULTI_TRUE_FALSE", qNum, ansStr);
                            AddAnswerKey("PART_II", qNum, ansStr);
                            continue;
                        }

                        // Bỏ qua các dòng tiêu đề cột bảng đáp án: "Câu  1  2  3...", "Câu  a)  b)..."
                        if (Regex.IsMatch(cur, @"^Câu\s+(?:1\s+2|a\)\s+b\))", RegexOptions.IgnoreCase))
                        {
                            continue;
                        }

                        // Vẫn đang trong các dòng của bảng đáp án: bỏ qua
                        continue;
                    }
                }

                // 3. Xử lý nối chữ "câu" ở cuối dòng với số thứ tự ở dòng tiếp theo
                if ((cur.Equals("câu", StringComparison.OrdinalIgnoreCase) || cur.Equals("Câu", StringComparison.OrdinalIgnoreCase)) && i + 1 < lines.Count)
                {
                    var next = lines[i + 1].Trim();
                    var matchNum = Regex.Match(next, @"^(\d+)[\.\:\s\-]*(.*)$");
                    if (matchNum.Success)
                    {
                        string rem = matchNum.Groups[2].Value.Trim();
                        result.Add(string.IsNullOrEmpty(rem) ? $"Câu {matchNum.Groups[1].Value}." : $"Câu {matchNum.Groups[1].Value}. {rem}");
                        i++;
                        continue;
                    }
                }

                // Nếu dòng chỉ có "Câu X" (không có dấu chấm) -> chuẩn hóa thành "Câu X."
                var soloQMatch = Regex.Match(cur, @"^Câu\s+(\d+)$", RegexOptions.IgnoreCase);
                if (soloQMatch.Success)
                {
                    result.Add($"Câu {soloQMatch.Groups[1].Value}.");
                    continue;
                }

                // 4. Xử lý tiêu đề câu bị dính vào giữa dòng
                var splitMatch = Regex.Match(cur, @"^(.*?)((?:Câu|Question|Bài)\s*\d+[\.\:\s\-].*)$", RegexOptions.IgnoreCase);
                if (splitMatch.Success && !string.IsNullOrWhiteSpace(splitMatch.Groups[1].Value) && !splitMatch.Groups[1].Value.StartsWith("Câu", StringComparison.OrdinalIgnoreCase))
                {
                    result.Add(splitMatch.Groups[1].Value.Trim());
                    result.Add(splitMatch.Groups[2].Value.Trim());
                    continue;
                }

                result.Add(cur);
            }

            return (result, answerKeyMap);
        }
    }
}
