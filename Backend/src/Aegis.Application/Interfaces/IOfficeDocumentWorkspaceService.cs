using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Aegis.Application.Interfaces
{
    public class OfficeSheetDto
    {
        public string Name { get; set; } = "Sheet1";
        public List<List<string>> Rows { get; set; } = new();
    }

    public class OfficeParsedDocumentDto
    {
        public string FileName { get; set; } = string.Empty;
        public string DocumentKind { get; set; } = "DOCX"; // DOCX | PDF | XLSX | MARKDOWN
        public string Title { get; set; } = string.Empty;
        public string MarkdownContent { get; set; } = string.Empty;
        public int PageCount { get; set; }
        public List<OfficeSheetDto> Sheets { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
    }

    public class OfficeExportDocxRequestDto
    {
        public string Title { get; set; } = "Aegis Document";
        public string MarkdownContent { get; set; } = string.Empty;
        public string? WatermarkText { get; set; }
        public string? ProtectionPassword { get; set; }
    }

    public class OfficeExportXlsxRequestDto
    {
        public string Title { get; set; } = "Aegis Workbook";
        public List<OfficeSheetDto> Sheets { get; set; } = new();
    }

    public class OfficeAiAssistRequestDto
    {
        public string Action { get; set; } = "POLISH_LESSON"; // POLISH_LESSON | SUMMARIZE | GENERATE_QUIZ | ANALYZE_SHEET | TRANSLATE_BILINGUAL | CUSTOM
        public string Title { get; set; } = string.Empty;
        public string MarkdownContent { get; set; } = string.Empty;
        public List<OfficeSheetDto>? Sheets { get; set; }
        public string? CustomInstruction { get; set; }
    }

    public class OfficeAiAssistResponseDto
    {
        public bool Success { get; set; }
        public bool UsedAi { get; set; }
        public string Action { get; set; } = string.Empty;
        public string ResultMarkdown { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class OfficeSendToKidsRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string MarkdownContent { get; set; } = string.Empty;
        public string IslandId { get; set; } = "heritage";
        public string AgeBand { get; set; } = "6-8";
        public string RegionCode { get; set; } = "VN";
        public int ItemCount { get; set; } = 4;
    }

    public interface IOfficeDocumentWorkspaceService
    {
        Task<OfficeParsedDocumentDto> ParseDocumentAsync(
            Stream stream,
            string fileName,
            CancellationToken ct = default);

        byte[] ExportDocx(OfficeExportDocxRequestDto request);

        byte[] ExportXlsx(OfficeExportXlsxRequestDto request);

        Task<OfficeAiAssistResponseDto> RunAiAssistAsync(
            Guid tenantId,
            OfficeAiAssistRequestDto request,
            CancellationToken ct = default);
    }
}
