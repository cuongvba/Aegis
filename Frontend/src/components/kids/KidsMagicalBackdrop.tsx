import React, { useEffect, useRef } from 'react';

interface KidsMagicalBackdropProps {
  particleMode?: 'sky' | 'ocean' | 'fairy' | 'meadow';
}

export const KidsMagicalBackdrop: React.FC<KidsMagicalBackdropProps> = ({ particleMode = 'sky' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 30 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: particleMode === 'ocean' ? 4 + (i % 5) * 2.2 : 3 + (i % 5) * 1.6,
      vx: (Math.random() - 0.5) * 0.45,
      vy: particleMode === 'fairy' ? (Math.random() - 0.5) * 0.45 : -0.35 - Math.random() * 0.45,
      hue: particleMode === 'ocean' ? 185 + (i * 9) % 35 : particleMode === 'fairy' ? 45 + (i * 15) % 280 : (i * 37) % 360,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx + Math.sin(time * 0.001 + p.phase) * 0.35;
        p.y += p.vy;
        if (p.y < -20) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width; }
        if (p.y > canvas.height + 20) { p.y = -20; }
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        const alpha = 0.25 + 0.22 * Math.sin(time * 0.003 + p.phase);
        ctx.beginPath();
        if (particleMode === 'ocean') {
          ctx.strokeStyle = `hsla(${p.hue}, 90%, 75%, ${alpha + 0.2})`;
          ctx.lineWidth = 2;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = `hsla(${p.hue}, 92%, 68%, ${alpha})`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [particleMode]);

  return <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 pointer-events-none z-0" />;
};
