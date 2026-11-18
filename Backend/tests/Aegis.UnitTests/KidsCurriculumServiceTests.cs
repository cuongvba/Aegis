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
        public async Task YouthCreatorBundle_PendingUntilApprovedAndSupportsGratitude()
        {
            await using var db = CreateInMemoryDb(nameof(YouthCreatorBundle_PendingUntilApprovedAndSupportsGratitude));
            var tenantId = Guid.NewGuid();
            var service = new KidsCurriculumService(db, NullLogger<KidsCurriculumService>.Instance);

            var submitted = await service.SubmitCreatorBundleAsync(tenantId, new SubmitKidsCreatorBundleDto
            {
                AuthorName = "Minh Anh",
                AuthorClass = "Lớp 10A2",
                CreatorDream = "Mong các em nhỏ luôn yêu thiên nhiên",
                CustomStage = new KidsStageThemeDto
                {
                    TitleVi = "Khu Vườn Đom Đóm",
                    TitleEn = "Firefly Garden",
                    BadgeEmoji = "✨",
                    PreferredIslands = new List<string> { "fairytale" }
                },
                Atoms = new List<KidsConceptAtomDto>
                {
                    new()
                    {
                        IslandId = "fairytale",
                        AgeBand = "3-5",
                        Emoji = "🐞",
                        PrimaryText = "Ladybug",
                        SecondaryText = "Bọ rùa xinh"
                    }
                }
            });

            Assert.True(submitted.Success);
            Assert.Equal("PENDING_REVIEW", submitted.Status);
            Assert.Single(submitted.AtomCodes);

            // Hidden from kids before approval
            var publicBefore = await service.GetConceptAtomsAsync(tenantId, "fairytale", "3-5", includePending: false);
            Assert.DoesNotContain(publicBefore, a => a.AtomCode == submitted.AtomCodes[0]);

            // Approve atom & stage
            Assert.True(await service.ModerateContributionAsync(tenantId, submitted.AtomCodes[0], approve: true));
            Assert.True(await service.ModerateContributionAsync(tenantId, submitted.StageCode!, approve: true));

            var publicAfter = await service.GetConceptAtomsAsync(tenantId, "fairytale", "3-5", includePending: false);
            Assert.Contains(publicAfter, a => a.AtomCode == submitted.AtomCodes[0] && a.AuthorName == "Minh Anh");

            int stars = await service.GiveGratitudeAsync(tenantId, submitted.AtomCodes[0]);
            Assert.Equal(1, stars);
        }

        [Fact]
        public async Task AiSynthesizeCreatorBundleAsync_ProducesStageAndAtomsDraft()
        {
            await using var db = CreateInMemoryDb(nameof(AiSynthesizeCreatorBundleAsync_ProducesStageAndAtomsDraft));
            var service = new KidsCurriculumService(db, NullLogger<KidsCurriculumService>.Instance);

            var draft = await service.AiSynthesizeCreatorBundleAsync(Guid.NewGuid(), new AiBuildKidsCurriculumRequestDto
            {
                TopicTitle = "Bốn Mùa Yêu Thương",
                IslandId = "fairytale",
                AgeBand = "3-5",
                ItemCount = 3
            });

            Assert.NotNull(draft.CustomStage);
            Assert.Equal(3, draft.Atoms.Count);
            Assert.False(string.IsNullOrWhiteSpace(draft.CreatorDream));
        }

        [Fact]
        public async Task LocaleProfiles_SupportsUnboundedDynamicRegistrationFromDb()
        {
            await using var db = CreateInMemoryDb(nameof(LocaleProfiles_SupportsUnboundedDynamicRegistrationFromDb));
            var tenantId = Guid.NewGuid();
            var service = new KidsCurriculumService(db, NullLogger<KidsCurriculumService>.Instance);

            var defaults = await service.GetLocaleProfilesAsync(tenantId);
            Assert.Contains(defaults, l => l.LocaleCode == "ar-SA" && l.Direction == "rtl");

            await service.SaveLocaleProfileAsync(tenantId, new KidsLocaleProfileDto
            {
                LocaleCode = "th-TH",
                LangCode = "th",
                NativeName = "ภาษาไทย",
                FlagEmoji = "🇹🇭",
                Direction = "ltr",
                SpeechTag = "th-TH",
                CulturalScaleId = "eastern_pentatonic",
                RegionCode = "TH"
            });

            var updated = await service.GetLocaleProfilesAsync(tenantId);
            Assert.Contains(updated, l => l.LocaleCode == "th-TH" && l.NativeName == "ภาษาไทย" && !l.IsSystemDefault);
        }

        [Fact]
        public async Task HeritageKingdom_PrioritizesNationalHeroesAndLacHongStage()
        {
            await using var db = CreateInMemoryDb(nameof(HeritageKingdom_PrioritizesNationalHeroesAndLacHongStage));
            var service = new KidsCurriculumService(db, NullLogger<KidsCurriculumService>.Instance);

            var plan = await service.GenerateDailyAdventureAsync(Guid.NewGuid(), new GenerateKidsAdventureRequestDto
            {
                IslandId = "heritage",
                RegionCode = "VN",
                AtomCount = 3
            });

            Assert.NotNull(plan.StageTheme);
            Assert.Equal("VN_LAC_HONG_HERITAGE", plan.StageTheme!.StageCode);
            Assert.Equal(3, plan.Atoms.Count);
            Assert.All(plan.Atoms, a => Assert.Equal("VN", a.RegionCode));
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

        [Fact]
        public async Task HeritageAiSkill_LoadsAndBuildsRegionGroundedCurriculum()
        {
            await using var db = CreateInMemoryDb(nameof(HeritageAiSkill_LoadsAndBuildsRegionGroundedCurriculum));
            var tenantId = Guid.NewGuid();
            var service = new KidsCurriculumService(db, NullLogger<KidsCurriculumService>.Instance);

            var skills = await service.GetAiSkillsAsync(tenantId, "heritage");
            var heritageSkill = Assert.Single(skills, s => s.SkillCode == "KIDS_HERITAGE_MYTHOLOGIST");
            Assert.NotEmpty(heritageSkill.PedagogicalRules);
            Assert.Contains("{{regionCode}}", heritageSkill.CurriculumPromptTemplate);

            var res = await service.BuildCurriculumWithAiAsync(tenantId, new AiBuildKidsCurriculumRequestDto
            {
                TopicTitle = "Hai Bà Trưng",
                IslandId = "heritage",
                AgeBand = "6-8",
                ItemCount = 3,
                RegionCode = "VN",
                LanguageCode = "vi"
            });

            Assert.True(res.Success);
            Assert.Equal("KIDS_HERITAGE_MYTHOLOGIST", res.SkillCodeUsed);
            Assert.Equal(3, res.Atoms.Count);
            Assert.All(res.Atoms, a => Assert.Equal("VN", a.RegionCode));
        }

        [Fact]
        public async Task HeritageAiSynthesizeBundle_CreatesHeritageStageAndAtoms()
        {
            await using var db = CreateInMemoryDb(nameof(HeritageAiSynthesizeBundle_CreatesHeritageStageAndAtoms));
            var service = new KidsCurriculumService(db, NullLogger<KidsCurriculumService>.Instance);

            var draft = await service.AiSynthesizeCreatorBundleAsync(Guid.NewGuid(), new AiBuildKidsCurriculumRequestDto
            {
                TopicTitle = "Trần Hưng Đạo",
                IslandId = "heritage",
                AgeBand = "6-8",
                ItemCount = 3,
                RegionCode = "VN",
                LanguageCode = "vi"
            });

            Assert.NotNull(draft.CustomStage);
            Assert.Equal("HERITAGE", draft.CustomStage!.Environment);
            Assert.Equal("VN", draft.CustomStage.RegionCode);
            Assert.Equal(3, draft.Atoms.Count);
        }
    }
}
