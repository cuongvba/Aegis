-- Bản vá 05: Tạo bảng lưu bài nộp bài tập về nhà theo lớp (Homework Submissions)
CREATE TABLE IF NOT EXISTS "homework_submissions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "topic_code" text NOT NULL,
    "student_name" text,
    "student_class" text,
    "user_id" uuid,
    "is_guest" boolean NOT NULL DEFAULT true,
    "score" numeric NOT NULL DEFAULT 0,
    "correct_count" integer NOT NULL DEFAULT 0,
    "total_questions" integer NOT NULL DEFAULT 0,
    "time_spent_seconds" integer NOT NULL DEFAULT 0,
    "tab_switch_count" integer NOT NULL DEFAULT 0,
    "wrong_question_indexes" jsonb DEFAULT '[]'::jsonb,
    "group_category" text NOT NULL DEFAULT 'CORE',
    "submitted_at" timestamp with time zone NOT NULL DEFAULT now(),
    "teacher_user_id" uuid,
    "tenant_id" uuid
);

CREATE INDEX IF NOT EXISTS "idx_homework_submissions_topic" ON "homework_submissions" ("topic_code");
CREATE INDEX IF NOT EXISTS "idx_homework_submissions_teacher" ON "homework_submissions" ("teacher_user_id");
CREATE INDEX IF NOT EXISTS "idx_homework_submissions_user" ON "homework_submissions" ("user_id");

