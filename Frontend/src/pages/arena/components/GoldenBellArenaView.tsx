import React, { useState, useEffect } from 'react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { CheckCircle2, XCircle, ArrowRight, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ArenaRoomState, ArenaPlayer, ArenaQuestionItem } from '@/types/arena';
import { playArenaSfx } from '@/services/arena.service';
import { GoldenBellSeatsGrid } from './GoldenBellSeatsGrid';
import { GoldenBellHeaderBar } from './GoldenBellHeaderBar';

interface Props {
  state: ArenaRoomState;
  onSubmitAnswer: (ans: string) => void;
  onAction: (actionType: string, payload: string) => void;
  onNextStage: (next: string) => void;
}

export function GoldenBellArenaView({ state, onSubmitAnswer, onAction, onNextStage }: Props) {
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [myStatus, setMyStatus] = useState<'ACTIVE' | 'ELIMINATED'>('ACTIVE');
  const [myScore, setMyScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);

  const questions: ArenaQuestionItem[] = state.questions || (state as any).Questions || [];
  const qIndex = state.currentQuestionIndex ?? (state as any).CurrentQuestionIndex ?? 0;
  const currentQ: ArenaQuestionItem = questions[qIndex] || questions[0] || {
    id: 'q0', content: 'Đang tải câu hỏi...', questionType: 'MULTIPLE_CHOICE',
    options: [], answerRaw: '', points: 10, timeLimitSeconds: 15, category: 'RUNG CHUÔNG VÀNG',
  };

  const rawPlayers = state.players || (state as any).Players || {};
  const players: ArenaPlayer[] = Object.values(rawPlayers);
  const activeCount = players.filter((p: any) => (p.status || p.Status) === 'ACTIVE').length || (myStatus === 'ACTIVE' ? 85 : 84);

  const qCategory = currentQ.category || (currentQ as any).Category || 'RUNG CHUÔNG VÀNG';
  const qContent = currentQ.content || (currentQ as any).Content || '';
  const options: string[] = currentQ.options || (currentQ as any).Options || [];
  const expectedAnswer = String(currentQ.answerRaw || (currentQ as any).AnswerRaw || '').trim();

  useEffect(() => {
    setSelectedOpt(null);
    setWrittenAnswer('');
    setFeedback(null);
    setTimeLeft(currentQ.timeLimitSeconds > 0 ? currentQ.timeLimitSeconds : 15);
  }, [qIndex, currentQ]);

  useEffect(() => {
    if (feedback !== null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleAnswerSubmit('');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, feedback]);

  const handleRescue = () => {
    playArenaSfx('victory');
    setMyStatus('ACTIVE');
    onAction('TEACHER_RESCUE', '');
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
  };

  const handleAnswerSubmit = (chosen: string) => {
    if (feedback !== null) return;
    setSelectedOpt(chosen);

    let isCorrect = false;
    const cleanChosen = chosen.trim().toLowerCase();
    const cleanExpected = expectedAnswer.trim().toLowerCase();

    if (cleanChosen && cleanExpected) {
      if (cleanChosen === cleanExpected) isCorrect = true;
      else if (cleanChosen.startsWith(cleanExpected + '.') || cleanChosen.startsWith(cleanExpected + ')')) isCorrect = true;
      else if (options.length > 0) {
        const correctIdx = cleanExpected.charCodeAt(0) - 97;
        if (correctIdx >= 0 && correctIdx < options.length && options[correctIdx].toLowerCase() === cleanChosen) {
          isCorrect = true;
        }
      }
    }

    if (isCorrect) {
      playArenaSfx('victory');
      setMyScore((s) => s + 10);
      setFeedback({ isCorrect: true, correctAnswer: expectedAnswer });
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    } else {
      playArenaSfx('drop');
      setMyStatus('ELIMINATED');
      setFeedback({ isCorrect: false, correctAnswer: expectedAnswer });
    }

    onSubmitAnswer(chosen);
  };

  return (
    <div className="space-y-4">
      <GoldenBellHeaderBar
        qIndex={qIndex}
        totalQuestions={questions.length}
        myStatus={myStatus}
        myScore={myScore}
        onRescue={handleRescue}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CỘT CHÍNH (8/12): CÂU HỎI HERO STAGE & 4 NÚT TRẢ LỜI */}
        <div className="lg:col-span-8 flex flex-col justify-between rounded-3xl border-2 border-slate-800 bg-slate-900/95 p-5 sm:p-6 text-white shadow-2xl space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                {qCategory}
              </span>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono font-black text-xs ${
                timeLeft <= 5 ? 'border-rose-500 bg-rose-500/20 text-rose-400 animate-pulse' : 'border-amber-400/40 bg-amber-500/10 text-amber-300'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            <div className="text-lg sm:text-2xl font-black text-slate-100 leading-relaxed py-2">
              <MathRenderer content={qContent} />
            </div>
          </div>

          {/* 4 Lựa chọn A, B, C, D hoặc Bảng Viết Mica */}
          {options.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {options.map((opt: string, i: number) => {
                const optLetter = String.fromCharCode(65 + i);
                const isSelected = selectedOpt === opt || selectedOpt === optLetter;
                let btnStyle = 'border-slate-800 bg-slate-950/70 hover:border-slate-700 text-slate-200';

                if (feedback) {
                  const isThisCorrect =
                    optLetter.toLowerCase() === expectedAnswer.toLowerCase() ||
                    opt.toLowerCase() === expectedAnswer.toLowerCase() ||
                    opt.toLowerCase().startsWith(expectedAnswer.toLowerCase() + '.');

                  if (isThisCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]';
                  } else if (isSelected) {
                    btnStyle = 'border-rose-500 bg-rose-500/20 text-rose-300';
                  } else {
                    btnStyle = 'border-slate-850 bg-slate-950/40 text-slate-600 opacity-50';
                  }
                } else if (isSelected) {
                  btnStyle = 'border-amber-400 bg-amber-500/20 text-white';
                }

                return (
                  <button
                    key={i}
                    disabled={feedback !== null || myStatus === 'ELIMINATED'}
                    onClick={() => handleAnswerSubmit(opt)}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 sm:p-4 text-left font-bold transition cursor-pointer active:scale-98 ${btnStyle} disabled:cursor-not-allowed`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 font-black text-sm text-amber-400 border border-slate-700">
                      {optLetter}
                    </span>
                    <div className="text-sm overflow-x-auto"><MathRenderer content={opt} /></div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-amber-400/40 bg-slate-950 p-4">
              <label className="text-xs font-bold text-amber-400 block mb-2">✍️ Gõ đáp án lên bảng Mica:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={writtenAnswer}
                  disabled={feedback !== null || myStatus === 'ELIMINATED'}
                  onChange={(e) => setWrittenAnswer(e.target.value)}
                  placeholder="Nhập câu trả lời..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 font-bold text-white focus:outline-hidden focus:border-amber-400 text-center"
                  onKeyDown={(e) => e.key === 'Enter' && writtenAnswer.trim() && handleAnswerSubmit(writtenAnswer.trim())}
                />
                <button
                  onClick={() => writtenAnswer.trim() && handleAnswerSubmit(writtenAnswer.trim())}
                  disabled={feedback !== null || myStatus === 'ELIMINATED'}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 font-black text-slate-950 text-xs transition cursor-pointer"
                >
                  Giơ Bảng ➔
                </button>
              </div>
            </div>
          )}

          {/* BANNER XÁC NHẬN KẾT QUẢ ĐÚNG / SAI */}
          {feedback && (
            <div className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 animate-fadeIn ${
              feedback.isCorrect ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200' : 'border-rose-500/50 bg-rose-500/15 text-rose-200'
            }`}>
              <div className="flex items-center gap-2.5">
                {feedback.isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <XCircle className="w-6 h-6 text-rose-400 shrink-0" />}
                <div>
                  <span className="font-black text-sm block">
                    {feedback.isCorrect ? '🎉 CHÍNH XÁC! (+10 ĐIỂM)' : '❌ CHƯA CHÍNH XÁC!'}
                  </span>
                  <span className="text-xs opacity-90">
                    {feedback.isCorrect ? 'Bạn giữ vững vị trí thi đấu trên sàn!' : `Đáp án đúng là: ${feedback.correctAnswer || 'Xem giải thích'}. Bạn tạm thời rời sàn đấu.`}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNextStage('NEXT_QUESTION')}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white text-slate-950 font-black text-xs hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                <span>Câu Tiếp Theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* CỘT PHỤ (4/12): SƠ ĐỒ 100 VỊ TRÍ MINI-MAP */}
        <div className="lg:col-span-4">
          <GoldenBellSeatsGrid
            activeCount={activeCount}
            eliminatedCount={100 - activeCount}
            myStatus={myStatus}
          />
        </div>
      </div>
    </div>
  );
}
export default GoldenBellArenaView;
