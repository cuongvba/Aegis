using System;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;

namespace Aegis.Application.Interfaces
{
    /// <summary>
    /// [Epoch 5: CognitiveOS] Động cơ RAG sư phạm dẫn xuất giáo trình chuẩn (Curriculum-Grounded Pedagogical RAG).
    /// </summary>
    public interface IPedagogicalRagService
    {
        Task<PedagogicalRagResponseDto> GenerateCurriculumGroundedExplanationAsync(
            Guid questionId,
            string questionContent,
            string? studentAnswer,
            string domainCode = "EDUCATION",
            CancellationToken ct = default);
    }
}
