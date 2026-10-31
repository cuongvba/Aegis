using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using AegisQuiz.Application.DTOs;
using AegisQuiz.Application.Interfaces;
using AegisQuiz.Domain.Entities;

namespace AegisQuiz.Infrastructure.Services
{
    /// <summary>
    /// [Universal Cognitive Coordinate & Taxonomy Engine]
    /// Động cơ nhận thức tự động nhận diện Hệ 5 Trục Tọa Độ (DomainCode, TargetLevel, AssessmentPurpose, IssuingOrg,
    /// BenchmarkYear/BenchmarkStandard) và Thẻ Thông Minh từ tên file, hàng banner đầu bảng, nội dung câu hỏi và căn cứ pháp lý.
    /// Ưu tiên tuyệt đối dữ liệu động của Tenant (<see cref="DynamicDomainContext"/>: Domains, CoordinatePresets, Topics);
    /// bộ từ khóa chuẩn hệ thống chỉ là lớp dự phòng khi Tenant chưa cấu hình.
    /// </summary>
    public class UniversalCoordinateTaxonomyEngine : ITaxonomyEngine
    {
        #region ITaxonomyEngine Explicit Implementation

        CognitiveCoordinateTaxonomyResult ITaxonomyEngine.SniffCoordinates(
            string? fileName,
            string? sheetName,
            IEnumerable<string>? headerBannerLines,
            IEnumerable<string>? sampleContents,
            IEnumerable<string>? sampleReferences,
            DynamicDomainContext? dynamicContext)
            => SniffCoordinates(fileName, sheetName, headerBannerLines, sampleContents, sampleReferences, dynamicContext);

        void ITaxonomyEngine.AutoEnrichTaxonomyAndTags(
            QuestionBase question,
            DynamicDomainContext? dynamicContext)
            => AutoEnrichTaxonomyAndTags(question, dynamicContext);

        void ITaxonomyEngine.AutoEnrichTaxonomyAndTags(
            DocxImportPreviewDto question,
            DynamicDomainContext? dynamicContext)
            => AutoEnrichTaxonomyAndTags(question, dynamicContext);

        void ITaxonomyEngine.EnrichExamTaxonomy(
            UniversalImportPreviewResult result,
            DynamicDomainContext? dynamicContext)
            => EnrichExamTaxonomy(result, dynamicContext);

        void ITaxonomyEngine.EnrichExamTaxonomy(
            List<DocxImportPreviewDto> results,
            DynamicDomainContext? dynamicContext)
            => EnrichExamTaxonomy(results, dynamicContext);

        string ITaxonomyEngine.ResolveTopicCode(
            string? rawTopicOrSubject,
            DynamicDomainContext? dynamicContext)
            => ResolveTopicCode(rawTopicOrSubject, dynamicContext);

        string ITaxonomyEngine.InferTopicFromContent(
            string? text,
            DynamicDomainContext? dynamicContext)
            => InferTopicFromContent(text, dynamicContext);

        bool ITaxonomyEngine.IsAcademicTopic(
            string? topicCode,
            DynamicDomainContext? dynamicContext)
            => IsAcademicTopic(topicCode, dynamicContext);

        void ITaxonomyEngine.SynthesizeCanonicalTaxonomy(
            CognitiveCoordinateTaxonomyResult result,
            string combinedText,
            string? fileName,
            DynamicDomainContext? dynamicContext)
            => SynthesizeCanonicalTaxonomy(result, combinedText, fileName, dynamicContext);

        #endregion

        public static CognitiveCoordinateTaxonomyResult SniffCoordinates(
            string? fileName,
            string? sheetName,
            IEnumerable<string>? headerBannerLines,
            IEnumerable<string>? sampleContents = null,
            IEnumerable<string>? sampleReferences = null,
            DynamicDomainContext? dynamicContext = null)
        {
            dynamicContext ??= DynamicDomainContext.CreateDefault();
            var result = new CognitiveCoordinateTaxonomyResult();

            var bannerList = (headerBannerLines ?? Enumerable.Empty<string>())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .ToList();

            var combinedHeader = string.Join("\n", bannerList);
            var combinedAll = $"{fileName} {sheetName} {combinedHeader} " +
                              $"{string.Join(" ", (sampleContents ?? Enumerable.Empty<string>()).Take(15).Select(SanitizeSample))} " +
                              $"{string.Join(" ", (sampleReferences ?? Enumerable.Empty<string>()).Take(15).Select(SanitizeSample))}";

            result.BenchmarkYear = DetectYear(bannerList, fileName, sheetName);

            // 1. [SSoT Precedence] Nhận diện Môn thi / Chủ đề chính từ Header Đề thi (Exam Envelope) TRƯỚC TIÊN
            result.TopicCode = DetectTopicFromHeader(bannerList, fileName, sheetName, dynamicContext);
            if (!string.IsNullOrEmpty(result.TopicCode) && result.TopicCode != "GENERAL")
            {
                var matched = dynamicContext?.Topics?.FirstOrDefault(t => t.Code.Equals(result.TopicCode, StringComparison.OrdinalIgnoreCase))
                    ?? DynamicDomainContext.CreateDefault().Topics.FirstOrDefault(t => t.Code.Equals(result.TopicCode, StringComparison.OrdinalIgnoreCase));
                result.TopicName = matched?.Name ?? result.TopicCode;

                if (matched != null && !string.IsNullOrWhiteSpace(matched.DomainCode) && matched.DomainCode != "GENERAL")
                {
                    result.DomainCode = matched.DomainCode;
                }
            }

            if (string.IsNullOrWhiteSpace(result.DomainCode) || result.DomainCode == "GENERAL")
            {
                result.DomainCode = DetectDomain(combinedAll, null, null, null, dynamicContext);
            }

            // 2. [Domain-Isolated Sniffing] Nhận diện Cấp bậc, Kỳ thi và Đơn vị ban hành ĐƯỢC CÔ LẬP THEO DOMAIN
            result.TargetLevel = DetectTargetLevel(bannerList, fileName, sheetName, combinedAll, dynamicContext, result.DomainCode);
            result.AssessmentPurpose = DetectAssessmentPurpose(bannerList, fileName, sheetName, combinedAll, dynamicContext, result.DomainCode);
            result.IssuingOrg = DetectIssuingOrg(bannerList, fileName, combinedAll, dynamicContext, result.DomainCode);

            result.BenchmarkStandard = DetectStandard(combinedAll, result.DomainCode, result.AssessmentPurpose, result.BenchmarkYear, dynamicContext);
            result.Tags = GenerateSmartTags(result, fileName, sheetName, dynamicContext);
            if (!string.IsNullOrWhiteSpace(result.TopicCode) && result.TopicCode != "GENERAL")
            {
                AddTagIfNotExists(result.Tags, CleanToTag(result.TopicCode));
            }

            SynthesizeCanonicalTaxonomy(result, combinedAll, fileName, dynamicContext);
            return result;
        }

        private static string DetectTopicFromHeader(List<string> banners, string? fileName, string? sheetName, DynamicDomainContext? dynamicContext)
        {
            if (!string.IsNullOrWhiteSpace(sheetName) && sheetName != "DEFAULT" && sheetName != "GENERAL")
            {
                var resolved = ResolveTopicCode(sheetName, dynamicContext);
                if (resolved != "GENERAL") return resolved;
            }

            var reconPatterns = dynamicContext?.StructureDictionary?.TaxonomyReconPatterns
                ?? new TaxonomyReconnaissancePatternsDto();

            // PASS 1: Quét tìm nhãn MÔN THI / BÀI THI / CHỦ ĐỀ đa ngôn ngữ từ TaxonomyReconPatterns (Zero-Hardcode & MultiLang)
            foreach (var banner in banners)
            {
                if (string.IsNullOrWhiteSpace(banner)) continue;

                foreach (var pattern in reconPatterns.TopicHeaderPatterns)
                {
                    var m = Regex.Match(banner, pattern);
                    if (m.Success)
                    {
                        string raw = m.Groups[1].Value.Trim();
                        raw = Regex.Replace(raw, @"(?i)\s*(?:Thời\s*gian|Thời\s*lượng|Mã\s*đề|Time|Duration|Code|Exam\s*Code).*$", "").Trim();
                        var resolved = ResolveTopicCode(raw, dynamicContext);
                        if (resolved != "GENERAL" && resolved != "EDUCATION" && resolved != "THPT_NATIONAL")
                        {
                            return resolved;
                        }
                    }
                }
            }

            // PASS 2: Chỉ khi không có dòng nào chứa nhãn "Môn thi / Bài thi", mới quét tên môn học đầy đủ (t.Name)
            var allTopics = dynamicContext?.Topics != null && dynamicContext.Topics.Count > 0
                ? dynamicContext.Topics
                : DynamicDomainContext.CreateDefault().Topics;

            // Sắp xếp các Topics theo độ dài tên/code giảm dần để ưu tiên tên dài hơn (ví dụ "Khoa học tự nhiên" trước "Hóa học")
            var orderedTopics = allTopics
                .Where(t => !string.Equals(t.Code, "GENERAL", StringComparison.OrdinalIgnoreCase) &&
                            !string.Equals(t.Code, "EDUCATION", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(t => t.Name?.Length ?? 0)
                .ThenByDescending(t => t.Code.Length)
                .ToList();

            foreach (var banner in banners)
            {
                if (string.IsNullOrWhiteSpace(banner)) continue;
                var bannerSlug = "_" + NormalizeToCodeSlug(banner) + "_";

                foreach (var t in orderedTopics)
                {
                    var nameSlug = "_" + NormalizeToCodeSlug(t.Name) + "_";
                    var codeSlug = "_" + NormalizeToCodeSlug(t.Code) + "_";

                    if ((nameSlug.Length > 2 && bannerSlug.Contains(nameSlug)) ||
                        (codeSlug.Length > 2 && bannerSlug.Contains(codeSlug)))
                    {
                        return t.Code;
                    }
                }
            }

            // PASS 3: Quét tên file nếu Header không có
            if (!string.IsNullOrWhiteSpace(fileName))
            {
                var fileSlug = "_" + NormalizeToCodeSlug(fileName) + "_";
                foreach (var t in orderedTopics)
                {
                    var nameSlug = "_" + NormalizeToCodeSlug(t.Name) + "_";
                    var codeSlug = "_" + NormalizeToCodeSlug(t.Code) + "_";

                    if ((nameSlug.Length > 2 && fileSlug.Contains(nameSlug)) ||
                        (codeSlug.Length > 2 && fileSlug.Contains(codeSlug)))
                    {
                        return t.Code;
                    }
                }
            }

            return "GENERAL";
        }

        // ─────────────────────────────────────────────────────────────────────
        // Trục 1: Năm chuẩn mực
        // ─────────────────────────────────────────────────────────────────────

        private static int? DetectYear(List<string> banners, string? fileName, string? sheetName)
        {
            var text = $"{string.Join(" ", banners)} {fileName} {sheetName}";

            var labeled = Regex.Match(text, @"(?:năm|nam|đợt\s*\d+\s*năm|niên\s*khóa|khoá|year)\s*[:\-–—]?\s*(20\d{2})", RegexOptions.IgnoreCase);
            if (labeled.Success && int.TryParse(labeled.Groups[1].Value, out var year) && year >= 2000 && year <= 2050)
            {
                return year;
            }

            var bare = Regex.Match(text, @"\b(202[0-9]|201[8-9])\b");
            return bare.Success && int.TryParse(bare.Groups[1].Value, out var bareYear) ? bareYear : null;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Trục 2: Vị trí / Cấp bậc / Khối lớp
        // ─────────────────────────────────────────────────────────────────────

        private static string? DetectTargetLevel(List<string> banners, string? fileName, string? sheetName, string combinedAll, DynamicDomainContext? dynamicContext, string? domainCode = null)
        {
            var preset = MatchPreset(dynamicContext, "TARGET_LEVEL", combinedAll, domainCode);
            if (preset != null) return preset;

            var reconPatterns = dynamicContext?.StructureDictionary?.TaxonomyReconPatterns ?? new TaxonomyReconnaissancePatternsDto();
            foreach (var banner in banners)
            {
                foreach (var pattern in reconPatterns.TargetLevelPatterns)
                {
                    var m = Regex.Match(banner, pattern, RegexOptions.IgnoreCase);
                    if (!m.Success) continue;
                    var extracted = CleanExtractedText(m.Groups[1].Value);
                    if (!string.IsNullOrWhiteSpace(extracted) && extracted.Length > 2)
                    {
                        return NormalizeLevelName(extracted, dynamicContext);
                    }
                }
            }

            return null;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Trục 3: Mục đích sát hạch / Loại kỳ thi
        // ─────────────────────────────────────────────────────────────────────

        private static string? DetectAssessmentPurpose(List<string> banners, string? fileName, string? sheetName, string combinedAll, DynamicDomainContext? dynamicContext, string? domainCode = null)
        {
            var preset = MatchPreset(dynamicContext, "ASSESSMENT_PURPOSE", combinedAll, domainCode);
            if (preset != null) return preset;

            var reconPatterns = dynamicContext?.StructureDictionary?.TaxonomyReconPatterns ?? new TaxonomyReconnaissancePatternsDto();
            foreach (var banner in banners)
            {
                var stripped = Regex.Replace(banner, @"^(?:bộ\s*câu\s*hỏi(?:\s*,\s*đáp\s*án)?\s*(?:ôn\s*tập\s*)?[-–—:]?\s*)", "", RegexOptions.IgnoreCase).Trim();
                foreach (var pattern in reconPatterns.AssessmentPurposePatterns)
                {
                    var m = Regex.Match(stripped, pattern, RegexOptions.IgnoreCase);
                    if (m.Success)
                    {
                        var purpose = Regex.Replace(m.Groups[1].Value.Trim(), @"\s+năm\s+\d{4}$", "", RegexOptions.IgnoreCase).Trim();
                        return NormalizeTitleCase(purpose, dynamicContext);
                    }
                }
            }

            return null;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Trục 4: Đơn vị / Cơ quan ban hành
        // ─────────────────────────────────────────────────────────────────────

        private static string? DetectIssuingOrg(List<string> banners, string? fileName, string combinedAll, DynamicDomainContext? dynamicContext, string? domainCode = null)
        {
            var preset = MatchPreset(dynamicContext, "ISSUING_ORG", combinedAll, domainCode);
            if (preset != null)
            {
                return preset;
            }

            var reconPatterns = dynamicContext?.StructureDictionary?.TaxonomyReconPatterns ?? new TaxonomyReconnaissancePatternsDto();
            foreach (var banner in banners)
            {
                foreach (var pattern in reconPatterns.IssuingOrgPatterns)
                {
                    var m = Regex.Match(banner, pattern, RegexOptions.IgnoreCase);
                    if (m.Success)
                    {
                        var extracted = CleanExtractedText(m.Groups[1].Value);
                        if (!string.IsNullOrWhiteSpace(extracted)) return NormalizeTitleCase(extracted, dynamicContext);
                    }
                }
            }
            return null;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Trục 5: Miền ngành nghề (Dynamic Domains → chuẩn hệ thống dự phòng)
        // ─────────────────────────────────────────────────────────────────────

        private static string DetectDomain(string combinedAll, string? targetLevel, string? purpose, string? org, DynamicDomainContext? dynamicContext)
        {
            if (dynamicContext?.Domains != null && dynamicContext.Domains.Count > 0)
            {
                var cleanAll = CleanToTag(combinedAll);
                var scores = dynamicContext.Domains.ToDictionary(d => d.Code, _ => 0, StringComparer.OrdinalIgnoreCase);

                foreach (var domain in dynamicContext.Domains)
                {
                    if (domain.Code.Equals("GENERAL", StringComparison.OrdinalIgnoreCase)) continue;

                    if (!string.IsNullOrWhiteSpace(domain.Code) && combinedAll.Contains(domain.Code, StringComparison.OrdinalIgnoreCase)) scores[domain.Code] += 5;
                    if (ContainsPhrase(combinedAll, cleanAll, domain.Name)) scores[domain.Code] += 5;
                    scores[domain.Code] += 3 * domain.Synonyms.Count(s => ContainsPhrase(combinedAll, cleanAll, s));

                    if (dynamicContext.CoordinatePresets != null)
                    {
                        foreach (var preset in dynamicContext.CoordinatePresets.Where(p => p.DomainCode.Equals(domain.Code, StringComparison.OrdinalIgnoreCase)))
                        {
                            if (ContainsPhrase(combinedAll, cleanAll, preset.PresetLabel)) scores[domain.Code] += 4;
                            scores[domain.Code] += 2 * preset.Synonyms.Count(s => ContainsPhrase(combinedAll, cleanAll, s));
                        }
                    }

                    if (dynamicContext.Topics != null)
                    {
                        foreach (var topic in dynamicContext.Topics)
                        {
                            bool topicMentioned = combinedAll.Contains(topic.Code, StringComparison.OrdinalIgnoreCase) || ContainsPhrase(combinedAll, cleanAll, topic.Name);
                            if (!topicMentioned) continue;

                            var cleanTopicName = CleanToTag(topic.Name);
                            bool topicBelongsToDomain = domain.Synonyms.Any(s => cleanTopicName.Contains(CleanToTag(s)))
                                                        || (!string.IsNullOrWhiteSpace(domain.Name) && cleanTopicName.Contains(CleanToTag(domain.Name)));
                            if (topicBelongsToDomain) scores[domain.Code] += 4;
                        }
                    }
                }

                var best = scores.OrderByDescending(kv => kv.Value).FirstOrDefault();
                if (best.Value > 0) return best.Key;
            }

            var domainEntries = dynamicContext?.Domains?.Select(d => new DomainTaxonomyEntryDto
            {
                DomainCode = d.Code,
                DomainName = d.Name,
                Keywords = d.Synonyms,
                Weight = 2
            }).ToList();

            if (domainEntries == null || domainEntries.Count == 0)
            {
                domainEntries = DocumentStructureDictionaryDto.GetDefaultDomainTaxonomy();
            }

            var fallbackScores = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            foreach (var entry in domainEntries)
            {
                fallbackScores[entry.DomainCode] = entry.Weight * entry.Keywords.Count(k => combinedAll.Contains(k, StringComparison.OrdinalIgnoreCase));
            }

            var winner = fallbackScores.OrderByDescending(kv => kv.Value).FirstOrDefault();
            return winner.Value > 0 ? winner.Key : "GENERAL";
        }

        // ─────────────────────────────────────────────────────────────────────
        // Trục 5b: Chuẩn mực / Văn bản pháp quy
        // ─────────────────────────────────────────────────────────────────────

        private static string? DetectStandard(string combinedAll, string domain, string? purpose, int? year, DynamicDomainContext? dynamicContext)
        {
            var standardPresets = dynamicContext?.CoordinatePresets?
                .Where(p => p.CoordinateType.Equals("BENCHMARK_STANDARD", StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (standardPresets != null && standardPresets.Count > 0)
            {
                var candidates = standardPresets.Where(p =>
                    string.IsNullOrWhiteSpace(domain)
                    || p.DomainCode.Equals(domain, StringComparison.OrdinalIgnoreCase)
                    || p.DomainCode.Equals("GENERAL", StringComparison.OrdinalIgnoreCase));

                foreach (var preset in candidates)
                {
                    if (PresetMentioned(preset, combinedAll)) return preset.PresetLabel;
                }
            }

            var reconPatterns = dynamicContext?.StructureDictionary?.TaxonomyReconPatterns ?? new TaxonomyReconnaissancePatternsDto();
            foreach (var pattern in reconPatterns.BenchmarkStandardPatterns)
            {
                var m = Regex.Match(combinedAll, pattern, RegexOptions.IgnoreCase);
                if (m.Success)
                {
                    var val = m.Groups[1].Value.Trim();
                    return val.Contains("TT-", StringComparison.OrdinalIgnoreCase) ? val.ToUpperInvariant() : NormalizeTitleCase(val, dynamicContext);
                }
            }

            // Fallback lấy chuẩn mặc định theo Domain từ dynamicContext (triệt tiêu 100% switch-case cứng)
            if (!string.IsNullOrWhiteSpace(domain) && standardPresets != null)
            {
                var defaultStandard = standardPresets.FirstOrDefault(p => p.DomainCode.Equals(domain, StringComparison.OrdinalIgnoreCase));
                if (defaultStandard != null) return defaultStandard.PresetLabel;
            }

            return null;
        }

        private static string ExtractDotNumber(string text)
        {
            var m = Regex.Match(text, @"đợt\s*(\d+)", RegexOptions.IgnoreCase);
            return m.Success ? m.Groups[1].Value : "2";
        }

        // ─────────────────────────────────────────────────────────────────────
        // Smart Tags
        // ─────────────────────────────────────────────────────────────────────

        private static List<string> GenerateSmartTags(CognitiveCoordinateTaxonomyResult res, string? fileName, string? sheetName, DynamicDomainContext? dynamicContext)
        {
            var tags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var dynamicDomain = dynamicContext?.Domains?.FirstOrDefault(d => d.Code.Equals(res.DomainCode, StringComparison.OrdinalIgnoreCase));
            if (dynamicDomain != null)
            {
                var dName = CleanToTag(dynamicDomain.Name);
                if (IsValidSmartTag(dName)) tags.Add(dName);

                var dCode = CleanToTag(dynamicDomain.Code);
                if (IsValidSmartTag(dCode)) tags.Add(dCode);
            }

            if (dynamicContext?.CoordinatePresets != null)
            {
                foreach (var preset in dynamicContext.CoordinatePresets)
                {
                    bool presetSelected = string.Equals(preset.PresetLabel, res.TargetLevel, StringComparison.OrdinalIgnoreCase)
                                          || string.Equals(preset.PresetLabel, res.IssuingOrg, StringComparison.OrdinalIgnoreCase)
                                          || string.Equals(preset.PresetLabel, res.BenchmarkStandard, StringComparison.OrdinalIgnoreCase)
                                          || string.Equals(preset.PresetLabel, res.AssessmentPurpose, StringComparison.OrdinalIgnoreCase);

                    if (presetSelected)
                    {
                        var pCode = CleanToTag(preset.PresetCode);
                        if (IsValidSmartTag(pCode)) tags.Add(pCode);

                        var pLabel = CleanToTag(preset.PresetLabel);
                        if (IsValidSmartTag(pLabel)) tags.Add(pLabel);

                        if (preset.Synonyms != null)
                        {
                            foreach (var s in preset.Synonyms.Take(1))
                            {
                                var cleanSyn = CleanToTag(s);
                                if (IsValidSmartTag(cleanSyn))
                                {
                                    tags.Add(cleanSyn);
                                }
                            }
                        }
                    }
                }
            }

            if (res.BenchmarkYear.HasValue)
            {
                tags.Add($"nam-{res.BenchmarkYear}");

                if (!string.IsNullOrWhiteSpace(res.AssessmentPurpose))
                {
                    var dotMatch = Regex.Match(res.AssessmentPurpose, @"đợt\s*(\d+)", RegexOptions.IgnoreCase);
                    if (dotMatch.Success)
                    {
                        tags.Add($"dot-{dotMatch.Groups[1].Value}-{res.BenchmarkYear}");
                    }
                }
            }

            if (!string.IsNullOrWhiteSpace(res.TargetLevel))
            {
                var lvl = CleanToTag(res.TargetLevel);
                if (IsValidSmartTag(lvl)) tags.Add(lvl);
            }

            if (!string.IsNullOrWhiteSpace(res.IssuingOrg))
            {
                var org = CleanToTag(res.IssuingOrg);
                if (IsValidSmartTag(org)) tags.Add(org);
                if (res.IssuingOrg.Contains("Chi nhánh", StringComparison.OrdinalIgnoreCase)) tags.Add("chi-nhanh");
            }

            if (!string.IsNullOrWhiteSpace(res.BenchmarkStandard))
            {
                var std = CleanToTag(res.BenchmarkStandard);
                if (IsValidSmartTag(std)) tags.Add(std);
            }

            if (!string.IsNullOrWhiteSpace(fileName))
            {
                var lowerFile = fileName.ToLowerInvariant();
                if (lowerFile.Contains("tin dung") || lowerFile.Contains("tín dụng")) tags.Add("tin-dung");
            }

            return tags.Where(IsValidSmartTag).Take(12).ToList();
        }

        // ─────────────────────────────────────────────────────────────────────
        // Tiện ích dùng chung
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>Giới hạn ký tự mỗi mẫu nội dung đưa vào nhận diện tọa độ — tín hiệu phân loại nằm ở vài nghìn ký tự đầu.</summary>
        private const int MaxSampleChars = 4000;

        private static readonly Regex EmbeddedMediaPattern =
            new(@"!\[[^\]]*\]\([^)]*\)|data:[a-z0-9.+/-]+;base64,[A-Za-z0-9+/=\r\n]+", RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /// <summary>
        /// Loại bỏ ảnh nhúng (data URI / markdown image) và cắt ngắn mẫu nội dung: ảnh base64 có thể dài hàng trăm KB,
        /// không mang tín hiệu tọa độ nhưng làm mọi Regex phía sau quét hàng GB trên tài liệu lớn.
        /// </summary>
        private static string SanitizeSample(string? sample)
        {
            if (string.IsNullOrEmpty(sample)) return string.Empty;
            var cleaned = sample.Contains("data:", StringComparison.OrdinalIgnoreCase) || sample.Contains("![", StringComparison.Ordinal)
                ? EmbeddedMediaPattern.Replace(sample, " ")
                : sample;
            return cleaned.Length > MaxSampleChars ? cleaned.Substring(0, MaxSampleChars) : cleaned;
        }

        /// <summary>Tìm preset của Tenant theo loại tọa độ có nhãn hoặc từ đồng nghĩa xuất hiện trong văn bản (cô lập theo Domain).</summary>
        private static string? MatchPreset(DynamicDomainContext? dynamicContext, string coordinateType, string combinedAll, string? domainCode = null)
        {
            if (dynamicContext?.CoordinatePresets == null || dynamicContext.CoordinatePresets.Count == 0) return null;

            var candidates = dynamicContext.CoordinatePresets
                .Where(p => p.CoordinateType.Equals(coordinateType, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrWhiteSpace(domainCode) && domainCode != "GENERAL")
            {
                candidates = candidates.Where(p =>
                    string.IsNullOrWhiteSpace(p.DomainCode)
                    || p.DomainCode.Equals("GENERAL", StringComparison.OrdinalIgnoreCase)
                    || p.DomainCode.Equals(domainCode, StringComparison.OrdinalIgnoreCase));
            }

            foreach (var preset in candidates)
            {
                if (PresetMentioned(preset, combinedAll)) return preset.PresetLabel;
            }
            return null;
        }

        private static bool PresetMentioned(TenantCoordinatePresetDto preset, string combinedAll)
        {
            if (!string.IsNullOrWhiteSpace(preset.PresetLabel) && IsSafeWordOrPhraseMatch(preset.PresetLabel, combinedAll)) return true;
            return preset.Synonyms.Any(s => !string.IsNullOrWhiteSpace(s) && IsSafeWordOrPhraseMatch(s, combinedAll));
        }

        /// <summary>
        /// So khớp chuỗi an toàn: Đối với các từ viết tắt / từ ngắn (&lt;= 4 ký tự như 'aml', 'nhno', 'vcb', 'thpt'),
        /// bắt buộc phải khớp theo ranh giới từ (\b) để tránh nhận diện nhầm các công thức hóa học hay ký hiệu con.
        /// </summary>
        private static bool IsSafeWordOrPhraseMatch(string candidate, string source)
        {
            if (string.IsNullOrWhiteSpace(candidate) || string.IsNullOrWhiteSpace(source)) return false;
            var trimmed = candidate.Trim();
            if (trimmed.Length <= 4)
            {
                return Regex.IsMatch(source, $@"(?i)\b{Regex.Escape(trimmed)}\b");
            }
            return source.Contains(trimmed, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>Cụm từ xuất hiện trong văn bản gốc (không phân biệt hoa/thường) hoặc trong dạng slug đã bỏ dấu.</summary>
        private static bool ContainsPhrase(string combinedAll, string cleanAll, string? phrase)
        {
            if (string.IsNullOrWhiteSpace(phrase)) return false;
            return combinedAll.Contains(phrase, StringComparison.OrdinalIgnoreCase) || cleanAll.Contains(CleanToTag(phrase));
        }

        private static void AddTag(HashSet<string> tags, string tag)
        {
            if (!string.IsNullOrWhiteSpace(tag)) tags.Add(tag);
        }

        private static string CleanExtractedText(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;
            return Regex.Replace(input, @"[|\t]+", " ").Trim(' ', ':', '-', '–', '—');
        }

        private static string NormalizeLevelName(string text, DynamicDomainContext? dynamicContext = null)
        {
            var trimmed = text.Trim();
            if (dynamicContext?.CoordinatePresets != null)
            {
                var matched = dynamicContext.CoordinatePresets.FirstOrDefault(p =>
                    p.CoordinateType.Equals("TARGET_LEVEL", StringComparison.OrdinalIgnoreCase) &&
                    (p.PresetCode.Equals(trimmed, StringComparison.OrdinalIgnoreCase)
                     || p.PresetLabel.Equals(trimmed, StringComparison.OrdinalIgnoreCase)
                     || p.Synonyms.Any(s => s.Equals(trimmed, StringComparison.OrdinalIgnoreCase))));
                if (matched != null) return matched.PresetLabel;
            }
            return NormalizeTitleCase(trimmed, dynamicContext);
        }

        private static readonly HashSet<string> LowerCaseConnectors = new(StringComparer.OrdinalIgnoreCase)
            { "và", "với", "tại", "cho", "của", "and", "or", "for", "of", "with", "in", "on", "at" };

        /// <summary>Viết hoa chữ cái đầu mỗi từ; giữ nguyên viết tắt chuyên ngành nạp động từ Dictionary; hạ thường liên từ đa ngôn ngữ.</summary>
        public static string NormalizeTitleCase(string input, DynamicDomainContext? dynamicContext = null)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;

            var acronyms = new HashSet<string>(dynamicContext?.StructureDictionary?.KnownAcronyms ?? DocumentStructureDictionaryDto.GetDefaultAcronyms(), StringComparer.OrdinalIgnoreCase);
            if (dynamicContext?.Domains != null)
            {
                foreach (var d in dynamicContext.Domains)
                {
                    if (!string.IsNullOrWhiteSpace(d.Code)) acronyms.Add(d.Code);
                }
            }
            if (dynamicContext?.Topics != null)
            {
                foreach (var t in dynamicContext.Topics)
                {
                    if (!string.IsNullOrWhiteSpace(t.Code)) acronyms.Add(t.Code);
                }
            }

            var words = input.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var sb = new StringBuilder();
            for (int i = 0; i < words.Length; i++)
            {
                var word = words[i];
                if (word.Length == 1) sb.Append(char.ToUpper(word[0]));
                else if (acronyms.Contains(word)) sb.Append(word.ToUpperInvariant());
                else if (i > 0 && LowerCaseConnectors.Contains(word)) sb.Append(word.ToLowerInvariant());
                else sb.Append(char.ToUpper(word[0])).Append(word.Substring(1).ToLowerInvariant());

                if (i < words.Length - 1) sb.Append(' ');
            }
            return sb.ToString();
        }

        /// <summary>Chuyển cụm từ thành slug không dấu, chữ thường, phân cách bằng "-" (ví dụ "Tín dụng KHDN" → "tin-dung-khdn").</summary>
        private static string CleanToTag(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;

            var sb = new StringBuilder();
            foreach (var c in input.Normalize(NormalizationForm.FormD))
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue;
                if (char.IsLetterOrDigit(c)) sb.Append(char.ToLowerInvariant(c));
                else if (char.IsWhiteSpace(c) || c == '-' || c == '_') sb.Append('-');
            }
            return Regex.Replace(sb.ToString(), "-+", "-").Trim('-');
        }

        private static readonly HashSet<string> BlacklistedTagStopWords = new(StringComparer.OrdinalIgnoreCase)
        {
            "cau-hoi", "trac-nghiem", "tu-luan", "bai-tap", "de-thi", "kiem-tra", "dap-an",
            "thi-sinh", "giam-thi", "can-bo-coi-thi", "thoi-gian", "so-bao-danh", "default", "general"
        };

        /// <summary>
        /// Kiểm định thẻ thông minh có đạt chuẩn khảo thí Enterprise hay không:
        /// - Độ dài: từ 2 đến 24 ký tự.
        /// - Tối đa 3 dấu gạch nối (tối đa 4 từ đơn).
        /// - Không thuộc danh sách từ dừng rác (stop-words).
        /// </summary>
        public static bool IsValidSmartTag(string? tag)
        {
            if (string.IsNullOrWhiteSpace(tag)) return false;
            var t = tag.Trim().Trim('#');
            if (t.Length < 2 || t.Length > 24) return false;

            int hyphens = t.Count(c => c == '-');
            if (hyphens > 3) return false;

            if (BlacklistedTagStopWords.Contains(t)) return false;

            return true;
        }

        /// <summary>
        /// Trích xuất mã đề thi ngắn gọn (ví dụ "Đề 101" -> "de-101", "Mã đề DE_02" -> "de-02").
        /// Loại bỏ các câu văn miêu tả đề thi dài (> 24 ký tự).
        /// </summary>
        public static string ExtractShortExamCode(string? examName)
        {
            if (string.IsNullOrWhiteSpace(examName)) return string.Empty;
            var trimmed = examName.Trim();
            if (trimmed.Equals("DEFAULT", StringComparison.OrdinalIgnoreCase)) return string.Empty;

            var m = Regex.Match(trimmed, @"(?i)(?:MÃ\s*ĐỀ|ĐỀ\s*SỐ|ĐỀ|DE|EXAM|CODE)[\s\:\-\._]+([A-Z0-9_\-]+)\b");
            if (m.Success)
            {
                var code = m.Groups[1].Value.Trim().Trim('_');
                if (code.Length >= 1 && code.Length <= 10)
                {
                    return "de-" + code.ToLowerInvariant();
                }
            }

            // Nếu examName đã là mã số thuần túy (ví dụ "0323", "101", "01")
            if (Regex.IsMatch(trimmed, @"^\d{2,6}$"))
            {
                return "de-" + trimmed.ToLowerInvariant();
            }

            if (trimmed.Length <= 15) return trimmed;
            return string.Empty;
        }

        /// <summary>
        /// Trích xuất mã phân đoạn ngắn gọn (ví dụ "PHẦN I: Câu hỏi trắc nghiệm..." -> "phan-i").
        /// Loại bỏ câu văn mô tả phân đoạn dài đằng sau.
        /// </summary>
        public static string ExtractShortSectionCode(string? sectionName)
        {
            if (string.IsNullOrWhiteSpace(sectionName)) return string.Empty;
            var trimmed = sectionName.Trim();

            var m = Regex.Match(trimmed, @"(?i)^(?:PHẦN|PHAN|PART|SECTION)\s*([0-9IVXABCD]+)\b");
            if (m.Success)
            {
                return "phan-" + m.Groups[1].Value.ToLowerInvariant();
            }

            if (trimmed.Length <= 15) return trimmed;
            return string.Empty;
        }

        /// <summary>
        /// Cắt tỉa, loại bỏ trùng lặp và chuẩn hóa danh sách thẻ theo giới hạn tối đa (Cardinality Cap).
        /// </summary>
        public static void PruneAndNormalizeTags(List<string>? tags, int maxTags = 5)
        {
            if (tags == null || tags.Count == 0) return;

            var normalized = new List<string>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var raw in tags)
            {
                if (string.IsNullOrWhiteSpace(raw)) continue;
                var clean = CleanToTag(raw.TrimStart('#'));
                if (!IsValidSmartTag(clean)) continue;

                if (seen.Add(clean))
                {
                    normalized.Add(clean);
                }
            }

            tags.Clear();
            tags.AddRange(normalized.Take(maxTags));
        }

        public static string NormalizeToCodeSlug(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return string.Empty;
            var normalized = text.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();
            foreach (var c in normalized)
            {
                var uc = CharUnicodeInfo.GetUnicodeCategory(c);
                if (uc != UnicodeCategory.NonSpacingMark)
                {
                    if (char.IsLetterOrDigit(c)) sb.Append(char.ToUpperInvariant(c));
                    else if (sb.Length > 0 && sb[sb.Length - 1] != '_') sb.Append('_');
                }
            }
            return sb.ToString().Trim('_');
        }

        public static bool IsAcademicTopic(string? topicCode, DynamicDomainContext? ctx = null)
        {
            if (string.IsNullOrWhiteSpace(topicCode)) return false;

            if (ctx?.Topics != null)
            {
                var matched = ctx.Topics.FirstOrDefault(t => t.Code.Equals(topicCode, StringComparison.OrdinalIgnoreCase));
                if (matched != null && !string.IsNullOrWhiteSpace(matched.DomainCode))
                {
                    return matched.DomainCode.Equals("EDUCATION", StringComparison.OrdinalIgnoreCase);
                }
            }

            // Tra cứu qua danh mục Taxonomy cấu hình (Zero Hard-code)
            var defaultTaxonomy = DocumentStructureDictionaryDto.GetDefaultTopicTaxonomy();
            var entry = defaultTaxonomy.FirstOrDefault(t => t.TopicCode.Equals(topicCode, StringComparison.OrdinalIgnoreCase));
            return entry != null && entry.DomainCode.Equals("EDUCATION", StringComparison.OrdinalIgnoreCase);
        }

        public static string ResolveTopicCode(string raw, DynamicDomainContext? ctx = null)
        {
            var clean = raw.Trim();
            if (string.IsNullOrWhiteSpace(clean)) return "GENERAL";

            var effectiveCtx = ctx ?? DynamicDomainContext.CreateDefault();
            var slug = NormalizeToCodeSlug(clean);

            // 1. Bảo vệ: Loại bỏ các từ khóa kỳ thi / môn thi chung
            if (slug.Contains("KY_THI") || slug.Contains("THPT") || slug.Contains("TUYEN_SINH") 
                || slug == "EDUCATION" || slug == "GIAO_DUC" || slug == "GENERAL" 
                || slug == "MON" || slug == "MON_THI" || slug == "BAI_THI" || slug == "BAI")
            {
                return "GENERAL";
            }

            // 1b. Khử các tiền tố phân mục thông dụng ("Chủ đề 1:", "Chương 2:", "Module 3:", "Phần 1:").
            // Nếu chuỗi chứa prefix đề mục, thử trích xuất phần tên môn học sau dấu hai chấm.
            var prefixMatch = Regex.Match(clean, @"^(?:CHỦ\s*ĐỀ|CHU\s*DE|CHƯƠNG|CHUONG|HỌC\s*PHẦN|MODULE|PHẦN|PART|SECTION)\s*(?:[0-9IVXABCD]+)?\s*[\.\:\-]\s*(.+)$", RegexOptions.IgnoreCase);
            if (prefixMatch.Success)
            {
                var stripped = prefixMatch.Groups[1].Value.Trim();
                var resolvedFromStripped = ResolveTopicCode(stripped, effectiveCtx);
                if (resolvedFromStripped != "GENERAL") return resolvedFromStripped;
            }

            // 2. Khớp theo danh mục Topics động từ DB của Tenant (DynamicDomainContext - Zero Hard-code)
            bool IsSafeKeywordMatch(string kw, string cleanText, string slugText)
            {
                if (string.IsNullOrWhiteSpace(kw)) return false;
                var trimmedKw = kw.Trim();
                // Bỏ qua các từ khóa quá ngắn hoặc ký tự biểu thức (y =, x =, dx, dy...) để tránh nhận nhầm chữ cái đơn lẻ
                if (trimmedKw.Length < 2) return false;

                // 1. So khớp token slug nguyên từ (ngăn ngừa "hoa" khớp vào "khoa")
                var kwSlug = NormalizeToCodeSlug(trimmedKw);
                if (kwSlug.Length >= 2)
                {
                    var surrounded = "_" + slugText + "_";
                    if (surrounded.Contains("_" + kwSlug + "_"))
                    {
                        return true;
                    }
                }

                // 2. So khớp từ nguyên vẹn với word boundary
                if (trimmedKw.Length >= 4 && cleanText.Contains(trimmedKw, StringComparison.OrdinalIgnoreCase))
                {
                    var pattern = $@"(?i)(?:^|[^\p{{L}}\d]){Regex.Escape(trimmedKw)}(?:$|[^\p{{L}}\d])";
                    if (Regex.IsMatch(cleanText, pattern))
                    {
                        return true;
                    }
                }

                return false;
            }

            if (effectiveCtx.Topics != null && effectiveCtx.Topics.Count > 0)
            {
                var sortedTopics = effectiveCtx.Topics
                    .Where(t => !string.Equals(t.Code, "GENERAL", StringComparison.OrdinalIgnoreCase) &&
                                !string.Equals(t.Code, "EDUCATION", StringComparison.OrdinalIgnoreCase))
                    .OrderByDescending(t => t.Name?.Length ?? 0)
                    .ThenByDescending(t => t.Code.Length);

                var foundTopic = sortedTopics.FirstOrDefault(t =>
                    t.Code.Equals(clean, StringComparison.OrdinalIgnoreCase)
                    || t.Name.Equals(clean, StringComparison.OrdinalIgnoreCase)
                    || slug.Equals(NormalizeToCodeSlug(t.Code), StringComparison.OrdinalIgnoreCase)
                    || slug.Equals(NormalizeToCodeSlug(t.Name), StringComparison.OrdinalIgnoreCase)
                    || (clean.Length > 2 && t.Name.Contains(clean, StringComparison.OrdinalIgnoreCase))
                    || (t.Name.Length > 2 && clean.Contains(t.Name, StringComparison.OrdinalIgnoreCase))
                    || t.Keywords.Any(kw => IsSafeKeywordMatch(kw, clean, slug)));
                if (foundTopic != null) return foundTopic.Code;
            }

            // 3. Khớp qua Từ điển Taxonomy cấu hình đa ngôn ngữ (DocumentStructureDictionary / DB / SSoT)
            var taxonomyEntries = DocumentStructureDictionaryDto.GetDefaultTopicTaxonomy();
            foreach (var entry in taxonomyEntries)
            {
                if (entry.MatchesCodeOrAlias(clean)
                    || entry.TopicName.Equals(clean, StringComparison.OrdinalIgnoreCase)
                    || (entry.LocalizedNames != null && entry.LocalizedNames.Values.Any(n => n.Equals(clean, StringComparison.OrdinalIgnoreCase))))
                {
                    return entry.TopicCode;
                }

                if (entry.Keywords.Any(kw => IsSafeKeywordMatch(kw, clean, slug)))
                {
                    return entry.TopicCode;
                }
            }

            // 4. Bảo vệ SSoT: Tuyệt đối KHÔNG trả về slug tự do để tránh tạo chủ đề rác từ đề mục bài học (Zero Topic Fragmentation)
            return "GENERAL";
        }

        /// <summary>
        /// Suy luận mã môn học từ nội dung văn bản dựa trên danh mục Topics của DynamicDomainContext và ngữ liệu.
        /// Triệt tiêu 100% hardcode và cạm bẫy đếm từ dừng ('in', 'at', 'is') trong đề KHTN.
        /// </summary>
        public static string InferTopicFromContent(string content, DynamicDomainContext? ctx = null)
        {
            if (string.IsNullOrWhiteSpace(content)) return "GENERAL";

            var effectiveCtx = ctx ?? DynamicDomainContext.CreateDefault();
            var lowerContent = content.ToLowerInvariant();

            // 1. Đối chiếu danh mục Topics động 100% từ Database / DynamicDomainContext (Zero Hard-code)
            if (effectiveCtx.Topics != null && effectiveCtx.Topics.Count > 0)
            {
                foreach (var t in effectiveCtx.Topics)
                {
                    if (string.Equals(t.Code, "GENERAL", StringComparison.OrdinalIgnoreCase) || string.Equals(t.Code, "EDUCATION", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (t.Keywords.Any(k => !string.IsNullOrWhiteSpace(k) && lowerContent.Contains(k.ToLowerInvariant())) || (!string.IsNullOrWhiteSpace(t.Name) && lowerContent.Contains(t.Name.ToLowerInvariant())))
                        return t.Code;
                }
            }

            // 2. Dự phòng nhận diện câu hỏi Ngoại ngữ thông qua mẫu câu trắc nghiệm ngôn ngữ đặc thù (tránh bẫy từ dừng ngắn)
            if (Regex.IsMatch(lowerContent, @"\b(?:which\s+of\s+the\s+following|according\s+to\s+the\s+passage|closest\s+in\s+meaning|opposite\s+in\s+meaning|mark\s+the\s+letter\s+[A-D]|pronunciation\s+of|stressed\s+syllable|choose\s+the\s+correct\s+word|fill\s+in\s+the\s+blank)\b"))
            {
                var englishTopic = effectiveCtx.Topics?.FirstOrDefault(t => t.Code == "TIENG_ANH" || t.Code == "ENGLISH");
                return englishTopic != null ? englishTopic.Code : "TIENG_ANH";
            }

            return "GENERAL";
        }

        /// <summary>
        /// [Universal Cognitive Ingestion] Tự động làm giàu Hệ 5 trục tọa độ & Thẻ thông minh cho thực thể QuestionBase.
        /// </summary>
        public static void AutoEnrichTaxonomyAndTags(QuestionBase q, DynamicDomainContext? ctx = null)
        {
            if (q == null) return;
            q.Tags ??= new List<string>();

            bool hasEnvelope = !string.IsNullOrWhiteSpace(q.DomainCode) && q.DomainCode != "GENERAL"
                               && !string.IsNullOrWhiteSpace(q.IssuingOrg) && q.IssuingOrg != "GDDT"
                               && q.BenchmarkYear.HasValue;

            if (hasEnvelope)
            {
                if (!string.IsNullOrWhiteSpace(q.CategoryCode) && q.CategoryCode != "GENERAL")
                {
                    var cleanCat = CleanToTag(q.CategoryCode);
                    if (IsValidSmartTag(cleanCat)) AddTagIfNotExists(q.Tags, cleanCat);
                }
                PruneAndNormalizeTags(q.Tags, maxTags: 5);
                return;
            }

            var sniffed = SniffCoordinates(
                fileName: null,
                sheetName: q.CategoryCode,
                headerBannerLines: null,
                sampleContents: new[] { q.Content },
                sampleReferences: string.IsNullOrWhiteSpace(q.Explanation) ? null : new[] { q.Explanation },
                dynamicContext: ctx);

            if (string.IsNullOrWhiteSpace(q.DomainCode) || q.DomainCode == "GENERAL")
            {
                q.DomainCode = sniffed.DomainCode;
            }

            try
            {
                var dict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(q.Payload.RootElement.GetRawText()) 
                           ?? new Dictionary<string, object>();

                if (!dict.ContainsKey("targetLevel") && !string.IsNullOrWhiteSpace(sniffed.TargetLevel))
                    dict["targetLevel"] = sniffed.TargetLevel;

                if (!dict.ContainsKey("assessmentPurpose") && !string.IsNullOrWhiteSpace(sniffed.AssessmentPurpose))
                    dict["assessmentPurpose"] = sniffed.AssessmentPurpose;

                if (!dict.ContainsKey("issuingOrg"))
                    dict["issuingOrg"] = sniffed.IssuingOrg ?? "GDDT";

                if (!dict.ContainsKey("benchmarkYear"))
                    dict["benchmarkYear"] = sniffed.BenchmarkYear ?? 2026;

                if (!dict.ContainsKey("benchmarkStandard"))
                    dict["benchmarkStandard"] = sniffed.BenchmarkStandard ?? "CIG V3";

                if (!dict.ContainsKey("canonicalTopicCode") && !string.IsNullOrWhiteSpace(sniffed.CanonicalTopicCode))
                    dict["canonicalTopicCode"] = sniffed.CanonicalTopicCode;

                if (!dict.ContainsKey("treePath") && !string.IsNullOrWhiteSpace(sniffed.TreePath))
                    dict["treePath"] = sniffed.TreePath;

                if (!dict.ContainsKey("friendlyTopicName") && !string.IsNullOrWhiteSpace(sniffed.FriendlyTopicName))
                    dict["friendlyTopicName"] = sniffed.FriendlyTopicName;

                if (!dict.ContainsKey("curriculumSeries") && !string.IsNullOrWhiteSpace(sniffed.CurriculumSeries))
                    dict["curriculumSeries"] = sniffed.CurriculumSeries;

                if (!dict.ContainsKey("semesterPhase") && !string.IsNullOrWhiteSpace(sniffed.SemesterPhase))
                    dict["semesterPhase"] = sniffed.SemesterPhase;

                q.Payload = System.Text.Json.JsonDocument.Parse(System.Text.Json.JsonSerializer.Serialize(dict));
            }
            catch
            {
                // Bỏ qua nếu payload không thể deserialize
            }

            foreach (var t in sniffed.Tags.Take(2))
            {
                AddTagIfNotExists(q.Tags, t);
            }

            PruneAndNormalizeTags(q.Tags, maxTags: 5);
        }

        /// <summary>
        /// [Universal Cognitive Ingestion] Tự động làm giàu Hệ 5 trục tọa độ & Thẻ thông minh cho câu hỏi.
        /// Tuân thủ nghiêm ngặt mô hình 2 tầng: Kế thừa Vỏ bọc đề thi (Document Envelope) và chỉ bóc tách biến đổi vi mô (Item Delta).
        /// </summary>
        public static void AutoEnrichTaxonomyAndTags(DocxImportPreviewDto q, DynamicDomainContext? ctx = null)
        {
            q.Tags ??= new List<string>();

            // 1. Nếu câu hỏi đã có sẵn tọa độ kế thừa từ Vỏ bọc Header đề thi, bảo toàn tuyệt đối không quét lại nội dung
            bool hasEnvelope = !string.IsNullOrWhiteSpace(q.DomainCode) && q.DomainCode != "GENERAL"
                               && !string.IsNullOrWhiteSpace(q.IssuingOrg) && q.IssuingOrg != "GDDT"
                               && q.BenchmarkYear.HasValue;

            if (hasEnvelope)
            {
                if (string.IsNullOrEmpty(q.CanonicalTopicCode))
                {
                    var envelopeResult = new CognitiveCoordinateTaxonomyResult
                    {
                        DomainCode = q.DomainCode,
                        TopicCode = q.TopicCode,
                        TargetLevel = q.TargetLevel,
                        AssessmentPurpose = q.AssessmentPurpose
                    };
                    SynthesizeCanonicalTaxonomy(envelopeResult, $"{q.SourceFileName} {q.ContextTitle} {q.SubCategory} {q.SourceExamName}", q.SourceFileName, ctx);
                    q.CanonicalTopicCode ??= envelopeResult.CanonicalTopicCode;
                    q.TreePath ??= envelopeResult.TreePath;
                    q.FriendlyTopicName ??= envelopeResult.FriendlyTopicName;
                    q.CurriculumSeries ??= envelopeResult.CurriculumSeries;
                    q.SemesterPhase ??= envelopeResult.SemesterPhase;
                }

                EnrichItemDeltaTags(q);
                return;
            }

            // 2. Dự phòng: Chỉ quét nội dung khi câu hỏi chưa có vỏ bọc nhận thức từ Header
            var sniffed = SniffCoordinates(
                fileName: q.SourceFileName,
                sheetName: q.TopicCode,
                headerBannerLines: new[] { q.ContextTitle ?? "", q.SubCategory ?? "" },
                sampleContents: new[] { q.Content },
                sampleReferences: string.IsNullOrWhiteSpace(q.AiExplanation) ? null : new[] { q.AiExplanation },
                dynamicContext: ctx);

            if (string.IsNullOrWhiteSpace(q.DomainCode) || q.DomainCode == "GENERAL")
            {
                q.DomainCode = sniffed.DomainCode;
            }

            if (string.IsNullOrWhiteSpace(q.TargetLevel))
            {
                q.TargetLevel = sniffed.TargetLevel;
            }

            q.AssessmentPurpose ??= sniffed.AssessmentPurpose;
            q.IssuingOrg = sniffed.IssuingOrg ?? q.IssuingOrg ?? "GDDT";
            q.BenchmarkYear = sniffed.BenchmarkYear ?? q.BenchmarkYear ?? 2026;
            q.BenchmarkStandard = sniffed.BenchmarkStandard ?? q.BenchmarkStandard ?? "CIG V3";
            q.CanonicalTopicCode ??= sniffed.CanonicalTopicCode;
            q.TreePath ??= sniffed.TreePath;
            q.FriendlyTopicName ??= sniffed.FriendlyTopicName;
            q.CurriculumSeries ??= sniffed.CurriculumSeries;
            q.SemesterPhase ??= sniffed.SemesterPhase;

            if (string.IsNullOrWhiteSpace(q.OrgUnitName) && !string.IsNullOrWhiteSpace(q.IssuingOrg) && q.IssuingOrg.Contains("Trường", StringComparison.OrdinalIgnoreCase))
            {
                q.OrgUnitName = q.IssuingOrg;
            }

            foreach (var t in sniffed.Tags.Take(2))
            {
                AddTagIfNotExists(q.Tags, t);
            }

            EnrichItemDeltaTags(q);
        }

        /// <summary>
        /// Bổ sung các thẻ vi mô biến đổi theo từng câu hỏi (Phân đoạn, Chuyên đề con, Math/Image).
        /// Áp dụng Syntax Guard khắt khe: độ dài <= 24 ký tự, tối đa 3 từ, không lấy cả câu văn dài.
        /// </summary>
        private static void EnrichItemDeltaTags(DocxImportPreviewDto q)
        {
            var deltaTags = new List<string>();

            // 1. Thẻ Môn học / Chủ đề vi mô: Chỉ thêm 1 slug chuẩn kebab-case ngắn gọn
            if (!string.IsNullOrWhiteSpace(q.TopicCode) && q.TopicCode != "GENERAL" && q.TopicCode != "EDUCATION")
            {
                var cleanTopic = CleanToTag(q.TopicCode);
                if (IsValidSmartTag(cleanTopic))
                {
                    deltaTags.Add(cleanTopic);
                }
            }

            // 2. Thẻ Mã đề thi (Chỉ khi là mã ngắn như "de-101", "de-01", "ma-de-1", KHÔNG lấy cả tiêu đề dài)
            var shortExam = ExtractShortExamCode(q.SourceExamName);
            if (!string.IsNullOrWhiteSpace(shortExam))
            {
                var cleanExam = CleanToTag(shortExam);
                if (IsValidSmartTag(cleanExam))
                {
                    deltaTags.Add(cleanExam);
                }
            }

            // 3. Thẻ Phân đoạn (Chỉ khi là phân đoạn ngắn gọn như "phan-i", "part-1", "phan-1", KHÔNG lấy cả câu miêu tả)
            var shortSec = ExtractShortSectionCode(q.SourceSectionName);
            if (!string.IsNullOrWhiteSpace(shortSec))
            {
                var cleanSec = CleanToTag(shortSec);
                if (IsValidSmartTag(cleanSec))
                {
                    deltaTags.Add(cleanSec);
                }
            }

            // 4. Thẻ Chuyên mục con / Khái niệm vi mô (Ví dụ: "Hàm số", "Đạo hàm", "Hình chóp")
            if (!string.IsNullOrWhiteSpace(q.SubCategory))
            {
                var cleanSub = CleanToTag(q.SubCategory);
                if (IsValidSmartTag(cleanSub))
                {
                    deltaTags.Add(cleanSub);
                }
            }

            // 5. Cờ đặc tính kỹ thuật vi mô
            if (!string.IsNullOrWhiteSpace(q.ContentType) && q.ContentType == "image")
            {
                deltaTags.Add("has-image");
            }
            if (!string.IsNullOrWhiteSpace(q.Content) && (q.Content.Contains("$") || q.Content.Contains(@"\frac") || q.Content.Contains(@"\sqrt") || q.Content.Contains(@"\int") || q.Content.Contains(@"\sum")))
            {
                deltaTags.Add("has-math");
            }

            // Ưu tiên đưa các thẻ vi mô đặc thù của câu hỏi lên đầu, kế thừa các thẻ vĩ mô từ đề thi ở phía sau
            var combined = new List<string>(deltaTags);
            if (q.Tags != null && q.Tags.Count > 0)
            {
                foreach (var t in q.Tags)
                {
                    if (!combined.Contains(t, StringComparer.OrdinalIgnoreCase))
                    {
                        combined.Add(t);
                    }
                }
            }
            q.Tags = combined;

            // 6. Cắt tỉa (Pruning & Cardinality Cap): Chuẩn hóa và giới hạn tối đa 6 tags tinh túy nhất
            PruneAndNormalizeTags(q.Tags, maxTags: 6);
        }

        /// <summary>
        /// [Universal Cognitive Ingestion] Tự động bổ sung Hệ 5 Trục Tọa Độ và Thẻ thông minh cho kết quả UniversalImportPreviewResult.
        /// </summary>
        public static void EnrichExamTaxonomy(UniversalImportPreviewResult result, DynamicDomainContext? dynamicContext = null)
        {
            if (result == null) return;
            if (result.Questions != null && result.Questions.Count > 0)
            {
                EnrichExamTaxonomy(result.Questions, dynamicContext);
            }
        }

        /// <summary>
        /// [Universal Cognitive Ingestion] Tự động bổ sung Hệ 5 Trục Tọa Độ và Thẻ thông minh cấp Đề thi cho danh sách câu hỏi.
        /// </summary>
        public static void EnrichExamTaxonomy(List<DocxImportPreviewDto> results, DynamicDomainContext? dynamicContext = null)
        {
            if (results == null || results.Count == 0) return;

            // Lan tỏa chủ đề chiếm ưu thế (>= 40% câu hỏi hoặc là chủ đề hợp lệ duy nhất) cho toàn bộ đề thi đơn môn
            var nonGeneralTopics = results
                .Where(q => !string.IsNullOrEmpty(q.TopicCode) && q.TopicCode != "GENERAL" && q.TopicCode != "EDUCATION" && q.TopicCode != "THPT_NATIONAL")
                .GroupBy(q => q.TopicCode)
                .OrderByDescending(g => g.Count())
                .ToList();

            if (nonGeneralTopics.Count > 0)
            {
                var dominantTopicGroup = nonGeneralTopics.First();
                bool isSingleSubjectExam = nonGeneralTopics.Count == 1;
                if (dominantTopicGroup.Count() >= results.Count * 0.4 || isSingleSubjectExam)
                {
                    string domCode = dominantTopicGroup.Key;
                    var matchedTopic = dynamicContext?.Topics?.FirstOrDefault(t => t.Code.Equals(domCode, StringComparison.OrdinalIgnoreCase))
                        ?? DynamicDomainContext.CreateDefault().Topics.FirstOrDefault(t => t.Code.Equals(domCode, StringComparison.OrdinalIgnoreCase));
                    string domName = matchedTopic?.Name ?? domCode;

                    foreach (var q in results)
                    {
                        if (string.IsNullOrEmpty(q.TopicCode) || q.TopicCode == "GENERAL" || q.TopicCode == "EDUCATION" || q.TopicCode == "THPT_NATIONAL" || isSingleSubjectExam)
                        {
                            q.TopicCode = domCode;
                        }
                        if (string.IsNullOrEmpty(q.TopicName) || q.TopicName == "GENERAL" || q.TopicName == "EDUCATION" || isSingleSubjectExam)
                        {
                            q.TopicName = domName;
                        }
                    }
                }
            }

            var examGroups = results.GroupBy(q => q.SourceExamName ?? "DEFAULT").ToList();
            foreach (var eg in examGroups)
            {
                var examQuestions = eg.ToList();

                // 1. Ưu tiên tuyệt đối Vỏ bọc Tọa độ đã kế thừa từ Header Đề thi (SSoT)
                var envelopeOrg = examQuestions.FirstOrDefault(q => !string.IsNullOrWhiteSpace(q.IssuingOrg) && q.IssuingOrg != "GDDT")?.IssuingOrg;
                var envelopePurpose = examQuestions.FirstOrDefault(q => !string.IsNullOrWhiteSpace(q.AssessmentPurpose))?.AssessmentPurpose;
                var envelopeLevel = examQuestions.FirstOrDefault(q => !string.IsNullOrWhiteSpace(q.TargetLevel))?.TargetLevel;
                var envelopeYear = examQuestions.FirstOrDefault(q => q.BenchmarkYear.HasValue)?.BenchmarkYear;
                var envelopeStandard = examQuestions.FirstOrDefault(q => !string.IsNullOrWhiteSpace(q.BenchmarkStandard) && q.BenchmarkStandard != "CIG V3")?.BenchmarkStandard;
                var envelopeDomain = examQuestions.FirstOrDefault(q => !string.IsNullOrWhiteSpace(q.DomainCode) && q.DomainCode != "GENERAL")?.DomainCode;

                CognitiveCoordinateTaxonomyResult? fallbackSniffed = null;
                if (envelopeOrg == null && envelopeDomain == null)
                {
                    var sampleQ = examQuestions.Take(5).Select(q => q.Content).ToList();
                    var sampleRefs = examQuestions.Take(5).Select(q => q.AiExplanation ?? "").Where(e => !string.IsNullOrWhiteSpace(e)).ToList();
                    var dominantTopic = examQuestions.Select(q => q.TopicCode).FirstOrDefault(t => !string.IsNullOrEmpty(t) && t != "GENERAL") ?? "GENERAL";

                    fallbackSniffed = SniffCoordinates(
                        fileName: null,
                        sheetName: dominantTopic,
                        headerBannerLines: new[] { eg.Key },
                        sampleContents: sampleQ,
                        sampleReferences: sampleRefs,
                        dynamicContext: dynamicContext);
                }

                foreach (var q in examQuestions)
                {
                    var matchedTopic = dynamicContext?.Topics?.FirstOrDefault(t => t.Code.Equals(q.TopicCode, StringComparison.OrdinalIgnoreCase))
                        ?? DynamicDomainContext.CreateDefault().Topics.FirstOrDefault(t => t.Code.Equals(q.TopicCode, StringComparison.OrdinalIgnoreCase));

                    if (matchedTopic != null && !string.IsNullOrWhiteSpace(matchedTopic.DomainCode) && matchedTopic.DomainCode != "GENERAL")
                    {
                        q.DomainCode = matchedTopic.DomainCode;
                    }
                    else if (string.IsNullOrWhiteSpace(q.DomainCode) || q.DomainCode == "GENERAL")
                    {
                        q.DomainCode = envelopeDomain ?? (!string.IsNullOrWhiteSpace(fallbackSniffed?.DomainCode) && fallbackSniffed.DomainCode != "GENERAL" ? fallbackSniffed.DomainCode : q.TopicCode);
                    }
                    if (string.IsNullOrWhiteSpace(q.TargetLevel)) q.TargetLevel = envelopeLevel ?? fallbackSniffed?.TargetLevel;
                    q.AssessmentPurpose ??= envelopePurpose ?? fallbackSniffed?.AssessmentPurpose;
                    q.IssuingOrg ??= envelopeOrg ?? fallbackSniffed?.IssuingOrg;
                    q.BenchmarkYear ??= envelopeYear ?? fallbackSniffed?.BenchmarkYear;
                    q.BenchmarkStandard ??= envelopeStandard ?? fallbackSniffed?.BenchmarkStandard;

                    q.Tags ??= new List<string>();
                    if (fallbackSniffed?.Tags != null)
                    {
                        foreach (var t in fallbackSniffed.Tags.Take(2))
                        {
                            AddTagIfNotExists(q.Tags, t);
                        }
                    }

                    // Tự động suy luận môn học từ Tags nếu câu hỏi chưa được gán TopicCode chuyên biệt (Zero Hard-code, Database-Driven)
                    if (string.IsNullOrEmpty(q.TopicCode) || q.TopicCode == "GENERAL" || q.TopicCode == "EDUCATION")
                    {
                        var allTopics = dynamicContext?.Topics != null && dynamicContext.Topics.Count > 0
                            ? dynamicContext.Topics
                            : DynamicDomainContext.CreateDefault().Topics;

                        var cleanTags = q.Tags.Select(CleanToTag).ToList();

                        foreach (var topic in allTopics)
                        {
                            if (string.Equals(topic.Code, "GENERAL", StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(topic.Code, "EDUCATION", StringComparison.OrdinalIgnoreCase))
                                continue;

                            string topicCodeClean = CleanToTag(topic.Code);
                            string topicNameClean = CleanToTag(topic.Name);

                            bool matched = cleanTags.Contains(topicCodeClean) ||
                                           cleanTags.Contains(topicNameClean) ||
                                           topic.Keywords.Any(k => !string.IsNullOrWhiteSpace(k) && cleanTags.Contains(CleanToTag(k)));

                            if (matched)
                            {
                                q.TopicCode = topic.Code;
                                q.TopicName = topic.Name;
                                if (!string.IsNullOrWhiteSpace(topic.DomainCode))
                                {
                                    q.DomainCode = topic.DomainCode;
                                }
                                break;
                            }
                        }
                    }

                    PruneAndNormalizeTags(q.Tags, maxTags: 5);
                }
            }
        }

        /// <summary>
        /// [Canonical Topic & Materialized Path Engine]
        /// Chuẩn hóa và tổng hợp mã chủ đề chuẩn tắc (CanonicalTopicCode), cây phả hệ O(1) (TreePath)
        /// và nhãn hiển thị thân thiện giàu ngữ cảnh (FriendlyTopicName).
        /// </summary>
        public static void SynthesizeCanonicalTaxonomy(
            CognitiveCoordinateTaxonomyResult result,
            string combinedText,
            string? fileName = null,
            DynamicDomainContext? dynamicContext = null)
        {
            if (result == null) return;
            var text = $"{fileName} {combinedText}";
            var effectiveCtx = dynamicContext ?? DynamicDomainContext.CreateDefault();
            var dict = effectiveCtx.StructureDictionary ?? new DocumentStructureDictionaryDto();
            var reconPatterns = dict.TaxonomyReconPatterns ?? new TaxonomyReconnaissancePatternsDto();

            // 1. Phân giải Domain (giữ nguyên DomainCode chuẩn "EDUCATION", dùng domainPrefix "EDU" cho treePath và canonicalCode)
            string domain = !string.IsNullOrWhiteSpace(result.DomainCode) && result.DomainCode != "GENERAL"
                ? result.DomainCode.ToUpperInvariant()
                : "EDUCATION";
            if (string.IsNullOrWhiteSpace(result.DomainCode) || result.DomainCode == "GENERAL")
            {
                result.DomainCode = domain;
            }
            string domainPrefix = domain.Equals("EDUCATION", StringComparison.OrdinalIgnoreCase) ? "EDU" : domain;

            // 2. Phân giải TopicCode & TopicName
            string topic = !string.IsNullOrWhiteSpace(result.TopicCode) && result.TopicCode != "GENERAL"
                ? result.TopicCode.ToUpperInvariant()
                : "GENERAL";

            string topicDisplay = !string.IsNullOrWhiteSpace(result.TopicName) && result.TopicName != "GENERAL"
                ? result.TopicName
                : topic;

            // 3. Phân giải Khối lớp / Cấp bậc (Grade) -> Chuẩn hóa K01..K12 hoặc PresetCode
            string gradeCode = "GENERAL";
            string gradeDisplay = "";
            int gradeNum = 0;

            // 3a. Quét từ TargetLevel đã nhận diện trước
            if (!string.IsNullOrWhiteSpace(result.TargetLevel))
            {
                foreach (var gp in reconPatterns.GradeDetectionPatterns)
                {
                    var mLevel = Regex.Match(result.TargetLevel, gp, RegexOptions.IgnoreCase);
                    if (mLevel.Success && int.TryParse(mLevel.Groups[1].Value, out var g1) && g1 >= 1 && g1 <= 12)
                    {
                        gradeNum = g1;
                        break;
                    }
                }
            }

            // 3b. Kiểm tra theo Topics động (ngữ cảnh neo vững chắc: ví dụ "KHTN 7", "Toán 10", "Khoa học tự nhiên 7")
            if (gradeNum == 0 && effectiveCtx.Topics != null)
            {
                foreach (var t in effectiveCtx.Topics)
                {
                    var mTopicCodeGrade = Regex.Match(text, $@"(?i)\b{Regex.Escape(t.Code)}[\s\-_]*(\d{{1,2}})\b");
                    if (mTopicCodeGrade.Success && int.TryParse(mTopicCodeGrade.Groups[1].Value, out var g3) && g3 >= 1 && g3 <= 12)
                    {
                        gradeNum = g3;
                        break;
                    }

                    if (!string.IsNullOrWhiteSpace(t.Name))
                    {
                        var mTopicNameGrade = Regex.Match(text, $@"(?i)\b{Regex.Escape(t.Name)}[\s\-_]*(\d{{1,2}})\b");
                        if (mTopicNameGrade.Success && int.TryParse(mTopicNameGrade.Groups[1].Value, out var g4) && g4 >= 1 && g4 <= 12)
                        {
                            gradeNum = g4;
                            break;
                        }
                    }
                }
            }

            // 3c. Quét từ text tổng hợp và fileName theo GradeDetectionPatterns
            if (gradeNum == 0)
            {
                foreach (var gp in reconPatterns.GradeDetectionPatterns)
                {
                    var mGrade = Regex.Match(text, gp, RegexOptions.IgnoreCase);
                    if (mGrade.Success && int.TryParse(mGrade.Groups[1].Value, out var g2) && g2 >= 1 && g2 <= 12)
                    {
                        gradeNum = g2;
                        break;
                    }
                }
            }

            if (gradeNum >= 1 && gradeNum <= 12)
            {
                gradeCode = $"K{gradeNum:D2}";
                gradeDisplay = $"Lớp {gradeNum}";
            }
            else if (!string.IsNullOrWhiteSpace(result.TargetLevel))
            {
                gradeCode = NormalizeToCodeSlug(result.TargetLevel);
                gradeDisplay = result.TargetLevel;
            }

            // 4. Phân giải Kỳ thi / Giai đoạn học tập (Term / Semester Phase) nạp động từ TermPhaseCatalog (OCP & MultiLang)
            string termCode = "REGULAR";
            string semesterPhase = "REGULAR";
            string termDisplay = "";

            var termCatalog = dict.TermPhaseCatalog != null && dict.TermPhaseCatalog.Count > 0
                ? dict.TermPhaseCatalog
                : DocumentStructureDictionaryDto.GetDefaultTermPhases();

            foreach (var termEntry in termCatalog)
            {
                bool matched = termEntry.Keywords.Any(kw =>
                {
                    if (string.IsNullOrWhiteSpace(kw)) return false;
                    var trimmed = kw.Trim();
                    if (trimmed.Length <= 4)
                        return Regex.IsMatch(text, $@"(?i)\b{Regex.Escape(trimmed)}\b");
                    return text.Contains(trimmed, StringComparison.OrdinalIgnoreCase);
                });

                if (matched)
                {
                    termCode = termEntry.TermCode;
                    semesterPhase = termEntry.SemesterPhase;
                    termDisplay = termEntry.DisplayName;
                    break;
                }
            }

            // 5. Phân giải Bộ sách giáo khoa (Curriculum Series) nạp động từ CurriculumSeriesCatalog (OCP & MultiLang)
            string seriesCode = "CORE";
            string seriesDisplay = "";

            var seriesCatalog = dict.CurriculumSeriesCatalog != null && dict.CurriculumSeriesCatalog.Count > 0
                ? dict.CurriculumSeriesCatalog
                : DocumentStructureDictionaryDto.GetDefaultCurriculumSeries();

            foreach (var seriesEntry in seriesCatalog)
            {
                bool matched = seriesEntry.Keywords.Any(kw =>
                {
                    if (string.IsNullOrWhiteSpace(kw)) return false;
                    var trimmed = kw.Trim();
                    if (trimmed.StartsWith(@"\b") || trimmed.Contains(@"\b") || trimmed.Contains(@"^"))
                        return Regex.IsMatch(text, "(?i)" + trimmed);
                    if (trimmed.Length <= 4)
                        return Regex.IsMatch(text, $@"(?i)\b{Regex.Escape(trimmed)}\b");
                    return text.Contains(trimmed, StringComparison.OrdinalIgnoreCase);
                });

                if (matched)
                {
                    seriesCode = seriesEntry.SeriesCode;
                    seriesDisplay = seriesEntry.DisplayName;
                    break;
                }
            }

            // 6. Tổng hợp CanonicalTopicCode & TreePath & FriendlyTopicName
            result.CanonicalTopicCode = $"{domainPrefix}_{topic}_{gradeCode}_{termCode}_{seriesCode}";
            result.TreePath = $"/{domainPrefix}/{topic}/{gradeCode}/{termCode}/{seriesCode}/";
            result.CurriculumSeries = string.IsNullOrEmpty(seriesDisplay) ? null : seriesDisplay;
            result.SemesterPhase = semesterPhase;

            var sbFriendly = new StringBuilder();
            sbFriendly.Append(topicDisplay);
            if (gradeNum > 0)
            {
                sbFriendly.Append($" {gradeNum}");
            }
            else if (!string.IsNullOrEmpty(gradeDisplay))
            {
                sbFriendly.Append($" — {gradeDisplay}");
            }

            if (!string.IsNullOrEmpty(termDisplay))
            {
                sbFriendly.Append($" — {termDisplay}");
            }

            if (!string.IsNullOrEmpty(seriesDisplay))
            {
                sbFriendly.Append($" ({seriesDisplay})");
            }

            result.FriendlyTopicName = sbFriendly.ToString().Trim();
        }

        private static void AddTagIfNotExists(List<string> tags, string tag)
        {
            if (!tags.Any(t => string.Equals(t, tag, StringComparison.OrdinalIgnoreCase)))
            {
                tags.Add(tag);
            }
        }

        /// <summary>
        /// [SSoT Grade Extraction] Trích xuất và chuẩn hóa khối lớp (K01..K12 hoặc K_GEN) từ QuestionBase và DB BankTopic.
        /// </summary>
        public static string ExtractGrade(QuestionBase question, Dictionary<string, BankTopic>? topicMap = null)
        {
            if (question == null) return "K_GEN";

            // 1. Kiểm tra trực tiếp property Grade
            if (!string.IsNullOrWhiteSpace(question.Grade))
            {
                var mg = Regex.Match(question.Grade, @"(?i)(?:Lớp|K|Khối)?\s*(\d{1,2})");
                if (mg.Success && int.TryParse(mg.Groups[1].Value, out var g)) return $"K{g:D2}";
            }

            // 2. Kiểm tra TreePath (/K07/, /K12/...)
            if (!string.IsNullOrWhiteSpace(question.TreePath))
            {
                var m = Regex.Match(question.TreePath, @"/(K\d{2})/");
                if (m.Success) return m.Groups[1].Value.ToUpperInvariant();
            }

            // 3. Kiểm tra JSONB Payload (grade, targetLevel, treePath, sourceFileName, sourceExamName)
            if (question.Payload != null && question.Payload.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object)
            {
                var root = question.Payload.RootElement;
                if (root.TryGetProperty("grade", out var gProp) && !string.IsNullOrWhiteSpace(gProp.GetString()))
                {
                    var mg = Regex.Match(gProp.GetString()!, @"(?i)(?:Lớp|K|Khối)?\s*(\d{1,2})");
                    if (mg.Success && int.TryParse(mg.Groups[1].Value, out var g)) return $"K{g:D2}";
                }
                if (root.TryGetProperty("targetLevel", out var tlProp) && !string.IsNullOrWhiteSpace(tlProp.GetString()))
                {
                    var mg = Regex.Match(tlProp.GetString()!, @"(?i)(?:Lớp|K|Khối)?\s*(\d{1,2})");
                    if (mg.Success && int.TryParse(mg.Groups[1].Value, out var g)) return $"K{g:D2}";
                }
                if (root.TryGetProperty("treePath", out var tpProp) && !string.IsNullOrWhiteSpace(tpProp.GetString()))
                {
                    var m = Regex.Match(tpProp.GetString()!, @"/(K\d{2})/");
                    if (m.Success) return m.Groups[1].Value.ToUpperInvariant();
                }
                if (root.TryGetProperty("sourceFileName", out var fnProp) && !string.IsNullOrWhiteSpace(fnProp.GetString()))
                {
                    var mFn = Regex.Match(fnProp.GetString()!, @"(?i)(?:Lớp|Khối|K)\s*([1-9]|1[0-2])\b|(?:Tiếng\s*Anh|Toán|Văn|Vật\s*lý|Hóa\s*học|Sinh\s*học|Lịch\s*sử|Địa\s*lý|Tin\s*học|GDCD|KHTN|KHXH|Công\s*nghệ)[-_ ]*([1-9]|1[0-2])\b|[-_]([1-9]|1[0-2])[-_.]");
                    if (mFn.Success)
                    {
                        var gStr = mFn.Groups[1].Success ? mFn.Groups[1].Value : (mFn.Groups[2].Success ? mFn.Groups[2].Value : mFn.Groups[3].Value);
                        if (int.TryParse(gStr, out var gNum) && gNum >= 1 && gNum <= 12) return $"K{gNum:D2}";
                    }
                }
            }

            // 4. Kiểm tra TargetLevel
            if (!string.IsNullOrWhiteSpace(question.TargetLevel))
            {
                var m = Regex.Match(question.TargetLevel, @"(?i)(?:Lớp|K|Khối)?\s*(\d{1,2})");
                if (m.Success && int.TryParse(m.Groups[1].Value, out var g)) return $"K{g:D2}";

                // Tốt nghiệp THPT / Phổ thông trung học quy chuẩn K12
                if (Regex.IsMatch(question.TargetLevel, @"(?i)Tốt\s*nghiệp|TNPT|THPT|Lớp\s*12|Khối\s*12|Phổ\s*thông"))
                    return "K12";
            }

            // 5. Kiểm tra SubCategory
            if (!string.IsNullOrWhiteSpace(question.SubCategory))
            {
                var mSc = Regex.Match(question.SubCategory, @"(?i)(?:Lớp|Khối|K)\s*([1-9]|1[0-2])\b|[-_ ]([1-9]|1[0-2])[-_ ]");
                if (mSc.Success)
                {
                    var gStr = mSc.Groups[1].Success ? mSc.Groups[1].Value : mSc.Groups[2].Value;
                    if (int.TryParse(gStr, out var gNum) && gNum >= 1 && gNum <= 12) return $"K{gNum:D2}";
                }
            }

            // 6. Nhận diện từ Tags
            if (question.Tags != null && question.Tags.Count > 0)
            {
                foreach (var tag in question.Tags)
                {
                    var cleanTag = tag.Trim().TrimStart('#').ToUpperInvariant();
                    if (cleanTag.Contains("TOTNGHIEP") || cleanTag.Contains("THPT") || cleanTag == "K12" || cleanTag == "LOP12")
                        return "K12";
                    var mTag = Regex.Match(cleanTag, @"(?:K|LOP)(\d{1,2})");
                    if (mTag.Success && int.TryParse(mTag.Groups[1].Value, out var gTag)) return $"K{gTag:D2}";
                }
            }

            // 7. Nhận diện từ CategoryCode (e.g. TNPT_TIENG_ANH, TNPT_HOA_HOC -> K12)
            if (!string.IsNullOrWhiteSpace(question.CategoryCode))
            {
                var catUpper = question.CategoryCode.ToUpperInvariant();
                if (catUpper.StartsWith("TNPT_") || catUpper.StartsWith("THPT_") || catUpper.Contains("TOT_NGHIEP") || catUpper.Contains("K12"))
                    return "K12";

                var mCat = Regex.Match(catUpper, @"(?:K|LOP|KHOI)(\d{1,2})");
                if (mCat.Success && int.TryParse(mCat.Groups[1].Value, out var gCat)) return $"K{gCat:D2}";

                // 7.1 Tra cứu phả hệ BankTopic trong DB
                if (topicMap != null && topicMap.TryGetValue(question.CategoryCode, out var bt))
                {
                    string parentName = "";
                    if (bt.ParentId.HasValue)
                    {
                        var parentTopic = topicMap.Values.FirstOrDefault(p => p.Id == bt.ParentId.Value);
                        if (parentTopic != null) parentName = parentTopic.Name;
                    }

                    var blob = $"{bt.Code} {bt.Name} {bt.MaterializedPath} {bt.Description} {parentName}".ToUpperInvariant();
                    if (blob.Contains("TNPT") || blob.Contains("THPT") || blob.Contains("TỐT NGHIỆP") || blob.Contains("TOT NGHIEP") || blob.Contains("PHỔ THÔNG"))
                        return "K12";

                    var mBt = Regex.Match(blob, @"(?:K|LỚP|LOP)(\d{1,2})");
                    if (mBt.Success && int.TryParse(mBt.Groups[1].Value, out var gBt)) return $"K{gBt:D2}";
                }
            }

            if (!string.IsNullOrWhiteSpace(question.TargetLevel))
                return question.TargetLevel.Trim();

            return "K_GEN";
        }

        /// <summary>
        /// [SSoT Topic Extraction] Phân giải mã môn học/chủ đề từ câu hỏi qua UCTE.
        /// </summary>
        public static string ExtractTopic(QuestionBase question)
        {
            if (!string.IsNullOrWhiteSpace(question.CategoryCode))
            {
                return ResolveTopicCode(question.CategoryCode);
            }
            return "GENERAL";
        }
    }
}
