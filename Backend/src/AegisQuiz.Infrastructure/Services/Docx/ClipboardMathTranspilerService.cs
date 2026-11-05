using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AegisQuiz.Infrastructure.AI;
using SkiaSharp;

namespace AegisQuiz.Infrastructure.Services.Docx
{
    /// <summary>
    /// [Aegis Tri-Tier Clipboard MathType-to-LaTeX Transpiler Service v2.0]
    /// Kế thừa 100% tinh hoa giải mã công thức của bộ đọc .docx (MtefToLatexConverter + MathTypeWmfEngine + MathLocaleNormalizer + DocxParserService):
    /// 1. Tier 1 (0ms Deterministic AST): Giải mã trực tiếp luồng nhị phân \wmetafile8 (giống hệt word/media/imageX.wmf trong .docx) & \objdata (OLE MTEF v5) từ RTF Clipboard.
    /// 2. Tier 2 (0ms Local WMZ/WMF): Giải nén tệp tạm .wmz/.wmf từ Word Clipboard (nếu cùng máy chủ/môi trường cục bộ).
    /// 3. Tier 3 (SkiaSharp White-Canvas Super-Resolution + Multimodal Vision Math OCR + Docx Post-Normalization):
    ///    Khử nền trong suốt Alpha PNG (tránh lỗi nền đen đè chữ đen), phóng đại nét mảnh & chuẩn hóa đầu ra theo đúng chuẩn .docx ($...$).
    /// </summary>
    public static class ClipboardMathTranspilerService
    {
        private static readonly ConcurrentDictionary<string, string> VisionFormulaCache = new(StringComparer.Ordinal);

        public static List<string> DecodeRtfHexChunksToLatex(IEnumerable<string>? hexChunks)
        {
            var results = new List<string>();
            if (hexChunks == null) return results;

            foreach (var rawEntry in hexChunks)
            {
                if (string.IsNullOrWhiteSpace(rawEntry)) continue;

                // Hỗ trợ gói kép "WMF_HEX|OBJDATA_HEX" cho cùng 1 đối tượng công thức để ưu tiên \wmetafile8 (giống hệt .docx) trước rồi fallback sang \objdata
                var candidates = rawEntry.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                foreach (var candidateHex in candidates)
                {
                    var bytes = TryParseHex(candidateHex);
                    if (bytes == null || bytes.Length < 32) continue;

                    if (TryDecodeBinaryMathBytes(bytes, out var latex))
                    {
                        results.Add(latex);
                        break;
                    }
                }
            }

            return results;
        }

        public static List<string> TryDecodeLocalWmzPaths(IEnumerable<string>? fileUris)
        {
            var results = new List<string>();
            if (fileUris == null) return results;

            foreach (var uri in fileUris)
            {
                try
                {
                    if (string.IsNullOrWhiteSpace(uri)) continue;
                    var cleanPath = uri.Replace("file:///", "", StringComparison.OrdinalIgnoreCase)
                                       .Replace("file://", "", StringComparison.OrdinalIgnoreCase)
                                       .Replace('/', Path.DirectorySeparatorChar);
                    cleanPath = Uri.UnescapeDataString(cleanPath);
                    if (!File.Exists(cleanPath)) continue;

                    var ext = Path.GetExtension(cleanPath).ToLowerInvariant();
                    if (ext != ".wmz" && ext != ".wmf" && ext != ".emz" && ext != ".bin") continue;

                    var bytes = File.ReadAllBytes(cleanPath);
                    if (TryDecodeBinaryMathBytes(bytes, out var latex))
                    {
                        results.Add(latex);
                    }
                }
                catch { /* ignore inaccessible client paths */ }
            }

            return results;
        }

        public static bool TryDecodeBinaryMathBytes(byte[] bytes, out string latex)
        {
            latex = string.Empty;
            if (bytes == null || bytes.Length < 32) return false;

            // Nếu là GZip (.wmz) -> Giải nén trước
            if (bytes.Length > 2 && bytes[0] == 0x1F && bytes[1] == 0x8B)
            {
                try
                {
                    using var ms = new MemoryStream(bytes);
                    using var gz = new GZipStream(ms, CompressionMode.Decompress);
                    using var outMs = new MemoryStream();
                    gz.CopyTo(outMs);
                    bytes = outMs.ToArray();
                }
                catch { /* fallback to raw bytes */ }
            }

            // 1. Ưu tiên giải mã cây AST MTEF v5 (hỗ trợ cả WMF 'Design Science, Inc.', chữ ký 'DSMT'/'MTWin' và OLE 'EQNOLEFILEHDR')
            if (MtefToLatexConverter.TryConvert(bytes, out var mtefLatex) && !string.IsNullOrWhiteSpace(mtefLatex))
            {
                latex = MtefToLatexConverter.NormalizeToDocxStandardLatex(mtefLatex);
                return !string.IsNullOrWhiteSpace(latex);
            }

            // 2. Fallback qua bộ giải mã tọa độ GDI WMF -> LaTeX + Chuẩn hóa hậu kỳ chuẩn .docx
            if (MathTypeWmfEngine.TryExtractSimpleMathText(bytes, out var wmfLatex) && !string.IsNullOrWhiteSpace(wmfLatex))
            {
                latex = MtefToLatexConverter.NormalizeToDocxStandardLatex(wmfLatex);
                return !string.IsNullOrWhiteSpace(latex);
            }

            return false;
        }

        /// <summary>
        /// Tiền xử lý ảnh công thức bằng SkiaSharp trước khi đưa vào Vision OCR:
        /// 1. Phủ nền trắng tinh khiết (#FFFFFF) dưới kênh Alpha trong suốt (sửa triệt để lỗi ảnh PNG MathType chữ đen nền trong suốt bị biến thành khối đen).
        /// 2. Phóng đại (Upscale 2x-3x) đối với ảnh công thức nhỏ (< 380x96px) để các số mũ, chỉ số dưới, dấu căn và phân số sắc nét tuyệt đối.
        /// 3. Thêm viền đệm trắng 28px bốn phía giúp mô hình Vision nhận diện chính xác ký tự đầu/cuối.
        /// </summary>
        public static (string MimeType, string Base64Data, string DataUri) PreprocessFormulaImageForOcr(string originalMime, string originalBase64, string originalDataUri)
        {
            try
            {
                byte[] rawBytes = Convert.FromBase64String(originalBase64);
                using var srcBitmap = SKBitmap.Decode(rawBytes);
                if (srcBitmap == null || srcBitmap.Width <= 0 || srcBitmap.Height <= 0)
                    return (originalMime, originalBase64, originalDataUri);

                float scale = 1.0f;
                if (srcBitmap.Width < 380 || srcBitmap.Height < 96)
                {
                    float scaleW = 380f / Math.Max(1, srcBitmap.Width);
                    float scaleH = 96f / Math.Max(1, srcBitmap.Height);
                    scale = Math.Clamp(Math.Max(scaleW, scaleH), 1.5f, 3.0f);
                }

                int scaledW = Math.Min(1800, (int)Math.Round(srcBitmap.Width * scale));
                int scaledH = Math.Min(900, (int)Math.Round(srcBitmap.Height * scale));
                const int pad = 28;
                int outW = scaledW + pad * 2;
                int outH = scaledH + pad * 2;

                var info = new SKImageInfo(outW, outH, SKColorType.Rgba8888, SKAlphaType.Opaque);
                using var surface = SKSurface.Create(info);
                if (surface == null)
                    return (originalMime, originalBase64, originalDataUri);

                var canvas = surface.Canvas;
                canvas.Clear(SKColors.White);

                var destRect = new SKRect(pad, pad, pad + scaledW, pad + scaledH);
                using var paint = new SKPaint
                {
                    IsAntialias = true,
                    FilterQuality = SKFilterQuality.High
                };
                canvas.DrawBitmap(srcBitmap, destRect, paint);
                canvas.Flush();

                using var image = surface.Snapshot();
                using var encoded = image.Encode(SKEncodedImageFormat.Png, 100);
                if (encoded == null)
                    return (originalMime, originalBase64, originalDataUri);

                string b64 = Convert.ToBase64String(encoded.ToArray());
                return ("image/png", b64, $"data:image/png;base64,{b64}");
            }
            catch
            {
                return (originalMime, originalBase64, originalDataUri);
            }
        }

        public static async Task<string?> DecodeFormulaImageViaVisionAsync(
            string? imageDataUri,
            IHttpClientFactory httpClientFactory)
        {
            if (string.IsNullOrWhiteSpace(imageDataUri) || !imageDataUri.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                return null;

            var commaIdx = imageDataUri.IndexOf(',');
            if (commaIdx < 0 || commaIdx + 1 >= imageDataUri.Length) return null;

            var header = imageDataUri[..commaIdx];
            var rawBase64Data = imageDataUri[(commaIdx + 1)..].Trim();
            var mimeMatch = Regex.Match(header, @"data:(image/[a-zA-Z0-9.+_-]+)", RegexOptions.IgnoreCase);
            var rawMimeType = mimeMatch.Success ? mimeMatch.Groups[1].Value : "image/png";

            // Tra cứu Cache SHA-256 (0ms nếu công thức đã từng được dán)
            var hashKey = "V2_" + ComputeSha256(rawBase64Data);
            if (VisionFormulaCache.TryGetValue(hashKey, out var cached))
            {
                return cached == "IMAGE_KEEP" ? null : cached;
            }

            // Chuẩn hóa ảnh công thức (Khử nền trong suốt -> nền trắng #FFFFFF + Padding 28px + Super-Resolution Upscale)
            var (mimeType, base64Data, processedDataUri) = PreprocessFormulaImageForOcr(rawMimeType, rawBase64Data, imageDataUri);

            var keys = UniversalAiRouter.LoadApiKeyFileFallback();
            List<string> GetKeyList(params string[] names)
            {
                var list = new List<string>();
                foreach (var n in names)
                {
                    if (keys.TryGetValue(n, out var v) && !string.IsNullOrWhiteSpace(v))
                        list.AddRange(v.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
                    var env = Environment.GetEnvironmentVariable(n);
                    if (!string.IsNullOrWhiteSpace(env))
                        list.AddRange(env.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
                }
                return list.Distinct().ToList();
            }

            const string systemPrompt =
                "You are a deterministic MathType-to-LaTeX optical character recognition (OCR) engine. " +
                "Transcribe ONLY the exact mathematical or chemical characters, symbols, fractions, radicals, integrals, limits, vectors, angles, matrices, or system of equations visually shown in the image into pure LaTeX wrapped in $...$ " +
                "(for example: $\\cos(2x) = 1 - 2\\sin^2 x$ or $\\frac{-b \\pm \\sqrt{\\Delta}}{2a}$ or $\\overrightarrow{AB}$). " +
                "CRITICAL RULES: " +
                "1. NEVER solve, simplify, evaluate, expand into series, or add any terms not visually present in the image. Transcribe character-for-character! " +
                "2. Output ONLY the LaTeX string wrapped in $...$, with NO markdown code blocks, NO backticks, and NO explanation. " +
                "3. Only if the image is a photograph, geometric shape diagram without a formula, or decorative picture that cannot be represented as LaTeX, output EXACTLY: IMAGE_KEEP";

            string? rawResult = null;

            // 1. Ưu tiên Mistral Pixtral Vision (pixtral-large-latest -> pixtral-12b-2409) có độ chính xác OCR Toán học cao và khóa hoạt động ổn định
            foreach (var mistralKey in GetKeyList("MISTRAL_API_KEY", "Mistral").Take(2))
            {
                rawResult = await TryCallOpenAiCompatibleVisionAsync(
                    httpClientFactory,
                    "https://api.mistral.ai/v1/chat/completions",
                    mistralKey,
                    "pixtral-large-latest",
                    processedDataUri,
                    systemPrompt);
                if (!string.IsNullOrWhiteSpace(rawResult)) break;

                rawResult = await TryCallOpenAiCompatibleVisionAsync(
                    httpClientFactory,
                    "https://api.mistral.ai/v1/chat/completions",
                    mistralKey,
                    "pixtral-12b-2409",
                    processedDataUri,
                    systemPrompt);
                if (!string.IsNullOrWhiteSpace(rawResult)) break;
            }

            // 2. Fallback qua Google Gemini Vision (gemini-2.0-flash)
            if (string.IsNullOrWhiteSpace(rawResult))
            {
                foreach (var geminiKey in GetKeyList("GOOGLE_API_KEY", "GEMINI_API_KEY", "GoogleGemini").Take(2))
                {
                    rawResult = await TryCallGeminiVisionAsync(httpClientFactory, geminiKey, mimeType, base64Data, systemPrompt);
                    if (!string.IsNullOrWhiteSpace(rawResult)) break;
                }
            }

            // 3. Fallback qua Groq Vision (Llama-4 Scout Multimodal)
            if (string.IsNullOrWhiteSpace(rawResult))
            {
                foreach (var groqKey in GetKeyList("GROQ_API_KEY", "Groq").Take(2))
                {
                    rawResult = await TryCallOpenAiCompatibleVisionAsync(
                        httpClientFactory,
                        "https://api.groq.com/openai/v1/chat/completions",
                        groqKey,
                        "meta-llama/llama-4-scout-17b-16e-instruct",
                        processedDataUri,
                        systemPrompt);
                    if (!string.IsNullOrWhiteSpace(rawResult)) break;
                }
            }

            // 4. Fallback qua OpenAI Vision (gpt-4o-mini)
            if (string.IsNullOrWhiteSpace(rawResult))
            {
                foreach (var openAiKey in GetKeyList("OPENAI_API_KEY", "OpenAI").Take(2))
                {
                    rawResult = await TryCallOpenAiCompatibleVisionAsync(
                        httpClientFactory,
                        "https://api.openai.com/v1/chat/completions",
                        openAiKey,
                        "gpt-4o-mini",
                        processedDataUri,
                        systemPrompt);
                    if (!string.IsNullOrWhiteSpace(rawResult)) break;
                }
            }

            var cleaned = NormalizeVisionLatexOutput(rawResult);
            if (!string.IsNullOrWhiteSpace(cleaned))
            {
                VisionFormulaCache[hashKey] = cleaned;
                return cleaned == "IMAGE_KEEP" ? null : cleaned;
            }

            return null;
        }

        private static async Task<string?> TryCallGeminiVisionAsync(
            IHttpClientFactory httpClientFactory,
            string apiKey,
            string mimeType,
            string base64Data,
            string prompt)
        {
            try
            {
                var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}";
                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new object[]
                            {
                                new { text = prompt },
                                new { inline_data = new { mime_type = mimeType, data = base64Data } }
                            }
                        }
                    },
                    generationConfig = new { temperature = 0.0, maxOutputTokens = 512 }
                };

                using var client = httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(8);
                using var req = new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
                };
                using var resp = await client.SendAsync(req);
                if (!resp.IsSuccessStatusCode) return null;
                var body = await resp.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(body);
                return doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();
            }
            catch
            {
                return null;
            }
        }

        private static async Task<string?> TryCallOpenAiCompatibleVisionAsync(
            IHttpClientFactory httpClientFactory,
            string endpoint,
            string apiKey,
            string model,
            string imageDataUri,
            string prompt)
        {
            try
            {
                var payload = new
                {
                    model,
                    temperature = 0.0,
                    max_tokens = 512,
                    messages = new[]
                    {
                        new
                        {
                            role = "user",
                            content = new object[]
                            {
                                new { type = "text", text = prompt },
                                new { type = "image_url", image_url = new { url = imageDataUri } }
                            }
                        }
                    }
                };

                using var client = httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(8);
                using var req = new HttpRequestMessage(HttpMethod.Post, endpoint)
                {
                    Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
                };
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                using var resp = await client.SendAsync(req);
                if (!resp.IsSuccessStatusCode) return null;
                var body = await resp.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(body);
                return doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();
            }
            catch
            {
                return null;
            }
        }

        private static string? NormalizeVisionLatexOutput(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            var s = raw.Trim();
            if (s.Contains("IMAGE_KEEP", StringComparison.OrdinalIgnoreCase)) return "IMAGE_KEEP";
            s = Regex.Replace(s, @"^```(?:latex|tex)?\s*", "", RegexOptions.IgnoreCase);
            s = Regex.Replace(s, @"\s*```$", "");
            s = s.Trim();
            if (string.IsNullOrWhiteSpace(s)) return null;

            // Áp dụng toàn bộ chuỗi chuẩn hóa hậu kỳ của bộ đọc .docx (Vector \overrightarrow, Góc \widehat, Hệ phương trình \begin{cases}, Lượng giác, UPMP v2.0)
            var normalized = MtefToLatexConverter.NormalizeToDocxStandardLatex(s);
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }

        private static byte[]? TryParseHex(string rawHex)
        {
            var chars = rawHex.Where(Uri.IsHexDigit).ToArray();
            if (chars.Length < 64) return null;
            int len = chars.Length / 2;
            var bytes = new byte[len];
            for (int i = 0; i < len; i++)
            {
                bytes[i] = Convert.ToByte(new string(chars, i * 2, 2), 16);
            }
            return bytes;
        }

        private static string ComputeSha256(string input)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes);
        }
    }
}
