using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Aegis.Domain.Entities;
using Aegis.Infrastructure.Data;

namespace Aegis.API.Controllers
{
    /// <summary>
    /// [Social Telemetry & User Voice Engine]
    /// Quản lý tương tác xã hội (Views, Likes, Dislikes, Ratings, Forks) và
    /// cổng tiếp nhận nguyện vọng, đề xuất tính năng & báo lỗi từ cộng đồng.
    /// </summary>
    [ApiController]
    [Route("api")]
    public class InteractionTelemetryController : ControllerBase
    {
        private readonly AegisDbContext _db;
        private readonly ILogger<InteractionTelemetryController> _logger;

        public InteractionTelemetryController(
            AegisDbContext db,
            ILogger<InteractionTelemetryController> logger)
        {
            _db = db;
            _logger = logger;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;
        }

        private string GetClientIp()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        }

        // ── 1. GHI NHẬN LƯỢT XEM (DEBOUNCED & RATE-LIMITED VIEW) ─────────────
        [HttpPost("interactions/track")]
        [AllowAnonymous]
        public async Task<IActionResult> TrackView([FromBody] TrackViewRequest req)
        {
            try
            {
                if (req.TargetId == Guid.Empty) return BadRequest("TargetId không hợp lệ");

                var userId = GetCurrentUserId();
                var ip = GetClientIp();
                var oneHourAgo = DateTime.UtcNow.AddHours(-1);

                // Kiểm tra xem IP hoặc User này đã xem trong 1 giờ qua chưa để chống spam F5
                bool recentViewExists = await _db.UserInteractionLogs.AsNoTracking().AnyAsync(l =>
                    l.TargetType == req.TargetType &&
                    l.TargetId == req.TargetId &&
                    l.InteractionType == "VIEW" &&
                    l.CreatedAt >= oneHourAgo &&
                    ((userId != null && l.UserId == userId) || l.UserIp == ip));

                long viewCount = 0;

                if (!recentViewExists)
                {
                    _db.UserInteractionLogs.Add(new UserInteractionLog
                    {
                        TargetType = req.TargetType,
                        TargetId = req.TargetId,
                        UserId = userId,
                        UserIp = ip,
                        InteractionType = "VIEW"
                    });

                    if (req.TargetType.Equals("TOPIC", StringComparison.OrdinalIgnoreCase))
                    {
                        var topic = await _db.BankTopics.FirstOrDefaultAsync(t => t.Id == req.TargetId);
                        if (topic != null)
                        {
                            topic.ViewCount++;
                            viewCount = topic.ViewCount;
                        }
                    }

                    await _db.SaveChangesAsync();
                }
                else
                {
                    if (req.TargetType.Equals("TOPIC", StringComparison.OrdinalIgnoreCase))
                    {
                        viewCount = await _db.BankTopics.AsNoTracking()
                            .Where(t => t.Id == req.TargetId)
                            .Select(t => t.ViewCount)
                            .FirstOrDefaultAsync();
                    }
                }

                return Ok(new { success = true, viewCount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[InteractionTelemetry] Error tracking view: {Message}", ex.Message);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── 2. PHẢN HỒI LIKE / DISLIKE (IDEMPOTENT TOGGLE) ────────────────────
        [HttpPost("interactions/react")]
        [AllowAnonymous]
        public async Task<IActionResult> React([FromBody] ReactRequest req)
        {
            try
            {
                if (req.TargetId == Guid.Empty) return BadRequest("TargetId không hợp lệ");
                string action = req.Reaction.ToUpperInvariant(); // LIKE hoặc DISLIKE
                if (action != "LIKE" && action != "DISLIKE") return BadRequest("Reaction phải là LIKE hoặc DISLIKE");

                var userId = GetCurrentUserId() ?? $"ip_{GetClientIp()}";

                var existingReaction = await _db.UserInteractionLogs
                    .FirstOrDefaultAsync(l =>
                        l.TargetType == req.TargetType &&
                        l.TargetId == req.TargetId &&
                        l.UserId == userId &&
                        (l.InteractionType == "LIKE" || l.InteractionType == "DISLIKE"));

                var topic = await _db.BankTopics.FirstOrDefaultAsync(t => t.Id == req.TargetId);
                string currentStatus = "NONE";

                if (existingReaction != null)
                {
                    if (existingReaction.InteractionType == action)
                    {
                        // Bấm lại cùng nút -> Hủy reaction (Toggle off)
                        _db.UserInteractionLogs.Remove(existingReaction);
                        if (topic != null)
                        {
                            if (action == "LIKE") topic.LikeCount = Math.Max(0, topic.LikeCount - 1);
                            else topic.DislikeCount = Math.Max(0, topic.DislikeCount - 1);
                        }
                        currentStatus = "NONE";
                    }
                    else
                    {
                        // Đổi từ LIKE sang DISLIKE hoặc ngược lại
                        string prev = existingReaction.InteractionType;
                        existingReaction.InteractionType = action;
                        existingReaction.CreatedAt = DateTime.UtcNow;

                        if (topic != null)
                        {
                            if (prev == "LIKE") topic.LikeCount = Math.Max(0, topic.LikeCount - 1);
                            else topic.DislikeCount = Math.Max(0, topic.DislikeCount - 1);

                            if (action == "LIKE") topic.LikeCount++;
                            else topic.DislikeCount++;
                        }
                        currentStatus = action;
                    }
                }
                else
                {
                    // Tạo reaction mới
                    _db.UserInteractionLogs.Add(new UserInteractionLog
                    {
                        TargetType = req.TargetType,
                        TargetId = req.TargetId,
                        UserId = userId,
                        UserIp = GetClientIp(),
                        InteractionType = action
                    });

                    if (topic != null)
                    {
                        if (action == "LIKE") topic.LikeCount++;
                        else topic.DislikeCount++;
                    }
                    currentStatus = action;
                }

                await _db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    currentStatus,
                    likeCount = topic?.LikeCount ?? 0,
                    dislikeCount = topic?.DislikeCount ?? 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[InteractionTelemetry] Error reacting: {Message}", ex.Message);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── 3. CHẤM SAO ĐÁNH GIÁ (RATING 1-5 SAO) ─────────────────────────────
        [HttpPost("interactions/rate")]
        [AllowAnonymous]
        public async Task<IActionResult> Rate([FromBody] RateRequest req)
        {
            try
            {
                if (req.Rating < 1 || req.Rating > 5) return BadRequest("Rating phải từ 1 đến 5 sao");

                var userId = GetCurrentUserId() ?? $"ip_{GetClientIp()}";

                var existingRating = await _db.UserInteractionLogs
                    .FirstOrDefaultAsync(l =>
                        l.TargetType == req.TargetType &&
                        l.TargetId == req.TargetId &&
                        l.UserId == userId &&
                        l.InteractionType == "RATING");

                var topic = await _db.BankTopics.FirstOrDefaultAsync(t => t.Id == req.TargetId);

                if (existingRating != null)
                {
                    existingRating.RatingValue = req.Rating;
                    existingRating.Comment = req.Comment;
                    existingRating.CreatedAt = DateTime.UtcNow;
                }
                else
                {
                    _db.UserInteractionLogs.Add(new UserInteractionLog
                    {
                        TargetType = req.TargetType,
                        TargetId = req.TargetId,
                        UserId = userId,
                        UserIp = GetClientIp(),
                        InteractionType = "RATING",
                        RatingValue = req.Rating,
                        Comment = req.Comment
                    });
                }

                await _db.SaveChangesAsync();

                // Tính toán lại trung bình rating
                if (topic != null)
                {
                    var allRatings = await _db.UserInteractionLogs.AsNoTracking()
                        .Where(l => l.TargetType == req.TargetType && l.TargetId == req.TargetId && l.InteractionType == "RATING" && l.RatingValue != null)
                        .Select(l => l.RatingValue!.Value)
                        .ToListAsync();

                    if (allRatings.Count > 0)
                    {
                        topic.RatingCount = allRatings.Count;
                        topic.RatingAverage = Math.Round(allRatings.Average(), 1);
                        await _db.SaveChangesAsync();
                    }
                }

                return Ok(new
                {
                    success = true,
                    ratingAverage = topic?.RatingAverage ?? req.Rating,
                    ratingCount = topic?.RatingCount ?? 1
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[InteractionTelemetry] Error rating: {Message}", ex.Message);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── 4. BÁO LỖI CÂU HỎI / ĐỀ THI (IN-SITU FLAGGING) ────────────────────
        [HttpPost("interactions/flag")]
        [AllowAnonymous]
        public async Task<IActionResult> FlagQuestionOrExam([FromBody] FlagRequest req)
        {
            try
            {
                var userId = GetCurrentUserId();
                var ip = GetClientIp();

                _db.UserInteractionLogs.Add(new UserInteractionLog
                {
                    TargetType = req.TargetType,
                    TargetId = req.TargetId,
                    UserId = userId,
                    UserIp = ip,
                    InteractionType = "FLAG",
                    FlagReason = req.Reason,
                    Comment = req.Comment
                });

                await _db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Cảm ơn bạn đã phản hồi! Đội ngũ kiểm định đã ghi nhận và sẽ rà soát ngay."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[InteractionTelemetry] Error flagging: {Message}", ex.Message);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── 5. BẢNG TIẾP NHẬN Ý TƯỞNG & NGUYỆN VỌNG (WISHLIST BOARD) ────────
        [HttpGet("feedback/board")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFeedbackBoard([FromQuery] string? category, [FromQuery] string? status)
        {
            try
            {
                var q = _db.PlatformWishlistFeedbacks.AsNoTracking().AsQueryable();

                if (!string.IsNullOrWhiteSpace(category) && category != "ALL")
                    q = q.Where(f => f.Category == category);

                if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
                    q = q.Where(f => f.Status == status);

                var items = await q.OrderByDescending(f => f.UpvotesCount)
                    .ThenByDescending(f => f.CreatedAt)
                    .Take(50)
                    .ToListAsync();

                var currentUserId = GetCurrentUserId() ?? $"ip_{GetClientIp()}";

                var results = items.Select(item =>
                {
                    var upvoterIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    try
                    {
                        if (!string.IsNullOrWhiteSpace(item.UpvotedUserIdsJson))
                        {
                            var list = JsonSerializer.Deserialize<List<string>>(item.UpvotedUserIdsJson);
                            if (list != null) foreach (var id in list) upvoterIds.Add(id);
                        }
                    }
                    catch { }

                    return new
                    {
                        item.Id,
                        item.AuthorName,
                        item.Category,
                        item.Title,
                        item.Description,
                        item.UpvotesCount,
                        item.Status,
                        item.AdminResponse,
                        item.CreatedAt,
                        hasUpvoted = upvoterIds.Contains(currentUserId)
                    };
                });

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[FeedbackBoard] Error loading board: {Message}", ex.Message);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ── 6. GỬI NGUYỆN VỌNG / ĐỀ XUẤT TÍNH NĂNG MỚI ───────────────────────
        [HttpPost("feedback/submit")]
        [AllowAnonymous]
        public async Task<IActionResult> SubmitFeedback([FromBody] SubmitFeedbackRequest req)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(req.Title)) return BadRequest("Tiêu đề không được để trống");
                if (string.IsNullOrWhiteSpace(req.Description)) return BadRequest("Mô tả không được để trống");

                var userId = GetCurrentUserId() ?? $"ip_{GetClientIp()}";
                var initialUpvoters = new List<string> { userId };

                var feedback = new PlatformWishlistFeedback
                {
                    UserId = GetCurrentUserId(),
                    AuthorName = string.IsNullOrWhiteSpace(req.AuthorName) ? "Thành viên ẩn danh" : req.AuthorName.Trim(),
                    AuthorEmail = req.AuthorEmail?.Trim(),
                    Category = string.IsNullOrWhiteSpace(req.Category) ? "FEATURE_REQUEST" : req.Category.Trim().ToUpperInvariant(),
                    Title = req.Title.Trim(),
                    Description = req.Description.Trim(),
                    UpvotesCount = 1,
                    Status = "OPEN",
                    UpvotedUserIdsJson = JsonSerializer.Serialize(initialUpvoters)
                };

                _db.PlatformWishlistFeedbacks.Add(feedback);
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Ý tưởng của Thầy/Cô đã được đăng tải lên bảng nguyện vọng cộng đồng!",
                    feedback
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[FeedbackBoard] Error submitting feedback: {Message}", ex.Message);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // ── 7. BÌNH CHỌN UPVOTE (+1) CHO Ý TƯỞNG ────────────────────────────
        [HttpPost("feedback/{id}/upvote")]
        [AllowAnonymous]
        public async Task<IActionResult> UpvoteFeedback(Guid id)
        {
            try
            {
                var feedback = await _db.PlatformWishlistFeedbacks.FirstOrDefaultAsync(f => f.Id == id);
                if (feedback == null) return NotFound("Không tìm thấy ý tưởng");

                var userId = GetCurrentUserId() ?? $"ip_{GetClientIp()}";
                var upvoterIds = new List<string>();

                try
                {
                    if (!string.IsNullOrWhiteSpace(feedback.UpvotedUserIdsJson))
                    {
                        var parsed = JsonSerializer.Deserialize<List<string>>(feedback.UpvotedUserIdsJson);
                        if (parsed != null) upvoterIds = parsed;
                    }
                }
                catch { }

                bool hasUpvoted = upvoterIds.Contains(userId, StringComparer.OrdinalIgnoreCase);

                if (hasUpvoted)
                {
                    // Hủy upvote
                    upvoterIds.RemoveAll(x => x.Equals(userId, StringComparison.OrdinalIgnoreCase));
                    feedback.UpvotesCount = Math.Max(0, feedback.UpvotesCount - 1);
                    hasUpvoted = false;
                }
                else
                {
                    // Thêm upvote
                    upvoterIds.Add(userId);
                    feedback.UpvotesCount++;
                    hasUpvoted = true;
                }

                feedback.UpvotedUserIdsJson = JsonSerializer.Serialize(upvoterIds);
                feedback.UpdatedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    upvotesCount = feedback.UpvotesCount,
                    hasUpvoted
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[FeedbackBoard] Error upvoting: {Message}", ex.Message);
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    // ── DTOs ──────────────────────────────────────────────────────────────
    public class TrackViewRequest
    {
        public string TargetType { get; set; } = "TOPIC";
        public Guid TargetId { get; set; }
    }

    public class ReactRequest
    {
        public string TargetType { get; set; } = "TOPIC";
        public Guid TargetId { get; set; }
        public string Reaction { get; set; } = "LIKE"; // LIKE | DISLIKE
    }

    public class RateRequest
    {
        public string TargetType { get; set; } = "TOPIC";
        public Guid TargetId { get; set; }
        public int Rating { get; set; } = 5;
        public string? Comment { get; set; }
    }

    public class FlagRequest
    {
        public string TargetType { get; set; } = "QUESTION"; // QUESTION | TOPIC
        public Guid TargetId { get; set; }
        public string Reason { get; set; } = "SAI_DAP_AN"; // SAI_DAP_AN, SAI_DE, MO_HINH, LOI_CONG_THUC, KHAC
        public string? Comment { get; set; }
    }

    public class SubmitFeedbackRequest
    {
        public string Category { get; set; } = "FEATURE_REQUEST";
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? AuthorName { get; set; }
        public string? AuthorEmail { get; set; }
    }
}
