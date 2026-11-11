using System.Linq;
using Aegis.Infrastructure.Services;
using Aegis.Infrastructure.Services.Docx;
using Xunit;
using Xunit.Abstractions;

namespace Aegis.UnitTests
{
    public class TestDisjointContextSegmentation
    {
        private readonly ITestOutputHelper _output;

        public TestDisjointContextSegmentation(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void TestMultiplePassagesHaveSeparateIndexedContexts()
        {
            var scopeManager = new CognitiveScopeManager();

            // Passage 1: Questions 1..5
            scopeManager.RegisterContextPassage(
                startQ: 1,
                endQ: 5,
                content: "Passage 1 Content: Do you want to be fitter and healthier?",
                title: "Read the following passage and choose the letter A, B, C or D"
            );

            // Passage 2: Questions 6..10
            scopeManager.RegisterContextPassage(
                startQ: 6,
                endQ: 10,
                content: "Passage 2 Content: Our school holds a Sports Day event every year.",
                title: "Read the following passage and choose the letter A, B, C or D"
            );

            // Check Question 3 (belongs to Passage 1)
            var ctxQ3 = scopeManager.ResolveContextForQuestion(3);
            Assert.NotNull(ctxQ3);
            _output.WriteLine($"Q3 Context Title: {ctxQ3.ContextTitle}");
            _output.WriteLine($"Q3 Context Content: {ctxQ3.ContextContent}");
            Assert.Contains("[Ngữ cảnh #1]", ctxQ3.ContextTitle);
            Assert.Contains("fitter and healthier", ctxQ3.ContextContent);
            Assert.DoesNotContain("Sports Day", ctxQ3.ContextContent);

            // Check Question 8 (belongs to Passage 2)
            var ctxQ8 = scopeManager.ResolveContextForQuestion(8);
            Assert.NotNull(ctxQ8);
            _output.WriteLine($"Q8 Context Title: {ctxQ8.ContextTitle}");
            _output.WriteLine($"Q8 Context Content: {ctxQ8.ContextContent}");
            Assert.Contains("[Ngữ cảnh #2]", ctxQ8.ContextTitle);
            Assert.Contains("Sports Day", ctxQ8.ContextContent);
            Assert.DoesNotContain("fitter and healthier", ctxQ8.ContextContent);
        }

        [Fact]
        public void TestOpenEndedPassageAutoClosesWhenNextPassageAppears()
        {
            var scopeManager = new CognitiveScopeManager();

            // Passage 1 starts open-ended at Q1
            scopeManager.RegisterContextPassage(
                startQ: 1,
                endQ: int.MaxValue,
                content: "Open Passage 1 text.",
                title: "Passage 1 Title",
                contextId: null,
                level: Aegis.Application.DTOs.ScopeHierarchyLevel.GroupDirective,
                isOpenEnded: true
            );

            // Passage 2 starts at Q6
            scopeManager.RegisterContextPassage(
                startQ: 6,
                endQ: int.MaxValue,
                content: "Open Passage 2 text.",
                title: "Passage 2 Title",
                contextId: null,
                level: Aegis.Application.DTOs.ScopeHierarchyLevel.GroupDirective,
                isOpenEnded: true
            );

            // Check Q2 (Passage 1 should now be capped at Q5)
            var ctxQ2 = scopeManager.ResolveContextForQuestion(2);
            Assert.NotNull(ctxQ2);
            Assert.Contains("[Ngữ cảnh #1]", ctxQ2.ContextTitle);
            Assert.Equal("Open Passage 1 text.", ctxQ2.ContextContent);
            Assert.Equal(5, ctxQ2.EndQuestion);

            // Check Q7 (Passage 2)
            var ctxQ7 = scopeManager.ResolveContextForQuestion(7);
            Assert.NotNull(ctxQ7);
            Assert.Contains("[Ngữ cảnh #2]", ctxQ7.ContextTitle);
            Assert.Equal("Open Passage 2 text.", ctxQ7.ContextContent);
        }
    }
}

