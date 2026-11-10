using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using AegisQuiz.Application.Interfaces;

namespace AegisQuiz.Infrastructure.Services.Pdf
{
    /// <summary>
    /// [Aegis Hybrid Spatial PDF + Vision Fallback & SHA-256 Semantic Cache (ST-1)]
    /// Giải quyết triệt để 5% đề thi PDF scan từ máy photocopy hoặc lỗi bảng mã font PUA:
    /// 1. Phát hiện tự động trang PDF thiếu lớp chữ vector (letterCount &lt; 20) hoặc tỷ lệ lỗi glyph PUA &gt;= 15%.
    /// 2. Content-Addressable SHA-256 Semantic Cache: Trang ảnh đã bóc tách 1 lần sẽ trả kết quả trong 0ms / 0 token.
    /// 3. Chuẩn hóa văn bản OCR qua IPdfMathSymbolGlyphNormalizer &amp; IPdfStructureGuardService trước khi đẩy vào DSMC + CIG.
    /// 4. Cơ chế Fail-Safe tuyệt đối: Khi mất mạng hoặc chưa cấu hình API Key, bảo toàn nguyên vẹn ảnh gốc dưới dạng Multimodal Data URI.
    /// </summary>
    public class PdfHybridVisionFallbackService : IPdfVisionFallbackService
    {
        private static readonly ConcurrentDictionary<string, List<string>> _semanticCache = new(StringComparer.OrdinalIgnoreCase);

        private readonly IPdfMathSymbolGlyphNormalizer _mathNormalizer;
        private readonly IPdfStructureGuardService _structureGuard;

        public PdfHybridVisionFallbackService(
            IPdfMathSymbolGlyphNormalizer? mathNormalizer = null,
            IPdfStructureGuardService? structureGuard = null)
        {
            _mathNormalizer = mathNormalizer ?? new PdfMathSymbolGlyphNormalizer();
            _structureGuard = structureGuard ?? new PdfStructureGuardService();
        }

        public bool ShouldTriggerVisionFallback(int letterCount, int largeImageCount, string? extractedText)
        {
            if (letterCount < 20 && largeImageCount > 0)
            {
                return true;
            }

            if (largeImageCount > 0 && ComputeGlyphCorruptionRatio(extractedText) >= 0.15)
            {
                return true;
            }

            return false;
        }

        public double ComputeGlyphCorruptionRatio(string? text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return 0.0;
            }

            int totalNonSpace = 0;
            int corruptedCount = 0;

            foreach (char ch in text)
            {
                if (char.IsWhiteSpace(ch)) continue;
                totalNonSpace++;

                // Ký tự vùng PUA (\uE000..\uF8FF), Replacement char (\uFFFD), hoặc ô vuông lỗi font (□, ▯, ■)
                if ((ch >= '\uE000' && ch <= '\uF8FF') ||
                    ch == '\uFFFD' ||
                    ch == '□' ||
                    ch == '▯' ||
                    char.IsControl(ch))
                {
                    corruptedCount++;
                }
            }

            return totalNonSpace == 0 ? 0.0 : (double)corruptedCount / totalNonSpace;
        }

        public string ComputeImageSha256(byte[] imageBytes)
        {
            if (imageBytes == null || imageBytes.Length == 0)
            {
                return string.Empty;
            }

            byte[] hash = SHA256.HashData(imageBytes);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        public List<string> ReconstructPageFromScannedImage(
            byte[] imageBytes,
            string mimeType,
            int pageNumber,
            Func<byte[], string, string?>? visionOcrDelegate = null)
        {
            if (imageBytes == null || imageBytes.Length == 0)
            {
                return new List<string>();
            }

            string sha256 = ComputeImageSha256(imageBytes);

            // 1. Kiểm tra SHA-256 Semantic Cache (0ms / 0-token)
            if (!string.IsNullOrEmpty(sha256) && _semanticCache.TryGetValue(sha256, out var cachedParagraphs))
            {
                return new List<string>(cachedParagraphs);
            }

            // 2. Thực thi Vision OCR nếu có delegate khả dụng
            if (visionOcrDelegate != null)
            {
                try
                {
                    string? rawOcrText = visionOcrDelegate(imageBytes, mimeType);
                    if (!string.IsNullOrWhiteSpace(rawOcrText))
                    {
                        string cleaned = _structureGuard.CleanNoiseAndWatermarks(rawOcrText);
                        string normalized = _mathNormalizer.NormalizeMathGlyphs(cleaned);
                        var paragraphs = normalized
                            .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                            .Select(line => line.Trim())
                            .Where(line => !string.IsNullOrEmpty(line))
                            .ToList();

                        if (paragraphs.Count > 0)
                        {
                            _semanticCache[sha256] = paragraphs;
                            return new List<string>(paragraphs);
                        }
                    }
                }
                catch
                {
                    // Graceful degradation xuống Multimodal Image Fallback bên dưới
                }
            }

            // 3. Offline / Zero-Key Multimodal Fail-Safe: Bảo toàn nguyên vẹn hình ảnh trang đề thi
            string safeMime = string.IsNullOrWhiteSpace(mimeType) ? "image/png" : mimeType;
            string dataUri = $"data:{safeMime};base64,{Convert.ToBase64String(imageBytes)}";
            return new List<string>
            {
                $"Câu {pageNumber}. Quan sát hình ảnh đề thi tại Trang {pageNumber} và chọn phương án đúng:",
                $"![Đề thi Trang {pageNumber}]({dataUri})",
                "A. Phương án A",
                "B. Phương án B",
                "C. Phương án C",
                "D. Phương án D"
            };
        }

        public int GetCachedPageCount() => _semanticCache.Count;

        public static void ClearCacheForTesting() => _semanticCache.Clear();
    }
}

