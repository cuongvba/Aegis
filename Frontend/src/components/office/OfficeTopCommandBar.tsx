import React, { useState } from 'react';
import {
  ChevronDown,
  Download,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Images,
  Lock,
  Plus,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Stamp,
  Upload,
} from 'lucide-react';
import type { DocumentSecurityState } from './DocumentInspectorDrawer';

interface Props {
  title: string;
  onChangeTitle: (next: string) => void;
  docKind: 'DOCX' | 'PDF' | 'XLSX' | 'MARKDOWN';
  lastSavedAt: string | null;
  isLoading: boolean;
  security: DocumentSecurityState;
  showAiBar: boolean;
  onToggleAiBar: () => void;
  showInspector: boolean;
  onToggleInspector: () => void;
  onPickFile: () => void;
  onNewDoc: () => void;
  onNewSheet: () => void;
  onOpenMerger: () => void;
  onOpenPdfPro: () => void;
  onOpenArchive: () => void;
  onOpenSaveModal: () => void;
  onGoKids: () => void;
}

export const OfficeTopCommandBar: React.FC<Props> = ({
  title,
  onChangeTitle,
  docKind,
  lastSavedAt,
  isLoading,
  security,
  showAiBar,
  onToggleAiBar,
  showInspector,
  onToggleInspector,
  onPickFile,
  onNewDoc,
  onNewSheet,
  onOpenMerger,
  onOpenPdfPro,
  onOpenArchive,
  onOpenSaveModal,
  onGoKids,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="rounded-2xl bg-slate-900/95 border border-slate-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md print:hidden">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
          {docKind === 'XLSX' ? <FileSpreadsheet className="w-5 h-5 text-white" /> : <FileText className="w-5 h-5 text-white" />}
        </div>
        <div className="min-w-0 flex-1 max-w-md">
          <input
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Nhập tên tài liệu..."
            className="w-full bg-transparent text-sm sm:text-base font-black text-white focus:outline-none focus:bg-slate-950/70 rounded-lg px-2 py-0.5 border border-transparent focus:border-slate-700 truncate"
          />
          <div className="flex items-center gap-2 px-2 text-[11px] text-slate-400">
            <span className="font-bold text-sky-400">{docKind}</span>
            {lastSavedAt && <span>• Đã lưu {lastSavedAt}</span>}
            {security.watermarkEnabled && security.watermarkText.trim() && (
              <span className="inline-flex items-center gap-0.5 text-amber-300 font-semibold"><Stamp className="w-3 h-3" /> Stamp</span>
            )}
            {security.password.trim() && (
              <span className="inline-flex items-center gap-0.5 text-emerald-300 font-semibold"><Lock className="w-3 h-3" /> Khóa</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={onPickFile}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 font-bold text-slate-100 transition"
          title="Mở Word, PDF, Excel, Ảnh hoặc file nén .7z / .zip"
        >
          <Upload className="w-3.5 h-3.5 text-sky-400" /> Mở File
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-2 font-bold text-slate-200 transition"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" /> Mới <ChevronDown className="w-3 h-3" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-40">
              <button onClick={() => { onNewDoc(); setMenuOpen(false); }} className="w-full px-3 py-2 text-left hover:bg-slate-800 text-slate-200 font-semibold flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-sky-400" /> Tài liệu Word mới
              </button>
              <button onClick={() => { onNewSheet(); setMenuOpen(false); }} className="w-full px-3 py-2 text-left hover:bg-slate-800 text-slate-200 font-semibold flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Bảng tính Excel mới
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button onClick={() => { onGoKids(); setMenuOpen(false); }} className="w-full px-3 py-2 text-left hover:bg-slate-800 text-amber-300 font-semibold flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Mở Kids World
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center bg-slate-950/70 border border-slate-800 rounded-xl p-0.5 gap-0.5">
          <button type="button" onClick={onOpenMerger} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-semibold" title="Ghép nhiều ảnh thành 1 tài liệu + OCR">
            <Images className="w-3.5 h-3.5 text-violet-400" /> Ghép Ảnh
          </button>
          <button type="button" onClick={onOpenPdfPro} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-semibold" title="Nén PDF, chèn/cắt/ghép/xoay trang, Stamp & AES-256">
            <Scissors className="w-3.5 h-3.5 text-emerald-400" /> PDF Pro
          </button>
          <button type="button" onClick={onOpenArchive} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 font-semibold" title="Nén .7z AES-256 & Đọc trực tiếp file nén">
            <FileArchive className="w-3.5 h-3.5 text-amber-400" /> 7z Vault
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleAiBar}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-bold border transition ${
            showAiBar ? 'bg-violet-600/25 border-violet-400/60 text-violet-200' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" /> AI Co-Pilot
        </button>

        <button
          type="button"
          onClick={onToggleInspector}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-bold border transition ${
            showInspector ? 'bg-amber-600/20 border-amber-400/60 text-amber-200' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
          }`}
          title="Chèn/Bỏ Stamp, Watermark, Mật khẩu & Properties tài liệu"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" /> Stamp & Properties
        </button>

        <button
          type="button"
          onClick={onOpenSaveModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:opacity-95 px-4 py-2 font-black text-white shadow-lg transition"
        >
          <Download className="w-3.5 h-3.5" /> Lưu & Xuất...
        </button>
      </div>
    </header>
  );
};
