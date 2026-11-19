import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Film, Pause, Play, X } from 'lucide-react';
import type { InteractiveVisualLesson } from '@/components/common/visual/visualLessonPresets';
import { buildShortsScenes, drawShortsFrame, exportShortsVideo } from '@/components/common/visual/shortsEngine';
import { speakKidText, stopKidSpeech } from '@/components/kids/kidsSpeech';

interface Props {
  open: boolean;
  onClose: () => void;
  activeLesson: InteractiveVisualLesson;
}

const LANGUAGES = [
  { code: 'vi-VN', label: 'Tiếng Việt' },
  { code: 'en-US', label: 'English' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'ko-KR', label: '한국어' },
  { code: 'zh-CN', label: '中文' },
  { code: 'fr-FR', label: 'Français' },
];

export const VisualShortsModal: React.FC<Props> = ({ open, onClose, activeLesson }) => {
  const [mode, setMode] = useState<'SECANT_TANGENT' | 'ACTIVE_LESSON'>('SECANT_TANGENT');
  const [lang, setLang] = useState('vi-VN');
  const [sceneIdx, setSceneIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const scenes = useMemo(() => buildShortsScenes(mode, activeLesson, lang), [mode, activeLesson, lang]);

  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const render = () => {
      const ctx = canvasRef.current?.getContext('2d');
      const sc = scenes[sceneIdx] || scenes[0];
      if (ctx && sc) drawShortsFrame(ctx, sc, progress, mode, activeLesson.title);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [open, scenes, sceneIdx, progress, mode, activeLesson.title]);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    stopKidSpeech();
  }, []);

  if (!open) return null;

  const playFrom = (idx: number) => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    const sc = scenes[idx];
    if (!sc) { setPlaying(false); return; }
    setSceneIdx(idx);
    setProgress(0);
    setPlaying(true);
    speakKidText(sc.narration, lang);
    const started = Date.now();
    timerRef.current = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - started) / 4200);
      setProgress(p);
      if (p >= 1) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        if (idx + 1 < scenes.length) playFrom(idx + 1);
        else setPlaying(false);
      }
    }, 45);
  };

  const handleExport = async () => {
    if (!canvasRef.current || exporting) return;
    setExporting(true);
    setPlaying(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    stopKidSpeech();
    try {
      await exportShortsVideo(canvasRef.current, scenes, lang, mode, activeLesson.title, setSceneIdx, setProgress);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-5 flex flex-col items-center gap-3">
          <canvas ref={canvasRef} width={540} height={960} className="w-full max-w-[260px] aspect-[9/16] rounded-2xl border border-slate-700 bg-slate-950 shadow-xl" />
          <div className="flex gap-2 w-full justify-center">
            <button
              onClick={() => playing ? (setPlaying(false), stopKidSpeech()) : playFrom(0)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-bold text-white"
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {playing ? 'Dừng' : 'Xem thử 9:16'}
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 px-3 py-2 text-xs font-bold text-white"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? 'Đang xuất...' : 'Tải Shorts (.mp4)'}
            </button>
          </div>
        </div>

        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black flex items-center gap-2 text-cyan-300">
              <Film className="w-5 h-5" /> Aegis Manim-Web Shorts (9:16)
            </h2>
            <button onClick={() => { stopKidSpeech(); onClose(); }} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Kịch bản Đồ thị Động</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => { setMode('SECANT_TANGENT'); setSceneIdx(0); setProgress(0); }}
                className={`p-2.5 rounded-xl border text-left text-xs ${mode === 'SECANT_TANGENT' ? 'border-cyan-400 bg-cyan-500/15 text-white' : 'border-slate-700 bg-slate-950 text-slate-400'}`}
              >
                <div className="font-bold">📐 Cát tuyến $\rightarrow$ Tiếp tuyến ($\Delta x \to 0$)</div>
                <div className="text-[11px] opacity-80">Mô phỏng Giải tích chuẩn YouTube Shorts 3Blue1Brown</div>
              </button>
              <button
                onClick={() => { setMode('ACTIVE_LESSON'); setSceneIdx(0); setProgress(0); }}
                className={`p-2.5 rounded-xl border text-left text-xs ${mode === 'ACTIVE_LESSON' ? 'border-cyan-400 bg-cyan-500/15 text-white' : 'border-slate-700 bg-slate-950 text-slate-400'}`}
              >
                <div className="font-bold truncate">✨ Bài giảng đang chọn: {activeLesson.title}</div>
                <div className="text-[11px] opacity-80">Tự động chuyển hóa thành video dọc 9:16</div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Ngôn ngữ Thuyết minh Toàn cầu</label>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${lang === l.code ? 'bg-violet-600 border-violet-400 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {scenes.map((sc, i) => (
              <div key={sc.label} className={`p-2 rounded-xl border text-[11px] ${i === sceneIdx ? 'border-rose-400 bg-rose-500/10 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'}`}>
                <div className="font-bold">{sc.label}</div>
                <div className="truncate">{sc.narration}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
