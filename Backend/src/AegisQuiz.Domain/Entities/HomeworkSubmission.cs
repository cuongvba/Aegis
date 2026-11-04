using System;
using System.Collections.Generic;

namespace AegisQuiz.Domain.Entities
{
    /// <summary>
    /// [Dual-Branch Telemetry] Bài nộp bài tập về nhà theo lớp.
    /// Cho phép học sinh nộp bài theo link giáo viên (có hoặc không có tài khoản).
    /// </summary>
    public class HomeworkSubmission
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string TopicCode { get; set; } = string.Empty;
        public string? StudentName { get; set; }
        public string? StudentClass { get; set; }
        public Guid? UserId { get; set; }
        public bool IsGuest { get; set; } = true;
        public decimal Score { get; set; }
        public int CorrectCount { get; set; }
        public int TotalQuestions { get; set; }
        public int TimeSpentSeconds { get; set; }
        public int TabSwitchCount { get; set; }
        public List<int> WrongQuestionIndexes { get; set; } = new();
        public string GroupCategory { get; set; } = "CORE"; // REMEDIAL, CORE, OLYMPIAN
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public Guid? TeacherUserId { get; set; }
        public Guid? TenantId { get; set; }
    }
}

