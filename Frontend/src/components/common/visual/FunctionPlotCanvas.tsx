import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { DynamicVisualSpec, VisualParameter } from './visual-types';

interface FunctionPlotCanvasProps {
  spec: DynamicVisualSpec;
  paramValues: Record<string, number>;
}

export const FunctionPlotCanvas: React.FC<FunctionPlotCanvasProps> = ({ spec, paramValues }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  const xMin = spec.xRange?.[0] ?? -4;
  const xMax = spec.xRange?.[1] ?? 4;
  const yMin = spec.yRange?.[0] ?? -5;
  const yMax = spec.yRange?.[1] ?? 5;

  const evaluateFn = useCallback((x: number): number | null => {
    try {
      let expression = spec.fn || 'x^2';
      // Thay thế các tham số
      Object.entries(paramValues).forEach(([k, v]) => {
        const regex = new RegExp(`\\b${k}\\b`, 'g');
        expression = expression.replace(regex, `(${v})`);
      });
      // Chuẩn hóa cú pháp toán thông thường sang JS
      const sanitized = expression
        .replace(/\^/g, '**')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/e\^/g, 'Math.exp(')
        .replace(/pi/g, 'Math.PI');

      // Đánh giá hàm an toàn
      const fnCalc = new Function('x', `"use strict"; return (${sanitized});`);
      const res = fnCalc(x);
      if (typeof res !== 'number' || isNaN(res) || !isFinite(res)) return null;
      return res;
    } catch {
      return null;
    }
  }, [spec.fn, paramValues]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Chuyển đổi toạ độ thực sang toạ độ canvas
    const toScreenX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

    // 1. Xóa canvas
    ctx.clearRect(0, 0, width, height);

    // 2. Vẽ lưới toạ độ (Grid)
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

    // 3. Vẽ hai trục tọa độ Ox và Oy
    const originX = toScreenX(0);
    const originY = toScreenY(0);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    // Trục Ox
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();
    // Mũi tên Ox
    ctx.beginPath();
    ctx.moveTo(width - 8, originY - 4);
    ctx.lineTo(width, originY);
    ctx.lineTo(width - 8, originY + 4);
    ctx.stroke();

    // Trục Oy
    ctx.beginPath();
    ctx.moveTo(originX, height);
    ctx.lineTo(originX, 0);
    ctx.stroke();
    // Mũi tên Oy
    ctx.beginPath();
    ctx.moveTo(originX - 4, 8);
    ctx.lineTo(originX, 0);
    ctx.lineTo(originX + 4, 8);
    ctx.stroke();

    // Nhãn trục
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('x', width - 12, originY - 6);
    ctx.fillText('y', originX + 6, 12);
    ctx.fillText('O', originX - 12, originY + 14);

    // Đánh số trên trục
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      if (x === 0) continue;
      const sx = toScreenX(x);
      ctx.fillText(String(x), sx - 4, originY + 12);
    }
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      if (y === 0) continue;
      const sy = toScreenY(y);
      ctx.fillText(String(y), originX - 16, sy + 4);
    }

    // 4. Vẽ đường cong hàm số y = f(x)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const step = (xMax - xMin) / width;
    let isDrawing = false;

    for (let px = 0; px <= width; px++) {
      const rx = xMin + px * step;
      const ry = evaluateFn(rx);

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

    // 5. Vẽ điểm rê chuột nếu có
    if (hoverCoord) {
      const hx = toScreenX(hoverCoord.x);
      const hy = toScreenY(hoverCoord.y);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [xMin, xMax, yMin, yMax, evaluateFn, hoverCoord]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const rx = Number((xMin + (px / canvas.width) * (xMax - xMin)).toFixed(2));
    const ry = evaluateFn(rx);
    if (ry !== null) {
      setHoverCoord({ x: rx, y: Number(ry.toFixed(2)) });
    } else {
      setHoverCoord(null);
    }
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

