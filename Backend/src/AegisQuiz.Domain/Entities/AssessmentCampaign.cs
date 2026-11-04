using System;
using System.Collections.Generic;

namespace AegisQuiz.Domain.Entities
{
    public enum CampaignStatus
    {
        Draft = 0,
        Active = 1,
        Sealed = 2,
        Closed = 3
    }

    /// <summary>
    /// Chiến dịch Khảo thí Doanh nghiệp / Tổ chức đa phân nhánh (Multi-Strata Assessment Campaign).
    /// Đáp ứng các kỳ thi quy mô lớn như Hội thi Nghiệp vụ Agribank, Kỳ thi Học kỳ THCS...
    /// </summary>
    public class AssessmentCampaign
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTimeOffset StartDate { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset EndDate { get; set; } = DateTimeOffset.UtcNow.AddDays(7);
        public CampaignStatus Status { get; set; } = CampaignStatus.Draft;
        public string ExecutionPolicy { get; set; } = "STRICT_PROCTORING"; // STRICT_PROCTORING, OPEN_BOOK
        public bool AllowCandidateSelfSelect { get; set; } = false;
        public Guid? TenantId { get; set; }
        public string CreatedBy { get; set; } = "Admin";
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public ICollection<ExamTrack> Tracks { get; set; } = new List<ExamTrack>();
        public ICollection<CampaignCandidate> Candidates { get; set; } = new List<CampaignCandidate>();
    }

    /// <summary>
    /// Phân nhánh nghiệp vụ / Mảng chuyên môn của kỳ thi (Track).
    /// Ví dụ: "Nghiệp vụ KHCN", "Nghiệp vụ KHDN", "KTNQ", "Khối 9 Ban Tự nhiên"...
    /// </summary>
    public class ExamTrack
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CampaignId { get; set; }
        public AssessmentCampaign? Campaign { get; set; }
        public string TrackName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        // Navigation
        public ICollection<ExamPaper> Papers { get; set; } = new List<ExamPaper>();
    }
}

