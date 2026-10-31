using System.Collections.Generic;
using System.Linq;
using AegisQuiz.Infrastructure.Services.Docx;
using Xunit;

namespace AegisQuiz.UnitTests
{
    public class MultiExamSpatialIndexingTests
    {
        [Fact]
        public void MultiExam_TrailingPerExamSolutions_ShouldResolveAnswersByExamSpatialCoordinate()
        {
            var paragraphs = new List<string>
            {
                // Đề 1
                "ĐỀ 1",
                "PHẦN I. Câu hỏi trắc nghiệm",
                "Câu 1. Thủ đô của Việt Nam là gì?",
                "A. Hà Nội",
                "B. TP.HCM",
                "C. Đà Nẵng",
                "D. Cần Thơ",
                "Câu 2. 1 + 1 bằng mấy?",
                "A. 1",
                "B. 2",
                "C. 3",
                "D. 4",
                "HƯỚNG DẪN GIẢI ĐỀ 1",
                "Câu 1. A. Hà Nội là thủ đô của Việt Nam.",
                "Câu 2. B. 1 + 1 = 2.",

                // Đề 2
                "ĐỀ 2",
                "PHẦN I. Câu hỏi trắc nghiệm",
                "Câu 1. Nước sôi ở bao nhiêu độ C?",
                "A. 90",
                "B. 100",
                "C. 110",
                "D. 120",
                "Câu 2. Mặt trời mọc ở hướng nào?",
                "A. Đông",
                "B. Tây",
                "C. Nam",
                "D. Bắc",
                "HƯỚNG DẪN GIẢI ĐỀ 2",
                "Câu 1. B. Nước sôi ở 100 độ C.",
                "Câu 2. A. Mặt trời mọc ở hướng Đông."
            };

            var questions = DocxStateMachineClassifier.ParseParagraphList(paragraphs);

            Assert.Equal(4, questions.Count);

            var de1Q1 = questions.FirstOrDefault(q => q.SourceExamName == "DE_01" && q.SourceQuestionNo == "1");
            var de1Q2 = questions.FirstOrDefault(q => q.SourceExamName == "DE_01" && q.SourceQuestionNo == "2");
            var de2Q1 = questions.FirstOrDefault(q => q.SourceExamName == "DE_02" && q.SourceQuestionNo == "1");
            var de2Q2 = questions.FirstOrDefault(q => q.SourceExamName == "DE_02" && q.SourceQuestionNo == "2");

            Assert.NotNull(de1Q1);
            Assert.NotNull(de1Q2);
            Assert.NotNull(de2Q1);
            Assert.NotNull(de2Q2);

            // FullQuestionIndex 5-tier check
            Assert.Equal("1_1_0_0_1", de1Q1.FullQuestionIndex);
            Assert.Equal("1_1_0_0_2", de1Q2.FullQuestionIndex);
            Assert.Equal("2_1_0_0_1", de2Q1.FullQuestionIndex);
            Assert.Equal("2_1_0_0_2", de2Q2.FullQuestionIndex);

            // Answers correctly attributed to each exam's questions
            Assert.Equal("1", de1Q1.SuggestedAnswer); // A
            Assert.Equal("2", de1Q2.SuggestedAnswer); // B
            Assert.Equal("2", de2Q1.SuggestedAnswer); // B
            Assert.Equal("1", de2Q2.SuggestedAnswer); // A

            // Explanations correctly attributed
            Assert.Contains("Hà Nội là thủ đô", de1Q1.AiExplanation);
            Assert.Contains("1 + 1 = 2", de1Q2.AiExplanation);
            Assert.Contains("100 độ C", de2Q1.AiExplanation);
            Assert.Contains("hướng Đông", de2Q2.AiExplanation);
        }

        [Fact]
        public void MultiExam_ConsolidatedSolutionsAtEnd_ShouldResolveByTargetExamHeading()
        {
            var paragraphs = new List<string>
            {
                // Đề 1
                "ĐỀ 1",
                "PHẦN I. Trắc nghiệm",
                "Câu 1. Câu hỏi 1 của Đề 1",
                "A. PA 1",
                "B. PA 2",
                "C. PA 3",
                "D. PA 4",

                // Đề 2
                "ĐỀ 2",
                "PHẦN I. Trắc nghiệm",
                "Câu 1. Câu hỏi 1 của Đề 2",
                "A. PA 1",
                "B. PA 2",
                "C. PA 3",
                "D. PA 4",

                // Phần giải tập trung ở cuối file
                "HƯỚNG DẪN GIẢI CHI TIẾT",
                "ĐỀ 1",
                "Câu 1. C. Giải thích Đề 1 Câu 1",
                "ĐỀ 2",
                "Câu 1. D. Giải thích Đề 2 Câu 1"
            };

            var questions = DocxStateMachineClassifier.ParseParagraphList(paragraphs);

            Assert.Equal(2, questions.Count);

            var de1Q1 = questions.FirstOrDefault(q => q.SourceExamName == "DE_01" && q.SourceQuestionNo == "1");
            var de2Q1 = questions.FirstOrDefault(q => q.SourceExamName == "DE_02" && q.SourceQuestionNo == "1");

            Assert.NotNull(de1Q1);
            Assert.NotNull(de2Q1);

            Assert.Equal("1_1_0_0_1", de1Q1.FullQuestionIndex);
            Assert.Equal("2_1_0_0_1", de2Q1.FullQuestionIndex);

            Assert.Equal("3", de1Q1.SuggestedAnswer); // C
            Assert.Equal("4", de2Q1.SuggestedAnswer); // D

            Assert.Contains("Giải thích Đề 1", de1Q1.AiExplanation);
            Assert.Contains("Giải thích Đề 2", de2Q1.AiExplanation);
        }
    }
}

