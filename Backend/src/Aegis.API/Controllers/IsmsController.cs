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
        public string AssetCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = "DATA"; // SYSTEM, SOFTWARE, PHYSICAL, DATA
        public string Classification { get; set; } = "INTERNAL"; // PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED, CAP_DO_1..5
        public string Location { get; set; } = string.Empty;
        public string WarrantyStatus { get; set; } = string.Empty;
        public string SystemName { get; set; } = string.Empty;
        public string Owner { get; set; } = string.Empty;
        public string ControlNote { get; set; } = string.Empty;
        public List<string> LifecycleHistory { get; set; } = new();
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    public class AssetLifecycleEventRequestDto
    {
        public string EventType { get; set; } = "HANDOVER_INSTALL"; // HANDOVER_INSTALL, MAINTENANCE, GATE_OUT, DISPOSE
        public string? NewLocation { get; set; }
        public string? NewOwner { get; set; }
        public string? PerformedBy { get; set; }
        public string? Mode { get; set; } // Tại chỗ | Mang ra ngoài
        public string? Note { get; set; }
        public string? TotpCode { get; set; }
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
            var ledgerRows = rows.Where(r => r.CoordinateType == "AEGIS_SMART_LEDGER").ToList();
            var itKinds = new[] { "PMC_SERVER_ROOM", "MPD_GENERATOR", "IT_DEVICE_GATE", "IT_MAINTENANCE", "DOC_VAULT_LOG" }
                .Where(k => ledgerRows.Any(r => r.SynonymsJson.Contains(k, StringComparison.OrdinalIgnoreCase)))
                .ToList();

            var assets = DeserializeList<IsmsAssetDto>(rows.Where(r => r.CoordinateType == AssetType));
            var risks = DeserializeList<IsmsRiskDto>(rows.Where(r => r.CoordinateType == RiskType));
            var incidents = DeserializeList<IsmsIncidentDto>(rows.Where(r => r.CoordinateType == IncidentType));

            var controls = IsmsGovernanceHelper.GetDefaultIso27001Controls(
                totpCount,
                dispatchCount,
                ledgerRows.Count,
                itKinds,
                hasAssets: assets.Count > 0,
                hasPiiAssets: assets.Any(a => a.Category == "DATA" || a.Classification == "CONFIDENTIAL"));
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

        [HttpPost("assets/import-excel")]
        [AllowAnonymous]
        public async Task<IActionResult> ImportAssetsExcel(Microsoft.AspNetCore.Http.IFormFile file, CancellationToken ct)
        {
            if (file == null || file.Length == 0) return BadRequest(new { error = "Vui lòng chọn file DanhMucTaiSanCNTT.xlsx." });

            await using var ms = new System.IO.MemoryStream();
            await file.CopyToAsync(ms, ct);
            ms.Position = 0;
            var parsed = ItAssetExcelParser.ParseDanhMucTaiSan(ms);
            if (parsed.Count == 0) return BadRequest(new { error = "Không đọc được dữ liệu từ các sheet Mau01_DMHTTT / Mau02_TSPM / Mau 03_TSVL / Mau 04_TSTT." });

            foreach (var p in parsed)
            {
                var dto = new IsmsAssetDto
                {
                    Id = p.Id,
                    AssetCode = p.AssetCode,
                    Name = p.Name,
                    Category = p.Category,
                    Classification = p.Classification,
                    Location = p.Location,
                    WarrantyStatus = p.WarrantyStatus,
                    SystemName = p.SystemName,
                    Owner = p.Owner,
                    ControlNote = p.ControlNote,
                    UpdatedAt = DateTimeOffset.UtcNow
                };
                await UpsertPresetAsync(AssetType, "ISMS_ASSET", dto.Id, dto.Name, dto, ct);
            }

            int outOfWarranty = parsed.Count(p => p.Category == "PHYSICAL" && p.WarrantyStatus.Contains("Hết bảo hành", StringComparison.OrdinalIgnoreCase));
            if (outOfWarranty > 0)
            {
                var (raw, residual, level, requiresRtp) = IsmsGovernanceHelper.ComputeRiskScore(4, 4, 0.4);
                var autoRisk = new IsmsRiskDto
                {
                    Id = "risk-asset-warranty",
                    Title = $"[Auto-Asset] {outOfWarranty} thiết bị vật lý hết bảo hành (A.7.13)",
                    AssetName = "Danh mục Thiết bị Vật lý (Mẫu 03)",
                    Likelihood = 4,
                    Impact = 4,
                    ControlEffectiveness = 0.4,
                    RawScore = raw,
                    ResidualScore = residual,
                    RiskLevel = level,
                    RequiresRtp = requiresRtp,
                    TreatmentOwner = "Bộ phận QLVH CNTT",
                    DueDate = DispatchWorkflowHelper.ComputeSmartDueDate("KHAN"),
                    Status = "TREATING",
                    UpdatedAt = DateTimeOffset.UtcNow
                };
                await UpsertPresetAsync(RiskType, "ISMS_RISK", autoRisk.Id, autoRisk.Title, autoRisk, ct);
                await SyncIsmsTaskToLedgerAsync("isms-rtp-warranty", $"[ISO 27001 A.7.13] Rà soát {outOfWarranty} thiết bị hết bảo hành", "Bộ phận QLVH CNTT", autoRisk.DueDate, "Lập kế hoạch bảo trì / thay thế thiết bị hết bảo hành", ct);
            }

            return Ok(new
            {
                importedCount = parsed.Count,
                systemsCount = parsed.Count(p => p.Category == "SYSTEM"),
                softwareCount = parsed.Count(p => p.Category == "SOFTWARE"),
                physicalCount = parsed.Count(p => p.Category == "PHYSICAL"),
                dataCount = parsed.Count(p => p.Category == "DATA"),
                outOfWarrantyCount = outOfWarranty
            });
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

        [HttpPost("publish-policy")]
        [AllowAnonymous]
        public async Task<IActionResult> PublishPolicyToDispatch(CancellationToken ct)
        {
            string id = $"doc-isms-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
            string due = DispatchWorkflowHelper.ComputeSmartDueDate("KHAN");
            var dispatchPayload = new OfficialDispatchDto
            {
                Id = id,
                DispatchNumber = $"ISMS-{DateTimeOffset.UtcNow:yyyyMMdd}",
                Direction = "INTERNAL_DOC",
                Urgency = "KHAN",
                Title = "Ban hành Chính sách An toàn Thông tin theo chuẩn ISO/IEC 27001:2022 (Clause 5 / A.5.1)",
                ContentMarkdown = "## Chính sách An toàn Thông tin AegisGlobal\n- Áp dụng cho toàn bộ nhân sự, hệ thống và dữ liệu.\n- Bắt buộc xác thực 2FA (RFC 6238) khi phê duyệt và tuân thủ kiểm soát truy cập CRUDAP.",
                Status = "SUBMITTED_TRIAGE",
                DueDate = due,
                AuditHistory = new List<string> { $"[{DateTimeOffset.UtcNow:yyyy-MM-dd HH:mm}] Tự động khởi tạo từ ISMS (Clause 5 / A.5.1)" },
                UpdatedAt = DateTimeOffset.UtcNow
            };
            await UpsertPresetAsync("AEGIS_OFFICIAL_DISPATCH", "DISPATCH", id, dispatchPayload.Title, dispatchPayload, ct);
            await SyncIsmsTaskToLedgerAsync($"isms-policy-{id}", "[ISO 27001 A.5.1] Phổ biến & xác nhận Chính sách ATTT", "Toàn thể nhân sự", due, "Đọc & ký xác nhận Chính sách ATTT", ct);
            return Ok(new { dispatchId = id, dueDate = due, message = "Đã phát hành dự thảo Chính sách ATTT sang /dispatches & tạo đầu việc /work-ledger." });
        }

        [HttpPost("it-events/server-room-visit")]
        [AllowAnonymous]
        public async Task<IActionResult> TriggerServerRoomVisit([FromBody] ServerRoomVisitRequest req, CancellationToken ct)
        {
            var totpError = await ValidateCallerTotpIfEnabledAsync(req?.TotpCode, ct);
            if (totpError != null) return totpError;

            var cascade = ItLedgerAutomationHelper.BuildServerRoomVisitCascade(req ?? new ServerRoomVisitRequest());

            await AppendItLedgerRowAsync(
                "it-pmc-server-room",
                "PMC_SERVER_ROOM",
                "IT: Nhật Ký Phòng Máy Chủ (PMC-01)",
                new object[]
                {
                    new { key = "dueDate", label = "Ngày/Giờ kiểm tra", type = "text" },
                    new { key = "assignee", label = "Cán bộ vào/kiểm tra", type = "text" },
                    new { key = "task", label = "Mục đích / Nội dung", type = "text" },
                    new { key = "temp", label = "Nhiệt độ / Độ ẩm", type = "text" },
                    new { key = "status", label = "Trạng thái hệ thống", type = "status", options = new[] { "Bình thường", "Cảnh báo nhẹ", "Đang xử lý", "Hoàn thành" } }
                },
                cascade.PmcCells,
                ct);

            if (cascade.DeviceGateCells != null)
            {
                await AppendItLedgerRowAsync(
                    "it-device-gate",
                    "IT_DEVICE_GATE",
                    "IT: Mang Thiết Bị Vào/Ra (Mẫu 01/04)",
                    new object[]
                    {
                        new { key = "dueDate", label = "Ngày, giờ", type = "text" },
                        new { key = "assignee", label = "Người yêu cầu & Đơn vị", type = "text" },
                        new { key = "task", label = "Tên thiết bị & Serial", type = "text" },
                        new { key = "reason", label = "Lý do mang vào/ra", type = "text" },
                        new { key = "guard", label = "Xác nhận bảo vệ / IT", type = "text" },
                        new { key = "status", label = "Trạng thái", type = "status", options = new[] { "Chờ duyệt", "Đã cho phép", "Đã thu hồi/trả", "Hoàn thành" } }
                    },
                    cascade.DeviceGateCells,
                    ct);
            }

            if (cascade.MaintenanceCells != null)
            {
                await AppendItLedgerRowAsync(
                    "it-maintenance",
                    "IT_MAINTENANCE",
                    "IT: Bảo Trì, Bảo Hành (BTBH01/02)",
                    new object[]
                    {
                        new { key = "task", label = "Tên hệ thống / Thiết bị", type = "text" },
                        new { key = "mode", label = "Hình thức & Phương thức", type = "text" },
                        new { key = "dueDate", label = "Thời gian thực hiện", type = "date" },
                        new { key = "assignee", label = "Người thực hiện", type = "text" },
                        new { key = "status", label = "Kết quả", type = "status", options = new[] { "Đang thực hiện", "Chờ nghiệm thu", "Hoàn thành" } }
                    },
                    cascade.MaintenanceCells,
                    ct);
            }

            return Ok(cascade);
        }

        [HttpPost("assets/{id}/lifecycle-event")]
        [AllowAnonymous]
        public async Task<IActionResult> TriggerAssetLifecycleEvent(string id, [FromBody] AssetLifecycleEventRequestDto req, CancellationToken ct)
        {
            var row = await FindPresetAsync(AssetType, id, ct);
            if (row == null) return NotFound(new { error = "Không tìm thấy tài sản CNTT." });
            var asset = JsonSerializer.Deserialize<IsmsAssetDto>(row.SynonymsJson, JsonOpts);
            if (asset == null) return BadRequest();

            var totpError = await ValidateCallerTotpIfEnabledAsync(req?.TotpCode, ct);
            if (totpError != null) return totpError;

            var cascade = ItLedgerAutomationHelper.BuildAssetLifecycleCascade(
                asset.AssetCode,
                asset.Name,
                asset.Location,
                req?.EventType ?? "HANDOVER_INSTALL",
                req?.NewLocation,
                req?.NewOwner,
                req?.PerformedBy,
                req?.Mode,
                req?.Note);

            if (!string.IsNullOrWhiteSpace(req?.NewLocation)) asset.Location = req.NewLocation.Trim();
            if (!string.IsNullOrWhiteSpace(req?.NewOwner)) asset.Owner = req.NewOwner.Trim();
            if (req?.EventType == "DISPOSE") asset.WarrantyStatus = "Đã thu hồi / Hủy an toàn (A.7.14)";
            asset.LifecycleHistory.Insert(0, $"[{cascade.Timestamp}] {req?.EventType} → {string.Join(" + ", cascade.TriggeredLedgers)} ({req?.Note ?? req?.PerformedBy ?? "IT"})");
            asset.UpdatedAt = DateTimeOffset.UtcNow;
            row.SynonymsJson = JsonSerializer.Serialize(asset, JsonOpts);
            await _db.SaveChangesAsync(ct);

            if (cascade.TriggeredLedgers.Contains("IT_HANDOVER_INSTALL") && cascade.PmcCells.Count > 0)
            {
                await AppendItLedgerRowAsync(
                    "it-handover-install",
                    "IT_HANDOVER_INSTALL",
                    "IT: Giao Nhận, Xuất Nhập & Lắp Đặt (Mẫu 02)",
                    new object[]
                    {
                        new { key = "dueDate", label = "Ngày thực hiện", type = "date" },
                        new { key = "task", label = "Nội dung & Tài sản", type = "text" },
                        new { key = "assignee", label = "Đơn vị / Người nhận", type = "text" },
                        new { key = "location", label = "Vị trí lắp đặt", type = "text" },
                        new { key = "note", label = "Ghi chú / Người giao", type = "text" },
                        new { key = "status", label = "Trạng thái", type = "status", options = new[] { "Chờ duyệt", "Hoàn thành" } }
                    },
                    cascade.PmcCells,
                    ct);
            }

            if (cascade.MaintenanceCells != null)
            {
                await AppendItLedgerRowAsync(
                    "it-maintenance",
                    "IT_MAINTENANCE",
                    "IT: Bảo Trì, Bảo Hành (BTBH01/02)",
                    new object[]
                    {
                        new { key = "task", label = "Tên hệ thống / Thiết bị", type = "text" },
                        new { key = "mode", label = "Hình thức & Phương thức", type = "text" },
                        new { key = "dueDate", label = "Thời gian thực hiện", type = "date" },
                        new { key = "assignee", label = "Người thực hiện", type = "text" },
                        new { key = "status", label = "Kết quả", type = "status", options = new[] { "Đang thực hiện", "Chờ nghiệm thu", "Hoàn thành" } }
                    },
                    cascade.MaintenanceCells,
                    ct);
            }

            if (cascade.DeviceGateCells != null)
            {
                await AppendItLedgerRowAsync(
                    "it-device-gate",
                    "IT_DEVICE_GATE",
                    "IT: Mang Thiết Bị Vào/Ra (Mẫu 01/04)",
                    new object[]
                    {
                        new { key = "dueDate", label = "Ngày, giờ", type = "text" },
                        new { key = "assignee", label = "Người yêu cầu & Đơn vị", type = "text" },
                        new { key = "task", label = "Tên thiết bị & Serial", type = "text" },
                        new { key = "reason", label = "Lý do mang vào/ra", type = "text" },
                        new { key = "guard", label = "Xác nhận bảo vệ / IT", type = "text" },
                        new { key = "status", label = "Trạng thái", type = "status", options = new[] { "Chờ duyệt", "Đã cho phép", "Đã thu hồi/trả", "Hoàn thành" } }
                    },
                    cascade.DeviceGateCells,
                    ct);
            }

            if (cascade.TriggeredLedgers.Contains("PMC_SERVER_ROOM"))
            {
                await AppendItLedgerRowAsync(
                    "it-pmc-server-room",
                    "PMC_SERVER_ROOM",
                    "IT: Nhật Ký Phòng Máy Chủ (PMC-01)",
                    new object[]
                    {
                        new { key = "dueDate", label = "Ngày/Giờ kiểm tra", type = "text" },
                        new { key = "assignee", label = "Cán bộ vào/kiểm tra", type = "text" },
                        new { key = "task", label = "Mục đích / Nội dung", type = "text" },
                        new { key = "temp", label = "Nhiệt độ / Độ ẩm", type = "text" },
                        new { key = "status", label = "Trạng thái hệ thống", type = "status", options = new[] { "Bình thường", "Cảnh báo nhẹ", "Đang xử lý", "Hoàn thành" } }
                    },
                    new Dictionary<string, string>
                    {
                        ["dueDate"] = cascade.Timestamp,
                        ["assignee"] = req?.PerformedBy ?? "Cán bộ QLVH CNTT",
                        ["task"] = $"[{cascade.CorrelationId}] {req?.EventType}: {asset.AssetCode} {asset.Name}",
                        ["temp"] = "21°C / 50%",
                        ["status"] = "Bình thường"
                    },
                    ct);
            }

            return Ok(new { asset, cascade });
        }

        private async Task AppendItLedgerRowAsync(
            string ledgerId,
            string kind,
            string title,
            object[] columns,
            Dictionary<string, string> cells,
            CancellationToken ct)
        {
            var existing = await FindPresetAsync("AEGIS_SMART_LEDGER", ledgerId, ct);
            var rows = new List<object>();
            if (existing != null)
            {
                try
                {
                    using var doc = JsonDocument.Parse(existing.SynonymsJson);
                    if (doc.RootElement.TryGetProperty("rows", out var existingRows) && existingRows.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var r in existingRows.EnumerateArray())
                        {
                            rows.Add(JsonSerializer.Deserialize<object>(r.GetRawText(), JsonOpts)!);
                        }
                    }
                }
                catch { /* start fresh if malformed */ }
            }

            rows.Insert(0, new { id = $"row-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}", cells });
            var payload = new
            {
                id = ledgerId,
                kind,
                title,
                groupName = "Vận hành IT & ISO 27001",
                columns,
                rows,
                updatedAt = DateTimeOffset.UtcNow.ToString("O")
            };
            await _ledger.SaveLedgerJsonAsync(_tenant.CurrentTenantId, ledgerId, title, JsonSerializer.Serialize(payload), ct);
        }

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
                columns = new object[]
                {
                    new { key = "task", label = "Đầu việc / Nhiệm vụ", type = "text" },
                    new { key = "assignee", label = "Người phụ trách", type = "text" },
                    new { key = "dueDate", label = "Hạn chót", type = "date" },
                    new { key = "status", label = "Trạng thái", type = "status", options = new[] { "Chờ làm", "Đang làm", "Chờ duyệt", "Hoàn thành" } },
                    new { key = "progress", label = "Tiến độ (%)", type = "percent" }
                },
                rows = new[]
                {
                    new
                    {
                        id = "r1",
                        cells = new Dictionary<string, string>
                        {
                            ["task"] = note,
                            ["assignee"] = string.IsNullOrWhiteSpace(owner) ? "CISO / Quản trị ATTT" : owner,
                            ["dueDate"] = dueDate,
                            ["status"] = "Đang làm",
                            ["progress"] = "25"
                        }
                    }
                },
                updatedAt = DateTimeOffset.UtcNow.ToString("O")
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
