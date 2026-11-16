using System;
using System.Text.Json;
using System.Threading.Tasks;
using Aegis.Application.DTOs;
using Aegis.Domain.Entities;
using Aegis.Infrastructure.Data;
using Aegis.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Aegis.UnitTests
{
    public class TopicPivotServiceTests
    {
        private static AegisDbContext CreateInMemoryDb()
        {
            var options = new DbContextOptionsBuilder<AegisDbContext>()
                .UseInMemoryDatabase($"TopicPivot_{Guid.NewGuid()}")
                .Options;
            return new AegisDbContext(options);
        }

        [Fact]
        public async Task GetPivotSummary_ShouldSortGradesNaturallyAndBuildCoverageMatrix()
        {
            using var db = CreateInMemoryDb();

            db.DynamicDomains.Add(new DynamicDomain { Code = "MATH", Name = "Toán học" });
            db.BankTopics.AddRange(
                new BankTopic { Id = Guid.NewGuid(), Code = "T_K12_2025", Name = "Đề thi thử Toán 12 Sở Hà Nội 2025", DomainCode = "MATH", Enabled = true },
                new BankTopic { Id = Guid.NewGuid(), Code = "T_K2_2024", Name = "Toán lớp 2 năm 2024", DomainCode = "MATH", Enabled = true },
                new BankTopic { Id = Guid.NewGuid(), Code = "T_K10_2026", Name = "Toán lớp 10 năm 2026", DomainCode = "MATH", Enabled = true }
            );

            for (int i = 0; i < 16; i++)
            {
                db.Questions.Add(new SingleChoiceQuestion
                {
                    Id = Guid.NewGuid(),
                    CategoryCode = "T_K12_2025",
                    DomainCode = "MATH",
                    Content = $"Câu {i + 1}",
                    Payload = JsonDocument.Parse("{\"targetLevel\":\"Khối 12\",\"benchmarkYear\":2025,\"issuingOrg\":\"Sở GD&ĐT Hà Nội\",\"assessmentPurpose\":\"Thi thử THPT\"}")
                });
            }

            db.Questions.Add(new SingleChoiceQuestion
            {
                Id = Guid.NewGuid(),
                CategoryCode = "T_K2_2024",
                DomainCode = "MATH",
                Content = "1 + 1 = ?",
                Payload = JsonDocument.Parse("{\"targetLevel\":\"Khối 2\",\"benchmarkYear\":2024,\"issuingOrg\":\"Trường Tiểu học A\",\"assessmentPurpose\":\"Học kỳ I\"}")
            });

            db.Questions.Add(new SingleChoiceQuestion
            {
                Id = Guid.NewGuid(),
                CategoryCode = "T_K10_2026",
                DomainCode = "MATH",
                Content = "Tập hợp",
                Payload = JsonDocument.Parse("{\"targetLevel\":\"Khối 10\",\"benchmarkYear\":2026,\"issuingOrg\":\"Trường THPT B\",\"assessmentPurpose\":\"Giữa kỳ\"}")
            });

            await db.SaveChangesAsync();

            var service = new TopicPivotService(db);
            var summary = await service.GetPivotSummaryAsync(new TopicPivotQueryDto { PivotMode = "school" });

            Assert.Equal(3, summary.TotalTopics);
            Assert.Equal(18, summary.TotalQuestions);

            // Kiểm tra sắp xếp khối lớp tự nhiên: Khối 2 -> Khối 10 -> Khối 12 (không bị Khối 10, 12 đứng trước Khối 2)
            Assert.Equal(3, summary.Facets.TargetLevels.Count);
            Assert.Equal("Khối 2", summary.Facets.TargetLevels[0].Value);
            Assert.Equal("Khối 10", summary.Facets.TargetLevels[1].Value);
            Assert.Equal("Khối 12", summary.Facets.TargetLevels[2].Value);

            // Kiểm tra sắp xếp năm giảm dần: 2026 -> 2025 -> 2024
            Assert.Equal("2026", summary.Facets.BenchmarkYears[0].Value);
            Assert.Equal("2025", summary.Facets.BenchmarkYears[1].Value);
            Assert.Equal("2024", summary.Facets.BenchmarkYears[2].Value);

            // Kiểm tra Ma trận Phủ Học liệu (16 câu ở Khối 12 x 2025 -> HEALTHY)
            Assert.Contains(summary.CoverageMatrix, c => c.TargetLevel == "Khối 12" && c.BenchmarkYear == "2025" && c.Status == "HEALTHY");
            Assert.Contains(summary.CoverageMatrix, c => c.TargetLevel == "Khối 10" && c.BenchmarkYear == "2026" && c.Status == "SPARSE");
            Assert.Contains(summary.CoverageMatrix, c => c.TargetLevel == "Khối 12" && c.BenchmarkYear == "2026" && c.Status == "EMPTY");
        }
    }
}
