using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.Interfaces;
using Aegis.Domain.Entities;
using Aegis.Infrastructure.Data;
using Aegis.Infrastructure.Security;
using Aegis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Aegis.API.Controllers
{
    public class AppCatalogDto
    {
        public string Id { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Uri { get; set; } = string.Empty;
        public string GovernancePolicy { get; set; } = "Đổi mật khẩu mỗi 90 ngày, tối thiểu 12 ký tự, khuyến nghị SSO/2FA.";
        public int RotationDays { get; set; } = 90;
        public List<string> RelatedAppCodes { get; set; } = new();
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    public class AppAccountUpsertDto
    {
        public string? Id { get; set; }
        public string AppCode { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string PlainSecret { get; set; } = string.Empty;
        public int? RotationDays { get; set; }
        public string? Note { get; set; }
        public string? TotpCode { get; set; }
    }

    public class AppAccountRevealDto
    {
        public string TotpCode { get; set; } = string.Empty;
    }

    internal class StoredAppAccount
    {
        public string Id { get; set; } = string.Empty;
        public string OwnerKey { get; set; } = string.Empty;
        public string AppCode { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string EncryptedSecret { get; set; } = string.Empty;
        public int RotationDays { get; set; } = 90;
        public DateTimeOffset LastChangedAt { get; set; } = DateTimeOffset.UtcNow;
        public string Note { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/app-vault")]
    public class AppVaultController : ControllerBase
    {
        private const string AppCatalogType = "AEGIS_APP_CATALOG";
        private const string AppCredentialType = "AEGIS_APP_CREDENTIAL";
        private const string TotpType = "AEGIS_WORKFLOW_TOTP";
        private const string TotpMasterSecret = "Aegis-Dispatch-Workflow-TOTP-2026-Key";
        private const string VaultMasterSecret = "Aegis-App-Credential-Vault-AES256-GCM-2026";
        private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

        private readonly AegisDbContext _db;
        private readonly ITenantContext _tenant;

        public AppVaultController(AegisDbContext db, ITenantContext tenant)
        {
            _db = db;
            _tenant = tenant;
        }

        [HttpGet("catalog")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCatalog(CancellationToken ct)
        {
            var rows = await _db.TenantCoordinatePresets.AsNoTracking()
                .Where(p => p.TenantId == _tenant.CurrentTenantId && p.CoordinateType == AppCatalogType)
                .ToListAsync(ct);

            var list = rows
                .Select(r => { try { return JsonSerializer.Deserialize<AppCatalogDto>(r.SynonymsJson, JsonOpts); } catch { return null; } })
                .Where(x => x != null)
                .Cast<AppCatalogDto>()
                .OrderBy(a => a.Code)
                .ToList();

            if (list.Count == 0)
            {
                list.Add(new AppCatalogDto
                {
                    Id = "app-aegis",
                    Code = "AEGIS",
                    Name = "AegisGlobal Smart OS",
                    Uri = "http://localhost:3000",
                    GovernancePolicy = "Bắt buộc TOTP 2FA khi duyệt công văn, ISMS & mở két mật khẩu.",
                    RotationDays = 90,
                    RelatedAppCodes = new List<string> { "AD", "KEYCLOAK" }
                });
            }
            return Ok(list);
        }

        [HttpPost("catalog")]
        [AllowAnonymous]
        public async Task<IActionResult> UpsertCatalog([FromBody] AppCatalogDto dto, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { error = "Mã ứng dụng và Tên ứng dụng là bắt buộc." });

            dto.Code = dto.Code.Trim().ToUpperInvariant();
            dto.Id = string.IsNullOrWhiteSpace(dto.Id) ? $"app-{dto.Code.ToLowerInvariant()}" : dto.Id;
            dto.RotationDays = Math.Clamp(dto.RotationDays <= 0 ? 90 : dto.RotationDays, 7, 365);
            dto.UpdatedAt = DateTimeOffset.UtcNow;

            await UpsertPresetAsync(AppCatalogType, "APP_CATALOG", dto.Id, dto.Name, dto, ct);
            return Ok(dto);
        }

        [HttpGet("accounts")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAccounts(CancellationToken ct)
        {
            string ownerKey = ResolveCallerKey();
            var catalogRes = await GetCatalog(ct) as OkObjectResult;
            var catalog = (catalogRes?.Value as List<AppCatalogDto>) ?? new List<AppCatalogDto>();

            var rows = await _db.TenantCoordinatePresets.AsNoTracking()
                .Where(p => p.TenantId == _tenant.CurrentTenantId && p.CoordinateType == AppCredentialType)
                .ToListAsync(ct);

            var result = new List<object>();
            foreach (var r in rows)
            {
                var acc = JsonSerializer.Deserialize<StoredAppAccount>(r.SynonymsJson, JsonOpts);
                if (acc == null || !string.Equals(acc.OwnerKey, ownerKey, StringComparison.OrdinalIgnoreCase)) continue;

                var app = catalog.FirstOrDefault(a => a.Code.Equals(acc.AppCode, StringComparison.OrdinalIgnoreCase));
                int rotDays = acc.RotationDays > 0 ? acc.RotationDays : (app?.RotationDays ?? 90);
                var (nextDate, daysRem, status) = AppVaultHelper.ComputePasswordLifecycle(acc.LastChangedAt, rotDays);

                result.Add(new
                {
                    id = acc.Id,
                    appCode = acc.AppCode,
                    appName = app?.Name ?? acc.AppCode,
                    appUri = app?.Uri ?? string.Empty,
                    governancePolicy = app?.GovernancePolicy ?? string.Empty,
                    relatedAppCodes = app?.RelatedAppCodes ?? new List<string>(),
                    username = acc.Username,
                    rotationDays = rotDays,
                    lastChangedAt = acc.LastChangedAt.ToString("yyyy-MM-dd"),
                    nextRotationDate = nextDate,
                    daysRemaining = daysRem,
                    expiryStatus = status,
                    note = acc.Note,
                    hasEncryptedSecret = !string.IsNullOrEmpty(acc.EncryptedSecret)
                });
            }

            return Ok(result);
        }

        [HttpPost("accounts")]
        [AllowAnonymous]
        public async Task<IActionResult> UpsertAccount([FromBody] AppAccountUpsertDto req, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(req.AppCode) || string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.PlainSecret))
                return BadRequest(new { error = "Vui lòng nhập đủ Mã ứng dụng, Tài khoản và Mật khẩu." });

            string id = string.IsNullOrWhiteSpace(req.Id) ? $"cred-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}" : req.Id;
            var stored = new StoredAppAccount
            {
                Id = id,
                OwnerKey = ResolveCallerKey(),
                AppCode = req.AppCode.Trim().ToUpperInvariant(),
                Username = req.Username.Trim(),
                EncryptedSecret = ApiKeyEncryptionHelper.Encrypt(req.PlainSecret, VaultMasterSecret),
                RotationDays = Math.Clamp(req.RotationDays ?? 90, 7, 365),
                LastChangedAt = DateTimeOffset.UtcNow,
                Note = req.Note?.Trim() ?? string.Empty
            };

            await UpsertPresetAsync(AppCredentialType, "APP_VAULT", id, $"{stored.AppCode}:{stored.Username}", stored, ct);
            return Ok(new { id = stored.Id, appCode = stored.AppCode, username = stored.Username, encrypted = true });
        }

        [HttpPost("accounts/{id}/reveal")]
        [AllowAnonymous]
        public async Task<IActionResult> RevealSecret(string id, [FromBody] AppAccountRevealDto req, CancellationToken ct)
        {
            string ownerKey = ResolveCallerKey();
            var totpRow = await _db.TenantCoordinatePresets.AsNoTracking().FirstOrDefaultAsync(
                p => p.TenantId == _tenant.CurrentTenantId && p.CoordinateType == TotpType && p.PresetCode == ownerKey, ct);

            if (totpRow == null || !totpRow.SynonymsJson.Contains("\"Enabled\":true", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403, new
                {
                    requiresTotpSetup = true,
                    error = "Bắt buộc cài đặt & bật Authenticator (2FA) tại /dispatches trước khi giải mã mật khẩu."
                });
            }

            using var doc = JsonDocument.Parse(totpRow.SynonymsJson);
            string encTotp = doc.RootElement.TryGetProperty("EncryptedSecret", out var p) ? p.GetString() ?? "" : "";
            string totpSecret = ApiKeyEncryptionHelper.Decrypt(encTotp, TotpMasterSecret);
            if (string.IsNullOrWhiteSpace(req?.TotpCode) || !TotpSecurityHelper.ValidateTotpCode(totpSecret, req.TotpCode.Trim()))
            {
                return StatusCode(403, new { requiresTotp = true, error = "Mã Authenticator (2FA) 6 số không chính xác hoặc đã hết hạn." });
            }

            var credRow = await _db.TenantCoordinatePresets.AsNoTracking().FirstOrDefaultAsync(
                p => p.TenantId == _tenant.CurrentTenantId && p.CoordinateType == AppCredentialType && p.PresetCode == id, ct);
            if (credRow == null) return NotFound(new { error = "Không tìm thấy tài khoản trong két." });

            var stored = JsonSerializer.Deserialize<StoredAppAccount>(credRow.SynonymsJson, JsonOpts);
            if (stored == null || !string.Equals(stored.OwnerKey, ownerKey, StringComparison.OrdinalIgnoreCase))
                return StatusCode(403, new { error = "Không có quyền truy cập tài khoản này." });

            string plain = ApiKeyEncryptionHelper.Decrypt(stored.EncryptedSecret, VaultMasterSecret);
            return Ok(new { id = stored.Id, appCode = stored.AppCode, username = stored.Username, plainSecret = plain });
        }

        private string ResolveCallerKey()
        {
            string email = User?.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
            string userId = User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue("sub") ?? string.Empty;
            return !string.IsNullOrWhiteSpace(email) ? email.ToLowerInvariant()
                : (!string.IsNullOrWhiteSpace(userId) ? userId : $"tenant-{_tenant.CurrentTenantId}");
        }

        private async Task UpsertPresetAsync<T>(string coordType, string domain, string code, string label, T data, CancellationToken ct)
        {
            var existing = await _db.TenantCoordinatePresets.FirstOrDefaultAsync(
                p => p.TenantId == _tenant.CurrentTenantId && p.CoordinateType == coordType && p.PresetCode == code, ct);
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
    }
}
