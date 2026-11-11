using System;
using System.IO;
using System.Linq;
using Aegis.Infrastructure.Services;
using Xunit;
using Xunit.Abstractions;

namespace Aegis.UnitTests
{
    public class ThcsExamIngestionTests
    {
        private readonly ITestOutputHelper _output;
        private const string ThcsDir = @"D:\Cuong\DuAn\mybank\2026-TNPT\THCS";

        public ThcsExamIngestionTests(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void ParseEnglish7_GlobalSuccess_ShouldExtractQuestions()
        {
            var filePath = Path.Combine(ThcsDir, "thuvienhoclieu.com-De-on-tap-giua-HK2-Tieng-Anh-7-global-25-26-De-1.docx");
            if (!File.Exists(filePath))
            {
                _output.WriteLine("File not found, skipping.");
                return;
            }

            using var fs = File.OpenRead(filePath);
            var results = DocxParserService.ParseRichDocxStream(fs);

            _output.WriteLine($"[English 7] Bóc tách thành công: {results.Count} câu hỏi.");
            foreach (var q in results.Take(5))
            {
                _output.WriteLine($"  - [{q.TopicCode}] {q.Content.Substring(0, Math.Min(50, q.Content.Length))}... (Opts: {q.Options.Count}, Ans: {q.SuggestedAnswer})");
            }

            Assert.NotEmpty(results);
        }

        [Fact]
        public void ParseBo10DeTiengAnh7_ExamineDirectives()
        {
            var filePath = @"D:\Cuong\DuAn\DETHI\THCS\LOP7\Bo-10-de-on-tap-giua-ky-1-Tieng-Anh-7-nam-25-26-co-dap-an.docx";
            if (!File.Exists(filePath))
            {
                _output.WriteLine("File not found, skipping.");
                return;
            }

            using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            var results = DocxParserService.ParseRichDocxStream(fs);

            Assert.NotEmpty(results);
            Assert.True(results.Count >= 250, $"Expected >= 250 questions, got {results.Count}");

            var q1 = results.FirstOrDefault(q => q.SourceExamName == "DE_01" && q.SourceQuestionNo == "1");
            Assert.NotNull(q1);
            Assert.True(q1.SourceSectionName.Contains("pronounced differently", StringComparison.OrdinalIgnoreCase) || (q1.ContextContent != null && (q1.ContextContent.Contains("different sound", StringComparison.OrdinalIgnoreCase) || q1.ContextContent.Contains("underlined", StringComparison.OrdinalIgnoreCase))));
            Assert.False(string.IsNullOrWhiteSpace(q1.ContextContent));
            Assert.False(string.IsNullOrWhiteSpace(q1.ContextTitle));

            var q13 = results.FirstOrDefault(q => q.SourceExamName == "DE_01" && q.SourceQuestionNo == "13");
            Assert.NotNull(q13);
            Assert.True(q13.SourceSectionName.Contains("Odd one out", StringComparison.OrdinalIgnoreCase) || (q13.ContextContent != null && q13.ContextContent.Contains("Odd one out", StringComparison.OrdinalIgnoreCase)));
            Assert.False(string.IsNullOrWhiteSpace(q13.ContextContent));

            int withContext = results.Count(q => !string.IsNullOrWhiteSpace(q.ContextContent));
            Assert.True(withContext >= 200, $"Expected >= 200 questions with context, got {withContext}");

            _output.WriteLine($"[Bo 10 De Tieng Anh 7] Total questions: {results.Count}");
            var de1Questions = results.Where(q => q.SourceExamName == "DE_01").ToList();
            var lines = de1Questions.Select(q => $"Q{q.SourceQuestionNo}: Ans='{q.SuggestedAnswer}', Opts={q.Options.Count}, Expl={(!string.IsNullOrWhiteSpace(q.AiExplanation))}, Text='{q.Content.Substring(0, Math.Min(40, q.Content.Length))}'").ToList();
            File.WriteAllLines(@"C:\Users\cuongnguyenviet8.CORP\.gemini\antigravity-ide\brain\f910971c-edd8-4eab-9578-f5867a8a4584\de1_diag.txt", lines);
        }

        [Fact]
        public void ParseMath10_Probability_ShouldExtractQuestionsAndFormulas()
        {
            var filePath = Path.Combine(ThcsDir, "thuvienhoclieu.com-50-cau-trac-nghiem-bai-27-Thuc-hanh-tinh-xac-suat-theo-dinh-nghia-co-dien-Lop-10.docx");
            if (!File.Exists(filePath))
            {
                _output.WriteLine("File not found, skipping.");
                return;
            }

            using var fs = File.OpenRead(filePath);
            var results = DocxParserService.ParseRichDocxStream(fs);

            _output.WriteLine($"[Probability 10] Bóc tách thành công: {results.Count} câu hỏi.");
            foreach (var q in results.Take(5))
            {
                _output.WriteLine($"  - [{q.QuestionType}] {q.Content.Substring(0, Math.Min(60, q.Content.Length))}... Ans: {q.SuggestedAnswer}");
            }

            Assert.NotEmpty(results);
        }

        [Fact]
        public void ParseMath7_ReviewOutline_ShouldExtractQuestions()
        {
            var filePath = Path.Combine(ThcsDir, "thuvienhoclieu.com-De-cuong-on-tap-cuoi-HK1-Toan-7-nam-25-26.docx");
            if (!File.Exists(filePath))
            {
                _output.WriteLine("File not found, skipping.");
                return;
            }

            using var fs = File.OpenRead(filePath);
            var results = DocxParserService.ParseRichDocxStream(fs);

            _output.WriteLine($"[Math 7 Outline] Bóc tách thành công: {results.Count} câu hỏi.");
            foreach (var q in results.Take(5))
            {
                _output.WriteLine($"  - [{q.TopicCode}] {q.Content.Substring(0, Math.Min(60, q.Content.Length))}... Ans: {q.SuggestedAnswer}");
            }

            Assert.NotEmpty(results);
        }

        [Fact]
        public void ParseAll11ThcsFiles_ShouldReportComprehensiveExtraction()
        {
            if (!Directory.Exists(ThcsDir)) return;

            var files = Directory.GetFiles(ThcsDir, "*.docx");
            _output.WriteLine($"=================================================================");
            _output.WriteLine($"🚀 BẮT ĐẦU KIỂM THỬ BÓC TÁCH TOÀN BỘ {files.Length} TỆP ĐỀ THI THCS THỰC TẾ");
            _output.WriteLine($"=================================================================");

            int totalQuestionsExtracted = 0;
            int totalFilesProcessed = 0;

            foreach (var file in files)
            {
                var fileName = Path.GetFileName(file);
                var sw = System.Diagnostics.Stopwatch.StartNew();

                try
                {
                    using var fs = File.OpenRead(file);
                    var questions = DocxParserService.ParseRichDocxStream(fs);
                    sw.Stop();

                    totalQuestionsExtracted += questions.Count;
                    totalFilesProcessed++;

                    int mcqCount = questions.Count(q => q.QuestionType == "SINGLE");
                    int tfCount = questions.Count(q => q.QuestionType == "TRUE_FALSE");
                    int saCount = questions.Count(q => q.QuestionType == "SHORT_ANSWER");
                    int withAnsCount = questions.Count(q => !string.IsNullOrWhiteSpace(q.SuggestedAnswer));

                    _output.WriteLine($"✅ [{fileName}] -> {questions.Count} câu hỏi ({sw.ElapsedMilliseconds} ms)");
                    _output.WriteLine($"     (MCQ: {mcqCount}, Đúng/Sai: {tfCount}, Điền khuyết: {saCount}, Có đáp án: {withAnsCount})");
                }
                catch (Exception ex)
                {
                    _output.WriteLine($"❌ [{fileName}] -> Lỗi: {ex.Message}");
                }
            }

            _output.WriteLine($"=================================================================");
            _output.WriteLine($"🎉 TỔNG KẾT: Đã bóc tách {totalQuestionsExtracted} câu hỏi từ {totalFilesProcessed} tệp đề thi THCS!");
            _output.WriteLine($"=================================================================");

            Assert.True(totalQuestionsExtracted > 100, "Phải bóc tách được ít nhất 100 câu hỏi từ kho đề THCS.");
        }

        [Fact]
        public void AnalyzeAllThcsFilesStructure_DetailedReport()
        {
            if (!Directory.Exists(ThcsDir)) return;

            var files = Directory.GetFiles(ThcsDir, "*.docx");
            var reportPath = @"C:\Users\cuongnguyenviet8.CORP\.gemini\antigravity-ide\brain\677ad04f-961a-48df-a9b4-186acbbbad8d\thcs_structural_analysis.md";
            using var writer = new StreamWriter(reportPath, false, System.Text.Encoding.UTF8);

            writer.WriteLine("# 📊 BÁO CÁO GIẢI PHẪU CẤU TRÚC ĐỀ THI, ĐÁP ÁN & HƯỚNG DẪN GIẢI 11 FILE THCS");
            writer.WriteLine();
            writer.WriteLine($"- Thời gian khảo sát: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
            writer.WriteLine($"- Tổng số tệp DOCX: {files.Length}");
            writer.WriteLine();

            foreach (var file in files)
            {
                var fileName = Path.GetFileName(file);
                writer.WriteLine($"## 📁 {fileName}");
                writer.WriteLine($"- Kích thước: {new FileInfo(file).Length / 1024 / 1024.0:F2} MB");

                using var fs = File.OpenRead(file);
                using var za = new System.IO.Compression.ZipArchive(fs, System.IO.Compression.ZipArchiveMode.Read);
                var docEntry = za.GetEntry("word/document.xml");
                if (docEntry == null)
                {
                    writer.WriteLine("- Không tìm thấy word/document.xml");
                    continue;
                }

                using var sr = new StreamReader(docEntry.Open());
                var xmlStr = sr.ReadToEnd();
                var xdoc = System.Xml.Linq.XDocument.Parse(xmlStr);
                System.Xml.Linq.XNamespace w = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

                var tables = xdoc.Descendants(w + "tbl").ToList();
                var paragraphs = xdoc.Descendants(w + "p").ToList();

                writer.WriteLine($"- Tổng số đoạn văn (paragraphs): {paragraphs.Count}");
                writer.WriteLine($"- Tổng số bảng (tables): {tables.Count}");

                // Khảo sát các tiêu đề đề thi (ĐỀ SỐ...)
                var examTitles = paragraphs
                    .Select(p => string.Join("", p.Descendants(w + "t").Select(t => t.Value)).Trim())
                    .Where(t => System.Text.RegularExpressions.Regex.IsMatch(t, @"^(ĐỀ\s+(?:SỐ\s+)?(?:KIỂM\s+TRA\s+)?(?:ÔN\s+TẬP\s+)?\d+|ĐỀ\s+THI|ĐỀ\s+KIỂM\s+TRA|ĐỀ\s+[A-Z0-9]{3,})", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                    .Distinct()
                    .Take(10)
                    .ToList();
                writer.WriteLine($"- Các phân đoạn Đề thi phát hiện: {(examTitles.Any() ? string.Join(", ", examTitles) : "Đề đơn lẻ hoặc không có tiêu đề Đề số")}");

                // Khảo sát bảng đáp án & hướng dẫn giải
                int answerTableCount = 0;
                int matrixTableCount = 0;
                int solutionTableCount = 0;

                writer.WriteLine("### 📑 Khảo sát các bảng tiêu biểu trong tệp:");
                int tableIdx = 0;
                foreach (var tbl in tables)
                {
                    tableIdx++;
                    var rows = tbl.Elements(w + "tr").ToList();
                    if (!rows.Any()) continue;

                    var rowTexts = rows.Select(r =>
                        string.Join(" | ", r.Elements(w + "tc").Select(c =>
                            string.Join("", c.Descendants(w + "t").Select(t => t.Value)).Trim()
                        ))
                    ).ToList();

                    var allTblText = string.Join(" ", rowTexts);
                    bool isAnswerGrid = false;
                    bool isSolution = false;
                    bool isMatrix = false;

                    if (System.Text.RegularExpressions.Regex.IsMatch(allTblText, @"(?i)(ma\s+trận\s+đặc\s+tả|khung\s+ma\s+trận|mức\s+độ\s+đánh\s+giá)"))
                    {
                        isMatrix = true;
                        matrixTableCount++;
                    }
                    else if (System.Text.RegularExpressions.Regex.IsMatch(allTblText, @"(?i)(hướng\s+dẫn\s+chấm|biểu\s+điểm|thang\s+điểm|lời\s+giải)"))
                    {
                        isSolution = true;
                        solutionTableCount++;
                    }
                    else if (System.Text.RegularExpressions.Regex.IsMatch(allTblText, @"(?i)(bảng\s+đáp\s+án|đáp\s+án|câu\s*1|câu\s*2)") &&
                             System.Text.RegularExpressions.Regex.IsMatch(allTblText, @"\b[A-D]\b"))
                    {
                        isAnswerGrid = true;
                        answerTableCount++;
                    }

                    if ((isAnswerGrid || isSolution || isMatrix) && tableIdx <= 15)
                    {
                        var kind = isAnswerGrid ? "🎯 [BẢNG ĐÁP ÁN TRẮC NGHIỆM]" : (isSolution ? "📝 [HƯỚNG DẪN CHẤM / BIỂU ĐIỂM]" : "📐 [MA TRẬN ĐẶC TẢ]");
                        writer.WriteLine($"- **Bảng #{tableIdx}** ({rows.Count} dòng, {rows[0].Elements(w + "tc").Count()} cột) - {kind}:");
                        for (int i = 0; i < Math.Min(4, rowTexts.Count); i++)
                        {
                            var preview = rowTexts[i];
                            if (preview.Length > 150) preview = preview.Substring(0, 150) + "...";
                            writer.WriteLine($"  - Dòng {i + 1}: `{preview}`");
                        }
                    }
                }

                writer.WriteLine($"- Thống kê bảng: {answerTableCount} bảng đáp án trắc nghiệm, {solutionTableCount} bảng hướng dẫn chấm tự luận, {matrixTableCount} bảng ma trận.");

                // Thử bóc tách với DocxParserService hiện tại
                fs.Seek(0, SeekOrigin.Begin);
                var questions = DocxParserService.ParseRichDocxStream(fs);
                int hasAnswer = questions.Count(q => !string.IsNullOrWhiteSpace(q.SuggestedAnswer));
                int hasExplanation = questions.Count(q => !string.IsNullOrWhiteSpace(q.AiExplanation));
                writer.WriteLine($"- **Kết quả bóc tách hiện tại**:");
                writer.WriteLine($"  - Tổng câu hỏi: **{questions.Count}**");
                writer.WriteLine($"  - Có đáp án: **{hasAnswer}** ({(questions.Count > 0 ? hasAnswer * 100.0 / questions.Count : 0):F1}%)");
                writer.WriteLine($"  - Có hướng dẫn giải / biểu điểm: **{hasExplanation}** ({(questions.Count > 0 ? hasExplanation * 100.0 / questions.Count : 0):F1}%)");
                writer.WriteLine();
                writer.Flush();
            }

            writer.WriteLine("--- HẾT BÁO CÁO ---");
        }

        [Fact]
        public void DiagDocxSolutionAndHighlight()
        {
            var filePath = @"D:\Cuong\DuAn\DETHI\THCS\LOP7\Bo-10-de-on-tap-giua-ky-1-Tieng-Anh-7-nam-25-26-co-dap-an.docx";
            if (!File.Exists(filePath)) return;

            using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            using var archive = new System.IO.Compression.ZipArchive(fs, System.IO.Compression.ZipArchiveMode.Read);
            var entry = archive.GetEntry("word/document.xml");
            using var s = entry.Open();
            var doc = System.Xml.Linq.XDocument.Load(s);
            var w = System.Xml.Linq.XNamespace.Get("http://schemas.openxmlformats.org/wordprocessingml/2006/main");

            var allElements = doc.Descendants(w + "body").FirstOrDefault()?.Elements().ToList() ?? new List<System.Xml.Linq.XElement>();
            int solIdx = -1;
            for (int i = 0; i < allElements.Count; i++)
            {
                var txt = string.Concat(allElements[i].Descendants(w + "t").Select(t => t.Value)).Trim();
                if (txt.Contains("ĐÁP ÁN VÀ LỜI GIẢI") || txt.Contains("HƯỚNG DẪN GIẢI"))
                {
                    solIdx = i;
                    break;
                }
            }

            _output.WriteLine($"Solution section starts at index {solIdx}");
            var diagLines = new List<string>();
            for (int i = Math.Max(0, solIdx - 10); i < Math.Min(allElements.Count, solIdx + 80); i++)
            {
                var el = allElements[i];
                var txt = string.Concat(el.Descendants(w + "t").Select(t => t.Value)).Trim();
                var runInfos = new List<string>();
                foreach (var r in el.Descendants(w + "r"))
                {
                    var rPr = r.Element(w + "rPr");
                    var hl = rPr?.Element(w + "highlight")?.Attribute(w + "val")?.Value;
                    var shd = rPr?.Element(w + "shd")?.Attribute(w + "fill")?.Value;
                    var c = rPr?.Element(w + "color")?.Attribute(w + "val")?.Value;
                    var b = rPr?.Element(w + "b") != null;
                    var u = rPr?.Element(w + "u") != null;
                    var rt = string.Concat(r.Descendants(w + "t").Select(t => t.Value));
                    if (hl != null || shd != null || c != null || b || u)
                    {
                        runInfos.Add($"[{(hl != null ? "hl=" + hl + " " : "")}{(shd != null ? "shd=" + shd + " " : "")}{(c != null ? "c=" + c + " " : "")}{(b ? "B " : "")}{(u ? "U " : "")}: '{rt}']");
                    }
                }
                diagLines.Add($"[{i}] <{el.Name.LocalName}>: {txt}");
                if (runInfos.Count > 0)
                {
                    diagLines.Add("   Runs: " + string.Join(" ", runInfos));
                }
            }
            File.WriteAllLines(@"C:\Users\cuongnguyenviet8.CORP\.gemini\antigravity-ide\brain\4af51fd5-e7cb-45e1-9325-9da74a497581\sol_diag.txt", diagLines);

            fs.Seek(0, SeekOrigin.Begin);
            var results = DocxParserService.ParseRichDocxStream(fs);
            
            // Check all questions in results with No == "9"
            var all9s = results.Where(q => q.SourceQuestionNo == "9").Select(q => $"{q.SourceExamName}_Q{q.SourceQuestionNo}: Expl='{q.AiExplanation}', Content='{(q.Content.Length > 30 ? q.Content.Substring(0, 30) : q.Content)}'").ToList();
            var outDir = @"C:\Users\cuongnguyenviet8.CORP\.gemini\antigravity-ide\brain\4af51fd5-e7cb-45e1-9325-9da74a497581";
            if (Directory.Exists(outDir))
            {
                File.WriteAllLines(Path.Combine(outDir, "all9s_diag.txt"), all9s);
            }
        }

        [Fact]
        public void ParseKhtn7_Diagnostic()
        {
            var filePath = @"D:\Cuong\DuAn\DETHI\THCS\LOP7\thuvienhoclieu.com-Bo-20-de-on-tap-giua-HK1-KHTN-7-KNTT.docx";
            if (!File.Exists(filePath))
            {
                _output.WriteLine($"File not found: {filePath}");
                return;
            }

            var outDir = @"C:\Users\cuongnguyenviet8.CORP\.gemini\antigravity-ide\brain\4af51fd5-e7cb-45e1-9325-9da74a497581";
            using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            var results = DocxParserService.ParseRichDocxStream(fs);

            _output.WriteLine($"[KHTN 7] Tổng số câu hỏi bóc tách: {results.Count}");
            int totalWithAns = results.Count(q => !string.IsNullOrWhiteSpace(q.SuggestedAnswer));
            _output.WriteLine($"[KHTN 7] Tổng số câu có đáp án đúng (SuggestedAnswer): {totalWithAns} / {results.Count} ({(results.Count > 0 ? totalWithAns * 100.0 / results.Count : 0):F1}%)");

            var groupedByExam = results.GroupBy(q => q.SourceExamName).OrderBy(g => g.Key).ToList();
            var reportLines = new List<string>
            {
                $"=== BÁO CÁO BÓC TÁCH BỘ ĐỀ KHTN 7 (Tổng: {results.Count} câu, Có đáp án: {totalWithAns}) ===",
                $"Thời gian: {DateTime.Now:yyyy-MM-dd HH:mm:ss}"
            };

            foreach (var group in groupedByExam)
            {
                var examName = group.Key;
                var list = group.OrderBy(q => {
                    int.TryParse(q.SourceQuestionNo, out int n);
                    return n;
                }).ToList();

                int examWithAns = list.Count(q => !string.IsNullOrWhiteSpace(q.SuggestedAnswer));
                var summary = $"Đề [{examName}]: {list.Count} câu hỏi | Có đáp án: {examWithAns}/{list.Count} ({(list.Count > 0 ? examWithAns * 100.0 / list.Count : 0):F1}%)";
                _output.WriteLine(summary);
                reportLines.Add("");
                reportLines.Add(summary);

                foreach (var q in list)
                {
                    reportLines.Add($"  - Câu {q.SourceQuestionNo}: Đáp án=[{q.SuggestedAnswer}], Số lựa chọn=[{q.Options.Count}], Loại={q.QuestionType}, Nội dung={q.Content.Substring(0, Math.Min(40, q.Content.Length))}...");
                }
            }

            File.WriteAllLines(Path.Combine(outDir, "khtn7_parse_result.txt"), reportLines);

            Assert.NotEmpty(results);
            // Kỳ vọng tuyệt đại đa số các câu trắc nghiệm đều nhận diện được SuggestedAnswer từ Hướng dẫn chấm
            Assert.True(totalWithAns >= 250, $"Expected >= 250 questions with suggested answers, but got {totalWithAns}");
        }

        [Fact]
        public void CheckAnswerKeyMap_Diagnostic()
        {
            var filePath = @"D:\Cuong\DuAn\DETHI\THCS\LOP7\thuvienhoclieu.com-Bo-20-de-on-tap-giua-HK1-KHTN-7-KNTT.docx";
            using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            using var za = new System.IO.Compression.ZipArchive(fs);
            var entry = za.GetEntry("word/document.xml");
            using var s = entry.Open();
            var doc = System.Xml.Linq.XDocument.Load(s);
            var W = System.Xml.Linq.XNamespace.Get("http://schemas.openxmlformats.org/wordprocessingml/2006/main");

            var map = Aegis.Infrastructure.Services.Docx.DocxTableQuestionExtractor.ExtractAnswerTables(doc, out var elements);
            
            // 1. Kiểm tra Đề 1 (Ảnh 1): Q1-A, Q2-D, Q3-D, Q4-C, Q5-D...
            Assert.True(map.ContainsKey("DE_01"), "DE_01 must be extracted");
            _output.WriteLine("DE_01 sections: " + string.Join(", ", map["DE_01"].Keys));
            var de1Single = map["DE_01"]["SINGLE"];
            _output.WriteLine("=== DE_01 SINGLE ===");
            var de1List = de1Single.OrderBy(x => x.Key).Select(x => $"{x.Key}:{x.Value}");
            _output.WriteLine(string.Join(", ", de1List));

            Assert.Equal("1", de1Single[1]); // A
            Assert.Equal("4", de1Single[2]); // D
            Assert.Equal("4", de1Single[3]); // D
            Assert.Equal("3", de1Single[4]); // C
            Assert.Equal("4", de1Single[5]); // D
            Assert.Equal("2", de1Single[6]); // B
            Assert.Equal("2", de1Single[7]); // B
            Assert.Equal("2", de1Single[8]); // B
            Assert.Equal("2", de1Single[9]); // B
            Assert.Equal("3", de1Single[10]); // C
            Assert.Equal("1", de1Single[11]); // A
            Assert.Equal("1", de1Single[12]); // A
            Assert.Equal("4", de1Single[13]); // D
            Assert.Equal("4", de1Single[14]); // D
            Assert.Equal("3", de1Single[15]); // C
            Assert.Equal("1", de1Single[16]); // A

            // 2. Kiểm tra Đề 2 (Ảnh 2): B, D, B, C, C, B, C, D, D, D, C, B
            if (map.TryGetValue("DE_02", out var de2) && de2.TryGetValue("SINGLE", out var de2Single))
            {
                _output.WriteLine("=== DE_02 SINGLE ===");
                var de2List = de2Single.OrderBy(x => x.Key).Select(x => $"{x.Key}:{x.Value}");
                _output.WriteLine(string.Join(", ", de2List));
                Assert.Equal("2", de2Single[1]); // B
                Assert.Equal("4", de2Single[2]); // D
                Assert.Equal("2", de2Single[3]); // B
                Assert.Equal("3", de2Single[4]); // C
                Assert.Equal("3", de2Single[5]); // C
                Assert.Equal("2", de2Single[6]); // B
                Assert.Equal("3", de2Single[7]); // C
                Assert.Equal("4", de2Single[8]); // D
            }

            // 3. Kiểm tra Đề 4 (Ảnh 3): 1.C, 2.C, 3.C, 4.B, 5.A, 6.D, 7.A, 8.A, 9.B, 10.D...
            if (map.TryGetValue("DE_04", out var de4) && de4.TryGetValue("SINGLE", out var de4Single))
            {
                _output.WriteLine("=== DE_04 SINGLE ===");
                var de4List = de4Single.OrderBy(x => x.Key).Select(x => $"{x.Key}:{x.Value}");
                _output.WriteLine(string.Join(", ", de4List));
                Assert.Equal("3", de4Single[1]); // C
                Assert.Equal("3", de4Single[2]); // C
                Assert.Equal("3", de4Single[3]); // C
                Assert.Equal("2", de4Single[4]); // B
                Assert.Equal("1", de4Single[5]); // A
            }
        }
    }
}
