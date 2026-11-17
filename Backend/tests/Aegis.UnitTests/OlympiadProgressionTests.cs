using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Aegis.Application.Services;
using Aegis.Domain.Entities;
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
    }
}
