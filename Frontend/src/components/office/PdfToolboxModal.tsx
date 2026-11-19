import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  Download,
  FilePlus2,
  ImagePlus,
  RotateCw,
  Scissors,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import {
  buildOrCompressPdf,
  formatFileSize,
  loadImageAsPdfPage,
  loadPdfFilePages,
  type PdfCompressionPreset,
  type PdfStudioPageItem,
} from './pdfStudioEngine';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const PdfToolboxModal: React.FC<Props> = ({ open, onClose }) => {
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const [pages, setPages] = useState<PdfStudioPageItem[]>([]);
  const [preset, setPreset] = useState<PdfCompressionPreset>('BALANCED');
  const [outputName, setOutputName] = useState('tai_lieu_toi_uu');
  const [originalBytes, setOriginalBytes] = useState(0);
  const [progress, setProgress] = useState<number | null>(null);
  const [resultInfo, setResultInfo] = useState<string | null>(null);

  if (!open) return null;

  const handleAddPdfs = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setResultInfo(null);
    let addedBytes = 0;
    const allNew: PdfStudioPageItem[] = [];
    for (const f of Array.from(files)) {
      if (!f.name.toLowerCase().endsWith('.pdf')) continue;
      addedBytes += f.size;
      const loaded = await loadPdfFilePages(f);
      allNew.push(...loaded);
    }
    setOriginalBytes((b) => b + addedBytes);
    setPages((prev) => [...prev, ...allNew]);
  };

  const handleAddImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setResultInfo(null);
    let addedBytes = 0;
    const allNew: PdfStudioPageItem[] = [];
    for (const f of Array.from(files)) {
      addedBytes += f.size;
      allNew.push(await loadImageAsPdfPage(f));
    }
    setOriginalBytes((b) => b + addedBytes);
    setPages((prev) => [...prev, ...allNew]);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const t = idx + dir;
    if (t < 0 || t >= pages.length) return;
    const next = [...pages];
    [next[idx], next[t]] = [next[t], next[idx]];
    setPages(next);
  };

  const rotate = (idx: number) => {
    setPages((prev) => prev.map((p, i) => (i === idx ? { ...p, rotation: (p.rotation + 90) % 360 } : p)));
  };

  const toggleSelect = (idx: number) => {
    setPages((prev) => prev.map((p, i) => (i === idx ? { ...p, selected: !p.selected } : p)));
  };

  const handleExport = async () => {
    if (pages.filter((p) => p.selected).length === 0) return;
    setProgress(5);
    setResultInfo(null);
    try {
      const { blob, outputBytes } = await buildOrCompressPdf(pages, preset, setProgress);
      const savedPct = originalBytes > 0 ? Math.round(((originalBytes - outputBytes) / originalBytes) * 100) : 0;
      setResultInfo(
        savedPct > 0
          ? `Đã xuất: ${formatFileSize(originalBytes)} → ${formatFileSize(outputBytes)} (Giảm ${savedPct}%)`
          : `Đã xuất thành công (${formatFileSize(outputBytes)})`,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(outputName || 'pdf_toi_uu').replace(/[^a-z0-9_\-]/gi, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setProgress(null);
    }
  };

  const selectedCount = pages.filter((p) => p.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/75">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-black">PDF Studio Pro — Nén Dung Lượng & Chèn / Cắt / Ghép / Đổi Vị Trí Trang</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center gap-2">
          <input ref={pdfInputRef} type="file" multiple accept=".pdf" className="hidden" onChange={(e) => void handleAddPdfs(e.target.files)} />
          <input ref={imgInputRef} type="file" multiple accept="image/*,.png,.jpg,.jpeg" className="hidden" onChange={(e) => void handleAddImages(e.target.files)} />
          <button onClick={() => pdfInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white">
            <FilePlus2 className="w-4 h-4" /> Thêm / Ghép PDF
          </button>
          <button onClick={() => imgInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white">
            <ImagePlus className="w-4 h-4" /> Chèn Trang Ảnh
          </button>
          <input
            value={outputName}
            onChange={(e) => setOutputName(e.target.value)}
            className="flex-1 min-w-[160px] rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
            placeholder="Tên file PDF đầu ra..."
          />
          {originalBytes > 0 && (
            <span className="text-xs text-slate-400 font-semibold">Gốc: {formatFileSize(originalBytes)} • {pages.length} trang</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {pages.length === 0 ? (
            <div onClick={() => pdfInputRef.current?.click()} className="h-56 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs cursor-pointer hover:border-emerald-500">
              <FilePlus2 className="w-10 h-10 mb-2 text-slate-500" />
              <p className="font-semibold text-slate-300">Bấm để nạp 1 hoặc nhiều file PDF cần nén, cắt trang hoặc ghép thứ tự</p>
              <p className="mt-1 opacity-75">Xử lý 100% trên trình duyệt — Bảo mật tuyệt đối, không tốn băng thông tải lên</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {pages.map((p, idx) => (
                <div key={p.id} className={`rounded-xl border p-2 space-y-2 transition ${p.selected ? 'border-emerald-500/60 bg-slate-950' : 'border-slate-800 bg-slate-950/40 opacity-50'}`}>
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-white flex items-center justify-center">
                    <img
                      src={p.thumbnailUrl}
                      alt={`Trang ${idx + 1}`}
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                      className="max-w-full max-h-full object-contain transition-transform"
                    />
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-slate-900/85 text-[10px] font-bold text-white">#{idx + 1}</span>
                    <button onClick={() => toggleSelect(idx)} className="absolute top-1.5 right-1.5 p-1 rounded bg-slate-900/80 text-emerald-400" title="Chọn / Bỏ trang này (Cắt trang)">
                      {p.selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{p.sourceName}</div>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 rounded bg-slate-800 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => move(idx, 1)} disabled={idx === pages.length - 1} className="p-1 rounded bg-slate-800 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => rotate(idx)} className="p-1 rounded bg-slate-800" title="Xoay 90°"><RotateCw className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={() => setPages((prev) => prev.filter((x) => x.id !== p.id))} className="p-1 rounded bg-rose-500/20 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-800 bg-slate-950/75">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-300">Mức nén PDF:</span>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as PdfCompressionPreset)}
              className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs font-bold text-white"
            >
              <option value="BALANCED">Cân bằng (~150 DPI — Giảm 60–80%, Rất rõ)</option>
              <option value="MAX_COMPRESS">Siêu nhẹ (~100 DPI — Giảm tối đa dung lượng)</option>
              <option value="HIGH_QUALITY">Sắc nét (~200 DPI — In ấn chất lượng cao)</option>
              <option value="LOSSLESS">Không nén ảnh (Giữ nguyên vector, chỉ cắt/ghép)</option>
            </select>
            {resultInfo && <span className="text-emerald-300 font-bold">{resultInfo}</span>}
          </div>

          <button
            onClick={() => void handleExport()}
            disabled={selectedCount === 0 || progress !== null}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-black text-white"
          >
            <Download className="w-4 h-4" />
            {progress !== null ? `Đang nén & xuất (${progress}%)...` : `Xuất PDF Tối Ưu (${selectedCount} trang)`}
          </button>
        </div>
      </div>
    </div>
  );
};
