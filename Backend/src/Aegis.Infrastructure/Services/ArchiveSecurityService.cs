using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Aegis.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Aegis.Infrastructure.Services
{
    public sealed class ArchiveSecurityService : IArchiveSecurityService
    {
        private const int MaxEntriesLimit = 60;
        private const long MaxUncompressedBytes = 100L * 1024 * 1024; // 100 MB anti-Zip-Bomb guard
        private const int ProcessTimeoutMs = 25_000;

        private static readonly HashSet<string> DirectlyReadableExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".docx", ".pdf", ".xlsx", ".xls", ".csv", ".md", ".txt", ".png", ".jpg", ".jpeg", ".webp"
        };

        private readonly ILogger<ArchiveSecurityService> _logger;

        public ArchiveSecurityService(ILogger<ArchiveSecurityService> logger)
        {
            _logger = logger;
        }

        public async Task<byte[]> Pack7zAsync(IReadOnlyList<ArchiveInputFile> files, string? password, CancellationToken ct = default)
        {
            if (files == null || files.Count == 0)
                throw new ArgumentException("Cần ít nhất 1 tệp để nén thành .7z.");
            if (files.Count > MaxEntriesLimit)
                throw new InvalidOperationException($"Chỉ cho phép nén tối đa {MaxEntriesLimit} tệp mỗi lần.");

            string workDir = CreateTempWorkDir("pack7z");
            string inputDir = Path.Combine(workDir, "in");
            string outArchive = Path.Combine(workDir, "archive.7z");
            Directory.CreateDirectory(inputDir);

            try
            {
                long totalBytes = 0;
                var usedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (var f in files)
                {
                    totalBytes += f.Content.Length;
                    if (totalBytes > MaxUncompressedBytes)
                        throw new InvalidOperationException("Tổng dung lượng đầu vào vượt quá giới hạn 100 MB.");

                    string safeName = SanitizeEntryFileName(f.FileName);
                    if (!usedNames.Add(safeName))
                    {
                        safeName = $"{Path.GetFileNameWithoutExtension(safeName)}_{usedNames.Count}{Path.GetExtension(safeName)}";
                        usedNames.Add(safeName);
                    }
                    await File.WriteAllBytesAsync(Path.Combine(inputDir, safeName), f.Content, ct);
                }

                var args = new List<string> { "a", "-t7z", "-mx=5", "-y" };
                if (!string.IsNullOrWhiteSpace(password))
                {
                    // AES-256 encryption + header/filename encryption (-mhe=on) for strict InfoSec
                    args.Add("-mhe=on");
                    args.Add($"-p{password}");
                }
                args.Add("--");
                args.Add(outArchive);
                args.Add("*");

                var (exitCode, _, stderr) = await Run7zAsync(args, inputDir, ct);
                if (exitCode != 0 || !File.Exists(outArchive))
                {
                    _logger.LogWarning("[ArchiveSecurityService] Pack7z failed | ExitCode={ExitCode} | Err={Err}", exitCode, RedactSecrets(stderr));
                    throw new InvalidOperationException("Không thể nén tệp .7z. Vui lòng kiểm tra công cụ 7z trên máy chủ.");
                }

                return await File.ReadAllBytesAsync(outArchive, ct);
            }
            finally
            {
                SafeDeleteDir(workDir);
            }
        }

        public async Task<ArchiveInspectResultDto> InspectArchiveAsync(Stream archiveStream, string archiveName, string? password, CancellationToken ct = default)
        {
            string workDir = CreateTempWorkDir("inspect");
            try
            {
                string archivePath = await SaveArchiveToTempAsync(archiveStream, archiveName, workDir, ct);
                var args = new List<string> { "l", "-slt", "-y" };
                args.Add(string.IsNullOrWhiteSpace(password) ? "-p" : $"-p{password}");
                args.Add("--");
                args.Add(archivePath);

                var (exitCode, stdout, stderr) = await Run7zAsync(args, workDir, ct);
                string combined = (stdout + "\n" + stderr).ToLowerInvariant();
                bool wrongPwd = combined.Contains("wrong password")
                    || combined.Contains("can not open encrypted archive")
                    || combined.Contains("cannot open encrypted archive")
                    || combined.Contains("data error in encrypted file");

                if (exitCode != 0 && wrongPwd)
                {
                    return new ArchiveInspectResultDto
                    {
                        ArchiveName = archiveName,
                        RequiresPassword = true,
                        PasswordValid = false,
                        Error = "Tệp nén được mã hóa. Vui lòng nhập đúng mật khẩu để mở khóa."
                    };
                }

                if (exitCode != 0)
                {
                    return new ArchiveInspectResultDto
                    {
                        ArchiveName = archiveName,
                        RequiresPassword = false,
                        PasswordValid = false,
                        Error = "Không thể đọc cấu trúc tệp nén (định dạng không hỗ trợ hoặc tệp bị hỏng)."
                    };
                }

                var entries = Parse7zSltOutput(stdout);
                bool anyEncrypted = entries.Any(e => e.IsEncrypted);
                long totalSize = entries.Where(e => !e.IsDirectory).Sum(e => e.Size);
                if (entries.Count > MaxEntriesLimit || totalSize > MaxUncompressedBytes)
                {
                    return new ArchiveInspectResultDto
                    {
                        ArchiveName = archiveName,
                        RequiresPassword = anyEncrypted,
                        PasswordValid = true,
                        Error = $"Cảnh báo ATTT: Tệp nén vượt ngưỡng an toàn (tối đa {MaxEntriesLimit} tệp / 100 MB)."
                    };
                }

                return new ArchiveInspectResultDto
                {
                    ArchiveName = archiveName,
                    RequiresPassword = anyEncrypted,
                    PasswordValid = true,
                    Entries = entries.Where(e => !e.IsDirectory).ToList()
                };
            }
            finally
            {
                SafeDeleteDir(workDir);
            }
        }

        public async Task<(byte[] Bytes, string FileName)> ExtractEntryAsync(Stream archiveStream, string archiveName, string entryPath, string? password, CancellationToken ct = default)
        {
            string normalizedEntry = ValidateAndNormalizeEntryPath(entryPath);
            string workDir = CreateTempWorkDir("extract");
            string extractDir = Path.Combine(workDir, "out");
            Directory.CreateDirectory(extractDir);

            try
            {
                string archivePath = await SaveArchiveToTempAsync(archiveStream, archiveName, workDir, ct);

                // First inspect sizes to block Zip-Bomb before writing extracted payload
                var inspect = await InspectArchiveInternalAsync(archivePath, password, ct);
                if (!inspect.PasswordValid)
                    throw new UnauthorizedAccessException(inspect.Error ?? "Mật khẩu giải nén không đúng.");
                if (!string.IsNullOrEmpty(inspect.Error))
                    throw new InvalidOperationException(inspect.Error);

                var targetEntry = inspect.Entries.FirstOrDefault(e =>
                    string.Equals(e.Path.Replace('\\', '/'), normalizedEntry, StringComparison.OrdinalIgnoreCase));
                if (targetEntry == null)
                    throw new FileNotFoundException("Không tìm thấy tệp yêu cầu trong tệp nén.");
                if (targetEntry.Size > MaxUncompressedBytes)
                    throw new InvalidOperationException("Kích thước tệp vượt quá giới hạn an toàn 100 MB.");

                var args = new List<string> { "x", "-y", $"-o{extractDir}" };
                args.Add(string.IsNullOrWhiteSpace(password) ? "-p" : $"-p{password}");
                args.Add("--");
                args.Add(archivePath);
                args.Add(targetEntry.Path);

                var (exitCode, stdout, stderr) = await Run7zAsync(args, workDir, ct);
                string combined = (stdout + "\n" + stderr).ToLowerInvariant();
                if (exitCode != 0)
                {
                    if (combined.Contains("wrong password") || combined.Contains("data error in encrypted file"))
                        throw new UnauthorizedAccessException("Mật khẩu giải nén không chính xác.");

                    _logger.LogWarning("[ArchiveSecurityService] Extract failed | ExitCode={ExitCode} | Err={Err}", exitCode, RedactSecrets(stderr));
                    throw new InvalidOperationException("Giải nén tệp thất bại.");
                }

                string expectedFull = Path.GetFullPath(Path.Combine(extractDir, targetEntry.Path));
                string safeRoot = Path.GetFullPath(extractDir) + Path.DirectorySeparatorChar;
                if (!expectedFull.StartsWith(safeRoot, StringComparison.OrdinalIgnoreCase) || !File.Exists(expectedFull))
                    throw new UnauthorizedAccessException("Phát hiện đường dẫn không hợp lệ (Zip-Slip Guard).");

                byte[] bytes = await File.ReadAllBytesAsync(expectedFull, ct);
                return (bytes, Path.GetFileName(expectedFull));
            }
            finally
            {
                SafeDeleteDir(workDir);
            }
        }

        private async Task<ArchiveInspectResultDto> InspectArchiveInternalAsync(string archivePath, string? password, CancellationToken ct)
        {
            await using var fs = File.OpenRead(archivePath);
            return await InspectArchiveAsync(fs, Path.GetFileName(archivePath), password, ct);
        }

        public static string ValidateAndNormalizeEntryPath(string entryPath)
        {
            if (string.IsNullOrWhiteSpace(entryPath))
                throw new ArgumentException("Đường dẫn tệp trong archive không được để trống.");

            string normalized = entryPath.Replace('\\', '/').Trim();
            if (normalized.StartsWith("/") || normalized.Contains(":") || normalized.Split('/').Any(seg => seg == ".."))
                throw new UnauthorizedAccessException("Đường dẫn tệp chứa ký tự điều hướng không an toàn.");

            return normalized;
        }

        public static List<ArchiveEntryInfoDto> Parse7zSltOutput(string stdout)
        {
            var list = new List<ArchiveEntryInfoDto>();
            if (string.IsNullOrWhiteSpace(stdout)) return list;

            bool inBody = false;
            ArchiveEntryInfoDto? cur = null;

            foreach (string rawLine in stdout.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None))
            {
                string line = rawLine.Trim();
                if (line == "----------")
                {
                    inBody = true;
                    cur = new ArchiveEntryInfoDto();
                    continue;
                }
                if (!inBody) continue;

                if (string.IsNullOrEmpty(line))
                {
                    if (cur != null && !string.IsNullOrWhiteSpace(cur.Path))
                    {
                        cur.Name = Path.GetFileName(cur.Path.Replace('\\', '/'));
                        string ext = Path.GetExtension(cur.Name);
                        cur.CanReadDirectly = !cur.IsDirectory && DirectlyReadableExtensions.Contains(ext);
                        list.Add(cur);
                    }
                    cur = new ArchiveEntryInfoDto();
                    continue;
                }

                if (cur == null) continue;
                int eq = line.IndexOf('=');
                if (eq <= 0) continue;
                string key = line.Substring(0, eq).Trim();
                string val = line.Substring(eq + 1).Trim();

                if (key.Equals("Path", StringComparison.OrdinalIgnoreCase)) cur.Path = val;
                else if (key.Equals("Size", StringComparison.OrdinalIgnoreCase) && long.TryParse(val, out long sz)) cur.Size = sz;
                else if (key.Equals("Folder", StringComparison.OrdinalIgnoreCase)) cur.IsDirectory = val == "+";
                else if (key.Equals("Attributes", StringComparison.OrdinalIgnoreCase) && val.StartsWith("D", StringComparison.OrdinalIgnoreCase)) cur.IsDirectory = true;
                else if (key.Equals("Encrypted", StringComparison.OrdinalIgnoreCase)) cur.IsEncrypted = val == "+";
            }

            if (cur != null && !string.IsNullOrWhiteSpace(cur.Path))
            {
                cur.Name = Path.GetFileName(cur.Path.Replace('\\', '/'));
                string ext = Path.GetExtension(cur.Name);
                cur.CanReadDirectly = !cur.IsDirectory && DirectlyReadableExtensions.Contains(ext);
                list.Add(cur);
            }

            return list;
        }

        private static async Task<(int ExitCode, string StdOut, string StdErr)> Run7zAsync(IReadOnlyList<string> args, string workingDir, CancellationToken ct)
        {
            var psi = new ProcessStartInfo
            {
                FileName = "7z",
                WorkingDirectory = workingDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            foreach (string a in args) psi.ArgumentList.Add(a);

            using var proc = Process.Start(psi) ?? throw new InvalidOperationException("Không thể khởi chạy tiến trình 7z.");
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeoutCts.CancelAfter(ProcessTimeoutMs);

            var outTask = proc.StandardOutput.ReadToEndAsync(timeoutCts.Token);
            var errTask = proc.StandardError.ReadToEndAsync(timeoutCts.Token);
            try
            {
                await proc.WaitForExitAsync(timeoutCts.Token);
            }
            catch (OperationCanceledException)
            {
                try { if (!proc.HasExited) proc.Kill(entireProcessTree: true); } catch { }
                throw new TimeoutException("Xử lý tệp nén vượt quá thời gian cho phép.");
            }

            return (proc.ExitCode, await outTask, await errTask);
        }

        private static async Task<string> SaveArchiveToTempAsync(Stream stream, string archiveName, string workDir, CancellationToken ct)
        {
            string ext = Path.GetExtension(archiveName);
            if (string.IsNullOrWhiteSpace(ext)) ext = ".7z";
            string dest = Path.Combine(workDir, "input" + ext);
            if (stream.CanSeek) stream.Position = 0;
            await using var fs = File.Create(dest);
            await stream.CopyToAsync(fs, ct);
            return dest;
        }

        private static string SanitizeEntryFileName(string? raw)
        {
            string name = Path.GetFileName(raw ?? "file.bin");
            if (string.IsNullOrWhiteSpace(name)) name = "file.bin";
            foreach (char c in Path.GetInvalidFileNameChars()) name = name.Replace(c, '_');
            return name;
        }

        private static string RedactSecrets(string input) =>
            string.IsNullOrEmpty(input) ? string.Empty : (input.Length > 300 ? input.Substring(0, 300) : input);

        private static string CreateTempWorkDir(string prefix)
        {
            string dir = Path.Combine(Path.GetTempPath(), $"aegis_{prefix}_{Guid.NewGuid():N}");
            Directory.CreateDirectory(dir);
            return dir;
        }

        private static void SafeDeleteDir(string dir)
        {
            try { if (Directory.Exists(dir)) Directory.Delete(dir, recursive: true); } catch { }
        }
    }
}
