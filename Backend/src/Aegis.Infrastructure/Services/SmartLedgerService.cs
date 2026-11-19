using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.Interfaces;
using Aegis.Domain.Entities;
using Aegis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Aegis.Infrastructure.Services
{
    public sealed class SmartLedgerService : ISmartLedgerService
    {
        private const string CoordinateTypeKey = "AEGIS_SMART_LEDGER";
        private readonly AegisDbContext _db;

        public SmartLedgerService(AegisDbContext db)
        {
            _db = db;
        }

        public async Task<List<string>> GetLedgersJsonAsync(Guid tenantId, CancellationToken ct = default)
        {
            return await _db.TenantCoordinatePresets
                .AsNoTracking()
                .Where(p => (p.TenantId == tenantId || p.TenantId == Guid.Empty) && p.CoordinateType == CoordinateTypeKey)
                .OrderByDescending(p => p.Id)
                .Select(p => p.SynonymsJson)
                .Where(j => !string.IsNullOrWhiteSpace(j))
                .ToListAsync(ct);
        }

        public async Task SaveLedgerJsonAsync(Guid tenantId, string ledgerId, string title, string ledgerJson, CancellationToken ct = default)
        {
            string code = string.IsNullOrWhiteSpace(ledgerId)
                ? $"ledger-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}"
                : ledgerId.Trim();

            var existing = await _db.TenantCoordinatePresets.FirstOrDefaultAsync(
                p => p.TenantId == tenantId && p.CoordinateType == CoordinateTypeKey && p.PresetCode == code,
                ct);

            if (existing != null)
            {
                existing.PresetLabel = string.IsNullOrWhiteSpace(title) ? code : title.Trim();
                existing.SynonymsJson = ledgerJson;
            }
            else
            {
                _db.TenantCoordinatePresets.Add(new TenantCoordinatePreset
                {
                    TenantId = tenantId,
                    DomainCode = "WORK_LEDGER",
                    CoordinateType = CoordinateTypeKey,
                    PresetCode = code,
                    PresetLabel = string.IsNullOrWhiteSpace(title) ? code : title.Trim(),
                    SynonymsJson = ledgerJson,
                    DisplayOrder = 1
                });
            }

            await _db.SaveChangesAsync(ct);
        }
    }
}
