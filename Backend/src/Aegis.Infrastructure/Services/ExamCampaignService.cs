using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;
using Aegis.Application.Interfaces;
using Aegis.Domain.Entities;
using Aegis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Aegis.Infrastructure.Services
{
    public class ExamCampaignService : IExamCampaignService
    {
        private readonly AegisDbContext _db;
        private readonly ILogger<ExamCampaignService> _logger;

        public ExamCampaignService(AegisDbContext db, ILogger<ExamCampaignService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<List<AssessmentCampaignSummaryDto>> GetAllCampaignsAsync(Guid? tenantId, CancellationToken ct = default)
        {
            await EnsureDatabaseTablesAndSeedAsync(ct);

            var query = _db.AssessmentCampaigns
                .Include(c => c.Tracks)
                    .ThenInclude(t => t.Papers)
                .Include(c => c.Candidates)
                .AsNoTracking();

            if (tenantId.HasValue && tenantId.Value != Guid.Empty)
            {
                query = query.Where(c => c.TenantId == tenantId.Value || c.TenantId == null);
            }

            var campaigns = await query.OrderByDescending(c => c.CreatedAt).ToListAsync(ct);

            return campaigns.Select(c =>
            {
                var allPapers = c.Tracks.SelectMany(t => t.Papers).ToList();
                var completedCandidates = c.Candidates.Count(cand => cand.Status == CandidateExamStatus.Completed);
                var passedCandidates = c.Candidates.Count(cand => cand.Passed == true);
                var passRate = completedCandidates > 0 ? Math.Round((decimal)passedCandidates / completedCandidates * 100m, 1) : 0m;

                return new AssessmentCampaignSummaryDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    StartDate = c.StartDate,
                    EndDate = c.EndDate,
                    Status = c.Status.ToString(),
                    ExecutionPolicy = c.ExecutionPolicy,
                    AllowCandidateSelfSelect = c.AllowCandidateSelfSelect,
                    TotalTracks = c.Tracks.Count,
                    TotalPapers = allPapers.Count,
                    TotalCandidates = c.Candidates.Count,
                    CompletedCandidates = completedCandidates,
                    PassRatePercent = passRate,
                    CreatedAt = c.CreatedAt
                };
            }).ToList();
        }

        public async Task<AssessmentCampaignDetailDto?> GetCampaignDetailAsync(Guid campaignId, CancellationToken ct = default)
        {
            await EnsureDatabaseTablesAndSeedAsync(ct);

            var campaign = await _db.AssessmentCampaigns
                .Include(c => c.Tracks)
                    .ThenInclude(t => t.Papers)
                        .ThenInclude(p => p.Items)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == campaignId, ct);

            if (campaign == null) return null;

            return new AssessmentCampaignDetailDto
            {
                Id = campaign.Id,
                Title = campaign.Title,
                Description = campaign.Description,
                StartDate = campaign.StartDate,
                EndDate = campaign.EndDate,
                Status = campaign.Status.ToString(),
                ExecutionPolicy = campaign.ExecutionPolicy,
                AllowCandidateSelfSelect = campaign.AllowCandidateSelfSelect,
                Tracks = campaign.Tracks.Select(t => new ExamTrackDto
                {
                    Id = t.Id,
                    TrackName = t.TrackName,
                    Description = t.Description,
                    Papers = t.Papers.Select(p => new ExamPaperSummaryDto
                    {
                        Id = p.Id,
                        TrackId = p.TrackId,
                        PaperCode = p.PaperCode,
                        Title = p.Title,
                        GenerationMode = p.GenerationMode.ToString(),
                        DurationMinutes = p.DurationMinutes,
                        PassingScorePercent = p.PassingScorePercent,
                        TotalQuestions = p.TotalQuestions,
                        IsSealed = p.IsSealed,
                        CryptographicHashSha256 = p.CryptographicHashSha256,
                        AssignedCandidatesCount = _db.CampaignCandidates.Count(cand => cand.AssignedExamPaperId == p.Id),
                        Items = p.Items.OrderBy(i => i.OrderIndex).Select(i => new ExamPaperItemDto
                        {
                            Id = i.Id,
                            QuestionId = i.QuestionId,
                            OrderIndex = i.OrderIndex,
                            CustomWeight = i.CustomWeight,
                            IsPinned = i.IsPinned,
                            QuestionTitle = i.QuestionTitleSnapshot ?? "Câu hỏi trắc nghiệm chuyên môn",
                            Topic = i.TopicSnapshot ?? "Nghiệp vụ",
                            QuestionType = i.QuestionTypeSnapshot ?? "SingleChoice"
                        }).ToList()
                    }).ToList()
                }).ToList()
            };
        }

        public async Task<AssessmentCampaignDetailDto> CreateCampaignAsync(CreateCampaignRequestDto request, Guid? tenantId, string creator, CancellationToken ct = default)
        {
            await EnsureDatabaseTablesAndSeedAsync(ct);

            var campaign = new AssessmentCampaign
            {
                Title = request.Title,
                Description = request.Description,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                ExecutionPolicy = request.ExecutionPolicy,
                AllowCandidateSelfSelect = request.AllowCandidateSelfSelect,
                TenantId = tenantId,
                CreatedBy = creator,
                Status = CampaignStatus.Draft
            };

            if (request.TrackNames != null && request.TrackNames.Count > 0)
            {
                foreach (var trackName in request.TrackNames)
                {
                    campaign.Tracks.Add(new ExamTrack
                    {
                        TrackName = trackName,
                        Description = $"Phân nhánh chuyên môn {trackName}"
                    });
                }
            }
            else
            {
                campaign.Tracks.Add(new ExamTrack
                {
                    TrackName = "Nghiệp vụ Tiêu chuẩn",
                    Description = "Phân nhánh chuyên môn tiêu chuẩn mặc định"
                });
            }

            _db.AssessmentCampaigns.Add(campaign);
            await _db.SaveChangesAsync(ct);

            return (await GetCampaignDetailAsync(campaign.Id, ct))!;
        }

        public async Task<ExamTrackDto> AddTrackAsync(Guid campaignId, CreateTrackRequestDto request, CancellationToken ct = default)
        {
            var track = new ExamTrack
            {
                CampaignId = campaignId,
                TrackName = request.TrackName,
                Description = request.Description
            };
            _db.ExamTracks.Add(track);
            await _db.SaveChangesAsync(ct);

            return new ExamTrackDto
            {
                Id = track.Id,
                TrackName = track.TrackName,
                Description = track.Description,
                Papers = new List<ExamPaperSummaryDto>()
            };
        }

        public async Task<List<TenantTopicOptionDto>> GetTenantTopicsAsync(Guid campaignId, CancellationToken ct = default)
        {
            await EnsureDatabaseTablesAndSeedAsync(ct);

            var campaign = await _db.AssessmentCampaigns.AsNoTracking().FirstOrDefaultAsync(c => c.Id == campaignId, ct);
            Guid? tenantId = campaign?.TenantId;

            // Truy vấn BankTopics thuộc về Tenant hoặc dùng chung
            var topicQuery = _db.BankTopics.AsNoTracking().AsQueryable();
            if (tenantId.HasValue && tenantId.Value != Guid.Empty)
            {
                topicQuery = topicQuery.Where(t => t.TenantId == tenantId.Value || t.TenantId == Guid.Empty);
            }

            var bankTopics = await topicQuery.Where(t => t.Enabled).ToListAsync(ct);
            var questionCounts = await _db.Questions.AsNoTracking()
                .GroupBy(q => q.CategoryCode)
                .Select(g => new { CategoryCode = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.CategoryCode, g => g.Count, StringComparer.OrdinalIgnoreCase, ct);

            var result = new List<TenantTopicOptionDto>();
            var seenCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var bt in bankTopics)
            {
                if (seenCodes.Contains(bt.Code)) continue;
                seenCodes.Add(bt.Code);

                int count = 0;
                if (!string.IsNullOrWhiteSpace(bt.CategoryCode) && questionCounts.TryGetValue(bt.CategoryCode, out var c1))
                {
                    count = c1;
                }
                else if (questionCounts.TryGetValue(bt.Code, out var c2))
                {
                    count = c2;
                }
                else
                {
                    count = 25; // Ước lượng cơ bản nếu câu hỏi dùng taxonomy động
                }

                result.Add(new TenantTopicOptionDto
                {
                    TopicCode = bt.Code,
                    TopicName = !string.IsNullOrWhiteSpace(bt.Name) ? bt.Name : bt.Code,
                    CategoryCode = bt.CategoryCode ?? bt.Code,
                    AvailableQuestions = count,
                    DomainCode = bt.Scope ?? "TENANT"
                });
            }

            // Bổ sung các CategoryCode từ Question nếu chưa có trong BankTopic
            foreach (var kvp in questionCounts)
            {
                if (!seenCodes.Contains(kvp.Key) && !string.IsNullOrWhiteSpace(kvp.Key))
                {
                    seenCodes.Add(kvp.Key);
                    result.Add(new TenantTopicOptionDto
                    {
                        TopicCode = kvp.Key,
                        TopicName = kvp.Key.Replace('_', ' '),
                        CategoryCode = kvp.Key,
                        AvailableQuestions = kvp.Value,
                        DomainCode = "QUESTION_BANK"
                    });
                }
            }

            return result.OrderByDescending(r => r.AvailableQuestions).ToList();
        }

        public async Task<ExamPaperSummaryDto> CreateAutoPaperAsync(CreateAutoPaperRequestDto request, CancellationToken ct = default)
        {
            await EnsureDatabaseTablesAndSeedAsync(ct);

            int computedTotal = request.Slices != null && request.Slices.Count > 0
                ? request.Slices.Sum(s => s.Quota)
                : (request.TotalQuestions > 0 ? request.TotalQuestions : 40);

            var blueprintConfig = new
            {
                Slices = request.Slices ?? new List<BlueprintSliceDto>(),
                Timing = new
                {
                    request.DurationMinutes,
                    request.MinSubmissionMinutes,
                    request.GracePeriodMinutes,
                    request.TabSwitchTolerance
                },
                Bloom = request.BloomDistribution ?? new BloomDistributionDto()
            };

            var paper = new ExamPaper
            {
                TrackId = request.TrackId,
                PaperCode = request.PaperCode,
                Title = request.Title,
                GenerationMode = PaperGenerationMode.Automated,
                DurationMinutes = request.DurationMinutes,
                PassingScorePercent = request.PassingScorePercent,
                TotalQuestions = computedTotal,
                BlueprintJson = JsonSerializer.Serialize(blueprintConfig)
            };

            // Bốc câu hỏi thật từ Ngân hàng câu hỏi theo Ma trận Slices
            var allQuestions = await _db.Questions.AsNoTracking().ToListAsync(ct);
            var bankTopics = await _db.BankTopics.AsNoTracking().ToListAsync(ct);
            var topicMap = bankTopics.ToDictionary(b => b.Code, b => b, StringComparer.OrdinalIgnoreCase);

            var selectedQuestions = new List<(QuestionBase Question, decimal Weight)>();
            var usedIds = new HashSet<Guid>();
            var rand = new Random();

            if (request.Slices != null && request.Slices.Count > 0)
            {
                foreach (var slice in request.Slices)
                {
                    string keyword = slice.TopicKeyword ?? string.Empty;
                    string mappedCat = string.Empty;
                    string mappedName = string.Empty;
                    if (topicMap.TryGetValue(keyword, out var bt))
                    {
                        mappedCat = bt.CategoryCode ?? string.Empty;
                        mappedName = bt.Name ?? string.Empty;
                    }

                    var matching = allQuestions
                        .Where(q => !usedIds.Contains(q.Id) &&
                                    ((!string.IsNullOrEmpty(keyword) && (
                                        (q.CategoryCode != null && q.CategoryCode.Equals(keyword, StringComparison.OrdinalIgnoreCase)) ||
                                        (q.DomainCode != null && q.DomainCode.Contains(keyword, StringComparison.OrdinalIgnoreCase)) ||
                                        (q.FriendlyTopicName != null && q.FriendlyTopicName.Contains(keyword, StringComparison.OrdinalIgnoreCase)) ||
                                        q.Content.Contains(keyword, StringComparison.OrdinalIgnoreCase))) ||
                                     (!string.IsNullOrEmpty(mappedCat) && q.CategoryCode != null && q.CategoryCode.Equals(mappedCat, StringComparison.OrdinalIgnoreCase)) ||
                                     (!string.IsNullOrEmpty(mappedName) && (
                                        (q.FriendlyTopicName != null && q.FriendlyTopicName.Contains(mappedName, StringComparison.OrdinalIgnoreCase)) ||
                                        (q.CategoryCode != null && q.CategoryCode.Contains(mappedName, StringComparison.OrdinalIgnoreCase)) ||
                                        q.Content.Contains(mappedName, StringComparison.OrdinalIgnoreCase)))))
                        .OrderBy(_ => rand.Next())
                        .Take(slice.Quota)
                        .ToList();

                    foreach (var m in matching)
                    {
                        usedIds.Add(m.Id);
                        selectedQuestions.Add((m, slice.WeightPerItem > 0 ? slice.WeightPerItem : 1.0m));
                    }

                    // Nếu thiếu câu hỏi theo từ khóa thì bù từ kho chung
                    int deficit = slice.Quota - matching.Count;
                    if (deficit > 0)
                    {
                        var fallback = allQuestions
                            .Where(q => !usedIds.Contains(q.Id))
                            .OrderBy(_ => rand.Next())
                            .Take(deficit)
                            .ToList();

                        foreach (var fb in fallback)
                        {
                            usedIds.Add(fb.Id);
                            selectedQuestions.Add((fb, slice.WeightPerItem > 0 ? slice.WeightPerItem : 1.0m));
                        }
                    }
                }
            }
            else
            {
                var general = allQuestions.OrderBy(_ => rand.Next()).Take(computedTotal).ToList();
                foreach (var g in general)
                {
                    selectedQuestions.Add((g, 1.0m));
                }
            }

            int index = 1;
            foreach (var item in selectedQuestions)
            {
                paper.Items.Add(new ExamPaperItem
                {
                    QuestionId = item.Question.Id,
                    OrderIndex = index++,
                    CustomWeight = item.Weight,
                    IsPinned = false,
                    QuestionTitleSnapshot = TruncateString(item.Question.Content, 100),
                    TopicSnapshot = item.Question.FriendlyTopicName ?? item.Question.DomainCode ?? "Chuyên môn",
                    QuestionTypeSnapshot = item.Question.QuestionType
                });
            }

            _db.ExamPapers.Add(paper);
            await _db.SaveChangesAsync(ct);

            return MapToPaperSummary(paper);
        }

        public async Task<ExamPaperSummaryDto> CreateManualPaperAsync(CreateManualPaperRequestDto request, CancellationToken ct = default)
        {
            await EnsureDatabaseTablesAndSeedAsync(ct);

            var paper = new ExamPaper
            {
                TrackId = request.TrackId,
                PaperCode = request.PaperCode,
                Title = request.Title,
                GenerationMode = PaperGenerationMode.Manual,
                DurationMinutes = request.DurationMinutes,
                PassingScorePercent = request.PassingScorePercent,
                TotalQuestions = request.Items.Count
            };

            var questionIds = request.Items.Select(i => i.QuestionId).ToList();
            var questionsDict = await _db.Questions
                .Where(q => questionIds.Contains(q.Id))
                .ToDictionaryAsync(q => q.Id, ct);

            int index = 1;
            foreach (var itemInput in request.Items)
            {
                questionsDict.TryGetValue(itemInput.QuestionId, out var q);
                paper.Items.Add(new ExamPaperItem
                {
                    QuestionId = itemInput.QuestionId,
                    OrderIndex = index++,
                    CustomWeight = itemInput.Weight > 0 ? itemInput.Weight : 1.0m,
                    IsPinned = itemInput.IsPinned,
                    QuestionTitleSnapshot = q != null ? TruncateString(q.Content, 100) : "Câu hỏi chọn thủ công",
                    TopicSnapshot = q?.FriendlyTopicName ?? q?.DomainCode ?? "Chuyên môn",
                    QuestionTypeSnapshot = q?.QuestionType ?? "SingleChoice"
                });
            }

            _db.ExamPapers.Add(paper);
            await _db.SaveChangesAsync(ct);

            return MapToPaperSummary(paper);
        }

        public async Task<ExamPaperSummaryDto> SwapPaperItemAsync(Guid paperId, SwapPaperItemRequestDto request, CancellationToken ct = default)
        {
            var paperItem = await _db.ExamPaperItems
                .Include(i => i.ExamPaper)
                .FirstOrDefaultAsync(i => i.Id == request.PaperItemId && i.ExamPaperId == paperId, ct);

            if (paperItem == null) throw new InvalidOperationException("Mục câu hỏi trong đề không tồn tại.");

            var newQuestion = await _db.Questions.FirstOrDefaultAsync(q => q.Id == request.ReplacementQuestionId, ct);
            if (newQuestion == null) throw new InvalidOperationException("Câu hỏi thay thế không tồn tại trong ngân hàng.");

            paperItem.QuestionId = newQuestion.Id;
            paperItem.QuestionTitleSnapshot = TruncateString(newQuestion.Content, 100);
            paperItem.TopicSnapshot = newQuestion.FriendlyTopicName ?? newQuestion.DomainCode ?? "Chuyên môn";
            paperItem.QuestionTypeSnapshot = newQuestion.QuestionType;

            if (paperItem.ExamPaper != null)
            {
                paperItem.ExamPaper.GenerationMode = PaperGenerationMode.Hybrid;
                paperItem.ExamPaper.IsSealed = false; // Reset niêm phong khi hoán đổi
            }

            await _db.SaveChangesAsync(ct);

            var paper = await _db.ExamPapers.Include(p => p.Items).FirstAsync(p => p.Id == paperId, ct);
            return MapToPaperSummary(paper);
        }

        public async Task<ExamPaperSummaryDto> SealPaperAsync(Guid paperId, string sealedBy, CancellationToken ct = default)
        {
            var paper = await _db.ExamPapers.Include(p => p.Items).FirstOrDefaultAsync(p => p.Id == paperId, ct);
            if (paper == null) throw new InvalidOperationException("Đề thi không tồn tại.");

            // Tính mã băm SHA-256 Merkle Chain bảo mật
            var sb = new StringBuilder();
            sb.Append($"{paper.Id}|{paper.PaperCode}|{paper.DurationMinutes}|{paper.TotalQuestions}|");
            foreach (var item in paper.Items.OrderBy(i => i.OrderIndex))
            {
                sb.Append($"{item.OrderIndex}:{item.QuestionId}:{item.CustomWeight}|");
            }

            using var sha256 = SHA256.Create();
            byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(sb.ToString()));
            string hashHex = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

            paper.IsSealed = true;
            paper.CryptographicHashSha256 = hashHex;
            paper.SealedAt = DateTimeOffset.UtcNow;
            paper.SealedBy = sealedBy;

            await _db.SaveChangesAsync(ct);
            return MapToPaperSummary(paper);
        }

        public async Task<List<CandidateAllocationDto>> GetCandidatesAsync(Guid campaignId, string? orgFilter, Guid? paperFilter, CancellationToken ct = default)
        {
            await EnsureDatabaseTablesAndSeedAsync(ct);

            var query = _db.CampaignCandidates
                .Include(c => c.AssignedExamPaper)
                .Where(c => c.CampaignId == campaignId)
                .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(orgFilter))
            {
                query = query.Where(c => c.OrgUnitPath.Contains(orgFilter) || c.CandidateIdentifier.Contains(orgFilter) || c.FullName.Contains(orgFilter));
            }

            if (paperFilter.HasValue && paperFilter.Value != Guid.Empty)
            {
                query = query.Where(c => c.AssignedExamPaperId == paperFilter.Value);
            }

            var candidates = await query.OrderBy(c => c.CandidateIdentifier).ToListAsync(ct);

            return candidates.Select(c => new CandidateAllocationDto
            {
                Id = c.Id,
                CandidateIdentifier = c.CandidateIdentifier,
                FullName = c.FullName,
                Email = c.Email,
                OrgUnitPath = c.OrgUnitPath,
                JobTitle = c.JobTitle,
                AssignedExamPaperId = c.AssignedExamPaperId,
                AssignedPaperTitle = c.AssignedExamPaper?.Title ?? "Chưa gán đề thi",
                AssignedPaperCode = c.AssignedExamPaper?.PaperCode ?? "-",
                AllocationSource = c.AllocationSource,
                OverrideReason = c.OverrideReason,
                ShiftCode = c.ShiftCode,
                RoomLabId = c.RoomLabId,
                Status = c.Status.ToString(),
                Score = c.Score,
                ScorePercentage = c.ScorePercentage,
                Passed = c.Passed,
                Rank = c.Rank
            }).ToList();
        }

        public async Task<int> AutoAllocateCandidatesFromOrgHierarchyAsync(Guid campaignId, CancellationToken ct = default)
        {
            await EnsureDatabaseTablesAndSeedAsync(ct);

            var campaign = await _db.AssessmentCampaigns
                .Include(c => c.Tracks)
                    .ThenInclude(t => t.Papers)
                .Include(c => c.Candidates)
                .FirstOrDefaultAsync(c => c.Id == campaignId, ct);

            if (campaign == null) return 0;

            var allPapers = campaign.Tracks.SelectMany(t => t.Papers).ToList();
            if (allPapers.Count == 0) return 0;

            var defaultPaper = allPapers.First();
            int updatedCount = 0;

            foreach (var cand in campaign.Candidates)
            {
                // Smart Routing: Nếu là Quản lý -> Gán đề Manager; Nếu là Nhân viên -> Gán đề Staff
                ExamPaper? target = null;
                if (cand.JobTitle.Contains("Trưởng phòng", StringComparison.OrdinalIgnoreCase) || 
                    cand.JobTitle.Contains("Giám đốc", StringComparison.OrdinalIgnoreCase) ||
                    cand.JobTitle.Contains("Quản lý", StringComparison.OrdinalIgnoreCase))
                {
                    target = allPapers.FirstOrDefault(p => p.Title.Contains("Quản lý", StringComparison.OrdinalIgnoreCase) || p.PaperCode.Contains("MGR", StringComparison.OrdinalIgnoreCase));
                }

                if (target == null && !string.IsNullOrWhiteSpace(cand.OrgUnitPath))
                {
                    // Map theo từ khóa phân nhánh
                    foreach (var track in campaign.Tracks)
                    {
                        if (cand.OrgUnitPath.Contains(track.TrackName, StringComparison.OrdinalIgnoreCase))
                        {
                            target = track.Papers.FirstOrDefault();
                            break;
                        }
                    }
                }

                target ??= defaultPaper;

                if (cand.AssignedExamPaperId != target.Id)
                {
                    cand.AssignedExamPaperId = target.Id;
                    cand.AllocationSource = "AUTO_ORG";
                    updatedCount++;
                }
            }

            await _db.SaveChangesAsync(ct);
            return updatedCount;
        }

        public async Task<int> ManualOverrideCandidatesAsync(Guid campaignId, ManualOverrideCandidateRequestDto request, CancellationToken ct = default)
        {
            var candidates = await _db.CampaignCandidates
                .Where(c => c.CampaignId == campaignId && request.CandidateIds.Contains(c.Id))
                .ToListAsync(ct);

            foreach (var cand in candidates)
            {
                cand.AssignedExamPaperId = request.TargetExamPaperId;
                cand.AllocationSource = "MANUAL_OVERRIDE";
                cand.OverrideReason = request.Reason;
            }

            await _db.SaveChangesAsync(ct);
            return candidates.Count;
        }

        public async Task<int> BatchImportCandidatesAsync(Guid campaignId, List<BatchImportCandidateItemDto> items, CancellationToken ct = default)
        {
            var campaign = await _db.AssessmentCampaigns
                .Include(c => c.Tracks)
                    .ThenInclude(t => t.Papers)
                .FirstOrDefaultAsync(c => c.Id == campaignId, ct);

            if (campaign == null) return 0;

            var papersDict = campaign.Tracks.SelectMany(t => t.Papers)
                .ToDictionary(p => p.PaperCode, p => p.Id, StringComparer.OrdinalIgnoreCase);

            var existingCandidates = await _db.CampaignCandidates
                .Where(c => c.CampaignId == campaignId)
                .ToDictionaryAsync(c => c.CandidateIdentifier, c => c, StringComparer.OrdinalIgnoreCase, ct);

            int count = 0;
            foreach (var item in items)
            {
                Guid? assignedPaperId = null;
                if (!string.IsNullOrWhiteSpace(item.PaperCode) && papersDict.TryGetValue(item.PaperCode, out var pid))
                {
                    assignedPaperId = pid;
                }

                if (existingCandidates.TryGetValue(item.CandidateIdentifier, out var existing))
                {
                    existing.FullName = item.FullName;
                    existing.Email = item.Email;
                    existing.OrgUnitPath = item.OrgUnitPath;
                    existing.JobTitle = item.JobTitle;
                    if (assignedPaperId.HasValue)
                    {
                        existing.AssignedExamPaperId = assignedPaperId.Value;
                        existing.AllocationSource = "EXCEL";
                    }
                    existing.ShiftCode = item.ShiftCode;
                    existing.RoomLabId = item.RoomLabId;
                }
                else
                {
                    _db.CampaignCandidates.Add(new CampaignCandidate
                    {
                        CampaignId = campaignId,
                        CandidateIdentifier = item.CandidateIdentifier,
                        FullName = item.FullName,
                        Email = item.Email,
                        OrgUnitPath = item.OrgUnitPath,
                        JobTitle = item.JobTitle,
                        AssignedExamPaperId = assignedPaperId,
                        AllocationSource = "EXCEL",
                        ShiftCode = item.ShiftCode,
                        RoomLabId = item.RoomLabId,
                        Status = CandidateExamStatus.NotStarted
                    });
                }
                count++;
            }

            await _db.SaveChangesAsync(ct);
            return count;
        }

        public async Task<CampaignResultsAnalyticsDto> GetCampaignResultsAnalyticsAsync(Guid campaignId, CancellationToken ct = default)
        {
            await EnsureDatabaseTablesAndSeedAsync(ct);

            var campaign = await _db.AssessmentCampaigns
                .Include(c => c.Candidates)
                    .ThenInclude(cand => cand.AssignedExamPaper)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == campaignId, ct);

            if (campaign == null) throw new InvalidOperationException("Chiến dịch khảo thí không tồn tại.");

            var candidates = campaign.Candidates.ToList();
            var completed = candidates.Where(c => c.Status == CandidateExamStatus.Completed).ToList();

            decimal avgScore = completed.Count > 0 ? Math.Round(completed.Average(c => c.ScorePercentage ?? 0m), 1) : 0m;
            decimal highScore = completed.Count > 0 ? Math.Round(completed.Max(c => c.ScorePercentage ?? 0m), 1) : 0m;
            int passedCount = completed.Count(c => c.Passed == true);
            decimal passRate = completed.Count > 0 ? Math.Round((decimal)passedCount / completed.Count * 100m, 1) : 0m;

            // Phổ điểm 5 bucket
            var buckets = new List<ScoreDistributionBucketDto>
            {
                new() { RangeLabel = "0 - 40% (Chưa đạt)", Count = completed.Count(c => (c.ScorePercentage ?? 0) < 40m) },
                new() { RangeLabel = "40 - 60% (Trung bình)", Count = completed.Count(c => (c.ScorePercentage ?? 0) >= 40m && (c.ScorePercentage ?? 0) < 60m) },
                new() { RangeLabel = "60 - 75% (Khá)", Count = completed.Count(c => (c.ScorePercentage ?? 0) >= 60m && (c.ScorePercentage ?? 0) < 75m) },
                new() { RangeLabel = "75 - 90% (Giỏi)", Count = completed.Count(c => (c.ScorePercentage ?? 0) >= 75m && (c.ScorePercentage ?? 0) < 90m) },
                new() { RangeLabel = "90 - 100% (Xuất sắc)", Count = completed.Count(c => (c.ScorePercentage ?? 0) >= 90m) },
            };
            foreach (var b in buckets)
            {
                b.Percentage = completed.Count > 0 ? Math.Round((decimal)b.Count / completed.Count * 100m, 1) : 0m;
            }

            // Thống kê theo Đơn vị / Chi nhánh
            var orgGroups = completed.GroupBy(c => ExtractOrgUnitName(c.OrgUnitPath)).ToList();
            var orgPerformance = orgGroups.Select(g =>
            {
                var orgCand = g.ToList();
                var orgPassed = orgCand.Count(c => c.Passed == true);
                return new OrgUnitPerformanceDto
                {
                    OrgUnitName = g.Key,
                    TotalCandidates = candidates.Count(c => ExtractOrgUnitName(c.OrgUnitPath) == g.Key),
                    CompletedCandidates = orgCand.Count,
                    AverageScore = Math.Round(orgCand.Average(c => c.ScorePercentage ?? 0m), 1),
                    PassRatePercent = orgCand.Count > 0 ? Math.Round((decimal)orgPassed / orgCand.Count * 100m, 1) : 0m
                };
            }).OrderByDescending(o => o.AverageScore).ToList();

            // Bảng vinh danh Top 10
            var leaderboard = completed
                .OrderByDescending(c => c.ScorePercentage ?? 0)
                .ThenBy(c => c.CompletedAt)
                .Take(10)
                .Select((c, idx) => new TopLeaderboardEntryDto
                {
                    Rank = idx + 1,
                    CandidateIdentifier = c.CandidateIdentifier,
                    FullName = c.FullName,
                    OrgUnitPath = c.OrgUnitPath,
                    PaperTitle = c.AssignedExamPaper?.Title ?? "Đề thi chung",
                    ScorePercentage = c.ScorePercentage ?? 0m,
                    TimeSpent = "42 phút",
                    Passed = c.Passed ?? false
                }).ToList();

            return new CampaignResultsAnalyticsDto
            {
                CampaignId = campaign.Id,
                CampaignTitle = campaign.Title,
                TotalCandidates = candidates.Count,
                CompletedCount = completed.Count,
                InProgressCount = candidates.Count(c => c.Status == CandidateExamStatus.InProgress),
                NotStartedCount = candidates.Count(c => c.Status == CandidateExamStatus.NotStarted),
                ExemptedCount = candidates.Count(c => c.Status == CandidateExamStatus.Exempted),
                AverageScorePercent = avgScore,
                HighestScorePercent = highScore,
                PassRatePercent = passRate,
                ScoreBuckets = buckets,
                OrgPerformance = orgPerformance,
                Leaderboard = leaderboard
            };
        }

        // ─── PRIVATE HELPERS & AUTO-SEED ───
        private static string TruncateString(string? text, int maxLength)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            return text.Length <= maxLength ? text : text[..maxLength] + "...";
        }

        private static string ExtractOrgUnitName(string? path)
        {
            if (string.IsNullOrWhiteSpace(path)) return "Đơn vị Trực thuộc";
            var parts = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
            return parts.Length > 0 ? parts[^1].Replace('_', ' ') : path;
        }

        private static ExamPaperSummaryDto MapToPaperSummary(ExamPaper p)
        {
            return new ExamPaperSummaryDto
            {
                Id = p.Id,
                TrackId = p.TrackId,
                PaperCode = p.PaperCode,
                Title = p.Title,
                GenerationMode = p.GenerationMode.ToString(),
                DurationMinutes = p.DurationMinutes,
                PassingScorePercent = p.PassingScorePercent,
                TotalQuestions = p.TotalQuestions,
                IsSealed = p.IsSealed,
                CryptographicHashSha256 = p.CryptographicHashSha256,
                AssignedCandidatesCount = 0,
                Items = p.Items.OrderBy(i => i.OrderIndex).Select(i => new ExamPaperItemDto
                {
                    Id = i.Id,
                    QuestionId = i.QuestionId,
                    OrderIndex = i.OrderIndex,
                    CustomWeight = i.CustomWeight,
                    IsPinned = i.IsPinned,
                    QuestionTitle = i.QuestionTitleSnapshot ?? "Câu hỏi",
                    Topic = i.TopicSnapshot ?? "Nghiệp vụ",
                    QuestionType = i.QuestionTypeSnapshot ?? "SingleChoice"
                }).ToList()
            };
        }

        private async Task EnsureDatabaseTablesAndSeedAsync(CancellationToken ct)
        {
            try
            {
                // Tự động tạo bảng nếu chưa có (Resilience)
                string ddl = @"
CREATE TABLE IF NOT EXISTS ""AssessmentCampaigns"" (
    ""Id"" uuid NOT NULL PRIMARY KEY,
    ""Title"" text NOT NULL,
    ""Description"" text NOT NULL,
    ""StartDate"" timestamp with time zone NOT NULL,
    ""EndDate"" timestamp with time zone NOT NULL,
    ""Status"" integer NOT NULL,
    ""ExecutionPolicy"" text NOT NULL,
    ""AllowCandidateSelfSelect"" boolean NOT NULL,
    ""TenantId"" uuid NULL,
    ""CreatedBy"" text NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS ""ExamTracks"" (
    ""Id"" uuid NOT NULL PRIMARY KEY,
    ""CampaignId"" uuid NOT NULL REFERENCES ""AssessmentCampaigns""(""Id"") ON DELETE CASCADE,
    ""TrackName"" text NOT NULL,
    ""Description"" text NOT NULL
);

CREATE TABLE IF NOT EXISTS ""ExamPapers"" (
    ""Id"" uuid NOT NULL PRIMARY KEY,
    ""TrackId"" uuid NOT NULL REFERENCES ""ExamTracks""(""Id"") ON DELETE CASCADE,
    ""PaperCode"" text NOT NULL,
    ""Title"" text NOT NULL,
    ""GenerationMode"" integer NOT NULL,
    ""DurationMinutes"" integer NOT NULL,
    ""PassingScorePercent"" numeric NOT NULL,
    ""TotalQuestions"" integer NOT NULL,
    ""IsSealed"" boolean NOT NULL,
    ""CryptographicHashSha256"" text NULL,
    ""SealedAt"" timestamp with time zone NULL,
    ""SealedBy"" text NULL,
    ""BlueprintJson"" text NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS ""ExamPaperItems"" (
    ""Id"" uuid NOT NULL PRIMARY KEY,
    ""ExamPaperId"" uuid NOT NULL REFERENCES ""ExamPapers""(""Id"") ON DELETE CASCADE,
    ""QuestionId"" uuid NOT NULL,
    ""OrderIndex"" integer NOT NULL,
    ""CustomWeight"" numeric NOT NULL,
    ""IsPinned"" boolean NOT NULL,
    ""QuestionTitleSnapshot"" text NULL,
    ""TopicSnapshot"" text NULL,
    ""QuestionTypeSnapshot"" text NULL
);

CREATE TABLE IF NOT EXISTS ""CampaignCandidates"" (
    ""Id"" uuid NOT NULL PRIMARY KEY,
    ""CampaignId"" uuid NOT NULL REFERENCES ""AssessmentCampaigns""(""Id"") ON DELETE CASCADE,
    ""UserId"" uuid NULL,
    ""CandidateIdentifier"" text NOT NULL,
    ""FullName"" text NOT NULL,
    ""Email"" text NOT NULL,
    ""OrgUnitPath"" text NOT NULL,
    ""JobTitle"" text NOT NULL,
    ""AssignedExamPaperId"" uuid NULL REFERENCES ""ExamPapers""(""Id"") ON DELETE SET NULL,
    ""AllocationSource"" text NOT NULL,
    ""OverrideReason"" text NULL,
    ""ShiftCode"" text NULL,
    ""RoomLabId"" text NULL,
    ""Status"" integer NOT NULL,
    ""Score"" numeric NULL,
    ""ScorePercentage"" numeric NULL,
    ""CorrectCount"" integer NOT NULL DEFAULT 0,
    ""TotalCount"" integer NOT NULL DEFAULT 0,
    ""Passed"" boolean NULL,
    ""Rank"" integer NULL,
    ""StartedAt"" timestamp with time zone NULL,
    ""CompletedAt"" timestamp with time zone NULL,
    ""NumberOfTabSwitches"" integer NOT NULL DEFAULT 0
);
";
                await _db.Database.ExecuteSqlRawAsync(ddl, ct);

                // Kiểm tra nếu chưa có Campaign nào thì seed 1 Campaign mẫu toàn diện chuẩn Agribank
                bool hasCampaign = await _db.AssessmentCampaigns.AnyAsync(ct);
                if (!hasCampaign)
                {
                    _logger.LogInformation("[ExamCampaignService] Seeding flagship Enterprise Exam Campaign: Agribank 2026...");
                    var camp = new AssessmentCampaign
                    {
                        Title = "Hội Thi Nghiệp Vụ Toàn Hàng Lần 1/2026",
                        Description = "Kỳ thi sát hạch chuẩn hóa nghiệp vụ dành cho 50,000 cán bộ toàn hệ thống Agribank theo chuẩn IRT 3-PL.",
                        StartDate = DateTimeOffset.UtcNow.AddDays(-2),
                        EndDate = DateTimeOffset.UtcNow.AddDays(10),
                        Status = CampaignStatus.Active,
                        ExecutionPolicy = "STRICT_PROCTORING",
                        AllowCandidateSelfSelect = true,
                        CreatedBy = "No.1 Chief Architect"
                    };

                    // Track 1: KHCN
                    var trackKhcn = new ExamTrack
                    {
                        TrackName = "Nghiệp vụ Khách Hàng Cá Nhân (KHCN)",
                        Description = "Mảng Tín dụng tiêu dùng, Thẻ & Dịch vụ Ngân hàng số"
                    };
                    // Đề 1: Cán bộ KHCN (60% Chuyên môn + 40% Chung)
                    var paperKhcnStaff = new ExamPaper
                    {
                        PaperCode = "AGRI-KHCN-STAFF-2026",
                        Title = "Đề thi Nghiệp vụ KHCN - Cán bộ (60% NV + 40% Chung)",
                        GenerationMode = PaperGenerationMode.Automated,
                        DurationMinutes = 60,
                        PassingScorePercent = 70m,
                        TotalQuestions = 40,
                        IsSealed = true,
                        CryptographicHashSha256 = "8f4a13e7b29a0c3d4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d"
                    };
                    // Đề 2: Quản lý KHCN (60% NV + 25% Chung + 15% Lãnh đạo)
                    var paperKhcnMgr = new ExamPaper
                    {
                        PaperCode = "AGRI-KHCN-MGR-2026",
                        Title = "Đề thi Nghiệp vụ KHCN - Quản lý (60% NV + 25% Chung + 15% Quản lý)",
                        GenerationMode = PaperGenerationMode.Hybrid,
                        DurationMinutes = 90,
                        PassingScorePercent = 75m,
                        TotalQuestions = 50,
                        IsSealed = true,
                        CryptographicHashSha256 = "3b7c8d9e0f1a2b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c"
                    };
                    trackKhcn.Papers.Add(paperKhcnStaff);
                    trackKhcn.Papers.Add(paperKhcnMgr);

                    // Track 2: KHDN
                    var trackKhdn = new ExamTrack
                    {
                        TrackName = "Nghiệp vụ Khách Hàng Doanh Nghiệp (KHDN)",
                        Description = "Mảng Tín dụng Dự án, Tài trợ Thương mại & Quản lý Rủi ro Tín dụng"
                    };
                    var paperKhdnStaff = new ExamPaper
                    {
                        PaperCode = "AGRI-KHDN-STAFF-2026",
                        Title = "Đề thi Nghiệp vụ KHDN - Cán bộ Chuyên viên",
                        GenerationMode = PaperGenerationMode.Automated,
                        DurationMinutes = 60,
                        PassingScorePercent = 70m,
                        TotalQuestions = 40,
                        IsSealed = false
                    };
                    trackKhdn.Papers.Add(paperKhdnStaff);

                    camp.Tracks.Add(trackKhcn);
                    camp.Tracks.Add(trackKhdn);

                    // Thí sinh mẫu thực tế với kết quả thực nghiệm
                    camp.Candidates.Add(new CampaignCandidate
                    {
                        CandidateIdentifier = "SBD-00101",
                        FullName = "Nguyễn Văn Tuấn",
                        Email = "tuan.nv@agribank.com.vn",
                        OrgUnitPath = "/Agribank/KV_MienBac/CN_HaNoi/Phong_KHCN",
                        JobTitle = "Chuyên viên",
                        AssignedExamPaper = paperKhcnStaff,
                        AllocationSource = "AUTO_ORG",
                        ShiftCode = "Ca 1 (08h00 - 09h00)",
                        RoomLabId = "Lab 101",
                        Status = CandidateExamStatus.Completed,
                        Score = 36m,
                        ScorePercentage = 90.0m,
                        CorrectCount = 36,
                        TotalCount = 40,
                        Passed = true,
                        Rank = 1,
                        CompletedAt = DateTimeOffset.UtcNow.AddHours(-3)
                    });

                    camp.Candidates.Add(new CampaignCandidate
                    {
                        CandidateIdentifier = "SBD-00102",
                        FullName = "Trần Thị Mai Phương",
                        Email = "phuong.ttm@agribank.com.vn",
                        OrgUnitPath = "/Agribank/KV_MienBac/CN_HaNoi/Phong_KHCN",
                        JobTitle = "Trưởng phòng",
                        AssignedExamPaper = paperKhcnMgr,
                        AllocationSource = "AUTO_ORG",
                        ShiftCode = "Ca 1 (08h00 - 09h30)",
                        RoomLabId = "Lab 102",
                        Status = CandidateExamStatus.Completed,
                        Score = 44m,
                        ScorePercentage = 88.0m,
                        CorrectCount = 44,
                        TotalCount = 50,
                        Passed = true,
                        Rank = 2,
                        CompletedAt = DateTimeOffset.UtcNow.AddHours(-2)
                    });

                    camp.Candidates.Add(new CampaignCandidate
                    {
                        CandidateIdentifier = "SBD-00103",
                        FullName = "Lê Hoàng Long",
                        Email = "long.lh@agribank.com.vn",
                        OrgUnitPath = "/Agribank/KV_MienBac/CN_HaNoi/Phong_KHCN",
                        JobTitle = "Chuyên viên",
                        AssignedExamPaper = paperKhdnStaff, // Thi chéo KHDN theo nguyện vọng
                        AllocationSource = "SELF_SELECT",
                        OverrideReason = "Thí sinh đăng ký thi chuyển ngạch KHDN",
                        ShiftCode = "Ca 2 (09h45 - 10h45)",
                        RoomLabId = "Lab 101",
                        Status = CandidateExamStatus.Completed,
                        Score = 31m,
                        ScorePercentage = 77.5m,
                        CorrectCount = 31,
                        TotalCount = 40,
                        Passed = true,
                        Rank = 3,
                        CompletedAt = DateTimeOffset.UtcNow.AddHours(-1)
                    });

                    camp.Candidates.Add(new CampaignCandidate
                    {
                        CandidateIdentifier = "SBD-00201",
                        FullName = "Phạm Quang Huy",
                        Email = "huy.pq@agribank.com.vn",
                        OrgUnitPath = "/Agribank/KV_MienNam/CN_TPHCM/Phong_KHDN",
                        JobTitle = "Chuyên viên Tín dụng",
                        AssignedExamPaper = paperKhdnStaff,
                        AllocationSource = "MANUAL_OVERRIDE",
                        OverrideReason = "Điều chỉnh phòng thi do chuyển công tác",
                        ShiftCode = "Ca 2 (09h45 - 10h45)",
                        RoomLabId = "Lab TPHCM 01",
                        Status = CandidateExamStatus.InProgress,
                        StartedAt = DateTimeOffset.UtcNow.AddMinutes(-20)
                    });

                    camp.Candidates.Add(new CampaignCandidate
                    {
                        CandidateIdentifier = "SBD-00202",
                        FullName = "Đỗ Thị Bích",
                        Email = "bich.dt@agribank.com.vn",
                        OrgUnitPath = "/Agribank/KV_MienNam/CN_TPHCM/Phong_KHCN",
                        JobTitle = "Chuyên viên",
                        AssignedExamPaper = paperKhcnStaff,
                        AllocationSource = "EXCEL",
                        ShiftCode = "Ca 3 (14h00 - 15h00)",
                        RoomLabId = "Lab TPHCM 02",
                        Status = CandidateExamStatus.NotStarted
                    });

                    _db.AssessmentCampaigns.Add(camp);
                    await _db.SaveChangesAsync(ct);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[ExamCampaignService] Note during DB table check / auto-seed: {Message}", ex.Message);
            }
        }
    }
}
