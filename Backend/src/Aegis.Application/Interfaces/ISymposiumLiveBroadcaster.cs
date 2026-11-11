using System;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.Models.AI;

namespace Aegis.Application.Interfaces
{
    /// <summary>
    /// [CLEAR Architecture Compliant]
    /// Cổng phát thanh trực tiếp tiến trình Đại Hội Thảo (SignalR Broadcaster Abstraction)
    /// </summary>
    public interface ISymposiumLiveBroadcaster
    {
        Task BroadcastPhaseProgressAsync(string sessionId, int phaseNumber, string phaseName, double progressPercentage, CancellationToken ct = default);
        Task BroadcastTurnSpokenAsync(string sessionId, SymposiumDialogueTurn turn, CancellationToken ct = default);
        Task BroadcastPhaseResultAsync(string sessionId, int phaseNumber, string phaseName, object phaseResultData, CancellationToken ct = default);
        Task BroadcastProceedingsCompletedAsync(string sessionId, SymposiumProceedingsResult proceedings, CancellationToken ct = default);
    }
}
