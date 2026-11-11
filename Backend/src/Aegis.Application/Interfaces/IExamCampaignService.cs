using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;

namespace Aegis.Application.Interfaces
{
    public interface IExamCampaignService
    {
        Task<List<AssessmentCampaignSummaryDto>> GetAllCampaignsAsync(Guid? tenantId, CancellationToken ct = default);
        Task<AssessmentCampaignDetailDto?> GetCampaignDetailAsync(Guid campaignId, CancellationToken ct = default);
        Task<AssessmentCampaignDetailDto> CreateCampaignAsync(CreateCampaignRequestDto request, Guid? tenantId, string creator, CancellationToken ct = default);
        Task<ExamTrackDto> AddTrackAsync(Guid campaignId, CreateTrackRequestDto request, CancellationToken ct = default);

        // Danh mục Chủ đề thuộc quyền sở hữu của Tenant
        Task<List<TenantTopicOptionDto>> GetTenantTopicsAsync(Guid campaignId, CancellationToken ct = default);

        // Sinh đề Lưỡng diện (Tự động theo Ma trận & Thủ công chọn từng câu)
        Task<ExamPaperSummaryDto> CreateAutoPaperAsync(CreateAutoPaperRequestDto request, CancellationToken ct = default);
        Task<ExamPaperSummaryDto> CreateManualPaperAsync(CreateManualPaperRequestDto request, CancellationToken ct = default);
        Task<ExamPaperSummaryDto> SwapPaperItemAsync(Guid paperId, SwapPaperItemRequestDto request, CancellationToken ct = default);
        Task<ExamPaperSummaryDto> SealPaperAsync(Guid paperId, string sealedBy, CancellationToken ct = default);

        // Ma trận Điều phối Thí sinh (Auto O(1), Ngoại lệ 1-chạm, Batch Excel)
        Task<List<CandidateAllocationDto>> GetCandidatesAsync(Guid campaignId, string? orgFilter, Guid? paperFilter, CancellationToken ct = default);
        Task<int> AutoAllocateCandidatesFromOrgHierarchyAsync(Guid campaignId, CancellationToken ct = default);
        Task<int> ManualOverrideCandidatesAsync(Guid campaignId, ManualOverrideCandidateRequestDto request, CancellationToken ct = default);
        Task<int> BatchImportCandidatesAsync(Guid campaignId, List<BatchImportCandidateItemDto> items, CancellationToken ct = default);

        // Quản trị Kết quả & Phổ điểm
        Task<CampaignResultsAnalyticsDto> GetCampaignResultsAnalyticsAsync(Guid campaignId, CancellationToken ct = default);
    }
}

