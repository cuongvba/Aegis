using System;
using Aegis.Infrastructure.Services;
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
    }
}
