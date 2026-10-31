using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using AegisQuiz.Application.Interfaces;

namespace AegisQuiz.Application.DTOs
{
    /// <summary>
    /// Bản đặc tả một Quy tắc Bóc tách Câu hỏi Cấu hình Động (Cognitive Ingestion Rule — CIG 4 chiều + Lifecycle + Topology + Evolution).
    /// Hỗ trợ nạp từ File JSON (<c>parsing_rules_registry.json</c>) hoặc CSDL PostgreSQL (bảng <c>QuestionParsingRules</c>).
    /// </summary>
    public class QuestionParsingRuleDto
    {
        public string RuleCode { get; set; } = string.Empty;
        public string RuleName { get; set; } = string.Empty;
        public string TargetExamType { get; set; } = "GENERAL";
        /// <summary>Mã ngôn ngữ ISO-639-1 của quy tắc ("vi", "en", "zh", "ko", "ja", "fr", "de") hoặc "all" cho quy tắc phổ quát.</summary>
        public string Language { get; set; } = "vi";
        public int Priority { get; set; } = 100;
        public bool IsActive { get; set; } = true;
        public string Description { get; set; } = string.Empty;

        public AnchorSpecDto AnchorSpec { get; set; } = new();
        public StimulusSpecDto StimulusSpec { get; set; } = new();
        public InteractionSpecDto InteractionSpec { get; set; } = new();
        public EvaluationSpecDto EvaluationSpec { get; set; } = new();
        public ExamLifecycleSpecDto LifecycleSpec { get; set; } = new();
        public TableMatrixSpecDto? TableMatrixSpec { get; set; }
        public TopologySpecDto TopologySpec { get; set; } = new();
        public MetaEvolutionSpecDto MetaEvolutionSpec { get; set; } = new();

        // Thuộc tính Alias tương thích ngược / LLM JSON mapping
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public AnchorSpecDto? Structure
        {
            get => AnchorSpec;
            set { if (value != null) AnchorSpec = value; }
        }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public StimulusSpecDto? Semantics
        {
            get => StimulusSpec;
            set { if (value != null) StimulusSpec = value; }
        }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public InteractionSpecDto? Options
        {
            get => InteractionSpec;
            set { if (value != null) InteractionSpec = value; }
        }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public EvaluationSpecDto? Evaluation
        {
            get => EvaluationSpec;
            set { if (value != null) EvaluationSpec = value; }
        }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public ExamLifecycleSpecDto? Lifecycle
        {
            get => LifecycleSpec;
            set { if (value != null) LifecycleSpec = value; }
        }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public TopologySpecDto? Topology
        {
            get => TopologySpec;
            set { if (value != null) TopologySpec = value; }
        }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public MetaEvolutionSpecDto? Evolution
        {
            get => MetaEvolutionSpec;
            set { if (value != null) MetaEvolutionSpec = value; }
        }
    }

    /// <summary>Chiều 1: Điểm neo nhận diện bắt đầu câu hỏi</summary>
    public class AnchorSpecDto
    {
        public string RegexPattern { get; set; } = @"^\[?\s*(?:(?:Câu(?:\s+hỏi)?|Question|Item|Bài|Task|Exercise|Problem|Aufgabe|Exercice|Domanda|Pregunta)(?:\s+(?:số|no\.?|number))?|第|Q)\s*#?(\d+)";
        public int QuestionNumberGroupIndex { get; set; } = 1;
        public int MaxScoreGroupIndex { get; set; } = -1;
        public List<string> SectionMarkers { get; set; } = new();

        // Aliases cho AI / Schema compatibility
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? QuestionHeaderRegexPattern
        {
            get => RegexPattern;
            set { if (value != null) RegexPattern = value; }
        }

        public string DelimiterType { get; set; } = "REGEX_LINE_START";
    }

    /// <summary>Chiều 2: Bối cảnh kích thích trí tuệ (Công thức toán, hình vẽ, bài đọc hiểu)</summary>
    public class StimulusSpecDto
    {
        public bool SupportMathTypeWmf { get; set; } = true;
        public bool SupportVectorSvg { get; set; } = true;
        public bool ExtractInlineImages { get; set; } = true;
        public string? ReadingPassageStartRegex { get; set; }
        public string? ReadingPassageRangeRegex { get; set; }

        /// <summary>Mẫu nhận diện dòng mở đầu bài đọc hiểu (Reading Passage / Advertisement / Leaflet).</summary>
        public List<string> PassageStartPatterns { get; set; } = new()
        {
            @"^\[?\s*(?:Read\s+(?:the\s+)?(?:following\s+)?(?:passage|advertisement|leaflet|text|article|announcement)|Đọc\s+(?:đoạn\s+văn|bài\s+đọc|thông\s+báo|tờ\s+rơi)\s+sau)[\s\S]*",
            @"^\[?\s*(?:阅读|阅读理解|请阅读下面的短文|根据材料回答)[\s\S]*"
        };

        /// <summary>Mẫu bóc tách phạm vi câu hỏi của bài đọc (Group 1 = câu bắt đầu, Group 2 = câu kết thúc).</summary>
        public List<string> PassageRangePatterns { get; set; } = new()
        {
            @"\b(?:from|từ)(?:\s+(?:các\s+)?(?:câu(?:\s+hỏi)?(?:\s+số)?|questions?|items?))?\s*(\d+)\s*(?:to|through|đến(?:\s+(?:các\s+)?câu(?:\s+số)?)?|[-–—])\s*(\d+)\b",
            @"questions?\s*(\d+)\s*(?:-|to|through)\s*(\d+)",
            @"(?:第|题)\s*(\d+)\s*(?:-|到|至)\s*(\d+)\s*题"
        };

        /// <summary>
        /// Tự động đóng gói phạm vi bài đọc hiểu khi chuyển sang SectionMarker mới (Dynamic Context Boundary).
        /// </summary>
        public bool AutoTerminateOnNextSection { get; set; } = true;

        /// <summary>
        /// Danh sách các mẫu chỉ thị chuyển dạng bài / chỉ dẫn làm bài (Instruction Directives) đóng vai trò là Phần ẩn của đề.
        /// Ví dụ: "Choose the word...", "Choose the best option...", "Odd one out", "Read the following sign...", "Put the sentences..."
        /// </summary>
        public List<string> InstructionDirectivePatterns { get; set; } = new()
        {
            @"^\[?\s*(?:Chỉ\s*thị(?:\s*làm\s*bài)?|Hướng\s*dẫn\s*làm\s*bài|Yêu\s*cầu\s*làm\s*bài|Directions?|Instructions?|Consignes?|Anweisungen?)\b",
            @"^\[?\s*(?:Mark\s+the\s+letter|Choose\s+the\s+letter|Choose\s+the\s+word|Choose\s+the\s+best\s+option|Choose\s+the\s+correct\s+answer|Circle\s+the\s+letter|Find\s+the\s+word|Pick\s+(?:out\s+)?the\s+word)\b",
            @"^\[?\s*(?:Read\s+the\s+following\s+(?:passage|text|announcement|advertisement|leaflet|sign|notice|dialogue|conversation)|Read\s+and\s+complete|Đọc\s+(?:đoạn\s+văn|bài\s+đọc|thông\s+báo))\b",
            @"^\[?\s*(?:Odd\s+one\s+out|Find\s+the\s+odd\s+one\s+out)\b",
            @"^\[?\s*(?:Put\s+the\s+sentences|Arrange\s+the\s+sentences|Order\s+the\s+sentences)\b",
            @"^\[?\s*(?:Supply\s+the\s+correct\s+form|Rewrite\s+(?:each\s+of\s+)?the\s+following|Combine\s+the\s+sentences)\b",
            @"^\[?\s*(?:(?:Four|Three|Five|\d+)\s+[^\n\r]*?have\s+been\s+removed)\b"
        };

        /// <summary>
        /// [PISA v7.0] Mẫu nhận diện cấp Tiểu phần (SubSection — Rank 3) có hoặc không có dải câu [m..n].
        /// </summary>
        public List<string> SubSectionDirectivePatterns { get; set; } = new()
        {
            @"^\[?\s*(?:Tiểu\s*phần|Tiểu\s*mục|Mục|Sub[\-\s]*part|Sub[\-\s]*section|Sous[\-\s]*partie|Unterabschnitt|小节|部分)\s*(?:[IVXLCDM]+|\d+|[A-Z])\b"
        };

        /// <summary>
        /// [PISA v7.0] Mẫu nhận diện chỉ thị làm bài nội tại ngay trong thân câu hỏi (Câu số x. [Chỉ thị làm bài cho câu x])
        /// để suy diễn chính xác DefaultQuestionType của Rule này ngay cả khi đề thi không có Phần/Tiểu phần.
        /// </summary>
        public List<string> StemDirectivePatterns { get; set; } = new();

        /// <summary>
        /// [PISA v7.0 — Luật Tiền Luận Giải QuestionType Theo Chỉ Thị Làm Bài (Predictive Directive-to-QuestionType Inference Map)]
        /// Ánh xạ trực tiếp từ dấu hiệu ngôn ngữ trong Chỉ thị làm bài (ở mọi cấp: PART(1), SUB_PART(2), GROUP_DIRECTIVE(3), QUESTION_STEM(4))
        /// sang loại câu hỏi đích (<c>MULTI_TRUE_FALSE</c>, <c>SHORT_ANSWER</c>, <c>ORDERING</c>, <c>MATCHING</c>, <c>MULTI</c>, <c>FILL_BLANK</c>, <c>ESSAY</c>, <c>SINGLE</c>).
        /// </summary>
        public Dictionary<string, List<string>> DirectiveQuestionTypeMap { get; set; } = GetDefaultDirectiveQuestionTypeMap();

        public static Dictionary<string, List<string>> GetDefaultDirectiveQuestionTypeMap() => new(StringComparer.OrdinalIgnoreCase)
        {
            ["MULTI_TRUE_FALSE"] = new()
            {
                @"(?i)(?:(?:câu\s+hỏi\s+)?(?:trắc\s+nghiệm\s+)?đúng\s*(?:hoặc|hay|\/|-)\s*sai|đúng\s+sai\s+nhiều\s+ý)",
                @"(?i)(?:chọn\s+đúng\s+hoặc\s+sai|xét\s+tính\s+đúng\s*[\-\/\s]*sai|trong\s+mỗi\s+ý\s+a[\)\,\s]+b[\)\,\s]+c[\)\,\s]+d|trắc\s+nghiệm\s+đúng\s*[\-\/\s]*sai)",
                @"(?i)(?:indicate\s+whether\s+each\s+of\s+the\s+following\s+statements?\s+is\s+true\s+or\s+false|mark\s+true\s+or\s+false\s+for\s+each\s+statement|true\s*\/\s*false\s+matrix|判断题)"
            },
            ["SHORT_ANSWER"] = new()
            {
                @"(?i)(?:(?:câu\s+(?:hỏi\s+)?(?:trắc\s+nghiệm\s+)?|thí\s+sinh\s+)?trả\s+lời\s+ngắn(?:\s+gọn)?|điền\s+(?:đáp\s+số|kết\s+quả|số\s+thích\s+hợp)|ghi\s+kết\s+quả(?:\s+cuối\s+cùng)?)",
                @"(?i)(?:write\s+your\s+(?:short\s+)?answer|fill\s+in\s+the\s+(?:blank|box)\s+with\s+a\s+number|grid[\-\s]*in\s+questions?|short\s+answer\s+questions?|填空题)"
            },
            ["ORDERING"] = new()
            {
                @"(?i)(?:sắp\s+xếp\s+các\s+(?:bước|câu|ý|sự\s+kiện|giai\s+đoạn)|sắp\s+xếp\s+theo\s+thứ\s+tự\s*(?:tăng\s+dần|giảm\s+dần|đúng|logic|thời\s+gian)?|xếp\s+theo\s+trình\s+tự)",
                @"(?i)(?:put\s+the\s+(?:sentences|steps|events)\s+in\s+(?:the\s+)?correct\s+order|arrange\s+the\s+following\s+in\s+(?:chronological|logical)\s+order|order\s+the\s+steps|排序题)"
            },
            ["MATCHING"] = new()
            {
                @"(?i)(?:ghép\s+(?:nội\s+dung\s+)?cột\s+A\s+với\s+cột\s+B|nối\s+mỗi\s+ý\s+ở\s+cột|ghép\s+đôi\s+tương\s+ứng|nối\s+cặp\s+tương\s+ứng)",
                @"(?i)(?:match\s+each\s+(?:item|heading|statement)\s+in\s+(?:column|list)\s+A\s+with|matching\s+questions?|配对题|连线题)"
            },
            ["MULTI"] = new()
            {
                @"(?i)(?:chọn\s+(?:tất\s+cả\s+các|nhiều|các)\s+(?:phương\s+án|đáp\s+án)\s+đúng|có\s+thể\s+chọn\s+nhiều\s+hơn\s+một\s+(?:phương\s+án|đáp\s+án)|chọn\s+từ\s+2\s+đáp\s+án\s+trở\s+lên|trắc\s+nghiệm\s+nhiều\s+đáp\s+án)",
                @"(?i)(?:select\s+all\s+that\s+apply|choose\s+(?:all\s+correct\s+answers|two\s+or\s+more\s+options|multiple\s+options)|multiple[\-\s]*response|多项选择|多选题)"
            },
            ["FILL_BLANK"] = new()
            {
                @"(?i)(?:điền\s+từ\s+thích\s+hợp\s+vào\s+chỗ\s+trống|hoàn\s+thành\s+câu\s+bằng\s+cách\s+điền\s+vào\s+ô\s+trống)",
                @"(?i)(?:fill\s+in\s+each\s+blank\s+with\s+(?:one\s+)?suitable\s+word|complete\s+the\s+sentences?\s+by\s+filling\s+in\s+the\s+blanks?|选词填空)"
            },
            ["ESSAY"] = new()
            {
                @"(?i)(?:phần\s+tự\s+luận|trình\s+bày\s+lời\s+giải\s+chi\s+tiết|viết\s+bài\s+luận|chứng\s+minh\s+rằng\s+các\s+mệnh\s+đề\s+sau|giải\s+các\s+bài\s+toán\s+tự\s+luận)",
                @"(?i)(?:write\s+an\s+essay|free[\-\s]*response\s+questions?|show\s+all\s+your\s+work\s+and\s+explain|解答题|论述题)"
            },
            ["SINGLE"] = new()
            {
                @"(?i)(?:mỗi\s+câu\s+(?:hỏi\s+)?(?:thí\s+sinh\s+)?chỉ\s+chọn\s+một\s+phương\s+án|chọn\s+(?:một\s+)?(?:phương\s+án|đáp\s+án)\s+(?:trả\s+lời\s+)?đúng\s*(?:nhất)?|khoanh\s+tròn\s+vào\s+chữ\s+cái\s+đứng\s+trước\s+câu\s+trả\s+lời\s+đúng)",
                @"(?i)(?:mark\s+the\s+letter\s+A\s*,\s*B\s*,\s*C\s*(?:,?\s*or\s*D|,\s*D\s*,?\s*or\s*E)|choose\s+the\s+(?:best|correct)\s+(?:answer|option)|for\s+each\s+question\s*,\s*choose\s+only\s+one|单项选择|单选题)"
            }
        };

        // Aliases
        public string? MathBlockMarkerRegex { get; set; }
        public string? CodeBlockMarkerRegex { get; set; }
        public string? ImageMarkerRegex { get; set; }
    }

    /// <summary>Chiều 3: Siêu hình thái tương tác (Options, Matrix, Short answer, Stepped Essay...)</summary>
    public class InteractionSpecDto
    {
        public string DefaultQuestionType { get; set; } = "SINGLE"; // SINGLE, MULTI, TRUE_FALSE, SHORT_ANSWER, ESSAY, MATCHING, ORDERING
        public string OptionRegexPattern { get; set; } = @"^\[?\s*(?:Phương\s*án(?:\s*trả\s*lời)?\s+|Option\s+|Choice\s+)?(?:([A-H])|[\(]([A-H])[\)])[\.\:\s\-]+(.*)$";
        public int OptionLabelGroupIndex { get; set; } = 1;
        public int OptionContentGroupIndex { get; set; } = 3;
        public string? TrueFalseSubItemRegex { get; set; } = @"^(?:([a-d])|[\(]([a-d])[\)])[\.\:\s\-]+(.*)$";
        public string? ShortAnswerPromptRegex { get; set; }
        public string ShortAnswerInputFormat { get; set; } = "NUMERIC_OR_FRACTION"; // NUMERIC_OR_FRACTION, ALPHANUMERIC
        public double Tolerance { get; set; } = 0.01;

        /// <summary>Cờ bật/tắt Essay Safeguard ngăn bốc nhầm a, b, 1, 2 thành phương án trắc nghiệm.</summary>
        public bool EssaySafeguardEnabled { get; set; } = true;

        /// <summary>Các mẫu Regex nhận diện thang điểm bài tự luận, ví dụ: "(2,0 điểm)", "[1.5đ]".</summary>
        public List<string> EssayScoreMarkerPatterns { get; set; } = new()
        {
            @"(?:[\(\[]\s*[\d\.\,]+\s*(?:điểm|đ)\s*[\)\]])"
        };

        /// <summary>Các từ khóa bài toán tự luận.</summary>
        public List<string> EssayKeywordPatterns { get; set; } = new()
        {
            @"\b(?:Chứng\s*minh|Giải\s*phương\s*trình|Giải\s*hệ|Rút\s*gọn|Lập\s*công\s*thức|Biện\s*luận|Tính\s+(?:giá\s+trị|diện\s+tích|thể\s+tích|tốc\s+độ|chiều\s+cao)|Vẽ\s+đồ\s+thị|Hỏi\s+cần\s+phối\s+trộn)\b"
        };

        /// <summary>
        /// Mẫu tách các phương án nằm cùng một dòng (A. ... B. ... C. ... D. ... E. ...).
        /// Group 1/3 = dấu * đánh dấu đáp án đúng, Group 2 = nhãn phương án.
        /// </summary>
        public string InlineOptionDelimiterPattern { get; set; } = @"(?:^|[\s\t\–\—]+|(?<=[\.\:\)\;\!\?\[]))(?:\[?\s*(?:Phương\s*án(?:\s*trả\s*lời)?\s+|Option\s+|Choice\s+)?)?(?:\<mark\>|<u>|\*|\*\*|\<b\>)?(\*?)((?-i:[A-H])|[1-4])(\*?)(?:\</mark\>|</u>|\*|\*\*|\</b\>)?[\.\:\)](?:\</mark\>|</u>|\</b\>)?[\s\t]+";

        /// <summary>Phân nhóm chuyên đề con (SubCategory) theo từ khóa nội dung, ví dụ GPLX: SA_HINH, BIEN_BAO.</summary>
        public Dictionary<string, List<string>> SubCategoryPatterns { get; set; } = new(StringComparer.OrdinalIgnoreCase)
        {
            ["SA_HINH"] = new() { @"(?:sa\s*hình|thứ\s*tự\s*các\s*xe|xe\s*nào\s*được\s*quyền\s*đi|xe\s*nào\s*phải\s*nhường)" },
            ["BIEN_BAO"] = new() { @"(?:biển\s*nào|biển\s*báo|biển\s*số)" }
        };

        // Đặc tả cho Tự luận phân cấp đa tầng (Hierarchical Stepped Essay)
        public string? SubItemRegexPattern { get; set; }
        public int SubItemLabelGroupIndex { get; set; } = 1;
        public int SubItemScoreGroupIndex { get; set; } = -1;
        public int SubItemContentGroupIndex { get; set; } = 2;

        // Aliases
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? QuestionType
        {
            get => DefaultQuestionType;
            set { if (value != null) DefaultQuestionType = value; }
        }
    }

    /// <summary>Chiều 4: Hàm chân lý phân xử điểm số, lời giải & cờ tử thần (Điểm liệt)</summary>
    public class EvaluationSpecDto
    {
        public string AnswerRegexPattern { get; set; } = @"^(?:ĐÁP\s*ÁN|ANSWER|KEY|CHỌN)[\.\:\s\-]+([A-H0-9a-h\,\s]+)";
        public int AnswerGroupIndex { get; set; } = 1;
        public string ExplanationRegexPattern { get; set; } = @"^\[?\s*(?:Lời\s*giải|Hướng\s*dẫn(?:\s*giải)?|HD|Giải\s*thích|Explanation|Căn\s*cứ)\b";
        public string? ExplanationStartRegex
        {
            get => ExplanationRegexPattern;
            set { if (value != null) ExplanationRegexPattern = value; }
        }

        /// <summary>Các mẫu tiền tố dòng lời giải cục bộ ngay dưới câu hỏi (đa ngôn ngữ).</summary>
        public List<string> ExplanationLinePrefixPatterns { get; set; } = new()
        {
            @"^\[?\s*(?:Lời\s*giải|L[\.\?\s]*i\s*gi[\.\?\s]*i|Hướng\s*dẫn(?:\s*giải)?|Hu?ng\s*d?n(?:\s*gi?i)?|HƯỚNG\s*DẪN|LỜI\s*GIẢI|HD)\s*\]?[\.\:\s\-]*(.*)",
            @"^\[?\s*(?:Giải\s*thích|Căn\s*cứ|Ghi\s*chú|Explanation|Rationale|Solution|Feedback)\s*\]?[\.\:\s\-]*(.*)",
            @"^\[?\s*(?:试题解析|详细解析|解析)\s*\]?[\.\:\s\-]*(.*)"
        };

        public string? CriticalQuestionMarkerRegex { get; set; } = @"(?:\[\s*ĐIỂM\s*LIỆT\s*\]|⚠️|TỬ\s*THẦN)";

        /// <summary>Danh mục biểu thức nhận diện câu điểm liệt / câu bắt buộc đúng (GPLX, HSE...).</summary>
        public List<string> CriticalMarkers { get; set; } = new()
        {
            @"(?:\bDIEM[_\s]*LIET\b|\bĐIỂM[_\s]*LIỆT\b|mất\s*an\s*toàn\s*giao\s*thông\s*nghiêm\s*trọng|bị\s*nghiêm\s*cấm|\bnghiêm\s*cấm\b|nồng\s*độ\s*cồn|sử\s*dụng\s*ma\s*túy|đua\s*xe\s*trái\s*phép)",
            @"(?:\bFATAL\b|\bCRITICAL\b|\bMANDATORY\b|\bEMERGENCY\b)"
        };

        /// <summary>Đặc tả trích xuất đáp án nằm lẫn trong lời giải (Inline Answer Extraction).</summary>
        public InlineAnswerExtractSpecDto InlineExtraction { get; set; } = new();

        public string ScoreStrategy { get; set; } = "ALL_OR_NOTHING"; // ALL_OR_NOTHING, PARTIAL_CREDIT, FATAL_LOCK, EXACT_OR_EQUIVALENT_MATH, RUBRIC_STEPPED
        public string? RubricStepRegexPattern { get; set; }

        // Tâm trắc học hiện đại (Modern Psychometrics & Bloom Taxonomy)
        public double NegativeMarkingPenalty { get; set; } = 0.0;
        public string DefaultCognitiveLevel { get; set; } = "UNDERSTAND"; // REMEMBER, UNDERSTAND, APPLY, ANALYZE
        public double NumericTolerance { get; set; } = 0.01;
        public TableMatrixSpecDto? TableMatrixSpec { get; set; }
    }

    /// <summary>Đặc tả trích xuất đáp án inline theo từng loại câu hỏi (Group 1 = giá trị đáp án).</summary>
    public class InlineAnswerExtractSpecDto
    {
        public List<string> SingleChoiceExtractionPatterns { get; set; } = new()
        {
            @"(?:^|[\.\;\,\!\s]+)(?:Do\s*đó|Suy\s*ra|Vậy|Hence|Therefore|Par\s*conséquent|Folglich)?\s*(?:ta\s*)?(?:Chọn|Ch[oọ\?]n|Choose|Option|Select|Choisir)\s*(?:câu\s*|đáp\s*án\s*|phương\s*án(?:\s*trả\s*lời)?\s*)?([A-H])\b",
            @"(?:^|[\.\;\,\!\s]+)(?:Do\s*đó|Suy\s*ra|Vậy|Hence|Therefore|🡪|->|=>|→)?\s*(?:ta\s*có\s*)?(?:đáp\s*án|dap\s*an|phương\s*án(?:\s*trả\s*lời)?|answer|key|réponse)(?:\s*(?:đúng\s*)?là|\s*is|\s*=)?[\:\s]+([A-H])\b",
            @"(?:^|[\s\(\[])(?:Phương\s*án(?:\s*trả\s*lời)?\s*|Option\s*)?([A-H])[\.\:\)](?:(?![A-H][\.\:\)])[^\r\n])*?(?:[✅✔✓☑\u2705\u2714\u2713]|\[[xX]\]|khác\s*biệt)",
            @"(?:^|[\s\(\[])\<mark\>(?:Phương\s*án(?:\s*trả\s*lời)?\s*|Option\s*)?([A-H])[\.\:\)]",
            @"(?:^|[\s\(\[])(?:Phương\s*án(?:\s*trả\s*lời)?\s*|Option\s*)?([A-H])[\.\:\)]\s*\<mark\>",
            @"\blà\s+đáp\s*án\s+([A-H])\b",
            @"\b([A-H])\s*(?:là\s*đáp\s*án|đúng|is\s+the\s+(?:correct\s+)?answer|is\s+correct|est\s+la\s+bonne\s+réponse)\b",
            @"(?:故选|答案为|正确答案是|正确选项是)[\:\s]*([A-H])\b"
        };

        public List<string> NumericValueExtractionPatterns { get; set; } = new()
        {
            @"(?:^|[\.\;\,\!\s]+)(?:Do\s*đó|Suy\s*ra|Vậy|Hence|Therefore)?\s*(?:Đáp\s*số|Đáp\s*án|Dap\s*so|Dap\s*an|Kết\s*quả|Giá\s*trị\s*cần\s*tìm|Result|Answer|Value|Valeur)(?:\s*(?:đúng\s*)?(?:là|bằng|\s*is|\s*=))?[\.\:\s\=]+\$?([0-9\,\.\-\+\/]+)\$?",
            @"(?:计算结果为|答案为|最终结果|结果是)[\.\:\s\=]+([0-9\,\.\-\+\/]+)"
        };

        /// <summary>Group 1 = nhãn mệnh đề (a-d), Group 2 = giá trị chân lý.</summary>
        public List<string> TrueFalseExtractionPatterns { get; set; } = new()
        {
            @"(?:^|[\(\s\[])([a-d1-4])[\)\.\:\]]\s*.*?\b(?:chọn\s+)?(đúng|sai|d|s|true|false|t|f|vrai|faux|richtig|falsch)\b",
            @"\b(?:ý|mệnh\s*đề|khẳng\s*định|statement|proposition|assertion)\s+([a-d1-4])\b.*?\b(?:chọn\s+)?(đúng|sai|d|s|true|false|t|f|vrai|faux|richtig|falsch)\b",
            @"(?:^|[\(\s\[])([a-d1-4])[\)\.\:\]]\s*.*?\b(正确|错误|对|错)\b"
        };

        /// <summary>Mẫu nhận diện ý con / SubItem (Group 1 = nhãn a-d/1-4, Group 2 = nội dung còn lại).</summary>
        public List<string> SubItemMarkerPatterns { get; set; } = new()
        {
            @"^(?:(?:ý|mệnh\s*đề|khẳng\s*định|bước|phần|statement|proposition|item|option|step|part)\s*)?[\(\[]?([a-d1-4])[\)\]\.\:]\s*(?:[\-\:\.]\s*)?(.*)",
            @"^(?:第)?\s*([1-4a-dA-D])\s*[小题项点\.\:\)\-]\s*(.*)"
        };

        /// <summary>Mẫu nhận diện dòng bắt đầu Lời giải / Hướng dẫn giải (Group 1 = nội dung sau nhãn lời giải).</summary>
        public List<string> ExplanationStartPatterns { get; set; } = new()
        {
            @"^\[?\s*(?:(?:Lời\s*giải|L[.\?\s]*i\s*gi[.\?\s]*i|Hướng\s*dẫn(?:\s*(?:giải|chấm|ý\s*giải))?|Hu?ng\s*d?n(?:\s*(?:gi?i|ch?m))?|HƯỚNG\s*DẪN|LỜI\s*GIẢI|HD|Giải\s*thích|Gợi\s*ý(?:\s*làm\s*bài|\s*giải)?|Ý\s*tưởng\s*giải|Sơ\s*đồ\s*giải|Biểu\s*điểm|Thang\s*điểm|Explanation|Rationale|Rubric|Marking\s*Scheme|Solution|Model\s*Answer|Detailed\s*Solution|Explication|Lösung)\s*\]?[\.\:\s\-]*|Chọn\s+[A-H0-9,\.\-]+\s*[\.\:\s\-]+)(.*)",
            @"^\[?\s*(?:参考答案|试题解析|详细解析|解答|解析)\s*\]?[\.\:\s\-]*(.*)"
        };

        /// <summary>Mẫu trích xuất số câu hỏi (Group 1 = số câu hỏi).</summary>
        public List<string> QuestionNumberPatterns { get; set; } = new()
        {
            @"^\[?\s*(?:(?:Câu(?:\s+hỏi)?|Bài|Question|Item|Aufgabe|Exercice|CÂU|BÀI|Problem|Task|Frage|Domanda|Pregunta)(?:\s+(?:số|no\.?|number))?|第|Q)?\s*#?(\d+)",
            @"^(\d+)\s*[\.\:\)\-]"
        };
    }

    /// <summary>Chiều 5: Vòng đời tài liệu đề thi — biên giới đề, chủ đề, phân đoạn, pha lời giải, bảng đáp án và thẻ đóng cấp độ PISA v7.0</summary>
    public class ExamLifecycleSpecDto
    {
        /// <summary>Group 1 = mã đề / số đề.</summary>
        public List<string> ExamHeadingPatterns { get; set; } = new()
        {
            @"^\[?\s*(?:ĐỀ|D[E|Ê]|EXAM|TEST|PAPER|SET|MOCK)\s*(?:SỐ|THI|ÔN|NO|NUM)?\s*[:\-–—]?\s*(\d+|[A-Z])\b",
            @"^\[?\s*(?:试卷|模拟试题)\s*([0-9一二三四五六七八九十]+)"
        };

        /// <summary>Group 1 = tên chủ đề / môn học.</summary>
        public List<string> TopicHeadingPatterns { get; set; } = new()
        {
            @"^\[?\s*(?:Chủ\s*đề|Chương|Lĩnh\s*vực|Môn\s*thi|Môn|Học\s*phần|Mã\s*CĐ|Topic|Subject|Module|Course|Unit)[\.\:\s\-]+([^\n\r\]]+)",
            @"^\[?\s*(?:科目|课程|单元)[\.\:\s\-]+([^\n\r\]]+)"
        };

        public List<string> SolutionPhasePatterns { get; set; } = new()
        {
            @"^\[?\s*(?:(?:LỜI\s*GIẢI|L[\.\?\s]*I\s*GI[\.\?\s]*I|HƯỚNG\s*DẪN\s*GIẢI|HU[\.\?\s]*NG\s*D[\.\?\s]*N\s*GI[\.\?\s]*I)\s+(?:THAM\s*KHẢO|CHI\s*TIẾT|ĐỀ(?:\s*(?:SỐ|THI))?\s*(\d+|[A-Z])?)|HƯỚNG\s*DẪN\s*(?:CHẤM|GIẢI\s*ĐỀ)(?:\s*(?:ĐỀ(?:\s*(?:SỐ|THI))?\s*(\d+|[A-Z])?))?|(?:SOLUTIONS?|EXPLANATIONS?|MARK(?:ING)?\s*SCHEME)(?:\s+(?:DETAILS?|APPENDIX|EXAM\s*\d+|TEST\s*\d+))?)\s*\]?[.\:\s\-]*$",
            @"^\[?\s*(?:参考答案|试题解析|详细解析)\s*\]?[.\:\s\-]*$"
        };

        public List<string> AnswerPhasePatterns { get; set; } = new()
        {
            @"^\[?\s*(?:ĐÁP\s*ÁN|D[\.\?\s]*P\s*[\.\?\s]*N|ANSWER\s*KEY|KEY|ANSWERS?|BẢNG\s*ĐÁP\s*ÁN)\s*(?:THAM\s*KHẢO|CHI\s*TIẾT|ĐỀ(?:\s*(?:SỐ|THI))?\s*(\d+|[A-Z])?)?\s*\]?[.\:\s\-]*$",
            @"^\[?\s*(?:答案|参考答案)\s*\]?[.\:\s\-]*$"
        };

        /// <summary>Mẫu nhận diện ranh giới kết thúc đề thi (HẾT, [Hết đề 1], THE END, END OF TEST, END OF PAPER...).</summary>
        public List<string> EndOfExamPatterns { get; set; } = new()
        {
            @"^(?:[\-\–\—_*\=.\[\]\s]*\b(?:HẾT(?:\s+ĐỀ(?:\s+(?:THI|SỐ))?(?:\s*\d+)?)?|HET(?:\s+DE(?:\s*\d+)?)?|THE\s*END|END\s*OF\s*(?:TEST|EXAM|PAPER)(?:\s*\d+)?)\b[\-\–\—_*\=.\[\]\s]*)$",
            @"^(?:[\-\–\—_\[\]\s]*HẾT[\-\–\—_\[\]\s]*)$"
        };

        /// <summary>[PISA v7.0] Mẫu nhận diện thẻ đóng phạm vi tường minh theo từng cấp phân cấp (Directive, SubSection, Section, Exam) đa ngôn ngữ.</summary>
        public Dictionary<string, List<string>> ScopeClosingPatterns { get; set; } = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Directive"] = new()
            {
                @"^\[?\s*(?:Hết\s*(?:đoạn\s*)?chỉ\s*thị(?:\s*làm\s*bài)?(?:\s*\d+)?|End\s*of\s*(?:directive|instruction|group|passage)(?:\s*\d+)?|Fin\s*de\s*la\s*consigne|指令结束|题组结束)\s*\]?[.\-\s]*$"
            },
            ["SubSection"] = new()
            {
                @"^\[?\s*(?:Hết\s*(?:tiểu\s*phần|mục)(?:\s*[\dIVX]+)?|End\s*of\s*(?:sub[\-\s]*section|sub[\-\s]*part)(?:\s*[\dIVX]+)?|Fin\s*de\s*la\s*sous[\-\s]*partie|小节结束)\s*\]?[.\-\s]*$"
            },
            ["Section"] = new()
            {
                @"^\[?\s*(?:Hết\s*phần(?:\s*[\dIVX]+)?|End\s*of\s*(?:part|section)(?:\s*[\dIVX]+)?|Fin\s*de\s*la\s*partie|部分结束)\s*\]?[.\-\s]*$"
            },
            ["Exam"] = new()
            {
                @"^\[?\s*(?:Hết\s*đề(?:\s*(?:thi|số))?(?:\s*\d+)?|End\s*of\s*(?:exam|test|paper)(?:\s*\d+)?|Fin\s*de\s*l'épreuve|试卷结束)\s*\]?[.\-\s]*$"
            }
        };

        /// <summary>Mẫu nhận diện chỉ thị coi thi / ghi chú phụ ngoài nội dung câu hỏi.</summary>
        public List<string> ProctorInstructionPatterns { get; set; } = new()
        {
            @"(?i)(?:Cán\s*bộ\s*coi\s*thi|Giám\s*thị|Giám\s*khảo)\s+không\s+giải\s+thích(?:\s+gì)?\s+thêm",
            @"(?i)Thí\s*sinh\s+không\s+được\s+sử\s+dụng\s+tài\s+liệu",
            @"(?i)Họ\s*(?:và)?\s*tên\s+thí\s*sinh[\.\:\s_]+Số\s*báo\s*danh"
        };

        /// <summary>Ánh xạ tiêu đề phân đoạn sang loại câu hỏi (SINGLE, TRUE_FALSE, SHORT_ANSWER, ESSAY).</summary>
        public Dictionary<string, List<string>> SectionHeaderMapping { get; set; } = new(StringComparer.OrdinalIgnoreCase)
        {
            ["SINGLE"] = new() { @"\b(?:PHẦN|PHAN|PART|SECTION)\s+(?:I|1|A)\b", @"\bTRẮC\s*NGHIỆM\b", @"\bMULTIPLE\s*CHOICE\b", @"\b单项选择\b" },
            ["TRUE_FALSE"] = new() { @"\b(?:PHẦN|PHAN|PART|SECTION)\s+(?:II|2|B)\b", @"\bĐÚNG\s*SAI\b", @"\bTRUE[\s\/]*FALSE\b", @"\b判断题\b" },
            ["SHORT_ANSWER"] = new() { @"\b(?:PHẦN|PHAN|PART|SECTION)\s+(?:III|3|C)\b", @"\bTRẢ\s*LỜI\s*NGẮN\b", @"\bSHORT\s*ANSWER\b", @"\b填空题\b" },
            ["ESSAY"] = new() { @"\b(?:PHẦN|PHAN|PART|SECTION)\s+(?:IV|4|D)\b", @"\bTỰ\s*LUẬN\b", @"\bESSAY\b", @"\bFREE\s*RESPONSE\b", @"\b解答题\b", @"\bXỬ\s*LÝ\s*TÌNH\s*HUỐNG\b" }
        };
    }

    /// <summary>Chiều 6: Bố cục hình học không gian trang & dòng dữ liệu</summary>
    public class TopologySpecDto
    {
        public string LayoutMode { get; set; } = "SINGLE_COLUMN"; // SINGLE_COLUMN, DUAL_COLUMN_NEWSPAPER, GRID_MATRIX
        public bool AllowInlineHorizontalOptions { get; set; } = true;
        public bool DetectEmbeddedDataTables { get; set; } = true;
        public bool SupportRightFloatedMedia { get; set; } = true;
    }

    /// <summary>Chiều 7: Hạt nhân tự tiến hóa, chẩn đoán dị biệt & entropy nhận thức</summary>
    public class MetaEvolutionSpecDto
    {
        public bool IsAiGenerated { get; set; } = false;
        public double ConfidenceThreshold { get; set; } = 90.0; // 0.0 - 100.0%
        public double MaxEntropyTolerance { get; set; } = 0.25;
        public string SyntaxFingerprint { get; set; } = string.Empty;
        public int GenerationIndex { get; set; } = 1;
    }

    /// <summary>Đặc tả bóc tách Ma trận Bảng Đáp Án tách rời (Detached Matrix Table / OCP / MultiLang)</summary>
    public class TableMatrixSpecDto
    {
        public List<string> HeaderPatterns { get; set; } = new();
        public string Orientation { get; set; } = "AUTO_DETECT";
        public string CellPattern { get; set; } = @"^(?:(\d+)[\.\-\s\:]+([A-H]|Đ|S|[\\-\\+]?\\d+[\\,\\.]?\\d*))$";

        /// <summary>Hỗ trợ xử lý các ô gộp (Merged Cells w:gridSpan / w:vMerge) trong bảng đáp án ma trận.</summary>
        public bool SupportMergedCells { get; set; } = true;

        /// <summary>Hỗ trợ bảng đáp án chia nhánh đa cột dọc (tiết kiệm trang in).</summary>
        public bool MultiColumnBranching { get; set; } = true;

        /// <summary>Mẫu bóc tách tổ hợp nhiều đáp án trong cùng 1 ô hoặc chuỗi viết liền.</summary>
        public string? CompositeCellPattern { get; set; } = @"(?i)(?:^|[\s\|\;•\-\–])(?:(?:Câu|Q|Item|Task|Question)\s*)?([1-9]\d{0,2})\s*[\.\:\-\)]?\s*([A-Ha-h]|Đúng|Sai|True|False|Vrai|Faux|Richtig|Falsch|[ĐSTFVF])(?:\b|$|[\s\|\;])";

        public string? QuestionHeaderPattern { get; set; }
        public string? AnswerHeaderPattern { get; set; }
        public string? StudentAnswerSheetPattern { get; set; }
        public string? QuestionContentColumnPattern { get; set; }
        public string? TrueValuePattern { get; set; }
        public string? FalseValuePattern { get; set; }
        public string? AnswerLetterGridCellPattern { get; set; }
        public string? TrueFalseSeriesPattern { get; set; }
        public string? AnswerPhaseHeaderPattern { get; set; }
        public string? MultiExamCrossMatrixPattern { get; set; }
        public int? MaxQuestionTextLengthInGrid { get; set; }
        public int? MaxAnswerTextLengthInGrid { get; set; }
    }

    /// <summary>Yêu cầu kiểm thử nhanh một đoạn snippet đề thi từ Admin UI Sandbox</summary>
    public class ParseSnippetRequestDto
    {
        public string SnippetText { get; set; } = string.Empty;
        public string? SpecificRuleCode { get; set; }
    }

    /// <summary>Yêu cầu AI tự động phân tích đề thi lạ và sinh quy tắc CIG</summary>
    public class AiRuleAutopilotRequestDto
    {
        public string SnippetText { get; set; } = string.Empty;
        public string? ExamHint { get; set; }
        public string Language { get; set; } = "vi";
    }

    /// <summary>Kết quả AI Autopilot tự sinh quy tắc</summary>
    public class AiRuleAutopilotResponseDto
    {
        public bool Success { get; set; } = true;
        public double ConfidenceScore { get; set; } = 95.0; // 0.0 - 100.0%
        public string Reasoning { get; set; } = string.Empty;
        public QuestionParsingRuleDto GeneratedRule { get; set; } = new();
        public ParseSnippetResponseDto TestedParseResult { get; set; } = new();
    }

    /// <summary>Kết quả kiểm thử phân tích đoạn văn bản mẫu đề thi</summary>
    public class ParseSnippetResponseDto
    {
        public bool Success { get; set; } = true;
        public string? MatchedRuleCode { get; set; }
        public int ParsedCount { get; set; } = 0;
        public int TotalQuestionsFound => ParsedCount > 0 ? ParsedCount : Questions.Count;
        public List<DocxImportPreviewDto> Questions { get; set; } = new();
        public List<string> ParsingLogs { get; set; } = new();
    }

    /// <summary>Yêu cầu kiểm thử ngầm (Shadow Testing) cho quy tắc đề xuất trước khi kích hoạt</summary>
    public class ShadowTestRequestDto
    {
        public QuestionParsingRuleDto ProposedRule { get; set; } = new();
        public List<string>? CustomTestSamples { get; set; }
        public bool AutoPromote { get; set; } = false;
        public int MaxTimeoutMs { get; set; } = 3000;
    }

    /// <summary>Kết quả kiểm thử ngầm (Shadow Testing Pipeline)</summary>
    public class ShadowTestResultDto
    {
        public bool Passed { get; set; } = true;
        public double SafetyScore { get; set; } = 100.0; // 0.0 - 100.0%
        public int TotalSamplesTested { get; set; } = 0;
        public int RegressionsCount { get; set; } = 0;
        public int TargetMatchesCount { get; set; } = 0;
        public double AverageExecutionMs { get; set; } = 0.0;
        public List<ShadowTestDetailDto> Details { get; set; } = new();
        public string Recommendation { get; set; } = string.Empty;
        public string? Note { get; set; }
        public bool AutoPromoted { get; set; } = false;
    }

    /// <summary>Chi tiết kết quả từng mẫu thử nghiệm trong Shadow Run</summary>
    public class ShadowTestDetailDto
    {
        public string SampleName { get; set; } = string.Empty;
        public string SampleSnippet { get; set; } = string.Empty;
        public string ExpectedRuleCode { get; set; } = string.Empty;
        public string? ActualMatchedRuleCode { get; set; }
        public bool IsRegression { get; set; } = false;
        public bool IsTargetMatch { get; set; } = false;
        public double ExecutionMs { get; set; } = 0.0;
        public string Status { get; set; } = "PASS";
        public string? Note { get; set; }
    }

    /// <summary>[PISA v7.0] Cấp độ phân cấp đàn hồi (Elastic Scope Hierarchy Rank 1..4).</summary>
    public enum ScopeHierarchyLevel
    {
        None = 0,
        Exam = 1,
        Section = 2,
        SubSection = 3,
        GroupDirective = 4
    }

    /// <summary>
    /// [SGI & PISA v7.0 - Scope-Guided & Predictive Implicit Directive Window]
    /// Đại diện cho một Cửa sổ Chỉ thị Phạm vi: hỗ trợ cả phạm vi đóng [StartQ..EndQ] lẫn phạm vi mở [StartQ..∞)
    /// và phân cấp đàn hồi (Section -> SubSection -> GroupDirective).
    /// </summary>
    public class DirectiveScopeWindow
    {
        public int StartQuestion { get; set; }
        public int EndQuestion { get; set; } = int.MaxValue;
        public string QuestionType { get; set; } = "SINGLE";
        public string? RawDirective { get; set; }
        public string? MatchedRuleCode { get; set; }
        public double Confidence { get; set; } = 1.0;
        public ScopeHierarchyLevel Level { get; set; } = ScopeHierarchyLevel.GroupDirective;
        public bool IsOpenEnded { get; set; } = false;
        public bool IsExplicitlyClosed { get; set; } = false;

        public bool Contains(int qNum) => !IsExplicitlyClosed && qNum >= StartQuestion && qNum <= EndQuestion;
    }

    /// <summary>
    /// [Context Stimulus Window - PISA v7.0]
    /// Quản lý ngữ cảnh bài đọc hiểu, tiểu phần hoặc chỉ thị tình huống áp dụng cho dải câu hỏi [StartQ, EndQ] hoặc mở [StartQ..∞).
    /// </summary>
    public class ContextStimulusWindow
    {
        public int StartQuestion { get; set; }
        public int EndQuestion { get; set; } = int.MaxValue;
        public string ContextId { get; set; } = string.Empty;
        public string ContextTitle { get; set; } = string.Empty;
        public string ContextContent { get; set; } = string.Empty;
        public ScopeHierarchyLevel Level { get; set; } = ScopeHierarchyLevel.GroupDirective;
        public bool IsOpenEnded { get; set; } = false;
        public bool IsExplicitlyClosed { get; set; } = false;

        public bool Contains(int qNum) => !IsExplicitlyClosed && qNum >= StartQuestion && qNum <= EndQuestion;
    }
}
