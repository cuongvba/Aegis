using System;
using System.Collections.Generic;

namespace AegisQuiz.Application.DTOs
{
    public class SniffTaxonomyRequest
    {
        public string? ContentPreview { get; set; }
    }

    public class LaunchZenRoomRequest
    {
        public string Title { get; set; } = string.Empty;
        public int TotalQuestions { get; set; }
        public string? SubjectCode { get; set; }
        public int DurationMinutes { get; set; } = 15;
        public string GameCode { get; set; } = "GOLDEN_BELL";
        public List<ZenQuestionPreviewDto> Questions { get; set; } = new();
    }

    public class UpdatePayoutConfigRequest
    {
        public string BankAccount { get; set; } = string.Empty;
        public string? BankName { get; set; }
    }

    public class UpsertCreatorMarketingPolicyRequest
    {
        public Guid? Id { get; set; }
        public string CampaignCode { get; set; } = string.Empty;
        public string CampaignName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int TrialDays { get; set; } = 90;
        public decimal RevenueShareRate { get; set; } = 0.80m;
        public int KarmaBonusPoints { get; set; } = 100;
        public int CoffeeProDays { get; set; } = 7;
        public decimal CoffeePriceVnd { get; set; } = 25000m;
        public bool IsActive { get; set; } = true;
    }

    public class CreatorMarketingPolicyDto
    {
        public string CampaignCode { get; set; } = string.Empty;
        public string CampaignName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int TrialDays { get; set; }
        public decimal RevenueShareRate { get; set; }
        public int KarmaBonusPoints { get; set; }
        public int CoffeeProDays { get; set; } = 7;
        public decimal CoffeePriceVnd { get; set; } = 25000m;
        public string CoffeeBankBin { get; set; } = string.Empty;
        public string CoffeeAccountNumber { get; set; } = string.Empty;
        public string CoffeeAccountName { get; set; } = string.Empty;
    }

    public class CreatorPartnershipDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string ReferralCode { get; set; } = string.Empty;
        public DateTime TrialExpiresAt { get; set; }
        public int DaysRemaining { get; set; }
        public bool IsActive { get; set; }
        public decimal RevenueShareRate { get; set; }
        public int KarmaPoints { get; set; }
        public string? PayoutBankAccount { get; set; }
        public string? CampaignCode { get; set; }
        public string? CampaignName { get; set; }
        public int TrialDays { get; set; }
        public int CoffeeProDays { get; set; } = 7;
        public decimal CoffeePriceVnd { get; set; } = 25000m;
        public string? CoffeeBankBin { get; set; }
        public string? CoffeeAccountNumber { get; set; }
        public string? CoffeeAccountName { get; set; }
    }

    public class ZenUploadResponseDto
    {
        public bool Success { get; set; }
        public string ExamTitle { get; set; } = string.Empty;
        public int TotalQuestions { get; set; }
        public int DuplicateCount { get; set; }
        public int UniqueCount { get; set; }
        public double DeduplicationRatePercentage { get; set; }
        public object? SuggestedTaxonomy { get; set; }
        public List<ZenQuestionPreviewDto> Questions { get; set; } = new();
    }

    public class ZenQuestionPreviewDto
    {
        public int Order { get; set; }
        public string Content { get; set; } = string.Empty;
        public string CanonicalHash { get; set; } = string.Empty;
        public bool IsDuplicate { get; set; }
        public string QuestionType { get; set; } = "SINGLE";
        public List<string> Options { get; set; } = new();
        public string? CorrectAnswer { get; set; }
        public string? Explanation { get; set; }

        // [Universal Shared Context / Stimulus] Dữ liệu dùng chung (Đoạn văn đọc hiểu, file nghe, biểu đồ, tình huống)
        public string? ContextId { get; set; }
        public string? ContextTitle { get; set; }
        public string? ContextContent { get; set; }

        // [Hierarchy & Provenance] Tọa độ phân cấp & số hiệu câu gốc
        public string? SourceQuestionNo { get; set; }
        public string? HierarchyIndex { get; set; }
        public string? FullQuestionIndex { get; set; }
        public List<AegisQuiz.Application.Interfaces.QuestionSubItemDto>? SubItems { get; set; }

        // [Universal Cognitive Fields & Pedagogy] Kế thừa toàn diện các trường sư phạm
        public int Difficulty { get; set; } = 2;
        public int DurationSeconds { get; set; } = 60;
        public string? GradingRubric { get; set; }
        public string? MediaUrl { get; set; }
        public List<string>? Tags { get; set; }
        public string? TopicCode { get; set; }
        public string? TopicName { get; set; }
        public string? DomainCode { get; set; }
    }
    public class SaveZenToBankRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? SubjectCode { get; set; }
        public string? DomainCode { get; set; } = "EDUCATION";
        public List<ZenQuestionPreviewDto> Questions { get; set; } = new();
    }

    public class HomeworkSubmissionDto
    {
        public string TopicCode { get; set; } = string.Empty;
        public string? StudentName { get; set; }
        public string? StudentClass { get; set; }
        public Guid? UserId { get; set; }
        public decimal Score { get; set; }
        public int CorrectCount { get; set; }
        public int TotalQuestions { get; set; }
        public int TimeSpentSeconds { get; set; }
        public int TabSwitchCount { get; set; }
        public List<int> WrongQuestionIndexes { get; set; } = new();
        public List<HomeworkQuestionDetailDto> Details { get; set; } = new();
    }

    public class HomeworkQuestionDetailDto
    {
        public Guid QuestionId { get; set; }
        public string? Category { get; set; }
        public string? SelectedAnswer { get; set; }
        public bool IsCorrect { get; set; }
        public int TimeSpentSeconds { get; set; }
    }

    public class CohortSummaryDto
    {
        public string TopicCode { get; set; } = string.Empty;
        public string ExamTitle { get; set; } = string.Empty;
        public int TotalSubmitted { get; set; }
        public decimal AverageScore { get; set; }
        public int AverageTimeSeconds { get; set; }
        public int MostFailedQuestionIndex { get; set; }
        public decimal MostFailedRate { get; set; }
        public Dictionary<int, decimal> QuestionFailureRates { get; set; } = new();
        public List<CohortStudentItemDto> Submissions { get; set; } = new();
    }

    public class CohortStudentItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? ClassName { get; set; }
        public decimal Score { get; set; }
        public string TimeSpent { get; set; } = string.Empty;
        public string SubmittedAt { get; set; } = string.Empty;
        public List<int> WrongQuestionIndexes { get; set; } = new();
        public string Group { get; set; } = "CORE";
        public bool IsGuest { get; set; }
    }
}
