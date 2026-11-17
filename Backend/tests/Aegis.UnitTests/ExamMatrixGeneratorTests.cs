using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Aegis.Application.DTOs;
using Aegis.Domain.Entities;
using Aegis.Infrastructure.Data;
using Aegis.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Aegis.UnitTests
{
    public class ExamMatrixGeneratorTests
    {
        private static AegisDbContext CreateInMemoryDb(string dbName)
        {
            var options = new DbContextOptionsBuilder<AegisDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new AegisDbContext(options);
        }

        [Fact]
        public async Task GetTemplatesAsync_LoadsEmbeddedMoetAndCompanyTemplates()
        {
            await using var db = CreateInMemoryDb(nameof(GetTemplatesAsync_LoadsEmbeddedMoetAndCompanyTemplates));
            var service = new ExamMatrixGeneratorService(db, NullLogger<ExamMatrixGeneratorService>.Instance);

            var templates = await service.GetTemplatesAsync(Guid.NewGuid());

            Assert.Contains(templates, t => t.TemplateCode == "MOET_2025_TOAN" && t.Sections.Count == 3);
            Assert.Contains(templates, t => t.TemplateCode == "MOET_2025_KHTN_NAT");
            Assert.Contains(templates, t => t.TemplateCode == "MOET_2025_TIENG_ANH");
            Assert.Contains(templates, t => t.TemplateCode == "CORP_BANKING_CREDIT_60" && t.Category == "COMPANY_POLICY");
            Assert.Contains(templates, t => t.TemplateCode == "CORP_ITSEC_SOC_45");
            Assert.Contains(templates, t => t.TemplateCode == "CORP_HSE_SAFETY_30");
        }

        [Fact]
        public async Task GenerateFromRealBankAsync_Moet2025Toan_MatchesAllThreePartsAndZeroCrossSubjectLeakage()
        {
            await using var db = CreateInMemoryDb(nameof(GenerateFromRealBankAsync_Moet2025Toan_MatchesAllThreePartsAndZeroCrossSubjectLeakage));
            var tenantId = Guid.NewGuid();

            for (int i = 1; i <= 15; i++)
            {
                db.Questions.Add(new SingleChoiceQuestion
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    DomainCode = "EDUCATION",
                    CategoryCode = "TOAN",
                    Difficulty = (i % 5) + 1,
                    Content = $"Câu Toán TN #{i}",
                    Options = new List<string> { "A. 1", "B. 2", "C. 3", "D. 4" },
                    CorrectOption = "A"
                });
            }

            for (int i = 1; i <= 5; i++)
            {
                db.Questions.Add(new MultiTrueFalseQuestion
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    DomainCode = "EDUCATION",
                    CategoryCode = "TOAN",
                    Difficulty = 3,
                    Content = $"Câu Toán Đúng/Sai #{i}",
                    Options = new List<string> { "a) Mệnh đề 1", "b) Mệnh đề 2", "c) Mệnh đề 3", "d) Mệnh đề 4" },
                    CorrectOption = "T,F,T,F"
                });
            }

            for (int i = 1; i <= 8; i++)
            {
                db.Questions.Add(new ShortAnswerQuestion
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    DomainCode = "EDUCATION",
                    CategoryCode = "TOAN",
                    Difficulty = 4,
                    Content = $"Câu Toán Trả lời ngắn #{i}",
                    CorrectOption = "42"
                });
            }

            // Decoy cross-subject questions (must NEVER leak into TOAN exam)
            for (int i = 1; i <= 10; i++)
            {
                db.Questions.Add(new SingleChoiceQuestion
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    DomainCode = "EDUCATION",
                    CategoryCode = "VAT_LY",
                    Difficulty = 2,
                    Content = $"Câu Vật Lý decoy #{i}",
                    Options = new List<string> { "A. 1", "B. 2" },
                    CorrectOption = "A"
                });
            }

            await db.SaveChangesAsync();

            var service = new ExamMatrixGeneratorService(db, NullLogger<ExamMatrixGeneratorService>.Instance);
            var response = await service.GenerateFromRealBankAsync(tenantId, new GenerateMatrixExamRequestDto
            {
                TemplateCode = "MOET_2025_TOAN",
                DomainCode = "EDUCATION",
                TopicCode = "TOAN",
                DurationMinutes = 90
            });

            Assert.True(response.Success);
            Assert.Equal(22, response.TotalQuestions);
            Assert.Equal(0, response.MissingTotal);
            Assert.Null(response.WarningMessage);
            Assert.All(response.Questions, q => Assert.DoesNotContain("Vật Lý", q.Content));
            Assert.Equal(12, response.Questions.Count(q => q.QuestionType == "SINGLE"));
            Assert.Equal(4, response.Questions.Count(q => q.QuestionType == "MULTI_TRUE_FALSE"));
            Assert.Equal(6, response.Questions.Count(q => q.QuestionType == "SHORT_ANSWER"));
        }

        [Fact]
        public async Task GenerateFromRealBankAsync_WhenBankIsShort_ReportsCoverageWithoutFabrication()
        {
            await using var db = CreateInMemoryDb(nameof(GenerateFromRealBankAsync_WhenBankIsShort_ReportsCoverageWithoutFabrication));
            var tenantId = Guid.NewGuid();

            for (int i = 1; i <= 3; i++)
            {
                db.Questions.Add(new SingleChoiceQuestion
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    DomainCode = "EDUCATION",
                    CategoryCode = "TOAN",
                    Difficulty = 1,
                    Content = $"Toán real #{i}",
                    Options = new List<string> { "A. 1", "B. 2" },
                    CorrectOption = "A"
                });
            }
            await db.SaveChangesAsync();

            var service = new ExamMatrixGeneratorService(db, NullLogger<ExamMatrixGeneratorService>.Instance);
            var response = await service.GenerateFromRealBankAsync(tenantId, new GenerateMatrixExamRequestDto
            {
                TemplateCode = "MOET_2025_TOAN",
                DomainCode = "EDUCATION",
                TopicCode = "TOAN"
            });

            Assert.Equal(3, response.TotalQuestions);
            Assert.Equal(22, response.RequestedTotal);
            Assert.Equal(19, response.MissingTotal);
            Assert.NotNull(response.WarningMessage);
        }

        [Fact]
        public async Task SaveAndDeleteCustomCompanyTemplate_PersistsIsolatedPerTenant()
        {
            await using var db = CreateInMemoryDb(nameof(SaveAndDeleteCustomCompanyTemplate_PersistsIsolatedPerTenant));
            var tenantA = Guid.NewGuid();
            var tenantB = Guid.NewGuid();
            var service = new ExamMatrixGeneratorService(db, NullLogger<ExamMatrixGeneratorService>.Instance);

            var saved = await service.SaveCustomTemplateAsync(tenantA, new ExamMatrixTemplateDto
            {
                TemplateCode = "VCB_RM_2025",
                Title = "Quy chuẩn QHKH Doanh nghiệp VCB 2025",
                Category = "COMPANY_POLICY",
                DomainCode = "BANKING",
                TopicCode = "TIN_DUNG",
                DurationMinutes = 60,
                BloomWeights = new ExamMatrixBloomWeightsDto { Recall = 20, Comprehend = 40, Apply = 30, HighApply = 10 },
                Sections = new List<ExamMatrixSectionRuleDto>
                {
                    new() { Code = "PART_1", Title = "Nghiệp vụ Tín dụng", QuestionType = "SINGLE", Count = 10, PointsPerQuestion = 1.0 }
                }
            });

            var templatesA = await service.GetTemplatesAsync(tenantA);
            var templatesB = await service.GetTemplatesAsync(tenantB);

            Assert.Contains(templatesA, t => t.TemplateCode == "VCB_RM_2025" && !t.IsSystemDefault);
            Assert.DoesNotContain(templatesB, t => t.TemplateCode == "VCB_RM_2025");

            bool deleted = await service.DeleteCustomTemplateAsync(tenantA, saved.TemplateCode);
            Assert.True(deleted);

            var templatesAfter = await service.GetTemplatesAsync(tenantA);
            Assert.DoesNotContain(templatesAfter, t => t.TemplateCode == "VCB_RM_2025");
        }
    }
}
