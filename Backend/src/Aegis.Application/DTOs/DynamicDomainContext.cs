using System;
using System.Collections.Generic;

namespace Aegis.Application.DTOs
{
    /// <summary>
    /// Bản tóm tắt Danh mục Ngành Động nạp vào Ingestion Pipeline
    /// </summary>
    public class DynamicDomainSummaryDto
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Icon { get; set; }
        public string? ColorBadge { get; set; }
        public bool IsSystemStandard { get; set; } = true;
        public string? ParentDomainCode { get; set; }
        public List<string> Synonyms { get; set; } = new();
    }

    /// <summary>
    /// Bản tóm tắt Preset Tọa độ Tri thức của Tenant
    /// </summary>
    public class TenantCoordinatePresetDto
    {
        public Guid Id { get; set; }
        public string DomainCode { get; set; } = string.Empty;
        /// <summary>
        /// TARGET_LEVEL, ISSUING_ORG, BENCHMARK_STANDARD, ASSESSMENT_PURPOSE, DOMAIN_KEYWORD
        /// </summary>
        public string CoordinateType { get; set; } = string.Empty;
        public string PresetCode { get; set; } = string.Empty;
        public string PresetLabel { get; set; } = string.Empty;
        public List<string> Synonyms { get; set; } = new();
        public bool IsDefault { get; set; } = false;
        public int DisplayOrder { get; set; } = 0;
    }

    /// <summary>
    /// Bản tóm tắt Chủ đề Ngân hàng câu hỏi
    /// </summary>
    public class BankTopicSummaryDto
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? DomainCode { get; set; }
        public string? ParentTopicCode { get; set; }
        public int DepthLevel { get; set; } = 0;
        public string? Stage { get; set; }
        public string? StandardIscedCode { get; set; }
        public string? MaterializedPath { get; set; }
        public List<string> Keywords { get; set; } = new();
    }

    /// <summary>
    /// [Dynamic Domain Context]
    /// Ngữ cảnh Đa ngành và Cấu trúc Tài liệu Động truyền vào bộ bóc tách Ingestion.
    /// Giúp loại bỏ 100% hardcode chuỗi và cho phép hệ thống tự động thích ứng với cấu hình riêng của từng Tenant.
    /// </summary>
    public class DynamicDomainContext
    {
        public Guid TenantId { get; set; } = Guid.Empty;
        public string DefaultExamPrefix { get; set; } = "EXAM";
        public string Language { get; set; } = "vi";
        public string? FileName { get; set; }
        public string? DetectedExamCode { get; set; }
        public List<DynamicDomainSummaryDto> Domains { get; set; } = new();
        public List<TenantCoordinatePresetDto> CoordinatePresets { get; set; } = new();
        public List<BankTopicSummaryDto> Topics { get; set; } = new();
        public DocumentStructureDictionaryDto StructureDictionary { get; set; } = new();
        public List<QuestionParsingRuleDto> ParsingRules { get; set; } = new();

        /// <summary>
        /// Tạo ngữ cảnh mặc định từ chuẩn hệ thống (mặc định ngôn ngữ vi, hỗ trợ đa ngôn ngữ toàn cầu)
        /// </summary>
        public static DynamicDomainContext CreateDefault() => CreateDefault("vi");

        /// <summary>
        /// Tạo ngữ cảnh mặc định từ chuẩn hệ thống theo ngôn ngữ chỉ định ("vi", "en", "fr", "ja", "ko", "zh"...)
        /// </summary>
        public static DynamicDomainContext CreateDefault(string language)
        {
            var ctx = new DynamicDomainContext { Language = language };

            // [Zero-Hardcode / MultiLang] Nạp danh mục Miền tri thức toàn cầu từ Seed JSON
            ctx.Domains = Aegis.Application.Services.TaxonomyResourceSeedLoader.GetDefaultDomains()
                .Select(d => new DynamicDomainSummaryDto
                {
                    Code = d.DomainCode,
                    Name = d.GetDisplayName(language),
                    Synonyms = new List<string>(d.Keywords)
                })
                .ToList();

            ctx.CoordinatePresets = new List<TenantCoordinatePresetDto>
            {
                // BANKING
                new() { DomainCode = "BANKING", CoordinateType = "TARGET_LEVEL", PresetCode = "CHUYEN_VIEN_CHINH", PresetLabel = "Chuyên viên chính", Synonyms = new() { "chuyên viên chính", "cvc", "chuyên viên" } },
                new() { DomainCode = "BANKING", CoordinateType = "TARGET_LEVEL", PresetCode = "TIN_DUNG_KHDN", PresetLabel = "Tín dụng Khách hàng Doanh nghiệp", Synonyms = new() { "tín dụng khdn", "khdn", "khách hàng doanh nghiệp", "chuyên viên khách hàng doanh nghiệp" } },
                new() { DomainCode = "BANKING", CoordinateType = "TARGET_LEVEL", PresetCode = "TIN_DUNG_KHCN", PresetLabel = "Tín dụng Khách hàng Cá nhân", Synonyms = new() { "tín dụng khcn", "khcn", "khách hàng cá nhân", "chuyên viên khách hàng cá nhân" } },
                new() { DomainCode = "BANKING", CoordinateType = "TARGET_LEVEL", PresetCode = "KE_TOAN_NGAN_QUY", PresetLabel = "Kế toán & Ngân quỹ", Synonyms = new() { "kế toán ngân quỹ", "ngân quỹ", "kế toán viên" } },
                new() { DomainCode = "BANKING", CoordinateType = "TARGET_LEVEL", PresetCode = "KIEM_SOAT_VIEN", PresetLabel = "Kiểm soát viên", Synonyms = new() { "kiểm soát viên", "ksv" } },
                new() { DomainCode = "BANKING", CoordinateType = "TARGET_LEVEL", PresetCode = "GIAO_DICH_VIEN", PresetLabel = "Giao dịch viên", Synonyms = new() { "giao dịch viên", "gdv" } },
                new() { DomainCode = "BANKING", CoordinateType = "BENCHMARK_STANDARD", PresetCode = "THONG_TU_41_BASEL", PresetLabel = "Thông tư 41 & Basel III", Synonyms = new() { "thông tư 41", "basel iii", "basel 3" } },
                new() { DomainCode = "BANKING", CoordinateType = "BENCHMARK_STANDARD", PresetCode = "CHIEU_CHUAN_NGAN_HANG", PresetLabel = "Chuẩn mực Nghiệp vụ Ngân hàng", Synonyms = new() { "chuẩn mực nghiệp vụ ngân hàng", "nghiệp vụ ngân hàng", "quy chế kiểm tra nghiệp vụ" } },
                new() { DomainCode = "BANKING", CoordinateType = "ASSESSMENT_PURPOSE", PresetCode = "AML_COMPLIANCE", PresetLabel = "Sát hạch Nghiệp vụ Phòng chống Rửa tiền (AML)", Synonyms = new() { "sát hạch định kỳ", "kiểm tra nghiệp vụ", "tuân thủ aml", "phòng chống rửa tiền", "aml" } },
                new() { DomainCode = "BANKING", CoordinateType = "ASSESSMENT_PURPOSE", PresetCode = "KIEM_TRA_DINH_KY", PresetLabel = "Kiểm tra chuyên môn nghiệp vụ định kỳ", Synonyms = new() { "kiểm tra nghiệp vụ định kỳ", "chuyên môn nghiệp vụ định kỳ", "kiểm tra chuyên môn", "kiểm tra định kỳ" } },
                new() { DomainCode = "BANKING", CoordinateType = "ISSUING_ORG", PresetCode = "AGRIBANK", PresetLabel = "Agribank", Synonyms = new() { "agribank", "nhno", "ngân hàng nông nghiệp", "nông nghiệp và phát triển nông thôn" } },
                new() { DomainCode = "BANKING", CoordinateType = "ISSUING_ORG", PresetCode = "VIETCOMBANK", PresetLabel = "Vietcombank", Synonyms = new() { "vietcombank", "vcb", "ngoại thương" } },
                new() { DomainCode = "BANKING", CoordinateType = "ISSUING_ORG", PresetCode = "BIDV", PresetLabel = "BIDV", Synonyms = new() { "bidv", "đầu tư và phát triển" } },
                new() { DomainCode = "BANKING", CoordinateType = "ISSUING_ORG", PresetCode = "VIETINBANK", PresetLabel = "VietinBank", Synonyms = new() { "vietinbank", "ctg", "công thương" } },

                // EDUCATION
                new() { DomainCode = "EDUCATION", CoordinateType = "TARGET_LEVEL", PresetCode = "GRADE_12", PresetLabel = "Lớp 12", Synonyms = new() { "lớp 12", "lop 12", "k12", "khối 12", "thpt" } },
                new() { DomainCode = "EDUCATION", CoordinateType = "TARGET_LEVEL", PresetCode = "GRADE_11", PresetLabel = "Lớp 11", Synonyms = new() { "lớp 11", "lop 11", "k11", "khối 11" } },
                new() { DomainCode = "EDUCATION", CoordinateType = "TARGET_LEVEL", PresetCode = "GRADE_10", PresetLabel = "Lớp 10", Synonyms = new() { "lớp 10", "lop 10", "k10", "khối 10", "tuyển sinh 10", "tuyển sinh vào lớp 10" } },
                new() { DomainCode = "EDUCATION", CoordinateType = "BENCHMARK_STANDARD", PresetCode = "GDPT_2018", PresetLabel = "Chương trình GDPT 2018", Synonyms = new() { "gdpt 2018", "gdpt", "chương trình mới", "sgk mới" } },
                new() { DomainCode = "EDUCATION", CoordinateType = "ASSESSMENT_PURPOSE", PresetCode = "THPT_NATIONAL", PresetLabel = "Kỳ thi Tốt nghiệp THPT Quốc Gia", Synonyms = new() { "tốt nghiệp thpt", "tot nghiep thpt", "tn thpt", "tot thpt", "tnpt", "thpt quốc gia", "thi đại học", "tốt nghiệp trung học phổ thông", "kỳ thi tốt nghiệp trung học phổ thông", "kỳ thi tốt nghiệp thpt", "thi tốt nghiệp thpt", "de thi tot nghiep" } },
                new() { DomainCode = "EDUCATION", CoordinateType = "ISSUING_ORG", PresetCode = "BO_GIAO_DUC", PresetLabel = "Bộ Giáo dục và Đào tạo", Synonyms = new() { "bộ giáo dục", "bộ giáo dục và đào tạo", "bo giao duc", "bộ gd&đt", "bgd&dt", "bgddt", "bo gd", "bo gd dt" } },
                new() { DomainCode = "EDUCATION", CoordinateType = "ISSUING_ORG", PresetCode = "AMSTERDAM", PresetLabel = "THPT Chuyên Hà Nội - Amsterdam", Synonyms = new() { "chuyên amsterdam", "amsterdam" } },

                // GOV_DRIVING
                new() { DomainCode = "GOV_DRIVING", CoordinateType = "TARGET_LEVEL", PresetCode = "GPLX_B2", PresetLabel = "GPLX Hạng B2", Synonyms = new() { "hạng b2", "bằng b2", "b2" } },
                new() { DomainCode = "GOV_DRIVING", CoordinateType = "TARGET_LEVEL", PresetCode = "GPLX_B1", PresetLabel = "GPLX Hạng B1", Synonyms = new() { "hạng b1", "bằng b1", "b1" } },
                new() { DomainCode = "GOV_DRIVING", CoordinateType = "TARGET_LEVEL", PresetCode = "GPLX_C", PresetLabel = "GPLX Hạng C", Synonyms = new() { "hạng c", "bằng c" } },
                new() { DomainCode = "GOV_DRIVING", CoordinateType = "ISSUING_ORG", PresetCode = "CUC_DUONG_BO", PresetLabel = "Cục Đường bộ Việt Nam", Synonyms = new() { "cục đường bộ", "bộ gtvt" } },
                new() { DomainCode = "GOV_DRIVING", CoordinateType = "BENCHMARK_STANDARD", PresetCode = "ND_100_2019", PresetLabel = "Nghị định 100/2019/NĐ-CP & QC 41:2019", Synonyms = new() { "nghị định 100", "qc 41", "luật giao thông đường bộ" } },
                new() { DomainCode = "GOV_DRIVING", CoordinateType = "ASSESSMENT_PURPOSE", PresetCode = "SAT_HACH_GPLX", PresetLabel = "Sát hạch Giấy phép Lái xe (GPLX)", Synonyms = new() { "sát hạch gplx", "thi bằng lái", "sát hạch lái xe", "gplx" } },

                // HEALTHCARE
                new() { DomainCode = "HEALTHCARE", CoordinateType = "TARGET_LEVEL", PresetCode = "BAC_SI_CKI", PresetLabel = "Bác sĩ CKI", Synonyms = new() { "bác sĩ cki", "bác sĩ chuyên khoa 1", "bác sĩ" } },
                new() { DomainCode = "HEALTHCARE", CoordinateType = "BENCHMARK_STANDARD", PresetCode = "PHAC_DO_BYT_2025", PresetLabel = "Phác đồ Điều trị Bộ Y tế 2025", Synonyms = new() { "phác đồ bộ y tế", "phác đồ điều trị", "bộ y tế 2025" } },
                new() { DomainCode = "HEALTHCARE", CoordinateType = "ISSUING_ORG", PresetCode = "BO_Y_TE", PresetLabel = "Bộ Y tế", Synonyms = new() { "bộ y tế", "so y te", "sở y tế" } },

                // HSE
                new() { DomainCode = "HSE", CoordinateType = "TARGET_LEVEL", PresetCode = "NHOM_2_3", PresetLabel = "Nhóm 2 / Nhóm 3", Synonyms = new() { "nhóm 2", "nhóm 3", "công nhân", "kỹ sư an toàn" } },
                new() { DomainCode = "HSE", CoordinateType = "BENCHMARK_STANDARD", PresetCode = "ISO_45001_2018", PresetLabel = "Nghị định 44/2016/NĐ-CP & ISO 45001", Synonyms = new() { "iso 45001", "nghị định 44", "qcvn" } },
                new() { DomainCode = "HSE", CoordinateType = "ASSESSMENT_PURPOSE", PresetCode = "HUAN_LUYEN_VSLD", PresetLabel = "Huấn luyện An toàn VSLĐ định kỳ", Synonyms = new() { "huấn luyện an toàn", "vsld", "an toàn lao động", "atvsld", "vệ sinh lao động" } },

                // IT_SECURITY (Global Cybersecurity & Cloud Frameworks)
                new() { DomainCode = "IT_SECURITY", CoordinateType = "BENCHMARK_STANDARD", PresetCode = "ISO_27001_2022", PresetLabel = "ISO/IEC 27001:2022", Synonyms = new() { "iso 27001", "iso/iec 27001", "isms" } },
                new() { DomainCode = "IT_SECURITY", CoordinateType = "BENCHMARK_STANDARD", PresetCode = "NIST_OWASP_SOC2", PresetLabel = "NIST CSF / OWASP / SOC 2", Synonyms = new() { "nist", "owasp", "soc 2", "mitre att&ck", "zero trust" } },
                new() { DomainCode = "IT_SECURITY", CoordinateType = "ASSESSMENT_PURPOSE", PresetCode = "CYBER_CERT", PresetLabel = "Cybersecurity Certification (CISSP / CISM / CEH)", Synonyms = new() { "cissp", "cism", "ceh", "comptia security+", "oscp", "aws certified security" } },

                // GLOBAL EDUCATION FRAMEWORKS (CEFR, AP, IB, SAT, GCSE, A-Level, EQF)
                new() { DomainCode = "EDUCATION", CoordinateType = "TARGET_LEVEL", PresetCode = "CEFR_LEVEL", PresetLabel = "CEFR (A1–C2)", Synonyms = new() { "cefr", "c1 advanced", "c2 proficiency", "b2 upper-intermediate", "b1 intermediate" } },
                new() { DomainCode = "EDUCATION", CoordinateType = "ASSESSMENT_PURPOSE", PresetCode = "INTL_CERT_EXAM", PresetLabel = "International Academic & Language Exam", Synonyms = new() { "ielts", "toefl", "sat", "act", "gre", "gmat", "ap exam", "ib diploma", "gcse", "a-level" } },

                // GLOBAL BANKING & HEALTHCARE & HSE & LEGAL & AVIATION & HR
                new() { DomainCode = "BANKING", CoordinateType = "ASSESSMENT_PURPOSE", PresetCode = "GLOBAL_FIN_CERT", PresetLabel = "Global Finance Certification (CFA / FRM)", Synonyms = new() { "cfa", "frm", "fintech", "fatf", "ifrs 9" } },
                new() { DomainCode = "HEALTHCARE", CoordinateType = "BENCHMARK_STANDARD", PresetCode = "HIPAA_WHO_USMLE", PresetLabel = "WHO Clinical Guidelines & HIPAA", Synonyms = new() { "hipaa", "who guidelines", "usmle", "osce", "nclex" } },
                new() { DomainCode = "HSE", CoordinateType = "BENCHMARK_STANDARD", PresetCode = "OSHA_NEBOSH", PresetLabel = "OSHA / NEBOSH Safety Standard", Synonyms = new() { "osha", "nebosh", "nfpa", "iso 14001" } },
                new() { DomainCode = "LEGAL_COMPLIANCE", CoordinateType = "BENCHMARK_STANDARD", PresetCode = "GDPR_ISO37001", PresetLabel = "GDPR / CCPA & ISO 37001", Synonyms = new() { "gdpr", "ccpa", "pdpa", "fcpa", "uk bribery act", "iso 37001" } },
                new() { DomainCode = "AVIATION_LOGISTICS", CoordinateType = "BENCHMARK_STANDARD", PresetCode = "ICAO_IATA", PresetLabel = "ICAO / IATA & Incoterms", Synonyms = new() { "icao", "iata", "faa", "easa", "incoterms", "dangerous goods" } },
                new() { DomainCode = "CORPORATE_HR", CoordinateType = "ASSESSMENT_PURPOSE", PresetCode = "HR_PM_CERT", PresetLabel = "Leadership & Agile / PMP Assessment", Synonyms = new() { "pmp", "scrum", "pmbok", "shrm", "onboarding", "leadership assessment" } }
            };

            // [Zero-Hardcode / MultiLang Taxonomy] Khởi tạo danh mục Chủ đề & Môn học nạp động từ Seed Data
            ctx.Topics = Aegis.Application.Services.TaxonomyResourceSeedLoader.GetDefaultBankTopics();

            return ctx;
        }
    }
}
