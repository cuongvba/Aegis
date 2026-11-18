using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Aegis.Application.Interfaces
{
    public sealed class BackgroundJobStatusDto
    {
        public string JobId { get; set; } = string.Empty;
        public string JobType { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Status { get; set; } = "Queued";
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAtUtc { get; set; }
        public string? Error { get; set; }
        public string? ResultJson { get; set; }
    }

    /// <summary>
    /// Universal lightweight async job queue for heavy ingestion, AI symposium, and batch export tasks.
    /// </summary>
    public interface IAegisBackgroundTaskQueue
    {
        string Enqueue(
            string jobType,
            string label,
            Func<IServiceProvider, CancellationToken, Task<object?>> workItem);

        BackgroundJobStatusDto? GetStatus(string jobId);

        IReadOnlyList<BackgroundJobStatusDto> ListRecent(int take = 25);
    }
}
