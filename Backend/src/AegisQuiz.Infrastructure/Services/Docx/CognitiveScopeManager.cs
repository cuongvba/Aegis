using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using AegisQuiz.Application.DTOs;
using AegisQuiz.Application.Interfaces;

namespace AegisQuiz.Infrastructure.Services.Docx
{
    /// <summary>
    /// [Cognitive Scope Manager - SGI Engine]
    /// Bộ quản lý Phạm vi Nhận thức Khảo thí Hợp nhất:
    /// Tự động bao trùm cả 4 hình thái cấu trúc:
    ///   1. Cây phân cấp chuẩn (Phần I, II, III...)
    ///   2. Dải chỉ thị tuyến tính ("Từ câu 1 đến câu 12...", "Questions 1-5...")
    ///   3. Ngữ cảnh lồng nhau (Passage Context + Directives)
    ///   4. Dòng chảy phẳng (Zero Header Fallback)
    /// </summary>
    public class CognitiveScopeManager : ICognitiveScopeManager
    {
        private readonly List<DirectiveScopeWindow> _scopeWindows = new();
        private readonly List<ContextStimulusWindow> _contextWindows = new();
        private int _contextCounter = 0;

        public string CurrentMacroSection { get; private set; } = "SINGLE";
        public string? CurrentSectionTitle { get; private set; }

        public IReadOnlyList<DirectiveScopeWindow> ScopeWindows => _scopeWindows;
        public IReadOnlyList<ContextStimulusWindow> ContextWindows => _contextWindows;

        private int _examCounter = 0;
        public int CurrentExamRank { get; private set; } = 0;
        public int CurrentPartRank { get; private set; } = 0;
        public int CurrentSubPartRank { get; private set; } = 0;
        public int CurrentDirectiveRank { get; private set; } = 0;

        public void SetCurrentExam(string examCode)
        {
            var match = Regex.Match(examCode ?? string.Empty, @"\d+");
            if (match.Success && int.TryParse(match.Value, out var num))
            {
                CurrentExamRank = num;
            }
            else
            {
                _examCounter++;
                CurrentExamRank = _examCounter;
            }
            CurrentPartRank = 0;
            CurrentSubPartRank = 0;
            CurrentDirectiveRank = 0;
            _contextWindows.Clear();
            _scopeWindows.Clear();
        }

        public void RegisterSubPart(string? subPartTitle)
        {
            int subNum = ParseRankNumber(subPartTitle ?? string.Empty);
            CurrentSubPartRank = subNum > 0 ? subNum : (CurrentSubPartRank + 1);
        }

        public void IncrementDirectiveRank()
        {
            CurrentDirectiveRank++;
        }

        public QuestionAddress AddressOf(int questionNo)
        {
            return new QuestionAddress(CurrentExamRank, CurrentPartRank, CurrentSubPartRank, CurrentDirectiveRank, questionNo);
        }

        public string GetHierarchyIndex()
        {
            return AddressOf(0).SectionKey;
        }

        private AdaptiveHierarchyConfigDto? _hierarchyConfig;

        public void Configure(AdaptiveHierarchyConfigDto? config)
        {
            _hierarchyConfig = config ?? AdaptiveHierarchyConfigDto.Default();
        }

        /// <summary>
        /// [R_GEN & R_SPEC Multi-Lingual Decoder]
        /// Giải mã số thứ tự cấp bậc đa ngôn ngữ:
        /// 1. Số Ả Rập (1, 2, 3...)
        /// 2. Số La Mã mở rộng (I đến XX)
        /// 3. Ký tự chữ cái thứ tự (Part A -> 1, Part B -> 2...)
        /// 4. Số Hán tự (第一 -> 1, 第二 -> 2... 十五 -> 15... 二十 -> 20)
        /// 5. Số Ả Rập Đông Phương (١, ٢, ٣...)
        /// </summary>
        public static int ParseRankNumber(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return 0;
            var trimmed = text.Trim();

            // 1. Nếu có từ khóa phân cấp chỉ định (PHẦN, PART, SECTION, CHƯƠNG, BÀI...), bóc tách số thứ tự NGAY SAU từ khóa đó
            var prefixMatch = Regex.Match(trimmed, @"\b(?:PHẦN|PHAN|PART|SECTION|CHƯƠNG|CHUONG|BÀI|BAI|ĐỀ|DE|TIỂU MỤC|MỤC|SESSION)\s+([IVXLCDM]+|\d+|[A-J])\b", RegexOptions.IgnoreCase);
            if (prefixMatch.Success)
            {
                var token = prefixMatch.Groups[1].Value;
                var rVal = DecodeRomanNumeral(token);
                if (rVal > 0) return rVal;
                if (int.TryParse(token, out var pNum)) return pNum;
                if (token.Length == 1 && char.IsLetter(token[0])) return char.ToUpperInvariant(token[0]) - 'A' + 1;
            }

            // 2. Số La Mã mở rộng (I đến XX)
            var romanMatch = Regex.Match(trimmed, @"\b(XX|XIX|XVIII|XVII|XVI|XV|XIV|XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)\b", RegexOptions.IgnoreCase);
            if (romanMatch.Success)
            {
                var rVal = DecodeRomanNumeral(romanMatch.Value);
                if (rVal > 0) return rVal;
            }

            // 3. Ký tự chữ cái thứ tự (Part A, Section B, Phần C...)
            var alphaMatch = Regex.Match(trimmed, @"\b(?:PART|SECTION|PHẦN|PHAN|TEIL|PARTIE)\s+([A-J])\b", RegexOptions.IgnoreCase);
            if (alphaMatch.Success)
            {
                char c = char.ToUpperInvariant(alphaMatch.Groups[1].Value[0]);
                return (c - 'A' + 1);
            }

            // 4. Số Hán tự (第一, 第二, 第三... hoặc 一、二、三...)
            var hanziMatch = Regex.Match(trimmed, @"[第]?([一二三四五六七八九十]+)[部分|卷|大题|题|、]?");
            if (hanziMatch.Success)
            {
                return DecodeHanziNumeral(hanziMatch.Groups[1].Value);
            }

            // 5. Số Ả Rập Đông (Eastern Arabic: ١, ٢, ٣...)
            var easternArabicMatch = Regex.Match(trimmed, @"[\u0660-\u0669]+");
            if (easternArabicMatch.Success)
            {
                int val = 0;
                foreach (char c in easternArabicMatch.Value)
                {
                    val = val * 10 + (c - '\u0660');
                }
                if (val > 0) return val;
            }

            // 6. Số Ả Rập chuẩn (1, 2, 3...) - Dự phòng cuối cùng khi không có La Mã hay từ khóa
            var digitMatch = Regex.Match(trimmed, @"\b\d+\b");
            if (digitMatch.Success && int.TryParse(digitMatch.Value, out var num))
            {
                return num;
            }

            return 0;
        }

        private static int DecodeHanziNumeral(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return 0;
            return text switch
            {
                "一" => 1, "二" => 2, "三" => 3, "四" => 4, "五" => 5,
                "六" => 6, "七" => 7, "八" => 8, "九" => 9, "十" => 10,
                "十一" => 11, "十二" => 12, "十三" => 13, "十四" => 14, "十五" => 15,
                "十六" => 16, "十七" => 17, "十八" => 18, "十九" => 19, "二十" => 20,
                _ => 1
            };
        }

        /// <summary>
        /// Cập nhật Phân đoạn Vĩ mô khi gặp tiêu đề phân đoạn lớn (PHẦN I, PHẦN II, SECTION A, TỰ LUẬN...).
        /// [PISA v7.0 Law 2]: Khi một Section mới mở ra, tự động đóng các phạm vi mở (Open-Ended) thuộc cấp Section, SubSection, GroupDirective trước đó.
        /// </summary>
        public void RegisterMacroSection(string sectionKey, string? sectionTitle)
        {
            if (!string.IsNullOrWhiteSpace(sectionKey))
            {
                CloseOpenScopesAtOrBelowLevel(ScopeHierarchyLevel.Section);
                CurrentMacroSection = sectionKey.Trim().ToUpperInvariant();
                CurrentSectionTitle = sectionTitle?.Trim();

                int partNum = ParseRankNumber(sectionTitle ?? sectionKey);
                CurrentPartRank = partNum > 0 ? partNum : (CurrentPartRank + 1);
                CurrentSubPartRank = 0;
                CurrentDirectiveRank = 0;
                _scopeWindows.Clear();
                _contextWindows.Clear();
            }
        }

        private static int DecodeRomanNumeral(string val)
        {
            if (string.IsNullOrWhiteSpace(val)) return 0;
            return val.ToUpperInvariant() switch
            {
                "I" => 1, "II" => 2, "III" => 3, "IV" => 4, "V" => 5,
                "VI" => 6, "VII" => 7, "VIII" => 8, "IX" => 9, "X" => 10,
                "XI" => 11, "XII" => 12, "XIII" => 13, "XIV" => 14, "XV" => 15,
                "XVI" => 16, "XVII" => 17, "XVIII" => 18, "XIX" => 19, "XX" => 20,
                _ => 0
            };
        }

        /// <summary>
        /// Đăng ký một Cửa sổ Chỉ thị Phạm vi mới.
        /// [PISA v7.0 Law 2]: Tự động đóng các phạm vi mở cùng cấp hoặc cấp thấp hơn trước khi đẩy phạm vi mới vào ngăn xếp.
        /// </summary>
        public void RegisterScopeDirective(DirectiveScopeWindow window)
        {
            if (window == null || window.StartQuestion <= 0) return;
            if (window.EndQuestion < window.StartQuestion) window.EndQuestion = window.StartQuestion;

            CloseOpenScopesAtOrBelowLevel(window.Level, window.StartQuestion - 1);
            _scopeWindows.Add(window);
        }

        /// <summary>
        /// Đăng ký một Cửa sổ Chỉ thị Phạm vi mới qua các tham số nguyên thủy.
        /// </summary>
        public void RegisterScopeDirective(int startQ, int endQ, string questionType, string? rawDirective, double confidence = 1.0)
        {
            if (startQ <= 0) return;
            if (endQ < startQ) endQ = startQ;

            bool isOpen = endQ == int.MaxValue;
            RegisterScopeDirective(new DirectiveScopeWindow
            {
                StartQuestion = startQ,
                EndQuestion = endQ,
                QuestionType = questionType,
                RawDirective = rawDirective,
                Confidence = confidence,
                Level = ScopeHierarchyLevel.GroupDirective,
                IsOpenEnded = isOpen
            });
        }

        /// <summary>
        /// Đăng ký ngữ cảnh bài đọc / tình huống thực tế áp dụng cho dải câu hỏi.
        /// </summary>
        public void RegisterContextPassage(int startQ, int endQ, string content, string? title = null, string? contextId = null)
        {
            RegisterContextPassage(startQ, endQ, content, title, contextId, ScopeHierarchyLevel.GroupDirective, endQ == int.MaxValue);
        }

        /// <summary>
        /// [PISA v7.0] Đăng ký ngữ cảnh kèm cấp phân cấp đàn hồi (SubSection / GroupDirective) và trạng thái mở/đóng.
        /// </summary>
        public void RegisterContextPassage(int startQ, int endQ, string content, string? title, string? contextId, ScopeHierarchyLevel level, bool isOpenEnded = false)
        {
            if (startQ <= 0) return;
            if (endQ < startQ) endQ = startQ;

            CloseOpenContextsAtOrBelowLevel(level, startQ - 1);

            _contextCounter++;
            int contextIdx = _contextCounter;

            string rawTitle = !string.IsNullOrWhiteSpace(title) ? title.Trim() : "Bài đọc hiểu / Ngữ cảnh";
            string indexPrefix = $"[Ngữ cảnh #{contextIdx}]";
            string safeTitle = endQ < int.MaxValue && endQ >= startQ
                ? $"{indexPrefix} {rawTitle} (Câu {startQ} - {endQ})"
                : $"{indexPrefix} {rawTitle} (Từ câu {startQ})";

            string resolvedContextId = contextId ?? $"CTX_{contextIdx}_{startQ}_{(endQ == int.MaxValue ? "OPEN" : endQ.ToString())}";

            _contextWindows.Add(new ContextStimulusWindow
            {
                StartQuestion = startQ,
                EndQuestion = endQ,
                ContextId = resolvedContextId,
                ContextTitle = safeTitle,
                ContextContent = (content ?? string.Empty).Trim(),
                Level = level,
                IsOpenEnded = isOpenEnded || endQ == int.MaxValue
            });
        }

        /// <summary>
        /// [PISA v7.0] Nối thêm đoạn văn bản vào ngữ cảnh đang mở gần nhất (dùng cho bài đọc hiểu nhiều đoạn văn trước câu hỏi đầu tiên).
        /// </summary>
        public void AppendToActiveContext(string additionalText)
        {
            if (string.IsNullOrWhiteSpace(additionalText)) return;
            var latest = _contextWindows.LastOrDefault(c => !c.IsExplicitlyClosed);
            if (latest != null)
            {
                if (string.IsNullOrWhiteSpace(latest.ContextContent) ||
                    (!string.IsNullOrWhiteSpace(latest.ContextTitle) && latest.ContextTitle.Contains(latest.ContextContent, StringComparison.OrdinalIgnoreCase)))
                {
                    latest.ContextContent = additionalText.Trim();
                }
                else
                {
                    latest.ContextContent += "\n\n" + additionalText.Trim();
                }
            }
        }

        /// <summary>
        /// [PISA v7.0 Law 5] Đóng tường minh phạm vi ở cấp chỉ định và mọi phạm vi con bên trong.
        /// </summary>
        public bool CloseScopeByLevel(ScopeHierarchyLevel level, int lastQuestionNumber = 0)
        {
            if (level == ScopeHierarchyLevel.None) return false;
            bool closedAny = false;

            for (int i = _scopeWindows.Count - 1; i >= 0; i--)
            {
                var w = _scopeWindows[i];
                if (!w.IsExplicitlyClosed && (int)w.Level >= (int)level)
                {
                    if (lastQuestionNumber > 0 && lastQuestionNumber >= w.StartQuestion)
                    {
                        w.EndQuestion = Math.Min(w.EndQuestion, lastQuestionNumber);
                    }
                    else
                    {
                        w.IsExplicitlyClosed = true;
                    }
                    closedAny = true;
                    if (w.Level == level) break;
                }
            }

            for (int i = _contextWindows.Count - 1; i >= 0; i--)
            {
                var c = _contextWindows[i];
                if (!c.IsExplicitlyClosed && (int)c.Level >= (int)level)
                {
                    if (lastQuestionNumber > 0 && lastQuestionNumber >= c.StartQuestion)
                    {
                        c.EndQuestion = Math.Min(c.EndQuestion, lastQuestionNumber);
                    }
                    else
                    {
                        c.IsExplicitlyClosed = true;
                    }
                    closedAny = true;
                    if (c.Level == level) break;
                }
            }

            return closedAny;
        }

        private void CloseOpenScopesAtOrBelowLevel(ScopeHierarchyLevel incomingLevel, int capEndQuestion = 0)
        {
            foreach (var w in _scopeWindows)
            {
                if (!w.IsExplicitlyClosed && w.IsOpenEnded && (int)w.Level >= (int)incomingLevel)
                {
                    if (capEndQuestion > 0 && capEndQuestion >= w.StartQuestion)
                        w.EndQuestion = capEndQuestion;
                    else
                        w.IsExplicitlyClosed = true;
                    w.IsOpenEnded = false;
                }
            }
        }

        private void CloseOpenContextsAtOrBelowLevel(ScopeHierarchyLevel incomingLevel, int capEndQuestion = 0)
        {
            foreach (var c in _contextWindows)
            {
                if (!c.IsExplicitlyClosed && c.IsOpenEnded && (int)c.Level >= (int)incomingLevel)
                {
                    if (capEndQuestion > 0 && capEndQuestion >= c.StartQuestion)
                    {
                        c.EndQuestion = capEndQuestion;
                        if (c.ContextTitle.Contains("(Từ câu"))
                        {
                            c.ContextTitle = Regex.Replace(c.ContextTitle, @"\(Từ\s+câu\s+\d+\)", $"(Câu {c.StartQuestion} - {capEndQuestion})");
                        }
                    }
                    else
                    {
                        c.IsExplicitlyClosed = true;
                    }
                    c.IsOpenEnded = false;
                }
            }
        }

        /// <summary>
        /// Suy luận loại câu hỏi kỳ vọng cho câu hỏi số qNum:
        /// Ưu tiên 1: Cửa sổ chỉ thị phạm vi có cấp phân cấp sâu nhất (GroupDirective -> SubSection -> Section) và hẹp nhất bao trùm qNum.
        /// Ưu tiên 2: Fallback chỉ định hoặc Phân đoạn vĩ mô hiện tại (CurrentMacroSection).
        /// </summary>
        public string ResolveExpectedQuestionType(int qNum, string? fallbackType = null)
        {
            if (qNum > 0)
            {
                var matched = _scopeWindows
                    .Where(w => w.Contains(qNum) && !string.IsNullOrWhiteSpace(w.QuestionType) && w.QuestionType != "UNKNOWN")
                    .OrderByDescending(w => (int)w.Level)
                    .ThenBy(w => w.EndQuestion - w.StartQuestion)
                    .FirstOrDefault();

                if (matched != null)
                {
                    return matched.QuestionType;
                }
            }

            return !string.IsNullOrWhiteSpace(fallbackType) ? fallbackType : CurrentMacroSection;
        }

        /// <summary>
        /// Tìm ngữ cảnh bài đọc hiểu / tình huống tương ứng cho câu hỏi số qNum.
        /// Nếu có cả ngữ cảnh SubSection (Tiểu phần) lẫn GroupDirective (Chỉ thị cụm câu) cùng bao trùm qNum,
        /// tự động hợp nhất ngữ cảnh phân cấp hoặc trả về ngữ cảnh sâu nhất.
        /// </summary>
        public ContextStimulusWindow? ResolveContextForQuestion(int qNum)
        {
            if (qNum <= 0) return null;
            var activeContexts = _contextWindows
                .Where(w => w.Contains(qNum) && !string.IsNullOrWhiteSpace(w.ContextContent))
                .OrderByDescending(w => (int)w.Level)
                .ThenBy(w => w.EndQuestion - w.StartQuestion)
                .ToList();

            if (activeContexts.Count == 0) return null;

            // TUYỆT ĐỐI KHÔNG GỘP CHUỖI các ngữ cảnh độc lập!
            // Trả về ngữ cảnh hẹp nhất và sâu nhất bao trùm qNum:
            return activeContexts[0];
        }

        // ─────────────────────────────────────────────────────────────────────
        // BỘ PHÂN TÍCH CÚ PHÁP CHỈ THỊ ĐA NGÔN NGỮ (SGI SCANNER)
        // ─────────────────────────────────────────────────────────────────────

        private static readonly Regex RangePatternVi = new(
            @"(?i)(?:từ\s+(?:các\s+)?câu(?:\s+số)?|ở\s+mỗi\s+câu(?:\s+hỏi)?\s*(?:từ)?|(?:các\s+)?câu(?:\s+số|\s+hỏi)?)\s*(\d+)\s*(?:đến\s*(?:các\s+)?câu(?:\s+số)?|đến|[-–—])\s*(\d+)",
            RegexOptions.Compiled);

        private static readonly Regex RangePatternOpenVi = new(
            @"(?i)(?:từ\s+câu|từ)\s*(\d+)\s*(?:đến\s*hết|trở\s*đi)",
            RegexOptions.Compiled);

        private static readonly Regex RangePatternEn = new(
            @"(?i)(?:questions?|items?|from\s+question|for\s+questions?|in\s+questions?)\s*(\d+)\s*(?:to|through|[-–—])\s*(?:questions?\s*)?(\d+)",
            RegexOptions.Compiled);

        private static readonly Regex RangePatternEnSuffix = new(
            @"(?i)(?:questions?|items?)\s+from\s*(\d+)\s*to\s*(\d+)",
            RegexOptions.Compiled);

        /// <summary>
        /// Phân tích một dòng văn bản để trích xuất Chỉ thị Phạm vi Khảo thí (SGI).
        /// Trả về true nếu dòng văn bản chứa chỉ thị phạm vi kèm hành vi tương tác hợp lệ.
        /// </summary>
        public static bool TryParseScopeDirective(string line, out DirectiveScopeWindow? window)
        {
            window = null;
            if (string.IsNullOrWhiteSpace(line)) return false;

            int startQ = 0, endQ = 0;
            bool foundRange = false;

            // 1. Quét dải số câu (Tiếng Việt & Tiếng Anh)
            var mVi = RangePatternVi.Match(line);
            if (mVi.Success)
            {
                startQ = int.Parse(mVi.Groups[1].Value);
                endQ = int.Parse(mVi.Groups[2].Value);
                foundRange = true;
            }
            else
            {
                var mEn = RangePatternEn.Match(line);
                if (mEn.Success)
                {
                    startQ = int.Parse(mEn.Groups[1].Value);
                    endQ = int.Parse(mEn.Groups[2].Value);
                    foundRange = true;
                }
                else
                {
                    var mEnSuffix = RangePatternEnSuffix.Match(line);
                    if (mEnSuffix.Success)
                    {
                        startQ = int.Parse(mEnSuffix.Groups[1].Value);
                        endQ = int.Parse(mEnSuffix.Groups[2].Value);
                        foundRange = true;
                    }
                    else
                    {
                        var mOpen = RangePatternOpenVi.Match(line);
                        if (mOpen.Success)
                        {
                            startQ = int.Parse(mOpen.Groups[1].Value);
                            endQ = 9999;
                            foundRange = true;
                        }
                    }
                }
            }

            if (!foundRange || startQ <= 0) return false;
            if (endQ < startQ) endQ = startQ;

            // 2. Nhận diện Hành vi / Động từ Khảo thí (Cognitive Action Verb)
            string lower = line.ToLowerInvariant();
            string? detectedType = null;

            // Ưu tiên 1: Đúng / Sai 4 ý (Multi True/False)
            if (Regex.IsMatch(lower, @"(?i)(?:mỗi\s+ý\s+[a-d]|các\s+mệnh\s+đề|mỗi\s+câu\s+có\s+4\s+ý).*?(?:chọn\s+đúng\s+(?:hoặc|hay)\s+sai|đúng\s*[-–\/\s]*sai|true\s*[-–\/\s]*false)")
                || Regex.IsMatch(lower, @"(?i)(?:chọn\s+đúng\s+(?:hoặc|hay)\s+sai|thí\s*sinh\s*chọn\s*đúng\s*hoặc\s*sai|mệnh\s+đề\s+đúng\s+hay\s+sai|indicate\s+whether\s+each\s+statement\s+is\s+true\s+or\s+false)"))
            {
                detectedType = "MULTI_TRUE_FALSE";
            }
            // Ưu tiên 2: Trả lời ngắn / Điền khuyết (Short Answer / Fill in the blank)
            else if (Regex.IsMatch(lower, @"(?i)(?:(?:phần\s+iii|part\s+iii|section\s+iii).*?trả\s*lời|trả\s*lời\s*ngắn|yêu\s*cầu\s*trả\s*lời\s*ngắn|điền\s*(?:đáp\s*số|vào\s*chỗ\s*trống)|viết\s*câu\s*trả\s*lời|kết\s*quả\s*làm\s*tròn|fill\s*in\s*the\s*blank|short\s*answer|write\s*your\s*answer)"))
            {
                detectedType = "SHORT_ANSWER";
            }
            // Ưu tiên 3: Sắp xếp thứ tự quy trình (Ordering)
            else if (Regex.IsMatch(lower, @"(?i)(?:sắp\s*xếp\s*(?:các\s*(?:bước|câu|đoạn|ý))?|thứ\s*tự\s*(?:thực\s*hiện|đúng)|arrange\s+the\s+(?:utterances|sentences|steps)|chronological\s+order)"))
            {
                detectedType = "ORDERING";
            }
            // Ưu tiên 4: Nối cặp / Ghép cột (Matching)
            else if (Regex.IsMatch(lower, @"(?i)(?:ghép\s*(?:nội\s*dung|thông\s*tin)?\s*(?:ở\s*)?cột\s+[a-b1-2]|nối\s*(?:mệnh\s*đề|cột)|match\s*(?:each\s*item|the\s*items)?\s*in\s*column)"))
            {
                detectedType = "MATCHING";
            }
            // Ưu tiên 5: Chọn nhiều phương án (Multi Choice)
            else if (Regex.IsMatch(lower, @"(?i)(?:chọn\s+(?:tất\s*cả|các)\s+phương\s*án\s+đúng|có\s+thể\s+chọn\s+nhiều\s+đáp\s+án|choose\s+all\s+that\s+apply|select\s+all\s+correct)"))
            {
                detectedType = "MULTI";
            }
            // Ưu tiên 6: Chọn một phương án (Single Choice)
            else if (Regex.IsMatch(lower, @"(?i)(?:chỉ\s*chọn\s*(?:một|01|1)\s*phương\s*án|(?:mỗi\s+câu(?:\s+hỏi)?(?:\s+thí\s+sinh)?\s+)?chọn\s+(?:một|01|1)\s+phương\s*án|chọn\s*(?:một|01|1)\s*phương\s*án\s*đúng|chọn\s+phương\s*án\s*(?:đúng\s*nhất|chính\s*xác\s*nhất)|mark\s+the\s+letter\s+[a-d]|choose\s+the\s+(?:best|correct)\s+answer|select\s+one\s+answer|chọn\s+câu\s+trả\s+lời\s+đúng)"))
            {
                detectedType = "SINGLE";
            }
            // Ưu tiên 7: Tự luận (Essay)
            else if (Regex.IsMatch(lower, @"(?i)(?:tự\s*luận|thí\s*sinh\s*giải\s*(?:các\s*)?bài\s*toán|trình\s*bày\s*(?:chi\s*tiết\s*)?lời\s*giải|thang\s*điểm.*?điểm|solve\s+the\s+following|show\s+your\s+work)"))
            {
                detectedType = "ESSAY";
            }

            if (detectedType == null) return false;

            window = new DirectiveScopeWindow
            {
                StartQuestion = startQ,
                EndQuestion = endQ,
                QuestionType = detectedType,
                RawDirective = line.Trim(),
                Confidence = 0.95
            };
            return true;
        }

        /// <summary>
        /// Nhận diện dòng bài đọc / tình huống thực tế áp dụng cho dải câu hỏi.
        /// </summary>
        public static bool TryParsePassageContextPrompt(string line, out int startQ, out int endQ, out string contextTitle)
        {
            startQ = 0;
            endQ = 0;
            contextTitle = string.Empty;
            if (string.IsNullOrWhiteSpace(line)) return false;

            var lower = line.ToLowerInvariant();
            bool isPassagePrompt = lower.Contains("đọc đoạn văn") || lower.Contains("đọc bài văn") || lower.Contains("đọc thông tin")
                                  || lower.Contains("read the following passage") || lower.Contains("read the passage")
                                  || lower.Contains("read the following text") || lower.Contains("read the following advertisement")
                                  || lower.Contains("sử dụng thông tin") || lower.Contains("dựa vào thông tin") || lower.Contains("dựa trên thông tin")
                                  || lower.Contains("cho thông tin") || lower.Contains("dùng thông tin") || lower.Contains("tình huống sau")
                                  || lower.Contains("dưới đây để trả lời") || lower.Contains("sau để trả lời");

            if (!isPassagePrompt) return false;

            var mVi = RangePatternVi.Match(line);
            if (mVi.Success)
            {
                startQ = int.Parse(mVi.Groups[1].Value);
                endQ = int.Parse(mVi.Groups[2].Value);
            }
            else
            {
                var mEn = RangePatternEn.Match(line);
                if (mEn.Success)
                {
                    startQ = int.Parse(mEn.Groups[1].Value);
                    endQ = int.Parse(mEn.Groups[2].Value);
                }
                else
                {
                    var mEnSuffix = RangePatternEnSuffix.Match(line);
                    if (mEnSuffix.Success)
                    {
                        startQ = int.Parse(mEnSuffix.Groups[1].Value);
                        endQ = int.Parse(mEnSuffix.Groups[2].Value);
                    }
                }
            }

            if (startQ <= 0) return false;
            if (endQ < startQ) endQ = startQ;

            contextTitle = startQ == endQ
                ? $"Bài đọc hiểu (Câu {startQ})"
                : (endQ >= 9999 ? $"Bài đọc hiểu (Từ câu {startQ})" : $"Bài đọc hiểu (Câu {startQ} - {endQ})");

            return true;
        }
    }
}
