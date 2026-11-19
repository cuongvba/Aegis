import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import {
  officeWorkspaceService,
  type OfficeParsedDocument,
  type OfficeSheet,
} from '@/services/officeWorkspace.service';
import { RichDocEditorPane } from '@/components/office/RichDocEditorPane';
import { SpreadsheetGridEditor } from '@/components/office/SpreadsheetGridEditor';
import { OfficeAiCopilotBar } from '@/components/office/OfficeAiCopilotBar';
import { ImageBatchMergerModal } from '@/components/office/ImageBatchMergerModal';
import { OfficeTopCommandBar } from '@/components/office/OfficeTopCommandBar';
import {
  DocumentInspectorDrawer,
  type DocumentSecurityState,
} from '@/components/office/DocumentInspectorDrawer';
import { SaveExportModal } from '@/components/office/SaveExportModal';

const PdfToolboxModal = lazy(() =>
  import('@/components/office/PdfToolboxModal').then((m) => ({ default: m.PdfToolboxModal })),
);
const Archive7zModal = lazy(() =>
  import('@/components/office/Archive7zModal').then((m) => ({ default: m.Archive7zModal })),
);

const DRAFT_STORAGE_KEY = 'aegis-office-studio-draft-v1';

export const OfficeWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isMergerOpen, setIsMergerOpen] = useState(false);
  const [isPdfToolboxOpen, setIsPdfToolboxOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [showAiBar, setShowAiBar] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [pendingArchiveFile, setPendingArchiveFile] = useState<File | null>(null);

  const [docKind, setDocKind] = useState<'DOCX' | 'PDF' | 'XLSX' | 'MARKDOWN'>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
      return saved.docKind === 'XLSX' ? 'XLSX' : 'DOCX';
    } catch { return 'DOCX'; }
  });
  const [title, setTitle] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
      return saved.title || 'Văn Bản Giáo Án Mới';
    } catch { return 'Văn Bản Giáo Án Mới'; }
  });
  const [markdown, setMarkdown] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
      if (saved.markdown) return saved.markdown as string;
    } catch { /* ignore */ }
    return '# Tiêu đề bài giảng\n\nNhập nội dung tại đây...';
  });
  const [sheets, setSheets] = useState<OfficeSheet[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
      if (Array.isArray(saved.sheets) && saved.sheets.length > 0) return saved.sheets;
    } catch { /* ignore */ }
    return [{ name: 'BangDiem', rows: [['STT', 'Họ và tên', 'Điểm'], ['1', 'Nguyễn Minh Anh', '9.5']] }];
  });
  const [security, setSecurity] = useState<DocumentSecurityState>({
    watermarkEnabled: false,
    watermarkText: 'BẢN QUYỀN AEGIS — LƯU HÀNH NỘI BỘ',
    watermarkStyle: 'DIAGONAL',
    password: '',
    properties: {},
  });

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ docKind, title, markdown, sheets }));
        setLastSavedAt(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch { /* ignore quota */ }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [docKind, title, markdown, sheets]);

  useEffect(() => () => { if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl); }, [pdfPreviewUrl]);

  const applyParsedDocument = (parsed: OfficeParsedDocument, rawFile?: File) => {
    setDocKind(parsed.documentKind);
    setTitle(parsed.title || parsed.fileName);
    setWarnings(parsed.warnings || []);
    if (pdfPreviewUrl) { URL.revokeObjectURL(pdfPreviewUrl); setPdfPreviewUrl(null); }

    if (parsed.documentKind === 'PDF' && rawFile) {
      setPdfPreviewUrl(URL.createObjectURL(rawFile));
      setMarkdown(parsed.markdownContent || '');
    } else if (parsed.documentKind === 'XLSX') {
      setSheets(parsed.sheets.length > 0 ? parsed.sheets : [{ name: 'Sheet1', rows: [['Cột 1', 'Cột 2']] }]);
    } else {
      setMarkdown(parsed.markdownContent || '');
    }
  };

  const handleFilePick = async (file?: File) => {
    if (!file) return;
    if (/\.(7z|zip|tar|gz)$/i.test(file.name)) {
      setPendingArchiveFile(file);
      setIsArchiveOpen(true);
      return;
    }
    setIsLoading(true);
    setError(null);
    setWarnings([]);
    try {
      const parsed = await officeWorkspaceService.parseFile(file);
      applyParsedDocument(parsed, file);
    } catch {
      setError('Không thể đọc tệp này. Vui lòng kiểm tra định dạng .docx, .pdf, .xlsx, .xls, .md hoặc .7z/.zip.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.md,.txt,.7z,.zip"
        className="hidden"
        onChange={(e) => handleFilePick(e.target.files?.[0])}
      />

      <div className="max-w-[1680px] mx-auto space-y-3">
        <OfficeTopCommandBar
          title={title}
          onChangeTitle={setTitle}
          docKind={docKind}
          lastSavedAt={lastSavedAt}
          isLoading={isLoading}
          security={security}
          showAiBar={showAiBar}
          onToggleAiBar={() => setShowAiBar((v) => !v)}
          showInspector={showInspector}
          onToggleInspector={() => setShowInspector((v) => !v)}
          onPickFile={() => fileInputRef.current?.click()}
          onNewDoc={() => {
            if (pdfPreviewUrl) { URL.revokeObjectURL(pdfPreviewUrl); setPdfPreviewUrl(null); }
            setDocKind('DOCX');
            setTitle('Văn Bản Giáo Án Mới');
            setMarkdown('# Tiêu đề bài giảng\n\nNhập nội dung tại đây...');
            setWarnings([]);
          }}
          onNewSheet={() => {
            if (pdfPreviewUrl) { URL.revokeObjectURL(pdfPreviewUrl); setPdfPreviewUrl(null); }
            setDocKind('XLSX');
            setTitle('Bảng Điểm Mới');
            setSheets([{ name: 'Sheet1', rows: [['STT', 'Họ và tên', 'Điểm'], ['1', '', '']] }]);
            setWarnings([]);
          }}
          onOpenMerger={() => setIsMergerOpen(true)}
          onOpenPdfPro={() => setIsPdfToolboxOpen(true)}
          onOpenArchive={() => { setPendingArchiveFile(null); setIsArchiveOpen(true); }}
          onOpenSaveModal={() => setIsSaveModalOpen(true)}
          onGoHome={() => navigate('/')}
          onGoKids={() => navigate('/kids')}
        />

        {showAiBar && (
          <OfficeAiCopilotBar
            docKind={docKind}
            title={title}
            markdownContent={markdown}
            sheets={sheets}
            onReplaceMarkdown={(nextMd: string) => setMarkdown(nextMd)}
            onAppendMarkdown={(addMd: string) => setMarkdown((prev: string) => `${prev.trim()}\n\n---\n\n${addMd}`)}
            onKidsCreated={() => navigate('/kids')}
          />
        )}

        {(error || warnings.length > 0) && (
          <div className="rounded-xl bg-amber-950/50 border border-amber-500/40 px-4 py-2 text-xs text-amber-200 flex items-center gap-2 print:hidden">
            <AlertCircle size={15} className="text-amber-400 shrink-0" />
            <span>{error || warnings.join(' | ')}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-3 items-stretch">
          <div className="flex-1 min-w-0 relative">
            {security.watermarkEnabled && security.watermarkText.trim() && (
              <div className="pointer-events-none select-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden print:hidden">
                {security.watermarkStyle === 'DIAGONAL' ? (
                  <span className="-rotate-30 text-2xl sm:text-4xl font-black tracking-widest text-rose-500/15 uppercase text-center px-6">
                    {security.watermarkText}
                  </span>
                ) : (
                  <span className="absolute top-14 right-6 border-2 border-rose-500/45 text-rose-400/60 px-3 py-1 rounded-lg text-xs font-black uppercase">
                    {security.watermarkText}
                  </span>
                )}
              </div>
            )}

            {docKind === 'XLSX' ? (
              <SpreadsheetGridEditor sheets={sheets} onChange={setSheets} />
            ) : pdfPreviewUrl ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden h-[74vh] print:hidden">
                  <iframe src={pdfPreviewUrl} title={title} className="w-full h-full border-0" />
                </div>
                <RichDocEditorPane value={markdown} onChange={setMarkdown} documentTitle={title} />
              </div>
            ) : (
              <RichDocEditorPane value={markdown} onChange={setMarkdown} documentTitle={title} />
            )}
          </div>

          <DocumentInspectorDrawer
            open={showInspector}
            state={security}
            onChange={setSecurity}
            onClose={() => setShowInspector(false)}
          />
        </div>
      </div>

      <SaveExportModal
        open={isSaveModalOpen}
        docKind={docKind}
        title={title}
        markdown={markdown}
        sheets={sheets}
        security={security}
        onUpdateSecurity={setSecurity}
        onClose={() => setIsSaveModalOpen(false)}
      />

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
      {isArchiveOpen && (
        <Suspense fallback={null}>
          <Archive7zModal
            open={isArchiveOpen}
            initialArchiveFile={pendingArchiveFile}
            onClose={() => { setIsArchiveOpen(false); setPendingArchiveFile(null); }}
            onOpenParsedDoc={(parsed) => applyParsedDocument(parsed)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default OfficeWorkspacePage;
