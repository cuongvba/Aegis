using System;
using System.Collections.Generic;

namespace AegisQuiz.Application.DTOs
{
    public class AssessmentCampaignSummaryDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTimeOffset StartDate { get; set; }
        public DateTimeOffset EndDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string ExecutionPolicy { get; set; } = string.Empty;
        public bool AllowCandidateSelfSelect { get; set; }
        public int TotalTracks { get; set; }
        public int TotalPapers { get; set; }
        public int TotalCandidates { get; set; }
        public int CompletedCandidates { get; set; }
        public decimal PassRatePercent { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }

    public class AssessmentCampaignDetailDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTimeOffset StartDate { get; set; }
        public DateTimeOffset EndDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string ExecutionPolicy { get; set; } = string.Empty;
        public bool AllowCandidateSelfSelect { get; set; }
        public List<ExamTrackDto> Tracks { get; set; } = new();
    }

    public class ExamTrackDto
    {
        public Guid Id { get; set; }
        public string TrackName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<ExamPaperSummaryDto> Papers { get; set; } = new();
    }

    public class ExamPaperSummaryDto
    {
        public Guid Id { get; set; }
        public Guid TrackId { get; set; }
        public string PaperCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string GenerationMode { get; set; } = string.Empty;
        public int DurationMinutes { get; set; }
        public decimal PassingScorePercent { get; set; }
        public int TotalQuestions { get; set; }
        public bool IsSealed { get; set; }
        public string? CryptographicHashSha256 { get; set; }
        public int AssignedCandidatesCount { get; set; }
        public List<ExamPaperItemDto> Items { get; set; } = new();
    }

    public class ExamPaperItemDto
    {
        public Guid Id { get; set; }
        public Guid QuestionId { get; set; }
        public int OrderIndex { get; set; }
        public decimal CustomWeight { get; set; }
        public bool IsPinned { get; set; }
        public string QuestionTitle { get; set; } = string.Empty;
        public string Topic { get; set; } = string.Empty;
        public string QuestionType { get; set; } = string.Empty;
    }

    public class CreateCampaignRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTimeOffset StartDate { get; set; }
        public DateTimeOffset EndDate { get; set; }
        public string ExecutionPolicy { get; set; } = "STRICT_PROCTORING";
        public bool AllowCandidateSelfSelect { get; set; } = false;
        public List<string> TrackNames { get; set; } = new();
    }

    public class CreateTrackRequestDto
    {
        public string TrackName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class TenantTopicOptionDto
    {
        public string TopicCode { get; set; } = string.Empty;
        public string TopicName { get; set; } = string.Empty;
        public string CategoryCode { get; set; } = string.Empty;
        public int AvailableQuestions { get; set; }
        public string DomainCode { get; set; } = string.Empty;
    }

    public class CreateAutoPaperRequestDto
    {
        public Guid TrackId { get; set; }
        public string PaperCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int DurationMinutes { get; set; } = 60;
        public decimal PassingScorePercent { get; set; } = 70;
        public int TotalQuestions { get; set; } = 40;
        public int MinSubmissionMinutes { get; set; } = 20;
        public int GracePeriodMinutes { get; set; } = 5;
        public int TabSwitchTolerance { get; set; } = 3;
        public BloomDistributionDto? BloomDistribution { get; set; }
        public List<BlueprintSliceDto> Slices { get; set; } = new();
    }

    public class BloomDistributionDto
    {
        public int RememberPercent { get; set; } = 20;
        public int UnderstandPercent { get; set; } = 40;
        public int ApplyPercent { get; set; } = 30;
        public int AnalyzePercent { get; set; } = 10;
    }

    public class BlueprintSliceDto
    {
        public string SliceName { get; set; } = string.Empty;
        public string TopicKeyword { get; set; } = string.Empty;
        public int Quota { get; set; }
        public decimal WeightPerItem { get; set; } = 1.0m;
    }

    public class CreateManualPaperRequestDto
    {
        public Guid TrackId { get; set; }
        public string PaperCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int DurationMinutes { get; set; } = 60;
        public decimal PassingScorePercent { get; set; } = 70;
        public List<ManualPaperItemInputDto> Items { get; set; } = new();
    }

    public class ManualPaperItemInputDto
    {
        public Guid QuestionId { get; set; }
        public decimal Weight { get; set; } = 1.0m;
        public bool IsPinned { get; set; } = false;
    }

    public class SwapPaperItemRequestDto
    {
        public Guid PaperItemId { get; set; }
        public Guid ReplacementQuestionId { get; set; }
    }

    public class CandidateAllocationDto
    {
        public Guid Id { get; set; }
        public string CandidateIdentifier { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string OrgUnitPath { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public Guid? AssignedExamPaperId { get; set; }
        public string AssignedPaperTitle { get; set; } = string.Empty;
        public string AssignedPaperCode { get; set; } = string.Empty;
        public string AllocationSource { get; set; } = string.Empty;
        public string? OverrideReason { get; set; }
        public string? ShiftCode { get; set; }
        public string? RoomLabId { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal? Score { get; set; }
        public decimal? ScorePercentage { get; set; }
        public bool? Passed { get; set; }
        public int? Rank { get; set; }
    }

    public class ManualOverrideCandidateRequestDto
    {
        public List<Guid> CandidateIds { get; set; } = new();
        public Guid TargetExamPaperId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class BatchImportCandidateItemDto
    {
        public string CandidateIdentifier { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string OrgUnitPath { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string PaperCode { get; set; } = string.Empty;
        public string? ShiftCode { get; set; }
        public string? RoomLabId { get; set; }
    }

    public class CampaignResultsAnalyticsDto
    {
        public Guid CampaignId { get; set; }
        public string CampaignTitle { get; set; } = string.Empty;
        public int TotalCandidates { get; set; }
        public int CompletedCount { get; set; }
        public int InProgressCount { get; set; }
        public int NotStartedCount { get; set; }
        public int ExemptedCount { get; set; }
        public decimal AverageScorePercent { get; set; }
        public decimal HighestScorePercent { get; set; }
        public decimal PassRatePercent { get; set; }

        public List<ScoreDistributionBucketDto> ScoreBuckets { get; set; } = new();
        public List<OrgUnitPerformanceDto> OrgPerformance { get; set; } = new();
        public List<TopLeaderboardEntryDto> Leaderboard { get; set; } = new();
    }

    public class ScoreDistributionBucketDto
    {
        public string RangeLabel { get; set; } = string.Empty; // e.g. "0-20%", "20-40%"
        public int Count { get; set; }
        public decimal Percentage { get; set; }
    }

    public class OrgUnitPerformanceDto
    {
        public string OrgUnitName { get; set; } = string.Empty;
        public int TotalCandidates { get; set; }
        public int CompletedCandidates { get; set; }
        public decimal AverageScore { get; set; }
        public decimal PassRatePercent { get; set; }
    }

    public class TopLeaderboardEntryDto
    {
        public int Rank { get; set; }
        public string CandidateIdentifier { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string OrgUnitPath { get; set; } = string.Empty;
        public string PaperTitle { get; set; } = string.Empty;
        public decimal ScorePercentage { get; set; }
        public string TimeSpent { get; set; } = string.Empty;
        public bool Passed { get; set; }
    }
}

