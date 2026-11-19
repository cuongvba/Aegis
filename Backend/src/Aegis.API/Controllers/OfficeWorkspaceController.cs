using System;
using System.Collections.Generic;
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
        private readonly IArchiveSecurityService _archive;
        private readonly IKidsCurriculumService _kidsService;
        private readonly ITenantContext _tenant;

        public OfficeWorkspaceController(
            IOfficeDocumentWorkspaceService workspace,
            IArchiveSecurityService archive,
            IKidsCurriculumService kidsService,
            ITenantContext tenant)
        {
            _workspace = workspace;
            _archive = archive;
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

        [HttpPost("protect-pdf")]
        [AllowAnonymous]
        [RequestSizeLimit(52_428_800)]
        public async Task<IActionResult> ProtectPdf([FromForm] IFormFile file, [FromForm] string password, CancellationToken ct)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "PDF file is required." });
            if (string.IsNullOrWhiteSpace(password))
                return BadRequest(new { error = "Password is required." });

            string workDir = Path.Combine(Path.GetTempPath(), $"aegis_qpdf_{Guid.NewGuid():N}");
            Directory.CreateDirectory(workDir);
            string inPath = Path.Combine(workDir, "input.pdf");
            string outPath = Path.Combine(workDir, "protected.pdf");

            try
            {
                await using (var fs = System.IO.File.Create(inPath))
                {
                    await file.CopyToAsync(fs, ct);
                }

                var psi = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "qpdf",
                    RedirectStandardError = true,
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                };
                psi.ArgumentList.Add("--encrypt");
                psi.ArgumentList.Add(password);
                psi.ArgumentList.Add(password);
                psi.ArgumentList.Add("256");
                psi.ArgumentList.Add("--");
                psi.ArgumentList.Add(inPath);
                psi.ArgumentList.Add(outPath);

                using var proc = System.Diagnostics.Process.Start(psi);
                if (proc == null)
                    return StatusCode(500, new { error = "Failed to launch qpdf process." });

                string stderr = await proc.StandardError.ReadToEndAsync(ct);
                await proc.WaitForExitAsync(ct);

                if (proc.ExitCode != 0 || !System.IO.File.Exists(outPath))
                    return StatusCode(500, new { error = $"PDF encryption failed: {stderr}" });

                byte[] protectedBytes = await System.IO.File.ReadAllBytesAsync(outPath, ct);
                string baseName = Path.GetFileNameWithoutExtension(file.FileName);
                string safeName = SanitizeFileName(baseName, "aegis-protected") + "-protected.pdf";
                return File(protectedBytes, "application/pdf", safeName);
            }
            finally
            {
                try { if (Directory.Exists(workDir)) Directory.Delete(workDir, recursive: true); } catch { }
            }
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

        [HttpPost("archive/pack-7z")]
        [AllowAnonymous]
        [RequestSizeLimit(104_857_600)]
        public async Task<IActionResult> Pack7z([FromForm] List<IFormFile> files, [FromForm] string? password, [FromForm] string? archiveName, CancellationToken ct)
        {
            if (files == null || files.Count == 0)
                return BadRequest(new { error = "Cần chọn ít nhất 1 tệp để nén .7z." });

            var inputs = new List<ArchiveInputFile>(files.Count);
            foreach (var f in files)
            {
                await using var ms = new MemoryStream();
                await f.CopyToAsync(ms, ct);
                inputs.Add(new ArchiveInputFile { FileName = f.FileName, Content = ms.ToArray() });
            }

            try
            {
                byte[] archiveBytes = await _archive.Pack7zAsync(inputs, password, ct);
                string safeName = SanitizeFileName(archiveName, "aegis-secure-archive");
                if (!safeName.EndsWith(".7z", StringComparison.OrdinalIgnoreCase)) safeName += ".7z";
                return File(archiveBytes, "application/x-7z-compressed", safeName);
            }
            catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("archive/inspect")]
        [AllowAnonymous]
        [RequestSizeLimit(104_857_600)]
        public async Task<IActionResult> InspectArchive([FromForm] IFormFile archive, [FromForm] string? password, CancellationToken ct)
        {
            if (archive == null || archive.Length == 0)
                return BadRequest(new { error = "Vui lòng chọn tệp nén (.7z, .zip)." });

            await using var stream = archive.OpenReadStream();
            var res = await _archive.InspectArchiveAsync(stream, archive.FileName, password, ct);
            if (!res.PasswordValid && res.RequiresPassword)
                return StatusCode(StatusCodes.Status401Unauthorized, res);
            return Ok(res);
        }

        [HttpPost("archive/read-entry")]
        [AllowAnonymous]
        [RequestSizeLimit(104_857_600)]
        public async Task<IActionResult> ReadArchiveEntry([FromForm] IFormFile archive, [FromForm] string entryPath, [FromForm] string? password, CancellationToken ct)
        {
            if (archive == null || archive.Length == 0)
                return BadRequest(new { error = "Thiếu tệp nén nguồn." });

            try
            {
                await using var stream = archive.OpenReadStream();
                var (bytes, fileName) = await _archive.ExtractEntryAsync(stream, archive.FileName, entryPath, password, ct);
                await using var docMs = new MemoryStream(bytes);
                var parsed = await _workspace.ParseDocumentAsync(docMs, fileName, ct);
                return Ok(parsed);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, new { error = ex.Message, requiresPassword = true });
            }
            catch (Exception ex) when (ex is NotSupportedException || ex is ArgumentException || ex is InvalidOperationException || ex is FileNotFoundException)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("archive/extract-entry")]
        [AllowAnonymous]
        [RequestSizeLimit(104_857_600)]
        public async Task<IActionResult> ExtractArchiveEntry([FromForm] IFormFile archive, [FromForm] string entryPath, [FromForm] string? password, CancellationToken ct)
        {
            if (archive == null || archive.Length == 0)
                return BadRequest(new { error = "Thiếu tệp nén nguồn." });

            try
            {
                await using var stream = archive.OpenReadStream();
                var (bytes, fileName) = await _archive.ExtractEntryAsync(stream, archive.FileName, entryPath, password, ct);
                return File(bytes, "application/octet-stream", SanitizeFileName(fileName, "extracted-file"));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status401Unauthorized, new { error = ex.Message, requiresPassword = true });
            }
            catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException || ex is FileNotFoundException)
            {
                return BadRequest(new { error = ex.Message });
            }
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
