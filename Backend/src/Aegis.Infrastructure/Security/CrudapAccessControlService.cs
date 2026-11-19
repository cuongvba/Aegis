using System;
using System.Collections.Generic;
using System.Linq;
using Aegis.Application.Interfaces;
using Aegis.Domain.Security;

namespace Aegis.Infrastructure.Security
{
    public sealed class CrudapAccessControlService : ICrudapAccessControlService
    {
        public CrudapPermission ParsePermissions(string? flags)
        {
            if (string.IsNullOrWhiteSpace(flags)) return CrudapPermission.None;
            var perms = CrudapPermission.None;
            foreach (char ch in flags.Trim().ToUpperInvariant())
            {
                perms |= ch switch
                {
                    'C' => CrudapPermission.Create,
                    'R' => CrudapPermission.Read,
                    'U' => CrudapPermission.Update,
                    'D' => CrudapPermission.Delete,
                    'A' => CrudapPermission.Approve,
                    'P' => CrudapPermission.Publish,
                    _ => CrudapPermission.None
                };
            }
            return perms;
        }

        public string FormatPermissions(CrudapPermission perms)
        {
            var chars = new List<char>(6);
            if (perms.HasFlag(CrudapPermission.Create)) chars.Add('C');
            if (perms.HasFlag(CrudapPermission.Read)) chars.Add('R');
            if (perms.HasFlag(CrudapPermission.Update)) chars.Add('U');
            if (perms.HasFlag(CrudapPermission.Delete)) chars.Add('D');
            if (perms.HasFlag(CrudapPermission.Approve)) chars.Add('A');
            if (perms.HasFlag(CrudapPermission.Publish)) chars.Add('P');
            return new string(chars.ToArray());
        }

        public CrudapPermission ResolveEffectivePermissions(CallerSecurityContext caller, ResourceAccessPolicy policy)
        {
            if (caller == null || policy == null) return CrudapPermission.None;

            // Layer 1: Tenant Isolation
            if (policy.TenantId != Guid.Empty && caller.TenantId != policy.TenantId)
                return policy.Visibility == ResourceVisibility.Public ? CrudapPermission.Read : CrudapPermission.None;

            var perms = CrudapPermission.None;

            // Layer 2: Admin / Super-Role Ceiling inside same Tenant
            if (caller.IsAuthenticated && caller.RoleWeight >= 90)
            {
                perms = CrudapPermission.All;
            }
            else if (!string.IsNullOrWhiteSpace(caller.UserId) &&
                     string.Equals(caller.UserId, policy.OwnerUserId, StringComparison.OrdinalIgnoreCase))
            {
                // Owner gets CRUDP (+ Approve if role weight >= 50)
                perms = CrudapPermission.Create | CrudapPermission.Read | CrudapPermission.Update | CrudapPermission.Delete | CrudapPermission.Publish;
                if (caller.RoleWeight >= 50) perms |= CrudapPermission.Approve;
            }

            // Layer 3: Explicit Member / Role ACL
            if (policy.MemberPermissions != null)
            {
                if (!string.IsNullOrWhiteSpace(caller.UserId) && policy.MemberPermissions.TryGetValue($"user:{caller.UserId}", out var uFlags))
                    perms |= ParsePermissions(uFlags);
                if (!string.IsNullOrWhiteSpace(caller.Email) && policy.MemberPermissions.TryGetValue($"email:{caller.Email}", out var eFlags))
                    perms |= ParsePermissions(eFlags);
                if (!string.IsNullOrWhiteSpace(caller.Role) && policy.MemberPermissions.TryGetValue($"role:{caller.Role}", out var rFlags))
                    perms |= ParsePermissions(rFlags);
            }

            // Layer 4: Visibility Baseline
            if (policy.Visibility == ResourceVisibility.Public || policy.Visibility == ResourceVisibility.Tenant)
            {
                perms |= CrudapPermission.Read;
            }
            else if (policy.Visibility == ResourceVisibility.OrgUnit &&
                     !string.IsNullOrWhiteSpace(policy.OrgUnitId) &&
                     string.Equals(policy.OrgUnitId, caller.OrgUnitId, StringComparison.OrdinalIgnoreCase))
            {
                perms |= CrudapPermission.Read;
            }

            // Immutability Guard: Once Approved & Locked, revoke Update & Delete unless SuperAdmin (>= 90)
            if (policy.IsApprovedLocked && caller.RoleWeight < 90)
            {
                perms &= ~(CrudapPermission.Update | CrudapPermission.Delete);
            }

            return perms;
        }

        public bool HasPermission(CallerSecurityContext caller, ResourceAccessPolicy policy, CrudapPermission required)
        {
            var effective = ResolveEffectivePermissions(caller, policy);
            return (effective & required) == required;
        }

        public CrudapAccessCheckResult ValidateMutation(
            CallerSecurityContext caller,
            ResourceAccessPolicy? existingPolicy,
            ResourceAccessPolicy incomingPolicy,
            IReadOnlyCollection<string>? modifiedFields = null,
            bool requestingApproval = false)
        {
            if (existingPolicy == null)
            {
                // Creating new resource
                if (!caller.IsAuthenticated && caller.RoleWeight == 0 && !string.IsNullOrWhiteSpace(incomingPolicy.OwnerUserId))
                    return CrudapAccessCheckResult.Allow(CrudapPermission.All);

                var createPerms = ResolveEffectivePermissions(caller, incomingPolicy) | CrudapPermission.Create;
                return CrudapAccessCheckResult.Allow(createPerms);
            }

            var perms = ResolveEffectivePermissions(caller, existingPolicy);
            if (existingPolicy.IsApprovedLocked && caller.RoleWeight < 90)
                return CrudapAccessCheckResult.Deny("Tài nguyên đã được phê duyệt & chốt bất biến (Approved Lock).", perms);

            if (!perms.HasFlag(CrudapPermission.Update))
                return CrudapAccessCheckResult.Deny("Không có quyền Update (U) trên tài nguyên này.", perms);

            if (requestingApproval && !perms.HasFlag(CrudapPermission.Approve))
                return CrudapAccessCheckResult.Deny("Chỉ người có quyền Approve (A) mới được phê duyệt hoặc chốt sổ.", perms);

            if (modifiedFields != null && modifiedFields.Count > 0 && existingPolicy.LockedFields.Count > 0)
            {
                bool touchedLocked = modifiedFields.Any(f =>
                    existingPolicy.LockedFields.Contains(f, StringComparer.OrdinalIgnoreCase));
                if (touchedLocked && !perms.HasFlag(CrudapPermission.Approve))
                    return CrudapAccessCheckResult.Deny("Không được phép sửa các trường/cột đã khóa (chỉ người có quyền Approve).", perms);
            }

            return CrudapAccessCheckResult.Allow(perms);
        }
    }
}
