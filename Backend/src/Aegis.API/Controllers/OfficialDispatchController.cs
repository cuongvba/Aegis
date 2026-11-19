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
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Aegis.API.Controllers
{
    public class OfficialDispatchDto
    {
        public string Id { get; set; } = string.Empty;
        public string DispatchNumber { get; set; } = string.Empty; // Số hiệu công văn (VD: 125/CV-AEGIS)
        public string Direction { get; set; } = "OUTGOING"; // INCOMING | OUTGOING | INTERNAL_DOC
        public string Title { get; set; } = string.Empty;
        public string ContentMarkdown { get; set; } = string.Empty;
        public string Status { get; set; } = "DRAFT"; // DRAFT | PENDING_APPROVAL | APPROVED_LOCKED | PUBLISHED
        public ResourceAccessPolicy AccessPolicy { get; set; } = new();
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    [ApiController]
    [Route("api/dispatches")]
    public class OfficialDispatchController : ControllerBase
    {
        private const string DispatchCoordinateType = "AEGIS_OFFICIAL_DISPATCH";
        private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

        private readonly AegisDbContext _db;
        private readonly ICrudapAccessControlService _crudap;
        private readonly ITenantContext _tenant;

        public OfficialDispatchController(AegisDbContext db, ICrudapAccessControlService crudap, ITenantContext tenant)
        {
            _db = db;
            _crudap = crudap;
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

        [HttpPost]
        [Authorize]
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

            bool reqApprove = dto.Status == "APPROVED_LOCKED" || dto.AccessPolicy.IsApprovedLocked;
            var check = _crudap.ValidateMutation(caller, oldPolicy, dto.AccessPolicy, requestingApproval: reqApprove);
            if (!check.Allowed)
                return StatusCode(403, new { error = check.DeniedReason });

            if (reqApprove) dto.AccessPolicy.IsApprovedLocked = true;
            dto.UpdatedAt = DateTimeOffset.UtcNow;
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
            return Ok(dto);
        }

        private CallerSecurityContext BuildCaller()
        {
            string role = User.FindFirstValue(ClaimTypes.Role) ?? "MEMBER";
            int weight = role.Equals("ADMIN", StringComparison.OrdinalIgnoreCase) ? 95
                : role.Equals("DIRECTOR", StringComparison.OrdinalIgnoreCase) || role.Equals("MANAGER", StringComparison.OrdinalIgnoreCase) ? 65 : 20;
            return new CallerSecurityContext
            {
                UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? string.Empty,
                Email = User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
                Role = role,
                RoleWeight = weight,
                OrgUnitId = Request.Headers["X-Org-Unit"].ToString(),
                TenantId = _tenant.CurrentTenantId,
                IsAuthenticated = User.Identity?.IsAuthenticated ?? false
            };
        }
    }
}
