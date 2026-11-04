import React, { useState, useEffect } from 'react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { Bell, CheckCircle2, XCircle, ArrowRight, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ArenaRoomState, ArenaPlayer, ArenaQuestionItem } from '@/types/arena';
import { playArenaSfx } from '@/services/arena.service';
import { UniversityChallengeScoreboard } from './UniversityChallengeScoreboard';

interface Props {
  state: ArenaRoomState;
  onBuzzer: () => void;
  onSubmitAnswer: (ans: string) => void;
  onAction: (actionType: string, payload: string) => void;
  onNextStage: (next: string) => void;
}

export function UniversityChallengeView({ state, onBuzzer, onSubmitAnswer, onNextStage }: Props) {
  const [ans, setAns] = useState('');
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctAnswer: string; points: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);

  const questions: ArenaQuestionItem[] = state.questions || (state as any).Questions || [];
  const qIndex = state.currentQuestionIndex ?? (state as any).CurrentQuestionIndex ?? 0;
  const currentQ: ArenaQuestionItem = questions[qIndex] || questions[0] || {
    id: 'q0', content: 'Đang tải câu hỏi...', questionType: 'DIRECT',
    options: [], answerRaw: '', points: 10, timeLimitSeconds: 15, category: 'HỌC THUẬT ĐẠI HỌC',
  };

  const rawPlayers = state.players || (state as any).Players || {};
  const players: ArenaPlayer[] = Object.values(rawPlayers);
  const teamA = players.filter((p: any) => (p.teamName || p.TeamName) === 'Team A' || (p.seatNumber || p.SeatNumber || 1) % 2 === 1);
  const teamB = players.filter((p: any) => (p.teamName || p.TeamName) === 'Team B' || (p.seatNumber || p.SeatNumber || 2) % 2 === 0);

  const teamAScore = teamA.reduce((sum, p: any) => sum + (p.score ?? p.Score ?? 0), 0);
  const teamBScore = teamB.reduce((sum, p: any) => sum + (p.score ?? p.Score ?? 0), 0);
  const currentStage = state.currentStage || (state as any).CurrentStage || 'STARTER_QUESTION';

  const expectedAnswer = String(currentQ.answerRaw || (currentQ as any).AnswerRaw || '').trim();
  const qContent = currentQ.content || (currentQ as any).Content || '';
  const options: string[] = currentQ.options || (currentQ as any).Options || [];
  const qCategory = currentQ.category || (currentQ as any).Category || 'HỌC THUẬT QUỐC TẾ';

  useEffect(() => {
    setSelectedOpt(null);
    setAns('');
    setFeedback(null);
    setTimeLeft(currentQ.timeLimitSeconds > 0 ? currentQ.timeLimitSeconds : 15);
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

  const handleBuzz = () => {
    playArenaSfx('buzzer');
    onBuzzer();
  };

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
      setFeedback({ isCorrect: true, correctAnswer: expectedAnswer, points: 10 });
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.7 } });
    } else {
      playArenaSfx('drop');
      setFeedback({ isCorrect: false, correctAnswer: expectedAnswer, points: -5 });
    }

    onSubmitAnswer(answer);
  };

  return (
    <div className="space-y-4">
      <UniversityChallengeScoreboard
        teamAScore={teamAScore}
        teamBScore={teamBScore}
        currentStage={currentStage}
        players={players}
      />

      {/* HERO QUESTION CARD */}
      <div className="flex flex-col justify-between rounded-3xl border-2 border-slate-800 bg-slate-900/95 p-5 sm:p-6 text-white shadow-2xl space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-500/30">
              {qCategory}
            </span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono font-black text-xs ${
              timeLeft <= 5 ? 'border-rose-500 bg-rose-500/20 text-rose-400 animate-pulse' : 'border-blue-400/40 bg-blue-500/10 text-blue-300'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          <div className="text-lg sm:text-2xl font-black text-slate-100 leading-relaxed py-2">
            <MathRenderer content={qContent} />
          </div>
        </div>

        {/* OPTIONS HOẶC INPUT */}
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
                btnStyle = 'border-blue-400 bg-blue-500/20 text-white';
              }

              return (
                <button
                  key={i}
                  disabled={feedback !== null}
                  onClick={() => handleSendAnswer(opt)}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 sm:p-4 text-left font-bold transition cursor-pointer active:scale-98 ${btnStyle} disabled:cursor-not-allowed`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 font-black text-sm text-blue-400 border border-slate-700">
                    {optLetter}
                  </span>
                  <div className="text-sm overflow-x-auto"><MathRenderer content={opt} /></div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-blue-500/40 bg-slate-950 p-4">
            <label className="text-xs font-bold text-blue-400 block mb-2">🎓 Nhập câu trả lời học thuật:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ans}
                disabled={feedback !== null}
                onChange={(e) => setAns(e.target.value)}
                placeholder="Gõ đáp án..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 font-bold text-white focus:outline-hidden focus:border-blue-400 text-center"
                onKeyDown={(e) => e.key === 'Enter' && ans.trim() && handleSendAnswer(ans.trim())}
              />
              <button
                onClick={() => ans.trim() && handleSendAnswer(ans.trim())}
                disabled={feedback !== null}
                className="px-5 py-2.5 rounded-xl bg-blue-600 font-black text-white text-xs transition cursor-pointer"
              >
                Nộp ➔
              </button>
            </div>
          </div>
        )}

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 animate-fadeIn ${
            feedback.isCorrect ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200' : 'border-rose-500/50 bg-rose-500/15 text-rose-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {feedback.isCorrect ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <XCircle className="w-6 h-6 text-rose-400 shrink-0" />}
              <div>
                <span className="font-black text-sm block">
                  {feedback.isCorrect ? '🏛️ CHÍNH XÁC! (+10 ĐIỂM HỌC THUẬT)' : '⚠️ SAI! BỊ TRỪ -5 ĐIỂM PENALTY DO CƯỚP CHUÔNG SAI!'}
                </span>
                <span className="text-xs opacity-90">
                  {feedback.isCorrect ? 'Đội của bạn đã ghi điểm xuất sắc!' : `Đáp án đúng là: ${feedback.correctAnswer || 'Xem giải thích'}.`}
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

        {/* BUZZER STRIP */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <span className="text-xs text-slate-400">
            ⚠️ Chú ý: Bấm chuông cướp quyền mà trả lời sai sẽ bị phạt <strong>-5 điểm</strong> theo luật BBC!
          </span>
          <button
            onClick={handleBuzz}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-xs font-black uppercase text-white shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Cướp Chuông (Buzzer)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
export default UniversityChallengeView;
