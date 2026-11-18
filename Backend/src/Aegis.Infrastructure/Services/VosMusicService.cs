using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.DTOs;
using Aegis.Application.Interfaces;
using Aegis.Application.Models.AI;
using Microsoft.Extensions.Logging;

namespace Aegis.Infrastructure.Services
{
    public sealed class VosMusicService : IVosMusicService
    {
        private readonly IUniversalAiRouter? _aiRouter;
        private readonly ILogger<VosMusicService> _logger;
        private static readonly Lazy<List<(VosKernelDocInfoDto Meta, string Content)>> CachedKernelDocs = new(LoadKernelDocs);

        public VosMusicService(ILogger<VosMusicService> logger, IUniversalAiRouter? aiRouter = null)
        {
            _logger = logger;
            _aiRouter = aiRouter;
        }

        public IReadOnlyList<VosKernelDocInfoDto> GetGroundedKernelDocs()
            => CachedKernelDocs.Value.Select(x => x.Meta).ToList();

        public async Task<VosMusicCompilationResultDto> CompileAsync(
            VosCompileRequestDto request,
            CancellationToken ct = default)
        {
            string input = (request.InputText ?? string.Empty).Trim();
            string mode = string.Equals(request.Mode, "ARCHITECT", StringComparison.OrdinalIgnoreCase)
                ? "ARCHITECT"
                : "MUSE";
            int tuningHz = request.TuningHz is 432 or 440 or 528 ? request.TuningHz : 432;

            var telemetry = VosPhoneticAnalyzer.Analyze(input);
            var synth = BuildSynthRecipe(telemetry, tuningHz);

            var result = new VosMusicCompilationResultDto
            {
                Mode = mode,
                TuningHz = tuningHz,
                Telemetry = telemetry,
                SynthRecipe = synth,
                GroundedKernelSources = CachedKernelDocs.Value.Select(x => x.Meta).ToList()
            };

            // Build deterministic V-OS baseline first (100% reliable)
            BuildDeterministicOutputs(input, mode, tuningHz, request.CustomTitle, telemetry, synth, result);

            // Enhance with AI Router grounded on the 3 V-OS .md kernel docs when available
            if (_aiRouter != null && !string.IsNullOrWhiteSpace(input))
            {
                try
                {
                    await TryEnhanceWithAiAsync(input, mode, tuningHz, request.Language, result, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[VosMusicService] AI enhancement fallback to deterministic V-OS compiler.");
                }
            }

            return result;
        }

        private static VosSynthRecipeDto BuildSynthRecipe(VosAcousticTelemetryDto t, int tuningHz)
        {
            return t.DominantVibe switch
            {
                "CHOI_LOA" => new VosSynthRecipeDto
                {
                    BaseFreqHz = tuningHz,
                    LowPassCutoffHz = 4200,
                    ReverbSeconds = 2.2,
                    SubBassIntensity = Math.Clamp(0.45 + t.NangRatio, 0.3, 0.95),
                    Brightness = Math.Clamp(0.75 + t.SacRatio, 0.6, 1.0),
                    TempoBpm = 124,
                    MusicalKey = "F# Minor",
                    AccentColor = "#f43f5e",
                    VisualArchetype = "CYBER_SHARD"
                },
                "MENG_MANG" => new VosSynthRecipeDto
                {
                    BaseFreqHz = tuningHz,
                    LowPassCutoffHz = 2400,
                    ReverbSeconds = 5.5,
                    SubBassIntensity = 0.48,
                    Brightness = 0.62,
                    TempoBpm = 88,
                    MusicalKey = "A Minor",
                    AccentColor = "#06b6d4",
                    VisualArchetype = "FLUID_AURA"
                },
                _ => new VosSynthRecipeDto
                {
                    BaseFreqHz = tuningHz,
                    LowPassCutoffHz = 1350,
                    ReverbSeconds = Math.Clamp(4.0 + t.NasalReverbRatio * 4.0, 3.5, 8.0),
                    SubBassIntensity = Math.Clamp(0.55 + t.NangRatio, 0.4, 0.95),
                    Brightness = 0.35,
                    TempoBpm = 68,
                    MusicalKey = "D Minor",
                    AccentColor = "#8b5cf6",
                    VisualArchetype = "ZEN_MIST"
                }
            };
        }

        private static void BuildDeterministicOutputs(
            string input,
            string mode,
            int tuningHz,
            string? customTitle,
            VosAcousticTelemetryDto t,
            VosSynthRecipeDto synth,
            VosMusicCompilationResultDto result)
        {
            string shortTitle = string.IsNullOrWhiteSpace(customTitle)
                ? (input.Length > 36 ? input[..36].Trim() + "..." : (string.IsNullOrWhiteSpace(input) ? "HƯ KHÔNG LINH TỰ" : input))
                : customTitle.Trim();

            (string genre, string vibeSeo, string audioTags, string visualTags, string exclude) = t.DominantVibe switch
            {
                "CHOI_LOA" => (
                    "Cyberpunk Synthwave, Epic Electronic Orchestral",
                    "SHATTERED NEON RESONANCE",
                    "aggressive synth brass, fast staccato, microtonal vibrato, hard hitting percussion",
                    "High-key neon laser lighting, glass shattering, fast cuts, particle explosion",
                    "lofi, sleepy, acoustic ballad"),
                "MENG_MANG" => (
                    "Ethereal Cinematic Fusion, Ambient World",
                    "FLUID BIOLUMINESCENT DRIFT",
                    "sweeping strings, uya-oai filter morphing, ethereal vocal pads, flowing legato",
                    "Flowing liquid light, bioluminescence, soft gradient colors, smooth tracking shot",
                    "heavy metal, harsh noise, distorted scream"),
                _ => (
                    "Cinematic Zen Ambient, Healing Acoustic Fusion",
                    "ETHEREAL VOID RESONANCE",
                    $"deep atmospheric drone, singing bowls, cello low-mid, infinite nasal reverb, {tuningHz}Hz",
                    "Abyssal depth, low-key lighting, thick mist, ultra-slow dolly in, profound serenity",
                    "fast EDM, harsh trap hi-hats, aggressive scream")
            };

            string songTitle = $"{shortTitle.ToUpperInvariant()} : {vibeSeo} | V-OS {tuningHz}Hz";
            string stylesPrompt = $"{genre}, Vietnamese & English vocal, V-OS 7D, {tuningHz}Hz, {audioTags}, {synth.TempoBpm} BPM, {synth.MusicalKey}".Trim();
            if (stylesPrompt.Length > 1000) stylesPrompt = stylesPrompt[..1000];

            string cueTag = t.DominantVibe == "CHOI_LOA"
                ? "[[ Keng! Trịch! Vỡ! ]]"
                : t.DominantVibe == "MENG_MANG"
                    ? "[[ Uyaaa... Shhhh... ]]"
                    : "[[ Bùm... Ooo... Mãi... ]]";

            string lyricsBody = mode == "ARCHITECT"
                ? $"[Language: Vietnamese]\n[Verse 1: {synth.TempoBpm} BPM, Architect Lock]\n{input}\n{cueTag}"
                : $"[Intro: {tuningHz}Hz Atmospheric Drone]\n{cueTag}\n\n[Language: Vietnamese]\n[Verse 1]\n{input}\n\n[Chorus: Epic Symmetry / Biền Ngẫu]\n(Ooo... vang vọng không gian...)\n{cueTag}\n\n[Outro: Infinite Nasal Reverb]\n... tan vào tĩnh lặng...";

            string md = $"### 1. Song Title\n`{songTitle}`\n\n" +
                        $"### 2. Styles Prompt (Suno v5.5 / v6+)\n```text\n{stylesPrompt}\n```\n" +
                        $"- **Exclude Styles**: `{exclude}`\n" +
                        $"- **Weirdness**: `{(t.DominantVibe == "CHOI_LOA" ? 72 : 55)}` | **Style Influence**: `80`\n\n" +
                        $"### 3. Lyrics Box\n```text\n{lyricsBody}\n```";

            string csv = $"\"{songTitle.Replace("\"", "\"\"")}\",\"vi\",\"{stylesPrompt.Replace("\"", "\"\"")}\",\"{lyricsBody.Replace("\"", "\"\"").Replace("\n", "\\n")}\",\"V-OS,{tuningHz}Hz,{t.DominantVibe}\"";

            result.SunoMasterPack = new VosSunoMasterPackDto
            {
                SongTitle = songTitle,
                StylesPrompt = stylesPrompt,
                ExcludeStyles = exclude,
                Weirdness = t.DominantVibe == "CHOI_LOA" ? 72 : 55,
                StyleInfluence = 80,
                LyricsBoxWithTags = lyricsBody,
                MarkdownExport = md,
                CsvRow = csv
            };

            result.LyriaPrompt =
                $"[Google Lyria / MusicFX Vector] Key: {synth.MusicalKey}, Tempo: {synth.TempoBpm} BPM, Tuning: {tuningHz}Hz. " +
                $"Tonal gravity: Huyen({t.HuyenRatio:P0})/Nang({t.NangRatio:P0})/Sac({t.SacRatio:P0}). " +
                $"Instrumentation: {audioTags}. Spectral cutoff ~{synth.LowPassCutoffHz}Hz, reverb tail {synth.ReverbSeconds:F1}s.";

            result.OmniMultimodalPrompt =
                $"[Omni Veo + Nano Banana 2 Synchronized Shot] Vibe: {t.DominantVibeLabel}.\n" +
                $"00:00-00:08 | Audio: {audioTags} ({tuningHz}Hz) | Visual: {visualTags} | Camera: {(t.DominantVibe == "CHOI_LOA" ? "Fast tracking + particle burst" : "Slow dolly in + volumetric mist")}.";
        }

        private async Task TryEnhanceWithAiAsync(
            string input,
            string mode,
            int tuningHz,
            string language,
            VosMusicCompilationResultDto result,
            CancellationToken ct)
        {
            var kernelSnippet = string.Join("\n---\n",
                CachedKernelDocs.Value.Select(d => $"[{d.Meta.FileName}]\n{d.Content[..Math.Min(1600, d.Content.Length)]}"));

            string sysPrompt =
                "Bạn là V-OS 7D Multimodal Music Compiler (tham chiếu trực tiếp tài liệu V-OS Core, Mapping Kernel Suno 5.5/6, Tesseract Omniverse). " +
                "Trả về JSON thuần (không markdown fence) với các trường: songTitle, stylesPrompt, lyricsBoxWithTags, lyriaPrompt, omniMultimodalPrompt.\n" +
                $"Quy tắc MODE={mode}: nếu ARCHITECT giữ nguyên từng từ & dấu câu đầu vào; nếu MUSE phát triển thêm thẻ [[ ]] và điệp khúc chữa lành/sử thi.\n\n{kernelSnippet}";

            string userPrompt =
                $"Input: {input}\nTuning: {tuningHz}Hz | Language: {language} | DominantVibe: {result.Telemetry.DominantVibeLabel} | " +
                $"Tones(Ngang={result.Telemetry.NgangRatio:P0}, Huyen={result.Telemetry.HuyenRatio:P0}, Sac={result.Telemetry.SacRatio:P0}, Nang={result.Telemetry.NangRatio:P0})";

            var aiRes = await _aiRouter!.ExecuteAsync(new AiExecutionRequest
            {
                SystemPrompt = sysPrompt,
                Prompt = userPrompt,
                Temperature = 0.6,
                MaxTokens = 2048
            });

            string? aiResponse = aiRes?.Success == true ? aiRes.Content : null;
            if (string.IsNullOrWhiteSpace(aiResponse)) return;

            string cleaned = aiResponse.Trim();
            int firstBrace = cleaned.IndexOf('{');
            int lastBrace = cleaned.LastIndexOf('}');
            if (firstBrace < 0 || lastBrace <= firstBrace) return;

            using var doc = JsonDocument.Parse(cleaned[firstBrace..(lastBrace + 1)]);
            var root = doc.RootElement;

            if (root.TryGetProperty("songTitle", out var st) && !string.IsNullOrWhiteSpace(st.GetString()))
                result.SunoMasterPack.SongTitle = st.GetString()!;
            if (root.TryGetProperty("stylesPrompt", out var sp) && !string.IsNullOrWhiteSpace(sp.GetString()))
                result.SunoMasterPack.StylesPrompt = sp.GetString()!;
            if (root.TryGetProperty("lyricsBoxWithTags", out var ly) && !string.IsNullOrWhiteSpace(ly.GetString()))
                result.SunoMasterPack.LyricsBoxWithTags = ly.GetString()!;
            if (root.TryGetProperty("lyriaPrompt", out var lyr) && !string.IsNullOrWhiteSpace(lyr.GetString()))
                result.LyriaPrompt = lyr.GetString()!;
            if (root.TryGetProperty("omniMultimodalPrompt", out var omni) && !string.IsNullOrWhiteSpace(omni.GetString()))
                result.OmniMultimodalPrompt = omni.GetString()!;

            result.UsedAi = true;
        }

        private static List<(VosKernelDocInfoDto Meta, string Content)> LoadKernelDocs()
        {
            var list = new List<(VosKernelDocInfoDto, string)>();
            var asm = typeof(VosCompileRequestDto).Assembly;
            var names = asm.GetManifestResourceNames()
                .Where(n => n.Contains("VosCore", StringComparison.OrdinalIgnoreCase) && n.EndsWith(".md", StringComparison.OrdinalIgnoreCase))
                .OrderBy(n => n)
                .ToList();

            foreach (var resName in names)
            {
                using var stream = asm.GetManifestResourceStream(resName);
                if (stream == null) continue;
                using var reader = new StreamReader(stream, Encoding.UTF8);
                string content = reader.ReadToEnd();
                string fileName = resName.Split('.').Reverse().Take(2).Reverse().Aggregate((a, b) => $"{a}.{b}");
                if (resName.EndsWith("V-OS_Core.md.md", StringComparison.OrdinalIgnoreCase)) fileName = "V-OS_Core.md.md";
                else if (resName.EndsWith("V-OS-MAPPING-KERNEL.md", StringComparison.OrdinalIgnoreCase)) fileName = "V-OS-MAPPING-KERNEL.md";
                else if (resName.EndsWith("V-OS_Unified_Infinity_Core.md", StringComparison.OrdinalIgnoreCase)) fileName = "V-OS_Unified_Infinity_Core.md";

                string firstLine = content.Split('\n').FirstOrDefault(l => l.StartsWith('#'))?.TrimStart('#', ' ').Trim() ?? fileName;
                list.Add((new VosKernelDocInfoDto
                {
                    FileName = fileName,
                    Title = firstLine,
                    CharacterCount = content.Length,
                    Summary = content.Length > 220 ? content[..220].Replace("\n", " ").Trim() + "..." : content
                }, content));
            }
            return list;
        }
    }
}
