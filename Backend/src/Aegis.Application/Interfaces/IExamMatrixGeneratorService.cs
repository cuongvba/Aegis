using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;

namespace Aegis.Application.Interfaces
{
    public interface IExamMatrixGeneratorService
    {
        Task<List<ExamMatrixTemplateDto>> GetTemplatesAsync(Guid tenantId, CancellationToken ct = default);

        Task<ExamMatrixTemplateDto> SaveCustomTemplateAsync(
            Guid tenantId,
            ExamMatrixTemplateDto template,
            CancellationToken ct = default);

        Task<bool> DeleteCustomTemplateAsync(
            Guid tenantId,
            string templateCode,
            CancellationToken ct = default);

        Task<GenerateMatrixExamResponseDto> GenerateFromRealBankAsync(
            Guid tenantId,
            GenerateMatrixExamRequestDto request,
            CancellationToken ct = default);
    }
}
