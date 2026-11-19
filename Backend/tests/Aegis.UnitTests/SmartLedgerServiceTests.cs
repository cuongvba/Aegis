using System;
using System.Threading.Tasks;
using Aegis.Infrastructure.Data;
using Aegis.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Aegis.UnitTests
{
    public class SmartLedgerServiceTests
    {
        [Fact]
        public async Task SaveAndGetLedgersJsonAsync_PersistsAndUpdatesPerTenant()
        {
            var opts = new DbContextOptionsBuilder<AegisDbContext>()
                .UseInMemoryDatabase($"SmartLedger_{Guid.NewGuid()}")
                .Options;
            await using var db = new AegisDbContext(opts);
            var svc = new SmartLedgerService(db);
            Guid tenantId = Guid.NewGuid();

            await svc.SaveLedgerJsonAsync(tenantId, "work-kpi-1", "So Cong Viec Phong IT", "{\"id\":\"work-kpi-1\",\"rows\":[]}");
            await svc.SaveLedgerJsonAsync(tenantId, "work-kpi-1", "So Cong Viec Phong IT v2", "{\"id\":\"work-kpi-1\",\"rows\":[1]}");

            var list = await svc.GetLedgersJsonAsync(tenantId);
            Assert.Single(list);
            Assert.Contains("\"rows\":[1]", list[0]);
        }
    }
}
