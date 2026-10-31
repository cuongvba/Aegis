using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AegisQuiz.Application.Interfaces;

namespace AegisQuiz.Infrastructure.Services
{
    // ── IIRTService Interface ──────────────────────────────────────────────────
    public interface IIRTService
    {
        /// <summary>Bắt đầu phiên CAT mới — trả về session_id + câu hỏi đầu tiên.</summary>
        Task<CATStartResult> StartCATSessionAsync(string userId, List<QuestionIRTParam> bank, CATConfigParam config);

        /// <summary>Gửi câu trả lời — trả về theta mới + câu hỏi tiếp theo (hoặc báo cáo kết quả).</summary>
        Task<CATRespondResult> RespondAsync(string sessionId, bool isCorrect, int timeSpentSecs);

        /// <summary>Lấy kết quả cuối phiên CAT.</summary>
        Task<CATReport> GetResultAsync(string sessionId);

        /// <summary>Ước lượng năng lực người học từ lịch sử làm bài (ngoài phiên CAT).</summary>
        Task<AbilityEstimate> EstimateAbilityAsync(List<IRTResponse> responses);
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────
    public class QuestionIRTParam
    {
        public string QuestionId { get; set; } = string.Empty;
        public double A          { get; set; } = 1.0;
        public double B          { get; set; } = 0.0;
        public double C          { get; set; } = 0.25;
        public string TopicCode  { get; set; } = string.Empty;
        public int    Difficulty { get; set; } = 3;
    }

    public class CATConfigParam
    {
        public int    MinItems     { get; set; } = 5;
        public int    MaxItems     { get; set; } = 20;
        public double SeThreshold  { get; set; } = 0.3;
        public double InitialTheta { get; set; } = 0.0;
        public string? TopicCode   { get; set; }
        public double MaxExposureRate { get; set; } = 0.25;
    }

    public class CATStartResult
    {
        public string SessionId    { get; set; } = string.Empty;
        public string QuestionId   { get; set; } = string.Empty;
        public double CurrentTheta { get; set; } = 0.0;
        public int    MaxItems     { get; set; }
    }

    public class CATRespondResult
    {
        public bool       Finished       { get; set; }
        public string?    NextQuestionId { get; set; }
        public double     CurrentTheta   { get; set; }
        public double     Se             { get; set; }
        public int        NAdministered  { get; set; }
        public CATReport? Report         { get; set; }
    }

    public class CATReport
    {
        public string SessionId     { get; set; } = string.Empty;
        public double Theta         { get; set; }
        public double Se            { get; set; }
        public double Percentile    { get; set; }
        public string Level         { get; set; } = string.Empty;
        public int    NItems        { get; set; }
        public double Accuracy      { get; set; }
        public string FinishReason  { get; set; } = string.Empty;
        public string EngineVersion { get; set; } = string.Empty;
    }

    public class IRTResponse
    {
        public double A         { get; set; } = 1.0;
        public double B         { get; set; } = 0.0;
        public double C         { get; set; } = 0.25;
        public bool   IsCorrect { get; set; }
    }

    public class AbilityEstimate
    {
        public double Theta      { get; set; }
        public double Se         { get; set; }
        public double Percentile { get; set; }
        public string Level      { get; set; } = string.Empty;
    }

    // ── IRT Service Implementation ─────────────────────────────────────────────
    /// <summary>
    /// [Phase C — 2030 Psychometric Singularity Upgrade]
    /// Động cơ Khảo thí Thích ứng Lai (Hybrid Python FastAPI + Native C# 3-PL IRT EAP & Sympson-Hetter Exposure Control):
    /// - Ưu tiên kết nối tới Python FastAPI IRT Microservice khi khả dụng.
    /// - Tự động kích hoạt Native C# 3-PL EAP (41-Point Quadrature) + Fisher Information + Sympson-Hetter Exposure Control
    ///   ngay trong tiến trình .NET khi chạy độc lập hoặc khi dịch vụ Python ngoài gián đoạn (Zero-Downtime Resilience).
    /// </summary>
    public class IrtHttpService : IIRTService
    {
        private readonly IHttpClientFactory? _httpFactory;
        private readonly JsonSerializerOptions _jsonOptions;

        private const double LogisticScalingD = 1.702;

        // Trạng thái phiên CAT nội bộ & bộ đếm độ phơi nhiễm câu hỏi (Sympson-Hetter Item Exposure Control)
        private static readonly ConcurrentDictionary<string, LocalCatSessionState> _localSessions = new();
        private static readonly ConcurrentDictionary<string, int> _itemExposureCounts = new();
        private static int _totalSessionsCount = 0;

        private sealed class LocalCatSessionState
        {
            public string SessionId { get; init; } = string.Empty;
            public string UserId { get; init; } = string.Empty;
            public List<QuestionIRTParam> Bank { get; init; } = new();
            public CATConfigParam Config { get; init; } = new();
            public HashSet<string> AdministeredIds { get; } = new();
            public List<IRTResponse> Responses { get; } = new();
            public QuestionIRTParam? CurrentItem { get; set; }
            public double CurrentTheta { get; set; }
            public double CurrentSe { get; set; } = 1.0;
            public CATReport? FinalReport { get; set; }
        }

        public IrtHttpService(IHttpClientFactory? httpFactory = null)
        {
            _httpFactory = httpFactory;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy        = JsonNamingPolicy.SnakeCaseLower,
                PropertyNameCaseInsensitive = true,
            };
        }

        public static void ResetExposureStatistics()
        {
            _itemExposureCounts.Clear();
            Interlocked.Exchange(ref _totalSessionsCount, 0);
        }

        public static int GetItemExposureCount(string questionId)
            => _itemExposureCounts.GetValueOrDefault(questionId, 0);

        public async Task<CATStartResult> StartCATSessionAsync(
            string userId, List<QuestionIRTParam> bank, CATConfigParam config)
        {
            config ??= new CATConfigParam();
            bank ??= new List<QuestionIRTParam>();
            Interlocked.Increment(ref _totalSessionsCount);

            if (_httpFactory != null)
            {
                try
                {
                    var payload = new
                    {
                        user_id       = userId,
                        question_bank = bank.Select(q => new
                        {
                            question_id = q.QuestionId,
                            a = q.A, b = q.B, c = q.C,
                            topic_code  = q.TopicCode,
                            difficulty  = q.Difficulty
                        }),
                        config = new
                        {
                            min_items     = config.MinItems,
                            max_items     = config.MaxItems,
                            se_threshold  = config.SeThreshold,
                            initial_theta = config.InitialTheta,
                            topic_code    = config.TopicCode
                        }
                    };

                    var response = await PostAsync("/cat/start", payload);
                    var remoteResult = JsonSerializer.Deserialize<CATStartResult>(response, _jsonOptions);
                    if (remoteResult != null && !string.IsNullOrWhiteSpace(remoteResult.SessionId))
                    {
                        if (!string.IsNullOrWhiteSpace(remoteResult.QuestionId))
                        {
                            _itemExposureCounts.AddOrUpdate(remoteResult.QuestionId, 1, (_, c) => c + 1);
                        }
                        return remoteResult;
                    }
                }
                catch
                {
                    // Tự động chuyển sang Native C# 3-PL IRT Psychometric Engine (Zero-Downtime Fallback)
                }
            }

            return StartNativeCatSession(userId, bank, config);
        }

        public async Task<CATRespondResult> RespondAsync(string sessionId, bool isCorrect, int timeSpentSecs)
        {
            if (_httpFactory != null && !_localSessions.ContainsKey(sessionId))
            {
                try
                {
                    var payload = new
                    {
                        session_id      = sessionId,
                        is_correct      = isCorrect,
                        time_spent_secs = timeSpentSecs
                    };

                    var response = await PostAsync($"/cat/{sessionId}/respond", payload);
                    var remoteResult = JsonSerializer.Deserialize<CATRespondResult>(response, _jsonOptions);
                    if (remoteResult != null)
                    {
                        if (!string.IsNullOrWhiteSpace(remoteResult.NextQuestionId))
                        {
                            _itemExposureCounts.AddOrUpdate(remoteResult.NextQuestionId, 1, (_, c) => c + 1);
                        }
                        return remoteResult;
                    }
                }
                catch
                {
                    // Fallback về Native C# CAT Session nếu có
                }
            }

            return RespondNativeCatSession(sessionId, isCorrect);
        }

        public async Task<CATReport> GetResultAsync(string sessionId)
        {
            if (_localSessions.TryGetValue(sessionId, out var localSession) && localSession.FinalReport != null)
            {
                return localSession.FinalReport;
            }

            if (_httpFactory != null)
            {
                try
                {
                    var client   = _httpFactory.CreateClient("irt-service");
                    var response = await client.GetStringAsync($"/cat/{sessionId}/result");
                    var remoteReport = JsonSerializer.Deserialize<CATReport>(response, _jsonOptions);
                    if (remoteReport != null) return remoteReport;
                }
                catch
                {
                    // Fallback
                }
            }

            if (_localSessions.TryGetValue(sessionId, out var s))
            {
                return BuildCatReport(s, "IN_PROGRESS_SNAPSHOT");
            }

            return new CATReport { SessionId = sessionId, EngineVersion = "AegisNative-3PL-EAP-v2030" };
        }

        public async Task<AbilityEstimate> EstimateAbilityAsync(List<IRTResponse> responses)
        {
            if (_httpFactory != null)
            {
                try
                {
                    var payload = responses.Select(r => new
                    {
                        a          = r.A,
                        b          = r.B,
                        c          = r.C,
                        is_correct = r.IsCorrect ? 1 : 0
                    });

                    var response = await PostAsync("/irt/ability-estimate", payload);
                    var remoteEst = JsonSerializer.Deserialize<AbilityEstimate>(response, _jsonOptions);
                    if (remoteEst != null) return remoteEst;
                }
                catch
                {
                    // Fallback sang thuật toán tích phân 41 nút Quadrature EAP nội tại
                }
            }

            return ComputeNativeEapAbility(responses ?? new List<IRTResponse>(), 0.0);
        }

        // ── Native C# 3-PL IRT EAP & Sympson-Hetter CAT Engine ─────────────────

        private static CATStartResult StartNativeCatSession(
            string userId, List<QuestionIRTParam> bank, CATConfigParam config)
        {
            string sessionId = $"cat_native_{Guid.NewGuid():N}";
            double initTheta = Math.Clamp(config.InitialTheta, -3.5, 3.5);

            var filteredBank = string.IsNullOrWhiteSpace(config.TopicCode)
                ? bank
                : bank.Where(q => string.Equals(q.TopicCode, config.TopicCode, StringComparison.OrdinalIgnoreCase)).ToList();

            if (filteredBank.Count == 0) filteredBank = bank;

            var session = new LocalCatSessionState
            {
                SessionId    = sessionId,
                UserId       = userId,
                Bank         = filteredBank,
                Config       = config,
                CurrentTheta = initTheta,
                CurrentSe    = 1.0
            };

            var firstItem = SelectNextOptimalItemSympsonHetter(session);
            session.CurrentItem = firstItem;
            if (firstItem != null)
            {
                session.AdministeredIds.Add(firstItem.QuestionId);
                _itemExposureCounts.AddOrUpdate(firstItem.QuestionId, 1, (_, c) => c + 1);
            }

            _localSessions[sessionId] = session;

            return new CATStartResult
            {
                SessionId    = sessionId,
                QuestionId   = firstItem?.QuestionId ?? string.Empty,
                CurrentTheta = initTheta,
                MaxItems     = Math.Min(config.MaxItems, Math.Max(1, filteredBank.Count))
            };
        }

        private static CATRespondResult RespondNativeCatSession(string sessionId, bool isCorrect)
        {
            if (!_localSessions.TryGetValue(sessionId, out var session))
            {
                return new CATRespondResult { Finished = true, CurrentTheta = 0.0, Se = 1.0 };
            }

            var item = session.CurrentItem ?? new QuestionIRTParam { A = 1.0, B = session.CurrentTheta, C = 0.25 };
            session.Responses.Add(new IRTResponse
            {
                A         = item.A,
                B         = item.B,
                C         = item.C,
                IsCorrect = isCorrect
            });

            var est = ComputeNativeEapAbility(session.Responses, session.Config.InitialTheta);
            session.CurrentTheta = est.Theta;
            session.CurrentSe    = est.Se;

            int nAdmin = session.Responses.Count;
            bool minReached = nAdmin >= Math.Max(1, session.Config.MinItems);
            bool maxReached = nAdmin >= Math.Max(1, session.Config.MaxItems);
            bool seConverged = minReached && session.CurrentSe <= session.Config.SeThreshold;
            bool bankExhausted = session.AdministeredIds.Count >= session.Bank.Count;

            if (seConverged || maxReached || bankExhausted)
            {
                string reason = seConverged
                    ? "SE_THRESHOLD_CONVERGED"
                    : (maxReached ? "MAX_ITEMS_REACHED" : "BANK_EXHAUSTED");

                var report = BuildCatReport(session, reason);
                session.FinalReport = report;

                return new CATRespondResult
                {
                    Finished       = true,
                    NextQuestionId = null,
                    CurrentTheta   = session.CurrentTheta,
                    Se             = session.CurrentSe,
                    NAdministered  = nAdmin,
                    Report         = report
                };
            }

            var nextItem = SelectNextOptimalItemSympsonHetter(session);
            session.CurrentItem = nextItem;
            if (nextItem != null)
            {
                session.AdministeredIds.Add(nextItem.QuestionId);
                _itemExposureCounts.AddOrUpdate(nextItem.QuestionId, 1, (_, c) => c + 1);
            }

            return new CATRespondResult
            {
                Finished       = false,
                NextQuestionId = nextItem?.QuestionId,
                CurrentTheta   = session.CurrentTheta,
                Se             = session.CurrentSe,
                NAdministered  = nAdmin,
                Report         = null
            };
        }

        /// <summary>
        /// Lựa chọn câu hỏi tiếp theo bằng cách cực đại hóa Hàm Thông tin Fisher I_i(theta)
        /// kết hợp điều tiết độ phơi nhiễm Sympson-Hetter (chống lặp các câu hỏi có hệ số phân biệt a cao).
        /// </summary>
        private static QuestionIRTParam? SelectNextOptimalItemSympsonHetter(LocalCatSessionState session)
        {
            var candidates = session.Bank
                .Where(q => !session.AdministeredIds.Contains(q.QuestionId))
                .ToList();

            if (candidates.Count == 0) return null;

            int totalSessions = Math.Max(1, _totalSessionsCount);
            double rMax = Math.Clamp(session.Config.MaxExposureRate, 0.05, 1.0);

            QuestionIRTParam? bestItem = null;
            double bestScore = double.NegativeInfinity;

            foreach (var q in candidates)
            {
                double fisherInfo = ComputeFisherInformation3PL(session.CurrentTheta, q.A, q.B, q.C);

                // Sympson-Hetter Exposure Control Weight P(K_i)
                int exposures = _itemExposureCounts.GetValueOrDefault(q.QuestionId, 0);
                double empiricalExposureRate = (double)exposures / totalSessions;
                double exposureControlWeight = empiricalExposureRate > rMax && totalSessions >= 4
                    ? Math.Pow(rMax / empiricalExposureRate, 1.5)
                    : 1.0;

                double effectiveScore = fisherInfo * exposureControlWeight;
                if (effectiveScore > bestScore)
                {
                    bestScore = effectiveScore;
                    bestItem = q;
                }
            }

            return bestItem ?? candidates[0];
        }

        /// <summary>
        /// Tính xác suất trả lời đúng theo mô hình 3-Parameter Logistic (3-PL IRT):
        /// P(theta) = c + (1 - c) / (1 + exp(-D * a * (theta - b)))
        /// </summary>
        public static double ComputeProbability3PL(double theta, double a, double b, double c)
        {
            double safeA = Math.Clamp(a, 0.1, 4.0);
            double safeC = Math.Clamp(c, 0.0, 0.5);
            double exponent = -LogisticScalingD * safeA * (theta - b);
            exponent = Math.Clamp(exponent, -30.0, 30.0);
            return safeC + (1.0 - safeC) / (1.0 + Math.Exp(exponent));
        }

        /// <summary>
        /// Tính Hàm Thông tin Fisher I_i(theta) của mô hình 3-PL IRT:
        /// I(theta) = D^2 * a^2 * ((P - c)^2 / (1 - c)^2) * ((1 - P) / P)
        /// </summary>
        public static double ComputeFisherInformation3PL(double theta, double a, double b, double c)
        {
            double safeA = Math.Clamp(a, 0.1, 4.0);
            double safeC = Math.Clamp(c, 0.0, 0.5);
            double p = ComputeProbability3PL(theta, safeA, b, safeC);
            double q = 1.0 - p;
            if (p <= 1e-9 || (1.0 - safeC) <= 1e-9) return 0.0;

            double ratio = (p - safeC) / (1.0 - safeC);
            return (LogisticScalingD * LogisticScalingD) * (safeA * safeA) * (ratio * ratio) * (q / p);
        }

        /// <summary>
        /// Ước lượng năng lực Expected A Posteriori (EAP) bằng phương pháp cầu phương 41 điểm nút trên [-4.0, +4.0].
        /// </summary>
        public static AbilityEstimate ComputeNativeEapAbility(IReadOnlyList<IRTResponse> responses, double priorMean = 0.0)
        {
            const int nPoints = 41;
            const double minTheta = -4.0;
            const double maxTheta = 4.0;
            double step = (maxTheta - minTheta) / (nPoints - 1);

            double[] grid = new double[nPoints];
            double[] logPosterior = new double[nPoints];
            double maxLogPost = double.NegativeInfinity;

            for (int k = 0; k < nPoints; k++)
            {
                double th = minTheta + k * step;
                grid[k] = th;

                // Prior chuẩn N(priorMean, 1.0)
                double z = th - priorMean;
                double logPrior = -0.5 * z * z;

                double logLik = 0.0;
                if (responses != null)
                {
                    foreach (var r in responses)
                    {
                        double p = Math.Clamp(ComputeProbability3PL(th, r.A, r.B, r.C), 1e-9, 1.0 - 1e-9);
                        logLik += r.IsCorrect ? Math.Log(p) : Math.Log(1.0 - p);
                    }
                }

                double lp = logPrior + logLik;
                logPosterior[k] = lp;
                if (lp > maxLogPost) maxLogPost = lp;
            }

            double sumWeights = 0.0;
            double weightedTheta = 0.0;
            double[] weights = new double[nPoints];

            for (int k = 0; k < nPoints; k++)
            {
                double w = Math.Exp(logPosterior[k] - maxLogPost);
                weights[k] = w;
                sumWeights += w;
                weightedTheta += th_k(grid[k], w);
            }

            static double th_k(double th, double w) => th * w;

            double thetaHat = sumWeights > 0 ? weightedTheta / sumWeights : priorMean;

            double variance = 0.0;
            if (sumWeights > 0)
            {
                for (int k = 0; k < nPoints; k++)
                {
                    double diff = grid[k] - thetaHat;
                    variance += weights[k] * diff * diff;
                }
                variance /= sumWeights;
            }

            double se = Math.Sqrt(Math.Max(0.01, variance));
            double percentile = Math.Round(NormalCdf(thetaHat) * 100.0, 1);

            return new AbilityEstimate
            {
                Theta      = Math.Round(thetaHat, 3),
                Se         = Math.Round(se, 3),
                Percentile = percentile,
                Level      = ClassifyProficiencyLevel(thetaHat)
            };
        }

        private static CATReport BuildCatReport(LocalCatSessionState session, string finishReason)
        {
            int nItems = session.Responses.Count;
            double accuracy = nItems > 0
                ? Math.Round((double)session.Responses.Count(r => r.IsCorrect) / nItems * 100.0, 1)
                : 0.0;

            return new CATReport
            {
                SessionId     = session.SessionId,
                Theta         = session.CurrentTheta,
                Se            = session.CurrentSe,
                Percentile    = Math.Round(NormalCdf(session.CurrentTheta) * 100.0, 1),
                Level         = ClassifyProficiencyLevel(session.CurrentTheta),
                NItems        = nItems,
                Accuracy      = accuracy,
                FinishReason  = finishReason,
                EngineVersion = "AegisNative-3PL-EAP-SympsonHetter-v2030"
            };
        }

        private static string ClassifyProficiencyLevel(double theta)
        {
            if (theta >= 1.5) return "Master / Distinguished (C2)";
            if (theta >= 0.5) return "Advanced / Proficient (C1)";
            if (theta >= -0.5) return "Competent / Intermediate (B2)";
            if (theta >= -1.5) return "Developing / Foundation (B1)";
            return "Novice / Remedial (A1-A2)";
        }

        private static double NormalCdf(double x)
        {
            // Xấp xỉ Abramowitz & Stegun (sai số < 7.5e-8)
            double absX = Math.Abs(x) / Math.Sqrt(2.0);
            double t = 1.0 / (1.0 + 0.3275911 * absX);
            double erf = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.Exp(-absX * absX);
            return 0.5 * (1.0 + (x >= 0 ? erf : -erf));
        }

        private async Task<string> PostAsync(string path, object payload)
        {
            var client  = _httpFactory!.CreateClient("irt-service");
            var json    = JsonSerializer.Serialize(payload, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync(path, content);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }
    }
}
