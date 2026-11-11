using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Aegis.Application.Interfaces;
using Aegis.Domain.Entities;
using Aegis.Infrastructure.Data;

namespace Aegis.API.Security
{
    /// <summary>
    /// [Ownership Scoping] Kiểm tra quyền thao tác (Update/Delete/bulk-*) trên MỘT tài
    /// nguyên cụ thể (Question/Topic) sau khi đã qua cổng Role-Weight ở tầng controller.
    ///
    /// Quy tắc:
    ///   - Người tạo (callerId == creatorId): Toàn quyền quản lý tài nguyên của chính mình!
    ///   - Role-Weight ≥ ContentManager (ContentManager/TenantAdmin/SystemAdmin):
    ///     toàn quyền trong phạm vi Tenant.
    ///   - TeamLeader: CHỈ được thao tác trên tài nguyên do chính mình tạo (CreatorId) hoặc
    ///     thuộc OrgUnit mình đang quản lý (tra theo UserRoles).
    ///   - Người dùng thông thường: KHÔNG được sửa/xóa tài nguyên của người khác hoặc của hệ thống.
    /// </summary>
    public interface IContentOwnershipGuard
    {
        Task<bool> CanManageAsync(ClaimsPrincipal user, string? creatorId, Guid? orgUnitId);
    }

    public class ContentOwnershipGuard : IContentOwnershipGuard
    {
        private readonly AegisDbContext _db;
        private readonly ITenantContext     _tenant;

        public ContentOwnershipGuard(AegisDbContext db, ITenantContext tenant)
        {
            _db     = db;
            _tenant = tenant;
        }

        public async Task<bool> CanManageAsync(ClaimsPrincipal user, string? creatorId, Guid? orgUnitId)
        {
            var callerId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst("sub")?.Value;

            // 1. Sở hữu trực tiếp (là người tạo): người tạo luôn có toàn quyền trên tài nguyên do mình tạo.
            if (!string.IsNullOrEmpty(callerId) && !string.IsNullOrEmpty(creatorId) && callerId.Equals(creatorId, StringComparison.OrdinalIgnoreCase))
                return true;

            var role = _tenant.CurrentRole;
            if (string.IsNullOrWhiteSpace(role))
            {
                role = user.FindFirst(ClaimTypes.Role)?.Value ?? user.FindFirst("role")?.Value ?? string.Empty;
            }

            // 2. TenantAdmin / SystemAdmin: quyền giám sát tối cao trong phạm vi Tenant/System.
            if (AppRoles.GetRoleWeight(role) >= AppRoles.GetRoleWeight(AppRoles.TenantAdmin)
                || user.IsInRole(AppRoles.SystemAdmin)
                || user.IsInRole(AppRoles.TenantAdmin))
                return true;

            // 3. TeamLeader: được thao tác trên tài nguyên thuộc OrgUnit mình đang quản lý.
            if (role == AppRoles.TeamLeader && orgUnitId.HasValue && !string.IsNullOrEmpty(callerId))
            {
                var myOrgUnitId = await _db.UserRoles
                    .Where(r => r.UserId == callerId
                             && r.TenantId == _tenant.CurrentTenantId
                             && r.Role == AppRoles.TeamLeader
                             && r.IsActive
                             && r.OrgUnitId != null)
                    .Select(r => r.OrgUnitId)
                    .FirstOrDefaultAsync();

                if (myOrgUnitId.HasValue && myOrgUnitId.Value == orgUnitId.Value)
                    return true;
            }

            // 4. Các trường hợp còn lại (người dùng thông thường thao tác trên nội dung của người khác hoặc của hệ thống) -> Từ chối.
            return false;
        }
    }
}
