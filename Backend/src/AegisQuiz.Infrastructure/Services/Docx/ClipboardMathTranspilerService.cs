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

namespace AegisQuiz.Infrastructure.Services.Docx
{
    /// <summary>
    /// [Aegis Tri-Tier Clipboard MathType-to-LaTeX Transpiler Service]
    /// 1. Tier 1 (0ms Deterministic AST): Giải mã trực tiếp luồng nhị phân MTEF v5 (\objdata & \wmetafile8 từ RTF Clipboard) qua MtefToLatexConverter & MathTypeWmfEngine.
    /// 2. Tier 2 (0ms Local WMZ/WMF): Giải nén tệp tạm .wmz/.wmf từ Word Clipboard (nếu cùng máy chủ/môi trường cục bộ).
    /// 3. Tier 3 (Multimodal Vision Math OCR): Chuyển đổi ảnh bitmap công thức MathType (PNG/WebP) sang chuẩn LaTeX ($...$) có bộ nhớ đệm SHA-256.
    /// </summary>
    public static class ClipboardMathTranspilerService
    {
        private static readonly ConcurrentDictionary<string, string> VisionFormulaCache = new(StringComparer.Ordinal);

        public static List<string> DecodeRtfHexChunksToLatex(IEnumerable<string>? hexChunks)
        {
            var results = new List<string>();
            if (hexChunks == null) return results;

            foreach (var rawHex in hexChunks)
            {
                if (string.IsNullOrWhiteSpace(rawHex)) continue;
                var bytes = TryParseHex(rawHex);
                if (bytes == null || bytes.Length < 32) continue;

                if (TryDecodeBinaryMathBytes(bytes, out var latex))
                {
                    results.Add(latex);
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

            // 1. Ưu tiên giải mã cây AST MTEF v5 (hỗ trợ cả WMF 'Design Science, Inc.' và OLE 'EQNOLEFILEHDR')
            if (MtefToLatexConverter.TryConvert(bytes, out var mtefLatex) && !string.IsNullOrWhiteSpace(mtefLatex))
            {
                latex = mtefLatex;
                return true;
            }

            // 2. Fallback qua bộ giải mã tọa độ GDI WMF -> LaTeX
            if (MathTypeWmfEngine.TryExtractSimpleMathText(bytes, out var wmfLatex) && !string.IsNullOrWhiteSpace(wmfLatex))
            {
                latex = wmfLatex;
                return true;
            }

            return false;
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
            var base64Data = imageDataUri[(commaIdx + 1)..].Trim();
            var mimeMatch = Regex.Match(header, @"data:(image/[a-zA-Z0-9.+_-]+)", RegexOptions.IgnoreCase);
            var mimeType = mimeMatch.Success ? mimeMatch.Groups[1].Value : "image/png";

            // Tra cứu Cache SHA-256 (0ms nếu công thức đã từng được dán)
            var hashKey = ComputeSha256(base64Data);
            if (VisionFormulaCache.TryGetValue(hashKey, out var cached))
            {
                return cached == "IMAGE_KEEP" ? null : cached;
            }

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
                "You are a precision MathType-to-LaTeX OCR engine. " +
                "If the image contains a mathematical or chemical formula, equation, expression, system of equations, or matrix, " +
                "output ONLY the pure LaTeX formula wrapped in $...$ (for example: $\\frac{-b \\pm \\sqrt{\\Delta}}{2a}$ or $\\int_{0}^{1} x^2 dx$). " +
                "Do NOT include markdown code blocks, backticks, or explanations. " +
                "If the image is a geometric figure, graph/chart, or general illustration picture that cannot be represented purely as LaTeX, output EXACTLY: IMAGE_KEEP";

            string? rawResult = null;

            // 1. Thử qua Google Gemini Vision (gemini-2.0-flash) xoay vòng qua bể khóa
            foreach (var geminiKey in GetKeyList("GOOGLE_API_KEY", "GEMINI_API_KEY", "GoogleGemini").Take(3))
            {
                rawResult = await TryCallGeminiVisionAsync(httpClientFactory, geminiKey, mimeType, base64Data, systemPrompt);
                if (!string.IsNullOrWhiteSpace(rawResult)) break;
            }

            // 2. Fallback qua Groq Vision (Llama-4 Scout Multimodal)
            if (string.IsNullOrWhiteSpace(rawResult))
            {
                foreach (var groqKey in GetKeyList("GROQ_API_KEY", "Groq").Take(2))
                {
                    rawResult = await TryCallOpenAiCompatibleVisionAsync(
                        httpClientFactory,
                        "https://api.groq.com/openai/v1/chat/completions",
                        groqKey,
                        "meta-llama/llama-4-scout-17b-16e-instruct",
                        imageDataUri,
                        systemPrompt);
                    if (!string.IsNullOrWhiteSpace(rawResult)) break;
                }
            }

            // 3. Fallback qua Mistral Pixtral Vision (pixtral-12b-2409)
            if (string.IsNullOrWhiteSpace(rawResult))
            {
                foreach (var mistralKey in GetKeyList("MISTRAL_API_KEY", "Mistral").Take(2))
                {
                    rawResult = await TryCallOpenAiCompatibleVisionAsync(
                        httpClientFactory,
                        "https://api.mistral.ai/v1/chat/completions",
                        mistralKey,
                        "pixtral-12b-2409",
                        imageDataUri,
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
                        imageDataUri,
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
            if (!s.StartsWith("$")) s = $"${s.Trim('$')}$";
            return s;
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
