using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;

namespace Aegis.Application.Interfaces
{
    public interface IVosMusicService
    {
        IReadOnlyList<VosKernelDocInfoDto> GetGroundedKernelDocs();

        Task<VosMusicCompilationResultDto> CompileAsync(
            VosCompileRequestDto request,
            CancellationToken ct = default);
    }
}
