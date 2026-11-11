using System;
using System.Collections.Generic;

namespace Aegis.Domain.Entities
{
    public enum PaperGenerationMode
    {
        Manual = 1,     // Hội đồng chọn đích danh từng câu hỏi
        Automated = 2,  // Sinh tự động theo ma trận tỷ lệ % 5 trục UCTE & Bloom
        Hybrid = 3      // Sinh tự động ban đầu và cho phép hoán đổi câu hỏi tương đương IRT
    }

    /// <summary>
    /// Bộ đề thi chi tiết thuộc một Phân nhánh (Exam Track).
    /// </summary>
    public class ExamPaper
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TrackId { get; set; }
        public ExamTrack? Track { get; set; }

        public string PaperCode { get; set; } = string.Empty; // e.g. "AGRI-KHCN-STAFF-2026"
        public string Title { get; set; } = string.Empty;
        public PaperGenerationMode GenerationMode { get; set; } = PaperGenerationMode.Automated;
        public int DurationMinutes { get; set; } = 60;
        public decimal PassingScorePercent { get; set; } = 70m;
        public int TotalQuestions { get; set; } = 40;
        
        // Bảo mật & Niêm phong
        public bool IsSealed { get; set; } = false;
        public string? CryptographicHashSha256 { get; set; }
        public DateTimeOffset? SealedAt { get; set; }
        public string? SealedBy { get; set; }

        // Cấu hình Ma trận sinh đề (JSON format)
        public string? BlueprintJson { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public ICollection<ExamPaperItem> Items { get; set; } = new List<ExamPaperItem>();
    }

    /// <summary>
    /// Từng câu hỏi chi tiết trong Bộ đề thi.
    /// Cho phép cố định thứ tự, gán điểm số riêng, hoặc hoán đổi câu hỏi tương đương.
    /// </summary>
    public class ExamPaperItem
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ExamPaperId { get; set; }
        public ExamPaper? ExamPaper { get; set; }

        public Guid QuestionId { get; set; }
        public int OrderIndex { get; set; }
        public decimal CustomWeight { get; set; } = 1.0m;
        public bool IsPinned { get; set; } = false; // Ghim vị trí không cho xáo trộn

        // Snapshots bảo toàn tính nhất quán lịch sử
        public string? QuestionTitleSnapshot { get; set; }
        public string? TopicSnapshot { get; set; }
        public string? QuestionTypeSnapshot { get; set; }
    }
}

