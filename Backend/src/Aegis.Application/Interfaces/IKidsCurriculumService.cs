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
            bool includePending = false,
            CancellationToken ct = default);

        Task<KidsLessonPlanDto> GenerateDailyAdventureAsync(
            Guid tenantId,
            GenerateKidsAdventureRequestDto request,
            CancellationToken ct = default);

        Task<AiBuildKidsCurriculumResponseDto> BuildCurriculumWithAiAsync(
            Guid tenantId,
            AiBuildKidsCurriculumRequestDto request,
            CancellationToken ct = default);

        Task<List<KidsStageThemeDto>> GetStageThemesAsync(
            Guid tenantId,
            bool includePending = false,
            CancellationToken ct = default);

        Task<KidsStageThemeDto> SaveStageThemeAsync(
            Guid tenantId,
            KidsStageThemeDto stage,
            CancellationToken ct = default);

        Task<KidsCreatorBundleResponseDto> SubmitCreatorBundleAsync(
            Guid tenantId,
            SubmitKidsCreatorBundleDto bundle,
            CancellationToken ct = default);

        Task<bool> ModerateContributionAsync(
            Guid tenantId,
            string presetCode,
            bool approve,
            CancellationToken ct = default);

        Task<int> GiveGratitudeAsync(
            Guid tenantId,
            string presetCode,
            CancellationToken ct = default);
    }
}
