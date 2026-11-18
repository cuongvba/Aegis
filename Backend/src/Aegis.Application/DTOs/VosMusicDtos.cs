using System.Collections.Generic;

namespace Aegis.Application.DTOs
{
    public sealed class VosCompileRequestDto
    {
        public string InputText { get; set; } = string.Empty;
        public string Mode { get; set; } = "MUSE"; // ARCHITECT | MUSE
        public string TargetPlatform { get; set; } = "ALL"; // SUNO_V6 | LYRIA | OMNI_VEO | ALL
        public int TuningHz { get; set; } = 432; // 432 | 440 | 528
        public string Language { get; set; } = "vi"; // vi | en | bilingual
        public string? CustomTitle { get; set; }
    }

    public sealed class VosAcousticTelemetryDto
    {
        public int TotalSyllables { get; set; }
        public double NgangRatio { get; set; }
        public double HuyenRatio { get; set; }
        public double SacRatio { get; set; }
        public double NangRatio { get; set; }
        public double HoiRatio { get; set; }
        public double NgaRatio { get; set; }

        public double OpenVowelARatio { get; set; }
        public double RoundVowelUORatio { get; set; }
        public double FlatVowelIERatio { get; set; }
        public double MorphingDiphthongRatio { get; set; }

        public double StopAttackRatio { get; set; }
        public double FricativeAirRatio { get; set; }
        public double NasalReverbRatio { get; set; }
        public double HardGateRatio { get; set; }

        public int PauseCommaCount { get; set; }
        public int DropPeriodCount { get; set; }
        public int BurstExclamationCount { get; set; }
        public int QuestionBendCount { get; set; }

        public string DominantVibe { get; set; } = "TINH_MICH"; // TINH_MICH | CHOI_LOA | MENG_MANG
        public string DominantVibeLabel { get; set; } = "Tĩnh Mịch / Huyền Không (Zen Healing)";
    }

    public sealed class VosSunoMasterPackDto
    {
        public string SongTitle { get; set; } = string.Empty;
        public string StylesPrompt { get; set; } = string.Empty;
        public string ExcludeStyles { get; set; } = string.Empty;
        public int Weirdness { get; set; } = 45;
        public int StyleInfluence { get; set; } = 75;
        public string LyricsBoxWithTags { get; set; } = string.Empty;
        public string MarkdownExport { get; set; } = string.Empty;
        public string CsvRow { get; set; } = string.Empty;
    }

    public sealed class VosSynthRecipeDto
    {
        public double BaseFreqHz { get; set; } = 432.0;
        public double LowPassCutoffHz { get; set; } = 1600.0;
        public double ReverbSeconds { get; set; } = 4.5;
        public double SubBassIntensity { get; set; } = 0.65;
        public double Brightness { get; set; } = 0.45;
        public int TempoBpm { get; set; } = 72;
        public string MusicalKey { get; set; } = "D Minor";
        public string AccentColor { get; set; } = "#8b5cf6";
        public string VisualArchetype { get; set; } = "ZEN_MIST"; // ZEN_MIST | CYBER_SHARD | FLUID_AURA
    }

    public sealed class VosKernelDocInfoDto
    {
        public string FileName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int CharacterCount { get; set; }
        public string Summary { get; set; } = string.Empty;
    }

    public sealed class VosMusicCompilationResultDto
    {
        public string Mode { get; set; } = "MUSE";
        public int TuningHz { get; set; } = 432;
        public bool UsedAi { get; set; }
        public VosAcousticTelemetryDto Telemetry { get; set; } = new();
        public VosSunoMasterPackDto SunoMasterPack { get; set; } = new();
        public string LyriaPrompt { get; set; } = string.Empty;
        public string OmniMultimodalPrompt { get; set; } = string.Empty;
        public VosSynthRecipeDto SynthRecipe { get; set; } = new();
        public List<VosKernelDocInfoDto> GroundedKernelSources { get; set; } = new();
    }
}
