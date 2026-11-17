using System.Collections.Generic;

namespace Aegis.Application.DTOs
{
    public class ExamMatrixBloomWeightsDto
    {
        public int Recall { get; set; } = 40;
        public int Comprehend { get; set; } = 30;
        public int Apply { get; set; } = 20;
        public int HighApply { get; set; } = 10;
    }

    public class ExamMatrixSectionRuleDto
    {
        public string Code { get; set; } = "PART_1";
        public string Title { get; set; } = string.Empty;
        public string QuestionType { get; set; } = "SINGLE";
        public int Count { get; set; }
        public double PointsPerQuestion { get; set; } = 0.25;
    }

    public class ExamMatrixTemplateDto
    {
        public string TemplateCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        /// <summary>"MOET_2025" | "COMPANY_POLICY" | "CUSTOM"</summary>
        public string Category { get; set; } = "MOET_2025";
        public string DomainCode { get; set; } = "EDUCATION";
        public string TopicCode { get; set; } = "TOAN";
        public string? TargetLevel { get; set; } = "K12";
        public int DurationMinutes { get; set; } = 90;
        public bool IsSystemDefault { get; set; }
        public string? Description { get; set; }
        public ExamMatrixBloomWeightsDto BloomWeights { get; set; } = new();
        public List<ExamMatrixSectionRuleDto> Sections { get; set; } = new();
    }

    public class GenerateMatrixExamRequestDto
    {
        public string? TemplateCode { get; set; }
        public string? ExamTitle { get; set; }
        public string DomainCode { get; set; } = "EDUCATION";
        public string TopicCode { get; set; } = "TOAN";
        public string? TargetLevel { get; set; }
        public int DurationMinutes { get; set; } = 90;
        public ExamMatrixBloomWeightsDto BloomWeights { get; set; } = new();
        public List<ExamMatrixSectionRuleDto> Sections { get; set; } = new();
    }

    public class MatrixSectionCoverageDto
    {
        public string SectionCode { get; set; } = string.Empty;
        public string SectionTitle { get; set; } = string.Empty;
        public string QuestionType { get; set; } = "SINGLE";
        public int RequestedCount { get; set; }
        public int MatchedCount { get; set; }
        public int MissingCount => System.Math.Max(0, RequestedCount - MatchedCount);
    }

    public class MatrixGeneratedQuestionDto
    {
        public int Order { get; set; }
        public string QuestionId { get; set; } = string.Empty;
        public string SectionCode { get; set; } = string.Empty;
        public string SectionTitle { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string QuestionType { get; set; } = "SINGLE";
        public int Difficulty { get; set; }
        public List<string> Options { get; set; } = new();
        public string? CorrectAnswer { get; set; }
        public string? Explanation { get; set; }
        public string? ContextId { get; set; }
        public string? ContextTitle { get; set; }
        public string? ContextContent { get; set; }
    }

    public class GenerateMatrixExamResponseDto
    {
        public bool Success { get; set; }
        public string ExamTitle { get; set; } = string.Empty;
        public string DomainCode { get; set; } = "EDUCATION";
        public string TopicCode { get; set; } = "TOAN";
        public string? TargetLevel { get; set; }
        public int DurationMinutes { get; set; }
        public int RequestedTotal { get; set; }
        public int TotalQuestions { get; set; }
        public int MissingTotal => System.Math.Max(0, RequestedTotal - TotalQuestions);
        public List<MatrixSectionCoverageDto> SectionCoverages { get; set; } = new();
        public List<MatrixGeneratedQuestionDto> Questions { get; set; } = new();
        public string? WarningMessage { get; set; }
    }

    public class MatrixInventoryDto
    {
        public string DomainCode { get; set; } = string.Empty;
        public string TopicCode { get; set; } = string.Empty;
        public string? TargetLevel { get; set; }
        public int TotalCount { get; set; }
        public Dictionary<string, int> ByQuestionType { get; set; } = new();
        public Dictionary<int, int> ByDifficulty { get; set; } = new();
        public List<string> AvailableSubjects { get; set; } = new();
        public List<string> AvailableGrades { get; set; } = new();
    }
}
