using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Aegis.API.Controllers;
using Aegis.Domain.Entities;
using Aegis.Infrastructure.Data;
using Xunit;

namespace Aegis.UnitTests
{
    public class SocialTelemetryAndFeedbackTests
    {
        private AegisDbContext CreateInMemoryDb(string dbName)
        {
            var options = new DbContextOptionsBuilder<AegisDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new AegisDbContext(options);
        }

        private static JsonElement ToJsonElement(object? value)
        {
            var json = JsonSerializer.Serialize(value);
            return JsonDocument.Parse(json).RootElement;
        }

        [Fact]
        public async Task TrackView_ShouldIncrementViewCount_WhenCalled()
        {
            using var db = CreateInMemoryDb(Guid.NewGuid().ToString());
            var topic = new BankTopic
            {
                Id = Guid.NewGuid(),
                Code = "TEST_TOPIC_01",
                Name = "Chủ đề Khảo Sát Toán 12",
                ViewCount = 10
            };
            db.BankTopics.Add(topic);
            await db.SaveChangesAsync();

            var controller = new InteractionTelemetryController(db, NullLogger<InteractionTelemetryController>.Instance);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
            controller.HttpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");

            var actionResult = await controller.TrackView(new TrackViewRequest
            {
                TargetType = "TOPIC",
                TargetId = topic.Id
            });

            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var root = ToJsonElement(okResult.Value);
            Assert.True(root.GetProperty("success").GetBoolean());
            Assert.Equal(11L, root.GetProperty("viewCount").GetInt64());

            var updatedTopic = await db.BankTopics.FindAsync(topic.Id);
            Assert.NotNull(updatedTopic);
            Assert.Equal(11L, updatedTopic.ViewCount);
        }

        [Fact]
        public async Task React_ShouldToggleLike_AndSupportDislike()
        {
            using var db = CreateInMemoryDb(Guid.NewGuid().ToString());
            var topic = new BankTopic
            {
                Id = Guid.NewGuid(),
                Code = "TEST_REACT_01",
                Name = "Đề Thi Khảo Sát GDPT 2025",
                LikeCount = 0,
                DislikeCount = 0
            };
            db.BankTopics.Add(topic);
            await db.SaveChangesAsync();

            var controller = new InteractionTelemetryController(db, NullLogger<InteractionTelemetryController>.Instance);
            controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
            controller.HttpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("10.0.0.1");

            // 1. Like lần đầu -> LikeCount = 1
            var likeRes = await controller.React(new ReactRequest { TargetType = "TOPIC", TargetId = topic.Id, Reaction = "LIKE" });
            var okLike = Assert.IsType<OkObjectResult>(likeRes);
            var likeRoot = ToJsonElement(okLike.Value);
            Assert.Equal("LIKE", likeRoot.GetProperty("currentStatus").GetString());
            Assert.Equal(1, likeRoot.GetProperty("likeCount").GetInt32());

            // 2. Chuyển sang DISLIKE -> LikeCount = 0, DislikeCount = 1
            var dislikeRes = await controller.React(new ReactRequest { TargetType = "TOPIC", TargetId = topic.Id, Reaction = "DISLIKE" });
            var okDislike = Assert.IsType<OkObjectResult>(dislikeRes);
            var dislikeRoot = ToJsonElement(okDislike.Value);
            Assert.Equal("DISLIKE", dislikeRoot.GetProperty("currentStatus").GetString());
            Assert.Equal(0, dislikeRoot.GetProperty("likeCount").GetInt32());
            Assert.Equal(1, dislikeRoot.GetProperty("dislikeCount").GetInt32());

            // 3. Bấm DISLIKE lần nữa -> Hủy phản hồi (Toggle off) -> LikeCount = 0, DislikeCount = 0
            var undoRes = await controller.React(new ReactRequest { TargetType = "TOPIC", TargetId = topic.Id, Reaction = "DISLIKE" });
            var okUndo = Assert.IsType<OkObjectResult>(undoRes);
            var undoRoot = ToJsonElement(okUndo.Value);
            Assert.Equal("NONE", undoRoot.GetProperty("currentStatus").GetString());
            Assert.Equal(0, undoRoot.GetProperty("dislikeCount").GetInt32());
        }

        [Fact]
        public async Task WishlistFeedback_ShouldSubmit_AndUpvoteSuccessfully()
        {
            using var db = CreateInMemoryDb(Guid.NewGuid().ToString());
            var controller = new InteractionTelemetryController(db, NullLogger<InteractionTelemetryController>.Instance);
            controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
            controller.HttpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("192.168.1.50");

            // 1. Submit feedback mới
            var submitRes = await controller.SubmitFeedback(new SubmitFeedbackRequest
            {
                Category = "FEATURE_REQUEST",
                Title = "Xuất đề thi xáo trộn 8 mã đề",
                Description = "Cần chia sẻ mã đề ngẫu nhiên kèm phiếu trả lời trắc nghiệm chuẩn GDPT 2025",
                AuthorName = "Thầy Hùng"
            });

            var okSubmit = Assert.IsType<OkObjectResult>(submitRes);
            var submitRoot = ToJsonElement(okSubmit.Value);
            Assert.True(submitRoot.GetProperty("success").GetBoolean());
            var feedbackElem = submitRoot.GetProperty("feedback");
            var feedbackId = feedbackElem.GetProperty("Id").GetGuid();
            Assert.Equal(1, feedbackElem.GetProperty("UpvotesCount").GetInt32());

            // 2. Client khác Upvote (+1)
            var controllerClient2 = new InteractionTelemetryController(db, NullLogger<InteractionTelemetryController>.Instance);
            controllerClient2.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
            controllerClient2.HttpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("192.168.1.99");

            var upvoteRes = await controllerClient2.UpvoteFeedback(feedbackId);
            var okUpvote = Assert.IsType<OkObjectResult>(upvoteRes);
            var upvoteRoot = ToJsonElement(okUpvote.Value);
            Assert.True(upvoteRoot.GetProperty("success").GetBoolean());
            Assert.Equal(2, upvoteRoot.GetProperty("upvotesCount").GetInt32());
            Assert.True(upvoteRoot.GetProperty("hasUpvoted").GetBoolean());
        }
    }
}
