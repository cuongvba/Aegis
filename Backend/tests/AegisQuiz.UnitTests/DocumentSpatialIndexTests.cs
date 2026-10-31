using System.Collections.Generic;
using AegisQuiz.Application.DTOs;
using AegisQuiz.Application.Interfaces;
using AegisQuiz.Infrastructure.Services.Docx;
using Xunit;

namespace AegisQuiz.UnitTests
{
    public class DocumentSpatialIndexTests
    {
        [Fact]
        public void RegisterAndResolve_Exact5D_ShouldReturnExact5DTier()
        {
            var index = new DocumentSpatialIndex();
            var q = new DocxImportPreviewDto
            {
                Content = "Question 1 Content",
                SourceExamName = "DE_103",
                SourceQuestionNo = "1",
                HierarchyIndex = "103_1_0_0"
            };

            var addr = new QuestionAddress(103, 1, 0, 0, 1);
            index.Register(q, addr);

            var resolution = index.Resolve(addr);
            Assert.True(resolution.IsSuccess);
            Assert.Equal(SpatialResolutionTier.Exact5D, resolution.Tier);
            Assert.Same(q, resolution.Question);
            Assert.Equal("103_1_0_0_1", q.FullQuestionIndex);
        }

        [Fact]
        public void Resolve_ExamPartQFallback_WhenSubSectionAndDirectiveDiffer_ShouldMatch()
        {
            var index = new DocumentSpatialIndex();
            var q = new DocxImportPreviewDto
            {
                Content = "Question 5 Content",
                SourceExamName = "DE_01",
                SourceQuestionNo = "5",
                HierarchyIndex = "1_2_1_1"
            };

            var registeredAddr = new QuestionAddress(1, 2, 1, 1, 5);
            index.Register(q, registeredAddr);

            // In solution phase, section was identified as Part 2 but subsection/directive was reset to 0
            var queryAddr = new QuestionAddress(1, 2, 0, 0, 5);
            var resolution = index.Resolve(queryAddr);

            Assert.True(resolution.IsSuccess);
            Assert.Equal(SpatialResolutionTier.ExamPartQ, resolution.Tier);
            Assert.Same(q, resolution.Question);
        }

        [Fact]
        public void Resolve_ExamQFallback_WhenPartUnknownAndUniqueInExam_ShouldMatch()
        {
            var index = new DocumentSpatialIndex();
            var q = new DocxImportPreviewDto
            {
                Content = "Question 15 Unique",
                SourceExamName = "DE_02",
                SourceQuestionNo = "15",
                HierarchyIndex = "2_1_0_0"
            };

            index.Register(q, new QuestionAddress(2, 1, 0, 0, 15));

            // Query with part=0 (no part info in solution header)
            var queryAddr = new QuestionAddress(2, 0, 0, 0, 15);
            var resolution = index.Resolve(queryAddr);

            Assert.True(resolution.IsSuccess);
            Assert.Equal(SpatialResolutionTier.ExamQ, resolution.Tier);
            Assert.Same(q, resolution.Question);
        }

        [Fact]
        public void Resolve_WhenSameQuestionNumberInMultipleParts_AndPartUnknown_ShouldMarkAmbiguous()
        {
            var index = new DocumentSpatialIndex();
            var qPart1 = new DocxImportPreviewDto
            {
                Content = "Part 1 Question 1",
                SourceExamName = "DE_103",
                SourceQuestionNo = "1",
                HierarchyIndex = "103_1_0_0"
            };
            var qPart2 = new DocxImportPreviewDto
            {
                Content = "Part 2 Question 1",
                SourceExamName = "DE_103",
                SourceQuestionNo = "1",
                HierarchyIndex = "103_2_0_0"
            };

            index.Register(qPart1, new QuestionAddress(103, 1, 0, 0, 1));
            index.Register(qPart2, new QuestionAddress(103, 2, 0, 0, 1));

            // Query with part=0 -> ambiguous because there are 2 candidates in Exam 103
            var queryAddr = new QuestionAddress(103, 0, 0, 0, 1);
            var resolution = index.Resolve(queryAddr);

            Assert.False(resolution.IsSuccess);
            Assert.Equal(SpatialResolutionTier.Ambiguous, resolution.Tier);
            Assert.Null(resolution.Question);
        }

        [Fact]
        public void TotalRegisteredQuestions_AndClear_ShouldWorkCorrectly()
        {
            var index = new DocumentSpatialIndex();
            var q = new DocxImportPreviewDto
            {
                Content = "Q1",
                SourceExamName = "DE_01",
                SourceQuestionNo = "1",
                HierarchyIndex = "1_1_0_0"
            };
            index.Register(q, new QuestionAddress(1, 1, 0, 0, 1));
            Assert.Equal(1, index.TotalRegisteredQuestions);

            index.Clear();
            Assert.Equal(0, index.TotalRegisteredQuestions);
            Assert.False(index.Resolve(new QuestionAddress(1, 1, 0, 0, 1)).IsSuccess);
        }
    }
}
