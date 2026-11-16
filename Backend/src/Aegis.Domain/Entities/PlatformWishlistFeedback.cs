using System;

namespace Aegis.Domain.Entities
{
    /// <summary>
    /// [Voice of the Customer & Community Wishlist]
    /// Bảng quản lý tập trung ý tưởng, nguyện vọng, yêu cầu tính năng & phản hồi từ Giáo viên/Người học.
    /// Cho phép cộng đồng bình chọn Upvote (+1) để xếp hạng ưu tiên lộ trình phát triển.
    /// </summary>
    public class PlatformWishlistFeedback
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>ID người dùng gửi (nếu đã đăng nhập)</summary>
        public string? UserId { get; set; }

        /// <summary>Tên hiển thị của tác giả góp ý</summary>
        public string AuthorName { get; set; } = "Thành viên Aegis";

        /// <summary>Email liên hệ nhận thông báo khi tính năng hoàn thành</summary>
        public string? AuthorEmail { get; set; }

        /// <summary>
        /// Phân loại: "FEATURE_REQUEST" (Yêu cầu tính năng) | "BUG_REPORT" (Báo lỗi hệ thống) |
        /// "CURRICULUM_CONTENT" (Bổ sung bộ sách/chủ đề) | "UX_IMPROVEMENT" (Cải tiến trải nghiệm)
        /// </summary>
        public string Category { get; set; } = "FEATURE_REQUEST";

        /// <summary>Tiêu đề ngắn gọn của ý tưởng / phản hồi</summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>Nội dung mô tả chi tiết, tình huống thực tế hoặc kỳ vọng sư phạm</summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>Số lượt cộng đồng bấm đồng tình (Upvotes)</summary>
        public int UpvotesCount { get; set; } = 1;

        /// <summary>
        /// Trạng thái xử lý: "OPEN" (Mới tiếp nhận) | "UNDER_REVIEW" (Đang thẩm định) |
        /// "PLANNED" (Đã đưa vào lộ trình) | "IN_PROGRESS" (Đang phát triển) | "RESOLVED" (Đã bàn giao)
        /// </summary>
        public string Status { get; set; } = "OPEN";

        /// <summary>Phản hồi từ Tổng Công Trình Sư hoặc Đội ngũ Phát triển Aegis</summary>
        public string? AdminResponse { get; set; }

        /// <summary>Danh sách User ID đã bình chọn (định dạng JSON array chuỗi để chống vote nhiều lần)</summary>
        public string? UpvotedUserIdsJson { get; set; } = "[]";

        /// <summary>Thời gian tạo</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Thời gian cập nhật trạng thái</summary>
        public DateTime? UpdatedAt { get; set; }
    }
}
