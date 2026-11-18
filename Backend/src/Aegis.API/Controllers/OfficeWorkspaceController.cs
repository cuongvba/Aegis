using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;
using Aegis.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Aegis.API.Controllers
{
    [ApiController]
    [Route("api/office-workspace")]
    public class OfficeWorkspaceController : ControllerBase
    {
        private readonly IOfficeDocumentWorkspaceService _workspace;
        private readonly IKidsCurriculumService _kidsService;
        private readonly ITenantContext _tenant;

        public OfficeWorkspaceController(
            IOfficeDocumentWorkspaceService workspace,
            IKidsCurriculumService kidsService,
            ITenantContext tenant)
        {
            _workspace = workspace;
            _kidsService = kidsService;
            _tenant = tenant;
        }

        [HttpPost("parse")]
        [AllowAnonymous]
        [RequestSizeLimit(50 * 1024 * 1024)]
        public async Task<IActionResult> ParseDocument(IFormFile? file, CancellationToken ct)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "Vui lòng chọn tệp .docx, .pdf, .xlsx, .xls, .md hoặc .txt." });

            try
            {
                await using var stream = file.OpenReadStream();
                var parsed = await _workspace.ParseDocumentAsync(stream, file.FileName, ct);
                return Ok(parsed);
            }
            catch (NotSupportedException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("export-docx")]
        [AllowAnonymous]
        public IActionResult ExportDocx([FromBody] OfficeExportDocxRequestDto request)
        {
            if (request == null)
                return BadRequest(new { error = "Request body is required." });

            byte[] bytes = _workspace.ExportDocx(request);
            string safeName = SanitizeFileName(request.Title, "aegis-document") + ".docx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", safeName);
        }

        [HttpPost("export-xlsx")]
        [AllowAnonymous]
        public IActionResult ExportXlsx([FromBody] OfficeExportXlsxRequestDto request)
        {
            if (request == null)
                return BadRequest(new { error = "Request body is required." });

            byte[] bytes = _workspace.ExportXlsx(request);
            string safeName = SanitizeFileName(request.Title, "aegis-workbook") + ".xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", safeName);
        }

        [HttpPost("ai-assist")]
        [AllowAnonymous]
        public async Task<IActionResult> RunAiAssist([FromBody] OfficeAiAssistRequestDto request, CancellationToken ct)
        {
            if (request == null)
                return BadRequest(new { error = "Request body is required." });

            var result = await _workspace.RunAiAssistAsync(_tenant.CurrentTenantId, request, ct);
            return Ok(result);
        }

        [HttpPost("send-to-kids")]
        [AllowAnonymous]
        public async Task<IActionResult> SendToKids([FromBody] OfficeSendToKidsRequestDto request, CancellationToken ct)
        {
            if (request == null || (string.IsNullOrWhiteSpace(request.Title) && string.IsNullOrWhiteSpace(request.MarkdownContent)))
                return BadRequest(new { error = "Vui lòng nhập tiêu đề hoặc nội dung tài liệu." });

            string excerpt = (request.MarkdownContent ?? string.Empty).Trim();
            if (excerpt.Length > 450) excerpt = excerpt.Substring(0, 450);
            string topic = string.IsNullOrWhiteSpace(excerpt)
                ? request.Title.Trim()
                : $"{request.Title.Trim()} ({excerpt})";
            if (topic.Length > 200) topic = request.Title.Trim();

            var res = await _kidsService.BuildCurriculumWithAiAsync(_tenant.CurrentTenantId, new AiBuildKidsCurriculumRequestDto
            {
                TopicTitle = topic,
                IslandId = string.IsNullOrWhiteSpace(request.IslandId) ? "heritage" : request.IslandId,
                AgeBand = string.IsNullOrWhiteSpace(request.AgeBand) ? "6-8" : request.AgeBand,
                RegionCode = string.IsNullOrWhiteSpace(request.RegionCode) ? "VN" : request.RegionCode,
                LanguageCode = "vi",
                ItemCount = request.ItemCount > 0 ? request.ItemCount : 4
            }, ct);

            return Ok(res);
        }

        private static string SanitizeFileName(string? raw, string fallback)
        {
            if (string.IsNullOrWhiteSpace(raw)) return fallback;
            var invalid = Path.GetInvalidFileNameChars();
            var chars = raw.Trim().ToCharArray();
            for (int i = 0; i < chars.Length; i++)
            {
                if (Array.IndexOf(invalid, chars[i]) >= 0) chars[i] = '_';
            }
            string cleaned = new string(chars).Trim();
            return string.IsNullOrWhiteSpace(cleaned) ? fallback : cleaned;
        }
    }
}
