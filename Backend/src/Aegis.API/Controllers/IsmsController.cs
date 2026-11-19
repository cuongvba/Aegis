using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.Interfaces;
using Aegis.Domain.Entities;
using Aegis.Domain.Security;
using Aegis.Infrastructure.Data;
using Aegis.Infrastructure.Security;
using Aegis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Aegis.API.Controllers
{
    public class IsmsAssetDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = "DATA"; // DATA, SYSTEM, PEOPLE, PHYSICAL
        public string Classification { get; set; } = "INTERNAL"; // PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
        public string Owner { get; set; } = string.Empty;
        public string ControlNote { get; set; } = string.Empty;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    public class IsmsRiskDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string AssetName { get; set; } = string.Empty;
        public int Likelihood { get; set; } = 3;
        public int Impact { get; set; } = 3;
        public double ControlEffectiveness { get; set; } = 0.5;
        public int RawScore { get; set; }
        public double ResidualScore { get; set; }
        public string RiskLevel { get; set; } = "MEDIUM";
        public bool RequiresRtp { get; set; }
        public string TreatmentOwner { get; set; } = string.Empty;
        public string DueDate { get; set; } = string.Empty;
        public string Status { get; set; } = "OPEN"; // OPEN, TREATING, APPROVED_LOCKED
        public string AuditSeal { get; set; } = string.Empty;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    public class IsmsIncidentDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Severity { get; set; } = "MEDIUM";
        public string Assignee { get; set; } = string.Empty;
        public string DueDate { get; set; } = string.Empty;
        public List<string> MappedControls { get; set; } = new();
        public string ContainmentAction { get; set; } = string.Empty;
        public List<string> CapaChecklist { get; set; } = new();
        public string Status { get; set; } = "OPEN"; // OPEN, INVESTIGATING, CLOSED_VERIFIED
        public string AuditSeal { get; set; } = string.Empty;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    public class IsmsSoaToggleDto
    {
        public string ControlId { get; set; } = string.Empty;
        public string Status { get; set; } = "IMPLEMENTED";
        public bool Applicable { get; set; } = true;
        public string EvidenceSource { get; set; } = string.Empty;
    }

    public class IsmsTotpApproveDto
    {
        public string? TotpCode { get; set; }
        public string? Note { get; set; }
    }

    public class IsmsCopilotRequestDto
    {
        public string Description { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/isms")]
    public class IsmsController : ControllerBase
    {
        private const string AssetType = "AEGIS_ISMS_ASSET";
        private const string RiskType = "AEGIS_ISMS_RISK";
        private const string IncidentType = "AEGIS_ISMS_INCIDENT";
        private const string SoaType = "AEGIS_ISMS_SOA";
        private const string TotpType = "AEGIS_WORKFLOW_TOTP";
        private const string TotpMasterSecret = "Aegis-Dispatch-Workflow-TOTP-2026-Key";
        private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

        private readonly AegisDbContext _db;
        private readonly ICrudapAccessControlService _crudap;
        private readonly ISmartLedgerService _ledger;
        private readonly ITenantContext _tenant;

        public IsmsController(
            AegisDbContext db,
            ICrudapAccessControlService crudap,
            ISmartLedgerService ledger,
            ITenantContext tenant)
        {
            _db = db;
            _crudap = crudap;
            _ledger = ledger;
            _tenant = tenant;
        }

        [HttpGet("overview")]
        [AllowAnonymous]
        public async Task<IActionResult> GetOverview(CancellationToken ct)
        {
            Guid tenantId = _tenant.CurrentTenantId;
            var rows = await _db.TenantCoordinatePresets
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId && (
                    p.CoordinateType == AssetType ||
                    p.CoordinateType == RiskType ||
                    p.CoordinateType == IncidentType ||
                    p.CoordinateType == SoaType ||
                    p.CoordinateType == TotpType ||
                    p.CoordinateType == "AEGIS_OFFICIAL_DISPATCH" ||
                    p.CoordinateType == "AEGIS_SMART_LEDGER"))
                .ToListAsync(ct);

            int totpCount = rows.Count(r => r.CoordinateType == TotpType && r.SynonymsJson.Contains("\"Enabled\":true", StringComparison.OrdinalIgnoreCase));
            int dispatchCount = rows.Count(r => r.CoordinateType == "AEGIS_OFFICIAL_DISPATCH");
            int ledgerCount = rows.Count(r => r.CoordinateType == "AEGIS_SMART_LEDGER");

            var controls = IsmsGovernanceHelper.GetDefaultIso27001Controls(totpCount, dispatchCount, ledgerCount);
            foreach (var r in rows.Where(x => x.CoordinateType == SoaType))
            {
                var ov = JsonSerializer.Deserialize<IsmsSoaToggleDto>(r.SynonymsJson, JsonOpts);
                var match = controls.FirstOrDefault(c => c.ControlId == ov?.ControlId);
                if (match != null && ov != null)
                {
                    match.Applicable = ov.Applicable;
                    match.Status = ov.Status;
                    if (!string.IsNullOrWhiteSpace(ov.EvidenceSource)) match.EvidenceSource = ov.EvidenceSource;
                }
            }

            var assets = DeserializeList<IsmsAssetDto>(rows.Where(r => r.CoordinateType == AssetType));
            var risks = DeserializeList<IsmsRiskDto>(rows.Where(r => r.CoordinateType == RiskType));
            var incidents = DeserializeList<IsmsIncidentDto>(rows.Where(r => r.CoordinateType == IncidentType));

            double compliance = IsmsGovernanceHelper.ComputeCompliancePercent(controls);
            return Ok(new
            {
                standard = "ISO/IEC 27001:2022",
                compliancePercent = compliance,
                totpEnabledCount = totpCount,
                highRiskCount = risks.Count(r => r.RiskLevel is "HIGH" or "CRITICAL" && r.Status != "APPROVED_LOCKED"),
                openIncidentCount = incidents.Count(i => i.Status != "CLOSED_VERIFIED"),
                controls,
                assets,
                risks,
                incidents
            });
        }

        [HttpPost("assets")]
        [AllowAnonymous]
        public async Task<IActionResult> UpsertAsset([FromBody] IsmsAssetDto dto, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest(new { error = "Tên tài sản thông tin là bắt buộc." });
            if (string.IsNullOrWhiteSpace(dto.Id)) dto.Id = $"asset-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
            dto.UpdatedAt = DateTimeOffset.UtcNow;

            await UpsertPresetAsync(AssetType, "ISMS_ASSET", dto.Id, dto.Name, dto, ct);
            return Ok(dto);
        }

        [HttpPost("risks")]
        [AllowAnonymous]
        public async Task<IActionResult> UpsertRisk([FromBody] IsmsRiskDto dto, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(dto.Title)) return BadRequest(new { error = "Tên rủi ro là bắt buộc." });
            if (string.IsNullOrWhiteSpace(dto.Id)) dto.Id = $"risk-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";

            var (raw, residual, level, requiresRtp) = IsmsGovernanceHelper.ComputeRiskScore(dto.Likelihood, dto.Impact, dto.ControlEffectiveness);
            dto.RawScore = raw;
            dto.ResidualScore = residual;
            dto.RiskLevel = level;
            dto.RequiresRtp = requiresRtp;
            if (string.IsNullOrWhiteSpace(dto.DueDate)) dto.DueDate = DispatchWorkflowHelper.ComputeSmartDueDate(requiresRtp ? "KHAN" : "THUONG");
            if (requiresRtp && dto.Status == "OPEN") dto.Status = "TREATING";
            dto.UpdatedAt = DateTimeOffset.UtcNow;

            await UpsertPresetAsync(RiskType, "ISMS_RISK", dto.Id, dto.Title, dto, ct);
            if (requiresRtp)
            {
                await SyncIsmsTaskToLedgerAsync($"isms-rtp-{dto.Id}", $"[ISO 27001 RTP] {dto.Title}", dto.TreatmentOwner, dto.DueDate, $"Mức {dto.RiskLevel} ({dto.RawScore}/25)", ct);
            }
            return Ok(dto);
        }

        [HttpPost("risks/{id}/approve")]
        [AllowAnonymous]
        public async Task<IActionResult> ApproveRisk(string id, [FromBody] IsmsTotpApproveDto req, CancellationToken ct)
        {
            var row = await FindPresetAsync(RiskType, id, ct);
            if (row == null) return NotFound(new { error = "Không tìm thấy hồ sơ rủi ro." });
            var dto = JsonSerializer.Deserialize<IsmsRiskDto>(row.SynonymsJson, JsonOpts);
            if (dto == null) return BadRequest();

            var totpError = await ValidateCallerTotpIfEnabledAsync(req?.TotpCode, ct);
            if (totpError != null) return totpError;

            dto.Status = "APPROVED_LOCKED";
            dto.UpdatedAt = DateTimeOffset.UtcNow;
            dto.AuditSeal = IsmsGovernanceHelper.ComputeSha256Seal($"{dto.Id}|{dto.RawScore}|{dto.UpdatedAt:O}");
            row.SynonymsJson = JsonSerializer.Serialize(dto, JsonOpts);
            await _db.SaveChangesAsync(ct);
            return Ok(dto);
        }

        [HttpPost("soa/toggle")]
        [AllowAnonymous]
        public async Task<IActionResult> ToggleSoa([FromBody] IsmsSoaToggleDto dto, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(dto.ControlId)) return BadRequest(new { error = "Thiếu ControlId." });
            await UpsertPresetAsync(SoaType, "ISMS_SOA", dto.ControlId, dto.ControlId, dto, ct);
            return Ok(dto);
        }

        [HttpPost("incidents")]
        [AllowAnonymous]
        public async Task<IActionResult> UpsertIncident([FromBody] IsmsIncidentDto dto, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(dto.Title)) return BadRequest(new { error = "Tiêu đề sự cố là bắt buộc." });
            if (string.IsNullOrWhiteSpace(dto.Id)) dto.Id = $"inc-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";

            var ai = IsmsGovernanceHelper.AnalyzeIncidentOrRisk($"{dto.Title} {dto.Description}");
            if (dto.MappedControls.Count == 0) dto.MappedControls = ai.MappedControls;
            if (string.IsNullOrWhiteSpace(dto.ContainmentAction)) dto.ContainmentAction = ai.ContainmentAction;
            if (dto.CapaChecklist.Count == 0) dto.CapaChecklist = ai.CapaChecklist;
            if (string.IsNullOrWhiteSpace(dto.DueDate)) dto.DueDate = ai.SuggestedDueDate;
            if (string.IsNullOrWhiteSpace(dto.Severity)) dto.Severity = ai.Severity;
            dto.UpdatedAt = DateTimeOffset.UtcNow;

            await UpsertPresetAsync(IncidentType, "ISMS_INCIDENT", dto.Id, dto.Title, dto, ct);
            await SyncIsmsTaskToLedgerAsync($"isms-capa-{dto.Id}", $"[ISO 27001 CAPA] {dto.Title}", dto.Assignee, dto.DueDate, dto.ContainmentAction, ct);
            return Ok(dto);
        }

        [HttpPost("incidents/{id}/close")]
        [AllowAnonymous]
        public async Task<IActionResult> CloseIncident(string id, [FromBody] IsmsTotpApproveDto req, CancellationToken ct)
        {
            var row = await FindPresetAsync(IncidentType, id, ct);
            if (row == null) return NotFound(new { error = "Không tìm thấy sự cố." });
            var dto = JsonSerializer.Deserialize<IsmsIncidentDto>(row.SynonymsJson, JsonOpts);
            if (dto == null) return BadRequest();

            var totpError = await ValidateCallerTotpIfEnabledAsync(req?.TotpCode, ct);
            if (totpError != null) return totpError;

            dto.Status = "CLOSED_VERIFIED";
            dto.UpdatedAt = DateTimeOffset.UtcNow;
            dto.AuditSeal = IsmsGovernanceHelper.ComputeSha256Seal($"{dto.Id}|{dto.Severity}|{dto.UpdatedAt:O}");
            row.SynonymsJson = JsonSerializer.Serialize(dto, JsonOpts);
            await _db.SaveChangesAsync(ct);
            return Ok(dto);
        }

        [HttpPost("copilot")]
        [AllowAnonymous]
        public IActionResult Copilot([FromBody] IsmsCopilotRequestDto req)
            => Ok(IsmsGovernanceHelper.AnalyzeIncidentOrRisk(req?.Description ?? string.Empty));

        [HttpGet("audit-export")]
        [AllowAnonymous]
        public async Task<IActionResult> ExportAuditPackage(CancellationToken ct)
        {
            var overviewResult = await GetOverview(ct) as OkObjectResult;
            string json = JsonSerializer.Serialize(overviewResult?.Value, JsonOpts);
            string seal = IsmsGovernanceHelper.ComputeSha256Seal(json);
            return Ok(new { exportedAt = DateTimeOffset.UtcNow, sha256Seal = seal, package = overviewResult?.Value });
        }

        private async Task<IActionResult?> ValidateCallerTotpIfEnabledAsync(string? totpCode, CancellationToken ct)
        {
            string email = User?.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
            string userId = User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue("sub") ?? string.Empty;
            string key = !string.IsNullOrWhiteSpace(email) ? email.ToLowerInvariant()
                : (!string.IsNullOrWhiteSpace(userId) ? userId : $"tenant-{_tenant.CurrentTenantId}");

            var totpRow = await _db.TenantCoordinatePresets.FirstOrDefaultAsync(
                p => p.TenantId == _tenant.CurrentTenantId && p.CoordinateType == TotpType && p.PresetCode == key, ct);
            if (totpRow == null) return null;

            bool enabled = totpRow.SynonymsJson.Contains("\"Enabled\":true", StringComparison.OrdinalIgnoreCase);
            if (!enabled) return null;

            using var doc = JsonDocument.Parse(totpRow.SynonymsJson);
            string enc = doc.RootElement.TryGetProperty("EncryptedSecret", out var p) ? p.GetString() ?? "" : "";
            string secret = ApiKeyEncryptionHelper.Decrypt(enc, TotpMasterSecret);
            if (string.IsNullOrWhiteSpace(totpCode) || !TotpSecurityHelper.ValidateTotpCode(secret, totpCode.Trim()))
            {
                return StatusCode(403, new { requiresTotp = true, error = "Phê duyệt ISMS yêu cầu mã Authenticator (2FA) 6 chữ số hợp lệ." });
            }
            return null;
        }

        private Task<TenantCoordinatePreset?> FindPresetAsync(string coordType, string code, CancellationToken ct)
            => _db.TenantCoordinatePresets.FirstOrDefaultAsync(
                p => p.TenantId == _tenant.CurrentTenantId && p.CoordinateType == coordType && p.PresetCode == code, ct);

        private async Task UpsertPresetAsync<T>(string coordType, string domain, string code, string label, T data, CancellationToken ct)
        {
            var existing = await FindPresetAsync(coordType, code, ct);
            string json = JsonSerializer.Serialize(data, JsonOpts);
            if (existing != null)
            {
                existing.PresetLabel = label;
                existing.SynonymsJson = json;
            }
            else
            {
                _db.TenantCoordinatePresets.Add(new TenantCoordinatePreset
                {
                    TenantId = _tenant.CurrentTenantId,
                    DomainCode = domain,
                    CoordinateType = coordType,
                    PresetCode = code,
                    PresetLabel = label,
                    SynonymsJson = json,
                    DisplayOrder = 1
                });
            }
            await _db.SaveChangesAsync(ct);
        }

        private async Task SyncIsmsTaskToLedgerAsync(string ledgerId, string title, string owner, string dueDate, string note, CancellationToken ct)
        {
            var payload = new
            {
                id = ledgerId,
                kind = "WORK_KPI",
                title,
                groupName = "ISMS ISO 27001:2022",
                rows = new[]
                {
                    new Dictionary<string, string>
                    {
                        ["id"] = "r1",
                        ["task"] = note,
                        ["assignee"] = string.IsNullOrWhiteSpace(owner) ? "CISO / Quản trị ATTT" : owner,
                        ["dueDate"] = dueDate,
                        ["status"] = "DOING",
                        ["kpi"] = "100"
                    }
                }
            };
            await _ledger.SaveLedgerJsonAsync(_tenant.CurrentTenantId, ledgerId, title, JsonSerializer.Serialize(payload), ct);
        }

        private static List<T> DeserializeList<T>(IEnumerable<TenantCoordinatePreset> rows)
        {
            var list = new List<T>();
            foreach (var r in rows)
            {
                try
                {
                    var item = JsonSerializer.Deserialize<T>(r.SynonymsJson, JsonOpts);
                    if (item != null) list.Add(item);
                }
                catch { /* skip invalid */ }
            }
            return list;
        }
    }
}
