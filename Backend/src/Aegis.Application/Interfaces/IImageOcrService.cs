using System.Threading;
using System.Threading.Tasks;

namespace Aegis.Application.Interfaces
{
    public sealed class ImageOcrResultDto
    {
        public string MarkdownText { get; set; } = string.Empty;
        public string Provider { get; set; } = "none"; // vision-ai | tesseract-local | none
        public bool Success => !string.IsNullOrWhiteSpace(MarkdownText);
    }

    /// <summary>
    /// Hybrid Document OCR Engine (Multimodal Vision AI + Local Tesseract 5 LSTM vie+eng)
    /// with SkiaSharp preprocessing and Unicode NFC normalization.
    /// </summary>
    public interface IImageOcrService
    {
        Task<ImageOcrResultDto> RecognizeDocumentAsync(
            byte[] imageBytes,
            string mimeType = "image/png",
            CancellationToken ct = default);
    }
}
