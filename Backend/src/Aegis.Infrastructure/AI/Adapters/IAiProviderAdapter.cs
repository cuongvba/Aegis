using System;
using System.Threading.Tasks;
using Aegis.Application.Models.AI;

namespace Aegis.Infrastructure.AI.Adapters
{
    public interface IAiProviderAdapter
    {
        AiProviderType ProviderType { get; }
        string ProviderCode => ProviderType.ToString().ToLowerInvariant();
        string DefaultModel { get; }

        Task<(bool Success, string Content, string? Error, long DurationMs)> CallAsync(
            string apiKey,
            string? model,
            string prompt,
            string? systemPrompt,
            double temperature,
            int maxTokens,
            string? customEndpoint = null);
    }
}
