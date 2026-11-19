using System;
using Aegis.Infrastructure.Services;
using Xunit;

namespace Aegis.UnitTests
{
    public class ArchiveSecurityServiceTests
    {
        [Theory]
        [InlineData("../secret.txt")]
        [InlineData("docs/../../etc/passwd")]
        [InlineData("/abs/path.docx")]
        [InlineData(@"C:\Windows\System32\cmd.exe")]
        public void ValidateAndNormalizeEntryPath_RejectsZipSlipPaths(string maliciousPath)
        {
            Assert.Throws<UnauthorizedAccessException>(() =>
                ArchiveSecurityService.ValidateAndNormalizeEntryPath(maliciousPath));
        }

        [Fact]
        public void ValidateAndNormalizeEntryPath_AcceptsSafeRelativePath()
        {
            string normalized = ArchiveSecurityService.ValidateAndNormalizeEntryPath(@"folder\lesson_01.docx");
            Assert.Equal("folder/lesson_01.docx", normalized);
        }

        [Fact]
        public void Parse7zSltOutput_ExtractsMetadataAndDirectReadEligibility()
        {
            string slt = @"
7-Zip [64] 16.02

Listing archive: test.7z

--
Path = test.7z
Type = 7z

----------
Path = bai_giang.docx
Size = 24576
Folder = -
Encrypted = +

Path = subfolder
Size = 0
Folder = +
Encrypted = -

Path = payload.exe
Size = 1024
Folder = -
Encrypted = +
";
            var entries = ArchiveSecurityService.Parse7zSltOutput(slt);
            Assert.Equal(3, entries.Count);
            Assert.True(entries[0].CanReadDirectly);
            Assert.True(entries[0].IsEncrypted);
            Assert.Equal(24576, entries[0].Size);
            Assert.True(entries[1].IsDirectory);
            Assert.False(entries[2].CanReadDirectly);
        }
    }
}
