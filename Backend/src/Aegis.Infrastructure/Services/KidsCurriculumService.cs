using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;
using Aegis.Application.Interfaces;
using Aegis.Application.Models.AI;
using Aegis.Domain.Entities;
using Aegis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Aegis.Infrastructure.Services
{
    public class KidsCurriculumService : IKidsCurriculumService
    {
        private const string KidsAtomCoordinateType = "KIDS_CONCEPT_ATOM";
        private const string KidsStageCoordinateType = "KIDS_STAGE_THEME";
        private const string KidsLocaleCoordinateType = "KIDS_LOCALE_PROFILE";
        private const string EmbeddedResourceName = "Aegis.Application.Resources.Taxonomies.default_kids_concept_atoms.json";
        private const string EmbeddedStagesResourceName = "Aegis.Application.Resources.Taxonomies.default_kids_stages.json";
        private const string EmbeddedLocalesResourceName = "Aegis.Application.Resources.Taxonomies.default_kids_locales.json";

        private static readonly JsonSerializerOptions JsonOpts = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private static readonly Lazy<List<KidsConceptAtomDto>> DefaultAtomsCache = new(LoadEmbeddedAtoms);
        private static readonly Lazy<List<KidsStageThemeDto>> DefaultStagesCache = new(LoadEmbeddedStages);
        private static readonly Lazy<List<KidsLocaleProfileDto>> DefaultLocalesCache = new(LoadEmbeddedLocales);

        private readonly AegisDbContext _db;
        private readonly ILogger<KidsCurriculumService> _logger;
        private readonly IUniversalAiRouter? _aiRouter;

        public KidsCurriculumService(
            AegisDbContext db,
            ILogger<KidsCurriculumService> logger,
            IUniversalAiRouter? aiRouter = null)
        {
            _db = db;
            _logger = logger;
            _aiRouter = aiRouter;
        }

        public async Task<List<KidsConceptAtomDto>> GetConceptAtomsAsync(
            Guid tenantId,
            string? islandId = null,
            string? ageBand = null,
            bool includePending = false,
            CancellationToken ct = default)
        {
            var atoms = DefaultAtomsCache.Value.Select(CloneAtom).ToList();

            var customPresets = await _db.TenantCoordinatePresets
                .AsNoTracking()
                .Where(p => p.CoordinateType == KidsAtomCoordinateType &&
                            (p.TenantId == tenantId || p.TenantId == Guid.Empty))
                .OrderBy(p => p.DisplayOrder)
                .ThenBy(p => p.CreatedAt)
                .ToListAsync(ct);

            foreach (var preset in customPresets)
            {
                if (string.IsNullOrWhiteSpace(preset.SynonymsJson)) continue;
                try
                {
                    var atom = JsonSerializer.Deserialize<KidsConceptAtomDto>(preset.SynonymsJson, JsonOpts);
                    if (atom == null || string.IsNullOrWhiteSpace(atom.AtomCode)) continue;
                    if (!includePending && !string.Equals(atom.Status, "APPROVED", StringComparison.OrdinalIgnoreCase))
                        continue;

                    int idx = atoms.FindIndex(a => string.Equals(a.AtomCode, atom.AtomCode, StringComparison.OrdinalIgnoreCase));
                    if (idx >= 0) atoms[idx] = atom;
                    else atoms.Add(atom);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "[KidsGenesis] Invalid custom atom JSON | Code={Code}", preset.PresetCode);
                }
            }

            if (!string.IsNullOrWhiteSpace(islandId) && !string.Equals(islandId, "all", StringComparison.OrdinalIgnoreCase))
            {
                string normIsland = islandId.Trim().ToLowerInvariant();
                atoms = atoms.Where(a => string.Equals(a.IslandId, normIsland, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            if (!string.IsNullOrWhiteSpace(ageBand) && !string.Equals(ageBand, "all", StringComparison.OrdinalIgnoreCase))
            {
                string normAge = ageBand.Trim();
                var ageFiltered = atoms.Where(a => string.Equals(a.AgeBand, normAge, StringComparison.OrdinalIgnoreCase)).ToList();
                if (ageFiltered.Count > 0) atoms = ageFiltered;
            }

            return atoms.OrderBy(a => a.Order).ToList();
        }

        public async Task<KidsLessonPlanDto> GenerateDailyAdventureAsync(
            Guid tenantId,
            GenerateKidsAdventureRequestDto request,
            CancellationToken ct = default)
        {
            string island = string.IsNullOrWhiteSpace(request?.IslandId) ? "english" : request.IslandId.Trim().ToLowerInvariant();
            string ageBand = string.IsNullOrWhiteSpace(request?.AgeBand) ? "all" : request.AgeBand.Trim();
            int atomCount = Math.Clamp(request?.AtomCount ?? 3, 1, 6);
            var weakSet = new HashSet<string>(request?.WeakAtomCodes ?? Enumerable.Empty<string>(), StringComparer.OrdinalIgnoreCase);

            var allIslandAtoms = await GetConceptAtomsAsync(tenantId, island, ageBand, false, ct);
            if (allIslandAtoms.Count == 0)
                allIslandAtoms = await GetConceptAtomsAsync(tenantId, "all", "all", false, ct);

            // FSRS-driven + Region-first priority: 1) Weak/due atoms, 2) Matching RegionCode (e.g. VN heritage), 3) Order
            string? normRegion = string.IsNullOrWhiteSpace(request?.RegionCode) ? null : request.RegionCode.Trim().ToUpperInvariant();
            var selected = allIslandAtoms
                .OrderByDescending(a => weakSet.Contains(a.AtomCode))
                .ThenByDescending(a => normRegion != null && string.Equals(a.RegionCode, normRegion, StringComparison.OrdinalIgnoreCase))
                .ThenBy(a => a.Order)
                .ThenBy(_ => Random.Shared.Next())
                .Take(atomCount)
                .ToList();

            var activities = SynthesizeActivities(selected, allIslandAtoms);
            var stageTheme = await PickDynamicStageAsync(tenantId, island, request?.PreferredStageCode, normRegion, ct);

            _logger.LogInformation(
                "[KidsGenesis] Generated adventure | TenantId={TenantId} Island={Island} Stage={Stage} Atoms={Atoms} Activities={Activities}",
                tenantId, island, stageTheme.StageCode, selected.Count, activities.Count);

            return new KidsLessonPlanDto
            {
                LessonId = $"KIDS_{island.ToUpperInvariant()}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                IslandId = island,
                AgeBand = ageBand,
                AtomCount = selected.Count,
                ActivityCount = activities.Count,
                StageTheme = stageTheme,
                Atoms = selected,
                Activities = activities
            };
        }

        public async Task<List<KidsStageThemeDto>> GetStageThemesAsync(Guid tenantId, bool includePending = false, CancellationToken ct = default)
        {
            var stages = DefaultStagesCache.Value.ToList();
            var custom = await _db.TenantCoordinatePresets
                .AsNoTracking()
                .Where(p => p.CoordinateType == KidsStageCoordinateType &&
                            (p.TenantId == tenantId || p.TenantId == Guid.Empty))
                .OrderBy(p => p.CreatedAt)
                .ToListAsync(ct);

            foreach (var preset in custom)
            {
                if (string.IsNullOrWhiteSpace(preset.SynonymsJson)) continue;
                try
                {
                    var st = JsonSerializer.Deserialize<KidsStageThemeDto>(preset.SynonymsJson, JsonOpts);
                    if (st == null || string.IsNullOrWhiteSpace(st.StageCode)) continue;
                    if (!includePending && !string.Equals(st.Status, "APPROVED", StringComparison.OrdinalIgnoreCase))
                        continue;

                    st.IsSystemDefault = false;
                    int idx = stages.FindIndex(x => string.Equals(x.StageCode, st.StageCode, StringComparison.OrdinalIgnoreCase));
                    if (idx >= 0) stages[idx] = st;
                    else stages.Add(st);
                }
                catch { }
            }

            return stages;
        }

        public async Task<KidsCreatorBundleResponseDto> SubmitCreatorBundleAsync(
            Guid tenantId,
            SubmitKidsCreatorBundleDto bundle,
            CancellationToken ct = default)
        {
            if (bundle == null) throw new ArgumentNullException(nameof(bundle));
            string authorName = string.IsNullOrWhiteSpace(bundle.AuthorName) ? "Tác giả trẻ Aegis" : bundle.AuthorName.Trim();
            string? authorClass = string.IsNullOrWhiteSpace(bundle.AuthorClass) ? null : bundle.AuthorClass.Trim();
            string? dream = string.IsNullOrWhiteSpace(bundle.CreatorDream) ? null : bundle.CreatorDream.Trim();

            // Child-Safe Gate: Community contributions start as PENDING_REVIEW
            const string initialStatus = "PENDING_REVIEW";
            string? savedStageCode = null;

            if (bundle.CustomStage != null && !string.IsNullOrWhiteSpace(bundle.CustomStage.TitleVi))
            {
                bundle.CustomStage.AuthorName = authorName;
                bundle.CustomStage.AuthorClass = authorClass;
                bundle.CustomStage.CreatorDream = dream;
                bundle.CustomStage.Status = initialStatus;
                var savedStage = await SaveStageThemeAsync(tenantId, bundle.CustomStage, ct);
                savedStageCode = savedStage.StageCode;
            }

            var atomCodes = new List<string>();
            int order = 200;
            foreach (var atom in bundle.Atoms ?? Enumerable.Empty<KidsConceptAtomDto>())
            {
                if (string.IsNullOrWhiteSpace(atom.PrimaryText) && string.IsNullOrWhiteSpace(atom.SecondaryText))
                    continue;

                atom.AtomCode = string.IsNullOrWhiteSpace(atom.AtomCode)
                    ? $"YOUTH_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{order}"
                    : atom.AtomCode.Trim().ToUpperInvariant();
                atom.AuthorName = authorName;
                atom.AuthorClass = authorClass;
                atom.CreatorDream = dream;
                atom.Status = initialStatus;
                atom.IsCommunityContribution = true;
                atom.Order = order++;

                string json = JsonSerializer.Serialize(atom, JsonOpts);
                _db.TenantCoordinatePresets.Add(new TenantCoordinatePreset
                {
                    TenantId = tenantId,
                    DomainCode = "KIDS_WORLD",
                    CoordinateType = KidsAtomCoordinateType,
                    PresetCode = atom.AtomCode,
                    PresetLabel = atom.SecondaryText ?? atom.PrimaryText,
                    SynonymsJson = json,
                    DisplayOrder = atom.Order
                });
                atomCodes.Add(atom.AtomCode);
            }

            await _db.SaveChangesAsync(ct);
            _logger.LogInformation(
                "[KidsCreator] Submitted bundle | TenantId={TenantId} Author={Author} Stage={Stage} Atoms={Count}",
                tenantId, authorName, savedStageCode ?? "NONE", atomCodes.Count);

            return new KidsCreatorBundleResponseDto
            {
                Success = true,
                Status = initialStatus,
                StageCode = savedStageCode,
                AtomCodes = atomCodes,
                Message = "Cảm ơn tác giả trẻ! Tác phẩm & sân khấu của bạn đã được gửi vào hàng đợi duyệt an toàn cho các em nhỏ."
            };
        }

        public async Task<bool> ModerateContributionAsync(Guid tenantId, string presetCode, bool approve, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(presetCode)) return false;
            string code = presetCode.Trim().ToUpperInvariant();

            var preset = await _db.TenantCoordinatePresets.FirstOrDefaultAsync(
                p => (p.TenantId == tenantId || p.TenantId == Guid.Empty) &&
                     p.PresetCode == code &&
                     (p.CoordinateType == KidsAtomCoordinateType || p.CoordinateType == KidsStageCoordinateType),
                ct);

            if (preset == null || string.IsNullOrWhiteSpace(preset.SynonymsJson)) return false;
            string nextStatus = approve ? "APPROVED" : "REJECTED";

            if (preset.CoordinateType == KidsStageCoordinateType)
            {
                var st = JsonSerializer.Deserialize<KidsStageThemeDto>(preset.SynonymsJson, JsonOpts);
                if (st == null) return false;
                st.Status = nextStatus;
                preset.SynonymsJson = JsonSerializer.Serialize(st, JsonOpts);
            }
            else
            {
                var atom = JsonSerializer.Deserialize<KidsConceptAtomDto>(preset.SynonymsJson, JsonOpts);
                if (atom == null) return false;
                atom.Status = nextStatus;
                preset.SynonymsJson = JsonSerializer.Serialize(atom, JsonOpts);
            }

            await _db.SaveChangesAsync(ct);
            return true;
        }

        public async Task<int> GiveGratitudeAsync(Guid tenantId, string presetCode, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(presetCode)) return 0;
            string code = presetCode.Trim().ToUpperInvariant();

            var preset = await _db.TenantCoordinatePresets.FirstOrDefaultAsync(
                p => (p.TenantId == tenantId || p.TenantId == Guid.Empty) &&
                     p.PresetCode == code &&
                     (p.CoordinateType == KidsAtomCoordinateType || p.CoordinateType == KidsStageCoordinateType),
                ct);

            if (preset == null || string.IsNullOrWhiteSpace(preset.SynonymsJson)) return 0;

            int updatedCount = 0;
            if (preset.CoordinateType == KidsStageCoordinateType)
            {
                var st = JsonSerializer.Deserialize<KidsStageThemeDto>(preset.SynonymsJson, JsonOpts);
                if (st != null)
                {
                    st.GratitudeCount++;
                    updatedCount = st.GratitudeCount;
                    preset.SynonymsJson = JsonSerializer.Serialize(st, JsonOpts);
                }
            }
            else
            {
                var atom = JsonSerializer.Deserialize<KidsConceptAtomDto>(preset.SynonymsJson, JsonOpts);
                if (atom != null)
                {
                    atom.GratitudeCount++;
                    updatedCount = atom.GratitudeCount;
                    preset.SynonymsJson = JsonSerializer.Serialize(atom, JsonOpts);
                }
            }

            await _db.SaveChangesAsync(ct);
            return updatedCount;
        }

        public async Task<SubmitKidsCreatorBundleDto> AiSynthesizeCreatorBundleAsync(
            Guid tenantId,
            AiBuildKidsCurriculumRequestDto request,
            CancellationToken ct = default)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.TopicTitle))
                throw new ArgumentException("TopicTitle is required.");

            string topic = request.TopicTitle.Trim();
            string island = string.IsNullOrWhiteSpace(request.IslandId) ? "fairytale" : request.IslandId.Trim().ToLowerInvariant();
            string ageBand = string.IsNullOrWhiteSpace(request.AgeBand) ? "3-5" : request.AgeBand.Trim();
            int count = Math.Clamp(request.ItemCount, 2, 6);

            if (_aiRouter != null)
            {
                try
                {
                    string prompt = $@"Design a magical preschool/primary interactive stage and {count} learning atoms for topic: '{topic}', age '{ageBand}', island '{island}'.
Return ONLY valid JSON (no markdown) with schema:
{{
  ""creatorDream"": ""short warm pedagogical wish in Vietnamese"",
  ""customStage"": {{
    ""titleVi"": ""Vietnamese stage title"",
    ""titleEn"": ""English stage title"",
    ""environment"": ""SKY|OCEAN|FAIRYTALE|MEADOW"",
    ""particleMode"": ""sky|ocean|fairy|meadow"",
    ""sfxType"": ""pop|splash|unwrap|bounce"",
    ""backgroundGradient"": ""from-fuchsia-500 via-purple-600 to-indigo-700"",
    ""badgeEmoji"": ""1 emoji"",
    ""props"": [{{ ""emoji"": ""1 emoji"", ""labelVi"": ""short label"", ""labelEn"": ""short label"", ""colorHex"": ""#ec4899"" }}]
  }},
  ""atoms"": [
    {{ ""emoji"": ""1 emoji"", ""primaryText"": ""English"", ""secondaryText"": ""Vietnamese"", ""phonetic"": ""optional"", ""sampleSentenceVi"": ""warm story sentence"", ""sampleSentenceEn"": ""warm English sentence"", ""funFactVi"": ""kid fun fact"", ""funFactEn"": ""kid fun fact EN"" }}
  ]
}}";

                    var aiRes = await _aiRouter.ExecuteAsync(new AiExecutionRequest
                    {
                        TenantId = tenantId == Guid.Empty ? null : tenantId.ToString(),
                        SystemPrompt = "You are a world-class Montessori & Early-Childhood Curriculum Architect. Output strictly valid JSON.",
                        Prompt = prompt
                    });

                    if (aiRes.Success && !string.IsNullOrWhiteSpace(aiRes.Content))
                    {
                        int start = aiRes.Content.IndexOf('{');
                        int end = aiRes.Content.LastIndexOf('}');
                        if (start >= 0 && end > start)
                        {
                            var parsed = JsonSerializer.Deserialize<SubmitKidsCreatorBundleDto>(
                                aiRes.Content.Substring(start, end - start + 1), JsonOpts);
                            if (parsed != null && parsed.Atoms.Count > 0)
                            {
                                foreach (var a in parsed.Atoms)
                                {
                                    a.IslandId = island;
                                    a.AgeBand = ageBand;
                                }
                                return parsed;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[KidsCreator] AI synthesize bundle fallback | Topic={Topic}", topic);
                }
            }

            // Smart deterministic fallback so teachers always get an instant ready-to-edit draft
            var fallbackAtoms = BuildDeterministicFallbackAtoms(topic, island, ageBand, count);
            return new SubmitKidsCreatorBundleDto
            {
                CreatorDream = $"Chúc các bé khám phá chủ đề \"{topic}\" thật vui và đầy ắp tiếng cười!",
                CustomStage = new KidsStageThemeDto
                {
                    TitleVi = $"Thế Giới {topic}",
                    TitleEn = $"{topic} Wonderland",
                    Environment = "FAIRYTALE",
                    ParticleMode = "fairy",
                    SfxType = "unwrap",
                    BackgroundGradient = "from-fuchsia-500 via-purple-600 to-indigo-700",
                    BadgeEmoji = "✨",
                    PreferredIslands = new List<string> { island },
                    Props = fallbackAtoms.Select((a, idx) => new KidsStagePropDto
                    {
                        Emoji = a.Emoji,
                        LabelVi = $"{topic} #{idx + 1}",
                        LabelEn = $"{topic} #{idx + 1}",
                        ColorHex = idx % 2 == 0 ? "#ec4899" : "#f59e0b"
                    }).ToList()
                },
                Atoms = fallbackAtoms
            };
        }

        public async Task<KidsStageThemeDto> SaveStageThemeAsync(Guid tenantId, KidsStageThemeDto stage, CancellationToken ct = default)
        {
            if (stage == null) throw new ArgumentNullException(nameof(stage));
            string code = string.IsNullOrWhiteSpace(stage.StageCode)
                ? $"STAGE_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}"
                : stage.StageCode.Trim().ToUpperInvariant();

            stage.StageCode = code;
            stage.IsSystemDefault = false;
            if (stage.Props == null || stage.Props.Count == 0)
            {
                stage.Props = new List<KidsStagePropDto>
                {
                    new() { Emoji = stage.BadgeEmoji, LabelVi = stage.TitleVi, LabelEn = stage.TitleEn, ColorHex = "#f59e0b" }
                };
            }

            string json = JsonSerializer.Serialize(stage, JsonOpts);
            var existing = await _db.TenantCoordinatePresets.FirstOrDefaultAsync(
                p => p.TenantId == tenantId && p.CoordinateType == KidsStageCoordinateType && p.PresetCode == code,
                ct);

            if (existing != null)
            {
                existing.PresetLabel = stage.TitleVi;
                existing.SynonymsJson = json;
            }
            else
            {
                _db.TenantCoordinatePresets.Add(new TenantCoordinatePreset
                {
                    TenantId = tenantId,
                    DomainCode = "KIDS_WORLD",
                    CoordinateType = KidsStageCoordinateType,
                    PresetCode = code,
                    PresetLabel = stage.TitleVi,
                    SynonymsJson = json
                });
            }

            await _db.SaveChangesAsync(ct);
            return stage;
        }

        private async Task<KidsStageThemeDto> PickDynamicStageAsync(
            Guid tenantId,
            string island,
            string? preferredStageCode,
            string? regionCode,
            CancellationToken ct)
        {
            var all = await GetStageThemesAsync(tenantId, false, ct);
            if (!string.IsNullOrWhiteSpace(preferredStageCode))
            {
                var exact = all.FirstOrDefault(s => string.Equals(s.StageCode, preferredStageCode.Trim(), StringComparison.OrdinalIgnoreCase));
                if (exact != null) return exact;
            }

            var matching = all.Where(s => s.PreferredIslands.Any(i => string.Equals(i, island, StringComparison.OrdinalIgnoreCase))).ToList();
            if (!string.IsNullOrWhiteSpace(regionCode))
            {
                var regional = matching.Where(s => string.Equals(s.RegionCode, regionCode, StringComparison.OrdinalIgnoreCase)).ToList();
                if (regional.Count > 0) return regional[Random.Shared.Next(regional.Count)];
            }
            var pool = matching.Count > 0 ? matching : all;
            return pool.Count > 0 ? pool[Random.Shared.Next(pool.Count)] : new KidsStageThemeDto();
        }

        public async Task<AiBuildKidsCurriculumResponseDto> BuildCurriculumWithAiAsync(
            Guid tenantId,
            AiBuildKidsCurriculumRequestDto request,
            CancellationToken ct = default)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.TopicTitle))
                throw new ArgumentException("TopicTitle is required.");

            string topic = request.TopicTitle.Trim();
            string island = string.IsNullOrWhiteSpace(request.IslandId) ? "explore" : request.IslandId.Trim().ToLowerInvariant();
            string ageBand = string.IsNullOrWhiteSpace(request.AgeBand) ? "6-8" : request.AgeBand.Trim();
            int count = Math.Clamp(request.ItemCount, 2, 6);

            List<KidsConceptAtomDto>? generatedAtoms = null;
            bool usedAi = false;

            if (_aiRouter != null)
            {
                try
                {
                    string prompt = $@"Generate exactly {count} atomic kids learning concepts for topic '{topic}', age '{ageBand}', island '{island}'.
Return ONLY a JSON array (no markdown fences) where each object has:
atomCode (UPPER_SNAKE_CASE), emoji (1 emoji), primaryText (short English label/expression), secondaryText (short Vietnamese meaning),
phonetic (optional IPA), numericValue (integer or null), sampleSentenceEn, sampleSentenceVi, funFactEn, funFactVi.";

                    var aiRes = await _aiRouter.ExecuteAsync(new AiExecutionRequest
                    {
                        TenantId = tenantId == Guid.Empty ? null : tenantId.ToString(),
                        SystemPrompt = "You are an expert early-childhood Montessori & Glenn Doman curriculum designer. Output strictly valid JSON array.",
                        Prompt = prompt
                    });

                    if (aiRes.Success && !string.IsNullOrWhiteSpace(aiRes.Content))
                    {
                        string cleaned = ExtractJsonArray(aiRes.Content);
                        var parsed = JsonSerializer.Deserialize<List<KidsConceptAtomDto>>(cleaned, JsonOpts);
                        if (parsed != null && parsed.Count > 0)
                        {
                            generatedAtoms = parsed;
                            usedAi = true;
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[KidsGenesis] AI router fallback to deterministic template builder | Topic={Topic}", topic);
                }
            }

            if (generatedAtoms == null || generatedAtoms.Count == 0)
            {
                generatedAtoms = BuildDeterministicFallbackAtoms(topic, island, ageBand, count);
            }

            int order = 100;
            foreach (var atom in generatedAtoms)
            {
                atom.IslandId = island;
                atom.AgeBand = ageBand;
                atom.Order = order++;
                atom.IsAiGenerated = usedAi;
                if (string.IsNullOrWhiteSpace(atom.AtomCode))
                    atom.AtomCode = $"CUSTOM_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{order}";
                atom.AtomCode = atom.AtomCode.Trim().ToUpperInvariant();

                string json = JsonSerializer.Serialize(atom, JsonOpts);
                var existing = await _db.TenantCoordinatePresets.FirstOrDefaultAsync(
                    p => p.TenantId == tenantId && p.CoordinateType == KidsAtomCoordinateType && p.PresetCode == atom.AtomCode,
                    ct);

                if (existing != null)
                {
                    existing.PresetLabel = atom.PrimaryText;
                    existing.SynonymsJson = json;
                }
                else
                {
                    _db.TenantCoordinatePresets.Add(new TenantCoordinatePreset
                    {
                        TenantId = tenantId,
                        DomainCode = "KIDS_WORLD",
                        CoordinateType = KidsAtomCoordinateType,
                        PresetCode = atom.AtomCode,
                        PresetLabel = atom.PrimaryText,
                        SynonymsJson = json,
                        DisplayOrder = atom.Order
                    });
                }
            }

            await _db.SaveChangesAsync(ct);

            return new AiBuildKidsCurriculumResponseDto
            {
                Success = true,
                UsedAi = usedAi,
                IslandId = island,
                Atoms = generatedAtoms,
                Message = usedAi
                    ? $"AI đã tự động biên soạn {generatedAtoms.Count} hạt nhân tri thức cho chủ đề \"{topic}\"."
                    : $"Đã khởi tạo {generatedAtoms.Count} hạt nhân tri thức mẫu cho chủ đề \"{topic}\"."
            };
        }

        private static List<KidsActivityDto> SynthesizeActivities(
            List<KidsConceptAtomDto> selected,
            List<KidsConceptAtomDto> distractorPool)
        {
            var activities = new List<KidsActivityDto>();
            int seq = 1;

            // Phase 1 & 2: Expose + Interactive Count/Speak per atom
            foreach (var atom in selected)
            {
                activities.Add(new KidsActivityDto
                {
                    ActivityId = $"ACT_{seq++}_{atom.AtomCode}_EXPOSE",
                    AtomCode = atom.AtomCode,
                    ActivityType = "EXPOSE_CARD",
                    TitleVi = "Khám phá điều kỳ diệu",
                    TitleEn = "Discover & Listen",
                    PromptVi = atom.SampleSentenceVi,
                    PromptEn = atom.SampleSentenceEn,
                    SpeechTextVi = $"{atom.SecondaryText}. {atom.SampleSentenceVi}",
                    SpeechTextEn = $"{atom.PrimaryText}. {atom.SampleSentenceEn}",
                    Emoji = atom.Emoji,
                    PrimaryText = atom.PrimaryText,
                    SecondaryText = atom.SecondaryText,
                    Phonetic = atom.Phonetic,
                    FunFactVi = atom.FunFactVi,
                    FunFactEn = atom.FunFactEn
                });

                if (atom.NumericValue.HasValue && atom.NumericValue.Value > 0 && atom.NumericValue.Value <= 15)
                {
                    int target = atom.NumericValue.Value;
                    var numChoices = new HashSet<int> { target };
                    while (numChoices.Count < 4)
                    {
                        int delta = Random.Shared.Next(-3, 4);
                        int candidate = Math.Max(1, target + delta);
                        numChoices.Add(candidate);
                    }

                    activities.Add(new KidsActivityDto
                    {
                        ActivityId = $"ACT_{seq++}_{atom.AtomCode}_COUNT",
                        AtomCode = atom.AtomCode,
                        ActivityType = "INTERACT_COUNT",
                        TitleVi = "Chạm đếm cùng AstroOwl",
                        TitleEn = "Count & Tap!",
                        PromptVi = $"Bé hãy đếm xem có bao nhiêu {atom.Emoji} và chọn số đúng nhé!",
                        PromptEn = $"Count the {atom.Emoji} and tap the matching number!",
                        SpeechTextVi = $"Bé hãy đếm xem có bao nhiêu hình rồi chọn số đúng nhé!",
                        SpeechTextEn = $"Count how many there are and tap the right number!",
                        Emoji = atom.Emoji,
                        PrimaryText = atom.PrimaryText,
                        SecondaryText = atom.SecondaryText,
                        VisualCount = target,
                        Options = numChoices
                            .OrderBy(_ => Random.Shared.Next())
                            .Select(n => new KidsChoiceOptionDto
                            {
                                Label = n.ToString(),
                                Emoji = "🔢",
                                Value = n.ToString(),
                                IsCorrect = n == target
                            }).ToList()
                    });
                }
                else
                {
                    activities.Add(new KidsActivityDto
                    {
                        ActivityId = $"ACT_{seq++}_{atom.AtomCode}_SPEAK",
                        AtomCode = atom.AtomCode,
                        ActivityType = "SPEAK_ECHO",
                        TitleVi = "Bé nói to cùng AstroOwl",
                        TitleEn = "Say It Out Loud!",
                        PromptVi = $"Bé hãy đọc to: \"{atom.PrimaryText}\" ({atom.SecondaryText})",
                        PromptEn = $"Say out loud: \"{atom.PrimaryText}\"!",
                        SpeechTextVi = $"Bé hãy đọc to theo bạn Cú nhé: {atom.PrimaryText}",
                        SpeechTextEn = $"Repeat after me: {atom.PrimaryText}",
                        Emoji = atom.Emoji,
                        PrimaryText = atom.PrimaryText,
                        SecondaryText = atom.SecondaryText,
                        Phonetic = atom.Phonetic,
                        TargetSpeakText = atom.PrimaryText
                    });
                }
            }

            // Phase 3: Procedural Mini-Challenge synthesis using distractor atoms
            foreach (var atom in selected)
            {
                var distractors = distractorPool
                    .Where(d => !string.Equals(d.AtomCode, atom.AtomCode, StringComparison.OrdinalIgnoreCase))
                    .OrderBy(_ => Random.Shared.Next())
                    .Take(3)
                    .ToList();

                var choices = new List<KidsChoiceOptionDto>
                {
                    new()
                    {
                        Label = atom.PrimaryText,
                        Emoji = atom.Emoji,
                        Value = atom.AtomCode,
                        IsCorrect = true
                    }
                };
                foreach (var d in distractors)
                {
                    choices.Add(new KidsChoiceOptionDto
                    {
                        Label = d.PrimaryText,
                        Emoji = d.Emoji,
                        Value = d.AtomCode,
                        IsCorrect = false
                    });
                }

                activities.Add(new KidsActivityDto
                {
                    ActivityId = $"ACT_{seq++}_{atom.AtomCode}_QUIZ",
                    AtomCode = atom.AtomCode,
                    ActivityType = "MINI_CHALLENGE",
                    TitleVi = "Thử thách Kho Báu!",
                    TitleEn = "Treasure Challenge!",
                    PromptVi = $"Đâu là \"{atom.SecondaryText}\" ({atom.PrimaryText})?",
                    PromptEn = $"Which one is \"{atom.PrimaryText}\"?",
                    SpeechTextVi = $"Bé tìm giúp bạn Cú đâu là {atom.SecondaryText} nhé!",
                    SpeechTextEn = $"Can you find {atom.PrimaryText}?",
                    Emoji = atom.Emoji,
                    PrimaryText = atom.PrimaryText,
                    SecondaryText = atom.SecondaryText,
                    Options = choices.OrderBy(_ => Random.Shared.Next()).ToList()
                });
            }

            return activities;
        }

        private static List<KidsConceptAtomDto> BuildDeterministicFallbackAtoms(string topic, string island, string ageBand, int count)
        {
            var emojis = new[] { "🌟", "🦊", "🎨", "🧩", "🚀", "🌻" };
            var list = new List<KidsConceptAtomDto>();
            for (int i = 0; i < count; i++)
            {
                list.Add(new KidsConceptAtomDto
                {
                    AtomCode = $"KIDS_{island.ToUpperInvariant()}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{i + 1}",
                    IslandId = island,
                    AgeBand = ageBand,
                    Emoji = emojis[i % emojis.Length],
                    PrimaryText = $"{topic} #{i + 1}",
                    SecondaryText = $"{topic} - Bài {i + 1}",
                    SampleSentenceEn = $"Let's explore {topic} step {i + 1} together!",
                    SampleSentenceVi = $"Cùng khám phá chủ đề {topic} bước {i + 1} nhé!",
                    FunFactEn = $"Curiosity makes your brain stronger every day!",
                    FunFactVi = $"Sự tò mò giúp trí não của bé thông minh hơn mỗi ngày!"
                });
            }
            return list;
        }

        private static string ExtractJsonArray(string raw)
        {
            int start = raw.IndexOf('[');
            int end = raw.LastIndexOf(']');
            return start >= 0 && end > start ? raw.Substring(start, end - start + 1) : raw;
        }

        private static List<KidsConceptAtomDto> LoadEmbeddedAtoms()
        {
            var assembly = typeof(KidsConceptAtomDto).Assembly;
            using Stream? stream = assembly.GetManifestResourceStream(EmbeddedResourceName);
            if (stream == null) return new List<KidsConceptAtomDto>();
            using var reader = new StreamReader(stream);
            return JsonSerializer.Deserialize<List<KidsConceptAtomDto>>(reader.ReadToEnd(), JsonOpts) ?? new List<KidsConceptAtomDto>();
        }

        public async Task<List<KidsLocaleProfileDto>> GetLocaleProfilesAsync(Guid tenantId, CancellationToken ct = default)
        {
            var locales = DefaultLocalesCache.Value.ToList();
            var custom = await _db.TenantCoordinatePresets
                .AsNoTracking()
                .Where(p => p.CoordinateType == KidsLocaleCoordinateType &&
                            (p.TenantId == tenantId || p.TenantId == Guid.Empty))
                .OrderBy(p => p.CreatedAt)
                .ToListAsync(ct);

            foreach (var preset in custom)
            {
                if (string.IsNullOrWhiteSpace(preset.SynonymsJson)) continue;
                try
                {
                    var loc = JsonSerializer.Deserialize<KidsLocaleProfileDto>(preset.SynonymsJson, JsonOpts);
                    if (loc == null || string.IsNullOrWhiteSpace(loc.LocaleCode)) continue;
                    loc.IsSystemDefault = false;
                    int idx = locales.FindIndex(x => string.Equals(x.LocaleCode, loc.LocaleCode, StringComparison.OrdinalIgnoreCase));
                    if (idx >= 0) locales[idx] = loc;
                    else locales.Add(loc);
                }
                catch { }
            }

            return locales;
        }

        public async Task<KidsLocaleProfileDto> SaveLocaleProfileAsync(Guid tenantId, KidsLocaleProfileDto profile, CancellationToken ct = default)
        {
            if (profile == null || string.IsNullOrWhiteSpace(profile.LocaleCode))
                throw new ArgumentException("LocaleCode is required.");

            profile.LocaleCode = profile.LocaleCode.Trim();
            profile.LangCode = string.IsNullOrWhiteSpace(profile.LangCode)
                ? profile.LocaleCode.Split('-')[0].ToLowerInvariant()
                : profile.LangCode.Trim().ToLowerInvariant();
            profile.SpeechTag = string.IsNullOrWhiteSpace(profile.SpeechTag) ? profile.LocaleCode : profile.SpeechTag.Trim();
            profile.Direction = string.Equals(profile.Direction, "rtl", StringComparison.OrdinalIgnoreCase) ? "rtl" : "ltr";
            profile.IsSystemDefault = false;

            string code = profile.LocaleCode.ToUpperInvariant();
            string json = JsonSerializer.Serialize(profile, JsonOpts);

            var existing = await _db.TenantCoordinatePresets.FirstOrDefaultAsync(
                p => p.TenantId == tenantId && p.CoordinateType == KidsLocaleCoordinateType && p.PresetCode == code,
                ct);

            if (existing != null)
            {
                existing.PresetLabel = profile.NativeName;
                existing.SynonymsJson = json;
            }
            else
            {
                _db.TenantCoordinatePresets.Add(new TenantCoordinatePreset
                {
                    TenantId = tenantId,
                    DomainCode = "KIDS_WORLD",
                    CoordinateType = KidsLocaleCoordinateType,
                    PresetCode = code,
                    PresetLabel = profile.NativeName,
                    SynonymsJson = json
                });
            }

            await _db.SaveChangesAsync(ct);
            return profile;
        }

        private static List<KidsStageThemeDto> LoadEmbeddedStages()
        {
            var assembly = typeof(KidsStageThemeDto).Assembly;
            using Stream? stream = assembly.GetManifestResourceStream(EmbeddedStagesResourceName);
            if (stream == null) return new List<KidsStageThemeDto>();
            using var reader = new StreamReader(stream);
            return JsonSerializer.Deserialize<List<KidsStageThemeDto>>(reader.ReadToEnd(), JsonOpts) ?? new List<KidsStageThemeDto>();
        }

        private static List<KidsLocaleProfileDto> LoadEmbeddedLocales()
        {
            var assembly = typeof(KidsLocaleProfileDto).Assembly;
            using Stream? stream = assembly.GetManifestResourceStream(EmbeddedLocalesResourceName);
            if (stream == null) return new List<KidsLocaleProfileDto>();
            using var reader = new StreamReader(stream);
            return JsonSerializer.Deserialize<List<KidsLocaleProfileDto>>(reader.ReadToEnd(), JsonOpts) ?? new List<KidsLocaleProfileDto>();
        }

        private static KidsConceptAtomDto CloneAtom(KidsConceptAtomDto src) => new()
        {
            AtomCode = src.AtomCode,
            IslandId = src.IslandId,
            AgeBand = src.AgeBand,
            Order = src.Order,
            Emoji = src.Emoji,
            PrimaryText = src.PrimaryText,
            SecondaryText = src.SecondaryText,
            Phonetic = src.Phonetic,
            NumericValue = src.NumericValue,
            SampleSentenceEn = src.SampleSentenceEn,
            SampleSentenceVi = src.SampleSentenceVi,
            FunFactEn = src.FunFactEn,
            FunFactVi = src.FunFactVi,
            IsAiGenerated = src.IsAiGenerated,
            RegionCode = src.RegionCode,
            FrameworkCode = src.FrameworkCode,
            Status = src.Status,
            AuthorName = src.AuthorName,
            AuthorClass = src.AuthorClass,
            CreatorDream = src.CreatorDream,
            ImageUrl = src.ImageUrl,
            VoiceAudioUrl = src.VoiceAudioUrl,
            GratitudeCount = src.GratitudeCount,
            IsCommunityContribution = src.IsCommunityContribution,
            Localized = src.Localized
        };
    }
}
