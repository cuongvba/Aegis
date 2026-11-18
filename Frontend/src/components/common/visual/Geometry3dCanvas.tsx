import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Layers, Play, Pause, Eye } from 'lucide-react';
import type { DynamicVisualSpec } from './visual-types';
import { getSolidData, computeCrossSectionPolygon, type Point3D } from './geometry3dSolids';

interface Geometry3dCanvasProps {
  spec: DynamicVisualSpec;
}

export const Geometry3dCanvas: React.FC<Geometry3dCanvasProps> = ({ spec }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotX, setRotX] = useState<number>(0.42);
  const [rotY, setRotY] = useState<number>(0.65);
  const [zoom, setZoom] = useState<number>(1.0);
  const [autoRotate, setAutoRotate] = useState<boolean>(Boolean(spec.autoRotate));
  const [showProjection, setShowProjection] = useState<boolean>(Boolean(spec.showProjection));
  const [sliceEnabled, setSliceEnabled] = useState<boolean>(Boolean(spec.crossSection?.enabled));
  const [sliceHeight, setSliceHeight] = useState<number>(spec.crossSection?.heightRatio ?? 0.0);
  const [sliceTilt, setSliceTilt] = useState<number>(spec.crossSection?.tiltX ?? 0.15);

  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    setAutoRotate(Boolean(spec.autoRotate));
    setShowProjection(Boolean(spec.showProjection));
    setSliceEnabled(Boolean(spec.crossSection?.enabled));
    setSliceHeight(spec.crossSection?.heightRatio ?? 0.0);
    setSliceTilt(spec.crossSection?.tiltX ?? 0.15);
  }, [spec]);

  useEffect(() => {
    if (!autoRotate) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!isDraggingRef.current) {
        setRotY((prev) => prev + dt * 0.7);
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [autoRotate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const { vertices, edges } = getSolidData(spec.solid);
    const scale = 72 * zoom;
    const cx = width / 2;
    const cy = showProjection ? height / 2 - 22 : height / 2;

    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    const project = (v: Point3D) => {
      const x1 = v.x * cosY + v.z * sinY;
      const z1 = -v.x * sinY + v.z * cosY;
      const y2 = v.y * cosX - z1 * sinX;
      const z2 = v.y * sinX + z1 * cosX;
      const distance = 5.0;
      const fov = distance / (distance - z2);
      return { x: cx + x1 * scale * fov, y: cy - y2 * scale * fov, label: v.label };
    };

    const projected = vertices.map(project);
    const floorY = -1.75;

    // 1. Hình chiếu vuông góc lên mặt phẳng đáy y = floorY
    if (showProjection) {
      const floorQuad = [
        { x: -2.1, y: floorY, z: 2.1 },
        { x: 2.1, y: floorY, z: 2.1 },
        { x: 2.1, y: floorY, z: -2.1 },
        { x: -2.1, y: floorY, z: -2.1 },
      ].map(project);

      ctx.beginPath();
      floorQuad.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const floorProjected = vertices.map((v) => project({ x: v.x, y: floorY, z: v.z }));
      // Tia chiếu đứng
      projected.forEach((p, idx) => {
        if (vertices[idx].label) {
          ctx.beginPath();
          ctx.setLineDash([2, 4]);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(floorProjected[idx].x, floorProjected[idx].y);
          ctx.stroke();
        }
      });

      // Hình chiếu cạnh lên đáy
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
      ctx.lineWidth = 1.6;
      edges.forEach((e) => {
        ctx.beginPath();
        ctx.moveTo(floorProjected[e.from].x, floorProjected[e.from].y);
        ctx.lineTo(floorProjected[e.to].x, floorProjected[e.to].y);
        ctx.stroke();
      });
    }

    // 2. Các cạnh khối 3D
    edges.forEach((edge) => {
      const p1 = projected[edge.from];
      const p2 = projected[edge.to];
      ctx.beginPath();
      ctx.strokeStyle = edge.dashed ? '#64748b' : '#38bdf8';
      ctx.lineWidth = edge.dashed ? 1.4 : 2.3;
      ctx.setLineDash(edge.dashed ? [5, 5] : []);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // 3. Mặt cắt 3D (Cross-Section Polygon)
    let sectionVertsCount = 0;
    if (sliceEnabled) {
      const sectionPts = computeCrossSectionPolygon(vertices, edges, sliceHeight, sliceTilt);
      sectionVertsCount = sectionPts.length;
      if (sectionPts.length >= 3) {
        const projSec = sectionPts.map(project);
        ctx.beginPath();
        projSec.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.36)';
        ctx.fill();
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.6;
        ctx.stroke();
      }
    }

    // 4. Đỉnh & Nhãn
    projected.forEach((p) => {
      if (!p.label && spec.solid !== 'pyramid_s_abcd' && spec.solid !== 'pyramid_s_abc' && spec.solid !== 'prism_triangular' && spec.solid !== 'prism_quad') {
        return;
      }
      ctx.beginPath();
      ctx.fillStyle = '#fbbf24';
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      if (spec.showLabels !== false && p.label) {
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(p.label, p.x + 7, p.y - 6);
      }
    });

    if (sliceEnabled) {
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = '#34d399';
      ctx.fillText(`Thiết diện: ${sectionVertsCount} đỉnh (h = ${sliceHeight.toFixed(2)})`, 12, 22);
    }
  }, [rotX, rotY, zoom, spec.solid, spec.showLabels, showProjection, sliceEnabled, sliceHeight, sliceTilt]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    setRotY((prev) => prev + dx * 0.01);
    setRotX((prev) => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev + dy * 0.01)));
  };
  const stopDrag = () => { isDraggingRef.current = false; };

  return (
    <div className="space-y-2.5 w-full flex flex-col items-center">
      <div className="relative flex flex-col items-center w-full">
        <canvas
          ref={canvasRef}
          width={520}
          height={340}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          className="cursor-grab active:cursor-grabbing rounded-2xl bg-slate-950/90 border border-slate-800 shadow-inner w-full max-w-[520px] h-auto"
        />
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
          <button type="button" onClick={() => setAutoRotate((v) => !v)} className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 ${autoRotate ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
            {autoRotate ? <Pause size={12} /> : <Play size={12} />} Tự xoay 60fps
          </button>
          <button type="button" onClick={() => setSliceEnabled((v) => !v)} className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 ${sliceEnabled ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
            <Layers size={12} /> Mặt cắt 3D
          </button>
          <button type="button" onClick={() => setShowProjection((v) => !v)} className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 ${showProjection ? 'bg-sky-600 border-sky-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
            <Eye size={12} /> Hình chiếu đáy
          </button>
          <button type="button" onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))} className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"><ZoomIn size={14} /></button>
          <button type="button" onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))} className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"><ZoomOut size={14} /></button>
          <button type="button" onClick={() => { setRotX(0.42); setRotY(0.65); setZoom(1); }} className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700" title="Đặt lại"><RotateCcw size={14} /></button>
        </div>
      </div>

      {sliceEnabled && (
        <div className="w-full max-w-[520px] rounded-2xl bg-emerald-950/30 border border-emerald-500/30 p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="font-bold text-emerald-300">Độ cao mặt cắt (h = {sliceHeight.toFixed(2)})</span>
            <input type="range" min={-1.0} max={1.3} step={0.05} value={sliceHeight} onChange={(e) => setSliceHeight(Number(e.target.value))} className="accent-emerald-400" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-bold text-emerald-300">Độ nghiêng mặt phẳng ({sliceTilt.toFixed(2)})</span>
            <input type="range" min={-0.6} max={0.6} step={0.05} value={sliceTilt} onChange={(e) => setSliceTilt(Number(e.target.value))} className="accent-emerald-400" />
          </label>
        </div>
      )}
    </div>
  );
};
