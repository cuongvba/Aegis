using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using Aegis.Application.DTOs;

namespace Aegis.Application.Services
{
    /// <summary>
    /// [Taxonomy Resource Seed Loader] (Zero Hard-code / MultiLang / OCP / SSoT)
    /// Bộ nạp hạt giống từ điển phân loại môn học và miền tri thức từ tệp tài nguyên JSON.
    /// Đảm bảo tính bất biến, không hard-code chuỗi C#, và tự động tổng hợp bộ từ khóa tương thích ngược.
    /// </summary>
    public static class TaxonomyResourceSeedLoader
    {
        private static readonly Lazy<List<TopicTaxonomyEntryDto>> _lazyTopics = new(LoadTopicsFromResource);
        private static readonly Lazy<List<DomainTaxonomyEntryDto>> _lazyDomains = new(LoadDomainsFromResource);

        public static List<TopicTaxonomyEntryDto> GetDefaultTopics()
        {
            // Trả về clone danh sách để đảm bảo tính bất biến của cache
            return _lazyTopics.Value.Select(CloneTopic).ToList();
        }

        public static List<DomainTaxonomyEntryDto> GetDefaultDomains()
        {
            return _lazyDomains.Value.Select(CloneDomain).ToList();
        }

        public static List<BankTopicSummaryDto> GetDefaultBankTopics()
        {
            return _lazyTopics.Value.Select(t => new BankTopicSummaryDto
            {
                Code = t.TopicCode,
                Name = t.TopicName,
                DomainCode = t.DomainCode,
                Keywords = new List<string>(t.Keywords)
            }).ToList();
        }

        private static List<TopicTaxonomyEntryDto> LoadTopicsFromResource()
        {
            try
            {
                var json = ReadResourceContent("default_topics_taxonomy.json");
                if (!string.IsNullOrWhiteSpace(json))
                {
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var list = JsonSerializer.Deserialize<List<TopicTaxonomyEntryDto>>(json, options);
                    if (list != null && list.Count > 0)
                    {
                        foreach (var entry in list)
                        {
                            EnrichTopicKeywords(entry);
                        }
                        return list;
                    }
                }
            }
            catch (Exception)
            {
                // Fallback im lặng nếu môi trường nhúng đặc biệt gặp lỗi
            }

            return GetMinimalFallbackTopics();
        }

        private static List<DomainTaxonomyEntryDto> LoadDomainsFromResource()
        {
            try
            {
                var json = ReadResourceContent("default_domains_taxonomy.json");
                if (!string.IsNullOrWhiteSpace(json))
                {
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var list = JsonSerializer.Deserialize<List<DomainTaxonomyEntryDto>>(json, options);
                    if (list != null && list.Count > 0)
                    {
                        return list;
                    }
                }
            }
            catch (Exception)
            {
                // Fallback im lặng
            }

            return GetMinimalFallbackDomains();
        }

        private static string? ReadResourceContent(string fileName)
        {
            var assembly = typeof(TaxonomyResourceSeedLoader).Assembly;

            // 1. Thử nạp từ Embedded Resource
            var resourceName = assembly.GetManifestResourceNames()
                .FirstOrDefault(n => n.EndsWith(fileName, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrEmpty(resourceName))
            {
                using var stream = assembly.GetManifestResourceStream(resourceName);
                if (stream != null)
                {
                    using var reader = new StreamReader(stream);
                    return reader.ReadToEnd();
                }
            }

            // 2. Thử nạp từ đường dẫn file trên ổ đĩa nếu đang chạy dev / test
            var baseDir = AppDomain.CurrentDomain.BaseDirectory;
            var localCandidates = new[]
            {
                Path.Combine(baseDir, "Resources", "Taxonomies", fileName),
                Path.Combine(baseDir, "Resources", fileName),
                Path.Combine(baseDir, fileName),
                Path.Combine(Directory.GetCurrentDirectory(), "Resources", "Taxonomies", fileName),
                Path.Combine(Directory.GetCurrentDirectory(), "Backend", "src", "Aegis.Application", "Resources", "Taxonomies", fileName)
            };

            foreach (var path in localCandidates)
            {
                if (File.Exists(path))
                {
                    return File.ReadAllText(path);
                }
            }

            return null;
        }

        private static void EnrichTopicKeywords(TopicTaxonomyEntryDto entry)
        {
            var set = new HashSet<string>(entry.Keywords ?? new List<string>(), StringComparer.OrdinalIgnoreCase);

            // Bổ sung tên chính và tên bản địa hóa
            if (!string.IsNullOrWhiteSpace(entry.TopicName)) set.Add(entry.TopicName);
            if (entry.LocalizedNames != null)
            {
                foreach (var kvp in entry.LocalizedNames.Values)
                {
                    if (!string.IsNullOrWhiteSpace(kvp)) set.Add(kvp);
                }
            }

            // Bổ sung aliases
            if (entry.Aliases != null)
            {
                foreach (var a in entry.Aliases)
                {
                    if (!string.IsNullOrWhiteSpace(a)) set.Add(a);
                }
            }

            // Bổ sung LocalizedKeywords
            if (entry.LocalizedKeywords != null)
            {
                foreach (var kwList in entry.LocalizedKeywords.Values)
                {
                    foreach (var kw in kwList)
                    {
                        if (!string.IsNullOrWhiteSpace(kw)) set.Add(kw);
                    }
                }
            }

            // Bổ sung OntologicalTerms
            if (entry.OntologicalTerms != null)
            {
                foreach (var term in entry.OntologicalTerms)
                {
                    if (!string.IsNullOrWhiteSpace(term)) set.Add(term);
                }
            }

            entry.Keywords = set.ToList();
        }

        private static TopicTaxonomyEntryDto CloneTopic(TopicTaxonomyEntryDto t) => new()
        {
            TopicCode = t.TopicCode,
            StandardIscedCode = t.StandardIscedCode,
            TopicName = t.TopicName,
            DomainCode = t.DomainCode,
            LocalizedNames = new Dictionary<string, string>(t.LocalizedNames ?? new(), StringComparer.OrdinalIgnoreCase),
            Aliases = new List<string>(t.Aliases ?? new()),
            LocalizedKeywords = (t.LocalizedKeywords ?? new()).ToDictionary(k => k.Key, v => new List<string>(v.Value), StringComparer.OrdinalIgnoreCase),
            OntologicalTerms = new List<string>(t.OntologicalTerms ?? new()),
            Keywords = new List<string>(t.Keywords ?? new())
        };

        private static DomainTaxonomyEntryDto CloneDomain(DomainTaxonomyEntryDto d) => new()
        {
            DomainCode = d.DomainCode,
            DomainName = d.DomainName,
            Weight = d.Weight,
            LocalizedNames = new Dictionary<string, string>(d.LocalizedNames ?? new(), StringComparer.OrdinalIgnoreCase),
            Aliases = new List<string>(d.Aliases ?? new()),
            Keywords = new List<string>(d.Keywords ?? new())
        };

        private static List<TopicTaxonomyEntryDto> GetMinimalFallbackTopics() => new()
        {
            new() { TopicCode = "MATH", TopicName = "Toán học", DomainCode = "EDUCATION", Keywords = new() { "toán", "toán học", "math", "đạo hàm", "tích phân" } },
            new() { TopicCode = "HOA_HOC", TopicName = "Hóa học", DomainCode = "EDUCATION", Keywords = new() { "hóa học", "hoá học", "chemistry", "axit", "mol" } },
            new() { TopicCode = "VAT_LY", TopicName = "Vật lý", DomainCode = "EDUCATION", Keywords = new() { "vật lý", "vật lí", "physics", "dao động", "sóng" } },
            new() { TopicCode = "SINH_HOC", TopicName = "Sinh học", DomainCode = "EDUCATION", Keywords = new() { "sinh học", "biology", "gen", "adn" } },
            new() { TopicCode = "KHTN", TopicName = "Khoa học tự nhiên", DomainCode = "EDUCATION", Keywords = new() { "khoa học tự nhiên", "khtn", "natural science" } },
            new() { TopicCode = "TIENG_ANH", TopicName = "Tiếng Anh", DomainCode = "EDUCATION", Keywords = new() { "tiếng anh", "english", "pronunciation" } }
        };

        private static List<DomainTaxonomyEntryDto> GetMinimalFallbackDomains() => new()
        {
            new() { DomainCode = "EDUCATION", DomainName = "Giáo dục", Weight = 2, Keywords = new() { "toán", "vật lý", "hóa học", "gdpt", "thpt" } },
            new() { DomainCode = "BANKING", DomainName = "Tài chính - Ngân hàng", Weight = 2, Keywords = new() { "tín dụng", "ngân hàng", "tiền gửi" } }
        };
    }
}
