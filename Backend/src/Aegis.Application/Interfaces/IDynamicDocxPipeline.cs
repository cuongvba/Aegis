using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Aegis.Application.Interfaces
{
    /// <summary>
    /// [Clear Dynamic Architecture] Hợp đồng Pipeline bóc tách đề thi DOCX đa tầng độc lập.
    /// </summary>
    public interface IDynamicDocxPipeline
    {
        List<DocxImportPreviewDto> Execute(Stream docxStream);
        Task<List<DocxImportPreviewDto>> ExecuteAsync(Stream docxStream, CancellationToken ct = default);
        string ExtractPlainText(Stream docxStream);
    }
}
