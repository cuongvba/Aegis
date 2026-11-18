import React, { useMemo, useRef, useState } from 'react';
import {
  Sigma,
  Eye,
  PenLine,
  Columns2,
  Sparkles,
  Search,
  FileSpreadsheet,
} from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { MathFormulaStudioModal } from '@/components/common/math-studio/MathFormulaStudioModal';
import { DocumentOutlineSidebar } from './DocumentOutlineSidebar';
import { FindReplaceBar } from './FindReplaceBar';
import { VisualDocsCanvas } from './VisualDocsCanvas';

interface RichDocEditorPaneProps {
  value: string;
  onChange: (next: string) => void;
}

export const RichDocEditorPane: React.FC<RichDocEditorPaneProps> = ({ value, onChange }) => {
  const [mode, setMode] = useState<'visual' | 'split' | 'preview'>('visual');
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [zoomPct, setZoomPct] = useState(100);
  const [fontFamily, setFontFamily] = useState("'Inter', system-ui, sans-serif");
  const [fontSizePx, setFontSizePx] = useState(15);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const stats = useMemo(() => {
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    const formulas = (value.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g) || []).length;
    const lines = value ? value.split('\n').length : 0;
    return { words, formulas, lines };
  }, [value]);

  const insertAtCursor = (snippet: string) => {
    if (mode !== 'split') {
      onChange((value ? value + '\n' : '') + snippet);
      return;
    }
    const el = textareaRef.current;
    if (!el) {
      onChange((value ? value + '\n' : '') + snippet);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
    window.setTimeout(() => {
      el.focus();
      const caret = start + snippet.length;
      el.setSelectionRange(caret, caret);
    }, 0);
  };

  const applyTemplate = (kind: 'math' | 'lesson5e') => {
    if (kind === 'math') {
      onChange(
        '# Đề Kiểm Tra Toán Học (Chuẩn LaTeX + KaTeX)\n\n' +
          '## Phần I. Trắc nghiệm\n\n' +
          '**Câu 1:** Giải phương trình bậc hai $ax^2 + bx + c = 0$ ($a \\neq 0$) bằng công thức nghiệm:\n' +
          '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\n' +
          '**Câu 2:** Tính tích phân xác định:\n' +
          '$$I = \\int_0^1 (3x^2 + 2x)\\,dx$$\n\n' +
          '| Tiêu chí | Điểm tối đa |\n| --- | --- |\n| Trình bày công thức | 5.0 |\n| Đáp số chính xác | 5.0 |'
      );
    } else {
      onChange(
        '# Giáo Án Theo Mô Hình 5E\n\n' +
          '## 1. Gắn kết (Engage)\n- Đặt câu hỏi gợi mở liên hệ thực tế trong 5 phút.\n\n' +
          '## 2. Khám phá (Explore)\n- Học sinh thảo luận nhóm và ghi nhận kết quả vào phiếu.\n\n' +
          '## 3. Giải thích (Explain) & Áp dụng (Elaborate)\n- Giáo viên chuẩn hóa khái niệm trọng tâm.\n\n' +
          '| Hoạt động | Thời lượng | Hình thức |\n| --- | --- | --- |\n| Khởi động | 5 phút | Cả lớp |\n| Thực hành | 20 phút | Nhóm 4 |'
      );
    }
  };

  const handleJumpToHeading = (_heading: string, lineIndex: number) => {
    if (mode !== 'split') setMode('split');
    window.setTimeout(() => {
      const el = textareaRef.current;
      if (!el) return;
      const lines = value.split('\n').slice(0, lineIndex);
      const pos = lines.join('\n').length;
      el.focus();
      el.setSelectionRange(pos, pos);
    }, 40);
  };

  return (
    <div className="space-y-2.5">
      {/* Google Docs Top Workspace Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-3 py-2 print:hidden">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex rounded-xl bg-slate-950 p-1 text-xs font-bold">
            <button type="button" onClick={() => setMode('visual')} className={`px-2.5 py-1 rounded-lg ${mode === 'visual' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <PenLine size={13} className="inline mr-1" /> Google Docs Trực quan
            </button>
            <button type="button" onClick={() => setMode('split')} className={`px-2.5 py-1 rounded-lg ${mode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Columns2 size={13} className="inline mr-1" /> Song song LaTeX
            </button>
            <button type="button" onClick={() => setMode('preview')} className={`px-2.5 py-1 rounded-lg ${mode === 'preview' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Eye size={13} className="inline mr-1" /> Trang A4
            </button>
          </div>

          <select
            value={zoomPct}
            onChange={(e) => setZoomPct(Number(e.target.value))}
            className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs font-bold text-slate-200"
            title="Thu phóng trang"
          >
            <option value={80}>80%</option>
            <option value={90}>90%</option>
            <option value={100}>100%</option>
            <option value={115}>115%</option>
            <option value={125}>125%</option>
          </select>

          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs font-bold text-slate-200"
            title="Phông chữ"
          >
            <option value="'Inter', system-ui, sans-serif">Sans (Hiện đại)</option>
            <option value="'Georgia', 'Times New Roman', serif">Serif (Sách/Đề thi)</option>
            <option value="'JetBrains Mono', monospace">Mono (Kỹ thuật)</option>
          </select>

          <select
            value={fontSizePx}
            onChange={(e) => setFontSizePx(Number(e.target.value))}
            className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs font-bold text-slate-200"
            title="Cỡ chữ"
          >
            <option value={13}>13px</option>
            <option value={15}>15px</option>
            <option value={16}>16px</option>
            <option value={18}>18px</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setShowFindReplace((v) => !v)} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-200">
            <Search size={13} /> Tìm & Thay thế
          </button>
          <button type="button" onClick={() => applyTemplate('math')} className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 border border-indigo-400/40 hover:bg-indigo-500/30 px-2.5 py-1.5 text-xs font-bold text-indigo-200">
            <Sparkles size={13} /> Mẫu Đề Toán
          </button>
          <button type="button" onClick={() => applyTemplate('lesson5e')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 hover:bg-emerald-500/30 px-2.5 py-1.5 text-xs font-bold text-emerald-200">
            <FileSpreadsheet size={13} /> Mẫu Giáo Án 5E
          </button>
          <button type="button" onClick={() => setIsMathModalOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 border border-amber-400/50 hover:bg-amber-500/30 px-2.5 py-1.5 text-xs font-black text-amber-300">
            <Sigma size={13} /> KaTeX Studio
          </button>
        </div>
      </div>

      {showFindReplace && (
        <FindReplaceBar
          markdown={value}
          onChange={onChange}
          onClose={() => setShowFindReplace(false)}
        />
      )}

      {/* Main Workspace: Outline Sidebar + Active Editor Mode */}
      <div className="flex gap-4 items-start">
        <DocumentOutlineSidebar markdown={value} onJumpToHeading={handleJumpToHeading} />

        {mode === 'visual' ? (
          <VisualDocsCanvas
            markdown={value}
            onSyncMarkdown={onChange}
            onOpenMathModal={() => setIsMathModalOpen(true)}
            zoomPct={zoomPct}
            fontFamily={fontFamily}
            fontSizePx={fontSizePx}
          />
        ) : (
          <div className={`flex-1 min-w-0 grid gap-4 ${mode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {mode === 'split' && (
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={22}
                placeholder="Nhập nội dung giáo án, đề thi hoặc công thức LaTeX ($x^2$, $$\frac{a}{b}$$)..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-slate-100 leading-relaxed focus:border-cyan-400 focus:outline-none print:hidden"
              />
            )}
            <div className="rounded-2xl border border-slate-300 bg-slate-300/90 p-3 sm:p-5 max-h-[68vh] overflow-auto print:max-h-none print:overflow-visible print:bg-white print:border-0 print:p-0">
              <article
                style={{
                  transform: `scale(${zoomPct / 100})`,
                  transformOrigin: 'top center',
                  fontFamily,
                  fontSize: `${fontSizePx}px`,
                }}
                className="mx-auto max-w-[794px] min-h-[720px] rounded-lg bg-white px-7 py-8 sm:px-12 sm:py-10 text-slate-900 shadow-2xl prose prose-slate max-w-none print:shadow-none print:p-0"
              >
                <MathRenderer content={value || '*Chưa có nội dung.*'} className="leading-relaxed space-y-2" />
              </article>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-[11px] font-semibold text-slate-400 print:hidden">
        <div className="flex items-center gap-4">
          <span>📝 {stats.words} từ</span>
          <span>📄 {stats.lines} dòng</span>
          <span className="text-amber-300">∑ {stats.formulas} công thức LaTeX/KaTeX</span>
        </div>
        <span>Dùng Google Docs Trực quan để bấm sửa thẳng trên trang A4, hoặc Song song LaTeX để gõ công thức nhanh</span>
      </div>

      <MathFormulaStudioModal
        isOpen={isMathModalOpen}
        onClose={() => setIsMathModalOpen(false)}
        onInsert={(formatted) => insertAtCursor(` ${formatted} `)}
      />
    </div>
  );
};
