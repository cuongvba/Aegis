-- [ALDS v1.0] Migration 07: Bảng đo đạc tương tác xã hội (Views, Likes, Ratings, Forks) & Cổng tiếp nhận kỳ vọng/nguyện vọng (User Voice Wishlist)

-- 1. Bổ sung các cột tương tác xã hội cho bank_topics
ALTER TABLE bank_topics ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE bank_topics ADD COLUMN IF NOT EXISTS like_count INT NOT NULL DEFAULT 0;
ALTER TABLE bank_topics ADD COLUMN IF NOT EXISTS dislike_count INT NOT NULL DEFAULT 0;
ALTER TABLE bank_topics ADD COLUMN IF NOT EXISTS rating_average NUMERIC(3,2) NOT NULL DEFAULT 0.0;
ALTER TABLE bank_topics ADD COLUMN IF NOT EXISTS rating_count INT NOT NULL DEFAULT 0;
ALTER TABLE bank_topics ADD COLUMN IF NOT EXISTS fork_count INT NOT NULL DEFAULT 0;

-- 2. Bảng lưu vết nhật ký tương tác người dùng (chống bot spam, đảm bảo idempotency)
CREATE TABLE IF NOT EXISTS user_interaction_logs (
    id UUID PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL DEFAULT 'TOPIC',
    target_id UUID NOT NULL,
    user_id VARCHAR(100),
    user_ip VARCHAR(100),
    interaction_type VARCHAR(50) NOT NULL DEFAULT 'VIEW',
    rating_value INT,
    flag_reason VARCHAR(255),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_user_interaction_logs_target ON user_interaction_logs(target_type, target_id, interaction_type);
CREATE INDEX IF NOT EXISTS ix_user_interaction_logs_user ON user_interaction_logs(target_type, target_id, user_id, interaction_type);

-- 3. Bảng cổng tiếp nhận ý tưởng, nguyện vọng & bản đồ tính năng (Platform Wishlist)
CREATE TABLE IF NOT EXISTS platform_wishlist_feedbacks (
    id UUID PRIMARY KEY,
    user_id VARCHAR(100),
    author_name VARCHAR(255) NOT NULL DEFAULT 'Thành viên Aegis',
    author_email VARCHAR(255),
    category VARCHAR(50) NOT NULL DEFAULT 'FEATURE_REQUEST',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    upvotes_count INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    admin_response TEXT,
    upvoted_user_ids_json TEXT DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_platform_wishlist_category ON platform_wishlist_feedbacks(category);
CREATE INDEX IF NOT EXISTS ix_platform_wishlist_status ON platform_wishlist_feedbacks(status);
CREATE INDEX IF NOT EXISTS ix_platform_wishlist_upvotes ON platform_wishlist_feedbacks(upvotes_count DESC);

-- Khởi tạo các nguyện vọng/tính năng tiêu biểu ban đầu từ cộng đồng giáo viên & học sinh
INSERT INTO platform_wishlist_feedbacks (
    id, author_name, category, title, description, upvotes_count, status, admin_response, created_at
) VALUES 
(
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Thầy Hoàng Minh (THPT Chuyên)',
    'FEATURE_REQUEST',
    'Hỗ trợ xuất ngân hàng đề thi sang mẫu đề thi chuẩn PDF/Word có mã đề xáo trộn tự động',
    'Rất mong hệ thống hỗ trợ sinh 4-8 mã đề thi khác nhau tự động đảo vị trí câu hỏi và phương án, kèm phiếu chấm trắc nghiệm tô chì 2025.',
    42,
    'PLANNED',
    'Đã đưa vào lộ trình phát triển. SmartOptionShuffler & UniversalExamTranspiler đang được tích hợp.',
    NOW() - INTERVAL '3 days'
),
(
    'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
    'Cô Lê Thanh Hà (THCS Đống Đa)',
    'UX_IMPROVEMENT',
    'Trình soạn thảo trực tiếp trên trang giấy A4 WYSIWYG có phím tắt gõ công thức nhanh',
    'Giáo viên quen dùng Word rất thích giao diện trang giấy trực quan, mong muốn có thanh công cụ chèn ký hiệu Toán/Hóa/Vẽ hình 1 chạm.',
    38,
    'RESOLVED',
    'Đã bàn giao hoàn chỉnh trong bản cập nhật Creator Zen Studio & Paper Exam Studio!',
    NOW() - INTERVAL '2 days'
),
(
    'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
    'Thầy Trần Quốc Tuấn (Toán THPT)',
    'CURRICULUM_CONTENT',
    'Bổ sung ngân hàng ma trận đề minh họa GDPT 2025 cho đủ 3 bộ sách KNTT, Cánh Diều, Chân Trời Sáng Tạo',
    'Mong muốn hệ thống có sẵn khung ma trận 3 phần (Trắc nghiệm 4 lựa chọn, Đúng/Sai 4 ý, Trả lời ngắn) để giáo viên chỉ cần 1 click là có khung chuẩn.',
    56,
    'RESOLVED',
    'Đã tích hợp ExamMatrixWizardModal chuẩn GDPT 2025 cho cả 3 phần thi!',
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;
