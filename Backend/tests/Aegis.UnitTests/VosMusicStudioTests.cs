using System.Linq;
using System.Threading.Tasks;
using Aegis.Application.DTOs;
using Aegis.Infrastructure.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Aegis.UnitTests
{
    public class VosMusicStudioTests
    {
        [Fact]
        public void VosPhoneticAnalyzer_Detects_Vietnamese_Tones_Vowels_And_Vibes()
        {
            var zenText = "Mênh mông đêm trầm lặng, sương mờ buông xuống hồ thu...";
            var zenTelemetry = VosPhoneticAnalyzer.Analyze(zenText);

            Assert.True(zenTelemetry.TotalSyllables >= 10);
            Assert.True(zenTelemetry.HuyenRatio + zenTelemetry.NangRatio + zenTelemetry.NgangRatio > 0.7);
            Assert.True(zenTelemetry.NasalReverbRatio > 0.3);

            var epicText = "Sắt thép vỡ nát! Ánh chớp xé toạc bầu trời kỹ thuật số!";
            var epicTelemetry = VosPhoneticAnalyzer.Analyze(epicText);

            Assert.Equal("CHOI_LOA", epicTelemetry.DominantVibe);
            Assert.True(epicTelemetry.SacRatio > 0.2);
            Assert.Equal(2, epicTelemetry.BurstExclamationCount);
        }

        [Fact]
        public async Task VosMusicService_Loads_All_Three_Foundation_Md_Files_And_Compiles_MultiTarget()
        {
            var service = new VosMusicService(NullLogger<VosMusicService>.Instance);
            var kernelDocs = service.GetGroundedKernelDocs();

            Assert.Equal(3, kernelDocs.Count);
            Assert.Contains(kernelDocs, d => d.FileName == "V-OS_Core.md.md");
            Assert.Contains(kernelDocs, d => d.FileName == "V-OS-MAPPING-KERNEL.md");
            Assert.Contains(kernelDocs, d => d.FileName == "V-OS_Unified_Infinity_Core.md");

            var result = await service.CompileAsync(new VosCompileRequestDto
            {
                InputText = "Đêm huyền không tĩnh mịch, ánh trăng uya tan vào sương...",
                Mode = "MUSE",
                TuningHz = 432,
                Language = "vi"
            });

            Assert.Equal(432, result.TuningHz);
            Assert.Equal(3, result.GroundedKernelSources.Count);
            Assert.Contains("432Hz", result.SunoMasterPack.StylesPrompt);
            Assert.Contains("[[", result.SunoMasterPack.LyricsBoxWithTags);
            Assert.Contains("Google Lyria", result.LyriaPrompt);
            Assert.Contains("Omni Veo", result.OmniMultimodalPrompt);
            Assert.Equal(432.0, result.SynthRecipe.BaseFreqHz);
        }
    }
}
