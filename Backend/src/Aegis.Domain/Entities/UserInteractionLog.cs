using System;

namespace Aegis.Domain.Entities
{
    /// <summary>
    /// [Social Telemetry & Anti-Spam] Bản ghi nhật ký tương tác của người dùng.
    /// Dùng để định danh chống trùng lặp (Idempotent), chống spam bot bằng User/IP.
    /// </summary>
    public class UserInteractionLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>Loại đối tượng tương tác: "TOPIC" | "QUESTION" | "EXAM_PAPER"</summary>
        public string TargetType { get; set; } = "TOPIC";

        /// <summary>Định danh ID của đối tượng</summary>
        public Guid TargetId { get; set; }

        /// <summary>ID của người dùng thực hiện (null nếu khách vãng lai)</summary>
        public string? UserId { get; set; }

        /// <summary>Địa chỉ IP client để rate-limit và chống gian lận view ảo</summary>
        public string? UserIp { get; set; }

        /// <summary>Loại tương tác: "VIEW" | "LIKE" | "DISLIKE" | "RATING" | "FORK" | "FLAG"</summary>
        public string InteractionType { get; set; } = "VIEW";

        /// <summary>Điểm đánh giá (1 - 5 sao nếu InteractionType = RATING)</summary>
        public int? RatingValue { get; set; }

        /// <summary>Lý do báo lỗi (nếu InteractionType = FLAG): SAI_DAP_AN, SAI_DE, MO_HINH, LOI_CONG_THUC...</summary>
        public string? FlagReason { get; set; }

        /// <summary>Nội dung nhận xét / góp ý chi tiết</summary>
        public string? Comment { get; set; }

        /// <summary>Thời điểm tương tác</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
