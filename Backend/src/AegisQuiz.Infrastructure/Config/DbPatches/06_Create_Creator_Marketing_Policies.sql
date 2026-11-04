-- [ALDS v1.0] Migration 06: Bảng quản lý tập trung chính sách Marketing cho Creator & Mời 1 Ly Cafe (7 ngày Pro)
CREATE TABLE IF NOT EXISTS creator_marketing_policies (
    id UUID PRIMARY KEY,
    campaign_code VARCHAR(100) NOT NULL UNIQUE,
    campaign_name VARCHAR(255) NOT NULL,
    description TEXT,
    trial_days INT NOT NULL DEFAULT 90,
    revenue_share_rate NUMERIC(5,2) NOT NULL DEFAULT 0.80,
    karma_bonus_points INT NOT NULL DEFAULT 100,
    coffee_pro_days INT NOT NULL DEFAULT 7,
    coffee_price_vnd NUMERIC(18,2) NOT NULL DEFAULT 25000,
    coffee_bank_bin VARCHAR(20) NOT NULL DEFAULT '970405',
    coffee_account_number VARCHAR(50) NOT NULL DEFAULT '8888912600688',
    coffee_account_name VARCHAR(255) NOT NULL DEFAULT 'AEGIS GLOBAL TREASURY',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Khởi tạo chiến dịch mặc định nếu bảng đang rỗng
INSERT INTO creator_marketing_policies (
    id, campaign_code, campaign_name, description, trial_days,
    revenue_share_rate, karma_bonus_points, coffee_pro_days,
    coffee_price_vnd, coffee_bank_bin, coffee_account_number, coffee_account_name,
    is_active, start_date, created_at
)
VALUES (
    'f3c4e5a6-7b8c-9d0e-1f2a-3b4c5d6e7f80',
    'SPRING_EDUCATOR_2026',
    'Chương Trình Đồng Hành Sư Phạm Toàn Cầu 2026',
    'Chính sách ưu đãi tri ân Thầy Cô và Chuyên gia giáo dục: Dùng thử toàn năng, chia sẻ doanh thu và mở khóa 7 ngày Pro qua 1 ly cafe.',
    90,
    0.80,
    100,
    7,
    25000,
    '970405',
    '8888912600688',
    'AEGIS GLOBAL TREASURY',
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (campaign_code) DO NOTHING;

