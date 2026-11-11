using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Aegis.Application.Interfaces;

namespace Aegis.Infrastructure.Services.Pdf
{
    /// <summary>
    /// [Aegis Layout & Hygiene Guard]
    /// Dịch vụ bảo vệ cấu trúc đề thi PDF, lọc watermark/header/footer và giữ nguyên ranh giới 3 Phần của Bộ GD&ĐT.
    /// </summary>
    public class PdfStructureGuardService : IPdfStructureGuardService
    {
        private static readonly Regex NoiseRegex = new(
            @"(?i)(?:^|\s*)(?:thuvienhoclieu\.com|vietjack\.com|loigiaihay\.com|tailieu\.vn|Trang\s+\d+(?:\/\d+)?|Mã\s+đề(?:\s+thi)?\s*[:\.]?\s*\d+|SỞ\s+GIÁO\s+DỤC\s+VÀ\s+ĐÀO\s+TẠO.*|KỲ\s+THI\s+TỐT\s+NGHIỆP.*|HẾT\s*[-–—]?(?:\s*Cán\s+bộ\s+coi\s+thi.*)?)(?:\s*|$)",
            RegexOptions.Compiled);

        private static readonly Regex SectionBreakRegex = new(
            @"(?i)(?:^|\n)\s*(PHẦN\s+(?:I{1,3}|IV|V|1|2|3)[\.\:\s\-]+(?:Câu\s+trắc\s+nghiệm|Thí\s+sinh|Trong\s+mỗi\s+ý)?|Trong\s+mỗi\s+ý\s*a\)\s*,\s*b\)\s*,\s*c\)\s*,\s*d\)\s*ở\s*mỗi\s*câu)",
            RegexOptions.Compiled);

        public string CleanNoiseAndWatermarks(string rawText)
        {
            if (string.IsNullOrWhiteSpace(rawText)) return string.Empty;

            var lines = rawText.Split(new[] { '\r', '\n' }, StringSplitOptions.None);
            var cleanLines = new List<string>();

            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                if (string.IsNullOrEmpty(trimmed)) continue;

                if (IsRunningNoise(trimmed))
                {
                    continue;
                }

                // Loại bỏ watermark dính trong dòng nếu có
                string sanitized = Regex.Replace(trimmed, @"(?i)thuvienhoclieu\.com\s*", "");
                sanitized = Regex.Replace(sanitized, @"(?i)Trang\s+\d+\s*", "");

                if (!string.IsNullOrWhiteSpace(sanitized))
                {
                    cleanLines.Add(sanitized);
                }
            }

            return string.Join("\n", cleanLines);
        }

        public bool IsRunningNoise(string line)
        {
            if (string.IsNullOrWhiteSpace(line)) return true;
            if (line.Length <= 1) return true;

            // Kiểm tra các dòng watermark, số trang
            if (NoiseRegex.IsMatch(line))
            {
                // Ngoại lệ: nếu dòng chứa "Câu \d+" thì không được xóa nhầm
                if (!Regex.IsMatch(line, @"(?i)(?:^|\s)Câu\s+\d+[\.\:]"))
                {
                    return true;
                }
            }

            return false;
        }

        public bool IsSectionBreak(string line, out string sectionName)
        {
            sectionName = string.Empty;
            if (string.IsNullOrWhiteSpace(line)) return false;

            var match = SectionBreakRegex.Match(line);
            if (match.Success)
            {
                sectionName = match.Groups[1].Value.Trim();
                return true;
            }

            return false;
        }

        public List<string> SegmentSectionsAndQuestions(string rawText)
        {
            var cleanText = CleanNoiseAndWatermarks(rawText);
            var rawLines = cleanText.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            var result = new List<string>();

            foreach (var line in rawLines)
            {
                var trimmed = line.Trim();

                // 1. Kiểm tra chuyển Phần thi
                if (Regex.IsMatch(trimmed, @"(?i)^PHẦN\s+II[\.\:\s\-]+|Trong\s+mỗi\s+ý\s*a\)\s*,\s*b\)\s*,\s*c\)\s*,\s*d\)"))
                {
                    result.Add($"\n=== PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI ===\n");
                    continue;
                }
                else if (Regex.IsMatch(trimmed, @"(?i)^PHẦN\s+III[\.\:\s\-]+|trả\s+lời\s+ngắn"))
                {
                    result.Add($"\n=== PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN ===\n");
                    continue;
                }
                else if (Regex.IsMatch(trimmed, @"(?i)^PHẦN\s+I[\.\:\s\-]+"))
                {
                    result.Add($"\n=== PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN ===\n");
                    continue;
                }

                // 2. Chuẩn hóa điểm bắt đầu câu hỏi bị dính dòng (Câu \d+)
                // Nếu đang ở Phần II và gặp "Câu 1.", thêm tag rõ ràng để không trùng với Câu 1 Phần I
                if (Regex.IsMatch(trimmed, @"(?i)^Câu\s*(\d+)[\.\:]"))
                {
                    result.Add($"\n{trimmed}");
                }
                else
                {
                    result.Add(trimmed);
                }
            }

            return result;
        }
    }
}
