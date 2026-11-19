import React, { useState } from 'react';
import { Archive, Download, FileCheck2, Lock, Shield, Stamp, X } from 'lucide-react';
import { officeWorkspaceService, type OfficeSheet } from '@/services/officeWorkspace.service';
import type { DocumentSecurityState } from './DocumentInspectorDrawer';

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
  const [format, setFormat] = useState<'DOCX' | 'MD' | 'XLSX' | 'PDF_PRINT'>(docKind === 'XLSX' ? 'XLSX' : 'DOCX');
  const [saveMode, setSaveMode] = useState<'ORIGINAL' | 'COMPRESSED_7Z'>('ORIGINAL');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const safeBase = (title || 'aegis-document').trim().replace(/[^a-z0-9_\-\u00C0-\u024F\u1E00-\u1EFF]/gi, '_');

  const handleConfirmSave = async () => {
    if (format === 'PDF_PRINT') {
      onClose();
      window.setTimeout(() => window.print(), 200);
      return;
    }

    setBusy(true);
    try {
      const wm = security.watermarkEnabled && security.watermarkText.trim() ? security.watermarkText.trim() : undefined;
      const pwd = security.password.trim() || undefined;

      if (saveMode === 'ORIGINAL') {
        if (format === 'DOCX') {
          await officeWorkspaceService.downloadDocx(title, markdown, wm, pwd, security.properties);
        } else if (format === 'XLSX') {
          await officeWorkspaceService.downloadXlsx(title, sheets);
        } else {
          const blob = new Blob([markdown || ''], { type: 'text/markdown;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${safeBase}.md`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        let innerBlob: Blob;
        let innerName: string;
        if (format === 'DOCX') {
          innerBlob = await officeWorkspaceService.buildDocxBlob(title, markdown, wm, pwd, security.properties);
          innerName = `${safeBase}.docx`;
        } else if (format === 'XLSX') {
          innerBlob = await officeWorkspaceService.buildXlsxBlob(title, sheets);
          innerName = `${safeBase}.xlsx`;
        } else {
          innerBlob = new Blob([markdown || ''], { type: 'text/markdown;charset=utf-8' });
          innerName = `${safeBase}.md`;
        }
        const file = new File([innerBlob], innerName, { type: innerBlob.type });
        await officeWorkspaceService.pack7z([file], safeBase, pwd);
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/75">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm sm:text-base font-black">Lưu & Xuất Tài Liệu Thông Minh</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">1. Chọn định dạng tệp</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'DOCX', label: 'Word (.docx)' },
                { id: 'MD', label: 'Markdown (.md)' },
                { id: 'XLSX', label: 'Excel (.xlsx)' },
                { id: 'PDF_PRINT', label: 'In / Xuất PDF' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFormat(opt.id as typeof format)}
                  className={`py-2 px-3 rounded-xl border font-bold transition ${format === opt.id ? 'bg-indigo-600/25 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {format !== 'PDF_PRINT' && (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">2. Chế độ đóng gói khi lưu</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => setSaveMode('ORIGINAL')}
                  className={`p-3 rounded-2xl border text-left transition ${saveMode === 'ORIGINAL' ? 'bg-emerald-600/15 border-emerald-400' : 'bg-slate-950 border-slate-800'}`}
                >
                  <div className="flex items-center gap-1.5 font-black text-slate-100"><FileCheck2 className="w-4 h-4 text-emerald-400" /> Lưu Nguyên Bản</div>
                  <div className="text-[11px] text-slate-400 mt-1">Xuất thẳng định dạng gốc (.docx/.xlsx/.md) kèm Stamp & Properties.</div>
                </button>
                <button
                  onClick={() => setSaveMode('COMPRESSED_7Z')}
                  className={`p-3 rounded-2xl border text-left transition ${saveMode === 'COMPRESSED_7Z' ? 'bg-amber-600/15 border-amber-400' : 'bg-slate-950 border-slate-800'}`}
                >
                  <div className="flex items-center gap-1.5 font-black text-slate-100"><Archive className="w-4 h-4 text-amber-400" /> Nén Bảo Mật (.7z)</div>
                  <div className="text-[11px] text-slate-400 mt-1">Nén gọn & mã hóa AES-256 + ẩn tên tệp (-mhe=on) chuẩn ATTT.</div>
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> Đặt mật khẩu bảo vệ khi lưu</span>
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
                <Shield className="w-3.5 h-3.5 text-sky-400" /> Metadata Properties: Tác giả <b>{security.properties.author}</b> {security.properties.company ? `• ${security.properties.company}` : ''}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/75 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300">Hủy</button>
          <button
            onClick={() => void handleConfirmSave()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-black text-white shadow-lg"
          >
            <Download className="w-4 h-4" /> {busy ? 'Đang xử lý...' : saveMode === 'COMPRESSED_7Z' && format !== 'PDF_PRINT' ? 'Nén & Tải .7z' : 'Lưu & Tải Về'}
          </button>
        </div>
      </div>
    </div>
  );
};
