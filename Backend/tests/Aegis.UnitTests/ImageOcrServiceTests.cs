using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Infrastructure.Services;
using Microsoft.Extensions.Logging.Abstractions;
using SkiaSharp;
using Xunit;

namespace Aegis.UnitTests
{
    public class ImageOcrServiceTests
    {
        private sealed class FakeDoclingHandler : HttpMessageHandler
        {
            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                var payload = "{\"markdown\":\"# Đề Toán THPT\\n\\n![Hình 1](data:image/png;base64,iVBORw0KGgo=)\\n\\n| Câu | Đáp án |\\n|---|---|\\n| 1 | A |\",\"engine\":\"ibm-docling\"}";
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(payload, Encoding.UTF8, "application/json")
                });
            }
        }

        [Fact]
        public void PreprocessImageForOcr_Upscales_Small_Image_And_Produces_Valid_Png()
        {
            using var bmp = new SKBitmap(300, 100);
            using (var canvas = new SKCanvas(bmp))
            {
                canvas.Clear(SKColors.White);
                using var paint = new SKPaint { Color = SKColors.Black, TextSize = 24 };
                canvas.DrawText("Toan 12", 20, 50, paint);
            }
            using var img = SKImage.FromBitmap(bmp);
            using var data = img.Encode(SKEncodedImageFormat.Png, 100);
            byte[] raw = data.ToArray();

            byte[] processed = ImageOcrService.PreprocessImageForOcr(raw);
            using var decoded = SKBitmap.Decode(processed);

            Assert.NotNull(decoded);
            Assert.True(decoded!.Width > 300);
        }

        [Fact]
        public async Task RecognizeDocumentAsync_Handles_Empty_Bytes_Gracefully()
        {
            var service = new ImageOcrService(NullLogger<ImageOcrService>.Instance);
            var res = await service.RecognizeDocumentAsync(System.Array.Empty<byte>());

            Assert.False(res.Success);
            Assert.Equal("none", res.Provider);
        }

        [Fact]
        public async Task RecognizeDocumentAsync_Uses_Docling_Tier0_Preserving_Unicode_Tables_And_Images()
        {
            using var http = new HttpClient(new FakeDoclingHandler());
            var service = new ImageOcrService(
                NullLogger<ImageOcrService>.Instance,
                httpClient: http,
                doclingUrlOverride: "http://docling-ocr:8002/ocr");

            byte[] fakeImg = new byte[64];
            fakeImg[0] = 0x89;
            fakeImg[1] = 0x50;

            var res = await service.RecognizeDocumentAsync(fakeImg, "image/png");

            Assert.True(res.Success);
            Assert.Equal("ibm-docling", res.Provider);
            Assert.Contains("Đề Toán THPT", res.MarkdownText);
            Assert.Contains("data:image/png;base64", res.MarkdownText);
            Assert.Contains("| Câu | Đáp án |", res.MarkdownText);
        }
    }
}
