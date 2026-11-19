using System;
using System.Collections.Generic;
using System.Linq;

namespace Aegis.Infrastructure.Services
{
    public static class AppVaultHelper
    {
        public static (string NextRotationDate, int DaysRemaining, string ExpiryStatus) ComputePasswordLifecycle(
            DateTimeOffset lastChangedAt,
            int rotationDays,
            DateTimeOffset? referenceNow = null)
        {
            var now = referenceNow ?? DateTimeOffset.UtcNow;
            int days = Math.Clamp(rotationDays <= 0 ? 90 : rotationDays, 7, 365);
            var next = lastChangedAt.AddDays(days);
            int remaining = (int)Math.Ceiling((next.Date - now.Date).TotalDays);

            string status = remaining < 0 ? "EXPIRED"
                : remaining <= 7 ? "EXPIRING_SOON"
                : "OK";

            return (next.ToString("yyyy-MM-dd"), remaining, status);
        }

        public static List<string> ParseRelatedCodes(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return new List<string>();
            return raw.Split(new[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim().ToUpperInvariant())
                .Distinct()
                .ToList();
        }
    }
}
