import { CheckCircle2, Eye, Pause, Play, RotateCcw, Volume2, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MathRenderer } from '@/components/common/MathRenderer';
import type { QuestionWidgetProps } from './types';

export default function GlennDomanFlashcardWidget({
  question,
  answer,
  onUpdate,
  disabled,
}: QuestionWidgetProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speedMs, setSpeedMs] = useState(1500);

  const payload = (question.payload as any) || {};
  const frontText = String(payload.frontText || question.content || '').trim();
  const backText = String(payload.backText || question.answerRaw || '').trim();
  const speechLang = String(payload.lang || 'en-US');

  const spokenPhrase = useMemo(
    () => frontText.replace(/<[^>]+>/g, '').trim(),
    [frontText]
  );

  const speakCard = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !spokenPhrase) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(spokenPhrase);
    utter.lang = speechLang;
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    if (!autoPlay) return;
    const timer = window.setTimeout(() => {
      setIsFlipped((prev) => !prev);
      if (!isFlipped) speakCard();
    }, speedMs);
    return () => window.clearTimeout(timer);
  }, [autoPlay, isFlipped, speedMs]);

  const status = answer?.shortText;

  return (
    <div className="space-y-4 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/70 p-3 shadow-sm">
        <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900">
          <Zap className="h-4 w-4 text-amber-500" />
          Glenn Doman Rapid Flashcard + FSRS
        </div>
        <div className="flex items-center gap-2">
          <select
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
            className="rounded-lg border border-amber-200 bg-white px-2 py-1 text-[11px] font-bold text-amber-900"
          >
            <option value={1000}>1.0s / thẻ</option>
            <option value={1500}>1.5s / thẻ</option>
            <option value={2200}>2.2s / thẻ</option>
          </select>
          <button
            type="button"
            onClick={() => setAutoPlay((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white transition ${
              autoPlay ? 'bg-rose-500 hover:bg-rose-400' : 'bg-amber-500 hover:bg-amber-400'
            }`}
          >
            {autoPlay ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {autoPlay ? 'Tạm dừng' : 'Tráo tự động'}
          </button>
          <button
            type="button"
            onClick={speakCard}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-50"
          >
            <Volume2 className="h-3.5 w-3.5" /> Phát âm
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setIsFlipped((f) => !f);
          if (!isFlipped) speakCard();
        }}
        className="w-full min-h-[170px] rounded-3xl border-2 border-amber-300 bg-white p-6 text-center shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] flex flex-col items-center justify-center gap-3"
      >
        <span className="text-[11px] font-black uppercase tracking-widest text-amber-500">
          {isFlipped ? 'Mặt sau · Nghĩa / Lời giải' : 'Mặt trước · Chạm để lật nhanh'}
        </span>
        <div className="text-2xl sm:text-3xl font-black text-slate-900">
          <MathRenderer content={isFlipped ? (backText || frontText) : frontText} />
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onUpdate({ shortText: 'REVIEW_AGAIN' })}
          className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-bold transition ${
            status === 'REVIEW_AGAIN'
              ? 'border-amber-500 bg-amber-50 text-amber-800'
              : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300'
          }`}
        >
          <RotateCcw className="h-4 w-4 text-amber-500" /> Cần ôn lại (FSRS)
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onUpdate({ shortText: 'MASTERED' })}
          className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-bold transition ${
            status === 'MASTERED'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Đã ghi nhớ ngay
        </button>
      </div>
    </div>
  );
}
