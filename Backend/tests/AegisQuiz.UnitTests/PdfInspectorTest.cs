using System;
using System.IO;
using UglyToad.PdfPig;
using Xunit;
using Xunit.Abstractions;

namespace AegisQuiz.UnitTests
{
    public class PdfInspectorTest
    {
        private readonly ITestOutputHelper _output;

        public PdfInspectorTest(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public void InspectDeToanPdf()
        {
            string path = @"D:\Cuong\DuAn\DETHI\DeWord\DeToan.pdf";
            if (!File.Exists(path))
            {
                _output.WriteLine("File not found: " + path);
                return;
            }

            using var doc = PdfDocument.Open(path);
            _output.WriteLine($"Total pages: {doc.NumberOfPages}");

            for (int i = 1; i <= Math.Min(3, doc.NumberOfPages); i++)
            {
                var page = doc.GetPage(i);
                _output.WriteLine($"--- PAGE {i} ---");
                _output.WriteLine(page.Text);
            }
        }
    }
}

