import { Eraser, PenTool, RotateCcw, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { QuestionWidgetProps } from './types';

export default function HandwritingWidget({
  question,
  answer,
  onUpdate,
  disabled,
}: QuestionWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [penColor, setPenColor] = useState('#0284c7');
  const [showGuide, setShowGuide] = useState(true);

  const targetGlyph = useMemo(() => {
    const raw = (question.payload as any)?.targetGlyph || question.answerRaw || 'A';
    return String(raw).trim().slice(0, 12);
  }, [question.payload, question.answerRaw]);

  useEffect(() => {
    if (!answer?.shortText) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setStrokeCount(0);
    }
  }, [question.id]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    };
  };

  const commitCanvasSnapshot = (nextStrokes: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let painted = 0;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] > 20) painted++;
    }
    const totalSampled = data.length / 16;
    const coveragePct = Number(((painted / Math.max(1, totalSampled)) * 100).toFixed(2));
    onUpdate({
      shortText: JSON.stringify({ strokes: nextStrokes, coveragePct }),
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const next = strokeCount + 1;
    setStrokeCount(next);
    commitCanvasSnapshot(next);
  };

  const handleClear = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokeCount(0);
    onUpdate({ shortText: '' });
  };

  return (
    <div className="space-y-3 rounded-2xl border-2 border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/60 p-4 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-indigo-900">
          <PenTool className="h-4 w-4 text-indigo-600" />
          Tập viết &amp; Vẽ nét thông minh (Handwriting Canvas)
        </div>
        <div className="flex items-center gap-2">
          {['#0284c7', '#7c3aed', '#059669', '#e11d48'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setPenColor(c)}
              className={`h-5 w-5 rounded-full border-2 transition ${penColor === c ? 'border-slate-900 scale-110' : 'border-white'}`}
              style={{ backgroundColor: c }}
              title="Đổi màu bút"
            />
          ))}
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50"
          >
            <Sparkles className="h-3 w-3" /> {showGuide ? 'Ẩn nét mờ' : 'Hiện nét mờ'}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={handleClear}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            <Eraser className="h-3 w-3" /> Xóa bảng
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-indigo-300 bg-white shadow-inner">
        {showGuide && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="font-sans text-[120px] font-black tracking-widest text-slate-200/80 select-none">
              {targetGlyph}
            </span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={640}
          height={240}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative z-10 h-56 w-full touch-none cursor-crosshair"
        />
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>Số nét đã viết: <strong className="text-indigo-700">{strokeCount}</strong></span>
        {strokeCount > 0 && (
          <button type="button" onClick={handleClear} className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800">
            <RotateCcw className="h-3 w-3" /> Viết lại
          </button>
        )}
      </div>
    </div>
  );
}
