import React, { useState, useEffect } from 'react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { Zap, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ArenaRoomState, ArenaQuestionItem } from '@/types/arena';
import { playArenaSfx } from '@/services/arena.service';
import { LightningInclineLadder } from './LightningInclineLadder';

interface Props {
  state: ArenaRoomState;
  onSubmitAnswer: (ans: string) => void;
  onAction: (actionType: string, payload: string) => void;
  onNextStage: (next: string) => void;
}

export function LightningArenaView({ state, onSubmitAnswer, onNextStage }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctAnswer: string; stepAwarded: number } | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12);

  const questions: ArenaQuestionItem[] = state.questions || (state as any).Questions || [];
  const qIndex = state.currentQuestionIndex ?? (state as any).CurrentQuestionIndex ?? 0;
  const currentQ: ArenaQuestionItem = questions[qIndex] || questions[0] || {
    id: 'q0', content: 'Đang tải câu hỏi...', questionType: 'DIRECT',
    options: [], answerRaw: '', points: 10, timeLimitSeconds: 12, category: 'CÂU ĐỐ MẸO NHANH',
  };

  const expectedAnswer = String(currentQ.answerRaw || (currentQ as any).AnswerRaw || '').trim();
  const qContent = currentQ.content || (currentQ as any).Content || '';
  const options: string[] = currentQ.options || (currentQ as any).Options || [];
  const qCategory = currentQ.category || (currentQ as any).Category || 'CÂU ĐỐ MẸO & LOGIC NHANH';

  useEffect(() => {
    setSelectedOpt(null);
    setTypedAnswer('');
    setFeedback(null);
    setTimeLeft(currentQ.timeLimitSeconds > 0 ? currentQ.timeLimitSeconds : 12);
  }, [qIndex, currentQ]);

  useEffect(() => {
    if (feedback !== null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSendAnswer('');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, feedback]);

  const handleSendAnswer = (answer: string) => {
    if (feedback !== null) return;
    setSelectedOpt(answer);

    let isCorrect = false;
    const cleanAns = answer.trim().toLowerCase();
    const cleanExpected = expectedAnswer.trim().toLowerCase();

    if (cleanAns && cleanExpected) {
      if (cleanAns === cleanExpected) isCorrect = true;
      else if (cleanAns.startsWith(cleanExpected + '.') || cleanAns.startsWith(cleanExpected + ')')) isCorrect = true;
      else if (options.length > 0) {
        const correctIdx = cleanExpected.charCodeAt(0) - 97;
        if (correctIdx >= 0 && correctIdx < options.length && options[correctIdx].toLowerCase() === cleanAns) {
          isCorrect = true;
        }
      }
    }

    if (isCorrect) {
      playArenaSfx('victory');
      const nextStep = Math.min(10, currentStep + 1);
      setCurrentStep(nextStep);
      setScore((s) => s + 100);
      setFeedback({ isCorrect: true, correctAnswer: expectedAnswer, stepAwarded: nextStep });
      if (nextStep === 10) {
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
      } else {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      }
    } else {
      playArenaSfx('drop');
      setCurrentStep(0);
      setFeedback({ isCorrect: false, correctAnswer: expectedAnswer, stepAwarded: 0 });
    }

    onSubmitAnswer(answer);
  };

  return (
    <div className="space-y-4">
      {/* ─── HEADER BAR ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-700 p-4 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-inner animate-pulse">
            ⚡
          </span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-200 block">
              CÂU SỐ {qIndex + 1}/{questions.length || 10} • NHANH NHƯ CHỚP
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white">Cỗ Máy Leo Dốc 10 Bậc Đứng</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-black/20 px-3 py-1.5 text-center backdrop-blur-sm">
            <span className="block text-[10px] text-pink-200 font-bold">Vị Trí Hiện Tại</span>
            <span className="font-black text-lg text-yellow-300">BẬC {currentStep}/10</span>
          </div>
          <div className="rounded-xl bg-white/20 px-3 py-1.5 text-center backdrop-blur-sm">
            <span className="block text-[10px] text-pink-200 font-bold">Điểm Số</span>
            <span className="font-black text-lg text-white">{score}đ</span>
          </div>
        </div>
      </div>

      {/* ─── 2 CỘT: CÂU HỎI TRỌNG TÂM (8/12) & THANG LEO DỐC (4/12) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CỘT CHÍNH (8/12): CÂU HỎI HERO & 4 LỰA CHỌN */}
        <div className="lg:col-span-8 flex flex-col justify-between rounded-3xl border-2 border-slate-800 bg-slate-900/95 p-5 sm:p-6 text-white shadow-2xl space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <span className="rounded-full bg-pink-500/20 px-3 py-1 text-xs font-bold text-pink-300 border border-pink-500/30">
                {qCategory}
              </span>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono font-black text-xs ${
                timeLeft <= 4 ? 'border-rose-500 bg-rose-500/20 text-rose-400 animate-pulse' : 'border-pink-400/40 bg-pink-500/10 text-pink-300'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            <div className="text-lg sm:text-2xl font-black text-slate-100 leading-relaxed py-2">
              <MathRenderer content={qContent} />
            </div>
          </div>

          {/* 4 Nút Lựa Chọn Trắc Nghiệm HOẶC Ô Gõ Đáp Án Nhanh */}
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
                  btnStyle = 'border-rose-400 bg-rose-500/20 text-white';
                }

                return (
                  <button
                    key={i}
                    disabled={feedback !== null}
                    onClick={() => handleSendAnswer(opt)}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 sm:p-4 text-left font-bold transition cursor-pointer active:scale-98 ${btnStyle} disabled:cursor-not-allowed`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 font-black text-sm text-pink-400 border border-slate-700">
                      {optLetter}
                    </span>
                    <div className="text-sm overflow-x-auto"><MathRenderer content={opt} /></div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-rose-500/40 bg-slate-950 p-4">
              <label className="text-xs font-bold text-pink-400 block mb-2">⚡ Đáp án mẹo nhanh:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={typedAnswer}
                  disabled={feedback !== null}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  placeholder="Gõ câu trả lời..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 font-bold text-white focus:outline-hidden focus:border-rose-400 text-center"
                  onKeyDown={(e) => e.key === 'Enter' && typedAnswer.trim() && handleSendAnswer(typedAnswer.trim())}
                />
                <button
                  onClick={() => typedAnswer.trim() && handleSendAnswer(typedAnswer.trim())}
                  disabled={feedback !== null}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 font-black text-white text-xs transition cursor-pointer"
                >
                  Chốt ➔
                </button>
              </div>
            </div>
          )}

          {/* BANNER XÁC NHẬN KẾT QUẢ ĐÚNG / SAI & TIẾN TRÌNH LEO DỐC */}
          {feedback && (
            <div className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 animate-fadeIn ${
              feedback.isCorrect ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200' : 'border-rose-500/50 bg-rose-500/15 text-rose-200'
            }`}>
              <div className="flex items-center gap-2.5">
                {feedback.isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <XCircle className="w-6 h-6 text-rose-400 shrink-0" />}
                <div>
                  <span className="font-black text-sm block">
                    {feedback.isCorrect ? `⚡ CHÍNH XÁC! LEO LÊN BẬC ${feedback.stepAwarded}/10 (+100đ)` : '💥 CHƯA CHÍNH XÁC! TỤT DỐC VỀ BẬC 0!'}
                  </span>
                  <span className="text-xs opacity-90">
                    {feedback.isCorrect
                      ? (feedback.stepAwarded === 10 ? '👑 XUẤT SẮC! BẠN ĐÃ CHINH PHỤC ĐỈNH CAO 10/10!' : 'Giữ vững chuỗi đúng liên tiếp để lên đỉnh!')
                      : `Đáp án đúng là: ${feedback.correctAnswer || 'Xem giải thích'}. Cố gắng làm lại chuỗi mới nhé!`}
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

        {/* CỘT PHỤ (4/12): THANG LEO DỐC 10 BẬC ĐỨNG */}
        <div className="lg:col-span-4">
          <LightningInclineLadder currentStep={currentStep} />
        </div>
      </div>
    </div>
  );
}
export default LightningArenaView;
