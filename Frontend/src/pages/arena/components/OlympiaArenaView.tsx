import React, { useState, useEffect, useCallback } from 'react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { Bell, Zap, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ArenaRoomState, ArenaPlayer, ArenaQuestionItem } from '@/types/arena';
import { playArenaSfx } from '@/services/arena.service';
import { OlympiaStageBar } from './OlympiaStageBar';

interface OlympiaArenaViewProps {
  state: ArenaRoomState;
  onAnswer?: (answer: string) => void;
  onSubmitAnswer?: (answer: string) => void;
  onBuzzer: () => void;
  onNextStage: (nextStage: string) => void;
  onAction: (actionType: string, payload: any) => void;
}

export function OlympiaArenaView({
  state, onAnswer, onSubmitAnswer, onBuzzer, onNextStage, onAction,
}: OlympiaArenaViewProps) {
  const [starUsed, setStarUsed] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);

  const currentStage = state.currentStage || (state as any).CurrentStage || 'KHOI_DONG';
  const questions: ArenaQuestionItem[] = state.questions || (state as any).Questions || [];
  const qIndex = state.currentQuestionIndex ?? (state as any).CurrentQuestionIndex ?? 0;
  const currentQ: ArenaQuestionItem = questions[qIndex] || questions[0] || {
    id: 'q0', content: 'Đang tải câu hỏi...', questionType: 'MULTIPLE_CHOICE',
    options: [], answerRaw: '', points: 10, category: 'OLYMPIA',
  };

  const rawPlayers = state.players || (state as any).Players || {};
  const players: ArenaPlayer[] = Object.values(rawPlayers).filter((p): p is ArenaPlayer => Boolean(p && typeof p === "object"));
  const winnerPlayerId = state.buzzerWinnerPlayerId || (state as any).BuzzerWinnerPlayerId;
  const isBuzzed = Boolean(winnerPlayerId);

  const options: string[] = currentQ.options || (currentQ as any).Options || [];
  const qContent = currentQ.content || (currentQ as any).Content || '';
  const qCategory = currentQ.category || (currentQ as any).Category || 'TRI THỨC TỔNG HỢP';
  const qPoints = currentQ.points || (currentQ as any).Points || 10;
  const expectedAnswer = String(currentQ.answerRaw || (currentQ as any).AnswerRaw || '').trim();

  useEffect(() => {
    setSelectedOpt(null);
    setFeedback(null);
  }, [qIndex, currentQ]);

  const doAnswer = useCallback((ans: string) => {
    if (feedback !== null) return;
    setSelectedOpt(ans);

    let isCorrect = false;
    const cleanAns = ans.trim().toLowerCase();
    const cleanExpected = expectedAnswer.trim().toLowerCase();

    if (cleanAns && cleanExpected) {
      if (cleanAns === cleanExpected) isCorrect = true;
      else if (cleanAns.startsWith(cleanExpected + '.') || cleanAns.startsWith(cleanExpected + ')')) isCorrect = true;
      else if (options.length > 0) {
        const correctIdx = cleanExpected.charCodeAt(0) - 97;
        if (correctIdx >= 0 && correctIdx < options.length && options[correctIdx].toLowerCase() === cleanAns) isCorrect = true;
      }
    }

    if (isCorrect) {
      playArenaSfx('victory');
      setFeedback({ isCorrect: true, correctAnswer: expectedAnswer });
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    } else {
      playArenaSfx('drop');
      setFeedback({ isCorrect: false, correctAnswer: expectedAnswer });
    }

    if (onSubmitAnswer) onSubmitAnswer(ans);
    if (onAnswer) onAnswer(ans);
  }, [expectedAnswer, feedback, onSubmitAnswer, onAnswer, options]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const key = e.key.toUpperCase();
      if (key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (!isBuzzed) {
          try { playArenaSfx('buzzer'); } catch {}
          try { onBuzzer(); } catch {}
        }
        return;
      }
      const keyMap: Record<string, number> = { 'A': 0, '1': 0, 'B': 1, '2': 1, 'C': 2, '3': 2, 'D': 3, '4': 3 };
      if (key in keyMap && options[keyMap[key]]) {
        e.preventDefault();
        doAnswer(options[keyMap[key]]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, isBuzzed, onBuzzer, doAnswer]);

  return (
    <div className="flex flex-col h-full w-full justify-between gap-2 overflow-hidden select-none">
      <OlympiaStageBar
        currentStage={currentStage}
        qIndex={qIndex}
        totalQuestions={questions.length}
        players={players}
        winnerPlayerId={winnerPlayerId}
        starUsed={starUsed}
        onUseStar={() => { setStarUsed(true); playArenaSfx('victory'); onAction('USE_STAR_OF_HOPE', ''); }}
        onNextStage={onNextStage}
      />

      {/* HERO QUESTION CANVAS */}
      <div className="flex-1 min-h-0 flex flex-col justify-between rounded-2xl border-2 border-slate-800 bg-slate-900/90 shadow-2xl p-3 sm:p-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-black text-amber-400 border border-amber-500/25">
              {qCategory}
            </span>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300">
              +{qPoints} ĐIỂM
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
            ⌨️ Phím tắt: <strong className="text-amber-400">[A] [B] [C] [D]</strong> hoặc <strong className="text-amber-400">[1] [2] [3] [4]</strong>
          </span>
        </div>

        <div className="flex-1 min-h-0 my-2 overflow-y-auto px-2 py-1 text-left">
          <div className="text-base sm:text-xl md:text-2xl font-bold leading-relaxed text-slate-100 max-w-4xl mx-auto">
            <MathRenderer content={qContent} />
          </div>
        </div>

        {/* 4 OPTIONS GRID */}
        {options.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2 shrink-0">
            {options.map((opt: string, i: number) => {
              const letter = String.fromCharCode(65 + i);
              const isSelected = selectedOpt === opt;
              let btnStyle = 'border-slate-700/80 bg-slate-800/80 hover:border-amber-400 text-slate-200';

              if (feedback) {
                const isThisCorrect =
                  letter.toLowerCase() === expectedAnswer.toLowerCase() ||
                  opt.toLowerCase() === expectedAnswer.toLowerCase() ||
                  opt.toLowerCase().startsWith(expectedAnswer.toLowerCase() + '.');

                if (isThisCorrect) {
                  btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]';
                } else if (isSelected) {
                  btnStyle = 'border-rose-500 bg-rose-500/20 text-rose-300';
                } else {
                  btnStyle = 'border-slate-800 bg-slate-900/40 text-slate-600 opacity-50';
                }
              } else if (isSelected) {
                btnStyle = 'border-amber-400 bg-amber-500/20 text-white';
              }

              return (
                <button
                  key={i}
                  disabled={feedback !== null}
                  onClick={() => doAnswer(opt)}
                  className={`flex items-center gap-3 rounded-xl border p-3 sm:p-3.5 text-left font-bold transition-all cursor-pointer ${btnStyle}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/80 font-mono font-black text-sm text-amber-300 shadow">
                    {letter}
                  </span>
                  <div className="text-sm sm:text-base leading-relaxed overflow-x-auto flex-1 font-semibold">
                    <MathRenderer content={opt} />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="pt-2 shrink-0 max-w-md mx-auto w-full">
            <input
              type="text"
              disabled={feedback !== null}
              placeholder="Gõ đáp án và nhấn Enter..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                  doAnswer((e.target as HTMLInputElement).value.trim());
                }
              }}
              className="w-full rounded-xl border-2 border-slate-700 bg-slate-800 px-4 py-3 font-bold text-white text-center focus:border-amber-400 focus:outline-none"
            />
          </div>
        )}

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div className={`mt-2 p-3 rounded-xl border flex items-center justify-between gap-3 animate-fadeIn shrink-0 ${
            feedback.isCorrect ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200' : 'border-rose-500/50 bg-rose-500/20 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              <div>
                <span className="font-black text-xs sm:text-sm block">
                  {feedback.isCorrect ? `🎉 CHÍNH XÁC! (+${qPoints} ĐIỂM)` : '❌ CHƯA CHÍNH XÁC!'}
                </span>
                <span className="text-[11px] opacity-90">
                  {feedback.isCorrect ? 'Chúc mừng bạn ghi điểm ngoạn mục!' : `Đáp án đúng: ${feedback.correctAnswer || 'Xem lại đề bài'}.`}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNextStage('NEXT_QUESTION')}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-white text-slate-950 font-black text-xs hover:bg-slate-100 transition cursor-pointer shrink-0"
            >
              <span>Câu Tiếp Theo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* BUZZER STRIP */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 mt-2 shrink-0">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            {isBuzzed ? 'Đã có thí sinh giành quyền bấm chuông!' : 'Bấm phím [Space] hoặc nút để giành quyền'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (!isBuzzed) {
                try { playArenaSfx('buzzer'); } catch {}
                try { onBuzzer(); } catch {}
              }
            }}
            disabled={isBuzzed}
            className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer select-none ${
              isBuzzed ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg border border-red-400 active:scale-95'
            }`}
          >
            <Bell className="h-3.5 w-3.5 fill-current animate-bounce" />
            🔔 Bấm Chuông (Space)
          </button>
        </div>
      </div>
    </div>
  );
}
export default OlympiaArenaView;
