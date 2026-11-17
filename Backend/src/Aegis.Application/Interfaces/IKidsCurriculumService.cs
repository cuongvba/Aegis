using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;

namespace Aegis.Application.Interfaces
{
    public interface IKidsCurriculumService
    {
        Task<List<KidsConceptAtomDto>> GetConceptAtomsAsync(
            Guid tenantId,
            string? islandId = null,
            string? ageBand = null,
            CancellationToken ct = default);

        Task<KidsLessonPlanDto> GenerateDailyAdventureAsync(
            Guid tenantId,
            GenerateKidsAdventureRequestDto request,
            CancellationToken ct = default);

        Task<AiBuildKidsCurriculumResponseDto> BuildCurriculumWithAiAsync(
            Guid tenantId,
            AiBuildKidsCurriculumRequestDto request,
            CancellationToken ct = default);
    }
}
