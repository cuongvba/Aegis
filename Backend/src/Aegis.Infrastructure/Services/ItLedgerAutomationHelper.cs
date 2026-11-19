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

        public static ItAutomationResult BuildAssetLifecycleCascade(
            string assetCode,
            string assetName,
            string currentLocation,
            string eventType,
            string? newLocation,
            string? newOwner,
            string? performedBy,
            string? mode,
            string? note,
            DateTimeOffset? referenceNow = null)
        {
            var now = referenceNow ?? DateTimeOffset.UtcNow;
            string ts = now.ToString("yyyy-MM-dd HH:mm");
            string dateOnly = now.ToString("yyyy-MM-dd");
            string corrId = $"ast-{now.ToUnixTimeMilliseconds()}";
            string actor = string.IsNullOrWhiteSpace(performedBy) ? "Cán bộ QLVH CNTT" : performedBy.Trim();
            string targetLoc = string.IsNullOrWhiteSpace(newLocation) ? currentLocation : newLocation.Trim();
            string label = string.IsNullOrWhiteSpace(assetCode) ? assetName : $"[{assetCode}] {assetName}";
            bool isServerRoom = targetLoc.Contains("Máy chủ", StringComparison.OrdinalIgnoreCase)
                || currentLocation.Contains("Máy chủ", StringComparison.OrdinalIgnoreCase);

            var res = new ItAutomationResult
            {
                CorrelationId = corrId,
                Timestamp = ts,
                TriggeredLedgers = new List<string>()
            };

            if (eventType == "HANDOVER_INSTALL" || eventType == "DISPOSE")
            {
                res.TriggeredLedgers.Add("IT_HANDOVER_INSTALL");
                string actionTitle = eventType == "DISPOSE" ? $"[Thu hồi / Hủy A.7.14] {label}" : $"[Giao nhận & Lắp đặt] {label}";
                res.PmcCells = new Dictionary<string, string>
                {
                    ["dueDate"] = dateOnly,
                    ["task"] = actionTitle,
                    ["assignee"] = string.IsNullOrWhiteSpace(newOwner) ? actor : newOwner.Trim(),
                    ["location"] = targetLoc,
                    ["note"] = string.IsNullOrWhiteSpace(note) ? $"Thực hiện bởi {actor}" : note.Trim(),
                    ["status"] = "Hoàn thành"
                };

                if (eventType == "HANDOVER_INSTALL" && isServerRoom)
                {
                    res.TriggeredLedgers.Add("PMC_SERVER_ROOM");
                }
            }
            else if (eventType == "MAINTENANCE")
            {
                res.TriggeredLedgers.Add("IT_MAINTENANCE");
                string svcMode = string.IsNullOrWhiteSpace(mode) ? "Tại chỗ" : mode.Trim();
                res.MaintenanceCells = new Dictionary<string, string>
                {
                    ["task"] = label,
                    ["mode"] = $"Bảo trì / Bảo hành • {svcMode}",
                    ["dueDate"] = dateOnly,
                    ["assignee"] = actor,
                    ["status"] = "Đang thực hiện"
                };

                if (svcMode.Contains("ngoài", StringComparison.OrdinalIgnoreCase))
                {
                    res.TriggeredLedgers.Add("IT_DEVICE_GATE");
                    res.DeviceGateCells = new Dictionary<string, string>
                    {
                        ["dueDate"] = ts,
                        ["assignee"] = actor,
                        ["task"] = label,
                        ["reason"] = $"Mang ra ngoài bảo hành/sửa chữa ({corrId})",
                        ["guard"] = "Auto-Verified (ISMS)",
                        ["status"] = "Đã cho phép"
                    };
                }
                else if (isServerRoom)
                {
                    res.TriggeredLedgers.Add("PMC_SERVER_ROOM");
                }
            }
            else
            {
                res.TriggeredLedgers.Add("IT_DEVICE_GATE");
                res.DeviceGateCells = new Dictionary<string, string>
                {
                    ["dueDate"] = ts,
                    ["assignee"] = actor,
                    ["task"] = label,
                    ["reason"] = string.IsNullOrWhiteSpace(note) ? $"Xuất/Nhập thiết bị ({corrId})" : note.Trim(),
                    ["guard"] = "Auto-Verified (ISMS)",
                    ["status"] = "Đã cho phép"
                };
            }

            res.AuditSeal = IsmsGovernanceHelper.ComputeSha256Seal($"{corrId}|{assetCode}|{eventType}|{string.Join(",", res.TriggeredLedgers)}");
            return res;
        }
    }
}
