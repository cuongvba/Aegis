using System;
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
    public class NotebookStudioTests
    {
        private static AegisDbContext CreateDb(string dbName)
        {
            var options = new DbContextOptionsBuilder<AegisDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;
            return new AegisDbContext(options);
        }

        [Fact]
        public async Task GenerateStudioArtifactAsync_BuildsDualHostPodcastAndStudyGuide()
        {
            await using var db = CreateDb(nameof(GenerateStudioArtifactAsync_BuildsDualHostPodcastAndStudyGuide));
            var tenantId = Guid.NewGuid();
            var nbId = Guid.NewGuid();

            db.Notebooks.Add(new Notebook
            {
                Id = nbId,
                TenantId = tenantId,
                Title = "Chiến thắng Bạch Đằng 938",
                Description = "Tài liệu lịch sử đa nguồn",
                Sources =
                {
                    new NotebookSource
                    {
                        Id = Guid.NewGuid(),
                        NotebookId = nbId,
                        Title = "Đại Việt Sử Ký Toàn Thư",
                        OriginalFileName = "su-ky.pdf"
                    }
                },
                Chapters =
                {
                    new NotebookChapter
                    {
                        Id = Guid.NewGuid(),
                        NotebookId = nbId,
                        OrderIndex = 1,
                        Title = "Trận địa cọc ngầm Ngô Quyền",
                        Summary = "Ngô Quyền lợi dụng thủy triều lên xuống trên sông Bạch Đằng."
                    }
                }
            });
            await db.SaveChangesAsync();

            var service = new NotebookProcessingService(
                db,
                null!,
                NullLogger<NotebookProcessingService>.Instance);

            var podcast = await service.GenerateStudioArtifactAsync(nbId, tenantId, new NotebookStudioGenerateRequestDto
            {
                ArtifactType = "AUDIO_PODCAST",
                Language = "vi"
            });

            Assert.Equal("AUDIO_PODCAST", podcast.ArtifactType);
            Assert.True(podcast.PodcastTurns.Count >= 4);
            Assert.Contains(podcast.PodcastTurns, t => t.Speaker == "HOST_F" && t.VoiceId == "vi-VN-HoaiMyNeural");
            Assert.Contains(podcast.PodcastTurns, t => t.Speaker == "HOST_M" && t.VoiceId == "vi-VN-NamMinhNeural");

            var guide = await service.GenerateStudioArtifactAsync(nbId, tenantId, new NotebookStudioGenerateRequestDto
            {
                ArtifactType = "STUDY_GUIDE",
                Language = "vi"
            });

            Assert.Equal("STUDY_GUIDE", guide.ArtifactType);
            Assert.Contains("Trận địa cọc ngầm Ngô Quyền", guide.ContentMarkdown);
        }
    }
}
