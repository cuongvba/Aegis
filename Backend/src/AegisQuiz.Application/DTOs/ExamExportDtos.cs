using System;
using System.Collections.Generic;
using AegisQuiz.Application.Interfaces;

namespace AegisQuiz.Application.DTOs
{
    /// <summary>
    /// [Aegis Global Sovereign Exam Export Options]
    /// Cấu hình hồ sơ khảo thí chuẩn mực nộp trường và in ấn theo thể thức quốc gia / quốc tế.
    /// </summary>
    public class ExamExportOptionsDto
    {
        public string ExamTitle { get; set; } = "ĐỀ KHẢO SÁT CHẤT LƯỢNG HỌC KỲ";
        public string MinistryOrDepartmentName { get; set; } = "SỞ GIÁO DỤC VÀ ĐÀO TẠO";
        public string SchoolOrOrgName { get; set; } = "TRƯỜNG THPT CHUYÊN";
        public string SubjectName { get; set; } = "MÔN: TOÁN HỌC";
        public int DurationMinutes { get; set; } = 90;
        public string AcademicYear { get; set; } = "2025 - 2026";
        public string SemesterOrExamSession { get; set; } = "HỌC KỲ II";
        public string ExamCodePrefix { get; set; } = "10";
        public int VariantCount { get; set; } = 1; // 1, 2, 4, 8 mã đề
        public bool IncludeAnswerKey { get; set; } = true;
        public bool IncludeDetailedSolutions { get; set; } = true;
        public bool IncludeSpecificationMatrix { get; set; } = true;
        public bool IncludeOmrAnswerSheet { get; set; } = true;
        public bool TwoColumnLayout { get; set; } = false;
        public string TargetStandard { get; set; } = "THPT_2025"; // THPT_2025, GENERAL, DGNL_VNU

        /// <summary>Danh sách câu hỏi được chọn để xuất bản đề thi.</summary>
        public List<DocxImportPreviewDto> Questions { get; set; } = new();
    }

    /// <summary>
    /// Biến thể đề thi sau khi trộn ma trận (1 mã đề độc lập).
    /// </summary>
    public class ExamVariantDto
    {
        public string ExamCode { get; set; } = "101";
        public List<DocxImportPreviewDto> Questions { get; set; } = new();
        /// <summary>Mã đề -> Câu 1-based -> Nhãn đáp án (A, B, C, D hoặc Đúng/Sai hoặc chuỗi số)</summary>
        public Dictionary<int, string> AnswerKey { get; set; } = new();
        /// <summary>Ánh xạ vị trí câu hỏi mới -> câu hỏi gốc ban đầu (1-based)</summary>
        public Dictionary<int, int> QuestionMappingFromOriginal { get; set; } = new();
    }

    /// <summary>
    /// Kết quả trộn đề ma trận đa mã đề và xuất bản trọn bộ hồ sơ khảo thí.
    /// </summary>
    public class ExamExportResultDto
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public int TotalQuestions { get; set; }
        public int TotalVariants { get; set; }
        public List<string> GeneratedExamCodes { get; set; } = new();
        /// <summary>File Word (.docx) đề thi đơn (hoặc mã đề đầu tiên)</summary>
        public byte[]? SingleDocxBytes { get; set; }
        public string SingleDocxFileName { get; set; } = "DeThi_Chuan.docx";
        /// <summary>File ZIP trọn bộ hồ sơ khảo thí nộp trường</summary>
        public byte[]? ZipPackageBytes { get; set; }
        public string ZipPackageFileName { get; set; } = "HoSo_KhaoThi_NopTruong.zip";
    }
}
