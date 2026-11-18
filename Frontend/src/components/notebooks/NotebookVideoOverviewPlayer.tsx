import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Film, Pause, Play, RotateCcw } from 'lucide-react';
import { NotebookVideoSlideDto } from '@/services/notebook.service';
import { speakKidText, stopKidSpeech } from '@/components/kids/kidsSpeech';

interface Props {
  title: string;
  slides: NotebookVideoSlideDto[];
  language?: string;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxW && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawSlideCanvas(
  ctx: CanvasRenderingContext2D,
  slide: NotebookVideoSlideDto,
  deckTitle: string,
  total: number,
  progress: number,
  tick: number,
) {
  const W = 960;
  const H = 540;
  const accent = slide.accentColor || '#6366f1';

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#090d1a');
  bg.addColorStop(0.55, '#11182c');
  bg.addColorStop(1, '#070a14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle animated ambient glow
  const pulse = 0.5 + 0.5 * Math.sin(tick * 0.04);
  const glow = ctx.createRadialGradient(780, 120, 20, 780, 120, 290 + pulse * 30);
  glow.addColorStop(0, `${accent}3d`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Top bar: deck title & slide badge
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 15px Inter, system-ui, sans-serif';
  ctx.fillText(`AEGIS NOTEBOOK • ${deckTitle.slice(0, 48)}`, 48, 44);

  ctx.fillStyle = `${accent}33`;
  ctx.beginPath();
  ctx.roundRect(W - 148, 22, 100, 30, 15);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 13px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SLIDE ${slide.slideNumber}/${total}`, W - 98, 42);
  ctx.textAlign = 'left';

  // Emoji visual emblem
  ctx.fillStyle = `${accent}26`;
  ctx.beginPath();
  ctx.roundRect(48, 76, 68, 68, 18);
  ctx.fill();
  ctx.font = '38px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(slide.visualEmoji || '✨', 82, 123);
  ctx.textAlign = 'left';

  // Slide Title
  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 30px Inter, system-ui, sans-serif';
  const titleLines = wrapLines(ctx, slide.title, 740).slice(0, 2);
  titleLines.forEach((line, i) => ctx.fillText(line, 134, 106 + i * 36));

  // Bullet Points (staggered fade-in)
  let y = 192;
  slide.bulletPoints.slice(0, 4).forEach((bp, idx) => {
    const threshold = idx * 0.14;
    const alpha = Math.max(0.18, Math.min(1, (progress - threshold) / 0.25 + 0.35));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(60, y - 6, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 20px Inter, system-ui, sans-serif';
    const lines = wrapLines(ctx, bp, 810).slice(0, 2);
    lines.forEach((ln) => {
      ctx.fillText(ln, 80, y);
      y += 28;
    });
    y += 10;
  });
  ctx.globalAlpha = 1;

  // Highlight quote banner
  if (slide.highlightQuote) {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(48, H - 104, W - 96, 58, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'italic 600 17px Inter, system-ui, sans-serif';
    const q = slide.highlightQuote.length > 92
      ? `${slide.highlightQuote.slice(0, 89)}...`
      : slide.highlightQuote;
    ctx.fillText(`💡 ${q}`, 68, H - 69);
  }

  // Bottom progress bar
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, H - 6, W, 6);
  ctx.fillStyle = accent;
  ctx.fillRect(0, H - 6, W * Math.max(0.02, Math.min(1, progress)), 6);
}

export const NotebookVideoOverviewPlayer: React.FC<Props> = ({ title, slides, language = 'vi' }) => {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playingRef = useRef(false);
  const idxRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  playingRef.current = playing;
  idxRef.current = idx;
  const activeSlide = slides[idx] || slides[0];

  useEffect(() => {
    let raf = 0;
    let tick = 0;
    const render = () => {
      tick += 1;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && activeSlide) {
        drawSlideCanvas(ctx, activeSlide, title, slides.length, progress, tick);
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [activeSlide, title, slides.length, progress]);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    stopKidSpeech();
  }, []);

  const playSlide = (slideIndex: number) => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    const s = slides[slideIndex];
    if (!s) {
      setPlaying(false);
      return;
    }
    setIdx(slideIndex);
    setProgress(0);
    setPlaying(true);

    const durationMs = Math.max(4, s.durationSeconds || 8) * 1000;
    const started = Date.now();
    speakKidText(s.narrationText || s.title, language === 'en' ? 'en-US' : 'vi-VN', s.voiceId);

    timerRef.current = window.setInterval(() => {
      if (!playingRef.current) return;
      const p = Math.min(1, (Date.now() - started) / durationMs);
      setProgress(p);
      if (p >= 1) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        if (slideIndex + 1 < slides.length) {
          playSlide(slideIndex + 1);
        } else {
          setPlaying(false);
        }
      }
    }, 50);
  };

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      if (timerRef.current) window.clearInterval(timerRef.current);
      stopKidSpeech();
    } else {
      playSlide(idx);
    }
  };

  const handleExportWebm = async () => {
    const canvas = canvasRef.current;
    if (!canvas || exporting) return;
    setExporting(true);
    stopKidSpeech();
    try {
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      const done = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      });

      recorder.start();
      for (let i = 0; i < slides.length; i++) {
        setIdx(i);
        const stepMs = 1500;
        const start = Date.now();
        while (Date.now() - start < stepMs) {
          setProgress((Date.now() - start) / stepMs);
          await new Promise((r) => setTimeout(r, 60));
        }
        setProgress(1);
      }
      recorder.stop();
      const blob = await done;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_overview.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
      setPlaying(false);
    }
  };

  if (!activeSlide) return null;

  return (
    <div className="rounded-xl border border-rose-500/30 bg-slate-950/80 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
          <Film className="w-4 h-4" />
          <span>Video Tổng quan AI ({slides.length} slides • 60fps Canvas)</span>
        </div>
        <button
          onClick={handleExportWebm}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 px-2.5 py-1 text-[11px] font-semibold text-white transition"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? 'Đang xuất .webm...' : 'Tải Video .webm'}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        className="w-full aspect-video rounded-lg border border-slate-800 bg-slate-950 shadow-lg"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={togglePlay}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {playing ? 'Tạm dừng' : 'Phát Video + Thuyết minh'}
          </button>
          <button
            onClick={() => playSlide(0)}
            className="rounded-lg border border-slate-700 hover:bg-slate-800 p-1.5 text-slate-300"
            title="Phát lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { stopKidSpeech(); setPlaying(false); setIdx((i) => Math.max(0, i - 1)); setProgress(0); }}
            disabled={idx === 0}
            className="rounded-lg border border-slate-700 p-1 text-slate-300 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-300 px-2 font-medium">{idx + 1} / {slides.length}</span>
          <button
            onClick={() => { stopKidSpeech(); setPlaying(false); setIdx((i) => Math.min(slides.length - 1, i + 1)); setProgress(0); }}
            disabled={idx >= slides.length - 1}
            className="rounded-lg border border-slate-700 p-1 text-slate-300 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {slides.map((s, i) => (
          <button
            key={s.slideNumber}
            onClick={() => playSlide(i)}
            className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition max-w-[170px] ${
              i === idx
                ? 'border-rose-400 bg-rose-500/15 text-white'
                : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-semibold truncate">{s.visualEmoji} {s.slideNumber}. {s.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
