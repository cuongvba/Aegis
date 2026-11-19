using System;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.Interfaces;
using Aegis.Application.Models.AI;
using Microsoft.Extensions.Logging;
using SkiaSharp;

namespace Aegis.Infrastructure.Services
{
    public sealed class ImageOcrService : IImageOcrService
    {
        private static readonly ConcurrentDictionary<string, ImageOcrResultDto> OcrCache = new(StringComparer.Ordinal);
        private readonly IUniversalAiRouter? _aiRouter;
        private readonly IVietnameseTextCorrectionService? _vnCorrector;
        private readonly ILogger<ImageOcrService> _logger;

        private const string DocumentOcrPrompt =
            "You are an ABBYY-grade Document OCR & STEM LaTeX Transpiler. " +
            "Extract ALL text from this image with 100% accurate Unicode (preserving all Vietnamese diacritics), " +
            "convert tables to GitHub Markdown tables (| col |), and convert any mathematical formulas to KaTeX ($...$ or $$...$$). " +
            "Output ONLY the clean Markdown document content, without surrounding ```markdown fences.";

        public ImageOcrService(
            ILogger<ImageOcrService> logger,
            IUniversalAiRouter? aiRouter = null,
            IVietnameseTextCorrectionService? vnCorrector = null)
        {
            _logger = logger;
            _aiRouter = aiRouter;
            _vnCorrector = vnCorrector;
        }

        public async Task<ImageOcrResultDto> RecognizeDocumentAsync(
            byte[] imageBytes,
            string mimeType = "image/png",
            CancellationToken ct = default)
        {
            if (imageBytes == null || imageBytes.Length < 32)
                return new ImageOcrResultDto();

            string sha = Convert.ToHexString(SHA256.HashData(imageBytes));
            if (OcrCache.TryGetValue(sha, out var cached))
                return cached;

            // Tier 1: Multimodal Vision AI (best for math LaTeX, multi-column & handwriting)
            if (_aiRouter != null)
            {
                try
                {
                    string safeMime = string.IsNullOrWhiteSpace(mimeType) ? "image/png" : mimeType;
                    string dataUri = $"data:{safeMime};base64,{Convert.ToBase64String(imageBytes)}";
                    var aiTask = _aiRouter.ExecuteAsync(new AiExecutionRequest
                    {
                        Prompt = $"{DocumentOcrPrompt}\nImage: {dataUri}",
                        PreferredProviderCode = WellKnownAiProviders.GoogleGemini,
                        PreferredModel = "gemini-2.0-flash",
                        Temperature = 0.1,
                        MaxTokens = 4096
                    });
                    var done = await Task.WhenAny(aiTask, Task.Delay(10000, ct));
                    if (done == aiTask)
                    {
                        var res = await aiTask;
                        if (res?.Success == true && !string.IsNullOrWhiteSpace(res.Content))
                        {
                            var normalized = NormalizeOcrUnicode(res.Content);
                            var dto = new ImageOcrResultDto { MarkdownText = normalized, Provider = "vision-ai" };
                            CacheResult(sha, dto);
                            return dto;
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "[ImageOcr] Vision AI unavailable, falling back to local Tesseract LSTM.");
                }
            }

            // Tier 2: Offline Local Tesseract 5 LSTM (vie+eng) with SkiaSharp preprocessing
            string? localText = await TryTesseractLocalAsync(imageBytes, ct);
            if (!string.IsNullOrWhiteSpace(localText))
            {
                var normalized = NormalizeOcrUnicode(localText);
                var dto = new ImageOcrResultDto { MarkdownText = normalized, Provider = "tesseract-local" };
                CacheResult(sha, dto);
                return dto;
            }

            return new ImageOcrResultDto();
        }

        public static byte[] PreprocessImageForOcr(byte[] rawBytes)
        {
            using var original = SKBitmap.Decode(rawBytes);
            if (original == null || original.Width <= 0 || original.Height <= 0)
                return rawBytes;

            // Upscale small images (< 1200px wide) to ~300 DPI equivalent for sharp Vietnamese diacritics
            float scale = original.Width < 1200 ? Math.Min(2.0f, 1400f / original.Width) : 1.0f;
            int targetW = Math.Max(1, (int)(original.Width * scale));
            int targetH = Math.Max(1, (int)(original.Height * scale));

            using var resized = scale > 1.01f
                ? original.Resize(new SKImageInfo(targetW, targetH), SKFilterQuality.High)
                : original;
            if (resized == null) return rawBytes;

            // Convert to grayscale + slight contrast boost using SkiaSharp ColorMatrix
            using var surface = SKSurface.Create(new SKImageInfo(resized.Width, resized.Height));
            var canvas = surface.Canvas;
            using var paint = new SKPaint();
            float c = 1.25f;
            float t = 0.5f * (1f - c);
            paint.ColorFilter = SKColorFilter.CreateColorMatrix(new[]
            {
                0.299f * c, 0.587f * c, 0.114f * c, 0, t,
                0.299f * c, 0.587f * c, 0.114f * c, 0, t,
                0.299f * c, 0.587f * c, 0.114f * c, 0, t,
                0f,         0f,         0f,         1, 0f
            });
            canvas.DrawBitmap(resized, 0, 0, paint);
            canvas.Flush();

            using var img = surface.Snapshot();
            using var data = img.Encode(SKEncodedImageFormat.Png, 100);
            return data.ToArray();
        }

        private async Task<string?> TryTesseractLocalAsync(byte[] imageBytes, CancellationToken ct)
        {
            try
            {
                byte[] preprocessed = PreprocessImageForOcr(imageBytes);
                using var proc = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "tesseract",
                        Arguments = "stdin stdout -l vie+eng --psm 6",
                        RedirectStandardInput = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        StandardOutputEncoding = Encoding.UTF8
                    }
                };
                if (!proc.Start()) return null;

                await proc.StandardInput.BaseStream.WriteAsync(preprocessed, ct);
                proc.StandardInput.Close();

                string output = await proc.StandardOutput.ReadToEndAsync(ct);
                await proc.WaitForExitAsync(ct);
                return proc.ExitCode == 0 && !string.IsNullOrWhiteSpace(output) ? output : null;
            }
            catch
            {
                return null;
            }
        }

        private string NormalizeOcrUnicode(string raw)
        {
            string s = raw.Trim();
            if (s.StartsWith("```markdown", StringComparison.OrdinalIgnoreCase))
                s = s[11..];
            if (s.StartsWith("```"))
                s = s[3..];
            if (s.EndsWith("```"))
                s = s[..^3];

            s = s.Normalize(NormalizationForm.FormC).Trim();
            if (_vnCorrector != null)
                s = _vnCorrector.CorrectText(s);
            return s.Normalize(NormalizationForm.FormC);
        }

        private static void CacheResult(string sha, ImageOcrResultDto dto)
        {
            if (OcrCache.Count > 300) OcrCache.Clear();
            OcrCache[sha] = dto;
        }
    }
}
