import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Film, Pause, Play, RotateCcw } from 'lucide-react';
import { NotebookVideoSlideDto } from '@/services/notebook.service';
import { speakKidText, stopKidSpeech } from '@/components/kids/kidsSpeech';
import { drawSlideCanvas, exportAudioMuxedWebm } from './videoOverviewExporter';

interface Props {
  title: string;
  slides: NotebookVideoSlideDto[];
  language?: string;
}

export const NotebookVideoOverviewPlayer: React.FC<Props> = ({ title, slides, language = 'vi' }) => {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  playingRef.current = playing;
  const activeSlide = slides[idx] || slides[0];

  useEffect(() => {
    let raf = 0;
    let tick = 0;
    const render = () => {
      tick += 1;
      const ctx = canvasRef.current?.getContext('2d');
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
    setPlaying(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    stopKidSpeech();
    try {
      await exportAudioMuxedWebm(canvas, slides, title, language, setIdx, setProgress);
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
          <span>Video Tổng quan AI ({slides.length} slides • 60fps Canvas + Audio)</span>
        </div>
        <button
          onClick={handleExportWebm}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 px-2.5 py-1 text-[11px] font-semibold text-white transition"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? 'Đang ghép giọng đọc .webm...' : 'Tải Video Có Tiếng (.webm)'}
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
