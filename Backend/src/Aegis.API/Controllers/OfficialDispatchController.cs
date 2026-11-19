using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.Interfaces;
using Aegis.Domain.Entities;
using Aegis.Domain.Security;
using Aegis.Infrastructure.Data;
using Aegis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Aegis.API.Controllers
{
    public class OfficialDispatchDto
    {
        public string Id { get; set; } = string.Empty;
        public string DispatchNumber { get; set; } = string.Empty;
        public string Direction { get; set; } = "INCOMING"; // INCOMING | OUTGOING | INTERNAL_DOC
        public string Urgency { get; set; } = "THUONG"; // THUONG | KHAN | HOA_TOC
        public string Title { get; set; } = string.Empty;
        public string ContentMarkdown { get; set; } = string.Empty;
        public string Status { get; set; } = "RECEIVED_DRAFT";
        public string ExecutiveDirective { get; set; } = string.Empty;
        public string LeadAssignee { get; set; } = string.Empty;
        public string LeadAssigneeEmail { get; set; } = string.Empty;
        public string DueDate { get; set; } = string.Empty;
        public int ProgressPercent { get; set; }
        public string ResultReport { get; set; } = string.Empty;
        public int QualityStars { get; set; }
        public double SlaScore { get; set; }
        public double FinalScore { get; set; }
        public List<string> AuditHistory { get; set; } = new();
        public ResourceAccessPolicy AccessPolicy { get; set; } = new();
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    public class DispatchTransitionRequestDto
    {
        public string TargetStatus { get; set; } = string.Empty;
        public string? ExecutiveDirective { get; set; }
        public string? LeadAssignee { get; set; }
        public string? LeadAssigneeEmail { get; set; }
        public string? DueDate { get; set; }
        public int? ProgressPercent { get; set; }
        public string? ResultReport { get; set; }
        public int? QualityStars { get; set; }
        public string? Note { get; set; }
    }

    [ApiController]
    [Route("api/dispatches")]
    public class OfficialDispatchController : ControllerBase
    {
        private const string DispatchCoordinateType = "AEGIS_OFFICIAL_DISPATCH";
        private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

        private readonly AegisDbContext _db;
        private readonly ICrudapAccessControlService _crudap;
        private readonly IOfficeDocumentWorkspaceService _workspace;
        private readonly ISmartLedgerService _ledger;
        private readonly ITenantContext _tenant;

        public OfficialDispatchController(
            AegisDbContext db,
            ICrudapAccessControlService crudap,
            IOfficeDocumentWorkspaceService workspace,
            ISmartLedgerService ledger,
            ITenantContext tenant)
        {
            _db = db;
            _crudap = crudap;
            _workspace = workspace;
            _ledger = ledger;
            _tenant = tenant;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> List(CancellationToken ct)
        {
            var caller = BuildCaller();
            var rows = await _db.TenantCoordinatePresets
                .AsNoTracking()
                .Where(p => p.TenantId == _tenant.CurrentTenantId && p.CoordinateType == DispatchCoordinateType)
                .OrderByDescending(p => p.Id)
                .ToListAsync(ct);

            var result = new List<OfficialDispatchDto>();
            foreach (var r in rows)
            {
                var dto = JsonSerializer.Deserialize<OfficialDispatchDto>(r.SynonymsJson, JsonOpts);
                if (dto == null) continue;
                dto.AccessPolicy.TenantId = _tenant.CurrentTenantId;
                if (_crudap.HasPermission(caller, dto.AccessPolicy, CrudapPermission.Read))
                    result.Add(dto);
            }
            return Ok(result);
        }

        [HttpPost("ocr-extract")]
        [AllowAnonymous]
        [RequestSizeLimit(52_428_800)]
        public async Task<IActionResult> OcrExtract([FromForm] IFormFile file, CancellationToken ct)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "Vui lòng chọn file công văn (.pdf, .docx, ảnh...)." });

            await using var ms = new MemoryStream();
            await file.CopyToAsync(ms, ct);
            ms.Position = 0;
            var parsed = await _workspace.ParseDocumentAsync(ms, file.FileName, ct);
            var (dispatchNo, urgency, summary) = DispatchWorkflowHelper.ExtractDispatchMetadata(parsed.MarkdownContent, file.FileName);

            return Ok(new
            {
                dispatchNumber = dispatchNo,
                urgency,
                title = string.IsNullOrWhiteSpace(parsed.Title) ? summary : parsed.Title,
                contentMarkdown = parsed.MarkdownContent,
                warnings = parsed.Warnings
            });
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Upsert([FromBody] OfficialDispatchDto dto, CancellationToken ct)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { error = "Tiêu đề công văn/tài liệu là bắt buộc." });

            var caller = BuildCaller();
            if (string.IsNullOrWhiteSpace(dto.Id)) dto.Id = $"doc-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";

            var existing = await _db.TenantCoordinatePresets.FirstOrDefaultAsync(
                p => p.TenantId == _tenant.CurrentTenantId && p.CoordinateType == DispatchCoordinateType && p.PresetCode == dto.Id,
                ct);

            ResourceAccessPolicy? oldPolicy = existing != null
                ? JsonSerializer.Deserialize<OfficialDispatchDto>(existing.SynonymsJson, JsonOpts)?.AccessPolicy
                : null;

            dto.AccessPolicy.ResourceType = "OFFICIAL_DISPATCH";
            dto.AccessPolicy.ResourceId = dto.Id;
            dto.AccessPolicy.TenantId = _tenant.CurrentTenantId;
            if (string.IsNullOrWhiteSpace(dto.AccessPolicy.OwnerUserId)) dto.AccessPolicy.OwnerUserId = caller.UserId;

            if (oldPolicy != null)
            {
                bool reqApprove = dto.Status == "EVALUATED_LOCKED" || dto.AccessPolicy.IsApprovedLocked;
                var check = _crudap.ValidateMutation(caller, oldPolicy, dto.AccessPolicy, requestingApproval: reqApprove);
                if (!check.Allowed) return StatusCode(403, new { error = check.DeniedReason });
            }

            if (dto.AuditHistory.Count == 0)
                dto.AuditHistory.Add($"[{DateTimeOffset.UtcNow:yyyy-MM-dd HH:mm}] Khởi tạo hồ sơ ({dto.Status})");

            dto.UpdatedAt = DateTimeOffset.UtcNow;
            await SaveRowAsync(existing, dto, ct);
            return Ok(dto);
        }

        [HttpPost("{id}/transition")]
        [AllowAnonymous]
        public async Task<IActionResult> Transition(string id, [FromBody] DispatchTransitionRequestDto req, CancellationToken ct)
        {
            var existing = await _db.TenantCoordinatePresets.FirstOrDefaultAsync(
                p => p.TenantId == _tenant.CurrentTenantId && p.CoordinateType == DispatchCoordinateType && p.PresetCode == id,
                ct);
            if (existing == null) return NotFound(new { error = "Không tìm thấy hồ sơ công văn." });

            var dto = JsonSerializer.Deserialize<OfficialDispatchDto>(existing.SynonymsJson, JsonOpts);
            if (dto == null) return BadRequest();

            if (!DispatchWorkflowHelper.CanTransition(dto.Status, req.TargetStatus))
                return BadRequest(new { error = $"Không thể chuyển trạng thái từ {dto.Status} sang {req.TargetStatus}." });

            var caller = BuildCaller();
            bool isApprovalStep = req.TargetStatus is "ASSIGNED" or "EVALUATED_LOCKED";
            if (caller.IsAuthenticated && dto.AccessPolicy != null)
            {
                var check = _crudap.ValidateMutation(caller, dto.AccessPolicy, dto.AccessPolicy, requestingApproval: isApprovalStep);
                if (!check.Allowed) return StatusCode(403, new { error = check.DeniedReason });
            }

            if (!string.IsNullOrWhiteSpace(req.ExecutiveDirective)) dto.ExecutiveDirective = req.ExecutiveDirective.Trim();
            if (!string.IsNullOrWhiteSpace(req.LeadAssignee)) dto.LeadAssignee = req.LeadAssignee.Trim();
            if (!string.IsNullOrWhiteSpace(req.LeadAssigneeEmail)) dto.LeadAssigneeEmail = req.LeadAssigneeEmail.Trim();
            if (!string.IsNullOrWhiteSpace(req.DueDate)) dto.DueDate = req.DueDate.Trim();
            if (req.ProgressPercent.HasValue) dto.ProgressPercent = Math.Clamp(req.ProgressPercent.Value, 0, 100);
            if (!string.IsNullOrWhiteSpace(req.ResultReport)) dto.ResultReport = req.ResultReport.Trim();

            dto.Status = req.TargetStatus;
            if (req.TargetStatus == "EVALUATED_LOCKED")
            {
                dto.ProgressPercent = 100;
                dto.QualityStars = Math.Clamp(req.QualityStars ?? 5, 1, 5);
                var (sla, _, _, finalScore) = DispatchWorkflowHelper.ComputeCompletionScore(dto.DueDate, DateTimeOffset.UtcNow, dto.QualityStars, dto.Urgency);
                dto.SlaScore = sla;
                dto.FinalScore = finalScore;
                dto.AccessPolicy.IsApprovedLocked = true;
            }

            dto.AuditHistory.Add($"[{DateTimeOffset.UtcNow:yyyy-MM-dd HH:mm}] -> {dto.Status} ({req.Note ?? caller.Role})");
            dto.UpdatedAt = DateTimeOffset.UtcNow;
            await SaveRowAsync(existing, dto, ct);

            // Auto-sync task to /work-ledger when Executive assigns dispatch
            if (req.TargetStatus == "ASSIGNED" && !string.IsNullOrWhiteSpace(dto.LeadAssignee))
            {
                await SyncToWorkLedgerAsync(dto, ct);
            }

            return Ok(dto);
        }

        private async Task SyncToWorkLedgerAsync(OfficialDispatchDto dto, CancellationToken ct)
        {
            string ledgerId = $"dispatch-tasks-{dto.Id}";
            var ledgerPayload = new
            {
                id = ledgerId,
                kind = "WORK_KPI",
                title = $"[CV {dto.DispatchNumber}] {dto.Title}",
                groupName = "Luồng Xử Lý Công Văn",
                columns = new object[]
                {
                    new { key = "task", label = "Đầu việc / Nhiệm vụ", type = "text" },
                    new { key = "assignee", label = "Người phụ trách", type = "text" },
                    new { key = "email", label = "Email (Lịch Google)", type = "email" },
                    new { key = "dueDate", label = "Hạn chót", type = "date" },
                    new { key = "status", label = "Trạng thái", type = "status", options = new[] { "Chờ làm", "Đang làm", "Chờ duyệt", "Hoàn thành" } },
                    new { key = "progress", label = "Tiến độ (%)", type = "percent" },
                    new { key = "rating", label = "Đánh giá KPI", type = "stars" }
                },
                rows = new[]
                {
                    new
                    {
                        id = $"row-{dto.Id}",
                        cells = new Dictionary<string, string>
                        {
                            ["task"] = $"{dto.Title} ({dto.ExecutiveDirective})",
                            ["assignee"] = dto.LeadAssignee,
                            ["email"] = dto.LeadAssigneeEmail,
                            ["dueDate"] = dto.DueDate,
                            ["status"] = "Đang làm",
                            ["progress"] = dto.ProgressPercent.ToString(),
                            ["rating"] = ""
                        }
                    }
                },
                updatedAt = DateTimeOffset.UtcNow
            };
            await _ledger.SaveLedgerJsonAsync(_tenant.CurrentTenantId, ledgerId, dto.Title, JsonSerializer.Serialize(ledgerPayload), ct);
        }

        private async Task SaveRowAsync(TenantCoordinatePreset? existing, OfficialDispatchDto dto, CancellationToken ct)
        {
            string json = JsonSerializer.Serialize(dto, JsonOpts);
            if (existing != null)
            {
                existing.PresetLabel = dto.Title;
                existing.SynonymsJson = json;
            }
            else
            {
                _db.TenantCoordinatePresets.Add(new TenantCoordinatePreset
                {
                    TenantId = _tenant.CurrentTenantId,
                    DomainCode = "DISPATCH",
                    CoordinateType = DispatchCoordinateType,
                    PresetCode = dto.Id,
                    PresetLabel = dto.Title,
                    SynonymsJson = json,
                    DisplayOrder = 1
                });
            }
            await _db.SaveChangesAsync(ct);
        }

        private CallerSecurityContext BuildCaller()
        {
            bool auth = User?.Identity?.IsAuthenticated ?? false;
            string role = User?.FindFirstValue(ClaimTypes.Role) ?? (auth ? "MEMBER" : "GUEST");
            int weight = role.Equals("ADMIN", StringComparison.OrdinalIgnoreCase) ? 95
                : role.Equals("DIRECTOR", StringComparison.OrdinalIgnoreCase) || role.Equals("MANAGER", StringComparison.OrdinalIgnoreCase) ? 65 : 20;
            return new CallerSecurityContext
            {
                UserId = User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue("sub") ?? string.Empty,
                Email = User?.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                Role = role,
                RoleWeight = auth ? weight : 0,
                OrgUnitId = Request.Headers["X-Org-Unit"].ToString(),
                TenantId = _tenant.CurrentTenantId,
                IsAuthenticated = auth
            };
        }
    }
}
