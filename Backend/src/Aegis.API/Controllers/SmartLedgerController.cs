using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.Interfaces;
using Aegis.Domain.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aegis.API.Controllers
{
    [ApiController]
    [Route("api/smart-ledgers")]
    public class SmartLedgerController : ControllerBase
    {
        private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };
        private readonly ISmartLedgerService _ledgerService;
        private readonly IOfficeDocumentWorkspaceService _workspace;
        private readonly ICrudapAccessControlService _crudap;
        private readonly ITenantContext _tenant;

        public SmartLedgerController(
            ISmartLedgerService ledgerService,
            IOfficeDocumentWorkspaceService workspace,
            ICrudapAccessControlService crudap,
            ITenantContext tenant)
        {
            _ledgerService = ledgerService;
            _workspace = workspace;
            _crudap = crudap;
            _tenant = tenant;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var caller = BuildCallerContext();
            var items = await _ledgerService.GetLedgersJsonAsync(_tenant.CurrentTenantId, ct);
            var visible = new List<string>(items.Count);

            foreach (string raw in items)
            {
                var policy = ExtractPolicy(raw, _tenant.CurrentTenantId);
                if (policy == null || _crudap.HasPermission(caller, policy, CrudapPermission.Read))
                    visible.Add(raw);
            }
            return Ok(visible);
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Save([FromBody] JsonElement payload, CancellationToken ct)
        {
            var caller = BuildCallerContext();
            string id = payload.TryGetProperty("id", out var idEl) ? (idEl.GetString() ?? string.Empty) : string.Empty;
            string title = payload.TryGetProperty("title", out var tEl) ? (tEl.GetString() ?? "Smart Ledger") : "Smart Ledger";
            if (string.IsNullOrWhiteSpace(id)) id = $"ledger-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";

            var incomingPolicy = ExtractPolicy(payload.GetRawText(), _tenant.CurrentTenantId) ?? new ResourceAccessPolicy
            {
                ResourceType = "SMART_LEDGER",
                ResourceId = id,
                TenantId = _tenant.CurrentTenantId,
                OwnerUserId = caller.UserId,
                Visibility = ResourceVisibility.Tenant
            };

            var existingItems = await _ledgerService.GetLedgersJsonAsync(_tenant.CurrentTenantId, ct);
            ResourceAccessPolicy? existingPolicy = null;
            foreach (string raw in existingItems)
            {
                using var doc = JsonDocument.Parse(raw);
                if (doc.RootElement.TryGetProperty("id", out var eId) && string.Equals(eId.GetString(), id, StringComparison.OrdinalIgnoreCase))
                {
                    existingPolicy = ExtractPolicy(raw, _tenant.CurrentTenantId);
                    break;
                }
            }

            if (existingPolicy != null)
            {
                bool reqApprove = incomingPolicy.IsApprovedLocked && !existingPolicy.IsApprovedLocked;
                var check = _crudap.ValidateMutation(caller, existingPolicy, incomingPolicy, requestingApproval: reqApprove);
                if (!check.Allowed)
                    return StatusCode(403, new { error = check.DeniedReason ?? "Không đủ quyền CRUDAP." });
            }

            await _ledgerService.SaveLedgerJsonAsync(_tenant.CurrentTenantId, id, title, payload.GetRawText(), ct);
            return Ok(new { saved = true, id });
        }

        [HttpPost("ai-summary")]
        [AllowAnonymous]
        public async Task<IActionResult> AiSummary([FromBody] OfficeAiAssistRequestDto request, CancellationToken ct)
        {
            if (request == null) return BadRequest(new { error = "Request body is required." });
            request.Action = string.IsNullOrWhiteSpace(request.Action) ? "ANALYZE_SHEET" : request.Action;
            var res = await _workspace.RunAiAssistAsync(_tenant.CurrentTenantId, request, ct);
            return Ok(res);
        }

        private CallerSecurityContext BuildCallerContext()
        {
            bool auth = User?.Identity?.IsAuthenticated ?? false;
            string userId = User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue("sub") ?? string.Empty;
            string email = User?.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
            string role = User?.FindFirstValue(ClaimTypes.Role) ?? (auth ? "MEMBER" : "GUEST");
            int weight = role.Equals("ADMIN", StringComparison.OrdinalIgnoreCase) || role.Equals("SUPERADMIN", StringComparison.OrdinalIgnoreCase)
                ? 95
                : role.Equals("MANAGER", StringComparison.OrdinalIgnoreCase) || role.Equals("TEACHER", StringComparison.OrdinalIgnoreCase) ? 60 : 20;

            return new CallerSecurityContext
            {
                UserId = userId,
                Email = email,
                Role = role,
                RoleWeight = auth ? weight : 0,
                OrgUnitId = Request.Headers["X-Org-Unit"].ToString(),
                TenantId = _tenant.CurrentTenantId,
                IsAuthenticated = auth
            };
        }

        private static ResourceAccessPolicy? ExtractPolicy(string rawJson, Guid tenantId)
        {
            try
            {
                using var doc = JsonDocument.Parse(rawJson);
                if (!doc.RootElement.TryGetProperty("accessPolicy", out var pEl)) return null;
                var policy = JsonSerializer.Deserialize<ResourceAccessPolicy>(pEl.GetRawText(), JsonOpts);
                if (policy != null && policy.TenantId == Guid.Empty) policy.TenantId = tenantId;
                return policy;
            }
            catch { return null; }
        }
    }
}
