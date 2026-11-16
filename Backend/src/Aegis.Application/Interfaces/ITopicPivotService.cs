using System;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;

namespace Aegis.Application.Interfaces
{
    public interface ITopicPivotService
    {
        Task<TopicPivotSummaryResponse> GetPivotSummaryAsync(
            TopicPivotQueryDto query,
            Guid? currentUserId = null,
            CancellationToken ct = default);
    }
}
