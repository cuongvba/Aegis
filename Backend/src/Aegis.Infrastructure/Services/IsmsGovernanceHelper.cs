using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace Aegis.Infrastructure.Services
{
    public class IsmsControlCatalogItem
    {
        public string ControlId { get; set; } = string.Empty; // e.g. A.5.1, A.8.5
        public string Theme { get; set; } = string.Empty;     // A.5 Organizational, A.6 People, A.7 Physical, A.8 Technological
        public string Title { get; set; } = string.Empty;
        public bool Applicable { get; set; } = true;
        public string Status { get; set; } = "PLANNED";       // PLANNED, IN_PROGRESS, IMPLEMENTED, VERIFIED_AUTO
        public string EvidenceSource { get; set; } = string.Empty;
        public bool AutoEvidence { get; set; }
    }

    public class IsmsCopilotSuggestion
    {
        public List<string> MappedControls { get; set; } = new();
        public string Severity { get; set; } = "MEDIUM";
        public string ContainmentAction { get; set; } = string.Empty;
        public List<string> CapaChecklist { get; set; } = new();
        public string SuggestedDueDate { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
    }

    public static class IsmsGovernanceHelper
    {
        public static (int RawScore, double ResidualScore, string RiskLevel, bool RequiresRtp) ComputeRiskScore(
            int likelihood,
            int impact,
            double controlEffectiveness)
        {
            int l = Math.Clamp(likelihood, 1, 5);
            int i = Math.Clamp(impact, 1, 5);
            double eff = Math.Clamp(controlEffectiveness, 0.0, 0.85);

            int raw = l * i;
            double residual = Math.Round(raw * (1.0 - eff), 1);
            string level = raw >= 16 ? "CRITICAL"
                : raw >= 10 ? "HIGH"
                : raw >= 5 ? "MEDIUM" : "LOW";

            return (raw, residual, level, raw >= 10);
        }

        public static List<IsmsControlCatalogItem> GetDefaultIso27001Controls(
            int totpEnabledCount,
            int dispatchCount,
            int ledgerCount,
            IEnumerable<string>? itLedgerKinds = null)
        {
            var kinds = new HashSet<string>(itLedgerKinds ?? Array.Empty<string>(), StringComparer.OrdinalIgnoreCase);
            bool hasPmc = kinds.Contains("PMC_SERVER_ROOM");
            bool hasMpd = kinds.Contains("MPD_GENERATOR");
            bool hasGate = kinds.Contains("IT_DEVICE_GATE");
            bool hasMaint = kinds.Contains("IT_MAINTENANCE");
            bool hasVault = kinds.Contains("DOC_VAULT_LOG");

            var autoMap = new Dictionary<string, (string Status, bool Auto, string Evidence)>(StringComparer.OrdinalIgnoreCase)
            {
                ["A.5.1"] = (dispatchCount > 0 ? "VERIFIED_AUTO" : "PLANNED", dispatchCount > 0, dispatchCount > 0 ? $"OfficialDispatch ({dispatchCount} hồ sơ)" : "Ban hành qua /dispatches"),
                ["A.5.15"] = ("VERIFIED_AUTO", true, "CrudapAccessControlService (4-tier)"),
                ["A.5.24"] = ("IN_PROGRESS", false, "Aegis ISMS Incident & CAPA"),
                ["A.5.28"] = ("VERIFIED_AUTO", true, "SHA-256 Audit Evidence Seal"),
                ["A.5.30"] = (hasMpd ? "VERIFIED_AUTO" : "PLANNED", hasMpd, hasMpd ? "Nhật ký Máy phát điện (MPĐ) /work-ledger" : "Tạo sổ MPD_GENERATOR tại /work-ledger"),
                ["A.5.33"] = ("VERIFIED_AUTO", true, hasVault ? "Sổ Kho Chứng từ (Kho CT) + AuditHistory" : "PostgreSQL + Immutable AuditHistory"),
                ["A.6.3"] = ("VERIFIED_AUTO", true, "Aegis LMS & Security Awareness Quiz"),
                ["A.6.7"] = (totpEnabledCount > 0 ? "VERIFIED_AUTO" : "IN_PROGRESS", totpEnabledCount > 0, "HTTPS + TOTP 2FA Step-Up"),
                ["A.7.1"] = (hasPmc ? "VERIFIED_AUTO" : "PLANNED", hasPmc, hasPmc ? "Nhật ký Phòng Máy chủ (PMC-01)" : "Tạo sổ PMC_SERVER_ROOM tại /work-ledger"),
                ["A.7.2"] = (hasPmc || hasGate ? "VERIFIED_AUTO" : "PLANNED", hasPmc || hasGate, hasPmc || hasGate ? "PMC-01 & Sổ Thiết bị Vào/Ra" : "Tạo sổ PMC / IT_DEVICE_GATE"),
                ["A.7.5"] = (hasPmc ? "VERIFIED_AUTO" : "PLANNED", hasPmc, hasPmc ? "Giám sát nhiệt độ/độ ẩm PMC-01" : "Tạo sổ PMC_SERVER_ROOM tại /work-ledger"),
                ["A.7.9"] = (hasGate ? "VERIFIED_AUTO" : "PLANNED", hasGate, hasGate ? "Sổ Mang Thiết bị Vào/Ra (Mẫu 01/04)" : "Tạo sổ IT_DEVICE_GATE tại /work-ledger"),
                ["A.7.10"] = (hasGate ? "VERIFIED_AUTO" : "PLANNED", hasGate, hasGate ? "Kiểm soát thiết bị/media Vào/Ra" : "Tạo sổ IT_DEVICE_GATE tại /work-ledger"),
                ["A.7.11"] = (hasMpd ? "VERIFIED_AUTO" : "PLANNED", hasMpd, hasMpd ? "Nhật ký Máy phát điện (MPĐ)" : "Tạo sổ MPD_GENERATOR tại /work-ledger"),
                ["A.7.13"] = (hasMaint ? "VERIFIED_AUTO" : "PLANNED", hasMaint, hasMaint ? "Sổ Bảo trì, Bảo hành (BTBH01/02)" : "Tạo sổ IT_MAINTENANCE tại /work-ledger"),
                ["A.8.2"] = ("VERIFIED_AUTO", true, "Scoped RBAC Privilege Ceiling"),
                ["A.8.5"] = (totpEnabledCount > 0 ? "VERIFIED_AUTO" : "IN_PROGRESS", totpEnabledCount > 0, $"TotpSecurityHelper ({totpEnabledCount} khóa 2FA)"),
                ["A.8.15"] = ("VERIFIED_AUTO", true, "AuditHistory + SHA-256 Seal"),
                ["A.8.24"] = ("VERIFIED_AUTO", true, "ApiKeyEncryptionHelper (AES-256-GCM)"),
                ["A.8.25"] = ("VERIFIED_AUTO", true, $"Aegis Unit Tests & Ledger ({ledgerCount} sổ)")
            };

            return Iso27001AnnexACatalog.All93Controls.Select(c =>
            {
                bool hasAuto = autoMap.TryGetValue(c.Id, out var meta);
                return new IsmsControlCatalogItem
                {
                    ControlId = c.Id,
                    Theme = c.Theme,
                    Title = c.Title,
                    Applicable = true,
                    Status = hasAuto ? meta.Status : "PLANNED",
                    AutoEvidence = hasAuto && meta.Auto,
                    EvidenceSource = hasAuto ? meta.Evidence : "Chờ đính kèm bằng chứng /work-ledger"
                };
            }).ToList();
        }

        public static IsmsCopilotSuggestion AnalyzeIncidentOrRisk(string description, DateTimeOffset? referenceNow = null)
        {
            var now = referenceNow ?? DateTimeOffset.UtcNow;
            string text = description ?? string.Empty;
            var controls = new List<string>();

            if (Regex.IsMatch(text, @"mật khẩu|password|tài khoản|login|2fa|mfa|chiếm quyền", RegexOptions.IgnoreCase))
                controls.AddRange(new[] { "A.8.5 (Secure Authentication)", "A.8.2 (Privileged Access)" });
            if (Regex.IsMatch(text, @"lộ|rò rỉ|leak|key|secret|mã hóa|encrypt", RegexOptions.IgnoreCase))
                controls.AddRange(new[] { "A.8.24 (Use of Cryptography)", "A.5.12 (Classification of Information)" });
            if (Regex.IsMatch(text, @"phishing|lừa đảo|nhân viên|đào tạo|nhận thức", RegexOptions.IgnoreCase))
                controls.AddRange(new[] { "A.6.3 (Security Awareness Training)", "A.5.24 (Incident Planning)" });
            if (Regex.IsMatch(text, @"log|nhật ký|audit|truy vết|xóa dữ liệu", RegexOptions.IgnoreCase))
                controls.AddRange(new[] { "A.8.15 (Logging)", "A.5.15 (Access Control)" });

            if (controls.Count == 0)
                controls.AddRange(new[] { "A.5.24 (Incident Management)", "A.5.15 (Access Control)", "A.8.15 (Logging)" });

            bool critical = Regex.IsMatch(text, @"rò rỉ|\blộ\b|ransomware|mất dữ liệu|khẩn|nghiêm trọng|chiếm quyền", RegexOptions.IgnoreCase);
            string severity = critical ? "HIGH" : "MEDIUM";
            string due = DispatchWorkflowHelper.ComputeSmartDueDate(critical ? "HOA_TOC" : "KHAN", now);

            return new IsmsCopilotSuggestion
            {
                MappedControls = controls.Distinct().ToList(),
                Severity = severity,
                ContainmentAction = critical
                    ? "Cô lập ngay tài khoản/API bị ảnh hưởng, thu hồi token và xoay khóa (Key Rotation) trong 30 phút."
                    : "Rà soát nhật ký AuditHistory, xác minh quyền CRUDAP và khoanh vùng phạm vi ảnh hưởng.",
                CapaChecklist = new List<string>
                {
                    "1. Cô lập & thu thập bằng chứng nhật ký (A.8.15)",
                    "2. Phân tích nguyên nhân gốc rễ (5-Whys) & vá lỗ hổng",
                    "3. Nghiệm thu đóng CAPA bằng xác thực TOTP 2FA"
                },
                SuggestedDueDate = due,
                Summary = $"AI ISMS Copilot đã ánh xạ {controls.Distinct().Count()} điều khoản ISO 27001:2022, mức {severity}, hạn CAPA {due}."
            };
        }

        public static double ComputeCompliancePercent(IEnumerable<IsmsControlCatalogItem> controls)
        {
            var applicable = controls.Where(c => c.Applicable).ToList();
            if (applicable.Count == 0) return 100.0;

            double points = applicable.Sum(c => c.Status switch
            {
                "VERIFIED_AUTO" or "IMPLEMENTED" => 1.0,
                "IN_PROGRESS" => 0.5,
                _ => 0.0
            });
            return Math.Round((points / applicable.Count) * 100.0, 1);
        }

        public static string ComputeSha256Seal(string payload)
        {
            byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(payload ?? string.Empty));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }
    }
}
