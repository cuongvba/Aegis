using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.WebSockets;
using System.Security;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Aegis.Infrastructure.Services
{
    /// <summary>
    /// Multi-provider Neural TTS service for Aegis Kids World.
    /// Tier 1: OpenAI-compatible TTS endpoint (Kokoro-FastAPI, Piper, OpenAI, ElevenLabs proxy) via AEGIS_TTS_ENDPOINT.
    /// Tier 2: Built-in Edge Neural TTS WebSocket (100+ locales, zero API key required) with SHA-256 MP3 cache.
    /// </summary>
    public class KidsVoiceService : IKidsVoiceService
    {
        private const string TrustedClientToken = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
        private const string SecMsGecVersion = "1-143.0.3650.75";
        private const long WindowsFileTimeEpochTicks = 11644473600L * 10_000_000L;
        private const int MaxCacheEntries = 500;

        private static readonly ConcurrentDictionary<string, KidsTtsResultDto> AudioCache = new(StringComparer.Ordinal);
        private static readonly Regex EmojiStripRegex = new(@"[\p{Cs}\u2600-\u27BF\uFE0F]", RegexOptions.Compiled);
        private static readonly HttpClient SharedHttp = new() { Timeout = TimeSpan.FromSeconds(12) };

        private static readonly List<KidsVoiceProfileDto> CuratedVoices = new()
        {
            new() { VoiceId = "vi-VN-HoaiMyNeural", DisplayName = "Cô Hoài Mỹ (Ấm áp kể chuyện)", LocaleCode = "vi-VN", Gender = "Female", Persona = "Storyteller", Provider = "edge-neural" },
            new() { VoiceId = "vi-VN-NamMinhNeural", DisplayName = "Chú Nam Minh (Sử thi hào hùng)", LocaleCode = "vi-VN", Gender = "Male", Persona = "Heroic", Provider = "edge-neural" },
            new() { VoiceId = "en-US-AnaNeural", DisplayName = "Ana (Cute Kid Storyteller)", LocaleCode = "en-US", Gender = "Female", Persona = "Kid", Provider = "edge-neural" },
            new() { VoiceId = "en-US-JennyNeural", DisplayName = "Ms. Jenny (Warm Teacher)", LocaleCode = "en-US", Gender = "Female", Persona = "Teacher", Provider = "edge-neural" },
            new() { VoiceId = "en-US-AndrewNeural", DisplayName = "Mr. Andrew (Heroic Narrator)", LocaleCode = "en-US", Gender = "Male", Persona = "Heroic", Provider = "edge-neural" },
            new() { VoiceId = "en-GB-SoniaNeural", DisplayName = "Ms. Sonia (British Warm)", LocaleCode = "en-GB", Gender = "Female", Persona = "Storyteller", Provider = "edge-neural" },
            new() { VoiceId = "ja-JP-NanamiNeural", DisplayName = "Nanami (優しい声)", LocaleCode = "ja-JP", Gender = "Female", Persona = "Storyteller", Provider = "edge-neural" },
            new() { VoiceId = "ja-JP-KeitaNeural", DisplayName = "Keita (元気な声)", LocaleCode = "ja-JP", Gender = "Male", Persona = "Heroic", Provider = "edge-neural" },
            new() { VoiceId = "ko-KR-SunHiNeural", DisplayName = "SunHi (따뜻한 선생님)", LocaleCode = "ko-KR", Gender = "Female", Persona = "Storyteller", Provider = "edge-neural" },
            new() { VoiceId = "ko-KR-InJoonNeural", DisplayName = "InJoon (이야기꾼)", LocaleCode = "ko-KR", Gender = "Male", Persona = "Heroic", Provider = "edge-neural" },
            new() { VoiceId = "zh-CN-XiaoxiaoNeural", DisplayName = "晓晓 (温暖故事姐姐)", LocaleCode = "zh-CN", Gender = "Female", Persona = "Storyteller", Provider = "edge-neural" },
            new() { VoiceId = "zh-CN-YunxiNeural", DisplayName = "云希 (阳光哥哥)", LocaleCode = "zh-CN", Gender = "Male", Persona = "Kid", Provider = "edge-neural" },
            new() { VoiceId = "fr-FR-DeniseNeural", DisplayName = "Denise (Conteuse)", LocaleCode = "fr-FR", Gender = "Female", Persona = "Storyteller", Provider = "edge-neural" },
            new() { VoiceId = "es-ES-ElviraNeural", DisplayName = "Elvira (Cuentacuentos)", LocaleCode = "es-ES", Gender = "Female", Persona = "Storyteller", Provider = "edge-neural" },
            new() { VoiceId = "de-DE-KatjaNeural", DisplayName = "Katja (Märchenerzählerin)", LocaleCode = "de-DE", Gender = "Female", Persona = "Storyteller", Provider = "edge-neural" },
            new() { VoiceId = "th-TH-PremwadeeNeural", DisplayName = "เปรมวดี (นิทานแสนสนุก)", LocaleCode = "th-TH", Gender = "Female", Persona = "Storyteller", Provider = "edge-neural" },
            new() { VoiceId = "id-ID-GadisNeural", DisplayName = "Gadis (Kakak Dongeng)", LocaleCode = "id-ID", Gender = "Female", Persona = "Storyteller", Provider = "edge-neural" },
            new() { VoiceId = "pt-BR-FranciscaNeural", DisplayName = "Francisca (Contadora)", LocaleCode = "pt-BR", Gender = "Female", Persona = "Storyteller", Provider = "edge-neural" },
            new() { VoiceId = "ru-RU-SvetlanaNeural", DisplayName = "Светлана (Сказочница)", LocaleCode = "ru-RU", Gender = "Female", Persona = "Storyteller", Provider = "edge-neural" },
            new() { VoiceId = "ar-SA-ZariyahNeural", DisplayName = "زارية (راوية القصص)", LocaleCode = "ar-SA", Gender = "Female", Persona = "Storyteller", Provider = "edge-neural" }
        };

        private readonly ILogger<KidsVoiceService> _logger;

        public KidsVoiceService(ILogger<KidsVoiceService> logger)
        {
            _logger = logger;
        }

        public IReadOnlyList<KidsVoiceProfileDto> GetVoices(string? localeCode = null)
        {
            if (string.IsNullOrWhiteSpace(localeCode))
                return CuratedVoices;

            string norm = NormalizeLocale(localeCode);
            string langPrefix = norm.Split('-')[0];

            var exact = CuratedVoices
                .Where(v => string.Equals(v.LocaleCode, norm, StringComparison.OrdinalIgnoreCase))
                .ToList();
            if (exact.Count > 0) return exact;

            var prefixMatches = CuratedVoices
                .Where(v => v.LocaleCode.StartsWith(langPrefix + "-", StringComparison.OrdinalIgnoreCase))
                .ToList();
            return prefixMatches.Count > 0 ? prefixMatches : CuratedVoices;
        }

        public async Task<byte[]?> SynthesizeSpeechAsync(KidsTtsRequestDto request, CancellationToken ct = default)
        {
            var res = await SynthesizeSpeechWithMetaAsync(request, ct);
            return res?.AudioBytes;
        }

        public async Task<KidsTtsResultDto?> SynthesizeSpeechWithMetaAsync(KidsTtsRequestDto request, CancellationToken ct = default)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Text))
                return null;

            string cleanText = EmojiStripRegex.Replace(request.Text, " ").Trim();
            cleanText = Regex.Replace(cleanText, @"\s+", " ");
            if (string.IsNullOrWhiteSpace(cleanText))
                return null;
            if (cleanText.Length > 600)
                cleanText = cleanText.Substring(0, 600);

            string locale = NormalizeLocale(request.LocaleCode);
            string voiceId = ResolveVoiceId(request.VoiceId, locale);
            string rate = string.IsNullOrWhiteSpace(request.Rate) ? "-4%" : request.Rate.Trim();
            string pitch = string.IsNullOrWhiteSpace(request.Pitch) ? "+2Hz" : request.Pitch.Trim();

            string cacheKey = ComputeCacheKey($"{voiceId}|{rate}|{pitch}|{cleanText}");
            if (AudioCache.TryGetValue(cacheKey, out var cached))
                return cached;

            // Tier 1: Optional OpenAI-compatible / Kokoro / Piper TTS endpoint
            string? customEndpoint = Environment.GetEnvironmentVariable("AEGIS_TTS_ENDPOINT");
            if (!string.IsNullOrWhiteSpace(customEndpoint))
            {
                var customBytes = await TryOpenAiCompatibleTtsAsync(customEndpoint, cleanText, voiceId, ct);
                if (customBytes != null && customBytes.Length > 0)
                {
                    var result = new KidsTtsResultDto { AudioBytes = customBytes, Provider = "openai-tts" };
                    CacheAudio(cacheKey, result);
                    return result;
                }
            }

            // Tier 2: Built-in Edge Neural TTS WebSocket
            var edgeBytes = await TryEdgeNeuralTtsAsync(cleanText, locale, voiceId, rate, pitch, ct);
            if (edgeBytes != null && edgeBytes.Length > 0)
            {
                var result = new KidsTtsResultDto { AudioBytes = edgeBytes, Provider = "edge-neural" };
                CacheAudio(cacheKey, result);
                return result;
            }

            // Tier 3: Zero-key Multilingual Google TTS fallback (supports 100+ languages)
            var googleBytes = await TryGoogleTtsAsync(cleanText, locale, ct);
            if (googleBytes != null && googleBytes.Length > 0)
            {
                var result = new KidsTtsResultDto { AudioBytes = googleBytes, Provider = "google-tts" };
                CacheAudio(cacheKey, result);
                return result;
            }

            return null;
        }

        private async Task<byte[]?> TryOpenAiCompatibleTtsAsync(
            string endpoint,
            string text,
            string voiceId,
            CancellationToken ct)
        {
            try
            {
                string url = endpoint.TrimEnd('/');
                if (!url.EndsWith("/audio/speech", StringComparison.OrdinalIgnoreCase))
                    url += "/v1/audio/speech";

                string model = Environment.GetEnvironmentVariable("AEGIS_TTS_MODEL") ?? "tts-1";
                string? apiKey = Environment.GetEnvironmentVariable("AEGIS_TTS_API_KEY");
                string mappedVoice = Environment.GetEnvironmentVariable("AEGIS_TTS_VOICE") ?? voiceId;

                using var msg = new HttpRequestMessage(HttpMethod.Post, url);
                if (!string.IsNullOrWhiteSpace(apiKey))
                    msg.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

                msg.Content = new StringContent(
                    JsonSerializer.Serialize(new { model, input = text, voice = mappedVoice, response_format = "mp3" }),
                    Encoding.UTF8,
                    "application/json");

                using var res = await SharedHttp.SendAsync(msg, ct);
                if (!res.IsSuccessStatusCode) return null;
                return await res.Content.ReadAsByteArrayAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "[KidsVoice] Custom TTS endpoint fallback to Edge Neural");
                return null;
            }
        }

        private async Task<byte[]?> TryEdgeNeuralTtsAsync(
            string text,
            string locale,
            string voiceId,
            string rate,
            string pitch,
            CancellationToken ct)
        {
            try
            {
                string connId = Guid.NewGuid().ToString("N");
                string secMsGec = GenerateSecMsGec();
                string wsUrl = $"wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken={TrustedClientToken}&Sec-MS-GEC={secMsGec}&Sec-MS-GEC-Version={SecMsGecVersion}&ConnectionId={connId}";

                using var ws = new ClientWebSocket();
                ws.Options.SetRequestHeader("Origin", "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold");
                ws.Options.SetRequestHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0");

                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                timeoutCts.CancelAfter(TimeSpan.FromSeconds(10));

                await ws.ConnectAsync(new Uri(wsUrl), timeoutCts.Token);

                string timestamp = DateTime.UtcNow.ToString("ddd MMM dd yyyy HH:mm:ss 'GMT+0000 (Coordinated Universal Time)'");
                string configMsg =
                    $"X-Timestamp:{timestamp}\r\n" +
                    "Content-Type:application/json; charset=utf-8\r\n" +
                    "Path:speech.config\r\n\r\n" +
                    "{\"context\":{\"synthesis\":{\"audio\":{\"metadataoptions\":{\"sentenceBoundaryEnabled\":\"false\",\"wordBoundaryEnabled\":\"false\"},\"outputFormat\":\"audio-24khz-48kbitrate-mono-mp3\"}}}}";

                await ws.SendAsync(Encoding.UTF8.GetBytes(configMsg), WebSocketMessageType.Text, true, timeoutCts.Token);

                string reqId = Guid.NewGuid().ToString("N");
                string escaped = SecurityElement.Escape(text) ?? text;
                string ssml =
                    $"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='{locale}'>" +
                    $"<voice name='{voiceId}'><prosody pitch='{pitch}' rate='{rate}' volume='+0%'>{escaped}</prosody></voice></speak>";

                string ssmlMsg =
                    $"X-RequestId:{reqId}\r\n" +
                    "Content-Type:application/ssml+xml\r\n" +
                    $"X-Timestamp:{timestamp}Z\r\n" +
                    "Path:ssml\r\n\r\n" +
                    ssml;

                await ws.SendAsync(Encoding.UTF8.GetBytes(ssmlMsg), WebSocketMessageType.Text, true, timeoutCts.Token);

                using var audioStream = new MemoryStream();
                var buffer = new byte[16384];
                while (ws.State == WebSocketState.Open)
                {
                    using var frameStream = new MemoryStream();
                    WebSocketReceiveResult result;
                    do
                    {
                        result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), timeoutCts.Token);
                        if (result.MessageType == WebSocketMessageType.Close)
                            break;
                        frameStream.Write(buffer, 0, result.Count);
                    } while (!result.EndOfMessage);

                    if (result.MessageType == WebSocketMessageType.Close)
                        break;

                    byte[] frame = frameStream.ToArray();
                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        string headerText = Encoding.UTF8.GetString(frame);
                        if (headerText.Contains("Path:turn.end", StringComparison.Ordinal))
                            break;
                    }
                    else if (result.MessageType == WebSocketMessageType.Binary && frame.Length > 2)
                    {
                        int headerLen = (frame[0] << 8) | frame[1];
                        int payloadOffset = 2 + headerLen;
                        if (payloadOffset < frame.Length)
                        {
                            string header = Encoding.ASCII.GetString(frame, 2, headerLen);
                            if (header.Contains("Path:audio", StringComparison.Ordinal))
                                audioStream.Write(frame, payloadOffset, frame.Length - payloadOffset);
                        }
                    }
                }

                return audioStream.Length > 0 ? audioStream.ToArray() : null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[KidsVoice] Edge Neural TTS unavailable for Voice={Voice}", voiceId);
                return null;
            }
        }

        private async Task<byte[]?> TryGoogleTtsAsync(string text, string locale, CancellationToken ct)
        {
            try
            {
                string tl = locale.Equals("zh-CN", StringComparison.OrdinalIgnoreCase)
                    ? "zh-CN"
                    : locale.Split('-')[0].ToLowerInvariant();

                string url = $"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl={Uri.EscapeDataString(tl)}&q={Uri.EscapeDataString(text)}";
                using var msg = new HttpRequestMessage(HttpMethod.Get, url);
                msg.Headers.TryAddWithoutValidation("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36");

                using var res = await SharedHttp.SendAsync(msg, ct);
                if (!res.IsSuccessStatusCode) return null;
                byte[] bytes = await res.Content.ReadAsByteArrayAsync(ct);
                return bytes.Length > 100 ? bytes : null;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "[KidsVoice] Google TTS fallback unavailable for Locale={Locale}", locale);
                return null;
            }
        }

        private static string GenerateSecMsGec()
        {
            long ticks = DateTime.UtcNow.Ticks - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc).Ticks;
            long unixSeconds = ticks / TimeSpan.TicksPerSecond;
            long fileTimeSeconds = unixSeconds + (WindowsFileTimeEpochTicks / 10_000_000L);
            long rounded = fileTimeSeconds - (fileTimeSeconds % 300);
            long ticks100ns = rounded * 10_000_000L;

            byte[] hash = SHA256.HashData(Encoding.ASCII.GetBytes($"{ticks100ns}{TrustedClientToken}"));
            return Convert.ToHexString(hash);
        }

        private static string ResolveVoiceId(string? requestedVoiceId, string locale)
        {
            if (!string.IsNullOrWhiteSpace(requestedVoiceId))
                return requestedVoiceId.Trim();

            var match = CuratedVoices.FirstOrDefault(v => string.Equals(v.LocaleCode, locale, StringComparison.OrdinalIgnoreCase));
            if (match != null) return match.VoiceId;

            string prefix = locale.Split('-')[0];
            var prefixMatch = CuratedVoices.FirstOrDefault(v => v.LocaleCode.StartsWith(prefix + "-", StringComparison.OrdinalIgnoreCase));
            return prefixMatch?.VoiceId ?? "vi-VN-HoaiMyNeural";
        }

        private static string NormalizeLocale(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return "vi-VN";
            string s = raw.Trim();
            if (s.Contains('-')) return s;
            return s.ToLowerInvariant() switch
            {
                "vi" => "vi-VN",
                "en" => "en-US",
                "ja" => "ja-JP",
                "ko" => "ko-KR",
                "zh" => "zh-CN",
                "fr" => "fr-FR",
                "es" => "es-ES",
                "de" => "de-DE",
                "th" => "th-TH",
                "id" => "id-ID",
                "pt" => "pt-BR",
                "ru" => "ru-RU",
                "ar" => "ar-SA",
                _ => "vi-VN"
            };
        }

        private static string ComputeCacheKey(string input)
        {
            byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(hash);
        }

        private static void CacheAudio(string key, KidsTtsResultDto result)
        {
            if (AudioCache.Count >= MaxCacheEntries)
                AudioCache.Clear();
            AudioCache[key] = result;
        }
    }
}
