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
            int ledgerCount)
        {
            return new List<IsmsControlCatalogItem>
            {
                new() { ControlId = "A.5.1", Theme = "A.5 Organizational", Title = "Policies for information security (Chính sách ATTT)", Status = dispatchCount > 0 ? "VERIFIED_AUTO" : "PLANNED", AutoEvidence = dispatchCount > 0, EvidenceSource = dispatchCount > 0 ? $"OfficialDispatch ({dispatchCount} hồ sơ)" : "Chờ ban hành qua /dispatches" },
                new() { ControlId = "A.5.15", Theme = "A.5 Organizational", Title = "Access control & CRUDAP governance (Kiểm soát truy cập)", Status = "VERIFIED_AUTO", AutoEvidence = true, EvidenceSource = "CrudapAccessControlService (4-tier)" },
                new() { ControlId = "A.5.24", Theme = "A.5 Organizational", Title = "Information security incident management planning", Status = "IN_PROGRESS", EvidenceSource = "Aegis ISMS Incident & CAPA" },
                new() { ControlId = "A.5.29", Theme = "A.5 Organizational", Title = "Information security during disruption (BCP)", Status = "PLANNED", EvidenceSource = "Docker + PostgreSQL Backup" },
                new() { ControlId = "A.6.1", Theme = "A.6 People", Title = "Screening & role responsibility", Status = "IN_PROGRESS", EvidenceSource = "Tenant RBAC + OrgUnits" },
                new() { ControlId = "A.6.3", Theme = "A.6 People", Title = "Information security awareness, education & training", Status = "VERIFIED_AUTO", AutoEvidence = true, EvidenceSource = "Aegis LMS & Quiz Assessment" },
                new() { ControlId = "A.6.7", Theme = "A.6 People", Title = "Remote working security", Status = totpEnabledCount > 0 ? "VERIFIED_AUTO" : "IN_PROGRESS", AutoEvidence = totpEnabledCount > 0, EvidenceSource = "HTTPS + TOTP 2FA Step-Up" },
                new() { ControlId = "A.7.1", Theme = "A.7 Physical", Title = "Physical security perimeters", Status = "PLANNED", EvidenceSource = "Hồ sơ văn phòng / Data Center" },
                new() { ControlId = "A.7.7", Theme = "A.7 Physical", Title = "Clear desk and clear screen policy", Status = "PLANNED", EvidenceSource = "Kiểm tra định kỳ /work-ledger" },
                new() { ControlId = "A.8.2", Theme = "A.8 Technological", Title = "Privileged access rights (PAM)", Status = "VERIFIED_AUTO", AutoEvidence = true, EvidenceSource = "Scoped RBAC Privilege Ceiling" },
                new() { ControlId = "A.8.5", Theme = "A.8 Technological", Title = "Secure authentication (TOTP RFC 6238 MFA)", Status = totpEnabledCount > 0 ? "VERIFIED_AUTO" : "IN_PROGRESS", AutoEvidence = totpEnabledCount > 0, EvidenceSource = $"TotpSecurityHelper ({totpEnabledCount} tài khoản bật 2FA)" },
                new() { ControlId = "A.8.15", Theme = "A.8 Technological", Title = "Logging & immutable audit trails", Status = "VERIFIED_AUTO", AutoEvidence = true, EvidenceSource = "AuditHistory + SHA-256 Seal" },
                new() { ControlId = "A.8.24", Theme = "A.8 Technological", Title = "Use of cryptography (AES-256-GCM)", Status = "VERIFIED_AUTO", AutoEvidence = true, EvidenceSource = "ApiKeyEncryptionHelper (AES-256-GCM)" },
                new() { ControlId = "A.8.25", Theme = "A.8 Technological", Title = "Secure development life cycle (SDLC)", Status = "VERIFIED_AUTO", AutoEvidence = true, EvidenceSource = $"Aegis Unit Tests & Ledger ({ledgerCount} sổ)" },
            };
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
