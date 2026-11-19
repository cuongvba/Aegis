import React, { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Clock, Download, FileText, Images, Sparkles, Trash2, Upload, X } from 'lucide-react';
import {
  buildMergedDocumentMarkdown,
  readImageFile,
  smartSortImageFiles,
  type BatchImageItem,
} from './smartImageSort';
import { officeWorkspaceService } from '@/services/officeWorkspace.service';

interface Props {
  open: boolean;
  onClose: () => void;
  onApplyToStudio: (title: string, markdown: string) => void;
}

export const ImageBatchMergerModal: React.FC<Props> = ({ open, onClose, onApplyToStudio }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [docTitle, setDocTitle] = useState('Tài liệu Tổng hợp từ Ảnh');
  const [items, setItems] = useState<BatchImageItem[]>([]);
  const [onePerPage, setOnePerPage] = useState(true);
  const [outputFmt, setOutputFmt] = useState<'DOCX' | 'MD' | 'PDF_PRINT' | 'XLSX'>('DOCX');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const loaded = await Promise.all(
        Array.from(files)
          .filter((f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(f.name))
          .map(readImageFile),
      );
      setItems((prev) => smartSortImageFiles([...prev, ...loaded], 'SMART'));
    } finally {
      setBusy(false);
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next);
  };

  const handleMergeAndExport = async (downloadImmediately: boolean) => {
    if (items.length === 0) return;
    const md = buildMergedDocumentMarkdown(docTitle, items, onePerPage);
    onApplyToStudio(docTitle, md);

    if (downloadImmediately) {
      if (outputFmt === 'DOCX') {
        await officeWorkspaceService.downloadDocx(docTitle, md);
      } else if (outputFmt === 'MD') {
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${docTitle.replace(/[^a-z0-9_\-\u00C0-\u024F\u1E00-\u1EFF]/gi, '_')}.md`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (outputFmt === 'XLSX') {
        await officeWorkspaceService.downloadXlsx(docTitle, [{
          name: 'Danh sách Trang Ảnh',
          rows: [
            ['STT', 'Tên ảnh gốc', 'Kích thước (px)', 'Gợi ý trang'],
            ...items.map((it, i) => [String(i + 1), it.name, `${it.width}x${it.height}`, String(it.pageHint ?? i + 1)]),
          ],
        }]);
      } else if (outputFmt === 'PDF_PRINT') {
        window.setTimeout(() => window.print(), 250);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Images className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm sm:text-base font-black">Ghép Nhiều Ảnh (Facebook / Scan) Thành 1 Tài Liệu</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-3 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <input ref={inputRef} type="file" multiple accept="image/*,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => void handleFiles(e.target.files)} />
            <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white">
              <Upload className="w-4 h-4" /> {busy ? 'Đang nạp...' : 'Chọn Nhiều Ảnh'}
            </button>
            <input
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="flex-1 min-w-[200px] rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              placeholder="Tên tài liệu sau khi ghép..."
            />
            <button onClick={() => setItems((p) => smartSortImageFiles(p, 'SMART'))} className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-violet-600/25 border border-violet-500/40 text-violet-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Xếp Thông Minh
            </button>
            <button onClick={() => setItems((p) => smartSortImageFiles(p, 'TIME'))} className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" /> Theo Giờ Tải
            </button>
            <button onClick={() => setItems((p) => smartSortImageFiles(p, 'NAME'))} className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold">
              A-Z / 1-10
            </button>
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void handleFiles(e.dataTransfer.files); }}
          className="flex-1 overflow-y-auto p-4"
        >
          {items.length === 0 ? (
            <div onClick={() => inputRef.current?.click()} className="h-56 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs cursor-pointer hover:border-sky-500">
              <Images className="w-10 h-10 mb-2 text-slate-500" />
              <p className="font-semibold text-slate-300">Kéo-thả hoặc bấm để chọn 5–50 ảnh tải từ Facebook / Zalo / máy ảnh</p>
              <p className="mt-1 opacity-75">Hệ thống tự động nhận diện số trang (Trang 1, Page 2...), số thứ tự tự nhiên & thời gian tải</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((it, idx) => (
                <div key={it.id} className="rounded-xl border border-slate-700 bg-slate-950 p-2 space-y-2">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-slate-900">
                    <img src={it.dataUrl} alt={it.name} className="w-full h-full object-contain" />
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-sky-600 text-[10px] font-black text-white">Trang {idx + 1}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 truncate" title={it.name}>{it.name}</div>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 rounded bg-slate-800 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="p-1 rounded bg-slate-800 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))} className="p-1 rounded bg-rose-500/20 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-800 bg-slate-950/70">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input type="checkbox" checked={onePerPage} onChange={(e) => setOnePerPage(e.target.checked)} />
              Mỗi ảnh 1 trang A4 riêng
            </label>
            <select value={outputFmt} onChange={(e) => setOutputFmt(e.target.value as typeof outputFmt)} className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs font-bold text-white">
              <option value="DOCX">Xuất Word (.DOCX)</option>
              <option value="MD">Xuất Markdown (.MD)</option>
              <option value="PDF_PRINT">Xuất / In PDF (A4)</option>
              <option value="XLSX">Xuất Bảng Excel (.XLSX)</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void handleMergeAndExport(false)} disabled={items.length === 0} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-white">
              <FileText className="w-4 h-4" /> Mở vào Office Studio
            </button>
            <button onClick={() => void handleMergeAndExport(true)} disabled={items.length === 0} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-black text-white">
              <Download className="w-4 h-4" /> Ghép & Tải Ngay ({items.length} ảnh)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
