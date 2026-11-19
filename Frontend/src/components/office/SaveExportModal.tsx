import React, { useState } from 'react';
import { Archive, CloudUpload, Download, ExternalLink, FileCheck2, Lock, Shield, Stamp, X } from 'lucide-react';
import { officeWorkspaceService, type OfficeSheet } from '@/services/officeWorkspace.service';
import type { DocumentSecurityState } from './DocumentInspectorDrawer';
import {
  buildUtf8CsvBlob,
  requestGoogleDriveAccessToken,
  uploadToGoogleDrive,
  type GoogleDriveTargetKind,
  type GoogleDriveUploadResult,
} from './googleDriveExporter';

interface Props {
  open: boolean;
  docKind: 'DOCX' | 'PDF' | 'XLSX' | 'MARKDOWN';
  title: string;
  markdown: string;
  sheets: OfficeSheet[];
  security: DocumentSecurityState;
  onUpdateSecurity: (next: DocumentSecurityState) => void;
  onClose: () => void;
}

type ExportFormat = 'DOCX' | 'GOOGLE_DOC' | 'XLSX' | 'GOOGLE_SHEET' | 'MD' | 'PDF_PRINT';
type SaveDestination = 'ORIGINAL' | 'COMPRESSED_7Z' | 'GOOGLE_DRIVE';

export const SaveExportModal: React.FC<Props> = ({
  open,
  docKind,
  title,
  markdown,
  sheets,
  security,
  onUpdateSecurity,
  onClose,
}) => {
  const [format, setFormat] = useState<ExportFormat>(docKind === 'XLSX' ? 'XLSX' : 'DOCX');
  const [saveMode, setSaveMode] = useState<SaveDestination>('ORIGINAL');
  const [googleClientId, setGoogleClientId] = useState(() => import.meta.env.VITE_GOOGLE_CLIENT_ID || '');
  const [driveToken, setDriveToken] = useState('');
  const [driveResult, setDriveResult] = useState<GoogleDriveUploadResult | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const safeBase = (title || 'aegis-document').trim().replace(/[^a-z0-9_\-\u00C0-\u024F\u1E00-\u1EFF]/gi, '_');

  const handleConnectGoogle = async () => {
    setDriveError(null);
    try {
      const token = await requestGoogleDriveAccessToken(googleClientId);
      setDriveToken(token);
    } catch (err) {
      setDriveError(err instanceof Error ? err.message : 'Không thể kết nối Google Drive.');
    }
  };

  const buildPayloadBlob = async (): Promise<{ blob: Blob; fileName: string; targetKind: GoogleDriveTargetKind }> => {
    const wm = security.watermarkEnabled && security.watermarkText.trim() ? security.watermarkText.trim() : undefined;
    const pwd = security.password.trim() || undefined;

    if (format === 'DOCX' || format === 'GOOGLE_DOC') {
      const blob = await officeWorkspaceService.buildDocxBlob(title, markdown, wm, pwd, security.properties);
      return { blob, fileName: `${safeBase}.docx`, targetKind: format === 'GOOGLE_DOC' ? 'GOOGLE_DOC' : 'RAW_FILE' };
    }
    if (format === 'XLSX' || format === 'GOOGLE_SHEET') {
      const blob = await officeWorkspaceService.buildXlsxBlob(title, sheets);
      return { blob, fileName: `${safeBase}.xlsx`, targetKind: format === 'GOOGLE_SHEET' ? 'GOOGLE_SHEET' : 'RAW_FILE' };
    }
    const blob = new Blob([markdown || ''], { type: 'text/markdown;charset=utf-8' });
    return { blob, fileName: `${safeBase}.md`, targetKind: 'RAW_FILE' };
  };

  const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmSave = async () => {
    if (format === 'PDF_PRINT') {
      onClose();
      window.setTimeout(() => window.print(), 200);
      return;
    }

    setBusy(true);
    setDriveError(null);
    setDriveResult(null);
    try {
      const { blob, fileName, targetKind } = await buildPayloadBlob();
      const pwd = security.password.trim() || undefined;

      if (saveMode === 'GOOGLE_DRIVE') {
        let token = driveToken.trim();
        if (!token && googleClientId.trim()) {
          token = await requestGoogleDriveAccessToken(googleClientId);
          setDriveToken(token);
        }
        const uploaded = await uploadToGoogleDrive({
          blob,
          fileName: title.trim() || fileName,
          targetKind: format === 'GOOGLE_DOC' ? 'GOOGLE_DOC' : format === 'GOOGLE_SHEET' ? 'GOOGLE_SHEET' : targetKind,
          accessToken: token,
        });
        setDriveResult(uploaded);
        return;
      }

      if (saveMode === 'COMPRESSED_7Z') {
        const file = new File([blob], fileName, { type: blob.type });
        await officeWorkspaceService.pack7z([file], safeBase, pwd);
      } else if (format === 'GOOGLE_SHEET' && sheets.length === 1) {
        triggerDownload(blob, fileName);
      } else {
        triggerDownload(blob, fileName);
      }
      onClose();
    } catch (err) {
      setDriveError(err instanceof Error ? err.message : 'Lưu tài liệu thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/75">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm sm:text-base font-black">Lưu & Xuất Tài Liệu (Office / Google Drive / 7z)</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">1. Chọn định dạng tài liệu / bảng tính</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'DOCX', label: 'Word (.docx)' },
                { id: 'GOOGLE_DOC', label: 'Google Docs (Tương thích)' },
                { id: 'XLSX', label: 'Excel (.xlsx)' },
                { id: 'GOOGLE_SHEET', label: 'Google Sheets (Tương thích)' },
                { id: 'MD', label: 'Markdown (.md)' },
                { id: 'PDF_PRINT', label: 'In / Xuất PDF' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    const next = opt.id as ExportFormat;
                    setFormat(next);
                    if ((next === 'GOOGLE_DOC' || next === 'GOOGLE_SHEET') && saveMode === 'COMPRESSED_7Z') {
                      setSaveMode('GOOGLE_DRIVE');
                    }
                  }}
                  className={`py-2 px-3 rounded-xl border font-bold transition ${format === opt.id ? 'bg-indigo-600/25 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {format !== 'PDF_PRINT' && (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">2. Chế độ lưu & Đích lưu trữ</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button onClick={() => setSaveMode('ORIGINAL')} className={`p-3 rounded-2xl border text-left transition ${saveMode === 'ORIGINAL' ? 'bg-emerald-600/15 border-emerald-400' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center gap-1.5 font-black text-slate-100"><FileCheck2 className="w-4 h-4 text-emerald-400" /> Nguyên Bản</div>
                  <div className="text-[11px] text-slate-400 mt-1">Tải về máy định dạng chuẩn.</div>
                </button>
                <button onClick={() => setSaveMode('COMPRESSED_7Z')} className={`p-3 rounded-2xl border text-left transition ${saveMode === 'COMPRESSED_7Z' ? 'bg-amber-600/15 border-amber-400' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center gap-1.5 font-black text-slate-100"><Archive className="w-4 h-4 text-amber-400" /> Nén .7z AES-256</div>
                  <div className="text-[11px] text-slate-400 mt-1">Nén gọn + ẩn tên tệp (-mhe=on).</div>
                </button>
                <button onClick={() => setSaveMode('GOOGLE_DRIVE')} className={`p-3 rounded-2xl border text-left transition ${saveMode === 'GOOGLE_DRIVE' ? 'bg-sky-600/15 border-sky-400' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center gap-1.5 font-black text-slate-100"><CloudUpload className="w-4 h-4 text-sky-400" /> Google Drive</div>
                  <div className="text-[11px] text-slate-400 mt-1">Lưu trực tiếp thành Google Docs / Sheets.</div>
                </button>
              </div>
            </div>
          )}

          {saveMode === 'GOOGLE_DRIVE' && format !== 'PDF_PRINT' && (
            <div className="rounded-2xl bg-sky-950/30 border border-sky-500/40 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-sky-300">Kết nối Google Drive (Scope: drive.file)</span>
                <div className="flex gap-2">
                  {googleClientId.trim() && (
                    <button onClick={() => void handleConnectGoogle()} className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 font-bold text-white">
                      Đăng nhập Google
                    </button>
                  )}
                  {(format === 'GOOGLE_SHEET' || format === 'XLSX') && (
                    <button onClick={() => triggerDownload(buildUtf8CsvBlob(sheets[0]?.rows || []), `${safeBase}.csv`)} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold">
                      Tải CSV UTF-8 (Import Sheets)
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} placeholder="Google OAuth Client ID (nếu dùng nút Đăng nhập)" className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-white" />
                <input type="password" value={driveToken} onChange={(e) => setDriveToken(e.target.value)} placeholder="Hoặc dán OAuth Access Token..." className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-white" />
              </div>
              {driveResult && (
                <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 p-2.5 flex items-center justify-between text-emerald-300 font-bold">
                  <span>Đã lưu "{driveResult.name}" lên Google Drive!</span>
                  <a href={driveResult.webViewLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                    Mở trên Google <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
              {driveError && <div className="text-rose-300 font-semibold">{driveError}</div>}
            </div>
          )}

          <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> Mật khẩu bảo vệ khi lưu</span>
              {security.watermarkEnabled && security.watermarkText.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  <Stamp className="w-3 h-3" /> Stamp: {security.watermarkText.slice(0, 18)}
                </span>
              )}
            </div>
            <input
              type="password"
              value={security.password}
              onChange={(e) => onUpdateSecurity({ ...security, password: e.target.value })}
              placeholder="Nhập mật khẩu khóa file / mã hóa .7z (để trống nếu không khóa)..."
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-white"
            />
            {security.properties.author && (
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-sky-400" /> Properties: Tác giả <b>{security.properties.author}</b> {security.properties.company ? `• ${security.properties.company}` : ''}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/75 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300">Đóng</button>
          <button
            onClick={() => void handleConfirmSave()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-black text-white shadow-lg"
          >
            <Download className="w-4 h-4" /> {busy ? 'Đang xử lý...' : saveMode === 'GOOGLE_DRIVE' ? 'Lưu lên Google Drive' : saveMode === 'COMPRESSED_7Z' ? 'Nén & Tải .7z' : 'Lưu & Tải Về'}
          </button>
        </div>
      </div>
    </div>
  );
};
