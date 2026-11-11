using System.Collections.Generic;
using Aegis.Application.Models.AI;
using Aegis.Domain.Entities;

namespace Aegis.Application.Interfaces
{
    /// <summary>
    /// [AegisAI Symposium Architecture] Bộ sinh lập trường học thuật cho từng Viện Hàn Lâm tham gia (OCP Compliant).
    /// Triệt tiêu hoàn toàn switch-case cứng, sinh lập trường dựa trên Metadata thực thể (EpistemicManifesto, DisciplineArea, SpatioTemporalAffinity).
    /// </summary>
    public interface ICouncilContributionGenerator
    {
        /// <summary>
        /// Tạo lập danh sách đóng góp học thuật, lập trường và phản biện chuyên sâu cho từng Viện tham gia phiên.
        /// </summary>
        List<CouncilAcademicContributionDto> GenerateContributions(
            string topicTitle,
            string problemStatement,
            List<UniversalAiCouncil> participating,
            EmpiricalEvidenceDossierDto? dossier);
    }
}
