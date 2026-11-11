using System.Collections.Generic;
using Aegis.Application.DTOs;

namespace Aegis.Application.Interfaces
{
    public enum SpatialResolutionTier
    {
        Exact5D,
        ExamPartQ,
        ExamQ,
        Ambiguous,
        NotFound
    }

    public record SpatialResolution(
        DocxImportPreviewDto? Question,
        SpatialResolutionTier Tier,
        string? WarningMessage = null)
    {
        public bool IsSuccess => Question != null && (Tier == SpatialResolutionTier.Exact5D || Tier == SpatialResolutionTier.ExamPartQ || Tier == SpatialResolutionTier.ExamQ);
    }

    /// <summary>
    /// [SSoT Contract] Hợp đồng quản trị Không Gian Định Vị Toàn Cục của toàn bộ tài liệu DOCX.
    /// Tồn tại xuyên suốt vòng đời phân tích tài liệu, bảo đảm tra cứu O(1) bất biến.
    /// </summary>
    public interface IDocumentSpatialIndex
    {
        void Register(DocxImportPreviewDto q);
        SpatialResolution Resolve(QuestionAddress address);
        IReadOnlyList<DocxImportPreviewDto> GetSectionQuestions(string sectionKey);
        IReadOnlyList<DocxImportPreviewDto> GetExamQuestions(int examRank);
        int TotalRegisteredQuestions { get; }
    }
}

