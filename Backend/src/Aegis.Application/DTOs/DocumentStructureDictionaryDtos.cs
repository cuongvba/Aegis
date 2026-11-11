using System;
using System.Collections.Generic;
using System.Linq;
using Aegis.Application.Services;

namespace Aegis.Application.DTOs
{
    /// <summary>
    /// Từ điển cấu trúc văn bản toàn diện (Document Structure Taxonomy Dictionary).
    /// Cấu hình hóa 100% (Zero-Hardcode) việc nhận diện Phân đoạn, Lời giải, Bảng đáp án, Biên giới đề thi,
    /// chữ ký ngôn ngữ (Language Signatures) và bảng phân loại nhanh O(1) (Fast Classification Spec).
    /// Nạp từ khóa <c>documentStructureDictionary</c> trong <c>parsing_rules_registry.json</c>.
    /// Các giá trị mặc định được tách biệt hoàn toàn tại <see cref="DocumentStructureSeedFactory"/>.
    /// </summary>
    public class DocumentStructureDictionaryDto
    {
        /// <summary>Ánh xạ tiêu đề phân đoạn → loại câu hỏi (SINGLE, TRUE_FALSE, SHORT_ANSWER, ESSAY).</summary>
        public Dictionary<string, List<string>> SectionMarkers { get; set; } = GetDefaultSectionMarkers();

        public static Dictionary<string, List<string>> GetDefaultSectionMarkers() =>
            DocumentStructureSeedFactory.GetDefaultSectionMarkers();

        /// <summary>Mẫu nhận diện dòng chuyển sang pha "Lời giải tham khảo / Hướng dẫn chấm".</summary>
        public List<string> SolutionPhaseMarkers { get; set; } = GetDefaultSolutionPhaseMarkers();

        public static List<string> GetDefaultSolutionPhaseMarkers() =>
            DocumentStructureSeedFactory.GetDefaultSolutionPhaseMarkers();

        /// <summary>Mẫu nhận diện dòng tiêu đề "Bảng đáp án".</summary>
        public List<string> AnswerPhaseMarkers { get; set; } = GetDefaultAnswerPhaseMarkers();

        public static List<string> GetDefaultAnswerPhaseMarkers() =>
            DocumentStructureSeedFactory.GetDefaultAnswerPhaseMarkers();

        /// <summary>Mẫu nhận diện dòng mở đầu Lời giải / Hướng dẫn giải / Ý tưởng giải / Biểu điểm (cấu hình động 100%).</summary>
        public List<string> ExplanationMarkers { get; set; } = GetDefaultExplanationMarkers();

        public static List<string> GetDefaultExplanationMarkers() =>
            DocumentStructureSeedFactory.GetDefaultExplanationMarkers();

        /// <summary>Mẫu nhận diện biên giới đề thi (Group 1 = mã đề).</summary>
        public List<string> ExamBoundaryMarkers { get; set; } = GetDefaultExamBoundaryMarkers();

        public static List<string> GetDefaultExamBoundaryMarkers() =>
            DocumentStructureSeedFactory.GetDefaultExamBoundaryMarkers();

        /// <summary>Mẫu nhận diện tiêu đề chủ đề / môn học (Group 1 = tên chủ đề).</summary>
        public List<string> TopicHeadingPatterns { get; set; } = new();

        /// <summary>Mẫu nhận diện câu điểm liệt / câu bắt buộc đúng ở cấp tài liệu.</summary>
        public List<string> CriticalQuestionMarkers { get; set; } = new();

        /// <summary>Mẫu nhận diện dòng mở đầu bài đọc hiểu ở cấp tài liệu.</summary>
        public List<string> PassageStartPatterns { get; set; } = GetDefaultPassageStartPatterns();

        public static List<string> GetDefaultPassageStartPatterns() =>
            DocumentStructureSeedFactory.GetDefaultPassageStartPatterns();

        /// <summary>Mẫu bóc tách phạm vi câu hỏi của bài đọc (Group 1 = từ, Group 2 = đến).</summary>
        public List<string> PassageRangePatterns { get; set; } = GetDefaultPassageRangePatterns();

        public static List<string> GetDefaultPassageRangePatterns() =>
            DocumentStructureSeedFactory.GetDefaultPassageRangePatterns();

        /// <summary>Hồ sơ năng lực theo dạng câu hỏi (OCP) — thêm dạng mới không cần sửa mã lõi bộ phân loại.</summary>
        public Dictionary<string, QuestionTypeProfileDto> QuestionTypeProfiles { get; set; } = QuestionTypeProfileDto.GetDefaults();

        /// <summary>Mẫu ngôn ngữ học đa ngôn ngữ của bộ phân loại (khóa theo <see cref="LinguisticKeys"/>).</summary>
        public Dictionary<string, List<string>> LinguisticPatterns { get; set; } = QuestionTypeProfileDto.GetDefaultLinguisticPatterns();

        /// <summary>Mẫu nhận diện ranh giới kết thúc đề thi (HẾT, [Hết đề 1], THE END, END OF TEST, END OF PAPER...).</summary>
        public List<string> EndOfExamMarkers { get; set; } = GetDefaultEndOfExamMarkers();

        public static List<string> GetDefaultEndOfExamMarkers() =>
            DocumentStructureSeedFactory.GetDefaultEndOfExamMarkers();

        /// <summary>Mẫu nhận diện chỉ thị coi thi / ghi chú phụ ngoài nội dung câu hỏi (Cán bộ coi thi..., Thí sinh không được...).</summary>
        public List<string> ProctorInstructionMarkers { get; set; } = GetDefaultProctorInstructionMarkers();

        public static List<string> GetDefaultProctorInstructionMarkers() =>
            DocumentStructureSeedFactory.GetDefaultProctorInstructionMarkers();

        /// <summary>Đặc tả bảng đáp án ma trận (tiêu đề cột Câu / Đáp án).</summary>
        public AnswerTableDictionaryDto AnswerTableSpecs { get; set; } = new();

        /// <summary>Đặc tả trích xuất đáp án inline ở cấp tài liệu (ưu tiên thấp hơn đặc tả của quy tắc).</summary>
        public InlineAnswerExtractSpecDto InlineAnswerSpecs { get; set; } = new();

        /// <summary>Từ điển danh mục phân loại môn học / chủ đề nạp động từ config/DB.</summary>
        public List<TopicTaxonomyEntryDto> TopicTaxonomyEntries { get; set; } = GetDefaultTopicTaxonomy();

        public static List<TopicTaxonomyEntryDto> GetDefaultTopicTaxonomy() =>
            TaxonomyResourceSeedLoader.GetDefaultTopics();

        /// <summary>Từ điển danh mục phân loại miền tri thức (Domain) nạp động từ config/DB.</summary>
        public List<DomainTaxonomyEntryDto> DomainTaxonomyEntries { get; set; } = GetDefaultDomainTaxonomy();

        public static List<DomainTaxonomyEntryDto> GetDefaultDomainTaxonomy() =>
            TaxonomyResourceSeedLoader.GetDefaultDomains();

        /// <summary>Đặc tả mẫu nhận diện trinh sát 5 trục tọa độ đa ngôn ngữ (Zero-Hardcode & MultiLang).</summary>
        public TaxonomyReconnaissancePatternsDto TaxonomyReconPatterns { get; set; } = new();

        /// <summary>Danh mục bộ sách giáo khoa / chương trình đào tạo đa quốc gia nạp động từ DB/Config (OCP).</summary>
        public List<CurriculumSeriesEntryDto> CurriculumSeriesCatalog { get; set; } = GetDefaultCurriculumSeries();

        public static List<CurriculumSeriesEntryDto> GetDefaultCurriculumSeries() =>
            DocumentStructureSeedFactory.GetDefaultCurriculumSeries();

        /// <summary>Danh mục kỳ thi / giai đoạn khảo thí đa ngôn ngữ nạp động từ DB/Config (OCP & MultiLang).</summary>
        public List<TermPhaseEntryDto> TermPhaseCatalog { get; set; } = GetDefaultTermPhases();

        public static List<TermPhaseEntryDto> GetDefaultTermPhases() =>
            DocumentStructureSeedFactory.GetDefaultTermPhases();

        /// <summary>Danh sách từ viết tắt chuyên ngành viết hoa.</summary>
        public List<string> KnownAcronyms { get; set; } = GetDefaultAcronyms();

        public static List<string> GetDefaultAcronyms() =>
            DocumentStructureSeedFactory.GetDefaultAcronyms();

        /// <summary>Chữ ký nhận diện ngôn ngữ theo mã ISO-639-1 ("vi", "en", "zh", "ko", "ja", "fr", "de"...).</summary>
        public Dictionary<string, LanguageSignatureDto> LanguageSignatures { get; set; } = new(StringComparer.OrdinalIgnoreCase);

        /// <summary>Bảng tiền tố / ký tự phân loại nhanh O(1) từng dòng văn bản.</summary>
        public FastClassificationSpecDto FastClassificationSpec { get; set; } = new();

        /// <summary>
        /// Danh sách mẫu chỉ thị dải câu hỏi tuyến tính theo dạng câu (SINGLE, TRUE_FALSE, SHORT_ANSWER, MULTI, ORDERING, MATCHING, ESSAY).
        /// Cấu hình động 100% từ parsing_rules_registry.json / DB (Zero-Hardcode).
        /// </summary>
        public Dictionary<string, List<string>> ScopeDirectiveMarkers { get; set; } = GetDefaultScopeDirectiveMarkers();

        public static Dictionary<string, List<string>> GetDefaultScopeDirectiveMarkers() =>
            DocumentStructureSeedFactory.GetDefaultScopeDirectiveMarkers();

        /// <summary>
        /// [R_GEN & R_SPEC] Cấu hình Phân cấp Khảo thí Thích ứng Đa ngôn ngữ Toàn cầu (Zero-Config Heuristic).
        /// Tự động hóa 100% cho đề phẳng H(x, 0, 0, 0), đề chỉ thị H(x, 0, 0, d), và đề đa tầng H(x, p, s, d).
        /// </summary>
        public AdaptiveHierarchyConfigDto HierarchyConfig { get; set; } = AdaptiveHierarchyConfigDto.Default();

        /// <summary>Mẫu bóc tách dải số câu hỏi tổng quát [StartQ..EndQ] (đa ngôn ngữ VI, EN, ZH...).</summary>
        public List<string> ScopeRangePatterns { get; set; } = GetDefaultScopeRangePatterns();

        public static List<string> GetDefaultScopeRangePatterns() =>
            DocumentStructureSeedFactory.GetDefaultScopeRangePatterns();
    }

    /// <summary>Bộ sách / Chương trình quy chuẩn nạp động từ cấu hình / DB (OCP).</summary>
    public class CurriculumSeriesEntryDto
    {
        public string SeriesCode { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public List<string> Keywords { get; set; } = new();
    }

    /// <summary>Kỳ thi / Giai đoạn khảo thí nạp động từ cấu hình / DB (OCP & MultiLang).</summary>
    public class TermPhaseEntryDto
    {
        public string TermCode { get; set; } = string.Empty;
        public string SemesterPhase { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public List<string> Keywords { get; set; } = new();
    }

    /// <summary>Đặc tả nhận diện trinh sát Hệ 5 trục tọa độ đa ngôn ngữ (Zero-Hardcode & MultiLang).</summary>
    public class TaxonomyReconnaissancePatternsDto
    {
        public List<string> TopicHeaderPatterns { get; set; } = new()
        {
            @"(?i)(?:^|[\t\s|•\-–—;]+)(?:BÀI\s*THI\s*(?:MÔN)?|MÔN\s*THI|MÔN|HỌC\s*PHẦN|MÃ\s*CĐ|TOPIC|SUBJECT|COURSE|MODULE|DISCIPLINE|EXAM\s*SUBJECT|科目|课程)[\.\:\s\-]+([^\n\r\t|;]+)",
            @"(?i)(?:^|[\t\s|•\-–—;]+)(?:CHỦ\s*ĐỀ|CHƯƠNG|LĨNH\s*VỰC|THEME|UNIT|CHAPTER)[\.\:\s\-]+([^\n\r\t|;]+)"
        };

        public List<string> TargetLevelPatterns { get; set; } = new()
        {
            @"(?i)(?:vị\s*trí|chức\s*danh|ngạch|đối\s*tượng|cấp\s*bậc|khối\s*lớp|hạng\s*bằng|dành\s*cho|grade|level|target\s*audience|position|rank|class|年级|级别)\s*[:\-–—]\s*([^\r\n|;]+)"
        };

        public List<string> AssessmentPurposePatterns { get; set; } = new()
        {
            @"(?i)(kỳ\s*kiểm\s*tra[^\r\n|;]+|kỳ\s*thi[^\r\n|;]+|sát\s*hạch[^\r\n|;]+|đánh\s*giá[^\r\n|;]+|ôn\s*tập\s*nghiệp\s*vụ[^\r\n|;]+|examination[^\r\n|;]+|midterm[^\r\n|;]+|final\s*exam[^\r\n|;]+|assessment[^\r\n|;]+|mock\s*test[^\r\n|;]+|期中[^\r\n|;]+|期末[^\r\n|;]+|中考[^\r\n|;]+|高考[^\r\n|;]+)"
        };

        public List<string> IssuingOrgPatterns { get; set; } = new()
        {
            @"(?i)(?:đơn\s*vị|cơ\s*quan|trường|ngân\s*hàng|chi\s*nhánh|bộ|sở|phòng|organization|issued\s*by|institution|university|school|college|department|bank|branch|academy|institute|学校|大学|考试院|部门)\s*[:\-–—]\s*([^\r\n|;]+)"
        };

        public List<string> BenchmarkStandardPatterns { get; set; } = new()
        {
            @"(?i)(quy\s*định\s*số\s*\d+/[A-Za-z0-9\-_]+)",
            @"(?i)(thông\s*tư\s*\d+(?:/\d+)?/TT-[A-Za-z0-9]+)",
            @"(?i)(tiêu\s*chuẩn|quy\s*chuẩn|standard|specification|directive|iso\s*\d+|iec\s*\d+|rfc\s*\d+|tcvn\s*\d+|qcvn\s*\d+)"
        };

        public List<string> YearLabeledPatterns { get; set; } = new()
        {
            @"(?i)(?:năm|nam|đợt\s*\d+\s*năm|niên\s*khóa|khoá|year|academic\s*year|school\s*year|ann[ée]e|año|年度|学年)\s*[:\-–—]?\s*(20\d{2})",
            @"(?i)(?:năm\s*học|niên\s*học|học\s*kỳ|năm)\s*(20\d{2})\s*[-–—/]\s*(20\d{2})"
        };

        public List<string> YearBarePatterns { get; set; } = new()
        {
            @"\b(202[0-9]|201[8-9])\b"
        };

        public int MinBenchmarkYear { get; set; } = 1990;
        public int MaxBenchmarkYear { get; set; } = 2050;

        public List<string> AssessmentIterationPatterns { get; set; } = new()
        {
            @"(?i)(?:đợt|round|phase|kỳ|session|stage|批次)\s*(\d+)"
        };

        public string DefaultIterationFallback { get; set; } = "1";

        public List<DomainTagRuleDto> DomainTagRules { get; set; } = new()
        {
            new() { Pattern = @"(?i)\b(?:chi\s*nhánh|branch)\b", Tag = "chi-nhanh" },
            new() { Pattern = @"(?i)\b(?:tín\s*dụng|tin\s*dung|credit|loan)\b", Tag = "tin-dung" },
            new() { Pattern = @"(?i)\b(?:kế\s*toán|ke\s*toan|accounting)\b", Tag = "ke-toan" },
            new() { Pattern = @"(?i)\b(?:ngân\s*quỹ|ngan\s*quy|treasury)\b", Tag = "ngan-quy" },
            new() { Pattern = @"(?i)\b(?:thanh\s*toán\s*quốc\s*tế|international\s*settlement)\b", Tag = "ttqt" }
        };

        public List<string> GradeDetectionPatterns { get; set; } = new()
        {
            @"(?i)\b(?:LỚP|KHOÍ|KHỐI|GRADE|CLASS|YEAR|年级)\s*(\d{1,2})\b",
            @"(?i)\b[KG](\d{1,2})\b",
            @"(?i)(?:^|[^\d])([1-9]|1[0-2])[\-_ ]*(?:KNTT|CD|CTST|CKP|GDPT|CAMBRIDGE|IB|AP)\b"
        };
    }

    /// <summary>Quy tắc gắn Smart Tag theo miền nghiệp vụ / từ khóa (Zero-Hardcode).</summary>
    public class DomainTagRuleDto
    {
        public string Pattern { get; set; } = string.Empty;
        public string Tag { get; set; } = string.Empty;
    }

    /// <summary>
    /// [Global Standard] Ma trận ánh xạ Đa Chuẩn Khảo thí Quốc tế (Bloom 2001, Webb DOK, QTI 3.0, GDPT 2018).
    /// </summary>
    public class CognitiveCrosswalkDto
    {
        public int BloomLevel { get; set; } = 1; // 1..6
        public string BloomCode { get; set; } = "REMEMBER";
        public string BloomName { get; set; } = "Nhớ / Remember";
        public int WebbDOKLevel { get; set; } = 1; // 1..4
        public string WebbDOKCode { get; set; } = "DOK_1";
        public string WebbDOKName { get; set; } = "DOK 1 - Nhận biết / Recall";
        public string QtiCategory { get; set; } = "Recall";
        public string StandardFramework { get; set; } = "BLOOM_REVISED_2001";
        public string LocalDifficultyLevel { get; set; } = "Mức 1";
    }

    /// <summary>Cấu hình đặc tả bảng đáp án động đa ngôn ngữ (Zero-Hardcode / MultiLang / OCP)</summary>
    public class AnswerTableDictionaryDto
    {
        public string QuestionHeaderPattern { get; set; } = @"^(?:Câu|C[\.\?\s]*u|CÂU|TT|Q|Question|Item|Task|Problem|Aufgabe|Exercice|Domanda|Pregunta|第)$";
        public string AnswerHeaderPattern { get; set; } = @"^(?:Chọn|Ch[\.\?\s]*n|Đáp\s*án|D[\.\?\s]*p\s*[\.\?\s]*n|Answer|Key|Đ[\/\.]?A|Phương\s*án|Option|Réponse|Antwort|答案)$";
        public List<string> TrueFalseColumnLabels { get; set; } = new() { "a", "b", "c", "d" };

        /// <summary>Biểu thức nhận diện bảng bài làm thí sinh cần bỏ qua</summary>
        public string StudentAnswerSheetPattern { get; set; } = @"(?i)(?:HS|học\s*sinh|thí\s*sinh)\s*(?:viết|ghi|điền)\s*đáp\s*án|(?:ghi|viết)\s*lại\s*đáp\s*án\s*vào\s*bảng|phiếu\s*trả\s*lời|student\s*answer\s*sheet|answer\s*box|fill\s+in\s+the\s+table|考生答题";

        /// <summary>Biểu thức nhận diện cột nội dung câu hỏi đề bài cần loại trừ khỏi bảng đáp án</summary>
        public string QuestionContentColumnPattern { get; set; } = @"(?i)^(?:Nội\s*dung|Mệnh\s*đề|Phát\s*biểu|Khẳng\s*định|Ý\s*kiến|Nhận\s*định|Nội\s*dung\s*câu\s*hỏi|Content|Statement|Proposition|Assertion|Inhalt|内容)$";

        /// <summary>Biểu thức nhận diện ô tổ hợp số câu + đáp án (Composite Cell)</summary>
        public string CompositeCellPattern { get; set; } = @"(?i)(?:^|[\s\|\;•\-\–])(?:(?:Câu|Q|Item|Task|Question)\s*)?([1-9]\d{0,2})\s*[\.\:\-\)]?\s*([A-Ha-h]|Đúng|Sai|True|False|Vrai|Faux|Richtig|Falsch|[ĐSTFVF])(?:\b|$|[\s\|\;])";

        /// <summary>Biểu thức nhận diện giá trị ĐÚNG (đa ngôn ngữ)</summary>
        public string TrueValuePattern { get; set; } = @"^(?:Đ|D|T|V|R|Đúng|True|Vrai|Richtig|对|正确)$";

        /// <summary>Biểu thức nhận diện giá trị SAI (đa ngôn ngữ)</summary>
        public string FalseValuePattern { get; set; } = @"^(?:S|F|Sai|False|Faux|Falsch|错|错误)$";

        /// <summary>Biểu thức nhận diện chuỗi ký tự đáp án liên tiếp trong bảng (A-D, Đ/S, T/F...)</summary>
        public string AnswerLetterGridCellPattern { get; set; } = @"^(?:[A-Ga-g]|Đ|S|T|F|V|R|Đúng|Sai|True|False|Vrai|Faux|Richtig|Falsch|对|错)$";

        /// <summary>Biểu thức nhận diện chuỗi đáp án Đúng Sai gộp (ví dụ ĐSĐĐ, TFTF, TTFF...)</summary>
        public string TrueFalseSeriesPattern { get; set; } = @"^[SĐTFsdtfVFvf]{1,5}$";

        /// <summary>Biểu thức nhận diện tiêu đề bảng đáp án / pha lời giải</summary>
        public string AnswerPhaseHeaderPattern { get; set; } = @"(?i)^\s*(?:HƯỚNG\s*DẪN\s*CHẤM|ĐÁP\s*ÁN|BIỂU\s*ĐIỂM|THANG\s*ĐIỂM|ANSWER\s*KEY|KEY|MARKING\s*SCHEME|SOLUTIONS?|MODEL\s*ANSWERS?)";

        /// <summary>Biểu thức nhận diện tiêu đề cột mã đề trong bảng ma trận đa mã đề</summary>
        public string MultiExamCrossMatrixPattern { get; set; } = @"^(?:(?:mã\s*đề|đề|exam|test|paper|code)\s*)?\d{2,4}$";

        /// <summary>Độ dài tối đa của văn bản câu hỏi trong ô bảng lưới ngang (vượt quá ngưỡng coi là bảng đề bài)</summary>
        public int MaxQuestionTextLengthInGrid { get; set; } = 20;

        /// <summary>Độ dài tối đa của văn bản đáp án trong ô bảng lưới ngang</summary>
        public int MaxAnswerTextLengthInGrid { get; set; } = 35;
    }

    /// <summary>
    /// Chữ ký nhận diện một ngôn ngữ dùng cho thuật toán chấm điểm vector ngôn ngữ
    /// (Score = w_script·Script + w_diacritic·Diacritic + w_kw·Keyword).
    /// </summary>
    public class LanguageSignatureDto
    {
        public string Name { get; set; } = string.Empty;

        /// <summary>Biểu thức nhận diện hệ chữ viết đặc thù (Hangul, Kana, Hanzi...). Mỗi ký tự khớp = 1 điểm script.</summary>
        public List<string> ScriptPatterns { get; set; } = new();

        /// <summary>Biểu thức nhận diện ký tự có dấu đặc thù (nguyên âm tiếng Việt, é/è/ç tiếng Pháp, ä/ö/ü/ß tiếng Đức).</summary>
        public string? DiacriticPattern { get; set; }

        /// <summary>Từ khóa định danh ngữ cảnh (Câu, Question, Aufgabe, Exercice, 다음, 下列...). Mỗi từ khớp = 1 điểm keyword.</summary>
        public List<string> KeywordHints { get; set; } = new();

        /// <summary>
        /// Khi true: quy tắc mang ngôn ngữ này chỉ được thử khớp điểm neo nếu dòng có bằng chứng
        /// (script, dấu hoặc từ khóa) của ngôn ngữ đó — chống nhận diện chéo (False-Positive).
        /// </summary>
        public bool RequireEvidenceForAnchor { get; set; } = false;

        /// <summary>
        /// Ngưỡng độ tin cậy mô hình ngôn ngữ (NLP / FastText / MiniLM) khi thẩm định đề thi đa ngữ/song ngữ.
        /// </summary>
        public double NlpConfidenceThreshold { get; set; } = 0.85;
    }

    /// <summary>Bảng tiền tố phân loại nhanh từng dòng văn bản (không dùng Regex, độ phức tạp O(1)).</summary>
    public class FastClassificationSpecDto
    {
        public List<string> SectionPrefixes { get; set; } = new();
        public List<string> ExamPrefixes { get; set; } = new();
        public List<string> QuestionPrefixes { get; set; } = new();
        public List<string> QuestionAnchorChars { get; set; } = new();
        public List<string> OptionDelimiters { get; set; } = new();
        public List<CharRangeDto> OptionCharRanges { get; set; } = new();
        public List<string> EvaluationPrefixes { get; set; } = new();
    }

    /// <summary>Khoảng ký tự [Start..End] dùng cho nhãn phương án (A-Z, a-z, 1-9).</summary>
    public class CharRangeDto
    {
        public string Start { get; set; } = "A";
        public string End { get; set; } = "Z";
    }

    /// <summary>
    /// Hồ sơ ngôn ngữ 2 lớp cấp tài liệu (Dual-Layer Language Cognition):
    /// <see cref="HostLanguage"/> = ngôn ngữ bản địa của khung tài liệu (tiêu đề trường, đề, phân đoạn, lời giải);
    /// <see cref="SubjectLanguage"/> = ngôn ngữ chuyên môn của câu hỏi và phương án.
    /// </summary>
    public class DocumentLanguageProfileDto
    {
        public string HostLanguage { get; set; } = "vi";
        public string SubjectLanguage { get; set; } = "vi";

        /// <summary>Đề song ngữ khi ngôn ngữ khung khác ngôn ngữ chuyên môn (ví dụ đề Tiếng Anh tại Việt Nam).</summary>
        public bool IsBilingual => !string.Equals(HostLanguage, SubjectLanguage, StringComparison.OrdinalIgnoreCase);

        /// <summary>Độ tin cậy 0 - 100 (%).</summary>
        public double Confidence { get; set; }

        /// <summary>Điểm số tổng theo từng ngôn ngữ (phục vụ chẩn đoán).</summary>
        public Dictionary<string, double> LanguageScores { get; set; } = new(StringComparer.OrdinalIgnoreCase);

        public int SampledParagraphs { get; set; }
    }

    /// <summary>
    /// Thực thể từ điển phân loại môn học / chủ đề nạp động chuẩn quốc tế (OCP / MultiLang / ISCED-F / ISO 639-1).
    /// </summary>
    public class TopicTaxonomyEntryDto
    {
        /// <summary>Mã chủ đề chuẩn tắc quốc tế: MATH, PHYS, CHEM, BIO, NAT_SCI, LANG_EN... hoặc mã tùy biến</summary>
        public string TopicCode { get; set; } = string.Empty;

        /// <summary>Mã chuẩn quốc tế ISCED-F 2013 / ISO 639-1 tương ứng</summary>
        public string? StandardIscedCode { get; set; }

        /// <summary>Tên hiển thị mặc định (fallback)</summary>
        public string TopicName { get; set; } = string.Empty;

        /// <summary>Miền tri thức cha (EDUCATION, CORPORATE, BANKING...)</summary>
        public string DomainCode { get; set; } = "GENERAL";

        /// <summary>Bản địa hóa tên môn theo ngôn ngữ người dùng: { "vi": "Hóa học", "en": "Chemistry", "fr": "Chimie", "zh": "化学" }</summary>
        public Dictionary<string, string> LocalizedNames { get; set; } = new(StringComparer.OrdinalIgnoreCase);

        /// <summary>Danh mục bí danh tương thích ngược và viết tắt (ví dụ CHEM có Aliases: HOA_HOC, HOA, CHEMISTRY)</summary>
        public List<string> Aliases { get; set; } = new();

        /// <summary>Từ khóa nhận diện phân tầng theo ngôn ngữ</summary>
        public Dictionary<string, List<string>> LocalizedKeywords { get; set; } = new(StringComparer.OrdinalIgnoreCase);

        /// <summary>Thuật ngữ bản thể khoa học đặc thù của môn (đạo hàm, axit, mol, tế bào, ADN...)</summary>
        public List<string> OntologicalTerms { get; set; } = new();

        /// <summary>Danh sách từ khóa phẳng tổng hợp (Bảo đảm tương thích ngược 100% với các hàm tra cứu cũ)</summary>
        public List<string> Keywords { get; set; } = new();

        /// <summary>Hàm Helper lấy tên theo Locale tự động</summary>
        public string GetDisplayName(string locale = "vi")
        {
            if (LocalizedNames != null && LocalizedNames.TryGetValue(locale, out var name) && !string.IsNullOrWhiteSpace(name))
                return name;
            return !string.IsNullOrWhiteSpace(TopicName) ? TopicName : TopicCode;
        }

        /// <summary>Kiểm tra một mã (code hoặc alias) có khớp với entry này không</summary>
        public bool MatchesCodeOrAlias(string code)
        {
            if (string.IsNullOrWhiteSpace(code)) return false;
            if (TopicCode.Equals(code, StringComparison.OrdinalIgnoreCase)) return true;
            if (!string.IsNullOrWhiteSpace(StandardIscedCode) && StandardIscedCode.Equals(code, StringComparison.OrdinalIgnoreCase)) return true;
            return Aliases != null && Aliases.Any(a => a.Equals(code, StringComparison.OrdinalIgnoreCase));
        }
    }

    /// <summary>Thực thể từ điển phân loại miền tri thức (Domain) nạp động.</summary>
    public class DomainTaxonomyEntryDto
    {
        public string DomainCode { get; set; } = string.Empty;
        public string DomainName { get; set; } = string.Empty;
        public int Weight { get; set; } = 2;
        public Dictionary<string, string> LocalizedNames { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public List<string> Aliases { get; set; } = new();
        public List<string> Keywords { get; set; } = new();

        public string GetDisplayName(string locale = "vi")
        {
            if (LocalizedNames != null && LocalizedNames.TryGetValue(locale, out var name) && !string.IsNullOrWhiteSpace(name))
                return name;
            return !string.IsNullOrWhiteSpace(DomainName) ? DomainName : DomainCode;
        }
    }

    /// <summary>Kết quả nhận diện Hệ 5 Trục Tọa Độ Tri Thức + Smart Tags (Vỏ bọc Nhận thức Đề thi).</summary>
    public class CognitiveCoordinateTaxonomyResult
    {
        public string DomainCode { get; set; } = "GENERAL";
        public string? TopicCode { get; set; }
        public string? TopicName { get; set; }
        public string? ParentTopicCode { get; set; }
        public string? ParentTopicName { get; set; }
        public string? TargetLevel { get; set; }
        public string? AssessmentPurpose { get; set; }
        public string? IssuingOrg { get; set; }
        public int? BenchmarkYear { get; set; }
        public string? BenchmarkStandard { get; set; }
        public List<string> Tags { get; set; } = new();

        /// <summary>Mã chủ đề chuẩn tắc duy nhất: [DOMAIN]_[TOPIC]_[GRADE]_[TERM]_[SERIES] (ví dụ: EDU_KHTN_K07_HK1_MID_KNTT)</summary>
        public string? CanonicalTopicCode { get; set; }

        /// <summary>Đường dẫn phả hệ O(1) B-Tree Prefix: /[DOMAIN]/[TOPIC]/[GRADE]/[TERM]/[SERIES]/</summary>
        public string? TreePath { get; set; }

        /// <summary>Tên chủ đề đầy đủ thân thiện hiển thị trên giao diện (ví dụ: Khoa học tự nhiên 7 — Giữa Học kỳ 1 (Kết nối tri thức))</summary>
        public string? FriendlyTopicName { get; set; }

        /// <summary>Bộ sách / Chương trình quy chuẩn (ví dụ: KNTT, CD, CTST, GDPT_2018)</summary>
        public string? CurriculumSeries { get; set; }

        /// <summary>Học kỳ & Giai đoạn khảo thí (ví dụ: HK1_MID, HK1_FIN, HK2_MID, HK2_FIN)</summary>
        public string? SemesterPhase { get; set; }

        /// <summary>[Global Standard] Ma trận ánh xạ Đa Chuẩn Khảo thí Quốc tế (Bloom, Webb DOK, QTI 3.0)</summary>
        public CognitiveCrosswalkDto? CognitiveCrosswalk { get; set; }

        /// <summary>[Dynamic N-Orthogonal Space] Tọa độ nhận thức mở rộng dành cho doanh nghiệp / quốc tế</summary>
        public Dictionary<string, string> ExtensibleCoordinates { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Phương án trắc nghiệm đã bóc tách (Parsed Option).
    /// </summary>
    public class ParsedOptionDto
    {
        public char Letter { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsMarkedCorrect { get; set; }
    }

    /// <summary>
    /// Hồ sơ cấu trúc phần đầu tài liệu (Header Profile) trích xuất từ các đoạn đầu đề thi.
    /// </summary>
    public class DocumentHeaderProfileDto
    {
        public int DurationSeconds { get; set; } = 60;
        public string? DetectedExamCode { get; set; }
        public string? DetectedSubject { get; set; }
        public CognitiveCoordinateTaxonomyResult? TaxonomyCoordinates { get; set; }
    }

    /// <summary>
    /// [R_GEN & R_SPEC] Cấu hình Phân cấp Khảo thí Thích ứng Đa ngôn ngữ Toàn cầu (Zero-Config Heuristic).
    /// Hóa giải đề phẳng H(x, 0, 0, 0), đề chỉ thị H(x, 0, 0, d), và đề đa tầng H(x, p, s, d).
    /// </summary>
    public class AdaptiveHierarchyConfigDto
    {
        public bool Enabled { get; set; } = true;
        public string HierarchyFormat { get; set; } = "{Exam}_{Part}_{SubPart}_{Directive}";
        public bool AllowDeficientLevels { get; set; } = true;

        /// <summary>[TẦNG 1: R_GEN] Hạt nhân phổ quát toàn cầu (Built-in Universal Invariant Core)</summary>
        public UniversalHierarchyCoreDto UniversalCore { get; set; } = UniversalHierarchyCoreDto.Default();

        /// <summary>[TẦNG 2: R_SPEC] Danh mục các quy tắc đặc thù theo ngôn ngữ/văn hóa (Key = mã ngôn ngữ hoặc mã kỳ thi)</summary>
        public Dictionary<string, SovereignHierarchyRuleDto> SovereignRules { get; set; } = GetDefaultSovereignRules();

        public static AdaptiveHierarchyConfigDto Default() =>
            DocumentStructureSeedFactory.GetDefaultHierarchyConfig();

        public static Dictionary<string, SovereignHierarchyRuleDto> GetDefaultSovereignRules() =>
            DocumentStructureSeedFactory.GetDefaultSovereignRules();
    }

    /// <summary>
    /// [TẦNG 1: R_GEN] Hạt nhân Phổ quát Toàn cầu mặc định.
    /// Hoạt động độc lập, tự động hóa 100% cho đề phẳng H(x,0,0,0) và các cấu trúc Latin chuẩn.
    /// </summary>
    public class UniversalHierarchyCoreDto
    {
        public bool Enabled { get; set; } = true;
        public List<string> UniversalPartKeywords { get; set; } = DocumentStructureSeedFactory.GetDefaultUniversalPartKeywords();
        public List<string> UniversalSubPartKeywords { get; set; } = DocumentStructureSeedFactory.GetDefaultUniversalSubPartKeywords();
        public List<string> UniversalActionVerbs { get; set; } = DocumentStructureSeedFactory.GetDefaultUniversalActionVerbs();

        public static UniversalHierarchyCoreDto Default() =>
            DocumentStructureSeedFactory.GetDefaultUniversalCore();
    }

    /// <summary>
    /// [TẦNG 2: R_SPEC] Đặc tả quy tắc phân cấp theo Ngôn ngữ / Văn hóa / Chuẩn khảo thí Quốc gia.
    /// </summary>
    public class SovereignHierarchyRuleDto
    {
        public string LanguageCode { get; set; } = "all";
        public string ExamStandard { get; set; } = "GENERAL";
        public string ScriptType { get; set; } = "LATIN";
        public List<string> PartKeywords { get; set; } = new();
        public List<string> SubPartKeywords { get; set; } = new();
        public List<string> DirectiveVerbs { get; set; } = new();
        public string? CustomNumeralDecoder { get; set; }
        public Dictionary<string, string> QuestionTypeInferenceMap { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    }
}
