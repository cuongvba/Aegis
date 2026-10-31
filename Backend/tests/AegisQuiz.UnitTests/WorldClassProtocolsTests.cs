using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using AegisQuiz.Application.Interfaces;
using AegisQuiz.Domain.Entities;
using AegisQuiz.Infrastructure.AI.Prompt.Plugins;
using AegisQuiz.Infrastructure.Data;
using AegisQuiz.Infrastructure.Services;
using Xunit;

namespace AegisQuiz.UnitTests
{
    public class WorldClassProtocolsTests
    {
        private static AegisQuizDbContext CreateInMemoryDb(string dbName)
        {
            var options = new DbContextOptionsBuilder<AegisQuizDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new AegisQuizDbContext(options);
        }

        [Fact]
        public async Task NtpTimeSyncService_Should_Calibrate_And_Normalize_Timestamps()
        {
            // Arrange
            var service = new NtpTimeSyncService(NullLogger<NtpTimeSyncService>.Instance);
            var req = new NtpSyncRequestDto
            {
                ClientSendTimestampUs = 1700000000000000,
                ClientSessionId = "test_sess_01",
                PlayerId = "player_123"
            };

            // Act
            var res = await service.SynchronizeClockAsync(req);

            // Assert
            Assert.Equal(req.ClientSendTimestampUs, res.ClientSendTimestampUs);
            Assert.True(res.ServerReceiveTimestampUs > 0);
            Assert.True(res.ServerTransmitTimestampUs >= res.ServerReceiveTimestampUs);
            Assert.False(string.IsNullOrWhiteSpace(res.SessionSecretToken));

            // Test Normalization: client clock is 50ms ahead (skew = +50ms)
            long fingerDownUs = 1700000000050000;
            long normalizedUs = service.NormalizeFingerDownTimestamp(fingerDownUs, clockSkewMs: 50.0);
            Assert.Equal(1700000000000000, normalizedUs);

            // Test HMAC-SHA256 signature verification
            var payload = $"ROOM_1:player_123:{fingerDownUs}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(res.SessionSecretToken));
            var validSigHex = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));

            bool isValid = service.VerifyBuzzerSignature("ROOM_1", "player_123", fingerDownUs, validSigHex, res.SessionSecretToken);
            Assert.True(isValid);

            bool isTampered = service.VerifyBuzzerSignature("ROOM_1", "player_123", fingerDownUs + 1000, validSigHex, res.SessionSecretToken);
            Assert.False(isTampered);
        }

        [Fact]
        public async Task OfflineSyncService_Should_Accept_Valid_Merkle_Ledger_And_Reject_Tampered_Chain()
        {
            // Arrange
            var service = new OfflineSyncService(NullLogger<OfflineSyncService>.Instance);
            var answers = new Dictionary<string, OfflineAnswerItemDto>
            {
                ["q1"] = new OfflineAnswerItemDto { SelectedOption = "1", AnsweredAt = 1000, ProofHash = "hash1" },
                ["q2"] = new OfflineAnswerItemDto { SelectedOption = "3", AnsweredAt = 2000, ProofHash = "hash2" }
            };

            var req = new OfflineSyncRequestDto
            {
                ExamSessionId = "session_xyz",
                UserId = "user_456",
                StartedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - 60000,
                LastUpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                MerkleHeadHash = "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
                Answers = answers
            };

            // Act 1: Legacy compatible mode
            var result = await service.ProcessOfflineSyncAsync(req);

            // Assert 1
            Assert.True(result.Success);
            Assert.Equal(2, result.AcceptedAnswersCount);
            Assert.Equal(req.MerkleHeadHash, result.VerifiedMerkleHeadHash);

            // Act 2: Strict SHA-256 Canonical Merkle Root mode
            string canonicalRoot = OfflineSyncService.ComputeCanonicalMerkleRoot("session_xyz", "user_456", answers);
            req.MerkleHeadHash = $"STRICT:{canonicalRoot}";
            var strictSuccess = await service.ProcessOfflineSyncAsync(req);
            Assert.True(strictSuccess.Success);
            Assert.Equal(canonicalRoot, strictSuccess.VerifiedMerkleHeadHash);

            // Act 3: Strict mode with tampered Merkle root must be rejected
            req.MerkleHeadHash = "STRICT:0000000000000000000000000000000000000000000000000000000000000000";
            var strictRejected = await service.ProcessOfflineSyncAsync(req);
            Assert.False(strictRejected.Success);

            // Act 4: Chronological anomaly (LastUpdatedAt < StartedAt) must be rejected
            req.MerkleHeadHash = canonicalRoot;
            req.LastUpdatedAt = req.StartedAt - 5000;
            var timeAnomalyResult = await service.ProcessOfflineSyncAsync(req);
            Assert.False(timeAnomalyResult.Success);
        }

        [Fact]
        public async Task Lti13Service_Should_Decode_Valid_Jwt_And_Enforce_ZeroTrust_Rs256_And_Nonce_Guard()
        {
            // Arrange
            var config = new ConfigurationBuilder().Build();
            var service = new Lti13Service(config, null!, NullLogger<Lti13Service>.Instance);

            var uniqueNonce = Guid.NewGuid().ToString("N");
            long expFuture = DateTimeOffset.UtcNow.AddMinutes(10).ToUnixTimeSeconds();

            var payloadObj = new Dictionary<string, object>
            {
                ["sub"] = "canvas_student_99",
                ["email"] = "student@stanford.edu",
                ["name"] = "Alexander Hamilton",
                ["nonce"] = uniqueNonce,
                ["exp"] = expFuture,
                ["https://purl.imsglobal.org/spec/lti/claim/custom"] = new { exam_id = "exam_fin_2026" },
                ["https://purl.imsglobal.org/spec/lti-ags/claim/endpoint"] = new { lineitem = "https://canvas.instructure.com/api/lti/courses/1/line_items/5" }
            };

            string payloadJson = JsonSerializer.Serialize(payloadObj);
            string signedRs256Token = Lti13Service.CreateSignedRs256Jwt(payloadJson);

            // Act 1: Valid RS256 signed token with fresh nonce
            var result = await service.ValidateLtiLaunchAsync(new LtiLaunchPayloadDto { IdToken = signedRs256Token });

            // Assert 1
            Assert.True(result.IsValid);
            Assert.Equal("canvas_student_99", result.UserId);
            Assert.Equal("student@stanford.edu", result.UserEmail);
            Assert.Equal("exam_fin_2026", result.CustomExamId);
            Assert.Equal("https://canvas.instructure.com/api/lti/courses/1/line_items/5", result.AgsLineItemUrl);
            Assert.Equal("/quiz/secure?examId=exam_fin_2026", result.RedirectAppUrl);

            // Act 2: Replay Attack with the same Nonce must be blocked!
            var replayResult = await service.ValidateLtiLaunchAsync(new LtiLaunchPayloadDto { IdToken = signedRs256Token });
            Assert.False(replayResult.IsValid);
            Assert.Contains("Replay Attack", replayResult.ErrorMessage);

            // Act 3: Verify RFC 7517 JWKS exports real RSA-2048 modulus (not placeholder)
            var jwksJson = JsonSerializer.Serialize(await service.GetPublicJwksAsync());
            Assert.DoesNotContain("AegisKeyPlaceholder", jwksJson);
            Assert.Contains(Lti13Service.DefaultKeyId, jwksJson);
        }

        [Fact]
        public async Task DktEngine_Should_Dynamically_Load_MultiDomain_Concepts_And_Propagate_Bayesian_Prerequisites()
        {
            // Arrange
            await using var db = CreateInMemoryDb($"dkt_graph_{Guid.NewGuid():N}");
            Guid userId = Guid.NewGuid();

            db.KnowledgeConcepts.AddRange(
                new KnowledgeConcept { ConceptCode = "BANK_BASEL_CAPITAL", Name = "Basel III Capital Adequacy", DomainCode = "BANKING", DifficultyRank = 2 },
                new KnowledgeConcept { ConceptCode = "BANK_CREDIT_RAROC", Name = "Risk-Adjusted Return on Capital", DomainCode = "BANKING", DifficultyRank = 4 }
            );
            db.ConceptRelationships.Add(new ConceptRelationship
            {
                SourceConceptCode = "BANK_BASEL_CAPITAL",
                TargetConceptCode = "BANK_CREDIT_RAROC",
                RelationshipType = "PREREQUISITE",
                Weight = 1.0
            });
            await db.SaveChangesAsync();

            DktEngine.InvalidateCache(userId);
            var engine = new DktEngine(db, NullLogger<DktEngine>.Instance);

            // Act 1: Initial state loads dynamic banking concepts from DB
            var initialState = await engine.GetStudentKnowledgeStateAsync(userId);
            Assert.True(initialState.ConceptMasteryMap.ContainsKey("BANK_BASEL_CAPITAL"));
            Assert.True(initialState.ConceptMasteryMap.ContainsKey("BANK_CREDIT_RAROC"));
            double prereqBefore = initialState.ConceptMasteryMap["BANK_BASEL_CAPITAL"];

            // Act 2: Student answers advanced concept BANK_CREDIT_RAROC quickly & correctly (3500ms)
            var updatedState = await engine.RecordInteractionAndTraceAsync(userId, "BANK_CREDIT_RAROC", isCorrect: true, responseTimeMs: 3500);

            // Assert 2: Target concept increases AND prerequisite BANK_BASEL_CAPITAL receives positive Bayesian propagation!
            Assert.True(updatedState.ConceptMasteryMap["BANK_CREDIT_RAROC"] > initialState.ConceptMasteryMap["BANK_CREDIT_RAROC"]);
            Assert.True(updatedState.ConceptMasteryMap["BANK_BASEL_CAPITAL"] > prereqBefore);
        }

        [Fact]
        public async Task ExamAuditService_Should_Support_Parallel_Sharded_Locks_And_Detect_Tampering()
        {
            // Arrange
            await using var db = CreateInMemoryDb($"audit_sharded_{Guid.NewGuid():N}");
            var auditService = new ExamAuditService(db, NullLogger<ExamAuditService>.Instance);
            Guid tenantId = Guid.NewGuid();
            Guid examA = Guid.NewGuid();
            Guid examB = Guid.NewGuid();
            Guid userId = Guid.NewGuid();

            // Act 1: Append blocks across two exams
            await auditService.AppendAuditLogAsync(tenantId, examA, userId, "START_EXAM");
            await auditService.AppendAuditLogAsync(tenantId, examA, userId, "ANSWER_Q1");
            await auditService.AppendAuditLogAsync(tenantId, examB, userId, "START_EXAM");

            var verifyA = await auditService.VerifyAuditIntegrityAsync(examA);
            var verifyB = await auditService.VerifyAuditIntegrityAsync(examB);

            // Assert 1
            Assert.True(verifyA.IsChainValid);
            Assert.Equal(2, verifyA.TotalBlocksChecked);
            Assert.True(verifyB.IsChainValid);
            Assert.Equal(1, verifyB.TotalBlocksChecked);

            // Act 2: Simulate direct DB tampering on block #2 of examA
            var block2 = await db.ExamAuditLogs.FirstAsync(x => x.ExamId == examA && x.SequenceNumber == 2);
            block2.Details = "{\"tampered\":true}";
            await db.SaveChangesAsync();

            var verifyTampered = await auditService.VerifyAuditIntegrityAsync(examA);
            Assert.False(verifyTampered.IsChainValid);
            Assert.Equal(2, verifyTampered.BrokenSequenceNumber);
        }

        [Fact]
        public async Task IrtHttpService_Should_Execute_Native_3PL_Eap_And_SympsonHetter_Exposure_Control_Fallback()
        {
            // Arrange: Instantiate without external Python HTTP factory to test Native C# 3-PL EAP Fallback
            IrtHttpService.ResetExposureStatistics();
            var irtService = new IrtHttpService(httpFactory: null);

            var bank = new List<QuestionIRTParam>
            {
                new() { QuestionId = "Q_EASY",   A = 1.2, B = -1.5, C = 0.20, TopicCode = "MATH" },
                new() { QuestionId = "Q_MEDIUM", A = 1.8, B =  0.0, C = 0.25, TopicCode = "MATH" },
                new() { QuestionId = "Q_HARD",   A = 2.0, B =  1.5, C = 0.20, TopicCode = "MATH" },
                new() { QuestionId = "Q_ELITE",  A = 2.2, B =  2.2, C = 0.15, TopicCode = "MATH" }
            };

            var config = new CATConfigParam
            {
                MinItems = 2,
                MaxItems = 3,
                SeThreshold = 0.25,
                InitialTheta = 0.0,
                MaxExposureRate = 0.25
            };

            // Act: Run a complete adaptive session answering all items correctly
            var start = await irtService.StartCATSessionAsync("learner_01", bank, config);
            Assert.False(string.IsNullOrWhiteSpace(start.SessionId));
            Assert.Equal("Q_MEDIUM", start.QuestionId); // Highest Fisher Information at theta = 0.0

            var step1 = await irtService.RespondAsync(start.SessionId, isCorrect: true, timeSpentSecs: 12);
            Assert.True(step1.CurrentTheta > 0.0);
            Assert.False(step1.Finished);

            var step2 = await irtService.RespondAsync(start.SessionId, isCorrect: true, timeSpentSecs: 15);
            var step3 = await irtService.RespondAsync(start.SessionId, isCorrect: true, timeSpentSecs: 18);

            // Assert: Session finishes at MaxItems=3 with high positive Theta and full CATReport
            Assert.True(step3.Finished);
            Assert.NotNull(step3.Report);
            Assert.True(step3.Report!.Theta > 0.8);
            Assert.Equal(100.0, step3.Report.Accuracy);
        }

        [Fact]
        public async Task FormalFalsifiabilityPlugin_Should_Extract_NeuroSymbolic_Invariants()
        {
            // Arrange
            var plugin = new FormalFalsifiabilityPlugin();
            var context = new PromptCompositionContext
            {
                PhaseCode = "CRITIQUE",
                Locale = "vi-VN",
                TopicTitle = "Tối ưu hóa độ trễ <= 2ms và tích phân \\int f(x)dx",
                CoreProblemStatement = "Đảm bảo tỷ lệ chính xác >= 99.5% với thời gian phản hồi 1.2ms."
            };

            // Act
            Assert.True(plugin.IsApplicable(context));
            var contribution = await plugin.ProcessLayerAsync(context);

            // Assert
            Assert.Contains("NEURO-SYMBOLIC", contribution.HeaderText);
            Assert.Contains("<= 2ms", contribution.DirectiveText);
            Assert.Contains(">= 99.5%", contribution.DirectiveText);
            Assert.Contains("\\int", contribution.DirectiveText);
        }
    }
}
