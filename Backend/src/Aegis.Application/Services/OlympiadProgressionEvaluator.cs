using System;
using System.Collections.Generic;
using System.Linq;

namespace Aegis.Application.Services
{
    public enum OlympiadTier
    {
        Practice = 0,
        School = 1,
        District = 2,
        Province = 3,
        National = 4
    }

    public sealed class OlympiadTierGateRule
    {
        public OlympiadTier Tier { get; set; }
        public string TierName { get; set; } = string.Empty;
        public int RequiredCompletedPracticeRounds { get; set; }
        public double MinAverageAccuracyRatio { get; set; } = 0.5;
    }

    public sealed class OlympiadStageConfig
    {
        public int TotalPracticeRounds { get; set; } = 35;
        public List<OlympiadTierGateRule> TierGates { get; set; } = new()
        {
            new() { Tier = OlympiadTier.School,   TierName = "Cấp Trường",        RequiredCompletedPracticeRounds = 15, MinAverageAccuracyRatio = 0.5 },
            new() { Tier = OlympiadTier.District, TierName = "Cấp Quận / Huyện",  RequiredCompletedPracticeRounds = 20, MinAverageAccuracyRatio = 0.6 },
            new() { Tier = OlympiadTier.Province, TierName = "Cấp Tỉnh / TP",     RequiredCompletedPracticeRounds = 25, MinAverageAccuracyRatio = 0.7 },
            new() { Tier = OlympiadTier.National, TierName = "Cấp Quốc gia",      RequiredCompletedPracticeRounds = 30, MinAverageAccuracyRatio = 0.8 }
        };
    }

    public sealed record OlympiadRoundRecord(
        int RoundNumber,
        OlympiadTier Tier,
        double Score,
        double MaxScore,
        int DurationSeconds,
        bool IsCommitted);

    public sealed class OlympiadProgressionStatus
    {
        public int CompletedPracticeRounds { get; init; }
        public int UnlockedPracticeRound { get; init; }
        public OlympiadTier HighestEligibleOfficialTier { get; init; }
        public List<OlympiadTier> UnlockedOfficialTiers { get; init; } = new();
        public OlympiadTier? NextLockedTier { get; init; }
        public int RoundsNeededForNextTier { get; init; }
        public double AveragePracticeAccuracy { get; init; }
        public long CompositeLeaderboardScore { get; init; }
    }

    /// <summary>
    /// [Sequential Olympiad Gate & Composite Leaderboard Engine] (Zero-Hardcode / Data-Driven)
    /// Mô hình hóa lộ trình 35 vòng tự luyện tuần tự -> mở khóa các cấp thi chính thức (Trường/Quận/Tỉnh/Quốc gia)
    /// và chấm điểm xếp hạng ưu tiên Độ chính xác trước, Tốc độ sau (IOE-Grade Olympiad Standard).
    /// </summary>
    public static class OlympiadProgressionEvaluator
    {
        public static OlympiadProgressionStatus Evaluate(
            IEnumerable<OlympiadRoundRecord> records,
            OlympiadStageConfig? config = null)
        {
            config ??= new OlympiadStageConfig();
            var list = (records ?? Enumerable.Empty<OlympiadRoundRecord>()).ToList();

            var committedPractice = list
                .Where(r => r.Tier == OlympiadTier.Practice && r.IsCommitted && r.RoundNumber >= 1)
                .GroupBy(r => r.RoundNumber)
                .Select(g => g.OrderByDescending(x => x.Score).First())
                .OrderBy(r => r.RoundNumber)
                .ToList();

            // Tính số vòng tự luyện liên tiếp đã hoàn thành từ vòng 1
            int contiguousCompleted = 0;
            var completedSet = committedPractice.Select(r => r.RoundNumber).ToHashSet();
            for (int r = 1; r <= config.TotalPracticeRounds; r++)
            {
                if (completedSet.Contains(r)) contiguousCompleted++;
                else break;
            }

            int unlockedPracticeRound = Math.Min(config.TotalPracticeRounds, contiguousCompleted + 1);
            double avgAccuracy = committedPractice.Count > 0
                ? committedPractice.Average(r => r.MaxScore > 0 ? Math.Clamp(r.Score / r.MaxScore, 0.0, 1.0) : 0.0)
                : 0.0;

            var unlockedTiers = new List<OlympiadTier> { OlympiadTier.Practice };
            OlympiadTier highestTier = OlympiadTier.Practice;
            OlympiadTier? nextLocked = null;
            int roundsNeeded = 0;

            foreach (var gate in config.TierGates.OrderBy(g => g.RequiredCompletedPracticeRounds))
            {
                bool meetsRounds = contiguousCompleted >= gate.RequiredCompletedPracticeRounds;
                bool meetsAccuracy = avgAccuracy >= gate.MinAverageAccuracyRatio;

                if (meetsRounds && meetsAccuracy)
                {
                    unlockedTiers.Add(gate.Tier);
                    highestTier = gate.Tier;
                }
                else if (nextLocked == null)
                {
                    nextLocked = gate.Tier;
                    roundsNeeded = Math.Max(0, gate.RequiredCompletedPracticeRounds - contiguousCompleted);
                }
            }

            // Điểm xếp hạng tổng hợp: Độ chính xác là trọng số chính (x10000), Tốc độ (DurationSeconds) là tie-breaker
            long totalComposite = list
                .Where(r => r.IsCommitted)
                .Sum(r => ComputeCompositeScore(r.Score, r.DurationSeconds));

            return new OlympiadProgressionStatus
            {
                CompletedPracticeRounds = contiguousCompleted,
                UnlockedPracticeRound = unlockedPracticeRound,
                HighestEligibleOfficialTier = highestTier,
                UnlockedOfficialTiers = unlockedTiers,
                NextLockedTier = nextLocked,
                RoundsNeededForNextTier = roundsNeeded,
                AveragePracticeAccuracy = Math.Round(avgAccuracy, 4),
                CompositeLeaderboardScore = totalComposite
            };
        }

        /// <summary>
        /// Tính điểm xếp hạng chuẩn Olympiad: (Score * 10,000) - DurationSeconds.
        /// Người có điểm cao hơn luôn xếp trên; khi bằng điểm, người làm nhanh hơn xếp trên.
        /// </summary>
        public static long ComputeCompositeScore(double score, int durationSeconds)
        {
            long scoreComponent = (long)Math.Round(Math.Max(0, score) * 10_000);
            long timePenalty = Math.Clamp(durationSeconds, 0, 9_999);
            return Math.Max(0, scoreComponent - timePenalty);
        }
    }
}
