import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Maximize2,
  Minimize2,
  Check,
  Copy,
  Trash2,
  Sparkles,
  AlertTriangle,
  Code2,
  Eye,
  Sigma,
} from 'lucide-react';
import { MathPaletteCategory } from './MathPaletteCategory';
import { useMathStudioState, type DisplayMode } from './useMathStudioState';
import { MathRenderer } from '@/components/common/MathRenderer';

export interface MathFormulaStudioModalProps {
  isOpen: boolean;
  initialLatex?: string;
  defaultMode?: DisplayMode;
  onClose: () => void;
  onInsert: (formattedFormula: string) => void;
}

export const MathFormulaStudioModal: React.FC<MathFormulaStudioModalProps> = ({
  isOpen,
  initialLatex = '',
  defaultMode = 'inline',
  onClose,
  onInsert,
}) => {
  const { t } = useTranslation('math');
  const {
    latexCode,
    setLatexCode,
    displayMode,
    setDisplayMode,
    validationError,
    copied,
    isFullscreen,
    setIsFullscreen,
    activeTab,
    setActiveTab,
    searchFilter,
    setSearchFilter,
    recentFormulas,
    textareaRef,
    insertSnippet,
    getFormattedFormula,
    handleConfirmInsert,
    handleCopy,
    handleClear,
  } = useMathStudioState({
    initialLatex,
    defaultMode,
    onInsert: formula => {
      onInsert(formula);
      onClose();
    },
    onClose,
  });

  // Hotkey support: Ctrl+Enter to insert, Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleConfirmInsert();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleConfirmInsert, onClose]);

  if (!isOpen) return null;

  const currentPreviewFormula = getFormattedFormula() || `$\\text{${t('previewPlaceholder', 'Xem trước công thức tại đây')}}$`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`flex flex-col bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-full h-full max-w-none rounded-none' : 'w-full max-w-5xl max-h-[92vh]'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sigma className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                {t('title', 'Hệ Soạn Thảo Công Thức Toán Học Toàn Diện')}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {t('badge', 'World-Class Studio')}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {t('subtitle', 'Chọn mẫu công thức trực quan hoặc gõ mã LaTeX (Hỗ trợ mhchem, KaTeX)')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsFullscreen(prev => !prev)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullscreen ? t('minimize', 'Thu nhỏ') : t('fullscreen', 'Toàn màn hình')}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title={t('close', 'Đóng (Esc)')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <MathPaletteCategory
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              searchFilter={searchFilter}
              setSearchFilter={setSearchFilter}
              recentFormulas={recentFormulas}
              onSelectSnippet={insertSnippet}
            />
          </div>

          {/* Dual Workspace: LaTeX Editor + Live KaTeX Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: LaTeX Code Input */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  {t('latexSource', 'Mã nguồn LaTeX')}
                </span>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('inline')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      displayMode === 'inline' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t('inlineMode', 'Inline ($...$)')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('block')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      displayMode === 'block' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t('blockMode', 'Block ($$...$$)')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('raw')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      displayMode === 'raw' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t('rawMode', 'Raw')}
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                value={latexCode}
                onChange={e => setLatexCode(e.target.value)}
                placeholder={t('latexPlaceholder', 'Nhấp vào biểu tượng ở trên hoặc gõ trực tiếp cú pháp LaTeX...')}
                rows={5}
                className="w-full p-3 font-mono text-sm bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-600 outline-none resize-none transition-all"
              />

              {validationError ? (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{validationError}</span>
                </div>
              ) : latexCode.trim() ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('validSyntax', 'Cú pháp KaTeX hợp lệ!')}</span>
                </div>
              ) : null}
            </div>

            {/* Right: Live Rendered Preview */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  {t('previewTitle', 'Kết quả hiển thị thực tế (Vector Render)')}
                </span>
                <span className="text-[10px] text-slate-500">{t('previewSubtitle', 'KaTeX + mhchem 0ms')}</span>
              </div>

              <div className="flex-1 min-h-[125px] flex items-center justify-center p-4 rounded-xl bg-slate-900/70 border border-slate-800 overflow-x-auto text-slate-100 text-base sm:text-lg">
                <MathRenderer content={currentPreviewFormula} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              disabled={!latexCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('clearAll', 'Xóa sạch')}</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!latexCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t('codeCopied', 'Đã sao chép') : t('copyCode', 'Sao chép mã')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t('cancel', 'Hủy')}
            </button>
            <button
              type="button"
              onClick={handleConfirmInsert}
              disabled={!latexCode.trim() || !!validationError}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-md shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>{t('insertButton', 'Chèn vào Câu hỏi (Ctrl + Enter)')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MathFormulaStudioModal;
