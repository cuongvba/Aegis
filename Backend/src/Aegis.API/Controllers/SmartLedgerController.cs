using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aegis.API.Controllers
{
    [ApiController]
    [Route("api/smart-ledgers")]
    public class SmartLedgerController : ControllerBase
    {
        private readonly ISmartLedgerService _ledgerService;
        private readonly IOfficeDocumentWorkspaceService _workspace;
        private readonly ITenantContext _tenant;

        public SmartLedgerController(
            ISmartLedgerService ledgerService,
            IOfficeDocumentWorkspaceService workspace,
            ITenantContext tenant)
        {
            _ledgerService = ledgerService;
            _workspace = workspace;
            _tenant = tenant;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var items = await _ledgerService.GetLedgersJsonAsync(_tenant.CurrentTenantId, ct);
            return Ok(items);
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Save([FromBody] JsonElement payload, CancellationToken ct)
        {
            string id = payload.TryGetProperty("id", out var idEl) ? (idEl.GetString() ?? string.Empty) : string.Empty;
            string title = payload.TryGetProperty("title", out var tEl) ? (tEl.GetString() ?? "Smart Ledger") : "Smart Ledger";
            if (string.IsNullOrWhiteSpace(id)) id = $"ledger-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";

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
    }
}
