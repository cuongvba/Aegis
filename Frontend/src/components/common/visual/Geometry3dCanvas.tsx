import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import type { DynamicVisualSpec } from './visual-types';

interface Geometry3dCanvasProps {
  spec: DynamicVisualSpec;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  label?: string;
}

interface Edge3D {
  from: number;
  to: number;
  dashed?: boolean;
}

export const Geometry3dCanvas: React.FC<Geometry3dCanvasProps> = ({ spec }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotX, setRotX] = useState<number>(0.45);
  const [rotY, setRotY] = useState<number>(0.65);
  const [zoom, setZoom] = useState<number>(1.0);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Định nghĩa các đỉnh & cạnh của các khối hình học không gian chuẩn mực
  const getSolidData = (): { vertices: Point3D[]; edges: Edge3D[] } => {
    const solidType = spec.solid || 'pyramid_s_abcd';

    if (solidType === 'pyramid_s_abc') {
      return {
        vertices: [
          { x: 0, y: 1.8, z: 0, label: 'S' },
          { x: -1.4, y: -1, z: 1.2, label: 'A' },
          { x: 1.4, y: -1, z: 1.2, label: 'B' },
          { x: 0.2, y: -1, z: -1.4, label: 'C' },
        ],
        edges: [
          { from: 1, to: 2, dashed: false }, // AB
          { from: 2, to: 3, dashed: false }, // BC
          { from: 3, to: 1, dashed: true },  // CA (khuất)
          { from: 0, to: 1, dashed: false }, // SA
          { from: 0, to: 2, dashed: false }, // SB
          { from: 0, to: 3, dashed: false }, // SC
        ],
      };
    }

    if (solidType === 'prism_triangular') {
      return {
        vertices: [
          // Đáy dưới ABC
          { x: -1.2, y: -1.3, z: 1.0, label: 'A' },
          { x: 1.2, y: -1.3, z: 1.0, label: 'B' },
          { x: 0.1, y: -1.3, z: -1.2, label: 'C' },
          // Đáy trên A'B'C'
          { x: -1.2, y: 1.3, z: 1.0, label: "A'" },
          { x: 1.2, y: 1.3, z: 1.0, label: "B'" },
          { x: 0.1, y: 1.3, z: -1.2, label: "C'" },
        ],
        edges: [
          { from: 0, to: 1, dashed: false },
          { from: 1, to: 2, dashed: false },
          { from: 2, to: 0, dashed: true },
          { from: 3, to: 4, dashed: false },
          { from: 4, to: 5, dashed: false },
          { from: 5, to: 3, dashed: false },
          { from: 0, to: 3, dashed: false },
          { from: 1, to: 4, dashed: false },
          { from: 2, to: 5, dashed: true },
        ],
      };
    }

    // Mặc định: Hình chóp S.ABCD
    return {
      vertices: [
        { x: 0, y: 2.0, z: 0, label: 'S' },
        { x: -1.5, y: -1.1, z: 1.2, label: 'A' },
        { x: 1.5, y: -1.1, z: 1.2, label: 'B' },
        { x: 1.8, y: -1.1, z: -1.0, label: 'C' },
        { x: -1.2, y: -1.1, z: -1.0, label: 'D' },
      ],
      edges: [
        { from: 1, to: 2, dashed: false }, // AB
        { from: 2, to: 3, dashed: false }, // BC
        { from: 3, to: 4, dashed: true },  // CD (khuất)
        { from: 4, to: 1, dashed: true },  // DA (khuất)
        { from: 0, to: 1, dashed: false }, // SA
        { from: 0, to: 2, dashed: false }, // SB
        { from: 0, to: 3, dashed: false }, // SC
        { from: 0, to: 4, dashed: true },  // SD (khuất)
      ],
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const { vertices, edges } = getSolidData();
    const scale = 75 * zoom;
    const cx = width / 2;
    const cy = height / 2;

    // Phép chiếu 3D sang 2D qua ma trận xoay Euler
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    const projected = vertices.map((v) => {
      // Xoay quanh trục Y
      const x1 = v.x * cosY + v.z * sinY;
      const z1 = -v.x * sinY + v.z * cosY;
      // Xoay quanh trục X
      const y2 = v.y * cosX - z1 * sinX;
      const z2 = v.y * sinX + z1 * cosX;

      // Chiếu phối cảnh
      const distance = 4.5;
      const fov = distance / (distance - z2);
      const px = cx + x1 * scale * fov;
      const py = cy - y2 * scale * fov;

      return { x: px, y: py, label: v.label };
    });

    // Vẽ các cạnh
    edges.forEach((edge) => {
      const p1 = projected[edge.from];
      const p2 = projected[edge.to];
      if (!p1 || !p2) return;

      ctx.beginPath();
      if (edge.dashed) {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
      } else {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
      }
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Vẽ các đỉnh và nhãn
    projected.forEach((p) => {
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();

      if (p.label && spec.showLabels !== false) {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(p.label, p.x + 6, p.y - 6);
      }
    });
  }, [rotX, rotY, zoom, spec]);

  // Xử lý kéo thả chuột & cảm ứng để xoay 3D
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - lastMousePosRef.current.x;
    const dy = clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: clientX, y: clientY };

    setRotY((prev) => prev + dx * 0.015);
    setRotX((prev) => Math.max(-1.4, Math.min(1.4, prev + dy * 0.015)));
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      <canvas
        ref={canvasRef}
        width={480}
        height={320}
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={() => { isDraggingRef.current = false; }}
        onMouseLeave={() => { isDraggingRef.current = false; }}
        onTouchStart={(e) => {
          if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={() => { isDraggingRef.current = false; }}
        className="w-full max-w-[480px] h-[320px] rounded-2xl bg-slate-950 border border-slate-800 shadow-inner cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Thanh điều khiển góc nhìn */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
          title="Phóng to"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <ZoomIn size={14} />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
          title="Thu nhỏ"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <ZoomOut size={14} />
        </button>
        <button
          type="button"
          onClick={() => { setRotX(0.45); setRotY(0.65); setZoom(1.0); }}
          title="Đặt lại góc nhìn"
          className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
        <span>Kéo chuột hoặc vuốt chạm để xoay 3D 360&deg;</span>
      </div>
    </div>
  );
};

