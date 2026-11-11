using System.Collections.Generic;
using Aegis.Application.DTOs;

namespace Aegis.Application.Interfaces
{
    /// <summary>
    /// [Aegis Sovereign Exam Export & Transpiler Engine]
    /// Dịch vụ chuyển dịch và xuất bản đề thi chuẩn quốc gia ra file Word (.docx) và trọn gói hồ sơ khảo thí nộp trường.
    /// </summary>
    public interface IExamExportTranspilerService
    {
        /// <summary>
        /// Xuất 1 mã đề thi ra file Word (.docx) chuẩn thể thức Bộ GD&ĐT (Header Sở/Trường, chia phần, công thức, bảng đáp án).
        /// </summary>
        byte[] ExportSingleExamToDocx(IReadOnlyList<DocxImportPreviewDto> questions, ExamExportOptionsDto options, string examCode = "101");

        /// <summary>
        /// Xuất Bản Hướng Dẫn Chấm & Lời Giải Chi Tiết ra file Word (.docx) kèm thang điểm rubric.
        /// </summary>
        byte[] ExportDetailedSolutionsToDocx(IReadOnlyList<DocxImportPreviewDto> questions, ExamExportOptionsDto options);

        /// <summary>
        /// Xuất Bản Bảng Ma Trận & Bản Đặc Tả Đề Thi ra file Word (.docx) nộp Tổ chuyên môn / Ban Giám Hiệu duyệt.
        /// </summary>
        byte[] ExportSpecificationMatrixToDocx(IReadOnlyList<DocxImportPreviewDto> questions, ExamExportOptionsDto options);

        /// <summary>
        /// Trộn đề thi thành N mã đề hoán vị và đóng gói thành file ZIP trọn bộ hồ sơ khảo thí nộp trường.
        /// Gồm: Các file đề thi .docx từng mã đề + Đáp án chi tiết .docx + Ma trận đặc tả .docx + Phiếu tô OMR .html.
        /// </summary>
        ExamExportResultDto GenerateMultiVariantPackageZip(IReadOnlyList<DocxImportPreviewDto> questions, ExamExportOptionsDto options);

        /// <summary>
        /// Xuất phiếu trả lời trắc nghiệm chuẩn quang học OMR định dạng HTML Vector A4 sẵn sàng in ấn trực tiếp hoặc lưu PDF.
        /// </summary>
        string GenerateOmrAnswerSheetHtml(int totalQuestions, ExamExportOptionsDto options);
    }
}

