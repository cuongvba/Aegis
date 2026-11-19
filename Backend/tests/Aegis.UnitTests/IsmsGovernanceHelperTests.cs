using System;
using System.IO;
using Aegis.Infrastructure.Services;
using NPOI.XSSF.UserModel;
using Xunit;

namespace Aegis.UnitTests
{
    public class IsmsGovernanceHelperTests
    {
        [Fact]
        public void ComputeRiskScore_CalculatesRawResidualLevelAndRtpTrigger()
        {
            var high = IsmsGovernanceHelper.ComputeRiskScore(4, 4, 0.5);
            Assert.Equal(16, high.RawScore);
            Assert.Equal(8.0, high.ResidualScore);
            Assert.Equal("CRITICAL", high.RiskLevel);
            Assert.True(high.RequiresRtp);

            var low = IsmsGovernanceHelper.ComputeRiskScore(2, 2, 0.5);
            Assert.Equal(4, low.RawScore);
            Assert.Equal("LOW", low.RiskLevel);
            Assert.False(low.RequiresRtp);
        }

        [Fact]
        public void GetDefaultIso27001Controls_ReflectsLiveAutoEvidence()
        {
            var controls = IsmsGovernanceHelper.GetDefaultIso27001Controls(totpEnabledCount: 2, dispatchCount: 3, ledgerCount: 4);
            Assert.Equal(93, controls.Count);
            Assert.Contains(controls, c => c.ControlId == "A.8.5" && c.Status == "VERIFIED_AUTO" && c.AutoEvidence);
            Assert.Contains(controls, c => c.ControlId == "A.5.1" && c.Status == "VERIFIED_AUTO");
            Assert.True(IsmsGovernanceHelper.ComputeCompliancePercent(controls) > 10.0);
        }

        [Fact]
        public void AnalyzeIncidentOrRisk_MapsToIso27001ControlsAndCapa()
        {
            var refNow = new DateTimeOffset(2026, 11, 19, 9, 0, 0, TimeSpan.Zero);
            var res = IsmsGovernanceHelper.AnalyzeIncidentOrRisk("Phishing email khiến nhân viên lộ mật khẩu tài khoản", refNow);

            Assert.Equal("HIGH", res.Severity);
            Assert.Contains(res.MappedControls, c => c.StartsWith("A.8.5"));
            Assert.Contains(res.MappedControls, c => c.StartsWith("A.6.3"));
            Assert.Equal(3, res.CapaChecklist.Count);
            Assert.Equal(64, IsmsGovernanceHelper.ComputeSha256Seal("audit-package").Length);
        }

        [Fact]
        public void BuildServerRoomVisitCascade_TriggersPmcDeviceGateAndMaintenance()
        {
            var cascade = ItLedgerAutomationHelper.BuildServerRoomVisitCascade(new ServerRoomVisitRequest
            {
                VisitorName = "Kỹ sư A",
                Purpose = "Bảo trì Switch Core",
                BringDevice = true,
                DeviceNameAndSerial = "Laptop SN-001",
                IsMaintenance = true,
                SystemName = "Switch Core"
            });

            Assert.Equal(3, cascade.TriggeredLedgers.Count);
            Assert.Contains("PMC_SERVER_ROOM", cascade.TriggeredLedgers);
            Assert.Contains("IT_DEVICE_GATE", cascade.TriggeredLedgers);
            Assert.Contains("IT_MAINTENANCE", cascade.TriggeredLedgers);
            Assert.NotNull(cascade.DeviceGateCells);
            Assert.NotNull(cascade.MaintenanceCells);

            var gen = ItLedgerAutomationHelper.ComputeGeneratorMetrics(new TimeSpan(8, 30, 0), new TimeSpan(9, 0, 0), 85, 25);
            Assert.Equal(30, gen.DurationMinutes);
            Assert.Equal(60.0, gen.FuelConsumed);
            Assert.True(gen.LowFuelAlert);
        }

        [Fact]
        public void ParseDanhMucTaiSan_ParsesSystemPhysicalAndDataSheets()
        {
            using var wb = new XSSFWorkbook();
            var s1 = wb.CreateSheet("Mau01_DMHTTT");
            var h1 = s1.CreateRow(0);
            h1.CreateCell(0).SetCellValue("Stt");
            h1.CreateCell(1).SetCellValue("Tên hệ thống");
            h1.CreateCell(2).SetCellValue("Cấp độ");
            var r1 = s1.CreateRow(1);
            r1.CreateCell(0).SetCellValue(1);
            r1.CreateCell(1).SetCellValue("Hệ thống Quản lý văn bản");
            r1.CreateCell(2).SetCellValue(2);

            var s3 = wb.CreateSheet("Mau 03_TSVL");
            var h3 = s3.CreateRow(0);
            h3.CreateCell(0).SetCellValue("Stt");
            var r3 = s3.CreateRow(1);
            r3.CreateCell(0).SetCellValue(1);
            r3.CreateCell(1).SetCellValue("BRCD140009");
            r3.CreateCell(2).SetCellValue("Máy chủ Dell T620");
            r3.CreateCell(3).SetCellValue("Phòng Máy chủ");
            r3.CreateCell(5).SetCellValue("Hết bảo hành");

            using var ms = new MemoryStream();
            wb.Write(ms, leaveOpen: true);
            ms.Position = 0;

            var parsed = ItAssetExcelParser.ParseDanhMucTaiSan(ms);
            Assert.Equal(2, parsed.Count);
            Assert.Contains(parsed, a => a.Category == "SYSTEM" && a.Classification == "CAP_DO_2");
            Assert.Contains(parsed, a => a.Category == "PHYSICAL" && a.AssetCode == "BRCD140009" && a.WarrantyStatus == "Hết bảo hành");
        }

        [Fact]
        public void BuildAssetLifecycleCascade_ConnectsHandoverMaintenanceAndGateLedgers()
        {
            var handover = ItLedgerAutomationHelper.BuildAssetLifecycleCascade(
                "BRCD140009", "Máy chủ Dell T620", "Kho", "HANDOVER_INSTALL", "Phòng Máy chủ", "Tổ IT", "Anh C", null, null);
            Assert.Contains("IT_HANDOVER_INSTALL", handover.TriggeredLedgers);
            Assert.Contains("PMC_SERVER_ROOM", handover.TriggeredLedgers);

            var maintOut = ItLedgerAutomationHelper.BuildAssetLifecycleCascade(
                "BRCD140009", "Máy chủ Dell T620", "Phòng Máy chủ", "MAINTENANCE", null, null, "Anh C", "Mang ra ngoài", null);
            Assert.Contains("IT_MAINTENANCE", maintOut.TriggeredLedgers);
            Assert.Contains("IT_DEVICE_GATE", maintOut.TriggeredLedgers);
        }
    }
}
