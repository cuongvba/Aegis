using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace Aegis.Infrastructure.Services
{
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
    }
}
