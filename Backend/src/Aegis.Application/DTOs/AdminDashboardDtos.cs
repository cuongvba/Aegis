using System;
using System.Collections.Generic;

namespace Aegis.Application.DTOs
{
    /// <summary>
    /// [Enterprise Sovereign Telemetry] Dữ liệu giám sát toàn cảnh hệ thống thời gian thực cho Admin.
    /// </summary>
    public class AdminDashboardTelemetryDto
    {
        public int TotalLearners { get; set; }
        public int NewLearnersThisMonth { get; set; }
        public int ActiveQuestions { get; set; }
        public int NewQuestionsThisMonth { get; set; }
        public int TotalNotebooks { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public string MonthlyRevenueFormatted { get; set; } = "0 đ";
        public int ActiveExamSessions { get; set; }
        public int TotalAttempts { get; set; }
        public int TotalTenants { get; set; }
        public long MemoryUsageMb { get; set; }
        public double CacheHitRatioPercent { get; set; } = 99.4;
        public string ServerTimeUtc { get; set; } = string.Empty;
        public List<AdminActivityItemDto> RecentActivities { get; set; } = new();
        public List<AdminDailyTrendDto> DailyTrends { get; set; } = new();
        public List<AdminRevenueDistributionDto> RevenueDistributions { get; set; } = new();
    }

    public class AdminActivityItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string User { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string TimeAgo { get; set; } = string.Empty;
        public DateTime TimestampUtc { get; set; }
        public string Detail { get; set; } = string.Empty;
        public string Category { get; set; } = "SYSTEM"; // PAYMENT, EXAM, NOTEBOOK, USER
    }

    public class AdminDailyTrendDto
    {
        public string Date { get; set; } = string.Empty;
        public int Attempts { get; set; }
        public int QuestionsAdded { get; set; }
    }

    public class AdminRevenueDistributionDto
    {
        public string Provider { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public int Count { get; set; }
        public double Percentage { get; set; }
    }
}

