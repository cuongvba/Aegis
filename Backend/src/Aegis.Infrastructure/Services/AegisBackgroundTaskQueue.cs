using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using Aegis.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Aegis.Infrastructure.Services
{
    internal sealed record QueuedAegisWork(
        string JobId,
        Func<IServiceProvider, CancellationToken, Task<object?>> WorkItem);

    /// <summary>
    /// Lock-free System.Threading.Channels background job queue with bounded capacity and status tracking.
    /// </summary>
    public sealed class AegisBackgroundTaskQueue : IAegisBackgroundTaskQueue
    {
        private readonly Channel<QueuedAegisWork> _channel = Channel.CreateBounded<QueuedAegisWork>(
            new BoundedChannelOptions(200)
            {
                FullMode = BoundedChannelFullMode.Wait,
                SingleReader = true,
                SingleWriter = false
            });

        private readonly ConcurrentDictionary<string, BackgroundJobStatusDto> _statuses = new(StringComparer.Ordinal);

        internal ChannelReader<QueuedAegisWork> Reader => _channel.Reader;

        public string Enqueue(
            string jobType,
            string label,
            Func<IServiceProvider, CancellationToken, Task<object?>> workItem)
        {
            if (workItem == null) throw new ArgumentNullException(nameof(workItem));

            if (_statuses.Count > 500)
            {
                var oldest = _statuses.Values
                    .OrderBy(s => s.CreatedAtUtc)
                    .Take(100)
                    .Select(s => s.JobId)
                    .ToList();
                foreach (var oldId in oldest) _statuses.TryRemove(oldId, out _);
            }

            var jobId = Guid.NewGuid().ToString("N")[..12];
            var status = new BackgroundJobStatusDto
            {
                JobId = jobId,
                JobType = jobType,
                Label = label,
                Status = "Queued",
                CreatedAtUtc = DateTime.UtcNow
            };
            _statuses[jobId] = status;

            if (!_channel.Writer.TryWrite(new QueuedAegisWork(jobId, workItem)))
            {
                _ = _channel.Writer.WriteAsync(new QueuedAegisWork(jobId, workItem));
            }
            return jobId;
        }

        public BackgroundJobStatusDto? GetStatus(string jobId)
            => _statuses.TryGetValue(jobId, out var status) ? status : null;

        public IReadOnlyList<BackgroundJobStatusDto> ListRecent(int take = 25)
            => _statuses.Values
                .OrderByDescending(s => s.CreatedAtUtc)
                .Take(Math.Clamp(take, 1, 100))
                .ToList();

        internal void MarkRunning(string jobId)
        {
            if (_statuses.TryGetValue(jobId, out var s)) s.Status = "Running";
        }

        internal void MarkCompleted(string jobId, object? result)
        {
            if (!_statuses.TryGetValue(jobId, out var s)) return;
            s.Status = "Completed";
            s.CompletedAtUtc = DateTime.UtcNow;
            if (result != null)
            {
                s.ResultJson = JsonSerializer.Serialize(result);
            }
        }

        internal void MarkFailed(string jobId, string error)
        {
            if (!_statuses.TryGetValue(jobId, out var s)) return;
            s.Status = "Failed";
            s.CompletedAtUtc = DateTime.UtcNow;
            s.Error = error;
        }
    }

    public sealed class AegisBackgroundTaskWorker : BackgroundService
    {
        private readonly AegisBackgroundTaskQueue _queue;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AegisBackgroundTaskWorker> _logger;

        public AegisBackgroundTaskWorker(
            IAegisBackgroundTaskQueue queue,
            IServiceScopeFactory scopeFactory,
            ILogger<AegisBackgroundTaskWorker> logger)
        {
            _queue = (AegisBackgroundTaskQueue)queue;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await foreach (var item in _queue.Reader.ReadAllAsync(stoppingToken))
            {
                _queue.MarkRunning(item.JobId);
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var result = await item.WorkItem(scope.ServiceProvider, stoppingToken);
                    _queue.MarkCompleted(item.JobId, result);
                    _logger.LogInformation("[AegisJobWorker] Execute | JobId={JobId} -> Completed", item.JobId);
                }
                catch (Exception ex)
                {
                    _queue.MarkFailed(item.JobId, ex.Message);
                    _logger.LogError(ex, "[AegisJobWorker] Execute | JobId={JobId} -> Failed", item.JobId);
                }
            }
        }
    }
}
