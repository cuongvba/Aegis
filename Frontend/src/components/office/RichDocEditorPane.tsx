import React, { useMemo, useRef, useState } from 'react';
import {
  Heading1,
  Heading2,
  Bold,
  Italic,
  List,
  Table2,
  Sigma,
  Quote,
  Eye,
  PenLine,
  Columns2,
  Sparkles,
} from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { MathFormulaStudioModal } from '@/components/common/math-studio/MathFormulaStudioModal';

interface RichDocEditorPaneProps {
  value: string;
  onChange: (next: string) => void;
}

export const RichDocEditorPane: React.FC<RichDocEditorPaneProps> = ({ value, onChange }) => {
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const stats = useMemo(() => {
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    const formulas = (value.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g) || []).length;
    const lines = value ? value.split('\n').length : 0;
    return { words, formulas, lines };
  }, [value]);

  const insertAtCursor = (snippet: string, wrapLeft?: string, wrapRight?: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange((value ? value + '\n' : '') + snippet);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const insertion =
      wrapLeft && wrapRight && selected
        ? `${wrapLeft}${selected}${wrapRight}`
        : snippet;

    const next = value.slice(0, start) + insertion + value.slice(end);
    onChange(next);
    window.setTimeout(() => {
      el.focus();
      const caret = start + insertion.length;
      el.setSelectionRange(caret, caret);
    }, 0);
  };

  const applyMathTemplate = () => {
    onChange(
      '# Đề Kiểm Tra Toán Học (Chuẩn LaTeX + KaTeX)\n\n' +
        '## Phần I. Trắc nghiệm\n\n' +
        '**Câu 1:** Giải phương trình bậc hai $ax^2 + bx + c = 0$ ($a \\neq 0$) bằng công thức nghiệm:\n' +
        '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\n' +
        '**Câu 2:** Tính tích phân xác định:\n' +
        '$$I = \\int_0^1 (3x^2 + 2x)\\,dx$$\n\n' +
        '| Tiêu chí | Điểm tối đa |\n| --- | --- |\n| Trình bày công thức | 5.0 |\n| Đáp số chính xác | 5.0 |'
    );
  };

  return (
    <div className="space-y-2.5">
      {/* Word-style Formatting & Math Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-3 py-2 print:hidden">
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => insertAtCursor('\n# Tiêu đề lớn\n')} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-200" title="Tiêu đề H1">
            <Heading1 size={14} /> H1
          </button>
          <button type="button" onClick={() => insertAtCursor('\n## Mục nhỏ\n')} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-200" title="Tiêu đề H2">
            <Heading2 size={14} /> H2
          </button>
          <button type="button" onClick={() => insertAtCursor('**chữ đậm**', '**', '**')} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-200" title="In đậm">
            <Bold size={14} />
          </button>
          <button type="button" onClick={() => insertAtCursor('*chữ nghiêng*', '*', '*')} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-200" title="In nghiêng">
            <Italic size={14} />
          </button>
          <button type="button" onClick={() => insertAtCursor('\n- Ý chính\n')} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-200">
            <List size={14} /> Danh sách
          </button>
          <button type="button" onClick={() => insertAtCursor('\n> Ghi chú quan trọng\n')} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-200" title="Trích dẫn">
            <Quote size={14} />
          </button>
          <button type="button" onClick={() => insertAtCursor('\n| Cột 1 | Cột 2 |\n| --- | --- |\n| Dữ liệu 1 | Dữ liệu 2 |\n')} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-200">
            <Table2 size={14} /> Bảng
          </button>
          <button
            type="button"
            onClick={() => setIsMathModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/50 hover:bg-amber-500/30 px-3 py-1.5 text-xs font-black text-amber-300"
          >
            <Sigma size={14} /> Soạn Công thức Toán (KaTeX)
          </button>
          <button
            type="button"
            onClick={applyMathTemplate}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 border border-indigo-400/40 hover:bg-indigo-500/30 px-2.5 py-1.5 text-xs font-bold text-indigo-200"
          >
            <Sparkles size={13} /> Mẫu Đề Toán
          </button>
        </div>

        <div className="inline-flex rounded-xl bg-slate-950 p-1 text-xs font-bold">
          <button type="button" onClick={() => setMode('edit')} className={`px-2.5 py-1 rounded-lg ${mode === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <PenLine size={13} className="inline mr-1" /> Mã nguồn
          </button>
          <button type="button" onClick={() => setMode('split')} className={`px-2.5 py-1 rounded-lg ${mode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Columns2 size={13} className="inline mr-1" /> Song song
          </button>
          <button type="button" onClick={() => setMode('preview')} className={`px-2.5 py-1 rounded-lg ${mode === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Eye size={13} className="inline mr-1" /> Trang A4 & Công thức
          </button>
        </div>
      </div>

      {/* Dual Pane: Source Editor + A4 KaTeX Rendered Paper */}
      <div className={`grid gap-4 ${mode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {mode !== 'preview' && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={20}
            placeholder="Nhập nội dung giáo án, đề thi hoặc công thức LaTeX ($x^2$, $$\frac{a}{b}$$)..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-slate-100 leading-relaxed focus:border-cyan-400 focus:outline-none print:hidden"
          />
        )}
        {mode !== 'edit' && (
          <div className="rounded-2xl border border-slate-300 bg-slate-200/90 p-3 sm:p-5 max-h-[68vh] overflow-y-auto print:max-h-none print:overflow-visible print:bg-white print:border-0 print:p-0">
            <article className="mx-auto max-w-[794px] min-h-[540px] rounded-xl bg-white px-6 py-7 sm:px-10 sm:py-9 text-slate-900 shadow-lg prose prose-slate max-w-none print:shadow-none print:p-0">
              <MathRenderer content={value || '*Chưa có nội dung.*'} className="text-[15px] leading-7 space-y-2" />
            </article>
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
        <span>Mẹo: Dùng `$...$` cho công thức cùng dòng, `$$...$$` cho công thức căn giữa</span>
      </div>

      <MathFormulaStudioModal
        isOpen={isMathModalOpen}
        onClose={() => setIsMathModalOpen(false)}
        onInsert={(formatted) => insertAtCursor(` ${formatted} `)}
      />
    </div>
  );
};
