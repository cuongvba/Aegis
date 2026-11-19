import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sigma,
  Eye,
  PenLine,
  Columns2,
  Sparkles,
  Search,
  FileSpreadsheet,
  Scissors,
  Columns3,
  BookOpen,
} from 'lucide-react';
import { MathFormulaStudioModal } from '@/components/common/math-studio/MathFormulaStudioModal';
import { DocumentOutlineSidebar } from './DocumentOutlineSidebar';
import { FindReplaceBar } from './FindReplaceBar';
import { VisualDocsCanvas } from './VisualDocsCanvas';
import { PaginatedA4Viewer, type MarginPreset } from './PaginatedA4Viewer';
import { DocumentOverviewAndReaderModal } from './DocumentOverviewAndReaderModal';

interface RichDocEditorPaneProps {
  value: string;
  onChange: (next: string) => void;
  documentTitle?: string;
}

export const RichDocEditorPane: React.FC<RichDocEditorPaneProps> = ({
  value,
  onChange,
  documentTitle,
}) => {
  const [mode, setMode] = useState<'visual' | 'split' | 'preview'>('visual');
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [zoomPct, setZoomPct] = useState(100);
  const [fontFamily, setFontFamily] = useState("'Inter', system-ui, sans-serif");
  const [fontSizePx, setFontSizePx] = useState(15);
  const [lineHeight, setLineHeight] = useState(1.55);
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal');
  const [twoColumnExam, setTwoColumnExam] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const prevLenRef = useRef(0);

  useEffect(() => {
    const jumped = Math.abs((value?.length || 0) - prevLenRef.current) > 120;
    prevLenRef.current = value?.length || 0;
    if (jumped && /(\$[^$\n]+\$|data:image\/)/i.test(value)) {
      setMode('split');
    }
  }, [value]);

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
          '---page---\n\n' +
          '## Phần II. Tự luận\n\n' +
          '**Câu 2:** Tính tích phân xác định:\n' +
          '$$I = \\int_0^1 (3x^2 + 2x)\\,dx$$\n\n' +
          '| Tiêu chí | Điểm tối đa |\n| --- | --- |\n| Trình bày công thức | 5.0 |\n| Đáp số chính xác | 5.0 |'
      );
      setMode('split');
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
      {/* Top Google Docs & Academic Pagination Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-3 py-2 print:hidden">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex rounded-xl bg-slate-950 p-1 text-xs font-bold">
            <button type="button" onClick={() => setMode('visual')} className={`px-2.5 py-1 rounded-lg ${mode === 'visual' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <PenLine size={13} className="inline mr-1" /> Google Docs
            </button>
            <button type="button" onClick={() => setMode('split')} className={`px-2.5 py-1 rounded-lg ${mode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Columns2 size={13} className="inline mr-1" /> Song song LaTeX
            </button>
            <button type="button" onClick={() => setMode('preview')} className={`px-2.5 py-1 rounded-lg ${mode === 'preview' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Eye size={13} className="inline mr-1" /> Phân trang A4
            </button>
            <button type="button" onClick={() => setIsReaderOpen(true)} className="px-2.5 py-1 rounded-lg bg-violet-600/20 text-violet-200 hover:bg-violet-600 hover:text-white transition">
              <BookOpen size={13} className="inline mr-1" /> Đọc & Tổng quan
            </button>
          </div>

          <select value={zoomPct} onChange={(e) => setZoomPct(Number(e.target.value))} className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs font-bold text-slate-200" title="Thu phóng">
            <option value={80}>80%</option>
            <option value={90}>90%</option>
            <option value={100}>100%</option>
            <option value={115}>115%</option>
            <option value={125}>125%</option>
          </select>

          <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs font-bold text-slate-200" title="Phông chữ">
            <option value="'Inter', system-ui, sans-serif">Sans (Hiện đại)</option>
            <option value="'Georgia', 'Times New Roman', serif">Serif (Sách/Đề thi)</option>
            <option value="'JetBrains Mono', monospace">Mono (Kỹ thuật)</option>
          </select>

          <select value={fontSizePx} onChange={(e) => setFontSizePx(Number(e.target.value))} className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs font-bold text-slate-200" title="Cỡ chữ">
            <option value={13}>13px</option>
            <option value={15}>15px</option>
            <option value={16}>16px</option>
            <option value={18}>18px</option>
          </select>

          <select value={marginPreset} onChange={(e) => setMarginPreset(e.target.value as MarginPreset)} className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs font-bold text-slate-200" title="Căn lề A4">
            <option value="narrow">Lề hẹp (1.2cm)</option>
            <option value="normal">Lề chuẩn (2cm)</option>
            <option value="wide">Lề rộng (2.5cm)</option>
          </select>

          <select value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs font-bold text-slate-200" title="Giãn dòng">
            <option value={1.35}>Dòng 1.35</option>
            <option value={1.55}>Dòng 1.55</option>
            <option value={1.8}>Dòng 1.80</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setTwoColumnExam((v) => !v)} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold border ${twoColumnExam ? 'bg-sky-500/20 border-sky-400 text-sky-200' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
            <Columns3 size={13} /> 2 Cột Đề
          </button>
          <button type="button" onClick={() => insertAtCursor('\n\n---page---\n\n')} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-200" title="Chèn ngắt trang A4 mới">
            <Scissors size={13} /> Ngắt trang
          </button>
          <button type="button" onClick={() => setShowFindReplace((v) => !v)} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-200">
            <Search size={13} /> Tìm/Thay
          </button>
          <button type="button" onClick={() => applyTemplate('math')} className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 border border-indigo-400/40 hover:bg-indigo-500/30 px-2.5 py-1.5 text-xs font-bold text-indigo-200">
            <Sparkles size={13} /> Mẫu Đề Toán
          </button>
          <button type="button" onClick={() => applyTemplate('lesson5e')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 hover:bg-emerald-500/30 px-2.5 py-1.5 text-xs font-bold text-emerald-200">
            <FileSpreadsheet size={13} /> Giáo Án 5E
          </button>
          <button type="button" onClick={() => setIsMathModalOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 border border-amber-400/50 hover:bg-amber-500/30 px-2.5 py-1.5 text-xs font-black text-amber-300">
            <Sigma size={13} /> KaTeX Studio
          </button>
        </div>
      </div>

      {showFindReplace && (
        <FindReplaceBar markdown={value} onChange={onChange} onClose={() => setShowFindReplace(false)} />
      )}

      {/* Main Workspace: Outline Sidebar + Active Mode */}
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
                rows={24}
                placeholder="Nhập nội dung giáo án, đề thi hoặc công thức LaTeX ($x^2$, $$\frac{a}{b}$$)..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-slate-100 leading-relaxed focus:border-cyan-400 focus:outline-none print:hidden"
              />
            )}
            <PaginatedA4Viewer
              content={value}
              pageHeader={documentTitle}
              zoomPct={zoomPct}
              fontFamily={fontFamily}
              fontSizePx={fontSizePx}
              lineHeight={lineHeight}
              marginPreset={marginPreset}
              twoColumnExam={twoColumnExam}
            />
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
        <span>Dùng `---page---` hoặc nút Ngắt trang để chia trang A4 chuẩn xác khi xuất Word & In PDF</span>
      </div>

      <MathFormulaStudioModal
        isOpen={isMathModalOpen}
        onClose={() => setIsMathModalOpen(false)}
        onInsert={(formatted) => insertAtCursor(` ${formatted} `)}
      />
      <DocumentOverviewAndReaderModal
        open={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
        title={documentTitle || 'Tài liệu Aegis Office'}
        markdown={value}
      />
    </div>
  );
};
