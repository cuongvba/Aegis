using System;

namespace AegisQuiz.Domain.Entities
{
    /// <summary>
    /// [NoHC & Marketing Campaign Governance]
    /// Quản lý tập trung các chính sách đối tác giáo viên theo từng chiến dịch tiếp thị:
    /// Thời gian dùng thử, tỷ lệ chia sẻ doanh thu, điểm thưởng Karma, và chính sách mở khóa Pro 1 tuần qua 1 ly cafe.
    /// </summary>
    public class CreatorMarketingPolicy
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>Mã chiến dịch tiếp thị (ví dụ: SPRING_EDUCATOR_2026, GLOBAL_LAUNCH_2026).</summary>
        public string CampaignCode { get; set; } = "SPRING_EDUCATOR_2026";

        /// <summary>Tên chiến dịch hiển thị cho giáo viên và đối tác.</summary>
        public string CampaignName { get; set; } = "Chương Trình Đồng Hành Sư Phạm Toàn Cầu 2026";

        /// <summary>Mô tả chi tiết mục tiêu và đặc quyền của chiến dịch.</summary>
        public string Description { get; set; } = "Chính sách ưu đãi tri ân Thầy Cô và Chuyên gia giáo dục: Dùng thử toàn năng, chia sẻ doanh thu và mở khóa 7 ngày Pro qua 1 ly cafe.";

        /// <summary>Số ngày dùng thử toàn năng ban đầu khi giáo viên đăng ký (ví dụ: 90 ngày).</summary>
        public int TrialDays { get; set; } = 90;

        /// <summary>Tỷ lệ chia sẻ doanh thu cho giáo viên (ví dụ: 0.80 = 80%).</summary>
        public decimal RevenueShareRate { get; set; } = 0.80m;

        /// <summary>Điểm thưởng Karma chào mừng ban đầu.</summary>
        public int KarmaBonusPoints { get; set; } = 100;

        /// <summary>Quy định nghiêm ngặt số ngày mở khóa Pro khi mời 1 ly cafe (mặc định chuẩn 7 ngày = 1 tuần).</summary>
        public int CoffeeProDays { get; set; } = 7;

        /// <summary>Mức giá 1 ly cafe ủng hộ server (VNĐ, mặc định 25.000 VNĐ).</summary>
        public decimal CoffeePriceVnd { get; set; } = 25000m;

        /// <summary>Mã BIN ngân hàng nhận tiền ủng hộ (970405 - Agribank Napas).</summary>
        public string CoffeeBankBin { get; set; } = "970405";

        /// <summary>Số tài khoản thụ hưởng nhận tiền ủng hộ.</summary>
        public string CoffeeAccountNumber { get; set; } = "8888912600688";

        /// <summary>Tên chủ tài khoản thụ hưởng.</summary>
        public string CoffeeAccountName { get; set; } = "AEGIS GLOBAL TREASURY";

        /// <summary>Chiến dịch đang có hiệu lực áp dụng toàn hệ thống.</summary>
        public bool IsActive { get; set; } = true;

        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? EndDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}

