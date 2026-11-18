using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Aegis.Application.Interfaces
{
    public class KidsVoiceProfileDto
    {
        public string VoiceId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string LocaleCode { get; set; } = "vi-VN";
        public string Gender { get; set; } = "Female";
        public string Persona { get; set; } = "Storyteller";
        public string Provider { get; set; } = "edge-neural";
    }

    public class KidsTtsRequestDto
    {
        public string Text { get; set; } = string.Empty;
        public string LocaleCode { get; set; } = "vi-VN";
        public string? VoiceId { get; set; }
        public string? Rate { get; set; }
        public string? Pitch { get; set; }
    }

    public class KidsTtsResultDto
    {
        public byte[] AudioBytes { get; set; } = System.Array.Empty<byte>();
        public string Provider { get; set; } = "google-tts";
    }

    public interface IKidsVoiceService
    {
        IReadOnlyList<KidsVoiceProfileDto> GetVoices(string? localeCode = null);

        Task<byte[]?> SynthesizeSpeechAsync(
            KidsTtsRequestDto request,
            CancellationToken ct = default);

        Task<KidsTtsResultDto?> SynthesizeSpeechWithMetaAsync(
            KidsTtsRequestDto request,
            CancellationToken ct = default);
    }
}
