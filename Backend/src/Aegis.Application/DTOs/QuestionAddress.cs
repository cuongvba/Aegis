using System;
using System.Text.RegularExpressions;

namespace Aegis.Application.DTOs
{
    /// <summary>
    /// [SSoT Value Object] Tọa độ không gian 5 chiều định danh duy nhất của câu hỏi:
    /// E: ExamRank, P: PartRank, S: SubPartRank, D: DirectiveRank, Q: QuestionNo.
    /// Tầng Application — Thuần khiết, 0 dependency ngoại lai.
    /// </summary>
    public readonly record struct QuestionAddress(int E, int P, int S, int D, int Q)
    {
        public string SectionKey => $"{E}_{P}_{S}_{D}";
        public string FullKey => $"{E}_{P}_{S}_{D}_{Q}";

        public string ExamPartKey => $"{E}_{P}_{Q}";
        public string ExamKey => $"{E}_{Q}";

        public static QuestionAddress FromSection(string sectionKey, int qNum)
        {
            if (string.IsNullOrWhiteSpace(sectionKey))
            {
                return new QuestionAddress(0, 0, 0, 0, qNum);
            }

            var parts = sectionKey.Split('_');
            int e = parts.Length > 0 && int.TryParse(parts[0], out var pe) ? pe : 0;
            int p = parts.Length > 1 && int.TryParse(parts[1], out var pp) ? pp : 0;
            int s = parts.Length > 2 && int.TryParse(parts[2], out var ps) ? ps : 0;
            int d = parts.Length > 3 && int.TryParse(parts[3], out var pd) ? pd : 0;

            return new QuestionAddress(e, p, s, d, qNum);
        }

        public static bool TryParse(string raw, out QuestionAddress address)
        {
            address = default;
            if (string.IsNullOrWhiteSpace(raw)) return false;

            var parts = raw.Split('_');
            if (parts.Length >= 5 &&
                int.TryParse(parts[0], out var e) &&
                int.TryParse(parts[1], out var p) &&
                int.TryParse(parts[2], out var s) &&
                int.TryParse(parts[3], out var d) &&
                int.TryParse(parts[4], out var q))
            {
                address = new QuestionAddress(e, p, s, d, q);
                return true;
            }

            return false;
        }

        public override string ToString() => FullKey;
    }
}

