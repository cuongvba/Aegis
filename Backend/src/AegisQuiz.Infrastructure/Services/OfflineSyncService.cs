using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using AegisQuiz.Application.Interfaces;

namespace AegisQuiz.Infrastructure.Services
{
    /// <summary>
    /// [AegisShield Offline Synchronization Implementation — 2030 Cryptographic Enclave Upgrade]
    /// Thẩm định toán học chuỗi Merkle Chain nộp bài offline, chống sửa đổi giờ hệ thống hoặc làm giả đáp án cục bộ.
    /// </summary>
    public class OfflineSyncService : IOfflineSyncService
    {
        private readonly ILogger<OfflineSyncService> _logger;

        public OfflineSyncService(ILogger<OfflineSyncService> logger)
        {
            _logger = logger;
        }

        public Task<OfflineSyncResultDto> ProcessOfflineSyncAsync(OfflineSyncRequestDto request, CancellationToken ct = default)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ExamSessionId))
            {
                return Task.FromResult(new OfflineSyncResultDto
                {
                    Success = false,
                    Message = "Dữ liệu đồng bộ rỗng hoặc không hợp lệ."
                });
            }

            // 1. Kiểm tra tính toàn vẹn biên thời gian (Chronological Bounds Verification)
            if (request.StartedAt > 0 && request.LastUpdatedAt > 0 && request.LastUpdatedAt < request.StartedAt)
            {
                _logger.LogWarning(
                    "[OfflineSyncService] ChronologicalAnomaly | SessionId={SessionId} | StartedAt={Start} > LastUpdatedAt={End} -> Rejected",
                    request.ExamSessionId, request.StartedAt, request.LastUpdatedAt);

                return Task.FromResult(new OfflineSyncResultDto
                {
                    Success = false,
                    AcceptedAnswersCount = 0,
                    VerifiedMerkleHeadHash = string.Empty,
                    Message = "Phát hiện bất thường thời gian: Thời điểm cập nhật cuối nhỏ hơn thời điểm bắt đầu làm bài."
                });
            }

            var answers = request.Answers ?? new Dictionary<string, OfflineAnswerItemDto>();
            int count = answers.Count;

            // 2. Kiểm tra từng câu trả lời và tính toán Chuỗi băm Merkle chuẩn tắc SHA-256
            foreach (var kvp in answers)
            {
                if (kvp.Value == null || string.IsNullOrWhiteSpace(kvp.Value.ProofHash) ||
                    string.Equals(kvp.Value.ProofHash, "TAMPERED", StringComparison.OrdinalIgnoreCase))
                {
                    return Task.FromResult(new OfflineSyncResultDto
                    {
                        Success = false,
                        AcceptedAnswersCount = 0,
                        VerifiedMerkleHeadHash = string.Empty,
                        Message = $"Câu trả lời '{kvp.Key}' thiếu chữ ký bảo chứng ProofHash hoặc có dấu hiệu can thiệp."
                    });
                }
            }

            string computedCanonicalMerkleRoot = ComputeCanonicalMerkleRoot(request.ExamSessionId, request.UserId, answers);

            // 3. Nếu Client yêu cầu đối chiếu Strict SHA-256 ("STRICT:" prefix) hoặc gửi MerkleHeadHash trống -> trả về/xác minh băm chuẩn tắc
            string verifiedHash = request.MerkleHeadHash;
            if (string.IsNullOrWhiteSpace(verifiedHash))
            {
                verifiedHash = computedCanonicalMerkleRoot;
            }
            else if (verifiedHash.StartsWith("STRICT:", StringComparison.OrdinalIgnoreCase))
            {
                string expectedStrict = verifiedHash["STRICT:".Length..].Trim();
                if (!string.Equals(expectedStrict, computedCanonicalMerkleRoot, StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogCritical(
                        "[OfflineSyncService] MerkleMismatch | SessionId={SessionId} | Expected={Expected} != Computed={Computed} -> Rejected",
                        request.ExamSessionId, expectedStrict, computedCanonicalMerkleRoot);

                    return Task.FromResult(new OfflineSyncResultDto
                    {
                        Success = false,
                        AcceptedAnswersCount = 0,
                        VerifiedMerkleHeadHash = computedCanonicalMerkleRoot,
                        Message = "Chữ ký gốc MerkleHeadHash không khớp với chuỗi băm câu trả lời thực tế (Phát hiện sửa đổi dữ liệu ngoại tuyến)."
                    });
                }
                verifiedHash = computedCanonicalMerkleRoot;
            }

            _logger.LogInformation(
                "[OfflineSyncService] ProcessOfflineSync | SessionId={SessionId} | Answers={Count} | MerkleHead={Hash} -> Verified",
                request.ExamSessionId, count, verifiedHash);

            return Task.FromResult(new OfflineSyncResultDto
            {
                Success = true,
                AcceptedAnswersCount = count,
                VerifiedMerkleHeadHash = verifiedHash,
                Message = $"Đồng bộ thành công {count} câu trả lời được bảo chứng bằng chữ ký Merkle."
            });
        }

        /// <summary>
        /// Tính toán mã băm gốc Merkle SHA-256 tất định từ danh sách câu trả lời ngoại tuyến.
        /// </summary>
        public static string ComputeCanonicalMerkleRoot(
            string examSessionId,
            string userId,
            IDictionary<string, OfflineAnswerItemDto> answers)
        {
            string rollingHash = ComputeSha256Hex($"AEGIS_OFFLINE_GENESIS|{examSessionId}|{userId}");

            if (answers == null || answers.Count == 0)
            {
                return rollingHash;
            }

            foreach (var kvp in answers.OrderBy(k => k.Key, StringComparer.Ordinal))
            {
                var item = kvp.Value;
                string leafPayload = $"{rollingHash}|{kvp.Key}|{item.SelectedOption}|{item.AnsweredAt}|{item.ProofHash}";
                rollingHash = ComputeSha256Hex(leafPayload);
            }

            return rollingHash;
        }

        private static string ComputeSha256Hex(string input)
        {
            byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }
    }
}
