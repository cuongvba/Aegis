using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;
using Aegis.Application.Interfaces;
using Aegis.Domain.Entities;
using Aegis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Aegis.Infrastructure.Services
{
    public class ExamMatrixGeneratorService : IExamMatrixGeneratorService
    {
        private const string MatrixCoordinateType = "EXAM_MATRIX_TEMPLATE";
        private const string EmbeddedResourceName = "Aegis.Application.Resources.Taxonomies.default_exam_matrix_templates.json";

        private static readonly JsonSerializerOptions JsonOpts = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private static readonly Lazy<List<ExamMatrixTemplateDto>> DefaultTemplatesCache = new(LoadEmbeddedDefaults);

        private readonly AegisDbContext _db;
        private readonly ILogger<ExamMatrixGeneratorService> _logger;

        public ExamMatrixGeneratorService(
            AegisDbContext db,
            ILogger<ExamMatrixGeneratorService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<List<ExamMatrixTemplateDto>> GetTemplatesAsync(Guid tenantId, CancellationToken ct = default)
        {
            var results = DefaultTemplatesCache.Value
                .Select(CloneTemplate)
                .ToList();

            var customPresets = await _db.TenantCoordinatePresets
                .AsNoTracking()
                .Where(p => p.CoordinateType == MatrixCoordinateType &&
                            (p.TenantId == tenantId || p.TenantId == Guid.Empty))
                .OrderBy(p => p.DisplayOrder)
                .ThenBy(p => p.CreatedAt)
                .ToListAsync(ct);

            foreach (var preset in customPresets)
            {
                if (string.IsNullOrWhiteSpace(preset.SynonymsJson)) continue;
                try
                {
                    var tpl = JsonSerializer.Deserialize<ExamMatrixTemplateDto>(preset.SynonymsJson, JsonOpts);
                    if (tpl == null || string.IsNullOrWhiteSpace(tpl.TemplateCode)) continue;
                    tpl.IsSystemDefault = false;

                    int existingIdx = results.FindIndex(r =>
                        string.Equals(r.TemplateCode, tpl.TemplateCode, StringComparison.OrdinalIgnoreCase));
                    if (existingIdx >= 0)
                        results[existingIdx] = tpl;
                    else
                        results.Add(tpl);
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "[ExamMatrix] Invalid custom template JSON | PresetCode={Code}", preset.PresetCode);
                }
            }

            return results;
        }

        public async Task<ExamMatrixTemplateDto> SaveCustomTemplateAsync(
            Guid tenantId,
            ExamMatrixTemplateDto template,
            CancellationToken ct = default)
        {
            if (template == null) throw new ArgumentNullException(nameof(template));

            string code = string.IsNullOrWhiteSpace(template.TemplateCode)
                ? $"COMP_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}"
                : template.TemplateCode.Trim().ToUpperInvariant();

            var normalized = new ExamMatrixTemplateDto
            {
                TemplateCode = code,
                Title = string.IsNullOrWhiteSpace(template.Title) ? code : template.Title.Trim(),
                Category = string.IsNullOrWhiteSpace(template.Category) ? "COMPANY_POLICY" : template.Category.Trim(),
                DomainCode = string.IsNullOrWhiteSpace(template.DomainCode) ? "GENERAL" : template.DomainCode.Trim().ToUpperInvariant(),
                TopicCode = string.IsNullOrWhiteSpace(template.TopicCode) ? "GENERAL" : template.TopicCode.Trim().ToUpperInvariant(),
                TargetLevel = string.IsNullOrWhiteSpace(template.TargetLevel) ? null : template.TargetLevel.Trim(),
                DurationMinutes = template.DurationMinutes > 0 ? template.DurationMinutes : 45,
                IsSystemDefault = false,
                Description = template.Description?.Trim(),
                BloomWeights = template.BloomWeights ?? new ExamMatrixBloomWeightsDto(),
                Sections = (template.Sections ?? new List<ExamMatrixSectionRuleDto>())
                    .Where(s => s.Count > 0)
                    .Select((s, idx) => new ExamMatrixSectionRuleDto
                    {
                        Code = string.IsNullOrWhiteSpace(s.Code) ? $"PART_{idx + 1}" : s.Code.Trim().ToUpperInvariant(),
                        Title = string.IsNullOrWhiteSpace(s.Title) ? $"Phần {idx + 1}" : s.Title.Trim(),
                        QuestionType = string.IsNullOrWhiteSpace(s.QuestionType) ? "SINGLE" : s.QuestionType.Trim().ToUpperInvariant(),
                        Count = s.Count,
                        PointsPerQuestion = s.PointsPerQuestion > 0 ? s.PointsPerQuestion : 0.25
                    })
                    .ToList()
            };

            string payloadJson = JsonSerializer.Serialize(normalized, JsonOpts);

            var existing = await _db.TenantCoordinatePresets.FirstOrDefaultAsync(
                p => p.TenantId == tenantId &&
                     p.CoordinateType == MatrixCoordinateType &&
                     p.PresetCode == code,
                ct);

            if (existing != null)
            {
                existing.DomainCode = normalized.DomainCode;
                existing.PresetLabel = normalized.Title;
                existing.SynonymsJson = payloadJson;
            }
            else
            {
                _db.TenantCoordinatePresets.Add(new TenantCoordinatePreset
                {
                    TenantId = tenantId,
                    DomainCode = normalized.DomainCode,
                    CoordinateType = MatrixCoordinateType,
                    PresetCode = code,
                    PresetLabel = normalized.Title,
                    SynonymsJson = payloadJson,
                    IsDefault = false,
                    DisplayOrder = 100
                });
            }

            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("[ExamMatrix] Saved custom template | TenantId={TenantId} Code={Code}", tenantId, code);
            return normalized;
        }

        public async Task<bool> DeleteCustomTemplateAsync(Guid tenantId, string templateCode, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(templateCode)) return false;
            string code = templateCode.Trim().ToUpperInvariant();

            var existing = await _db.TenantCoordinatePresets.FirstOrDefaultAsync(
                p => p.TenantId == tenantId &&
                     p.CoordinateType == MatrixCoordinateType &&
                     p.PresetCode == code,
                ct);

            if (existing == null) return false;

            _db.TenantCoordinatePresets.Remove(existing);
            await _db.SaveChangesAsync(ct);
            return true;
        }

        public async Task<GenerateMatrixExamResponseDto> GenerateFromRealBankAsync(
            Guid tenantId,
            GenerateMatrixExamRequestDto request,
            CancellationToken ct = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));

            var effectiveSections = request.Sections?.Where(s => s.Count > 0).ToList() ?? new List<ExamMatrixSectionRuleDto>();
            var bloom = request.BloomWeights ?? new ExamMatrixBloomWeightsDto();
            string domainCode = string.IsNullOrWhiteSpace(request.DomainCode) ? "EDUCATION" : request.DomainCode.Trim().ToUpperInvariant();
            string topicCode = string.IsNullOrWhiteSpace(request.TopicCode) ? "TOAN" : request.TopicCode.Trim().ToUpperInvariant();
            string? targetLevel = string.IsNullOrWhiteSpace(request.TargetLevel) ? null : request.TargetLevel.Trim();
            int durationMinutes = request.DurationMinutes > 0 ? request.DurationMinutes : 90;
            string examTitle = string.IsNullOrWhiteSpace(request.ExamTitle)
                ? $"Đề chuẩn ma trận {topicCode} ({DateTime.UtcNow:dd/MM/yyyy})"
                : request.ExamTitle.Trim();

            if (!string.IsNullOrWhiteSpace(request.TemplateCode) && effectiveSections.Count == 0)
            {
                var templates = await GetTemplatesAsync(tenantId, ct);
                var matchedTpl = templates.FirstOrDefault(t =>
                    string.Equals(t.TemplateCode, request.TemplateCode.Trim(), StringComparison.OrdinalIgnoreCase));
                if (matchedTpl != null)
                {
                    effectiveSections = matchedTpl.Sections;
                    bloom = matchedTpl.BloomWeights;
                    if (string.IsNullOrWhiteSpace(request.DomainCode)) domainCode = matchedTpl.DomainCode;
                    if (string.IsNullOrWhiteSpace(request.TopicCode)) topicCode = matchedTpl.TopicCode;
                    if (string.IsNullOrWhiteSpace(request.TargetLevel)) targetLevel = matchedTpl.TargetLevel;
                    if (request.DurationMinutes <= 0) durationMinutes = matchedTpl.DurationMinutes;
                    if (string.IsNullOrWhiteSpace(request.ExamTitle)) examTitle = matchedTpl.Title;
                }
            }

            // Query only accessible questions for this tenant & domain (DB-translatable columns only)
            var candidates = await LoadCandidateQuestionsAsync(tenantId, domainCode, ct);
            var bankTopicMap = await LoadBankTopicMapAsync(tenantId, ct);

            // Tokenized multi-signal isolation (Subject × Grade across CategoryCode, BankTopics, CanonicalTopicCode, TreePath, Tags)
            var topicPool = candidates
                .Where(q => MatchesTopicStrict(q, topicCode, bankTopicMap) && MatchesTargetLevel(q, targetLevel, bankTopicMap))
                .ToList();

            var usedQuestionIds = new HashSet<Guid>();
            var coverages = new List<MatrixSectionCoverageDto>();
            var generatedQuestions = new List<MatrixGeneratedQuestionDto>();
            int order = 1;

            foreach (var section in effectiveSections)
            {
                string reqType = string.IsNullOrWhiteSpace(section.QuestionType)
                    ? "SINGLE"
                    : section.QuestionType.Trim().ToUpperInvariant();

                var sectionPool = topicPool
                    .Where(q => !usedQuestionIds.Contains(q.Id) && MatchesQuestionType(q, reqType))
                    .OrderBy(_ => Random.Shared.Next())
                    .ToList();

                var picked = PickByBloomDistribution(sectionPool, section.Count, bloom);
                foreach (var q in picked)
                {
                    usedQuestionIds.Add(q.Id);
                    generatedQuestions.Add(new MatrixGeneratedQuestionDto
                    {
                        Order = order++,
                        QuestionId = q.Id.ToString(),
                        SectionCode = section.Code,
                        SectionTitle = section.Title,
                        Content = q.Content,
                        QuestionType = q.QuestionType,
                        Difficulty = q.Difficulty,
                        Options = q.Options ?? new List<string>(),
                        CorrectAnswer = q.CorrectOption,
                        Explanation = q.Explanation,
                        ContextId = q.ContextId?.ToString(),
                        ContextTitle = q.ContextTitle,
                        ContextContent = q.ContextContent
                    });
                }

                coverages.Add(new MatrixSectionCoverageDto
                {
                    SectionCode = section.Code,
                    SectionTitle = section.Title,
                    QuestionType = reqType,
                    RequestedCount = section.Count,
                    MatchedCount = picked.Count
                });
            }

            int requestedTotal = effectiveSections.Sum(s => s.Count);
            int missingTotal = Math.Max(0, requestedTotal - generatedQuestions.Count);

            string? warning = null;
            if (missingTotal > 0)
            {
                var shortParts = coverages
                    .Where(c => c.MissingCount > 0)
                    .Select(c => $"{c.SectionTitle} ({c.QuestionType}): thiếu {c.MissingCount}/{c.RequestedCount}");
                warning = $"Kho đề thật ({topicCode}) hiện chỉ đủ {generatedQuestions.Count}/{requestedTotal} câu. {string.Join("; ", shortParts)}. Vui lòng nạp thêm câu hỏi đúng dạng vào kho để đạt 100% ma trận.";
            }

            _logger.LogInformation(
                "[ExamMatrix] Generated real-bank exam | TenantId={TenantId} Topic={Topic} Matched={Matched}/{Requested}",
                tenantId, topicCode, generatedQuestions.Count, requestedTotal);

            return new GenerateMatrixExamResponseDto
            {
                Success = generatedQuestions.Count > 0,
                ExamTitle = examTitle,
                DomainCode = domainCode,
                TopicCode = topicCode,
                TargetLevel = targetLevel,
                DurationMinutes = durationMinutes,
                RequestedTotal = requestedTotal,
                TotalQuestions = generatedQuestions.Count,
                SectionCoverages = coverages,
                Questions = generatedQuestions,
                WarningMessage = warning
            };
        }

        public async Task<MatrixInventoryDto> GetInventoryAsync(
            Guid tenantId,
            string? domainCode,
            string? topicCode,
            string? targetLevel,
            CancellationToken ct = default)
        {
            string normDomain = string.IsNullOrWhiteSpace(domainCode) ? string.Empty : domainCode.Trim().ToUpperInvariant();
            string normTopic = string.IsNullOrWhiteSpace(topicCode) ? "ALL" : topicCode.Trim().ToUpperInvariant();
            string? normLevel = string.IsNullOrWhiteSpace(targetLevel) || string.Equals(targetLevel.Trim(), "ALL", StringComparison.OrdinalIgnoreCase)
                ? null
                : targetLevel.Trim();

            var candidates = await LoadCandidateQuestionsAsync(tenantId, normDomain, ct);
            var bankTopicMap = await LoadBankTopicMapAsync(tenantId, ct);

            var availableSubjects = candidates
                .Select(q => ExtractSubjectToken(q.CategoryCode))
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(s => s)
                .ToList();

            var subjectMatched = candidates
                .Where(q => MatchesTopicStrict(q, normTopic, bankTopicMap))
                .ToList();

            var availableGrades = subjectMatched
                .Select(q => ResolveQuestionGrade(q, bankTopicMap))
                .Where(g => !string.IsNullOrWhiteSpace(g))
                .Select(g => g!)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(g => g)
                .ToList();

            var finalMatched = subjectMatched
                .Where(q => MatchesTargetLevel(q, normLevel, bankTopicMap))
                .ToList();

            return new MatrixInventoryDto
            {
                DomainCode = normDomain,
                TopicCode = normTopic,
                TargetLevel = normLevel,
                TotalCount = finalMatched.Count,
                ByQuestionType = finalMatched
                    .GroupBy(q => (q.QuestionType ?? "SINGLE").Trim().ToUpperInvariant())
                    .ToDictionary(g => g.Key, g => g.Count()),
                ByDifficulty = finalMatched
                    .GroupBy(q => q.Difficulty)
                    .ToDictionary(g => g.Key, g => g.Count()),
                AvailableSubjects = availableSubjects,
                AvailableGrades = availableGrades
            };
        }

        private Task<List<QuestionBase>> LoadCandidateQuestionsAsync(Guid tenantId, string domainCode, CancellationToken ct) =>
            _db.Questions
                .AsNoTracking()
                .Include(q => q.Context)
                .Where(q => (q.TenantId == tenantId || q.TenantId == Guid.Empty || q.IsPublic) &&
                            (string.IsNullOrEmpty(domainCode) || q.DomainCode.ToUpper() == domainCode))
                .ToListAsync(ct);

        private async Task<Dictionary<string, string>> LoadBankTopicMapAsync(Guid tenantId, CancellationToken ct)
        {
            var topics = await _db.BankTopics
                .AsNoTracking()
                .Where(t => t.TenantId == tenantId || t.TenantId == Guid.Empty || t.VisibilityScope == TopicVisibility.Public)
                .Select(t => new { t.Code, t.CategoryCode })
                .ToListAsync(ct);

            var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var t in topics)
            {
                if (!string.IsNullOrWhiteSpace(t.Code) && !string.IsNullOrWhiteSpace(t.CategoryCode))
                    map[t.Code.Trim()] = t.CategoryCode.Trim();
            }
            return map;
        }

        private static bool MatchesTopicStrict(
            QuestionBase q,
            string topicCode,
            IReadOnlyDictionary<string, string>? bankTopicMap = null)
        {
            if (string.IsNullOrWhiteSpace(topicCode) || string.Equals(topicCode, "ALL", StringComparison.OrdinalIgnoreCase))
                return true;

            string norm = topicCode.Trim();
            string prefix = norm + "_";
            string dashPrefix = norm + "-";

            bool TokenMatches(string? value) =>
                !string.IsNullOrWhiteSpace(value) &&
                (string.Equals(value.Trim(), norm, StringComparison.OrdinalIgnoreCase) ||
                 value.Trim().StartsWith(prefix, StringComparison.OrdinalIgnoreCase) ||
                 value.Trim().StartsWith(dashPrefix, StringComparison.OrdinalIgnoreCase));

            if (TokenMatches(q.CategoryCode) || TokenMatches(q.SubCategory))
                return true;

            if (bankTopicMap != null && !string.IsNullOrWhiteSpace(q.CategoryCode) &&
                bankTopicMap.TryGetValue(q.CategoryCode.Trim(), out var mappedCategory) &&
                TokenMatches(mappedCategory))
                return true;

            if (!string.IsNullOrWhiteSpace(q.CanonicalTopicCode) &&
                q.CanonicalTopicCode.Contains(norm, StringComparison.OrdinalIgnoreCase))
                return true;

            if (!string.IsNullOrWhiteSpace(q.TreePath) &&
                q.TreePath.Contains($"/{norm}/", StringComparison.OrdinalIgnoreCase))
                return true;

            if (q.Tags != null && q.Tags.Any(t => TokenMatches(t.TrimStart('#'))))
                return true;

            return false;
        }

        private static bool MatchesTargetLevel(
            QuestionBase q,
            string? targetLevel,
            IReadOnlyDictionary<string, string>? bankTopicMap = null)
        {
            if (string.IsNullOrWhiteSpace(targetLevel) || string.Equals(targetLevel.Trim(), "ALL", StringComparison.OrdinalIgnoreCase))
                return true;

            string reqGrade = NormalizeGradeToken(targetLevel);
            string? actualGrade = ResolveQuestionGrade(q, bankTopicMap);
            if (string.IsNullOrWhiteSpace(actualGrade)) return true;

            return string.Equals(actualGrade, reqGrade, StringComparison.OrdinalIgnoreCase) ||
                   actualGrade.Contains(targetLevel.Trim(), StringComparison.OrdinalIgnoreCase);
        }

        private static string? ResolveQuestionGrade(
            QuestionBase q,
            IReadOnlyDictionary<string, string>? bankTopicMap = null)
        {
            string? explicitLevel = q.Grade ?? q.TargetLevel;
            if (!string.IsNullOrWhiteSpace(explicitLevel))
                return NormalizeGradeToken(explicitLevel);

            foreach (var signal in new[] { q.CategoryCode, q.SubCategory, q.CanonicalTopicCode, q.TreePath })
            {
                var g = ExtractGradeFromToken(signal);
                if (g != null) return g;
            }

            if (bankTopicMap != null && !string.IsNullOrWhiteSpace(q.CategoryCode) &&
                bankTopicMap.TryGetValue(q.CategoryCode.Trim(), out var mappedCategory))
            {
                var g = ExtractGradeFromToken(mappedCategory);
                if (g != null) return g;
            }

            if (q.Tags != null)
            {
                foreach (var tag in q.Tags)
                {
                    var g = ExtractGradeFromToken(tag);
                    if (g != null) return g;
                }
            }

            return null;
        }

        private static string NormalizeGradeToken(string raw)
        {
            string upper = raw.Trim().ToUpperInvariant().Replace("LỚP", "").Replace("LOP", "").Trim();
            var match = System.Text.RegularExpressions.Regex.Match(upper, @"^K?0?(\d{1,2})$");
            if (match.Success && int.TryParse(match.Groups[1].Value, out int num) && num >= 1 && num <= 12)
                return $"K{num:00}";
            return raw.Trim();
        }

        private static string? ExtractGradeFromToken(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            var match = System.Text.RegularExpressions.Regex.Match(
                raw.ToUpperInvariant(),
                @"(?:^|[_\-/])(?:K|LOP[_\-\s]?)?0?([1-9]|1[0-2])(?:$|[_\-/])");
            if (match.Success && int.TryParse(match.Groups[1].Value, out int gradeNum))
                return $"K{gradeNum:00}";
            return null;
        }

        private static string ExtractSubjectToken(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
            return System.Text.RegularExpressions.Regex.Replace(
                raw.Trim().ToUpperInvariant(),
                @"[_\-](?:K?0?(?:[1-9]|1[0-2]))$",
                string.Empty);
        }

        private static bool MatchesQuestionType(QuestionBase q, string requestedType)
        {
            string actual = (q.QuestionType ?? "SINGLE").Trim().ToUpperInvariant();
            if (actual == requestedType) return true;
            if (requestedType == "MULTI_TRUE_FALSE" && (actual == "TRUE_FALSE_GROUP" || actual == "MULTI_TF"))
                return true;
            if (requestedType == "SHORT_ANSWER" && (actual == "FILL_BLANK" || actual == "NUMERIC"))
                return true;
            return false;
        }

        private static List<QuestionBase> PickByBloomDistribution(
            List<QuestionBase> pool,
            int count,
            ExamMatrixBloomWeightsDto bloom)
        {
            if (count <= 0 || pool.Count == 0) return new List<QuestionBase>();
            if (pool.Count <= count) return pool.ToList();

            int totalWeight = Math.Max(1, bloom.Recall + bloom.Comprehend + bloom.Apply + bloom.HighApply);
            int qRecall = (int)Math.Round(count * (bloom.Recall / (double)totalWeight));
            int qComprehend = (int)Math.Round(count * (bloom.Comprehend / (double)totalWeight));
            int qApply = (int)Math.Round(count * (bloom.Apply / (double)totalWeight));
            int qHighApply = Math.Max(0, count - qRecall - qComprehend - qApply);

            var picked = new List<QuestionBase>(count);
            var pickedIds = new HashSet<Guid>();

            void TakeFromBucket(Func<QuestionBase, bool> predicate, int target)
            {
                if (target <= 0) return;
                foreach (var item in pool.Where(q => !pickedIds.Contains(q.Id) && predicate(q)).Take(target))
                {
                    picked.Add(item);
                    pickedIds.Add(item.Id);
                }
            }

            TakeFromBucket(q => q.Difficulty <= 2, qRecall);
            TakeFromBucket(q => q.Difficulty == 3, qComprehend);
            TakeFromBucket(q => q.Difficulty == 4, qApply);
            TakeFromBucket(q => q.Difficulty >= 5, qHighApply);

            if (picked.Count < count)
            {
                foreach (var item in pool.Where(q => !pickedIds.Contains(q.Id)).Take(count - picked.Count))
                {
                    picked.Add(item);
                    pickedIds.Add(item.Id);
                }
            }

            return picked;
        }

        private static List<ExamMatrixTemplateDto> LoadEmbeddedDefaults()
        {
            var assembly = typeof(ExamMatrixTemplateDto).Assembly;
            using Stream? stream = assembly.GetManifestResourceStream(EmbeddedResourceName);
            if (stream == null) return new List<ExamMatrixTemplateDto>();

            using var reader = new StreamReader(stream);
            string json = reader.ReadToEnd();
            return JsonSerializer.Deserialize<List<ExamMatrixTemplateDto>>(json, JsonOpts) ?? new List<ExamMatrixTemplateDto>();
        }

        private static ExamMatrixTemplateDto CloneTemplate(ExamMatrixTemplateDto src) => new()
        {
            TemplateCode = src.TemplateCode,
            Title = src.Title,
            Category = src.Category,
            DomainCode = src.DomainCode,
            TopicCode = src.TopicCode,
            TargetLevel = src.TargetLevel,
            DurationMinutes = src.DurationMinutes,
            IsSystemDefault = src.IsSystemDefault,
            Description = src.Description,
            BloomWeights = new ExamMatrixBloomWeightsDto
            {
                Recall = src.BloomWeights.Recall,
                Comprehend = src.BloomWeights.Comprehend,
                Apply = src.BloomWeights.Apply,
                HighApply = src.BloomWeights.HighApply
            },
            Sections = src.Sections.Select(s => new ExamMatrixSectionRuleDto
            {
                Code = s.Code,
                Title = s.Title,
                QuestionType = s.QuestionType,
                Count = s.Count,
                PointsPerQuestion = s.PointsPerQuestion
            }).ToList()
        };
    }
}
