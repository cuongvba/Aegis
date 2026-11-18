using System;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Aegis.Application.DTOs;

namespace Aegis.Infrastructure.Services
{
    /// <summary>
    /// Deterministic 7-Dimensional Vietnamese Phonetic & Prosodic Analyzer grounded in V-OS Core.
    /// </summary>
    public static class VosPhoneticAnalyzer
    {
        private static readonly Regex WordRegex = new(@"[\p{L}]+", RegexOptions.Compiled);
        private static readonly string[] MorphingClusters = { "uya", "oai", "ieu", "yeu", "uoi", "uay", "oay" };
        private static readonly string[] StopOnsets = { "tr", "ch", "k", "t", "p", "c", "q" };
        private static readonly string[] FricativeOnsets = { "ph", "kh", "s", "x", "h", "th" };
        private static readonly string[] NasalCodas = { "nh", "ng", "m", "n" };
        private static readonly string[] StopCodas = { "ch", "c", "p", "t" };

        public static VosAcousticTelemetryDto Analyze(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return new VosAcousticTelemetryDto();

            var matches = WordRegex.Matches(text);
            int total = matches.Count;
            if (total == 0)
                return new VosAcousticTelemetryDto();

            int ngang = 0, huyen = 0, sac = 0, nang = 0, hoi = 0, nga = 0;
            int openA = 0, roundUO = 0, flatIE = 0, morphing = 0;
            int stopAttack = 0, fricativeAir = 0, nasalReverb = 0, hardGate = 0;

            foreach (Match m in matches)
            {
                string raw = m.Value.ToLowerInvariant();
                string nfd = raw.Normalize(NormalizationForm.FormD);

                // 1. Detect Vietnamese Tone via NFD combining marks
                if (nfd.Contains('\u0300')) huyen++;
                else if (nfd.Contains('\u0301')) sac++;
                else if (nfd.Contains('\u0323')) nang++;
                else if (nfd.Contains('\u0309')) hoi++;
                else if (nfd.Contains('\u0303')) nga++;
                else ngang++;

                string ascii = StripDiacritics(nfd);

                // 2. Vowel Formants
                if (MorphingClusters.Any(c => ascii.Contains(c, StringComparison.Ordinal)))
                    morphing++;
                else if (ascii.IndexOfAny(new[] { 'u', 'o' }) >= 0)
                    roundUO++;
                else if (ascii.IndexOfAny(new[] { 'i', 'e', 'y' }) >= 0)
                    flatIE++;
                else if (ascii.Contains('a'))
                    openA++;

                // 3. Consonant Onset & Coda Physics
                if (StopOnsets.Any(p => ascii.StartsWith(p, StringComparison.Ordinal)))
                    stopAttack++;
                else if (FricativeOnsets.Any(p => ascii.StartsWith(p, StringComparison.Ordinal)))
                    fricativeAir++;

                if (NasalCodas.Any(c => ascii.EndsWith(c, StringComparison.Ordinal)))
                    nasalReverb++;
                else if (StopCodas.Any(c => ascii.EndsWith(c, StringComparison.Ordinal)))
                    hardGate++;
            }

            double d = total;
            var dto = new VosAcousticTelemetryDto
            {
                TotalSyllables = total,
                NgangRatio = Math.Round(ngang / d, 3),
                HuyenRatio = Math.Round(huyen / d, 3),
                SacRatio = Math.Round(sac / d, 3),
                NangRatio = Math.Round(nang / d, 3),
                HoiRatio = Math.Round(hoi / d, 3),
                NgaRatio = Math.Round(nga / d, 3),
                OpenVowelARatio = Math.Round(openA / d, 3),
                RoundVowelUORatio = Math.Round(roundUO / d, 3),
                FlatVowelIERatio = Math.Round(flatIE / d, 3),
                MorphingDiphthongRatio = Math.Round(morphing / d, 3),
                StopAttackRatio = Math.Round(stopAttack / d, 3),
                FricativeAirRatio = Math.Round(fricativeAir / d, 3),
                NasalReverbRatio = Math.Round(nasalReverb / d, 3),
                HardGateRatio = Math.Round(hardGate / d, 3),
                PauseCommaCount = text.Count(c => c == ','),
                DropPeriodCount = text.Count(c => c == '.'),
                BurstExclamationCount = text.Count(c => c == '!'),
                QuestionBendCount = text.Count(c => c == '?')
            };

            // 4. Master Architectural Combination Classification
            double zenScore = dto.HuyenRatio + dto.NangRatio + dto.RoundVowelUORatio + dto.NasalReverbRatio;
            double epicScore = dto.SacRatio + dto.NgaRatio + dto.FlatVowelIERatio + dto.StopAttackRatio + (dto.BurstExclamationCount > 0 ? 0.25 : 0);
            double etherealScore = dto.NgangRatio + dto.HoiRatio + dto.MorphingDiphthongRatio + dto.FricativeAirRatio;

            if (epicScore >= zenScore && epicScore >= etherealScore)
            {
                dto.DominantVibe = "CHOI_LOA";
                dto.DominantVibeLabel = "Chói Lóa / Vỡ Vụn (Epic · Sci-Fi · Cyberpunk)";
            }
            else if (etherealScore >= zenScore)
            {
                dto.DominantVibe = "MENG_MANG";
                dto.DominantVibeLabel = "Mênh Mang / Uốn Lượn (Ethereal · Fantasy · Fluid)";
            }
            else
            {
                dto.DominantVibe = "TINH_MICH";
                dto.DominantVibeLabel = "Tĩnh Mịch / Huyền Không (Zen · Cinematic · Healing)";
            }

            return dto;
        }

        private static string StripDiacritics(string nfd)
        {
            var sb = new StringBuilder(nfd.Length);
            foreach (char ch in nfd)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                {
                    sb.Append(ch == 'đ' ? 'd' : ch);
                }
            }
            return sb.ToString();
        }
    }
}
