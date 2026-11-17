using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security;
using System.Text;
using System.Text.Json;
using Aegis.Application.DTOs;
using Aegis.Application.Interfaces;
using Aegis.Infrastructure.Excel;

namespace Aegis.Infrastructure.Transpiler
{
    /// <summary>
    /// [SCORM 1.2 Universal Package Export Strategy]
    /// Đóng gói bài thi / học liệu thành gói nén .scorm12.zip chuẩn ADL SCORM 1.2 (imsmanifest.xml + HTML5 Offline Player).
    /// Tương thích Plug-and-Play với mọi LMS doanh nghiệp &amp; đại học toàn cầu (Moodle, Canvas, TalentLMS, Cornerstone, Blackboard).
    /// </summary>
    public class Scorm12PackageExportStrategy : ITranspilerExportStrategy
    {
        public string FormatCode => "SCORM_12";
        public string DisplayName => "SCORM 1.2 LMS Package (.zip)";
        public string Description => "Gói chuẩn quốc tế ADL SCORM 1.2 kèm imsmanifest.xml và trình phát HTML5 tự chấm điểm, tương thích mọi hệ thống LMS.";
        public string TargetPlatforms => "Moodle, Canvas LMS, TalentLMS, Cornerstone, Docebo, Blackboard";
        public string MimeType => "application/zip";
        public string FileExtension => ".scorm12.zip";
        public bool SupportsSelfContainedMedia => true;
        public bool IsPackageZip => true;

        public byte[] Transpile(IReadOnlyList<DocxImportPreviewDto> questions, TranspileOptionsDto options)
        {
            questions ??= Array.Empty<DocxImportPreviewDto>();
            string examId = "aegis_scorm_" + Guid.NewGuid().ToString("N")[..8];
            string title = !string.IsNullOrWhiteSpace(options.ExamTitle) ? options.ExamTitle : "Aegis SCORM 1.2 Assessment";

            using var memoryStream = new MemoryStream();
            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true, Encoding.UTF8))
            {
                var resourceFiles = new List<string> { "index.html" };
                var questionDtos = new List<object>();
                int imgIdx = 1;

                for (int i = 0; i < questions.Count; i++)
                {
                    var q = questions[i];
                    var imgPaths = new List<string>();
                    foreach (var img in ExcelImageHelper.ExtractImages(q))
                    {
                        if (img.RawBytes == null || img.RawBytes.Length == 0) continue;
                        string ext = img.MimeType.Contains("jpeg") || img.MimeType.Contains("jpg") ? "jpg"
                            : img.MimeType.Contains("gif") ? "gif" : "png";
                        string fileName = $"resources/img_{imgIdx++}.{ext}";
                        var entry = archive.CreateEntry(fileName, CompressionLevel.Optimal);
                        using (var es = entry.Open()) es.Write(img.RawBytes, 0, img.RawBytes.Length);
                        resourceFiles.Add(fileName);
                        imgPaths.Add(fileName);
                    }

                    questionDtos.Add(new
                    {
                        no = i + 1,
                        content = q.Content ?? string.Empty,
                        type = q.QuestionType ?? "SINGLE",
                        options = q.Options ?? new List<string>(),
                        correct = q.SuggestedAnswer ?? string.Empty,
                        explanation = q.AiExplanation ?? string.Empty,
                        images = imgPaths
                    });
                }

                WriteEntry(archive, "index.html", BuildScormPlayerHtml(title, questionDtos));
                WriteEntry(archive, "imsmanifest.xml", BuildImsManifestXml(examId, title, resourceFiles));
            }

            return memoryStream.ToArray();
        }

        private static void WriteEntry(ZipArchive archive, string entryName, string content)
        {
            var entry = archive.CreateEntry(entryName, CompressionLevel.Optimal);
            using var writer = new StreamWriter(entry.Open(), new UTF8Encoding(false));
            writer.Write(content);
        }

        private static string BuildImsManifestXml(string examId, string title, IReadOnlyList<string> files)
        {
            var safeTitle = SecurityElement.Escape(title);
            var sb = new StringBuilder();
            sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            sb.AppendLine($"<manifest identifier=\"{examId}\" version=\"1.0\" xmlns=\"http://www.imsproject.org/xsd/imscp_rootv1p1p2\" xmlns:adlcp=\"http://www.adlnet.org/xsd/adlcp_rootv1p2\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">");
            sb.AppendLine("  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>");
            sb.AppendLine("  <organizations default=\"ORG_AEGIS\">");
            sb.AppendLine($"    <organization identifier=\"ORG_AEGIS\"><title>{safeTitle}</title>");
            sb.AppendLine($"      <item identifier=\"ITEM_1\" identifierref=\"RES_1\"><title>{safeTitle}</title></item>");
            sb.AppendLine("    </organization>");
            sb.AppendLine("  </organizations>");
            sb.AppendLine("  <resources>");
            sb.AppendLine("    <resource identifier=\"RES_1\" type=\"webcontent\" adlcp:scormtype=\"sco\" href=\"index.html\">");
            foreach (var f in files)
            {
                sb.AppendLine($"      <file href=\"{SecurityElement.Escape(f)}\"/>");
            }
            sb.AppendLine("    </resource>");
            sb.AppendLine("  </resources>");
            sb.AppendLine("</manifest>");
            return sb.ToString();
        }

        private static string BuildScormPlayerHtml(string title, IReadOnlyList<object> questions)
        {
            var safeTitle = SecurityElement.Escape(title);
            var json = JsonSerializer.Serialize(questions).Replace("</", "<\\/");
            return $@"<!DOCTYPE html>
<html lang=""vi"">
<head>
  <meta charset=""utf-8"" />
  <meta name=""viewport"" content=""width=device-width,initial-scale=1"" />
  <title>{safeTitle}</title>
  <style>
    body{{font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:24px}}
    .wrap{{max-width:860px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 24px rgba(15,23,42,.08)}}
    .q{{border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:14px 0}}
    .opt{{display:block;padding:8px 12px;margin:6px 0;border:1px solid #cbd5e1;border-radius:8px;cursor:pointer}}
    .btn{{background:#0284c7;color:#fff;border:0;border-radius:10px;padding:12px 24px;font-weight:700;cursor:pointer;font-size:15px}}
    .res{{margin-top:16px;padding:14px;border-radius:12px;background:#ecfeff;border:1px solid #67e8f9;font-weight:700}}
  </style>
</head>
<body>
  <div class=""wrap"">
    <h1>{safeTitle}</h1>
    <div id=""quiz""></div>
    <button class=""btn"" onclick=""submitQuiz()"">Nộp bài &amp; Ghi nhận SCORM</button>
    <div id=""result"" class=""res"" style=""display:none""></div>
  </div>
  <script>
    const QUESTIONS = {json};
    function findApi(win){{let t=0;while(!win.API&&win.parent&&win.parent!==win&&t++<8)win=win.parent;return win.API||null;}}
    const api = findApi(window);
    if(api){{try{{api.LMSInitialize('');}}catch(e){{}}}}
    const root=document.getElementById('quiz');
    QUESTIONS.forEach((q,idx)=>{{
      const d=document.createElement('div');d.className='q';
      let html='<div><b>Câu '+q.no+':</b> '+q.content+'</div>';
      (q.images||[]).forEach(src=>{{html+='<img src=""'+src+'"" style=""max-width:100%;margin:8px 0""/>';}});
      if(q.options&&q.options.length){{
        q.options.forEach((o,oi)=>{{html+='<label class=""opt""><input type=""radio"" name=""q'+idx+'"" value=""'+(oi+1)+'"" /> '+o+'</label>';}});
      }}else{{
        html+='<input type=""text"" id=""txt'+idx+'"" placeholder=""Nhập đáp án..."" style=""width:100%;padding:8px;margin-top:8px;border:1px solid #cbd5e1;border-radius:8px""/>';
      }}
      d.innerHTML=html;root.appendChild(d);
    }});
    function submitQuiz(){{
      let ok=0;
      QUESTIONS.forEach((q,idx)=>{{
        const sel=document.querySelector('input[name=""q'+idx+'""]:checked');
        const txt=document.getElementById('txt'+idx);
        const ans=sel?sel.value:(txt?txt.value.trim():'');
        if(ans&&q.correct&&ans.toLowerCase()===String(q.correct).trim().toLowerCase())ok++;
      }});
      const score=QUESTIONS.length?Math.round((ok/QUESTIONS.length)*100):0;
      const box=document.getElementById('result');box.style.display='block';
      box.textContent='Kết quả: '+ok+'/'+QUESTIONS.length+' ('+score+'/100 điểm)';
      if(api){{try{{api.LMSSetValue('cmi.core.score.raw',String(score));api.LMSSetValue('cmi.core.lesson_status',score>=50?'passed':'failed');api.LMSCommit('');api.LMSFinish('');}}catch(e){{}}}}
    }}
  </script>
</body>
</html>";
        }
    }
}
