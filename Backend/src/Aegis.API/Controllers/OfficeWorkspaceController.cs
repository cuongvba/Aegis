using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
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

        public OfficeWorkspaceController(IOfficeDocumentWorkspaceService workspace)
        {
            _workspace = workspace;
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
