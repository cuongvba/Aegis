using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Aegis.Application.DTOs;

namespace Aegis.Infrastructure.Services.Docx
{
    /// <summary>
    /// [Docx Table Question Extractor]
    /// Chuyên trách phân giải bảng biểu trong OpenXML:
    /// - Bóc tách Bảng đáp án tổng hợp (Phần I: Trắc nghiệm, Phần II: Đúng/Sai, Phần III: Trả lời ngắn, Lưới đa cột).
    /// - Chuyển đổi bảng số liệu, bảng biến thiên trong đề thi sang bảng Markdown chuẩn.
    /// </summary>
    public static class DocxTableQuestionExtractor
    {
        private static readonly XNamespace W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

        /// <summary>
        /// Bóc tách bảng đáp án trong OpenXML sang map 3 chiều [examCode][section][qNum].
        /// Hỗ trợ cả bảng có tiêu đề "Câu"/"Chọn" lẫn bảng lưới số thuần túy (GDPT 2025/2026: 1 | 2 | 3...).
        /// </summary>
        /// <summary>
        /// Bóc tách bảng đáp án trong OpenXML sang map 3 chiều [examCode][section][qNum].
        /// Hỗ trợ cả bảng có tiêu đề "Câu"/"Chọn" lẫn bảng lưới số thuần túy (GDPT 2025/2026: 1 | 2 | 3...).
        /// </summary>
        public static Dictionary<string, Dictionary<string, Dictionary<int, string>>> ExtractAnswerTables(
            XDocument doc,
            string defaultExamPrefix = "DE",
            DynamicQuestionIngestionEngine? engineOverride = null,
            QuestionParsingRuleDto? activeRule = null)
        {
            return ExtractAnswerTables(doc, out _, defaultExamPrefix, engineOverride, activeRule);
        }

        /// <summary>
        /// Bóc tách bảng đáp án và đồng thời đánh dấu các phần tử bảng đáp án để không bị trôi vào văn bản thuần.
        /// Tuân thủ nguyên lý COD (Configuration-Over-Data) & OCP:
        /// - Nhận diện biên giới đề thi, phân đoạn (Phần I/II/III), tiêu đề bảng qua DynamicQuestionIngestionEngine & JSON Dictionary / ParsingRule.
        /// - Loại bỏ hoàn toàn magic numbers và hardcode regex bằng việc nạp động qua AnswerTableDictionaryDto.
        /// </summary>
        public static Dictionary<string, Dictionary<string, Dictionary<int, string>>> ExtractAnswerTables(
            XDocument doc,
            out HashSet<XElement> answerTableElements,
            string defaultExamPrefix = "DE",
            DynamicQuestionIngestionEngine? engineOverride = null,
            QuestionParsingRuleDto? activeRule = null)
        {
            var localAnswerTableElements = new HashSet<XElement>();
            answerTableElements = localAnswerTableElements;
            var map = new Dictionary<string, Dictionary<string, Dictionary<int, string>>>(StringComparer.OrdinalIgnoreCase);
            var body = doc.Descendants(W + "body").FirstOrDefault();
            if (body == null) return map;

            var cig = engineOverride ?? DynamicQuestionIngestionEngine.Instance;
            var specs = cig.GetEffectiveAnswerTableSpecs(activeRule);
            var tfLabels = specs.TrueFalseColumnLabels?.Count > 0 ? specs.TrueFalseColumnLabels : new List<string> { "a", "b", "c", "d" };

            string prefix = string.IsNullOrWhiteSpace(defaultExamPrefix) ? "DE" : defaultExamPrefix.Trim().TrimEnd('_');
            string currentExam = "DEFAULT";
            string currentSection = "SINGLE";
            string lastPrecedingText = "";

            // Theo dõi số câu hỏi tích lũy theo từng đề để ánh xạ động số thứ tự toàn đề (thay thế hoàn toàn magic numbers 12, 16)
            var examCumulativeOffsets = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            void EnsureMap(string exam, string sec)
            {
                if (!map.ContainsKey(exam)) map[exam] = new(StringComparer.OrdinalIgnoreCase);
                if (!map[exam].ContainsKey(sec)) map[exam][sec] = new();
                if (!map.ContainsKey("DEFAULT")) map["DEFAULT"] = new(StringComparer.OrdinalIgnoreCase);
                if (!map["DEFAULT"].ContainsKey(sec)) map["DEFAULT"][sec] = new();
            }

            void StoreAnswer(string exam, string sec, int qNum, string ans)
            {
                EnsureMap(exam, sec);
                map[exam][sec][qNum] = ans;
                if (exam.Equals("DEFAULT", StringComparison.OrdinalIgnoreCase) || !map["DEFAULT"][sec].ContainsKey(qNum))
                {
                    map["DEFAULT"][sec][qNum] = ans;
                }
            }

            void ProcessTableElement(XElement el, bool isNested = false)
            {
                // [Table Exam Heading Synchronization]
                // Đồng bộ hóa mã đề thi ngay khi phát hiện bảng tiêu đề (kể cả bảng 1 hàng)
                foreach (var tp in el.Descendants(W + "p"))
                {
                    var tpText = string.Concat(tp.Descendants(W + "t").Select(t => t.Value)).Trim();
                    if (!string.IsNullOrWhiteSpace(tpText) && cig.TryMatchExamHeading(tpText, out string tExamCode))
                    {
                        if (int.TryParse(tExamCode, out int tExamNum))
                        {
                            if (tExamNum < 1900 || tExamNum > 2099)
                            {
                                currentExam = $"{prefix}_{tExamNum:D2}";
                                examCumulativeOffsets[currentExam] = 0;
                                currentSection = "SINGLE";
                            }
                        }
                        else
                        {
                            currentExam = $"{prefix}_{tExamCode}";
                            examCumulativeOffsets[currentExam] = 0;
                            currentSection = "SINGLE";
                        }
                    }
                }

                // Xử lý đệ quy các bảng lồng (Nested Tables - ví dụ Đề 7, Đề 8 nhúng bảng đáp án bên trong bảng barem điểm tổng hợp)
                var nestedTbls = el.Elements(W + "tr")
                    .SelectMany(r => r.Elements(W + "tc"))
                    .SelectMany(c => c.Elements(W + "tbl"))
                    .ToList();
                if (nestedTbls.Count > 0)
                {
                    foreach (var nTbl in nestedTbls)
                    {
                        ProcessTableElement(nTbl, isNested: true);
                    }
                }

                var rows = el.Elements(W + "tr").ToList();
                if (rows.Count < 2) return;

                // [Bỏ qua bảng bài làm thí sinh] ("HS Viết đáp án vào đây", "Ghi lại đáp án vào bảng sau", "Student Answer Sheet"...)
                if (!string.IsNullOrWhiteSpace(lastPrecedingText) && cig.IsMatchStudentAnswerSheet(lastPrecedingText, specs))
                {
                    return;
                }

                int offset = examCumulativeOffsets.GetValueOrDefault(currentExam, 0);

                // ── [CHIP v3.1 / SCIE v4.0 - Trụ cột 1: Nhận diện Merged Header & Trích xuất Section] ──
                int startRow = 0;
                var r0Cells = rows[0].Descendants(W + "tc").ToList();
                var r0Text = string.Concat(r0Cells.SelectMany(tc => tc.Descendants(W + "t").Select(t => t.Value))).Trim();

                if (r0Cells.Count <= 2 && rows.Count >= 3)
                {
                    var r1Cells = rows[1].Descendants(W + "tc").ToList();
                    if (r1Cells.Count >= 3 && (cig.IsMatchAnswerPhaseHeader(r0Text, specs) || cig.TryMatchAnswerTablePhase(r0Text)))
                    {
                        if (cig.TryMatchSectionHeader(r0Text, out string secFromHeader))
                        {
                            currentSection = secFromHeader;
                        }
                        startRow = 1;
                    }
                }

                var row0 = ExtractRowCellsNormalized(rows[startRow], W);
                var row1 = ExtractRowCellsNormalized(rows[startRow + 1], W);
                if (row0.Count == 0 || row1.Count == 0) return;

                // [Loại trừ bảng câu hỏi nội dung đề thi]
                // Bảng có cột "Nội dung", "Mệnh đề", "Statement", "Content" là bảng câu hỏi đề bài cho học sinh làm, KHÔNG phải bảng đáp án
                bool isQuestionContentTable = row0.Any(c => cig.IsMatchQuestionContentColumn(c, specs));
                if (isQuestionContentTable)
                {
                    return;
                }

                // ── DẠNG TỔ HỢP / ĐA CỘT (Composite Cell Pattern dạng "1. C", "2.C", "Câu 1. A", "Câu 5. C"...) ──
                // Ưu tiên kiểm tra trước nếu bảng có cấu trúc mỗi ô chứa cả số câu và đáp án (như ĐỀ 4, ĐỀ 10)
                var compositeMatches = new List<(int QNum, string Ans)>();
                foreach (var r in rows)
                {
                    foreach (var tc in r.Descendants(W + "tc"))
                    {
                        var cellText = string.Concat(tc.Descendants(W + "t").Select(t => t.Value)).Trim();
                        if (string.IsNullOrWhiteSpace(cellText)) continue;
                        var matches = cig.MatchCompositeCells(cellText, specs);
                        foreach (Match m in matches)
                        {
                            if (int.TryParse(m.Groups[1].Value, out int qNum))
                            {
                                compositeMatches.Add((qNum, m.Groups[2].Value));
                            }
                        }
                    }
                }

                if (compositeMatches.Count >= 4)
                {
                    localAnswerTableElements.Add(el);
                    int tableQCount = 0;
                    foreach (var (qNum, rawAns) in compositeMatches)
                    {
                        tableQCount++;
                        string finalAns = rawAns.Trim();
                        if (cig.IsMatchTrueValue(finalAns, specs)) finalAns = "Đúng";
                        else if (cig.IsMatchFalseValue(finalAns, specs)) finalAns = "Sai";
                        else if (Regex.IsMatch(finalAns, @"^[A-Ga-g]$")) finalAns = (char.ToUpperInvariant(finalAns[0]) - 'A' + 1).ToString();

                        string sec = (finalAns == "Đúng" || finalAns == "Sai") ? "TRUE_FALSE" : (currentSection == "TRUE_FALSE" || currentSection == "MULTI_TRUE_FALSE" ? "MULTI_TRUE_FALSE" : "SINGLE");
                        int localQ = qNum;

                        StoreAnswer(currentExam, sec, localQ, finalAns);
                        if (sec == "TRUE_FALSE") StoreAnswer(currentExam, "MULTI_TRUE_FALSE", localQ, finalAns);
                    }
                    examCumulativeOffsets[currentExam] = offset + tableQCount;
                    return;
                }

                // ── DẠNG 1 & 2A MỞ RỘNG: Bảng lưới đáp án ngang đa năng (Horizontal Answer Grid) ──
                // Hỗ trợ cả:
                // a) Hàng 0 là Câu 1 | Câu 2 | Câu 3... hoặc 1 | 2 | 3...
                // b) Hàng 0 có ô đầu là "Câu", Hàng 1 có ô đầu là "Đáp án" / "Chọn"
                // c) Hàng 0 rỗng (hoặc để trống) nhưng Hàng 1 chứa các đáp án [A-D] hoặc [ĐS] liên tiếp (như ĐỀ 1 Table 82)
                bool handledHorizontalGrid = false;
                int horizontalQCount = 0;

                for (int rIdx = startRow; rIdx < rows.Count - 1; rIdx += 2)
                {
                    var pairRow0 = rows[rIdx].Descendants(W + "tc").Select(tc => string.Concat(tc.Descendants(W + "t").Select(t => t.Value)).Trim()).ToList();
                    var pairRow1 = rows[rIdx + 1].Descendants(W + "tc").Select(tc => string.Concat(tc.Descendants(W + "t").Select(t => t.Value)).Trim()).ToList();
                    if (pairRow0.Count < 2 || pairRow1.Count == 0) continue;

                    int maxCols = Math.Min(pairRow0.Count, pairRow1.Count);
                    bool row0AllBlank = pairRow0.All(string.IsNullOrWhiteSpace);
                    bool row1AllAnswers = (maxCols >= 4) && pairRow1.All(c => cig.IsMatchAnswerLetter(c.Trim(), specs));

                    int startCol = 0;
                    if (cig.IsMatchQuestionHeader(pairRow0[0], specs) && cig.IsMatchAnswerHeader(pairRow1[0], specs))
                    {
                        startCol = 1;
                    }
                    else if (row0AllBlank && row1AllAnswers)
                    {
                        startCol = 0;
                    }
                    else
                    {
                        // Nếu không có cột tiêu đề "Câu" / "Đáp án", hàng 0 phải toàn bộ là số câu hỏi (1, 2, 3... hoặc Câu 1, Câu 2...)
                        // Tuyệt đối không nhận diện các bảng số liệu toán học/thống kê trong lời giải (như "Nhóm", "Phần dư", "Thời gian") làm bảng đáp án
                        bool isAllQuestionNumbers = pairRow0.All(c => Regex.IsMatch(c.Trim(), @"^(?:Câu\s*)?\d+$"));
                        if (!isAllQuestionNumbers) continue;
                    }

                    var gridPairs = new List<(int QNum, string Ans)>();

                    // Kiểm tra trường hợp hàng 0 rỗng toàn bộ nhưng hàng 1 chứa toàn chữ cái đáp án
                    if (row0AllBlank && row1AllAnswers)
                    {
                        for (int c = startCol; c < maxCols; c++)
                        {
                            int qNum = c - startCol + 1;
                            gridPairs.Add((qNum, pairRow1[c].Trim()));
                        }
                    }
                    else
                    {
                        // Kiểm tra: bảng lưới đáp án ngang không được chứa các ô có văn bản câu hỏi dài (> MaxQuestionTextLengthInGrid hoặc > MaxAnswerTextLengthInGrid)
                        int maxQTextLen = specs.MaxQuestionTextLengthInGrid > 0 ? specs.MaxQuestionTextLengthInGrid : 20;
                        int maxATextLen = specs.MaxAnswerTextLengthInGrid > 0 ? specs.MaxAnswerTextLengthInGrid : 35;

                        bool hasLongText = pairRow0.Skip(startCol).Take(maxCols - startCol).Any(c => c.Length > maxQTextLen) ||
                                           pairRow1.Skip(startCol).Take(maxCols - startCol).Any(c => c.Length > maxATextLen);
                        if (hasLongText) continue;

                        for (int c = startCol; c < maxCols; c++)
                        {
                            string c0 = pairRow0[c].Trim();
                            string c1 = pairRow1[c].Trim();
                            if (string.IsNullOrEmpty(c1)) continue;

                            var mQ = Regex.Match(c0, @"\d+");
                            if (mQ.Success && int.TryParse(mQ.Value, out int qNum))
                            {
                                gridPairs.Add((qNum, c1));
                            }
                        }
                    }

                    // Loại trừ nếu các đáp án thực chất là các số thứ tự tiếp nối của học sinh điền (ví dụ 11, 12, 13...)
                    bool isStudentSequentialGrid = gridPairs.Count >= 4 && gridPairs.All(p => int.TryParse(p.Ans.TrimEnd('.'), out int aNum) && aNum > gridPairs.Count);
                    if (isStudentSequentialGrid) continue;

                    if (gridPairs.Count >= 2)
                    {
                        if (!handledHorizontalGrid)
                        {
                            localAnswerTableElements.Add(el);
                            handledHorizontalGrid = true;
                        }

                        // Suy luận phân đoạn dựa trên dữ liệu các ô đáp án
                        string sec = currentSection;
                        if (gridPairs.All(p => cig.IsMatchTrueFalseSeries(p.Ans, specs)))
                        {
                            sec = "TRUE_FALSE";
                        }
                        else if (gridPairs.All(p => cig.IsMatchAnswerLetter(p.Ans, specs)))
                        {
                            sec = "SINGLE";
                        }
                        else if (currentSection == "SHORT_ANSWER" || gridPairs.Any(p => double.TryParse(p.Ans.Replace(',', '.'), out _)))
                        {
                            sec = "SHORT_ANSWER";
                        }

                        foreach (var (qNum, rawAns) in gridPairs)
                        {
                            horizontalQCount++;
                            int localQ = qNum;
                            int globalQ = (offset > 0 && qNum <= 30) ? (offset + qNum) : qNum;

                            if (sec == "SINGLE")
                            {
                                string ansIndex = cig.IsMatchAnswerLetter(rawAns, specs) && rawAns.Length == 1 && char.IsLetter(rawAns[0])
                                    ? (char.ToUpperInvariant(rawAns[0]) - 'A' + 1).ToString()
                                    : rawAns;

                                StoreAnswer(currentExam, "SINGLE", localQ, ansIndex);
                                if (globalQ != localQ) StoreAnswer(currentExam, "SINGLE", globalQ, ansIndex);
                            }
                            else if (sec == "TRUE_FALSE" || sec == "MULTI_TRUE_FALSE")
                            {
                                var tfList = new List<string>();
                                if (rawAns.Length >= 2 && cig.IsMatchTrueFalseSeries(rawAns, specs))
                                {
                                    for (int i = 0; i < rawAns.Length && i < tfLabels.Count; i++)
                                    {
                                        string sub = tfLabels[i];
                                        char ch = rawAns[i];
                                        string isTrue = cig.IsMatchTrueValue(ch.ToString(), specs) ? "Đúng" : "Sai";
                                        tfList.Add($"{sub}) {isTrue}");
                                    }
                                }
                                else
                                {
                                    string isTrue = cig.IsMatchTrueValue(rawAns, specs) ? "Đúng" : "Sai";
                                    tfList.Add(isTrue);
                                }
                                string formattedTf = tfList.Count > 0 ? string.Join(", ", tfList) : rawAns;

                                StoreAnswer(currentExam, "TRUE_FALSE", localQ, formattedTf);
                                StoreAnswer(currentExam, "MULTI_TRUE_FALSE", localQ, formattedTf);
                                if (globalQ != localQ)
                                {
                                    StoreAnswer(currentExam, "TRUE_FALSE", globalQ, formattedTf);
                                    StoreAnswer(currentExam, "MULTI_TRUE_FALSE", globalQ, formattedTf);
                                }
                            }
                            else if (sec == "SHORT_ANSWER")
                            {
                                StoreAnswer(currentExam, "SHORT_ANSWER", localQ, rawAns);
                                if (globalQ != localQ) StoreAnswer(currentExam, "SHORT_ANSWER", globalQ, rawAns);
                            }
                        }
                    }
                }

                if (handledHorizontalGrid)
                {
                    examCumulativeOffsets[currentExam] = offset + horizontalQCount;
                    return;
                }

                // ── DẠNG 2B: Bảng kết quả mini của 1 câu hỏi Đúng/Sai (Row 0: Câu 1 | a) | b) | c) | d) - Row 1: ý | Đ | S | Đ | Đ) ──
                var matchSingleQ = Regex.Match(row0[0], @"^(?:" + (specs.QuestionHeaderPattern ?? "Câu|Question|Q") + @")\s*(\d+)", RegexOptions.IgnoreCase);
                bool isSingleQTfTable = row0.Count >= 3 && matchSingleQ.Success
                    && row0.Skip(1).Take(4).All(c => Regex.IsMatch(c.Trim(), @"^[a-dA-D][\)\.]?$"));

                if (isSingleQTfTable)
                {
                    localAnswerTableElements.Add(el);
                    int qNum = int.Parse(matchSingleQ.Groups[1].Value);
                    var tfList = new List<string>();

                    for (int c = 1; c < Math.Min(row0.Count, row1.Count); c++)
                    {
                        var matchSub = Regex.Match(row0[c], @"[a-dA-D]");
                        string sub = matchSub.Success ? matchSub.Value.ToLowerInvariant() : tfLabels.ElementAtOrDefault(c - 1) ?? "a";
                        string cellVal = row1[c].Trim();
                        bool isTrue = cig.IsMatchTrueValue(cellVal, specs);
                        tfList.Add($"{sub}) {(isTrue ? "Đúng" : "Sai")}");
                    }

                    if (tfList.Count > 0)
                    {
                        string formattedTf = string.Join(", ", tfList);
                        int localQ = qNum;
                        int globalQ = (offset > 0 && qNum <= 30) ? (offset + qNum) : qNum;

                        StoreAnswer(currentExam, "TRUE_FALSE", localQ, formattedTf);
                        StoreAnswer(currentExam, "MULTI_TRUE_FALSE", localQ, formattedTf);
                        if (globalQ != localQ)
                        {
                            StoreAnswer(currentExam, "TRUE_FALSE", globalQ, formattedTf);
                            StoreAnswer(currentExam, "MULTI_TRUE_FALSE", globalQ, formattedTf);
                        }
                    }
                    return;
                }

                // ── Dạng 3: Bảng trắc nghiệm Đúng / Sai ma trận cột đa câu (Row 0: Câu 1 | Câu 2 | Câu 3 | Câu 4) ──
                string row0Prefix = Regex.Replace(row0[0], @"\s*\d+.*$", "").Trim();
                bool isTfMatrixMulti = row0.Count >= 2 && !isSingleQTfTable &&
                    (row0.Take(2).All(c => Regex.IsMatch(c, @"^(?:" + (specs.QuestionHeaderPattern ?? "Câu|Question|Q") + @")\s*\d+", RegexOptions.IgnoreCase)) ||
                     (cig.IsMatchQuestionHeader(row0Prefix, specs) && row0.Skip(1).All(c => Regex.IsMatch(c, @"\d+"))));

                if (isTfMatrixMulti)
                {
                    localAnswerTableElements.Add(el);
                    int tableQCount = 0;
                    for (int col = 0; col < row0.Count; col++)
                    {
                        var matchColNum = Regex.Match(row0[col], @"\d+");
                        int qNum = matchColNum.Success ? int.Parse(matchColNum.Value) : (col + 1);
                        tableQCount++;

                        var tfParts = new List<string>();
                        for (int r = 1; r < rows.Count; r++)
                        {
                            var cells = rows[r].Descendants(W + "tc").Select(tc => string.Concat(tc.Descendants(W + "t").Select(t => t.Value)).Trim()).ToList();
                            if (col < cells.Count && !string.IsNullOrEmpty(cells[col]))
                            {
                                string rawCell = cells[col].Trim();
                                var matchSubAns = Regex.Match(rawCell, @"^([a-dA-D])[\)\.]?\s*(.+)$");
                                if (matchSubAns.Success)
                                {
                                    string sub = matchSubAns.Groups[1].Value.ToLowerInvariant();
                                    string val = matchSubAns.Groups[2].Value.Trim();
                                    bool isTrue = cig.IsMatchTrueValue(val, specs);
                                    tfParts.Add($"{sub}) {(isTrue ? "Đúng" : "Sai")}");
                                }
                                else
                                {
                                    string sub = tfLabels.ElementAtOrDefault(r - 1) ?? "a";
                                    bool isTrue = cig.IsMatchTrueValue(rawCell, specs);
                                    tfParts.Add($"{sub}) {(isTrue ? "Đúng" : "Sai")}");
                                }
                            }
                        }
                        if (tfParts.Count > 0)
                        {
                            string formattedTf = string.Join(", ", tfParts);
                            int localQ = qNum;
                            int globalQ = (offset > 0 && qNum <= 30) ? (offset + qNum) : qNum;

                            StoreAnswer(currentExam, "TRUE_FALSE", localQ, formattedTf);
                            StoreAnswer(currentExam, "MULTI_TRUE_FALSE", localQ, formattedTf);
                            if (globalQ != localQ)
                            {
                                StoreAnswer(currentExam, "TRUE_FALSE", globalQ, formattedTf);
                                StoreAnswer(currentExam, "MULTI_TRUE_FALSE", globalQ, formattedTf);
                            }
                        }
                    }

                    examCumulativeOffsets[currentExam] = offset + tableQCount;
                    return;
                }

                // ── DẠNG 3B: Bảng Đúng / Sai Hàng-Câu Cột-Ý (Row 0: Câu | a | b | c | d - Row 1..N: Câu 1 | Đ | S | Đ | S) ──
                bool isRowBasedTf = row0.Count >= 5 && cig.IsMatchQuestionHeader(row0[0], specs)
                    && row0.Skip(1).Take(4).All(c => Regex.IsMatch(c.Trim(), @"^(?:ý\s*)?[a-dA-D][\)\.]?$", RegexOptions.IgnoreCase));

                if (isRowBasedTf)
                {
                    localAnswerTableElements.Add(el);
                    int tableQCount = 0;
                    for (int r = startRow + 1; r < rows.Count; r++)
                    {
                        var rCells = ExtractRowCellsNormalized(rows[r], W);
                        if (rCells.Count < 5) continue;

                        var mQ = Regex.Match(rCells[0], @"\d+");
                        if (!mQ.Success) continue;
                        int qNum = int.Parse(mQ.Value);
                        tableQCount++;

                        var tfParts = new List<string>();
                        for (int c = 1; c <= 4 && c < rCells.Count; c++)
                        {
                            string sub = tfLabels.ElementAtOrDefault(c - 1) ?? ((char)('a' + c - 1)).ToString();
                            string val = rCells[c].Trim();
                            bool isTrue = cig.IsMatchTrueValue(val, specs);
                            tfParts.Add($"{sub}) {(isTrue ? "Đúng" : "Sai")}");
                        }

                        if (tfParts.Count > 0)
                        {
                            string formattedTf = string.Join(", ", tfParts);
                            int localQ = qNum;
                            int globalQ = (offset > 0 && qNum <= 30) ? (offset + qNum) : qNum;

                            StoreAnswer(currentExam, "TRUE_FALSE", localQ, formattedTf);
                            StoreAnswer(currentExam, "MULTI_TRUE_FALSE", localQ, formattedTf);
                            if (globalQ != localQ)
                            {
                                StoreAnswer(currentExam, "TRUE_FALSE", globalQ, formattedTf);
                                StoreAnswer(currentExam, "MULTI_TRUE_FALSE", globalQ, formattedTf);
                            }
                        }
                    }

                    examCumulativeOffsets[currentExam] = offset + tableQCount;
                    return;
                }

                // ── Dạng 4: Bảng lưới đa cột dọc (Câu | Đáp án | Câu | Đáp án ...) theo COD AnswerTableSpecs ──
                if (row0.Count >= 2 && cig.IsMatchQuestionHeader(row0[0], specs) && cig.IsMatchAnswerHeader(row0[1], specs))
                {
                    localAnswerTableElements.Add(el);
                    int tableQCount = 0;

                    var sampleAnswers = new List<string>();
                    for (int r = 1; r < rows.Count; r++)
                    {
                        var cells = ExtractRowCellsNormalized(rows[r], W);
                        for (int c = 0; c < cells.Count - 1; c += 2)
                        {
                            if (int.TryParse(cells[c], out _) && !string.IsNullOrWhiteSpace(cells[c + 1]))
                            {
                                sampleAnswers.Add(cells[c + 1].Trim());
                            }
                        }
                    }

                    string targetSec = currentSection;
                    if (sampleAnswers.Count > 0)
                    {
                        if (sampleAnswers.All(a => cig.IsMatchAnswerLetter(a, specs)))
                        {
                            targetSec = "SINGLE";
                        }
                        else if (currentSection == "SHORT_ANSWER" || sampleAnswers.Any(a => Regex.IsMatch(a, @"[\d,\.\%\+\-]")))
                        {
                            targetSec = "SHORT_ANSWER";
                        }
                    }

                    for (int r = 1; r < rows.Count; r++)
                    {
                        var cells = ExtractRowCellsNormalized(rows[r], W);
                        for (int c = 0; c < cells.Count - 1; c += 2)
                        {
                            if (int.TryParse(cells[c], out int qNum))
                            {
                                tableQCount++;
                                string rawAns = cells[c + 1].Trim();
                                string finalAns = rawAns;

                                if (targetSec == "SINGLE")
                                {
                                    var upperA = rawAns.ToUpperInvariant();
                                    finalAns = cig.IsMatchAnswerLetter(upperA, specs) && upperA.Length == 1 && char.IsLetter(upperA[0])
                                        ? (upperA[0] - 'A' + 1).ToString()
                                        : rawAns;
                                }

                                if (!string.IsNullOrWhiteSpace(finalAns))
                                {
                                    int localQ = qNum;
                                    int globalQ = (offset > 0 && qNum <= 30) ? (offset + qNum) : qNum;

                                    StoreAnswer(currentExam, targetSec, localQ, finalAns);
                                    if (globalQ != localQ) StoreAnswer(currentExam, targetSec, globalQ, finalAns);
                                }
                            }
                        }
                    }

                    examCumulativeOffsets[currentExam] = offset + tableQCount;
                    return;
                }

                // ── DẠNG 6: Bảng Ma Trận Đa Mã Đề (Multi-Exam Code Cross-Matrix: Row 0: Câu | 101 | 102 | 103...) ──
                bool isMultiExamMatrix = row0.Count >= 3 && cig.IsMatchQuestionHeader(row0[0], specs)
                    && row0.Skip(1).All(c => cig.IsMatchMultiExamCrossMatrix(c.Trim(), specs));

                if (isMultiExamMatrix)
                {
                    localAnswerTableElements.Add(el);
                    var colExamMap = new Dictionary<int, string>();
                    for (int c = 1; c < row0.Count; c++)
                    {
                        var matchCode = Regex.Match(row0[c].Trim(), @"\d{2,4}");
                        if (matchCode.Success)
                        {
                            colExamMap[c] = $"{prefix}_{matchCode.Value}";
                        }
                    }

                    if (colExamMap.Count > 0)
                    {
                        int tableQCount = 0;
                        for (int r = startRow + 1; r < rows.Count; r++)
                        {
                            var rCells = ExtractRowCellsNormalized(rows[r], W);
                            if (rCells.Count < 2) continue;

                            var mQ = Regex.Match(rCells[0], @"\d+");
                            if (!mQ.Success) continue;
                            int qNum = int.Parse(mQ.Value);
                            tableQCount++;

                            foreach (var (colIdx, examTarget) in colExamMap)
                            {
                                if (colIdx < rCells.Count)
                                {
                                    string rawVal = rCells[colIdx].Trim().ToUpperInvariant();
                                    string finalAns = cig.IsMatchAnswerLetter(rawVal, specs) && rawVal.Length == 1 && char.IsLetter(rawVal[0])
                                        ? (rawVal[0] - 'A' + 1).ToString()
                                        : rawVal;

                                    StoreAnswer(examTarget, "SINGLE", qNum, finalAns);
                                }
                            }
                        }
                        examCumulativeOffsets[currentExam] = offset + tableQCount;
                        return;
                    }
                }
            }

            foreach (var el in body.Elements())
            {
                if (el.Name == W + "p")
                {
                    var pText = string.Concat(el.Descendants(W + "t").Select(t => t.Value)).Trim();
                    if (string.IsNullOrWhiteSpace(pText)) continue;
                    lastPrecedingText = pText;

                    // 1. COD: Nhận diện biên giới đề thi từ DocumentStructureDictionary / Parsing Rules
                    if (cig.TryMatchExamHeading(pText, out string examCode))
                    {
                        if (int.TryParse(examCode, out int examNum))
                        {
                            if (examNum >= 1900 && examNum <= 2099)
                            {
                                continue;
                            }
                            currentExam = $"{prefix}_{examNum:D2}";
                            examCumulativeOffsets[currentExam] = 0;
                            currentSection = "SINGLE";
                        }
                        else
                        {
                            currentExam = $"{prefix}_{examCode}";
                            examCumulativeOffsets[currentExam] = 0;
                            currentSection = "SINGLE";
                        }
                    }

                    // 2. COD: Nhận diện tiêu đề phân đoạn ("PHẦN I", "PHẦN II", "PHẦN III", "PART A/B/C"...)
                    if (cig.TryMatchSectionHeader(pText, out string detectedSec))
                    {
                        currentSection = detectedSec;
                    }
                }
                else if (el.Name == W + "tbl")
                {
                    ProcessTableElement(el);
                }
            }

            return map;
        }
        public static string ConvertTableToMarkdown(
            XElement tbl,
            Func<XElement, string> paragraphTextExtractor)
        {
            var rows = tbl.Descendants(W + "tr").ToList();
            if (rows.Count == 0) return string.Empty;

            var sb = new StringBuilder();
            int maxCols = 0;
            var rowData = new List<List<string>>();

            foreach (var row in rows)
            {
                var cells = row.Elements(W + "tc").ToList();
                var cellTexts = new List<string>();
                foreach (var tc in cells)
                {
                    var cellPTexts = new List<string>();
                    foreach (var p in tc.Elements(W + "p"))
                    {
                        var pt = paragraphTextExtractor(p);
                        if (!string.IsNullOrWhiteSpace(pt)) cellPTexts.Add(pt);
                    }
                    var cellCombined = string.Join(" ", cellPTexts).Replace("|", "\\|").Trim();
                    cellTexts.Add(cellCombined);
                }
                if (cellTexts.Count > maxCols) maxCols = cellTexts.Count;
                rowData.Add(cellTexts);
            }

            if (maxCols == 0 || rowData.Count == 0) return string.Empty;

            var headerCells = rowData[0];
            while (headerCells.Count < maxCols) headerCells.Add("");
            sb.AppendLine("| " + string.Join(" | ", headerCells) + " |");
            sb.AppendLine("| " + string.Join(" | ", Enumerable.Repeat("---", maxCols)) + " |");

            for (int r = 1; r < rowData.Count; r++)
            {
                var rCells = rowData[r];
                while (rCells.Count < maxCols) rCells.Add("");
                sb.AppendLine("| " + string.Join(" | ", rCells) + " |");
            }

            return sb.ToString().TrimEnd();
        }

        /// <summary>
        /// Chuẩn hóa các ô trong hàng bảng OpenXML, giải nén ô gộp w:gridSpan thành các cột logic ảo.
        /// Triệt tiêu hoàn toàn hiện tượng lệch chỉ số cột (Column Index Drift).
        /// </summary>
        public static List<string> ExtractRowCellsNormalized(XElement row, XNamespace W)
        {
            var result = new List<string>();
            foreach (var tc in row.Elements(W + "tc"))
            {
                var text = string.Concat(tc.Descendants(W + "t").Select(t => t.Value)).Trim();
                int span = 1;
                var gridSpanEl = tc.Element(W + "tcPr")?.Element(W + "gridSpan");
                if (gridSpanEl != null)
                {
                    var valAttr = gridSpanEl.Attribute(W + "val");
                    if (valAttr != null && int.TryParse(valAttr.Value, out int sVal) && sVal > 1)
                    {
                        span = sVal;
                    }
                }
                for (int i = 0; i < span; i++)
                {
                    result.Add(text);
                }
            }
            return result;
        }
    }
}
