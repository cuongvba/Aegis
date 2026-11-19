using System.Collections.Generic;
using Aegis.Domain.Security;

namespace Aegis.Application.Interfaces
{
    public interface ICrudapAccessControlService
    {
        CrudapPermission ParsePermissions(string? flags);
        string FormatPermissions(CrudapPermission perms);
        CrudapPermission ResolveEffectivePermissions(CallerSecurityContext caller, ResourceAccessPolicy policy);
        bool HasPermission(CallerSecurityContext caller, ResourceAccessPolicy policy, CrudapPermission required);
        CrudapAccessCheckResult ValidateMutation(
            CallerSecurityContext caller,
            ResourceAccessPolicy? existingPolicy,
            ResourceAccessPolicy incomingPolicy,
            IReadOnlyCollection<string>? modifiedFields = null,
            bool requestingApproval = false);
    }
}
