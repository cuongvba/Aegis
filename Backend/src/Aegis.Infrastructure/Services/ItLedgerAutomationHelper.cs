using System;
using System.Collections.Generic;

namespace Aegis.Infrastructure.Services
{
    public class ServerRoomVisitRequest
    {
        public string VisitorName { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public string Temperature { get; set; } = "21°C";
        public string Humidity { get; set; } = "50%";
        public bool BringDevice { get; set; }
        public string? DeviceNameAndSerial { get; set; }
        public bool IsMaintenance { get; set; }
        public string? SystemName { get; set; }
        public string? TotpCode { get; set; }
    }

    public class ItAutomationResult
    {
        public string CorrelationId { get; set; } = string.Empty;
        public string Timestamp { get; set; } = string.Empty;
        public List<string> TriggeredLedgers { get; set; } = new();
        public Dictionary<string, string> PmcCells { get; set; } = new();
        public Dictionary<string, string>? DeviceGateCells { get; set; }
        public Dictionary<string, string>? MaintenanceCells { get; set; }
        public string AuditSeal { get; set; } = string.Empty;
    }

    public static class ItLedgerAutomationHelper
    {
        public static ItAutomationResult BuildServerRoomVisitCascade(
            ServerRoomVisitRequest req,
            DateTimeOffset? referenceNow = null)
        {
            var now = referenceNow ?? DateTimeOffset.UtcNow;
            string ts = now.ToString("yyyy-MM-dd HH:mm");
            string dateOnly = now.ToString("yyyy-MM-dd");
            string corrId = $"pmc-{now.ToUnixTimeMilliseconds()}";
            string visitor = string.IsNullOrWhiteSpace(req.VisitorName) ? "Cán bộ IT trực" : req.VisitorName.Trim();
            string purpose = string.IsNullOrWhiteSpace(req.Purpose) ? "Kiểm tra & vận hành phòng máy chủ" : req.Purpose.Trim();

            var result = new ItAutomationResult
            {
                CorrelationId = corrId,
                Timestamp = ts,
                TriggeredLedgers = new List<string> { "PMC_SERVER_ROOM" },
                PmcCells = new Dictionary<string, string>
                {
                    ["dueDate"] = ts,
                    ["assignee"] = visitor,
                    ["task"] = $"[{corrId}] {purpose}",
                    ["temp"] = $"{req.Temperature} / {req.Humidity}",
                    ["status"] = "Bình thường"
                }
            };

            if (req.BringDevice || !string.IsNullOrWhiteSpace(req.DeviceNameAndSerial))
            {
                result.TriggeredLedgers.Add("IT_DEVICE_GATE");
                result.DeviceGateCells = new Dictionary<string, string>
                {
                    ["dueDate"] = ts,
                    ["assignee"] = visitor,
                    ["task"] = string.IsNullOrWhiteSpace(req.DeviceNameAndSerial) ? "Thiết bị kỹ thuật IT" : req.DeviceNameAndSerial.Trim(),
                    ["reason"] = $"Tự động sinh từ lượt vào PMC ({corrId}): {purpose}",
                    ["guard"] = "Auto-Verified (ISMS)",
                    ["status"] = "Đã cho phép"
                };
            }

            if (req.IsMaintenance || !string.IsNullOrWhiteSpace(req.SystemName))
            {
                result.TriggeredLedgers.Add("IT_MAINTENANCE");
                result.MaintenanceCells = new Dictionary<string, string>
                {
                    ["task"] = string.IsNullOrWhiteSpace(req.SystemName) ? "Hệ thống Server / Mạng PMC" : req.SystemName.Trim(),
                    ["mode"] = "Tại chỗ (Phòng Máy chủ)",
                    ["dueDate"] = dateOnly,
                    ["assignee"] = visitor,
                    ["status"] = "Đang thực hiện"
                };
            }

            result.AuditSeal = IsmsGovernanceHelper.ComputeSha256Seal(
                $"{corrId}|{visitor}|{string.Join(",", result.TriggeredLedgers)}");
            return result;
        }

        public static (int DurationMinutes, double FuelConsumed, bool LowFuelAlert) ComputeGeneratorMetrics(
            TimeSpan start,
            TimeSpan end,
            double fuelBeforePct,
            double fuelAfterPct)
        {
            int minutes = (int)Math.Max(0, (end - start).TotalMinutes);
            double consumed = Math.Round(Math.Max(0, fuelBeforePct - fuelAfterPct), 1);
            bool lowFuel = fuelAfterPct < 30.0;
            return (minutes, consumed, lowFuel);
        }
    }
}
