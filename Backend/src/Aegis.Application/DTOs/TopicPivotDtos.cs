using System.Collections.Generic;

namespace Aegis.Application.DTOs
{
    public class TopicPivotQueryDto
    {
        public string PivotMode { get; set; } = "grade"; // grade | school | subject | purpose
        public string? DomainCode { get; set; }
        public string? TargetLevel { get; set; }
        public string? BenchmarkYear { get; set; }
        public string? IssuingOrg { get; set; }
        public string? AssessmentPurpose { get; set; }
        public bool MyOnly { get; set; }
    }

    public class TopicPivotSummaryResponse
    {
        public string PivotMode { get; set; } = "grade";
        public int TotalTopics { get; set; }
        public int TotalQuestions { get; set; }
        public PivotFacetsDto Facets { get; set; } = new();
        public List<PivotGroupNodeDto> PivotTree { get; set; } = new();
        public List<CoverageMatrixCellDto> CoverageMatrix { get; set; } = new();
        public Dictionary<string, TopicCoordinateProfileDto> TopicCoordinates { get; set; } = new();
    }

    public class PivotFacetsDto
    {
        public List<PivotFacetItemDto> TargetLevels { get; set; } = new();
        public List<PivotFacetItemDto> BenchmarkYears { get; set; } = new();
        public List<PivotFacetItemDto> IssuingOrgs { get; set; } = new();
        public List<PivotFacetItemDto> Domains { get; set; } = new();
        public List<PivotFacetItemDto> AssessmentPurposes { get; set; } = new();
    }

    public class PivotFacetItemDto
    {
        public string Value { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int TopicCount { get; set; }
        public int QuestionCount { get; set; }
    }

    public class PivotGroupNodeDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Axis { get; set; } = string.Empty;
        public int TopicCount { get; set; }
        public int QuestionCount { get; set; }
        public List<string> TopicCodes { get; set; } = new();
        public List<PivotGroupNodeDto> Children { get; set; } = new();
    }

    public class CoverageMatrixCellDto
    {
        public string TargetLevel { get; set; } = string.Empty;
        public string BenchmarkYear { get; set; } = string.Empty;
        public int TopicCount { get; set; }
        public int QuestionCount { get; set; }
        public string Status { get; set; } = "EMPTY"; // EMPTY | SPARSE | HEALTHY
    }

    public class TopicCoordinateProfileDto
    {
        public string TopicCode { get; set; } = string.Empty;
        public string DomainCode { get; set; } = "EDUCATION";
        public string TargetLevel { get; set; } = "Chưa phân khối";
        public string BenchmarkYear { get; set; } = "Chưa gắn năm";
        public string IssuingOrg { get; set; } = "Kho Chung";
        public string AssessmentPurpose { get; set; } = "Tổng hợp";
        public int QuestionCount { get; set; }
    }
}
