using System;

namespace AegisQuiz.Domain.Entities
{
    public enum CandidateExamStatus
    {
        NotStarted = 0,
        InProgress = 1,
        Completed = 2,
        Exempted = 3 // Miễn thi / Đặc cách
    }

    /// <summary>
    /// Thí sinh dự thi trong Chiến dịch Khảo thí.
    /// Hỗ trợ gán đề thi theo 4 kênh: Cây tổ chức O(1), Tự đăng ký, Điều chỉnh thủ công, Nạp Excel.
    /// Quản lý toàn bộ kết quả, điểm số, thứ hạng và phân loại.
    /// </summary>
    public class CampaignCandidate
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CampaignId { get; set; }
        public AssessmentCampaign? Campaign { get; set; }

        public Guid? UserId { get; set; }
        public string CandidateIdentifier { get; set; } = string.Empty; // SBD / Mã NV / Mã HS
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        
        // Vị trí trên cây tổ chức O(1)
        public string OrgUnitPath { get; set; } = string.Empty; // /Agribank/CN_HaNoi/Phong_KHCN
        public string JobTitle { get; set; } = string.Empty;    // Chuyên viên, Trưởng phòng

        // Bộ đề thi được gán
        public Guid? AssignedExamPaperId { get; set; }
        public ExamPaper? AssignedExamPaper { get; set; }

        // Nguồn phân bổ: "AUTO_ORG", "SELF_SELECT", "MANUAL_OVERRIDE", "EXCEL"
        public string AllocationSource { get; set; } = "AUTO_ORG";
        public string? OverrideReason { get; set; }

        // Phòng thi & Ca thi
        public string? ShiftCode { get; set; } // Ca 1 (08h00 - 09h30)
        public string? RoomLabId { get; set; }  // Phòng máy Lab 01

        // Kết quả thực hiện cuộc thi
        public CandidateExamStatus Status { get; set; } = CandidateExamStatus.NotStarted;
        public decimal? Score { get; set; }
        public decimal? ScorePercentage { get; set; }
        public int CorrectCount { get; set; }
        public int TotalCount { get; set; }
        public bool? Passed { get; set; }
        public int? Rank { get; set; }
        public DateTimeOffset? StartedAt { get; set; }
        public DateTimeOffset? CompletedAt { get; set; }
        public int NumberOfTabSwitches { get; set; } = 0;
    }
}

