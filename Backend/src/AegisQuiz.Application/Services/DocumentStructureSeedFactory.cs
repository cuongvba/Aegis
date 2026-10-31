using System;
using System.Collections.Generic;
using AegisQuiz.Application.DTOs;

namespace AegisQuiz.Application.Services
{
    /// <summary>
    /// [Document Structure Seed Factory] (Zero Hard-code / SoC / SSoT / OCP)
    /// Nhà máy phát sinh dữ liệu hạt giống (Seed & Fallback Defaults) cho Từ điển cấu trúc văn bản.
    /// Tách biệt hoàn toàn tầng DTO/POCO với các mẫu Regex và định nghĩa phân loại mặc định.
    /// Cung cấp điểm phục hồi an toàn (Fail-Safe Floor) khi chưa nạp được cấu hình từ Database/Registry JSON.
    /// </summary>
    public static class DocumentStructureSeedFactory
    {
        /// <summary>
        /// Tạo mới một đối tượng <see cref="DocumentStructureDictionaryDto"/> hoàn chỉnh với đầy đủ giá trị mặc định.
        /// </summary>
        public static DocumentStructureDictionaryDto CreateDefaultDictionary()
        {
            return new DocumentStructureDictionaryDto
            {
                SectionMarkers = GetDefaultSectionMarkers(),
                SolutionPhaseMarkers = GetDefaultSolutionPhaseMarkers(),
                AnswerPhaseMarkers = GetDefaultAnswerPhaseMarkers(),
                ExplanationMarkers = GetDefaultExplanationMarkers(),
                PassageStartPatterns = GetDefaultPassageStartPatterns(),
                PassageRangePatterns = GetDefaultPassageRangePatterns(),
                ScopeDirectiveMarkers = GetDefaultScopeDirectiveMarkers(),
                CurriculumSeriesCatalog = GetDefaultCurriculumSeries(),
                TermPhaseCatalog = GetDefaultTermPhases(),
                KnownAcronyms = GetDefaultAcronyms(),
                TopicTaxonomyEntries = TaxonomyResourceSeedLoader.GetDefaultTopics(),
                DomainTaxonomyEntries = TaxonomyResourceSeedLoader.GetDefaultDomains(),
                HierarchyConfig = GetDefaultHierarchyConfig(),
                ExamBoundaryMarkers = GetDefaultExamBoundaryMarkers(),
                EndOfExamMarkers = GetDefaultEndOfExamMarkers(),
                ProctorInstructionMarkers = GetDefaultProctorInstructionMarkers(),
                ScopeRangePatterns = GetDefaultScopeRangePatterns()
            };
        }

        #region 1. Section & Phase Markers

        /// <summary>Ánh xạ tiêu đề phân đoạn → loại câu hỏi (SINGLE, TRUE_FALSE, SHORT_ANSWER, ESSAY).</summary>
        public static Dictionary<string, List<string>> GetDefaultSectionMarkers() => new(StringComparer.OrdinalIgnoreCase)
        {
            ["ESSAY"] = new()
            {
                @"(?i)(?:TỰ\s*LUẬN|TU\s*LUAN|\bESSAY\b|FREE\s*RESPONSE|XỬ\s*LÝ\s*TÌNH\s*HUỐNG|解答题)",
                @"^(?:PHẦN\s+)?TỰ\s*LUẬN",
                @"^BÀI\s*TẬP\s*TỰ\s*LUẬN",
                @"^(?:PHẦN\s+)?XỬ\s*LÝ\s*TÌNH\s*HUỐNG"
            },
            ["SHORT_ANSWER"] = new()
            {
                @"(?i)(?:TRẢ\s*LỜI\s*NGẮN|TRA\s*LOI\s*NGAN|SHORT\s*ANSWER|ĐIỀN\s*(?:ĐÁP\s*SỐ|KẾT\s*QUẢ)|填空题)",
                @"^(?:PHẦN|PHAN)\s+III\b",
                @"^(?:PART|SECTION)\s+III\b",
                @"^(?:PHẦN|PHAN)\s+3\b",
                @"^(?:CÂU\s*)?TRẢ\s*LỜI\s*NGẮN$",
                @"^ĐIỀN\s*(?:ĐÁP\s*SỐ|KẾT\s*QUẢ)$"
            },
            ["TRUE_FALSE"] = new()
            {
                @"(?i)(?:ĐÚNG\s*[-–/\s]*SAI|DUNG\s*[-–/\s]*SAI|TRUE\s*[-–/\s]*FALSE|判断题)",
                @"^(?:PHẦN|PHAN)\s+II(?:[\.\:\s\-]+.*(?:ĐÚNG|TRUE|SAI|FALSE).*)?$",
                @"^(?:PART|SECTION)\s+II(?:[\.\:\s\-]+.*(?:TRUE|FALSE|ĐÚNG|SAI).*)?$",
                @"^(?:PHẦN|PHAN)\s+2(?:[\.\:\s\-]+.*(?:ĐÚNG|TRUE|SAI|FALSE).*)?$",
                @"^TRẮC\s*NGHIỆM\s*ĐÚNG\s*[-–\s\/]*SAI",
                @"^CÂU\s*HỎI\s*ĐÚNG\s*[-–\s\/]*SAI"
            },
            ["SINGLE"] = new()
            {
                @"(?i)^\s*(?:PHẦN|PART|SECTION)?\s*(?:TRẮC\s*NGHIỆM(?:\s*(?:NHIỀU\s*LỰA\s*CHỌN|ĐƠN|4\s*PHƯƠNG\s*ÁN))?|MULTIPLE\s*CHOICE|ĐƠN\s*LỰA\s*CHỌN|NHIỀU\s*LỰA\s*CHỌN|单项选择|ĐỌC\s*HIỂU|\bREADING(?:\s+COMPREHENSION)?\b|\bLISTENING\b)\s*[\:\.\-]?\s*$",
                @"^(?:PHẦN|PHAN)\s+I\b",
                @"^(?:PART|SECTION)\s+I\b",
                @"^(?:PHẦN|PHAN)\s+1\b",
                @"^(?:CHƯƠNG|CHUONG)\s+[I|V|X\d]+",
                @"^TRẮC\s*NGHIỆM(?:\s*(?:NHIỀU\s*LỰA\s*CHỌN|ĐƠN|4\s*PHƯƠNG\s*ÁN))?$"
            }
        };

        /// <summary>Mẫu nhận diện dòng chuyển sang pha "Lời giải tham khảo / Hướng dẫn chấm".</summary>
        public static List<string> GetDefaultSolutionPhaseMarkers() => new()
        {
            @"^\[?\s*(?:HƯỚNG\s*DẪN\s*(?:CHẤM|GIẢI(?:\s*ĐỀ)?)|ĐÁP\s*ÁN\s*(?:VÀ|&)?\s*(?:BIỂU|THANG)?\s*ĐIỂM|ĐÁP\s*ÁN\s*THAM\s*KHẢO|ĐÁP\s*ÁN\s*CHI\s*TIẾT|LỜI\s*GIẢI\s*THAM\s*KHẢO|LỜI\s*GIẢI\s*CHI\s*TIẾT|HƯỚNG\s*DẪN\s*GIẢI\s*CHI\s*TIẾT|BIỂU\s*ĐIỂM\s*(?:VÀ|&)?\s*HƯỚNG\s*DẪN|THANG\s*ĐIỂM\s*CHI\s*TIẾT|HƯỚNG\s*DẪN\s*TỰ\s*LUẬN|MARKING\s*SCHEME|RUBRICS?|MODEL\s*ANSWERS?|SOLUTIONS?)(?:\s*(?:ĐỀ(?:\s*(?:SỐ|THI))?\s*(\d+|[A-Z])?|SỐ\s*(\d+)))?\s*\]?[\.\:\s\-]*$",
            @"^\[?\s*(?:(?:BẢNG\s*)?ĐÁP\s*ÁN|D[\.\?\s]*P\s*[\.\?\s]*N)\s+(?:THAM\s*KHẢO|CHI\s*TIẾT|VÀ\s*LỜI\s*GIẢI.*)\s*\]?[\.\:\s\-]*$",
            @"^\[?\s*(?:HƯỚNG\s*DẪN\s*GIẢI\s*VÀ\s*ĐÁP\s*ÁN|ĐÁP\s*ÁN\s*VÀ\s*HƯỚNG\s*DẪN\s*GIẢI)\s*\]?[\.\:\s\-]*$"
        };

        /// <summary>Mẫu nhận diện dòng tiêu đề "Bảng đáp án".</summary>
        public static List<string> GetDefaultAnswerPhaseMarkers() => new()
        {
            @"^\[?\s*(?:BẢNG\s*)?(?:ĐÁP\s*ÁN|D[\.\?\s]*P\s*[\.\?\s]*N|ANSWER\s*KEY|KEY|ANSWERS?)\s*(?:THAM\s*KHẢO|CHI\s*TIẾT|TRẮC\s*NGHIỆM)?\s*\]?[\.\:\s\-]*$",
            @"^\[?\s*(?:答案|参考答案)\s*\]?[\.\:\s\-]*$"
        };

        /// <summary>Mẫu nhận diện dòng mở đầu Lời giải / Hướng dẫn giải / Ý tưởng giải / Biểu điểm.</summary>
        public static List<string> GetDefaultExplanationMarkers() => new()
        {
            @"(?i)^\[?\s*(?:Lời\s*giải|L[\.\?\s]*i\s*gi[\.\?\s]*i|Hướng\s*dẫn(?:\s*(?:giải|chấm|ý\s*giải))?|Hu?ng\s*d?n(?:\s*(?:gi?i|ch?m))?|HƯỚNG\s*DẪN|LỜI\s*GIẢI|HD|Giải\s*thích|Gợi\s*ý(?:\s*làm\s*bài|\s*giải)?|Ý\s*tưởng\s*giải|Sơ\s*đồ\s*giải|Căn\s*cứ|Biểu\s*điểm|Thang\s*điểm|Explanation|Rationale|Rubric|Marking\s*Scheme|Solution|Model\s*Answer|Detailed\s*Solution)\s*\]?[\.\:\s\-]*",
            @"(?i)^\[?\s*(?:Phương\s*pháp\s*giải|Các\s*bước\s*giải|Cách\s*(?:1|2|3|một|hai|ba))\s*\]?[\.\:\s\-]*",
            @"(?i)^(?:Chọn|Đáp\s*án|Đáp\s*số)\s+[A-H0-9,\.\-]+"
        };

        #endregion

        #region 2. Passage & Directive Markers

        /// <summary>Mẫu nhận diện dòng mở đầu bài đọc hiểu ở cấp tài liệu.</summary>
        public static List<string> GetDefaultPassageStartPatterns() => new()
        {
            @"(?i)(?:đọc\s+(?:đoạn|bài)\s*văn|đọc\s+thông\s*tin|read\s+the\s+following\s+(?:passage|text|advertisement|announcement)|read\s+the\s+passage).*?(?:trả\s*lời|answer)",
            @"(?i)(?:sử\s*dụng|dựa\s*vào|dựa\s*trên|cho|dùng)\s+thông\s*tin.*?(?:để\s*trả\s*lời|trả\s*lời\s*(?:các\s*)?câu)",
            @"(?i)(?:thông\s*tin|dữ\s*liệu|tình\s*huống)\s+(?:dưới\s*đây|sau)\s+để\s*trả\s*lời",
            @"(?i)^bài\s*đọc\s*hiểu"
        };

        /// <summary>Mẫu bóc tách phạm vi câu hỏi của bài đọc (Group 1 = từ, Group 2 = đến).</summary>
        public static List<string> GetDefaultPassageRangePatterns() => new()
        {
            @"(?i)(?:từ\s+(?:các\s+)?câu(?:\s+hỏi)?(?:\s+số)?|ở\s+mỗi\s+câu(?:\s+hỏi)?\s*(?:từ)?|(?:các\s+)?câu(?:\s+số|\s+hỏi)?)\s*(\d+)\s*(?:đến\s*(?:các\s+)?câu(?:\s+hỏi)?(?:\s+số)?|đến|tới|[-–—])\s*(\d+)",
            @"(?i)(?:questions?|items?|from\s+question|for\s+questions?|in\s+questions?)\s*(\d+)\s*(?:to|through|[-–—])\s*(?:questions?\s*)?(\d+)",
            @"(?i)(?:questions?|items?)\s+from\s*(\d+)\s*to\s*(\d+)",
            @"(?i)(?:từ\s+câu(?:\s+số)?|từ)\s*(\d+)\s*(?:đến\s*hết|trở\s*đi)"
        };

        /// <summary>
        /// Danh sách mẫu chỉ thị dải câu hỏi tuyến tính theo dạng câu (SINGLE, TRUE_FALSE, SHORT_ANSWER, MULTI, ORDERING, MATCHING, ESSAY).
        /// </summary>
        public static Dictionary<string, List<string>> GetDefaultScopeDirectiveMarkers() => new(StringComparer.OrdinalIgnoreCase)
        {
            ["MULTI_TRUE_FALSE"] = new()
            {
                @"(?i)(?:(?:câu\s+hỏi\s+)?(?:trắc\s+nghiệm\s+)?đúng\s*(?:hoặc|hay|\/|-)\s*sai|đúng\s+sai\s+nhiều\s+ý)",
                @"(?i)(?:mỗi\s+ý\s+[a-d]|các\s+mệnh\s+đề|mỗi\s+câu\s+có\s+4\s+ý).*?(?:chọn\s+đúng\s+(?:hoặc|hay)\s+sai|đúng\s*[-–\/\s]*sai|true\s*[-–\/\s]*false)",
                @"(?i)(?:chọn\s+đúng\s+(?:hoặc|hay)\s+sai|thí\s*sinh\s*chọn\s*đúng\s*hoặc\s*sai|mệnh\s+đề\s+đúng\s+hay\s+sai|indicate\s+whether\s+each\s+statement\s+is\s+true\s+or\s+false|xác\s+định\s+đúng\s+hoặc\s+sai)"
            },
            ["SHORT_ANSWER"] = new()
            {
                @"(?i)(?:câu\s+(?:hỏi\s+)?(?:trắc\s+nghiệm\s+)?trả\s*lời\s*ngắn|câu\s*hỏi\s*trả\s*lời\s*ngắn)",
                @"(?i)(?:(?:phần\s+iii|part\s+iii|section\s+iii).*?trả\s*lời|trả\s*lời\s*ngắn|yêu\s*cầu\s*trả\s*lời\s*ngắn|điền\s*(?:đáp\s*số|vào\s*chỗ\s*trống)|viết\s*câu\s*trả\s*lời|kết\s*quả\s*làm\s*tròn|fill\s*in\s*the\s*blank|short\s*answer|write\s*your\s*answer|填空题)"
            },
            ["ORDERING"] = new()
            {
                @"(?i)(?:sắp\s*xếp\s*(?:các\s*(?:bước|câu|đoạn|ý))?|thứ\s*tự\s*(?:thực\s*hiện|đúng)|arrange\s+the\s+(?:utterances|sentences|steps)|chronological\s+order|排序题)"
            },
            ["MATCHING"] = new()
            {
                @"(?i)(?:ghép\s*(?:nội\s*dung|thông\s*tin)?\s*(?:ở\s*)?cột\s+[a-b1-2]|nối\s*(?:mệnh\s*đề|cột)|match\s*(?:each\s*item|the\s*items)?\s*in\s*column|配对题)"
            },
            ["MULTI"] = new()
            {
                @"(?i)(?:chọn\s+(?:tất\s*cả|các|nhiều|hai|ba|\d+)\s+(?:các\s+)?(?:phương\s*án|đáp\s*án)(?:\s+đúng)?|có\s+thể\s+chọn\s+nhiều\s+(?:đáp\s+án|phương\s+án)|choose\s+(?:all\s+that\s+apply|two|three|multiple)|select\s+all\s+(?:that\s+apply|correct)|多项选择|多选题)"
            },
            ["SINGLE"] = new()
            {
                @"(?i)(?:chỉ\s*chọn\s*(?:một|01|1)\s*phương\s*án|(?:mỗi\s+câu(?:\s+hỏi)?(?:\s+thí\s+sinh)?\s+)?chọn\s+(?:một|01|1)\s+phương\s*án|chọn\s*(?:một|01|1)\s*phương\s*án\s*đúng|chọn\s+phương\s*án\s*(?:đúng\s*nhất|chính\s*xác\s*nhất)|chọn\s+câu\s+trả\s+lời\s+đúng|单项选择|单选题|^\[?\s*(?:Tiểu\s*phần|Chỉ\s*thị\s*làm\s*bài)\b)",
                @"(?i)(?:choose\s+(?:the\s+)?(?:best|correct)\s+(?:answer|option|word|item|sentence)|choose\s+the\s+(?:letter|word|option)\s+(?:[A-H]\s*,\s*)*[A-H]|mark\s+the\s+letter\s+[a-h]|select\s+one\s+answer|for\s+each\s+question\s*,\s*choose\s+only\s+one)",
                @"(?i)(?:choose\s+(?:the\s+)?word\s+.*?)?(?:underlined\s+part\s+(?:is\s+)?pronounced\s+differently|pronounced\s+differently|different(?:ly)?\s+(?:pronounced|sound)|stress\s+pattern\s+differently|primary\s+stress)",
                @"(?i)(?:choose\s+(?:the\s+)?letter\s+.*?)?(?:underlined\s+part\s+that\s+needs\s+correction|needs\s+correction|find\s+(?:the\s+)?(?:mistake|error)|underlined\s+(?:word|phrase)\s+that\s+must\s+be\s+changed)",
                @"(?i)(?:circle\s+(?:the\s+)?)?\bodd\s+one\s+out\b"
            },
            ["ESSAY"] = new()
            {
                @"(?i)(?:tự\s*luận|thí\s*sinh\s*giải\s*(?:các\s*)?bài\s*toán|trình\s*bày\s*(?:chi\s*tiết\s*)?lời\s*giải|thang\s*điểm.*?điểm|solve\s+the\s+following|show\s+your\s+work|解答题)"
            }
        };

        #endregion

        #region 3. Catalogs & Taxonomy Meta

        /// <summary>Danh mục bộ sách giáo khoa / chương trình đào tạo đa quốc gia.</summary>
        public static List<CurriculumSeriesEntryDto> GetDefaultCurriculumSeries() => new()
        {
            new() { SeriesCode = "KNTT", DisplayName = "Kết nối tri thức", Keywords = new() { "kntt", "kết nối tri thức", "ket noi tri thuc", "ketnoitrithuc" } },
            new() { SeriesCode = "CD", DisplayName = "Cánh diều", Keywords = new() { "cánh diều", "canh dieu", "canhdieu", @"\bcd\b" } },
            new() { SeriesCode = "CTST", DisplayName = "Chân trời sáng tạo", Keywords = new() { "ctst", "chân trời sáng tạo", "chan troi sang tao", "chantroisangtao" } },
            new() { SeriesCode = "CKP", DisplayName = "Cùng khám phá", Keywords = new() { "ckp", "cùng khám phá", "cung kham pha" } },
            new() { SeriesCode = "GDPT18", DisplayName = "GDPT 2018", Keywords = new() { "gdpt 2018", "gdpt2018", "chương trình 2018", "chuong trinh 2018", "gdpt_2018" } },
            new() { SeriesCode = "CAMBRIDGE", DisplayName = "Cambridge", Keywords = new() { "cambridge", "igcse", "a-level", "as-level", "cie" } },
            new() { SeriesCode = "IB", DisplayName = "International Baccalaureate", Keywords = new() { "ib dp", "international baccalaureate", "ib diploma" } },
            new() { SeriesCode = "AP", DisplayName = "Advanced Placement", Keywords = new() { "ap exam", "advanced placement" } },
            new() { SeriesCode = "SAT", DisplayName = "College Board SAT", Keywords = new() { "sat", "digital sat", "act exam" } },
            new() { SeriesCode = "GAOKAO", DisplayName = "Gaokao", Keywords = new() { "gaokao", "高考", "全国高考" } }
        };

        /// <summary>Danh mục kỳ thi / giai đoạn khảo thí đa ngôn ngữ.</summary>
        public static List<TermPhaseEntryDto> GetDefaultTermPhases() => new()
        {
            new() { TermCode = "HK1_MID", SemesterPhase = "GIUA_HK1", DisplayName = "Giữa Học kỳ 1", Keywords = new() { "giữa học kỳ 1", "giữa kì 1", "giữa kỳ 1", "giữa học kì 1", "giua hk1", "giua ki 1", "midterm 1", "mid-term 1", "fall midterm", "期中", "midterm exam 1" } },
            new() { TermCode = "HK1_FIN", SemesterPhase = "CUOI_HK1", DisplayName = "Cuối Học kỳ 1", Keywords = new() { "cuối học kỳ 1", "cuối kì 1", "cuối kỳ 1", "cuối học kì 1", "cuoi hk1", "cuoi ki 1", "final 1", "fall final", "期末", "term 1 final" } },
            new() { TermCode = "HK1", SemesterPhase = "HK1", DisplayName = "Học kỳ 1", Keywords = new() { "học kỳ 1", "học kì 1", "hk1", "hk 1", "semester 1", "term 1", "fall semester", "第一学期" } },
            new() { TermCode = "HK2_MID", SemesterPhase = "GIUA_HK2", DisplayName = "Giữa Học kỳ 2", Keywords = new() { "giữa học kỳ 2", "giữa kì 2", "giữa kỳ 2", "giữa học kì 2", "giua hk2", "giua ki 2", "midterm 2", "mid-term 2", "spring midterm" } },
            new() { TermCode = "HK2_FIN", SemesterPhase = "CUOI_HK2", DisplayName = "Cuối Học kỳ 2", Keywords = new() { "cuối học kỳ 2", "cuối kì 2", "cuối kỳ 2", "cuối học kì 2", "cuoi hk2", "cuoi ki 2", "final 2", "spring final", "term 2 final" } },
            new() { TermCode = "HK2", SemesterPhase = "HK2", DisplayName = "Học kỳ 2", Keywords = new() { "học kỳ 2", "học kì 2", "hk2", "hk 2", "semester 2", "term 2", "spring semester", "第二学期" } },
            new() { TermCode = "TS10", SemesterPhase = "TS10", DisplayName = "Tuyển sinh 10", Keywords = new() { "tuyển sinh 10", "tuyển sinh vào lớp 10", "vào 10", "ts10", "vao lop 10", "high school entrance", "中考" } },
            new() { TermCode = "THPT_NAT", SemesterPhase = "THPT_NAT", DisplayName = "Tốt nghiệp THPT", Keywords = new() { "tốt nghiệp thpt", "thpt quốc gia", "thi tốt nghiệp", "thpt_nat", "quốc gia", "đgnl", "danh gia nang luc", "national high school", "高考" } }
        };

        /// <summary>Danh sách từ viết tắt chuyên ngành viết hoa.</summary>
        public static List<string> GetDefaultAcronyms() => new()
        {
            "KHDN", "KHCN", "GPLX", "THPT", "GDPT", "AML", "HSE", "PCCC", "CNTT", "ISO", "IEC", "SAT", "ACT", "TOEIC", "IELTS", "HSK", "JLPT", "TOPIK", "KNTT", "CTST", "CKP"
        };

        #endregion

        #region 4. Document Boundary & Proctoring

        public static List<string> GetDefaultExamBoundaryMarkers() => new()
        {
            @"^(?:ĐỀ\s*(?:THI)?\s*(?:SỐ|KIỂM\s*TRA\s*SỐ|MT)?|BỘ\s*ĐỀ\s*SỐ)\s*(\d+)",
            @"^MÃ\s*ĐỀ\s*[:\-]?\s*(\d+)"
        };

        public static List<string> GetDefaultEndOfExamMarkers() => new()
        {
            @"^(?:[\-\–\—_*\=.\[\]\s]*\b(?:HẾT(?:\s+ĐỀ(?:\s+(?:THI|SỐ))?(?:\s*\d+)?)?|HET(?:\s+DE(?:\s*\d+)?)?|THE\s*END|END\s*OF\s*(?:TEST|EXAM|PAPER)(?:\s*\d+)?)\b[\-\–\—_*\=.\[\]\s]*)$",
            @"^(?:[\-\–\—_\[\]\s]*HẾT[\-\–\—_\[\]\s]*)$"
        };

        public static List<string> GetDefaultProctorInstructionMarkers() => new()
        {
            @"(?i)(?:Cán\s*bộ\s*coi\s*thi|Giám\s*thị|Giám\s*khảo)\s+không\s+giải\s+thích(?:\s+gì)?\s+thêm",
            @"(?i)Thí\s*sinh\s+không\s+được\s+sử\s+dụng\s+tài\s+liệu",
            @"(?i)Họ\s*(?:và)?\s*tên\s+thí\s*sinh[\.\:\s_]+Số\s*báo\s*danh"
        };

        public static List<string> GetDefaultScopeRangePatterns() => new()
        {
            @"(?i)(?:từ\s+(?:các\s+)?câu(?:\s+hỏi)?(?:\s+số)?|ở\s+mỗi\s+câu(?:\s+hỏi)?\s*(?:từ)?|(?:các\s+)?câu(?:\s+số|\s+hỏi)?)\s*(\d+)\s*(?:đến\s*(?:các\s+)?câu(?:\s+hỏi)?(?:\s+số)?|đến|tới|[-–—])\s*(\d+)",
            @"(?i)(?:questions?|items?|from\s+question|for\s+questions?|in\s+questions?)\s*(\d+)\s*(?:to|through|[-–—])\s*(?:questions?\s*)?(\d+)",
            @"(?i)(?:questions?|items?)\s+from\s*(\d+)\s*to\s*(\d+)",
            @"(?i)(?:từ\s+câu(?:\s+số)?|từ)\s*(\d+)\s*(?:đến\s*hết|trở\s*đi)"
        };

        #endregion

        #region 5. Adaptive Hierarchy 2-Tier Seeds (R_GEN & R_SPEC)

        public static AdaptiveHierarchyConfigDto GetDefaultHierarchyConfig() => new()
        {
            Enabled = true,
            HierarchyFormat = "{Exam}_{Part}_{SubPart}_{Directive}",
            AllowDeficientLevels = true,
            UniversalCore = GetDefaultUniversalCore(),
            SovereignRules = GetDefaultSovereignRules()
        };

        public static UniversalHierarchyCoreDto GetDefaultUniversalCore() => new()
        {
            Enabled = true,
            UniversalPartKeywords = GetDefaultUniversalPartKeywords(),
            UniversalSubPartKeywords = GetDefaultUniversalSubPartKeywords(),
            UniversalActionVerbs = GetDefaultUniversalActionVerbs()
        };

        public static List<string> GetDefaultUniversalPartKeywords() => new()
        {
            "PHẦN", "PHAN", "PART", "SECTION", "TEIL", "PARTIE", "РАЗДЕЛ", "PARTE", "DEEL"
        };

        public static List<string> GetDefaultUniversalSubPartKeywords() => new()
        {
            "CHỦ ĐỀ", "CHU DE", "CHƯƠNG", "CHUONG", "BÀI", "BAI", "MODULE", "UNIT", "TOPIC", "CHAPITRE", "KAPITEL", "ГЛАВА", "CAPÍTULO", "UNIDAD", "HOOFDSTUK"
        };

        public static List<string> GetDefaultUniversalActionVerbs() => new()
        {
            "Read", "Choose", "Select", "Circle", "Odd", "Find", "Complete", "Fill", "Match", "Identify", "Tick", "Look", "Listen", "Indicate", "Arrange", "Order",
            "Thí sinh", "Hãy", "Chọn", "Điền", "Nối", "Tìm", "Khoanh", "Đọc", "Trong mỗi", "Trả lời", "Sắp xếp"
        };

        public static Dictionary<string, SovereignHierarchyRuleDto> GetDefaultSovereignRules() => new(StringComparer.OrdinalIgnoreCase)
        {
            ["zh"] = new()
            {
                LanguageCode = "zh",
                ExamStandard = "GAOKAO",
                ScriptType = "HANZI",
                PartKeywords = { "第一部分", "第二部分", "第三部分", "第四部分", "大题", "卷" },
                SubPartKeywords = { "选择题", "填空题", "解答题", "阅读理解", "完形填空", "小题" },
                DirectiveVerbs = { "阅读", "选择", "填空", "回答", "请回答", "下列" },
                CustomNumeralDecoder = "CHINESE_NUMERAL"
            },
            ["ja"] = new()
            {
                LanguageCode = "ja",
                ExamStandard = "JCEE",
                ScriptType = "KANA_KANJI",
                PartKeywords = { "第1問", "第2問", "第3問", "第4問", "第5問", "第6問", "大問" },
                SubPartKeywords = { "中問", "小問", "セクション", "パート" },
                DirectiveVerbs = { "次の", "答えよ", "選べ", "読め" },
                CustomNumeralDecoder = "JAPANESE_NUMERAL"
            },
            ["ko"] = new()
            {
                LanguageCode = "ko",
                ExamStandard = "SUNEUNG",
                ScriptType = "HANGUL",
                PartKeywords = { "제 1 교시", "제 2 교시", "제 3 교시", "제 4 교시", "대문항" },
                SubPartKeywords = { "중문항", "소문항" },
                DirectiveVerbs = { "다음", "물음에", "답하시오", "알맞은", "고르시오" },
                CustomNumeralDecoder = "HANGUL_NUMERAL"
            },
            ["ar"] = new()
            {
                LanguageCode = "ar",
                ExamStandard = "THANAWEYA",
                ScriptType = "ARABIC_RTL",
                PartKeywords = { "القسم الأول", "القسم الثاني", "الجزء الأول", "الجزء الثاني" },
                SubPartKeywords = { "الموضوع", "الوحدة", "الفصل" },
                DirectiveVerbs = { "اقرأ", "اختر", "أجب", "املأ" },
                CustomNumeralDecoder = "ARABIC_EASTERN"
            },
            ["vi"] = new()
            {
                LanguageCode = "vi",
                ExamStandard = "GDPT_2025",
                ScriptType = "LATIN",
                PartKeywords = { "PHẦN", "PHAN", "TRẮC NGHIỆM ĐƠN", "TRẮC NGHIỆM ĐÚNG SAI", "TRẢ LỜI NGẮN", "TỰ LUẬN" },
                SubPartKeywords = { "CHỦ ĐỀ", "CHU DE", "CHƯƠNG", "CHUONG", "BÀI", "BAI", "MODULE", "MỤC", "TIỂU MỤC" },
                DirectiveVerbs = { "Thí sinh", "Hãy", "Chọn", "Điền", "Nối", "Tìm", "Khoanh", "Đọc", "Trong mỗi", "Trả lời", "Sắp xếp" },
                QuestionTypeInferenceMap = new(StringComparer.OrdinalIgnoreCase)
                {
                    ["PHẦN I"] = "SINGLE",
                    ["PHẦN II"] = "MULTI_TRUE_FALSE",
                    ["PHẦN III"] = "SHORT_ANSWER",
                    ["TỰ LUẬN"] = "ESSAY"
                }
            }
        };

        #endregion
    }
}
