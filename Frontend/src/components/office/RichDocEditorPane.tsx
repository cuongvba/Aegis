import React, { useRef, useState } from 'react';
import { Heading1, Heading2, List, Table2, Sigma, Eye, PenLine } from 'lucide-react';

interface RichDocEditorPaneProps {
  value: string;
  onChange: (next: string) => void;
}

export const RichDocEditorPane: React.FC<RichDocEditorPaneProps> = ({ value, onChange }) => {
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertSnippet = (snippet: string) => {
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
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 0);
  };

  const renderPreviewLine = (line: string, idx: number) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('<!--')) return <div key={idx} className="h-2" />;
    if (trimmed.startsWith('### ')) return <h3 key={idx} className="text-base font-bold text-slate-800 mt-3">{trimmed.slice(4)}</h3>;
    if (trimmed.startsWith('## ')) return <h2 key={idx} className="text-lg font-extrabold text-indigo-900 mt-4">{trimmed.slice(3)}</h2>;
    if (trimmed.startsWith('# ')) return <h1 key={idx} className="text-2xl font-black text-slate-900 mt-4 pb-1 border-b border-slate-200">{trimmed.slice(2)}</h1>;
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return <li key={idx} className="ml-5 list-disc text-sm text-slate-700 leading-relaxed">{trimmed.slice(2)}</li>;
    if (trimmed.startsWith('|')) {
      const cells = trimmed.replace(/^\|+|\|+$/g, '').split('|').map((c) => c.trim());
      if (cells.every((c) => /^-+$/.test(c))) return null;
      return (
        <div key={idx} className="grid grid-flow-col auto-cols-fr border border-slate-300 bg-slate-50 text-xs">
          {cells.map((c, cIdx) => (
            <div key={cIdx} className="px-2.5 py-1.5 border-r last:border-r-0 border-slate-300 font-medium text-slate-800">
              {c}
            </div>
          ))}
        </div>
      );
    }
    return <p key={idx} className="text-sm text-slate-700 leading-relaxed">{trimmed}</p>;
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => insertSnippet('\n# Tiêu đề lớn\n')} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-200">
            <Heading1 size={14} /> H1
          </button>
          <button type="button" onClick={() => insertSnippet('\n## Mục nhỏ\n')} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-200">
            <Heading2 size={14} /> H2
          </button>
          <button type="button" onClick={() => insertSnippet('\n- Ý chính\n')} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-200">
            <List size={14} /> Danh sách
          </button>
          <button type="button" onClick={() => insertSnippet('\n| Cột 1 | Cột 2 |\n| --- | --- |\n| Dữ liệu 1 | Dữ liệu 2 |\n')} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-200">
            <Table2 size={14} /> Bảng
          </button>
          <button type="button" onClick={() => insertSnippet(' $a^2 + b^2 = c^2$ ')} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-amber-300">
            <Sigma size={14} /> Công thức
          </button>
        </div>

        <div className="inline-flex rounded-xl bg-slate-950 p-1 text-xs font-bold">
          <button type="button" onClick={() => setMode('edit')} className={`px-2.5 py-1 rounded-lg ${mode === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
            <PenLine size={13} className="inline mr-1" /> Soạn thảo
          </button>
          <button type="button" onClick={() => setMode('split')} className={`px-2.5 py-1 rounded-lg ${mode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
            Song song
          </button>
          <button type="button" onClick={() => setMode('preview')} className={`px-2.5 py-1 rounded-lg ${mode === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
            <Eye size={13} className="inline mr-1" /> Xem trang in
          </button>
        </div>
      </div>

      <div className={`grid gap-4 ${mode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {mode !== 'preview' && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={18}
            placeholder="Nhập hoặc dán nội dung giáo án, đề thi, công thức toán..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-slate-100 leading-relaxed focus:border-cyan-400 focus:outline-none"
          />
        )}
        {mode !== 'edit' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-inner max-h-[60vh] overflow-y-auto print:border-0 print:shadow-none">
            {value.split('\n').map(renderPreviewLine)}
          </div>
        )}
      </div>
    </div>
  );
};
