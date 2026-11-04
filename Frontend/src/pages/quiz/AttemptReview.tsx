import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Zap,
  ArrowLeft,
  Target,
  RefreshCw,
  Clock,
  Loader2,
  Trophy,
  Bookmark,
  BookmarkCheck,
  Bot,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { attemptService } from '@/services/attempt.service';
import { MathRenderer } from '@/components/common/MathRenderer';
import { StudentFlexBragModal } from './components/StudentFlexBragModal';
import { SocratesTutorModal } from './components/SocratesTutorModal';
import { AcseMicroSliceView } from './components/AcseMicroSliceView';
import { errorVaultService } from '@/services/errorVault.service';

interface ResultItem {
  id: string;
  content: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  distractorMisconception?: string;
}

interface Insight {
  topic: string;
  strength: string;
}

interface AttemptResult {
  score: number;
  correctCount: number;
  totalCount: number;
  timeSpent: string;
  insights?: Insight[];
  items: ResultItem[];
}

export function AttemptReview() {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId: string }>();
  const navigate = useNavigate();

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showExplanationId, setShowExplanationId] = useState<string | null>(null);
  const [showBragModal, setShowBragModal] = useState(false);
  const [socratesItem, setSocratesItem] = useState<ResultItem | null>(null);
  const [savedVaultMap, setSavedVaultMap] = useState<Record<string, boolean>>({});

  const { data: realResult, isLoading } = useQuery({
    queryKey: ['attempt-answers', quizId, attemptId],
    queryFn: () => attemptService.getAttemptAnswers(quizId!, attemptId!),
    enabled: !!quizId && !!attemptId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
        <Loader2 size={40} className="text-indigo-600 animate-spin" />
        <h2 className="text-xl font-bold text-slate-700">Đang chấm điểm và phân tích nhận thức...</h2>
      </div>
    );
  }

  // MOCK DATA fallback
  const result: AttemptResult = realResult || {
    score: 85,
    correctCount: 8,
    totalCount: 10,
    timeSpent: '12:45',
    insights: [
      { topic: 'Phương trình & Hàm số', strength: 'Strong' },
      { topic: 'Xác suất Thống kê', strength: 'Needs Review' },
    ],
    items: Array.from({ length: 10 }).map((_, i) => ({
      id: `q${i + 1}`,
      content: `Nghiệm của phương trình $log_{3}(x - 1) = 1$ là:`,
      userAnswer: i % 3 === 0 ? 'A' : 'D',
      correctAnswer: 'D',
      isCorrect: i % 3 !== 0,
      explanation: '$log_{3}(x-1)=1 \\Rightarrow x-1=3^1=3 \\Rightarrow x=4$. Chọn D.',
      distractorMisconception:
        'Học sinh chọn A thường quên tính số mũ $3^1=3$ mà nhầm thành $3+1=4$ hoặc chuyển vế sai dấu.',
    })),
  };

  const handleAiAnalysis = async () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAiAnalysis(
        'AI nhận xét: Tư duy phân tích rất nhạy bén! Bạn xử lý các bài toán đại số với độ chính xác cao. Tuy nhiên cần chú ý điều kiện xác định trước khi biến đổi logarit để không bị sập bẫy nhiễu!'
      );
      setAnalyzing(false);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }, 1200);
  };

  const toggleExplanation = (qId: string) => {
    setShowExplanationId(showExplanationId === qId ? null : qId);
  };

  const handleSaveToVault = (item: ResultItem) => {
    errorVaultService.addItem({
      id: item.id,
      questionId: item.id,
      content: item.content,
      userAnswer: item.userAnswer,
      correctAnswer: item.correctAnswer,
      explanation: item.explanation || '',
      category: 'TOÁN HỌC & NHẬN THỨC',
      distractorMisconception: item.distractorMisconception,
    });
    setSavedVaultMap((prev) => ({ ...prev, [item.id]: true }));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20 selection:bg-amber-400 selection:text-slate-950">
      {/* Header */}
      <header className="bg-slate-950/90 border-b border-slate-800 sticky top-0 z-20 px-4 py-3 backdrop-blur-md">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white font-medium text-xs flex items-center gap-1 transition"
          >
            <ArrowLeft size={16} /> Dashboard
          </button>
          <h1 className="font-black text-sm text-amber-400 tracking-wide uppercase">
            Báo Cáo Phân Tích Nhận Thức Bài Thi
          </h1>
          <button
            onClick={() => setShowBragModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95"
          >
            <Flame size={14} className="fill-current" />
            <span>Khoe Thành Tích</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
        {/* Score Card với Flex Button */}
        <section className="bg-slate-950 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center gap-6 justify-between relative overflow-hidden">
          <div className="flex items-center gap-6">
            <div className="relative">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-800" />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={301.59}
                  strokeDashoffset={301.59 - (301.59 * result.score) / 100}
                  className="text-amber-400 transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-black text-white font-mono">{result.score}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Điểm</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-1 flex items-center gap-2">
                Hoàn thành bài thi! 🎉
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Bạn đã trả lời đúng <strong className="text-amber-400">{result.correctCount}/{result.totalCount}</strong> câu
              </p>
              <p className="text-slate-500 text-xs mt-1 flex items-center gap-1 font-mono">
                <Clock size={13} /> Thời gian hoàn thành: {result.timeSpent}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowBragModal(true)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:scale-102 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition active:scale-95"
            >
              <Trophy size={18} className="fill-current" />
              <span>KHOE THÀNH TÍCH & THÁCH ĐẤU SOLO</span>
            </button>
            <span className="text-[10px] text-center text-slate-500 font-mono">
              ⚡ Tải ảnh Card Cyber 3D khoe Story / Zalo / TikTok
            </span>
          </div>
        </section>

        {/* AI Action Panel */}
        <section className="bg-gradient-to-r from-indigo-950 to-violet-950 rounded-3xl p-6 shadow-xl border border-indigo-500/30 text-center">
          <h3 className="text-lg font-bold text-white mb-1.5 flex items-center justify-center gap-2">
            <Zap size={20} className="text-amber-400 fill-current" />
            Nhận diện Lỗ Hổng Nhận Thức Chuyên Sâu
          </h3>
          <p className="text-indigo-200 text-xs mb-4 max-w-lg mx-auto">
            Hạ tầng Epistemic AI phân tích các bẫy tư duy và đề xuất lộ trình khắc phục sai số tức thì.
          </p>

          {!aiAnalysis && (
            <button
              onClick={handleAiAnalysis}
              disabled={analyzing}
              className="bg-white hover:bg-slate-100 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-lg transition flex items-center justify-center mx-auto gap-2 text-xs disabled:opacity-80 active:scale-95"
            >
              {analyzing ? <RefreshCw size={16} className="animate-spin" /> : '🪄 Phân Tích Lỗ Hổng Bằng AI Socrates'}
            </button>
          )}

          {aiAnalysis && (
            <div className="bg-slate-900/80 border border-indigo-500/40 rounded-2xl p-4 text-left shadow-inner">
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{aiAnalysis}</p>
            </div>
          )}
        </section>

        {/* Chi tiết từng câu với Lát cắt ACSE, Đối thoại Socrates và Error Vault */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-base font-black text-white">Chi tiết từng câu hỏi & Bài học nhận thức</h3>
            <span className="text-xs text-slate-400 font-medium">Bấm "💡 Học từ sai lầm" để xem 4 lát cắt</span>
          </div>

          {result.items.map((item, idx) => {
            const isSaved = savedVaultMap[item.id] || errorVaultService.isSaved(item.id);
            return (
              <div
                key={item.id}
                className={`bg-slate-950 rounded-2xl p-4 sm:p-5 border-2 transition-all ${
                  item.isCorrect ? 'border-slate-800/80 shadow-sm' : 'border-rose-500/40 shadow-lg shadow-rose-950/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-1 text-xs font-black rounded-lg ${
                      item.isCorrect ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    Câu {idx + 1} • {item.isCorrect ? 'CHÍNH XÁC' : 'CHƯA ĐÚNG'}
                  </span>

                  <div className="flex items-center gap-2">
                    {!item.isCorrect && (
                      <>
                        <button
                          onClick={() => setSocratesItem(item)}
                          className="text-xs font-bold bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 px-3 py-1 rounded-lg transition flex items-center gap-1.5"
                          title="Trò chuyện biện chứng với Socrates AI"
                        >
                          <Bot size={14} className="text-violet-400" /> Hỏi Socrates AI
                        </button>
                        <button
                          onClick={() => handleSaveToVault(item)}
                          disabled={isSaved}
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition flex items-center gap-1.5 border ${
                            isSaved
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 cursor-default'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                          title="Lưu vào Sổ tay sai sót theo chu kỳ FSRS v5 (1-3-7 ngày)"
                        >
                          {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                          {isSaved ? 'Đã Vào Sổ Sai Sót' : '+ Sổ Tay FSRS'}
                        </button>
                        <button
                          onClick={() => toggleExplanation(item.id)}
                          className="text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-lg transition flex items-center gap-1"
                        >
                          <Target size={14} /> {showExplanationId === item.id ? 'Ẩn Lát Cắt' : '💡 Học Từ Sai Lầm'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-slate-200 text-sm font-semibold mb-3 leading-relaxed">
                  <MathRenderer content={item.content} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-800 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Lựa chọn của bạn:</span>
                    <span className={`font-bold ${item.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.userAnswer}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Đáp án chuẩn:</span>
                    <span className="font-bold text-amber-400">{item.correctAnswer}</span>
                  </div>
                </div>

                {/* Hiển thị Lát cắt nhận thức 4 bước ACSE */}
                {showExplanationId === item.id && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <AcseMicroSliceView
                      content={item.content}
                      userAnswer={item.userAnswer}
                      correctAnswer={item.correctAnswer}
                      explanation={item.explanation || ''}
                      distractorMisconception={item.distractorMisconception}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </main>

      {/* ── MODALS ── */}
      {showBragModal && (
        <StudentFlexBragModal
          score={result.score}
          totalCount={result.totalCount}
          timeSpent={result.timeSpent}
          examTitle={quizId ? `Bài Thi Khảo Thí #${quizId}` : 'Khảo Thí Nhận Thức Toàn Cầu'}
          onClose={() => setShowBragModal(false)}
        />
      )}

      {socratesItem && (
        <SocratesTutorModal
          questionContent={socratesItem.content}
          userAnswer={socratesItem.userAnswer}
          correctAnswer={socratesItem.correctAnswer}
          explanation={socratesItem.explanation || ''}
          onClose={() => setSocratesItem(null)}
        />
      )}
    </div>
  );
}
