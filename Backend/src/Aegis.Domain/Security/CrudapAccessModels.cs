using System;
using System.Collections.Generic;

namespace Aegis.Domain.Security
{
    [Flags]
    public enum CrudapPermission
    {
        None = 0,
        Create = 1 << 0,   // C
        Read = 1 << 1,     // R
        Update = 1 << 2,   // U
        Delete = 1 << 3,   // D
        Approve = 1 << 4,  // A
        Publish = 1 << 5,  // P
        All = Create | Read | Update | Delete | Approve | Publish
    }

    public enum ResourceVisibility
    {
        Private = 0,
        AssignedOnly = 1,
        OrgUnit = 2,
        Tenant = 3,
        Public = 4
    }

    public class ResourceAccessPolicy
    {
        public string ResourceType { get; set; } = "SMART_LEDGER";
        public string ResourceId { get; set; } = string.Empty;
        public Guid TenantId { get; set; }
        public string OwnerUserId { get; set; } = string.Empty;
        public int OwnerRoleWeight { get; set; }
        public string? OrgUnitId { get; set; }
        public ResourceVisibility Visibility { get; set; } = ResourceVisibility.Tenant;
        public Dictionary<string, string> MemberPermissions { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public List<string> LockedFields { get; set; } = new();
        public bool IsApprovedLocked { get; set; }
    }

    public class CallerSecurityContext
    {
        public string UserId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "GUEST";
        public int RoleWeight { get; set; }
        public string? OrgUnitId { get; set; }
        public Guid TenantId { get; set; }
        public bool IsAuthenticated { get; set; }
    }

    public class CrudapAccessCheckResult
    {
        public bool Allowed { get; set; }
        public CrudapPermission EffectivePermissions { get; set; }
        public string? DeniedReason { get; set; }

        public static CrudapAccessCheckResult Allow(CrudapPermission perms) =>
            new() { Allowed = true, EffectivePermissions = perms };

        public static CrudapAccessCheckResult Deny(string reason, CrudapPermission perms = CrudapPermission.None) =>
            new() { Allowed = false, EffectivePermissions = perms, DeniedReason = reason };
    }
}
