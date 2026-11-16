using System;
using System.Net.Http;
using System.Threading.Tasks;
using Aegis.Application.Models.AI;
using Aegis.Infrastructure.AI.Adapters;
using Xunit;

namespace Aegis.UnitTests
{
    public class SimpleHttpClientFactory : IHttpClientFactory
    {
        private readonly HttpClient _client = new HttpClient();
        public HttpClient CreateClient(string name) => _client;
    }

    public class DualLocalAiTests
    {
        [Fact]
        public void WellKnownAiProviders_FromCode_ShouldResolveLocalDeepSeekToLocalOllama()
        {
            var providerType = WellKnownAiProviders.FromCode("deepseek-r1-local");
            Assert.Equal(AiProviderType.LocalOllama, providerType);

            var cloudDeepSeek = WellKnownAiProviders.FromCode("deepseek-chat");
            Assert.Equal(AiProviderType.DeepSeek, cloudDeepSeek);

            var qwenLocal = WellKnownAiProviders.FromCode("qwen2.5-local");
            Assert.Equal(AiProviderType.LocalOllama, qwenLocal);
        }

        [Fact]
        public async Task LocalOllamaAdapter_WithDeepSeekR1_ShouldReturnCoTReasoning()
        {
            var factory = new SimpleHttpClientFactory();
            var adapter = new LocalOllamaAdapter(factory);

            var result = await adapter.CallAsync(
                apiKey: "local",
                model: "deepseek-r1:7b",
                prompt: "Cho hình chóp S.ABCD có đáy là hình vuông. Tính thể tích khối chóp.",
                systemPrompt: "Bạn là chuyên gia hình học không gian.",
                temperature: 0.2,
                maxTokens: 1024);

            Assert.True(result.Success);
            Assert.NotNull(result.Content);
            Assert.Contains("<think>", result.Content);
            Assert.Contains("DeepSeek-R1", result.Content);
        }

        [Fact]
        public async Task LocalOllamaAdapter_WithQwen25_ShouldReturnFastResponse()
        {
            var factory = new SimpleHttpClientFactory();
            var adapter = new LocalOllamaAdapter(factory);

            var result = await adapter.CallAsync(
                apiKey: "local",
                model: "qwen2.5:3b",
                prompt: "Chào bạn, hãy tóm tắt nội dung bài học.",
                systemPrompt: null,
                temperature: 0.3,
                maxTokens: 512);

            Assert.True(result.Success);
            Assert.NotNull(result.Content);
            Assert.Contains("Qwen 2.5", result.Content);
        }
    }
}
