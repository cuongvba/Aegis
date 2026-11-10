using AegisQuiz.Application.Payments;
using AegisQuiz.Infrastructure.Arena;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AegisQuiz.Application.DTOs;
using AegisQuiz.Application.Interfaces;
using AegisQuiz.Domain.Entities;
using AegisQuiz.Domain.Factories;
using AegisQuiz.Infrastructure.Data;

namespace AegisQuiz.API.Controllers
{
    [ApiController]
    [Route("api/creator/studio")]
    [Authorize]
    public class CreatorStudioController : ControllerBase
    {
        private readonly ITaxonomySnifferDispatcher _taxonomyDispatcher;
        private readonly IDocxParserService _docxParser;
        private readonly IExcelParserService _excelParser;
        private readonly IPdfExtractorService _pdfParser;
        private readonly IExamDeduplicationEngine _dedupEngine;
        private readonly IExamExportTranspilerService _examTranspiler;
        private readonly AegisQuizDbContext _db;
        private readonly ArenaRoomManager _roomManager;
        private readonly ITenantContext _tenant;
        private readonly ILogger<CreatorStudioController> _logger;
        private readonly IPaymentOrchestratorService? _paymentOrchestrator;
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, System.Collections.Generic.List<DateTimeOffset>> _launchRateLimitTracker = new();

        public CreatorStudioController(
            ITaxonomySnifferDispatcher taxonomyDispatcher,
            IDocxParserService docxParser,
            IExcelParserService excelParser,
            IPdfExtractorService pdfParser,
            IExamDeduplicationEngine dedupEngine,
            IExamExportTranspilerService examTranspiler,
            AegisQuizDbContext db,
            ArenaRoomManager roomManager,
            ITenantContext tenant,
            ILogger<CreatorStudioController> logger,
            IPaymentOrchestratorService? paymentOrchestrator = null)
        {
            _taxonomyDispatcher = taxonomyDispatcher;
            _docxParser = docxParser;
            _excelParser = excelParser;
            _pdfParser = pdfParser;
            _dedupEngine = dedupEngine;
            _examTranspiler = examTranspiler;
            _db = db;
            _roomManager = roomManager;
            _tenant = tenant;
            _logger = logger;
            _paymentOrchestrator = paymentOrchestrator;
        }

        [HttpPost("sniff")]
        public IActionResult SniffTaxonomy([FromBody] SniffTaxonomyRequest request)
        {
            var result = _taxonomyDispatcher.SniffTaxonomy(request?.ContentPreview ?? string.Empty);
            return Ok(new { success = true, data = result });
        }

        [HttpPost("upload")]
        [RequestSizeLimit(30_000_000)]
        public async Task<IActionResult> UploadAndPreview(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { success = false, message = "File trống hoặc không hợp lệ." });

            try
            {
                using var stream = file.OpenReadStream();
                var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant();
                List<DocxImportPreviewDto> parsedQuestions;

                if (ext is ".xlsx" or ".xls")
                {
                    var excelResult = _excelParser.ParseExcelFileToPreview(stream, file.FileName);
                    
                    // Kế thừa logic lọc Sheet chuẩn mực và đa Sheet thông minh từ Universal Cognitive Ingestion Studio (UCIS)
                    var candidateSheets = excelResult.Sheets
                        .Where(s => s.IsEnabledForImport && (s.SheetRole == "EXAM_QUIZ" || s.Questions.Count > 0))
                        .ToList();

                    if (candidateSheets.Count == 0 && excelResult.Sheets.Count > 0)
                    {
                        candidateSheets = excelResult.Sheets.Where(s => s.Questions.Count > 0).ToList();
                    }

                    var allEnrichedQuestions = new List<DocxImportPreviewDto>();
                    foreach (var sheet in candidateSheets)
                    {
                        foreach (var q in sheet.Questions)
                        {
                            // Kế thừa và làm giàu 5 trục tọa độ & thẻ từ Sheet và Global Workbook
                            q.TopicCode = !string.IsNullOrWhiteSpace(q.TopicCode) ? q.TopicCode : sheet.DetectedTopicCode;
                            q.TopicName = !string.IsNullOrWhiteSpace(q.TopicName) ? q.TopicName : sheet.DetectedTopicName;
                            q.DomainCode = !string.IsNullOrWhiteSpace(q.DomainCode)
                                ? q.DomainCode
                                : (!string.IsNullOrWhiteSpace(sheet.DetectedDomainCode) ? sheet.DetectedDomainCode : excelResult.DetectedDomainCode);
                            q.TargetLevel = !string.IsNullOrWhiteSpace(q.TargetLevel)
                                ? q.TargetLevel
                                : (!string.IsNullOrWhiteSpace(sheet.DetectedTargetLevel) ? sheet.DetectedTargetLevel : excelResult.DetectedTargetLevel);
                            q.AssessmentPurpose = !string.IsNullOrWhiteSpace(q.AssessmentPurpose)
                                ? q.AssessmentPurpose
                                : (!string.IsNullOrWhiteSpace(sheet.DetectedAssessmentPurpose) ? sheet.DetectedAssessmentPurpose : excelResult.DetectedAssessmentPurpose);
                            q.IssuingOrg = !string.IsNullOrWhiteSpace(q.IssuingOrg)
                                ? q.IssuingOrg
                                : (!string.IsNullOrWhiteSpace(sheet.DetectedIssuingOrg) ? sheet.DetectedIssuingOrg : excelResult.DetectedIssuingOrg);
                            q.BenchmarkYear = q.BenchmarkYear ?? sheet.DetectedBenchmarkYear ?? excelResult.DetectedBenchmarkYear;
                            q.BenchmarkStandard = !string.IsNullOrWhiteSpace(q.BenchmarkStandard)
                                ? q.BenchmarkStandard
                                : (!string.IsNullOrWhiteSpace(sheet.DetectedBenchmarkStandard) ? sheet.DetectedBenchmarkStandard : excelResult.DetectedBenchmarkStandard);
                            
                            if (q.Tags == null || q.Tags.Count == 0)
                            {
                                q.Tags = (sheet.DetectedTags != null && sheet.DetectedTags.Count > 0)
                                    ? sheet.DetectedTags
                                    : (excelResult.DetectedTags ?? new List<string>());
                            }

                            allEnrichedQuestions.Add(q);
                        }
                    }

                    parsedQuestions = allEnrichedQuestions.Count > 0 ? allEnrichedQuestions : (excelResult.Questions ?? new List<DocxImportPreviewDto>());
                }
                else if (ext is ".pdf")
                {
                    parsedQuestions = _pdfParser.ParsePdfQuestions(stream);
                }
                else if (ext is ".docx" or ".doc")
                {
                    parsedQuestions = _docxParser.ParseDocxFile(stream, null);
                }
                else
                {
                    return BadRequest(new { success = false, message = "Định dạng tệp không được hỗ trợ. Vui lòng tải lên file Word (.docx), Excel (.xlsx, .xls) hoặc PDF (.pdf)." });
                }

                if (parsedQuestions == null || parsedQuestions.Count == 0)
                    return BadRequest(new { success = false, message = "Không trích xuất được câu hỏi từ tệp." });

                // Dùng Deduplication Engine để phân tích trùng lặp CAS đa tầng
                var dedupReport = await _dedupEngine.AnalyzeAndTagDuplicatesAsync(parsedQuestions, Guid.Empty);

                var previewItems = parsedQuestions.Select((q, idx) => new ZenQuestionPreviewDto
                {
                    Order = idx + 1,
                    Content = q.Content ?? "",
                    CanonicalHash = q.CanonicalContentHash ?? _dedupEngine.ComputeCanonicalContentHash(q.Content ?? "", q.Options),
                    IsDuplicate = q.IsDuplicate,
                    QuestionType = q.QuestionType,
                    Options = q.Options?.ToList() ?? new(),
                    CorrectAnswer = q.SuggestedAnswer,
                    Explanation = q.AiExplanation,
                    ContextId = q.ContextId,
                    ContextTitle = q.ContextTitle,
                    ContextContent = q.ContextContent,
                    SourceQuestionNo = q.SourceQuestionNo,
                    HierarchyIndex = q.HierarchyIndex,
                    FullQuestionIndex = q.FullQuestionIndex,
                    SubItems = q.SubItems,
                    Difficulty = q.Difficulty > 0 ? q.Difficulty : 2,
                    DurationSeconds = q.DurationSeconds > 0 ? q.DurationSeconds : 60,
                    GradingRubric = q.GradingRubric,
                    MediaUrl = q.MediaUrl,
                    Tags = q.Tags?.ToList() ?? new(),
                    TopicCode = q.TopicCode,
                    TopicName = q.TopicName,
                    DomainCode = q.DomainCode
                }).ToList();

                var sampleContent = string.Join("\n", previewItems.Take(3).Select(x => x.Content));
                var taxonomy = _taxonomyDispatcher.SniffTaxonomy(sampleContent);

                return Ok(new ZenUploadResponseDto
                {
                    Success = true,
                    ExamTitle = Path.GetFileNameWithoutExtension(file.FileName),
                    TotalQuestions = parsedQuestions.Count,
                    DuplicateCount = dedupReport.DuplicateCount,
                    UniqueCount = dedupReport.UniqueCount,
                    DeduplicationRatePercentage = dedupReport.DeduplicationRatePercentage,
                    SuggestedTaxonomy = taxonomy,
                    Questions = previewItems
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi bóc tách Zen Studio upload");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("launch")]
        public IActionResult LaunchRoom([FromBody] LaunchZenRoomRequest request)
        {
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var now = DateTimeOffset.UtcNow;
            var history = _launchRateLimitTracker.GetOrAdd(clientIp, _ => new System.Collections.Generic.List<DateTimeOffset>());
            lock (history)
            {
                history.RemoveAll(t => now - t > TimeSpan.FromMinutes(1));
                if (history.Count >= 10)
                {
                    return StatusCode(StatusCodes.Status429TooManyRequests, new
                    {
                        success = false,
                        message = "Bạn đang tạo phòng quá nhanh. Vui lòng đợi 30 giây để bảo vệ an toàn máy chủ!"
                    });
                }
                history.Add(now);
            }
            var pin = Random.Shared.Next(100000, 999999).ToString();
            var roomId = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();

            var teacherId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "host-teacher";
            var teacherName = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("name")?.Value ?? "Thầy / Cô Giáo";

            var customQuestions = request.Questions?.Select(q => new ArenaQuestionItem
            {
                Content = !string.IsNullOrWhiteSpace(q.ContextContent) && !q.Content.Contains(q.ContextContent)
                    ? $"[Ngữ cảnh: {q.ContextTitle ?? "Bài đọc / Tình huống"}]\n{q.ContextContent}\n\n{q.Content}"
                    : q.Content,
                Options = q.Options ?? new List<string>(),
                AnswerRaw = q.CorrectAnswer ?? (q.Options != null && q.Options.Count > 0 ? q.Options[0] : ""),
                Explanation = q.Explanation ?? "",
                Points = 10,
                TimeLimitSeconds = Math.Max(10, (request.DurationMinutes * 60) / Math.Max(1, request.Questions.Count)),
                Category = request.SubjectCode ?? "TỔNG HỢP"
            }).ToList() ?? new List<ArenaQuestionItem>();

            var gameCode = !string.IsNullOrWhiteSpace(request.GameCode)
                ? request.GameCode.Trim().ToUpperInvariant()
                : "GOLDEN_BELL";

            var room = _roomManager.CreateRoomWithCustomQuestions(
                gameCode,
                request.Title,
                teacherId,
                teacherName,
                pin,
                customQuestions,
                roomId);

            return Ok(new
            {
                success = true,
                pinCode = pin,
                roomId = roomId,
                gameCode = room.GameCode,
                title = request.Title,
                questionCount = customQuestions.Count,
                joinUrl = $"/arena/join?pin={pin}",
                directArenaUrl = $"/arena/{room.GameCode}/{roomId}",
                qrCodeData = $"aegisquiz://arena/{pin}",
                launchedAt = DateTime.UtcNow
            });
        }

        [HttpGet("arena-modes")]
        public IActionResult GetAvailableArenaModes()
        {
            var modes = new[]
            {
                new
                {
                    gameCode = "GOLDEN_BELL",
                    displayName = "Rung Chuông Vàng (Battle Royale)",
                    description = "Đấu trường 30 đến 10,000 học sinh cùng lúc trên một sàn đấu số Canvas. Sai 1 câu là rời sàn! Có minigame Cứu Trợ của Thầy Cô để hồi sinh cả lớp.",
                    icon = "Bell",
                    badge = "Khuyên dùng cho cả lớp",
                    minPlayers = 1,
                    maxPlayers = 10000,
                    recommendedTarget = "Toàn bộ học sinh trong lớp (30-100 em)",
                    themeColor = "#f59e0b"
                },
                new
                {
                    gameCode = "LIGHTNING",
                    displayName = "Nhanh Như Chớp (Lightning Incline)",
                    description = "Cỗ máy leo dốc 10 bậc đứng! Đúng leo 1 bậc, sai tụt ngay về vạch số 0. Rèn luyện tốc độ và bản lĩnh phản xạ dưới áp lực 2 phút.",
                    icon = "Zap",
                    badge = "Kiểm tra 15 phút",
                    minPlayers = 1,
                    maxPlayers = 8,
                    recommendedTarget = "Kiểm tra tổ nhóm, thi đấu tay đôi",
                    themeColor = "#06b6d4"
                },
                new
                {
                    gameCode = "OLYMPIA",
                    displayName = "Olympia Supreme (Đường Lên Đỉnh Tri Thức)",
                    description = "Format 4 vòng thi truyền hình huyền thoại: Khởi Động 60s, Vượt Chướng Ngại Vật ma trận hình ảnh, Tăng Tốc, Về Đích & Ngôi Sao Hy Vọng.",
                    icon = "Trophy",
                    badge = "Chung kết 4 Đội/Thí sinh",
                    minPlayers = 1,
                    maxPlayers = 4,
                    recommendedTarget = "4 thí sinh hoặc 4 đội tuyển xuất sắc nhất",
                    themeColor = "#6366f1"
                },
                new
                {
                    gameCode = "TRIEU_PHU_AI",
                    displayName = "Ai Là Triệu Phú (Millionaire)",
                    description = "15 câu hỏi leo thang với 3 mốc an toàn. 4 quyền trợ giúp độc bản: 50:50, Hỏi Gia Sư AI Socrates, Hỏi ý kiến cả lớp qua QR, Đổi câu hỏi.",
                    icon = "Crown",
                    badge = "Kiểm tra miệng 1-1",
                    minPlayers = 1,
                    maxPlayers = 1,
                    recommendedTarget = "1 học sinh lên bảng, cả lớp làm khán giả",
                    themeColor = "#3b82f6"
                },
                new
                {
                    gameCode = "UNIVERSITY_CHALLENGE",
                    displayName = "Đấu Trường Đại Học (Team vs Team)",
                    description = "Đối kháng học thuật 4 vs 4 (Team A vs Team B). Bấm chuông Starter giành quyền và chuỗi câu hỏi Bonus thảo luận kín.",
                    icon = "GraduationCap",
                    badge = "Đối kháng 2 Tổ/Đội",
                    minPlayers = 2,
                    maxPlayers = 8,
                    recommendedTarget = "Hai đội tuyển thi đấu đối kháng trực diện",
                    themeColor = "#ec4899"
                }
            };
            return Ok(new { success = true, modes });
        }

        private static string FormatCreatorCode(string rawCode)
        {
            if (string.IsNullOrWhiteSpace(rawCode)) return "CRTGUEST";
            var stripped = rawCode.Replace("TEACH-", "", StringComparison.OrdinalIgnoreCase)
                                  .Replace("TEACH_", "", StringComparison.OrdinalIgnoreCase)
                                  .Replace("TEACH", "", StringComparison.OrdinalIgnoreCase)
                                  .Replace("CRT-", "", StringComparison.OrdinalIgnoreCase)
                                  .Replace("CRT_", "", StringComparison.OrdinalIgnoreCase)
                                  .Replace("CRT", "", StringComparison.OrdinalIgnoreCase)
                                  .Replace("-", "")
                                  .Replace("_", "")
                                  .Trim()
                                  .ToUpperInvariant();
            return string.IsNullOrWhiteSpace(stripped) ? "CRTGUEST" : "CRT" + stripped;
        }

        [HttpPost("save-to-bank")]
        public async Task<IActionResult> SaveToBank([FromBody] SaveZenToBankRequest request)
        {
            if (request == null || request.Questions == null || request.Questions.Count == 0)
                return BadRequest(new { success = false, message = "Danh sách câu hỏi trống." });

            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
                var userId = Guid.TryParse(userIdStr, out var parsedUser) ? parsedUser : Guid.Empty;
                var tenantId = _tenant?.CurrentTenantId ?? Guid.Empty;
                if (tenantId == Guid.Empty)
                {
                    var tenantIdStr = User.FindFirst("tenant_id")?.Value;
                    if (Guid.TryParse(tenantIdStr, out var parsedTenant))
                        tenantId = parsedTenant;
                }

                // Phân giải mã Người tạo (Creator Referral Code, vd: TEACH-EC4DD2 -> CRTEC4DD2)
                string rawCreatorCode = "CRTGUEST";
                if (userId != Guid.Empty)
                {
                    var partner = await _db.EducatorPartnerships.FirstOrDefaultAsync(p => p.UserId == userId);
                    if (partner != null && !string.IsNullOrWhiteSpace(partner.ReferralCode))
                    {
                        rawCreatorCode = partner.ReferralCode;
                    }
                    else
                    {
                        var refCode = "CRT" + Guid.NewGuid().ToString("N")[..6].ToUpper();
                        rawCreatorCode = refCode;
                        if (partner == null)
                        {
                            partner = new EducatorPartnership
                            {
                                Id = Guid.NewGuid(),
                                UserId = userId,
                                ReferralCode = refCode,
                                TrialExpiresAt = DateTime.UtcNow.AddDays(90),
                                IsActive = true,
                                RevenueShareRate = 0.80m,
                                KarmaPoints = 100
                            };
                            _db.EducatorPartnerships.Add(partner);
                        }
                        else
                        {
                            partner.ReferralCode = refCode;
                        }
                    }
                }

                var crtCode = FormatCreatorCode(rawCreatorCode);

                // Cấp 4: TP + 8 ký tự Hex (Ví dụ: TP9967D005) hoặc mã tùy chỉnh từ Giáo viên
                var hexCode = Guid.NewGuid().ToString("N")[..8].ToUpper();
                var topicCode = !string.IsNullOrWhiteSpace(request.CustomTopicCode)
                    ? request.CustomTopicCode.Trim().ToUpperInvariant().Replace(" ", "_")
                    : ("TP" + hexCode);

                if (await _db.BankTopics.AnyAsync(t => t.Code == topicCode))
                {
                    topicCode = $"{topicCode}_{hexCode[..4]}";
                }

                var now = DateTime.UtcNow;
                var ymd = now.ToString("yyyyMMdd");

                BankTopic parentFolder;
                string materializedPath;
                int depthLevel;

                if (request.ParentTopicId.HasValue && request.ParentTopicId.Value != Guid.Empty)
                {
                    var chosenParent = await _db.BankTopics.FirstOrDefaultAsync(t => t.Id == request.ParentTopicId.Value);
                    if (chosenParent != null)
                    {
                        parentFolder = chosenParent;
                        var parentPath = string.IsNullOrWhiteSpace(chosenParent.MaterializedPath)
                            ? $"/{chosenParent.Code}"
                            : chosenParent.MaterializedPath.TrimEnd('/');
                        materializedPath = $"{parentPath}/{topicCode}/";
                        depthLevel = Math.Max(1, chosenParent.DepthLevel) + 1;
                    }
                    else
                    {
                        parentFolder = await EnsureStudioHierarchyAsync(tenantId, userId, crtCode, now);
                        materializedPath = $"/STUDIO/{ymd}/{crtCode}/{topicCode}/";
                        depthLevel = 4;
                    }
                }
                else
                {
                    // Bảo đảm cây phả hệ 3 cấp cha: STUDIO -> YMD -> Creator tồn tại
                    parentFolder = await EnsureStudioHierarchyAsync(tenantId, userId, crtCode, now);
                    materializedPath = $"/STUDIO/{ymd}/{crtCode}/{topicCode}/";
                    depthLevel = 4;
                }

                var topic = new BankTopic
                {
                    Id = Guid.NewGuid(),
                    Code = topicCode,
                    Name = string.IsNullOrWhiteSpace(request.Title) ? $"Đề Thi Studio {DateTime.Now:dd/MM/yyyy HH:mm}" : request.Title,
                    Description = $"Đề thi tạo từ Creator Studio bởi {crtCode}",
                    CategoryCode = request.SubjectCode ?? parentFolder.CategoryCode ?? "GENERAL",
                    DomainCode = request.DomainCode ?? parentFolder.DomainCode ?? "EDUCATION",
                    Scope = tenantId != Guid.Empty ? "TENANT" : "COMMUNITY",
                    MaterializedPath = materializedPath,
                    DepthLevel = depthLevel,
                    ParentId = parentFolder.Id,
                    VisibilityScope = TopicVisibility.Public,
                    Enabled = true,
                    TenantId = tenantId,
                    CreatedByUserId = userId != Guid.Empty ? userId : null,
                    CreatedAt = now
                };

                Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? transaction = null;
                if (_db.Database.IsRelational())
                    transaction = await _db.Database.BeginTransactionAsync();

                _db.BankTopics.Add(topic);
                await _db.SaveChangesAsync();

                // [Universal Shared Context] Khử trùng lặp và lưu trữ bài đọc hiểu/ngữ cảnh dùng chung
                var contextMap = new System.Collections.Generic.Dictionary<string, QuestionContext>(StringComparer.Ordinal);
                foreach (var item in request.Questions)
                {
                    if (!string.IsNullOrWhiteSpace(item.ContextContent))
                    {
                        string trimmed = item.ContextContent.Trim();
                        string hash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(trimmed)));
                        if (!contextMap.ContainsKey(hash))
                        {
                            var existingCtx = await _db.QuestionContexts.FirstOrDefaultAsync(c => c.ContentHash == hash);
                            if (existingCtx == null)
                            {
                                existingCtx = new QuestionContext
                                {
                                    Id = Guid.NewGuid(),
                                    Title = string.IsNullOrWhiteSpace(item.ContextTitle) ? "Bài đọc hiểu dùng chung" : item.ContextTitle.Trim(),
                                    Content = trimmed,
                                    ContentType = "text",
                                    ContentHash = hash,
                                    CreatedAt = DateTime.UtcNow
                                };
                                _db.QuestionContexts.Add(existingCtx);
                            }
                            contextMap[hash] = existingCtx;
                        }
                    }
                }
                if (contextMap.Count > 0)
                {
                    await _db.SaveChangesAsync();
                }

                // [Polymorphic Question Factory & SSoT Alignment]
                // Đồng bộ 100% cơ chế bóc tách & lưu trữ câu hỏi đa hình giống như Admin Questions
                var questionsToInsert = new System.Collections.Generic.List<QuestionBase>();
                foreach (var q in request.Questions)
                {
                    var type = QuestionFactory.NormalizeType(q.QuestionType);

                    // Tự động nhận diện MULTI_TRUE_FALSE (GDPT 2025):
                    if (type == "TRUE_FALSE" && q.Options?.Count >= 3)
                    {
                        type = "MULTI_TRUE_FALSE";
                    }
                    else if (!string.IsNullOrWhiteSpace(q.CorrectAnswer) &&
                             Regex.IsMatch(q.CorrectAnswer, @"[a-d][\)\:\.\s]+(đúng|sai|true|false)", RegexOptions.IgnoreCase))
                    {
                        type = "MULTI_TRUE_FALSE";
                    }

                    QuestionBase entity = type switch
                    {
                        "MULTI"            => new MultiChoiceQuestion(),
                        "TRUE_FALSE"       => new TrueFalseQuestion(),
                        "MULTI_TRUE_FALSE" => new MultiTrueFalseQuestion(),
                        "SHORT_ANSWER"     => new ShortAnswerQuestion(),
                        "FILL_BLANK"       => new FillBlankQuestion(),
                        "ORDERING"         => new OrderingQuestion(),
                        "MATCHING"         => new MatchingQuestion(),
                        "ESSAY"            => new EssayQuestion(),
                        _                  => new SingleChoiceQuestion()
                    };

                    entity.Id = Guid.NewGuid();
                    entity.Content = q.Content;
                    entity.Difficulty = q.Difficulty > 0 ? q.Difficulty : 2;
                    entity.DurationSeconds = q.DurationSeconds > 0 ? q.DurationSeconds : 60;
                    entity.CategoryCode = topic.Code;
                    entity.ContentType = !string.IsNullOrWhiteSpace(q.MediaUrl) ? "image" : "text";
                    entity.OptionType = "text";
                    entity.IsPublic = true;
                    entity.TenantId = tenantId;
                    entity.CreatedBy = userId != Guid.Empty ? userId.ToString() : null;
                    entity.DomainCode = !string.IsNullOrWhiteSpace(q.DomainCode)
                        ? q.DomainCode
                        : (!string.IsNullOrWhiteSpace(request.DomainCode) ? request.DomainCode : (topic.DomainCode ?? "EDUCATION"));
                    entity.Tags = q.Tags ?? new System.Collections.Generic.List<string>();
                    entity.CreatedAt = DateTime.UtcNow;

                    // Gắn liên kết Ngữ cảnh dùng chung
                    if (!string.IsNullOrWhiteSpace(q.ContextContent))
                    {
                        string trimmed = q.ContextContent.Trim();
                        string hash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(trimmed)));
                        if (contextMap.TryGetValue(hash, out var ctxEntity))
                        {
                            entity.ContextId = ctxEntity.Id;
                            entity.Context = ctxEntity;
                        }
                    }

                    if (entity is MultiChoiceQuestion mq)
                    {
                        mq.Options = q.Options ?? new System.Collections.Generic.List<string>();
                        mq.CorrectOption = !string.IsNullOrWhiteSpace(q.CorrectAnswer) ? q.CorrectAnswer.Trim() : "";
                        var optPayload = mq.Options.Select((o, i) => new { id = (i + 1).ToString(), text = o }).ToArray();
                        var correctAnswersArray = (q.CorrectAnswer ?? "")
                            .Split(new[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries)
                            .Select(s => s.Trim())
                            .ToArray();
                        mq.Payload = JsonSerializer.SerializeToDocument(new
                        {
                            enabled = true,
                            options = optPayload,
                            correctAnswers = correctAnswersArray,
                            correctAnswer = mq.CorrectOption,
                            explanation = q.Explanation,
                            contextId = entity.ContextId,
                            contextTitle = q.ContextTitle,
                            contextContent = q.ContextContent,
                            sourceQuestionNo = q.SourceQuestionNo,
                            hierarchyIndex = q.HierarchyIndex,
                            fullQuestionIndex = q.FullQuestionIndex,
                            subItems = q.SubItems,
                            canonicalContentHash = q.CanonicalHash,
                            durationSeconds = entity.DurationSeconds,
                            domainCode = entity.DomainCode,
                            tags = entity.Tags
                        });
                    }
                    else if (entity is TrueFalseQuestion tq)
                    {
                        tq.Options = q.Options != null && q.Options.Count >= 2 ? q.Options : new System.Collections.Generic.List<string> { "Đúng", "Sai" };
                        tq.CorrectOption = (q.CorrectAnswer == "2" || q.CorrectAnswer?.ToLowerInvariant() == "sai") ? "Sai" : "Đúng";
                        var optPayload = tq.Options.Select((o, i) => new { id = (i + 1).ToString(), text = o }).ToArray();
                        tq.Payload = JsonSerializer.SerializeToDocument(new
                        {
                            enabled = true,
                            options = optPayload,
                            correctAnswer = tq.CorrectOption == "Sai" ? "2" : "1",
                            explanation = q.Explanation,
                            contextId = entity.ContextId,
                            contextTitle = q.ContextTitle,
                            contextContent = q.ContextContent,
                            sourceQuestionNo = q.SourceQuestionNo,
                            hierarchyIndex = q.HierarchyIndex,
                            fullQuestionIndex = q.FullQuestionIndex,
                            subItems = q.SubItems,
                            canonicalContentHash = q.CanonicalHash,
                            durationSeconds = entity.DurationSeconds,
                            domainCode = entity.DomainCode,
                            tags = entity.Tags
                        });
                    }
                    else if (entity is MultiTrueFalseQuestion mtq)
                    {
                        mtq.Options = q.Options ?? new System.Collections.Generic.List<string>();
                        mtq.CorrectOption = !string.IsNullOrWhiteSpace(q.CorrectAnswer) ? q.CorrectAnswer.Trim() : "";
                        var expectedMap = MultiTrueFalseQuestion.ExtractExpectedMap(null, mtq.CorrectOption, mtq.Options);
                        var subItemsPayload = mtq.Options.Select((o, i) =>
                        {
                            string id = ((char)('a' + i)).ToString();
                            bool isCorrect = expectedMap.TryGetValue(id, out var val) && val;
                            return new { id, text = o, expected = isCorrect };
                        }).ToArray();
                        var optPayload = mtq.Options.Select((o, i) => new { id = ((char)('a' + i)).ToString(), text = o }).ToArray();
                        mtq.Payload = JsonSerializer.SerializeToDocument(new
                        {
                            enabled = true,
                            options = optPayload,
                            subItems = subItemsPayload,
                            correctMap = expectedMap,
                            correctAnswer = mtq.CorrectOption,
                            scoringScheme = "TNPT_2025",
                            explanation = q.Explanation,
                            contextId = entity.ContextId,
                            contextTitle = q.ContextTitle,
                            contextContent = q.ContextContent,
                            sourceQuestionNo = q.SourceQuestionNo,
                            hierarchyIndex = q.HierarchyIndex,
                            fullQuestionIndex = q.FullQuestionIndex,
                            canonicalContentHash = q.CanonicalHash,
                            durationSeconds = entity.DurationSeconds,
                            domainCode = entity.DomainCode,
                            tags = entity.Tags
                        });
                    }
                    else if (entity is ShortAnswerQuestion saq)
                    {
                        saq.CorrectOption = q.CorrectAnswer ?? "";
                        saq.Payload = JsonSerializer.SerializeToDocument(new
                        {
                            enabled = true,
                            correctAnswer = q.CorrectAnswer,
                            explanation = q.Explanation,
                            contextId = entity.ContextId,
                            contextTitle = q.ContextTitle,
                            contextContent = q.ContextContent,
                            sourceQuestionNo = q.SourceQuestionNo,
                            hierarchyIndex = q.HierarchyIndex,
                            fullQuestionIndex = q.FullQuestionIndex,
                            subItems = q.SubItems,
                            canonicalContentHash = q.CanonicalHash,
                            durationSeconds = entity.DurationSeconds,
                            domainCode = entity.DomainCode,
                            tags = entity.Tags
                        });
                    }
                    else if (entity is EssayQuestion eq)
                    {
                        eq.GradingRubric = q.GradingRubric ?? q.CorrectAnswer ?? "";
                        eq.Payload = JsonSerializer.SerializeToDocument(new
                        {
                            enabled = true,
                            rubric = eq.GradingRubric,
                            explanation = q.Explanation,
                            contextId = entity.ContextId,
                            contextTitle = q.ContextTitle,
                            contextContent = q.ContextContent,
                            sourceQuestionNo = q.SourceQuestionNo,
                            hierarchyIndex = q.HierarchyIndex,
                            fullQuestionIndex = q.FullQuestionIndex,
                            canonicalContentHash = q.CanonicalHash,
                            durationSeconds = entity.DurationSeconds,
                            domainCode = entity.DomainCode,
                            tags = entity.Tags
                        });
                    }
                    else
                    {
                        // SINGLE, ORDERING, MATCHING, FILL_BLANK
                        entity.Options = q.Options ?? new System.Collections.Generic.List<string>();
                        entity.CorrectOption = !string.IsNullOrWhiteSpace(q.CorrectAnswer) ? q.CorrectAnswer.Trim() : (entity.Options.Count > 0 ? "1" : "");
                        var optPayload = entity.Options.Select((o, i) => new { id = (i + 1).ToString(), text = o }).ToArray();
                        entity.Payload = JsonSerializer.SerializeToDocument(new
                        {
                            enabled = true,
                            options = optPayload,
                            correctAnswer = q.CorrectAnswer,
                            explanation = q.Explanation,
                            contextId = entity.ContextId,
                            contextTitle = q.ContextTitle,
                            contextContent = q.ContextContent,
                            sourceQuestionNo = q.SourceQuestionNo,
                            hierarchyIndex = q.HierarchyIndex,
                            fullQuestionIndex = q.FullQuestionIndex,
                            subItems = q.SubItems,
                            canonicalContentHash = q.CanonicalHash,
                            durationSeconds = entity.DurationSeconds,
                            domainCode = entity.DomainCode,
                            tags = entity.Tags
                        });
                    }

                    questionsToInsert.Add(entity);
                }

                _db.Questions.AddRange(questionsToInsert);
                topic.QuestionCountCached = questionsToInsert.Count;
                await _db.SaveChangesAsync();

                if (transaction != null)
                {
                    await transaction.CommitAsync();
                }

                return Ok(new
                {
                    success = true,
                    topicId = topic.Id,
                    topicCode = topic.Code,
                    materializedPath = topic.MaterializedPath,
                    creatorCode = crtCode,
                    questionCount = questionsToInsert.Count,
                    practiceUrl = $"/practice?topic={topic.Code}",
                    message = $"Đã lưu thành công {questionsToInsert.Count} câu hỏi vào Ngân hàng Tri thức theo phả hệ {topic.MaterializedPath}!"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lưu đề thi vào ngân hàng câu hỏi");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private async Task<BankTopic> EnsureStudioHierarchyAsync(Guid tenantId, Guid userId, string crtCode, DateTime date)
        {
            var ymd = date.ToString("yyyyMMdd");
            var ymdFormatted = date.ToString("yyyy-MM-dd");

            // 1. Root: STUDIO
            var root = await _db.BankTopics.FirstOrDefaultAsync(t => t.Code == "STUDIO" && (tenantId == Guid.Empty || t.TenantId == tenantId || t.TenantId == Guid.Empty));
            if (root == null)
            {
                root = new BankTopic
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
                    VisibilityScope = TopicVisibility.Public,
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
                dateFolder = new BankTopic
                {
                    Id = Guid.NewGuid(),
                    Code = dateCode,
                    Name = $"Studio {ymdFormatted}",
                    Description = $"Thư mục đề thi ngày {date:dd/MM/yyyy}",
                    CategoryCode = "STUDIO",
                    DomainCode = "EDUCATION",
                    Scope = tenantId != Guid.Empty ? "TENANT" : "COMMUNITY",
                    MaterializedPath = $"/STUDIO/{ymd}/",
                    DepthLevel = 2,
                    ParentId = root.Id,
                    VisibilityScope = TopicVisibility.Public,
                    Enabled = true,
                    TenantId = tenantId
                };
                _db.BankTopics.Add(dateFolder);
                await _db.SaveChangesAsync();
            }

            // 3. Creator Folder: STUDIO_{ymd}_{crtCode} (Ví dụ: STUDIO_20261102_CRT7571EC)
            var creatorFolderCode = $"STUDIO_{ymd}_{crtCode}";
            var creatorFolder = await _db.BankTopics.FirstOrDefaultAsync(t => t.Code == creatorFolderCode && (tenantId == Guid.Empty || t.TenantId == tenantId || t.TenantId == Guid.Empty));
            if (creatorFolder == null)
            {
                creatorFolder = new BankTopic
                {
                    Id = Guid.NewGuid(),
                    Code = creatorFolderCode,
                    Name = $"Creator [{crtCode}]",
                    Description = $"Không gian đề thi giáo viên {crtCode} ngày {date:dd/MM/yyyy}",
                    CategoryCode = "STUDIO",
                    DomainCode = "EDUCATION",
                    Scope = tenantId != Guid.Empty ? "TENANT" : "COMMUNITY",
                    MaterializedPath = $"/STUDIO/{ymd}/{crtCode}/",
                    DepthLevel = 3,
                    ParentId = dateFolder.Id,
                    VisibilityScope = TopicVisibility.Public,
                    Enabled = true,
                    TenantId = tenantId,
                    CreatedByUserId = userId != Guid.Empty ? userId : null
                };
                _db.BankTopics.Add(creatorFolder);
                await _db.SaveChangesAsync();
            }

            return creatorFolder;
        }

        [HttpGet("marketing-policy")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMarketingPolicy()
        {
            var policy = await _db.CreatorMarketingPolicies
                .Where(p => p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync() ?? new CreatorMarketingPolicy();

            // SSoT: Kế thừa 100% tài khoản thụ hưởng từ Cấu hình Payment Quản trị tập trung
            var payCfg = _paymentOrchestrator != null ? await _paymentOrchestrator.GetSettingsAsync() : null;
            var bankBin = !string.IsNullOrWhiteSpace(payCfg?.VietQrBankBin) ? payCfg.VietQrBankBin : "970405";
            var accountNumber = !string.IsNullOrWhiteSpace(payCfg?.VietQrAccountNumber) ? payCfg.VietQrAccountNumber : "8888912600688";
            var accountName = !string.IsNullOrWhiteSpace(payCfg?.VietQrAccountName) ? payCfg.VietQrAccountName : "NGUYEN VIET CUONG";

            return Ok(new CreatorMarketingPolicyDto
            {
                CampaignCode = policy.CampaignCode,
                CampaignName = policy.CampaignName,
                Description = policy.Description,
                TrialDays = policy.TrialDays,
                RevenueShareRate = policy.RevenueShareRate,
                KarmaBonusPoints = policy.KarmaBonusPoints,
                CoffeeProDays = policy.CoffeeProDays,
                CoffeePriceVnd = policy.CoffeePriceVnd,
                CoffeeBankBin = bankBin,
                CoffeeAccountNumber = accountNumber,
                CoffeeAccountName = accountName
            });
        }

        [HttpGet("partnership")]
        public async Task<IActionResult> GetPartnership()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userId = Guid.TryParse(userIdStr, out var parsed) ? parsed : Guid.Empty;

            if (userId == Guid.Empty)
            {
                return Unauthorized(new { success = false, message = "Yêu cầu đăng nhập để truy cập thông tin Creator Zen Studio." });
            }

            var policy = await _db.CreatorMarketingPolicies
                .Where(p => p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync() ?? new CreatorMarketingPolicy();

            var partner = await _db.EducatorPartnerships.FirstOrDefaultAsync(p => p.UserId == userId);
            if (partner == null)
            {
                partner = new EducatorPartnership
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    ReferralCode = "CRT" + Guid.NewGuid().ToString("N")[..6].ToUpper(),
                    TrialExpiresAt = DateTime.UtcNow.AddDays(policy.TrialDays),
                    IsActive = true,
                    RevenueShareRate = policy.RevenueShareRate,
                    KarmaPoints = policy.KarmaBonusPoints
                };
                _db.EducatorPartnerships.Add(partner);
                await _db.SaveChangesAsync();
            }
            else if (!string.IsNullOrWhiteSpace(partner.ReferralCode))
            {
                var formatted = FormatCreatorCode(partner.ReferralCode);
                if (formatted != partner.ReferralCode)
                {
                    partner.ReferralCode = formatted;
                    await _db.SaveChangesAsync();
                }
            }

            // SSoT: Kế thừa 100% tài khoản thụ hưởng từ Cấu hình Payment Quản trị tập trung
            var payCfg = _paymentOrchestrator != null ? await _paymentOrchestrator.GetSettingsAsync() : null;
            var bankBin = !string.IsNullOrWhiteSpace(payCfg?.VietQrBankBin) ? payCfg.VietQrBankBin : "970405";
            var accountNumber = !string.IsNullOrWhiteSpace(payCfg?.VietQrAccountNumber) ? payCfg.VietQrAccountNumber : "8888912600688";
            var accountName = !string.IsNullOrWhiteSpace(payCfg?.VietQrAccountName) ? payCfg.VietQrAccountName : "NGUYEN VIET CUONG";

            var daysRemaining = Math.Max(0, (int)(partner.TrialExpiresAt - DateTime.UtcNow).TotalDays);
            return Ok(new CreatorPartnershipDto
            {
                Id = partner.Id,
                UserId = partner.UserId,
                ReferralCode = partner.ReferralCode,
                TrialExpiresAt = partner.TrialExpiresAt,
                DaysRemaining = daysRemaining,
                IsActive = partner.IsActive,
                RevenueShareRate = partner.RevenueShareRate,
                KarmaPoints = partner.KarmaPoints,
                PayoutBankAccount = partner.PayoutBankAccount,
                CampaignCode = policy.CampaignCode,
                CampaignName = policy.CampaignName,
                TrialDays = policy.TrialDays,
                CoffeeProDays = policy.CoffeeProDays,
                CoffeePriceVnd = policy.CoffeePriceVnd,
                CoffeeBankBin = bankBin,
                CoffeeAccountNumber = accountNumber,
                CoffeeAccountName = accountName
            });
        }

        /// <summary>
        /// [Admin] Lấy danh sách toàn bộ chiến dịch Marketing của Creator Studio
        /// </summary>
        [HttpGet("admin/policies")]
        public async Task<IActionResult> GetAdminMarketingPolicies()
        {
            var policies = await _db.CreatorMarketingPolicies
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var payCfg = _paymentOrchestrator != null ? await _paymentOrchestrator.GetSettingsAsync() : null;
            var bankBin = !string.IsNullOrWhiteSpace(payCfg?.VietQrBankBin) ? payCfg.VietQrBankBin : "970405";
            var accountNumber = !string.IsNullOrWhiteSpace(payCfg?.VietQrAccountNumber) ? payCfg.VietQrAccountNumber : "8888912600688";
            var accountName = !string.IsNullOrWhiteSpace(payCfg?.VietQrAccountName) ? payCfg.VietQrAccountName : "NGUYEN VIET CUONG";

            var dtos = policies.Select(p => new CreatorMarketingPolicyDto
            {
                CampaignCode = p.CampaignCode,
                CampaignName = p.CampaignName,
                Description = p.Description,
                TrialDays = p.TrialDays,
                RevenueShareRate = p.RevenueShareRate,
                KarmaBonusPoints = p.KarmaBonusPoints,
                CoffeeProDays = p.CoffeeProDays,
                CoffeePriceVnd = p.CoffeePriceVnd,
                CoffeeBankBin = bankBin,
                CoffeeAccountNumber = accountNumber,
                CoffeeAccountName = accountName
            }).ToList();

            return Ok(dtos);
        }

        /// <summary>
        /// [Admin] Cập nhật hoặc kích hoạt Chiến dịch Marketing cho Creator Studio
        /// </summary>
        [HttpPost("admin/policies")]
        public async Task<IActionResult> UpsertAdminMarketingPolicy([FromBody] UpsertCreatorMarketingPolicyRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.CampaignCode))
            {
                return BadRequest(new { message = "Mã chiến dịch (CampaignCode) không được để trống." });
            }

            var policy = await _db.CreatorMarketingPolicies.FirstOrDefaultAsync(p => p.CampaignCode == request.CampaignCode);
            if (policy == null)
            {
                policy = new CreatorMarketingPolicy
                {
                    Id = Guid.NewGuid(),
                    CampaignCode = request.CampaignCode.Trim().ToUpper(),
                    CreatedAt = DateTime.UtcNow
                };
                _db.CreatorMarketingPolicies.Add(policy);
            }

            policy.CampaignName = request.CampaignName;
            policy.Description = request.Description;
            policy.TrialDays = Math.Max(1, request.TrialDays);
            policy.RevenueShareRate = Math.Clamp(request.RevenueShareRate, 0.05m, 0.95m);
            policy.KarmaBonusPoints = Math.Max(0, request.KarmaBonusPoints);
            policy.CoffeeProDays = request.CoffeeProDays > 0 ? request.CoffeeProDays : 7; // Biến động linh hoạt theo chiến dịch tiếp thị (mặc định 7 ngày)
            policy.CoffeePriceVnd = Math.Max(1000m, request.CoffeePriceVnd);
            policy.UpdatedAt = DateTime.UtcNow;

            if (request.IsActive)
            {
                var activeOthers = await _db.CreatorMarketingPolicies.Where(p => p.Id != policy.Id && p.IsActive).ToListAsync();
                foreach (var other in activeOthers)
                {
                    other.IsActive = false;
                }
                policy.IsActive = true;
            }
            else
            {
                policy.IsActive = false;
            }

            await _db.SaveChangesAsync();

            _logger.LogInformation("[MARKETING_CAMPAIGN] Updated campaign {Code} (Active: {Active})", policy.CampaignCode, policy.IsActive);

            return Ok(new { success = true, message = "Cập nhật chính sách chiến dịch thành công!", data = policy });
        }

        // ── POST api/creator/studio/submit-homework ──────────────────────────────────────────
        /// <summary>
        /// [Dual-Branch Telemetry] Học sinh nộp bài tập về nhà theo link giáo viên:
        /// 1. Luôn lưu vào HomeworkSubmissions của Thầy/Cô sở hữu topic.
        /// 2. NẾU học sinh có tài khoản (UserId != null), đồng thời lưu vào QuestionAttempts cá nhân.
        /// </summary>
        [HttpPost("submit-homework")]
        public async Task<IActionResult> SubmitHomework([FromBody] HomeworkSubmissionDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.TopicCode))
                return BadRequest(new { success = false, message = "TopicCode không hợp lệ." });

            var topic = await _db.BankTopics.FirstOrDefaultAsync(t => t.Code == dto.TopicCode);
            var teacherId = topic?.CreatedByUserId;
            var tenantId = topic?.TenantId;

            // Xác định nhóm phân hóa
            string groupCategory = dto.Score >= 85 ? "OLYMPIAN" : dto.Score >= 60 ? "CORE" : "REMEDIAL";
            bool isGuest = !dto.UserId.HasValue || dto.UserId.Value == Guid.Empty;

            var submission = new HomeworkSubmission
            {
                Id = Guid.NewGuid(),
                TopicCode = dto.TopicCode,
                StudentName = string.IsNullOrWhiteSpace(dto.StudentName) ? "Học sinh ẩn danh" : dto.StudentName.Trim(),
                StudentClass = dto.StudentClass?.Trim(),
                UserId = isGuest ? null : dto.UserId,
                IsGuest = isGuest,
                Score = dto.Score,
                CorrectCount = dto.CorrectCount,
                TotalQuestions = dto.TotalQuestions,
                TimeSpentSeconds = dto.TimeSpentSeconds,
                TabSwitchCount = dto.TabSwitchCount,
                WrongQuestionIndexes = dto.WrongQuestionIndexes ?? new List<int>(),
                GroupCategory = groupCategory,
                SubmittedAt = DateTime.UtcNow,
                TeacherUserId = teacherId,
                TenantId = tenantId
            };

            _db.HomeworkSubmissions.Add(submission);

            // [Nhánh 2] Chỉ ghi vào QuestionAttempts của học sinh nếu đã đăng nhập
            if (!isGuest && dto.Details != null && dto.Details.Count > 0)
            {
                foreach (var d in dto.Details)
                {
                    if (d.QuestionId != Guid.Empty)
                    {
                        var qa = new QuestionAttempt
                        {
                            Id = Guid.NewGuid(),
                            UserId = dto.UserId!.Value,
                            QuestionId = d.QuestionId,
                            Category = d.Category ?? topic?.CategoryCode ?? "GENERAL",
                            Difficulty = 2,
                            SelectedAnswer = d.SelectedAnswer ?? "",
                            IsCorrect = d.IsCorrect,
                            TimeSpentSeconds = d.TimeSpentSeconds,
                            AttemptDate = DateTime.UtcNow
                        };
                        _db.QuestionAttempts.Add(qa);
                    }
                }
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                submissionId = submission.Id,
                isRegisteredUser = !isGuest,
                studentName = submission.StudentName,
                score = submission.Score,
                groupCategory = submission.GroupCategory,
                message = isGuest
                    ? $"Bài làm của em {submission.StudentName} đã được gửi thành công đến Thầy/Cô!"
                    : $"Bài làm của bạn đã được gửi đến Thầy/Cô và lưu trữ an toàn trong Hồ sơ Năng lực cá nhân!"
            });
        }

        // ── GET api/creator/studio/cohort-summary ──────────────────────────────────────────
        /// <summary>
        /// [Live Cohort Diagnostic] Trả về báo cáo nhận thức lớp học cho Giáo viên:
        /// Tỷ lệ nộp, Điểm TB, Heatmap % sai từng câu, Danh sách 3 nhóm phân hóa.
        /// </summary>
        [HttpGet("cohort-summary")]
        public async Task<IActionResult> GetCohortSummary([FromQuery] string topicCode)
        {
            if (string.IsNullOrWhiteSpace(topicCode))
                return BadRequest(new { success = false, message = "TopicCode không hợp lệ." });

            var topic = await _db.BankTopics.FirstOrDefaultAsync(t => t.Code == topicCode);
            var submissions = await _db.HomeworkSubmissions
                .Where(s => s.TopicCode == topicCode)
                .OrderByDescending(s => s.SubmittedAt)
                .ToListAsync();

            int totalSubmitted = submissions.Count;
            if (totalSubmitted == 0)
            {
                // Fallback dữ liệu mẫu sư phạm nếu chưa có học sinh nào nộp
                return Ok(new CohortSummaryDto
                {
                    TopicCode = topicCode,
                    ExamTitle = topic?.Name ?? "Bài tập lớp học",
                    TotalSubmitted = 0,
                    AverageScore = 0,
                    AverageTimeSeconds = 0,
                    MostFailedQuestionIndex = 0,
                    MostFailedRate = 0,
                    QuestionFailureRates = new Dictionary<int, decimal>(),
                    Submissions = new List<CohortStudentItemDto>()
                });
            }

            decimal avgScore = Math.Round(submissions.Average(s => s.Score), 1);
            int avgTime = (int)submissions.Average(s => s.TimeSpentSeconds);

            // Thống kê tỷ lệ sai từng câu
            var failureCounts = new Dictionary<int, int>();
            foreach (var sub in submissions)
            {
                if (sub.WrongQuestionIndexes != null)
                {
                    foreach (var idx in sub.WrongQuestionIndexes)
                    {
                        failureCounts[idx] = failureCounts.GetValueOrDefault(idx, 0) + 1;
                    }
                }
            }

            var failRates = new Dictionary<int, decimal>();
            int mostFailedIdx = 0;
            decimal mostFailedRate = 0;
            foreach (var kvp in failureCounts)
            {
                decimal rate = Math.Round((decimal)kvp.Value * 100 / totalSubmitted, 1);
                failRates[kvp.Key] = rate;
                if (rate > mostFailedRate)
                {
                    mostFailedRate = rate;
                    mostFailedIdx = kvp.Key;
                }
            }

            var studentItems = submissions.Select(s => new CohortStudentItemDto
            {
                Id = s.Id.ToString(),
                Name = s.StudentName ?? "Học sinh ẩn danh",
                ClassName = s.StudentClass,
                Score = s.Score,
                TimeSpent = $"{s.TimeSpentSeconds / 60:D2}:{s.TimeSpentSeconds % 60:D2}",
                SubmittedAt = s.SubmittedAt.ToString("HH:mm dd/MM/yyyy"),
                WrongQuestionIndexes = s.WrongQuestionIndexes ?? new List<int>(),
                Group = s.GroupCategory,
                IsGuest = s.IsGuest
            }).ToList();

            return Ok(new CohortSummaryDto
            {
                TopicCode = topicCode,
                ExamTitle = topic?.Name ?? "Bài tập lớp học",
                TotalSubmitted = totalSubmitted,
                AverageScore = avgScore,
                AverageTimeSeconds = avgTime,
                MostFailedQuestionIndex = mostFailedIdx,
                MostFailedRate = mostFailedRate,
                QuestionFailureRates = failRates,
                Submissions = studentItems
            });
        }

        /// <summary>
        /// [Aegis Sovereign Outbound] Xuất bản 1 mã đề thi ra file Word (.docx) chuẩn thể thức Bộ GD&ĐT nộp trường.
        /// </summary>
        [HttpPost("export/docx")]
        public IActionResult ExportExamDocx([FromBody] ExamExportOptionsDto request)
        {
            if (request == null || request.Questions == null || request.Questions.Count == 0)
            {
                return BadRequest(new { success = false, message = "Danh sách câu hỏi không được để trống." });
            }

            try
            {
                string code = !string.IsNullOrWhiteSpace(request.ExamCodePrefix) ? request.ExamCodePrefix + "1" : "101";
                byte[] bytes = _examTranspiler.ExportSingleExamToDocx(request.Questions, request, code);
                string fileName = $"DeThi_{request.SubjectName.Replace(" ", "_")}_MaDe_{code}.docx";
                return File(bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xuất bản file Word đề thi");
                return StatusCode(500, new { success = false, message = "Lỗi tạo file Word: " + ex.Message });
            }
        }

        /// <summary>
        /// [Aegis Sovereign Outbound] Trộn đề thi thành N mã đề và đóng gói trọn bộ hồ sơ khảo thí nộp trường dạng file ZIP.
        /// </summary>
        [HttpPost("export/package-zip")]
        public IActionResult ExportMultiVariantPackageZip([FromBody] ExamExportOptionsDto request)
        {
            if (request == null || request.Questions == null || request.Questions.Count == 0)
            {
                return BadRequest(new { success = false, message = "Danh sách câu hỏi không được để trống." });
            }

            try
            {
                var result = _examTranspiler.GenerateMultiVariantPackageZip(request.Questions, request);
                if (result.ZipPackageBytes == null || result.ZipPackageBytes.Length == 0)
                {
                    return StatusCode(500, new { success = false, message = "Không tạo được gói tài liệu khảo thí." });
                }

                return File(result.ZipPackageBytes, "application/zip", result.ZipPackageFileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi tạo gói hồ sơ khảo thí ZIP");
                return StatusCode(500, new { success = false, message = "Lỗi tạo gói ZIP: " + ex.Message });
            }
        }

        /// <summary>
        /// [Aegis Sovereign Outbound] Xuất phiếu trả lời trắc nghiệm quang học OMR định dạng HTML Vector A4 sẵn sàng in.
        /// </summary>
        [HttpPost("export/omr-sheet")]
        public IActionResult ExportOmrSheet([FromBody] ExamExportOptionsDto request)
        {
            int total = request?.Questions?.Count ?? 40;
            if (total <= 0) total = 40;

            string html = _examTranspiler.GenerateOmrAnswerSheetHtml(total, request ?? new ExamExportOptionsDto());
            return Content(html, "text/html; charset=utf-8");
        }
    }
}
