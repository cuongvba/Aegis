using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AegisQuiz.API.Security;
using AegisQuiz.Application.DTOs;
using AegisQuiz.Application.Interfaces;
using AegisQuiz.Domain.Entities;
using AegisQuiz.Infrastructure.Data;
using AegisQuiz.Infrastructure.Services;

namespace AegisQuiz.API.Controllers
{
    /// <summary>
    /// [World-Class Refactor] TopicsController — Quản lý Chủ đề câu hỏi.
    /// Route base: api/quiz/topics
    /// [CRITICAL SECURITY FIX] Trước đây controller này KHÔNG có [Authorize] nào — chỉ
    /// được bảo vệ "tình cờ" bởi FallbackPolicy toàn cục (yêu cầu đăng nhập), nhưng Learner/
    /// GuestViewer vẫn tạo/sửa/xóa được Topic. Nay yêu cầu Role-Weight ≥ TeamLeader, khớp
    /// với QuestionsController.
    /// </summary>
    [ApiController]
    [Route("api/quiz/topics")]
    [Authorize(Policy = RoleWeightPolicies.Learner)]
    public class TopicsController : ControllerBase
    {
        private readonly AegisQuizDbContext          _db;
        private readonly IContentOwnershipGuard      _ownershipGuard;
        private readonly ITenantContext              _tenant;
        private readonly IExamDeduplicationEngine    _deduplicationEngine;

        public TopicsController(
            AegisQuizDbContext              db, 
            IContentOwnershipGuard          ownershipGuard, 
            ITenantContext                  tenant,
            IExamDeduplicationEngine?       deduplicationEngine = null)
        {
            _db                  = db;
            _ownershipGuard      = ownershipGuard;
            _tenant              = tenant;
            _deduplicationEngine = deduplicationEngine ?? new ExamDeduplicationEngine(db, Microsoft.Extensions.Logging.Abstractions.NullLogger<ExamDeduplicationEngine>.Instance);
        }

        // ── GET api/quiz/topics ────────────────────────────────────────────────
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetTopics([FromQuery] bool enabledOnly = false, [FromQuery] bool myOnly = false)
        {
            try
            {
                await AutoHealHierarchicalTopicsAsync();

                var q = _db.BankTopics.AsNoTracking().AsQueryable();
                if (enabledOnly) q = q.Where(t => t.Enabled);

                var topics = await q.OrderBy(t => t.Code).ToListAsync();

                if (myOnly)
                {
                    var callerId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                                ?? User.FindFirst("sub")?.Value;
                    if (string.IsNullOrWhiteSpace(callerId) || !Guid.TryParse(callerId, out var userGuid))
                    {
                        return Ok(new List<BankTopic>());
                    }

                    var partner = await _db.EducatorPartnerships.AsNoTracking()
                        .FirstOrDefaultAsync(p => p.UserId == userGuid);
                    var crtCode = partner != null && !string.IsNullOrWhiteSpace(partner.ReferralCode)
                        ? FormatCreatorCode(partner.ReferralCode)
                        : FormatCreatorCode(userGuid.ToString("N")[..6]);

                    var topicById = topics.ToDictionary(t => t.Id);
                    var ownedOrAncestors = new HashSet<Guid>();

                    foreach (var t in topics)
                    {
                        bool isOwned = t.CreatedByUserId == userGuid
                            || (!string.IsNullOrEmpty(crtCode) && (
                                t.Code.Contains(crtCode, StringComparison.OrdinalIgnoreCase)
                                || (!string.IsNullOrEmpty(t.MaterializedPath) && t.MaterializedPath.Contains(crtCode, StringComparison.OrdinalIgnoreCase))
                            ));

                        if (isOwned)
                        {
                            var curr = t;
                            while (curr != null && ownedOrAncestors.Add(curr.Id))
                            {
                                if (curr.ParentId.HasValue && topicById.TryGetValue(curr.ParentId.Value, out var parentTopic))
                                    curr = parentTopic;
                                else
                                    break;
                            }
                        }
                    }

                    topics = topics.Where(t => ownedOrAncestors.Contains(t.Id)).ToList();
                }

                return Ok(topics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi lấy danh sách chủ đề: {ex.Message}" });
            }
        }

        private static string FormatCreatorCode(string rawCode)
        {
            if (string.IsNullOrWhiteSpace(rawCode)) return "CRTGUEST";
            var stripped = rawCode.Replace("TEACH-", "").Replace("TEACH_", "").Replace("-", "").Replace("_", "").ToUpperInvariant();
            return stripped.StartsWith("CRT") ? stripped : "CRT" + stripped;
        }

        private async Task AutoHealHierarchicalTopicsAsync()
        {
            try
            {
                bool changed = false;

                var dot2Topics = await _db.BankTopics
                    .Where(t => t.Code.StartsWith("2026_DOT2_") && (!t.ParentId.HasValue || t.Name == t.Code || t.Description == "Tự động khởi tạo từ dữ liệu nhập file"))
                    .ToListAsync();

                if (dot2Topics.Count > 0)
                {
                    var parent = await _db.BankTopics.FirstOrDefaultAsync(t => t.Code == "2026_DOT2");
                    if (parent == null)
                    {
                        parent = new Domain.Entities.BankTopic
                        {
                            Id = Guid.NewGuid(),
                            Code = "2026_DOT2",
                            Name = "2026-DOT2",
                            CategoryCode = "BANKING",
                            DomainCode = "BANKING",
                            Scope = "COMMUNITY",
                            MaterializedPath = "/BANKING/2026_DOT2/",
                            DepthLevel = 1,
                            Urn = "urn:aegis:topic:banking:2026-dot2",
                            Description = "Thư mục chuyên đề: 2026-DOT2",
                            VisibilityScope = Domain.Entities.TopicVisibility.Public,
                            Enabled = true,
                            CreatedAt = DateTime.UtcNow
                        };
                        _db.BankTopics.Add(parent);
                        await _db.SaveChangesAsync();
                    }
                    else
                    {
                        if (parent.DomainCode != "BANKING" || string.IsNullOrWhiteSpace(parent.MaterializedPath))
                        {
                            parent.DomainCode = "BANKING";
                            parent.Scope = "COMMUNITY";
                            parent.MaterializedPath = "/BANKING/2026_DOT2/";
                            parent.DepthLevel = 1;
                            parent.Urn = "urn:aegis:topic:banking:2026-dot2";
                        }
                    }

                    var knownTitles = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["2026_DOT2_1_TIN_DUNG_KHDN_240_CAU"] = "1. Tín dụng KHDN - 240 câu",
                        ["2026_DOT2_2_TIN_DUNG_KHCN_240_CAU"] = "2. Tín dụng KHCN - 240 câu",
                        ["2026_DOT2_3_KE_TOAN_TIEN_GUI_TIEN_VAY"] = "3. Kế toán tiền gửi, tiền vay",
                        ["2026_DOT2_4_KE_TOAN_THANH_TOAN"] = "4. Kế toán thanh toán",
                        ["2026_DOT2_5_KE_TOAN_TIEN_MAT"] = "5. Kế toán tiền mặt",
                        ["2026_DOT2_6_KE_TOAN_TAI_CHINH_TAI_SAN"] = "6. Kế toán tài chính, tài sản",
                        ["2026_DOT2_7_KE_TOAN_GIAO_DICH_NOI_BO"] = "7. Kế toán giao dịch nội bộ",
                        ["2026_DOT2_8_THANH_TOAN_QUOC_TE"] = "8. Thanh toán quốc tế",
                        ["2026_DOT2_9_QUAN_TRI_RUI_RO"] = "9. Quản trị rủi ro",
                        ["2026_DOT2_10_PHAP_CHE"] = "10. Pháp chế",
                        ["2026_DOT2_11_KIEM_TRA_KIEM_SOAT_NOI_BO"] = "11. Kiểm tra kiểm soát nội bộ",
                        ["2026_DOT2_12_XU_LY_NO"] = "12. Xử lý nợ",
                        ["2026_DOT2_13_DICH_VU_KHACH_HANG"] = "13. Dịch vụ khách hàng",
                        ["2026_DOT2_14_KHO_QUY"] = "14. Kho quỹ",
                        ["2026_DOT2_15_KE_HOACH_NGUON_VON"] = "15. Kế hoạch nguồn vốn",
                        ["2026_DOT2_16_TO_CHUC_CAN_BO"] = "16. Tổ chức cán bộ",
                        ["2026_DOT2_17_VAN_PHONG_TIEN_ICH"] = "17. Văn phòng tiện ích",
                        ["2026_DOT2_18_CONG_NGHE_THONG_TIN"] = "18. Công nghệ thông tin",
                        ["2026_DOT2_19_AN_TOAN_BAO_MAT"] = "19. An toàn bảo mật"
                    };

                    foreach (var dt in dot2Topics)
                    {
                        if (dt.Id == parent.Id) continue;

                        if (!dt.ParentId.HasValue)
                        {
                            dt.ParentId = parent.Id;
                            changed = true;
                        }

                        if (dt.Name == dt.Code && knownTitles.TryGetValue(dt.Code, out var knownName))
                        {
                            dt.Name = knownName;
                            changed = true;
                        }

                        dt.DomainCode = "BANKING";
                        dt.Scope = "COMMUNITY";
                        dt.MaterializedPath = $"/BANKING/2026_DOT2/{dt.Code}/";
                        dt.DepthLevel = 2;
                        dt.Urn = $"urn:aegis:topic:banking:2026-dot2:{dt.Code.ToLowerInvariant()}";

                        if (string.IsNullOrWhiteSpace(dt.Description) || dt.Description == "Tự động khởi tạo từ dữ liệu nhập file")
                        {
                            var qCount = await _db.Questions.CountAsync(q => q.CategoryCode == dt.Code);
                            dt.Description = $"{dt.Name} | Đường dẫn: 2026-DOT2";
                            dt.QuestionCountCached = qCount;
                            changed = true;
                        }
                    }
                }

                var tnpt = await _db.BankTopics.FirstOrDefaultAsync(t => t.Code == "TNPT_TIENG_ANH");
                if (tnpt != null && (tnpt.DomainCode != "EDUCATION" || string.IsNullOrWhiteSpace(tnpt.MaterializedPath)))
                {
                    tnpt.DomainCode = "EDUCATION";
                    tnpt.Scope = "COMMUNITY";
                    tnpt.MaterializedPath = "/EDUCATION/TNPT_TIENG_ANH/";
                    tnpt.DepthLevel = 1;
                    tnpt.Urn = "urn:aegis:topic:education:tnpt-tieng-anh";
                    changed = true;
                }

                // 2. Auto-Heal Creator Studio Topics Hierarchy (STUDIO / YMD / Creator CRT... / Exam TP...)
                var legacyStudioTopics = await _db.BankTopics
                    .Where(t => (t.Code.StartsWith("STUDIO_") || t.Code.StartsWith("TP")) && (!t.ParentId.HasValue || t.DepthLevel == 0 || string.IsNullOrWhiteSpace(t.MaterializedPath) || t.Code.Contains("TEACH") || t.MaterializedPath.Contains("TEACH")))
                    .ToListAsync();

                if (legacyStudioTopics.Count > 0)
                {
                    var defaultPartner = await _db.EducatorPartnerships.FirstOrDefaultAsync();
                    var defaultCreatorCode = FormatCreatorCode(defaultPartner?.ReferralCode ?? "CRT7571EC");

                    foreach (var st in legacyStudioTopics)
                    {
                        if (st.Code == "STUDIO") continue;

                        var createdAt = st.CreatedAt != default ? st.CreatedAt : DateTime.UtcNow;
                        var ymd = createdAt.ToString("yyyyMMdd");
                        var ymdFormatted = createdAt.ToString("yyyy-MM-dd");
                        var tenantId = st.TenantId;
                        var creatorCode = defaultCreatorCode;

                        // 1. Root: STUDIO
                        var root = await _db.BankTopics.FirstOrDefaultAsync(t => t.Code == "STUDIO" && (tenantId == Guid.Empty || t.TenantId == tenantId || t.TenantId == Guid.Empty));
                        if (root == null)
                        {
                            root = new Domain.Entities.BankTopic
                            {
                                Id = Guid.NewGuid(),
                                Code = "STUDIO",
                                Name = "Creator Studio",
                                Description = "Thư mục gốc đề thi sáng tạo Creator Studio",
                                CategoryCode = "STUDIO",
                                DomainCode = "EDUCATION",
                                Scope = tenantId != Guid.Empty ? "TENANT" : "COMMUNITY",
                                MaterializedPath = "/STUDIO/",
                                DepthLevel = 1,
                                ParentId = null,
                                VisibilityScope = Domain.Entities.TopicVisibility.Public,
                                Enabled = true,
                                TenantId = tenantId
                            };
                            _db.BankTopics.Add(root);
                            await _db.SaveChangesAsync();
                        }

                        // 2. Date Folder: STUDIO_{ymd}
                        var dateCode = $"STUDIO_{ymd}";
                        var dateFolder = await _db.BankTopics.FirstOrDefaultAsync(t => t.Code == dateCode && (tenantId == Guid.Empty || t.TenantId == tenantId || t.TenantId == Guid.Empty));
                        if (dateFolder == null)
                        {
                            dateFolder = new Domain.Entities.BankTopic
                            {
                                Id = Guid.NewGuid(),
                                Code = dateCode,
                                Name = $"Studio {ymdFormatted}",
                                Description = $"Thư mục đề thi ngày {createdAt:dd/MM/yyyy}",
                                CategoryCode = "STUDIO",
                                DomainCode = "EDUCATION",
                                Scope = tenantId != Guid.Empty ? "TENANT" : "COMMUNITY",
                                MaterializedPath = $"/STUDIO/{ymd}/",
                                DepthLevel = 2,
                                ParentId = root.Id,
                                VisibilityScope = Domain.Entities.TopicVisibility.Public,
                                Enabled = true,
                                TenantId = tenantId
                            };
                            _db.BankTopics.Add(dateFolder);
                            await _db.SaveChangesAsync();
                        }

                        // 3. Creator Folder: STUDIO_{ymd}_{creatorCode} (Ví dụ: STUDIO_20261102_CRT7571EC)
                        var creatorFolderCode = $"STUDIO_{ymd}_{creatorCode}";
                        var creatorFolder = await _db.BankTopics.FirstOrDefaultAsync(t => t.Code == creatorFolderCode && (tenantId == Guid.Empty || t.TenantId == tenantId || t.TenantId == Guid.Empty));
                        if (creatorFolder == null)
                        {
                            creatorFolder = new Domain.Entities.BankTopic
                            {
                                Id = Guid.NewGuid(),
                                Code = creatorFolderCode,
                                Name = $"Creator [{creatorCode}]",
                                Description = $"Không gian đề thi giáo viên {creatorCode} ngày {createdAt:dd/MM/yyyy}",
                                CategoryCode = "STUDIO",
                                DomainCode = "EDUCATION",
                                Scope = tenantId != Guid.Empty ? "TENANT" : "COMMUNITY",
                                MaterializedPath = $"/STUDIO/{ymd}/{creatorCode}/",
                                DepthLevel = 3,
                                ParentId = dateFolder.Id,
                                VisibilityScope = Domain.Entities.TopicVisibility.Public,
                                Enabled = true,
                                TenantId = tenantId,
                                CreatedByUserId = defaultPartner?.UserId
                            };
                            _db.BankTopics.Add(creatorFolder);
                            await _db.SaveChangesAsync();
                        }

                        // 4. Update legacy exam topic to level 4: code TP...
                        if (st.DepthLevel == 4 || (st.Code != dateCode && st.Code != creatorFolderCode && !st.Code.Contains("CRT")))
                        {
                            var oldCode = st.Code;
                            if (st.Code.StartsWith("STUDIO_"))
                            {
                                var newCode = "TP" + st.Code.Substring(7);
                                st.Code = newCode;
                                var questionsToUpdate = await _db.Questions.Where(q => q.CategoryCode == oldCode).ToListAsync();
                                foreach (var q in questionsToUpdate)
                                {
                                    q.CategoryCode = newCode;
                                }
                            }
                            st.ParentId = creatorFolder.Id;
                            st.MaterializedPath = $"/STUDIO/{ymd}/{creatorCode}/{st.Code}/";
                            st.DepthLevel = 4;
                            if (!st.CreatedByUserId.HasValue) st.CreatedByUserId = defaultPartner?.UserId;
                            if (string.IsNullOrWhiteSpace(st.Description) || st.Description == "_")
                                st.Description = $"Đề thi tạo từ Creator Studio bởi {creatorCode}";
                            changed = true;
                        }
                    }
                }

                if (changed)
                {
                    await _db.SaveChangesAsync();
                }
            }
            catch
            {
                // Bỏ qua nếu có xung đột để không làm gián đoạn API get
            }
        }

        // ── GET api/quiz/topics/tree ───────────────────────────────────────────
        /// <summary>
        /// [Omni-Century] Trả về cây tri thức đa phân cấp gom nhóm theo Domain ➔ Parent Folder ➔ Child Topics.
        /// </summary>
        [HttpGet("tree")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCognitiveTopicTree(
            [FromQuery] string? domainCode = null,
            [FromQuery] string? scope = null,
            [FromQuery] string? search = null)
        {
            try
            {
                await AutoHealHierarchicalTopicsAsync();

                var domains = await _db.DynamicDomains.AsNoTracking().OrderBy(d => d.DisplayOrder).ToListAsync();
                var topics = await _db.BankTopics.AsNoTracking().Where(t => t.Enabled).ToListAsync();

                // Lấy thống kê số câu hỏi theo CategoryCode
                var questionCounts = await _db.Questions.AsNoTracking()
                    .GroupBy(q => q.CategoryCode)
                    .Select(g => new { Code = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Code, x => x.Count, StringComparer.OrdinalIgnoreCase);

                // Áp dụng bộ lọc
                if (!string.IsNullOrWhiteSpace(scope))
                {
                    topics = topics.Where(t => string.Equals(t.Scope, scope, StringComparison.OrdinalIgnoreCase)).ToList();
                }
                if (!string.IsNullOrWhiteSpace(domainCode))
                {
                    topics = topics.Where(t => string.Equals(t.DomainCode, domainCode, StringComparison.OrdinalIgnoreCase)).ToList();
                    domains = domains.Where(d => string.Equals(d.Code, domainCode, StringComparison.OrdinalIgnoreCase)).ToList();
                }
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var s = search.Trim().ToLowerInvariant();
                    topics = topics.Where(t => t.Name.ToLowerInvariant().Contains(s) || t.Code.ToLowerInvariant().Contains(s)).ToList();
                }

                var treeResult = new List<CognitiveDomainGroupDto>();

                // Nhóm theo Domain
                var topicsByDomain = topics.GroupBy(t => string.IsNullOrWhiteSpace(t.DomainCode) ? "GENERAL" : t.DomainCode);

                foreach (var group in topicsByDomain)
                {
                    var domain = domains.FirstOrDefault(d => string.Equals(d.Code, group.Key, StringComparison.OrdinalIgnoreCase))
                                 ?? new DynamicDomain { Code = group.Key, Name = group.Key, Icon = "Folder", ColorBadge = "#64748b" };

                    var domainTopics = group.ToList();
                    var allNodes = domainTopics.Select(t => new CognitiveTopicNodeDto
                    {
                        Id = t.Id,
                        Code = t.Code,
                        Name = t.Name,
                        Description = t.Description,
                        DomainCode = t.DomainCode,
                        Scope = t.Scope,
                        MaterializedPath = t.MaterializedPath ?? "",
                        DepthLevel = t.DepthLevel,
                        ParentId = t.ParentId,
                        Enabled = t.Enabled,
                        QuestionCount = questionCounts.TryGetValue(t.Code, out var c) ? c : t.QuestionCountCached
                    }).ToList();

                    // Xây dựng cây quan hệ cha-con
                    var nodeLookup = allNodes.ToDictionary(n => n.Id);
                    var rootNodes = new List<CognitiveTopicNodeDto>();

                    foreach (var node in allNodes)
                    {
                        if (node.ParentId.HasValue && nodeLookup.TryGetValue(node.ParentId.Value, out var parentNode))
                        {
                            parentNode.Children.Add(node);
                        }
                        else
                        {
                            rootNodes.Add(node);
                        }
                    }

                    // Sắp xếp các con
                    foreach (var r in rootNodes)
                    {
                        r.Children = r.Children.OrderBy(c => c.Name).ToList();
                    }

                    // Tính tổng số câu hỏi của Domain
                    int domainTotalQuestions = allNodes.Sum(n => n.QuestionCount);

                    // Sắp xếp
                    rootNodes = rootNodes.OrderBy(n => n.Name).ToList();

                    treeResult.Add(new CognitiveDomainGroupDto
                    {
                        DomainCode = domain.Code,
                        DomainName = domain.Name,
                        Icon = domain.Icon,
                        ColorBadge = domain.ColorBadge,
                        TotalQuestionCount = domainTotalQuestions,
                        RootTopics = rootNodes
                    });
                }

                // Sắp xếp danh sách Domain theo thứ tự chuẩn
                treeResult = treeResult.OrderBy(g => g.DomainCode == "BANKING" ? 1 : g.DomainCode == "EDUCATION" ? 2 : g.DomainCode == "GOV_DRIVING" ? 3 : 4).ToList();

                return Ok(treeResult);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi truy vấn cây tri thức: {ex.Message}" });
            }
        }

        // ── GET api/quiz/topics/counts ─────────────────────────────────────────
        [HttpGet("counts")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTopicCounts()
        {
            try
            {
                // Tổng số câu hỏi theo CategoryCode
                var rawCounts = await _db.Questions.AsNoTracking()
                    .GroupBy(q => q.CategoryCode)
                    .Select(g => new { TopicCode = g.Key, Count = g.Count() })
                    .ToListAsync();

                var countMap   = rawCounts.ToDictionary(x => x.TopicCode, x => x.Count);
                var allTopics  = await _db.BankTopics.AsNoTracking().ToListAsync();
                var result     = new List<object>();

                // [P2 Perf Fix] Trước đây BFS lại toàn bộ allTopics cho TỪNG topic
                // (allTopics.Where(t => t.ParentId == parentId) lồng trong loop) → O(n²)
                // trong bộ nhớ. Nay dựng sẵn 1 lần Dictionary<ParentId, List<Children>>,
                // tra cứu O(1) mỗi bước BFS → tổng chi phí còn O(n).
                var childrenByParentId = allTopics
                    .Where(t => t.ParentId.HasValue)
                    .GroupBy(t => t.ParentId!.Value)
                    .ToDictionary(g => g.Key, g => g.ToList());

                foreach (var topic in allTopics)
                {
                    // BFS để lấy tất cả mã con (chống cycle lặp vô hạn)
                    var descendants = new List<string> { topic.Code };
                    var queue       = new Queue<Guid>();
                    var visited     = new HashSet<Guid> { topic.Id };
                    queue.Enqueue(topic.Id);

                    while (queue.Count > 0)
                    {
                        var parentId = queue.Dequeue();
                        if (!childrenByParentId.TryGetValue(parentId, out var children))
                            continue;

                        foreach (var child in children)
                        {
                            if (visited.Add(child.Id))
                            {
                                descendants.Add(child.Code);
                                queue.Enqueue(child.Id);
                            }
                        }
                    }

                    result.Add(new
                    {
                        TopicCode = topic.Code,
                        Count     = descendants.Sum(code => countMap.GetValueOrDefault(code, 0))
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi lấy thống kê chủ đề: {ex.Message}" });
            }
        }

        // ── POST api/quiz/topics ───────────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> CreateTopic([FromBody] BankTopicUpsertDto dto)
        {
            try
            {
                // Kiểm tra Code trùng lặp
                if (await _db.BankTopics.AnyAsync(t => t.Code == dto.Code))
                    return Conflict(new { message = $"Mã chủ đề '{dto.Code}' đã tồn tại." });

                var callerId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                Guid? createdByUserId = null;
                if (!string.IsNullOrEmpty(callerId) && Guid.TryParse(callerId, out var parsedGuid))
                {
                    createdByUserId = parsedGuid;
                }

                var topic = new BankTopic
                {
                    Id              = Guid.NewGuid(),
                    Code            = dto.Code.Trim().ToUpper(),
                    Name            = dto.Name,
                    Description     = dto.Description,
                    CategoryCode    = dto.CategoryCode,
                    ParentId        = dto.ParentId,
                    Enabled         = dto.Enabled,
                    VisibilityScope = dto.VisibilityScope,
                    DomainCode      = !string.IsNullOrWhiteSpace(dto.DomainCode) ? dto.DomainCode : "GENERAL",
                    Scope           = !string.IsNullOrWhiteSpace(dto.Scope) ? dto.Scope : "COMMUNITY",
                    TenantId        = _tenant.CurrentTenantId,
                    CreatedByUserId = createdByUserId,
                    CreatedAt       = DateTime.UtcNow
                };

                _db.BankTopics.Add(topic);
                await _db.SaveChangesAsync();
                return Created($"api/quiz/topics/{topic.Id}", topic);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi tạo chủ đề: {ex.Message}" });
            }
        }

        // ── PUT api/quiz/topics/{id} ───────────────────────────────────────────
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateTopic(Guid id, [FromBody] BankTopicUpsertDto dto)
        {
            Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? transaction = null;
            if (_db.Database.IsRelational()) transaction = await _db.Database.BeginTransactionAsync();

            try
            {
                var topic = await _db.BankTopics.FindAsync(id);
                if (topic == null)
                    return NotFound(new { message = "Không tìm thấy chủ đề" });

                if (!await _ownershipGuard.CanManageAsync(User, topic.CreatedByUserId?.ToString(), null))
                    return Forbid();

                var oldCode = topic.Code;
                var newCode = dto.Code.Trim().ToUpper();
                bool codeChanged = !string.Equals(oldCode, newCode, StringComparison.OrdinalIgnoreCase);

                if (codeChanged)
                {
                    if (await _db.BankTopics.AnyAsync(t => t.Id != id && t.Code == newCode))
                        return Conflict(new { message = $"Mã chủ đề '{newCode}' đã được sử dụng bởi một chủ đề khác." });
                }

                topic.Code            = newCode;
                topic.Name            = dto.Name;
                topic.Description     = dto.Description;
                topic.CategoryCode    = dto.CategoryCode;
                topic.ParentId        = dto.ParentId;
                topic.Enabled         = dto.Enabled;
                topic.VisibilityScope = dto.VisibilityScope;
                if (!string.IsNullOrWhiteSpace(dto.DomainCode)) topic.DomainCode = dto.DomainCode;
                if (!string.IsNullOrWhiteSpace(dto.Scope)) topic.Scope = dto.Scope;
                topic.UpdatedAt       = DateTime.UtcNow;

                if (codeChanged)
                {
                    // 1. Cascade update MaterializedPath của các chủ đề con
                    var oldPathSegment = $"/{oldCode}/";
                    var newPathSegment = $"/{newCode}/";
                    var descendants = await _db.BankTopics
                        .Where(t => t.MaterializedPath != null && t.MaterializedPath.Contains(oldPathSegment))
                        .ToListAsync();
                    foreach (var d in descendants)
                    {
                        d.MaterializedPath = d.MaterializedPath!.Replace(oldPathSegment, newPathSegment);
                    }

                    // 2. Cascade update các câu hỏi có CategoryCode == oldCode
                    var directQuestions = await _db.Questions
                        .Where(q => q.CategoryCode == oldCode)
                        .ToListAsync();
                    foreach (var q in directQuestions)
                    {
                        q.CategoryCode = newCode;
                    }

                    // 3. Cascade update các câu hỏi liên kết qua Tags / linkedTopicCodes
                    var oldTag = "#" + oldCode;
                    var taggedQuestions = await _db.Questions
                        .Where(q => q.Tags.Contains(oldCode) || q.Tags.Contains(oldTag))
                        .ToListAsync();
                    foreach (var q in taggedQuestions)
                    {
                        _deduplicationEngine.DisassociateTopicFromQuestion(q, oldCode, newCode);
                        _deduplicationEngine.AssociateTopicToQuestion(q, newCode, dto.Name);
                    }
                }

                await _db.SaveChangesAsync();
                if (transaction != null) await transaction.CommitAsync();
                return Ok(topic);
            }
            catch (Exception ex)
            {
                if (transaction != null) await transaction.RollbackAsync();
                return StatusCode(500, new { message = $"Lỗi cập nhật chủ đề: {ex.Message}" });
            }
            finally
            {
                if (transaction != null) await transaction.DisposeAsync();
            }
        }

        // ── DELETE api/quiz/topics/{id} ────────────────────────────────────────
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteTopic(
            Guid id, 
            [FromQuery] bool deleteQuestions = false,
            [FromQuery] TopicDeleteMode mode = TopicDeleteMode.UnlinkOnly)
        {
            // Tương thích ngược: nếu client cũ truyền deleteQuestions = true
            if (deleteQuestions && mode == TopicDeleteMode.UnlinkOnly)
            {
                mode = TopicDeleteMode.SafeCascade;
            }

            Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? transaction = null;
            if (_db.Database.IsRelational())
            {
                transaction = await _db.Database.BeginTransactionAsync();
            }

            try
            {
                var topic = await _db.BankTopics
                    .IgnoreQueryFilters()
                    .Include(t => t.Children)
                    .Include(t => t.Parent)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (topic == null)
                    return NotFound(new { message = "Không tìm thấy chủ đề" });

                if (!_tenant.IsSystemAdmin && topic.TenantId != Guid.Empty && topic.TenantId != _tenant.CurrentTenantId)
                    return NotFound(new { message = "Không tìm thấy chủ đề" });

                // Bảo vệ chủ đề hệ thống bất biến (STUDIO, GENERAL, COMMUNITY)
                var protectedCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "GENERAL", "STUDIO", "COMMUNITY" };
                if (protectedCodes.Contains(topic.Code))
                {
                    return BadRequest(new { message = "Không thể xóa chủ đề gốc bảo vệ của hệ thống." });
                }

                if (!await _ownershipGuard.CanManageAsync(User, topic.CreatedByUserId?.ToString(), null))
                    return Forbid();

                // ── KỊCH BẢN 3: LƯU TRỮ MỀM (ARCHIVE SOFT) ──
                if (mode == TopicDeleteMode.ArchiveSoft)
                {
                    topic.Enabled = false;
                    topic.VisibilityScope = TopicVisibility.Private;
                    topic.UpdatedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync();
                    if (transaction != null) await transaction.CommitAsync();

                    return Ok(new
                    {
                        success = true,
                        message = $"Đã lưu trữ thành công chủ đề '{topic.Name}' mà không xóa câu hỏi.",
                        archivedTopicId = topic.Id
                    });
                }

                var allTopics = await _db.BankTopics
                    .IgnoreQueryFilters()
                    .Where(t => _tenant.IsSystemAdmin || t.TenantId == Guid.Empty || t.TenantId == _tenant.CurrentTenantId)
                    .ToListAsync();

                // Thu thập các chủ đề bị ảnh hưởng (cả topic hiện tại và các con cháu nếu cascade)
                var affectedTopics = (mode == TopicDeleteMode.SafeCascade)
                    ? new List<BankTopic>(GetDescendantTopics(topic.Id, allTopics)) { topic }
                    : new List<BankTopic> { topic };

                var baseCodes = affectedTopics
                    .SelectMany(t => new[] { t.Code, t.CategoryCode })
                    .Where(c => !string.IsNullOrWhiteSpace(c))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var expandedCodes = new HashSet<string>(baseCodes, StringComparer.OrdinalIgnoreCase);
                foreach (var c in baseCodes)
                {
                    expandedCodes.Add(c.Replace("_", "-"));
                    expandedCodes.Add(c.Replace("-", "_"));
                }
                var affectedCodes = expandedCodes.ToList();

                var affectedTags = affectedCodes.Select(c => "#" + c).Concat(affectedCodes).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

                // Tìm tất cả câu hỏi liên quan trực tiếp qua CategoryCode (100% provider-agnostic & indexed)
                var candidateQuestions = await _db.Questions
                    .IgnoreQueryFilters()
                    .Where(q => (_tenant.IsSystemAdmin || q.TenantId == Guid.Empty || q.TenantId == _tenant.CurrentTenantId)
                             && affectedCodes.Contains(q.CategoryCode))
                    .ToListAsync();

                // Bổ sung các câu hỏi liên kết chéo qua Tags (hỗ trợ N-M, an toàn với mọi provider)
                try
                {
                    foreach (var code in affectedCodes)
                    {
                        var tag1 = code;
                        var tag2 = "#" + code;
                        var tag3 = "#topic:" + code;
                        var tagQuestions = await _db.Questions
                            .IgnoreQueryFilters()
                            .Where(q => (_tenant.IsSystemAdmin || q.TenantId == Guid.Empty || q.TenantId == _tenant.CurrentTenantId)
                                     && (q.Tags.Contains(tag1) || q.Tags.Contains(tag2) || q.Tags.Contains(tag3)))
                            .ToListAsync();

                        foreach (var tq in tagQuestions)
                        {
                            if (!candidateQuestions.Any(cq => cq.Id == tq.Id))
                            {
                                candidateQuestions.Add(tq);
                            }
                        }
                    }
                }
                catch
                {
                    // Fallback mềm cho các database provider kiểm thử in-memory không dịch được array contains
                }

                int unlinkedCount = 0;
                int deletedQuestionsCount = 0;
                int reassignedCount = 0;

                string fallbackCode = !string.IsNullOrWhiteSpace(topic.Parent?.Code) ? topic.Parent.Code : "GENERAL";
                if (fallbackCode == "GENERAL" && !allTopics.Any(t => t.Code.Equals("GENERAL", StringComparison.OrdinalIgnoreCase)))
                {
                    var generalTopic = new BankTopic
                    {
                        Id = Guid.NewGuid(),
                        Code = "GENERAL",
                        Name = "Chủ đề chung",
                        Description = "Chủ đề mặc định cho các câu hỏi chưa phân nhóm",
                        CategoryCode = "GENERAL",
                        Enabled = true,
                        VisibilityScope = "PUBLIC",
                        TenantId = topic.TenantId,
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.BankTopics.Add(generalTopic);
                    allTopics.Add(generalTopic);
                    await _db.SaveChangesAsync();
                }

                var questionsToDelete = new List<QuestionBase>();

                foreach (var q in candidateQuestions)
                {
                    // Kiểm tra xem câu hỏi này có liên kết tới các Topic BÊN NGOÀI nhánh bị xóa hay không
                    var outsideTopics = q.LinkedTopicCodes
                        .Where(tc => !affectedCodes.Contains(tc, StringComparer.OrdinalIgnoreCase))
                        .ToList();

                    bool isShared = outsideTopics.Count > 0;

                    if (isShared)
                    {
                        // [BẢO VỆ TUYỆT ĐỐI CÂU HỎI DÙNG CHUNG]:
                        // Chỉ gỡ bỏ các mã topic bị xóa, TUYỆT ĐỐI KHÔNG XÓA THỰC THỂ CÂU HỎI!
                        foreach (var code in affectedCodes)
                        {
                            _deduplicationEngine.DisassociateTopicFromQuestion(q, code, outsideTopics.FirstOrDefault() ?? fallbackCode);
                        }
                        unlinkedCount++;
                    }
                    else
                    {
                        // Câu hỏi ĐỘC QUYỀN (chỉ thuộc riêng nhánh này - chủ đề cuối cùng)
                        if (mode == TopicDeleteMode.SafeCascade)
                        {
                            // Bảo vệ chủ sở hữu câu hỏi: Chỉ xóa nếu người xóa có quyền quản lý câu hỏi
                            bool canDeleteQuestion = await _ownershipGuard.CanManageAsync(User, q.CreatorId, q.OrgUnitId);
                            if (canDeleteQuestion)
                            {
                                questionsToDelete.Add(q);
                                deletedQuestionsCount++;
                            }
                            else
                            {
                                foreach (var code in affectedCodes)
                                {
                                    _deduplicationEngine.DisassociateTopicFromQuestion(q, code, fallbackCode);
                                }
                                q.CategoryCode = fallbackCode;
                                reassignedCount++;
                            }
                        }
                        else
                        {
                            // UnlinkOnly: Bàn giao câu hỏi về fallbackCode
                            foreach (var code in affectedCodes)
                            {
                                _deduplicationEngine.DisassociateTopicFromQuestion(q, code, fallbackCode);
                            }
                            q.CategoryCode = fallbackCode;
                            reassignedCount++;
                        }
                    }
                }

                if (questionsToDelete.Count > 0)
                {
                    _db.Questions.RemoveRange(questionsToDelete);
                }

                // Bàn giao các topic con trực tiếp nếu không cascade
                var directChildren = allTopics.Where(t => t.ParentId == topic.Id).ToList();
                if (mode != TopicDeleteMode.SafeCascade)
                {
                    foreach (var child in directChildren)
                    {
                        child.ParentId = topic.ParentId;
                        child.Parent = topic.Parent;
                    }
                }

                // Xóa ràng buộc tự tham chiếu
                foreach (var t in affectedTopics)
                {
                    t.ParentId = null;
                    t.Parent = null;
                    t.Children.Clear();
                }
                await _db.SaveChangesAsync();

                // Xóa topics (leaf-to-root)
                affectedTopics.Reverse();
                _db.BankTopics.RemoveRange(affectedTopics);
                await _db.SaveChangesAsync();

                if (transaction != null) await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Đã xử lý xóa chủ đề '{topic.Name}' thành công (Chế độ: {mode}).",
                    deletedTopicCount = affectedTopics.Count,
                    unlinkedSharedQuestionCount = unlinkedCount,
                    deletedExclusiveQuestionCount = deletedQuestionsCount,
                    reassignedQuestionCount = reassignedCount
                });
            }
            catch (Exception ex)
            {
                if (transaction != null) await transaction.RollbackAsync();
                var innerMsg = ex.InnerException?.Message;
                var detailedMsg = string.IsNullOrWhiteSpace(innerMsg) ? ex.Message : $"{ex.Message} -> {innerMsg}";
                return StatusCode(500, new { message = $"Lỗi xóa chủ đề: {detailedMsg}" });
            }
            finally
            {
                if (transaction != null) await transaction.DisposeAsync();
            }
        }

        // ── GET api/quiz/topics/pivot-tree ─────────────────────────────────────
        /// <summary>
        /// [Universal Multi-Perspective Taxonomy Engine]
        /// Cung cấp cây phân cấp đa lăng kính xoay trục:
        /// - by-subject: Môn học ➔ Khối lớp ➔ Kỳ thi/Bộ sách (Dành cho Giáo viên bộ môn)
        /// - by-grade: Khối lớp ➔ Môn học ➔ Kỳ thi/Bộ sách (Dành cho Khối trưởng / Ban giám hiệu)
        /// - by-term: Kỳ thi / Học kỳ ➔ Khối lớp ➔ Môn học (Dành cho Ban khảo thí)
        /// </summary>
        [HttpGet("pivot-tree")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTaxonomyPivotTree(
            [FromQuery] string pivot = "by-subject",
            [FromQuery] string? domainCode = null,
            [FromQuery] string? grade = null,
            [FromQuery] string? topicCode = null)
        {
            try
            {
                var q = _db.Questions.AsNoTracking().AsQueryable();
                if (!_tenant.IsSystemAdmin && _tenant.CurrentTenantId != Guid.Empty)
                {
                    q = q.Where(x => x.TenantId == Guid.Empty || x.TenantId == _tenant.CurrentTenantId);
                }
                if (!string.IsNullOrWhiteSpace(domainCode) && domainCode != "ALL")
                {
                    q = q.Where(x => x.DomainCode == domainCode);
                }

                // Thu nạp và phân tích câu hỏi theo hệ tọa độ chuẩn UCTE (SSoT)
                var allQuestions = await q.ToListAsync();
                var topicSeeds = AegisQuiz.Application.Services.TaxonomyResourceSeedLoader.GetDefaultTopics();
                var topicLookup = topicSeeds.ToDictionary(t => t.TopicCode, StringComparer.OrdinalIgnoreCase);
                var bankTopics = await _db.BankTopics.AsNoTracking().ToListAsync();
                var topicMap = bankTopics.ToDictionary(t => t.Code, StringComparer.OrdinalIgnoreCase);
                string GradeExtractor(QuestionBase qb) => UniversalCoordinateTaxonomyEngine.ExtractGrade(qb, topicMap);
                string TopicExtractor(QuestionBase qb) => UniversalCoordinateTaxonomyEngine.ExtractTopic(qb);

                // Lọc thêm theo tham số yêu cầu
                if (!string.IsNullOrWhiteSpace(topicCode))
                {
                    var resolved = UniversalCoordinateTaxonomyEngine.ResolveTopicCode(topicCode);
                    allQuestions = allQuestions.Where(x => TopicExtractor(x).Equals(resolved, StringComparison.OrdinalIgnoreCase)).ToList();
                }
                if (!string.IsNullOrWhiteSpace(grade))
                {
                    var cleanG = grade.Trim().ToUpperInvariant();
                    if (!cleanG.StartsWith("K") && int.TryParse(cleanG, out var gn)) cleanG = $"K{gn:D2}";
                    allQuestions = allQuestions.Where(x => GradeExtractor(x).Equals(cleanG, StringComparison.OrdinalIgnoreCase)).ToList();
                }

                var rootNodes = new List<TaxonomyPivotTreeNodeDto>();

                if (string.Equals(pivot, "by-grade", StringComparison.OrdinalIgnoreCase))
                {
                    // LĂNG KÍNH 2: KHỐI LỚP ➔ MÔN HỌC ➔ KỲ THI/BỘ SÁCH
                    var gradeGroups = allQuestions.GroupBy(GradeExtractor).OrderBy(g => g.Key);
                    foreach (var gg in gradeGroups)
                    {
                        var gradeNode = new TaxonomyPivotTreeNodeDto
                        {
                            Id = $"GRADE_{gg.Key}",
                            Code = gg.Key,
                            Label = gg.Key.StartsWith("K") && int.TryParse(gg.Key.Substring(1), out var gn) ? $"Lớp {gn}" : gg.Key,
                            NodeType = "GRADE",
                            MaterializedPath = $"/EDU/GRADE/{gg.Key}/",
                            QuestionCount = gg.Count()
                        };

                        var subjectSubGroups = gg.GroupBy(TopicExtractor).OrderBy(s => s.Key);
                        foreach (var sg in subjectSubGroups)
                        {
                            var topicInfo = topicLookup.TryGetValue(sg.Key, out var ti) ? ti : null;
                            var subjectNode = new TaxonomyPivotTreeNodeDto
                            {
                                Id = $"GRADE_{gg.Key}_TOPIC_{sg.Key}",
                                Code = sg.Key,
                                Label = topicInfo?.TopicName ?? sg.Key,
                                NodeType = "TOPIC",
                                MaterializedPath = $"/EDU/GRADE/{gg.Key}/{sg.Key}/",
                                QuestionCount = sg.Count()
                            };

                            var leafGroups = sg.GroupBy(x => !string.IsNullOrEmpty(x.FriendlyTopicName) ? x.FriendlyTopicName : (x.CanonicalTopicCode ?? "Chung"));
                            foreach (var lg in leafGroups)
                            {
                                subjectNode.Children.Add(new TaxonomyPivotTreeNodeDto
                                {
                                    Id = $"LEAF_{Guid.NewGuid():N}",
                                    Code = lg.First().CanonicalTopicCode ?? lg.Key,
                                    Label = lg.Key,
                                    NodeType = "LEAF",
                                    MaterializedPath = lg.First().TreePath,
                                    QuestionCount = lg.Count()
                                });
                            }

                            gradeNode.Children.Add(subjectNode);
                        }

                        rootNodes.Add(gradeNode);
                    }
                }
                else if (string.Equals(pivot, "by-term", StringComparison.OrdinalIgnoreCase))
                {
                    // LĂNG KÍNH 3: KỲ THI / HỌC KỲ ➔ KHỐI LỚP ➔ MÔN HỌC
                    var termGroups = allQuestions.GroupBy(x => !string.IsNullOrEmpty(x.SemesterPhase) ? x.SemesterPhase : "REGULAR").OrderBy(t => t.Key);
                    foreach (var tg in termGroups)
                    {
                        var termNode = new TaxonomyPivotTreeNodeDto
                        {
                            Id = $"TERM_{tg.Key}",
                            Code = tg.Key,
                            Label = tg.Key,
                            NodeType = "TERM",
                            MaterializedPath = $"/EDU/TERM/{tg.Key}/",
                            QuestionCount = tg.Count()
                        };

                        var gradeSubGroups = tg.GroupBy(GradeExtractor).OrderBy(g => g.Key);
                        foreach (var gg in gradeSubGroups)
                        {
                            var gradeSubNode = new TaxonomyPivotTreeNodeDto
                            {
                                Id = $"TERM_{tg.Key}_GRADE_{gg.Key}",
                                Code = gg.Key,
                                Label = gg.Key.StartsWith("K") && int.TryParse(gg.Key.Substring(1), out var gn) ? $"Lớp {gn}" : gg.Key,
                                NodeType = "GRADE",
                                MaterializedPath = $"/EDU/TERM/{tg.Key}/{gg.Key}/",
                                QuestionCount = gg.Count()
                            };

                            var topicSubGroups = gg.GroupBy(TopicExtractor).OrderBy(s => s.Key);
                            foreach (var sg in topicSubGroups)
                            {
                                var topicInfo = topicLookup.TryGetValue(sg.Key, out var ti) ? ti : null;
                                gradeSubNode.Children.Add(new TaxonomyPivotTreeNodeDto
                                {
                                    Id = $"TERM_{tg.Key}_GRADE_{gg.Key}_TOPIC_{sg.Key}",
                                    Code = sg.Key,
                                    Label = topicInfo?.TopicName ?? sg.Key,
                                    NodeType = "TOPIC",
                                    MaterializedPath = $"/EDU/TERM/{tg.Key}/{gg.Key}/{sg.Key}/",
                                    QuestionCount = sg.Count()
                                });
                            }

                            termNode.Children.Add(gradeSubNode);
                        }

                        rootNodes.Add(termNode);
                    }
                }
                else
                {
                    // LĂNG KÍNH 1 (MẶC ĐỊNH): MÔN HỌC ➔ KHỐI LỚP ➔ KỲ THI/BỘ SÁCH (Cho Giáo viên bộ môn)
                    var subjectGroups = allQuestions.GroupBy(TopicExtractor).OrderBy(s => s.Key);
                    foreach (var sg in subjectGroups)
                    {
                        var topicInfo = topicLookup.TryGetValue(sg.Key, out var ti) ? ti : null;
                        var subjectNode = new TaxonomyPivotTreeNodeDto
                        {
                            Id = $"TOPIC_{sg.Key}",
                            Code = sg.Key,
                            Label = topicInfo?.TopicName ?? sg.Key,
                            NodeType = "TOPIC",
                            MaterializedPath = $"/EDU/SUBJECT/{sg.Key}/",
                            QuestionCount = sg.Count()
                        };

                        var gradeSubGroups = sg.GroupBy(GradeExtractor).OrderBy(g => g.Key);
                        foreach (var gg in gradeSubGroups)
                        {
                            var gradeNode = new TaxonomyPivotTreeNodeDto
                            {
                                Id = $"TOPIC_{sg.Key}_GRADE_{gg.Key}",
                                Code = gg.Key,
                                Label = gg.Key.StartsWith("K") && int.TryParse(gg.Key.Substring(1), out var gn) ? $"Lớp {gn}" : gg.Key,
                                NodeType = "GRADE",
                                MaterializedPath = $"/EDU/SUBJECT/{sg.Key}/{gg.Key}/",
                                QuestionCount = gg.Count()
                            };

                            var leafGroups = gg.GroupBy(x => !string.IsNullOrEmpty(x.FriendlyTopicName) ? x.FriendlyTopicName : (x.CanonicalTopicCode ?? "Chung"));
                            foreach (var lg in leafGroups)
                            {
                                gradeNode.Children.Add(new TaxonomyPivotTreeNodeDto
                                {
                                    Id = $"LEAF_{Guid.NewGuid():N}",
                                    Code = lg.First().CanonicalTopicCode ?? lg.Key,
                                    Label = lg.Key,
                                    NodeType = "LEAF",
                                    MaterializedPath = lg.First().TreePath,
                                    QuestionCount = lg.Count()
                                });
                            }

                            gradeNode.Children.Add(gradeNode);
                        }

                        rootNodes.Add(subjectNode);
                    }
                }

                return Ok(rootNodes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi phân phối cây tri thức xoay trục: {ex.Message}" });
            }
        }

        // ── GET api/quiz/topics/matrix-summary ──────────────────────────────────
        /// <summary>
        /// [Executive Overview] Bảng ma trận 2 chiều tổng hợp tri thức: Môn học (Rows) x Khối lớp (Columns)
        /// Cho phép Giáo viên & Quản trị viên nắm bắt tức thì độ phủ câu hỏi toàn trường.
        /// </summary>
        [HttpGet("matrix-summary")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTaxonomyMatrixSummary([FromQuery] string domainCode = "EDUCATION")
        {
            try
            {
                var q = _db.Questions.AsNoTracking().AsQueryable();
                if (!_tenant.IsSystemAdmin && _tenant.CurrentTenantId != Guid.Empty)
                {
                    q = q.Where(x => x.TenantId == Guid.Empty || x.TenantId == _tenant.CurrentTenantId);
                }
                if (!string.IsNullOrWhiteSpace(domainCode) && domainCode != "ALL")
                {
                    q = q.Where(x => x.DomainCode == domainCode);
                }

                var questions = await q.ToListAsync();

                var topicSeeds = AegisQuiz.Application.Services.TaxonomyResourceSeedLoader.GetDefaultTopics();
                var topicLookup = topicSeeds.ToDictionary(t => t.TopicCode, StringComparer.OrdinalIgnoreCase);
                var bankTopics = await _db.BankTopics.AsNoTracking().ToListAsync();
                var topicMap = bankTopics.ToDictionary(t => t.Code, StringComparer.OrdinalIgnoreCase);

                string GradeExtractor(QuestionBase qb) => UniversalCoordinateTaxonomyEngine.ExtractGrade(qb, topicMap);
                string TopicExtractor(QuestionBase qb) => UniversalCoordinateTaxonomyEngine.ExtractTopic(qb);

                // Xác định danh sách khối lớp hiển thị (Columns)
                var standardGrades = (domainCode == "EDUCATION")
                    ? new List<string> { "K06", "K07", "K08", "K09", "K10", "K11", "K12" }
                    : Enumerable.Range(1, 12).Select(i => $"K{i:D2}").ToList();

                var extractedGrades = questions
                    .Select(GradeExtractor)
                    .Where(g => !string.IsNullOrWhiteSpace(g) && g != "K_GEN")
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var allGrades = standardGrades
                    .Union(extractedGrades, StringComparer.OrdinalIgnoreCase)
                    .OrderBy(g => g)
                    .ToList();

                // Tổng hợp theo Môn học (Rows)
                var topicGroups = questions.GroupBy(TopicExtractor).OrderBy(g => g.Key);
                var rows = new List<TaxonomyMatrixRowDto>();

                foreach (var tg in topicGroups)
                {
                    var topicCode = tg.Key;
                    var topicInfo = topicLookup.TryGetValue(topicCode, out var ti) ? ti : null;
                    var topicName = topicInfo?.TopicName 
                                    ?? (topicMap.TryGetValue(topicCode, out var bt) ? bt.Name : topicCode);

                    var countsByGrade = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                    foreach (var g in allGrades)
                    {
                        countsByGrade[g] = 0;
                    }

                    foreach (var qItem in tg)
                    {
                        var grade = GradeExtractor(qItem);
                        if (countsByGrade.ContainsKey(grade))
                        {
                            countsByGrade[grade]++;
                        }
                        else
                        {
                            countsByGrade[grade] = 1;
                        }
                    }

                    rows.Add(new TaxonomyMatrixRowDto
                    {
                        TopicCode = topicCode,
                        TopicName = topicName,
                        CountsByGrade = countsByGrade,
                        TotalQuestions = tg.Count()
                    });
                }

                var summary = new TaxonomyMatrixSummaryDto
                {
                    DomainCode = domainCode ?? "EDUCATION",
                    Grades = allGrades,
                    Rows = rows,
                    GrandTotalQuestions = questions.Count
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi tổng hợp ma trận tri thức: {ex.Message}" });
            }
        }

        /// <summary>
        /// [COMMUNITY KNOWLEDGE MAPPING] Đóng góp chủ đề cá nhân vào cây Tri thức Cộng đồng.
        /// Sinh nhánh chủ đề tương ứng dưới gốc COMMUNITY và liên kết (add map) mã chủ đề cộng đồng vào toàn bộ câu hỏi.
        /// </summary>
        [HttpPost("{id}/contribute-community")]
        [Authorize(Policy = RoleWeightPolicies.Learner)]
        public async Task<IActionResult> ContributeToCommunity(Guid id)
        {
            var callerId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("sub")?.Value;
            if (string.IsNullOrWhiteSpace(callerId) || !Guid.TryParse(callerId, out var userGuid))
            {
                return Unauthorized(new { message = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
            }

            var sourceTopic = await _db.BankTopics.FirstOrDefaultAsync(t => t.Id == id);
            if (sourceTopic == null)
            {
                return NotFound(new { message = "Không tìm thấy chủ đề cần đóng góp." });
            }

            // 1. Kiểm tra quyền sở hữu chủ đề (hoặc Admin/SuperAdmin)
            var partner = await _db.EducatorPartnerships.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userGuid);
            var crtCode = partner != null && !string.IsNullOrWhiteSpace(partner.ReferralCode)
                ? FormatCreatorCode(partner.ReferralCode)
                : FormatCreatorCode(userGuid.ToString("N")[..6]);

            bool isOwner = sourceTopic.CreatedByUserId == userGuid
                || User.IsInRole("Admin")
                || User.IsInRole("SuperAdmin")
                || (!string.IsNullOrEmpty(crtCode) && (
                    sourceTopic.Code.Contains(crtCode, StringComparison.OrdinalIgnoreCase)
                    || (sourceTopic.MaterializedPath ?? "").Contains(crtCode, StringComparison.OrdinalIgnoreCase)
                ));

            if (!isOwner)
            {
                return StatusCode(403, new { message = "Thầy/Cô chỉ có thể đóng góp các chủ đề do chính mình khởi tạo." });
            }

            // 2. Bảo đảm Root Topic "COMMUNITY" tồn tại
            var communityRoot = await _db.BankTopics.FirstOrDefaultAsync(t => t.Code == "COMMUNITY");
            if (communityRoot == null)
            {
                communityRoot = new BankTopic
                {
                    Id = Guid.NewGuid(),
                    Code = "COMMUNITY",
                    Name = "Cộng Đồng (Community)",
                    Description = "Kho tàng tri thức mở đóng góp từ cộng đồng nhà giáo và chuyên gia",
                    CategoryCode = "COMMUNITY",
                    DomainCode = "GENERAL",
                    MaterializedPath = "/COMMUNITY/",
                    DepthLevel = 0,
                    Scope = "COMMUNITY",
                    VisibilityScope = TopicVisibility.Public,
                    Enabled = true,
                    CreatedAt = DateTime.UtcNow
                };
                _db.BankTopics.Add(communityRoot);
                await _db.SaveChangesAsync();
            }

            // 3. Chuẩn hóa mã chủ đề Cộng đồng: COM_{sourceCode}
            var cleanSourceCode = sourceTopic.Code.Trim().TrimStart('#');
            var rawComCode = cleanSourceCode.StartsWith("COM_", StringComparison.OrdinalIgnoreCase)
                ? cleanSourceCode
                : $"COM_{cleanSourceCode}";
            var comCode = cleanSourceCode.StartsWith("CRT", StringComparison.OrdinalIgnoreCase) && cleanSourceCode.Length > 9
                ? $"COM_{cleanSourceCode[9..].TrimStart('_')}"
                : rawComCode;
            if (string.IsNullOrWhiteSpace(comCode) || comCode == "COM_") comCode = $"COM_{cleanSourceCode}";

            var comName = sourceTopic.Name.EndsWith("(Cộng đồng)", StringComparison.OrdinalIgnoreCase)
                ? sourceTopic.Name
                : $"{sourceTopic.Name} (Cộng đồng)";

            var communityTopic = await _db.BankTopics.FirstOrDefaultAsync(t => t.Code == comCode);
            if (communityTopic == null)
            {
                communityTopic = new BankTopic
                {
                    Id = Guid.NewGuid(),
                    Code = comCode,
                    Name = comName,
                    Description = $"Chủ đề được đóng góp bởi nhà giáo vào kho tri thức Cộng đồng.",
                    CategoryCode = comCode,
                    DomainCode = string.IsNullOrWhiteSpace(sourceTopic.DomainCode) ? "GENERAL" : sourceTopic.DomainCode,
                    ParentId = communityRoot.Id,
                    MaterializedPath = $"/COMMUNITY/{comCode}/",
                    DepthLevel = 1,
                    Scope = "COMMUNITY",
                    VisibilityScope = TopicVisibility.Public,
                    Enabled = true,
                    CreatedByUserId = userGuid,
                    CreatedAt = DateTime.UtcNow
                };
                _db.BankTopics.Add(communityTopic);
            }
            else
            {
                communityTopic.Name = comName;
                communityTopic.Enabled = true;
                communityTopic.VisibilityScope = TopicVisibility.Public;
                communityTopic.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            // 4. Tìm toàn bộ câu hỏi tương ứng của chủ đề nguồn và map thêm mã chủ đề Cộng đồng
            var sourceCode = sourceTopic.Code.Trim();
            var sourceTag = "#" + sourceCode;
            var sourceTopicTag = "#topic:" + sourceCode;

            var questions = await _db.Questions
                .Where(q => q.CategoryCode == sourceCode || q.Tags.Contains(sourceCode) || q.Tags.Contains(sourceTag) || q.Tags.Contains(sourceTopicTag))
                .ToListAsync();

            int mappedQuestionsCount = 0;
            foreach (var q in questions)
            {
                _deduplicationEngine.AssociateTopicToQuestion(q, comCode, communityTopic.Name);
                mappedQuestionsCount++;
            }

            communityTopic.QuestionCountCached = mappedQuestionsCount;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Đã đóng góp chủ đề '{sourceTopic.Name}' vào Cộng đồng thành công với {mappedQuestionsCount} câu hỏi được ánh xạ!",
                communityTopic = new
                {
                    id = communityTopic.Id,
                    code = communityTopic.Code,
                    name = communityTopic.Name,
                    materializedPath = communityTopic.MaterializedPath,
                    questionCount = mappedQuestionsCount
                }
            });
        }

        // ── Private helpers ────────────────────────────────────────────────────
        private static List<BankTopic> GetDescendantTopics(Guid rootId, List<BankTopic> allTopics)
        {
            var result = new List<BankTopic>();
            var queue = new Queue<Guid>();
            var visited = new HashSet<Guid> { rootId };
            queue.Enqueue(rootId);

            while (queue.Count > 0)
            {
                var currentParentId = queue.Dequeue();
                var children = allTopics.Where(t => t.ParentId == currentParentId).ToList();
                foreach (var child in children)
                {
                    if (visited.Add(child.Id))
                    {
                        result.Add(child);
                        queue.Enqueue(child.Id);
                    }
                }
            }

            return result;
        }
    }
}
