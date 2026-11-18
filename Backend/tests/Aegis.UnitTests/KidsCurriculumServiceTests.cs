using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Aegis.Application.DTOs;
using Aegis.Infrastructure.Data;
using Aegis.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Aegis.UnitTests
{
    public class KidsCurriculumServiceTests
    {
        private static AegisDbContext CreateInMemoryDb(string dbName)
        {
            var options = new DbContextOptionsBuilder<AegisDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new AegisDbContext(options);
        }

        [Fact]
        public async Task GetConceptAtomsAsync_LoadsAllFourKidsIslands()
        {
            await using var db = CreateInMemoryDb(nameof(GetConceptAtomsAsync_LoadsAllFourKidsIslands));
            var service = new KidsCurriculumService(db, NullLogger<KidsCurriculumService>.Instance);

            var all = await service.GetConceptAtomsAsync(Guid.NewGuid());

            Assert.Contains(all, a => a.IslandId == "music");
            Assert.Contains(all, a => a.IslandId == "animals");
            Assert.Contains(all, a => a.IslandId == "toys");
            Assert.Contains(all, a => a.IslandId == "fairytale");
        }

        [Fact]
        public async Task GenerateDailyAdventureAsync_SynthesizesMultiModalActivitiesAndPrioritizesWeakAtoms()
        {
            await using var db = CreateInMemoryDb(nameof(GenerateDailyAdventureAsync_SynthesizesMultiModalActivitiesAndPrioritizesWeakAtoms));
            var service = new KidsCurriculumService(db, NullLogger<KidsCurriculumService>.Instance);

            var plan = await service.GenerateDailyAdventureAsync(Guid.NewGuid(), new GenerateKidsAdventureRequestDto
            {
                IslandId = "toys",
                AtomCount = 2,
                WeakAtomCodes = new List<string> { "TOY_BALLOON" }
            });

            Assert.Equal(2, plan.Atoms.Count);
            Assert.Equal("TOY_BALLOON", plan.Atoms[0].AtomCode);
            Assert.Contains(plan.Activities, a => a.ActivityType == "EXPOSE_CARD");
            Assert.Contains(plan.Activities, a => a.ActivityType == "INTERACT_COUNT");
            Assert.Contains(plan.Activities, a => a.ActivityType == "MINI_CHALLENGE" && a.Options.Count >= 2);
        }

        [Fact]
        public async Task BuildCurriculumWithAiAsync_PersistsCustomAtomsIsolatedPerTenant()
        {
            await using var db = CreateInMemoryDb(nameof(BuildCurriculumWithAiAsync_PersistsCustomAtomsIsolatedPerTenant));
            var tenantA = Guid.NewGuid();
            var tenantB = Guid.NewGuid();
            var service = new KidsCurriculumService(db, NullLogger<KidsCurriculumService>.Instance);

            var created = await service.BuildCurriculumWithAiAsync(tenantA, new AiBuildKidsCurriculumRequestDto
            {
                TopicTitle = "Khủng long kỷ Jura",
                IslandId = "science",
                AgeBand = "6-8",
                ItemCount = 3
            });

            Assert.True(created.Success);
            Assert.Equal(3, created.Atoms.Count);

            var atomsA = await service.GetConceptAtomsAsync(tenantA, "science", "6-8");
            var atomsB = await service.GetConceptAtomsAsync(tenantB, "science", "6-8");

            Assert.Contains(atomsA, a => a.SecondaryText.Contains("Khủng long"));
            Assert.DoesNotContain(atomsB, a => a.SecondaryText.Contains("Khủng long"));
        }

        [Fact]
        public async Task SaveAndPickStageThemeAsync_SupportsDbDrivenDynamicStages()
        {
            await using var db = CreateInMemoryDb(nameof(SaveAndPickStageThemeAsync_SupportsDbDrivenDynamicStages));
            var tenantId = Guid.NewGuid();
            var service = new KidsCurriculumService(db, NullLogger<KidsCurriculumService>.Instance);

            var saved = await service.SaveStageThemeAsync(tenantId, new KidsStageThemeDto
            {
                StageCode = "SPACE_CANDY",
                TitleVi = "Vũ Trụ Kẹo Ngọt",
                TitleEn = "Space Candy",
                Environment = "SPACE",
                ParticleMode = "fairy",
                SfxType = "unwrap",
                BadgeEmoji = "🪐",
                PreferredIslands = new List<string> { "fairytale" },
                Props = new List<KidsStagePropDto>
                {
                    new() { Emoji = "🪐", LabelVi = "Hành Tinh Kẹo", LabelEn = "Candy Planet", ColorHex = "#a855f7" }
                }
            });

            var plan = await service.GenerateDailyAdventureAsync(tenantId, new GenerateKidsAdventureRequestDto
            {
                IslandId = "fairytale",
                PreferredStageCode = saved.StageCode
            });

            Assert.NotNull(plan.StageTheme);
            Assert.Equal("SPACE_CANDY", plan.StageTheme!.StageCode);
            Assert.Single(plan.StageTheme.Props);
        }
    }
}
