using System;
using System.Collections.Generic;
using System.Linq;
using AegisQuiz.Application.DTOs;
using AegisQuiz.Application.Interfaces;
using AegisQuiz.Infrastructure.Services;
using AegisQuiz.Infrastructure.Services.Docx;
using Xunit;

namespace AegisQuiz.UnitTests
{
    /// <summary>
    /// Bộ kiểm thử xác thực kiến trúc PISA v7.0 (Predictive Implicit Scope Automaton)
    /// & Rule-Centric Global Hierarchy Ingestion.
    /// Kiểm chứng khả năng bóc tách cả cấu trúc 5 cấp tường minh (có thẻ đóng) lẫn
    /// các cấu trúc khuyết cấp / phẳng / không thẻ đóng trên đa ngôn ngữ chỉ thông qua QuestionParsingRule.
    /// </summary>
    public class PisaGlobalHierarchyIngestionTests
    {
        private readonly DynamicQuestionIngestionEngine _cig = DynamicQuestionIngestionEngine.Instance;

        [Fact]
        public void Scenario1_Full5TierExplicitHierarchy_With5Options_InlineGuide_AndPostExamGuide_ShouldParseCleanly()
        {
            var lines = new List<string>
            {
                "Đề số 1",
                "[Phần I: Chỉ thị làm bài phần trắc nghiệm khách quan]",
                "[Tiểu phần 1. Chỉ thị làm bài tiểu phần đọc hiểu [từ câu 1 đến câu 2]]",
                "[Chỉ thị làm bài 1: Chọn một phương án đúng nhất [Từ câu 1 đến câu 2]]",
                "Đoạn văn ngữ cảnh chung cho câu 1 và câu 2 về trí tuệ nhân tạo.",
                "Câu số 1. [Chọn phương án đúng nhất cho câu 1]",
                "Nội dung câu hỏi 1: Mô hình nào sau đây thuộc kiến trúc Transformer?",
                "Phương án trả lời A. Nội dung phương án A",
                "Phương án trả lời B. Nội dung phương án B",
                "Phương án trả lời C. Nội dung phương án C",
                "Phương án trả lời D. Nội dung phương án D",
                "Phương án trả lời E. Nội dung phương án E",
                "[Hướng dẫn]",
                "Câu số 1. [Chọn phương án đúng nhất cho câu 1]",
                "Nội dung câu hỏi 1: Mô hình nào sau đây thuộc kiến trúc Transformer?",
                "Phương án trả lời A. Nội dung phương án A",
                "Phương án trả lời B. Nội dung phương án B",
                "<u>Phương án trả lời C.</u> Nội dung phương án C",
                "Phương án trả lời D. Nội dung phương án D",
                "Phương án trả lời E. Nội dung phương án E",
                "Giải thích: Phương án C là kiến trúc chuẩn.",
                "Câu số 2. Nội dung câu hỏi 2: Đặc trưng của cơ chế Self-Attention là gì?",
                "Phương án trả lời A. Phương án A2",
                "Phương án trả lời B. Phương án B2",
                "Phương án trả lời C. Phương án C2",
                "Phương án trả lời D. Phương án D2",
                "Phương án trả lời E. Phương án E2",
                "[Hết đoạn chỉ thị làm bài]",
                "[Chỉ thị làm bài 2: Chọn tất cả các đáp án đúng [Từ câu 3 đến câu 3]]",
                "Câu số 3. Những thuật toán nào sau đây dùng cho phân loại?",
                "Phương án trả lời A. SVM",
                "Phương án trả lời B. Random Forest",
                "Phương án trả lời C. K-Means",
                "Phương án trả lời D. Logistic Regression",
                "Phương án trả lời E. PCA",
                "[Hết đoạn chỉ thị làm bài]",
                "[Hết tiểu phần 1]",
                "[Hết phần I]",
                "[Đáp án tham khảo]",
                "1.C 2.E",
                "[Hướng dẫn giải đề]",
                "Câu số 2. Chọn E vì cơ chế Self-Attention tính trọng số song song trên toàn chuỗi.",
                "[Hết đề 1]",
                "[Hướng dẫn giải Đề1]",
                "Câu số 3. Đáp án: A, B, D. Giải thích chi tiết bổ sung từ phần Hướng dẫn giải Đề1."
            };

            var questions = DocxStateMachineClassifier.ParseParagraphList(lines);

            Assert.Equal(3, questions.Count);

            var q1 = questions.First(q => q.SourceQuestionNo == "1");
            var q2 = questions.First(q => q.SourceQuestionNo == "2");
            var q3 = questions.First(q => q.SourceQuestionNo == "3");

            // Kiểm tra 5 phương án A..E của Câu 1 và việc khử tiền tố "Phương án trả lời A."
            Assert.Equal("SINGLE", q1.QuestionType);
            Assert.Equal(5, q1.Options.Count);
            Assert.Contains("Nội dung phương án A", q1.Options[0]);
            Assert.Contains("Nội dung phương án E", q1.Options[4]);
            Assert.DoesNotContain("Phương án trả lời", q1.Options[0]);

            // Kiểm tra gộp khối [Hướng dẫn] lặp lại [Câu số 1 ... A..E] ngay dưới câu 1
            Assert.Equal("3", q1.SuggestedAnswer); // C -> 3
            Assert.Contains("Phương án C là kiến trúc chuẩn", q1.AiExplanation);

            // Kiểm tra Ngữ cảnh dùng chung cho câu 1 & 2 nhưng đóng sau [Hết đoạn chỉ thị làm bài] trước câu 3
            Assert.NotNull(q1.ContextContent);
            Assert.Contains("trí tuệ nhân tạo", q1.ContextContent);
            Assert.Equal(q1.ContextContent, q2.ContextContent);
            Assert.True(string.IsNullOrWhiteSpace(q3.ContextContent) || !q3.ContextContent.Contains("trí tuệ nhân tạo"));

            // Kiểm tra Câu 2 nhận đáp án E (5) từ bảng đáp án và lời giải từ [Hướng dẫn giải đề]
            Assert.Equal(5, q2.Options.Count);
            Assert.Equal("5", q2.SuggestedAnswer); // E -> 5
            Assert.Contains("Self-Attention", q2.AiExplanation);

            // Kiểm tra Câu 3 nhận QuestionType = MULTI từ chỉ thị làm bài 2 và nhận lời giải từ [Hướng dẫn giải Đề1] sau [Hết đề 1]
            Assert.Equal("MULTI", q3.QuestionType);
            Assert.Equal(5, q3.Options.Count);
            Assert.Contains("Hướng dẫn giải Đề1", q3.AiExplanation);
        }

        [Fact]
        public void Scenario2_SparseGroupDirectivesOnly_NoSections_NoRanges_NoClosingTags_ShouldAutoPopAndSwitchTypes()
        {
            // Đề thi khuyết Phần, khuyết Tiểu phần, khuyết cả [Từ câu m đến câu n] và hoàn toàn không có thẻ đóng [Hết...]
            var lines = new List<string>
            {
                "Chọn một đáp án đúng nhất cho các câu hỏi sau:",
                "Câu 1. Thủ đô của Việt Nam là gì?",
                "A. Hà Nội",
                "B. Đà Nẵng",
                "C. Huế",
                "D. Cần Thơ",
                "Câu 2. Sông nào dài nhất thế giới?",
                "A. Sông Nile",
                "B. Sông Hồng",
                "C. Sông Hương",
                "D. Sông Hàn",
                "Chọn nhiều đáp án đúng trong các phương án sau:",
                "Câu 3. Ngôn ngữ lập trình nào chạy trên .NET CLR?",
                "A. C#",
                "B. F#",
                "C. Python thuần",
                "D. VB.NET",
                "Điền đáp số thích hợp vào chỗ trống:",
                "Câu 4. Tính giá trị của biểu thức 15 + 27."
            };

            var questions = DocxStateMachineClassifier.ParseParagraphList(lines);

            Assert.Equal(4, questions.Count);
            Assert.Equal("SINGLE", questions.First(q => q.SourceQuestionNo == "1").QuestionType);
            Assert.Equal("SINGLE", questions.First(q => q.SourceQuestionNo == "2").QuestionType);
            Assert.Equal("MULTI", questions.First(q => q.SourceQuestionNo == "3").QuestionType);
            Assert.Equal("SHORT_ANSWER", questions.First(q => q.SourceQuestionNo == "4").QuestionType);
        }

        [Fact]
        public void Scenario3_SectionDirectToQuestions_WithoutSubSectionsOrGroupDirectives_ShouldInferFromSections()
        {
            var lines = new List<string>
            {
                "PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn",
                "Câu 1. Đạo hàm của hàm số y = x^2 là:",
                "A. 2x",
                "B. x",
                "C. 2",
                "D. x^3",
                "PHẦN II. Câu trắc nghiệm đúng sai",
                "Câu 2. Cho hàm số f(x) = sin(x).",
                "a) f(0) = 0.",
                "b) Hàm số tuần hoàn với chu kỳ 2pi.",
                "c) Đạo hàm f'(x) = -cos(x).",
                "d) Giá trị lớn nhất là 1.",
                "PHẦN III. Câu trắc nghiệm trả lời ngắn",
                "Câu 3. Tìm nghiệm dương của phương trình x^2 - 9 = 0."
            };

            var questions = DocxStateMachineClassifier.ParseParagraphList(lines);

            Assert.Equal(3, questions.Count);
            Assert.Equal("SINGLE", questions.First(q => q.SourceQuestionNo == "1").QuestionType);
            Assert.True(questions.First(q => q.SourceQuestionNo == "2").QuestionType is "TRUE_FALSE" or "MULTI_TRUE_FALSE");
            Assert.Equal("SHORT_ANSWER", questions.First(q => q.SourceQuestionNo == "3").QuestionType);
        }

        [Fact]
        public void Scenario4_FlatQuestionsOnly_WithStemDirectivesInsideQuestionLine_ShouldClassifyAccurately()
        {
            // Đề phẳng hoàn toàn chỉ có danh sách các câu hỏi, chỉ thị nằm ngay trong thân Câu số x
            var lines = new List<string>
            {
                "Câu số 1. [Chọn một phương án đúng] Kết quả của 2 + 2 là:",
                "A. 3",
                "B. 4",
                "C. 5",
                "D. 6",
                "Câu số 2. [Chọn tất cả các đáp án đúng] Số nào sau đây là số nguyên tố?",
                "A. 2",
                "B. 3",
                "C. 4",
                "D. 5",
                "E. 9",
                "Câu số 3. [Sắp xếp theo thứ tự tăng dần] Sắp xếp các bước giải bài toán quy hoạch động:",
                "A. Xác định công thức truy hồi",
                "B. Khởi tạo cơ sở quy hoạch động",
                "C. Truy vết kết quả",
                "D. Tính toán bảng phương án",
                "Câu số 4. [Điền đáp số] Có bao nhiêu tập con của tập hợp gồm 4 phần tử?"
            };

            var questions = DocxStateMachineClassifier.ParseParagraphList(lines);

            Assert.Equal(4, questions.Count);
            Assert.Equal("SINGLE", questions.First(q => q.SourceQuestionNo == "1").QuestionType);
            Assert.Equal("MULTI", questions.First(q => q.SourceQuestionNo == "2").QuestionType);
            Assert.Equal(5, questions.First(q => q.SourceQuestionNo == "2").Options.Count);
            Assert.Equal("ORDERING", questions.First(q => q.SourceQuestionNo == "3").QuestionType);
            Assert.Equal("SHORT_ANSWER", questions.First(q => q.SourceQuestionNo == "4").QuestionType);
        }

        [Fact]
        public void Scenario5_MultilingualGlobalFormat_EnglishRuleDriven_ShouldParseOptionsAndScopes()
        {
            var lines = new List<string>
            {
                "EXAM 1",
                "PART I: Objective Assessment",
                "Sub-section 1. Analytical Reading [From question 1 to question 2]",
                "Questions 1-1: Choose the best answer.",
                "Question no. 1. Which protocol operates at the Transport Layer?",
                "Option A. HTTP",
                "Option B. TCP",
                "Option C. IP",
                "Option D. ARP",
                "Option E. DNS",
                "End of directive",
                "Questions 2-2: Select all that apply.",
                "Question no. 2. Which of the following are asymmetric encryption algorithms?",
                "Option A. RSA",
                "Option B. ECC",
                "Option C. AES",
                "Option D. Diffie-Hellman",
                "Option E. DES",
                "End of sub-section 1",
                "End of part I",
                "ANSWER KEY",
                "1.B"
            };

            var questions = DocxStateMachineClassifier.ParseParagraphList(lines);

            Assert.Equal(2, questions.Count);

            var q1 = questions.First(q => q.SourceQuestionNo == "1");
            var q2 = questions.First(q => q.SourceQuestionNo == "2");

            Assert.Equal("SINGLE", q1.QuestionType);
            Assert.Equal(5, q1.Options.Count);
            Assert.Equal("2", q1.SuggestedAnswer); // B -> 2

            Assert.Equal("MULTI", q2.QuestionType);
            Assert.Equal(5, q2.Options.Count);
        }

        [Fact]
        public void Scenario6_SingleUniversalGeneralRule_RGen_Only_ShouldParseAllQuestionTypesAcrossAllLevels()
        {
            // Kiểm chứng chỉ với duy nhất 1 quy tắc tổng quát R_Gen (GENERAL_UNIVERSAL_INGESTION) chứa DirectiveQuestionTypeMap,
            // hệ thống tự động nhận diện mọi loại câu hỏi (SINGLE, MULTI, TRUE_FALSE, ORDERING, SHORT_ANSWER) ở cả 4 cấp PART, SUB_PART, GROUP_DIRECTIVE, STEM.
            var rGen = _cig.GetAllRules().First(r => r.RuleCode == "GENERAL_UNIVERSAL_INGESTION");
            Assert.NotNull(rGen.StimulusSpec.DirectiveQuestionTypeMap);
            Assert.True(rGen.StimulusSpec.DirectiveQuestionTypeMap.ContainsKey("MULTI"));
            Assert.True(rGen.StimulusSpec.DirectiveQuestionTypeMap.ContainsKey("ORDERING"));
            Assert.True(rGen.StimulusSpec.DirectiveQuestionTypeMap.ContainsKey("SHORT_ANSWER"));
            Assert.True(rGen.StimulusSpec.DirectiveQuestionTypeMap.ContainsKey("MULTI_TRUE_FALSE"));

            var lines = new List<string>
            {
                "Đề số 1",
                "[Phần I: Chọn một phương án đúng nhất]",
                "Câu số 1. Giao thức nào hoạt động ở tầng Giao vận (Transport)?",
                "Phương án trả lời A. HTTP",
                "Phương án trả lời B. TCP",
                "Phương án trả lời C. IP",
                "Phương án trả lời D. ICMP",
                "[Phần II: Chọn tất cả các đáp án đúng]",
                "Câu số 2. Ngôn ngữ nào biên dịch ra mã trung gian IL?",
                "Phương án trả lời A. C#",
                "Phương án trả lời B. F#",
                "Phương án trả lời C. C thuần",
                "Phương án trả lời D. VB.NET",
                "[Tiểu phần 1. Xét tính đúng sai của các mệnh đề [từ câu 3 đến câu 3]]",
                "Câu số 3. Cho hàm số y = x^2.",
                "a) Hàm số chẵn trên R.",
                "b) Đồ thị đi qua gốc tọa độ.",
                "c) Hàm số nghịch biến trên (0; +∞).",
                "d) Giá trị nhỏ nhất bằng 0.",
                "[Chỉ thị làm bài: Sắp xếp theo thứ tự đúng]",
                "Câu số 4. Sắp xếp quy trình CI/CD chuẩn:",
                "A. Deploy Production",
                "B. Build & Compile",
                "C. Run Unit Tests",
                "D. Commit Code",
                "Câu số 5. [Điền đáp số thích hợp] Tính giá trị của 12 * 12."
            };

            var questions = DocxStateMachineClassifier.ParseParagraphList(lines);

            Assert.Equal(5, questions.Count);
            Assert.Equal("SINGLE", questions.First(q => q.SourceQuestionNo == "1").QuestionType);
            Assert.Equal("MULTI", questions.First(q => q.SourceQuestionNo == "2").QuestionType);
            Assert.True(questions.First(q => q.SourceQuestionNo == "3").QuestionType is "TRUE_FALSE" or "MULTI_TRUE_FALSE");
            Assert.Equal("ORDERING", questions.First(q => q.SourceQuestionNo == "4").QuestionType);
            Assert.Equal("SHORT_ANSWER", questions.First(q => q.SourceQuestionNo == "5").QuestionType);
        }
    }
}
