using System;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;

namespace Aegis.Application.Interfaces
{
    /// <summary>
    /// [Epoch 4: Community Ecosystem] Dịch vụ tạo liên kết lan tỏa và thách đấu đối kháng đồng đẳng (Peer Challenge).
    /// </summary>
    public interface IPeerChallengeService
    {
        Task<PeerChallengeDto> CreateChallengeAsync(Guid examId, Guid creatorUserId, string creatorName, double creatorScore, CancellationToken ct = default);
        Task<PeerChallengeDto?> GetChallengeByCodeAsync(string shareCode, CancellationToken ct = default);
        Task<PeerChallengeDto> SubmitChallengeResultAsync(string shareCode, string candidateIdentifier, double score, int timeSpentSec, CancellationToken ct = default);
    }
}
