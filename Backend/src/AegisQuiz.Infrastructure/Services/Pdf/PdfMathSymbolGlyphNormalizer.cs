using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;
using AegisQuiz.Application.Interfaces;

namespace AegisQuiz.Infrastructure.Services.Pdf
{
    /// <summary>
    /// [Aegis Cognitive PDF Math Standard]
    /// Dịch vụ chuẩn hóa ký tự toán học, giải mã PUA (Private Use Area), MathType ligatures và các ký hiệu hình học từ luồng PDF.
    /// </summary>
    public class PdfMathSymbolGlyphNormalizer : IPdfMathSymbolGlyphNormalizer
    {
        private static readonly Dictionary<char, string> PuaGlyphMap = new()
        {
            { '\uF00E', " - " },
            { '\uF02D', " - " },
            { '\uF02B', " + " },
            { '\uF03D', " = " },
            { '\uF03C', " < " },
            { '\uF03E', " > " },
            { '\uF0A3', @" \le " },
            { '\uF0B3', @" \ge " },
            { '\uF0B9', @" \ne " },
            { '\uF0CE', @" \in " },
            { '\uF0CF', @" \notin " },
            { '\uF0CC', @" \subset " },
            { '\uF0C8', @" \cup " },
            { '\uF0C7', @" \cap " },
            { '\uF0D6', @" \sqrt " },
            { '\uF05E', @" \perp " },
            { '\uF0A5', @" \infty " },
            { '\uF0DE', @" \implies " },
            { '\uF0DB', @" \iff " },
            { '\uF070', @" \pi " },
            { '\uF0AE', @" \to " },
            { '\uF05B', " [" },
            { '\uF05D', "] " },
            { '\uF028', " (" },
            { '\uF029', ") " }
        };

        private static readonly Dictionary<string, string> UnicodeMathMap = new()
        {
            { "\u2212", " - " },
            { "\u2264", @" \le " },
            { "\u2265", @" \ge " },
            { "\u2260", @" \ne " },
            { "\u221A", @" \sqrt " },
            { "\u221E", @" \infty " },
            { "\u22A5", @" \perp " },
            { "\u2225", @" \parallel " },
            { "\u2208", @" \in " },
            { "\u2209", @" \notin " },
            { "\u2229", @" \cap " },
            { "\u222A", @" \cup " },
            { "\u2282", @" \subset " },
            { "\u2192", @" \to " },
            { "\u21D2", @" \implies " },
            { "\u21D4", @" \iff " },
            { "²", "$^2$" },
            { "³", "$^3$" },
            { "⁴", "$^4$" },
            { "⁵", "$^5$" },
            { "⁺", "$^+$" },
            { "⁻", "$^-$" }
        };

        public string NormalizeMathGlyphs(string text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;

            var sb = new StringBuilder();

            // 1. Giải mã PUA (Private Use Area)
            foreach (char c in text)
            {
                if (PuaGlyphMap.TryGetValue(c, out var replacement))
                {
                    sb.Append(replacement);
                }
                else
                {
                    sb.Append(c);
                }
            }

            string result = sb.ToString();

            // 2. Chuẩn hóa ký tự Unicode toán học
            foreach (var kv in UnicodeMathMap)
            {
                result = result.Replace(kv.Key, kv.Value);
            }

            // 3. Khôi phục nhãn hình học (Lăng trụ, tam giác, đáy)
            result = ReconstructGeometricPrismLabels(result);

            // 4. Khôi phục góc độ (045, 30^0)
            result = ReconstructDegreeSymbols(result);

            // 5. Khôi phục tọa độ không gian & vectơ
            result = ReconstructCoordinatesAndVectors(result);

            // 6. Dọn dẹp khoảng trắng dư thừa
            result = Regex.Replace(result, @"[ \t]+", " ");
            return result.Trim();
        }

        public string ReconstructDegreeSymbols(string text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;

            // Ví dụ: A. 045 -> A. $45^\circ$ (Trường hợp font Symbol gán số 0 cho độ)
            string patternOptionDegree = @"(?<=(?:^|\s)[A-D]\.\s*)0([1-9]\d{1,2})(?=\s|$)";
            text = Regex.Replace(text, patternOptionDegree, "$$$1^{\\circ}$$");

            // Nếu câu hỏi về tính góc và phương án chỉ là số trần (ví dụ: A. 45, B. 30, C. 90, D. 60)
            // Chuẩn hóa 30^0 -> $30^\circ$
            text = Regex.Replace(text, @"(\d+)\^0(?![0-9])", "$$$1^{\\circ}$$");
            text = Regex.Replace(text, @"(\d+)\s*°", "$$$1^{\\circ}$$");

            return text;
        }

        public string ReconstructGeometricPrismLabels(string text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;

            // 1. Khôi phục ký hiệu lăng trụ: □□□□ABCABC -> ABC.A'B'C'
            text = Regex.Replace(text, @"[□\?]{1,6}\s*ABCABC", "ABC.A'B'C'");
            text = Regex.Replace(text, @"[□\?]{1,6}\s*ABCDABCD", "ABCD.A'B'C'D'");

            // 2. Khôi phục mặt phẳng bên: ()□□ABBA -> (ABB'A')
            text = Regex.Replace(text, @"\(\)\s*[□\?]{1,4}\s*ABBA", "(ABB'A')");
            text = Regex.Replace(text, @"\(\)\s*[□\?]{1,4}\s*BCCB", "(BCC'B')");
            text = Regex.Replace(text, @"\(\)\s*[□\?]{1,4}\s*ACCA", "(ACC'A')");

            // 3. Khôi phục đoạn thẳng có đỉnh phẩy: □BC -> B'C hoặc A'C
            text = Regex.Replace(text, @"[□\?]\s*BC", "B'C");
            text = Regex.Replace(text, @"[□\?]\s*AC", "A'C");
            text = Regex.Replace(text, @"[□\?]\s*AB", "A'B");

            // 4. Khôi phục đẳng thức cạnh: 2□ ==BCaBB -> BB' = 2a hoặc BC = a
            text = Regex.Replace(text, @"2[□\?]\s*==\s*BCaBB", "BB' = 2a");
            text = Regex.Replace(text, @"==+", " = ");

            // 5. Thay thế các ô vuông rác còn lại bằng dấu phẩy đảo hoặc khoảng trắng
            text = text.Replace("□", "'").Replace("", "-");

            return text;
        }

        public string CleanPuaCharacters(string text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            var sb = new StringBuilder();
            foreach (char c in text)
            {
                // Vùng PUA: U+E000 đến U+F8FF
                if (c >= '\uE000' && c <= '\uF8FF')
                {
                    if (PuaGlyphMap.TryGetValue(c, out var rep))
                    {
                        sb.Append(rep);
                    }
                    else
                    {
                        sb.Append(' ');
                    }
                }
                else
                {
                    sb.Append(c);
                }
            }
            return sb.ToString();
        }

        private string ReconstructCoordinatesAndVectors(string text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;

            // 1. Tọa độ vectơ có dấu âm dính đuôi: ()4;2;2-- -> (4; -2; -2)
            text = Regex.Replace(text, @"\(\)\s*(\d+)\s*;\s*(\d+)\s*;\s*(\d+)\s*--", "($1; -$2; -$3)");
            text = Regex.Replace(text, @"\(\)\s*(\d+)\s*;\s*(\d+)\s*;\s*(\d+)\s*-", "($1; $2; -$3)");

            // 2. Điểm tọa độ: ()1;3;2,5;1;4AB -> A(1; 3; 2), B(5; 1; 4)
            text = Regex.Replace(
                text, 
                @"\(\)\s*(\d+;\d+;\d+)\s*,\s*(\d+;\d+;\d+)\s*([A-Z])([A-Z])", 
                "$3($1), $4($2)");

            // 3. Điểm đơn: ()3;4;3C -> C(3; 4; 3)
            text = Regex.Replace(text, @"\(\)\s*(\d+;\d+;\d+)\s*([A-Z])", "$2($1)");

            // 4. Ký hiệu vectơ: vectơ AB -> $\vec{AB}$
            text = Regex.Replace(text, @"(?i)vectơ\s+([A-Z]{1,2})\b", @"$\vec{$1}$");

            // 5. Tọa độ Oxyz: không gianOxyz -> không gian Oxyz
            text = Regex.Replace(text, @"(?i)không gian([A-Za-z]+)", "không gian $1");

            return text;
        }
    }
}

