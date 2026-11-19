using System;
using System.Collections.Generic;
using Aegis.Domain.Security;
using Aegis.Infrastructure.Security;
using Xunit;

namespace Aegis.UnitTests
{
    public class CrudapAccessControlServiceTests
    {
        private readonly CrudapAccessControlService _svc = new();

        [Fact]
        public void ResolveEffectivePermissions_BlocksCrossTenantAndCrossOrgUnit()
        {
            var tenantA = Guid.NewGuid();
            var tenantB = Guid.NewGuid();
            var policy = new ResourceAccessPolicy
            {
                ResourceType = "OFFICIAL_DISPATCH",
                TenantId = tenantA,
                OwnerUserId = "chief-1",
                OrgUnitId = "PHONG_HANH_CHINH",
                Visibility = ResourceVisibility.OrgUnit
            };

            var outsiderTenant = new CallerSecurityContext { UserId = "u2", TenantId = tenantB, OrgUnitId = "PHONG_HANH_CHINH", IsAuthenticated = true };
            var otherDept = new CallerSecurityContext { UserId = "u3", TenantId = tenantA, OrgUnitId = "PHONG_KE_TOAN", IsAuthenticated = true };
            var sameDept = new CallerSecurityContext { UserId = "u4", TenantId = tenantA, OrgUnitId = "PHONG_HANH_CHINH", IsAuthenticated = true };

            Assert.Equal(CrudapPermission.None, _svc.ResolveEffectivePermissions(outsiderTenant, policy));
            Assert.Equal(CrudapPermission.None, _svc.ResolveEffectivePermissions(otherDept, policy));
            Assert.True(_svc.HasPermission(sameDept, policy, CrudapPermission.Read));
            Assert.False(_svc.HasPermission(sameDept, policy, CrudapPermission.Update));
        }

        [Fact]
        public void ValidateMutation_BlocksLockedFieldEditAndSelfApprovalWithoutApprovePerm()
        {
            var tenant = Guid.NewGuid();
            var policy = new ResourceAccessPolicy
            {
                ResourceType = "SMART_LEDGER",
                TenantId = tenant,
                OwnerUserId = "manager-1",
                Visibility = ResourceVisibility.OrgUnit,
                OrgUnitId = "TEAM_IT",
                LockedFields = new List<string> { "rating", "kpiScore" },
                MemberPermissions = new Dictionary<string, string> { ["user:staff-1"] = "RU" }
            };

            var staff = new CallerSecurityContext { UserId = "staff-1", TenantId = tenant, OrgUnitId = "TEAM_IT", RoleWeight = 10, IsAuthenticated = true };
            var okEdit = _svc.ValidateMutation(staff, policy, policy, modifiedFields: new[] { "progress", "status" });
            var badFieldEdit = _svc.ValidateMutation(staff, policy, policy, modifiedFields: new[] { "rating" });
            var badApprove = _svc.ValidateMutation(staff, policy, policy, requestingApproval: true);

            Assert.True(okEdit.Allowed);
            Assert.False(badFieldEdit.Allowed);
            Assert.False(badApprove.Allowed);
        }

        [Fact]
        public void ResolveEffectivePermissions_RevokesUpdateDeleteWhenApprovedLocked()
        {
            var tenant = Guid.NewGuid();
            var policy = new ResourceAccessPolicy
            {
                ResourceType = "OFFICIAL_DISPATCH",
                TenantId = tenant,
                OwnerUserId = "clerk-1",
                IsApprovedLocked = true,
                MemberPermissions = new Dictionary<string, string> { ["user:director-1"] = "CRUDA P" }
            };

            var clerk = new CallerSecurityContext { UserId = "clerk-1", TenantId = tenant, RoleWeight = 20, IsAuthenticated = true };
            Assert.False(_svc.HasPermission(clerk, policy, CrudapPermission.Update));
            Assert.False(_svc.HasPermission(clerk, policy, CrudapPermission.Delete));
            Assert.True(_svc.HasPermission(clerk, policy, CrudapPermission.Read));
            Assert.True(_svc.HasPermission(clerk, policy, CrudapPermission.Publish));
        }
    }
}
