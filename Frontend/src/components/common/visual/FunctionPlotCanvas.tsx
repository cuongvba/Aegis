import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { DynamicVisualSpec } from './visual-types';
import { evaluateMathExpression } from './mathExpressionEvaluator';

interface FunctionPlotCanvasProps {
  spec: DynamicVisualSpec;
  paramValues: Record<string, number>;
  timeValue?: number;
}

export const FunctionPlotCanvas: React.FC<FunctionPlotCanvasProps> = ({
  spec,
  paramValues,
  timeValue = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  const xMin = spec.xRange?.[0] ?? -4;
  const xMax = spec.xRange?.[1] ?? 4;
  const yMin = spec.yRange?.[0] ?? -5;
  const yMax = spec.yRange?.[1] ?? 5;

  const evaluateAt = useCallback(
    (expr: string, x: number, tOverride?: number): number | null =>
      evaluateMathExpression(expr, { ...paramValues, t: tOverride ?? timeValue, x }),
    [paramValues, timeValue]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const toScreenX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

    ctx.clearRect(0, 0, width, height);

    // 1. Lưới tọa độ (Grid)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
    }

    // 2. Hai trục Ox, Oy
    const originX = toScreenX(0);
    const originY = toScreenY(0);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, height);
    ctx.lineTo(originX, 0);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('x', width - 12, Math.max(12, Math.min(height - 6, originY - 6)));
    ctx.fillText('y', Math.max(6, Math.min(width - 14, originX + 6)), 12);
    if (originX > 10 && originX < width - 10 && originY > 10 && originY < height - 10) {
      ctx.fillText('O', originX - 12, originY + 14);
    }

    const drawCurve = (expr: string, color: string, lineWidth: number, dashed = false) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      if (dashed) ctx.setLineDash([6, 4]);
      ctx.beginPath();
      const step = (xMax - xMin) / width;
      let isDrawing = false;
      for (let px = 0; px <= width; px++) {
        const rx = xMin + px * step;
        const ry = evaluateAt(expr, rx);
        if (ry !== null && ry >= yMin - 10 && ry <= yMax + 10) {
          const sy = toScreenY(ry);
          if (!isDrawing) {
            ctx.moveTo(px, sy);
            isDrawing = true;
          } else {
            ctx.lineTo(px, sy);
          }
        } else {
          isDrawing = false;
        }
      }
      ctx.stroke();
      ctx.restore();
    };

    // 3. Đồ thị hàm số chính y = f(x, t) & đạo hàm f'(x, t)
    if (spec.fn) {
      drawCurve(spec.fn, '#f43f5e', 2.6);
    }
    if (spec.derivative) {
      drawCurve(spec.derivative, '#f59e0b', 1.8, true);
    }

    // 4. Quỹ đạo tham số theo thời gian (x(t), y(t)) + Chấm sáng chuyển động
    if (spec.parametric) {
      const tMin = spec.timeConfig?.min ?? 0;
      const tEnd = Math.max(tMin, timeValue);
      const samples = 160;
      if (spec.parametric.showTrail !== false && tEnd > tMin) {
        ctx.save();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= samples; i++) {
          const ti = tMin + ((tEnd - tMin) * i) / samples;
          const pxVal = evaluateMathExpression(spec.parametric.xFn, { ...paramValues, t: ti });
          const pyVal = evaluateMathExpression(spec.parametric.yFn, { ...paramValues, t: ti });
          if (pxVal !== null && pyVal !== null) {
            const sx = toScreenX(pxVal);
            const sy = toScreenY(pyVal);
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      const curX = evaluateMathExpression(spec.parametric.xFn, { ...paramValues, t: timeValue });
      const curY = evaluateMathExpression(spec.parametric.yFn, { ...paramValues, t: timeValue });
      if (curX !== null && curY !== null) {
        const cx = toScreenX(curX);
        const cy = toScreenY(curY);
        ctx.fillStyle = 'rgba(34, 211, 238, 0.25)';
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Điểm rê chuột
    if (hoverCoord) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(toScreenX(hoverCoord.x), toScreenY(hoverCoord.y), 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [xMin, xMax, yMin, yMax, spec.fn, spec.derivative, spec.parametric, spec.timeConfig, paramValues, timeValue, evaluateAt, hoverCoord]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !spec.fn) return;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const rx = Number((xMin + (px / canvas.width) * (xMax - xMin)).toFixed(2));
    const ry = evaluateAt(spec.fn, rx);
    setHoverCoord(ry !== null ? { x: rx, y: Number(ry.toFixed(2)) } : null);
  };

  return (
    <div className="relative flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={480}
        height={300}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverCoord(null)}
        className="w-full max-w-[480px] h-[300px] rounded-2xl bg-slate-950 border border-slate-800 shadow-inner cursor-crosshair touch-none"
      />
      {hoverCoord && (
        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-[11px] font-mono font-bold text-emerald-400 shadow-lg pointer-events-none">
          M({hoverCoord.x}, {hoverCoord.y})
        </div>
      )}
    </div>
  );
};
