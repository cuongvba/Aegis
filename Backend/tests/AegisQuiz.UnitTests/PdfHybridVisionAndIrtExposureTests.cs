using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using Xunit;
using AegisQuiz.Application.DTOs;
using AegisQuiz.Infrastructure.Services.Docx;
using AegisQuiz.Infrastructure.Services.Pdf;

namespace AegisQuiz.Tests
{
    public class PdfHybridVisionAndIrtExposureTests
    {
        [Fact]
        public void ShouldTriggerVisionFallback_DetectsScannedImagePageAndHighPuaCorruption()
        {
            var service = new PdfHybridVisionFallbackService();

            // 1. Scanned page: < 20 letters, >= 1 large image -> True
            Assert.True(service.ShouldTriggerVisionFallback(letterCount: 5, largeImageCount: 1, extractedText: ""));

            // 2. Clean vector text page: 450 letters, 1 diagram -> False
            Assert.False(service.ShouldTriggerVisionFallback(letterCount: 450, largeImageCount: 1, extractedText: "Câu 1. Cho hàm số y = x^3 - 3x + 2."));

            // 3. Corrupted PUA font page: >= 15% PUA/broken box glyphs -> True
            string corruptedText = "Câu 1. \uF020\uF02B\uF02D\uF03D□□□ Cho hàm số";
            Assert.True(service.ComputeGlyphCorruptionRatio(corruptedText) >= 0.15);
            Assert.True(service.ShouldTriggerVisionFallback(letterCount: 120, largeImageCount: 1, extractedText: corruptedText));
        }

        [Fact]
        public void ReconstructPageFromScannedImage_UsesSha256SemanticCache_ZeroTokenOnSecondCall()
        {
            PdfHybridVisionFallbackService.ClearCacheForTesting();
            var service = new PdfHybridVisionFallbackService();
            byte[] fakeImageBytes = Encoding.UTF8.GetBytes("FAKE_JPEG_SCANNED_EXAM_PAGE_01");
            int visionCallCount = 0;

            Func<byte[], string, string?> mockVisionDelegate = (bytes, mime) =>
            {
                visionCallCount++;
                return "Câu 1. Tập nghiệm của bất phương trình $2^x > 4$ là:\nA. $(2; +\\infty)$\nB. $(0; 2)$\nC. $(-\\infty; 2)$\nD. $[2; +\\infty)$";
            };

            // Lượt 1: Gọi Vision OCR và lưu vào SHA-256 Semantic Cache
            var firstLines = service.ReconstructPageFromScannedImage(fakeImageBytes, "image/jpeg", 1, mockVisionDelegate);
            Assert.Equal(1, visionCallCount);
            Assert.Equal(1, service.GetCachedPageCount());
            Assert.Contains(firstLines, l => l.Contains("Câu 1."));

            // Lượt 2 (cùng nội dung ảnh): Trả về từ SHA-256 Semantic Cache với 0 lần gọi AI thêm (0 token)
            var secondLines = service.ReconstructPageFromScannedImage(fakeImageBytes, "image/jpeg", 1, mockVisionDelegate);
            Assert.Equal(1, visionCallCount);
            Assert.Equal(firstLines.Count, secondLines.Count);

            // Hợp lưu trực tiếp vào DocxStateMachineClassifier (SSoT)
            var parsedQuestions = DocxStateMachineClassifier.ParseParagraphList(secondLines);
            Assert.Single(parsedQuestions);
            Assert.Equal(4, parsedQuestions[0].Options.Count);
        }

        [Fact]
        public void ReconstructPageFromScannedImage_GracefullyDegradesToMultimodalImageWhenOffline()
        {
            PdfHybridVisionFallbackService.ClearCacheForTesting();
            var service = new PdfHybridVisionFallbackService();
            byte[] fakePngBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };

            // Khi delegate ném lỗi mạng hoặc không có khóa API
            var fallbackLines = service.ReconstructPageFromScannedImage(
                fakePngBytes,
                "image/png",
                3,
                (_, __) => throw new InvalidOperationException("HTTP 429 Rate Limit"));

            Assert.NotEmpty(fallbackLines);
            Assert.Contains(fallbackLines, l => l.Contains("data:image/png;base64,"));

            var parsed = DocxStateMachineClassifier.ParseParagraphList(fallbackLines);
            Assert.Single(parsed);
            Assert.Contains("data:image/png;base64,", parsed[0].Content);
        }

        [Fact]
        public void CatConfigDto_SerializesSympsonHetterExposureParametersCorrectly()
        {
            var config = new CatConfigDto
            {
                MinItems = 5,
                MaxItems = 20,
                SeThreshold = 0.3,
                InitialTheta = 0.0,
                MaxExposureRate = 0.20,
                RandomesqueK = 3
            };

            string json = JsonSerializer.Serialize(config);
            Assert.Contains("\"max_exposure_rate\":0.2", json);
            Assert.Contains("\"randomesque_k\":3", json);
        }
    }
}
