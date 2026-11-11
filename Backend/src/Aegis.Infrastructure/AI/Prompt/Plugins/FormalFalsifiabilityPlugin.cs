using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.Interfaces;

namespace Aegis.Infrastructure.AI.Prompt.Plugins
{
    /// <summary>
    /// [Evolutionary Layer: Formal Falsifiability & Neuro-Symbolic Truth Verification — 2030 Upgrade]
    /// Bánh đà Khẳng định Chân lý: Thắt chặt kỷ luật phản nghiệm Popper kết hợp bộ phân tích
    /// ràng buộc ký hiệu/toán học tất định (Neuro-Symbolic Invariant Extractor),
    /// bảo đảm mọi kết luận được bảo chứng không có lỗ hổng ngụy biện hay sai số định lượng.
    /// </summary>
    public class FormalFalsifiabilityPlugin : ICognitiveLayerPlugin
    {
        public string LayerKey => "FORMAL_FALSIFIABILITY_VERIFICATION";
        public int LayerOrder => 80;

        private static readonly Regex SymbolicConstraintRegex = new(
            @"([a-zA-Z0-9_\\]+\s*(?:>=|<=|!=|==|=|>|<|\\ge|\\le|\\neq|\\in|\\subset|\\approx)\s*[-+]?[a-zA-Z0-9_.\\%^/]+|\b\d+(?:[.,]\d+)?\s*(?:%|ms|s|km|m|kg|V|A|Hz|USD|VND)\b|\\(?:int|sum|lim|frac|sqrt)\b)",
            RegexOptions.Compiled | RegexOptions.CultureInvariant);

        public bool IsApplicable(PromptCompositionContext context)
        {
            var phase = context.PhaseCode?.ToUpperInvariant();
            // Áp dụng cho Pha Phản biện đối kháng (Critique), Pha Đánh giá (Evaluation) và Pha Chấm điểm thẩm định (Score)
            return phase == "CRITIQUE" || phase == "SCORE_ARBITRATION" || phase == "EVALUATION";
        }

        public Task<CognitiveLayerContribution> ProcessLayerAsync(PromptCompositionContext context, CancellationToken ct = default)
        {
            bool isEn = context.Locale?.StartsWith("en", StringComparison.OrdinalIgnoreCase) == true;

            string header = isEn
                ? "=== [TRUTH VERIFICATION LAYER: FORMAL FALSIFIABILITY & NEURO-SYMBOLIC RATIONALE] ==="
                : "=== [TẦNG KHẲNG ĐỊNH CHÂN LÝ: PHẢN NGHIỆM POPPER & KIỂM CHỨNG HÌNH THỨC NEURO-SYMBOLIC] ===";

            var sb = new StringBuilder();
            if (isEn)
            {
                sb.AppendLine("1. State the exact falsifiability threshold: Under what precise experimental observation, counter-example, or mathematical singularity would your claim be falsified?");
                sb.AppendLine("2. Detect Hidden Equivocation & Scope Creep: Highlight any subtle semantic shifts or illicit extensions beyond legitimate empirical boundaries.");
                sb.AppendLine("3. Strive for Invariable Truth: Eliminate contingent speculation and converge solely upon demonstrated invariants.");
            }
            else
            {
                sb.AppendLine("1. Nêu rõ ngưỡng phản nghiệm: Mệnh đề của bạn sẽ bị chứng minh là SAI trong điều kiện quan sát thực nghiệm, phản ví dụ, hoặc điểm kỳ dị toán học chính xác nào?");
                sb.AppendLine("2. Phát hiện mập mờ ngữ nghĩa và lạm dụng ngoại suy: Vạch trần mọi sự đánh tráo khái niệm hoặc mở rộng phạm vi tùy tiện vượt qua giới hạn biên thực nghiệm.");
                sb.AppendLine("3. Hướng đến chân lý bất biến: Loại bỏ hoàn toàn suy đoán ngẫu nhĩ, chỉ kết tinh các định đề đã vượt qua mọi phép thử phản nghiệm khắt khe nhất.");
            }

            var invariants = ExtractSymbolicInvariants($"{context.TopicTitle} {context.CoreProblemStatement}");
            if (invariants.Count > 0)
            {
                string joined = string.Join(" ; ", invariants);
                if (isEn)
                {
                    sb.AppendLine($"4. [NEURO-SYMBOLIC INVARIANT CHECKLIST]: Strictly preserve and verify dimensional/mathematical consistency across detected formal constraints: [{joined}].");
                }
                else
                {
                    sb.AppendLine($"4. [DANH SÁCH KIỂM CHỨNG BẤT BIẾN NEURO-SYMBOLIC]: Bắt buộc bảo toàn thứ nguyên và kiểm chứng tính nhất quán toán học/định lượng đối với các ràng buộc trích xuất từ đề bài: [{joined}].");
                }
            }

            return Task.FromResult(new CognitiveLayerContribution
            {
                LayerKey = LayerKey,
                HeaderText = header,
                DirectiveText = sb.ToString().TrimEnd(),
                IsMandatory = true
            });
        }

        public static IReadOnlyList<string> ExtractSymbolicInvariants(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return Array.Empty<string>();

            var matches = SymbolicConstraintRegex.Matches(input);
            if (matches.Count == 0) return Array.Empty<string>();

            return matches
                .Select(m => m.Value.Trim())
                .Where(s => s.Length >= 2)
                .Distinct(StringComparer.Ordinal)
                .Take(8)
                .ToList();
        }
    }
}
