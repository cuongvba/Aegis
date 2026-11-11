using System.Collections.Generic;
using Aegis.Application.Interfaces;
using Aegis.Application.Services.Taxonomy;
using Aegis.Infrastructure.Data;
using Aegis.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Aegis.UnitTests
{
    public class CreatorZenStudioAndTaxonomyTests
    {
        private readonly ITaxonomySnifferDispatcher _dispatcher;
        private readonly ExamDeduplicationEngine _dedupEngine;

        public CreatorZenStudioAndTaxonomyTests()
        {
            var strategies = new List<ITaxonomySnifferStrategy>
            {
                new K12MathTaxonomySnifferStrategy(),
                new DrivingLicenseTaxonomySnifferStrategy(),
                new BankingComplianceTaxonomySnifferStrategy(),
                new GeneralFallbackTaxonomySnifferStrategy()
            };
            _dispatcher = new TaxonomySnifferDispatcher(strategies);

            var options = new DbContextOptionsBuilder<AegisDbContext>()
                .UseInMemoryDatabase(databaseName: "ZenStudioTestDb")
                .Options;
            var db = new AegisDbContext(options);
            _dedupEngine = new ExamDeduplicationEngine(db, NullLogger<ExamDeduplicationEngine>.Instance);
        }

        [Fact]
        public void MathStrategy_ShouldAccuratelyDetect_K12MathDocx()
        {
            var sampleMath = "Câu 1. Cho hàm số y = f(x) liên tục trên R và có đạo hàm f'(x) = x^2 - 4. Tìm điểm cực trị và tích phân từ 0 đến 1.";
            var result = _dispatcher.SniffTaxonomy(sampleMath);

            Assert.Equal("EDUCATION", result.DomainCode);
            Assert.Equal("MOET_GDPT_2025", result.BenchmarkStandard);
            Assert.True(result.ConfidenceScore >= 0.85);
        }

        [Fact]
        public void DrivingStrategy_ShouldDetect_GplxQuestions()
        {
            var sampleDriving = "Câu 5. Người lái xe không được lùi xe ở những khu vực nào dưới đây? Đây là câu sa hình biển báo bắt buộc.";
            var result = _dispatcher.SniffTaxonomy(sampleDriving);

            Assert.Equal("GOV_DRIVING", result.DomainCode);
            Assert.Equal("QCVN_41_2019", result.BenchmarkStandard);
            Assert.True(result.ConfidenceScore >= 0.90);
        }

        [Fact]
        public void BankingStrategy_ShouldDetect_BankingCompliance()
        {
            var sampleBanking = "Câu 10. Hạn mức cấp tín dụng đối với một khách hàng không được vượt quá tỷ lệ nào theo quy định của Ngân hàng Nhà nước?";
            var result = _dispatcher.SniffTaxonomy(sampleBanking);

            Assert.Equal("BANKING", result.DomainCode);
            Assert.Equal("CIRCULAR_02_NHNN", result.BenchmarkStandard);
        }

        [Fact]
        public void DeduplicationEngine_ShouldGenerate_IdenticalFingerprints_RegardlessOfWhitespace()
        {
            var content1 = "Câu 1.   Cho tam giác   ABC vuông tại A có AB = 3, AC = 4.";
            var content2 = "Bài 1: Cho tam giác ABC vuông tại A có AB = 3, AC = 4.";
            var opts1 = new List<string> { "BC = 5", "BC = 6", "BC = 7", "BC = 8" };
            var opts2 = new List<string> { "BC = 5  ", "  BC = 6", "BC = 7", "BC = 8" };

            var hash1 = _dedupEngine.ComputeCanonicalContentHash(content1, opts1);
            var hash2 = _dedupEngine.ComputeCanonicalContentHash(content2, opts2);

            Assert.Equal(hash1, hash2);
            Assert.False(string.IsNullOrEmpty(hash1));
        }

        [Fact]
        public async System.Threading.Tasks.Task SaveToBank_ShouldSavePolymorphicQuestionsAndContext_Accurately()
        {
            var options = new DbContextOptionsBuilder<AegisDbContext>()
                .UseInMemoryDatabase(databaseName: "ZenStudioPolymorphicTestDb_" + System.Guid.NewGuid())
                .Options;
            using var db = new AegisDbContext(options);

            var controller = new Aegis.API.Controllers.CreatorStudioController(
                _dispatcher,
                null!,
                null!,
                null!,
                _dedupEngine,
                null!,
                db,
                null!,
                new TestTenantContext(),
                NullLogger<Aegis.API.Controllers.CreatorStudioController>.Instance);

            // Mock claims principal
            var user = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(new[]
            {
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, System.Guid.NewGuid().ToString()),
                new System.Security.Claims.Claim("name", "Test Creator")
            }, "TestAuth"));
            controller.ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext
            {
                HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext { User = user }
            };

            var request = new Aegis.Application.DTOs.SaveZenToBankRequest
            {
                Title = "Đề thi Đa hình Excel Kế thừa",
                DomainCode = "EDUCATION",
                Questions = new List<Aegis.Application.DTOs.ZenQuestionPreviewDto>
                {
                    new()
                    {
                        Order = 1,
                        Content = "Tính giới hạn của hàm số khi x -> 0",
                        QuestionType = "SHORT_ANSWER",
                        CorrectAnswer = "12.5",
                        ContextTitle = "Bài toán Giải tích 12",
                        ContextContent = "Cho hàm số f(x) xác định trên khoảng (0, 1)..."
                    },
                    new()
                    {
                        Order = 2,
                        Content = "Chọn các số nguyên tố nhỏ hơn 10",
                        QuestionType = "MULTI",
                        Options = new List<string> { "2", "3", "4", "5" },
                        CorrectAnswer = "1, 2, 4"
                    },
                    new()
                    {
                        Order = 3,
                        Content = "Hà Nội là thủ đô của Việt Nam",
                        QuestionType = "TRUE_FALSE",
                        Options = new List<string> { "Đúng", "Sai" },
                        CorrectAnswer = "Đúng"
                    },
                    new()
                    {
                        Order = 4,
                        Content = "Thủ đô của Pháp là gì?",
                        QuestionType = "SINGLE",
                        Options = new List<string> { "Paris", "London", "Berlin", "Rome" },
                        CorrectAnswer = "1"
                    }
                }
            };

            var result = await controller.SaveToBank(request);
            var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            // Kiểm tra các câu hỏi đã được lưu đa hình chuẩn mực
            var questions = await db.Questions.ToListAsync();
            Assert.Equal(4, questions.Count);

            var q1 = Assert.IsType<Aegis.Domain.Entities.ShortAnswerQuestion>(questions.First(q => q.Content.Contains("giới hạn")));
            Assert.Equal("12.5", q1.CorrectOption);
            Assert.NotNull(q1.ContextId);

            var q2 = Assert.IsType<Aegis.Domain.Entities.MultiChoiceQuestion>(questions.First(q => q.Content.Contains("nguyên tố")));
            Assert.Equal(4, q2.Options.Count);
            Assert.Equal("1, 2, 4", q2.CorrectOption);

            var q3 = Assert.IsType<Aegis.Domain.Entities.TrueFalseQuestion>(questions.First(q => q.Content.Contains("Hà Nội")));
            Assert.Equal("Đúng", q3.CorrectOption);

            var q4 = Assert.IsType<Aegis.Domain.Entities.SingleChoiceQuestion>(questions.First(q => q.Content.Contains("Pháp")));
            Assert.Equal("1", q4.CorrectOption);

            // Kiểm tra shared context
            var context = await db.QuestionContexts.FirstOrDefaultAsync();
            Assert.NotNull(context);
            Assert.Equal("Bài toán Giải tích 12", context.Title);
            Assert.Equal(q1.ContextId, context.Id);
        }


        [Fact]
        public void CreatorMarketingPolicy_CentralizedGovernance_DynamicCoffeeProDays()
        {
            var policy = new Aegis.Domain.Entities.CreatorMarketingPolicy
            {
                CampaignCode = "SUMMER_PROMO_2026",
                CampaignName = "Chương Trình Đột Phá Hè 2026",
                TrialDays = 60,
                RevenueShareRate = 0.85m,
                KarmaBonusPoints = 150,
                CoffeeProDays = 14, // Biến động linh hoạt theo cấu hình Admin Marketing (ví dụ 14 ngày)
                CoffeePriceVnd = 30000m,
                IsActive = true
            };

            Assert.Equal("SUMMER_PROMO_2026", policy.CampaignCode);
            Assert.Equal(60, policy.TrialDays);
            Assert.Equal(0.85m, policy.RevenueShareRate);
            Assert.Equal(14, policy.CoffeeProDays); // Biến động linh hoạt theo chiến dịch tiếp thị
            Assert.Equal(30000m, policy.CoffeePriceVnd);
            Assert.True(policy.IsActive);
        }

        private class TestTenantContext : ITenantContext
        {
            public System.Guid CurrentTenantId => System.Guid.Empty;
            public string TenantCode => "DEFAULT";
            public bool IsSystemAdmin => true;
            public string CurrentRole => "SUPER_ADMIN";
            public void SetTenant(System.Guid tenantId, string code, bool isSystemAdmin = false) { }
            public void SetRole(string role) { }
        }
    }
}
