using System.Collections.Generic;
using AegisQuiz.Application.DTOs;
using AegisQuiz.Application.Interfaces;
using AegisQuiz.Infrastructure.Services;
using Xunit;

namespace AegisQuiz.UnitTests
{
    public class GlobalTaxonomyAndCrosswalkTests
    {
        [Fact]
        public void CognitiveCrosswalk_ShouldMapDifficulty_ToBloomAndWebbDOK()
        {
            var l1 = CognitiveCrosswalkEngine.MapFromDifficulty(1);
            Assert.Equal(1, l1.BloomLevel);
            Assert.Equal("REMEMBER", l1.BloomCode);
            Assert.Equal(1, l1.WebbDOKLevel);
            Assert.Equal("Recall", l1.QtiCategory);

            var l2 = CognitiveCrosswalkEngine.MapFromDifficulty(2);
            Assert.Equal(2, l2.BloomLevel);
            Assert.Equal("UNDERSTAND", l2.BloomCode);
            Assert.Equal(2, l2.WebbDOKLevel);

            var l3 = CognitiveCrosswalkEngine.MapFromDifficulty(3);
            Assert.Equal(3, l3.BloomLevel);
            Assert.Equal("APPLY", l3.BloomCode);
            Assert.Equal(3, l3.WebbDOKLevel);
            Assert.Equal("Application", l3.QtiCategory);

            var l4 = CognitiveCrosswalkEngine.MapFromDifficulty(4);
            Assert.True(l4.BloomLevel >= 5);
            Assert.Equal(4, l4.WebbDOKLevel);
            Assert.Equal("ExtendedReasoning", l4.QtiCategory);
        }

        [Fact]
        public void CognitiveCrosswalk_ShouldInferFromQuestionContent()
        {
            var recall = CognitiveCrosswalkEngine.InferFromQuestionContent("Câu 1. Nêu và phát biểu định luật II Newton.");
            Assert.Equal(1, recall.BloomLevel);
            Assert.Equal(1, recall.WebbDOKLevel);

            var apply = CognitiveCrosswalkEngine.InferFromQuestionContent("Câu 2. Tính tích phân I = \\int_{0}^{1} x e^x dx.");
            Assert.Equal(3, apply.BloomLevel);
            Assert.Equal(3, apply.WebbDOKLevel);

            var evaluate = CognitiveCrosswalkEngine.InferFromQuestionContent("Câu 3. Thiết kế giải pháp kỹ thuật và tối ưu hiệu suất cơ sở dữ liệu.");
            Assert.True(evaluate.BloomLevel >= 4);
            Assert.True(evaluate.WebbDOKLevel >= 3);
        }

        [Fact]
        public void TaxonomyEngine_ShouldBeZeroHardCode_WithDynamicReconPatterns()
        {
            var ctx = DynamicDomainContext.CreateDefault();
            ctx.StructureDictionary.TaxonomyReconPatterns.YearLabeledPatterns = new List<string>
            {
                @"(?i)(?:Academic\s*Year|Session)\s*[:\-–—]?\s*(20\d{2})"
            };
            ctx.StructureDictionary.TaxonomyReconPatterns.DomainTagRules = new List<DomainTagRuleDto>
            {
                new() { Pattern = @"(?i)\b(?:International\s*School)\b", Tag = "cambridge-intl" }
            };

            var sniffed = UniversalCoordinateTaxonomyEngine.SniffCoordinates(
                fileName: "SAT_Exam_2028.docx",
                sheetName: "Math",
                headerBannerLines: new List<string> { "Cambridge International School - Academic Year: 2028" },
                dynamicContext: ctx);

            Assert.Equal(2028, sniffed.BenchmarkYear);
            Assert.Contains("cambridge-intl", sniffed.Tags);
            Assert.NotNull(sniffed.CognitiveCrosswalk);
        }

        [Fact]
        public void AutoEnrichTaxonomyAndTags_ShouldEnrichItemWithCrosswalk()
        {
            var ctx = DynamicDomainContext.CreateDefault();
            var q = new DocxImportPreviewDto
            {
                Content = "Câu 1. Nêu công thức tính động năng của vật khối lượng m vận tốc v.",
                Difficulty = 1,
                TopicCode = "VAT_LY"
            };

            UniversalCoordinateTaxonomyEngine.AutoEnrichTaxonomyAndTags(q, ctx);

            Assert.NotNull(q.CognitiveCrosswalk);
            Assert.Equal(1, q.CognitiveCrosswalk.BloomLevel);
            Assert.Equal("REMEMBER", q.CognitiveCrosswalk.BloomCode);
            Assert.Equal("Recall", q.CognitiveCrosswalk.QtiCategory);
        }

        [Fact]
        public void HierarchicalTaxonomy_ShouldSpecializeEducation_ToGradeLeafNodes()
        {
            var ctx = DynamicDomainContext.CreateDefault();

            // 1. Đề thi Toán THPT Lớp 12
            var sniffedK12 = UniversalCoordinateTaxonomyEngine.SniffCoordinates(
                fileName: "De_Thi_Tot_Nghiep_THPT_2026_Mon_Toan_12.docx",
                sheetName: "MATH",
                headerBannerLines: new List<string> { "BỘ GIÁO DỤC VÀ ĐÀO TẠO", "KỲ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG NĂM 2026", "Môn thi: TOÁN - Lớp 12" },
                dynamicContext: ctx);

            Assert.Equal("MATH_K12", sniffedK12.TopicCode);
            Assert.Equal("MATH_UPPER_SEC", sniffedK12.ParentTopicCode);
            Assert.Contains("/EDU/MATH/MATH_UPPER_SEC/MATH_K12/", sniffedK12.TreePath);

            // 2. Đề thi Toán Tiểu học Lớp 5
            var sniffedK05 = UniversalCoordinateTaxonomyEngine.SniffCoordinates(
                fileName: "De_Kiem_Tra_Toan_Lop_5_Cuoi_Ky.docx",
                sheetName: "MATH",
                headerBannerLines: new List<string> { "TRƯỜNG TIỂU HỌC NGUYỄN DU", "ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN LỚP 5" },
                dynamicContext: ctx);

            Assert.Equal("MATH_K05", sniffedK05.TopicCode);
            Assert.Equal("MATH_PRIMARY", sniffedK05.ParentTopicCode);
            Assert.Contains("/EDU/MATH/MATH_PRIMARY/MATH_K05/", sniffedK05.TreePath);

            // 3. Đề thi Toán Đại học - Giải tích
            var sniffedHigherEd = UniversalCoordinateTaxonomyEngine.SniffCoordinates(
                fileName: "Giai_Tich_1_Dai_Hoc_Bach_Khoa.docx",
                sheetName: "MATH",
                headerBannerLines: new List<string> { "TRƯỜNG ĐẠI HỌC BÁCH KHOA", "KHOA TOÁN - TIN", "HỌC PHẦN: GIẢI TÍCH 1 (CALCULUS)" },
                dynamicContext: ctx);

            Assert.Equal("MATH_CALCULUS", sniffedHigherEd.TopicCode);
            Assert.Equal("MATH_HIGHER_ED", sniffedHigherEd.ParentTopicCode);
            Assert.Contains("/EDU/MATH/MATH_HIGHER_ED/MATH_CALCULUS/", sniffedHigherEd.TreePath);
        }

        [Fact]
        public void HierarchicalTaxonomy_ShouldSpecializeOtherDomains_ToSpecialtyLeafNodes()
        {
            var ctx = DynamicDomainContext.CreateDefault();

            // 1. Banking - Tín dụng Khách hàng Doanh nghiệp
            var sniffedBanking = UniversalCoordinateTaxonomyEngine.SniffCoordinates(
                fileName: "Agribank_De_Thi_Tin_Dung_KHDN_2026.docx",
                sheetName: null,
                headerBannerLines: new List<string> { "NGÂN HÀNG NÔNG NGHIỆP VÀ PHÁT TRIỂN NÔNG THÔN", "KỲ THI SÁT HẠCH NGHIỆP VỤ", "Vị trí: Tín dụng Khách hàng Doanh nghiệp (KHDN)" },
                dynamicContext: ctx);

            Assert.Equal("CREDIT_SME", sniffedBanking.TopicCode);
            Assert.Equal("BANKING_CREDIT", sniffedBanking.ParentTopicCode);
            Assert.Equal("BANKING", sniffedBanking.DomainCode);

            // 2. Driving - Câu hỏi Điểm liệt
            var sniffedDriving = UniversalCoordinateTaxonomyEngine.SniffCoordinates(
                fileName: "Bo_60_Cau_Hoi_Diem_Liet_GPLX.docx",
                sheetName: null,
                headerBannerLines: new List<string> { "TỔNG CỤC ĐƯỜNG BỘ VIỆT NAM", "TÀI LIỆU ÔN TẬP SÁT HẠCH LÁI XE", "Bộ 60 câu hỏi điểm liệt giao thông" },
                dynamicContext: ctx);

            Assert.Equal("DRIVING_CRITICAL", sniffedDriving.TopicCode);
            Assert.Equal("GOV_DRIVING", sniffedDriving.DomainCode);

            // 3. Healthcare - Dược lâm sàng
            var sniffedHealth = UniversalCoordinateTaxonomyEngine.SniffCoordinates(
                fileName: "Bo_Y_Te_Kiem_Tra_Duoc_Lam_Sang.docx",
                sheetName: null,
                headerBannerLines: new List<string> { "BỘ Y TẾ", "KỲ THI SÁT HẠCH BÁC SĨ & DƯỢC SĨ", "Chuyên môn: Dược lý và Dược lâm sàng" },
                dynamicContext: ctx);

            Assert.Equal("HEALTHCARE_PHARMACY", sniffedHealth.TopicCode);
            Assert.Equal("HEALTHCARE", sniffedHealth.DomainCode);
        }

        [Fact]
        public void RealDocx_Tnpt_Sinh_And_Hoa_Diagnosis()
        {
            var ctx = DynamicDomainContext.CreateDefault();
            var sinhPath = @"D:\Cuong\DuAn\DETHI\TNPT\thuvienhoclieu.com-De-thi-TN-THPT-2026-mon-Sinh-Bo-GD-ma-de-0430.docx";
            var hoaPath = @"D:\Cuong\DuAn\DETHI\TNPT\thuvienhoclieu.com-De-thi-TN-THPT-2026-mon-Hoa-Bo-GD-ma-de-0323.docx";

            if (System.IO.File.Exists(sinhPath))
            {
                var parser = new DocxParserService();
                using var fs = System.IO.File.OpenRead(sinhPath);

                fs.Position = 0;
                var qs = parser.ParseDocxFile(fs, ctx);
                var first = qs[0];
                System.Console.WriteLine($"[DEBUG FIRST Q CONTENT] Content='{first.Content}'");
                System.Console.WriteLine($"[DEBUG REAL SINH] TopicCode='{first.TopicCode}', TargetLevel='{first.TargetLevel}', Canonical='{first.CanonicalTopicCode}', TreePath='{first.TreePath}'");
                
                using var archive = new System.IO.Compression.ZipArchive(fs, System.IO.Compression.ZipArchiveMode.Read, leaveOpen: true);
                var entry = archive.GetEntry("word/document.xml");
                var doc = System.Xml.Linq.XDocument.Load(entry.Open());
                var headerTexts = DocxParserService.FastScanDocumentHeader(doc, 35);
                fs.Position = 0;
                var rawParas = DocxParserService.ExtractRawParagraphsFromDocx(fs);
                var cig = AegisQuiz.Infrastructure.Services.DynamicQuestionIngestionEngine.Instance;
                var parasProfile = cig.ProfileHeader(rawParas.Take(35), rawParas.Skip(35).Take(15), ctx);
                System.Console.WriteLine($"[PARAS PROFILE] Canonical='{parasProfile.TaxonomyCoordinates.CanonicalTopicCode}', TopicCode='{parasProfile.TaxonomyCoordinates.TopicCode}'");
                
                var reconPatterns = ctx.StructureDictionary.TaxonomyReconPatterns;
                for (int i = 0; i < Math.Min(35, rawParas.Count); i++)
                {
                    var pText = rawParas[i];
                    foreach (var gp in reconPatterns.GradeDetectionPatterns)
                    {
                        var m = System.Text.RegularExpressions.Regex.Match(pText, gp, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                        if (m.Success)
                        {
                            System.Console.WriteLine($"[FOUND MATCH IN PARA #{i}] Pattern='{gp}', Val='{m.Groups[1].Value}', Full='{m.Value}', Text='{pText}'");
                        }
                    }
                    foreach (var t in ctx.Topics)
                    {
                        var m1 = System.Text.RegularExpressions.Regex.Match(pText, $@"(?i)\b{System.Text.RegularExpressions.Regex.Escape(t.Code)}[\s\-_]*(\d{{1,2}})\b");
                        if (m1.Success)
                        {
                            System.Console.WriteLine($"[FOUND TOPIC CODE IN PARA #{i}] Topic={t.Code}, Val='{m1.Groups[1].Value}', Text='{pText}'");
                        }
                        if (!string.IsNullOrWhiteSpace(t.Name))
                        {
                            var m2 = System.Text.RegularExpressions.Regex.Match(pText, $@"(?i)\b{System.Text.RegularExpressions.Regex.Escape(t.Name)}[\s\-_]*(\d{{1,2}})\b");
                            if (m2.Success)
                            {
                                System.Console.WriteLine($"[FOUND TOPIC NAME IN PARA #{i}] Topic={t.Name}, Val='{m2.Groups[1].Value}', Text='{pText}'");
                            }
                        }
                    }
                }
            }

            if (System.IO.File.Exists(hoaPath))
            {
                var parser = new DocxParserService();
                using var fs = System.IO.File.OpenRead(hoaPath);
                var qs = parser.ParseDocxFile(fs, ctx);
                var first = qs[0];
                System.Console.WriteLine($"[REAL HOA DOCX] TopicCode={first.TopicCode}, Canonical={first.CanonicalTopicCode}, TreePath={first.TreePath}");
                Assert.Equal("HOA_HOC_K12", first.TopicCode);
            }
        }
    }
}

