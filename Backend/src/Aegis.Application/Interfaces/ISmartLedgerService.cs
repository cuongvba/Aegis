using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Aegis.Application.Interfaces
{
    public interface ISmartLedgerService
    {
        Task<List<string>> GetLedgersJsonAsync(Guid tenantId, CancellationToken ct = default);
        Task SaveLedgerJsonAsync(Guid tenantId, string ledgerId, string title, string ledgerJson, CancellationToken ct = default);
    }
}
