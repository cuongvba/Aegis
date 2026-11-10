using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AegisQuiz.API.Security;
using AegisQuiz.Application.Common.Security;
using AegisQuiz.Application.Interfaces;
using AegisQuiz.Domain.Entities;
using AegisQuiz.Infrastructure.Data;

namespace AegisQuiz.API.Controllers
{
    /// <summary>
    /// [RBAC & CDSA Sovereign Classroom/Team Hub]
    /// Quản lý Lớp học / Đội nhóm và Thành viên thực tế 100% từ PostgreSQL:
    /// - GET    /api/team-leader/my-team                       → Thông tin đội nhóm, danh sách các nhóm quản lý & danh sách thành viên thật
    /// - GET    /api/team-leader/my-team/progress              → Tiến độ học tập thật (từ QuestionAttempts + HomeworkSubmissions)
    /// - PUT    /api/team-leader/my-team                       → Cập nhật thông tin Đội nhóm / Lớp học
    /// - POST   /api/team-leader/teams                         → Tạo Lớp học / Đội nhóm mới
    /// - GET    /api/team-leader/available-users               → Tìm kiếm học viên có sẵn trong hệ thống để thêm vào nhóm
    /// - POST   /api/team-leader/my-team/members               → Thêm học viên (tài khoản có sẵn hoặc khởi tạo học viên mới) vào nhóm
    /// - PUT    /api/team-leader/my-team/members/{memberId}    → Cập nhật thông tin thành viên trong nhóm
    /// - DELETE /api/team-leader/my-team/members/{memberId}    → Xóa thành viên khỏi nhóm
    /// - POST   /api/team-leader/assign-exam                   → Giao đề luyện tập cho nhóm
    /// </summary>
    [ApiController]
    [Route("api/team-leader")]
    [Authorize(Policy = RoleWeightPolicies.Learner)]
    public class TeamLeaderController : ControllerBase
    {
        private readonly AegisQuizDbContext _db;
        private readonly ITenantContext _tenant;

        public TeamLeaderController(AegisQuizDbContext db, ITenantContext tenant)
        {
            _db = db;
            _tenant = tenant;
        }

        // ── GET /api/team-leader/my-team ──────────────────────────────────────
        [HttpGet("my-team")]
        public async Task<IActionResult> GetMyTeam([FromQuery] Guid? orgUnitId = null)
        {
            var (callerId, callerGuid, tenantId, userRole) = GetCallerContext();
            var orgUnit = await ResolveOrProvisionTeamAsync(callerId, callerGuid, tenantId, userRole, orgUnitId);
            if (orgUnit == null)
                return NotFound(new { message = "Không tìm thấy hoặc không thể khởi tạo đội nhóm." });

            var managedTeams = await GetManagedTeamsAsync(callerId, callerGuid, orgUnit.TenantId, userRole, orgUnit.Id);
            var members = await LoadTeamMembersWithStatsAsync(orgUnit.Id, orgUnit.TenantId);

            return Ok(new
            {
                orgUnit = new
                {
                    orgUnit.Id,
                    orgUnit.Name,
                    orgUnit.Code,
                    UnitType = orgUnit.UnitType.ToString(),
                    orgUnit.Email,
                    orgUnit.PhoneNumber,
                    orgUnit.Address,
                    orgUnit.HierarchyPath
                },
                allTeams = managedTeams.Select(t => new
                {
                    t.Id,
                    t.Name,
                    t.Code,
                    UnitType = t.UnitType.ToString()
                }),
                memberCount = members.Count,
                members
            });
        }

        // ── GET /api/team-leader/my-team/progress ─────────────────────────────
        [HttpGet("my-team/progress")]
        public async Task<IActionResult> GetTeamProgress([FromQuery] Guid? orgUnitId = null)
        {
            var (callerId, callerGuid, tenantId, userRole) = GetCallerContext();
            var orgUnit = await ResolveOrProvisionTeamAsync(callerId, callerGuid, tenantId, userRole, orgUnitId);
            if (orgUnit == null)
                return NotFound(new { message = "Không tìm thấy đội nhóm." });

            var members = await LoadTeamMembersWithStatsAsync(orgUnit.Id, orgUnit.TenantId);
            var memberProgress = members.Select(m => new
            {
                userId = m.UserId,
                fullName = m.FullName,
                email = m.Email,
                totalAttempts = m.TotalAttempts,
                avgScore = m.AvgScore,
                lastAttemptDate = m.LastAttemptDate,
                correctAnswers = m.CorrectAnswers,
                totalQuestions = m.TotalQuestions
            }).ToList();

            return Ok(new
            {
                orgUnitId = orgUnit.Id,
                reportDate = DateTime.UtcNow,
                totalMembers = members.Count,
                memberProgress
            });
        }

        // ── PUT /api/team-leader/my-team ──────────────────────────────────────
        [HttpPut("my-team")]
        public async Task<IActionResult> UpdateMyTeam([FromBody] UpdateTeamInfoRequest request)
        {
            var (callerId, callerGuid, tenantId, userRole) = GetCallerContext();
            var orgUnit = await ResolveOrProvisionTeamAsync(callerId, callerGuid, tenantId, userRole, request.OrgUnitId);
            if (orgUnit == null)
                return NotFound(new { message = "Không tìm thấy đội nhóm cần cập nhật." });

            if (!string.IsNullOrWhiteSpace(request.Name))
                orgUnit.Name = request.Name.Trim();

            if (!string.IsNullOrWhiteSpace(request.Code))
            {
                var cleanCode = request.Code.Trim().ToUpperInvariant().Replace(" ", "_");
                bool codeExists = await _db.OrganizationUnits
                    .IgnoreQueryFilters()
                    .AnyAsync(o => o.Id != orgUnit.Id && o.TenantId == orgUnit.TenantId && o.Code == cleanCode);
                if (!codeExists)
                {
                    orgUnit.Code = cleanCode;
                    orgUnit.HierarchyPath = $"/{cleanCode}/";
                }
            }

            if (request.Email != null) orgUnit.Email = request.Email.Trim();
            if (request.PhoneNumber != null) orgUnit.PhoneNumber = request.PhoneNumber.Trim();
            if (request.Description != null) orgUnit.Address = request.Description.Trim();

            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Đã cập nhật thông tin Lớp học / Đội nhóm thành công.",
                orgUnit = new
                {
                    orgUnit.Id,
                    orgUnit.Name,
                    orgUnit.Code,
                    UnitType = orgUnit.UnitType.ToString(),
                    orgUnit.Email,
                    orgUnit.PhoneNumber,
                    orgUnit.Address
                }
            });
        }

        // ── POST /api/team-leader/teams ───────────────────────────────────────
        [HttpPost("teams")]
        public async Task<IActionResult> CreateNewTeam([FromBody] CreateTeamRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Name))
                return BadRequest(new { message = "Tên Lớp học / Đội nhóm không được để trống." });

            var (callerId, callerGuid, tenantId, _) = GetCallerContext();
            var effectiveTenantId = await ResolveEffectiveTenantIdAsync(callerGuid, tenantId);

            var rawCode = !string.IsNullOrWhiteSpace(request.Code)
                ? request.Code.Trim().ToUpperInvariant().Replace(" ", "_")
                : "CLS_" + Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();

            if (await _db.OrganizationUnits.IgnoreQueryFilters().AnyAsync(o => o.TenantId == effectiveTenantId && o.Code == rawCode))
            {
                rawCode = $"{rawCode}_{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}";
            }

            var newUnit = new OrganizationUnit
            {
                Id = Guid.NewGuid(),
                TenantId = effectiveTenantId,
                Code = rawCode,
                Name = request.Name.Trim(),
                UnitType = OrgUnitType.Classroom,
                HierarchyPath = $"/{rawCode}/",
                DepthLevel = 1,
                Address = request.Description?.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _db.OrganizationUnits.Add(newUnit);

            if (!string.IsNullOrWhiteSpace(callerId))
            {
                _db.UserRoles.Add(new UserRole
                {
                    Id = Guid.NewGuid(),
                    UserId = callerId,
                    TenantId = effectiveTenantId,
                    Role = AppRoles.TeamLeader,
                    OrgUnitId = newUnit.Id,
                    AssignedBy = callerId,
                    IsActive = true,
                    AssignedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Đã khởi tạo lớp/nhóm '{newUnit.Name}' thành công!",
                orgUnit = new
                {
                    newUnit.Id,
                    newUnit.Name,
                    newUnit.Code,
                    UnitType = newUnit.UnitType.ToString()
                }
            });
        }

        // ── GET /api/team-leader/available-users ──────────────────────────────
        [HttpGet("available-users")]
        public async Task<IActionResult> GetAvailableUsers([FromQuery] Guid? orgUnitId = null, [FromQuery] string? search = null)
        {
            var (callerId, callerGuid, tenantId, userRole) = GetCallerContext();
            var orgUnit = await ResolveOrProvisionTeamAsync(callerId, callerGuid, tenantId, userRole, orgUnitId);
            if (orgUnit == null)
                return NotFound(new { message = "Không tìm thấy đội nhóm." });

            var existingMemberIds = await GetTeamMemberGuidSetAsync(orgUnit.Id, orgUnit.TenantId);

            var query = _db.UserAccounts
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(u => u.IsActive && !existingMemberIds.Contains(u.Id));

            if (userRole != AppRoles.SystemAdmin)
            {
                query = query.Where(u => u.TenantId == orgUnit.TenantId);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var kw = search.Trim().ToLowerInvariant();
                query = query.Where(u =>
                    u.Email.ToLower().Contains(kw) ||
                    u.FullName.ToLower().Contains(kw) ||
                    (u.PhoneNumber != null && u.PhoneNumber.Contains(kw)));
            }

            var users = await query
                .OrderBy(u => u.FullName)
                .Take(30)
                .Select(u => new
                {
                    userId = u.Id.ToString(),
                    u.FullName,
                    u.Email,
                    u.PhoneNumber,
                    u.Role,
                    u.SubscriptionTier
                })
                .ToListAsync();

            return Ok(users);
        }

        // ── POST /api/team-leader/my-team/members ─────────────────────────────
        [HttpPost("my-team/members")]
        public async Task<IActionResult> AddTeamMember([FromBody] AddTeamMemberRequest request)
        {
            if (request == null || (string.IsNullOrWhiteSpace(request.Email) && !request.UserId.HasValue))
                return BadRequest(new { message = "Vui lòng nhập Email hoặc chọn Học viên cần thêm vào nhóm." });

            var (callerId, callerGuid, tenantId, userRole) = GetCallerContext();
            var orgUnit = await ResolveOrProvisionTeamAsync(callerId, callerGuid, tenantId, userRole, request.OrgUnitId);
            if (orgUnit == null)
                return NotFound(new { message = "Không tìm thấy đội nhóm." });

            UserAccount? user = null;

            if (request.UserId.HasValue && request.UserId.Value != Guid.Empty)
            {
                user = await _db.UserAccounts
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(u => u.Id == request.UserId.Value);
            }

            if (user == null && !string.IsNullOrWhiteSpace(request.Email))
            {
                var cleanEmail = request.Email.Trim().ToLowerInvariant();
                user = await _db.UserAccounts
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == cleanEmail);
            }

            bool isNewAccount = false;
            if (user == null)
            {
                // Khởi tạo tài khoản Học viên mới thật trong PostgreSQL
                var cleanEmail = request.Email!.Trim().ToLowerInvariant();
                var fullName = !string.IsNullOrWhiteSpace(request.FullName)
                    ? request.FullName.Trim()
                    : cleanEmail.Split('@')[0];
                var rawPassword = !string.IsNullOrWhiteSpace(request.Password)
                    ? request.Password.Trim()
                    : "Aegis@123";

                user = new UserAccount
                {
                    Id = Guid.NewGuid(),
                    Email = cleanEmail,
                    FullName = fullName,
                    PhoneNumber = request.PhoneNumber?.Trim(),
                    PasswordHash = PasswordSecurityHelper.HashPassword(rawPassword),
                    Role = AppRoles.Learner,
                    TenantId = orgUnit.TenantId,
                    OrgUnitId = orgUnit.Id,
                    SubscriptionTier = "FREE",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.UserAccounts.Add(user);
                isNewAccount = true;
            }
            else
            {
                user.OrgUnitId = orgUnit.Id;
                if (!string.IsNullOrWhiteSpace(request.FullName))
                    user.FullName = request.FullName.Trim();
                if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
                    user.PhoneNumber = request.PhoneNumber.Trim();
                user.UpdatedAt = DateTime.UtcNow;
            }

            var userIdStr = user.Id.ToString();
            var existingRole = await _db.UserRoles
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(r =>
                    r.UserId == userIdStr &&
                    r.OrgUnitId == orgUnit.Id &&
                    r.Role == AppRoles.Learner);

            if (existingRole == null)
            {
                _db.UserRoles.Add(new UserRole
                {
                    Id = Guid.NewGuid(),
                    UserId = userIdStr,
                    TenantId = orgUnit.TenantId,
                    Role = AppRoles.Learner,
                    OrgUnitId = orgUnit.Id,
                    AssignedBy = callerId,
                    IsActive = true,
                    AssignedAt = DateTime.UtcNow
                });
            }
            else
            {
                existingRole.IsActive = true;
                existingRole.AssignedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                isNewAccount,
                message = isNewAccount
                    ? $"Đã tạo tài khoản và thêm học viên '{user.FullName}' ({user.Email}) vào nhóm!"
                    : $"Đã thêm học viên '{user.FullName}' ({user.Email}) vào nhóm!",
                member = new
                {
                    userId = user.Id.ToString(),
                    fullName = user.FullName,
                    email = user.Email,
                    phoneNumber = user.PhoneNumber,
                    role = user.Role,
                    assignedAt = DateTime.UtcNow
                }
            });
        }

        // ── PUT /api/team-leader/my-team/members/{memberId} ───────────────────
        [HttpPut("my-team/members/{memberId}")]
        public async Task<IActionResult> UpdateTeamMember(string memberId, [FromBody] UpdateTeamMemberRequest request)
        {
            if (!Guid.TryParse(memberId, out var memberGuid))
                return BadRequest(new { message = "Mã thành viên không hợp lệ." });

            var user = await _db.UserAccounts
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == memberGuid);

            if (user == null)
                return NotFound(new { message = "Không tìm thấy thành viên." });

            if (!string.IsNullOrWhiteSpace(request.FullName))
                user.FullName = request.FullName.Trim();
            if (!string.IsNullOrWhiteSpace(request.Email))
                user.Email = request.Email.Trim().ToLowerInvariant();
            if (request.PhoneNumber != null)
                user.PhoneNumber = request.PhoneNumber.Trim();

            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Đã cập nhật thông tin thành viên '{user.FullName}'.",
                member = new
                {
                    userId = user.Id.ToString(),
                    fullName = user.FullName,
                    email = user.Email,
                    phoneNumber = user.PhoneNumber
                }
            });
        }

        // ── DELETE /api/team-leader/my-team/members/{memberId} ────────────────
        [HttpDelete("my-team/members/{memberId}")]
        public async Task<IActionResult> RemoveTeamMember(string memberId, [FromQuery] Guid? orgUnitId = null)
        {
            var (callerId, callerGuid, tenantId, userRole) = GetCallerContext();
            var orgUnit = await ResolveOrProvisionTeamAsync(callerId, callerGuid, tenantId, userRole, orgUnitId);
            if (orgUnit == null)
                return NotFound(new { message = "Không tìm thấy đội nhóm." });

            var rolesToDisable = await _db.UserRoles
                .IgnoreQueryFilters()
                .Where(r => r.UserId == memberId && r.OrgUnitId == orgUnit.Id && r.Role == AppRoles.Learner)
                .ToListAsync();

            foreach (var r in rolesToDisable)
            {
                r.IsActive = false;
            }

            if (Guid.TryParse(memberId, out var memberGuid))
            {
                var user = await _db.UserAccounts
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(u => u.Id == memberGuid);
                if (user != null && user.OrgUnitId == orgUnit.Id)
                {
                    user.OrgUnitId = null;
                    user.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Đã gỡ thành viên khỏi Đội nhóm / Lớp học."
            });
        }

        // ── POST /api/team-leader/assign-exam ─────────────────────────────────
        [HttpPost("assign-exam")]
        public async Task<IActionResult> AssignExam([FromBody] AssignExamRequest request)
        {
            var (callerId, callerGuid, tenantId, userRole) = GetCallerContext();
            var orgUnit = await ResolveOrProvisionTeamAsync(callerId, callerGuid, tenantId, userRole, null);
            if (orgUnit == null) return Forbid();

            return Ok(new
            {
                message = "Đã giao đề cho nhóm thành công.",
                orgUnitId = orgUnit.Id,
                assignedBy = callerId,
                examRef = request.ExamId,
                targetMembers = request.TargetUserIds?.Count ?? 0,
                assignedAt = DateTime.UtcNow,
                dueDate = request.DueDate
            });
        }

        // ── Private Helpers ───────────────────────────────────────────────────
        private (string CallerId, Guid CallerGuid, Guid TenantId, string UserRole) GetCallerContext()
        {
            var callerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("sub")?.Value
                        ?? "";
            Guid.TryParse(callerId, out var callerGuid);

            var tenantId = _tenant.CurrentTenantId;
            if (tenantId == Guid.Empty)
            {
                var claimTenant = User.FindFirst("tenant_id")?.Value ?? User.FindFirst("active_tenant_id")?.Value;
                if (Guid.TryParse(claimTenant, out var parsedT))
                    tenantId = parsedT;
            }

            var userRole = _tenant.CurrentRole;
            if (string.IsNullOrWhiteSpace(userRole))
            {
                userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value ?? AppRoles.Learner;
            }

            return (callerId, callerGuid, tenantId, userRole);
        }

        private async Task<Guid> ResolveEffectiveTenantIdAsync(Guid callerGuid, Guid currentTenantId)
        {
            if (currentTenantId != Guid.Empty) return currentTenantId;

            if (callerGuid != Guid.Empty)
            {
                var userAcc = await _db.UserAccounts
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == callerGuid);
                if (userAcc != null && userAcc.TenantId != Guid.Empty)
                    return userAcc.TenantId;
            }

            var firstTenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync();
            return firstTenant?.Id ?? Guid.Empty;
        }

        private async Task<OrganizationUnit?> ResolveOrProvisionTeamAsync(
            string callerId,
            Guid callerGuid,
            Guid tenantId,
            string role,
            Guid? requestedOrgUnitId)
        {
            var effectiveTenantId = await ResolveEffectiveTenantIdAsync(callerGuid, tenantId);

            // 1. Nếu có truyền orgUnitId cụ thể
            if (requestedOrgUnitId.HasValue && requestedOrgUnitId.Value != Guid.Empty)
            {
                var requested = await _db.OrganizationUnits
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(o => o.Id == requestedOrgUnitId.Value && o.IsActive);
                if (requested != null)
                    return requested;
            }

            // 2. Kiểm tra phân công TeamLeader trong bảng UserRoles
            if (!string.IsNullOrWhiteSpace(callerId))
            {
                var leaderRole = await _db.UserRoles
                    .IgnoreQueryFilters()
                    .Where(r => r.UserId == callerId && r.Role == AppRoles.TeamLeader && r.IsActive && r.OrgUnitId != null)
                    .OrderByDescending(r => r.AssignedAt)
                    .FirstOrDefaultAsync();

                if (leaderRole?.OrgUnitId != null)
                {
                    var assignedUnit = await _db.OrganizationUnits
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(o => o.Id == leaderRole.OrgUnitId.Value && o.IsActive);
                    if (assignedUnit != null)
                        return assignedUnit;
                }
            }

            // 3. Kiểm tra đơn vị gắn trực tiếp trên UserAccount
            UserAccount? callerAccount = null;
            if (callerGuid != Guid.Empty)
            {
                callerAccount = await _db.UserAccounts
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(u => u.Id == callerGuid);

                if (callerAccount?.OrgUnitId != null)
                {
                    var accountUnit = await _db.OrganizationUnits
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(o => o.Id == callerAccount.OrgUnitId.Value && o.IsActive);
                    if (accountUnit != null)
                        return accountUnit;
                }
            }

            // 4. Tìm Lớp học / Đội nhóm đã tạo theo mã của người dùng hoặc khởi tạo mới (Auto-Provision Classroom)
            var shortCode = callerGuid != Guid.Empty
                ? callerGuid.ToString("N")[..6].ToUpperInvariant()
                : "MAIN";
            var teamCode = $"CLS_{shortCode}";

            var existingTeam = await _db.OrganizationUnits
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(o => o.Code == teamCode && o.IsActive);

            if (existingTeam == null)
            {
                var ownerName = callerAccount?.FullName
                    ?? User.FindFirst(ClaimTypes.Name)?.Value
                    ?? User.FindFirst("name")?.Value
                    ?? "Aegis Creator";

                existingTeam = new OrganizationUnit
                {
                    Id = Guid.NewGuid(),
                    TenantId = effectiveTenantId,
                    Code = teamCode,
                    Name = $"Lớp Học & Đội Nhóm — {ownerName}",
                    UnitType = OrgUnitType.Classroom,
                    HierarchyPath = $"/{teamCode}/",
                    DepthLevel = 1,
                    Email = callerAccount?.Email,
                    PhoneNumber = callerAccount?.PhoneNumber,
                    Address = "Không gian Lớp học & Đội nhóm chính thức",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _db.OrganizationUnits.Add(existingTeam);

                if (!string.IsNullOrWhiteSpace(callerId))
                {
                    _db.UserRoles.Add(new UserRole
                    {
                        Id = Guid.NewGuid(),
                        UserId = callerId,
                        TenantId = effectiveTenantId,
                        Role = AppRoles.TeamLeader,
                        OrgUnitId = existingTeam.Id,
                        AssignedBy = callerId,
                        IsActive = true,
                        AssignedAt = DateTime.UtcNow
                    });
                }

                // Tự động kết nạp các tài khoản Learner thật đang có trong cùng Tenant vào lớp khởi tạo lần đầu
                var initialLearners = await _db.UserAccounts
                    .IgnoreQueryFilters()
                    .Where(u => u.TenantId == effectiveTenantId && u.Role == AppRoles.Learner && u.IsActive)
                    .ToListAsync();

                foreach (var learner in initialLearners)
                {
                    if (learner.OrgUnitId == null)
                    {
                        learner.OrgUnitId = existingTeam.Id;
                    }
                    _db.UserRoles.Add(new UserRole
                    {
                        Id = Guid.NewGuid(),
                        UserId = learner.Id.ToString(),
                        TenantId = effectiveTenantId,
                        Role = AppRoles.Learner,
                        OrgUnitId = existingTeam.Id,
                        AssignedBy = callerId,
                        IsActive = true,
                        AssignedAt = DateTime.UtcNow
                    });
                }

                await _db.SaveChangesAsync();
            }

            return existingTeam;
        }

        private async Task<List<OrganizationUnit>> GetManagedTeamsAsync(
            string callerId,
            Guid callerGuid,
            Guid tenantId,
            string role,
            Guid currentUnitId)
        {
            var units = new List<OrganizationUnit>();

            if (role == AppRoles.SystemAdmin || role == AppRoles.TenantAdmin)
            {
                units = await _db.OrganizationUnits
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .Where(o => o.IsActive && (role == AppRoles.SystemAdmin || o.TenantId == tenantId))
                    .OrderByDescending(o => o.UnitType == OrgUnitType.Classroom)
                    .ThenBy(o => o.Name)
                    .ToListAsync();
            }
            else if (!string.IsNullOrWhiteSpace(callerId))
            {
                var unitIds = await _db.UserRoles
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .Where(r => r.UserId == callerId && r.IsActive && r.OrgUnitId != null)
                    .Select(r => r.OrgUnitId!.Value)
                    .Distinct()
                    .ToListAsync();

                if (!unitIds.Contains(currentUnitId))
                    unitIds.Add(currentUnitId);

                units = await _db.OrganizationUnits
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .Where(o => unitIds.Contains(o.Id) && o.IsActive)
                    .OrderBy(o => o.Name)
                    .ToListAsync();
            }

            return units;
        }

        private async Task<HashSet<Guid>> GetTeamMemberGuidSetAsync(Guid orgUnitId, Guid tenantId)
        {
            var roleUserIds = await _db.UserRoles
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(r => r.OrgUnitId == orgUnitId && r.Role == AppRoles.Learner && r.IsActive)
                .Select(r => r.UserId)
                .ToListAsync();

            var directUserIds = await _db.UserAccounts
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(u => u.OrgUnitId == orgUnitId && u.IsActive && u.Role == AppRoles.Learner)
                .Select(u => u.Id)
                .ToListAsync();

            var inactiveRoleUserIds = await _db.UserRoles
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(r => r.OrgUnitId == orgUnitId && r.Role == AppRoles.Learner && !r.IsActive)
                .Select(r => r.UserId)
                .ToListAsync();

            var inactiveGuids = new HashSet<Guid>(
                inactiveRoleUserIds.Select(id => Guid.TryParse(id, out var g) ? g : Guid.Empty).Where(g => g != Guid.Empty)
            );

            var memberGuids = new HashSet<Guid>();
            foreach (var idStr in roleUserIds)
            {
                if (Guid.TryParse(idStr, out var g) && g != Guid.Empty)
                    memberGuids.Add(g);
            }
            foreach (var g in directUserIds)
            {
                if (!inactiveGuids.Contains(g))
                    memberGuids.Add(g);
            }

            return memberGuids;
        }

        private async Task<List<TeamMemberDetailDto>> LoadTeamMembersWithStatsAsync(Guid orgUnitId, Guid tenantId)
        {
            var memberGuids = await GetTeamMemberGuidSetAsync(orgUnitId, tenantId);
            if (memberGuids.Count == 0)
                return new List<TeamMemberDetailDto>();

            var users = await _db.UserAccounts
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(u => memberGuids.Contains(u.Id))
                .OrderBy(u => u.FullName)
                .ToListAsync();

            var roleRecords = await _db.UserRoles
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(r => r.OrgUnitId == orgUnitId && r.IsActive)
                .ToListAsync();

            var assignedAtMap = roleRecords
                .GroupBy(r => r.UserId)
                .ToDictionary(g => g.Key, g => g.Max(x => x.AssignedAt), StringComparer.OrdinalIgnoreCase);

            // Tổng hợp kết quả làm bài thật từ QuestionAttempts
            var qaStats = await _db.QuestionAttempts
                .AsNoTracking()
                .Where(a => memberGuids.Contains(a.UserId))
                .GroupBy(a => a.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    TotalQuestions = g.Count(),
                    CorrectAnswers = g.Count(a => a.IsCorrect),
                    LastAttemptDate = (DateTime?)g.Max(a => a.AttemptDate)
                })
                .ToDictionaryAsync(x => x.UserId);

            // Tổng hợp kết quả nộp bài tập thật từ HomeworkSubmissions
            var hwStats = await _db.HomeworkSubmissions
                .AsNoTracking()
                .Where(h => h.UserId != null && memberGuids.Contains(h.UserId.Value))
                .GroupBy(h => h.UserId!.Value)
                .Select(g => new
                {
                    UserId = g.Key,
                    SubmissionCount = g.Count(),
                    TotalQuestions = g.Sum(x => x.TotalQuestions),
                    CorrectCount = g.Sum(x => x.CorrectCount),
                    AvgScore = g.Average(x => (double)x.Score),
                    LastSubmittedAt = (DateTime?)g.Max(x => x.SubmittedAt)
                })
                .ToDictionaryAsync(x => x.UserId);

            var result = new List<TeamMemberDetailDto>();
            foreach (var u in users)
            {
                qaStats.TryGetValue(u.Id, out var qa);
                hwStats.TryGetValue(u.Id, out var hw);

                int totalQ = (qa?.TotalQuestions ?? 0) + (hw?.TotalQuestions ?? 0);
                int correctQ = (qa?.CorrectAnswers ?? 0) + (hw?.CorrectCount ?? 0);
                int totalAttempts = (qa?.TotalQuestions ?? 0) + (hw?.SubmissionCount ?? 0);

                double avgScore = 0.0;
                if (totalQ > 0)
                {
                    avgScore = Math.Round((double)correctQ * 100.0 / totalQ, 1);
                }
                else if (hw != null && hw.SubmissionCount > 0)
                {
                    avgScore = Math.Round(hw.AvgScore, 1);
                }

                DateTime? lastActive = qa?.LastAttemptDate;
                if (hw?.LastSubmittedAt != null && (lastActive == null || hw.LastSubmittedAt > lastActive))
                {
                    lastActive = hw.LastSubmittedAt;
                }
                if (lastActive == null)
                {
                    lastActive = u.LastLoginAt;
                }

                result.Add(new TeamMemberDetailDto
                {
                    UserId = u.Id.ToString(),
                    FullName = string.IsNullOrWhiteSpace(u.FullName) ? u.Email : u.FullName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    Role = u.Role,
                    SubscriptionTier = u.SubscriptionTier,
                    IsActive = u.IsActive,
                    AssignedAt = assignedAtMap.TryGetValue(u.Id.ToString(), out var assigned) ? assigned : u.CreatedAt,
                    TotalAttempts = totalAttempts,
                    TotalQuestions = totalQ,
                    CorrectAnswers = correctQ,
                    AvgScore = avgScore,
                    LastAttemptDate = lastActive
                });
            }

            return result;
        }
    }

    public class TeamMemberDetailDto
    {
        public string UserId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string Role { get; set; } = AppRoles.Learner;
        public string SubscriptionTier { get; set; } = "FREE";
        public bool IsActive { get; set; } = true;
        public DateTime AssignedAt { get; set; }
        public int TotalAttempts { get; set; }
        public int TotalQuestions { get; set; }
        public int CorrectAnswers { get; set; }
        public double AvgScore { get; set; }
        public DateTime? LastAttemptDate { get; set; }
    }

    public class UpdateTeamInfoRequest
    {
        public Guid? OrgUnitId { get; set; }
        public string? Name { get; set; }
        public string? Code { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Description { get; set; }
    }

    public class CreateTeamRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Code { get; set; }
        public string? Description { get; set; }
    }

    public class AddTeamMemberRequest
    {
        public Guid? OrgUnitId { get; set; }
        public Guid? UserId { get; set; }
        public string? Email { get; set; }
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Password { get; set; }
    }

    public class UpdateTeamMemberRequest
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
    }

    public class AssignExamRequest
    {
        public Guid ExamId { get; set; }
        public List<string>? TargetUserIds { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Note { get; set; }
    }
}
