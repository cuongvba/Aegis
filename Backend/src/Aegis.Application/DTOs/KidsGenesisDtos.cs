using System.Collections.Generic;

namespace Aegis.Application.DTOs
{
    public class LocalizedAtomContentDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Phonetic { get; set; }
        public string? SampleSentence { get; set; }
        public string? FunFact { get; set; }
    }

    public class KidsLocaleProfileDto
    {
        public string LocaleCode { get; set; } = "en-US";
        public string LangCode { get; set; } = "en";
        public string NativeName { get; set; } = "English";
        public string FlagEmoji { get; set; } = "🌍";
        /// <summary>"ltr" | "rtl"</summary>
        public string Direction { get; set; } = "ltr";
        public string SpeechTag { get; set; } = "en-US";
        public string CulturalScaleId { get; set; } = "western_major";
        public string RegionCode { get; set; } = "GLOBAL";
        public bool IsSystemDefault { get; set; } = true;
    }

    public class KidsConceptAtomDto
    {
        public string AtomCode { get; set; } = string.Empty;
        public string IslandId { get; set; } = "english";
        public string AgeBand { get; set; } = "3-5";
        public int Order { get; set; } = 1;
        public string Emoji { get; set; } = "🌟";
        public string PrimaryText { get; set; } = string.Empty;
        public string SecondaryText { get; set; } = string.Empty;
        public string? Phonetic { get; set; }
        public int? NumericValue { get; set; }
        public string SampleSentenceEn { get; set; } = string.Empty;
        public string SampleSentenceVi { get; set; } = string.Empty;
        public string FunFactEn { get; set; } = string.Empty;
        public string FunFactVi { get; set; } = string.Empty;
        public bool IsAiGenerated { get; set; }
        public string? AuthorName { get; set; }
        public string? AuthorClass { get; set; }
        public string? CreatorDream { get; set; }
        public string? ImageUrl { get; set; }
        public string? VoiceAudioUrl { get; set; }
        /// <summary>"APPROVED" | "PENDING_REVIEW" | "REJECTED"</summary>
        public string Status { get; set; } = "APPROVED";
        public int GratitudeCount { get; set; }
        public bool IsCommunityContribution { get; set; }
        public string RegionCode { get; set; } = "GLOBAL";
        public string? FrameworkCode { get; set; }
        public Dictionary<string, LocalizedAtomContentDto>? Localized { get; set; }
    }

    public class KidsChoiceOptionDto
    {
        public string Label { get; set; } = string.Empty;
        public string Emoji { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
    }

    public class KidsActivityDto
    {
        public string ActivityId { get; set; } = string.Empty;
        public string AtomCode { get; set; } = string.Empty;
        /// <summary>"EXPOSE_CARD" | "INTERACT_COUNT" | "SPEAK_ECHO" | "MINI_CHALLENGE"</summary>
        public string ActivityType { get; set; } = "EXPOSE_CARD";
        public string TitleVi { get; set; } = string.Empty;
        public string TitleEn { get; set; } = string.Empty;
        public string PromptVi { get; set; } = string.Empty;
        public string PromptEn { get; set; } = string.Empty;
        public string SpeechTextVi { get; set; } = string.Empty;
        public string SpeechTextEn { get; set; } = string.Empty;
        public string Emoji { get; set; } = "🌟";
        public string PrimaryText { get; set; } = string.Empty;
        public string SecondaryText { get; set; } = string.Empty;
        public string? Phonetic { get; set; }
        public int? VisualCount { get; set; }
        public string? TargetSpeakText { get; set; }
        public string? FunFactVi { get; set; }
        public string? FunFactEn { get; set; }
        public List<KidsChoiceOptionDto> Options { get; set; } = new();
    }

    public class GenerateKidsAdventureRequestDto
    {
        public string IslandId { get; set; } = "music";
        public string? AgeBand { get; set; }
        public int AtomCount { get; set; } = 3;
        public string? PreferredStageCode { get; set; }
        public List<string>? WeakAtomCodes { get; set; }
    }

    public class KidsStagePropDto
    {
        public string Emoji { get; set; } = "🎈";
        public string LabelVi { get; set; } = string.Empty;
        public string LabelEn { get; set; } = string.Empty;
        public string ColorHex { get; set; } = "#f43f5e";
    }

    public class KidsStageThemeDto
    {
        public string StageCode { get; set; } = "SKY_BALLOONS";
        public string TitleVi { get; set; } = string.Empty;
        public string TitleEn { get; set; } = string.Empty;
        /// <summary>"SKY" | "OCEAN" | "FAIRYTALE" | "MEADOW" | "SPACE"</summary>
        public string Environment { get; set; } = "SKY";
        /// <summary>"sky" | "ocean" | "fairy" | "meadow"</summary>
        public string ParticleMode { get; set; } = "sky";
        /// <summary>"pop" | "splash" | "unwrap" | "bounce"</summary>
        public string SfxType { get; set; } = "pop";
        public string BackgroundGradient { get; set; } = "from-sky-400 via-cyan-300 to-indigo-400";
        public string BadgeEmoji { get; set; } = "☁️";
        public bool IsSystemDefault { get; set; } = true;
        public List<string> PreferredIslands { get; set; } = new();
        public List<KidsStagePropDto> Props { get; set; } = new();
        public string? AuthorName { get; set; }
        public string? AuthorClass { get; set; }
        public string? CreatorDream { get; set; }
        public string? BackdropImageUrl { get; set; }
        public string Status { get; set; } = "APPROVED";
        public int GratitudeCount { get; set; }
        public string RegionCode { get; set; } = "GLOBAL";
    }

    public class SubmitKidsCreatorBundleDto
    {
        public string AuthorName { get; set; } = string.Empty;
        public string? AuthorClass { get; set; }
        public string? CreatorDream { get; set; }
        public KidsStageThemeDto? CustomStage { get; set; }
        public List<KidsConceptAtomDto> Atoms { get; set; } = new();
    }

    public class KidsCreatorBundleResponseDto
    {
        public bool Success { get; set; }
        public string Status { get; set; } = "PENDING_REVIEW";
        public string? StageCode { get; set; }
        public List<string> AtomCodes { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }

    public class KidsLessonPlanDto
    {
        public string LessonId { get; set; } = string.Empty;
        public string IslandId { get; set; } = string.Empty;
        public string AgeBand { get; set; } = string.Empty;
        public int AtomCount { get; set; }
        public int ActivityCount { get; set; }
        public KidsStageThemeDto? StageTheme { get; set; }
        public List<KidsConceptAtomDto> Atoms { get; set; } = new();
        public List<KidsActivityDto> Activities { get; set; } = new();
    }

    public class AiBuildKidsCurriculumRequestDto
    {
        public string TopicTitle { get; set; } = string.Empty;
        public string IslandId { get; set; } = "explore";
        public string AgeBand { get; set; } = "6-8";
        public int ItemCount { get; set; } = 4;
    }

    public class AiBuildKidsCurriculumResponseDto
    {
        public bool Success { get; set; }
        public bool UsedAi { get; set; }
        public string IslandId { get; set; } = string.Empty;
        public List<KidsConceptAtomDto> Atoms { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }
}
