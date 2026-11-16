using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;
using Aegis.Application.Interfaces;
using Aegis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Aegis.Infrastructure.Services
{
    /// <summary>
    /// [5-Axis Cognitive Pivot Engine]
    /// Động cơ phân tích, xoay trục đa chiều (Khối 1–12 × Năm học × Trường/Sở × Môn × Mục đích thi)
    /// và xây dựng Ma trận Phủ Học liệu (Curriculum Coverage Heatmap) theo thời gian thực.
    /// </summary>
    public class TopicPivotService : ITopicPivotService
    {
        private readonly AegisDbContext _db;
        private static readonly Regex GradeNumberRegex = new(@"\d+", RegexOptions.Compiled);

        private const string DefaultGrade = "Chưa phân khối";
        private const string DefaultYear = "Chưa gắn năm";
        private const string DefaultOrg = "Kho Chung";
        private const string DefaultPurpose = "Tổng hợp";

        public TopicPivotService(AegisDbContext db)
        {
            _db = db;
        }

        public async Task<TopicPivotSummaryResponse> GetPivotSummaryAsync(
            TopicPivotQueryDto query,
            Guid? currentUserId = null,
            CancellationToken ct = default)
        {
            var topicsQuery = _db.BankTopics.AsNoTracking().Where(t => t.Enabled);
            if (query.MyOnly && currentUserId.HasValue)
            {
                topicsQuery = topicsQuery.Where(t => t.CreatedByUserId == currentUserId.Value);
            }

            var topics = await topicsQuery
                .Select(t => new
                {
                    t.Code,
                    t.Name,
                    t.Description,
                    t.DomainCode,
                    t.QuestionCountCached
                })
                .ToListAsync(ct);

            var questions = await _db.Questions.AsNoTracking()
                .Select(q => new
                {
                    q.CategoryCode,
                    q.DomainCode,
                    q.Payload
                })
                .ToListAsync(ct);

            var questionsByTopic = questions
                .Where(q => !string.IsNullOrWhiteSpace(q.CategoryCode))
                .GroupBy(q => q.CategoryCode, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);

            var domainMap = await _db.DynamicDomains.AsNoTracking()
                .ToDictionaryAsync(d => d.Code, d => d.Name, StringComparer.OrdinalIgnoreCase, ct);

            // 1. Xây dựng hồ sơ tọa độ 5 chiều cho từng chủ đề / đề thi
            var allProfiles = new List<TopicCoordinateProfileDto>(topics.Count);
            foreach (var topic in topics)
            {
                questionsByTopic.TryGetValue(topic.Code, out var topicQuestions);
                var qCount = topicQuestions?.Count ?? topic.QuestionCountCached;

                string? targetLevel = null;
                int? benchmarkYear = null;
                string? issuingOrg = null;
                string? purpose = null;
                string domain = string.IsNullOrWhiteSpace(topic.DomainCode) ? "EDUCATION" : topic.DomainCode;

                if (topicQuestions != null && topicQuestions.Count > 0)
                {
                    foreach (var q in topicQuestions)
                    {
                        targetLevel ??= ExtractJsonString(q.Payload, "targetLevel");
                        benchmarkYear ??= ExtractJsonInt(q.Payload, "benchmarkYear");
                        issuingOrg ??= ExtractJsonString(q.Payload, "issuingOrg");
                        purpose ??= ExtractJsonString(q.Payload, "assessmentPurpose");
                        if (!string.IsNullOrWhiteSpace(q.DomainCode)) domain = q.DomainCode;
                        if (targetLevel != null && benchmarkYear != null && issuingOrg != null && purpose != null)
                            break;
                    }
                }

                // Tự động bóc tách tọa độ thông minh từ tên & mô tả nếu đề cũ chưa gắn metadata
                if (targetLevel == null || benchmarkYear == null || issuingOrg == null || purpose == null)
                {
                    var sniffed = UniversalCoordinateTaxonomyEngine.SniffCoordinates(
                        topic.Name,
                        null,
                        new[] { topic.Name, topic.Description ?? string.Empty });

                    targetLevel ??= sniffed.TargetLevel;
                    benchmarkYear ??= sniffed.BenchmarkYear;
                    issuingOrg ??= sniffed.IssuingOrg;
                    purpose ??= sniffed.AssessmentPurpose;
                    if (domain == "EDUCATION" && !string.IsNullOrWhiteSpace(sniffed.DomainCode) && sniffed.DomainCode != "GENERAL")
                    {
                        domain = sniffed.DomainCode;
                    }
                }

                allProfiles.Add(new TopicCoordinateProfileDto
                {
                    TopicCode = topic.Code,
                    DomainCode = domain,
                    TargetLevel = NormalizeText(targetLevel, DefaultGrade),
                    BenchmarkYear = benchmarkYear.HasValue ? benchmarkYear.Value.ToString() : DefaultYear,
                    IssuingOrg = NormalizeText(issuingOrg, DefaultOrg),
                    AssessmentPurpose = NormalizeText(purpose, DefaultPurpose),
                    QuestionCount = qCount
                });
            }

            // 2. Thu thập Facets động từ toàn bộ dữ liệu (trước khi lọc) để UI luôn hiển thị đủ các chiều
            var facets = new PivotFacetsDto
            {
                TargetLevels = BuildFacet(allProfiles, p => p.TargetLevel, CompareGradeNatural),
                BenchmarkYears = BuildFacet(allProfiles, p => p.BenchmarkYear, CompareYearDesc),
                IssuingOrgs = BuildFacet(allProfiles, p => p.IssuingOrg, CompareByCountThenAlpha),
                Domains = BuildFacet(allProfiles, p => p.DomainCode, CompareByCountThenAlpha, code => domainMap.TryGetValue(code, out var name) ? name : code),
                AssessmentPurposes = BuildFacet(allProfiles, p => p.AssessmentPurpose, CompareByCountThenAlpha)
            };

            // 3. Áp dụng bộ lọc đa trục trực giao
            var filtered = allProfiles.Where(p =>
                (string.IsNullOrWhiteSpace(query.DomainCode) || p.DomainCode.Equals(query.DomainCode, StringComparison.OrdinalIgnoreCase)) &&
                (string.IsNullOrWhiteSpace(query.TargetLevel) || p.TargetLevel.Equals(query.TargetLevel, StringComparison.OrdinalIgnoreCase)) &&
                (string.IsNullOrWhiteSpace(query.BenchmarkYear) || p.BenchmarkYear.Equals(query.BenchmarkYear, StringComparison.OrdinalIgnoreCase)) &&
                (string.IsNullOrWhiteSpace(query.IssuingOrg) || p.IssuingOrg.Equals(query.IssuingOrg, StringComparison.OrdinalIgnoreCase)) &&
                (string.IsNullOrWhiteSpace(query.AssessmentPurpose) || p.AssessmentPurpose.Equals(query.AssessmentPurpose, StringComparison.OrdinalIgnoreCase))
            ).ToList();

            var mode = string.IsNullOrWhiteSpace(query.PivotMode) ? "grade" : query.PivotMode.Trim().ToLowerInvariant();

            return new TopicPivotSummaryResponse
            {
                PivotMode = mode,
                TotalTopics = filtered.Count,
                TotalQuestions = filtered.Sum(p => p.QuestionCount),
                Facets = facets,
                PivotTree = BuildPivotTree(filtered, mode, domainMap),
                CoverageMatrix = BuildCoverageMatrix(allProfiles),
                TopicCoordinates = allProfiles.ToDictionary(p => p.TopicCode, p => p, StringComparer.OrdinalIgnoreCase)
            };
        }

        private static List<PivotGroupNodeDto> BuildPivotTree(
            List<TopicCoordinateProfileDto> profiles,
            string mode,
            Dictionary<string, string> domainMap)
        {
            Func<TopicCoordinateProfileDto, (string Key, string Label, string Axis)> level1;
            Func<TopicCoordinateProfileDto, (string Key, string Label, string Axis)> level2;
            Func<TopicCoordinateProfileDto, (string Key, string Label, string Axis)> level3;

            switch (mode)
            {
                case "school":
                    level1 = p => (p.IssuingOrg, p.IssuingOrg, "issuingOrg");
                    level2 = p => (p.BenchmarkYear, p.BenchmarkYear == DefaultYear ? DefaultYear : $"Năm {p.BenchmarkYear}", "benchmarkYear");
                    level3 = p => (p.TargetLevel, p.TargetLevel, "targetLevel");
                    break;
                case "subject":
                    level1 = p => (p.DomainCode, domainMap.TryGetValue(p.DomainCode, out var dn) ? dn : p.DomainCode, "domainCode");
                    level2 = p => (p.TargetLevel, p.TargetLevel, "targetLevel");
                    level3 = p => (p.BenchmarkYear, p.BenchmarkYear == DefaultYear ? DefaultYear : $"Năm {p.BenchmarkYear}", "benchmarkYear");
                    break;
                case "purpose":
                    level1 = p => (p.AssessmentPurpose, p.AssessmentPurpose, "assessmentPurpose");
                    level2 = p => (p.BenchmarkYear, p.BenchmarkYear == DefaultYear ? DefaultYear : $"Năm {p.BenchmarkYear}", "benchmarkYear");
                    level3 = p => (p.TargetLevel, p.TargetLevel, "targetLevel");
                    break;
                default: // "grade": Khối lớp -> Năm học -> Môn học
                    level1 = p => (p.TargetLevel, p.TargetLevel, "targetLevel");
                    level2 = p => (p.BenchmarkYear, p.BenchmarkYear == DefaultYear ? DefaultYear : $"Năm {p.BenchmarkYear}", "benchmarkYear");
                    level3 = p => (p.DomainCode, domainMap.TryGetValue(p.DomainCode, out var dn) ? dn : p.DomainCode, "domainCode");
                    break;
            }

            return profiles
                .GroupBy(p => level1(p).Key, StringComparer.OrdinalIgnoreCase)
                .Select(g1 =>
                {
                    var sample1 = level1(g1.First());
                    var children2 = g1
                        .GroupBy(p => level2(p).Key, StringComparer.OrdinalIgnoreCase)
                        .Select(g2 =>
                        {
                            var sample2 = level2(g2.First());
                            var children3 = g2
                                .GroupBy(p => level3(p).Key, StringComparer.OrdinalIgnoreCase)
                                .Select(g3 =>
                                {
                                    var sample3 = level3(g3.First());
                                    return new PivotGroupNodeDto
                                    {
                                        Key = sample3.Key,
                                        Label = sample3.Label,
                                        Axis = sample3.Axis,
                                        TopicCount = g3.Count(),
                                        QuestionCount = g3.Sum(x => x.QuestionCount),
                                        TopicCodes = g3.Select(x => x.TopicCode).ToList()
                                    };
                                })
                                .OrderByDescending(n => n.TopicCount)
                                .ToList();

                            return new PivotGroupNodeDto
                            {
                                Key = sample2.Key,
                                Label = sample2.Label,
                                Axis = sample2.Axis,
                                TopicCount = g2.Count(),
                                QuestionCount = g2.Sum(x => x.QuestionCount),
                                TopicCodes = g2.Select(x => x.TopicCode).ToList(),
                                Children = children3
                            };
                        })
                        .OrderByDescending(n => n.Key, StringComparer.OrdinalIgnoreCase)
                        .ToList();

                    return new PivotGroupNodeDto
                    {
                        Key = sample1.Key,
                        Label = sample1.Label,
                        Axis = sample1.Axis,
                        TopicCount = g1.Count(),
                        QuestionCount = g1.Sum(x => x.QuestionCount),
                        TopicCodes = g1.Select(x => x.TopicCode).ToList(),
                        Children = children2
                    };
                })
                .OrderByDescending(n => n.TopicCount)
                .ToList();
        }

        private static List<CoverageMatrixCellDto> BuildCoverageMatrix(List<TopicCoordinateProfileDto> profiles)
        {
            var grades = profiles.Select(p => p.TargetLevel).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            grades.Sort((a, b) => CompareGradeNatural(a, b, 0, 0));

            var years = profiles.Select(p => p.BenchmarkYear).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            years.Sort((a, b) => CompareYearDesc(a, b, 0, 0));

            var lookup = profiles
                .GroupBy(p => $"{p.TargetLevel}||{p.BenchmarkYear}", StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => (Topics: g.Count(), Questions: g.Sum(x => x.QuestionCount)), StringComparer.OrdinalIgnoreCase);

            var cells = new List<CoverageMatrixCellDto>();
            foreach (var g in grades)
            {
                foreach (var y in years)
                {
                    lookup.TryGetValue($"{g}||{y}", out var counts);
                    string status = counts.Topics == 0 ? "EMPTY" : (counts.Questions < 15 ? "SPARSE" : "HEALTHY");
                    cells.Add(new CoverageMatrixCellDto
                    {
                        TargetLevel = g,
                        BenchmarkYear = y,
                        TopicCount = counts.Topics,
                        QuestionCount = counts.Questions,
                        Status = status
                    });
                }
            }
            return cells;
        }

        private static List<PivotFacetItemDto> BuildFacet(
            List<TopicCoordinateProfileDto> profiles,
            Func<TopicCoordinateProfileDto, string> selector,
            Func<string, string, int, int, int> comparer,
            Func<string, string>? labelResolver = null)
        {
            var list = profiles
                .GroupBy(selector, StringComparer.OrdinalIgnoreCase)
                .Select(g => new PivotFacetItemDto
                {
                    Value = g.Key,
                    Label = labelResolver != null ? labelResolver(g.Key) : g.Key,
                    TopicCount = g.Count(),
                    QuestionCount = g.Sum(x => x.QuestionCount)
                })
                .ToList();

            list.Sort((a, b) => comparer(a.Value, b.Value, a.TopicCount, b.TopicCount));
            return list;
        }

        private static int CompareGradeNatural(string a, string b, int _ca, int _cb)
        {
            if (a == DefaultGrade && b != DefaultGrade) return 1;
            if (b == DefaultGrade && a != DefaultGrade) return -1;
            var ma = GradeNumberRegex.Match(a);
            var mb = GradeNumberRegex.Match(b);
            if (ma.Success && mb.Success && int.TryParse(ma.Value, out var na) && int.TryParse(mb.Value, out var nb))
            {
                return na.CompareTo(nb);
            }
            return string.Compare(a, b, StringComparison.OrdinalIgnoreCase);
        }

        private static int CompareYearDesc(string a, string b, int _ca, int _cb)
        {
            if (a == DefaultYear && b != DefaultYear) return 1;
            if (b == DefaultYear && a != DefaultYear) return -1;
            if (int.TryParse(a, out var ya) && int.TryParse(b, out var yb))
                return yb.CompareTo(ya);
            return string.Compare(b, a, StringComparison.OrdinalIgnoreCase);
        }

        private static int CompareByCountThenAlpha(string a, string b, int countA, int countB)
        {
            int cmp = countB.CompareTo(countA);
            return cmp != 0 ? cmp : string.Compare(a, b, StringComparison.OrdinalIgnoreCase);
        }

        private static string NormalizeText(string? value, string fallback)
            => string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

        private static string? ExtractJsonString(JsonDocument? doc, string propertyName)
        {
            if (doc == null) return null;
            if (doc.RootElement.ValueKind == JsonValueKind.Object &&
                doc.RootElement.TryGetProperty(propertyName, out var el) &&
                el.ValueKind == JsonValueKind.String)
            {
                return el.GetString();
            }
            return null;
        }

        private static int? ExtractJsonInt(JsonDocument? doc, string propertyName)
        {
            if (doc == null) return null;
            if (doc.RootElement.ValueKind == JsonValueKind.Object &&
                doc.RootElement.TryGetProperty(propertyName, out var el))
            {
                if (el.ValueKind == JsonValueKind.Number && el.TryGetInt32(out var val)) return val;
                if (el.ValueKind == JsonValueKind.String && int.TryParse(el.GetString(), out var strVal)) return strVal;
            }
            return null;
        }
    }
}
