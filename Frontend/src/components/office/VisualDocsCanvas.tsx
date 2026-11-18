import React, { useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Image as ImageIcon,
  Table2,
  Sigma,
  Minus,
} from 'lucide-react';
import { compileMathAndMarkdownHtml } from '@/shared/lib/quiz/mathHtmlCompiler';

interface VisualDocsCanvasProps {
  markdown: string;
  onSyncMarkdown: (nextText: string) => void;
  onOpenMathModal: () => void;
  zoomPct: number;
  fontFamily: string;
  fontSizePx: number;
}

export const VisualDocsCanvas: React.FC<VisualDocsCanvasProps> = ({
  markdown,
  onSyncMarkdown,
  onOpenMathModal,
  zoomPct,
  fontFamily,
  fontSizePx,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const lastSyncedRef = useRef<string>('');

  useEffect(() => {
    const el = editorRef.current;
    if (!el || markdown === lastSyncedRef.current) return;
    el.innerHTML = compileMathAndMarkdownHtml(markdown || '<p>Bắt đầu nhập tài liệu...</p>', 1.35) || '<p></p>';
    lastSyncedRef.current = markdown;
  }, [markdown]);

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    syncUp();
  };

  const syncUp = () => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.innerText.replace(/\u00A0/g, ' ');
    lastSyncedRef.current = text;
    onSyncMarkdown(text);
  };

  const insertTable = () => {
    const html =
      '<table style="width:100%;border-collapse:collapse;margin:12px 0;">' +
      '<tr><th style="border:1px solid #cbd5e1;padding:6px 10px;background:#f8fafc;">Cột 1</th><th style="border:1px solid #cbd5e1;padding:6px 10px;background:#f8fafc;">Cột 2</th></tr>' +
      '<tr><td style="border:1px solid #cbd5e1;padding:6px 10px;">Nội dung 1</td><td style="border:1px solid #cbd5e1;padding:6px 10px;">Nội dung 2</td></tr>' +
      '</table><p><br/></p>';
    exec('insertHTML', html);
  };

  const handleImageUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        exec('insertHTML', `<img src="${reader.result}" alt="image" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2.5 flex-1 min-w-0">
      {/* Google Docs Visual Formatting Bar */}
      <div className="flex flex-wrap items-center gap-1 rounded-2xl bg-slate-900 border border-slate-800 px-3 py-1.5 print:hidden">
        <button type="button" onClick={() => exec('undo')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300" title="Hoàn tác"><Undo2 size={14} /></button>
        <button type="button" onClick={() => exec('redo')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300" title="Làm lại"><Redo2 size={14} /></button>
        <span className="h-4 w-px bg-slate-700 mx-1" />
        <select
          onChange={(e) => { if (e.target.value) exec('formatBlock', e.target.value); }}
          defaultValue="p"
          className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs font-bold text-slate-200"
        >
          <option value="p">Văn bản thường</option>
          <option value="h1">Tiêu đề 1</option>
          <option value="h2">Tiêu đề 2</option>
          <option value="h3">Tiêu đề 3</option>
        </select>
        <span className="h-4 w-px bg-slate-700 mx-1" />
        <button type="button" onClick={() => exec('bold')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200" title="In đậm"><Bold size={14} /></button>
        <button type="button" onClick={() => exec('italic')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200" title="In nghiêng"><Italic size={14} /></button>
        <button type="button" onClick={() => exec('underline')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200" title="Gạch chân"><Underline size={14} /></button>
        <button type="button" onClick={() => exec('strikeThrough')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200" title="Gạch ngang"><Strikethrough size={14} /></button>
        <input type="color" defaultValue="#0f172a" onChange={(e) => exec('foreColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0" title="Màu chữ" />
        <input type="color" defaultValue="#fef08a" onChange={(e) => exec('hiliteColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0" title="Màu tô sáng" />
        <span className="h-4 w-px bg-slate-700 mx-1" />
        <button type="button" onClick={() => exec('justifyLeft')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200" title="Căn trái"><AlignLeft size={14} /></button>
        <button type="button" onClick={() => exec('justifyCenter')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200" title="Căn giữa"><AlignCenter size={14} /></button>
        <button type="button" onClick={() => exec('justifyRight')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200" title="Căn phải"><AlignRight size={14} /></button>
        <span className="h-4 w-px bg-slate-700 mx-1" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200" title="Danh sách chấm"><List size={14} /></button>
        <button type="button" onClick={() => exec('insertOrderedList')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200" title="Danh sách số"><ListOrdered size={14} /></button>
        <button type="button" onClick={insertTable} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200" title="Chèn bảng"><Table2 size={14} /></button>
        <button type="button" onClick={() => exec('insertHorizontalRule')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200" title="Đường kẻ ngang"><Minus size={14} /></button>
        <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0])} />
        <button type="button" onClick={() => imgInputRef.current?.click()} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200" title="Chèn ảnh"><ImageIcon size={14} /></button>
        <button
          type="button"
          onClick={onOpenMathModal}
          className="ml-1 inline-flex items-center gap-1 rounded-lg bg-amber-500/20 border border-amber-400/50 hover:bg-amber-500/30 px-2.5 py-1 text-xs font-black text-amber-300"
        >
          <Sigma size={13} /> Chèn Công thức
        </button>
      </div>

      {/* Google Docs A4 Paper Workspace */}
      <div className="rounded-2xl border border-slate-700 bg-slate-300/90 p-4 sm:p-7 max-h-[68vh] overflow-auto print:bg-white print:border-0 print:p-0 print:max-h-none">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncUp}
          style={{
            transform: `scale(${zoomPct / 100})`,
            transformOrigin: 'top center',
            fontFamily,
            fontSize: `${fontSizePx}px`,
          }}
          className="mx-auto max-w-[794px] min-h-[960px] rounded-lg bg-white px-8 py-10 sm:px-14 sm:py-12 text-slate-900 shadow-2xl focus:outline-none leading-relaxed space-y-2 print:shadow-none print:p-0"
        />
      </div>
    </div>
  );
};
