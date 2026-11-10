using System.Collections.Generic;
using System.IO;
using AegisQuiz.Application.DTOs;

namespace AegisQuiz.Application.Interfaces
{
    /// <summary>
    /// [Aegis Cognitive PDF Math Standard]
    /// Chuẩn hóa ký tự toán học, giải mã PUA (Private Use Area), MathType ligatures và các ký hiệu hình học từ luồng PDF.
    /// </summary>
    public interface IPdfMathSymbolGlyphNormalizer
    {
        /// <summary>
        /// Chuẩn hóa toàn bộ các ký tự toán học, PUA, font Symbol sang LaTeX KaTeX ($...$).
        /// </summary>
        string NormalizeMathGlyphs(string text);

        /// <summary>
        /// Khôi phục ký hiệu độ góc (ví dụ: 045 -> 45^\circ, 30^0 -> 30^\circ).
        /// </summary>
        string ReconstructDegreeSymbols(string text);

        /// <summary>
        /// Khôi phục tên hình lăng trụ, đa diện, hình chóp khi bị lỗi ô vuông font (ví dụ: □□□□ABCABC -> ABC.A'B'C').
        /// </summary>
        string ReconstructGeometricPrismLabels(string text);

        /// <summary>
        /// Khử bỏ và ánh xạ các ký tự vùng riêng (PUA) như \uF00E, \uF02D sang dấu toán học chuẩn.
        /// </summary>
        string CleanPuaCharacters(string text);
    }

    /// <summary>
    /// [Aegis Layout & Hygiene Guard]
    /// Bảo vệ cấu trúc đề thi PDF, lọc watermark/header/footer và giữ nguyên ranh giới 3 Phần của Bộ GD&ĐT.
    /// </summary>
    public interface IPdfStructureGuardService
    {
        /// <summary>
        /// Loại bỏ các dòng watermark, running header, running footer (ví dụ: thuvienhoclieu.com, Trang 3/5).
        /// </summary>
        string CleanNoiseAndWatermarks(string rawText);

        /// <summary>
        /// Phân tách ranh giới các Phần (Phần I, Phần II, Phần III) và đảm bảo câu hỏi không nuốt các câu tiếp theo.
        /// </summary>
        List<string> SegmentSectionsAndQuestions(string rawText);

        /// <summary>
        /// Kiểm tra một dòng có phải là điểm bắt đầu của một Phần thi mới không.
        /// </summary>
        bool IsSectionBreak(string line, out string sectionName);

        /// <summary>
        /// Kiểm tra một dòng có phải là rác lặp lại (watermark, footer) không.
        /// </summary>
        bool IsRunningNoise(string line);
    }

    /// <summary>
    /// [Aegis PDF to Markdown Transpiler Engine]
    /// Chuyển đổi toàn diện luồng PDF thành tài liệu Markdown (.md) có cấu trúc chuẩn 100% KaTeX.
    /// </summary>
    public interface IPdfToMarkdownTranspilerService
    {
        /// <summary>
        /// Chuyển đổi luồng văn bản PDF thành định dạng Markdown có cấu trúc (# Phần, ## Câu, A, B, C, D, a), b), c), d)).
        /// </summary>
        string TranspileToMarkdown(string pdfRawText, IEnumerable<string>? pageTexts = null);

        /// <summary>
        /// Chuyển đổi và bóc tách trực tiếp luồng PDF thành danh sách DTO câu hỏi xem trước.
        /// </summary>
        List<DocxImportPreviewDto> TranspileAndParse(Stream pdfStream);
    }

    /// <summary>
    /// [Aegis Hybrid Vision Fallback & SHA-256 Semantic Cache (0-Token)]
    /// Tự động phát hiện trang PDF scan ảnh mờ hoặc lỗi font PUA nặng (>= 15%),
    /// tra cứu bộ nhớ đệm ngữ nghĩa SHA-256 (0 token) hoặc kích hoạt Vision OCR để tái tạo đoạn văn ảo cho DSMC + CIG.
    /// </summary>
    public interface IPdfVisionFallbackService
    {
        bool ShouldTriggerVisionFallback(int letterCount, int largeImageCount, string? extractedText);
        double ComputeGlyphCorruptionRatio(string? text);
        string ComputeImageSha256(byte[] imageBytes);
        List<string> ReconstructPageFromScannedImage(
            byte[] imageBytes,
            string mimeType,
            int pageNumber,
            System.Func<byte[], string, string?>? visionOcrDelegate = null);
        int GetCachedPageCount();
    }
}

