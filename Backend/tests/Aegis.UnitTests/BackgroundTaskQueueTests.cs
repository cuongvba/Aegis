using System;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.Interfaces;
using Aegis.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Aegis.UnitTests
{
    public class BackgroundTaskQueueTests
    {
        [Fact]
        public async Task Enqueue_And_Worker_Transitions_To_Completed_And_Isolates_Failures()
        {
            var services = new ServiceCollection().BuildServiceProvider();
            var queue = new AegisBackgroundTaskQueue();
            var worker = new AegisBackgroundTaskWorker(
                queue,
                services.GetRequiredService<IServiceScopeFactory>(),
                NullLogger<AegisBackgroundTaskWorker>.Instance);

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            await worker.StartAsync(cts.Token);

            var okJobId = queue.Enqueue("BATCH_INGEST", "Test Success Job", async (_, _) =>
            {
                await Task.Delay(10);
                return new { imported = 42 };
            });

            var failJobId = queue.Enqueue("BATCH_INGEST", "Test Failure Job", (_, _) =>
                throw new InvalidOperationException("Simulated fault"));

            await Task.Delay(150);
            await worker.StopAsync(CancellationToken.None);

            var okStatus = queue.GetStatus(okJobId);
            Assert.NotNull(okStatus);
            Assert.Equal("Completed", okStatus!.Status);
            Assert.Contains("42", okStatus.ResultJson);

            var failStatus = queue.GetStatus(failJobId);
            Assert.NotNull(failStatus);
            Assert.Equal("Failed", failStatus!.Status);
            Assert.Contains("Simulated fault", failStatus.Error);
        }
    }
}
