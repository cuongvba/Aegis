using System;
using System.Collections.Generic;
using Xunit;
using Xunit.Abstractions;
using AegisQuiz.Infrastructure.Services.Docx;

namespace AegisQuiz.UnitTests
{
    public class OptionParsingBugInvestigationTest
    {
        private readonly ITestOutputHelper _output;

        public OptionParsingBugInvestigationTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void InvestigateWhyOptionsSplitIncorrectly()
        {
            var paragraphs = new List<string>
            {
                "Câu 1. Nghiệm của phương trình log_{3}(x-1) =1  là",
                "A. x= 5 .  B. x= 3 .  C. x= 2 .  D. x= 4 ."
            };

            var questions = DocxStateMachineClassifier.ParseParagraphList(paragraphs);
            var q = questions[0];

            _output.WriteLine($"Options count: {q.Options?.Count}");
            for (int i = 0; i < q.Options?.Count; i++)
            {
                _output.WriteLine($"Option {i}: '{q.Options[i]}'");
            }
        }
    }
}
