import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { DynamicVisualSpec } from './visual-types';
import { visualAudioEngine } from './visualAudioEngine';

interface PhysicsCollisionCanvasProps {
  spec: DynamicVisualSpec;
}

export const PhysicsCollisionCanvas: React.FC<PhysicsCollisionCanvasProps> = ({ spec }) => {
  const cfg = spec.physicsConfig || { m1: 2.0, m2: 1.0, v1: 2.4, v2: -1.6, restitution: 1.0 };

  const [m1, setM1] = useState(cfg.m1);
  const [m2, setM2] = useState(cfg.m2);
  const [initV1, setInitV1] = useState(cfg.v1);
  const [initV2, setInitV2] = useState(cfg.v2);
  const [restitution, setRestitution] = useState(cfg.restitution);
  const [isPlaying, setIsPlaying] = useState(true);
  const [telemetry, setTelemetry] = useState({ v1: cfg.v1, v2: cfg.v2, collisions: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ x1: 120, x2: 390, v1: cfg.v1, v2: cfg.v2, flash: 0, collisions: 0 });

  const resetSim = (playNow = true) => {
    stateRef.current = { x1: 115, x2: 395, v1: initV1, v2: initV2, flash: 0, collisions: 0 };
    setTelemetry({ v1: initV1, v2: initV2, collisions: 0 });
    setIsPlaying(playNow);
  };

  useEffect(() => {
    setM1(cfg.m1);
    setM2(cfg.m2);
    setInitV1(cfg.v1);
    setInitV2(cfg.v2);
    setRestitution(cfg.restitution);
    stateRef.current = { x1: 115, x2: 395, v1: cfg.v1, v2: cfg.v2, flash: 0, collisions: 0 };
  }, [cfg.m1, cfg.m2, cfg.v1, cfg.v2, cfg.restitution]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let last = performance.now();

    const drawArrow = (x: number, y: number, vx: number, color: string) => {
      const len = Math.max(-90, Math.min(90, vx * 22));
      if (Math.abs(len) < 4) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
      const dir = Math.sign(len);
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.moveTo(x + len, y);
      ctx.lineTo(x + len - dir * 8, y - 5);
      ctx.lineTo(x + len - dir * 8, y + 5);
      ctx.closePath();
      ctx.fill();
    };

    const tick = (now: number) => {
      const dt = Math.min(0.035, (now - last) / 1000);
      last = now;
      const st = stateRef.current;
      const r1 = 18 + Math.min(18, m1 * 3.5);
      const r2 = 18 + Math.min(18, m2 * 3.5);
      const W = canvas.width;
      const floorY = 175;

      if (isPlaying) {
        const pxScale = 55;
        st.x1 += st.v1 * pxScale * dt;
        st.x2 += st.v2 * pxScale * dt;

        // Wall bounces
        if (st.x1 - r1 < 18) { st.x1 = 18 + r1; st.v1 = Math.abs(st.v1); }
        if (st.x2 + r2 > W - 18) { st.x2 = W - 18 - r2; st.v2 = -Math.abs(st.v2); }

        // Ball-to-ball 1D elastic/inelastic collision
        if (st.x2 - st.x1 <= r1 + r2 && st.v1 - st.v2 > 0) {
          const u1 = st.v1;
          const u2 = st.v2;
          st.v1 = (m1 * u1 + m2 * u2 + m2 * restitution * (u2 - u1)) / (m1 + m2);
          st.v2 = (m1 * u1 + m2 * u2 + m1 * restitution * (u1 - u2)) / (m1 + m2);
          const overlap = r1 + r2 - (st.x2 - st.x1);
          st.x1 -= overlap * 0.5;
          st.x2 += overlap * 0.5;
          st.flash = 1.0;
          st.collisions += 1;
          visualAudioEngine.playToggleClick(true);
        }
        if (st.flash > 0) st.flash = Math.max(0, st.flash - dt * 3.2);
        setTelemetry({ v1: st.v1, v2: st.v2, collisions: st.collisions });
      }

      ctx.clearRect(0, 0, W, canvas.height);

      // Track & walls
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(16, 40);
      ctx.lineTo(16, floorY);
      ctx.lineTo(W - 16, floorY);
      ctx.lineTo(W - 16, 40);
      ctx.stroke();

      // Collision flash
      if (st.flash > 0) {
        const midX = (st.x1 + st.x2) / 2;
        ctx.beginPath();
        ctx.arc(midX, floorY - Math.max(r1, r2), 28 * (1.4 - st.flash * 0.4), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251, 191, 36, ${st.flash})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Sphere 1
      ctx.beginPath();
      ctx.arc(st.x1, floorY - r1, r1, 0, Math.PI * 2);
      ctx.fillStyle = '#0ea5e9';
      ctx.fill();
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`m₁=${m1}kg`, st.x1, floorY - r1 + 4);
      drawArrow(st.x1, floorY - r1 * 2 - 14, st.v1, '#38bdf8');

      // Sphere 2
      ctx.beginPath();
      ctx.arc(st.x2, floorY - r2, r2, 0, Math.PI * 2);
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
      ctx.strokeStyle = '#fecdd3';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`m₂=${m2}kg`, st.x2, floorY - r2 + 4);
      drawArrow(st.x2, floorY - r2 * 2 - 14, st.v2, '#fb7185');

      ctx.textAlign = 'left';
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPlaying, m1, m2, restitution]);

  const momentum = m1 * telemetry.v1 + m2 * telemetry.v2;
  const kinetic = 0.5 * m1 * telemetry.v1 * telemetry.v1 + 0.5 * m2 * telemetry.v2 * telemetry.v2;

  return (
    <div className="space-y-3 w-full max-w-[540px] mx-auto">
      <canvas
        ref={canvasRef}
        width={520}
        height={210}
        onClick={() => {
          stateRef.current.v1 += 1.0;
          visualAudioEngine.playTone(440, 0.08, 0.04);
        }}
        title="Nhấp chuột để truyền xung lực cho vật m₁!"
        className="w-full h-auto rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer"
      />

      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-2">
          <div className="text-slate-400">Vận tốc tức thời</div>
          <div className="text-sky-300 mt-0.5">v₁={telemetry.v1.toFixed(2)} · v₂={telemetry.v2.toFixed(2)}</div>
        </div>
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-2">
          <div className="text-slate-400">Động lượng (p)</div>
          <div className="text-emerald-300 mt-0.5">{momentum.toFixed(2)} kg·m/s</div>
        </div>
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-2">
          <div className="text-slate-400">Động năng (Wđ)</div>
          <div className="text-amber-300 mt-0.5">{kinetic.toFixed(2)} J</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setIsPlaying((p) => !p)} className="inline-flex items-center gap-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-black text-white">
            {isPlaying ? <Pause size={13} /> : <Play size={13} />} {isPlaying ? 'Tạm dừng' : 'Chạy 60fps'}
          </button>
          <button type="button" onClick={() => resetSim(true)} className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200">
            <RotateCcw size={13} /> Đặt lại
          </button>
        </div>
        <div className="text-[11px] font-bold text-slate-300">
          Va chạm: <span className="text-amber-300">{telemetry.collisions}</span> lần
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 p-3 text-[11px]">
        <label className="flex flex-col gap-1">
          <span className="font-bold text-sky-300">Khối lượng m₁ = {m1} kg</span>
          <input type="range" min={0.5} max={5} step={0.5} value={m1} onChange={(e) => setM1(Number(e.target.value))} className="accent-sky-400" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-bold text-rose-300">Khối lượng m₂ = {m2} kg</span>
          <input type="range" min={0.5} max={5} step={0.5} value={m2} onChange={(e) => setM2(Number(e.target.value))} className="accent-rose-400" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-bold text-amber-300">Đàn hồi e = {restitution.toFixed(1)}</span>
          <input type="range" min={0} max={1} step={0.1} value={restitution} onChange={(e) => setRestitution(Number(e.target.value))} className="accent-amber-400" />
        </label>
      </div>
    </div>
  );
};
