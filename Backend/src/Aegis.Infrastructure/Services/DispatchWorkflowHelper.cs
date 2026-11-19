using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace Aegis.Infrastructure.Services
{
    public class DispatchAutopilotSuggestion
    {
        public string SuggestedDirective { get; set; } = string.Empty;
        public string SuggestedLeadAssignee { get; set; } = string.Empty;
        public string SuggestedDueDate { get; set; } = string.Empty;
        public string SuggestedReportDraft { get; set; } = string.Empty;
        public int SuggestedProgressPercent { get; set; }
        public int RecommendedStars { get; set; }
        public double PredictedSlaScore { get; set; }
        public double PredictedFinalScore { get; set; }
        public List<string> Checklist { get; set; } = new();
        public string AutomationSummary { get; set; } = string.Empty;
    }

    public static class DispatchWorkflowHelper
    {
        private static readonly Dictionary<string, HashSet<string>> AllowedTransitions = new(StringComparer.OrdinalIgnoreCase)
        {
            ["RECEIVED_DRAFT"] = new(StringComparer.OrdinalIgnoreCase) { "SUBMITTED_TRIAGE", "ASSIGNED" },
            ["SUBMITTED_TRIAGE"] = new(StringComparer.OrdinalIgnoreCase) { "ASSIGNED", "RECEIVED_DRAFT" },
            ["ASSIGNED"] = new(StringComparer.OrdinalIgnoreCase) { "IN_PROGRESS", "REPORTED_REVIEW" },
            ["IN_PROGRESS"] = new(StringComparer.OrdinalIgnoreCase) { "REPORTED_REVIEW", "EVALUATED_LOCKED" },
            ["REPORTED_REVIEW"] = new(StringComparer.OrdinalIgnoreCase) { "IN_PROGRESS", "EVALUATED_LOCKED" },
            ["EVALUATED_LOCKED"] = new(StringComparer.OrdinalIgnoreCase) { }
        };

        public static bool CanTransition(string currentStatus, string targetStatus)
        {
            if (string.Equals(currentStatus, targetStatus, StringComparison.OrdinalIgnoreCase)) return true;
            return AllowedTransitions.TryGetValue(currentStatus ?? string.Empty, out var nextSet)
                && nextSet.Contains(targetStatus);
        }

        public static (double SlaScore, double QualityScore, double ComplexityBonus, double FinalScore) ComputeCompletionScore(
            string? dueDateStr,
            DateTimeOffset completedAt,
            int qualityStars,
            string? urgency)
        {
            int clampedStars = Math.Clamp(qualityStars <= 0 ? 4 : qualityStars, 1, 5);
            double qualityScore = clampedStars * 20.0; // 20..100

            double slaScore = 100.0;
            if (!string.IsNullOrWhiteSpace(dueDateStr) && DateTimeOffset.TryParse(dueDateStr, out var due))
            {
                double lateDays = (completedAt.Date - due.Date).TotalDays;
                if (lateDays > 3) slaScore = 50.0;
                else if (lateDays > 0) slaScore = 75.0;
            }

            double complexityScore = string.Equals(urgency, "HOA_TOC", StringComparison.OrdinalIgnoreCase)
                ? 100.0
                : string.Equals(urgency, "KHAN", StringComparison.OrdinalIgnoreCase) ? 85.0 : 75.0;

            double finalScore = Math.Round((0.40 * slaScore) + (0.45 * qualityScore) + (0.15 * complexityScore), 1);
            return (slaScore, qualityScore, complexityScore, finalScore);
        }

        public static (string DispatchNumber, string Urgency, string Summary) ExtractDispatchMetadata(string rawMarkdown, string fileName)
        {
            string text = rawMarkdown ?? string.Empty;
            var numMatch = Regex.Match(text, @"\b\d{1,5}\s*/\s*[A-ZĐÂĂÊÔƠƯ0-9\-]{2,15}\b", RegexOptions.IgnoreCase);
            string dispatchNo = numMatch.Success ? numMatch.Value.Replace(" ", "") : $"CV-{DateTime.UtcNow:yyyyMMdd}";

            string urgency = Regex.IsMatch(text, @"hỏa\s*tốc|hoa\s*toc", RegexOptions.IgnoreCase)
                ? "HOA_TOC"
                : Regex.IsMatch(text, @"\bkhẩn\b|\bkhan\b", RegexOptions.IgnoreCase) ? "KHAN" : "THUONG";

            string[] lines = text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            string summary = lines.Length > 0 ? lines[0].Trim('#', ' ', '*', '>') : System.IO.Path.GetFileNameWithoutExtension(fileName);
            if (summary.Length > 180) summary = summary.Substring(0, 180) + "...";

            return (dispatchNo, urgency, summary);
        }

        public static string ComputeSmartDueDate(string? urgency, DateTimeOffset? referenceNow = null)
        {
            var now = referenceNow ?? DateTimeOffset.UtcNow;
            int days = string.Equals(urgency, "HOA_TOC", StringComparison.OrdinalIgnoreCase) ? 1
                : string.Equals(urgency, "KHAN", StringComparison.OrdinalIgnoreCase) ? 3 : 7;

            var target = now.AddDays(days);
            while (target.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                target = target.AddDays(1);
            return target.ToString("yyyy-MM-dd");
        }

        public static int RecommendQualityStars(string? dueDateStr, DateTimeOffset now, string? resultReport, int progressPercent)
        {
            bool hasRichReport = !string.IsNullOrWhiteSpace(resultReport) && resultReport.Trim().Length >= 25;
            double lateDays = 0;
            if (!string.IsNullOrWhiteSpace(dueDateStr) && DateTimeOffset.TryParse(dueDateStr, out var due))
                lateDays = (now.Date - due.Date).TotalDays;

            if (lateDays <= 0 && progressPercent >= 100 && hasRichReport) return 5;
            if (lateDays <= 2 && progressPercent >= 80) return 4;
            return 3;
        }

        public static DispatchAutopilotSuggestion BuildSmartAutopilot(
            string title,
            string contentMarkdown,
            string urgency,
            string currentStatus,
            string? existingDirective,
            string? existingAssignee,
            string? dueDate,
            int progressPercent,
            string? resultReport,
            DateTimeOffset? referenceNow = null)
        {
            var now = referenceNow ?? DateTimeOffset.UtcNow;
            string corpus = $"{title} {contentMarkdown}";
            string assignee = !string.IsNullOrWhiteSpace(existingAssignee) ? existingAssignee.Trim()
                : Regex.IsMatch(corpus, @"cntt|chuyển đổi số|phần mềm|hệ thống|dữ liệu|\bAI\b|mạng", RegexOptions.IgnoreCase) ? "Phòng CNTT & Chuyển đổi số"
                : Regex.IsMatch(corpus, @"tài chính|ngân sách|kế toán|dự toán|mua sắm|chi phí", RegexOptions.IgnoreCase) ? "Phòng Tài chính - Kế toán"
                : Regex.IsMatch(corpus, @"đào tạo|khảo thí|giảng dạy|học tập|sinh viên|học sinh", RegexOptions.IgnoreCase) ? "Phòng Đào tạo - Khảo thí"
                : Regex.IsMatch(corpus, @"nhân sự|tổ chức|hành chính|hội nghị|bổ nhiệm|khen thưởng", RegexOptions.IgnoreCase) ? "Phòng Tổ chức - Hành chính"
                : "Văn phòng Ban Giám đốc";

            string smartDue = !string.IsNullOrWhiteSpace(dueDate) ? dueDate.Trim() : ComputeSmartDueDate(urgency, now);
            string directive = !string.IsNullOrWhiteSpace(existingDirective) ? existingDirective.Trim()
                : string.Equals(urgency, "HOA_TOC", StringComparison.OrdinalIgnoreCase)
                    ? $"[HỎA TỐC] Giao {assignee} khẩn trương xử lý ngay trong ngày, báo cáo kết quả trước {smartDue}."
                : string.Equals(urgency, "KHAN", StringComparison.OrdinalIgnoreCase)
                    ? $"[KHẨN] Giao {assignee} ưu tiên nghiên cứu, tham mưu phương án hoàn thành trước {smartDue}."
                    : $"Giao {assignee} chủ trì triển khai thực hiện theo đúng quy định, hoàn thành trước {smartDue}.";

            int nextProgress = currentStatus is "REPORTED_REVIEW" or "EVALUATED_LOCKED" ? 100
                : Math.Max(progressPercent, currentStatus == "IN_PROGRESS" ? 100 : 50);

            string reportDraft = !string.IsNullOrWhiteSpace(resultReport) ? resultReport.Trim()
                : $"Đã tiếp nhận và triển khai công văn \"{title}\" theo chỉ đạo ({directive}). Kết quả: đã hoàn thành {nextProgress}% khối lượng công việc, đảm bảo đúng tiến độ và quy định hiện hành.";

            int stars = RecommendQualityStars(smartDue, now, reportDraft, nextProgress);
            var (sla, _, _, finalScore) = ComputeCompletionScore(smartDue, now, stars, urgency);

            return new DispatchAutopilotSuggestion
            {
                SuggestedDirective = directive,
                SuggestedLeadAssignee = assignee,
                SuggestedDueDate = smartDue,
                SuggestedReportDraft = reportDraft,
                SuggestedProgressPercent = nextProgress,
                RecommendedStars = stars,
                PredictedSlaScore = sla,
                PredictedFinalScore = finalScore,
                Checklist = new List<string>
                {
                    $"1. Tiếp nhận & phân tích nội dung: {title}",
                    $"2. Thực thi xử lý theo chỉ đạo ({assignee})",
                    $"3. Tổng hợp báo cáo & trình nghiệm thu trước {smartDue}"
                },
                AutomationSummary = $"AI Auto-Pilot đã tính SLA ({smartDue}), đề xuất đầu mối ({assignee}) & dự báo KPI ({finalScore}/100)."
            };
        }
    }
}
