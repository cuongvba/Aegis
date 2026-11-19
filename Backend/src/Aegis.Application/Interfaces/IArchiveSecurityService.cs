using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Aegis.Application.Interfaces
{
    public class ArchiveEntryInfoDto
    {
        public string Path { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public long Size { get; set; }
        public bool IsDirectory { get; set; }
        public bool IsEncrypted { get; set; }
        public bool CanReadDirectly { get; set; }
    }

    public class ArchiveInspectResultDto
    {
        public string ArchiveName { get; set; } = string.Empty;
        public bool RequiresPassword { get; set; }
        public bool PasswordValid { get; set; } = true;
        public string? Error { get; set; }
        public List<ArchiveEntryInfoDto> Entries { get; set; } = new();
    }

    public class ArchiveInputFile
    {
        public string FileName { get; set; } = string.Empty;
        public byte[] Content { get; set; } = System.Array.Empty<byte>();
    }

    public interface IArchiveSecurityService
    {
        Task<byte[]> Pack7zAsync(IReadOnlyList<ArchiveInputFile> files, string? password, CancellationToken ct = default);
        Task<ArchiveInspectResultDto> InspectArchiveAsync(Stream archiveStream, string archiveName, string? password, CancellationToken ct = default);
        Task<(byte[] Bytes, string FileName)> ExtractEntryAsync(Stream archiveStream, string archiveName, string entryPath, string? password, CancellationToken ct = default);
    }
}
