import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileSpreadsheet,
  Upload,
  Download,
  Printer,
  Sparkles,
  Plus,
  Loader2,
  AlertCircle,
  Images,
  Scissors,
} from 'lucide-react';
import {
  officeWorkspaceService,
  type OfficeSheet,
} from '@/services/officeWorkspace.service';
import { RichDocEditorPane } from '@/components/office/RichDocEditorPane';
import { SpreadsheetGridEditor } from '@/components/office/SpreadsheetGridEditor';
import { OfficeAiCopilotBar } from '@/components/office/OfficeAiCopilotBar';
import { ImageBatchMergerModal } from '@/components/office/ImageBatchMergerModal';

const PdfToolboxModal = lazy(() =>
  import('@/components/office/PdfToolboxModal').then((m) => ({ default: m.PdfToolboxModal })),
);

const DRAFT_STORAGE_KEY = 'aegis-office-studio-draft-v1';

export const OfficeWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isMergerOpen, setIsMergerOpen] = useState(false);
  const [isPdfToolboxOpen, setIsPdfToolboxOpen] = useState(false);

  const [docKind, setDocKind] = useState<'DOCX' | 'PDF' | 'XLSX' | 'MARKDOWN'>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
      return saved.docKind === 'XLSX' ? 'XLSX' : 'DOCX';
    } catch { return 'DOCX'; }
  });
  const [title, setTitle] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
      return saved.title || 'Giáo Án Mới (Không Cần MS Office)';
    } catch { return 'Giáo Án Mới (Không Cần MS Office)'; }
  });
  const [markdown, setMarkdown] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
      if (saved.markdown) return saved.markdown as string;
    } catch { /* ignore */ }
    return '# Giáo Án Mẫu\n\n- Mục tiêu bài học: Khơi dậy niềm vui khám phá cho học sinh.\n\n| Hoạt động | Thời gian |\n| --- | --- |\n| Khởi động | 5 phút |\n| Khám phá | 15 phút |';
  });
  const [sheets, setSheets] = useState<OfficeSheet[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
      if (Array.isArray(saved.sheets) && saved.sheets.length > 0) return saved.sheets;
    } catch { /* ignore */ }
    return [
      {
        name: 'DanhSach',
        rows: [
          ['STT', 'Họ và tên', 'Điểm', 'Nhận xét'],
          ['1', 'Nguyễn Minh Anh', '10', 'Chăm ngoan, tích cực'],
          ['2', 'Trần Gia Bảo', '9.5', 'Sáng tạo'],
        ],
      },
    ];
  });
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ docKind, title, markdown, sheets }));
        setLastSavedAt(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch { /* ignore quota */ }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [docKind, title, markdown, sheets]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const handleFilePick = async (file?: File) => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setWarnings([]);
    try {
      const parsed = await officeWorkspaceService.parseFile(file);
      setDocKind(parsed.documentKind);
      setTitle(parsed.title || file.name);
      setWarnings(parsed.warnings || []);

      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
        setPdfPreviewUrl(null);
      }

      if (parsed.documentKind === 'PDF') {
        setPdfPreviewUrl(URL.createObjectURL(file));
        setMarkdown(parsed.markdownContent || '');
      } else if (parsed.documentKind === 'XLSX') {
        setSheets(
          parsed.sheets.length > 0
            ? parsed.sheets
            : [{ name: 'Sheet1', rows: [['Cột 1', 'Cột 2']] }]
        );
      } else {
        setMarkdown(parsed.markdownContent || '');
      }
    } catch {
      setError('Không thể đọc tệp này. Vui lòng kiểm tra định dạng .docx, .pdf, .xlsx, .xls hoặc .md.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewDoc = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    setDocKind('DOCX');
    setTitle('Văn Bản Giáo Án Mới');
    setMarkdown('# Tiêu đề bài giảng\n\nNhập nội dung tại đây...');
    setWarnings([]);
  };

  const handleCreateNewSheet = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    setDocKind('XLSX');
    setTitle('Bảng Điểm Mới');
    setSheets([{ name: 'BangDiem', rows: [['STT', 'Họ tên', 'Điểm'], ['1', '', '']] }]);
    setWarnings([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-5">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg">
              {docKind === 'XLSX' ? <FileSpreadsheet size={22} /> : <FileText size={22} />}
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white">
                Aegis Office-Free Studio
              </h1>
              <p className="text-xs text-slate-400">
                Đọc & chỉnh sửa Word (.docx), Excel (.xlsx), PDF trực tiếp trên trình duyệt — không cần cài MS Office
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.md,.txt"
              className="hidden"
              onChange={(e) => handleFilePick(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 px-3.5 py-2 text-xs font-black text-white shadow-md transition"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Mở File / PDF / Ảnh
            </button>
            <button
              type="button"
              onClick={() => setIsMergerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-95 px-3.5 py-2 text-xs font-black text-white shadow-md transition"
              title="Ghép nhiều ảnh tải từ Facebook/Zalo thành 1 file Word/PDF/Markdown duy nhất"
            >
              <Images size={14} /> Ghép Nhiều Ảnh
            </button>
            <button
              type="button"
              onClick={() => setIsPdfToolboxOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 px-3.5 py-2 text-xs font-black text-white shadow-md transition"
              title="Nén dung lượng PDF scan, chèn/cắt/ghép và đổi vị trí trang PDF"
            >
              <Scissors size={14} /> Nén & Cắt/Ghép PDF
            </button>
            <button
              type="button"
              onClick={handleCreateNewDoc}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
            >
              <Plus size={14} /> Word Mới
            </button>
            <button
              type="button"
              onClick={handleCreateNewSheet}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-emerald-300"
            >
              <Plus size={14} /> Excel Mới
            </button>

            {docKind === 'XLSX' ? (
              <button
                type="button"
                onClick={() => officeWorkspaceService.downloadXlsx(title, sheets)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-black text-white shadow-md"
              >
                <Download size={14} /> Tải .XLSX
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => officeWorkspaceService.downloadDocx(title, markdown)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-black text-white shadow-md"
                >
                  <Download size={14} /> Tải .DOCX
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([markdown || ''], { type: 'text/markdown;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${(title || 'tai_lieu').replace(/[^a-z0-9_\-\u00C0-\u024F\u1E00-\u1EFF]/gi, '_')}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-3 py-2 text-xs font-black text-white shadow-md"
                  title="Chuyển & Tải toàn bộ tài liệu (PDF/Ảnh/Word) thành tệp Markdown (.md)"
                >
                  <Download size={14} /> Tải .MD
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-amber-300"
                >
                  <Printer size={14} /> In / Lưu PDF
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => navigate('/kids')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-3.5 py-2 text-xs font-black text-white shadow-md"
            >
              <Sparkles size={14} /> Kids World
            </button>
          </div>
        </header>

        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-3 flex items-center gap-3 print:hidden">
          <span className="text-xs font-bold text-slate-400 shrink-0">Tên tài liệu:</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent text-sm font-black text-white focus:outline-none border-b border-transparent focus:border-cyan-500 pb-0.5"
          />
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
            {docKind}
          </span>
          {lastSavedAt && (
            <span className="hidden sm:inline-block text-[11px] font-semibold text-emerald-400">
              💾 Đã lưu lúc {lastSavedAt}
            </span>
          )}
        </div>

        <OfficeAiCopilotBar
          docKind={docKind}
          title={title}
          markdownContent={markdown}
          sheets={sheets}
          onReplaceMarkdown={(next) => setMarkdown(next)}
          onAppendMarkdown={(add) => setMarkdown((prev) => (prev ? `${prev}\n\n${add}` : add))}
          onKidsCreated={() => navigate('/kids')}
        />

        {error && (
          <div className="rounded-2xl bg-rose-950/50 border border-rose-500/40 p-3 text-xs font-semibold text-rose-200 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="rounded-2xl bg-amber-950/40 border border-amber-500/40 p-3 text-xs font-semibold text-amber-200">
            ⚠️ {warnings.join(' ')}
          </div>
        )}

        {docKind === 'XLSX' ? (
          <SpreadsheetGridEditor sheets={sheets} onChange={setSheets} />
        ) : pdfPreviewUrl ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden h-[68vh] print:hidden">
              <iframe src={pdfPreviewUrl} title={title} className="w-full h-full border-0" />
            </div>
            <RichDocEditorPane value={markdown} onChange={setMarkdown} documentTitle={title} />
          </div>
        ) : (
          <RichDocEditorPane value={markdown} onChange={setMarkdown} documentTitle={title} />
        )}
      </div>
      <ImageBatchMergerModal
        open={isMergerOpen}
        onClose={() => setIsMergerOpen(false)}
        onApplyToStudio={(nextTitle, nextMd) => {
          setDocKind('DOCX');
          setPdfPreviewUrl(null);
          setTitle(nextTitle);
          setMarkdown(nextMd);
          setWarnings([]);
        }}
      />
      {isPdfToolboxOpen && (
        <Suspense fallback={null}>
          <PdfToolboxModal open={isPdfToolboxOpen} onClose={() => setIsPdfToolboxOpen(false)} />
        </Suspense>
      )}
    </div>
  );
};
export default OfficeWorkspacePage;
