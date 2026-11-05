using System;
using System.IO;
using AegisQuiz.Infrastructure.Services.Docx;
using Xunit;

namespace AegisQuiz.UnitTests
{
    public class MtefConversionTests
    {
        [Fact]
        public void Convert_Image122_ShouldExtractFractionWithRadical()
        {
            // image122.wmf: (a\sqrt{b})/c dm^3
            string path = Path.Combine(AppContext.BaseDirectory, "image122.wmf");
            if (!File.Exists(path))
            {
                // Fallback to project dir
                path = Path.GetFullPath("../../../image122.wmf");
            }

            Assert.True(File.Exists(path), $"File image122.wmf not found at {path}");
            byte[] bytes = File.ReadAllBytes(path);

            bool success = MtefToLatexConverter.TryConvert(bytes, out string katex);

            Assert.True(success, "MtefToLatexConverter failed to convert image122.wmf");
            Assert.StartsWith("$", katex);
            Assert.EndsWith("$", katex);
            Assert.Contains(@"\frac", katex);
            Assert.Contains(@"\sqrt", katex);
        }

        [Fact]
        public void Convert_Image12_ShouldExtractTrigFunction()
        {
            // image12.wmf: sin x = ...
            string path = Path.Combine(AppContext.BaseDirectory, "image12.wmf");
            if (!File.Exists(path))
            {
                path = Path.GetFullPath("../../../image12.wmf");
            }

            Assert.True(File.Exists(path), $"File image12.wmf not found at {path}");
            byte[] bytes = File.ReadAllBytes(path);

            bool success = MtefToLatexConverter.TryConvert(bytes, out string katex);

            Assert.True(success, "MtefToLatexConverter failed to convert image12.wmf");
            Assert.StartsWith("$", katex);
            Assert.EndsWith("$", katex);
            Assert.Contains(@"\sin", katex);
        }

        [Fact]
        public void Convert_Image34_ShouldExtractCoordinates()
        {
            string path = Path.Combine(AppContext.BaseDirectory, "image34.wmf");
            if (!File.Exists(path)) path = Path.GetFullPath("../../../image34.wmf");

            if (File.Exists(path))
            {
                byte[] bytes = File.ReadAllBytes(path);
                bool success = MtefToLatexConverter.TryConvert(bytes, out string katex);
                Assert.True(success);
                Assert.StartsWith("$", katex);
                Assert.EndsWith("$", katex);
            }
        }

        [Fact]
        public void Convert_Image121_ShouldConvertProperly()
        {
            string path = Path.Combine(AppContext.BaseDirectory, "image121.wmf");
            if (!File.Exists(path)) path = Path.GetFullPath("../../../image121.wmf");

            if (File.Exists(path))
            {
                byte[] bytes = File.ReadAllBytes(path);
                bool success = MtefToLatexConverter.TryConvert(bytes, out string katex);
                Assert.True(success);
                Assert.StartsWith("$", katex);
                Assert.EndsWith("$", katex);
            }
        }

        [Fact]
        public void Convert_CubicPolynomialOptions_ShouldNotSwallowSucceedingTerms()
        {
            var deToanPath = @"D:\Cuong\DuAn\mybank\2026-TNPT\DeToan.docx";
            if (!File.Exists(deToanPath)) return;

            using var archive = System.IO.Compression.ZipFile.OpenRead(deToanPath);
            var entry2 = archive.GetEntry("word/media/image2.wmf");
            Assert.NotNull(entry2);
            using var ms = new MemoryStream();
            using var s = entry2.Open();
            s.CopyTo(ms);
            byte[] bytes = ms.ToArray();

            bool success = MtefToLatexConverter.TryConvert(bytes, out string katex);
            Assert.True(success);
            Assert.Equal("$y=x^{3}-6x+2$", katex);
            Assert.DoesNotContain("3-6x", katex);
        }

        [Fact]
        public void Convert_NullOrInvalidBytes_ShouldReturnFalseSafely()
        {
            Assert.False(MtefToLatexConverter.TryConvert(null, out _));
            Assert.False(MtefToLatexConverter.TryConvert(new byte[10], out _));
            Assert.False(MtefToLatexConverter.TryConvert(new byte[100], out _));
        }

        [Fact]
        public void Clipboard_DecodeRtfHexChunks_ShouldMatchDocxWmfAndOleDsmtIdentically()
        {
            string path = Path.Combine(AppContext.BaseDirectory, "image122.wmf");
            if (!File.Exists(path)) path = Path.GetFullPath("../../../image122.wmf");
            Assert.True(File.Exists(path));

            byte[] wmfBytes = File.ReadAllBytes(path);
            Assert.True(MtefToLatexConverter.TryConvert(wmfBytes, out string expectedDocxLatex));

            // 1. Kiểm thử gói kép "WMF_HEX|OBJDATA_HEX" trích xuất từ RTF Clipboard
            string wmfHex = Convert.ToHexString(wmfBytes);
            var decodedList = ClipboardMathTranspilerService.DecodeRtfHexChunksToLatex(new[] { $"{wmfHex}|00112233" });
            Assert.Single(decodedList);
            Assert.Equal(expectedDocxLatex, decodedList[0]);

            // 2. Kiểm thử khối OLE \objdata chỉ chứa chữ ký 'DSMT7' mà không có header 'Design Science, Inc.'
            int dsmtIdx = -1;
            for (int i = 5; i < wmfBytes.Length - 5; i++)
            {
                if (wmfBytes[i] == 'D' && wmfBytes[i + 1] == 'S' && wmfBytes[i + 2] == 'M' && wmfBytes[i + 3] == 'T')
                {
                    dsmtIdx = i;
                    break;
                }
            }
            Assert.True(dsmtIdx >= 5);

            // Tạo luồng giả lập OLE2 Compound File Binary (không có chuỗi 'Design Science, Inc.') chứa MTEF bắt đầu từ dsmtIdx - 5
            int mtefLen = wmfBytes.Length - (dsmtIdx - 5);
            byte[] simulatedOleBytes = new byte[64 + mtefLen];
            Array.Copy(wmfBytes, dsmtIdx - 5, simulatedOleBytes, 64, mtefLen);

            string oleHex = Convert.ToHexString(simulatedOleBytes);
            var oleDecoded = ClipboardMathTranspilerService.DecodeRtfHexChunksToLatex(new[] { oleHex });
            Assert.Single(oleDecoded);
            Assert.Equal(expectedDocxLatex, oleDecoded[0]);
        }

        [Fact]
        public void Clipboard_NormalizeToDocxStandardLatex_ShouldApplyAllDocxRules()
        {
            string norm1 = MtefToLatexConverter.NormalizeToDocxStandardLatex(@"$$\vec{AB} + \hat{ABC} = \sin x$$");
            Assert.Equal(@"$\overrightarrow{AB} + \widehat{ABC} = \sin x$", norm1);

            string norm2 = MtefToLatexConverter.NormalizeToDocxStandardLatex(@"\angle MNP = 90^\circ");
            Assert.Contains(@"\widehat{MNP}", norm2);
        }

        [Fact]
        public void Clipboard_PreprocessFormulaImageForOcr_ShouldFlattenTransparentPngToWhiteAndUpscale()
        {
            // Tạo ảnh PNG 60x24 có chữ đen (#000000) trên nền trong suốt Alpha=0 (giống hệt ảnh PNG khi copy hộp MathType từ Word)
            using var bmp = new SkiaSharp.SKBitmap(60, 24, SkiaSharp.SKColorType.Rgba8888, SkiaSharp.SKAlphaType.Premul);
            bmp.Erase(SkiaSharp.SKColors.Transparent);
            bmp.SetPixel(30, 12, new SkiaSharp.SKColor(0, 0, 0, 255));

            using var img = SkiaSharp.SKImage.FromBitmap(bmp);
            using var data = img.Encode(SkiaSharp.SKEncodedImageFormat.Png, 100);
            string rawB64 = Convert.ToBase64String(data.ToArray());
            string rawUri = $"data:image/png;base64,{rawB64}";

            var (mime, outB64, _) = ClipboardMathTranspilerService.PreprocessFormulaImageForOcr("image/png", rawB64, rawUri);
            Assert.Equal("image/png", mime);

            byte[] outBytes = Convert.FromBase64String(outB64);
            using var outBmp = SkiaSharp.SKBitmap.Decode(outBytes);
            Assert.NotNull(outBmp);
            // Đã được phóng đại (upscale) và thêm lề trắng 28px mỗi bên
            Assert.True(outBmp.Width > 150);
            Assert.True(outBmp.Height > 80);

            // Điểm ảnh góc (0, 0) bắt buộc là màu trắng tinh khiết (#FFFFFF), không bao giờ bị đen (#000000)
            var corner = outBmp.GetPixel(0, 0);
            Assert.Equal(255, corner.Red);
            Assert.Equal(255, corner.Green);
            Assert.Equal(255, corner.Blue);
            Assert.Equal(255, corner.Alpha);
        }
    }
}
