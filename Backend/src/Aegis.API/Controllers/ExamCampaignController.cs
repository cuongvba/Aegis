using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;
using Aegis.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aegis.API.Controllers
{
    [ApiController]
    [Route("api/exam-campaigns")]
    [AllowAnonymous] // Phục vụ Live Telemetry & Quản trị Doanh nghiệp
    public class ExamCampaignController : ControllerBase
    {
        private readonly IExamCampaignService _campaignService;

        public ExamCampaignController(IExamCampaignService campaignService)
        {
            _campaignService = campaignService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllCampaigns([FromQuery] Guid? tenantId, CancellationToken ct)
        {
            var result = await _campaignService.GetAllCampaignsAsync(tenantId, ct);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCampaignDetail(Guid id, CancellationToken ct)
        {
            var detail = await _campaignService.GetCampaignDetailAsync(id, ct);
            if (detail == null) return NotFound(new { message = "Chiến dịch khảo thí không tồn tại." });
            return Ok(detail);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCampaign([FromBody] CreateCampaignRequestDto request, CancellationToken ct)
        {
            string creator = User?.Identity?.Name ?? "Admin";
            var created = await _campaignService.CreateCampaignAsync(request, null, creator, ct);
            return Ok(created);
        }

        [HttpPost("{id}/tracks")]
        public async Task<IActionResult> AddTrack(Guid id, [FromBody] CreateTrackRequestDto request, CancellationToken ct)
        {
            var track = await _campaignService.AddTrackAsync(id, request, ct);
            return Ok(track);
        }

        [HttpGet("{id}/tenant-topics")]
        public async Task<IActionResult> GetTenantTopics(Guid id, CancellationToken ct)
        {
            var topics = await _campaignService.GetTenantTopicsAsync(id, ct);
            return Ok(topics);
        }

        [HttpPost("{id}/papers/auto-matrix")]
        public async Task<IActionResult> CreateAutoPaper(Guid id, [FromBody] CreateAutoPaperRequestDto request, CancellationToken ct)
        {
            var paper = await _campaignService.CreateAutoPaperAsync(request, ct);
            return Ok(paper);
        }

        [HttpPost("{id}/papers/manual")]
        public async Task<IActionResult> CreateManualPaper(Guid id, [FromBody] CreateManualPaperRequestDto request, CancellationToken ct)
        {
            var paper = await _campaignService.CreateManualPaperAsync(request, ct);
            return Ok(paper);
        }

        [HttpPost("{id}/papers/{paperId}/swap-item")]
        public async Task<IActionResult> SwapPaperItem(Guid id, Guid paperId, [FromBody] SwapPaperItemRequestDto request, CancellationToken ct)
        {
            var updated = await _campaignService.SwapPaperItemAsync(paperId, request, ct);
            return Ok(updated);
        }

        [HttpPost("{id}/papers/{paperId}/seal")]
        public async Task<IActionResult> SealPaper(Guid id, Guid paperId, CancellationToken ct)
        {
            string sealedBy = User?.Identity?.Name ?? "No.1 Council";
            var sealedPaper = await _campaignService.SealPaperAsync(paperId, sealedBy, ct);
            return Ok(sealedPaper);
        }

        [HttpGet("{id}/candidates")]
        public async Task<IActionResult> GetCandidates(
            Guid id,
            [FromQuery] string? orgFilter,
            [FromQuery] Guid? paperFilter,
            CancellationToken ct)
        {
            var candidates = await _campaignService.GetCandidatesAsync(id, orgFilter, paperFilter, ct);
            return Ok(candidates);
        }

        [HttpPost("{id}/candidates/auto-allocate")]
        public async Task<IActionResult> AutoAllocate(Guid id, CancellationToken ct)
        {
            int count = await _campaignService.AutoAllocateCandidatesFromOrgHierarchyAsync(id, ct);
            return Ok(new { allocatedCount = count, message = $"Đã tự động gán đề thi cho {count} thí sinh theo Cây Cơ Cấu Tổ Chức O(1)." });
        }

        [HttpPost("{id}/candidates/manual-override")]
        public async Task<IActionResult> ManualOverride(Guid id, [FromBody] ManualOverrideCandidateRequestDto request, CancellationToken ct)
        {
            int count = await _campaignService.ManualOverrideCandidatesAsync(id, request, ct);
            return Ok(new { modifiedCount = count, message = $"Đã điều chỉnh đề thi cho {count} thí sinh." });
        }

        [HttpPost("{id}/candidates/batch-import")]
        public async Task<IActionResult> BatchImport(Guid id, [FromBody] List<BatchImportCandidateItemDto> items, CancellationToken ct)
        {
            int count = await _campaignService.BatchImportCandidatesAsync(id, items, ct);
            return Ok(new { importedCount = count, message = $"Đã xử lý nhập danh sách {count} thí sinh từ Excel." });
        }

        [HttpGet("{id}/results")]
        public async Task<IActionResult> GetResultsAnalytics(Guid id, CancellationToken ct)
        {
            var analytics = await _campaignService.GetCampaignResultsAnalyticsAsync(id, ct);
            return Ok(analytics);
        }
    }
}

