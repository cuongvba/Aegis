using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text.Json;
using Aegis.Application.DTOs;
using Aegis.Application.Interfaces;
using Aegis.Application.Services;
using Aegis.Domain.Entities;
using Aegis.Infrastructure.Transpiler;
using Xunit;

namespace Aegis.UnitTests
{
    public class OlympiadProgressionTests
    {
        [Fact]
        public void SequentialRounds_ShouldUnlockProgressively_AndGateOfficialTiers()
        {
            var records = Enumerable.Range(1, 16)
                .Select(r => new OlympiadRoundRecord(r, OlympiadTier.Practice, 280, 300, 420, true))
                .ToList();

            var status = OlympiadProgressionEvaluator.Evaluate(records);

            Assert.Equal(16, status.CompletedPracticeRounds);
            Assert.Equal(17, status.UnlockedPracticeRound);
            Assert.Equal(OlympiadTier.School, status.HighestEligibleOfficialTier);
            Assert.Contains(OlympiadTier.School, status.UnlockedOfficialTiers);
            Assert.DoesNotContain(OlympiadTier.District, status.UnlockedOfficialTiers);
            Assert.Equal(OlympiadTier.District, status.NextLockedTier);
            Assert.Equal(4, status.RoundsNeededForNextTier);
        }

        [Fact]
        public void CompositeLeaderboardScore_ShouldPrioritizeAccuracyThenSpeed()
        {
            long highScoreSlow = OlympiadProgressionEvaluator.ComputeCompositeScore(1950, 1750);
            long sameScoreFast = OlympiadProgressionEvaluator.ComputeCompositeScore(1950, 980);
            long lowerScoreFast = OlympiadProgressionEvaluator.ComputeCompositeScore(1940, 600);

            Assert.True(sameScoreFast > highScoreSlow);
            Assert.True(highScoreSlow > lowerScoreFast);
        }

        [Fact]
        public void SpeakOutQuestion_ShouldEvaluatePronunciationTokenAccuracy()
        {
            var q = new SpeakOutQuestion
            {
                Payload = JsonDocument.Parse("{\"targetPhrase\":\"The quick brown fox jumps\",\"minAccuracy\":0.75}")
            };

            Assert.True(q.EvaluateAnswer("The quick brown fox jumps!") >= 0.99);
            Assert.True(q.EvaluateAnswer("The quick brown fox") >= 0.75);
            Assert.Equal(0.0, q.EvaluateAnswer("Hello world"));
        }

        [Fact]
        public void HandwritingQuestion_ShouldEvaluateStrokesAndCoverage()
        {
            var hw = new HandwritingQuestion
            {
                Payload = JsonDocument.Parse("{\"targetGlyph\":\"A\",\"minStrokes\":2}")
            };

            Assert.Equal(1.0, hw.EvaluateAnswer("{\"strokes\":3,\"coveragePct\":12.5}"));
            Assert.Equal(0.0, hw.EvaluateAnswer("{\"strokes\":1,\"coveragePct\":12.5}"));
            Assert.Equal(0.0, hw.EvaluateAnswer(""));
        }

        [Fact]
        public void Scorm12PackageExport_ShouldGenerateValidManifestAndPlayer()
        {
            var strategy = new Scorm12PackageExportStrategy();
            var questions = new List<DocxImportPreviewDto>
            {
                new()
                {
                    Content = "What is 2 + 2?",
                    QuestionType = "SINGLE",
                    Options = new() { "3", "4", "5", "6" },
                    SuggestedAnswer = "2"
                }
            };

            var zipBytes = strategy.Transpile(questions, new TranspileOptionsDto { ExamTitle = "Aegis SCORM Demo" });
            Assert.NotEmpty(zipBytes);

            using var ms = new MemoryStream(zipBytes);
            using var archive = new ZipArchive(ms, ZipArchiveMode.Read);
            var manifestEntry = archive.GetEntry("imsmanifest.xml");
            var playerEntry = archive.GetEntry("index.html");
            Assert.NotNull(manifestEntry);
            Assert.NotNull(playerEntry);

            using var mr = new StreamReader(manifestEntry!.Open());
            var manifestXml = mr.ReadToEnd();
            Assert.Contains("ADL SCORM", manifestXml);
            Assert.Contains("<schemaversion>1.2</schemaversion>", manifestXml);

            using var pr = new StreamReader(playerEntry!.Open());
            var playerHtml = pr.ReadToEnd();
            Assert.Contains("LMSInitialize", playerHtml);
            Assert.Contains("cmi.core.score.raw", playerHtml);
        }
    }
}
