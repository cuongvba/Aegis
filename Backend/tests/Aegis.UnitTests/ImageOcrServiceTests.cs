using System.IO;
using System.Threading.Tasks;
using Aegis.Infrastructure.Services;
using Microsoft.Extensions.Logging.Abstractions;
using SkiaSharp;
using Xunit;

namespace Aegis.UnitTests
{
    public class ImageOcrServiceTests
    {
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
            Assert.True(decoded!.Width > 300); // Auto-upscaled for sharp Tesseract recognition
        }

        [Fact]
        public async Task RecognizeDocumentAsync_Handles_Empty_Bytes_Gracefully()
        {
            var service = new ImageOcrService(NullLogger<ImageOcrService>.Instance);
            var res = await service.RecognizeDocumentAsync(System.Array.Empty<byte>());

            Assert.False(res.Success);
            Assert.Equal("none", res.Provider);
        }
    }
}
