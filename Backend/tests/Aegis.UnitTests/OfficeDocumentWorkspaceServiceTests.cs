using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Aegis.Application.Interfaces;
using Aegis.Infrastructure.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Aegis.UnitTests
{
    public class OfficeDocumentWorkspaceServiceTests
    {
        [Fact]
        public async Task ExportDocxAndParse_RoundTripsHeadingsBulletsAndTable()
        {
            var svc = new OfficeDocumentWorkspaceService(NullLogger<OfficeDocumentWorkspaceService>.Instance);

            byte[] docxBytes = svc.ExportDocx(new OfficeExportDocxRequestDto
            {
                Title = "Giao An Lich Su",
                MarkdownContent = "# Hai Ba Trung\n\n- Khoi nghia Me Linh\n\n| Nhan vat | Duc tinh |\n| --- | --- |\n| Trung Trac | Dung cam |"
            });

            Assert.True(docxBytes.Length > 500);

            await using var ms = new MemoryStream(docxBytes);
            var parsed = await svc.ParseDocumentAsync(ms, "giao-an.docx");

            Assert.Equal("DOCX", parsed.DocumentKind);
            Assert.Contains("Giao An Lich Su", parsed.MarkdownContent);
            Assert.Contains("Hai Ba Trung", parsed.MarkdownContent);
            Assert.Contains("Trung Trac", parsed.MarkdownContent);
        }

        [Fact]
        public async Task ExportXlsxAndParse_RoundTripsSheetsAndCells()
        {
            var svc = new OfficeDocumentWorkspaceService(NullLogger<OfficeDocumentWorkspaceService>.Instance);

            byte[] xlsxBytes = svc.ExportXlsx(new OfficeExportXlsxRequestDto
            {
                Title = "Bang Diem",
                Sheets = new List<OfficeSheetDto>
                {
                    new()
                    {
                        Name = "Lop 3A",
                        Rows = new List<List<string>>
                        {
                            new() { "Ho ten", "Diem" },
                            new() { "Minh Anh", "10" }
                        }
                    }
                }
            });

            Assert.True(xlsxBytes.Length > 500);

            await using var ms = new MemoryStream(xlsxBytes);
            var parsed = await svc.ParseDocumentAsync(ms, "bang-diem.xlsx");

            Assert.Equal("XLSX", parsed.DocumentKind);
            Assert.Single(parsed.Sheets);
            Assert.Equal("Lop 3A", parsed.Sheets[0].Name);
            Assert.Equal("Minh Anh", parsed.Sheets[0].Rows[1][0]);
            Assert.Equal("10", parsed.Sheets[0].Rows[1][1]);
        }

        [Fact]
        public async Task RunAiAssistAsync_AnalyzesSheetAndGeneratesQuiz()
        {
            var svc = new OfficeDocumentWorkspaceService(NullLogger<OfficeDocumentWorkspaceService>.Instance);

            var sheetRes = await svc.RunAiAssistAsync(System.Guid.NewGuid(), new OfficeAiAssistRequestDto
            {
                Action = "ANALYZE_SHEET",
                Title = "Bang Diem Lop 3A",
                Sheets = new List<OfficeSheetDto>
                {
                    new()
                    {
                        Name = "Lop 3A",
                        Rows = new List<List<string>>
                        {
                            new() { "Ho ten", "Diem" },
                            new() { "An", "10" },
                            new() { "Binh", "8" }
                        }
                    }
                }
            });

            Assert.True(sheetRes.Success);
            Assert.Contains("9.00", sheetRes.ResultMarkdown);

            var quizRes = await svc.RunAiAssistAsync(System.Guid.NewGuid(), new OfficeAiAssistRequestDto
            {
                Action = "GENERATE_QUIZ",
                Title = "Thanh Giong",
                MarkdownContent = "Thanh Giong cuoi ngua sat danh giac An."
            });

            Assert.True(quizRes.Success);
            Assert.Contains("Câu 1", quizRes.ResultMarkdown);
        }
    }
}
