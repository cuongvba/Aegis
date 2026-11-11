using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Aegis.Application.Interfaces;
using Aegis.Domain.Entities;
using Aegis.Infrastructure.Data;

namespace Aegis.API.Controllers
{
    /// <summary>
    /// [Enterprise Entitlements & Monetization Gateway]
    /// Cung cấp ma trận phân quyền 4 tầng: Tenant -> Domain -> Group (OrgUnit) -> User
    /// Cho phép Frontend render có điều kiện (Feature Gating), hiển thị Paywalls và thích ứng UI.
    /// </summary>
    [ApiController]
    [Route("api/entitlements")]
    [AllowAnonymous]
    public class EntitlementsController : ControllerBase
    {
        private readonly AegisDbContext _db;
        private readonly ITenantContext _tenantContext;
        private readonly ILogger<EntitlementsController> _logger;

        public EntitlementsController(
            AegisDbContext db,
            ITenantContext tenantContext,
            ILogger<EntitlementsController> logger)
        {
            _db = db;
            _tenantContext = tenantContext;
            _logger = logger;
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentEntitlements()
        {
            try
            {
                // 1. Xác định User & Tenant hiện tại
                string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                UserAccount? userAccount = null;
                if (!string.IsNullOrEmpty(userId) && Guid.TryParse(userId, out var parsedUserId))
                {
                    userAccount = await _db.UserAccounts
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.Id == parsedUserId);
                }

                var tenantId = _tenantContext.CurrentTenantId;
                if (tenantId == Guid.Empty)
                {
                    var claimVal = User.FindFirst("tenant_id")?.Value
                                ?? User.FindFirst("tenantId")?.Value
                                ?? User.FindFirst("TenantId")?.Value;
                    if (!string.IsNullOrEmpty(claimVal) && Guid.TryParse(claimVal, out var tid))
                    {
                        tenantId = tid;
                    }
                }

                if ((tenantId == Guid.Empty || tenantId == Tenant.CommunityTenantId) &&
                    userAccount != null && userAccount.TenantId != Guid.Empty)
                {
                    tenantId = userAccount.TenantId;
                }

                Tenant? tenant = null;
                if (tenantId != Guid.Empty)
                {
                    tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId);
                }

                // Fallback nếu không có tenant
                if (tenant == null)
                {
                    tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == Tenant.CommunityTenantId)
                          ?? await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.IsActive)
                          ?? new Tenant
                          {
                              Id = Tenant.CommunityTenantId,
                              Code = Tenant.CommunityTenantCode,
                              Name = "Aegis Community Platform",
                              Plan = TenantPlan.Starter,
                              ScaleType = TenantScaleType.Individual
                          };
                }

                // 2. Lấy thông tin User, Role, SubscriptionTier & Group (OrgUnit)
                string? role = userAccount?.Role
                            ?? User.FindFirst(ClaimTypes.Role)?.Value
                            ?? User.FindFirst("role")?.Value
                            ?? _tenantContext.CurrentRole;
                Guid? orgUnitId = userAccount?.OrgUnitId;
                string? orgUnitPath = null;
                var userCapabilities = new List<string>();

                if (!string.IsNullOrEmpty(userId))
                {
                    var userRole = await _db.UserRoles
                        .AsNoTracking()
                        .Where(r => r.UserId == userId && (r.TenantId == tenant.Id || r.TenantId == userAccount!.TenantId) && r.IsActive)
                        .FirstOrDefaultAsync();

                    if (userRole != null)
                    {
                        if (role != AppRoles.SystemAdmin)
                        {
                            role = userRole.Role;
                        }
                        orgUnitId ??= userRole.OrgUnitId;
                    }

                    if (orgUnitId.HasValue)
                    {
                        var ou = await _db.OrganizationUnits
                            .IgnoreQueryFilters()
                            .AsNoTracking()
                            .FirstOrDefaultAsync(x => x.Id == orgUnitId.Value);
                        orgUnitPath = ou?.HierarchyPath;
                    }

                    if (!string.IsNullOrEmpty(role))
                    {
                        userCapabilities.AddRange(AppRolePermissions.GetPermissions(role));
                    }
                }
                else
                {
                    role = AppRoles.GuestViewer;
                }

                var subscriptionTier = (userAccount?.SubscriptionTier
                                     ?? User.FindFirst("subscriptionTier")?.Value
                                     ?? "FREE").Trim().ToUpperInvariant();
                var isPremium = (userAccount?.IsPremium ?? false)
                             || subscriptionTier == "VIP"
                             || subscriptionTier == "PRO"
                             || subscriptionTier == "ENTERPRISE"
                             || role == AppRoles.SystemAdmin;

                if (role == AppRoles.SystemAdmin && (subscriptionTier == "FREE" || string.IsNullOrEmpty(subscriptionTier)))
                {
                    subscriptionTier = "ENTERPRISE";
                }

                // 3. Tính toán Effective Plan kết hợp giữa Tenant Plan, User SubscriptionTier và SystemAdmin
                var effectivePlan = tenant.Plan;
                if (role == AppRoles.SystemAdmin || subscriptionTier == "ENTERPRISE" || subscriptionTier == "GLOBAL")
                {
                    if (effectivePlan < TenantPlan.Enterprise)
                    {
                        effectivePlan = TenantPlan.Enterprise;
                    }
                }
                else if (subscriptionTier == "VIP" || subscriptionTier == "PRO" || isPremium)
                {
                    if (effectivePlan < TenantPlan.Professional)
                    {
                        effectivePlan = TenantPlan.Professional;
                    }
                }

                var enabledFeatures = PlanFeatureCatalog.GetFeaturesForPlan(effectivePlan, tenant.FeatureFlagsJson);
                var quotas = PlanFeatureCatalog.GetQuotasForPlan(effectivePlan);

                // 4. Lấy Domain Scopes được kích hoạt
                var activeDomains = await _db.TenantDomainConfigs
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .Where(d => d.TenantId == tenant.Id && d.IsEnabled)
                    .Select(d => d.DomainCode)
                    .ToListAsync();

                if (!activeDomains.Any())
                {
                    activeDomains = new List<string> { "general", "education" };
                }

                var response = new
                {
                    tenant = new
                    {
                        id = tenant.Id,
                        code = tenant.Code,
                        name = tenant.Name,
                        plan = effectivePlan.ToString(),
                        scaleType = tenant.ScaleType.ToString(),
                        primaryColor = tenant.PrimaryColor,
                        logoUrl = tenant.LogoUrl,
                        isCommunity = tenant.IsCommunityHub
                    },
                    features = enabledFeatures.ToList(),
                    quotas = quotas,
                    domains = activeDomains,
                    user = new
                    {
                        id = userId,
                        role = role,
                        subscriptionTier = subscriptionTier,
                        isPremium = isPremium,
                        orgUnitId = orgUnitId,
                        orgUnitPath = orgUnitPath,
                        capabilities = userCapabilities
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thông tin entitlements hiện tại.");
                return StatusCode(500, new { message = "Không thể lấy thông tin bản quyền và phân quyền." });
            }
        }
    }
}
