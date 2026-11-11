using System;
using System.IO;
using UglyToad.PdfPig;
using Xunit;
using Xunit.Abstractions;

namespace Aegis.UnitTests
{
    public class FindAnswerKeyTableTest
    {
        private readonly ITestOutputHelper _output;

        public FindAnswerKeyTableTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void SearchAnswerKeyTableInDe103()
        {
            string pdfPath = @"D:\Cuong\DuAn\DETHI\TNPT\thuvienhoclieu.com-De-thi-TN-THPT-2026-mon-Toan-Bo-GD-ma-de-103.pdf";
            if (!File.Exists(pdfPath)) return;

            using var doc = PdfDocument.Open(pdfPath);
            for (int p = 1; p <= doc.NumberOfPages; p++)
            {
                var page = doc.GetPage(p);
                string text = page.Text;
                if (text.Contains("B C C B") || text.Contains("B  C  C  B") || text.Contains("D A A") || text.Contains("ĐÁP ÁN") || text.Contains("BẢNG ĐÁP ÁN"))
                {
                    _output.WriteLine($"Found on Page {p}:");
                    _output.WriteLine(text.Substring(0, Math.Min(300, text.Length)));
                }
            }
        }
    }
}
