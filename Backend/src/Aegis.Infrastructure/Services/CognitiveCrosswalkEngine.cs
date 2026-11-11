using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Aegis.Application.DTOs;

namespace Aegis.Infrastructure.Services
{
    /// <summary>
    /// [SSoT & Global Sovereignty] Động cơ Ánh xạ Đa Chuẩn Khảo thí Quốc tế (Cognitive Crosswalk Engine).
    /// Chuẩn hóa và chuyển đổi tương đương giữa Khung Khảo thí GDPT 2018 (Việt Nam) <-> Bloom's Taxonomy Revised <-> Webb's DOK <-> QTI 3.0.
    /// </summary>
    public static class CognitiveCrosswalkEngine
    {
        /// <summary>
        /// Ánh xạ từ độ khó số (1..4 hoặc 1..6) sang Ma trận Khảo thí Toàn cầu.
        /// </summary>
        public static CognitiveCrosswalkDto MapFromDifficulty(int difficulty)
        {
            return difficulty switch
            {
                1 => new CognitiveCrosswalkDto
                {
                    BloomLevel = 1,
                    BloomCode = "REMEMBER",
                    BloomName = "Nhớ / Remember",
                    WebbDOKLevel = 1,
                    WebbDOKCode = "DOK_1",
                    WebbDOKName = "DOK 1 - Nhận biết / Recall",
                    QtiCategory = "Recall",
                    StandardFramework = "BLOOM_REVISED_2001",
                    LocalDifficultyLevel = "Mức 1 (Nhận biết)"
                },
                2 => new CognitiveCrosswalkDto
                {
                    BloomLevel = 2,
                    BloomCode = "UNDERSTAND",
                    BloomName = "Hiểu / Understand",
                    WebbDOKLevel = 2,
                    WebbDOKCode = "DOK_2",
                    WebbDOKName = "DOK 2 - Thông hiểu kỹ năng / Skills & Concepts",
                    QtiCategory = "Comprehension",
                    StandardFramework = "BLOOM_REVISED_2001",
                    LocalDifficultyLevel = "Mức 2 (Thông hiểu)"
                },
                3 => new CognitiveCrosswalkDto
                {
                    BloomLevel = 3,
                    BloomCode = "APPLY",
                    BloomName = "Vận dụng / Apply",
                    WebbDOKLevel = 3,
                    WebbDOKCode = "DOK_3",
                    WebbDOKName = "DOK 3 - Tư duy chiến lược / Strategic Thinking",
                    QtiCategory = "Application",
                    StandardFramework = "BLOOM_REVISED_2001",
                    LocalDifficultyLevel = "Mức 3 (Vận dụng)"
                },
                4 => new CognitiveCrosswalkDto
                {
                    BloomLevel = 5,
                    BloomCode = "EVALUATE",
                    BloomName = "Vận dụng cao / Evaluate & Create",
                    WebbDOKLevel = 4,
                    WebbDOKCode = "DOK_4",
                    WebbDOKName = "DOK 4 - Tư duy mở rộng / Extended Thinking",
                    QtiCategory = "ExtendedReasoning",
                    StandardFramework = "BLOOM_REVISED_2001",
                    LocalDifficultyLevel = "Mức 4 (Vận dụng cao)"
                },
                5 => new CognitiveCrosswalkDto
                {
                    BloomLevel = 5,
                    BloomCode = "EVALUATE",
                    BloomName = "Đánh giá / Evaluate",
                    WebbDOKLevel = 4,
                    WebbDOKCode = "DOK_4",
                    WebbDOKName = "DOK 4 - Extended Thinking",
                    QtiCategory = "Evaluation",
                    StandardFramework = "BLOOM_REVISED_2001",
                    LocalDifficultyLevel = "Mức 5 (Đánh giá)"
                },
                6 => new CognitiveCrosswalkDto
                {
                    BloomLevel = 6,
                    BloomCode = "CREATE",
                    BloomName = "Sáng tạo / Create",
                    WebbDOKLevel = 4,
                    WebbDOKCode = "DOK_4",
                    WebbDOKName = "DOK 4 - Extended Thinking",
                    QtiCategory = "Creation",
                    StandardFramework = "BLOOM_REVISED_2001",
                    LocalDifficultyLevel = "Mức 6 (Sáng tạo)"
                },
                _ => MapFromDifficulty(2) // Default level 2 (Understand)
            };
        }

        /// <summary>
        /// Ánh xạ từ Bloom Code sang Ma trận Khảo thí Toàn cầu.
        /// </summary>
        public static CognitiveCrosswalkDto MapFromBloomCode(string? bloomCode)
        {
            if (string.IsNullOrWhiteSpace(bloomCode)) return MapFromDifficulty(2);

            var code = bloomCode.Trim().ToUpperInvariant();
            return code switch
            {
                "REMEMBER" or "NHAN_BIET" or "LEVEL_1" or "1" => MapFromDifficulty(1),
                "UNDERSTAND" or "THONG_HIEU" or "LEVEL_2" or "2" => MapFromDifficulty(2),
                "APPLY" or "VAN_DUNG" or "LEVEL_3" or "3" => MapFromDifficulty(3),
                "ANALYZE" or "PHAN_TICH" or "LEVEL_4" or "4" => new CognitiveCrosswalkDto
                {
                    BloomLevel = 4,
                    BloomCode = "ANALYZE",
                    BloomName = "Phân tích / Analyze",
                    WebbDOKLevel = 3,
                    WebbDOKCode = "DOK_3",
                    WebbDOKName = "DOK 3 - Strategic Thinking",
                    QtiCategory = "Analysis",
                    StandardFramework = "BLOOM_REVISED_2001",
                    LocalDifficultyLevel = "Mức 3+"
                },
                "EVALUATE" or "DANH_GIA" or "LEVEL_5" or "5" => MapFromDifficulty(5),
                "CREATE" or "SANG_TAO" or "VAN_DUNG_CAO" or "LEVEL_6" or "6" => MapFromDifficulty(6),
                _ => MapFromDifficulty(2)
            };
        }

        /// <summary>
        /// Suy luận bậc nhận thức dựa trên văn cảnh câu hỏi (Cognitive Cues & Action Verbs).
        /// </summary>
        public static CognitiveCrosswalkDto InferFromQuestionContent(string? content, int fallbackDifficulty = 2)
        {
            if (string.IsNullOrWhiteSpace(content)) return MapFromDifficulty(fallbackDifficulty);

            var lower = content.ToLowerInvariant();

            // Cues for Bloom 1 / DOK 1 (Nhận biết / Remember - Ưu tiên nhận diện các yêu cầu nêu, định nghĩa, công thức)
            if (Regex.IsMatch(lower, @"\b(?:phát\s*biểu|nêu|định\s*nghĩa|công\s*thức\s*(?:tính|nào)?|đâu\s*là|kí\s*hiệu|state|define|which\s*of\s*the\s*following|identify|what\s*is)\b"))
            {
                return MapFromDifficulty(1);
            }

            // Cues for Bloom 5-6 / DOK 4 (Vận dụng cao / Create / Evaluate)
            if (Regex.IsMatch(lower, @"\b(?:thiết\s*kế|tối\s*ưu|chứng\s*minh\s*rằng|đánh\s*giá|biện\s*luận|tổng\s*hợp|sáng\s*tạo|design|synthesize|evaluate|optimize|justify)\b"))
            {
                return MapFromDifficulty(4);
            }

            // Cues for Bloom 3-4 / DOK 3 (Vận dụng / Apply / Analyze)
            if (Regex.IsMatch(lower, @"\b(?:tính|giải|áp\s*dụng|tìm\s*giá\s*trị|xác\s*định|phân\s*tích|so\s*sánh|calculate|solve|determine|apply|analyze|compare)\b"))
            {
                return MapFromDifficulty(3);
            }

            return MapFromDifficulty(fallbackDifficulty);
        }
    }
}
