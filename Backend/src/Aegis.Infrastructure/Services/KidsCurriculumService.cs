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
        private const string EmbeddedResourceName = "Aegis.Application.Resources.Taxonomies.default_kids_concept_atoms.json";

        private static readonly JsonSerializerOptions JsonOpts = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private static readonly Lazy<List<KidsConceptAtomDto>> DefaultAtomsCache = new(LoadEmbeddedAtoms);

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

            var allIslandAtoms = await GetConceptAtomsAsync(tenantId, island, ageBand, ct);
            if (allIslandAtoms.Count == 0)
                allIslandAtoms = await GetConceptAtomsAsync(tenantId, "all", "all", ct);

            // FSRS-driven priority: 1) Weak/due atoms first, 2) Next atoms in order
            var selected = allIslandAtoms
                .OrderByDescending(a => weakSet.Contains(a.AtomCode))
                .ThenBy(a => a.Order)
                .ThenBy(_ => Random.Shared.Next())
                .Take(atomCount)
                .ToList();

            var activities = SynthesizeActivities(selected, allIslandAtoms);

            _logger.LogInformation(
                "[KidsGenesis] Generated adventure | TenantId={TenantId} Island={Island} Atoms={Atoms} Activities={Activities}",
                tenantId, island, selected.Count, activities.Count);

            return new KidsLessonPlanDto
            {
                LessonId = $"KIDS_{island.ToUpperInvariant()}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                IslandId = island,
                AgeBand = ageBand,
                AtomCount = selected.Count,
                ActivityCount = activities.Count,
                Atoms = selected,
                Activities = activities
            };
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
            IsAiGenerated = src.IsAiGenerated
        };
    }
}
